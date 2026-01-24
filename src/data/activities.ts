export interface Activity {
    id: string;
    name: string;
    category: '공원' | '키즈카페' | '박물관' | '체험' | '도서관';
    minMonths: number;
    maxMonths: number;
    type: 'indoor' | 'outdoor';
    description: string;
    weatherRecommendation: string[]; // ['Sunny', 'Cloudy', 'Rainy' 등 추천 날씨]
}

export const activities: Activity[] = [
    {
        id: '1',
        name: '동네 숲체험 공원',
        category: '공원',
        minMonths: 12,
        maxMonths: 84,
        type: 'outdoor',
        description: '맑은 공기를 마시며 유모차 산책하기 좋아요.',
        weatherRecommendation: ['Clear', 'Clouds']
    },
    {
        id: '2',
        name: '뽀로로 파크',
        category: '키즈카페',
        minMonths: 12,
        maxMonths: 60,
        type: 'indoor',
        description: '비가 오는 날에도 신나게 뛰어놀 수 있는 실내 놀이터!',
        weatherRecommendation: ['Rain', 'Snow', 'Extreme', 'Clouds']
    },
    {
        id: '3',
        name: '아기 수영장',
        category: '체험',
        minMonths: 3,
        maxMonths: 24,
        type: 'indoor',
        description: '물속에서 자유롭게 움직이는 아기를 볼 수 있어요.',
        weatherRecommendation: ['Clear', 'Clouds', 'Rain']
    },
    {
        id: '4',
        name: '국립어린이과학관',
        category: '박물관',
        minMonths: 36,
        maxMonths: 120,
        type: 'indoor',
        description: '호기심 많은 어린이를 위한 체험형 과학관입니다.',
        weatherRecommendation: ['Clear', 'Clouds', 'Rain']
    },
    {
        id: '5',
        name: '동물원 산책',
        category: '공원',
        minMonths: 18,
        maxMonths: 96,
        type: 'outdoor',
        description: '다양한 동물을 보며 감성을 키워요.',
        weatherRecommendation: ['Clear']
    }
];
