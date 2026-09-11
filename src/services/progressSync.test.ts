import { describe, expect, it } from "vitest";
import { ProgressSync, type ReceiptStorage } from "./progressSync";
import type { CloudProgress } from "./progressService";
import type { ShiftReceipt } from "../game/shiftProtocol";
import { defaultUpgrades } from "../game/rules";

const progress: CloudProgress = {
  gold: 240,
  unlockedStage: 2,
  upgrades: defaultUpgrades,
  discoveredRecipes: [],
  seenMenuStages: [],
};
const receipt: ShiftReceipt = {
  sessionId: "pending-session",
  version: 1,
  elapsed: 10,
  actions: [],
  seenMenuStages: [],
};

const makeStorage = (entries: readonly ShiftReceipt[]): ReceiptStorage => ({
  read: () => entries,
  put: () => {},
  remove: () => {},
});

describe("ProgressSync", () => {
  it("loads existing progress even when a pending settlement endpoint is unavailable", async () => {
    const applied: CloudProgress[] = [];
    const states: string[] = [];
    const sync = new ProgressSync(
      {
        load: async () => progress,
        begin: async () => ({ id: "session", stageId: 1, seed: 1, upgrades: defaultUpgrades }),
        settle: async () => {
          throw new Error("FUNCTION_NOT_DEPLOYED");
        },
        purchase: async () => {},
      },
      makeStorage([receipt]),
      (value) => applied.push(value),
      (state) => states.push(`${state.status}:${state.message}`),
    );

    await sync.connect("user-1");

    expect(sync.ready).toBe(true);
    expect(applied).toHaveLength(1);
    expect(applied[0]?.gold).toBe(240);
    expect(states.at(-1)).toContain("미전송 영업 기록");
  });
});
