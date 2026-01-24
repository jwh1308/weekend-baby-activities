'use client';

import { useState, useEffect } from 'react';

interface LocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}

export const useLocation = () => {
    const [location, setLocation] = useState<LocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, error: 'Geolocation이 지원되지 않는 브라우저입니다.', loading: false }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setLocation(prev => ({ ...prev, error: '위치 정보를 가져올 수 없습니다.', loading: false }));
            }
        );
    }, []);

    return location;
};
