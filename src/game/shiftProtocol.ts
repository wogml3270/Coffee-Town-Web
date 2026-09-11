import { fridgeIngredients, labels, recipes, stationUnlockStage, type CombinationRecipe, type ItemId, type StationId } from "./catalog";
import { autoCombine, calculateShiftScore, combineSelected, createShift, interactStation, takeFridgeIngredient, tick, type ShiftState, type Upgrades } from "./rules";

export const shiftProtocolVersion = 1;
export type ShiftAction = Readonly<{
  at: number;
  kind: "station" | "combine" | "discard" | "fridge" | "water";
  slot: number;
  target?: string;
}>;
export type ShiftReceipt = Readonly<{
  sessionId: string;
  version: number;
  elapsed: number;
  actions: readonly ShiftAction[];
  seenMenuStages: readonly number[];
}>;
export type ShiftSession = Readonly<{ id: string; stageId: number; seed: number; upgrades: Upgrades }>;

// Both the browser and the server execute this exact action reducer. Inventory slots,
// rather than random UUIDs, make the manufacturing log reproducible on the server.
export const applyShiftAction = (state: ShiftState, action: ShiftAction, recipeBook: readonly CombinationRecipe[] = recipes): ShiftState => {
  if (state.time <= 0) throw new Error("SHIFT_CLOSED");
  const selected = state.inventory[action.slot]?.uid ?? null;
  let next = state;
  switch (action.kind) {
    case "station": {
      if (!Object.hasOwn(stationUnlockStage, action.target ?? "")) throw new Error("INVALID_STATION");
      const station = action.target as StationId;
      if (stationUnlockStage[station] > state.stageId || station === "fridge" || station === "water") throw new Error("STATION_LOCKED");
      next = interactStation(state, station, selected);
      break;
    }
    case "combine": next = combineSelected(state, selected, recipeBook); break;
    case "discard":
      return selected ? { ...state, inventory: state.inventory.filter(({ uid }) => uid !== selected), score: Math.max(0, state.score - 20), discardedItems: state.discardedItems + 1, notice: "재료를 버렸습니다" } : state;
    case "fridge":
      if (!fridgeIngredients.some(({ itemId, minStage }) => itemId === action.target && minStage <= state.stageId)) throw new Error("INGREDIENT_LOCKED");
      next = takeFridgeIngredient(state, action.target as ItemId); break;
    case "water":
      if (action.target !== "hot_water" && action.target !== "cold_water") throw new Error("INVALID_WATER");
      next = takeFridgeIngredient(state, action.target); break;
    default: throw new Error("INVALID_ACTION");
  }
  return autoCombine(next, recipeBook);
};

export const verifyShift = (session: ShiftSession, receipt: ShiftReceipt, wallSeconds: number) => {
  if (receipt.version !== shiftProtocolVersion || receipt.sessionId !== session.id) throw new Error("INVALID_SESSION");
  if (!Number.isInteger(receipt.elapsed) || receipt.elapsed < 0 || receipt.elapsed > 360 || receipt.elapsed > wallSeconds + 2) throw new Error("INVALID_DURATION");
  if (!Array.isArray(receipt.actions) || receipt.actions.length > 12000) throw new Error("INVALID_ACTIONS");
  if (!Array.isArray(receipt.seenMenuStages) || receipt.seenMenuStages.length > 15 || receipt.seenMenuStages.some((stage) => !Number.isInteger(stage) || stage < 1 || stage > session.stageId)) throw new Error("INVALID_MENU_STAGES");
  let state = createShift(session.upgrades, session.stageId, session.seed);
  let elapsed = 0;
  const discoveries = new Set<ItemId>();
  for (const action of receipt.actions) {
    if (!action || !Number.isInteger(action.at) || action.at < elapsed || action.at > receipt.elapsed || !Number.isInteger(action.slot) || action.slot < -1 || action.slot > 8) throw new Error("INVALID_ACTION");
    while (elapsed < action.at) { state = tick(state); elapsed++; }
    state = applyShiftAction(state, action);
    state.inventory.forEach(({ itemId }) => { if (Object.hasOwn(labels, itemId)) discoveries.add(itemId); });
  }
  while (elapsed < receipt.elapsed) { state = tick(state); elapsed++; }
  return { state, score: calculateShiftScore(state), discoveries: [...discoveries] };
};
