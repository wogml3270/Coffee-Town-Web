import type { GameState, Position, Recipe } from "../types/game";

const isIntegerPosition = ({ x, y }: Position): boolean =>
  Number.isInteger(x) && Number.isInteger(y);

const isInsideGrid = (state: GameState, position: Position): boolean =>
  isIntegerPosition(position) &&
  position.y >= 0 &&
  position.y < state.grid.length &&
  position.x >= 0 &&
  position.x < (state.grid[position.y]?.length ?? 0);

const isSamePosition = (left: Position, right: Position): boolean =>
  left.x === right.x && left.y === right.y;

const recipeMatches = (
  recipe: Recipe,
  sourceItem: string,
  targetItem: string,
): boolean => {
  const [first, second] = recipe.inputs;
  const inputsMatch =
    (first === sourceItem && second === targetItem) ||
    (first === targetItem && second === sourceItem);

  if (!inputsMatch) return false;

  return recipe.type === "SAME_MERGE"
    ? sourceItem === targetItem && first === second
    : sourceItem !== targetItem && first !== second;
};

/**
 * Resolves one merge without mutating state. Invalid moves preserve object identity,
 * which lets UI code cheaply determine whether a sound/animation should play.
 */
export const processMerge = (
  state: GameState,
  from: Position,
  to: Position,
  recipes: readonly Recipe[],
): GameState => {
  if (
    !isInsideGrid(state, from) ||
    !isInsideGrid(state, to) ||
    isSamePosition(from, to)
  ) {
    return state;
  }

  const sourceItem = state.grid[from.y]?.[from.x]?.itemId;
  const targetItem = state.grid[to.y]?.[to.x]?.itemId;

  if (!sourceItem || !targetItem) return state;

  const matchedRecipe = recipes.find((recipe) =>
    recipeMatches(recipe, sourceItem, targetItem),
  );

  if (!matchedRecipe) return state;

  const grid = state.grid.map((row, y) =>
    row.map((cell, x) => {
      if (x === from.x && y === from.y) return { ...cell, itemId: null };
      if (x === to.x && y === to.y) {
        return { ...cell, itemId: matchedRecipe.result };
      }
      return cell;
    }),
  );

  return { ...state, grid };
};

export const processMoveOrMerge = (
  state: GameState,
  from: Position,
  to: Position,
  recipes: readonly Recipe[],
): GameState => {
  if (
    !isInsideGrid(state, from) ||
    !isInsideGrid(state, to) ||
    isSamePosition(from, to)
  ) return state;

  const source = state.grid[from.y]?.[from.x]?.itemId;
  const target = state.grid[to.y]?.[to.x]?.itemId;
  if (!source) return state;
  if (target) return processMerge(state, from, to, recipes);

  const grid = state.grid.map((row, y) =>
    row.map((cell, x) => {
      if (x === from.x && y === from.y) return { ...cell, itemId: null };
      if (x === to.x && y === to.y) return { ...cell, itemId: source };
      return cell;
    }),
  );
  return { ...state, grid };
};
