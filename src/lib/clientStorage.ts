import { BabyInfo } from '@/types/baby';
import { VisitRecord } from '@/types/history';

const BABY_INFO_KEY = 'babyInfo';
const VISIT_HISTORY_KEY = 'visitHistory';
const MAX_HISTORY_ITEMS = 100;

const canUseStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

const safeSetItem = (key: string, value: string): boolean => {
  if (!canUseStorage()) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemoveItem = (key: string): void => {
  if (!canUseStorage()) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isRecordObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object';
};

const normalizeVisitRecord = (value: unknown): VisitRecord | null => {
  if (!isRecordObject(value)) {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id : '';
  const activityId = typeof value.activityId === 'string' ? value.activityId : '';
  const activityName = typeof value.activityName === 'string' ? value.activityName : '';
  const date = typeof value.date === 'string' ? value.date : '';

  if (!id || !activityId || !activityName || !date) {
    return null;
  }

  return {
    id,
    activityId,
    activityName,
    date,
    memo: typeof value.memo === 'string' ? value.memo.slice(0, 1000) : '',
    photo: typeof value.photo === 'string' ? value.photo : undefined,
  };
};

const sanitizeHistory = (records: unknown[]): VisitRecord[] => {
  return records
    .map((record) => normalizeVisitRecord(record))
    .filter((record): record is VisitRecord => record !== null)
    .slice(0, MAX_HISTORY_ITEMS);
};

const stripPhotoFromHistory = (records: VisitRecord[]): VisitRecord[] => {
  return records.map((record) => ({ ...record, photo: undefined }));
};

export const loadBabyInfo = (): BabyInfo | null => {
  if (!canUseStorage()) {
    return null;
  }

  const parsed = safeParse<BabyInfo | null>(localStorage.getItem(BABY_INFO_KEY), null);

  if (!parsed || !parsed.name || !parsed.birthday) {
    return null;
  }

  return parsed;
};

export const saveBabyInfo = (info: BabyInfo): void => {
  safeSetItem(BABY_INFO_KEY, JSON.stringify(info));
};

export const clearBabyInfo = (): void => {
  safeRemoveItem(BABY_INFO_KEY);
};

export const loadVisitHistory = (): VisitRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  const parsed = safeParse<unknown>(localStorage.getItem(VISIT_HISTORY_KEY), []);
  return Array.isArray(parsed) ? sanitizeHistory(parsed) : [];
};

export const saveVisitHistory = (records: VisitRecord[]): VisitRecord[] => {
  const normalized = sanitizeHistory(records);
  if (!canUseStorage()) {
    return normalized;
  }

  if (safeSetItem(VISIT_HISTORY_KEY, JSON.stringify(normalized))) {
    return normalized;
  }

  const stripped = stripPhotoFromHistory(normalized);
  if (safeSetItem(VISIT_HISTORY_KEY, JSON.stringify(stripped))) {
    return stripped;
  }

  return stripped;
};

export const clearVisitHistory = (): void => {
  safeRemoveItem(VISIT_HISTORY_KEY);
};
