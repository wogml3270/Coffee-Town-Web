import { describe, expect, it } from "vitest";
import type { ItemId, StationId } from "./catalog";
import {
  autoCombine,
  businessClock,
  calculateShiftScore,
  combineSelected,
  createShift,
  interactStation,
  serve,
  takeFridgeIngredient,
  tick,
  type ShiftState,
} from "./rules";
import {
  fridgeIngredients,
  menuCatalog,
  labels,
  recipeArchive,
  recipeTierGroups,
  recipes,
  stationProcesses,
  stationUnlockStage,
} from "./catalog";

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
    expect(menuCatalog).toHaveLength(18);
    expect(menuCatalog.filter(({ stage }) => stage === 1).map(({ id }) => id)).toEqual([
      "americano",
      "iced_americano",
      "latte",
      "iced_latte",
    ]);
    expect(
      Array.from({ length: 14 }, (_, index) => menuCatalog.filter(({ stage }) => stage === index + 2)).every(
        (menus) => menus.length === 1,
      ),
    ).toBe(true);
  });
  it("makes every drink producible on the exact stage where it unlocks", () => {
    for (const menu of menuCatalog) {
      const available = new Set<ItemId>(
        fridgeIngredients.filter(({ minStage }) => minStage <= menu.stage).map(({ itemId }) => itemId),
      );
      let changed = true;
      while (changed) {
        changed = false;
        for (const process of stationProcesses) {
          if (stationUnlockStage[process.station] > menu.stage) continue;
          if (process.input && !available.has(process.input)) continue;
          if (process.additionalInputs?.some((input) => !available.has(input))) continue;
          if (!available.has(process.output)) {
            available.add(process.output);
            changed = true;
          }
        }
        for (const recipe of recipes) {
          if (!recipe.inputs.every((input) => available.has(input))) continue;
          if (!available.has(recipe.output)) {
            available.add(recipe.output);
            changed = true;
          }
        }
      }
      expect(available.has(menu.id), `${menu.stage}일차 ${menu.name} 제조 경로가 끊겼습니다`).toBe(true);
    }
  });
  it("documents equipment products and every intermediate combination in the recipe archive", () => {
    expect(recipeArchive.find(({ id }) => id === "steamed_milk")?.recipe).toContain("스팀");
    expect(recipeArchive.find(({ id }) => id === "iced_cup")?.recipe).toBe("컵 + 얼음");
    expect(recipeArchive.find(({ id }) => id === "iced_milk_base")?.recipe).toBe("얼음 컵 + 우유");
    expect(recipeArchive.find(({ id }) => id === "iced_espresso_base")?.recipe).toBe(
      "- 에스프레소 컵 + 얼음\n- 얼음 컵 + 에스프레소",
    );
    expect(recipeArchive.find(({ id }) => id === "vanilla_cup")?.name).toBe("바닐라 베이스");
  });
  it("assigns every inventory item to exactly one visible manufacturing tier", () => {
    const tierItems = Object.values(recipeTierGroups).flat();
    expect(new Set(tierItems).size).toBe(tierItems.length);
    expect(new Set(tierItems)).toEqual(new Set(Object.keys(labels)));
    expect(recipeTierGroups[2]).toContain("espresso");
    expect(recipeTierGroups[2]).toContain("iced_cup");
    expect(recipeTierGroups[3]).toContain("espresso_cup");
    expect(recipeTierGroups[3]).toContain("iced_milk_base");
    expect(recipeTierGroups[4]).toContain("mocha");
    expect(recipeTierGroups[5]).toContain("mocha_blended");
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
  it("scores successful service independently from earned gold", () => {
    const state = createShift();
    const served = serve(
      { ...state, inventory: [{ uid: "ready-drink", itemId: state.order.itemId }] },
      "ready-drink",
    );
    expect(served.gold).toBeGreaterThan(0);
    expect(served.score).toBeGreaterThan(0);
    expect(served.maxCombo).toBe(1);
    expect(calculateShiftScore({ ...served, time: 0 }).total).toBeGreaterThan(served.score);
  });
  it("penalizes an incorrect serving without changing earned gold", () => {
    const state = { ...createShift(), score: 250, inventory: [{ uid: "wrong", itemId: "latte" as const }] };
    const wrongItem = state.order.itemId === "latte" ? "americano" : "latte";
    const served = serve({ ...state, inventory: [{ uid: "wrong", itemId: wrongItem }] }, "wrong");
    expect(served.gold).toBe(0);
    expect(served.score).toBe(150);
    expect(served.mistakes).toBe(1);
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

  it("accepts espresso-first and ice-first workflows for iced drinks", () => {
    const baseInventory = [
      { uid: "espresso-cup", itemId: "espresso_cup" as const },
      { uid: "ice", itemId: "ice" as const },
      { uid: "water", itemId: "cold_water" as const },
    ];
    let americanoState: ShiftState = { ...createShift(), inventory: baseInventory };
    americanoState = combineSelected(americanoState, "espresso-cup");
    expect(item(americanoState, "iced_espresso_base")).toBeTruthy();
    americanoState = combineSelected(americanoState, item(americanoState, "iced_espresso_base").uid);
    expect(item(americanoState, "iced_americano")).toBeTruthy();

    let latteState: ShiftState = {
      ...createShift(),
      inventory: [
        { uid: "espresso-cup", itemId: "espresso_cup" as const },
        { uid: "ice", itemId: "ice" as const },
        { uid: "milk", itemId: "milk" as const },
      ],
    };
    latteState = combineSelected(latteState, "espresso-cup");
    latteState = combineSelected(latteState, item(latteState, "iced_espresso_base").uid);
    expect(item(latteState, "iced_latte")).toBeTruthy();
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

  it("extracts cold brew concentrate and completes cold brew on stage ten", () => {
    let state = interactStation(createShift(undefined, 10), "cups", null);
    state = run(state, "ice");
    state = assemble(state, "cup", "ice");
    state = run(state, "coldBrew");
    state = assemble(state, "iced_cup", "cold_brew_concentrate");
    state = run(state, "coldWater");
    state = assemble(state, "cold_brew_base", "cold_water");
    expect(item(state, "cold_brew")).toBeTruthy();
  });

  it("uses the blender to finish cafe mocha ice blended on stage twelve", () => {
    let state = interactStation(createShift(undefined, 12), "cups", null);
    state = takeFridgeIngredient(state, "chocolate_sauce");
    state = run(state, "grinder");
    state = run(state, "espresso", item(state, "ground_coffee").uid);
    state = assemble(state, "espresso", "cup");
    state = assemble(state, "espresso_cup", "chocolate_sauce");
    state = takeFridgeIngredient(state, "milk");
    state = run(state, "ice");
    state = run(state, "blender", item(state, "mocha_base").uid);
    expect(item(state, "mocha_blended")).toBeTruthy();
    expect(state.inventory).toHaveLength(1);
  });

  it.each([
    ["vanilla_cup", "vanilla_blended"],
    ["matcha_cup", "matcha_blended"],
    ["chocolate_cup", "chocolate_blended"],
  ] as const)("blender combines %s with milk and ice into %s", (base, output) => {
    const state: ShiftState = {
      ...createShift(undefined, 15),
      inventory: [
        { uid: "blend-base", itemId: base },
        { uid: "blend-milk", itemId: "milk" },
        { uid: "blend-ice", itemId: "ice" },
      ],
    };
    const completed = run(state, "blender", "blend-base");
    expect(item(completed, output)).toBeTruthy();
    expect(completed.inventory).toHaveLength(1);
  });

  it("explains which physical blender ingredient is missing without consuming the base", () => {
    const state: ShiftState = {
      ...createShift(undefined, 15),
      inventory: [
        { uid: "mocha-base", itemId: "mocha_base" },
        { uid: "blend-milk", itemId: "milk" },
      ],
    };
    const rejected = interactStation(state, "blender", "mocha-base");
    expect(rejected.notice).toContain("얼음");
    expect(rejected.inventory).toEqual(state.inventory);
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

  it("applies espresso branch tuning only to its machine family", () => {
    const upgraded = {
      ...createShift(),
      upgrades: { ...createShift().upgrades, espressoSpeed: 5 },
    };
    expect(interactStation(upgraded, "grinder", null).stations.grinder.total).toBe(3);
    expect(interactStation(upgraded, "ice", null).stations.ice.total).toBe(
      interactStation(createShift(), "ice", null).stations.ice.total,
    );
  });

  it("protects combo according to service recovery level", () => {
    const base = createShift();
    const wrongDrink = [
      { uid: "wrong", itemId: base.order.itemId === "latte" ? ("americano" as const) : ("latte" as const) },
    ];
    const guarded = serve(
      {
        ...base,
        combo: 4,
        inventory: wrongDrink,
        upgrades: { ...base.upgrades, comboGuard: 1 },
      },
      "wrong",
    );
    const mastered = serve(
      {
        ...base,
        combo: 4,
        inventory: wrongDrink,
        upgrades: { ...base.upgrades, comboGuard: 2 },
      },
      "wrong",
    );
    expect(guarded.combo).toBe(3);
    expect(mastered.combo).toBe(4);
  });

  it("automatically serves the current order after the smart pickup upgrade", () => {
    const state = createShift();
    const served = autoCombine({
      ...state,
      upgrades: { ...state.upgrades, autoServe: 1 },
      inventory: [{ uid: "ready", itemId: state.order.itemId }],
    });
    expect(served.orderSequence).toBe(1);
    expect(served.inventory).toHaveLength(0);
    expect(served.gold).toBeGreaterThan(0);
  });
});
