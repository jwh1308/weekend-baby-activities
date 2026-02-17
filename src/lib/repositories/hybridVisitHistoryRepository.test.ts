import { describe, expect, it, vi } from 'vitest';
import { createHybridVisitHistoryRepository } from '@/lib/repositories/hybridVisitHistoryRepository';
import { VisitHistoryRepository } from '@/lib/repositories/types';
import { VisitRecord } from '@/types/history';

const USER_ID = 'user-1';
const RECORD: VisitRecord = {
  id: '1',
  activityId: 'custom',
  activityName: 'test',
  date: '2026-02-17',
  memo: 'memo',
};

const createRepositoryMock = (): VisitHistoryRepository => ({
  load: vi.fn().mockResolvedValue([RECORD]),
  saveAll: vi.fn().mockResolvedValue([RECORD]),
  append: vi.fn().mockResolvedValue([RECORD]),
  remove: vi.fn().mockResolvedValue([]),
  clear: vi.fn().mockResolvedValue(undefined),
});

describe('createHybridVisitHistoryRepository', () => {
  it('loads from local repository', async () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();
    const repository = createHybridVisitHistoryRepository({ localRepository: local, remoteRepository: remote });

    const loaded = await repository.load(USER_ID);

    expect(local.load).toHaveBeenCalledWith(USER_ID);
    expect(remote.load).not.toHaveBeenCalled();
    expect(loaded).toEqual([RECORD]);
  });

  it('writes to local first and then syncs remote', async () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();
    const repository = createHybridVisitHistoryRepository({ localRepository: local, remoteRepository: remote });

    const result = await repository.append(USER_ID, RECORD);

    expect(local.append).toHaveBeenCalledWith(USER_ID, RECORD);
    expect(remote.append).toHaveBeenCalledWith(USER_ID, RECORD);
    expect(result).toEqual([RECORD]);
  });

  it('does not fail local write when remote sync fails', async () => {
    const local = createRepositoryMock();
    const remote = createRepositoryMock();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (remote.append as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('remote failed'));

    const repository = createHybridVisitHistoryRepository({ localRepository: local, remoteRepository: remote });
    const result = await repository.append(USER_ID, RECORD);

    expect(result).toEqual([RECORD]);
    expect(local.append).toHaveBeenCalledWith(USER_ID, RECORD);
  });
});
