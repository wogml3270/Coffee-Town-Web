import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requirePublicEnv = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const getSupabase = () => {
  if (client) return client;
  client = createClient(
    requirePublicEnv(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
    requirePublicEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, "VITE_SUPABASE_ANON_KEY"),
  );
  return client;
};

export type SaveProgressResult = Readonly<{
  success: boolean;
  error: string | null;
}>;

export const saveUserProgress = async (
  userId: string,
  gold: number,
  recipes: readonly string[],
): Promise<SaveProgressResult> => {
  const { error } = await getSupabase().from("user_progress").upsert(
    {
      user_id: userId,
      gold,
      unlocked_recipes: [...recipes],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { success: error === null, error: error?.message ?? null };
};
