import { describe, expect, it } from "vitest";
import { mergeRecipeSources, parseRecipeRows } from "./recipeService";

describe("database recipe parsing", () => {
  it("accepts known item identifiers", () => {
    expect(parseRecipeRows([{ input_a: "espresso", input_b: "cup", output_item: "espresso_cup" }])).toEqual([
      { inputs: ["espresso", "cup"], output: "espresso_cup" },
    ]);
  });

  it("drops malformed database rows", () => {
    expect(parseRecipeRows([{ input_a: "unknown", input_b: "cup", output_item: "espresso_cup" }])).toEqual(
      [],
    );
  });
});

describe("recipe source merge", () => {
  it("lets the readable code catalog override an old DB combination", () => {
    const database = [{ inputs: ["cup", "ice"] as const, output: "espresso_cup" as const }];
    const code = [{ inputs: ["ice", "cup"] as const, output: "iced_cup" as const }];
    expect(mergeRecipeSources(code, database)).toEqual(code);
  });

  it("removes a stale DB route when code owns the same output", () => {
    const database = [{ inputs: ["iced_cup", "milk"] as const, output: "iced_espresso_base" as const }];
    const code = [{ inputs: ["iced_cup", "espresso"] as const, output: "iced_espresso_base" as const }];
    expect(mergeRecipeSources(code, database)).toEqual(code);
  });
});
