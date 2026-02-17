import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { VisitRecordRemote, VisitRecordSource } from '@/types/history';

export type UpsertVisitRecordInput = Omit<VisitRecordRemote, 'createdAt' | 'updatedAt'>;

const db = getFirestore(app);

const visitRecordCollectionPath = (userId: string) => ['users', userId, 'visitRecords'] as const;

const toISOString = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string' && value) {
    return value;
  }

  return new Date(0).toISOString();
};

const toSource = (value: unknown): VisitRecordSource => {
  return value === 'migrated' ? 'migrated' : 'app';
};

export const createVisitHistoryRemoteClient = () => {
  const getCollection = (userId: string) => collection(db, ...visitRecordCollectionPath(userId));
  const getDocRef = (userId: string, recordId: string) => doc(db, ...visitRecordCollectionPath(userId), recordId);

  return {
    async load(userId: string): Promise<VisitRecordRemote[]> {
      const snapshot = await getDocs(query(getCollection(userId), orderBy('createdAt', 'desc')));
      return snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          activityId: typeof data.activityId === 'string' ? data.activityId : '',
          activityName: typeof data.activityName === 'string' ? data.activityName : '',
          date: typeof data.date === 'string' ? data.date : '',
          memo: typeof data.memo === 'string' ? data.memo : '',
          photoPath: typeof data.photoPath === 'string' ? data.photoPath : null,
          source: toSource(data.source),
          createdAt: toISOString(data.createdAt),
          updatedAt: toISOString(data.updatedAt),
        };
      });
    },

    async upsert(userId: string, record: UpsertVisitRecordInput): Promise<void> {
      await setDoc(
        getDocRef(userId, record.id),
        {
          activityId: record.activityId,
          activityName: record.activityName,
          date: record.date,
          memo: record.memo,
          photoPath: record.photoPath ?? null,
          source: record.source,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },

    async remove(userId: string, recordId: string): Promise<void> {
      await deleteDoc(getDocRef(userId, recordId));
    },

    async clear(userId: string): Promise<void> {
      const snapshot = await getDocs(getCollection(userId));
      const batch = writeBatch(db);

      snapshot.docs.forEach((item) => {
        batch.delete(item.ref);
      });

      await batch.commit();
    },
  };
};

export type VisitHistoryRemoteClient = ReturnType<typeof createVisitHistoryRemoteClient>;
