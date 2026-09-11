import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { soundPlayer } from "./audio/soundPlayer";
import { fridgeIngredients, labels, menuCatalog, recipeTierMeta, recipeTierOf, stages } from "./game/catalog";
import { businessClock } from "./game/rules";
import { useGame } from "./game/store";
import { ItemImage } from "./components/ItemImage";
import { RecipeBook } from "./components/RecipeBook";
import { Result } from "./components/Result";
import { Upgrade } from "./components/Upgrade";
import { useAccountProgress } from "./hooks/useAccountProgress";
import { loadCombinationRecipes } from "./services/recipeService";
const CafeScene = lazy(() => import("./scene/CafeScene").then((module) => ({ default: module.CafeScene })));
import {
  completeOAuthCallback,
  saveNickname,
  signInWithGoogle,
  signInWithKakao,
  signOut,
  type PlayerProfile,
} from "./services/authService";
import { loadLeaderboard, type RankingEntry } from "./services/rankingService";

const stationNames = {
  grinder: "그라인더",
  espresso: "에스프레소 머신",
  cups: "컵 선반",
  water: "정수기",
  coldWater: "정수기",
  fridge: "재료 냉장고",
  steam: "스팀 완드",
  ice: "제빙기",
  sparkling: "탄산수 머신",
  coldBrew: "콜드브루 타워",
  blender: "블렌더",
  serve: "픽업 카운터",
} as const;

const NicknameModal = ({
  profile,
  close,
}: Readonly<{ profile: PlayerProfile | null; close: () => void }>) => {
  const current = useGame(({ playerNickname }) => playerNickname);
  const setPlayerNickname = useGame(({ setPlayerNickname }) => setPlayerNickname);
  const start = useGame(({ start }) => start);
  const [value, setValue] = useState(profile?.nickname ?? current ?? "");
  const [error, setError] = useState("");
  const submit = async () => {
    const nickname = value.trim();
    if (nickname.length < 2 || nickname.length > 16) {
      setError("닉네임은 2~16자로 입력하세요.");
      return;
    }
    try {
      if (profile) await saveNickname(profile.userId, nickname);
      setPlayerNickname(nickname);
      close();
      soundPlayer.startMusic(useGame.getState().selectedStage);
      start();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "닉네임 저장에 실패했습니다.");
    }
  };
  return (
    <section className="nickname-modal" role="dialog" aria-modal="true" aria-label="바리스타 닉네임 설정">
      <div>
        <p>BARISTA PROFILE</p>
        <h2>어떤 이름으로 불러드릴까요?</h2>
        <span>게임 주문서와 결과 화면에 표시되는 이름입니다.</span>
        <input
          autoFocus
          maxLength={16}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          placeholder="닉네임 2~16자"
        />
        {error ? <small>{error}</small> : null}
        <button type="button" onClick={() => void submit()}>
          닉네임 확정
        </button>
        <button className="nickname-cancel" type="button" onClick={close}>
          취소
        </button>
      </div>
    </section>
  );
};

