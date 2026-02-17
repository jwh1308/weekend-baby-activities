import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearBabyInfo,
  clearVisitHistory,
  loadBabyInfo,
  loadVisitHistory,
  saveBabyInfo,
  saveVisitHistory,
} from '@/lib/clientStorage';
import type { VisitRecord } from '@/types/history';

describe('clientStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads baby info', () => {
    saveBabyInfo({ name: '튼튼이', birthday: '2024-01-01', region: '분당구' });
    expect(loadBabyInfo()).toEqual({ name: '튼튼이', birthday: '2024-01-01', region: '분당구' });

    clearBabyInfo();
    expect(loadBabyInfo()).toBeNull();
  });

  it('sanitizes invalid history records from storage', () => {
    localStorage.setItem(
      'visitHistory',
      JSON.stringify([
        { id: '1', activityId: 'a', activityName: '공원', date: '2026-02-17', memo: '좋았어요', photo: 'data:image/jpeg;base64,abc' },
        { id: '2', activityName: '누락', memo: 123 },
        'invalid-record',
      ])
    );

    expect(loadVisitHistory()).toEqual([
      {
        id: '1',
        activityId: 'a',
        activityName: '공원',
        date: '2026-02-17',
        memo: '좋았어요',
        photo: 'data:image/jpeg;base64,abc',
      },
    ]);
  });

  it('falls back by stripping photos when setItem fails once', () => {
    const records: VisitRecord[] = [
      {
        id: '1',
        activityId: 'custom',
        activityName: '키즈카페',
        date: '2026-02-17',
        memo: '메모',
        photo: 'data:image/jpeg;base64,abc',
      },
    ];

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy
      .mockImplementationOnce(() => {
        throw new Error('quota exceeded');
      })
      .mockImplementation(() => undefined);

    const saved = saveVisitHistory(records);
    expect(saved[0]?.photo).toBeUndefined();
    expect(loadVisitHistory()[0]?.photo).toBeUndefined();
  });

  it('does not throw when setItem always fails', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() =>
      saveVisitHistory([
        {
          id: '1',
          activityId: 'custom',
          activityName: '실내놀이터',
          date: '2026-02-17',
          memo: '테스트',
          photo: 'data:image/jpeg;base64,abc',
        },
      ])
    ).not.toThrow();

    setItemSpy.mockRestore();
  });

  it('clears visit history', () => {
    saveVisitHistory([
      {
        id: '1',
        activityId: 'custom',
        activityName: '박물관',
        date: '2026-02-17',
        memo: '좋았음',
      },
    ]);
    expect(loadVisitHistory().length).toBe(1);

    clearVisitHistory();
    expect(loadVisitHistory()).toEqual([]);
  });
});
