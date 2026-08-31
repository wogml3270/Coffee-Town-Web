import type { DrinkId, InventoryItem, ItemId, Order, StationId } from "./catalog";
import { recipes, stages } from "./catalog";

export type Upgrades = Readonly<{ speed: number; movement: number; feverCharge: number; feverDuration: number; tips: number; automation: number }>;
export type StationPhase = "idle" | "processing" | "ready";
export type StationRuntime = Readonly<{ phase: StationPhase; remaining: number; total: number; output: ItemId | null }>;
export type ShiftState = Readonly<{
  time: number; gold: number; combo: number; fever: number; orderSequence: number; order: Order;
  inventory: readonly InventoryItem[]; stations: Readonly<Record<StationId, StationRuntime>>;
  activeWork: StationId | null; notice: string; upgrades: Upgrades; stageId: number; targetOrders: number; rewardMultiplier: number;
}>;

export const defaultUpgrades: Upgrades = { speed: 0, movement: 0, feverCharge: 0, feverDuration: 0, tips: 0, automation: 0 };
const stationIds: readonly StationId[] = ["grinder", "espresso", "cups", "coldCups", "water", "fridge", "steam", "ice", "sparkling", "lemon", "grapefruit", "serve"];
const idle = (): StationRuntime => ({ phase: "idle", remaining: 0, total: 0, output: null });
const emptyStations = (): Record<StationId, StationRuntime> => Object.fromEntries(stationIds.map((id) => [id, idle()])) as Record<StationId, StationRuntime>;
const uid = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const drinkData: Readonly<Record<DrinkId, Omit<Order, "id" | "itemId">>> = {
  americano: { name: "따뜻한 아메리카노", reward: 100 }, latte: { name: "카페라떼", reward: 130 },
  lemonade: { name: "레몬에이드", reward: 160 }, grapefruitade: { name: "자몽에이드", reward: 180 },
};
const stageMenu = (stageId: number): readonly DrinkId[] => stageId >= 3 ? ["americano", "latte", "lemonade", "grapefruitade"] : stageId >= 2 ? ["americano", "latte", "lemonade"] : ["americano", "latte"];
const makeOrder = (sequence: number, stageId: number, previous?: DrinkId): Order => { const menu = stageMenu(stageId); const candidates = menu.length > 1 ? menu.filter((itemId) => itemId !== previous) : menu; const itemId = candidates[Math.floor(Math.random() * candidates.length)]!; return { id: sequence, itemId, ...drinkData[itemId] }; };
const inventoryLimit = 9;
const add = (state: ShiftState, itemId: ItemId): readonly InventoryItem[] => state.inventory.length >= inventoryLimit ? state.inventory : [...state.inventory, { uid: uid(), itemId }];
const without = (inventory: readonly InventoryItem[], uidToRemove: string) => inventory.filter(({ uid: itemUid }) => itemUid !== uidToRemove);
const duration = (base: number, upgrades: Upgrades, fever: number) => fever ? 1 : Math.max(1, Math.ceil(base * (1 - upgrades.speed * 0.12)));
const setStation = (state: ShiftState, station: StationId, runtime: StationRuntime): ShiftState => ({ ...state, stations: { ...state.stations, [station]: runtime } });
const begin = (state: ShiftState, station: StationId, output: ItemId, seconds: number, inventory = state.inventory): ShiftState => {
  const total = duration(seconds, state.upgrades, state.fever);
  return { ...setStation(state, station, { phase: "processing", remaining: total, total, output }), inventory, activeWork: station, notice: `${total}초 동안 작업 중입니다` };
};

export const createShift = (upgrades: Upgrades = defaultUpgrades, stageId = 1): ShiftState => {
  const stage = stages.find(({ id }) => id === stageId) ?? stages[0]!;
  return { time: stage.time, gold: 0, combo: 0, fever: 0, orderSequence: 0, order: makeOrder(0, stage.id), inventory: [], stations: emptyStations(), activeWork: null, notice: "설비 앞으로 이동해 작업을 시작하세요", upgrades, stageId: stage.id, targetOrders: stage.target, rewardMultiplier: stage.rewardMultiplier };
};

export const tick = (state: ShiftState): ShiftState => {
  let completedWork = false;
  const stations = Object.fromEntries(stationIds.map((id) => {
    const runtime = state.stations[id];
    if (runtime.phase !== "processing") return [id, runtime];
    const remaining = Math.max(0, runtime.remaining - 1);
    if (remaining > 0) return [id, { ...runtime, remaining }];
    completedWork = true; return [id, { ...runtime, phase: "ready", remaining: 0 }];
  })) as Record<StationId, StationRuntime>;
  return { ...state, time: Math.max(0, state.time - 1), fever: Math.max(0, state.fever - 1), stations, activeWork: completedWork ? null : state.activeWork, notice: completedWork ? "작업 완료 · 설비에서 결과물을 회수하세요" : state.notice };
};

