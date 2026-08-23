# Supabase setup for Coffee Town Web

1. Enable Anonymous Sign-Ins under Supabase Authentication providers.
2. Configure Google and Kakao to use Supabase's provider callback:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
3. Add these Supabase Authentication Redirect URLs:
   - `https://coffee-town-pink.vercel.app/auth/callback`
   - `http://localhost:5173/auth/callback`
   - any explicitly trusted Vercel Preview callback URLs
4. Copy `.env.example` to `.env` and set the project URL and publishable/anon key.
5. Apply the schema and seed:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db seed
```

The migrations enable RLS for player-owned data and public read policies for catalog data. Never expose a service-role key through `VITE_*`.
