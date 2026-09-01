# Coffee Town Supabase 초기화

`migrations/202608310001_profiles_and_progress.sql`은 기존 Coffee Town 공개 게임 테이블과 그 데이터를 삭제하고 `profiles`, `user_progress`만 다시 생성하는 파괴적 초기화 SQL입니다.

삭제되는 데이터:

- 기존 프로필과 게임 진행도
- 재료·레시피·설비 카탈로그
- 인벤토리·업그레이드·게임 세션 데이터

보존되는 데이터:

- `auth.users`와 Google Identity
- Supabase Auth Provider 설정
- Storage 객체와 버킷
- 프로젝트 URL과 API 키

Supabase SQL Editor에서 파일 전체를 한 번에 실행하세요. 트랜잭션 안에서 실행되므로 중간 오류가 발생하면 삭제 작업도 롤백됩니다.
