import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { MigrationFailureItem, MigrationStatus } from '@/types/migration';

export const MIGRATION_VERSION = 'visitHistoryV1' as const;
export const MAX_MIGRATION_ATTEMPTS = 3;

const db = getFirestore(app);

const migrationStatusDocPath = (userId: string) =>
  ['users', userId, 'migrationStatus', MIGRATION_VERSION] as const;

const normalizeFailureItem = (value: unknown): MigrationFailureItem | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<MigrationFailureItem>;
  if (
    typeof candidate.recordId !== 'string' ||
    typeof candidate.reason !== 'string' ||
    typeof candidate.occurredAt !== 'string'
  ) {
    return null;
  }

  return {
    recordId: candidate.recordId,
    reason: candidate.reason,
    occurredAt: candidate.occurredAt,
  };
};

export const createInitialMigrationStatus = (): MigrationStatus => {
  return {
    version: MIGRATION_VERSION,
    state: 'idle',
    attempts: 0,
    lastAttemptAt: null,
    completedAt: null,
    failedItems: [],
  };
};

export const normalizeMigrationStatus = (value: unknown): MigrationStatus => {
  if (!value || typeof value !== 'object') {
    return createInitialMigrationStatus();
  }

  const candidate = value as Partial<MigrationStatus>;
  const state = candidate.state;
  const allowedStates = new Set(['idle', 'running', 'partial', 'completed', 'failed']);
  const failedItems = Array.isArray(candidate.failedItems)
    ? candidate.failedItems.map((item) => normalizeFailureItem(item)).filter((item): item is MigrationFailureItem => item !== null)
    : [];

  return {
    version: MIGRATION_VERSION,
    state: typeof state === 'string' && allowedStates.has(state) ? state : 'idle',
    attempts: typeof candidate.attempts === 'number' && candidate.attempts > 0 ? Math.floor(candidate.attempts) : 0,
    lastAttemptAt: typeof candidate.lastAttemptAt === 'string' ? candidate.lastAttemptAt : null,
    completedAt: typeof candidate.completedAt === 'string' ? candidate.completedAt : null,
    failedItems,
  };
};

interface MigrationStatusRemoteClient {
  load(userId: string): Promise<MigrationStatus | null>;
  upsert(userId: string, status: MigrationStatus): Promise<void>;
}

const createMigrationStatusRemoteClient = (): MigrationStatusRemoteClient => {
  const getDocRef = (userId: string) => doc(db, ...migrationStatusDocPath(userId));

  return {
    async load(userId: string): Promise<MigrationStatus | null> {
      const snapshot = await getDoc(getDocRef(userId));
      if (!snapshot.exists()) {
        return null;
      }

      return normalizeMigrationStatus(snapshot.data());
    },

    async upsert(userId: string, status: MigrationStatus): Promise<void> {
      await setDoc(getDocRef(userId), status, { merge: true });
    },
  };
};

export interface MigrationStatusService {
  beginAttempt(userId: string, now: string): Promise<MigrationStatus>;
  finalizeAttempt(userId: string, failedItems: MigrationFailureItem[], now: string): Promise<MigrationStatus>;
  get(userId: string): Promise<MigrationStatus>;
  shouldStopRetry(status: MigrationStatus): boolean;
}

interface MigrationStatusServiceDeps {
  remoteClient?: MigrationStatusRemoteClient;
}

export const createMigrationStatusService = (
  deps: MigrationStatusServiceDeps = {}
): MigrationStatusService => {
  const remoteClient = deps.remoteClient ?? createMigrationStatusRemoteClient();

  return {
    async get(userId: string): Promise<MigrationStatus> {
      const loaded = await remoteClient.load(userId);
      return loaded ?? createInitialMigrationStatus();
    },

    async beginAttempt(userId: string, now: string): Promise<MigrationStatus> {
      const current = await this.get(userId);
      const next: MigrationStatus = {
        ...current,
        state: 'running',
        attempts: current.attempts + 1,
        lastAttemptAt: now,
      };

      await remoteClient.upsert(userId, next);
      return next;
    },

    async finalizeAttempt(userId: string, failedItems: MigrationFailureItem[], now: string): Promise<MigrationStatus> {
      const current = await this.get(userId);

      const nextState =
        failedItems.length === 0 ? 'completed' : current.attempts >= MAX_MIGRATION_ATTEMPTS ? 'failed' : 'partial';

      const next: MigrationStatus = {
        ...current,
        state: nextState,
        completedAt: nextState === 'completed' ? now : null,
        failedItems,
      };

      await remoteClient.upsert(userId, next);
      return next;
    },

    shouldStopRetry(status: MigrationStatus): boolean {
      return status.state === 'failed' && status.attempts >= MAX_MIGRATION_ATTEMPTS;
    },
  };
};
