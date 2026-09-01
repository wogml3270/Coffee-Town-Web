import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  drinkIds,
  recipes,
  stages,
  type CombinationRecipe,
  type DrinkId,
  type ItemId,
  type StationId,
} from "./catalog";
import {
  autoCombine,
  combineSelected,
  createShift,
  defaultUpgrades,
  interactStation,
  takeFridgeIngredient,
  tick,
  type ShiftState,
  type Upgrades,
} from "./rules";
import { guestProgressStorage, guestProgressStorageKey } from "./progressPersistence";

export type Screen = "title" | "shift" | "result" | "upgrade";
export type UpgradeId = keyof Upgrades;
export const exitEarnings = (screen: Screen, sessionGold: number) =>
  screen === "shift" ? Math.max(0, sessionGold) : 0;
export const unlockedAfterFullDay = (unlockedStage: number, playedStage: number) =>
  Math.min(stages.length, Math.max(unlockedStage, playedStage + 1));
type GameStore = Readonly<{
  screen: Screen;
  shift: ShiftState;
  selectedUid: string | null;
  nearbyStation: StationId | null;
  fridgeOpen: boolean;
  waterOpen: boolean;
  bankGold: number;
  upgrades: Upgrades;
  selectedStage: number;
  unlockedStage: number;
  discoveredRecipes: readonly DrinkId[];
  combinationRecipes: readonly CombinationRecipe[];
  setCombinationRecipes: (recipes: readonly CombinationRecipe[]) => void;
  playerNickname: string | null;
  setPlayerNickname: (nickname: string) => void;
  hydrateProgress: (
    gold: number,
    unlockedStage: number,
    upgrades: Partial<Upgrades>,
    discoveredRecipes?: readonly DrinkId[],
  ) => void;
  replaceProgress: (
    gold: number,
    unlockedStage: number,
    upgrades: Partial<Upgrades>,
    discoveredRecipes?: readonly DrinkId[],
  ) => void;
  resetGuestProgress: () => void;
  start: () => void;
  exit: () => void;
  finish: () => void;
  openUpgrade: () => void;
  setStage: (stage: number) => void;
  tick: () => void;
  select: (uid: string | null) => void;
  discard: (uid: string) => void;
  interact: (station: StationId) => void;
  interactNearby: () => void;
  combine: () => void;
  setNearbyStation: (station: StationId | null) => void;
  closeFridge: () => void;
  closeWater: () => void;
  takeWater: (itemId: "hot_water" | "cold_water") => void;
  takeFromFridge: (itemId: ItemId) => void;
  buyUpgrade: (upgrade: UpgradeId) => void;
}>;

export const maxUpgradeLevel = (upgrade: UpgradeId) => (upgrade === "automation" ? 1 : 5);
export const upgradeCost = (upgrade: UpgradeId, level: number) =>
  upgrade === "automation"
    ? 50000
    : { speed: 8000, movement: 6000, feverCharge: 12000, feverDuration: 10000, tips: 9000 }[upgrade] *
      (level + 1);
const mergeUpgrades = (local: Upgrades, cloud: Partial<Upgrades>): Upgrades =>
  Object.fromEntries(
    Object.entries(local).map(([id, level]) => [
      id,
      Math.max(level, typeof cloud[id as UpgradeId] === "number" ? cloud[id as UpgradeId]! : 0),
    ]),
  ) as Upgrades;
