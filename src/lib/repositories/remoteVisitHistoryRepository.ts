import { deleteVisitPhoto, isDataUrl, uploadVisitPhoto } from '@/lib/firebaseVisitPhoto';
import {
  createVisitHistoryRemoteClient,
  UpsertVisitRecordInput,
  VisitHistoryRemoteClient,
} from '@/lib/firebaseVisitHistory';
import { VisitHistoryRepository } from '@/lib/repositories/types';
import { VisitRecord } from '@/types/history';

interface PhotoClient {
  deleteVisitPhoto(photoPath: string | null | undefined): Promise<void>;
  isDataUrl(value: string): boolean;
  uploadVisitPhoto(userId: string, recordId: string, dataUrl: string): Promise<string>;
}

interface RemoteRepositoryDeps {
  photoClient?: PhotoClient;
  remoteClient?: VisitHistoryRemoteClient;
}

const toLocalRecord = (record: UpsertVisitRecordInput): VisitRecord => {
  return {
    id: record.id,
    activityId: record.activityId,
    activityName: record.activityName,
    date: record.date,
    memo: record.memo,
    photo: record.photoPath || undefined,
  };
};

const toUpsertInput = (record: VisitRecord, photoPath: string | null): UpsertVisitRecordInput => {
  return {
    id: record.id,
    activityId: record.activityId,
    activityName: record.activityName,
    date: record.date,
    memo: record.memo,
    photoPath,
    source: 'app',
  };
};

export const createRemoteVisitHistoryRepository = (deps: RemoteRepositoryDeps = {}): VisitHistoryRepository => {
  const remoteClient = deps.remoteClient ?? createVisitHistoryRemoteClient();
  const photoClient = deps.photoClient ?? {
    deleteVisitPhoto,
    isDataUrl,
    uploadVisitPhoto,
  };

  const resolvePhotoPath = async (userId: string, record: VisitRecord): Promise<string | null> => {
    if (!record.photo) {
      return null;
    }

    if (photoClient.isDataUrl(record.photo)) {
      return photoClient.uploadVisitPhoto(userId, record.id, record.photo);
    }

    return record.photo;
  };

  const loadRecords = async (userId: string): Promise<VisitRecord[]> => {
    const records = await remoteClient.load(userId);
    return records.map((record) => toLocalRecord(record));
  };

  return {
    async load(userId: string): Promise<VisitRecord[]> {
      return loadRecords(userId);
    },

    async saveAll(userId: string, records: VisitRecord[]): Promise<VisitRecord[]> {
      await remoteClient.clear(userId);

      for (const record of records) {
        const photoPath = await resolvePhotoPath(userId, record);
        await remoteClient.upsert(userId, toUpsertInput(record, photoPath));
      }

      return loadRecords(userId);
    },

    async append(userId: string, record: VisitRecord): Promise<VisitRecord[]> {
      const photoPath = await resolvePhotoPath(userId, record);
      await remoteClient.upsert(userId, toUpsertInput(record, photoPath));
      return loadRecords(userId);
    },

    async remove(userId: string, recordId: string): Promise<VisitRecord[]> {
      const existing = await remoteClient.load(userId);
      const target = existing.find((item) => item.id === recordId);

      await remoteClient.remove(userId, recordId);
      await photoClient.deleteVisitPhoto(target?.photoPath);

      return loadRecords(userId);
    },

    async clear(userId: string): Promise<void> {
      const existing = await remoteClient.load(userId);
      await Promise.allSettled(existing.map((item) => photoClient.deleteVisitPhoto(item.photoPath)));
      await remoteClient.clear(userId);
    },
  };
};
