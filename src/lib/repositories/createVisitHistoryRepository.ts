import { createHybridVisitHistoryRepository } from '@/lib/repositories/hybridVisitHistoryRepository';
import { createLocalVisitHistoryRepository } from '@/lib/repositories/localVisitHistoryRepository';
import { createRemoteVisitHistoryRepository } from '@/lib/repositories/remoteVisitHistoryRepository';
import { VisitHistoryRepository } from '@/lib/repositories/types';
import { getStorageMode } from '@/lib/storageMode';
import { StorageMode } from '@/types/migration';

interface RepositoryFactoryDeps {
  localRepository?: VisitHistoryRepository;
  mode?: StorageMode;
  remoteRepository?: VisitHistoryRepository;
}

export const createVisitHistoryRepository = (deps: RepositoryFactoryDeps = {}): VisitHistoryRepository => {
  const mode = deps.mode ?? getStorageMode();
  const localRepository = deps.localRepository ?? createLocalVisitHistoryRepository();

  if (mode === 'local') {
    return localRepository;
  }

  const remoteRepository = deps.remoteRepository ?? createRemoteVisitHistoryRepository();
  if (mode === 'remote') {
    return remoteRepository;
  }

  return createHybridVisitHistoryRepository({ localRepository, remoteRepository });
};
