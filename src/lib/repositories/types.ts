import { VisitRecord } from '@/types/history';

export interface VisitHistoryRepository {
  load(userId: string): Promise<VisitRecord[]>;
  saveAll(userId: string, records: VisitRecord[]): Promise<VisitRecord[]>;
  append(userId: string, record: VisitRecord): Promise<VisitRecord[]>;
  remove(userId: string, recordId: string): Promise<VisitRecord[]>;
  clear(userId: string): Promise<void>;
}
