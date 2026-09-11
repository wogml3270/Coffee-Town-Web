# Coffee Town Supabase 초기화

`FINAL_RESET_AND_SCHEMA.sql`은 과거 마이그레이션을 별도로 실행하지 않고 Coffee Town의 최신 데이터베이스를 처음부터 다시 만드는 단일 파괴적 초기화 SQL입니다.

삭제되는 데이터:

- 프로필과 게임 진행도
- 조합법과 업그레이드 데이터
- 영업 결과, 개인 최고 점수와 랭킹 데이터

보존되는 데이터:

- `auth.users`와 Google Identity
- Supabase Auth Provider 설정
- Storage 객체와 버킷
- 프로젝트 URL과 API 키

Supabase SQL Editor에서 `FINAL_RESET_AND_SCHEMA.sql` 전체를 한 번에 실행하세요. 트랜잭션 안에서 실행되므로 중간 오류가 발생하면 삭제 작업도 롤백됩니다. 실행 후 기존 Auth 계정은 유지되지만 골드, 스테이지, 업그레이드, 레시피 발견과 점수는 모두 초기값으로 재생성됩니다.
