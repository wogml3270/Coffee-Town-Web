import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { soundPlayer } from "./audio/soundPlayer";
import {
  fridgeIngredients,
  labels,
  menuCatalog,
  recipeArchive,
  recipeTierMeta,
  recipeTierOf,
  stages,
  type RecipeTier,
} from "./game/catalog";
import { businessClock, calculateShiftScore } from "./game/rules";
import { useGame } from "./game/store";
import {
  canBuyUpgrade,
  unmetUpgradeRequirements,
  upgradeCategories,
  upgradeNodeById,
  upgradeNodes,
  type UpgradeId,
} from "./game/upgradeTree";
import { CafeScene } from "./scene/CafeScene";
import {
  completeOAuthCallback,
  getCurrentProfile,
  saveNickname,
  signInWithGoogle,
  signInWithKakao,
  signOut,
  subscribeToAuth,
  type PlayerProfile,
} from "./services/authService";
import { loadProgress, saveProgress } from "./services/progressService";
import { loadCombinationRecipes } from "./services/recipeService";
import { loadUpgradeCatalog, purchaseUpgrade } from "./services/upgradeService";
import { loadLeaderboard, type RankingEntry } from "./services/rankingService";
import { saveShiftScore } from "./services/scoreService";

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

const UpgradeIcon = ({ id }: Readonly<{ id: UpgradeId }>) => {
  const paths: Record<UpgradeId, ReactNode> = {
    speed: (
      <>
        <path d="M7 17h18v9H7zM10 8h12l3 9H7z" />
        <path d="M12 12h8M16 8V5" />
      </>
    ),
    espressoSpeed: (
      <>
        <path d="M8 9h13v12a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5z" />
        <path d="M21 12h2a4 4 0 0 1 0 8h-2M12 5v3m5-3v3" />
      </>
    ),
    coldDrinkSpeed: (
      <>
        <path d="M10 6h12l-2 21h-8zM11 11h10" />
        <path d="m14 15 4 4m0-4-4 4" />
      </>
    ),
    movement: (
      <>
        <circle cx="17" cy="6" r="3" />
        <path d="m15 11-4 7 6 3 3-7 5 4M17 21l-5 6m6-6 5 6" />
      </>
    ),
    multitask: (
      <>
        <circle cx="16" cy="6" r="3" />
        <path d="M16 10v9m0-5-7 4m7-4 7 4m-7 1-5 8m5-8 5 8" />
        <path d="M5 12h5v5H5zm17 0h5v5h-5z" />
      </>
    ),
    feverCharge: <path d="M18 3 8 18h7l-1 11 10-16h-7z" />,
    feverDuration: (
      <>
        <circle cx="16" cy="17" r="11" />
        <path d="M16 10v7l5 3M12 3h8" />
      </>
    ),
    feverProfit: (
      <>
        <path d="M7 11h18v15H7zM10 11V7h12v4" />
        <circle cx="16" cy="18" r="4" />
        <path d="M16 16v4" />
      </>
    ),
    tips: (
      <>
        <path d="M5 17h22v9H5zM9 17v-3c0-7 14-7 14 0v3" />
        <path d="M13 10h6M3 26h26" />
      </>
    ),
    comboGuard: (
      <>
        <path d="m16 4 10 4v7c0 7-4 11-10 14C10 26 6 22 6 15V8z" />
        <path d="m11 16 3 3 7-7" />
      </>
    ),
    automation: (
      <>
        <rect x="5" y="8" width="22" height="17" rx="3" />
        <path d="M11 13h10M11 18h4m5 0h1M10 25v3m12-3v3M16 4v4" />
      </>
    ),
    autoServe: (
      <>
        <path d="M5 20h22v6H5zM8 20v-3a8 8 0 0 1 16 0v3M16 9V6" />
        <path d="m12 15 3 3 6-6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {paths[id]}
    </svg>
  );
};

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

const RecipeBook = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RecipeTier>(1);
  const screen = useGame(({ screen }) => screen);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  const discovered = useGame(({ discoveredRecipes }) => discoveredRecipes);
  const visibleRecipes = recipeArchive.filter(({ tier }) => tier === tab);
  const discoverableRecipes = recipeArchive;
  useEffect(() => {
    const toggleRecipeBook = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "KeyB" || event.key.toLowerCase() === "b" || event.key === "ㅠ") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", toggleRecipeBook, true);
    return () => window.removeEventListener("keydown", toggleRecipeBook, true);
  }, []);
  return (
    <aside className={`recipe-book ${screen}`}>
      <button
        className="recipe-book-button"
        type="button"
        aria-label="레시피 도감 열기"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4V4Z" />
        </svg>
        <kbd>B</kbd>
      </button>
      {open ? (
        <section className="recipe-book-modal" role="dialog" aria-label="레시피 도감">
          <div>
            <header>
              <div>
                <p>COFFEE TOWN ARCHIVE</p>
                <h2>레시피 도감</h2>
                <span>
                  {discoverableRecipes.filter(({ id }) => discovered.includes(id)).length}/
                  {discoverableRecipes.length} 발견
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </header>
            <nav className="recipe-tabs recipe-tier-tabs" aria-label="제조 단계">
              {(Object.entries(recipeTierMeta) as [string, (typeof recipeTierMeta)[RecipeTier]][]).map(
                ([tier, meta]) => {
                  const tierNumber = Number(tier) as RecipeTier;
                  return (
                    <button
                      className={tab === tierNumber ? "active" : ""}
                      type="button"
                      key={tier}
                      style={{ "--tier-color": meta.color } as CSSProperties}
                      onClick={() => setTab(tierNumber)}
                    >
                      <b>{tier}단계</b>
                      <small>{meta.name}</small>
                    </button>
                  );
                },
              )}
            </nav>
            {tab === 5 ? (
              <section className="blender-guide">
                <strong>BLENDER</strong>
                <span>맛 베이스를 선택하고, 우유와 얼음을 작업대에 준비한 뒤 블렌더를 사용하세요.</span>
                <small>모카 · 바닐라 · 말차 · 초콜릿 베이스 + 우유 + 얼음</small>
              </section>
            ) : null}
            <div className="recipe-grid">
              {visibleRecipes.map((menu) => {
                const found = discovered.includes(menu.id);
                const available = menu.stage <= unlockedStage;
                return (
                  <article
                    key={menu.id}
                    className={found ? "found" : available ? "available" : "locked"}
                    style={{ "--tier-color": recipeTierMeta[menu.tier].color } as CSSProperties}
                  >
                    <i>{found ? "✓" : "?"}</i>
                    <small>
                      {menu.tier}단계 · {recipeTierMeta[menu.tier].name}
                    </small>
                    <h3>{found ? menu.name : available ? menu.name : "???"}</h3>
                    <p>{found ? menu.recipe : "조합에 성공하면 제조법이 공개됩니다"}</p>
                    {found && menu.price ? (
                      <strong className="recipe-price">판매가 {menu.price.toLocaleString("ko-KR")}원</strong>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </aside>
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
            카페 업그레이드 · {bankGold} G
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
  const exit = useGame(({ exit }) => exit);
  const select = useGame(({ select }) => select);
  const discard = useGame(({ discard }) => discard);
  const interactNearby = useGame(({ interactNearby }) => interactNearby);
  const nearbyStation = useGame(({ nearbyStation }) => nearbyStation);
  const combine = useGame(({ combine }) => combine);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const fridgeOpen = useGame(({ fridgeOpen }) => fridgeOpen);
  const closeFridge = useGame(({ closeFridge }) => closeFridge);
  const takeFromFridge = useGame(({ takeFromFridge }) => takeFromFridge);
  const waterOpen = useGame(({ waterOpen }) => waterOpen);
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
    if (menuIntroOpen) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [menuIntroOpen, tick]);
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
      <CafeScene />
      {newDiscovery ? (
        <section className="recipe-discovery" role="status" aria-live="polite">
          <div className="discovery-rays" />
          <small>NEW RECIPE DISCOVERED</small>
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
          <strong>{shift.order.name}</strong>
        </div>
        <div className="gold-card">
          <small>보유 GOLD</small>
          <strong>{bankGold + shift.gold} G</strong>
        </div>
        <div className="score-card">
          <small>영업 SCORE</small>
          <strong>{shift.score.toLocaleString("ko-KR")} P</strong>
        </div>
        <button type="button" onClick={exit}>
          조기 마감
        </button>
      </header>
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
      <aside className="inventory">
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
                <b>온수</b>
                <small>뜨거운 음료용</small>
              </button>
              <button type="button" onClick={() => takeWater("cold_water")}>
                <i>2</i>
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

const Result = ({ profile }: Readonly<{ profile: PlayerProfile | null }>) => {
  const shift = useGame(({ shift }) => shift);
  const exit = useGame(({ exit }) => exit);
  const start = useGame(({ start }) => start);
  const openUpgrade = useGame(({ openUpgrade }) => openUpgrade);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const breakdown = calculateShiftScore(shift);
  const submitted = useRef(false);
  const [scoreStatus, setScoreStatus] = useState(profile ? "랭킹 기록 저장 중" : "게스트 기록");
  useEffect(() => {
    soundPlayer.startLobbyMusic();
  }, []);
  useEffect(() => {
    if (!profile || submitted.current) return;
    submitted.current = true;
    void saveShiftScore(shift, breakdown)
      .then(({ isPersonalBest }) =>
        setScoreStatus(isPersonalBest ? "개인 최고 기록 갱신!" : "랭킹 기록 저장 완료"),
      )
      .catch(() => setScoreStatus("점수 저장 실패 · 로그인 상태를 확인하세요"));
  }, [breakdown, profile, shift]);
  return (
    <main className="result-screen">
      <section>
        <p>STAGE {shift.stageId} · 21:00 CLOSED</p>
        <h1>오늘도 수고했어요</h1>
        <div>
          <strong>+{shift.gold} G</strong>
          <span>
            {shift.orderSequence}잔 완료 · 보유 골드 {bankGold} G
          </span>
        </div>
        <div className="result-score">
          <small>{scoreStatus}</small>
          <strong>{breakdown.total.toLocaleString("ko-KR")} P</strong>
          <dl>
            <div>
              <dt>주문 처리</dt>
              <dd>{breakdown.orderPoints.toLocaleString("ko-KR")}</dd>
            </div>
            <div>
              <dt>정확도 {breakdown.accuracy}%</dt>
              <dd>+{breakdown.accuracyBonus}</dd>
            </div>
            <div>
              <dt>최대 콤보 {shift.maxCombo}</dt>
              <dd>+{breakdown.comboBonus}</dd>
            </div>
            <div>
              <dt>만족도 {breakdown.averageSatisfaction}</dt>
              <dd>+{breakdown.satisfactionBonus}</dd>
            </div>
            <div>
              <dt>정상 마감</dt>
              <dd>+{breakdown.closingBonus}</dd>
            </div>
          </dl>
        </div>
        <button type="button" onClick={openUpgrade}>
          카페 업그레이드
        </button>
        <button type="button" onClick={() => start()}>
          다시 영업하기
        </button>
        <button className="secondary" type="button" onClick={exit}>
          로비로
        </button>
      </section>
    </main>
  );
};

const Upgrade = ({ profile }: Readonly<{ profile: PlayerProfile | null }>) => {
  const bankGold = useGame(({ bankGold }) => bankGold);
  const upgrades = useGame(({ upgrades }) => upgrades);
  const buyUpgrade = useGame(({ buyUpgrade }) => buyUpgrade);
  const applyUpgradePurchase = useGame(({ applyUpgradePurchase }) => applyUpgradePurchase);
  const start = useGame(({ start }) => start);
  const exit = useGame(({ exit }) => exit);
  const [selectedId, setSelectedId] = useState<UpgradeId>("speed");
  const [treeNodes, setTreeNodes] = useState(upgradeNodes);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const findNode = (id: UpgradeId) => treeNodes.find((node) => node.id === id) ?? upgradeNodeById(id);
  const selected = findNode(selectedId);
  const selectedLevel = upgrades[selectedId];
  const selectedCost = selected.costs[selectedLevel] ?? 0;
  const unmet = unmetUpgradeRequirements(selected, upgrades);
  const purchase = async () => {
    if (!canBuyUpgrade(selected, upgrades, bankGold) || purchasing) return;
    setPurchasing(true);
    setError("");
    try {
      if (profile) {
        const result = await purchaseUpgrade(selectedId);
        applyUpgradePurchase(result.upgradeId, result.newLevel, result.gold);
      } else {
        buyUpgrade(selectedId);
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "업그레이드 구매에 실패했습니다.";
      setError(
        message.includes("PREREQUISITE")
          ? "먼저 연결된 선행 업그레이드를 완료하세요."
          : message.includes("INSUFFICIENT")
            ? "골드가 부족합니다."
            : message,
      );
    } finally {
      setPurchasing(false);
    }
  };
  useEffect(() => {
    soundPlayer.startLobbyMusic();
    void loadUpgradeCatalog()
      .then((catalog) => {
        if (catalog.length)
          setTreeNodes(
            upgradeNodes.map((fallback) => catalog.find(({ id }) => id === fallback.id) ?? fallback),
          );
      })
      .catch((reason) => console.warn("업그레이드 카탈로그를 읽지 못해 번들 데이터를 사용합니다.", reason));
  }, []);
  return (
    <main className="upgrade-screen">
      <section className="upgrade-workshop">
        <header className="upgrade-header">
          <div>
            <p>CAFE WORKSHOP</p>
            <h1>카페 성장 트리</h1>
          </div>
          <strong className="bank">{bankGold.toLocaleString()} G</strong>
          <div className="upgrade-actions">
            <button type="button" onClick={() => start()}>
              영업 시작
            </button>
            <button className="secondary" type="button" onClick={exit}>
              타이틀
            </button>
          </div>
        </header>
        <div className="upgrade-tree-layout">
          <div className="upgrade-tree-viewport">
            <div className="upgrade-tree-grid">
              {upgradeCategories.map((category) => {
                const categoryNodes = treeNodes.filter((node) => node.category === category.id);
                return (
                  <section
                    className="upgrade-lane"
                    key={category.id}
                    style={{ "--category-color": category.color } as CSSProperties}
                  >
                    <header>
                      <strong>{category.name}</strong>
                      {category.id === "automation" ? <small>복합 선행 조건</small> : null}
                    </header>
                    <div className="upgrade-lane-nodes">
                      {categoryNodes.map((node, index) => {
                        const level = upgrades[node.id];
                        const locked = unmetUpgradeRequirements(node, upgrades).length > 0;
                        const internalRequirement = node.requirements.find(
                          ({ upgradeId }) => findNode(upgradeId).category === node.category,
                        );
                        const connectorUnlocked = internalRequirement
                          ? upgrades[internalRequirement.upgradeId] >= internalRequirement.level
                          : false;
                        return (
                          <div className="upgrade-node-wrap" key={node.id}>
                            {index ? (
                              <i className={`upgrade-connector ${connectorUnlocked ? "unlocked" : ""}`} />
                            ) : null}
                            <button
                              type="button"
                              aria-label={`${node.name} Lv.${level}`}
                              className={`upgrade-node ${node.id === selectedId ? "selected" : ""} ${locked ? "locked" : ""} ${node.premium ? "premium" : ""}`}
                              onClick={() => setSelectedId(node.id)}
                            >
                              <UpgradeIcon id={node.id} />
                              <span>
                                {locked
                                  ? "LOCK"
                                  : level >= node.maxLevel
                                    ? "MAX"
                                    : `${level}/${node.maxLevel}`}
                              </span>
                            </button>
                            <em>{node.name}</em>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          <aside className="upgrade-detail">
            <small>{upgradeCategories.find(({ id }) => id === selected.category)!.name}</small>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <strong>
              Lv.{selectedLevel} / {selected.maxLevel}
            </strong>
            {selected.requirements.length ? (
              <div className="upgrade-requirements">
                <span>선행 조건</span>
                {selected.requirements.map((requirement) => (
                  <small
                    key={requirement.upgradeId}
                    className={upgrades[requirement.upgradeId] >= requirement.level ? "done" : ""}
                  >
                    {findNode(requirement.upgradeId).name} Lv.{requirement.level}
                  </small>
                ))}
              </div>
            ) : null}
            {error ? <p className="upgrade-error">{error}</p> : null}
            <button
              type="button"
              disabled={!canBuyUpgrade(selected, upgrades, bankGold) || purchasing}
              onClick={() => void purchase()}
            >
              {selectedLevel >= selected.maxLevel
                ? "MAX LEVEL"
                : unmet.length
                  ? "선행 업그레이드 필요"
                  : purchasing
                    ? "구매 처리 중"
                    : `${selectedCost.toLocaleString()} G · 업그레이드`}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export const App = () => {
  const screen = useGame(({ screen }) => screen);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const upgrades = useGame(({ upgrades }) => upgrades);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  const discoveredRecipes = useGame(({ discoveredRecipes }) => discoveredRecipes);
  const seenMenuStages = useGame(({ seenMenuStages }) => seenMenuStages);
  const hydrateProgress = useGame(({ hydrateProgress }) => hydrateProgress);
  const setCombinationRecipes = useGame(({ setCombinationRecipes }) => setCombinationRecipes);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  useEffect(() => {
    void getCurrentProfile()
      .then((nextProfile) => {
        setProfile(nextProfile);
        setAuthReady(true);
        setCloudReady(!nextProfile);
      })
      .catch(() => {
        setProfile(null);
        setAuthReady(true);
        setCloudReady(true);
      });
    return subscribeToAuth((nextProfile) => {
      setProfile(nextProfile);
      setAuthReady(true);
      setCloudReady(!nextProfile);
    });
  }, []);
  useEffect(() => {
    void loadCombinationRecipes()
      .then(setCombinationRecipes)
      .catch((error) => console.warn("DB 레시피를 불러오지 못해 기본 레시피를 사용합니다.", error));
  }, [setCombinationRecipes]);
  useEffect(() => {
    if (!profile) return;
    setCloudReady(false);
    void loadProgress(profile.userId)
      .then((progress) => {
        hydrateProgress(
          progress.gold,
          progress.unlockedStage,
          progress.upgrades,
          progress.discoveredRecipes,
          progress.seenMenuStages,
        );
        setCloudReady(true);
      })
      .catch((error) => {
        console.error(error);
        hydrateProgress(0, 1, {}, [], []);
        setCloudReady(true);
      });
  }, [hydrateProgress, profile]);
  useEffect(() => {
    if (!profile || !cloudReady) return;
    const timeout = window.setTimeout(() => {
      void saveProgress(profile.userId, {
        gold: bankGold,
        unlockedStage,
        upgrades,
        discoveredRecipes,
        seenMenuStages,
      }).catch(console.error);
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [bankGold, cloudReady, discoveredRecipes, profile, seenMenuStages, unlockedStage, upgrades]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("button:not(:disabled)")) soundPlayer.playUi();
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  if (window.location.pathname === "/auth/callback") return <AuthCallback />;
  if (!authReady || (profile && !cloudReady))
    return (
      <main className="auth-callback">
        <section>
          <span className="auth-spinner" />
          <h1>COFFEE TOWN</h1>
          <p>{authReady ? "계정 진행도를 불러오고 있습니다" : "로그인 상태를 확인하고 있습니다"}</p>
        </section>
      </main>
    );
  const content =
    screen === "title" ? (
      <Title profile={profile} />
    ) : screen === "result" ? (
      <Result profile={profile} />
    ) : screen === "upgrade" ? (
      <Upgrade profile={profile} />
    ) : (
      <Shift />
    );
  return (
    <>
      {content}
      {screen !== "upgrade" ? <RecipeBook /> : null}
    </>
  );
};
