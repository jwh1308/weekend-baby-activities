# Phase 3 Storage Migration Design

작성일: 2026-02-17  
대상 프로젝트: weekend-baby-activities

## 1. 목표
- 방문 기록 저장 구조를 `localStorage` 중심에서 Firebase 기반 구조로 전환한다.
- 텍스트 메타데이터와 이미지를 분리 저장해 용량 한계와 개인정보 리스크를 낮춘다.
- 기존 사용자 데이터는 1회 마이그레이션으로 최대한 보존한다.

## 2. 목표 아키텍처
- 인증: Firebase Auth (`uid` 기준 데이터 소유권 제어)
- 메타데이터: Firestore
- 이미지 파일: Firebase Storage
- 클라이언트 fallback: 전환 기간 동안 `localStorage` 읽기 유지

## 3. 데이터 모델

### Firestore
- 컬렉션: `users/{uid}/visitRecords/{recordId}`
- 필드
  - `activityId: string`
  - `activityName: string`
  - `date: string` (`YYYY-MM-DD` 권장, 기존 데이터는 문자열 허용)
  - `memo: string` (최대 1000자)
  - `photoPath: string | null` (Storage 경로)
  - `createdAt: serverTimestamp`
  - `updatedAt: serverTimestamp`
  - `source: 'migrated' | 'app'`

### Firebase Storage
- 경로: `users/{uid}/visit-photos/{recordId}.jpg`
- 메타데이터
  - `contentType: image/jpeg`
  - `customMetadata.recordId`

## 4. 인덱스/조회 전략
- 기본 조회: `users/{uid}/visitRecords`를 `createdAt desc` 정렬
- 필요 시 composite index
  - `date desc + createdAt desc`
- 페이지네이션: `limit(20)` + cursor(`startAfter`)

## 5. 마이그레이션 전략 (1회)

### 트리거
- 로그인 후 최초 1회, `users/{uid}/migrationStatus/visitHistoryV1` 문서 확인

### 절차
1. `localStorage.visitHistory` 로드
2. 레코드 스키마 정규화 (`id/activityId/activityName/date/memo/photo`)
3. 각 레코드 처리
   - 사진(base64) 존재 시 Storage 업로드 후 `photoPath` 저장
   - 메타데이터를 Firestore에 upsert
4. 성공 시 migration status 문서 업데이트
5. 전환 플래그가 켜지면 UI 데이터 소스를 Firestore로 전환

### 재시도 정책
- 레코드 단위 독립 처리(부분 실패 허용)
- 실패 레코드 목록을 migration status에 남기고 다음 세션 재시도
- 3회 실패 시 사용자에게 안내 메시지 노출

## 6. 실패/롤백 전략
- 마이그레이션 도중 앱은 기존 localStorage 데이터를 계속 읽을 수 있어야 한다.
- 전환 플래그를 끄면 즉시 localStorage 모드로 복귀 가능해야 한다.
- migration status가 `completed`가 되기 전에는 localStorage 정리를 수행하지 않는다.

## 7. 개인정보 최소화 정책
- 메모는 1000자 제한 유지
- 사진 원본은 클라이언트에서 리사이즈/압축 후 업로드
- 사용자 요청 시 삭제
  - 단일 기록 삭제: Firestore 문서 + Storage 파일 동시 삭제
  - 전체 기록 삭제: 배치 삭제 + Storage prefix 삭제
- 장기 보관 정책(초안): 마지막 활동 후 24개월 무활동 시 삭제 후보 안내

## 8. 점진 전환 플래그
- 클라이언트 플래그: `NEXT_PUBLIC_STORAGE_MODE`
  - `local` (기본)
  - `hybrid` (읽기 local + 원격 마이그레이션)
  - `remote` (읽기/쓰기 remote)
- 권장 순서
  1. `local` -> `hybrid` (1주 관찰)
  2. 오류율 안정화 후 `remote` 전환
  3. 2주 안정화 후 local fallback 제거 검토

## 9. 보안 규칙(초안)
- Firestore: `request.auth.uid == uid` 인 경우에만 read/write 허용
- Storage: `users/{uid}/...` 경로에서 동일 uid만 read/write 허용
- 파일 크기 제한(예: 3MB), MIME 타입 `image/*` 제한

## 10. 구현 체크리스트
- [x] Firestore/Storage 클라이언트 래퍼 추가
- [x] migration status 모델 정의
- [x] 마이그레이션 실행기 구현
- [ ] feature flag 기반 데이터 소스 분기
- [ ] 삭제 API(단건/전체) 원격 저장소 대응
- [ ] 모니터링 이벤트(성공/실패/재시도) 추가

## 11. 상세 구현 티켓
- 실행 단위로 분해한 티켓 문서: `docs/phase3-implementation-tickets.md`