export const interactStation = (state: ShiftState, station: StationId, selectedUid: string | null): ShiftState => {
  const runtime = state.stations[station];
  if (runtime.phase === "processing") return { ...state, notice: `작업 중 · ${runtime.remaining}초 남음` };
  if (runtime.phase === "ready" && runtime.output) {
    if (state.inventory.length >= inventoryLimit) return { ...state, notice: "작업대가 가득 차서 회수할 수 없습니다" };
    return { ...setStation({ ...state, inventory: add(state, runtime.output), activeWork: null }, station, idle()), notice: "결과물을 회수했습니다" };
  }
  if (station === "serve") return selectedUid ? serve(state, selectedUid) : { ...state, notice: "완성된 음료를 선택하세요" };
  const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
  const generators: Partial<Record<StationId, { output: ItemId; seconds: number }>> = {
    grinder: { output: "ground_coffee", seconds: 4 }, water: { output: "hot_water", seconds: 3 }, ice: { output: "ice", seconds: 4 }, sparkling: { output: "sparkling_water", seconds: 3 },
  };
  const instant: Partial<Record<StationId, ItemId>> = { cups: "hot_cup", coldCups: "cold_cup" };
  if (instant[station]) return state.inventory.length >= inventoryLimit ? { ...state, notice: "작업대가 가득 찼습니다" } : { ...state, inventory: add(state, instant[station]!), notice: `${station === "cups" ? "따뜻한 컵" : "아이스 컵"}을 꺼냈습니다` };
  const generator = generators[station];
  if (generator) return begin(state, station, generator.output, generator.seconds);
  if (station === "espresso" && selected?.itemId === "ground_coffee") return begin(state, station, "espresso", 7, without(state.inventory, selected.uid));
  if (station === "steam" && selected?.itemId === "milk") return begin(state, station, "steamed_milk", 6, without(state.inventory, selected.uid));
  return { ...state, notice: "선택한 재료에는 사용할 수 없는 설비입니다" };
};

export const takeFridgeIngredient = (state: ShiftState, itemId: ItemId): ShiftState => state.inventory.length >= inventoryLimit
  ? { ...state, notice: "작업대가 가득 찼습니다" }
  : { ...state, inventory: add(state, itemId), notice: "냉장고에서 재료를 꺼냈습니다" };

export const combineSelected = (state: ShiftState, selectedUid: string | null): ShiftState => {
  const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
  if (!selected) return { ...state, notice: "먼저 조합할 재료를 선택하세요" };
  const recipe = recipes.find(({ inputs }) => inputs.includes(selected.itemId) && state.inventory.some(({ uid: otherUid, itemId }) => otherUid !== selected.uid && inputs.includes(itemId)));
  if (!recipe) return { ...state, notice: "선택한 재료와 조합 가능한 재료가 없습니다" };
  const partner = state.inventory.find(({ uid: otherUid, itemId }) => otherUid !== selected.uid && recipe.inputs.includes(itemId));
  if (!partner) return state;
  const inventory = without(without(state.inventory, selected.uid), partner.uid);
  return { ...state, inventory: [...inventory, { uid: uid(), itemId: recipe.output }], notice: "음료 조합 성공" };
};

export const autoCombine = (state: ShiftState): ShiftState => {
  if (!state.upgrades.automation) return state;
  const recipe = recipes.find(({ inputs }) => inputs.every((input, index) => state.inventory.some(({ itemId }, itemIndex) => itemId === input && (inputs[0] !== inputs[1] || itemIndex >= index))));
  if (!recipe) return state;
  const first = state.inventory.find(({ itemId }) => itemId === recipe.inputs[0]);
  const second = state.inventory.find(({ uid: itemUid, itemId }) => itemUid !== first?.uid && itemId === recipe.inputs[1]);
  if (!first || !second) return state;
  const inventory = [...without(without(state.inventory, first.uid), second.uid), { uid: uid(), itemId: recipe.output }];
  return autoCombine({ ...state, inventory, notice: `자동 조합 · ${recipe.output}` });
};

export const serve = (state: ShiftState, uidToServe: string): ShiftState => {
  const item = state.inventory.find(({ uid: itemUid }) => itemUid === uidToServe);
  if (!item || item.itemId !== state.order.itemId) return { ...state, combo: 0, notice: "주문과 다른 음료입니다" };
  const combo = state.combo + 1;
  const feverTarget = Math.max(3, 5 - Math.floor(state.upgrades.feverCharge / 2));
  const fever = combo >= feverTarget && !state.fever ? 15 + state.upgrades.feverDuration * 3 : state.fever;
  const multiplier = fever ? 3 : 1;
  const next = state.orderSequence + 1;
  const reward = Math.round(state.order.reward * multiplier * state.rewardMultiplier * (1 + state.upgrades.tips * 0.06));
  return { ...state, inventory: without(state.inventory, item.uid), gold: state.gold + reward, combo, fever, orderSequence: next, order: makeOrder(next, state.stageId, state.order.itemId), notice: fever > state.fever ? "FEVER MODE · 속도 상승 · 이동 작업" : `+${reward}G` };
};
