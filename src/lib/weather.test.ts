import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from '@/lib/weather';

describe('fetchWeather', () => {
  const originalWeatherKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalWeatherKey === undefined) {
      delete process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_WEATHER_API_KEY = originalWeatherKey;
    }
  });

  it('returns default weather when API key is missing', async () => {
    delete process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    const result = await fetchWeather(37.5, 127.0);

    expect(result).toEqual({
      temp: 22,
      condition: 'Clear',
      icon: '01d',
      isGoodForOutdoor: true,
    });
  });

  it('returns fallback weather when response is not ok', async () => {
    process.env.NEXT_PUBLIC_WEATHER_API_KEY = 'test-key';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const result = await fetchWeather(37.5, 127.0);
    expect(result).toEqual({
      temp: 0,
      condition: 'Unknown',
      icon: '',
      isGoodForOutdoor: false,
    });
  });

  it('returns fallback weather when response shape is invalid', async () => {
    process.env.NEXT_PUBLIC_WEATHER_API_KEY = 'test-key';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ weather: [], main: {} }),
      })
    );

    const result = await fetchWeather(37.5, 127.0);
    expect(result).toEqual({
      temp: 0,
      condition: 'Unknown',
      icon: '',
      isGoodForOutdoor: false,
    });
  });

  it('returns normalized weather when response is valid', async () => {
    process.env.NEXT_PUBLIC_WEATHER_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          weather: [{ main: 'Rain', icon: '10d' }],
          main: { temp: 12.6 },
        }),
      })
    );

    const result = await fetchWeather(37.5, 127.0);
    expect(result).toEqual({
      temp: 13,
      condition: 'Rain',
      icon: '10d',
      isGoodForOutdoor: false,
    });
  });
});
