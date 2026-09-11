import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { soundPlayer } from "../audio/soundPlayer";
import { useGame } from "../game/store";
import {
  canBuyUpgrade,
  unmetUpgradeRequirements,
  upgradeCategories,
  upgradeNodeById,
  upgradeNodes,
  type UpgradeId,
} from "../game/upgradeTree";
import { loadUpgradeCatalog } from "../services/upgradeService";

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
    autoPickup: (
      <>
        <path d="M5 7h22v18H5zM9 11h14M9 16h8" />
        <path d="m12 29 4-4 4 4M16 25v-9" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      {paths[id]}
    </svg>
  );
};

export const Upgrade = () => {
  const bankGold = useGame(({ bankGold }) => bankGold);
  const upgrades = useGame(({ upgrades }) => upgrades);
  const purchaseItem = useGame(({ purchase }) => purchase);
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
      await purchaseItem(selectedId);
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
            <h1>카페 업그레이드</h1>
          </div>
          <strong className="bank">{bankGold.toLocaleString()} G</strong>
          <div className="upgrade-actions">
            <button className="secondary" type="button" onClick={exit}>
              홈으로
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
