export type StorageMode = 'local' | 'hybrid' | 'remote';

export type MigrationState = 'idle' | 'running' | 'partial' | 'completed' | 'failed';

export interface MigrationFailureItem {
  recordId: string;
  reason: string;
  occurredAt: string;
}

export interface MigrationStatus {
  version: 'visitHistoryV1';
  state: MigrationState;
  attempts: number;
  lastAttemptAt: string | null;
  completedAt: string | null;
  failedItems: MigrationFailureItem[];
}