const ProfileModal = ({ profile, close }: Readonly<{ profile: PlayerProfile | null; close: () => void }>) => {
  const bankGold = useGame(({ bankGold }) => bankGold);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  const playerNickname = useGame(({ playerNickname }) => playerNickname);
  const [bgmEnabled, setBgmEnabled] = useState(() => soundPlayer.isMusicEnabled());
  const [musicVolume, setMusicVolume] = useState(() => soundPlayer.getMusicVolume());
  const [effectsVolume, setEffectsVolume] = useState(() => soundPlayer.getEffectsVolume());
  return (
    <section className="profile-modal" role="dialog" aria-modal="true" aria-label="바리스타 프로필">
      <button className="modal-backdrop" type="button" aria-label="닫기" onClick={close} />
      <div>
        <button className="profile-close" type="button" aria-label="내 정보 닫기" onClick={close}>
          ×
        </button>
        <span className="profile-avatar">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="소셜 프로필" referrerPolicy="no-referrer" />
          ) : (
            (profile?.nickname ?? playerNickname ?? profile?.email ?? "G").slice(0, 1)
          )}
        </span>
        <p>BARISTA PROFILE</p>
        <h2>{profile?.nickname ?? playerNickname ?? "Guest Barista"}</h2>
        <small>{profile?.email ?? "게스트 진행도는 이 기기에만 저장됩니다"}</small>
        <dl>
          <div>
            <dt>보유 골드</dt>
            <dd>{bankGold.toLocaleString()} G</dd>
          </div>
          <div>
            <dt>최고 스테이지</dt>
            <dd>STAGE {unlockedStage}</dd>
          </div>
        </dl>
        <section className="profile-audio">
          <div>
            <label htmlFor="bgm-volume">BGM</label>
            <output>{Math.round(musicVolume * 100)}%</output>
            <button
              type="button"
              className={bgmEnabled ? "enabled" : ""}
              onClick={() => {
                const next = !bgmEnabled;
                setBgmEnabled(next);
                soundPlayer.setMusicEnabled(next);
              }}
            >
              {bgmEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <input
            id="bgm-volume"
            aria-label="BGM 볼륨"
            type="range"
            min="0"
            max="100"
            value={Math.round(musicVolume * 100)}
            onChange={(event) => {
              const value = Number(event.target.value) / 100;
              setMusicVolume(value);
              soundPlayer.setMusicVolume(value);
            }}
          />
          <div>
            <label htmlFor="effects-volume">효과음</label>
            <output>{Math.round(effectsVolume * 100)}%</output>
          </div>
          <input
            id="effects-volume"
            aria-label="효과음 볼륨"
            type="range"
            min="0"
            max="100"
            value={Math.round(effectsVolume * 100)}
            onChange={(event) => {
              const value = Number(event.target.value) / 100;
              setEffectsVolume(value);
              soundPlayer.setEffectsVolume(value);
            }}
          />
        </section>
        {profile ? (
          <button className="profile-logout" type="button" onClick={() => void signOut()}>
            로그아웃
          </button>
        ) : null}
      </div>
    </section>
  );
};

