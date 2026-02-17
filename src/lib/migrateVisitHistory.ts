import { createVisitHistoryRemoteClient, UpsertVisitRecordInput, VisitHistoryRemoteClient } from '@/lib/firebaseVisitHistory';
import { isDataUrl, uploadVisitPhoto } from '@/lib/firebaseVisitPhoto';
import { loadVisitHistory } from '@/lib/clientStorage';
import {
  createMigrationStatusService,
  MigrationStatusService,
} from '@/lib/migrationStatus';
import { MigrationFailureItem, MigrationStatus } from '@/types/migration';
import { VisitRecord } from '@/types/history';

interface PhotoClient {
  isDataUrl(value: string): boolean;
  uploadVisitPhoto(userId: string, recordId: string, dataUrl: string): Promise<string>;
}

interface MigrateVisitHistoryDeps {
  getNow?: () => string;
  loadLocalRecords?: () => VisitRecord[];
  photoClient?: PhotoClient;
  remoteClient?: VisitHistoryRemoteClient;
  statusService?: MigrationStatusService;
}

export interface MigrationRunResult {
  failedCount: number;
  migratedCount: number;
  shouldNotify: boolean;
  skipped: boolean;
  status: MigrationStatus;
}

const toUpsertInput = (record: VisitRecord, photoPath: string | null): UpsertVisitRecordInput => {
  return {
    id: record.id,
    activityId: record.activityId,
    activityName: record.activityName,
    date: record.date,
    memo: record.memo,
    photoPath,
    source: 'migrated',
  };
};

export const runVisitHistoryMigrationIfNeeded = async (
  userId: string,
  deps: MigrateVisitHistoryDeps = {}
): Promise<MigrationRunResult> => {
  const statusService = deps.statusService ?? createMigrationStatusService();
  const remoteClient = deps.remoteClient ?? createVisitHistoryRemoteClient();
  const photoClient = deps.photoClient ?? {
    isDataUrl,
    uploadVisitPhoto,
  };
  const loadLocalRecords = deps.loadLocalRecords ?? loadVisitHistory;
  const getNow = deps.getNow ?? (() => new Date().toISOString());

  const existingStatus = await statusService.get(userId);
  if (existingStatus.state === 'completed') {
    return {
      failedCount: 0,
      migratedCount: 0,
      shouldNotify: false,
      skipped: true,
      status: existingStatus,
    };
  }

  if (statusService.shouldStopRetry(existingStatus)) {
    return {
      failedCount: existingStatus.failedItems.length,
      migratedCount: 0,
      shouldNotify: true,
      skipped: true,
      status: existingStatus,
    };
  }

  const startedAt = getNow();
  const runningStatus = await statusService.beginAttempt(userId, startedAt);
  const localRecords = loadLocalRecords();

  let migratedCount = 0;
  const failedItems: MigrationFailureItem[] = [];

  for (const record of localRecords) {
    try {
      let photoPath: string | null = null;

      if (record.photo && photoClient.isDataUrl(record.photo)) {
        photoPath = await photoClient.uploadVisitPhoto(userId, record.id, record.photo);
      }

      await remoteClient.upsert(userId, toUpsertInput(record, photoPath));
      migratedCount += 1;
    } catch (error) {
      failedItems.push({
        recordId: record.id,
        reason: error instanceof Error ? error.message : 'unknown migration error',
        occurredAt: getNow(),
      });
    }
  }

  const finalizedStatus = await statusService.finalizeAttempt(userId, failedItems, getNow());
  return {
    failedCount: failedItems.length,
    migratedCount,
    shouldNotify:
      finalizedStatus.state === 'failed' &&
      finalizedStatus.attempts >= runningStatus.attempts,
    skipped: false,
    status: finalizedStatus,
  };
};
