'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import styles from './HistoryModal.module.css';
import { Camera } from 'lucide-react';

interface Props {
  activityName: string;
  onClose: () => void;
  onSave: (memo: string, photo: string | null) => void;
}

export const HistoryModal = ({ activityName, onClose, onSave }: Props) => {
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('이미지 읽기에 실패했습니다.'));
      };
      reader.onerror = () => reject(new Error('이미지 읽기에 실패했습니다.'));
      reader.readAsDataURL(file);
    });
  };

  const optimizeWithBitmap = async (file: File): Promise<string> => {
    const imageBitmap = await createImageBitmap(file);

    const maxSize = 1280;
    const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height, 1);
    const targetWidth = Math.round(imageBitmap.width * ratio);
    const targetHeight = Math.round(imageBitmap.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이미지 처리에 실패했습니다.');
    }

    context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    imageBitmap.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const optimizeImage = async (file: File): Promise<string> => {
    if (typeof createImageBitmap !== 'function') {
      return readAsDataUrl(file);
    }

    try {
      return await optimizeWithBitmap(file);
    } catch {
      return readAsDataUrl(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setPhotoError(null);
        if (!file.type.startsWith('image/')) {
          throw new Error('이미지 파일만 업로드할 수 있습니다.');
        }

        const optimized = await optimizeImage(file);
        setPhoto(optimized);
      } catch {
        setPhotoError('사진을 처리하지 못했습니다. 다른 이미지를 선택해 주세요.');
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>📸 {activityName} 방문 기록</h2>

        <div>
          <label className={styles.label}>오늘의 추억 (메모)</label>
          <textarea
            className={styles.textarea}
            placeholder="아기가 어떤 반응이었나요? 다음엔 무엇을 준비할까요?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div>
          <label className={styles.label}>사진 한 장</label>
          <div className={styles.photoUpload} onClick={() => fileInputRef.current?.click()}>
            {photo ? (
              <Image src={photo} alt="Preview" className={styles.preview} fill unoptimized />
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
          {photoError && (
            <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#dc2626' }}>{photoError}</p>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.saveBtn} onClick={() => onSave(memo, photo)}>저장하기</button>
        </div>
      </div>
    </div>
  );
};
