/**
 * 네이버 API 검색 결과의 HTML 태그를 제거합니다.
 */
export const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '');
};

/**
 * 개월 수와 날씨에 최적화된 검색 키워드를 반환합니다.
 */
export const getSearchKeywords = (months: number, isGoodForOutdoor: boolean): string[] => {
  if (months < 12) {
    return isGoodForOutdoor
      ? ['유모차 산책', '아기랑 카페', '수유실 있는 공원']
      : ['베이비카페', '아기랑 실내카페', '수유실 있는 쇼핑몰'];
  }

  if (months < 36) {
    return isGoodForOutdoor
      ? ['어린이공원', '동물농장', '아기랑 체험']
      : ['키즈카페', '실내놀이터', '아기랑 실내체험'];
  }

  return isGoodForOutdoor
    ? ['숲체험', '테마파크', '어린이 야외체험']
    : ['어린이박물관', '대형키즈카페', '어린이체험관'];
};
