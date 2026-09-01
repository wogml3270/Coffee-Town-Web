import { create } from "zustand";
import { persist } from "zustand/middleware";
import { drinkIds, recipes, stages, type CombinationRecipe, type DrinkId, type ItemId, type StationId } from "./catalog";
import { autoCombine, combineSelected, createShift, defaultUpgrades, interactStation, takeFridgeIngredient, tick, type ShiftState, type Upgrades } from "./rules";

export type Screen = "title" | "shift" | "result" | "upgrade";
export type UpgradeId = keyof Upgrades;
export const exitEarnings = (screen: Screen, sessionGold: number) => screen === "shift" ? Math.max(0, sessionGold) : 0;
export const unlockedAfterFullDay = (unlockedStage:number, playedStage:number) => Math.min(stages.length,Math.max(unlockedStage,playedStage+1));
type GameStore = Readonly<{
  screen: Screen; shift: ShiftState; selectedUid: string | null; nearbyStation: StationId | null; fridgeOpen: boolean;
  bankGold: number; upgrades: Upgrades; selectedStage: number; unlockedStage: number;
  discoveredRecipes: readonly DrinkId[];
  combinationRecipes: readonly CombinationRecipe[]; setCombinationRecipes: (recipes: readonly CombinationRecipe[]) => void;
  playerNickname: string | null; setPlayerNickname: (nickname: string) => void;
  hydrateProgress: (gold: number, unlockedStage: number, upgrades: Partial<Upgrades>, discoveredRecipes?: readonly DrinkId[]) => void;
  start: () => void; exit: () => void; finish: () => void; openUpgrade: () => void; setStage: (stage: number) => void;
  tick: () => void; select: (uid: string | null) => void;
  interact: (station: StationId) => void; interactNearby: () => void; combine: () => void; setNearbyStation: (station: StationId | null) => void;
  closeFridge: () => void; takeFromFridge: (itemId: ItemId) => void;
  buyUpgrade: (upgrade: UpgradeId) => void;
}>;

export const maxUpgradeLevel = (upgrade: UpgradeId) => upgrade === "automation" ? 1 : 5;
export const upgradeCost = (upgrade: UpgradeId, level: number) => upgrade === "automation" ? 50000 : ({ speed: 180, movement: 140, feverCharge: 260, feverDuration: 240, tips: 220 }[upgrade] * (level + 1));
const mergeUpgrades = (local: Upgrades, cloud: Partial<Upgrades>): Upgrades => Object.fromEntries(Object.entries(local).map(([id, level]) => [id, Math.max(level, typeof cloud[id as UpgradeId] === "number" ? cloud[id as UpgradeId]! : 0)])) as Upgrades;
const mergeDiscoveries = (current: readonly DrinkId[], shift: ShiftState) => [...new Set([...current, ...shift.inventory.map(({ itemId }) => itemId).filter((itemId): itemId is DrinkId => drinkIds.includes(itemId as DrinkId))])];

export const useGame = create<GameStore>()(persist((set, get) => ({
  screen: "title", shift: createShift(), selectedUid: null, nearbyStation: null, fridgeOpen: false,
  bankGold: 0, upgrades: defaultUpgrades, selectedStage: 1, unlockedStage: 1, discoveredRecipes: [], combinationRecipes: recipes, playerNickname: null,
  setCombinationRecipes: (combinationRecipes) => set({ combinationRecipes: combinationRecipes.length ? combinationRecipes : recipes }),
  setPlayerNickname: (playerNickname) => set({ playerNickname }),
  hydrateProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = []) => set(({ bankGold, upgrades, discoveredRecipes }) => ({ bankGold: Math.max(bankGold, gold), unlockedStage: Math.max(1, Math.min(stages.length, unlockedStage)), upgrades: mergeUpgrades(upgrades, cloudUpgrades), discoveredRecipes: [...new Set([...discoveredRecipes, ...cloudRecipes])] })),
  start: () => set(({ upgrades, selectedStage }) => ({ screen: "shift", shift: createShift(upgrades, selectedStage), selectedUid: null, nearbyStation: null, fridgeOpen: false })),
  exit: () => set(({ screen, shift, bankGold, upgrades, selectedStage }) => ({ screen: "title", bankGold: bankGold + exitEarnings(screen, shift.gold), shift: createShift(upgrades, selectedStage), selectedUid: null, nearbyStation: null, fridgeOpen: false })),
  finish: () => set(({ shift, bankGold, unlockedStage }) => ({ screen: "result", selectedUid: null, nearbyStation: null, bankGold: bankGold + shift.gold, unlockedStage: unlockedAfterFullDay(unlockedStage,shift.stageId) })),
  openUpgrade: () => set({ screen: "upgrade" }),
  setStage: (selectedStage) => set(({ unlockedStage }) => ({ selectedStage: Math.min(selectedStage, unlockedStage) })),
  tick: () => set(({ shift }) => ({ shift: tick(shift) })),
  select: (selectedUid) => set({ selectedUid }),
  interact: (station) => set(({ shift, selectedUid }) => {
    if (station === "fridge") return { fridgeOpen: true };
    const produced = interactStation(shift, station, selectedUid);
    const next = autoCombine(produced, get().combinationRecipes);
    const selectedStillExists = next.inventory.some(({ uid }) => uid === selectedUid);
    const newest = next.inventory.find(({ uid }) => !shift.inventory.some((previous) => previous.uid === uid));
    return { shift: next, discoveredRecipes: mergeDiscoveries(get().discoveredRecipes, next), selectedUid: selectedStillExists ? selectedUid : newest?.uid ?? null };
  }),
  interactNearby: () => { const station = get().nearbyStation; if (station) get().interact(station); },
  combine: () => set(({ shift, selectedUid, discoveredRecipes, combinationRecipes }) => { const next = combineSelected(shift, selectedUid, combinationRecipes); const newest = next.inventory.find(({ uid }) => !shift.inventory.some((previous) => previous.uid === uid)); return { shift: next, discoveredRecipes: mergeDiscoveries(discoveredRecipes, next), selectedUid: newest?.uid ?? selectedUid }; }),
  setNearbyStation: (nearbyStation) => set({ nearbyStation }),
  closeFridge: () => set({ fridgeOpen: false }),
  takeFromFridge: (itemId) => set(({ shift, discoveredRecipes, combinationRecipes }) => { const next=autoCombine(takeFridgeIngredient(shift,itemId), combinationRecipes); return { shift:next, discoveredRecipes:mergeDiscoveries(discoveredRecipes,next), fridgeOpen:false }; }),
  buyUpgrade: (upgrade) => set(({ upgrades, bankGold }) => {
    const level = upgrades[upgrade];
    if (level >= maxUpgradeLevel(upgrade)) return { bankGold, upgrades };
    const cost = upgradeCost(upgrade, level);
    if (bankGold < cost) return { bankGold, upgrades };
    return { bankGold: bankGold - cost, upgrades: { ...upgrades, [upgrade]: level + 1 } };
  }),
}), { name: "coffee-town-local-progress", partialize: ({ bankGold, upgrades, selectedStage, unlockedStage, discoveredRecipes, playerNickname }) => ({ bankGold, upgrades, selectedStage, unlockedStage, discoveredRecipes, playerNickname }), merge: (persisted, current) => { const saved = persisted as Partial<GameStore>; return { ...current, ...saved, upgrades: { ...current.upgrades, ...saved.upgrades }, discoveredRecipes:[...new Set([...(current.discoveredRecipes ?? []),...(saved.discoveredRecipes ?? [])])] }; } }));
