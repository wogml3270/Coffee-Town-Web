import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { recipes, stages, type CombinationRecipe, type ItemId, type StationId } from "./catalog";
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
import { canBuyUpgrade, maxUpgradeLevel, upgradeCost, upgradeNodeById, type UpgradeId } from "./upgradeTree";

export type Screen = "title" | "shift" | "result" | "upgrade";
export type { UpgradeId } from "./upgradeTree";
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
  discoveredRecipes: readonly ItemId[];
  seenMenuStages: readonly number[];
  newDiscovery: ItemId | null;
  combinationRecipes: readonly CombinationRecipe[];
  setCombinationRecipes: (recipes: readonly CombinationRecipe[]) => void;
  playerNickname: string | null;
  setPlayerNickname: (nickname: string) => void;
  markMenuStageSeen: (stageId: number) => void;
  hydrateProgress: (
    gold: number,
    unlockedStage: number,
    upgrades: Partial<Upgrades>,
    discoveredRecipes?: readonly ItemId[],
    seenMenuStages?: readonly number[],
  ) => void;
  replaceProgress: (
    gold: number,
    unlockedStage: number,
    upgrades: Partial<Upgrades>,
    discoveredRecipes?: readonly ItemId[],
    seenMenuStages?: readonly number[],
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
  clearDiscovery: () => void;
  interact: (station: StationId) => void;
  interactNearby: () => void;
  combine: () => void;
  setNearbyStation: (station: StationId | null) => void;
  closeFridge: () => void;
  closeWater: () => void;
  takeWater: (itemId: "hot_water" | "cold_water") => void;
  takeFromFridge: (itemId: ItemId) => void;
  buyUpgrade: (upgrade: UpgradeId) => void;
  applyUpgradePurchase: (upgrade: UpgradeId, level: number, gold: number) => void;
}>;
export { maxUpgradeLevel, upgradeCost } from "./upgradeTree";
const mergeUpgrades = (local: Upgrades, cloud: Partial<Upgrades>): Upgrades =>
  Object.fromEntries(
    Object.entries(local).map(([id, level]) => [
      id,
      Math.max(level, typeof cloud[id as UpgradeId] === "number" ? cloud[id as UpgradeId]! : 0),
    ]),
  ) as Upgrades;
const mergeDiscoveries = (current: readonly ItemId[], shift: ShiftState) => [
  ...new Set([...current, ...shift.inventory.map(({ itemId }) => itemId)]),
];
const latestDiscovery = (current: readonly ItemId[], previous: ShiftState, next: ShiftState) =>
  next.inventory.find(
    ({ uid, itemId }) => !current.includes(itemId) && !previous.inventory.some((item) => item.uid === uid),
  )?.itemId ?? null;

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
      seenMenuStages: [],
      newDiscovery: null,
      combinationRecipes: recipes,
      playerNickname: null,
      setCombinationRecipes: (combinationRecipes) =>
        set({ combinationRecipes: combinationRecipes.length ? combinationRecipes : recipes }),
      setPlayerNickname: (playerNickname) => set({ playerNickname }),
      markMenuStageSeen: (stageId) =>
        set(({ seenMenuStages }) => ({ seenMenuStages: [...new Set([...seenMenuStages, stageId])] })),
      hydrateProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = [], seenMenuStages = []) =>
        set({
          bankGold: Math.max(0, gold),
          unlockedStage: Math.max(1, Math.min(stages.length, unlockedStage)),
          selectedStage: 1,
          upgrades: { ...defaultUpgrades, ...cloudUpgrades },
          discoveredRecipes: [...new Set(cloudRecipes)],
          seenMenuStages: [...new Set(seenMenuStages)],
          newDiscovery: null,
        }),
      replaceProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = [], seenMenuStages = []) =>
        set({
          screen: "title",
          bankGold: Math.max(0, gold),
          unlockedStage: Math.max(1, Math.min(stages.length, unlockedStage)),
          selectedStage: 1,
          upgrades: { ...defaultUpgrades, ...cloudUpgrades },
          discoveredRecipes: [...new Set(cloudRecipes)],
          seenMenuStages: [...new Set(seenMenuStages)],
          newDiscovery: null,
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
          seenMenuStages: [],
          newDiscovery: null,
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
          newDiscovery: null,
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
          newDiscovery: null,
        })),
      finish: () =>
        set(({ shift, bankGold, unlockedStage }) => ({
          screen: "result",
          selectedUid: null,
          nearbyStation: null,
          newDiscovery: null,
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
            score: Math.max(0, shift.score - 20),
            discardedItems: shift.discardedItems + 1,
            notice: "재료를 버렸습니다",
          },
          selectedUid: selectedUid === uid ? null : selectedUid,
        })),
      clearDiscovery: () => set({ newDiscovery: null }),
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
            newDiscovery: latestDiscovery(get().discoveredRecipes, shift, next),
            selectedUid: selectedStillExists ? selectedUid : (newest?.uid ?? null),
          };
        }),
      interactNearby: () => {
        const station = get().nearbyStation;
        if (station) get().interact(station);
      },
      combine: () =>
        set(({ shift, selectedUid, discoveredRecipes, combinationRecipes }) => {
          const next = autoCombine(
            combineSelected(shift, selectedUid, combinationRecipes),
            combinationRecipes,
          );
          const newest = next.inventory.find(
            ({ uid }) => !shift.inventory.some((previous) => previous.uid === uid),
          );
          return {
            shift: next,
            discoveredRecipes: mergeDiscoveries(discoveredRecipes, next),
            newDiscovery: latestDiscovery(discoveredRecipes, shift, next),
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
            newDiscovery: latestDiscovery(discoveredRecipes, shift, next),
            waterOpen: false,
          };
        }),
      takeFromFridge: (itemId) =>
        set(({ shift, discoveredRecipes, combinationRecipes }) => {
          const next = autoCombine(takeFridgeIngredient(shift, itemId), combinationRecipes);
          return {
            shift: next,
            discoveredRecipes: mergeDiscoveries(discoveredRecipes, next),
            newDiscovery: latestDiscovery(discoveredRecipes, shift, next),
            fridgeOpen: false,
          };
        }),
      buyUpgrade: (upgrade) =>
        set(({ upgrades, bankGold }) => {
          const node = upgradeNodeById(upgrade);
          if (!canBuyUpgrade(node, upgrades, bankGold)) return { bankGold, upgrades };
          const level = upgrades[upgrade];
          const cost = upgradeCost(upgrade, level);
          return { bankGold: bankGold - cost, upgrades: { ...upgrades, [upgrade]: level + 1 } };
        }),
      applyUpgradePurchase: (upgrade, level, bankGold) =>
        set(({ upgrades }) => ({ bankGold, upgrades: { ...upgrades, [upgrade]: level } })),
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
        seenMenuStages,
        playerNickname,
      }) => ({
        bankGold,
        upgrades,
        selectedStage,
        unlockedStage,
        discoveredRecipes,
        seenMenuStages,
        playerNickname,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameStore>;
        return {
          ...current,
          ...saved,
          upgrades: { ...current.upgrades, ...saved.upgrades },
          discoveredRecipes: [
            ...new Set([...(current.discoveredRecipes ?? []), ...(saved.discoveredRecipes ?? [])]),
          ],
          seenMenuStages: [...new Set([...(current.seenMenuStages ?? []), ...(saved.seenMenuStages ?? [])])],
        };
      },
    },
  ),
);
