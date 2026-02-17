import { describe, expect, it } from 'vitest';
import { getSearchKeywords } from '@/lib/naver';

describe('getSearchKeywords', () => {
  it('returns outdoor keywords for babies under 12 months', () => {
    expect(getSearchKeywords(11, true)).toEqual(['유모차 산책', '아기랑 카페', '수유실 있는 공원']);
  });

  it('returns indoor keywords for babies under 12 months', () => {
    expect(getSearchKeywords(8, false)).toEqual(['베이비카페', '아기랑 실내카페', '수유실 있는 쇼핑몰']);
  });

  it('returns outdoor keywords for toddlers under 36 months', () => {
    expect(getSearchKeywords(24, true)).toEqual(['어린이공원', '동물농장', '아기랑 체험']);
  });

  it('returns indoor keywords for toddlers under 36 months', () => {
    expect(getSearchKeywords(24, false)).toEqual(['키즈카페', '실내놀이터', '아기랑 실내체험']);
  });

  it('returns outdoor keywords for 36 months and above', () => {
    expect(getSearchKeywords(36, true)).toEqual(['숲체험', '테마파크', '어린이 야외체험']);
  });

  it('returns indoor keywords for 36 months and above', () => {
    expect(getSearchKeywords(48, false)).toEqual(['어린이박물관', '대형키즈카페', '어린이체험관']);
  });
});
