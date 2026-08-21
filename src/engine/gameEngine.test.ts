import { describe, expect, it } from "vitest";
import { addItemToBoard, gameReducer, serveOrder } from "./gameEngine";
import { processMoveOrMerge } from "./mergeEngine";
import type { GameState, Recipe } from "../types/game";

const state: GameState = {
  phase: "playing",
  remainingTimeSec: 2,
  gold: 10,
  xp: 0,
  level: 1,
  preparation: null,
  orders: [{ id: "one", customerName: "민서", itemId: "latte", reward: 300, rewardXp: 30 }],
  grid: [[{ x: 0, y: 0, itemId: "bean" }, { x: 1, y: 0, itemId: null }]],
};
const recipes: readonly Recipe[] = [{ inputs: ["bean", "bean"], result: "espresso", type: "SAME_MERGE" }];

describe("game core loop", () => {
  it("starts a guest session with a five-minute limit", () => {
    const startState = { ...state, phase: "start" as const, remainingTimeSec: 0 };
    expect(gameReducer(startState, { type: "START" })).toMatchObject({
      phase: "playing",
      remainingTimeSec: 300,
    });
  });

  it("moves an item into an empty cell immutably", () => {
    const next = processMoveOrMerge(state, { x: 0, y: 0 }, { x: 1, y: 0 }, recipes);
    expect(next.grid[0]?.map((cell) => cell.itemId)).toEqual([null, "bean"]);
    expect(state.grid[0]?.map((cell) => cell.itemId)).toEqual(["bean", null]);
  });

  it("adds an ingredient to the first empty cell", () => {
    expect(addItemToBoard(state, "milk").grid[0]?.[1]?.itemId).toBe("milk");
  });

  it("serves a matching drink, clears the cell, replaces the order, and awards gold", () => {
    const drinkState = { ...state, grid: [[{ x: 0, y: 0, itemId: "latte" }]] };
    const next = serveOrder(drinkState, { x: 0, y: 0 }, "one", { id: "two", customerName: "도윤", itemId: "aide", reward: 350, rewardXp: 35 });
    expect(next.gold).toBe(310);
    expect(next.xp).toBe(30);
    expect(next.grid[0]?.[0]?.itemId).toBeNull();
    expect(next.orders[0]?.id).toBe("two");
  });

  it("counts down and ends the session at zero", () => {
    const oneSecond = { ...state, remainingTimeSec: 1 };
    const ended = gameReducer(oneSecond, { type: "TICK" });
    expect(ended).toMatchObject({ remainingTimeSec: 0, phase: "ended" });
  });

  it("abandons a shift and restores the starting rewards", () => {
    const earned = { ...state, gold: 510, xp: 80, level: 2 };
    expect(gameReducer(earned, { type: "ABANDON_SESSION", gold: 10, xp: 0, level: 1 })).toMatchObject({
      phase: "start",
      gold: 10,
      xp: 0,
      level: 1,
      preparation: null,
    });
  });
});
