'use client';

import styles from './ActivityCard.module.css';
import { MapPin, ExternalLink } from 'lucide-react';
import { stripHtml } from '@/lib/naver';
import { NaverLocalPlace } from '@/types/place';

interface Props {
  place: NaverLocalPlace;
  onCheckIn: (name: string) => void;
}

export const RealPlaceCard = ({ place, onCheckIn }: Props) => {
  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <span className={styles.categoryTag}>{place.category.split('>')[0] || '장소'}</span>
        <a href={place.link} target="_blank" rel="noopener noreferrer" className={styles.typeBadge} style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary-dark)' }}>
          지도 보기 <ExternalLink size={10} />
        </a>
      </div>
      <h3 className={styles.title}>{stripHtml(place.title)}</h3>
      <p className={styles.address} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {place.roadAddress || place.address}
      </p>

      <button className={styles.checkInBtn} onClick={() => onCheckIn(stripHtml(place.title))}>
        다녀왔어요!
      </button>

      <div className={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={12} />
          <span>실제 추천 장소</span>
        </div>
      </div>
    </div>
  );
};
