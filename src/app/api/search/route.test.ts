// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/search/route';

const envSnapshot = {
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
};

afterEach(() => {
  vi.restoreAllMocks();

  if (envSnapshot.NAVER_CLIENT_ID === undefined) {
    delete process.env.NAVER_CLIENT_ID;
  } else {
    process.env.NAVER_CLIENT_ID = envSnapshot.NAVER_CLIENT_ID;
  }

  if (envSnapshot.NAVER_CLIENT_SECRET === undefined) {
    delete process.env.NAVER_CLIENT_SECRET;
  } else {
    process.env.NAVER_CLIENT_SECRET = envSnapshot.NAVER_CLIENT_SECRET;
  }
});

describe('/api/search GET', () => {
  it('returns 400 when query is missing', async () => {
    const response = await GET(new Request('http://localhost/api/search'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Query is required' });
  });

  it('returns mock items when naver credentials are missing', async () => {
    delete process.env.NAVER_CLIENT_ID;
    delete process.env.NAVER_CLIENT_SECRET;

    const response = await GET(new Request('http://localhost/api/search?query=%EC%B9%B4%ED%8E%98'));
    const body = (await response.json()) as { items: Array<{ title: string }> };

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]?.title).toContain('카페');
  });

  it('returns upstream error details when naver API fails', async () => {
    process.env.NAVER_CLIENT_ID = 'id';
    process.env.NAVER_CLIENT_SECRET = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ errorMessage: 'rate limit' }),
      })
    );

    const response = await GET(new Request('http://localhost/api/search?query=test'));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: 'Naver API error',
      details: 'rate limit',
    });
  });

  it('sanitizes items when naver API succeeds', async () => {
    process.env.NAVER_CLIENT_ID = 'id';
    process.env.NAVER_CLIENT_SECRET = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          items: [
            {
              title: '정상 항목',
              address: '서울',
              category: '카페',
              link: 'https://example.com',
              roadAddress: '서울',
              description: '',
              telephone: '',
              mapx: '',
              mapy: '',
            },
            { title: 123, address: '서울', category: '카페', link: 'https://invalid.example.com' },
          ],
        }),
      })
    );

    const response = await GET(new Request('http://localhost/api/search?query=test'));
    const body = (await response.json()) as { items: Array<{ title: string }> };

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.title).toBe('정상 항목');
  });
});
