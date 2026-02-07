'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { calculateMonths, getAgeLabel } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';
import { fetchWeather, WeatherData } from '@/lib/weather';
import { getSearchKeywords } from '@/lib/naver';
import { clearVisitHistory, loadBabyInfo, loadVisitHistory, saveBabyInfo, saveVisitHistory } from '@/lib/clientStorage';
import { RealPlaceCard } from '@/components/RealPlaceCard';
import { HistoryModal } from '@/components/HistoryModal';
import { BabyInfo } from '@/types/baby';
import { VisitRecord } from '@/types/history';
import { NaverLocalPlace, NaverLocalSearchResponse } from '@/types/place';
import { MapPin, Loader2, Thermometer, Calendar, Search, RefreshCcw } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const location = useLocation();

  const [babyInfo, setBabyInfo] = useState<BabyInfo | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [realPlaces, setRealPlaces] = useState<NaverLocalPlace[]>([]);
  const [history, setHistory] = useState<VisitRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'recommend' | 'history'>('recommend');
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [inputName, setInputName] = useState('');
  const [inputBirthday, setInputBirthday] = useState('');
  const [inputRegion, setInputRegion] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const savedInfo = loadBabyInfo();
    const savedHistory = loadVisitHistory();

    if (savedInfo) {
      setBabyInfo(savedInfo);
      setInputName(savedInfo.name);
      setInputBirthday(savedInfo.birthday);
      setInputRegion(savedInfo.region || '');
    }

    setHistory(savedHistory);
    setInitialLoading(false);
  }, []);

  const loadRealPlaces = useCallback(async (targetRegion?: string, infoOverride?: BabyInfo | null) => {
    const info = infoOverride ?? babyInfo;
    if (!info) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const weatherData = await fetchWeather(location.lat || 37.5665, location.lng || 126.9780);
      setWeather(weatherData);

      const months = calculateMonths(info.birthday);
      const keywords = getSearchKeywords(months, weatherData.isGoodForOutdoor);
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)] ?? '아기랑 체험';
      setCurrentKeyword(randomKeyword);

      const searchPlaces = async (query: string): Promise<NaverLocalPlace[]> => {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data: NaverLocalSearchResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || '장소 검색 요청에 실패했습니다.');
        }

        return data.items ?? [];
      };

      const region = targetRegion || info.region || '';
      const primaryQuery = region ? `${region} ${randomKeyword}` : randomKeyword;
      let items = await searchPlaces(primaryQuery);

      if (items.length === 0 && region) {
        items = await searchPlaces(randomKeyword);
      }

      setRealPlaces(items);
    } catch (error) {
      setRealPlaces([]);
      setSearchError(error instanceof Error ? error.message : '장소 검색 중 오류가 발생했습니다.');
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [babyInfo, location.lat, location.lng]);

  useEffect(() => {
    if (!loading && user && babyInfo && !location.loading) {
      void loadRealPlaces();
    }
  }, [loading, user, babyInfo, location.loading, loadRealPlaces]);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputName || !inputBirthday) {
      return;
    }

    const info: BabyInfo = { name: inputName, birthday: inputBirthday, region: inputRegion };
    saveBabyInfo(info);
    setBabyInfo(info);
    void loadRealPlaces(inputRegion, info);
  };

  const handleEditInfo = () => {
    if (!babyInfo) {
      return;
    }

    setInputName(babyInfo.name);
    setInputBirthday(babyInfo.birthday);
    setInputRegion(babyInfo.region || '');
    setBabyInfo(null);
  };

  const handleSaveVisit = (memo: string, photo: string | null) => {
    if (!selectedPlaceName) {
      return;
    }

    const newRecord: VisitRecord = {
      id: Date.now().toString(),
      activityId: 'custom',
      activityName: selectedPlaceName,
      date: new Date().toLocaleDateString('ko-KR'),
      memo,
      photo: photo || undefined,
    };

    setHistory((prevHistory) => {
      const updatedHistory = saveVisitHistory([newRecord, ...prevHistory]);
      return updatedHistory;
    });

    setSelectedPlaceName(null);
    setActiveTab('history');
  };

  const handleClearHistory = () => {
    clearVisitHistory();
    setHistory([]);
  };

  if (loading || initialLoading) {
    return (
      <div className={styles.main} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" />
        <p style={{ marginLeft: '10px' }}>아기랑 주말 준비 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt="profile"
              width={32}
              height={32}
              className={styles.avatar}
              unoptimized
            />
          )}
          <span style={{ fontWeight: 600 }}>{user.displayName}님</span>
        </div>
        <button onClick={logout} className={styles.logoutButton}>로그아웃</button>
      </header>

      {!babyInfo ? (
        <section className={styles.setupCard}>
          <h2 className={styles.setupTitle}>우리 아기 정보를 알려주세요!</h2>
          <form onSubmit={handleSaveInfo} className={styles.formGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>아기 이름 (또는 태명)</label>
              <input type="text" className={styles.input} value={inputName} onChange={(e) => setInputName(e.target.value)} placeholder="예: 튼튼이" required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>생년월일</label>
              <input type="date" className={styles.input} value={inputBirthday} onChange={(e) => setInputBirthday(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>주요 활동 지역 (선택)</label>
              <input type="text" className={styles.input} value={inputRegion} onChange={(e) => setInputRegion(e.target.value)} placeholder="예: 분당구, 은평구 등" />
            </div>
            <button type="submit" className={styles.saveButton}>저장하고 시작하기</button>
          </form>
        </section>
      ) : (
        <section className={styles.dashboard}>
          <div className={styles.babyStatus} onClick={handleEditInfo} style={{ cursor: 'pointer' }}>
            <h1 className={styles.babyName}>{babyInfo.name}</h1>
            <p className={styles.babyAge}>오늘 기준으로 <strong>{getAgeLabel(calculateMonths(babyInfo.birthday))}</strong> 되었어요!</p>
          </div>

          <nav className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'recommend' ? styles.tabActive : ''}`} onClick={() => setActiveTab('recommend')}>추천 장소</button>
            <button className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`} onClick={() => setActiveTab('history')}>체험 활동 ({history.length})</button>
          </nav>

          {activeTab === 'recommend' ? (
            <>
              <div className={styles.weatherWidget}>
                <div className={styles.weatherInfo}>
                  {weather ? (
                    <>
                      <Thermometer size={20} color="var(--accent)" />
                      <span className={styles.temp}>{weather.temp}°C</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{weather.condition}</span>
                    </>
                  ) : (
                    <span>날씨 가져오는 중...</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} />내 동네 설정 가능</div>
              </div>

              <div className={styles.regionHeader}>
                <span className={styles.regionText}>📍 {babyInfo.region || '전국'} 장소 추천</span>
                <button className={styles.changeRegionBtn} onClick={() => setBabyInfo(null)}>지역 수정</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.recommendationLabel} style={{ margin: 0 }}>
                  {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} color="var(--primary-dark)" />}
                  {currentKeyword ? `"${currentKeyword}" 검색 결과` : '로딩 중...'}
                </h2>
                <button onClick={() => void loadRealPlaces()} title="새로운 테마로 검색" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCcw size={18} className={isSearching ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className={styles.activityList}>
                {realPlaces.length > 0 ? (
                  realPlaces.map((place, idx) => (
                    <RealPlaceCard key={`${place.link}-${idx}`} place={place} onCheckIn={(name) => setSelectedPlaceName(name)} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                      {isSearching
                        ? '실제 장소를 찾고 있어요...'
                        : searchError || `"${babyInfo.region || ''} ${currentKeyword}"에 대한 검색 결과가 없습니다.`}
                    </p>
                    <button
                      onClick={() => void loadRealPlaces()}
                      style={{ marginTop: '12px', color: 'var(--primary-dark)', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      다른 테마로 다시 해볼까요?
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.historyList}>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{ alignSelf: 'flex-end', color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.85rem' }}
                >
                  기록 전체 삭제
                </button>
              )}
              {history.length > 0 ? history.map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyTop}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.activityName}</h3>
                    <span className={styles.historyDate}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />{item.date}</span>
                  </div>
                  {item.photo && (
                    <Image
                      src={item.photo}
                      alt="Memories"
                      width={640}
                      height={480}
                      className={styles.historyPhoto}
                      unoptimized
                    />
                  )}
                  {item.memo && <p className={styles.historyMemo}>{item.memo}</p>}
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <p>아직 다녀온 기록이 없어요.<br />첫 번째 모험을 떠나볼까요? 🏕️</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {selectedPlaceName && (
        <HistoryModal
          activityName={selectedPlaceName}
          onClose={() => setSelectedPlaceName(null)}
          onSave={handleSaveVisit}
        />
      )}
    </main>
  );
}
