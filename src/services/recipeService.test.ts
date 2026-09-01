import { describe, expect, it } from "vitest";
import { parseRecipeRows } from "./recipeService";

describe("database recipe parsing", () => {
  it("accepts known item identifiers", () => {
    expect(
      parseRecipeRows([{ input_a: "espresso", input_b: "hot_cup", output_item: "espresso_cup" }]),
    ).toEqual([{ inputs: ["espresso", "hot_cup"], output: "espresso_cup" }]);
  });

  it("drops malformed database rows", () => {
    expect(
      parseRecipeRows([{ input_a: "unknown", input_b: "hot_cup", output_item: "espresso_cup" }]),
    ).toEqual([]);
  });
});
