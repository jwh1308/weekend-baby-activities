import { BabyInfo } from '@/types/baby';
import { VisitRecord } from '@/types/history';

const BABY_INFO_KEY = 'babyInfo';
const VISIT_HISTORY_KEY = 'visitHistory';
const MAX_HISTORY_ITEMS = 100;

const canUseStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
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

const sanitizeHistory = (records: VisitRecord[]): VisitRecord[] => {
  return records.slice(0, MAX_HISTORY_ITEMS).map((record) => ({
    ...record,
    memo: record.memo.slice(0, 1000),
  }));
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
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(BABY_INFO_KEY, JSON.stringify(info));
};

export const clearBabyInfo = (): void => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(BABY_INFO_KEY);
};

export const loadVisitHistory = (): VisitRecord[] => {
  if (!canUseStorage()) {
    return [];
  }

  const parsed = safeParse<VisitRecord[]>(localStorage.getItem(VISIT_HISTORY_KEY), []);
  return Array.isArray(parsed) ? sanitizeHistory(parsed) : [];
};

export const saveVisitHistory = (records: VisitRecord[]): VisitRecord[] => {
  if (!canUseStorage()) {
    return sanitizeHistory(records);
  }

  const normalized = sanitizeHistory(records);

  try {
    localStorage.setItem(VISIT_HISTORY_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const stripped = stripPhotoFromHistory(normalized);
    localStorage.setItem(VISIT_HISTORY_KEY, JSON.stringify(stripped));
    return stripped;
  }
};

export const clearVisitHistory = (): void => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(VISIT_HISTORY_KEY);
};
