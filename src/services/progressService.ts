import type { Upgrades } from "../game/rules";
import { supabase } from "./supabaseClient";

export type CloudProgress = Readonly<{ gold: number; unlockedStage: number; upgrades: Partial<Upgrades> }>;

export const loadProgress = async (userId: string): Promise<CloudProgress | null> => {
  const { data, error } = await supabase.from("user_progress").select("gold,unlocked_stage,upgrades").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? { gold: Number(data.gold), unlockedStage: data.unlocked_stage, upgrades: data.upgrades as Partial<Upgrades> } : null;
};

export const saveProgress = async (userId: string, progress: CloudProgress) => {
  const { error } = await supabase.from("user_progress").upsert({ user_id: userId, gold: progress.gold, unlocked_stage: progress.unlockedStage, upgrades: progress.upgrades, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
};
