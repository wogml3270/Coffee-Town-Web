# Coffee Town Three

현재 버전: **0.5.0 — Business Day & Recipe Archive Update**

Coffee Town을 Three.js·React Three Fiber로 처음부터 다시 구축하는 독립 프로토타입입니다. 기존 Unity·React 저장소와 연결되지 않으며, 검증 뒤 인증·Vercel·Supabase를 이전할 수 있도록 Local-First 구조로 구성합니다.

```bash
npm install
npm run assets:generate
npm run dev
```

`.env.local`에는 다음 공개 클라이언트 환경 변수를 설정합니다.

```bash
VITE_SUPABASE_URL=https://bsbtwhuykfvtcftnbqlm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

신규 설치는 `supabase/migrations/202608310001_profiles_and_progress.sql`부터 날짜 순서대로 실행합니다. 기존 DB에는 `supabase/migrations/202609020001_recipe_combinations.sql`을 추가 실행하면 게임 조합법 32개가 DB에 저장됩니다. 클라이언트는 로비에서 조합법을 한 번 읽고 영업 중에는 로컬 스냅샷만 사용하며, 조회 실패 시 번들 기본값으로 안전하게 대체합니다.

배포 주소: **https://coffee-town-three.vercel.app**

Google OAuth 설정:

- Google Cloud 승인된 리디렉션 URI: `https://bsbtwhuykfvtcftnbqlm.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://coffee-town-three.vercel.app`
- Supabase Redirect URLs: `https://coffee-town-three.vercel.app/auth/callback`, 로컬 개발용 `http://localhost:5173/auth/callback`
- Vercel SPA 콜백은 `vercel.json` rewrite가 처리합니다.

Kakao OAuth 설정:

- Kakao Developers Redirect URI: `https://bsbtwhuykfvtcftnbqlm.supabase.co/auth/v1/callback`
- Kakao Developers Web 도메인: `https://coffee-town-three.vercel.app`
- Supabase Authentication Providers에서 Kakao를 활성화하고 REST API Key와 Client Secret을 입력합니다.
- 닉네임·프로필 사진을 사용하려면 Kakao 동의항목의 프로필 정보를 활성화합니다.

## 조작법

- `WASD` 또는 방향키: 선택한 바리스타 이동
- `Space`: 가까운 설비와 상호작용
- `1`~`9`: 해당 번호 인벤토리 슬롯 직접 선택
- 냉장고가 열린 동안 `1`~`9`, `0`: 최대 10개 재료 즉시 선택 (`Esc`: 닫기)
- `Enter`: 선택 재료와 인벤토리의 유효한 재료 조합
- 마우스 짧게 클릭: 클릭한 바닥 위치로 이동
- 마우스 드래그: 3D 카메라 회전
- 두 방향키 동시 입력: 카메라 기준 대각선 이동
- 인벤토리 슬롯 클릭: 사용할 아이템 직접 선택

스팀 완드는 별도 오브젝트가 아니라 에스프레소 머신에 결합되어 있습니다.

## 전용 GLB 에셋

`public/assets/models/`에는 확장형 카페 셸, 설비와 캐릭터를 독립 GLB로 저장합니다. `scripts/generate-glb-assets.mjs`는 같은 에셋을 결정적으로 다시 생성하는 원본 빌드 스크립트입니다.

현재 GLB 목록: 확장 카페 맵, 그라인더, 에스프레소 머신/일체형 스팀 완드, 컵 선반, 온수기, 냉수기, 통합 재료 냉장고, 제빙기, 탄산수 머신, 콜드브루 타워, 블렌더, 픽업 벨, 바리스타와 손님.

현재 플레이 버전에서는 우유 전용 냉장고와 개별 과일청 통을 하나의 바닥형 `ingredient-fridge.glb`로 통합했습니다. 냉장고 상호작용 패널에서 우유와 스테이지별 과일청을 즉시 꺼내며, 컵 선반 역시 제조 시간이나 재사용 대기시간 없이 바로 사용합니다. 설비 작업 완료 후 쿨타임은 없고, 업그레이드는 제조·이동 속도와 피버 진입·지속시간, 팁 보너스에 집중합니다.

## 현재 플레이 루프

1. 생성 설비 앞에서 `Space`를 눌러 제조를 시작하고, 완료 후 다시 눌러 결과물을 회수합니다.
2. 작업 중에는 캐릭터 이동이 잠기며 설비의 회전 링·발광·진행률로 상태를 확인합니다.
3. 재료를 선택하고 에스프레소 머신 또는 스팀 완드에서 가공합니다.
4. 재료 하나를 선택하고 `Enter`를 눌러 인벤토리의 유효한 상대 재료와 조합합니다.
5. 완성 음료를 선택하고 픽업 벨에서 `Space`를 눌러 주문을 완료합니다.
6. 5콤보 달성 시 15초간 피버가 발동합니다.

한 영업일은 현실 6분 동안 게임 시간 `09:00 → 21:00`로 진행됩니다. 21:00에 마감 정산 UI가 열리고 정상 마감하면 다음 영업일이 해금됩니다. `조기 마감`을 선택하면 그 시점까지 획득한 골드는 전액 보존되지만 다음 영업일은 해금되지 않습니다.

