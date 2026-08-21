import { useEffect, useMemo, useState } from "react";
import { createSoundPlayer } from "../audio/soundPlayer";
import { getNextAction, isPreparationComplete } from "../engine/baristaEngine";
import type { AuthUser } from "../services/authService";
import type { BaristaActionId, BaristaRecipe, GameState, Order } from "../types/game";
import { GameIcon } from "./GameIcon";

type Props = Readonly<{
  state: GameState;
  currentUser: AuthUser | null;
  recipes: readonly BaristaRecipe[];
  onSelectOrder: (orderId: string) => void;
  onAction: (actionId: BaristaActionId, recipe: BaristaRecipe) => boolean;
  onServe: (recipe: BaristaRecipe) => boolean;
  onDiscard: () => void;
  onLoginRequest: () => void;
}>;

const actionLabels: Readonly<Record<BaristaActionId, string>> = {
  coffee_beans: "원두 담기", grind: "분쇄", extract: "에스프레소 추출",
  hot_water: "뜨거운 물", cold_water: "차가운 물", ice: "얼음",
  milk: "우유", steam: "스팀", grapefruit_syrup: "자몽청",
  sparkling_water: "탄산수", cold_brew: "콜드브루 원액",
  vanilla_bean_sauce: "바닐라빈 소스", oat_milk: "오트 음료",
};
const ingredientActions: readonly BaristaActionId[] = ["coffee_beans", "hot_water", "cold_water", "ice", "milk", "grapefruit_syrup", "sparkling_water", "cold_brew", "vanilla_bean_sauce", "oat_milk"];
const stationActions: readonly BaristaActionId[] = ["grind", "extract", "steam"];
const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

const ActionIcon = ({ actionId }: Readonly<{ actionId: BaristaActionId }>) => {
  if (actionId === "grind" || actionId === "extract" || actionId === "steam") return <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden="true"><path d="M6 5h12v14H6V5Zm3 3h6m-6 4h6m-3 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const itemId = actionId === "cold_brew" ? "cold_brew_concentrate" : actionId;
  return <GameIcon itemId={itemId} className="size-8"/>;
};

const OrderCard = ({ order, active, onClick }: Readonly<{ order: Order; active: boolean; onClick: () => void }>) => <button className={`min-w-0 rounded-2xl border p-3 text-left transition ${active ? "border-[#4D7864] bg-[#E5F0E9] ring-2 ring-[#A9C3B3]" : "border-[#E1DDD6] bg-white"}`} onClick={onClick} type="button"><div className="flex items-center justify-between"><span className="truncate text-xs font-black">{order.customerName}</span><span className="text-[10px] font-bold text-[#9A7435]">+{order.reward}</span></div><GameIcon itemId={order.itemId} className="mx-auto my-2 size-10"/><p className="truncate text-center text-[10px] font-bold">{order.itemId === "americano_hot" ? "아메리카노" : order.itemId === "americano_iced" ? "아이스 아메리카노" : order.itemId === "cafe_latte_hot" ? "카페라떼" : order.itemId === "grapefruit_aide" ? "자몽에이드" : "바닐라빈 오트 콜드브루"}</p></button>;

