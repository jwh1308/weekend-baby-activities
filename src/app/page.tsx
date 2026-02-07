'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { calculateMonths, getAgeLabel } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';
import { fetchWeather, WeatherData } from '@/lib/weather';
import { getSearchKeywords } from '@/lib/naver';
import { RealPlaceCard } from '@/components/RealPlaceCard';
import { HistoryModal } from '@/components/HistoryModal';
import { VisitRecord } from '@/types/history';
import { CloudRain, Sun, MapPin, Loader2, Thermometer, Calendar, Search, RefreshCcw } from 'lucide-react';
import styles from './page.module.css';

interface BabyInfo {
  name: string;
  birthday: string;
  region?: string;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const location = useLocation();

  const [babyInfo, setBabyInfo] = useState<BabyInfo | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [realPlaces, setRealPlaces] = useState<any[]>([]);
  const [history, setHistory] = useState<VisitRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'recommend' | 'history'>('recommend');
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');

  const [inputName, setInputName] = useState('');
  const [inputBirthday, setInputBirthday] = useState('');
  const [inputRegion, setInputRegion] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const savedInfo = localStorage.getItem('babyInfo');
    const savedHistory = localStorage.getItem('visitHistory');
    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      setBabyInfo(parsed);
      setInputRegion(parsed.region || '');
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    setInitialLoading(false);
  }, []);

  const loadRealPlaces = async (targetRegion?: string) => {
    if (!babyInfo) return;

    setIsSearching(true);
    try {
      const weatherData = await fetchWeather(location.lat || 37.5665, location.lng || 126.9780);
      setWeather(weatherData);

      const months = calculateMonths(babyInfo.birthday);
      const keywords = getSearchKeywords(months, weatherData.isGoodForOutdoor);
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      setCurrentKeyword(randomKeyword);

      const region = targetRegion || babyInfo.region || '';
      const searchQuery = region ? `${region} ${randomKeyword}` : randomKeyword;

      console.log(`검색 실행: "${searchQuery}"`);
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.items) {
        setRealPlaces(data.items);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!loading && user && babyInfo && !location.loading) {
      loadRealPlaces();
    }
  }, [babyInfo?.birthday, loading, user, location.lat, location.lng, location.loading]); // 개월수 기준이 바뀌거나 할 때

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName || !inputBirthday) return;
    const info = { name: inputName, birthday: inputBirthday, region: inputRegion };
    localStorage.setItem('babyInfo', JSON.stringify(info));
    setBabyInfo(info);
    loadRealPlaces(inputRegion);
  };

  const handleSaveVisit = (memo: string, photo: string | null) => {
    if (!selectedPlaceName) return;
    const newRecord: VisitRecord = {
      id: Date.now().toString(),
      activityId: 'custom',
      activityName: selectedPlaceName,
      date: new Date().toLocaleDateString('ko-KR'),
      memo,
      photo: photo || undefined
    };
    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('visitHistory', JSON.stringify(updatedHistory));
    setSelectedPlaceName(null);
    setActiveTab('history');
  };

  if (loading || initialLoading) {
    return <div className={styles.main} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" /><p style={{ marginLeft: '10px' }}>아기랑 주말 준비 중...</p></div>;
  }

  if (!user) return null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user.photoURL && <img src={user.photoURL} alt="profile" className={styles.avatar} />}
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
          <div className={styles.babyStatus} onClick={() => setBabyInfo(null)} style={{ cursor: 'pointer' }}>
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
                  {weather ? <><Thermometer size={20} color="var(--accent)" /><span className={styles.temp}>{weather.temp}°C</span><span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{weather.condition}</span></> : <span>날씨 가져오는 중...</span>}
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
                <button onClick={() => loadRealPlaces()} title="새로운 테마로 검색" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCcw size={18} className={isSearching ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className={styles.activityList}>
                {realPlaces.length > 0 ? (
                  realPlaces.map((place, idx) => (
                    <RealPlaceCard key={idx} place={place} onCheckIn={(name) => setSelectedPlaceName(name)} />
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                      {isSearching ? '실제 장소를 찾고 있어요...' : `"${babyInfo.region || ''} ${currentKeyword}"에 대한 검색 결과가 없습니다.`}
                    </p>
                    <button
                      onClick={() => loadRealPlaces()}
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
              {history.length > 0 ? history.map(item => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyTop}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.activityName}</h3>
                    <span className={styles.historyDate}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />{item.date}</span>
                  </div>
                  {item.photo && <img src={item.photo} alt="Memories" className={styles.historyPhoto} />}
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
