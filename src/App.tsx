import { useEffect, useRef, useState } from "react";
import { soundPlayer } from "./audio/soundPlayer";
import { fridgeIngredients, labels, stages } from "./game/catalog";
import { maxUpgradeLevel, upgradeCost, useGame, type UpgradeId } from "./game/store";
import { CafeScene } from "./scene/CafeScene";
import { completeOAuthCallback, getCurrentProfile, saveNickname, signInWithGoogle, signOut, subscribeToAuth, type PlayerProfile } from "./services/authService";
import { loadProgress, saveProgress } from "./services/progressService";

const NicknameModal = ({ profile, close }: Readonly<{ profile: PlayerProfile | null; close: () => void }>) => {
  const current = useGame(({ playerNickname }) => playerNickname);
  const setPlayerNickname = useGame(({ setPlayerNickname }) => setPlayerNickname);
  const start = useGame(({ start }) => start);
  const [value, setValue] = useState(profile?.nickname ?? current ?? "");
  const [error, setError] = useState("");
  const submit = async () => {
    const nickname = value.trim();
    if (nickname.length < 2 || nickname.length > 16) { setError("닉네임은 2~16자로 입력하세요."); return; }
    try { if (profile) await saveNickname(profile.userId, nickname); setPlayerNickname(nickname); close(); soundPlayer.startMusic(); start(); } catch (reason) { setError(reason instanceof Error ? reason.message : "닉네임 저장에 실패했습니다."); }
  };
  return <section className="nickname-modal" role="dialog" aria-modal="true" aria-label="바리스타 닉네임 설정"><div><p>BARISTA PROFILE</p><h2>어떤 이름으로 불러드릴까요?</h2><span>게임 주문서와 결과 화면에 표시되는 이름입니다.</span><input autoFocus maxLength={16} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} placeholder="닉네임 2~16자"/>{error ? <small>{error}</small> : null}<button type="button" onClick={() => void submit()}>닉네임 확정</button><button className="nickname-cancel" type="button" onClick={close}>취소</button></div></section>;
};

const Title = ({ profile }: Readonly<{ profile: PlayerProfile | null }>) => {
  const start = useGame(({ start }) => start);
  const openUpgrade = useGame(({ openUpgrade }) => openUpgrade);
  const selectedStage = useGame(({ selectedStage }) => selectedStage);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  const setStage = useGame(({ setStage }) => setStage);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const playerNickname = useGame(({ playerNickname }) => playerNickname);
  const [nicknameOpen, setNicknameOpen] = useState(false);
  useEffect(() => { if (profile?.nickname && profile.nickname !== playerNickname) useGame.getState().setPlayerNickname(profile.nickname); }, [playerNickname, profile]);
  const begin = () => { if (!playerNickname && !profile?.nickname) { setNicknameOpen(true); return; } soundPlayer.startMusic(); start(); };
  return <main className="title-screen"><div className="title-shade"/><div className="title-steam"/><section className="title-card lobby-card"><div className="lobby-profile">{profile ? <><span className="avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Google 프로필" referrerPolicy="no-referrer"/> : (profile.nickname ?? profile.email ?? "B").slice(0,1)}</span><div><b>{profile.nickname ?? playerNickname ?? "닉네임 미설정"}</b><small>{profile.email}</small></div><button type="button" onClick={() => void signOut()}>로그아웃</button></> : <><div><b>{playerNickname ?? "Guest Barista"}</b><small>Google로 진행 상황을 안전하게 저장하세요</small></div><button type="button" onClick={() => void signInWithGoogle()}>Google 로그인</button></>}</div><p>WELCOME TO</p><h1>Coffee Town</h1><span>오늘의 영업 스테이지를 선택하세요</span><div className="stage-picker">{stages.map((stage) => <button type="button" key={stage.id} className={selectedStage === stage.id ? "selected" : ""} disabled={stage.id > unlockedStage} onClick={() => setStage(stage.id)}><b>{stage.id}</b><span>{stage.name}</span><small>{stage.id > unlockedStage ? "LOCKED" : `${stage.time}초 · ${stage.target}잔`}</small></button>)}</div><button className="lobby-start" type="button" onClick={begin}>게임 시작</button><button className="lobby-upgrade" type="button" onClick={openUpgrade}>카페 업그레이드 · {bankGold} G</button><small>이동 WASD/방향키 · 작업 SPACE · 조합 ENTER</small></section>{nicknameOpen ? <NicknameModal profile={profile} close={() => setNicknameOpen(false)}/> : null}</main>;
};

