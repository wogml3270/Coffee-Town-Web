import { useEffect, useReducer, useRef, useState } from "react";
import { DragBaristaCounter } from "./components/DragBaristaCounter";
import { CafeHub } from "./components/CafeHub";
import type { UpgradeDefinition } from "./components/CafeHub";
import { LoginModal } from "./components/LoginModal";
import { StartScreen } from "./components/StartScreen";
import { gameReducer } from "./engine/gameEngine";
import { ensureGuestSession, saveGuestProgressSnapshot, signOut, subscribeToAuth, toAuthUser } from "./services/authService";
import type { AuthUser } from "./services/authService";
import { abandonGameSession, createGameSession, syncGameSession } from "./services/gameSessionService";
import { subscribeToProgress } from "./services/realtimeService";
import { loadPlayerProgress, persistPlayerProgress, persistUpgrade } from "./services/progressionService";
import { isSupabaseConfigured } from "./services/supabaseService";
import type { BaristaRecipe, GameState, Order } from "./types/game";

const baristaRecipes: readonly BaristaRecipe[] = [
  { itemId: "americano_hot", name: "아메리카노", steps: ["coffee_beans", "grind", "extract", "hot_water"], unlockLevel: 1 },
  { itemId: "americano_iced", name: "아이스 아메리카노", steps: ["coffee_beans", "grind", "extract", "cold_water", "ice"], unlockLevel: 1 },
  { itemId: "cafe_latte_hot", name: "카페라떼", steps: ["coffee_beans", "grind", "extract", "milk", "steam"], unlockLevel: 1 },
  { itemId: "grapefruit_aide", name: "자몽에이드", steps: ["grapefruit_syrup", "sparkling_water", "ice"], unlockLevel: 2 },
  { itemId: "vanilla_oat_cold_brew", name: "바닐라빈 오트 콜드브루", steps: ["cold_brew", "vanilla_bean_sauce", "oat_milk", "ice"], unlockLevel: 4 },
];
const customers = ["민서", "도윤", "하린", "서준", "지우"] as const;
const makeOrder = (n: number, level = 1): Order => { const available = baristaRecipes.filter((recipe) => recipe.unlockLevel <= level); const recipe = available[n % available.length] ?? baristaRecipes[0]!; const reward = recipe.itemId === "vanilla_oat_cold_brew" ? 420 : recipe.itemId === "grapefruit_aide" ? 280 : recipe.itemId === "cafe_latte_hot" ? 230 : 190; return { id: `order-${n}`, customerName: customers[n % customers.length] ?? "손님", itemId: recipe.itemId, reward, rewardXp: Math.round(reward / 10) }; };
const upgradeDefinitions: readonly UpgradeDefinition[] = [
  { id: "grinder_speed", name: "그라인더 모터", description: "초기 분쇄 8초 · 단계마다 처리 시간 14% 단축", baseCost: 300, maxLevel: 5, unlockLevel: 1 },
  { id: "espresso_speed", name: "추출 압력 시스템", description: "초기 추출 12초 · 단계마다 처리 시간 14% 단축", baseCost: 450, maxLevel: 5, unlockLevel: 1 },
  { id: "steam_speed", name: "스팀 보일러", description: "초기 스팀 10초 · 단계마다 처리 시간 14% 단축", baseCost: 500, maxLevel: 5, unlockLevel: 2 },
  { id: "inventory_storage", name: "영업 준비 설비", description: "단계마다 영업 제한 시간 10초 추가", baseCost: 600, maxLevel: 5, unlockLevel: 3 },
  { id: "tip_bonus", name: "서비스 트레이닝", description: "단계마다 모든 주문의 골드 팁 5% 증가", baseCost: 700, maxLevel: 5, unlockLevel: 3 },
  { id: "guest_patience", name: "대기 공간 개선", description: "주문 완료마다 단계당 제한 시간 2초 회복", baseCost: 800, maxLevel: 5, unlockLevel: 4 },
];
const createInitialState = (): GameState => ({ phase: "start", remainingTimeSec: 300, gold: 0, xp: 0, level: 1, preparation: null, orders: [makeOrder(0)], grid: [] });

