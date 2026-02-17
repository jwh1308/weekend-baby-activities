import { describe, expect, it, vi } from 'vitest';
import { runVisitHistoryMigrationIfNeeded } from '@/lib/migrateVisitHistory';
import { createMigrationStatusService, createInitialMigrationStatus } from '@/lib/migrationStatus';
import { MigrationStatus } from '@/types/migration';

const USER_ID = 'user-1';

interface InMemoryStore {
  status: MigrationStatus | null;
}

const createStatusService = (store: InMemoryStore) => {
  return createMigrationStatusService({
    remoteClient: {
      async load() {
        return store.status;
      },
      async upsert(_userId, status) {
        store.status = status;
      },
    },
  });
};

describe('runVisitHistoryMigrationIfNeeded', () => {
  it('skips migration when already completed', async () => {
    const store: InMemoryStore = {
      status: {
        ...createInitialMigrationStatus(),
        state: 'completed',
        attempts: 1,
        completedAt: '2026-02-17T00:00:00.000Z',
      },
    };

    const result = await runVisitHistoryMigrationIfNeeded(USER_ID, {
      statusService: createStatusService(store),
      loadLocalRecords: () => [],
      remoteClient: {
        load: vi.fn(),
        upsert: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
    });

    expect(result.skipped).toBe(true);
    expect(result.status.state).toBe('completed');
  });

  it('migrates records and marks completed on success', async () => {
    const store: InMemoryStore = { status: null };
    const remoteClient = {
      load: vi.fn(),
      upsert: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    const result = await runVisitHistoryMigrationIfNeeded(USER_ID, {
      getNow: vi
        .fn()
        .mockReturnValueOnce('2026-02-17T00:00:00.000Z')
        .mockReturnValueOnce('2026-02-17T00:00:01.000Z'),
      loadLocalRecords: () => [
        { id: '1', activityId: 'custom', activityName: 'a', date: '2026-02-17', memo: 'm1' },
        {
          id: '2',
          activityId: 'custom',
          activityName: 'b',
          date: '2026-02-17',
          memo: 'm2',
          photo: 'data:image/jpeg;base64,abc',
        },
      ],
      photoClient: {
        isDataUrl: vi.fn().mockReturnValue(true),
        uploadVisitPhoto: vi.fn().mockResolvedValue('users/user-1/visit-photos/2.jpg'),
      },
      remoteClient,
      statusService: createStatusService(store),
    });

    expect(remoteClient.upsert).toHaveBeenCalledTimes(2);
    expect(result.migratedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.status.state).toBe('completed');
    expect(result.shouldNotify).toBe(false);
  });

  it('returns partial when some records fail', async () => {
    const store: InMemoryStore = { status: null };
    const remoteClient = {
      load: vi.fn(),
      upsert: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('upsert failed')),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    const result = await runVisitHistoryMigrationIfNeeded(USER_ID, {
      getNow: vi
        .fn()
        .mockReturnValueOnce('2026-02-17T00:00:00.000Z')
        .mockReturnValue('2026-02-17T00:00:01.000Z'),
      loadLocalRecords: () => [
        { id: '1', activityId: 'custom', activityName: 'a', date: '2026-02-17', memo: 'm1' },
        { id: '2', activityId: 'custom', activityName: 'b', date: '2026-02-17', memo: 'm2' },
      ],
      photoClient: {
        isDataUrl: vi.fn().mockReturnValue(false),
        uploadVisitPhoto: vi.fn(),
      },
      remoteClient,
      statusService: createStatusService(store),
    });

    expect(result.migratedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.status.state).toBe('partial');
  });

  it('notifies user after third failed attempt', async () => {
    const store: InMemoryStore = { status: null };
    const remoteClient = {
      load: vi.fn(),
      upsert: vi.fn().mockRejectedValue(new Error('upsert failed')),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    for (let i = 0; i < 2; i += 1) {
      await runVisitHistoryMigrationIfNeeded(USER_ID, {
        getNow: vi.fn().mockReturnValue('2026-02-17T00:00:00.000Z'),
        loadLocalRecords: () => [
          { id: '1', activityId: 'custom', activityName: 'a', date: '2026-02-17', memo: 'm1' },
        ],
        photoClient: {
          isDataUrl: vi.fn().mockReturnValue(false),
          uploadVisitPhoto: vi.fn(),
        },
        remoteClient,
        statusService: createStatusService(store),
      });
    }

    const third = await runVisitHistoryMigrationIfNeeded(USER_ID, {
      getNow: vi.fn().mockReturnValue('2026-02-17T00:00:00.000Z'),
      loadLocalRecords: () => [
        { id: '1', activityId: 'custom', activityName: 'a', date: '2026-02-17', memo: 'm1' },
      ],
      photoClient: {
        isDataUrl: vi.fn().mockReturnValue(false),
        uploadVisitPhoto: vi.fn(),
      },
      remoteClient,
      statusService: createStatusService(store),
    });

    expect(third.status.state).toBe('failed');
    expect(third.shouldNotify).toBe(true);
    expect(third.failedCount).toBe(1);
  });
});
