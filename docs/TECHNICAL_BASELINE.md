# Technical Baseline

## 2026-08-24 기준

- Repository: `git@github.com:wogml3270/Coffee-Town-Web.git`
- Production branch: `main`
- Runtime: Node.js 24.x
- UI: React 19 + TypeScript + Tailwind CSS
- Build: Vite 7
- Test: Vitest
- Backend: Supabase Auth, Postgres, Realtime
- Hosting: Vercel

## 현재 유지할 기능

- Google/Kakao/anonymous authentication
- 게스트 진행 스냅샷
- 회원 진행도와 업그레이드 저장
- 영업 세션 생성·동기화·포기 처리
- 주문, 레시피 단계, 골드, XP, 레벨 reducer
- 기존 16개 단위 테스트

## 현재 개선할 구조

- `App.tsx`에 하드코딩된 레시피와 업그레이드 정의를 `src/content`로 이동한다.
- 인증·진행도·영업 세션 orchestration을 화면 컴포넌트에서 hook/service 경계로 분리한다.
- 실제 플레이 장면은 React DOM에서 PixiJS canvas로 단계적으로 교체한다.
- React는 로그인, 카페 홈, HUD, 결과 화면을 담당한다.
- 게임 엔진은 PixiJS 타입을 참조하지 않는 순수 TypeScript 모듈로 유지한다.

## 품질 명령

```bash
npm ci
npm run verify
npm run verify:supabase
vercel build --prod
```

`verify:supabase`는 로컬 또는 명시한 env 파일을 사용해 Auth health와 공개 업그레이드 카탈로그를 읽기 전용으로 검사한다.
