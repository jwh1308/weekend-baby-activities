# Phase 3 구현 티켓 분해

작성일: 2026-02-17  
기준 문서: `docs/phase3-storage-migration-design.md`

## 목표
- `localStorage` 중심 방문 기록 저장 구조를 Firestore + Storage 기반으로 단계 전환한다.
- 데이터 손실 없이 1회 마이그레이션을 수행하고, 실패 시 재시도 가능하게 만든다.
- 개인정보 최소화/삭제 정책을 실제 코드 경로에 반영한다.

## 작업 원칙
- 모든 변경은 `main`이 아닌 작업 브랜치에서 진행 후 PR로 반영한다.
- 단계별 전환: `local -> hybrid -> remote`
- 각 티켓은 독립 머지 가능하도록 최소 단위로 쪼갠다.

## 티켓 목록

### P3-01. 원격 저장소 도메인 타입/인터페이스 정의
- 범위
  - `VisitRecordRemote`, `MigrationStatus`, `StorageMode` 타입 정의
  - 저장소 인터페이스(`VisitHistoryRepository`) 정의
- 산출물
  - `src/types/history.ts` 확장
  - `src/types/migration.ts` 신규
  - `src/lib/repositories/types.ts` 신규
- 완료 기준
  - 기존 UI가 깨지지 않고 타입 체크 통과
  - 저장소 구현체(local/remote/hybrid)를 동일 시그니처로 만들 수 있어야 함
- 의존성: 없음

### P3-02. Firestore/Storage 클라이언트 래퍼 추가
- 범위
  - visit record CRUD 래퍼
  - 이미지 업로드/삭제 래퍼
  - `users/{uid}/visitRecords/{recordId}` 경로 고정
- 산출물
  - `src/lib/firebaseVisitHistory.ts` 신규
  - `src/lib/firebaseVisitPhoto.ts` 신규
- 완료 기준
  - 단건 저장/조회/삭제 함수 단위 테스트 통과(mock 기반)
  - 에러를 throw 대신 도메인 에러 형태로 변환
- 의존성: P3-01

### P3-03. 저장소 모드 플래그/런타임 설정 도입
- 범위
  - `NEXT_PUBLIC_STORAGE_MODE`(`local|hybrid|remote`) 파싱 유틸
  - 잘못된 값 입력 시 `local` 기본값 처리
- 산출물
  - `src/lib/storageMode.ts` 신규
  - `.env.example`/`README.md` 환경변수 설명 보강
- 완료 기준
  - 모드 판별 유닛 테스트 통과
- 의존성: 없음

### P3-04. Repository 구현체 3종(local/remote/hybrid) 구현
- 범위
  - local 구현체: 기존 `clientStorage` 래핑
  - remote 구현체: Firestore/Storage 래퍼 연결
  - hybrid 구현체: 읽기 local + write remote + migration hook 제공
- 산출물
  - `src/lib/repositories/localVisitHistoryRepository.ts` 신규
  - `src/lib/repositories/remoteVisitHistoryRepository.ts` 신규
  - `src/lib/repositories/hybridVisitHistoryRepository.ts` 신규
  - `src/lib/repositories/createVisitHistoryRepository.ts` 신규
- 완료 기준
  - 같은 테스트 시나리오를 구현체별로 통과(계약 테스트)
  - `save/load/clear/delete` 동작 일관성 보장
- 의존성: P3-01, P3-02, P3-03

### P3-05. migration status 모델/저장 로직 구현
- 범위
  - `users/{uid}/migrationStatus/visitHistoryV1` 문서 read/write
  - 상태: `idle|running|partial|completed|failed`
  - 실패 항목/재시도 횟수 기록
- 산출물
  - `src/lib/migrationStatus.ts` 신규
- 완료 기준
  - 상태 전이 테스트 통과
  - 비정상 종료 후 재실행 가능한 상태 복구 확인
- 의존성: P3-02

### P3-06. 1회 마이그레이션 실행기 구현
- 범위
  - localStorage 기록 정규화
  - 사진 업로드 + Firestore upsert
  - 레코드 단위 실패 수집 및 재시도 카운트 반영
- 산출물
  - `src/lib/migrateVisitHistory.ts` 신규
  - 실행 엔트리 유틸(`runVisitHistoryMigrationIfNeeded`) 신규
- 완료 기준
  - 정상 케이스: migration status `completed`
  - 부분 실패 케이스: `partial` + 실패 목록 기록
  - 3회 실패 케이스: 사용자 안내용 상태 반환
- 의존성: P3-04, P3-05

### P3-07. UI 데이터 소스 분기 적용(page/history modal)
- 범위
  - `src/app/page.tsx`에서 repository 주입 방식으로 전환
  - 저장/조회/전체삭제를 repository 호출로 교체
  - 마이그레이션 진행/실패 메시지 노출
- 산출물
  - `src/app/page.tsx` 수정
  - 필요 시 `src/components/HistoryModal.tsx` 최소 수정
- 완료 기준
  - `local` 모드 기존 동작 동일
  - `hybrid/remote` 모드에서 기록 쓰기/조회 동작
  - 기존 테스트 + 신규 통합 테스트 통과
- 의존성: P3-04, P3-06

### P3-08. 삭제 정책 반영(단건/전체)
- 범위
  - 단일 기록 삭제 시 Firestore 문서 + Storage 파일 동시 삭제
  - 전체 삭제 시 원격/로컬 동시 정리
- 산출물
  - repository delete API 확장
  - UI 삭제 액션(단건/전체) 연결
- 완료 기준
  - 삭제 실패 시 부분 실패 복구 전략(재시도 큐 또는 사용자 재시도) 동작
  - 사진 orphan 파일 미발생
- 의존성: P3-04, P3-07

### P3-09. 보안 규칙/인덱스/운영 가이드
- 범위
  - Firestore/Storage 규칙 초안 코드화
  - 필요한 인덱스 정의
  - 운영자가 볼 체크리스트 정리
- 산출물
  - `firebase/firestore.rules` 또는 프로젝트 규칙 문서
  - `firebase/storage.rules` 또는 프로젝트 규칙 문서
  - 인덱스 정의 문서
  - `README.md` 운영 섹션 보강
- 완료 기준
  - uid 경계 접근 제어 시나리오 검토 완료
  - 배포 전 체크리스트(규칙/인덱스/환경변수) 완성
- 의존성: P3-02

### P3-10. 관측성/롤백 런북 추가
- 범위
  - 마이그레이션 성공/실패/재시도 이벤트 로깅 포인트 추가
  - `local <- remote` 롤백 절차 문서화
- 산출물
  - `docs/phase3-runbook.md` 신규
  - 로깅 유틸 또는 이벤트 훅 추가
- 완료 기준
  - 장애 대응 순서가 문서만으로 재현 가능
  - 롤백 플래그 변경 절차가 명확히 정의됨
- 의존성: P3-06, P3-07

## 권장 구현 순서
1. P3-01 -> P3-03 (타입/플래그 기반)
2. P3-02 -> P3-04 (저장소 구현)
3. P3-05 -> P3-06 (마이그레이션 엔진)
4. P3-07 -> P3-08 (UI 연결 + 삭제정책)
5. P3-09 -> P3-10 (운영 준비)

## PR 분할 전략
- PR-1: P3-01, P3-03
- PR-2: P3-02, P3-04
- PR-3: P3-05, P3-06
- PR-4: P3-07, P3-08
- PR-5: P3-09, P3-10

각 PR 완료 기준:
- `npm run lint`
- `npm run test:run`
- `npm run build`
- 변경된 설계/운영 문서 업데이트
