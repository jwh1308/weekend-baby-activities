# 아이와 함께 - 주말 아기 놀거리 추천

아기 연령(개월 수), 현재 날씨, 지역 정보를 기반으로 주말 활동 장소를 추천하는 Next.js 앱입니다.

## 핵심 기능
- Firebase Google 로그인
- 아기 정보(이름/생년월일/주요 활동 지역) 입력
- 위치 기반 날씨 조회(OpenWeatherMap)
- 연령/날씨 조건 기반 검색 키워드 생성
- 네이버 로컬 검색 API 프록시를 통한 실제 장소 추천
- 방문 기록(메모/사진) 저장

## 기술 스택
- Next.js 16 (App Router)
- React 19
- TypeScript
- Firebase Auth
- OpenWeatherMap API
- Naver Search API

## 실행 방법
1. 의존성 설치
```bash
npm ci
```

2. 환경 변수 설정
```bash
cp .env.example .env.local
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저 접속
- `http://localhost:3000`

## 환경 변수
`.env.local`에 아래 값을 설정합니다.

### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Weather
- `NEXT_PUBLIC_WEATHER_API_KEY`

### Naver Search
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

API 키가 비어 있거나 placeholder 값이면 일부 기능은 목업/기본값으로 동작합니다.

## 스크립트
- `npm run dev`: 개발 서버
- `npm run lint`: ESLint 검사
- `npm run build`: 프로덕션 빌드(webpack 모드)
- `npm run start`: 프로덕션 서버 실행

## 프로젝트 구조
```text
src/
  app/
    api/search/route.ts     # 네이버 검색 프록시 API
    login/page.tsx          # 로그인 페이지
    page.tsx                # 메인 대시보드
  components/
    RealPlaceCard.tsx
    HistoryModal.tsx
  context/
    AuthContext.tsx
  hooks/
    useLocation.ts
  lib/
    firebase.ts
    weather.ts
    naver.ts
    utils.ts
  types/
    history.ts
    place.ts
```

## 참고 사항
- 방문 기록은 현재 `localStorage`에 저장됩니다.
- 계획 문서는 `.plans/`에 저장되며 Git 추적에서 제외됩니다.
