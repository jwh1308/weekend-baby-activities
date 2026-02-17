import { clearVisitHistory, loadVisitHistory, saveVisitHistory } from '@/lib/clientStorage';
import { VisitHistoryRepository } from '@/lib/repositories/types';
import { VisitRecord } from '@/types/history';

export const createLocalVisitHistoryRepository = (): VisitHistoryRepository => {
  return {
    async load(): Promise<VisitRecord[]> {
      return loadVisitHistory();
    },

    async saveAll(_userId: string, records: VisitRecord[]): Promise<VisitRecord[]> {
      return saveVisitHistory(records);
    },

    async append(_userId: string, record: VisitRecord): Promise<VisitRecord[]> {
      const current = loadVisitHistory();
      return saveVisitHistory([record, ...current]);
    },

    async remove(_userId: string, recordId: string): Promise<VisitRecord[]> {
      const current = loadVisitHistory();
      return saveVisitHistory(current.filter((item) => item.id !== recordId));
    },

    async clear(): Promise<void> {
      clearVisitHistory();
    },
  };
};
