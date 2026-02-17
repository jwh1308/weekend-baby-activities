import { describe, expect, it, vi } from 'vitest';
import { createRemoteVisitHistoryRepository } from '@/lib/repositories/remoteVisitHistoryRepository';
import { VisitHistoryRemoteClient } from '@/lib/firebaseVisitHistory';
import { VisitRecordRemote } from '@/types/history';

const USER_ID = 'user-1';

const REMOTE_RECORD: VisitRecordRemote = {
  id: '1',
  activityId: 'custom',
  activityName: 'test',
  date: '2026-02-17',
  memo: 'memo',
  photoPath: null,
  source: 'app',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createRemoteClientMock = (): VisitHistoryRemoteClient => ({
  load: vi.fn().mockResolvedValue([REMOTE_RECORD]),
  upsert: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
});

describe('createRemoteVisitHistoryRepository', () => {
  it('maps remote records to local records on load', async () => {
    const remoteClient = createRemoteClientMock();
    const repository = createRemoteVisitHistoryRepository({ remoteClient });

    const result = await repository.load(USER_ID);
    expect(result).toEqual([
      {
        id: '1',
        activityId: 'custom',
        activityName: 'test',
        date: '2026-02-17',
        memo: 'memo',
      },
    ]);
  });

  it('uploads data url photo before append upsert', async () => {
    const remoteClient = createRemoteClientMock();
    const photoClient = {
      uploadVisitPhoto: vi.fn().mockResolvedValue('users/user-1/visit-photos/1.jpg'),
      deleteVisitPhoto: vi.fn().mockResolvedValue(undefined),
      isDataUrl: vi.fn().mockReturnValue(true),
    };
    const repository = createRemoteVisitHistoryRepository({ remoteClient, photoClient });

    await repository.append(USER_ID, {
      id: '1',
      activityId: 'custom',
      activityName: 'test',
      date: '2026-02-17',
      memo: 'memo',
      photo: 'data:image/jpeg;base64,abc',
    });

    expect(photoClient.uploadVisitPhoto).toHaveBeenCalledWith(USER_ID, '1', 'data:image/jpeg;base64,abc');
    expect(remoteClient.upsert).toHaveBeenCalled();
  });

  it('deletes photo path when removing record', async () => {
    const remoteClient = createRemoteClientMock();
    (remoteClient.load as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { ...REMOTE_RECORD, photoPath: 'users/user-1/visit-photos/1.jpg' },
    ]);
    const photoClient = {
      uploadVisitPhoto: vi.fn().mockResolvedValue('users/user-1/visit-photos/1.jpg'),
      deleteVisitPhoto: vi.fn().mockResolvedValue(undefined),
      isDataUrl: vi.fn().mockReturnValue(false),
    };
    const repository = createRemoteVisitHistoryRepository({ remoteClient, photoClient });

    await repository.remove(USER_ID, '1');

    expect(remoteClient.remove).toHaveBeenCalledWith(USER_ID, '1');
    expect(photoClient.deleteVisitPhoto).toHaveBeenCalledWith('users/user-1/visit-photos/1.jpg');
  });
});
