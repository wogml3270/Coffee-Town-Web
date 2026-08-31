import { describe, expect, it } from "vitest";
import type { ItemId, StationId } from "./catalog";
import { autoCombine, combineSelected, createShift, interactStation, takeFridgeIngredient, tick, type ShiftState } from "./rules";

const advance = (state: ShiftState, seconds: number) => Array.from({ length: seconds }).reduce<ShiftState>((current) => tick(current), state);
const run = (state: ShiftState, station: StationId, selectedUid: string | null = null) => {
  const started = interactStation(state, station, selectedUid);
  const completed = advance(started, started.stations[station].remaining);
  return interactStation(completed, station, null);
};
const item = (state: ShiftState, itemId: ItemId) => state.inventory.find((entry) => entry.itemId === itemId)!;
const assemble = (state: ShiftState, first: ItemId, second: ItemId) => {
  expect(item(state, second)).toBeTruthy();
  return combineSelected(state, item(state, first).uid);
};

describe("timed cafe production", () => {
  it("locks a machine until processing completes and is immediately reusable after collection", () => {
    const started = interactStation(createShift(), "grinder", null);
    expect(started.activeWork).toBe("grinder");
    expect(started.stations.grinder.phase).toBe("processing");
    const ready = advance(started, 4);
    expect(ready.activeWork).toBeNull();
    expect(ready.stations.grinder.phase).toBe("ready");
    const collected = interactStation(ready, "grinder", null);
    expect(item(collected, "ground_coffee")).toBeTruthy();
    expect(collected.stations.grinder.phase).toBe("idle");
  });

  it("can complete the previously blocked cafe latte recipe", () => {
    let state = run(createShift(), "grinder");
    state = run(state, "espresso", item(state, "ground_coffee").uid);
    state = run(state, "cups");
    state = assemble(state, "espresso", "hot_cup");
    state = takeFridgeIngredient(state, "milk");
    state = run(state, "steam", item(state, "milk").uid);
    state = assemble(state, "espresso_cup", "steamed_milk");
    expect(item(state, "latte")).toBeTruthy();
  });

  it("takes cups and refrigerated ingredients immediately without cooldown", () => {
    const withCup = interactStation(createShift(), "cups", null);
    expect(item(withCup, "hot_cup")).toBeTruthy();
    expect(withCup.stations.cups.phase).toBe("idle");
    const withMilk = takeFridgeIngredient(withCup, "milk");
    expect(item(withMilk, "milk")).toBeTruthy();
    expect(withMilk.activeWork).toBeNull();
  });

  it("unlocks and completes lemonade with stage two equipment", () => {
    let state = run(createShift(undefined, 2), "coldCups");
    state = run(state, "ice");
    state = assemble(state, "cold_cup", "ice");
    state = takeFridgeIngredient(state, "lemon_syrup");
    state = assemble(state, "iced_cup", "lemon_syrup");
    state = run(state, "sparkling");
    state = assemble(state, "lemon_base", "sparkling_water");
    expect(item(state, "lemonade")).toBeTruthy();
  });

  it("makes fever production immediate", () => {
    const feverState = { ...createShift(), fever: 15 };
    const started = interactStation(feverState, "grinder", null);
    expect(started.stations.grinder.remaining).toBe(1);
    const ready = advance(started, 1);
    const collected = interactStation(ready, "grinder", null);
    expect(collected.stations.grinder.phase).toBe("idle");
  });

  it("automatically combines a valid recipe after the premium upgrade", () => {
    const upgraded = { ...createShift(), upgrades: { ...createShift().upgrades, automation: 1 } };
    let state = run(upgraded, "cups");
    state = run(state, "grinder");
    state = run(state, "espresso", item(state, "ground_coffee").uid);
    const combined = autoCombine(state);
    expect(item(combined, "espresso_cup")).toBeTruthy();
  });
});
