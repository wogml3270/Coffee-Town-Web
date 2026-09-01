import { useEffect, useRef, useState } from "react";
import { soundPlayer } from "./audio/soundPlayer";
import { fridgeIngredients, labels, menuCatalog, stages } from "./game/catalog";
import { businessClock } from "./game/rules";
import { maxUpgradeLevel, upgradeCost, useGame, type UpgradeId } from "./game/store";
import { CafeScene } from "./scene/CafeScene";
import { completeOAuthCallback, getCurrentProfile, saveNickname, signInWithGoogle, signInWithKakao, signOut, subscribeToAuth, type PlayerProfile } from "./services/authService";
import { loadProgress, saveProgress } from "./services/progressService";
import { loadCombinationRecipes } from "./services/recipeService";

const NicknameModal = ({ profile, close }: Readonly<{ profile: PlayerProfile | null; close: () => void }>) => {
  const current = useGame(({ playerNickname }) => playerNickname);
  const setPlayerNickname = useGame(({ setPlayerNickname }) => setPlayerNickname);
  const start = useGame(({ start }) => start);
  const [value, setValue] = useState(profile?.nickname ?? current ?? "");
  const [error, setError] = useState("");
  const submit = async () => {
    const nickname = value.trim();
    if (nickname.length < 2 || nickname.length > 16) { setError("닉네임은 2~16자로 입력하세요."); return; }
    try { if (profile) await saveNickname(profile.userId, nickname); setPlayerNickname(nickname); close(); soundPlayer.startMusic(useGame.getState().selectedStage); start(); } catch (reason) { setError(reason instanceof Error ? reason.message : "닉네임 저장에 실패했습니다."); }
  };
  return <section className="nickname-modal" role="dialog" aria-modal="true" aria-label="바리스타 닉네임 설정"><div><p>BARISTA PROFILE</p><h2>어떤 이름으로 불러드릴까요?</h2><span>게임 주문서와 결과 화면에 표시되는 이름입니다.</span><input autoFocus maxLength={16} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} placeholder="닉네임 2~16자"/>{error ? <small>{error}</small> : null}<button type="button" onClick={() => void submit()}>닉네임 확정</button><button className="nickname-cancel" type="button" onClick={close}>취소</button></div></section>;
};

const ProfileModal = ({ profile, close }: Readonly<{ profile: PlayerProfile; close: () => void }>) => {
  const bankGold = useGame(({ bankGold }) => bankGold);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  return <section className="profile-modal" role="dialog" aria-modal="true" aria-label="내 정보"><button className="modal-backdrop" type="button" aria-label="닫기" onClick={close}/><div><button className="profile-close" type="button" aria-label="내 정보 닫기" onClick={close}>×</button><span className="profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="소셜 프로필" referrerPolicy="no-referrer"/> : (profile.nickname ?? profile.email ?? "B").slice(0, 1)}</span><p>BARISTA PROFILE</p><h2>{profile.nickname ?? "닉네임 미설정"}</h2><small>{profile.email ?? "공개 이메일 없음"}</small><dl><div><dt>보유 골드</dt><dd>{bankGold.toLocaleString()} G</dd></div><div><dt>최고 스테이지</dt><dd>STAGE {unlockedStage}</dd></div></dl><button className="profile-logout" type="button" onClick={() => void signOut()}>로그아웃</button></div></section>;
};

