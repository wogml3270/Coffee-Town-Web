import { getSupabase } from "./supabaseService";

export type PlayerProgress = Readonly<{
  gold: number;
  xp: number;
  level: number;
  unlockedRecipes: readonly string[];
}>;

export type UserUpgrade = Readonly<{ upgradeId: string; level: number }>;

export const loadPlayerProgress = async (
  userId: string,
): Promise<Readonly<{ progress: PlayerProgress; upgrades: readonly UserUpgrade[] }>> => {
  const supabase = getSupabase();
  const [progressResult, upgradesResult] = await Promise.all([
    supabase
      .from("user_progress")
      .select("gold,xp,level,unlocked_recipes")
      .eq("user_id", userId)
      .single(),
    supabase.from("user_upgrades").select("upgrade_id,level").eq("user_id", userId),
  ]);
  if (progressResult.error) throw progressResult.error;
  if (upgradesResult.error) throw upgradesResult.error;
  return {
    progress: {
      gold: Number(progressResult.data.gold),
      xp: Number(progressResult.data.xp),
      level: Number(progressResult.data.level),
      unlockedRecipes: progressResult.data.unlocked_recipes ?? [],
    },
    upgrades: (upgradesResult.data ?? []).map((upgrade) => ({
      upgradeId: upgrade.upgrade_id,
      level: upgrade.level,
    })),
  };
};

export const persistPlayerProgress = async (
  userId: string,
  progress: Readonly<{ gold: number; xp: number; level: number }>,
): Promise<void> => {
  const { error } = await getSupabase().from("user_progress").update({
    gold: progress.gold,
    xp: progress.xp,
    level: progress.level,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  if (error) throw error;
};

export const persistUpgrade = async (
  userId: string,
  upgradeId: string,
  level: number,
): Promise<void> => {
  const { error } = await getSupabase().from("user_upgrades").upsert({
    user_id: userId,
    upgrade_id: upgradeId,
    level,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,upgrade_id" });
  if (error) throw error;
};
