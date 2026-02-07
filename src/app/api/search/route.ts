import { NextResponse } from 'next/server';
import { NaverLocalPlace, NaverLocalSearchResponse } from '@/types/place';

const sanitizeItems = (items: unknown): NaverLocalPlace[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item): item is NaverLocalPlace => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<NaverLocalPlace>;
    return (
      typeof candidate.title === 'string' &&
      typeof candidate.address === 'string' &&
      typeof candidate.category === 'string' &&
      typeof candidate.link === 'string'
    );
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'YOUR_CLIENT_ID') {
    return NextResponse.json({
      items: [
        { title: `[테스트] ${query} 추천 장소 1`, address: '서울시 어딘가', roadAddress: '서울시 어딘가', category: '카페', link: '#', description: '', telephone: '', mapx: '', mapy: '' },
        { title: `[테스트] ${query} 추천 장소 2`, address: '경기도 어딘가', roadAddress: '경기도 어딘가', category: '공원', link: '#', description: '', telephone: '', mapx: '', mapy: '' },
      ],
    } satisfies NaverLocalSearchResponse);
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Naver API error',
          details: data.errorMessage || 'Unknown error',
        } satisfies NaverLocalSearchResponse,
        { status: response.status }
      );
    }

    return NextResponse.json({ ...data, items: sanitizeItems(data.items) } satisfies NaverLocalSearchResponse);
  } catch (error) {
    console.error('Naver API Proxy Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' } satisfies NaverLocalSearchResponse, { status: 500 });
  }
}