const SoundSettings = () => {
  const [open, setOpen] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(() => soundPlayer.isMusicEnabled());
  const toggle = () => { const next = !bgmEnabled; setBgmEnabled(next); soundPlayer.setMusicEnabled(next); };
  return <aside className="sound-settings"><button className="sound-settings-button" type="button" aria-label="사운드 옵션 열기" onClick={() => setOpen((value) => !value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 7 9H3v6h4l4 4V5Zm4 5a3 3 0 0 1 0 4m2-7a7 7 0 0 1 0 10"/></svg></button>{open ? <section role="dialog" aria-label="사운드 옵션"><p>SOUND OPTIONS</p><h2>오디오 설정</h2><button className={bgmEnabled ? "enabled" : ""} type="button" aria-pressed={bgmEnabled} onClick={toggle}><span>BGM</span><b>{bgmEnabled ? "ON" : "OFF"}</b></button><small>브라우저가 자동재생을 차단하면 첫 입력 시 음악이 시작됩니다.</small></section> : null}</aside>;
};

const RecipeBook = () => {
  const [open,setOpen]=useState(false);
  const unlockedStage=useGame(({unlockedStage})=>unlockedStage);
  const discovered=useGame(({discoveredRecipes})=>discoveredRecipes);
  return <aside className="recipe-book"><button className="recipe-book-button" type="button" aria-label="레시피 도감 열기" onClick={()=>setOpen(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4V4Z"/></svg></button>{open?<section className="recipe-book-modal" role="dialog" aria-modal="true" aria-label="레시피 도감"><button className="modal-backdrop" type="button" aria-label="도감 닫기" onClick={()=>setOpen(false)}/><div><header><div><p>COFFEE TOWN ARCHIVE</p><h2>레시피 도감</h2><span>{discovered.length}/{menuCatalog.length} 발견</span></div><button type="button" onClick={()=>setOpen(false)}>×</button></header><div className="recipe-grid">{menuCatalog.map((menu)=>{const found=discovered.includes(menu.id);const available=menu.stage<=unlockedStage;return <article key={menu.id} className={found?"found":available?"available":"locked"}><i>{found?"✓":"?"}</i><small>STAGE {menu.stage}</small><h3>{found?menu.name:available?menu.name:"???"}</h3><p>{found?menu.recipe:"조합에 성공하면 제조법이 공개됩니다"}</p></article>})}</div></div></section>:null}</aside>;
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
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    soundPlayer.startLobbyMusic();
    const resume = () => soundPlayer.startLobbyMusic();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => { window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); };
  }, []);
  useEffect(() => { if (profile?.nickname && profile.nickname !== playerNickname) useGame.getState().setPlayerNickname(profile.nickname); }, [playerNickname, profile]);
  const begin = () => { if (!playerNickname && !profile?.nickname) { setNicknameOpen(true); return; } soundPlayer.startMusic(selectedStage); start(); };
  return <main className="title-screen"><div className="title-shade"/><div className="title-steam"/><section className="title-card lobby-card"><div className="lobby-profile">{profile ? <><div><b>{profile.nickname ?? playerNickname ?? "닉네임 미설정"}</b><small>{profile.email ?? "로그인됨"}</small></div><button className="profile-icon" type="button" aria-label="내 정보 열기" onClick={() => setProfileOpen(true)}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt="소셜 프로필" referrerPolicy="no-referrer"/> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"/></svg>}</button></> : <><div><b>{playerNickname ?? "Guest Barista"}</b><small>로그인하고 진행 상황을 안전하게 저장하세요</small></div><div className="social-login-row"><button className="google-login" type="button" onClick={() => void signInWithGoogle()}>Google 로그인</button><button className="kakao-login" type="button" onClick={() => void signInWithKakao()}>카카오 로그인</button></div></>}</div><p>WELCOME TO</p><h1>Coffee Town</h1><span>09:00부터 21:00까지, 오늘의 영업일을 선택하세요</span><div className="stage-picker">{stages.map((stage) => <button type="button" key={stage.id} className={selectedStage === stage.id ? "selected" : ""} disabled={stage.id > unlockedStage} onClick={() => setStage(stage.id)}><b>{stage.id}</b><span>{stage.name}</span><small>{stage.id > unlockedStage ? "LOCKED" : `NEW · ${labels[stage.unlock]}`}</small></button>)}</div><button className="lobby-start" type="button" onClick={begin}>영업 시작</button><button className="lobby-upgrade" type="button" onClick={openUpgrade}>카페 업그레이드 · {bankGold} G</button><small>이동 WASD/방향키 · 작업 SPACE · 조합 ENTER</small></section>{nicknameOpen ? <NicknameModal profile={profile} close={() => setNicknameOpen(false)}/> : null}{profile && profileOpen ? <ProfileModal profile={profile} close={() => setProfileOpen(false)}/> : null}</main>;
};

const AuthCallback = () => {
  const [message, setMessage] = useState("소셜 계정을 연결하고 있습니다");
  const [failed, setFailed] = useState(false);
  useEffect(() => { void completeOAuthCallback().then(() => { window.history.replaceState({}, "", "/"); window.location.replace("/"); }).catch((reason) => { setFailed(true); setMessage(reason instanceof Error ? reason.message : "로그인에 실패했습니다."); }); }, []);
  return <main className="auth-callback"><section>{failed ? null : <span className="auth-spinner"/>}<h1>COFFEE TOWN</h1><p>{message}</p>{failed ? <div className="social-login-row"><button type="button" onClick={() => void signInWithGoogle()}>Google 다시 시작</button><button className="kakao-login" type="button" onClick={() => void signInWithKakao()}>카카오 다시 시작</button></div> : null}<button type="button" onClick={() => window.location.replace("/")}>로비로 돌아가기</button></section></main>;
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
  useEffect(() => { soundPlayer.startMusic(shift.stageId); }, [shift.stageId]);
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
  useEffect(() => {
    if (!fridgeOpen) return;
    const choose = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeFridge(); return; }
      if (!/^[0-9]$/.test(event.key)) return;
      event.preventDefault();
      const index = event.key === "0" ? 9 : Number(event.key) - 1;
      const ingredient = fridgeIngredients[index];
      if (ingredient && shift.stageId >= ingredient.minStage) takeFromFridge(ingredient.itemId);
    };
    window.addEventListener("keydown", choose);
    return () => window.removeEventListener("keydown", choose);
  }, [closeFridge, fridgeOpen, shift.stageId, takeFromFridge]);
  return <main className={`game-screen ${shift.fever ? "fever" : ""}`}><CafeScene/><header className="hud"><div><small>BUSINESS TIME</small><strong>{businessClock(shift.time)}</strong></div><div className="order" key={shift.order.id}><small>ORDER {String(shift.orderSequence+1).padStart(2,"0")}</small><strong>{shift.order.name}</strong></div><div className="gold-card"><small>보유 GOLD</small><strong>{bankGold + shift.gold} G</strong></div><button type="button" onClick={exit}>조기 마감</button></header><aside className="inventory"><small>숫자키 1~9 선택</small>{shift.inventory.length ? shift.inventory.map((item, index) => <button className={item.uid === selectedUid ? "selected" : ""} key={item.uid} onClick={() => select(item.uid)} type="button"><b>{index + 1}</b>{labels[item.itemId]}</button>) : <span>비어 있음</span>}</aside>{shift.time===0?<section className="closing-banner"><p>21:00 · CLOSED</p><h2>오늘 영업을 마감할까요?</h2><span>오늘 번 골드가 정산되고 다음 영업일이 해금됩니다.</span><button type="button" onClick={finish}>영업 마감 및 정산</button></section>:null}{fridgeOpen ? <section className="fridge-picker" role="dialog" aria-modal="true" aria-label="재료 냉장고"><div><p>INGREDIENT FRIDGE</p><h2>재료 꺼내기</h2><span>숫자키 1~9, 0 또는 터치로 재료를 선택하세요.</span><div className="fridge-grid">{fridgeIngredients.map(({ itemId, minStage }, index) => <button type="button" key={itemId} disabled={shift.stageId < minStage} onClick={() => takeFromFridge(itemId)}><i>{index === 9 ? 0 : index + 1}</i><b>{labels[itemId]}</b><small>{shift.stageId < minStage ? `STAGE ${minStage} 해금` : "즉시 꺼내기"}</small></button>)}</div><button className="fridge-close" type="button" onClick={closeFridge}>닫기 · ESC</button></div></section> : null}<div className="mobile-controls"><button className="mobile-combine" type="button" disabled={!selectedUid || Boolean(shift.activeWork)} onClick={combine}>조합</button><button className="mobile-action" type="button" disabled={!nearbyStation || Boolean(shift.activeWork)} onClick={interactNearby}>{shift.activeWork ? "작업 중" : nearbyStation ? "작업" : "설비로 이동"}</button></div><footer className="notice"><strong>{shift.fever ? `FEVER ${shift.fever}s · x3` : `COMBO ${shift.combo}/${feverTarget}`}</strong><span>{shift.notice} · 클릭 이동 · 드래그 시점 회전</span></footer></main>;
};

