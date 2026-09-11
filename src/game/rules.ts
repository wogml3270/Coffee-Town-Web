import type { CombinationRecipe, DrinkId, InventoryItem, ItemId, Order, StationId } from "./catalog";
import { labels, menuCatalog, recipes, stages, stationProcesses } from "./catalog";

export type Upgrades = Readonly<{
  speed: number;
  espressoSpeed: number;
  coldDrinkSpeed: number;
  movement: number;
  multitask: number;
  feverCharge: number;
  feverDuration: number;
  feverProfit: number;
  tips: number;
  comboGuard: number;
  automation: number;
  autoServe: number;
  autoPickup: number;
}>;
export type StationPhase = "idle" | "processing" | "ready";
export type StationRuntime = Readonly<{
  phase: StationPhase;
  remaining: number;
  total: number;
  output: ItemId | null;
}>;
export type ShiftState = Readonly<{
  time: number;
  gold: number;
  score: number;
  combo: number;
  maxCombo: number;
  mistakes: number;
  discardedItems: number;
  satisfactionTotal: number;
  orderStartedAt: number;
  fever: number;
  orderSequence: number;
  order: Order;
  orders: readonly Order[];
  inventory: readonly InventoryItem[];
  stations: Readonly<Record<StationId, StationRuntime>>;
  activeWork: StationId | null;
  notice: string;
  upgrades: Upgrades;
  automationEnabled: boolean;
  autoServeEnabled: boolean;
  autoPickupEnabled: boolean;
  stageId: number;
  rewardMultiplier: number;
  seed: number;
}>;

export const defaultUpgrades: Upgrades = {
  speed: 0,
  espressoSpeed: 0,
  coldDrinkSpeed: 0,
  movement: 0,
  multitask: 0,
  feverCharge: 0,
  feverDuration: 0,
  feverProfit: 0,
  tips: 0,
  comboGuard: 0,
  automation: 0,
  autoServe: 0,
  autoPickup: 0,
};
const stationIds: readonly StationId[] = [
  "grinder",
  "espresso",
  "cups",
  "water",
  "coldWater",
  "fridge",
  "steam",
  "ice",
  "sparkling",
  "coldBrew",
  "blender",
  "serve",
];
const idle = (): StationRuntime => ({ phase: "idle", remaining: 0, total: 0, output: null });
const emptyStations = (): Record<StationId, StationRuntime> =>
  Object.fromEntries(stationIds.map((id) => [id, idle()])) as Record<StationId, StationRuntime>;
