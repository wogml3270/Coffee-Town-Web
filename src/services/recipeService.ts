import { labels, recipes as fallbackRecipes, type CombinationRecipe, type ItemId } from "../game/catalog";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type RecipeRow = Readonly<{ input_a: string; input_b: string; output_item: string }>;

const isItemId = (value: string): value is ItemId => Object.hasOwn(labels, value);

export const parseRecipeRows = (rows: readonly RecipeRow[]): readonly CombinationRecipe[] => rows.flatMap(({ input_a, input_b, output_item }) =>
  isItemId(input_a) && isItemId(input_b) && isItemId(output_item)
    ? [{ inputs: [input_a, input_b] as const, output: output_item }]
    : []);

export const loadCombinationRecipes = async (): Promise<readonly CombinationRecipe[]> => {
  if (!isSupabaseConfigured) return fallbackRecipes;
  const { data, error } = await supabase.from("recipe_combinations").select("input_a,input_b,output_item").eq("enabled", true).order("sort_order");
  if (error) throw error;
  const parsed = parseRecipeRows((data ?? []) as RecipeRow[]);
  return parsed.length ? parsed : fallbackRecipes;
};
