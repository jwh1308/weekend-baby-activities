import { StorageMode } from '@/types/migration';

const DEFAULT_STORAGE_MODE: StorageMode = 'local';
const STORAGE_MODES: StorageMode[] = ['local', 'hybrid', 'remote'];

export const parseStorageMode = (value: string | null | undefined): StorageMode => {
  if (!value) {
    return DEFAULT_STORAGE_MODE;
  }

  const normalized = value.trim().toLowerCase();
  if (STORAGE_MODES.includes(normalized as StorageMode)) {
    return normalized as StorageMode;
  }

  return DEFAULT_STORAGE_MODE;
};

export const getStorageMode = (): StorageMode => {
  return parseStorageMode(process.env.NEXT_PUBLIC_STORAGE_MODE);
};
