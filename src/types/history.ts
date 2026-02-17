export interface VisitRecord {
  id: string;
  activityId: string;
  activityName: string;
  date: string;
  memo: string;
  photo?: string; // Base64 string
}

export type VisitRecordSource = 'migrated' | 'app';

export interface VisitRecordRemote {
  id: string;
  activityId: string;
  activityName: string;
  date: string;
  memo: string;
  photoPath: string | null;
  source: VisitRecordSource;
  createdAt: string;
  updatedAt: string;
}