const mergeDiscoveries = (current: readonly DrinkId[], shift: ShiftState) => [
  ...new Set([
    ...current,
    ...shift.inventory
      .map(({ itemId }) => itemId)
      .filter((itemId): itemId is DrinkId => drinkIds.includes(itemId as DrinkId)),
  ]),
];

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: "title",
      shift: createShift(),
      selectedUid: null,
      nearbyStation: null,
      fridgeOpen: false,
      waterOpen: false,
      bankGold: 0,
      upgrades: defaultUpgrades,
      selectedStage: 1,
      unlockedStage: 1,
      discoveredRecipes: [],
      combinationRecipes: recipes,
      playerNickname: null,
      setCombinationRecipes: (combinationRecipes) =>
        set({ combinationRecipes: combinationRecipes.length ? combinationRecipes : recipes }),
      setPlayerNickname: (playerNickname) => set({ playerNickname }),
      hydrateProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = []) =>
        set({
          bankGold: Math.max(0, gold),
          unlockedStage: Math.max(1, Math.min(stages.length, unlockedStage)),
          selectedStage: 1,
          upgrades: { ...defaultUpgrades, ...cloudUpgrades },
          discoveredRecipes: [...new Set(cloudRecipes)],
        }),
      replaceProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = []) =>
        set({
          screen: "title",
          bankGold: Math.max(0, gold),
          unlockedStage: Math.max(1, Math.min(stages.length, unlockedStage)),
          selectedStage: 1,
          upgrades: { ...defaultUpgrades, ...cloudUpgrades },
          discoveredRecipes: [...new Set(cloudRecipes)],
          shift: createShift(),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
        }),
      resetGuestProgress: () =>
        set({
          screen: "title",
          bankGold: 0,
          unlockedStage: 1,
          selectedStage: 1,
          upgrades: defaultUpgrades,
          discoveredRecipes: [],
          playerNickname: null,
          shift: createShift(),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
        }),
      start: () =>
        set(({ upgrades, selectedStage }) => ({
          screen: "shift",
          shift: createShift(upgrades, selectedStage),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
        })),
      exit: () =>
        set(({ screen, shift, bankGold, upgrades, selectedStage }) => ({
          screen: "title",
          bankGold: bankGold + exitEarnings(screen, shift.gold),
          shift: createShift(upgrades, selectedStage),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
        })),
      finish: () =>
        set(({ shift, bankGold, unlockedStage }) => ({
          screen: "result",
          selectedUid: null,
          nearbyStation: null,
          bankGold: bankGold + shift.gold,
          unlockedStage: unlockedAfterFullDay(unlockedStage, shift.stageId),
        })),
      openUpgrade: () => set({ screen: "upgrade" }),
      setStage: (selectedStage) =>
        set(({ unlockedStage }) => ({ selectedStage: Math.min(selectedStage, unlockedStage) })),
      tick: () => set(({ shift }) => ({ shift: tick(shift) })),
      select: (selectedUid) => set({ selectedUid }),
      discard: (uid) =>
        set(({ shift, selectedUid }) => ({
          shift: {
            ...shift,
            inventory: shift.inventory.filter((item) => item.uid !== uid),
            notice: "재료를 버렸습니다",
          },
          selectedUid: selectedUid === uid ? null : selectedUid,
        })),
      interact: (station) =>
        set(({ shift, selectedUid }) => {
          if (station === "fridge") return { fridgeOpen: true };
          if (station === "water") return { waterOpen: true };
          const produced = interactStation(shift, station, selectedUid);
          const next = autoCombine(produced, get().combinationRecipes);
          const selectedStillExists = next.inventory.some(({ uid }) => uid === selectedUid);
          const newest = next.inventory.find(
            ({ uid }) => !shift.inventory.some((previous) => previous.uid === uid),
          );
          return {
            shift: next,
            discoveredRecipes: mergeDiscoveries(get().discoveredRecipes, next),
            selectedUid: selectedStillExists ? selectedUid : (newest?.uid ?? null),
          };
        }),
      interactNearby: () => {
        const station = get().nearbyStation;
        if (station) get().interact(station);
      },
      combine: () =>
        set(({ shift, selectedUid, discoveredRecipes, combinationRecipes }) => {
          const next = combineSelected(shift, selectedUid, combinationRecipes);
          const newest = next.inventory.find(
            ({ uid }) => !shift.inventory.some((previous) => previous.uid === uid),
          );
          return {
            shift: next,
            discoveredRecipes: mergeDiscoveries(discoveredRecipes, next),
            selectedUid: newest?.uid ?? selectedUid,
          };
        }),
      setNearbyStation: (nearbyStation) => set({ nearbyStation }),
      closeFridge: () => set({ fridgeOpen: false }),
      closeWater: () => set({ waterOpen: false }),
      takeWater: (itemId) =>
        set(({ shift, discoveredRecipes, combinationRecipes }) => {
          const next = autoCombine(takeFridgeIngredient(shift, itemId), combinationRecipes);
          return {
            shift: { ...next, notice: itemId === "hot_water" ? "온수를 받았습니다" : "냉수를 받았습니다" },
            discoveredRecipes: mergeDiscoveries(discoveredRecipes, next),
            waterOpen: false,
          };
        }),
      takeFromFridge: (itemId) =>
        set(({ shift, discoveredRecipes, combinationRecipes }) => {
          const next = autoCombine(takeFridgeIngredient(shift, itemId), combinationRecipes);
          return {
            shift: next,
            discoveredRecipes: mergeDiscoveries(discoveredRecipes, next),
            fridgeOpen: false,
          };
        }),
      buyUpgrade: (upgrade) =>
        set(({ upgrades, bankGold }) => {
          const level = upgrades[upgrade];
          if (level >= maxUpgradeLevel(upgrade)) return { bankGold, upgrades };
          const cost = upgradeCost(upgrade, level);
          if (bankGold < cost) return { bankGold, upgrades };
          return { bankGold: bankGold - cost, upgrades: { ...upgrades, [upgrade]: level + 1 } };
        }),
    }),
    {
      name: guestProgressStorageKey,
      storage: createJSONStorage(() => guestProgressStorage),
      partialize: ({
        bankGold,
        upgrades,
        selectedStage,
        unlockedStage,
        discoveredRecipes,
        playerNickname,
      }) => ({ bankGold, upgrades, selectedStage, unlockedStage, discoveredRecipes, playerNickname }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameStore>;
        return {
          ...current,
          ...saved,
          upgrades: { ...current.upgrades, ...saved.upgrades },
          discoveredRecipes: [
            ...new Set([...(current.discoveredRecipes ?? []), ...(saved.discoveredRecipes ?? [])]),
          ],
        };
      },
    },
  ),
);
