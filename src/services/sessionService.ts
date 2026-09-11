import { defaultUpgrades } from "../game/rules";
import { shiftProtocolVersion, type ShiftReceipt, type ShiftSession } from "../game/shiftProtocol";
import { supabase } from "./supabaseClient";

export const beginShiftSession = async (stage: number): Promise<ShiftSession> => {
  const { data, error } = await supabase.rpc("begin_shift_session", {
    p_stage_id: stage,
    p_version: shiftProtocolVersion,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("SESSION_NOT_CREATED");
  return {
    id: row.id,
    stageId: row.stage_id,
    seed: row.seed,
    upgrades: { ...defaultUpgrades, ...row.upgrades },
  };
};
export const settleShiftSession = async (receipt: ShiftReceipt): Promise<void> => {
  const { data, error } = await supabase.functions.invoke("settle-shift", { body: receipt });
  if (error || !data?.settled) throw error ?? new Error("SHIFT_NOT_SETTLED");
};
