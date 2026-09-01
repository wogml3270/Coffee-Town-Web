import { describe, expect, it } from "vitest";
import type { ItemId, StationId } from "./catalog";
import {
  autoCombine,
  businessClock,
  combineSelected,
  createShift,
  interactStation,
  serve,
  takeFridgeIngredient,
  tick,
  type ShiftState,
} from "./rules";
import { menuCatalog } from "./catalog";

const advance = (state: ShiftState, seconds: number) =>
  Array.from({ length: seconds }).reduce<ShiftState>((current) => tick(current), state);
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
  it("runs a six minute business day from 09:00 to 21:00", () => {
    expect(businessClock(360)).toBe("09:00");
    expect(businessClock(180)).toBe("15:00");
    expect(businessClock(0)).toBe("21:00");
  });

  it("starts with four core drinks, then unlocks one menu per stage", () => {
    expect(menuCatalog).toHaveLength(15);
    expect(menuCatalog.filter(({ stage }) => stage === 1).map(({ id }) => id)).toEqual([
      "americano",
      "iced_americano",
      "latte",
      "iced_latte",
    ]);
    expect(
      Array.from({ length: 11 }, (_, index) => menuCatalog.filter(({ stage }) => stage === index + 2)).every(
        (menus) => menus.length === 1,
      ),
    ).toBe(true);
  });
  it("precalculates three customer orders and refills the queue after serving", () => {
    const state = createShift();
    expect(state.orders).toHaveLength(3);
    expect(state.order).toEqual(state.orders[0]);
    const served = serve(
      { ...state, inventory: [{ uid: "ready-drink", itemId: state.order.itemId }] },
      "ready-drink",
    );
    expect(served.orders).toHaveLength(3);
    expect(served.order).toEqual(served.orders[0]);
    expect(served.order.id).toBe(state.orders[1]!.id);
  });
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
    state = interactStation(state, "cups", null);
    state = assemble(state, "espresso", "cup");
    state = takeFridgeIngredient(state, "milk");
    state = run(state, "steam", item(state, "milk").uid);
    state = assemble(state, "espresso_cup", "steamed_milk");
    expect(item(state, "latte")).toBeTruthy();
  });

  it("prioritizes the current vanilla latte order instead of prematurely making cafe latte", () => {
    const vanillaOrder = menuCatalog.find(({ id }) => id === "vanilla_latte")!;
    const state: ShiftState = {
      ...createShift(undefined, 2),
      order: { id: 0, itemId: vanillaOrder.id, name: vanillaOrder.name, reward: vanillaOrder.reward },
      inventory: [
        { uid: "espresso-cup", itemId: "espresso_cup" },
        { uid: "vanilla", itemId: "vanilla_syrup" },
        { uid: "milk", itemId: "steamed_milk" },
      ],
    };
    const combined = combineSelected(state, "espresso-cup");
    expect(item(combined, "vanilla_espresso")).toBeTruthy();
    expect(combined.inventory.some(({ itemId }) => itemId === "latte")).toBe(false);
  });

  it("keeps premium auto-combine on the current order recipe path", () => {
    const vanillaOrder = menuCatalog.find(({ id }) => id === "vanilla_latte")!;
    const state: ShiftState = {
      ...createShift(undefined, 2),
      order: { id: 0, itemId: vanillaOrder.id, name: vanillaOrder.name, reward: vanillaOrder.reward },
      upgrades: { ...createShift().upgrades, automation: 1 },
      inventory: [
        { uid: "espresso-cup", itemId: "espresso_cup" },
        { uid: "vanilla", itemId: "vanilla_syrup" },
        { uid: "milk", itemId: "steamed_milk" },
      ],
    };
    const combined = autoCombine(state);
    expect(item(combined, "vanilla_latte")).toBeTruthy();
    expect(combined.inventory.some(({ itemId }) => itemId === "latte")).toBe(false);
  });

  it("takes cups and refrigerated ingredients immediately without cooldown", () => {
    const withCup = interactStation(createShift(), "cups", null);
    expect(item(withCup, "cup")).toBeTruthy();
    expect(withCup.stations.cups.phase).toBe("idle");
    const withMilk = takeFridgeIngredient(withCup, "milk");
    expect(item(withMilk, "milk")).toBeTruthy();
    expect(withMilk.activeWork).toBeNull();
  });

  it("unlocks and completes lemonade with stage five equipment", () => {
    let state = interactStation(createShift(undefined, 5), "cups", null);
    state = run(state, "ice");
    state = assemble(state, "cup", "ice");
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
