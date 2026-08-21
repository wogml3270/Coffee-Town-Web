import { describe, expect, it } from "vitest";
import { applyBaristaAction, isPreparationComplete, startPreparation } from "./baristaEngine";
import type { BaristaRecipe, Order } from "../types/game";

const order: Order = { id: "one", customerName: "민서", itemId: "americano_hot", reward: 180, rewardXp: 18 };
const recipe: BaristaRecipe = { itemId: "americano_hot", name: "아메리카노", steps: ["coffee_beans", "grind", "extract", "hot_water"], unlockLevel: 1 };

describe("barista flow", () => {
  it("accepts only the correct manufacturing sequence immutably", () => {
    const initial = startPreparation(order);
    expect(applyBaristaAction(initial, recipe, "hot_water")).toBe(initial);
    const next = applyBaristaAction(initial, recipe, "coffee_beans");
    expect(next).not.toBe(initial);
    expect(next.completedSteps).toEqual(["coffee_beans"]);
  });

  it("recognizes a completed drink", () => {
    const complete = recipe.steps.reduce(
      (current, actionId) => applyBaristaAction(current, recipe, actionId),
      startPreparation(order),
    );
    expect(isPreparationComplete(complete, recipe)).toBe(true);
  });
});
