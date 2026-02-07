export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  isGoodForOutdoor: boolean;
}

const DEFAULT_WEATHER: WeatherData = {
  temp: 22,
  condition: 'Clear',
  icon: '01d',
  isGoodForOutdoor: true,
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

  if (!apiKey || apiKey === 'YOUR_WEATHER_API_KEY') {
    return DEFAULT_WEATHER;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.weather?.[0]?.main || typeof data?.main?.temp !== 'number') {
      throw new Error('Unexpected Weather API response shape');
    }

    const condition = data.weather[0].main as string;
    const isGoodForOutdoor = !['Rain', 'Snow', 'Thunderstorm', 'Extreme'].includes(condition);

    return {
      temp: Math.round(data.main.temp),
      condition,
      icon: data.weather[0].icon,
      isGoodForOutdoor,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      temp: 0,
      condition: 'Unknown',
      icon: '',
      isGoodForOutdoor: false,
    };
  }
};