const LeaderboardModal = ({ close }: Readonly<{ close: () => void }>) => {
  const [entries, setEntries] = useState<readonly RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void loadLeaderboard()
      .then(setEntries)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "랭킹을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section className="leaderboard-modal" role="dialog" aria-modal="true" aria-label="바리스타 랭킹">
      <button className="modal-backdrop" type="button" aria-label="랭킹 닫기" onClick={close} />
      <div>
        <header>
          <div>
            <p>COFFEE TOWN RANKING</p>
            <h2>바리스타 랭킹</h2>
            <span>스테이지별 최고 점수 합산 · TOP 50</span>
          </div>
          <button type="button" aria-label="랭킹 닫기" onClick={close}>
            ×
          </button>
        </header>
        <div className="leaderboard-list">
          {loading ? <p className="leaderboard-state">랭킹을 불러오는 중입니다</p> : null}
          {error ? <p className="leaderboard-state error">{error}</p> : null}
          {!loading && !error && !entries.length ? (
            <p className="leaderboard-state">아직 등록된 바리스타가 없습니다.</p>
          ) : null}
          {entries.map((entry) => (
            <article key={`${entry.position}-${entry.nickname}`} className={entry.isMe ? "me" : ""}>
              <strong>{entry.position}</strong>
              <span>
                {entry.nickname}
                {entry.isMe ? <small>나</small> : null}
              </span>
              <div>
                <b>{entry.score.toLocaleString("ko-KR")} P</b>
                <small>{entry.stagesRanked}개 스테이지 기록</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
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
  const [rankingOpen, setRankingOpen] = useState(false);
  useEffect(() => {
    soundPlayer.startLobbyMusic();
    const resume = () => soundPlayer.startLobbyMusic();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);
  useEffect(() => {
    if (profile?.nickname && profile.nickname !== playerNickname)
      useGame.getState().setPlayerNickname(profile.nickname);
  }, [playerNickname, profile]);
  const begin = () => {
    if (!playerNickname && !profile?.nickname) {
      setNicknameOpen(true);
      return;
    }
    soundPlayer.startMusic(selectedStage);
    start();
  };
  return (
    <main className="title-screen">
      <div className="title-shade" />
      <div className="title-steam" />
      <section className="title-card lobby-card">
        <div className="lobby-profile">
          {profile ? (
            <>
              <div>
                <b>{profile.nickname ?? playerNickname ?? "닉네임 미설정"}</b>
                <small>{profile.email ?? "로그인됨"}</small>
              </div>
              <button
                className="profile-icon"
                type="button"
                aria-label="내 정보 열기"
                onClick={() => setProfileOpen(true)}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="소셜 프로필" referrerPolicy="no-referrer" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <>
              <div>
                <b>{playerNickname ?? "Guest Barista"}</b>
                <small>로그인하고 진행 상황을 안전하게 저장하세요</small>
              </div>
              <div className="social-login-row">
                <button className="google-login" type="button" onClick={() => void signInWithGoogle()}>
                  Google 로그인
                </button>
                <button className="kakao-login" type="button" onClick={() => void signInWithKakao()}>
                  카카오 로그인
                </button>
              </div>
              <button
                className="profile-icon guest-profile"
                type="button"
                aria-label="바리스타 프로필 및 볼륨 설정"
                onClick={() => setProfileOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
                </svg>
              </button>
            </>
          )}
        </div>
        <p>WELCOME TO</p>
        <h1>Coffee Town</h1>
        <span>영업 시간 : 09:00 ~ 21:00</span>
        <div className="stage-picker">
          {stages.map((stage) => (
            <button
              type="button"
              key={stage.id}
              className={selectedStage === stage.id ? "selected" : ""}
              disabled={stage.id > unlockedStage}
              onClick={() => setStage(stage.id)}
            >
              <b>{stage.id}</b>
              <span>{stage.name}</span>
              <small>{stage.id > unlockedStage ? "LOCKED" : "PLAYABLE"}</small>
            </button>
          ))}
        </div>
        <button className="lobby-start" type="button" onClick={begin}>
          영업 시작
        </button>
        <div className="lobby-secondary-actions">
          <button className="lobby-upgrade" type="button" onClick={openUpgrade}>
            카페 업그레이드 · {bankGold.toLocaleString()} G
          </button>
          <button className="lobby-ranking" type="button" onClick={() => setRankingOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5H5v3c0 2 2 3 4 3M16 5h3v3c0 2-2 3-4 3M8 3h8v5c0 3-2 5-4 5s-4-2-4-5V3Zm4 10v4m-4 4h8m-6-4h4" />
            </svg>
            랭킹
          </button>
        </div>
        <small>이동 WASD/방향키 · 작업 SPACE · 조합 ENTER</small>
      </section>
      {nicknameOpen ? <NicknameModal profile={profile} close={() => setNicknameOpen(false)} /> : null}
      {profileOpen ? <ProfileModal profile={profile} close={() => setProfileOpen(false)} /> : null}
      {rankingOpen ? <LeaderboardModal close={() => setRankingOpen(false)} /> : null}
    </main>
  );
};

const AuthCallback = () => {
  const [message, setMessage] = useState("소셜 계정을 연결하고 있습니다");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void completeOAuthCallback()
      .then(() => {
        window.history.replaceState({}, "", "/");
        window.location.replace("/");
      })
      .catch((reason) => {
        setFailed(true);
        setMessage(reason instanceof Error ? reason.message : "로그인에 실패했습니다.");
      });
  }, []);
  return (
    <main className="auth-callback">
      <section>
        {failed ? null : <span className="auth-spinner" />}
        <h1>COFFEE TOWN</h1>
        <p>{message}</p>
        {failed ? (
          <div className="social-login-row">
            <button type="button" onClick={() => void signInWithGoogle()}>
              Google 다시 시작
            </button>
            <button className="kakao-login" type="button" onClick={() => void signInWithKakao()}>
              카카오 다시 시작
            </button>
          </div>
        ) : null}
        <button type="button" onClick={() => window.location.replace("/")}>
          로비로 돌아가기
        </button>
      </section>
    </main>
  );
};

const Shift = () => {
  const shift = useGame(({ shift }) => shift);
  const selectedUid = useGame(({ selectedUid }) => selectedUid);
  const tick = useGame(({ tick }) => tick);
  const finish = useGame(({ finish }) => finish);
  const finishEarly = useGame(({ finishEarly }) => finishEarly);
  const select = useGame(({ select }) => select);
  const discard = useGame(({ discard }) => discard);
  const interactNearby = useGame(({ interactNearby }) => interactNearby);
  const nearbyStation = useGame(({ nearbyStation }) => nearbyStation);
  const combine = useGame(({ combine }) => combine);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const automationEnabled = useGame(({ shift }) => shift.automationEnabled);
  const autoServeEnabled = useGame(({ shift }) => shift.autoServeEnabled);
  const automationLevel = useGame(({ upgrades }) => upgrades.automation);
  const autoServeLevel = useGame(({ upgrades }) => upgrades.autoServe);
  const setAutomationEnabled = useGame(({ setAutomationEnabled }) => setAutomationEnabled);
  const setAutoServeEnabled = useGame(({ setAutoServeEnabled }) => setAutoServeEnabled);
  const fridgeOpen = useGame(({ fridgeOpen }) => fridgeOpen);
  const closeFridge = useGame(({ closeFridge }) => closeFridge);
  const takeFromFridge = useGame(({ takeFromFridge }) => takeFromFridge);
  const waterOpen = useGame(({ waterOpen }) => waterOpen);
  const recipeBookOpen = useGame(({ recipeBookOpen }) => recipeBookOpen);
  const closeWater = useGame(({ closeWater }) => closeWater);
  const takeWater = useGame(({ takeWater }) => takeWater);
  const newDiscovery = useGame(({ newDiscovery }) => newDiscovery);
  const clearDiscovery = useGame(({ clearDiscovery }) => clearDiscovery);
  const seenMenuStages = useGame(({ seenMenuStages }) => seenMenuStages);
  const markMenuStageSeen = useGame(({ markMenuStageSeen }) => markMenuStageSeen);
  const feverTarget = Math.max(3, 5 - Math.floor(shift.upgrades.feverCharge / 2));
  const previousWork = useRef(shift.activeWork);
  const previousReady = useRef(0);
  const previousOrders = useRef(shift.orderSequence);
  const previousShiftGold = useRef(shift.gold);
  const previousShiftScore = useRef(shift.score);
  const [earnedGold, setEarnedGold] = useState<Readonly<{
    id: number;
    amount: number;
    score: number;
  }> | null>(null);
  const [menuIntroOpen, setMenuIntroOpen] = useState(() => !seenMenuStages.includes(shift.stageId));
  const newlyAvailableMenus = menuCatalog.filter(({ stage }) => stage === shift.stageId);
  const activeRuntime = shift.activeWork ? shift.stations[shift.activeWork] : null;
  const workProgress = activeRuntime?.total
    ? Math.round(((activeRuntime.total - activeRuntime.remaining) / activeRuntime.total) * 100)
    : 0;
  useEffect(() => {
    if (menuIntroOpen || recipeBookOpen || fridgeOpen || waterOpen) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [fridgeOpen, menuIntroOpen, recipeBookOpen, tick, waterOpen]);
  useEffect(() => {
    soundPlayer.startMusic(shift.stageId);
  }, [shift.stageId]);
  useEffect(() => {
    soundPlayer.setFever(shift.fever > 0);
  }, [shift.fever]);
  useEffect(() => {
    if (!waterOpen) return;
    const chooseWater = (event: KeyboardEvent) => {
      if (event.key === "1") takeWater("hot_water");
      if (event.key === "2") takeWater("cold_water");
      if (event.key === "Escape") closeWater();
    };
    window.addEventListener("keydown", chooseWater);
    return () => window.removeEventListener("keydown", chooseWater);
  }, [closeWater, takeWater, waterOpen]);
  useEffect(() => {
    if (!newDiscovery) return;
    const timeout = window.setTimeout(clearDiscovery, 3200);
    return () => window.clearTimeout(timeout);
  }, [clearDiscovery, newDiscovery]);
  useEffect(() => {
    if (shift.activeWork && previousWork.current !== shift.activeWork) soundPlayer.playMachineStart();
    previousWork.current = shift.activeWork;
    const ready = Object.values(shift.stations).filter(({ phase }) => phase === "ready").length;
    if (ready > previousReady.current) soundPlayer.playMachineReady();
    previousReady.current = ready;
    if (shift.orderSequence > previousOrders.current) {
      const amount = Math.max(0, shift.gold - previousShiftGold.current);
      const score = Math.max(0, shift.score - previousShiftScore.current);
      soundPlayer.playCoin();
      if (amount > 0) setEarnedGold({ id: shift.orderSequence, amount, score });
    }
    previousOrders.current = shift.orderSequence;
    previousShiftGold.current = shift.gold;
    previousShiftScore.current = shift.score;
    if (shift.notice === "음료 조합 성공") soundPlayer.playCombine();
  }, [shift.activeWork, shift.gold, shift.notice, shift.orderSequence, shift.score, shift.stations]);
  useEffect(() => {
    if (!earnedGold) return;
    const timeout = window.setTimeout(() => setEarnedGold(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [earnedGold]);
  useEffect(() => {
    if (!fridgeOpen) return;
    const choose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFridge();
        return;
      }
      if (!/^[0-9]$/.test(event.key)) return;
      event.preventDefault();
      const index = event.key === "0" ? 9 : Number(event.key) - 1;
      const ingredient = fridgeIngredients[index];
      if (ingredient && shift.stageId >= ingredient.minStage) takeFromFridge(ingredient.itemId);
    };
    window.addEventListener("keydown", choose);
    return () => window.removeEventListener("keydown", choose);
  }, [closeFridge, fridgeOpen, shift.stageId, takeFromFridge]);
  return (
    <main className={`game-screen ${shift.fever ? "fever" : ""}`}>
      <Suspense
        fallback={
          <div className="scene-loading" role="status">
            카페를 준비하고 있습니다…
          </div>
        }
      >
        <CafeScene />
      </Suspense>
      {newDiscovery ? (
        <section className="recipe-discovery" role="status" aria-live="polite">
          <div className="discovery-rays" />
          <small>NEW RECIPE DISCOVERED</small>
          <ItemImage itemId={newDiscovery} />
          <strong>{labels[newDiscovery]}</strong>
          <span>레시피 도감에 새 제조법이 등록되었습니다!</span>
          <div className="discovery-sparkles" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        </section>
      ) : null}
      {menuIntroOpen ? (
        <section className="menu-unlock-modal" role="dialog" aria-modal="true" aria-label="새 메뉴 안내">
          <div>
            <p>STAGE {shift.stageId} · MENU UPDATE</p>
            <h2>{shift.stageId === 1 ? "첫 영업 메뉴" : "새 메뉴가 열렸습니다"}</h2>
            <div>
              {newlyAvailableMenus.map((menu) => (
                <article key={menu.id}>
                  <ItemImage itemId={menu.id} />
                  <small>NEW MENU</small>
                  <strong>{menu.name}</strong>
                  <span>조합에 성공하면 레시피 도감에 제조법이 기록됩니다.</span>
                </article>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                markMenuStageSeen(shift.stageId);
                setMenuIntroOpen(false);
              }}
            >
              영업 시작
            </button>
          </div>
        </section>
      ) : null}
      <header className="hud">
        <div>
          <small>BUSINESS TIME</small>
          <strong>{businessClock(shift.time)}</strong>
        </div>
        <div className="order" key={shift.order.id}>
          <small>ORDER {String(shift.orderSequence + 1).padStart(2, "0")}</small>
          <ItemImage itemId={shift.order.itemId} />
          <strong>{shift.order.name}</strong>
        </div>
        <div className="gold-card">
          <small>보유 GOLD</small>
          <strong>{(bankGold + shift.gold).toLocaleString()} G</strong>
        </div>
        <div className="score-card">
          <small>영업 SCORE</small>
          <strong>{shift.score.toLocaleString("ko-KR")} P</strong>
        </div>
        <button type="button" onClick={finishEarly}>
          조기 마감
        </button>
      </header>
      {automationLevel > 0 || autoServeLevel > 0 ? (
        <aside className="automation-controls" aria-label="자동화 설정">
          <small>자동화</small>
          {automationLevel > 0 ? (
            <button
              type="button"
              className={automationEnabled ? "active" : ""}
              aria-pressed={automationEnabled}
              onClick={() => setAutomationEnabled(!automationEnabled)}
            >
              자동 조합 {automationEnabled ? "ON" : "OFF"}
            </button>
          ) : null}
          {autoServeLevel > 0 ? (
            <button
              type="button"
              className={autoServeEnabled ? "active" : ""}
              aria-pressed={autoServeEnabled}
              onClick={() => setAutoServeEnabled(!autoServeEnabled)}
            >
              자동 서빙 {autoServeEnabled ? "ON" : "OFF"}
            </button>
          ) : null}
        </aside>
      ) : null}
      {shift.activeWork && activeRuntime?.phase === "processing" ? (
        <section className="work-progress" aria-label="현재 설비 작업 진행도">
          <div>
            <small>NOW WORKING</small>
            <strong>{stationNames[shift.activeWork]}</strong>
          </div>
          <div
            className="work-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={workProgress}
          >
            <i style={{ width: `${workProgress}%` }} />
          </div>
          <b>{activeRuntime.remaining}s</b>
        </section>
      ) : null}
      {earnedGold ? (
        <div className="gold-earned-fx" key={earnedGold.id} role="status" aria-live="polite">
          <strong>+{earnedGold.amount.toLocaleString("ko-KR")}G</strong>
          <b>+{earnedGold.score.toLocaleString("ko-KR")}P</b>
          <div className="coin-flight" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <i key={index}>G</i>
            ))}
          </div>
        </div>
      ) : null}
      <aside className="inventory" data-count={shift.inventory.length}>
              <small>숫자키 1~9 선택</small>
        {shift.inventory.length ? (
          shift.inventory.map((item, index) => {
            const tier = recipeTierOf(item.itemId);
            return (
              <div
                className={`inventory-item ${item.uid === selectedUid ? "selected" : ""}`}
                key={item.uid}
                style={{ "--tier-color": recipeTierMeta[tier].color } as CSSProperties}
              >
                <button className="inventory-select" onClick={() => select(item.uid)} type="button">
                  <b>{index + 1}</b>
                  <ItemImage itemId={item.itemId} />
                  <span>{labels[item.itemId]}</span>
                  <small>{tier}단계</small>
                </button>
                <button
                  className="inventory-remove"
                  type="button"
                  aria-label={`${labels[item.itemId]} 버리기`}
                  title="버리기"
                  onClick={() => discard(item.uid)}
                >
                  ×
                </button>
              </div>
            );
          })
        ) : (
          <span>비어 있음</span>
        )}
      </aside>
      {shift.time === 0 ? (
        <section className="closing-banner">
          <p>21:00 · CLOSED</p>
          <h2>오늘 영업을 마감할까요?</h2>
          <span>오늘 번 골드가 정산되고 다음 영업일이 해금됩니다.</span>
          <button type="button" onClick={finish}>
            영업 마감 및 정산
          </button>
        </section>
      ) : null}
      {fridgeOpen ? (
        <section className="fridge-picker" role="dialog" aria-modal="true" aria-label="재료 냉장고">
          <div>
            <p>INGREDIENT FRIDGE</p>
            <h2>재료 꺼내기</h2>
            <span>숫자키 1~9, 0 또는 터치로 재료를 선택하세요.</span>
            <div className="fridge-grid">
              {fridgeIngredients.map(({ itemId, minStage }, index) => {
                const tier = recipeTierOf(itemId);
                return (
                  <button
                    type="button"
                    key={itemId}
                    disabled={shift.stageId < minStage}
                    style={{ "--tier-color": recipeTierMeta[tier].color } as CSSProperties}
                    onClick={() => takeFromFridge(itemId)}
                  >
                    <i>{index === 9 ? 0 : index + 1}</i>
                    <ItemImage itemId={itemId} />
                    <b>{labels[itemId]}</b>
                    <small>
                      {shift.stageId < minStage ? `STAGE ${minStage} 해금` : `${tier}단계 · 즉시 꺼내기`}
                    </small>
                  </button>
                );
              })}
            </div>
            <button className="fridge-close" type="button" onClick={closeFridge}>
              닫기 · ESC
            </button>
          </div>
        </section>
      ) : null}
      {waterOpen ? (
        <section className="fridge-picker water-picker" role="dialog" aria-modal="true" aria-label="정수기">
          <div>
            <p>WATER DISPENSER</p>
            <h2>물을 선택하세요</h2>
            <span>숫자키 1, 2 또는 터치로 선택할 수 있습니다.</span>
            <div className="fridge-grid water-grid">
              <button type="button" onClick={() => takeWater("hot_water")}>
                <i>1</i>
                <ItemImage itemId="hot_water" />
                <b>온수</b>
                <small>뜨거운 음료용</small>
              </button>
              <button type="button" onClick={() => takeWater("cold_water")}>
                <i>2</i>
                <ItemImage itemId="cold_water" />
                <b>냉수</b>
                <small>차가운 음료용</small>
              </button>
            </div>
            <button className="fridge-close" type="button" onClick={closeWater}>
              닫기 · ESC
            </button>
          </div>
        </section>
      ) : null}
      <div className="mobile-controls">
        <button
          className="mobile-combine"
          type="button"
          disabled={!selectedUid || Boolean(shift.activeWork)}
          onClick={combine}
        >
          조합
        </button>
        <button
          className="mobile-action"
          type="button"
          disabled={!nearbyStation || Boolean(shift.activeWork)}
          onClick={interactNearby}
        >
          {shift.activeWork ? "작업 중" : nearbyStation ? "작업" : "설비로 이동"}
        </button>
      </div>
      <footer className="notice">
        <strong>{shift.fever ? `FEVER ${shift.fever}s · x3` : `COMBO ${shift.combo}/${feverTarget}`}</strong>
        <span>{shift.notice} · 클릭 이동 · 드래그 시점 회전</span>
      </footer>
    </main>
  );
};

export const App = () => (window.location.pathname === "/auth/callback" ? <AuthCallback /> : <GameApp />);

const GameApp = () => {
  const screen = useGame(({ screen }) => screen);
  const { profile, sync, blocked, retry } = useAccountProgress();
  useEffect(() => {
    let active = true;
    void loadCombinationRecipes()
      .then((recipes) => {
        if (active) useGame.getState().setCombinationRecipes(recipes);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("button:not(:disabled)")) soundPlayer.playUi();
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  if (blocked)
    return (
      <main className="auth-callback">
        <section>
          {sync.status === "loading" ? <span className="auth-spinner" /> : null}
          <h1>COFFEE TOWN</h1>
          <p>{sync.message}</p>
          {sync.status === "error" ? (
            <button type="button" onClick={retry}>
              다시 시도
            </button>
          ) : null}
        </section>
      </main>
    );
  const content =
    screen === "title" ? (
      <Title profile={profile} />
    ) : screen === "result" ? (
      <Result profile={profile} sync={sync} />
    ) : screen === "upgrade" ? (
      <Upgrade />
    ) : (
      <Shift />
    );
  return (
    <>
      {content}
      {sync.status !== "ready" || sync.message ? (
        <aside className="sync-banner" role="status" aria-live="polite">
          <span>{sync.message}</span>
          {sync.status === "error" ? (
            <button type="button" onClick={retry}>
              저장 다시 시도
            </button>
          ) : null}
        </aside>
      ) : null}
      {screen === "title" || screen === "shift" ? <RecipeBook /> : null}
    </>
  );
};
