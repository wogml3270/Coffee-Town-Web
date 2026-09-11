import type { Upgrades } from "../game/rules";
import type { ItemId } from "../game/catalog";
import { supabase } from "./supabaseClient";
import { loadPlayerUpgrades } from "./upgradeService";

export type CloudProgress = Readonly<{
  gold: number;
  unlockedStage: number;
  upgrades: Partial<Upgrades>;
  discoveredRecipes: readonly ItemId[];
  seenMenuStages: readonly number[];
}>;

export const loadProgress = async (userId: string): Promise<CloudProgress> => {
  const { data, error } = await supabase
    .from("user_progress")
    .select("gold,unlocked_stage,upgrades,discovered_recipes,seen_menu_stages")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  let relationalUpgrades: Partial<Upgrades> = {};
  try {
    relationalUpgrades = await loadPlayerUpgrades(userId);
  } catch (error) {
    console.warn("업그레이드 트리 테이블을 읽지 못해 기존 진행도를 사용합니다.", error);
  }
  return data
    ? {
        gold: Number(data.gold),
        unlockedStage: data.unlocked_stage,
        upgrades: { ...(data.upgrades as Partial<Upgrades>), ...relationalUpgrades },
        discoveredRecipes: (data.discovered_recipes ?? []) as ItemId[],
        seenMenuStages: (data.seen_menu_stages ?? []) as number[],
      }
    : { gold: 0, unlockedStage: 1, upgrades: {}, discoveredRecipes: [], seenMenuStages: [] };
};

export const saveProgress = async (userId: string, progress: CloudProgress) => {
  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      gold: progress.gold,
      unlocked_stage: progress.unlockedStage,
      upgrades: progress.upgrades,
      discovered_recipes: progress.discoveredRecipes,
      seen_menu_stages: progress.seenMenuStages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
};
