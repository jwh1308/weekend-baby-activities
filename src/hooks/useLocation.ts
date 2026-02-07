'use client';

import { useState, useEffect } from 'react';

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

const isGeolocationSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'geolocation' in navigator;
};

export const useLocation = () => {
  const geolocationSupported = isGeolocationSupported();

  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    error: geolocationSupported ? null : 'Geolocation이 지원되지 않는 브라우저입니다.',
    loading: geolocationSupported,
  });

  useEffect(() => {
    if (!geolocationSupported) {
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
      () => {
        setLocation((prev) => ({ ...prev, error: '위치 정보를 가져올 수 없습니다.', loading: false }));
      }
    );
  }, [geolocationSupported]);

  return location;
};