const uid = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const stageMenu = (stageId: number) => menuCatalog.filter(({ stage }) => stage <= stageId);
const orderRandom = (seed: number, sequence: number) => {
  let value = (seed + Math.imul(sequence + 1, 0x6d2b79f5)) | 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
const makeOrder = (sequence: number, stageId: number, seed: number, previous?: DrinkId): Order => {
  const menu = stageMenu(stageId);
  const candidates = menu.length > 1 ? menu.filter(({ id }) => id !== previous) : menu;
  const selected = candidates[Math.floor(orderRandom(seed, sequence) * candidates.length)] ?? menu[0]!;
  return { id: sequence, itemId: selected.id, name: selected.name, reward: selected.reward };
};
const makeOrderQueue = (
  sequence: number,
  stageId: number,
  seed: number,
  previous?: DrinkId,
): readonly Order[] => {
  const orders: Order[] = [];
  let last = previous;
  for (let index = 0; index < 3; index += 1) {
    const order = makeOrder(sequence + index, stageId, seed, last);
    orders.push(order);
    last = order.itemId;
  }
  return orders;
};
export const businessClock = (remainingSeconds: number) => {
  const totalMinutes = 540 + (360 - Math.max(0, Math.min(360, remainingSeconds))) * 2;
  const hours = Math.min(21, Math.floor(totalMinutes / 60));
  const minutes = hours === 21 ? 0 : totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
const inventoryLimit = 9;
const add = (state: ShiftState, itemId: ItemId): readonly InventoryItem[] =>
  state.inventory.length >= inventoryLimit ? state.inventory : [...state.inventory, { uid: uid(), itemId }];
const without = (inventory: readonly InventoryItem[], uidToRemove: string) =>
  inventory.filter(({ uid: itemUid }) => itemUid !== uidToRemove);
const espressoStations: readonly StationId[] = ["grinder", "espresso", "steam", "coldBrew"];
const coldDrinkStations: readonly StationId[] = ["ice", "sparkling", "blender"];
const duration = (base: number, upgrades: Upgrades, fever: number, station: StationId) => {
  if (fever) return 1;
  const specialized = espressoStations.includes(station)
    ? upgrades.espressoSpeed * 0.05
    : coldDrinkStations.includes(station)
      ? upgrades.coldDrinkSpeed * 0.05
      : 0;
  return Math.max(1, Math.ceil(base * Math.max(0.15, 1 - upgrades.speed * 0.12 - specialized)));
};
const setStation = (state: ShiftState, station: StationId, runtime: StationRuntime): ShiftState => ({
  ...state,
  stations: { ...state.stations, [station]: runtime },
});
const begin = (
  state: ShiftState,
  station: StationId,
  output: ItemId,
  seconds: number,
  inventory = state.inventory,
): ShiftState => {
  const total = duration(seconds, state.upgrades, state.fever, station);
  return {
    ...setStation(state, station, { phase: "processing", remaining: total, total, output }),
    inventory,
    activeWork: station,
    notice: `${total}초 동안 작업 중입니다`,
  };
};

export const createShift = (
  upgrades: Upgrades = defaultUpgrades,
  stageId = 1,
  seed = Math.floor(Math.random() * 2147483647),
): ShiftState => {
  const stage = stages.find(({ id }) => id === stageId) ?? stages[0]!;
  const orders = makeOrderQueue(0, stage.id, seed);
  return {
    time: 360,
    gold: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    mistakes: 0,
    discardedItems: 0,
    satisfactionTotal: 0,
    orderStartedAt: 360,
    fever: 0,
    orderSequence: 0,
    order: orders[0]!,
    orders,
    inventory: [],
    stations: emptyStations(),
    activeWork: null,
    notice: "09:00 · 오늘의 영업을 시작합니다",
    upgrades,
    automationEnabled: upgrades.automation > 0,
    autoServeEnabled: upgrades.autoServe > 0,
    autoPickupEnabled: upgrades.autoPickup > 0,
    stageId: stage.id,
    rewardMultiplier: stage.rewardMultiplier,
    seed,
  };
};

export type ShiftScoreBreakdown = Readonly<{
  orderPoints: number;
  accuracyBonus: number;
  comboBonus: number;
  satisfactionBonus: number;
  closingBonus: number;
  total: number;
  accuracy: number;
  averageSatisfaction: number;
}>;

const orderBaseScore = (itemId: DrinkId) => {
  const menu = menuCatalog.find(({ id }) => id === itemId)!;
  const steps = menu.recipe.split(/\+|→/).length;
  return 80 + steps * 30 + menu.stage * 15;
};

export const calculateOrderScore = (state: ShiftState, combo: number, fever: number) => {
  const elapsed = Math.max(0, state.orderStartedAt - state.time);
  const satisfaction = Math.max(40, 100 - elapsed * 2);
  const speedBonus = elapsed <= 12 ? 0.4 : elapsed <= 25 ? 0.2 : 0;
  const comboMultiplier = Math.min(2, 1 + Math.max(0, combo - 1) * 0.1);
  const feverMultiplier = fever ? 1.2 : 1;
  const points = Math.round(
    orderBaseScore(state.order.itemId) *
      (1 + speedBonus + (satisfaction / 100) * 0.3) *
      comboMultiplier *
      feverMultiplier,
  );
  return { points, satisfaction };
};

export const calculateShiftScore = (state: ShiftState): ShiftScoreBreakdown => {
  const attempts = state.orderSequence + state.mistakes;
  const accuracy = attempts ? state.orderSequence / attempts : 0;
  const averageSatisfaction = state.orderSequence
    ? Math.round(state.satisfactionTotal / state.orderSequence)
    : 0;
  const accuracyBonus = state.orderSequence && state.mistakes === 0 ? 1000 : Math.round(accuracy * 500);
  const comboBonus = state.maxCombo >= 10 ? 500 : 0;
  const satisfactionBonus = averageSatisfaction >= 90 ? 500 : 0;
  const closingBonus = state.time === 0 ? 300 : 0;
  return {
    orderPoints: state.score,
    accuracyBonus,
    comboBonus,
    satisfactionBonus,
    closingBonus,
    total: state.score + accuracyBonus + comboBonus + satisfactionBonus + closingBonus,
    accuracy: Math.round(accuracy * 100),
    averageSatisfaction,
  };
};

export const tick = (state: ShiftState): ShiftState => {
  let completedWork = false;
  const stations = Object.fromEntries(
    stationIds.map((id) => {
      const runtime = state.stations[id];
      if (runtime.phase !== "processing") return [id, runtime];
      const remaining = Math.max(0, runtime.remaining - 1);
      if (remaining > 0) return [id, { ...runtime, remaining }];
      completedWork = true;
      return [id, { ...runtime, phase: "ready", remaining: 0 }];
    }),
  ) as Record<StationId, StationRuntime>;
  let inventory = state.inventory;
  let autoCollected = false;
  if (state.autoPickupEnabled && state.upgrades.autoPickup > 0) {
    stationIds.forEach((station) => {
      const runtime = stations[station];
      if (runtime.phase !== "ready" || !runtime.output || inventory.length >= inventoryLimit) return;
      inventory = [...inventory, { uid: uid(), itemId: runtime.output }];
      stations[station] = idle();
      autoCollected = true;
    });
  }
  const nextActiveWork =
    state.activeWork && stations[state.activeWork].phase === "processing"
      ? state.activeWork
      : (stationIds.find((id) => stations[id].phase === "processing") ?? null);
  return {
    ...state,
    time: Math.max(0, state.time - 1),
    fever: Math.max(0, state.fever - 1),
    inventory,
    stations,
    activeWork: nextActiveWork,
    notice: autoCollected
      ? "작업 완료 · 결과물을 자동 회수했습니다"
      : completedWork
        ? "작업 완료 · 설비에서 결과물을 회수하세요"
        : state.notice,
  };
};

export const interactStation = (
  state: ShiftState,
  station: StationId,
  selectedUid: string | null,
): ShiftState => {
  const runtime = state.stations[station];
  if (runtime.phase === "processing") return { ...state, notice: `작업 중 · ${runtime.remaining}초 남음` };
  if (runtime.phase === "ready" && runtime.output) {
    if (state.inventory.length >= inventoryLimit)
      return { ...state, notice: "작업대가 가득 차서 회수할 수 없습니다" };
    return {
      ...setStation({ ...state, inventory: add(state, runtime.output), activeWork: null }, station, idle()),
      notice: "결과물을 회수했습니다",
    };
  }
  if (station === "serve")
    return selectedUid ? serve(state, selectedUid) : { ...state, notice: "완성된 음료를 선택하세요" };
  const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
  const process = stationProcesses.find(
    ({ station: processStation, input }) =>
      processStation === station && (!input || input === selected?.itemId),
  );
  if (process?.instant)
    return state.inventory.length >= inventoryLimit
      ? { ...state, notice: "작업대가 가득 찼습니다" }
      : {
          ...state,
          inventory: add(state, process.output),
          notice: "컵을 꺼냈습니다",
        };
  if (process && !process.input) return begin(state, station, process.output, process.seconds);
  if (process?.input && selected && process.input === selected.itemId) {
    let remainingInventory = without(state.inventory, selected.uid);
    const missing: ItemId[] = [];
    for (const requiredItem of process.additionalInputs ?? []) {
      const ingredient = remainingInventory.find(({ itemId }) => itemId === requiredItem);
      if (!ingredient) {
        missing.push(requiredItem);
        continue;
      }
      remainingInventory = without(remainingInventory, ingredient.uid);
    }
    if (missing.length)
      return {
        ...state,
        notice: `블렌더 재료 부족 · ${missing.map((itemId) => labels[itemId]).join(" + ")} 필요`,
      };
    return begin(state, station, process.output, process.seconds, remainingInventory);
  }
  if (station === "blender")
    return {
      ...state,
      notice: "맛 베이스를 선택하세요 · 모카/바닐라/말차/초콜릿 베이스 + 우유 + 얼음 필요",
    };
  return { ...state, notice: "선택한 재료에는 사용할 수 없는 설비입니다" };
};

export const takeFridgeIngredient = (state: ShiftState, itemId: ItemId): ShiftState =>
  state.inventory.length >= inventoryLimit
    ? { ...state, notice: "작업대가 가득 찼습니다" }
    : { ...state, inventory: add(state, itemId), notice: "냉장고에서 재료를 꺼냈습니다" };

const recipeOutputReaches = (
  output: ItemId,
  target: ItemId,
  recipeBook: readonly CombinationRecipe[],
  visited: ReadonlySet<ItemId> = new Set(),
): boolean => {
  if (output === target) return true;
  if (visited.has(output)) return false;
  const nextVisited = new Set(visited).add(output);
  return recipeBook.some(
    (recipe) =>
      recipe.inputs.includes(output) && recipeOutputReaches(recipe.output, target, recipeBook, nextVisited),
  );
};

const preferCurrentOrderPath = (
  candidates: readonly CombinationRecipe[],
  target: ItemId,
  recipeBook: readonly CombinationRecipe[],
) => candidates.find(({ output }) => recipeOutputReaches(output, target, recipeBook)) ?? candidates[0];

export const combineSelected = (
  state: ShiftState,
  selectedUid: string | null,
  recipeBook: readonly CombinationRecipe[] = recipes,
): ShiftState => {
  const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
  if (!selected) return { ...state, notice: "먼저 조합할 재료를 선택하세요" };
  const candidates = recipeBook.filter(
    ({ inputs }) =>
      inputs.includes(selected.itemId) &&
      state.inventory.some(
        ({ uid: otherUid, itemId }) => otherUid !== selected.uid && inputs.includes(itemId),
      ),
  );
  const recipe = preferCurrentOrderPath(candidates, state.order.itemId, recipeBook);
  if (!recipe) return { ...state, notice: "선택한 재료와 조합 가능한 재료가 없습니다" };
  const partnerItemId = recipe.inputs[0] === selected.itemId ? recipe.inputs[1] : recipe.inputs[0];
  const partner = state.inventory.find(
    ({ uid: otherUid, itemId }) => otherUid !== selected.uid && itemId === partnerItemId,
  );
  if (!partner) return state;
  const inventory = without(without(state.inventory, selected.uid), partner.uid);
  return {
    ...state,
    inventory: [...inventory, { uid: uid(), itemId: recipe.output }],
    notice: "음료 조합 성공",
  };
};

export const autoCombine = (
  state: ShiftState,
  recipeBook: readonly CombinationRecipe[] = recipes,
): ShiftState => {
  const serveReadyOrder = (current: ShiftState) => {
    if (current.autoServeEnabled === false || !current.upgrades.autoServe) return current;
    const completed = current.inventory.find(({ itemId }) => itemId === current.order.itemId);
    return completed ? serve(current, completed.uid) : current;
  };
  if (state.automationEnabled === false || !state.upgrades.automation) return serveReadyOrder(state);
  const candidates = recipeBook.filter(({ inputs }) =>
    inputs.every((input, index) =>
      state.inventory.some(
        ({ itemId }, itemIndex) => itemId === input && (inputs[0] !== inputs[1] || itemIndex >= index),
      ),
    ),
  );
  const recipe = preferCurrentOrderPath(candidates, state.order.itemId, recipeBook);
  if (!recipe) return serveReadyOrder(state);
  const first = state.inventory.find(({ itemId }) => itemId === recipe.inputs[0]);
  const second = state.inventory.find(
    ({ uid: itemUid, itemId }) => itemUid !== first?.uid && itemId === recipe.inputs[1],
  );
  if (!first || !second) return state;
  const inventory = [
    ...without(without(state.inventory, first.uid), second.uid),
    { uid: uid(), itemId: recipe.output },
  ];
  return autoCombine({ ...state, inventory, notice: `자동 조합 · ${recipe.output}` }, recipeBook);
};

export const serve = (state: ShiftState, uidToServe: string): ShiftState => {
  const item = state.inventory.find(({ uid: itemUid }) => itemUid === uidToServe);
  if (!item || item.itemId !== state.order.itemId)
    return {
      ...state,
      score: Math.max(0, state.score - 100),
      mistakes: state.mistakes + 1,
      combo:
        state.upgrades.comboGuard >= 2
          ? state.combo
          : Math.max(0, state.combo - state.upgrades.comboGuard || 0),
      notice: state.upgrades.comboGuard ? "서비스 회복으로 콤보를 보호했습니다" : "주문과 다른 음료입니다",
    };
  const combo = state.combo + 1;
  const feverTarget = Math.max(3, 5 - Math.floor(state.upgrades.feverCharge / 2));
  const fever = combo >= feverTarget && !state.fever ? 15 + state.upgrades.feverDuration * 3 : state.fever;
  const multiplier = fever ? 3 + state.upgrades.feverProfit * 0.35 : 1;
  const next = state.orderSequence + 1;
  const reward = Math.round(
    state.order.reward * multiplier * state.rewardMultiplier * (1 + state.upgrades.tips * 0.06),
  );
  const remainingOrders = state.orders.slice(1);
  const previous = remainingOrders.at(-1)?.itemId ?? state.order.itemId;
  const nextOrder = makeOrder(next + remainingOrders.length, state.stageId, state.seed, previous);
  const orders = [...remainingOrders, nextOrder];
  const earnedScore = calculateOrderScore(state, combo, fever);
  return {
    ...state,
    inventory: without(state.inventory, item.uid),
    gold: state.gold + reward,
    score: state.score + earnedScore.points,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    satisfactionTotal: state.satisfactionTotal + earnedScore.satisfaction,
    orderStartedAt: state.time,
    fever,
    orderSequence: next,
    order: orders[0]!,
    orders,
    notice: fever > state.fever ? "FEVER MODE · 속도 상승 · 이동 작업" : `+${reward}G`,
  };
};
