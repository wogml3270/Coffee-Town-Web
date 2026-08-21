import { useEffect, useMemo, useRef, useState } from "react";
import { createSoundPlayer } from "../audio/soundPlayer";
import { getNextAction, isPreparationComplete } from "../engine/baristaEngine";
import type { AuthUser } from "../services/authService";
import type { BaristaActionId, BaristaRecipe, GameState } from "../types/game";
import { GameSprite as GameIcon } from "./GameSprite";

type DragState = Readonly<{ id: BaristaActionId; x: number; y: number }>;
type Props = Readonly<{ state: GameState; currentUser: AuthUser | null; recipes: readonly BaristaRecipe[]; stationLevels: Readonly<Record<string, number>>; onAction: (id: BaristaActionId, recipe: BaristaRecipe) => boolean; onServe: (recipe: BaristaRecipe) => boolean; onMistake: () => void; onExit: () => void }>;
const labels: Readonly<Record<BaristaActionId, string>> = { coffee_beans: "원두", grind: "그라인더", extract: "에스프레소 머신", hot_water: "뜨거운 물", cold_water: "차가운 물", ice: "얼음", milk: "우유", steam: "스팀 완드", grapefruit_syrup: "자몽청", sparkling_water: "탄산수", cold_brew: "콜드브루 원액", vanilla_bean_sauce: "바닐라빈 소스", oat_milk: "오트 음료" };
const ingredients: readonly BaristaActionId[] = ["coffee_beans", "hot_water", "cold_water", "ice", "milk", "grapefruit_syrup", "sparkling_water", "cold_brew", "vanilla_bean_sauce", "oat_milk"];
const stations: readonly BaristaActionId[] = ["grind", "extract", "steam"];
const menuName = (id: string) => id === "americano_hot" ? "아메리카노" : id === "americano_iced" ? "아이스 아메리카노" : id === "cafe_latte_hot" ? "카페라떼" : id === "grapefruit_aide" ? "자몽에이드" : "바닐라빈 오트 콜드브루";
const processingMs = (id: BaristaActionId, levels: Readonly<Record<string, number>>) => { const base = id === "grind" ? 8000 : id === "extract" ? 12000 : id === "steam" ? 10000 : 1400; const level = id === "grind" ? levels.grinder_speed ?? 0 : id === "extract" ? levels.espresso_speed ?? 0 : id === "steam" ? levels.steam_speed ?? 0 : 0; return Math.max(id === "grind" || id === "extract" || id === "steam" ? 2500 : 600, Math.round(base * (1 - level * .14))); };
const choicesFor = (correct: BaristaActionId, step: number) => { const pool = stations.includes(correct) ? stations : ingredients; const wrong = pool.filter((item) => item !== correct); return [correct, ...Array.from({ length: 3 }, (_, index) => wrong[(step * 2 + index) % wrong.length]!)].filter((item, index, all) => all.indexOf(item) === index).sort((a, b) => ((a.length + step) % 5) - ((b.length + step) % 5)); };
const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export const DragBaristaCounter = ({ state, currentUser, recipes, stationLevels, onAction, onServe, onMistake, onExit }: Props) => {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [processing, setProcessing] = useState<BaristaActionId | null>(null);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("재료나 장비를 제조대에 드래그하세요.");
  const [exitOpen, setExitOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const skipClick = useRef(false);
  const sound = useMemo(() => createSoundPlayer(), []);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); void sound.dispose(); }, [sound]);
  const preparation = state.preparation;
  const recipe = preparation ? recipes.find((item) => item.itemId === preparation.itemId) ?? null : null;
  const next = preparation && recipe ? getNextAction(preparation, recipe) : null;
  const complete = Boolean(preparation && recipe && isPreparationComplete(preparation, recipe));
  const choices = next ? choicesFor(next, preparation?.completedSteps.length ?? 0) : [];

  const processChoice = (selected: BaristaActionId) => {
    if (!next || !recipe || processing) return;
    if (selected !== next) { setFeedback("잘못된 재료 또는 장비입니다. 3초가 감소했습니다."); onMistake(); return; }
    const duration = processingMs(selected, stationLevels);
    const startedAt = performance.now();
    setProcessing(selected); setProgress(0); setFeedback(`${labels[selected]} 작업 중`);
    timer.current = window.setInterval(() => {
      const nextProgress = Math.min(100, (performance.now() - startedAt) / duration * 100);
      setProgress(nextProgress);
      if (nextProgress < 100) return;
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      if (onAction(selected, recipe)) { sound.playMergeSound(); setFeedback(`${labels[selected]} 작업 완료`); }
      setProcessing(null); setProgress(0);
    }, 50);
  };
  const beginDrag = (id: BaristaActionId, event: React.PointerEvent<HTMLButtonElement>) => { if (processing) return; event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id, x: event.clientX, y: event.clientY }); };
  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => { if (drag) setDrag({ ...drag, x: event.clientX, y: event.clientY }); };
  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => { if (!drag) return; const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null; if (target?.closest("[data-manufacturing-field]")) { skipClick.current = true; processChoice(drag.id); } setDrag(null); };

  return <main className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-[#F6F3EE] text-[#293A33] select-none">
    <header className="flex items-center justify-between border-b border-[#E3DED6] bg-white px-4 pb-3 pt-[max(.7rem,env(safe-area-inset-top))]"><button className="min-h-9 rounded-xl border border-[#DED9D1] px-3 text-xs font-bold" onClick={() => setExitOpen(true)} type="button">나가기</button><div className="text-center"><p className="text-[9px] font-black tracking-[.18em] text-[#82948A]">COFFEE TOWN</p><p className="text-xs font-black">Lv.{state.level} {currentUser?.displayName ?? "게스트"}</p></div><div className="text-right"><p className="font-black tabular-nums text-[#355E4D]">{formatTime(state.remainingTimeSec)}</p><p className="text-[10px] font-bold text-[#9A7435]">{state.gold} G</p></div></header>
    <section className="flex min-h-0 flex-1 flex-col p-3">
      <article className="flex items-center gap-3 rounded-2xl border border-[#E0DBD3] bg-white p-3"><GameIcon itemId={preparation?.itemId ?? "americano_hot"} className="size-12"/><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-[#829087]">{state.orders[0]?.customerName ?? "손님"}님의 주문</p><h1 className="truncate text-lg font-black">{menuName(preparation?.itemId ?? state.orders[0]?.itemId ?? "americano_hot")}</h1></div><div className="text-right"><p className="text-[10px] font-bold text-[#829087]">ORDER</p><p className="font-black text-[#9A7435]">+{state.orders[0]?.reward ?? 0}</p></div></article>
      <div className="mt-2 flex gap-1">{recipe?.steps.map((item, index) => <span className={`h-1.5 flex-1 rounded-full ${index < (preparation?.completedSteps.length ?? 0) ? "bg-[#6D977F]" : index === (preparation?.completedSteps.length ?? 0) ? "bg-[#DDB96F]" : "bg-[#DDE1DE]"}`} key={`${item}-${index}`}/>)}</div>
      <div data-manufacturing-field className={`relative my-3 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-[#9C7B50]/60 bg-cover bg-center ${processing ? "ring-4 ring-[#E0B96C]/60" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const selected = event.dataTransfer.getData("text/plain") as BaristaActionId; if (selected) { skipClick.current = true; processChoice(selected); } }} style={{ backgroundImage: "linear-gradient(rgb(255 250 240 / .5),rgb(255 250 240 / .74)),url('/assets/game/backgrounds/cafe-counter.png')" }}>
        <div className={processing ? "animate-pulse" : "animate-float"}><GameIcon itemId={processing ?? preparation?.itemId ?? "americano_hot"} className="size-28"/></div>
        <p className="mt-4 text-xs font-black tracking-[.12em] text-[#71847A]">{complete ? "DRINK READY" : processing ? "PROCESSING" : "MANUFACTURING FIELD"}</p><h2 className="mt-1 text-xl font-black">{complete ? "음료 완성" : processing ? `${labels[processing]} 작업 중` : "여기에 드래그"}</h2>
        {processing ? <div className="mt-4 w-3/4"><div className="h-3 overflow-hidden rounded-full bg-white/80"><span className="block h-full rounded-full bg-[#527963] transition-[width] duration-75" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-center text-xs font-black tabular-nums">{Math.floor(progress)}%</p></div> : null}
        {drag ? <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/95 p-3 shadow-2xl" style={{ left: drag.x, top: drag.y }}><GameIcon itemId={drag.id} className="size-12"/></div> : null}
      </div>
      <p className="mb-2 min-h-5 text-center text-xs font-bold text-[#876E63]" role="status">{feedback}</p>
      {complete && recipe ? <button className="min-h-16 rounded-2xl bg-[#355E4D] text-lg font-black text-white" onClick={() => { if (onServe(recipe)) { sound.playMergeSound(); setFeedback("주문 완료. 다음 주문이 들어왔습니다."); } }} type="button">픽업대로 전달</button> : <div className="grid grid-cols-4 gap-2">{choices.map((choice) => <button aria-label={`${labels[choice]} 드래그`} className="touch-none rounded-2xl border border-[#DED8D0] bg-white p-2 shadow-[0_4px_12px_rgba(45,58,52,.07)] disabled:opacity-45" disabled={processing !== null} draggable onClick={() => { if (skipClick.current) { skipClick.current = false; return; } processChoice(choice); }} onDragStart={(event) => { event.dataTransfer.setData("text/plain", choice); setDrag({ id: choice, x: event.clientX, y: event.clientY }); }} onDragEnd={() => setDrag(null)} key={choice} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") processChoice(choice); }} onPointerDown={(event) => beginDrag(choice, event)} onPointerMove={moveDrag} onPointerUp={finishDrag} type="button"><GameIcon itemId={choice} className="mx-auto size-10"/><span className="mt-1 block truncate text-[10px] font-black">{labels[choice]}</span></button>)}</div>}
    </section>
    {exitOpen ? <div className="fixed inset-0 z-[60] grid place-items-end bg-black/45 p-3"><section className="w-full max-w-sm rounded-[1.75rem] bg-white p-5"><h2 className="text-xl font-black">영업을 중단할까요?</h2><p className="mt-2 text-sm leading-6 text-[#717C76]">이번 영업의 골드와 경험치는 모두 사라집니다.</p><button className="mt-5 min-h-13 w-full rounded-2xl bg-[#A54F45] font-bold text-white" onClick={onExit} type="button">보상 포기하고 나가기</button><button className="mt-2 min-h-12 w-full rounded-2xl bg-[#EEF1EE] font-bold" onClick={() => setExitOpen(false)} type="button">계속 플레이</button></section></div> : null}
  </main>;
};
