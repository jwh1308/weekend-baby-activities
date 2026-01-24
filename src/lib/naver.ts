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
    const baseSub = isGoodForOutdoor ? '야외' : '실내';

    if (months < 12) {
        return ['유모차 산책', '아기랑 카페', '베이비카페', '수유실 있는 공원'];
    } else if (months < 36) {
        return ['어린이공원', '키즈카페', '실내놀이터', '동물농장', '아기랑 체험'];
    } else {
        return ['어린이박물관', '대형키즈카페', '어린이체험관', '테마파크', '숲체험'];
    }
};
