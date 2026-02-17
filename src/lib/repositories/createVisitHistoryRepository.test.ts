import { describe, expect, it, vi } from 'vitest';
import { createVisitHistoryRepository } from '@/lib/repositories/createVisitHistoryRepository';
import { VisitHistoryRepository } from '@/lib/repositories/types';

const createRepositoryMock = (): VisitHistoryRepository => ({
  load: vi.fn(),
  saveAll: vi.fn(),
  append: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
});

describe('createVisitHistoryRepository', () => {
  it('returns local repository for local mode', () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();

    const repository = createVisitHistoryRepository({
      mode: 'local',
      localRepository: local,
      remoteRepository: remote,
    });

    expect(repository).toBe(local);
  });

  it('returns remote repository for remote mode', () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();

    const repository = createVisitHistoryRepository({
      mode: 'remote',
      localRepository: local,
      remoteRepository: remote,
    });

    expect(repository).toBe(remote);
  });

  it('returns hybrid repository for hybrid mode', async () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();
    (local.append as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: '1' }]);
    (remote.append as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: '1' }]);

    const repository = createVisitHistoryRepository({
      mode: 'hybrid',
      localRepository: local,
      remoteRepository: remote,
    });

    await repository.append('u1', {
      id: '1',
      activityId: 'custom',
      activityName: 'name',
      date: '2026-02-17',
      memo: 'memo',
    });

    expect(local.append).toHaveBeenCalled();
    expect(remote.append).toHaveBeenCalled();
  });
});