export const App = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [upgrades, setUpgrades] = useState<Readonly<Record<string, number>>>({});
  const [progressReady, setProgressReady] = useState(false);
  const userId = authUser?.id ?? null;
  const sequence = useRef(3);
  const sessionId = useRef<string | null>(null);
  const sessionCreating = useRef(false);
  const sessionStart = useRef({ gold: 0, xp: 0, level: 1 });
  const startShift = (bonusTimeSec = 0) => {
    sessionStart.current = { gold: state.gold, xp: state.xp, level: state.level };
    sessionId.current = null;
    dispatch({ type: "START", bonusTimeSec });
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    return subscribeToAuth((nextUser) => {
      setAuthUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (authUser?.isAnonymous) {
      saveGuestProgressSnapshot({
        gold: state.gold,
        xp: state.xp,
        level: state.level,
        unlockedRecipes: baristaRecipes.filter((recipe) => recipe.unlockLevel <= state.level).map((recipe) => recipe.itemId),
      });
    }
  }, [authUser?.isAnonymous, state.gold, state.level, state.xp]);

  useEffect(() => {
    if (!userId || authUser?.isAnonymous || !isSupabaseConfigured()) {
      setProgressReady(true);
      return;
    }
    setProgressReady(false);
    void loadPlayerProgress(userId)
      .then(({ progress, upgrades: savedUpgrades }) => {
        dispatch({ type: "HYDRATE_PROGRESS", gold: progress.gold, xp: progress.xp, level: progress.level });
        setUpgrades(Object.fromEntries(savedUpgrades.map((upgrade) => [upgrade.upgradeId, upgrade.level])));
      })
      .catch(() => setUpgrades({}))
      .finally(() => setProgressReady(true));
  }, [authUser?.isAnonymous, userId]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    const unsubscribe = subscribeToProgress(userId, (payload) => {
      const progress = payload.new;
      if (
        "gold" in progress && typeof progress.gold === "number" &&
        "xp" in progress && typeof progress.xp === "number" &&
        "level" in progress && typeof progress.level === "number"
      ) {
        dispatch({ type: "HYDRATE_PROGRESS", gold: progress.gold, xp: progress.xp, level: progress.level });
      }
    });
    return () => { void unsubscribe(); };
  }, [userId]);

  useEffect(() => {
    if (!userId || state.phase !== "playing" || sessionId.current || sessionCreating.current || !isSupabaseConfigured()) return;
    sessionCreating.current = true;
    void createGameSession(userId, state)
      .then((id) => { sessionId.current = id; })
      .finally(() => { sessionCreating.current = false; });
  }, [state, userId]);

  useEffect(() => {
    if (!sessionId.current || !isSupabaseConfigured()) return;
    if (state.phase === "ended" || state.remainingTimeSec % 10 === 0) {
      void syncGameSession(sessionId.current, state);
    }
  }, [state]);
  useEffect(() => { if (state.phase !== "playing") return; const id = window.setInterval(() => dispatch({ type: "TICK" }), 1000); return () => window.clearInterval(id); }, [state.phase]);
  if (state.phase === "start" && authUser && !authUser.isAnonymous) return <CafeHub user={authUser} gold={state.gold} xp={state.xp} level={state.level} upgrades={upgrades} upgradeDefinitions={upgradeDefinitions} onStart={() => startShift((upgrades.inventory_storage ?? 0) * 10)} onBuyUpgrade={async (upgrade) => {
    const currentLevel = upgrades[upgrade.id] ?? 0;
    const cost = Math.round(upgrade.baseCost * 1.7 ** currentLevel);
    if (!userId || state.gold < cost || currentLevel >= upgrade.maxLevel || state.level < upgrade.unlockLevel) throw new Error("업그레이드 조건을 충족하지 못했습니다.");
    const nextLevel = currentLevel + 1;
    await persistUpgrade(userId, upgrade.id, nextLevel);
    await persistPlayerProgress(userId, { gold: state.gold - cost, xp: state.xp, level: state.level });
    setUpgrades((current) => ({ ...current, [upgrade.id]: nextLevel }));
    dispatch({ type: "BUY_UPGRADE", cost });
  }} onSignOut={signOut}/>;
  if (state.phase === "start") return <StartScreen authReady={authReady && progressReady} currentUser={authUser} onPlayerStart={() => startShift()} onGuestStart={async () => {
    if (isSupabaseConfigured()) {
      try {
        const session = await ensureGuestSession();
        setAuthUser(toAuthUser(session.user));
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.toLowerCase().includes("anonymous sign-ins are disabled")) throw error;
      }
    }
    startShift();
  }}/>;
  if (state.phase === "ended") return <main className="animate-screen-in grid min-h-dvh place-items-center bg-[#F8F5F0] px-5 text-center text-[#293A33]"><section className="animate-rise w-full max-w-sm"><p className="text-xs font-bold tracking-[.2em] text-[#789180]">SHIFT COMPLETE</p><h1 className="mt-2 text-4xl font-black">영업 종료</h1><div className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-white p-4"><p className="text-xl font-black">{state.gold}</p><p className="text-[10px] font-bold text-[#7D8982]">GOLD</p></div><div className="rounded-2xl bg-white p-4"><p className="text-xl font-black">{state.xp}</p><p className="text-[10px] font-bold text-[#7D8982]">XP</p></div><div className="rounded-2xl bg-white p-4"><p className="text-xl font-black">{state.level}</p><p className="text-[10px] font-bold text-[#7D8982]">LEVEL</p></div></div>{authUser && !authUser.isAnonymous ? <button className="ui-button mt-7 min-h-14 w-full rounded-2xl bg-[#355E4D] px-8 font-bold text-white" onClick={() => { if (userId) void persistPlayerProgress(userId, { gold: state.gold, xp: state.xp, level: state.level }); dispatch({ type: "RETURN_HOME" }); }} type="button">카페 홈으로</button> : <><p className="mt-5 text-sm leading-6 text-[#6F7B75]">로그인하면 카페 성장과 레시피를 저장하고<br/>계속 성장시킬 수 있어요.</p><button className="ui-button mt-5 min-h-14 w-full rounded-2xl bg-[#355E4D] px-8 font-bold text-white" onClick={() => setLoginOpen(true)} type="button">로그인하고 이어하기</button></>}<button className="ui-button mt-3 min-h-12 w-full rounded-2xl border border-[#D8D8D2] bg-white px-8 font-bold" onClick={() => window.location.reload()} type="button">처음 화면으로</button></section><LoginModal onClose={() => setLoginOpen(false)} open={loginOpen}/></main>;
  return <><DragBaristaCounter currentUser={authUser} recipes={baristaRecipes} state={state} stationLevels={upgrades} onAction={(actionId, recipe) => { if (!state.preparation || recipe.steps[state.preparation.completedSteps.length] !== actionId) return false; dispatch({ type: "BARISTA_ACTION", actionId, recipe }); return true; }} onServe={(recipe) => { if (!state.preparation) return false; const order = state.orders[0]; if (!order) return false; const usesCoffee = recipe.steps.includes("coffee_beans"); const usesSteam = recipe.steps.includes("steam"); const equipmentBonus = (usesCoffee ? (upgrades.grinder_speed ?? 0) * 0.03 + (upgrades.espresso_speed ?? 0) * 0.04 : 0) + (usesSteam ? (upgrades.steam_speed ?? 0) * 0.04 : 0) + (upgrades.tip_bonus ?? 0) * 0.05; dispatch({ type: "SERVE_DRINK", recipe, replacement: makeOrder(sequence.current++, state.level), bonusGold: Math.round(order.reward * equipmentBonus), bonusTimeSec: (upgrades.guest_patience ?? 0) * 2 }); return true; }} onMistake={() => dispatch({ type: "MISTAKE", penaltySec: 3 })} onExit={() => { const snapshot = sessionStart.current; if (sessionId.current) void abandonGameSession(sessionId.current); sessionId.current = null; dispatch({ type: "ABANDON_SESSION", ...snapshot }); }}/><LoginModal mode={authUser?.isAnonymous ? "link" : "sign-in"} onClose={() => setLoginOpen(false)} open={loginOpen}/></>;
};
