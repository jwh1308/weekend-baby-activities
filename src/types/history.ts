export interface VisitRecord {
    id: string;
    activityId: string;
    activityName: string;
    date: string;
    memo: string;
    photo?: string; // Base64 string
}
