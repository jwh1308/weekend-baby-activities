import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalVisitHistoryRepository } from '@/lib/repositories/localVisitHistoryRepository';
import { VisitRecord } from '@/types/history';

const USER_ID = 'user-1';

const makeRecord = (id: string): VisitRecord => ({
  id,
  activityId: 'custom',
  activityName: `activity-${id}`,
  date: '2026-02-17',
  memo: `memo-${id}`,
});

describe('createLocalVisitHistoryRepository', () => {
  const repository = createLocalVisitHistoryRepository();

  beforeEach(() => {
    localStorage.clear();
  });

  it('appends and loads records in newest-first order', async () => {
    await repository.append(USER_ID, makeRecord('1'));
    await repository.append(USER_ID, makeRecord('2'));

    const loaded = await repository.load(USER_ID);
    expect(loaded.map((item) => item.id)).toEqual(['2', '1']);
  });

  it('removes a specific record', async () => {
    await repository.saveAll(USER_ID, [makeRecord('1'), makeRecord('2')]);

    const updated = await repository.remove(USER_ID, '1');
    expect(updated.map((item) => item.id)).toEqual(['2']);
  });

  it('clears all records', async () => {
    await repository.saveAll(USER_ID, [makeRecord('1')]);
    await repository.clear(USER_ID);

    await expect(repository.load(USER_ID)).resolves.toEqual([]);
  });
});
