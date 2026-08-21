import { useState } from "react";
import type { AuthUser } from "../services/authService";

export type UpgradeDefinition = Readonly<{
  id: string;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  unlockLevel: number;
}>;

type HubPage = "home" | "growth" | "profile";
type Props = Readonly<{
  user: AuthUser;
  gold: number;
  xp: number;
  level: number;
  upgrades: Readonly<Record<string, number>>;
  upgradeDefinitions: readonly UpgradeDefinition[];
  onStart: () => void;
  onBuyUpgrade: (upgrade: UpgradeDefinition) => Promise<void>;
  onSignOut: () => Promise<void>;
}>;

const Icon = ({ name }: Readonly<{ name: HubPage }>) => {
  if (name === "home") return <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true"><path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
  if (name === "growth") return <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true"><path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
};

const Avatar = ({ user, size = "size-14" }: Readonly<{ user: AuthUser; size?: string }>) => user.avatarUrl ? (
  <img src={user.avatarUrl} alt={`${user.displayName} 프로필`} className={`${size} rounded-2xl object-cover ring-2 ring-white`} referrerPolicy="no-referrer" />
) : (
  <span className={`grid ${size} place-items-center rounded-2xl bg-[#DCEBE2] text-xl font-black text-[#355E4D]`}>{user.displayName.slice(0, 1)}</span>
);

