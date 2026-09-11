# Coffee Town Three

Three.js와 React Three Fiber로 제작한 3D 카페 운영 게임입니다. 플레이어는 카페를 이동하며 설비에서 재료를 생산하고, 레시피에 맞게 조합해 손님에게 판매합니다.

현재 패키지 버전은 **0.6.0**이며 공식 배포 주소는 [coffee-town-three.vercel.app](https://coffee-town-three.vercel.app)입니다.

## 다음 개발자를 위한 현재 상태

마지막 인수인계 기준일은 **2026-09-11**입니다.

- 작업 브랜치: `main`
- 원격 저장소: `git@github.com:wogml3270/Coffee-Town-Web.git`
- Supabase 프로젝트: `https://bsbtwhuykfvtcftnbqlm.supabase.co`
- `supabase/FINAL_RESET_AND_SCHEMA.sql` 원격 DB 적용 완료
- 기존 Supabase Auth 계정과 Google·Kakao OAuth 설정은 유지됨
- 게임 진행도, 업그레이드, 레시피, 점수·랭킹 테이블은 최종 스키마 기준으로 초기화됨
- 진행도 동기화·영업 정산·업그레이드 구매는 계정별 동기화 큐와 서버 검증 정산을 사용함
- 전체 재료·가공 재료·베이스·완성 음료 **54종**에 SVG 아이콘이 있음
- 마지막 검증: Vitest **49개 통과**, TypeScript 검사 및 Vite 프로덕션 빌드 성공
- 초기 JavaScript 청크는 약 **477 kB**이며 3D 장면과 Three.js는 지연·분리 로딩함

다음 작업자는 작업을 시작하기 전에 반드시 아래를 확인해야 합니다.

```bash
git status --short
git diff --check
npm test
npm run build
```

현재 변경사항을 임의로 되돌리거나 과거 SQL 마이그레이션을 다시 실행하면 안 됩니다. 먼저 현재 diff를 검토한 뒤 하나의 기준 커밋으로 정리하는 것이 안전합니다.

## 빠른 실행

요구 사항은 최신 LTS Node.js와 npm입니다.

```bash
npm install
npm run dev
```

GLB 원본 생성 스크립트를 수정했거나 모델을 모두 다시 만들 때만 다음 명령을 실행합니다.

```bash
npm run assets:generate

# catalog.ts의 모든 ItemId SVG 아이콘 재생성
npm run assets:icons
```

이 명령은 `public/assets/models/`의 생성형 GLB 파일을 덮어쓰므로, 단순 실행이나 UI 작업 중에는 실행할 필요가 없습니다.

사용 가능한 명령은 다음과 같습니다.

```bash
npm run dev          # Vite 개발 서버
npm test             # Vitest 전체 테스트
npm run build        # TypeScript 검사 + 프로덕션 빌드
npm run format       # Prettier 적용
npm run format:check # 포맷 검사
npm run preview      # 프로덕션 빌드 미리보기
```

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`.env.local`은 Git에 커밋하지 않습니다. 브라우저에 노출되면 안 되는 `service_role` 키도 프론트엔드 환경 변수에 절대 넣지 않습니다.

## 기술 구성

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- React Three Drei
- Zustand
- Supabase Auth·Postgres·RPC
- Vitest
- Prettier

## 주요 코드 구조

```text
src/
├── App.tsx                         화면 전환, HUD, 모달, 인벤토리, 로비
├── controls.css                    게임 HUD·모달·인벤토리·성장 트리 스타일
├── styles.css                      전역 화면·로비 스타일
├── audio/
│   └── soundPlayer.ts              BGM 전환과 Web Audio 효과음
├── game/
│   ├── catalog.ts                  아이템, 메뉴, 설비, 조합법, 단계 색상
│   ├── rules.ts                    영업·설비·조합·서빙·점수 순수 함수
│   ├── store.ts                    Zustand 게임 상태와 Local-First 정산
│   ├── movement.ts                 이동과 충돌 계산
│   └── upgradeTree.ts              업그레이드 노드·가격·선행 조건
├── scene/
│   └── CafeScene.tsx               3D 맵, 카메라, 캐릭터, 손님, 설비
└── services/
    ├── authService.ts              Google·Kakao OAuth와 프로필
    ├── progressService.ts          로그인 사용자 진행도 동기화
    ├── recipeService.ts            DB·코드 조합법 병합
    ├── upgradeService.ts           업그레이드 카탈로그와 구매 RPC
    ├── scoreService.ts             영업 점수 저장 RPC
    ├── rankingService.ts           랭킹 조회 RPC
    └── supabaseClient.ts           Supabase 브라우저 클라이언트

public/assets/
├── audio/                          HYP MUSIC BGM
├── concepts/                       카페 비주얼 방향 이미지
└── models/                         스테이지·설비·캐릭터 GLB

supabase/
├── FINAL_RESET_AND_SCHEMA.sql      현재 DB의 단일 최종 기준 스키마
├── RESET_WARNING.md                초기화 범위와 주의사항
└── migrations/                     개발 이력용 과거 증분 SQL
```

## 데이터 저장 원칙

게임은 **Local-First** 방식입니다.

- 비로그인 사용자는 진행도를 브라우저 로컬 스토리지에만 저장합니다.
- 로그인하면 게스트 로컬 진행도를 제거하고 로그인 계정의 DB 진행도만 사용합니다.
- 영업 중 설비 작동, 인벤토리, 조합, 주문 처리는 Supabase를 호출하지 않습니다.
- 로그인 영업은 `begin_shift_session`으로 서버가 시드와 업그레이드를 발급합니다.
- 영업 행동은 슬롯 기반 기록으로 남기며, 마감 시 `settle-shift`가 서버에서 재현·검증한 뒤 골드와 점수를 정산합니다.
- 네트워크가 끊기면 미전송 영업 기록을 계정별 로컬 큐에 보관하고 다음 연결 때 한 번만 재전송합니다.
- 정상 마감은 골드를 보존하고 다음 스테이지를 해금합니다.
- 조기 마감은 현재까지 번 골드만 보존하고 다음 스테이지는 해금하지 않습니다.
- 업그레이드 구매는 `purchase_upgrade` RPC가 선행 조건 검사, 골드 차감, 레벨 상승을 한 트랜잭션으로 처리합니다.
- 검증된 영업 점수는 `verified_stage_best_scores`만 랭킹에 반영합니다.

## Supabase 최종 스키마

원격 DB에는 [FINAL_RESET_AND_SCHEMA.sql](./supabase/FINAL_RESET_AND_SCHEMA.sql)이 적용된 상태입니다. 과거 `supabase/migrations/` 파일을 다시 실행하지 마십시오.

최종 스키마의 주요 객체:

- `profiles`: 이메일, 닉네임, 프로필 이미지
- `user_progress`: 골드, 해금 스테이지, 발견 레시피, 메뉴 안내 확인 여부
- `recipe_combinations`: 두 재료를 합치는 조합법
- `upgrade_categories`, `upgrade_nodes`, `upgrade_levels`, `upgrade_prerequisites`
- `player_upgrades`: 사용자별 업그레이드 레벨
- `shift_results`: 개별 영업 결과
- `stage_best_scores`: 사용자·스테이지별 최고 점수
- `shift_sessions`: 서버 발급 영업 시드·업그레이드·중복 정산 방지 상태
- `verified_stage_best_scores`: 서버 재현 검증을 통과한 개인 최고 점수
- `begin_shift_session(integer, integer)`
- `purchase_upgrade(text)`
- `commit_verified_shift(uuid, uuid, jsonb)` (service role 전용)
- `get_leaderboard(integer)`

`auth.users`, `auth.identities`, Storage와 OAuth 설정은 최종 SQL의 삭제 대상이 아닙니다.

기존 운영 DB에는 [verified settlement migration](./supabase/upgrades/202609110005_verified_shift_settlement.sql)을 한 번 적용하고, Supabase Edge Function `settle-shift`를 배포해야 합니다. 이 마이그레이션은 기존 데이터를 삭제하지 않습니다. `FINAL_RESET_AND_SCHEMA.sql`은 새 환경을 처음 만들 때만 사용하며, 실행 시 닉네임, 골드, 스테이지, 발견 레시피, 업그레이드, 점수와 랭킹이 모두 삭제됩니다.

## OAuth 및 배포 설정

공식 도메인은 `coffee-town-three.vercel.app`입니다.

Google Cloud와 Kakao Developers의 공급자 콜백 URI:

```text
https://bsbtwhuykfvtcftnbqlm.supabase.co/auth/v1/callback
```

Supabase Auth URL Configuration:

```text
Site URL
https://coffee-town-three.vercel.app

Redirect URLs
https://coffee-town-three.vercel.app/auth/callback
http://localhost:5173/auth/callback
```

애플리케이션은 현재 origin의 `/auth/callback`을 `redirectTo`로 사용하며, Vercel의 SPA rewrite는 `vercel.json`에서 처리합니다.

## 현재 게임 규칙

- 스테이지는 총 15일입니다.
- 첫 영업부터 아메리카노, 아이스 아메리카노, 카페라떼, 아이스 카페라떼가 등장합니다.
- 이후 스테이지마다 메뉴가 하나씩 추가되어 최종적으로 18개 메뉴가 주문됩니다.
- 신규 메뉴 안내는 게스트 또는 로그인 계정마다 해당 스테이지 최초 1회만 표시합니다.
- 주문은 매 영업마다 무작위로 생성하며 최대 3명을 미리 대기시킵니다.
- 한 영업은 현실 6분 동안 게임 시간 `09:00 → 21:00`로 진행됩니다.
- 주문 다섯 번 연속 성공 시 기본 15초 피버가 발동합니다.
- 피버 중 제조시간이 1초로 줄고, 이동속도가 증가하며, 설비 작동 중에도 이동할 수 있습니다.
- 피버 주문 골드는 기본 3배이며 업그레이드 효과가 추가됩니다.
- 골드와 별도로 영업 점수를 계산하고, 스테이지별 개인 최고 점수의 합계로 랭킹을 정합니다.

## 조작법

### PC

- `WASD` 또는 방향키: 카메라 기준 8방향 이동
- 바닥 클릭: 클릭한 위치로 이동
- 마우스 드래그: 카메라 회전
- `Space`: 가까운 설비와 상호작용
- `Enter`: 선택 재료와 인벤토리의 유효한 재료 조합
- `1`~`9`: 인벤토리 슬롯 직접 선택
- `Backspace` 또는 `Delete`: 선택 재료 삭제
- `B` 또는 한글 입력 상태의 `ㅠ`: 레시피 도감 열기·닫기
- 냉장고 패널 `1`~`9`, `0`: 해당 재료 꺼내기
- `Esc`: 열린 냉장고 또는 모달 닫기

### 모바일

- 바닥 터치: 해당 위치로 이동
- `작업`: 가까운 설비와 상호작용
- `조합`: 선택한 인벤토리 재료 조합
- 인벤토리 슬롯 터치: 재료 선택
- 슬롯 우측 상단 `×`: 재료 삭제

## 설비와 제조

설비는 `IDLE → PROCESSING → READY` 상태를 가집니다. 제조를 시작한 뒤 진행 게이지가 끝나면 같은 설비와 다시 상호작용해 결과물을 회수합니다. 결과 회수 후 별도 쿨타임은 없습니다.

- 그라인더: 분쇄 원두
- 에스프레소 머신: 분쇄 원두를 에스프레소로 추출
- 일체형 스팀 완드: 우유를 스팀 밀크로 가공
- 컵 선반: 컵 즉시 지급
- 정수기: 뜨거운 물·차가운 물
- 재료 냉장고: 우유, 오트밀크, 시럽, 청, 소스, 파우더, 바닐라빈
- 제빙기: 얼음
- 탄산수 머신: 탄산수
- 콜드브루 타워: 콜드브루 원액
- 블렌더: 선택한 맛 베이스와 인벤토리의 우유·얼음을 함께 소비
- 픽업 벨: 선택한 완성 음료 서빙

스팀 완드는 독립 GLB가 아니라 에스프레소 머신에 결합된 연출을 사용합니다.

## 조합법 관리 규칙

조합법의 실제 코드 기준은 [catalog.ts](./src/game/catalog.ts)입니다.

- `recipeGroups`: `Enter`로 처리하는 두 재료 조합
- `stationProcesses`: 설비가 처리하는 생산·가공 규칙
- `menuCatalog`: 메뉴명, 해금 스테이지, 판매 가격과 전체 설명
- `recipeTierGroups`: 인벤토리와 레시피 도감의 단계 색상

같은 결과물을 만드는 코드 조합이 있으면 코드 정의가 DB의 오래된 조합을 대체합니다. DB는 운영 중 추가되는 별도 결과물 조합을 공급할 수 있습니다.

단계 색상 기준:

1. 초록색: 기본 재료
2. 청록색: 1차 가공
3. 보라색: 중간 베이스
4. 주황색: 일반 완성 음료
5. 금색: 시그니처·블렌디드 완성품

인벤토리 슬롯, 선택 강조, 번호 배지, 냉장고 버튼, 도감 탭과 레시피 카드가 같은 단계 색상을 사용합니다.

대체 제조법은 도감에서 한 줄에 하나씩 표시합니다. 예를 들어 아이스 에스프레소는 다음 두 경로를 모두 허용합니다.

```text
- 에스프레소 컵 + 얼음
- 얼음 컵 + 에스프레소
```

## 블렌더 규칙

과거의 `모카 블렌딩 베이스`, `바닐라 블렌딩 베이스` 같은 별도 아이템은 제거했습니다. 현재 블렌더는 맛 베이스를 선택하고 우유와 얼음을 실제 인벤토리에서 추가로 찾아 세 재료를 모두 소비합니다.

```text
카페모카 아이스 블렌디드
모카 베이스 + 우유 + 얼음 → 블렌더

바닐라 아이스 블렌디드
바닐라 베이스 + 우유 + 얼음 → 블렌더

말차 아이스 블렌디드
말차 베이스 + 우유 + 얼음 → 블렌더

초콜릿 아이스 블렌디드
초콜릿 베이스 + 우유 + 얼음 → 블렌더
```

사용 순서:

1. 맛 베이스를 만든다.
2. 우유와 얼음을 인벤토리에 준비한다.
3. 맛 베이스 슬롯을 선택한다.
4. 블렌더 앞에서 `Space` 또는 모바일 `작업` 버튼을 누른다.
5. 제조 완료 후 블렌더와 다시 상호작용해 음료를 회수한다.

우유 또는 얼음이 없으면 부족한 재료를 안내하고 어떤 재료도 소비하지 않습니다. 이 공정은 재료가 세 개이므로 `recipe_combinations`의 이진 DB 행이 아니라 `stationProcesses`에서 처리합니다.

## 레시피 발견과 메뉴 안내

- 스테이지가 열렸다고 레시피가 자동 공개되지는 않습니다.
- 실제 조합에 처음 성공했을 때만 도감에 제조법이 공개됩니다.
- 발견 상태는 게스트 로컬 저장 또는 로그인 사용자의 `discovered_recipes`에 저장됩니다.
- 신규 메뉴 모달 확인 상태는 `seen_menu_stages`에 저장됩니다.
- 로그인 계정은 여러 기기에서 DB 상태를 사용하고, 게스트는 현재 브라우저에만 저장됩니다.

## 업그레이드와 랭킹

업그레이드는 설비, 바리스타, 피버, 서비스, 자동화 트리로 나뉩니다.

- 설비 정비
- 에스프레소 튜닝
- 콜드 바 튜닝
- 이동 훈련
- 멀티태스킹
- 피버 충전·지속·매출 증폭
- 서비스 교육·콤보 보호
- 오토 바리스타 모듈: `10,000,000G`
- 스마트 픽업 시스템: `50,000,000G`

클라이언트의 기본 노드 정의는 [upgradeTree.ts](./src/game/upgradeTree.ts)에 있으며 로그인 사용자의 가격과 선행 조건은 Supabase 카탈로그를 불러옵니다.

랭킹은 보유 골드가 아니라 각 스테이지의 개인 최고 영업 점수를 합산해 계산합니다. 주문 난이도, 제조 속도, 만족도, 콤보와 피버 보너스를 반영하며 실수와 재료 폐기는 최종 정산 점수에 영향을 줍니다.

## 3D 에셋과 스테이지

`public/assets/models/`에는 15개 스테이지 셸, 설비, 바리스타, 서로 다른 손님, 출입문과 테이블 GLB가 있습니다. `CafeScene.tsx`가 스테이지별 카페 셸과 설비·좌석 배치 변형을 선택합니다.

에셋 생성 원본은 `scripts/generate-glb-assets.mjs`입니다. GLB를 직접 수정한 경우 이 스크립트를 실행하면 수동 수정이 덮어써질 수 있으므로 먼저 차이를 확인해야 합니다.

## 음악과 라이선스

현재 포함된 BGM:

- HYP - Full Of Sunshine
- HYP - What Happened
- HYP - Spring Has Come
- HYP - ggoomma song
- HYP - Sugar In My Coffee

로비·결과·업그레이드와 스테이지 구간에 맞춰 음악을 교체하며 피버 중에는 믹스가 강화됩니다. 브라우저 자동 재생 정책 때문에 최초 사용자 입력 전에는 소리가 재생되지 않을 수 있습니다.

게임 영상이나 음원을 외부에 사용할 때는 [CREDITS.md](./CREDITS.md)의 필수 출처 문구를 그대로 표기해야 합니다.

## 아이템 SVG와 레시피 이미지

`src/game/itemArtwork.ts`가 카탈로그의 모든 `ItemId`에 대한 용기·색상·얼음·거품·장식 정의를 보유합니다. `npm run assets:icons`는 이 정의를 바탕으로 `public/assets/items/*.svg` 54개와 전체 목록 미리보기 [docs/item-artwork.html](./docs/item-artwork.html)을 생성합니다.

아이콘은 인벤토리 슬롯, 냉장고·정수기 선택, 주문 HUD, 신규 메뉴 안내, 레시피 도감과 레시피 재료 경로에 공통으로 사용합니다.

## 검증과 알려진 기술 부채

- `npm test`: 마지막 실행에서 49개 테스트 통과
- `npm run build`: TypeScript와 Vite 빌드 성공
- Vite 빌드 결과 초기 JS 청크는 약 477 kB이며 3D 장면은 별도 청크로 분리됨
- 서버 정산을 사용하려면 운영 Supabase에 verified settlement migration과 Edge Function 배포가 필요함
- 최근 블렌더와 레시피 단계 변경은 자동 테스트를 통과했지만 PC·모바일 실제 플레이 동선 QA가 필요함
- UI와 3D 배치는 화면비마다 육안 검증해야 함
- `public/assets/models/`에 생성 결과물이 많으므로 무관한 GLB를 일괄 재생성하지 말 것
- 현재 작업 트리는 정리되지 않았으므로 변경 파일을 전부 검토하기 전 일괄 커밋하지 말 것

## 버전 기록

### 0.6.0 — Cafe Growth Tree Update

- 원형 아이콘 기반 설비·바리스타·피버·서비스·자동화 성장 트리
- Supabase 업그레이드 카탈로그, 선행 조건과 원자적 구매 RPC
- 영업 점수와 스테이지별 최고 기록 기반 랭킹
- 설비 작업 HUD 진행 게이지
- 레시피 도감과 인벤토리의 5단계 색상 체계
- 조합 단계·명칭 재정리와 복수 제조 경로 표시
- 실제 우유와 얼음을 소비하는 블렌더 3재료 공정
- 단일 최종 Supabase 초기화 스키마

### 0.5.0 — Business Day & Recipe Archive Update

- 09:00~21:00 영업 루프와 조기 마감
- 15개 스테이지와 18개 메뉴
- 실제 조합 성공 시 공개되는 레시피 도감
- 3명 주문 대기열과 손님 입장·착석·음용·퇴장

### 0.4.0 — Social & Stage Music Update

- Google·Kakao OAuth와 공통 PKCE 콜백
- 로그인 프로필, 닉네임과 진행도 동기화
- 스테이지·로비·피버 BGM과 볼륨 옵션
- 공식 도메인을 `coffee-town-three.vercel.app`으로 통일

### 0.3.0 — Supabase Profile Update

- Supabase 브라우저 클라이언트와 사용자별 RLS
- 게스트와 로그인 사용자의 저장 영역 분리
- Local-First 영업 정산

### 0.2.0 — Sound & Automation Update

- 설비·조합·동전·UI·발걸음 효과음
- 피버 모드와 자동 조합 업그레이드

### 0.1.0 — Playable 3D Prototype

- React Three Fiber 기반 카페와 캐릭터 이동
- 설비 제조, 인벤토리 조합과 주문 판매
