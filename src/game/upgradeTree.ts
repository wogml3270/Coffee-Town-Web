import type { Upgrades } from "./rules";

export type UpgradeId = keyof Upgrades;
export type UpgradeCategoryId = "equipment" | "barista" | "fever" | "service" | "automation";

export type UpgradeRequirement = Readonly<{ upgradeId: UpgradeId; level: number }>;
export type UpgradeNode = Readonly<{
  id: UpgradeId;
  category: UpgradeCategoryId;
  name: string;
  description: string;
  maxLevel: number;
  costs: readonly number[];
  x: number;
  y: number;
  premium?: boolean;
  requirements: readonly UpgradeRequirement[];
}>;

export const upgradeCategories = [
  { id: "equipment", name: "설비", color: "#9b6945" },
  { id: "barista", name: "바리스타", color: "#527a69" },
  { id: "fever", name: "피버", color: "#b56a45" },
  { id: "service", name: "서비스", color: "#677e9b" },
  { id: "automation", name: "자동화", color: "#aa842e" },
] as const;

const linearCosts = (base: number) => Array.from({ length: 10 }, (_, index) => base * (index + 1));

export const upgradeNodes: readonly UpgradeNode[] = [
  {
    id: "speed",
    category: "equipment",
    name: "설비 정비",
    description: "모든 설비의 제조 시간을 단계마다 12% 단축합니다.",
    maxLevel: 10,
    costs: linearCosts(8000),
    x: 180,
    y: 18,
    requirements: [],
  },
  {
    id: "espressoSpeed",
    category: "equipment",
    name: "에스프레소 튜닝",
    description: "그라인더·에스프레소 머신·스팀·콜드브루 제조 시간을 단계마다 추가 5% 단축합니다.",
    maxLevel: 10,
    costs: linearCosts(18000),
    x: 420,
    y: 18,
    requirements: [{ upgradeId: "speed", level: 2 }],
  },
  {
    id: "coldDrinkSpeed",
    category: "equipment",
    name: "콜드 바 튜닝",
    description: "제빙기·탄산수 머신·블렌더 제조 시간을 단계마다 추가 5% 단축합니다.",
    maxLevel: 10,
    costs: linearCosts(22000),
    x: 660,
    y: 18,
    requirements: [{ upgradeId: "espressoSpeed", level: 3 }],
  },
  {
    id: "movement",
    category: "barista",
    name: "이동 훈련",
    description: "바리스타의 기본 이동속도를 단계마다 10% 높입니다.",
    maxLevel: 10,
    costs: linearCosts(6000),
    x: 180,
    y: 128,
    requirements: [],
  },
  {
    id: "multitask",
    category: "barista",
    name: "멀티태스킹",
    description: "설비 작동 중에도 이동할 수 있어 다음 작업을 미리 준비할 수 있습니다.",
    maxLevel: 1,
    costs: [180000],
    x: 420,
    y: 128,
    requirements: [{ upgradeId: "movement", level: 3 }],
  },
  {
    id: "feverCharge",
    category: "fever",
    name: "피버 충전",
    description: "2단계마다 피버 발동에 필요한 연속 주문 수를 1회 줄입니다.",
    maxLevel: 10,
    costs: linearCosts(12000),
    x: 180,
    y: 238,
    requirements: [],
  },
  {
    id: "feverDuration",
    category: "fever",
    name: "피버 지속",
    description: "피버 지속시간을 단계마다 3초 연장합니다.",
    maxLevel: 10,
    costs: linearCosts(10000),
    x: 420,
    y: 238,
    requirements: [{ upgradeId: "feverCharge", level: 2 }],
  },
  {
    id: "feverProfit",
    category: "fever",
    name: "피버 매출 증폭",
    description: "피버 중 주문 골드 배율을 단계마다 0.35배 추가합니다.",
    maxLevel: 10,
    costs: linearCosts(45000),
    x: 660,
    y: 238,
    requirements: [{ upgradeId: "feverDuration", level: 3 }],
  },
  {
    id: "tips",
    category: "service",
    name: "서비스 교육",
    description: "모든 주문의 팁과 정산 골드를 단계마다 6% 높입니다.",
    maxLevel: 10,
    costs: linearCosts(9000),
    x: 180,
    y: 348,
    requirements: [],
  },
  {
    id: "comboGuard",
    category: "service",
    name: "서비스 회복",
    description: "1레벨은 잘못된 서빙 시 콤보를 1만 잃고, 2레벨은 콤보를 완전히 보호합니다.",
    maxLevel: 5,
    costs: [120000, 650000, 1400000, 2600000, 4500000],
    x: 420,
    y: 348,
    requirements: [{ upgradeId: "tips", level: 3 }],
  },
  {
    id: "automation",
    category: "automation",
    name: "오토 바리스타 모듈",
    description: "획득한 재료가 발견한 유효 레시피를 이루면 즉시 자동 조합합니다.",
    maxLevel: 1,
    costs: [10000000],
    x: 180,
    y: 458,
    premium: true,
    requirements: [
      { upgradeId: "speed", level: 5 },
      { upgradeId: "multitask", level: 1 },
      { upgradeId: "feverDuration", level: 3 },
      { upgradeId: "tips", level: 3 },
    ],
  },
  {
    id: "autoServe",
    category: "automation",
    name: "스마트 픽업 시스템",
    description: "현재 주문과 일치하는 완성 음료가 만들어지는 즉시 자동으로 서빙합니다.",
    maxLevel: 1,
    costs: [50000000],
    x: 420,
    y: 458,
    premium: true,
    requirements: [
      { upgradeId: "automation", level: 1 },
      { upgradeId: "tips", level: 5 },
      { upgradeId: "feverProfit", level: 3 },
    ],
  },
  {
    id: "autoPickup",
    category: "automation",
    name: "설비 자동 회수",
    description: "에스프레소 머신·탄산수 머신·제빙기·콜드브루 타워·그라인더 등의 완료 결과를 자동으로 인벤토리에 넣습니다.",
    maxLevel: 1,
    costs: [24000000],
    x: 660,
    y: 458,
    premium: true,
    requirements: [{ upgradeId: "automation", level: 1 }],
  },
];

export const upgradeNodeById = (id: UpgradeId) => upgradeNodes.find((node) => node.id === id)!;
export const upgradeCost = (id: UpgradeId, level: number) => upgradeNodeById(id).costs[level] ?? 0;
export const maxUpgradeLevel = (id: UpgradeId) => upgradeNodeById(id).maxLevel;
export const unmetUpgradeRequirements = (node: UpgradeNode, levels: Upgrades) =>
  node.requirements.filter(({ upgradeId, level }) => levels[upgradeId] < level);
export const canBuyUpgrade = (node: UpgradeNode, levels: Upgrades, gold: number) => {
  const level = levels[node.id];
  return (
    level < node.maxLevel &&
    unmetUpgradeRequirements(node, levels).length === 0 &&
    gold >= (node.costs[level] ?? Number.POSITIVE_INFINITY)
  );
};