const AuthCallback = () => {
  const [message, setMessage] = useState("Google 계정을 연결하고 있습니다");
  useEffect(() => { void completeOAuthCallback().then(() => { window.history.replaceState({}, "", "/"); window.location.replace("/"); }).catch((reason) => setMessage(reason instanceof Error ? reason.message : "로그인에 실패했습니다.")); }, []);
  return <main className="auth-callback"><section><span className="auth-spinner"/><h1>COFFEE TOWN</h1><p>{message}</p><button type="button" onClick={() => window.location.replace("/")}>로비로 돌아가기</button></section></main>;
};

const Shift = () => {
  const shift = useGame(({ shift }) => shift);
  const selectedUid = useGame(({ selectedUid }) => selectedUid);
  const tick = useGame(({ tick }) => tick);
  const finish = useGame(({ finish }) => finish);
  const exit = useGame(({ exit }) => exit);
  const select = useGame(({ select }) => select);
  const interactNearby = useGame(({ interactNearby }) => interactNearby);
  const nearbyStation = useGame(({ nearbyStation }) => nearbyStation);
  const combine = useGame(({ combine }) => combine);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const fridgeOpen = useGame(({ fridgeOpen }) => fridgeOpen);
  const closeFridge = useGame(({ closeFridge }) => closeFridge);
  const takeFromFridge = useGame(({ takeFromFridge }) => takeFromFridge);
  const feverTarget = Math.max(3, 5 - Math.floor(shift.upgrades.feverCharge / 2));
  const previousWork = useRef(shift.activeWork);
  const previousReady = useRef(0);
  const previousOrders = useRef(shift.orderSequence);
  useEffect(() => { const id = window.setInterval(tick, 1000); return () => window.clearInterval(id); }, [tick]);
  useEffect(() => { if (shift.time === 0) finish(); }, [finish, shift.time]);
  useEffect(() => { soundPlayer.setFever(shift.fever > 0); }, [shift.fever]);
  useEffect(() => {
    if (shift.activeWork && previousWork.current !== shift.activeWork) soundPlayer.playMachineStart();
    previousWork.current = shift.activeWork;
    const ready = Object.values(shift.stations).filter(({ phase }) => phase === "ready").length;
    if (ready > previousReady.current) soundPlayer.playMachineReady();
    previousReady.current = ready;
    if (shift.orderSequence > previousOrders.current) soundPlayer.playCoin();
    previousOrders.current = shift.orderSequence;
    if (shift.notice === "음료 조합 성공") soundPlayer.playCombine();
  }, [shift.activeWork, shift.notice, shift.orderSequence, shift.stations]);
  return <main className={`game-screen ${shift.fever ? "fever" : ""}`}><CafeScene/><header className="hud"><div><small>STAGE {shift.stageId} · TIME</small><strong>{shift.time}</strong></div><div className="order" key={shift.order.id}><small>ORDER · {shift.orderSequence}/{shift.targetOrders}</small><strong>{shift.order.name}</strong></div><div className="gold-card"><small>보유 GOLD</small><strong>{bankGold + shift.gold} G</strong></div><button type="button" onClick={exit}>나가기</button></header><aside className="inventory"><small>숫자키 1~9 선택</small>{shift.inventory.length ? shift.inventory.map((item, index) => <button className={item.uid === selectedUid ? "selected" : ""} key={item.uid} onClick={() => select(item.uid)} type="button"><b>{index + 1}</b>{labels[item.itemId]}</button>) : <span>비어 있음</span>}</aside>{fridgeOpen ? <section className="fridge-picker" role="dialog" aria-modal="true" aria-label="재료 냉장고"><div><p>INGREDIENT FRIDGE</p><h2>재료 꺼내기</h2><span>현재 스테이지에서 사용할 재료를 선택하세요.</span><div className="fridge-grid">{fridgeIngredients.map(({ itemId, minStage }) => <button type="button" key={itemId} disabled={shift.stageId < minStage} onClick={() => takeFromFridge(itemId)}><b>{labels[itemId]}</b><small>{shift.stageId < minStage ? `STAGE ${minStage} 해금` : "즉시 꺼내기"}</small></button>)}</div><button className="fridge-close" type="button" onClick={closeFridge}>닫기</button></div></section> : null}<div className="mobile-controls"><button className="mobile-combine" type="button" disabled={!selectedUid || Boolean(shift.activeWork)} onClick={combine}>조합</button><button className="mobile-action" type="button" disabled={!nearbyStation || Boolean(shift.activeWork)} onClick={interactNearby}>{shift.activeWork ? "작업 중" : nearbyStation ? "작업" : "설비로 이동"}</button></div><footer className="notice"><strong>{shift.fever ? `FEVER ${shift.fever}s · x3` : `COMBO ${shift.combo}/${feverTarget}`}</strong><span>{shift.notice} · 클릭 이동 · 드래그 시점 회전</span></footer></main>;
};