const Result = () => {
  const shift = useGame(({ shift }) => shift);
  const exit = useGame(({ exit }) => exit);
  const start = useGame(({ start }) => start);
  const openUpgrade = useGame(({ openUpgrade }) => openUpgrade);
  const bankGold = useGame(({ bankGold }) => bankGold);
  useEffect(() => { soundPlayer.startLobbyMusic(); }, []);
  return <main className="result-screen"><section><p>STAGE {shift.stageId} · 21:00 CLOSED</p><h1>오늘도 수고했어요</h1><div><strong>+{shift.gold} G</strong><span>{shift.orderSequence}잔 완료 · 보유 골드 {bankGold} G</span></div><button type="button" onClick={openUpgrade}>카페 업그레이드</button><button type="button" onClick={() => start()}>다시 영업하기</button><button className="secondary" type="button" onClick={exit}>로비로</button></section></main>;
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
  useEffect(() => { soundPlayer.startLobbyMusic(); }, []);
  return <main className="upgrade-screen"><section><p>CAFE WORKSHOP</p><h1>영업 준비</h1><strong className="bank">{bankGold} G</strong><div className="upgrade-list">{upgradeInfo.map(({ id, name, description }) => { const level = upgrades[id]; const max = maxUpgradeLevel(id); const cost = upgradeCost(id, level); return <article key={id} className={id === "automation" ? "premium" : ""}><div><h2>{name}</h2><span>{description}</span><small>Lv.{level} / {max}</small></div><button type="button" disabled={level >= max || bankGold < cost} onClick={() => buyUpgrade(id)}>{level >= max ? "MAX" : `${cost.toLocaleString()} G`}</button></article>; })}</div><button className="primary" type="button" onClick={() => start()}>다음 영업 시작</button><button className="secondary" type="button" onClick={exit}>타이틀로</button></section></main>;
};

