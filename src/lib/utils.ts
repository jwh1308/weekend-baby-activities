import { differenceInMonths, parseISO, isValid } from 'date-fns';

/**
 * 생년월일을 바탕으로 현재 개월 수를 계산합니다.
 * @param birthDate 'YYYY-MM-DD' 형식의 문자열
 * @returns 개월 수
 */
export const calculateMonths = (birthDate: string): number => {
    const birth = parseISO(birthDate);
    if (!isValid(birth)) return 0;

    const today = new Date();
    return differenceInMonths(today, birth);
};

/**
 * 개월 수에 따른 연령대 라벨을 반환합니다.
 */
export const getAgeLabel = (months: number): string => {
    if (months < 12) return `${months}개월 (영아)`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}세 ${remainingMonths}개월`;
};
