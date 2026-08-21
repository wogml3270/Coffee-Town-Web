import { describe, expect, it } from "vitest";
import { processMerge } from "./mergeEngine";
import type { GameState, Recipe } from "../types/game";

const recipes: readonly Recipe[] = [
  { inputs: ["bean_lv1", "bean_lv1"], result: "espresso_lv2", type: "SAME_MERGE" },
  { inputs: ["espresso_lv2", "milk_lv1"], result: "caffe_latte_lv3", type: "RECIPE_COMBINE" },
];

const stateWith = (first: string | null, second: string | null): GameState => ({
  phase: "playing",
  remainingTimeSec: 300,
  gold: 0,
  xp: 0,
  level: 1,
  preparation: null,
  orders: [],
  grid: [[
    { x: 0, y: 0, itemId: first },
    { x: 1, y: 0, itemId: second },
  ]],
});

describe("processMerge", () => {
  it("merges identical ingredients without mutating the source state", () => {
    const state = stateWith("bean_lv1", "bean_lv1");
    const next = processMerge(state, { x: 0, y: 0 }, { x: 1, y: 0 }, recipes);
    expect(next).not.toBe(state);
    expect(next.grid[0]?.map((cell) => cell.itemId)).toEqual([null, "espresso_lv2"]);
    expect(state.grid[0]?.map((cell) => cell.itemId)).toEqual(["bean_lv1", "bean_lv1"]);
  });

  it("combines heterogeneous ingredients in either direction", () => {
    const state = stateWith("milk_lv1", "espresso_lv2");
    const next = processMerge(state, { x: 0, y: 0 }, { x: 1, y: 0 }, recipes);
    expect(next.grid[0]?.map((cell) => cell.itemId)).toEqual([null, "caffe_latte_lv3"]);
  });

  it("preserves identity for invalid positions, empty cells, and unmatched inputs", () => {
    const unmatched = stateWith("milk_lv1", "milk_lv1");
    expect(processMerge(unmatched, { x: 0, y: 0 }, { x: 9, y: 9 }, recipes)).toBe(unmatched);
    expect(processMerge(unmatched, { x: 0, y: 0 }, { x: 1, y: 0 }, recipes)).toBe(unmatched);
    const empty = stateWith(null, "bean_lv1");
    expect(processMerge(empty, { x: 0, y: 0 }, { x: 1, y: 0 }, recipes)).toBe(empty);
  });
});
