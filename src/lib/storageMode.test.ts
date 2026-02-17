import { afterEach, describe, expect, it } from 'vitest';
import { getStorageMode, parseStorageMode } from '@/lib/storageMode';

describe('parseStorageMode', () => {
  it('returns local when value is empty', () => {
    expect(parseStorageMode(undefined)).toBe('local');
    expect(parseStorageMode(null)).toBe('local');
    expect(parseStorageMode('')).toBe('local');
  });

  it('parses valid values case-insensitively', () => {
    expect(parseStorageMode('local')).toBe('local');
    expect(parseStorageMode('HYBRID')).toBe('hybrid');
    expect(parseStorageMode(' remote ')).toBe('remote');
  });

  it('falls back to local for invalid values', () => {
    expect(parseStorageMode('foo')).toBe('local');
    expect(parseStorageMode('true')).toBe('local');
  });
});

describe('getStorageMode', () => {
  const originalStorageMode = process.env.NEXT_PUBLIC_STORAGE_MODE;

  afterEach(() => {
    if (originalStorageMode === undefined) {
      delete process.env.NEXT_PUBLIC_STORAGE_MODE;
    } else {
      process.env.NEXT_PUBLIC_STORAGE_MODE = originalStorageMode;
    }
  });

  it('reads storage mode from environment', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'hybrid';
    expect(getStorageMode()).toBe('hybrid');
  });

  it('defaults to local when environment is invalid', () => {
    process.env.NEXT_PUBLIC_STORAGE_MODE = 'invalid-mode';
    expect(getStorageMode()).toBe('local');
  });
});
