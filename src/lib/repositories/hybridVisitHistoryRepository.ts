import { createLocalVisitHistoryRepository } from '@/lib/repositories/localVisitHistoryRepository';
import { createRemoteVisitHistoryRepository } from '@/lib/repositories/remoteVisitHistoryRepository';
import { VisitHistoryRepository } from '@/lib/repositories/types';
import { VisitRecord } from '@/types/history';

interface HybridRepositoryDeps {
  localRepository?: VisitHistoryRepository;
  remoteRepository?: VisitHistoryRepository;
}

export const createHybridVisitHistoryRepository = (deps: HybridRepositoryDeps = {}): VisitHistoryRepository => {
  const localRepository = deps.localRepository ?? createLocalVisitHistoryRepository();
  const remoteRepository = deps.remoteRepository ?? createRemoteVisitHistoryRepository();

  const runRemoteSync = async (operation: () => Promise<void>): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      console.error('Hybrid repository remote sync failed:', error);
    }
  };

  return {
    async load(userId: string): Promise<VisitRecord[]> {
      return localRepository.load(userId);
    },

    async saveAll(userId: string, records: VisitRecord[]): Promise<VisitRecord[]> {
      const localResult = await localRepository.saveAll(userId, records);
      await runRemoteSync(async () => {
        await remoteRepository.saveAll(userId, localResult);
      });
      return localResult;
    },

    async append(userId: string, record: VisitRecord): Promise<VisitRecord[]> {
      const localResult = await localRepository.append(userId, record);
      await runRemoteSync(async () => {
        await remoteRepository.append(userId, record);
      });
      return localResult;
    },

    async remove(userId: string, recordId: string): Promise<VisitRecord[]> {
      const localResult = await localRepository.remove(userId, recordId);
      await runRemoteSync(async () => {
        await remoteRepository.remove(userId, recordId);
      });
      return localResult;
    },

    async clear(userId: string): Promise<void> {
      await localRepository.clear(userId);
      await runRemoteSync(async () => {
        await remoteRepository.clear(userId);
      });
    },
  };
};