export const BaristaCounter = ({ state, currentUser, recipes, onSelectOrder, onAction, onServe, onDiscard, onLoginRequest }: Props) => {
  const [notice, setNotice] = useState("주문을 선택해 제조를 시작하세요.");
  const [working, setWorking] = useState<BaristaActionId | null>(null);
  const sound = useMemo(() => createSoundPlayer(), []);
  useEffect(() => () => void sound.dispose(), [sound]);
  const recipe = state.preparation ? recipes.find((item) => item.itemId === state.preparation?.itemId) ?? null : null;
  const nextAction = state.preparation && recipe ? getNextAction(state.preparation, recipe) : null;
  const complete = Boolean(state.preparation && recipe && isPreparationComplete(state.preparation, recipe));

  const act = (actionId: BaristaActionId) => {
    if (!state.preparation || !recipe) { setNotice("먼저 손님의 주문을 선택하세요."); return; }
    if (nextAction !== actionId) { setNotice(`다음 단계는 '${nextAction ? actionLabels[nextAction] : "픽업 전달"}'입니다.`); return; }
    setWorking(actionId);
    window.setTimeout(() => {
      if (onAction(actionId, recipe)) { sound.playMergeSound(); setNotice(`${actionLabels[actionId]} 완료`); }
      setWorking(null);
    }, stationActions.includes(actionId) ? 520 : 180);
  };

  return <main className="animate-screen-in mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#F6F3EE] text-[#293A33] shadow-[0_0_60px_rgba(45,58,52,.12)]">
    <header className="sticky top-0 z-20 border-b border-[#E7E2DA] bg-[#FCFBF8]/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.22em] text-[#88A092]">COFFEE TOWN · LIVE SHIFT</p>{currentUser && !currentUser.isAnonymous ? <div className="mt-1 flex items-center gap-2">{currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="size-6 rounded-full object-cover" referrerPolicy="no-referrer"/> : null}<span className="text-xs font-bold">Lv.{state.level} {currentUser.displayName}</span></div> : <button className="mt-1 text-xs font-bold text-[#587063]" onClick={onLoginRequest} type="button">게스트 · 로그인하고 저장</button>}</div><div className="flex gap-2"><span className="rounded-xl bg-[#E6EFE9] px-3 py-2 font-black tabular-nums text-[#355E4D]">{time(state.remainingTimeSec)}</span><span className="rounded-xl bg-[#FFF0CA] px-3 py-2 font-black text-[#765824]">{state.gold} G</span></div></div>
      <p className="mb-2 mt-4 text-[11px] font-black tracking-[.12em] text-[#75857C]">ORDER QUEUE</p>
      <div className="grid grid-cols-3 gap-2">{state.orders.map((order) => <OrderCard active={state.preparation?.orderId === order.id} key={order.id} onClick={() => { onSelectOrder(order.id); setNotice(`${order.customerName}님의 주문 제조를 시작합니다.`); }} order={order}/>)}</div>
    </header>

    <section className="flex-1 space-y-5 px-4 py-5">
      <article className="overflow-hidden rounded-[1.75rem] bg-[#355E4D] p-5 text-white shadow-[0_14px_35px_rgba(53,94,77,.2)]">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#BCD0C4]">ACTIVE CUP</p><h2 className="mt-1 text-xl font-black">{recipe?.name ?? "빈 작업대"}</h2></div>{state.preparation ? <button className="rounded-xl bg-white/12 px-3 py-2 text-xs font-bold" onClick={() => { onDiscard(); setNotice("음료를 비우고 작업대를 정리했습니다."); }} type="button">비우기</button> : null}</div>
        {state.preparation && recipe ? <><div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">{recipe.steps.map((step, index) => { const done = index < state.preparation!.completedSteps.length; const current = index === state.preparation!.completedSteps.length; return <div className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${done ? "bg-[#7EAA90]" : current ? "animate-pulse bg-[#E6C986] text-[#493A22]" : "bg-white/10 text-white/60"}`} key={`${step}-${index}`}><span>{done ? "완료" : index + 1}</span>{actionLabels[step]}</div>; })}</div><p className="mt-4 text-sm font-semibold text-[#DDE9E1]">{complete ? "음료가 완성됐습니다. 픽업대로 전달하세요." : `다음 작업 · ${nextAction ? actionLabels[nextAction] : "완료"}`}</p></> : <p className="mt-4 text-sm text-[#D5E3DA]">상단 주문 카드를 탭하면 빈 컵이 준비됩니다.</p>}
      </article>

      <div><div className="mb-2 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-[#8B9A92]">INGREDIENT BAR</p><h2 className="text-lg font-black">재료 선반</h2></div><p className="text-[11px] font-semibold text-[#8B958F]">필요한 재료를 직접 선택</p></div><div className="grid grid-cols-4 gap-2">{ingredientActions.map((actionId) => <button className={`min-h-20 rounded-2xl border bg-white p-2 text-[#40594D] shadow-[0_3px_10px_rgba(60,70,64,.06)] disabled:opacity-45 ${nextAction === actionId ? "border-[#5E8A72] ring-2 ring-[#B6CEBF]" : "border-[#E1DDD6]"}`} disabled={working !== null} key={actionId} onClick={() => act(actionId)} type="button"><span className="mx-auto grid size-9 place-items-center"><ActionIcon actionId={actionId}/></span><span className="mt-1 block text-[10px] font-bold leading-3">{actionLabels[actionId]}</span></button>)}</div></div>

      <div><p className="text-[10px] font-bold tracking-[.16em] text-[#8B9A92]">EQUIPMENT</p><h2 className="mb-2 text-lg font-black">제조 장비</h2><div className="grid grid-cols-3 gap-2">{stationActions.map((actionId) => <button className={`relative min-h-24 overflow-hidden rounded-2xl border bg-[#EEE6DA] p-3 text-[#4B443A] ${nextAction === actionId ? "border-[#8B6C42] ring-2 ring-[#D9C19A]" : "border-[#DDD2C4]"}`} disabled={working !== null} key={actionId} onClick={() => act(actionId)} type="button"><span className={working === actionId ? "animate-pulse" : ""}><ActionIcon actionId={actionId}/></span><span className="mt-2 block text-xs font-black">{actionLabels[actionId]}</span>{working === actionId ? <span className="absolute inset-x-0 bottom-0 h-1 animate-[station-progress_.52s_linear] bg-[#6B8E79]"/> : null}</button>)}</div></div>
      <p aria-live="polite" className="min-h-6 text-center text-xs font-semibold text-[#786C65]">{notice}</p>
    </section>

    <footer className="sticky bottom-0 border-t border-[#E5DFD5] bg-[#FCFBF8]/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button className="min-h-14 w-full rounded-2xl bg-[#355E4D] px-5 font-black text-white shadow-[0_8px_20px_rgba(53,94,77,.2)] disabled:bg-[#B9C4BE]" disabled={!complete || !recipe} onClick={() => { if (recipe && onServe(recipe)) { sound.playMergeSound(); setNotice("픽업 완료! 다음 주문을 준비하세요."); } }} type="button">완성 음료 픽업 전달</button></footer>
  </main>;
};
