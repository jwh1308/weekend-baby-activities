import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === 'YOUR_CLIENT_ID') {
        // API 키가 설정되지 않은 경우 테스트용 목업 데이터 반환
        return NextResponse.json({
            items: [
                { title: `[테스트] ${query} 추천 장소 1`, address: '서울시 어딘가', category: '카페', link: '#' },
                { title: `[테스트] ${query} 추천 장소 2`, address: '경기도 어딘가', category: '공원', link: '#' }
            ]
        });
    }

    try {
        const response = await fetch(
            `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=comment`,
            {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Naver API Response Error:', {
                status: response.status,
                data: errorData
            });
            return NextResponse.json({
                error: 'Naver API error',
                details: errorData.errorMessage || 'Unknown error'
            }, { status: response.status });
        }

        const data = await response.json();
        console.log(`Naver API Success: Found ${data.items?.length || 0} items for query "${query}"`);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Naver API Proxy Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
