'use client';

import { Activity } from '@/data/activities';
import styles from './ActivityCard.module.css';
import { MapPin, Sun, Umbrella } from 'lucide-react';

interface Props {
    activity: Activity;
}

export const ActivityCard = ({ activity }: Props) => {
    return (
        <div className={styles.card}>
            <div className={styles.topRow}>
                <span className={styles.categoryTag}>{activity.category}</span>
                <span className={styles.typeBadge}>
                    {activity.type === 'outdoor' ? '야외 • 🌳' : '실내 • 🏠'}
                </span>
            </div>
            <h3 className={styles.title}>{activity.name}</h3>
            <p className={styles.desc}>{activity.description}</p>
            <div className={styles.footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    <span>추천 장소</span>
                </div>
                <div>
                    {activity.type === 'outdoor' ? <Sun size={12} /> : <Umbrella size={12} />}
                </div>
            </div>
        </div>
    );
};
