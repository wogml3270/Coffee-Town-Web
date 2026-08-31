export type DrinkId = "americano" | "latte" | "lemonade" | "grapefruitade";
export type ItemId = "ground_coffee" | "espresso" | "hot_cup" | "espresso_cup" | "hot_water" | "milk" | "steamed_milk" | "cold_cup" | "ice" | "iced_cup" | "sparkling_water" | "lemon_syrup" | "grapefruit_syrup" | "green_grape_syrup" | "yuzu_syrup" | "lemon_base" | "grapefruit_base" | DrinkId;
export type StationId = "grinder" | "espresso" | "cups" | "coldCups" | "water" | "fridge" | "steam" | "ice" | "sparkling" | "lemon" | "grapefruit" | "serve";
export type InventoryItem = Readonly<{ uid: string; itemId: ItemId }>;
export type Order = Readonly<{ id: number; itemId: DrinkId; name: string; reward: number }>;

export const labels: Readonly<Record<ItemId, string>> = {
  ground_coffee: "분쇄 원두", espresso: "에스프레소", hot_cup: "따뜻한 컵", espresso_cup: "에스프레소 컵",
  hot_water: "뜨거운 물", milk: "우유", steamed_milk: "스팀 밀크", cold_cup: "차가운 컵", ice: "얼음", iced_cup: "얼음 컵",
  sparkling_water: "탄산수", lemon_syrup: "레몬청", grapefruit_syrup: "자몽청", green_grape_syrup: "청포도청", yuzu_syrup: "유자청", lemon_base: "레몬 베이스", grapefruit_base: "자몽 베이스",
  americano: "따뜻한 아메리카노", latte: "카페라떼", lemonade: "레몬에이드", grapefruitade: "자몽에이드",
};
export const stationLabels: Readonly<Record<StationId, string>> = {
  grinder: "그라인더", espresso: "에스프레소 머신", cups: "온음료 컵", coldCups: "아이스 컵", water: "온수기", fridge: "재료 냉장고", steam: "스팀", ice: "제빙기", sparkling: "탄산수 머신", lemon: "레몬청", grapefruit: "자몽청", serve: "픽업 벨",
};
export const fridgeIngredients: ReadonlyArray<Readonly<{ itemId: ItemId; minStage: number }>> = [
  { itemId: "milk", minStage: 1 }, { itemId: "lemon_syrup", minStage: 2 }, { itemId: "grapefruit_syrup", minStage: 3 },
  { itemId: "green_grape_syrup", minStage: 6 }, { itemId: "yuzu_syrup", minStage: 7 },
];
export type StageDefinition = Readonly<{ id: number; name: string; time: number; target: number; rewardMultiplier: number }>;
export const stages: readonly StageDefinition[] = [
  { id: 1, name: "첫 영업", time: 180, target: 3, rewardMultiplier: 1 },
  { id: 2, name: "점심 러시", time: 195, target: 4, rewardMultiplier: 1.15 },
  { id: 3, name: "골든 타임", time: 210, target: 5, rewardMultiplier: 1.3 },
  { id: 4, name: "주말 카페", time: 225, target: 6, rewardMultiplier: 1.5 },
  { id: 5, name: "Coffee Town", time: 240, target: 7, rewardMultiplier: 1.8 },
  { id: 6, name: "브런치 웨이브", time: 255, target: 8, rewardMultiplier: 2 },
  { id: 7, name: "애프터눈 티", time: 270, target: 9, rewardMultiplier: 2.2 },
  { id: 8, name: "야간 영업", time: 285, target: 10, rewardMultiplier: 2.45 },
  { id: 9, name: "로스터리 데이", time: 300, target: 11, rewardMultiplier: 2.7 },
  { id: 10, name: "페스티벌", time: 315, target: 12, rewardMultiplier: 3 },
  { id: 11, name: "마스터 러시", time: 330, target: 13, rewardMultiplier: 3.35 },
  { id: 12, name: "그랜드 오픈", time: 360, target: 15, rewardMultiplier: 3.8 },
];
export const recipes: ReadonlyArray<Readonly<{ inputs: readonly [ItemId, ItemId]; output: ItemId }>> = [
  { inputs: ["espresso", "hot_cup"], output: "espresso_cup" },
  { inputs: ["espresso_cup", "hot_water"], output: "americano" },
  { inputs: ["espresso_cup", "steamed_milk"], output: "latte" },
  { inputs: ["cold_cup", "ice"], output: "iced_cup" },
  { inputs: ["iced_cup", "lemon_syrup"], output: "lemon_base" },
  { inputs: ["lemon_base", "sparkling_water"], output: "lemonade" },
  { inputs: ["iced_cup", "grapefruit_syrup"], output: "grapefruit_base" },
  { inputs: ["grapefruit_base", "sparkling_water"], output: "grapefruitade" },
];
