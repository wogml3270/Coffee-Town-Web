import type { GameState } from "../types/game";
import { getSupabase } from "./supabaseService";

export const createGameSession = async (userId: string, state: GameState) => {
  const { data, error } = await getSupabase()
    .from("game_sessions")
    .insert({
      user_id: userId,
      duration_sec: state.remainingTimeSec,
      remaining_sec: state.remainingTimeSec,
      board_state: { preparation: state.preparation, orders: state.orders },
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
};

export const syncGameSession = async (
  sessionId: string,
  state: GameState,
) => {
  const { error } = await getSupabase()
    .from("game_sessions")
    .update({
      status: state.phase === "ended" ? "COMPLETED" : "ACTIVE",
      remaining_sec: state.remainingTimeSec,
      earned_gold: state.gold,
      earned_xp: state.xp,
      board_state: { preparation: state.preparation, orders: state.orders },
      ended_at: state.phase === "ended" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw error;
};

export const abandonGameSession = async (sessionId: string): Promise<void> => {
  const { error } = await getSupabase().from("game_sessions").update({ status: "ABANDONED", earned_gold: 0, earned_xp: 0, ended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", sessionId);
  if (error) throw error;
};
