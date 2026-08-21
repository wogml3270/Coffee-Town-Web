"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSoundPlayer } from "../audio/soundPlayer";
import type { AuthUser } from "../services/authService";
import type { GameState, ItemId, Position } from "../types/game";
import { GameIcon } from "./GameIcon";

type Props = Readonly<{ state: GameState; currentUser: AuthUser | null; itemLabels: Readonly<Record<ItemId, string>>; onMove: (from: Position, to: Position) => boolean; onServe: (from: Position, orderId: string) => boolean; onAddItem: () => boolean; onLoginRequest: () => void }>;
const same = (a: Position | null, b: Position) => a?.x === b.x && a.y === b.y;
const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

const ClockIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const CoinIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="#F2CE75" stroke="#8A672D" strokeWidth="1.5"/><path d="M12 7.5v9M14.5 9.3c-.6-.8-1.4-1.2-2.5-1.2-1.4 0-2.4.7-2.4 1.8 0 2.8 4.8 1.4 4.8 4.1 0 1.1-1 1.9-2.5 1.9-1.1 0-2.1-.4-2.8-1.3" stroke="#8A672D" strokeWidth="1.4" strokeLinecap="round"/></svg>;

export const MergeBoard = ({ state, currentUser, itemLabels, onMove, onServe, onAddItem, onLoginRequest }: Props) => {
  const [selected, setSelected] = useState<Position | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dragging = useRef<Position | null>(null);
  const sound = useMemo(() => createSoundPlayer(), []);
  useEffect(() => () => void sound.dispose(), [sound]);
  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(null), 1600); return () => window.clearTimeout(id); }, [notice]);

  const move = (from: Position, to: Position) => {
    if (onMove(from, to)) sound.playMergeSound();
    else setNotice("이 재료들은 아직 합칠 수 없어요.");
  };
  const activate = (position: Position, occupied: boolean) => {
    if (!selected) { if (occupied) setSelected(position); return; }
    if (same(selected, position)) setSelected(null);
    else { move(selected, position); setSelected(null); }
  };
  const serve = (orderId: string) => {
    const from = dragging.current ?? selected;
    if (!from) { setNotice("완성 음료를 먼저 선택해 주세요."); return; }
    if (onServe(from, orderId)) { sound.playMergeSound(); setNotice("주문 완료! 골드를 획득했어요."); }
    else setNotice("주문과 음료가 일치하지 않아요.");
    dragging.current = null; setSelected(null);
  };

  return (
    <main className="animate-screen-in mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#F7F5F1] text-[#293A33] shadow-[0_0_60px_rgba(45,58,52,.12)]">
      <header className="sticky top-0 z-10 border-b border-[#E7E2DA] bg-[#FCFBF8]/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div><p className="text-[10px] font-bold tracking-[.22em] text-[#88A092]">COFFEE TOWN</p>{currentUser && !currentUser.isAnonymous ? <div className="mt-1 flex items-center gap-2">{currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="size-6 rounded-full object-cover" referrerPolicy="no-referrer"/> : null}<span className="text-[11px] font-bold text-[#587063]">Lv.{state.level} · {currentUser.displayName}</span></div> : <button className="ui-button mt-1 rounded-full bg-[#EDF2EE] px-2.5 py-1 text-[10px] font-bold text-[#587063]" onClick={onLoginRequest} type="button">게스트 · 로그인하고 저장</button>}</div>
          <div className="flex gap-2"><div className="flex items-center gap-1.5 rounded-xl bg-[#E7F0EA] px-2.5 py-2 font-bold text-[#315846]"><ClockIcon/><span className="tabular-nums">{time(state.remainingTimeSec)}</span></div><div className="flex items-center gap-1 rounded-xl bg-[#FFF3D5] px-2.5 py-2 font-bold text-[#725626]"><CoinIcon/><span>{state.gold}</span></div></div>
        </div>
        <p className="mb-2 text-xs font-bold text-[#76847D]">기다리는 손님</p>
        <div className="grid grid-cols-3 gap-2">
          {state.orders.map((order, index) => <button className="min-w-0 rounded-2xl border border-[#E1DDD6] bg-white p-2.5 text-left shadow-[0_4px_14px_rgba(47,63,55,.06)] transition hover:border-[#9DB8A8] active:scale-[.98]" key={order.id} onClick={() => serve(order.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); serve(order.id); }} type="button"><div className="mb-1 flex items-center justify-between"><span className="grid size-6 place-items-center rounded-full bg-[#E5EEE8] text-[10px] font-black text-[#52705F]">{index + 1}</span><span className="text-[10px] font-bold text-[#A28C66]">+{order.reward}</span></div><GameIcon itemId={order.itemId} className="mx-auto size-9"/><span className="mt-1 block truncate text-center text-[10px] font-bold">{itemLabels[order.itemId]}</span></button>)}
        </div>
      </header>
      <section className="flex flex-1 flex-col px-4 py-5">
        <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#91A299]">BREWING BOARD</p><h2 className="text-xl font-black tracking-[-.035em]">재료를 합쳐보세요</h2></div><p className="text-xs font-semibold text-[#8B958F]">탭 또는 드래그</p></div>
        <div aria-label="6행 5열 머지 보드" className="grid grid-cols-5 gap-2 rounded-[1.75rem] bg-[#EAE5DE] p-3" role="grid">
          {state.grid.flatMap((row) => row.map((cell) => { const position = { x: cell.x, y: cell.y } as const; const active = same(selected, position); return <button aria-label={`${cell.y + 1}행 ${cell.x + 1}열 ${cell.itemId ? itemLabels[cell.itemId] : "빈 칸"}`} aria-pressed={active} className={`aspect-square min-w-0 rounded-2xl border transition ${active ? "-translate-y-1 border-[#5F846F] bg-[#F7FBF8] ring-3 ring-[#B9D0C1]" : cell.itemId ? "border-[#DDD6CC] bg-[#FFFEFC] shadow-[0_3px_8px_rgba(70,61,51,.08)] active:scale-95" : "border-dashed border-[#D2CBC1] bg-[#F4F1EC]"}`} draggable={Boolean(cell.itemId)} key={`${cell.x}:${cell.y}`} onClick={() => activate(position, Boolean(cell.itemId))} onDragEnd={() => { dragging.current = null; }} onDragOver={(e) => e.preventDefault()} onDragStart={() => { dragging.current = position; }} onDrop={(e) => { e.preventDefault(); if (dragging.current) move(dragging.current, position); dragging.current = null; setSelected(null); }} role="gridcell" type="button">{cell.itemId ? <span className="flex h-full flex-col items-center justify-center px-1"><GameIcon itemId={cell.itemId} className="size-[56%]"/><span className="mt-0.5 max-w-full truncate text-[9px] font-bold text-[#64736C]">{itemLabels[cell.itemId]}</span></span> : null}</button>; }))}
        </div>
        <div aria-live="polite" className="min-h-9 py-2 text-center text-xs font-semibold text-[#7B6C65]">{notice}</div>
      </section>
      <footer className="sticky bottom-0 border-t border-[#E6E0D7] bg-[#FCFBF8]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#355E4D] px-5 font-bold text-white shadow-[0_8px_20px_rgba(53,94,77,.2)] active:translate-y-0.5" onClick={() => { if (!onAddItem()) setNotice("보드가 가득 찼어요."); }} type="button"><svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>재료 추가 드롭</button></footer>
    </main>
  );
};
