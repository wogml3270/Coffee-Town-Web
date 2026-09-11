import {
  applyShiftAction,
  shiftProtocolVersion,
  type ShiftAction,
  type ShiftReceipt,
  type ShiftSession,
} from "./shiftProtocol";
import type { UpgradeId as GatewayUpgradeId } from "./upgradeTree";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { recipes, stages, type CombinationRecipe, type ItemId, type StationId } from "./catalog";
import { createShift, defaultUpgrades, tick, type ShiftState, type Upgrades } from "./rules";
import { guestProgressStorage, guestProgressStorageKey } from "./progressPersistence";
import { canBuyUpgrade, maxUpgradeLevel, upgradeCost, upgradeNodeById, type UpgradeId } from "./upgradeTree";

export type ProgressGateway = Readonly<{
  ready: () => boolean;
  begin: (stage: number) => Promise<ShiftSession | null>;
  settle: (receipt: ShiftReceipt) => Promise<void>;
  purchase: (id: GatewayUpgradeId) => Promise<void>;
}>;
let progressGateway: ProgressGateway | null = null;
export const setProgressGateway = (gateway: ProgressGateway | null) => {
  progressGateway = gateway;
};

export type Screen = "title" | "shift" | "result" | "upgrade";
export type { UpgradeId } from "./upgradeTree";
export const exitEarnings = (screen: Screen, sessionGold: number) =>
  screen === "shift" ? Math.max(0, sessionGold) : 0;
export const unlockedAfterFullDay = (unlockedStage: number, playedStage: number) =>
  Math.min(stages.length, Math.max(unlockedStage, playedStage + 1));