export const CafeHub = ({ user, gold, xp, level, upgrades, upgradeDefinitions, onStart, onBuyUpgrade, onSignOut }: Props) => {
  const [page, setPage] = useState<HubPage>("home");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const levelStartXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;
  const progress = Math.min(100, Math.max(0, ((xp - levelStartXp) / (nextLevelXp - levelStartXp)) * 100));

  const buy = async (upgrade: UpgradeDefinition) => {
    setPending(upgrade.id);
    setNotice(null);
    try {
      await onBuyUpgrade(upgrade);
      setNotice(`${upgrade.name} 업그레이드를 완료했습니다.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "업그레이드하지 못했습니다.");
    } finally {
      setPending(null);
    }
  };

  return <main className="animate-screen-in mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#F7F5F1] text-[#293A33] shadow-[0_0_60px_rgba(45,58,52,.12)]">
    <header className="bg-[#355E4D] px-5 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.24em] text-[#BFD4C7]">COFFEE TOWN</p><h1 className="mt-1 text-2xl font-black">{page === "home" ? "나의 카페" : page === "growth" ? "성장 센터" : "바리스타 프로필"}</h1></div><Avatar user={user} size="size-12" /></div>
    </header>
    <section className="flex-1 px-4 pb-28 pt-5">
      {page === "home" ? <div className="space-y-4">
        <article className="ui-card rounded-[1.75rem] bg-white p-5 shadow-[0_10px_30px_rgba(45,58,52,.08)]"><div className="flex items-center gap-4"><Avatar user={user}/><div><p className="text-xs font-bold text-[#789180]">어서 오세요</p><h2 className="text-xl font-black">{user.displayName} 바리스타</h2></div></div><div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-bold text-[#789180]">CAFE LEVEL</p><p className="text-3xl font-black">Lv. {level}</p></div><p className="text-sm font-bold text-[#8A672D]">{gold.toLocaleString()} G</p></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E9ECE9]"><span className="block h-full rounded-full bg-[#79A68B] transition-all" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-right text-[11px] font-semibold text-[#829087]">{xp} / {nextLevelXp} XP</p></article>
        <button className="ui-button w-full rounded-[1.75rem] bg-[#E8C98F] p-5 text-left shadow-[0_10px_25px_rgba(122,91,45,.16)]" onClick={onStart} type="button"><p className="text-xs font-black tracking-[.15em] text-[#765629]">OPEN FOR BUSINESS</p><div className="mt-2 flex items-center justify-between"><div><h2 className="text-2xl font-black text-[#3D3325]">오늘의 영업 시작</h2><p className="mt-1 text-sm font-semibold text-[#745F42]">주문을 완성하고 카페를 성장시키세요</p></div><span className="grid size-12 place-items-center rounded-full bg-[#355E4D] text-white"><svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true"><path d="m9 6 7 6-7 6V6Z" fill="currentColor"/></svg></span></div></button>
        <article className="ui-card rounded-[1.5rem] border border-[#E2DED7] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#789180]">TODAY'S SHIFT</p><h2 className="mt-1 text-lg font-black">오늘의 영업 브리핑</h2></div><span className="rounded-full bg-[#E5EEE8] px-3 py-1 text-xs font-black text-[#4E715F]">5분 영업</span></div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#758078]">주문 목표</span><strong>음료 5잔</strong></div><div className="flex justify-between"><span className="text-[#758078]">완벽 제조 보너스</span><strong>골드 10%</strong></div><div className="flex justify-between"><span className="text-[#758078]">현재 장비 효율</span><strong>{100 + Object.values(upgrades).reduce((sum, value) => sum + value, 0) * 4}%</strong></div></div></article>
      </div> : null}
      {page === "growth" ? <div className="space-y-3"><div className="mb-5 rounded-2xl bg-[#FFF3D5] p-4"><p className="text-xs font-bold text-[#8C6B32]">보유 골드</p><p className="mt-1 text-2xl font-black text-[#634A22]">{gold.toLocaleString()} G</p></div>{upgradeDefinitions.map((upgrade) => { const current = upgrades[upgrade.id] ?? 0; const cost = Math.round(upgrade.baseCost * 1.7 ** current); const locked = level < upgrade.unlockLevel; const maxed = current >= upgrade.maxLevel; return <article className="ui-card flex items-center gap-3 rounded-2xl border border-[#E2DED7] bg-white p-4" key={upgrade.id}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#E5EEE8] text-[#4C6D5C]"><svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true"><path d="M14.5 6.5 17.5 3.5l3 3-3 3M13 8l3 3-8 8H5v-3l8-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="truncate font-black">{upgrade.name}</h3><span className="text-xs font-bold text-[#789180]">{current}/{upgrade.maxLevel}</span></div><p className="mt-1 text-xs leading-5 text-[#77827C]">{upgrade.description}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold text-[#8A672D]">{locked ? `Lv.${upgrade.unlockLevel} 해금` : maxed ? "최대 레벨" : `${cost.toLocaleString()} G`}</span><button className="min-h-9 rounded-xl bg-[#355E4D] px-3 text-xs font-bold text-white disabled:bg-[#CBD2CD]" disabled={locked || maxed || gold < cost || pending !== null} onClick={() => void buy(upgrade)} type="button">{pending === upgrade.id ? "강화 중" : "강화"}</button></div></div></article>; })}</div> : null}
      {page === "profile" ? <div className="space-y-4"><article className="rounded-[1.75rem] bg-white p-6 text-center shadow-[0_10px_30px_rgba(45,58,52,.08)]"><div className="mx-auto w-fit"><Avatar user={user} size="size-24" /></div><h2 className="mt-4 text-2xl font-black">{user.displayName}</h2><p className="mt-1 text-sm font-semibold capitalize text-[#789180]">{user.provider ?? "social"} 계정 연결됨</p><div className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-xl bg-[#F2F5F2] p-3"><p className="text-xl font-black">{level}</p><p className="text-[10px] font-bold text-[#7C8A82]">LEVEL</p></div><div className="rounded-xl bg-[#F2F5F2] p-3"><p className="text-xl font-black">{xp}</p><p className="text-[10px] font-bold text-[#7C8A82]">TOTAL XP</p></div><div className="rounded-xl bg-[#F2F5F2] p-3"><p className="text-xl font-black">{gold}</p><p className="text-[10px] font-bold text-[#7C8A82]">GOLD</p></div></div></article><button className="min-h-12 w-full rounded-2xl border border-[#D9DDD9] bg-white font-bold text-[#6F7873]" onClick={() => void onSignOut()} type="button">로그아웃</button></div> : null}
      {notice ? <p className="mt-4 rounded-xl bg-[#E6F0E9] p-3 text-center text-sm font-semibold text-[#3F6653]" role="status">{notice}</p> : null}
    </section>
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[480px] justify-around border-t border-[#E4E0D9] bg-[#FCFBF8]/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">{(["home", "growth", "profile"] as const).map((item) => <button className={`flex min-h-12 min-w-20 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold ${page === item ? "bg-[#E3ECE6] text-[#355E4D]" : "text-[#89938E]"}`} key={item} onClick={() => setPage(item)} type="button"><Icon name={item}/>{item === "home" ? "카페 홈" : item === "growth" ? "성장" : "프로필"}</button>)}</nav>
  </main>;
};
