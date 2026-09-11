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
  if (!data) throw new Error("PROGRESS_NOT_FOUND");
  let relationalUpgrades: Partial<Upgrades> = {};
  try {
    relationalUpgrades = await loadPlayerUpgrades(userId);
  } catch (upgradeError) {
    // Older deployments may not have the relational upgrade tables yet. The
    // JSON snapshot remains a valid read-only fallback until that migration lands.
    console.warn("업그레이드 테이블을 읽지 못해 진행도 스냅샷을 사용합니다.", upgradeError);
  }
  return {
    gold: Number(data.gold),
    unlockedStage: data.unlocked_stage,
    upgrades: { ...(data.upgrades as Partial<Upgrades>), ...relationalUpgrades },
    discoveredRecipes: (data.discovered_recipes ?? []) as ItemId[],
    seenMenuStages: (data.seen_menu_stages ?? []) as number[],
  };
};
