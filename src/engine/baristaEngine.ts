import type { BaristaActionId, BaristaRecipe, DrinkPreparation, Order } from "../types/game";

export const startPreparation = (order: Order): DrinkPreparation => ({
  orderId: order.id,
  itemId: order.itemId,
  completedSteps: [],
});

export const getNextAction = (
  preparation: DrinkPreparation,
  recipe: BaristaRecipe,
): BaristaActionId | null => recipe.steps[preparation.completedSteps.length] ?? null;

export const applyBaristaAction = (
  preparation: DrinkPreparation,
  recipe: BaristaRecipe,
  actionId: BaristaActionId,
): DrinkPreparation => {
  if (recipe.itemId !== preparation.itemId || getNextAction(preparation, recipe) !== actionId) return preparation;
  return { ...preparation, completedSteps: [...preparation.completedSteps, actionId] };
};

export const isPreparationComplete = (
  preparation: DrinkPreparation,
  recipe: BaristaRecipe,
): boolean => recipe.itemId === preparation.itemId && preparation.completedSteps.length === recipe.steps.length;
