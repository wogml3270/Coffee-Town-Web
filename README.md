# Coffee Town Web

Coffee Town의 React/Vite 웹 게임입니다. Unity 프로젝트에서 분리되어 웹 앱, Vercel 설정, Supabase 스키마를 한 디렉터리에서 관리합니다.

Node.js 24.x를 사용합니다. `.nvmrc`와 `package.json`의 `engines`가 Vercel Production 런타임과 같은 major 버전을 지정합니다.

## Local development

```bash
npm ci
cp .env.example .env
npm run dev
```

필수 공개 환경변수:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

브라우저 번들에 포함되므로 service-role key는 절대 `VITE_*` 변수에 넣지 않습니다.

## Validation

```bash
npm run verify
npm run verify:supabase
vercel build
```

`verify`는 TypeScript, Vitest, production build를 순서대로 실행합니다. `verify:supabase`는 자격증명 값을 출력하지 않고 Auth health와 RLS가 적용된 공개 업그레이드 카탈로그를 확인합니다.

## Deployment

프로젝트 루트의 `vercel.json`이 Vite build, `dist` 출력, SPA rewrite를 모두 고정합니다. `/auth/callback`도 `index.html`로 rewrite되며 앱이 OAuth code/hash를 처리합니다.

현재 로컬 `.vercel/project.json`은 기존 Vercel 프로젝트 `coffee-town`을 계속 가리킵니다. Git 자동 배포를 새 독립 저장소로 완전히 전환하려면 [DEPLOYMENT.md](./DEPLOYMENT.md)의 cutover 항목을 따릅니다.

## Supabase

SQL 마이그레이션과 seed는 `supabase/`에 있습니다. OAuth와 Redirect URL 설정은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참고하세요.
