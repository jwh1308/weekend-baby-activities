import { describe, expect, it } from 'vitest';
import {
  createInitialMigrationStatus,
  createMigrationStatusService,
  MAX_MIGRATION_ATTEMPTS,
  MIGRATION_VERSION,
  normalizeMigrationStatus,
} from '@/lib/migrationStatus';
import { MigrationStatus } from '@/types/migration';

const USER_ID = 'user-1';

interface InMemoryStore {
  status: MigrationStatus | null;
}

const createRemoteClientMock = (store: InMemoryStore) => ({
  async load() {
    return store.status;
  },
  async upsert(_userId: string, status: MigrationStatus) {
    store.status = status;
  },
});

describe('migration status', () => {
  it('returns initial status when value is missing', () => {
    expect(createInitialMigrationStatus()).toEqual({
      version: MIGRATION_VERSION,
      state: 'idle',
      attempts: 0,
      lastAttemptAt: null,
      completedAt: null,
      failedItems: [],
    });
  });

  it('normalizes invalid status payload', () => {
    expect(normalizeMigrationStatus({ state: 'invalid', attempts: -1, failedItems: [{}] })).toEqual(
      createInitialMigrationStatus()
    );
  });

  it('transitions running -> partial -> failed by retries', async () => {
    const store: InMemoryStore = { status: null };
    const service = createMigrationStatusService({ remoteClient: createRemoteClientMock(store) });

    const started1 = await service.beginAttempt(USER_ID, '2026-02-17T00:00:00.000Z');
    expect(started1.state).toBe('running');
    expect(started1.attempts).toBe(1);

    const partial = await service.finalizeAttempt(
      USER_ID,
      [{ recordId: '1', reason: 'error', occurredAt: '2026-02-17T00:00:01.000Z' }],
      '2026-02-17T00:00:01.000Z'
    );
    expect(partial.state).toBe('partial');
    expect(service.shouldStopRetry(partial)).toBe(false);

    await service.beginAttempt(USER_ID, '2026-02-17T00:00:02.000Z');
    await service.finalizeAttempt(
      USER_ID,
      [{ recordId: '1', reason: 'error', occurredAt: '2026-02-17T00:00:03.000Z' }],
      '2026-02-17T00:00:03.000Z'
    );

    await service.beginAttempt(USER_ID, '2026-02-17T00:00:04.000Z');
    const failed = await service.finalizeAttempt(
      USER_ID,
      [{ recordId: '1', reason: 'error', occurredAt: '2026-02-17T00:00:05.000Z' }],
      '2026-02-17T00:00:05.000Z'
    );

    expect(failed.state).toBe('failed');
    expect(failed.attempts).toBe(MAX_MIGRATION_ATTEMPTS);
    expect(service.shouldStopRetry(failed)).toBe(true);
  });

  it('marks completed when no failed items remain', async () => {
    const store: InMemoryStore = { status: null };
    const service = createMigrationStatusService({ remoteClient: createRemoteClientMock(store) });

    await service.beginAttempt(USER_ID, '2026-02-17T00:00:00.000Z');
    const completed = await service.finalizeAttempt(USER_ID, [], '2026-02-17T00:00:01.000Z');

    expect(completed.state).toBe('completed');
    expect(completed.completedAt).toBe('2026-02-17T00:00:01.000Z');
    expect(completed.failedItems).toEqual([]);
  });
});
