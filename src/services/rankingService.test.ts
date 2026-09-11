import { describe, expect, it } from "vitest";
import { parseRankingRows } from "./rankingService";

describe("leaderboard row parsing", () => {
  it("converts bigint strings and highlights the current player", () => {
    expect(
      parseRankingRows([
        { rank_position: "12", nickname: "재희", score: "504879", stages_ranked: 8, is_me: true },
      ]),
    ).toEqual([{ position: 12, nickname: "재희", score: 504879, stagesRanked: 8, isMe: true }]);
  });
});
