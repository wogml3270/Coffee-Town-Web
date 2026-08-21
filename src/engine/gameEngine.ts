import type { BaristaActionId, BaristaRecipe, GameState, ItemId, Order, Position, Recipe } from "../types/game";
import { processMoveOrMerge } from "./mergeEngine";
import { applyBaristaAction, isPreparationComplete, startPreparation } from "./baristaEngine";

export type GameAction =
  | Readonly<{ type: "START"; bonusTimeSec?: number }>
  | Readonly<{ type: "RETURN_HOME" }>
  | Readonly<{ type: "ABANDON_SESSION"; gold: number; xp: number; level: number }>
  | Readonly<{ type: "SELECT_ORDER"; orderId: string }>
  | Readonly<{ type: "BARISTA_ACTION"; actionId: BaristaActionId; recipe: BaristaRecipe }>
  | Readonly<{ type: "DISCARD_DRINK" }>
  | Readonly<{ type: "MISTAKE"; penaltySec: number }>
  | Readonly<{ type: "SERVE_DRINK"; replacement: Order; recipe: BaristaRecipe; bonusGold?: number; bonusTimeSec?: number }>
  | Readonly<{ type: "HYDRATE_PROGRESS"; gold: number; xp: number; level: number }>
  | Readonly<{ type: "BUY_UPGRADE"; cost: number }>
  | Readonly<{ type: "TICK" }>
  | Readonly<{ type: "MOVE_OR_MERGE"; from: Position; to: Position; recipes: readonly Recipe[] }>
  | Readonly<{ type: "ADD_ITEM"; itemId: ItemId }>
  | Readonly<{ type: "SERVE_ORDER"; from: Position; orderId: string; replacement: Order; bonusGold?: number; bonusTimeSec?: number }>;

const updateCell = (
  state: GameState,
  position: Position,
  itemId: ItemId | null,
) => state.grid.map((row, y) => row.map((cell, x) =>
  x === position.x && y === position.y ? { ...cell, itemId } : cell,
));

export const addItemToBoard = (state: GameState, itemId: ItemId): GameState => {
  const empty = state.grid.flat().find((cell) => cell.itemId === null);
  return empty ? { ...state, grid: updateCell(state, empty, itemId) } : state;
};

export const serveOrder = (
  state: GameState,
  from: Position,
  orderId: string,
  replacement: Order,
  bonusGold = 0,
): GameState => {
  const itemId = state.grid[from.y]?.[from.x]?.itemId;
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!itemId || !order || itemId !== order.itemId) return state;

  const xp = state.xp + order.rewardXp;
  const level = Math.max(state.level, Math.floor(Math.sqrt(xp / 100)) + 1);
  return {
    ...state,
    gold: state.gold + order.reward + bonusGold,
    xp,
    level,
    grid: updateCell(state, from, null),
    orders: state.orders.map((candidate) =>
      candidate.id === orderId ? replacement : candidate,
    ),
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === "HYDRATE_PROGRESS") {
    return { ...state, gold: action.gold, xp: action.xp, level: action.level };
  }
  if (action.type === "BUY_UPGRADE") {
    return action.cost <= state.gold ? { ...state, gold: state.gold - action.cost } : state;
  }
  if (action.type === "RETURN_HOME") return { ...state, phase: "start" };
  if (action.type === "ABANDON_SESSION") return { ...state, phase: "start", preparation: null, gold: action.gold, xp: action.xp, level: action.level, remainingTimeSec: 300 };
  if (action.type === "SELECT_ORDER") {
    const order = state.orders.find((candidate) => candidate.id === action.orderId);
    return order ? { ...state, preparation: startPreparation(order) } : state;
  }
  if (action.type === "DISCARD_DRINK") return { ...state, preparation: null };
  if (action.type === "MISTAKE") return { ...state, remainingTimeSec: Math.max(0, state.remainingTimeSec - action.penaltySec) };
  if (action.type === "START") {
    const firstOrder = state.orders[0];
    return { ...state, phase: "playing", remainingTimeSec: 300 + (action.bonusTimeSec ?? 0), preparation: firstOrder ? startPreparation(firstOrder) : null };
  }
  if (state.phase !== "playing") return state;

  if (action.type === "TICK") {
    const remainingTimeSec = Math.max(0, state.remainingTimeSec - 1);
    return {
      ...state,
      remainingTimeSec,
      phase: remainingTimeSec === 0 ? "ended" : "playing",
    };
  }
  if (action.type === "BARISTA_ACTION") {
    if (!state.preparation) return state;
    const preparation = applyBaristaAction(state.preparation, action.recipe, action.actionId);
    return preparation === state.preparation ? state : { ...state, preparation };
  }
  if (action.type === "SERVE_DRINK") {
    const preparation = state.preparation;
    if (!preparation || !isPreparationComplete(preparation, action.recipe)) return state;
    const order = state.orders.find((candidate) => candidate.id === preparation.orderId);
    if (!order || order.itemId !== preparation.itemId) return state;
    const xp = state.xp + order.rewardXp;
    return {
      ...state,
      gold: state.gold + order.reward + (action.bonusGold ?? 0),
      xp,
      level: Math.max(state.level, Math.floor(Math.sqrt(xp / 100)) + 1),
      remainingTimeSec: state.remainingTimeSec + (action.bonusTimeSec ?? 0),
      preparation: startPreparation(action.replacement),
      orders: [action.replacement],
    };
  }
  if (action.type === "MOVE_OR_MERGE") {
    return processMoveOrMerge(state, action.from, action.to, action.recipes);
  }
  if (action.type === "ADD_ITEM") return addItemToBoard(state, action.itemId);
  if (action.type === "SERVE_ORDER") {
    const served = serveOrder(state, action.from, action.orderId, action.replacement, action.bonusGold);
    return served === state ? state : { ...served, remainingTimeSec: served.remainingTimeSec + (action.bonusTimeSec ?? 0) };
  }
  return state;
};
