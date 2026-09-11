import { labels, recipes as fallbackRecipes, type CombinationRecipe, type ItemId } from "../game/catalog";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type RecipeRow = Readonly<{ input_a: string; input_b: string; output_item: string }>;

const isItemId = (value: string): value is ItemId => Object.hasOwn(labels, value);

export const parseRecipeRows = (rows: readonly RecipeRow[]): readonly CombinationRecipe[] =>
  rows.flatMap(({ input_a, input_b, output_item }) =>
    isItemId(input_a) && isItemId(input_b) && isItemId(output_item)
      ? [{ inputs: [input_a, input_b] as const, output: output_item }]
      : [],
  );

const recipeKey = ({ inputs }: CombinationRecipe) => [...inputs].sort().join("+");

// Supabase는 운영 중 추가한 레시피를 공급하고, 같은 재료 조합은 코드 정의가 우선합니다.
// 따라서 catalog.ts의 recipeGroups를 수정하면 DB에 예전 행이 남아 있어도 즉시 반영됩니다.
export const mergeRecipeSources = (
  codeRecipes: readonly CombinationRecipe[],
  databaseRecipes: readonly CombinationRecipe[],
): readonly CombinationRecipe[] => {
  const codeOutputs = new Set(codeRecipes.map(({ output }) => output));
  const merged = new Map(
    databaseRecipes
      .filter(({ output }) => !codeOutputs.has(output))
      .map((recipe) => [recipeKey(recipe), recipe]),
  );
  codeRecipes.forEach((recipe) => merged.set(recipeKey(recipe), recipe));
  return [...merged.values()];
};

export const loadCombinationRecipes = async (): Promise<readonly CombinationRecipe[]> => {
  if (!isSupabaseConfigured) return fallbackRecipes;
  const { data, error } = await supabase
    .from("recipe_combinations")
    .select("input_a,input_b,output_item")
    .eq("enabled", true)
    .order("sort_order");
  if (error) throw error;
  const parsed = parseRecipeRows((data ?? []) as RecipeRow[]);
  return mergeRecipeSources(fallbackRecipes, parsed);
};
