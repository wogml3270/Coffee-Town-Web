# Deployment

## Vercel contract

- Framework: Vite
- Runtime: Node.js 24.x
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- SPA fallback: every route rewrites to `/index.html`
- OAuth callback: `/auth/callback`

## Required Vercel variables

Production requires both variables below:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Preview and Development should be configured separately if those deployments must use Supabase. Do not reuse Production credentials in untrusted preview branches without deciding that policy explicitly.

## Git cutover

The existing Vercel project is connected to GitHub `wogml3270/Coffee-Town`, branch `main`, with repository Root Directory `.`. This extracted directory has its own local Git history but no remote yet.

To move Git deployments without downtime:

1. Create a new GitHub repository for this directory and push its `main` branch.
2. In Vercel, connect the existing `coffee-town` project to the new repository.
3. Keep Vercel Root Directory as `.`.
4. Confirm a Preview build first.
5. Promote a successful build or merge to `main`.
6. Verify `/` and `/auth/callback`, then remove the old compatibility source.

Until step 2 is complete, the former repository path must remain available for the current Git pipeline.
