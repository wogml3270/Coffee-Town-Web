import { describe, expect, it } from "vitest";
import { defaultUpgrades } from "./rules";
import { shiftProtocolVersion, verifyShift } from "./shiftProtocol";

const session = { id: "session-1", stageId: 1, seed: 42, upgrades: defaultUpgrades } as const;

describe("verified shift protocol", () => {
  it("replays an empty guest receipt deterministically", () => {
    const result = verifyShift(
      session,
      { sessionId: session.id, version: shiftProtocolVersion, elapsed: 10, actions: [], seenMenuStages: [] },
      10,
    );
    expect(result.state.time).toBe(350);
    expect(result.state.gold).toBe(0);
    expect(result.score.total).toBe(0);
  });

  it("rejects receipts that run faster than the authenticated session", () => {
    expect(() =>
      verifyShift(
        session,
        {
          sessionId: session.id,
          version: shiftProtocolVersion,
          elapsed: 60,
          actions: [],
          seenMenuStages: [],
        },
        20,
      ),
    ).toThrow("INVALID_DURATION");
  });

  it("rejects an action that references an impossible inventory slot", () => {
    expect(() =>
      verifyShift(
        session,
        {
          sessionId: session.id,
          version: shiftProtocolVersion,
          elapsed: 1,
          actions: [{ at: 0, kind: "discard", slot: 9 }],
          seenMenuStages: [],
        },
        1,
      ),
    ).toThrow("INVALID_ACTION");
  });
});
