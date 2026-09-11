import type { ShiftScoreBreakdown, ShiftState } from "../game/rules";
import { supabase } from "./supabaseClient";

export type ShiftScoreRecord = Readonly<{
  recordedScore: number;
  isPersonalBest: boolean;
}>;

export const saveShiftScore = async (
  shift: ShiftState,
  breakdown: ShiftScoreBreakdown,
): Promise<ShiftScoreRecord> => {
  const { data, error } = await supabase.rpc("record_shift_result", {
    p_stage_id: shift.stageId,
    p_score: breakdown.total,
    p_earned_gold: shift.gold,
    p_completed_orders: shift.orderSequence,
    p_mistakes: shift.mistakes,
    p_discarded_items: shift.discardedItems,
    p_max_combo: shift.maxCombo,
    p_average_satisfaction: breakdown.averageSatisfaction,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("점수 저장 결과를 받지 못했습니다.");
  return {
    recordedScore: Number(row.recorded_score),
    isPersonalBest: Boolean(row.is_personal_best),
  };
};