제조 설비는 `IDLE → PROCESSING → READY` 상태를 가지며 결과물을 회수하는 즉시 다시 사용할 수 있습니다. 주문과 연결된 손님은 카페로 입장해 카운터에서 기다리고, 음료를 받으면 퇴장한 뒤 다음 손님이 들어옵니다. 모바일에서는 바닥 탭 이동과 우측 하단 `작업`·`조합` 버튼을 사용합니다.

## 메뉴 및 성장

- 총 15개 영업일과 15개 실제 카페 메뉴
- 따뜻한/아이스 아메리카노, 카페라떼, 아이스 라떼, 바닐라 라떼, 카페모카, 카라멜 마키아토
- 레몬·자몽 에이드, 유자차, 말차·초콜릿 라떼, 콜드브루, 바닐라빈 오트 콜드브루, 카페모카 아이스 블렌디드
- 각 영업일마다 신규 메뉴 하나와 필요한 냉장 재료·설비가 순차 해금
- 레시피 도감은 미발견 메뉴를 `?`로 표시하고 최초 조합 성공 시 영구 공개
- 업그레이드: 제조시간, 캐릭터 이동속도, 피버 진입 콤보, 피버 지속시간, 팁 보너스
- 프리미엄 자동화: 50,000G로 해금하며, 획득한 재료가 유효한 레시피를 이루면 자동 조합
- 영업일: 목표 잔 수 없이 09:00~21:00 자유 영업

피버 중에는 골드가 3배가 되고 제조시간이 즉시 단축되며, 설비가 작동하는 동안에도 캐릭터가 1.65배 속도로 움직일 수 있습니다. 로비·결과·업그레이드 화면은 `HYP - Full Of Sunshine`, 스테이지 1~4, 5~8, 9~12는 각각 다른 HYP MUSIC 테마곡을 사용합니다. 화면이 바뀌면 해당 테마로 즉시 교체되며 피버 진입 시 템포와 믹스가 강화됩니다. 전역 사운드 옵션에서 BGM을 끄고 켤 수 있으며 설정은 브라우저에 유지됩니다. 설비 시작·완료, 조합, 판매 동전, UI 버튼, 캐릭터 발걸음 효과음은 Web Audio API로 실시간 합성합니다.

## 음악 라이선스

게임에 포함된 음원은 HYP MUSIC이 제공한 곡입니다. 영상에 게임 화면 또는 음원을 사용할 경우 [CREDITS.md](./CREDITS.md)의 필수 출처 문구를 그대로 표기해야 합니다.

전용 콘셉트 이미지는 `public/assets/concepts/coffee-town-cafe-direction-v1.png`에 보관합니다.

## 버전 기록

### 0.5.0 — Business Day & Recipe Archive Update

- 목표 주문 수를 제거하고 09:00~21:00 6분 영업일 루프로 전환
- 21시 정상 마감 시 다음 날 해금, 조기 마감 시 골드만 보존
- 실제 카페 음료 15개와 단계별 신규 메뉴·재료·설비 해금
- 미발견 조합을 물음표로 표시하는 레시피 도감과 Local-First 발견 저장
- 주문과 연동되는 3D 손님 입장·대기·퇴장 동선
- 냉수기, 콜드브루 타워, 블렌더 GLB 설비 추가

### 0.4.0 — Social & Stage Music Update

- Google 옆 Kakao OAuth 로그인 및 공통 PKCE 콜백 처리
- 로그인 사용자 프로필 아이콘과 내 정보 모달
- 공식 배포 주소를 `coffee-town-three.vercel.app`으로 통일
- 냉장고 `1`~`9`, `0` 재료 선택과 입력 충돌 방지
- HYP MUSIC 3곡을 스테이지 구간별 BGM으로 적용하고 피버 믹스 전환
- `HYP - What Happened`를 로비·결과·업그레이드 전용 BGM으로 추가
- 로비 테마를 `HYP - Full Of Sunshine`으로 교체하고 전역 BGM ON/OFF 옵션 추가
- 영업 중 나가기 시 현재까지 획득한 골드를 안전하게 정산하고 중복 지급 방지
- 설비 작동·완료 모션과 프로필·냉장고 UI 전환 애니메이션 강화
- 음원 필수 출처 문구와 라이선스 문서 추가

### 0.3.0 — Supabase Profile Update

- Supabase publishable client와 PKCE 세션 연결
- Google 소셜 로그인과 `/auth/callback` 처리
- Google 프로필 사진·이메일 동기화 및 로비 프로필 카드
- 최초 플레이 닉네임 설정 UI와 사용자별 닉네임 저장
- `profiles`, `user_progress` 신규 SQL 스키마와 사용자 소유 RLS
- 로그인 사용자의 골드·스테이지·업그레이드 Local-First 동기화

### 0.2.0 — Sound & Automation Update

- 카페 BGM과 피버 전용 BGM 전환
- 설비·조합·동전·UI·발걸음 합성 효과음
- 화면 진입, 주문 교체, 인벤토리 획득, 냉장고, 피버 UI 애니메이션
- 50,000G 오토 바리스타 자동 조합 업그레이드
- 총 12개 스테이지로 확장
- 누적 보유 골드 HUD와 무작위 주문 흐름

### 0.1.0 — Playable 3D Prototype

- React Three Fiber 기반 3D 카페와 캐릭터 이동
- 설비 제조, 인벤토리, 레시피 조합, 주문 판매
- 통합 재료 냉장고와 Local-First 진행 데이터
- 스테이지·피버·기본 업그레이드 시스템
