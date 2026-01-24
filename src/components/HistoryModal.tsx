'use client';

import { useState, useRef } from 'react';
import styles from './HistoryModal.module.css';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

interface Props {
    activityName: string;
    onClose: () => void;
    onSave: (memo: string, photo: string | null) => void;
}

export const HistoryModal = ({ activityName, onClose, onSave }: Props) => {
    const [memo, setMemo] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2 className={styles.title}>📸 {activityName} 방문 기록</h2>

                <div>
                    <label className={styles.label}>오늘의 추억 (메모)</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="아기가 어떤 반응이었나요? 다음엔 무엇을 준비할까요?"
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                    />
                </div>

                <div>
                    <label className={styles.label}>사진 한 장</label>
                    <div className={styles.photoUpload} onClick={() => fileInputRef.current?.click()}>
                        {photo ? (
                            <img src={photo} alt="Preview" className={styles.preview} />
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Camera size={32} style={{ marginBottom: '8px' }} />
                                <p style={{ fontSize: '0.8rem' }}>사진 선택하기</p>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className={styles.fileInput}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button className={styles.cancelBtn} onClick={onClose}>취소</button>
                    <button className={styles.saveBtn} onClick={() => onSave(memo, photo)}>저장하기</button>
                </div>
            </div>
        </div>
    );
};
