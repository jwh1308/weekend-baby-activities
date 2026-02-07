export interface NaverLocalPlace {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

export interface NaverLocalSearchResponse {
  items?: NaverLocalPlace[];
  error?: string;
  details?: string;
}
