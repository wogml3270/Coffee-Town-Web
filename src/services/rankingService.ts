import { supabase } from "./supabaseClient";

export type RankingEntry = Readonly<{
  position: number;
  nickname: string;
  score: number;
  stagesRanked: number;
  isMe: boolean;
}>;

type RankingRow = Readonly<{
  rank_position: number | string;
  nickname: string;
  score: number | string;
  stages_ranked: number | string;
  is_me: boolean | null;
}>;

export const parseRankingRows = (rows: readonly RankingRow[]): readonly RankingEntry[] =>
  rows.map((entry) => ({
    position: Number(entry.rank_position),
    nickname: String(entry.nickname),
    score: Number(entry.score),
    stagesRanked: Number(entry.stages_ranked),
    isMe: Boolean(entry.is_me),
  }));

export const loadLeaderboard = async (limit = 50): Promise<readonly RankingEntry[]> => {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });
  if (error) throw error;
  return parseRankingRows((data ?? []) as RankingRow[]);
};
