import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseService";

export type UserProgressRow = Readonly<{
  user_id: string;
  gold: number;
  xp: number;
  level: number;
  unlocked_recipes: string[];
  updated_at: string;
}>;

export type GameSessionRow = Readonly<{
  id: string;
  user_id: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  duration_sec: number;
  remaining_sec: number;
  earned_gold: number;
  earned_xp: number;
  board_state: unknown;
  updated_at: string;
}>;

export type SessionOrderRow = Readonly<{
  id: string;
  session_id: string;
  user_id: string;
  recipe_id: string;
  status: "WAITING" | "SERVED" | "EXPIRED";
  reward_gold: number;
}>;

type ChangeHandler<Row extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<Row>,
) => void;

const subscribeToOwnedTable = <Row extends Record<string, unknown>>(
  table: "user_progress" | "game_sessions" | "session_orders",
  userId: string,
  handler: ChangeHandler<Row>,
) => {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`${table}:${userId}`)
    .on<Row>(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      handler,
    )
    .subscribe();

  return async () => {
    await supabase.removeChannel(channel);
  };
};

export const subscribeToProgress = (
  userId: string,
  handler: ChangeHandler<UserProgressRow>,
) => subscribeToOwnedTable<UserProgressRow>("user_progress", userId, handler);

export const subscribeToGameSessions = (
  userId: string,
  handler: ChangeHandler<GameSessionRow>,
) => subscribeToOwnedTable<GameSessionRow>("game_sessions", userId, handler);

export const subscribeToSessionOrders = (
  userId: string,
  handler: ChangeHandler<SessionOrderRow>,
) => subscribeToOwnedTable<SessionOrderRow>("session_orders", userId, handler);

