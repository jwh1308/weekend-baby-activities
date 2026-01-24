export interface WeatherData {
    temp: number;
    condition: string;
    icon: string;
    isGoodForOutdoor: boolean;
}

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    if (!apiKey || apiKey === 'YOUR_WEATHER_API_KEY') {
        // API 키가 없을 경우 기본 데이터 (맑음) 반환
        return {
            temp: 22,
            condition: 'Clear',
            icon: '01d',
            isGoodForOutdoor: true
        };
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        const data = await response.json();

        const condition = data.weather[0].main;
        const isGoodForOutdoor = !['Rain', 'Snow', 'Thunderstorm', 'Extreme'].includes(condition);

        return {
            temp: Math.round(data.main.temp),
            condition,
            icon: data.weather[0].icon,
            isGoodForOutdoor
        };
    } catch (error) {
        console.error('Weather fetch error:', error);
        return { temp: 0, condition: 'Unknown', icon: '', isGoodForOutdoor: false };
    }
};