type GameStore = Readonly<{
  screen: Screen;
  sessionId: string | null;
  actions: readonly ShiftAction[];
  act: (kind: ShiftAction["kind"], target?: string, slot?: number) => void;
  purchase: (id: UpgradeId) => Promise<void>;
  shift: ShiftState;
  selectedUid: string | null;
  nearbyStation: StationId | null;
  fridgeOpen: boolean;
  waterOpen: boolean;
  recipeBookOpen: boolean;
  setRecipeBookOpen: (open: boolean) => void;
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
  start: () => Promise<void>;
  exit: () => void;
  finish: () => void;
  finishEarly: () => void;
  openUpgrade: () => void;
  setStage: (stage: number) => void;
  tick: () => void;
  select: (uid: string | null) => void;
  discard: (uid: string) => void;
  clearDiscovery: () => void;
  interact: (station: StationId) => void;
  interactNearby: () => void;
  combine: () => void;
  setAutomationEnabled: (enabled: boolean) => void;
  setAutoServeEnabled: (enabled: boolean) => void;
  setNearbyStation: (station: StationId | null) => void;
  closeFridge: () => void;
  closeWater: () => void;
  takeWater: (itemId: "hot_water" | "cold_water") => void;
  takeFromFridge: (itemId: ItemId) => void;
  buyUpgrade: (upgrade: UpgradeId) => void;
  applyUpgradePurchase: (upgrade: UpgradeId, level: number, gold: number) => void;
}>;
export { maxUpgradeLevel, upgradeCost } from "./upgradeTree";
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
      sessionId: null,
      actions: [],
      shift: createShift(),
      selectedUid: null,
      nearbyStation: null,
      fridgeOpen: false,
      waterOpen: false,
      recipeBookOpen: false,
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
          upgrades: { ...defaultUpgrades, ...cloudUpgrades },
          discoveredRecipes: [...new Set(cloudRecipes)],
          seenMenuStages: [...new Set(seenMenuStages)],
          newDiscovery: null,
        }),
      replaceProgress: (gold, unlockedStage, cloudUpgrades, cloudRecipes = [], seenMenuStages = []) =>
        set({
          screen: "title",
          sessionId: null,
          actions: [],
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
          recipeBookOpen: false,
        }),
      resetGuestProgress: () =>
        set({
          screen: "title",
          sessionId: null,
          actions: [],
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
          recipeBookOpen: false,
        }),
      start: async () => {
        if (get().screen === "shift") return;
        const gateway = progressGateway;
        if (gateway && !gateway.ready()) return;
        const { upgrades, selectedStage } = get();
        const session = gateway ? await gateway.begin(selectedStage) : null;
        if (gateway !== progressGateway || (gateway && !session)) return;
        set({
          screen: "shift",
          sessionId: session?.id ?? null,
          actions: [],
          shift: createShift(session?.upgrades ?? upgrades, session?.stageId ?? selectedStage, session?.seed),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
          recipeBookOpen: false,
          newDiscovery: null,
        });
      },
      exit: () => {
        const { screen, shift, bankGold, upgrades, selectedStage, sessionId, actions, seenMenuStages } =
          get();
        if (screen === "shift" && sessionId && progressGateway) {
          void progressGateway.settle({
            sessionId,
            version: shiftProtocolVersion,
            elapsed: 360 - shift.time,
            actions,
            seenMenuStages: seenMenuStages.filter((stage) => stage <= shift.stageId),
          });
        }
        set({
          screen: "title",
          sessionId: null,
          actions: [],
          bankGold: bankGold + exitEarnings(screen, shift.gold),
          shift: createShift(upgrades, selectedStage),
          selectedUid: null,
          nearbyStation: null,
          fridgeOpen: false,
          waterOpen: false,
          recipeBookOpen: false,
          newDiscovery: null,
        });
      },
      finish: () => {
        const { screen, shift, bankGold, unlockedStage, sessionId, actions, seenMenuStages } = get();
        if (screen !== "shift" || shift.time !== 0) return;
        if (sessionId && progressGateway)
          void progressGateway.settle({
            sessionId,
            version: shiftProtocolVersion,
            elapsed: 360,
            actions,
            seenMenuStages: seenMenuStages.filter((stage) => stage <= shift.stageId),
          });
        set({
          screen: "result",
          sessionId: null,
          actions: [],
          selectedUid: null,
          nearbyStation: null,
          newDiscovery: null,
          bankGold: bankGold + shift.gold,
          unlockedStage: unlockedAfterFullDay(unlockedStage, shift.stageId),
        });
      },
      finishEarly: () => {
        const { screen, shift, bankGold, sessionId, actions, seenMenuStages } = get();
        if (screen !== "shift") return;
        if (sessionId && progressGateway)
          void progressGateway.settle({
            sessionId,
            version: shiftProtocolVersion,
            elapsed: 360 - shift.time,
            actions,
            seenMenuStages: seenMenuStages.filter((stage) => stage <= shift.stageId),
          });
        set({
          screen: "result",
          sessionId: null,
          actions: [],
          selectedUid: null,
          nearbyStation: null,
          newDiscovery: null,
          bankGold: bankGold + shift.gold,
        });
      },
      purchase: async (id) => {
        if (progressGateway) await progressGateway.purchase(id);
        else get().buyUpgrade(id);
      },
      openUpgrade: () => set({ screen: "upgrade" }),
      setStage: (selectedStage) =>
        set(({ unlockedStage }) => ({ selectedStage: Math.min(selectedStage, unlockedStage) })),
      tick: () => set(({ shift }) => ({ shift: tick(shift) })),
      select: (selectedUid) => set({ selectedUid }),
      act: (kind, target, slot) => {
        const state = get();
        // The recipe book pauses the clock and locks gameplay actions. Without
        // this guard a player could keep processing/combining indefinitely
        // while studying the recipe list. Ingredient pickers are excluded
        // because their selection buttons intentionally dispatch actions.
        if (state.screen !== "shift" || state.shift.time <= 0 || state.recipeBookOpen) return;
        if (state.actions.length >= 12000) {
          set({ shift: { ...state.shift, notice: "오늘의 작업 한도에 도달했습니다. 영업을 마감하세요." } });
          return;
        }
        const action: ShiftAction = {
          at: 360 - state.shift.time,
          kind,
          slot: slot ?? state.shift.inventory.findIndex(({ uid }) => uid === state.selectedUid),
          ...(target ? { target } : {}),
        };
        let next: ShiftState;
        try {
          next = applyShiftAction(state.shift, action, state.sessionId ? recipes : state.combinationRecipes);
        } catch {
          return;
        }
        const selectedExists = next.inventory.some(({ uid }) => uid === state.selectedUid);
        const newest = next.inventory.find(
          ({ uid }) => !state.shift.inventory.some((item) => item.uid === uid),
        );
        set({
          shift: next,
          actions: state.sessionId ? [...state.actions, action] : state.actions,
          discoveredRecipes: mergeDiscoveries(state.discoveredRecipes, next),
          newDiscovery: latestDiscovery(state.discoveredRecipes, state.shift, next),
          selectedUid: selectedExists ? state.selectedUid : (newest?.uid ?? null),
        });
      },
      discard: (uid) =>
        get().act(
          "discard",
          undefined,
          get().shift.inventory.findIndex((item) => item.uid === uid),
        ),
      clearDiscovery: () => set({ newDiscovery: null }),
      interact: (station) => {
        if (get().screen !== "shift" || get().shift.time <= 0) return;
        if (station === "fridge") {
          set({ fridgeOpen: true });
          return;
        }
        if (station === "water") {
          set({ waterOpen: true });
          return;
        }
        get().act("station", station);
      },
      interactNearby: () => {
        const station = get().nearbyStation;
        if (station) get().interact(station);
      },
      combine: () => get().act("combine"),
      setAutomationEnabled: (automationEnabled) =>
        set(({ shift }) => ({ shift: { ...shift, automationEnabled } })),
      setAutoServeEnabled: (autoServeEnabled) =>
        set(({ shift }) => ({ shift: { ...shift, autoServeEnabled } })),
      setNearbyStation: (nearbyStation) => set({ nearbyStation }),
      closeFridge: () => set({ fridgeOpen: false }),
      closeWater: () => set({ waterOpen: false }),
      setRecipeBookOpen: (recipeBookOpen) => set({ recipeBookOpen }),
      takeWater: (itemId) => {
        get().act("water", itemId);
        set({ waterOpen: false });
      },
      takeFromFridge: (itemId) => {
        get().act("fridge", itemId);
        set({ fridgeOpen: false });
      },
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