const Result = () => {
  const shift = useGame(({ shift }) => shift);
  const exit = useGame(({ exit }) => exit);
  const start = useGame(({ start }) => start);
  const openUpgrade = useGame(({ openUpgrade }) => openUpgrade);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const success = shift.orderSequence >= shift.targetOrders;
  return <main className="result-screen"><section><p>STAGE {shift.stageId} · {success ? "CLEAR" : "TRY AGAIN"}</p><h1>{success ? "영업 성공" : "영업 종료"}</h1><div><strong>+{shift.gold} G</strong><span>{shift.orderSequence}/{shift.targetOrders}잔 완료 · 보유 골드 {bankGold} G</span></div><button type="button" onClick={openUpgrade}>카페 업그레이드</button><button type="button" onClick={() => start()}>다시 영업하기</button><button className="secondary" type="button" onClick={exit}>로비로</button></section></main>;
};

const upgradeInfo: ReadonlyArray<Readonly<{ id: UpgradeId; name: string; description: string }>> = [
  { id: "speed", name: "설비 출력", description: "모든 제조 시간을 단계마다 12% 단축" },
  { id: "movement", name: "바리스타 운동화", description: "캐릭터 기본 이동속도를 단계마다 10% 증가" },
  { id: "feverCharge", name: "피버 부스터", description: "2단계마다 피버 발동에 필요한 콤보를 1회 감소" },
  { id: "feverDuration", name: "피버 타이머", description: "피버 지속시간을 단계마다 3초 연장" },
  { id: "tips", name: "서비스 트레이닝", description: "모든 주문 팁과 정산 골드를 단계마다 6% 증가" },
  { id: "automation", name: "오토 바리스타 모듈", description: "획득한 재료가 유효한 레시피를 이루면 즉시 자동 조합" },
];

const Upgrade = () => {
  const bankGold = useGame(({ bankGold }) => bankGold);
  const upgrades = useGame(({ upgrades }) => upgrades);
  const buyUpgrade = useGame(({ buyUpgrade }) => buyUpgrade);
  const start = useGame(({ start }) => start);
  const exit = useGame(({ exit }) => exit);
  return <main className="upgrade-screen"><section><p>CAFE WORKSHOP</p><h1>영업 준비</h1><strong className="bank">{bankGold} G</strong><div className="upgrade-list">{upgradeInfo.map(({ id, name, description }) => { const level = upgrades[id]; const max = maxUpgradeLevel(id); const cost = upgradeCost(id, level); return <article key={id} className={id === "automation" ? "premium" : ""}><div><h2>{name}</h2><span>{description}</span><small>Lv.{level} / {max}</small></div><button type="button" disabled={level >= max || bankGold < cost} onClick={() => buyUpgrade(id)}>{level >= max ? "MAX" : `${cost.toLocaleString()} G`}</button></article>; })}</div><button className="primary" type="button" onClick={() => start()}>다음 영업 시작</button><button className="secondary" type="button" onClick={exit}>타이틀로</button></section></main>;
};

export const App = () => { const screen = useGame(({ screen }) => screen); const bankGold = useGame(({ bankGold }) => bankGold); const upgrades = useGame(({ upgrades }) => upgrades); const unlockedStage = useGame(({ unlockedStage }) => unlockedStage); const hydrateProgress = useGame(({ hydrateProgress }) => hydrateProgress); const [profile, setProfile] = useState<PlayerProfile | null>(null); useEffect(() => { void getCurrentProfile().then(setProfile).catch(() => setProfile(null)); return subscribeToAuth(setProfile); }, []); useEffect(() => { if (!profile) return; void loadProgress(profile.userId).then((progress) => { if (progress) hydrateProgress(progress.gold, progress.unlockedStage, progress.upgrades); }).catch(console.error); }, [hydrateProgress, profile]); useEffect(() => { if (!profile) return; const timeout = window.setTimeout(() => { void saveProgress(profile.userId, { gold: bankGold, unlockedStage, upgrades }).catch(console.error); }, 700); return () => window.clearTimeout(timeout); }, [bankGold, profile, unlockedStage, upgrades]); useEffect(() => { const click = (event: MouseEvent) => { if ((event.target as Element | null)?.closest("button:not(:disabled)")) soundPlayer.playUi(); }; document.addEventListener("click", click); return () => document.removeEventListener("click", click); }, []); if (window.location.pathname === "/auth/callback") return <AuthCallback/>; return screen === "title" ? <Title profile={profile}/> : screen === "result" ? <Result/> : screen === "upgrade" ? <Upgrade/> : <Shift/>; };
