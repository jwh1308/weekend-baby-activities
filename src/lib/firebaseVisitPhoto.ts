import { deleteObject, getStorage, ref, uploadString } from 'firebase/storage';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

export const getVisitPhotoPath = (userId: string, recordId: string): string => {
  return `users/${userId}/visit-photos/${recordId}.jpg`;
};

export const isDataUrl = (value: string): boolean => {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
};

export const uploadVisitPhoto = async (userId: string, recordId: string, dataUrl: string): Promise<string> => {
  if (!isDataUrl(dataUrl)) {
    throw new Error('photo must be a data URL');
  }

  const path = getVisitPhotoPath(userId, recordId);
  const photoRef = ref(storage, path);
  await uploadString(photoRef, dataUrl, 'data_url', {
    contentType: 'image/jpeg',
    customMetadata: { recordId },
  });
  return path;
};

export const deleteVisitPhoto = async (photoPath: string | null | undefined): Promise<void> => {
  if (!photoPath) {
    return;
  }

  await deleteObject(ref(storage, photoPath));
};