export const App = () => { const screen = useGame(({ screen }) => screen); const bankGold = useGame(({ bankGold }) => bankGold); const upgrades = useGame(({ upgrades }) => upgrades); const unlockedStage = useGame(({ unlockedStage }) => unlockedStage); const discoveredRecipes=useGame(({discoveredRecipes})=>discoveredRecipes); const hydrateProgress = useGame(({ hydrateProgress }) => hydrateProgress); const setCombinationRecipes=useGame(({setCombinationRecipes})=>setCombinationRecipes); const [profile, setProfile] = useState<PlayerProfile | null>(null); useEffect(() => { void getCurrentProfile().then(setProfile).catch(() => setProfile(null)); return subscribeToAuth(setProfile); }, []); useEffect(() => { void loadCombinationRecipes().then(setCombinationRecipes).catch((error) => console.warn("DB 레시피를 불러오지 못해 기본 레시피를 사용합니다.", error)); }, [setCombinationRecipes]); useEffect(() => { if (!profile) return; void loadProgress(profile.userId).then((progress) => { if (progress) hydrateProgress(progress.gold, progress.unlockedStage, progress.upgrades,progress.discoveredRecipes); }).catch(console.error); }, [hydrateProgress, profile]); useEffect(() => { if (!profile) return; const timeout = window.setTimeout(() => { void saveProgress(profile.userId, { gold: bankGold, unlockedStage, upgrades,discoveredRecipes }).catch(console.error); }, 700); return () => window.clearTimeout(timeout); }, [bankGold, discoveredRecipes, profile, unlockedStage, upgrades]); useEffect(() => { const click = (event: MouseEvent) => { if ((event.target as Element | null)?.closest("button:not(:disabled)")) soundPlayer.playUi(); }; document.addEventListener("click", click); return () => document.removeEventListener("click", click); }, []); if (window.location.pathname === "/auth/callback") return <AuthCallback/>; const content = screen === "title" ? <Title profile={profile}/> : screen === "result" ? <Result/> : screen === "upgrade" ? <Upgrade/> : <Shift/>; return <>{content}<SoundSettings/><RecipeBook/></>; };
