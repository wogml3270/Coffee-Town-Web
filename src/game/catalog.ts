export const drinkIds = [
  "americano",
  "iced_americano",
  "latte",
  "iced_latte",
  "vanilla_latte",
  "mocha",
  "caramel_macchiato",
  "lemonade",
  "grapefruitade",
  "yuzu_tea",
  "matcha_latte",
  "chocolate_latte",
  "cold_brew",
  "vanilla_oat_cold_brew",
  "mocha_blended",
] as const;
export type DrinkId = (typeof drinkIds)[number];
export type ItemId =
  | "ground_coffee"
  | "espresso"
  | "cup"
  | "espresso_cup"
  | "hot_water"
  | "cold_water"
  | "milk"
  | "oat_milk"
  | "steamed_milk"
  | "ice"
  | "iced_cup"
  | "sparkling_water"
  | "lemon_syrup"
  | "grapefruit_syrup"
  | "yuzu_syrup"
  | "vanilla_syrup"
  | "vanilla_bean"
  | "chocolate_sauce"
  | "caramel_sauce"
  | "matcha_powder"
  | "cold_brew_concentrate"
  | "lemon_base"
  | "grapefruit_base"
  | "yuzu_base"
  | "iced_espresso_base"
  | "iced_milk_base"
  | "vanilla_espresso"
  | "mocha_base"
  | "vanilla_cup"
  | "vanilla_milk_cup"
  | "caramel_base"
  | "matcha_cup"
  | "chocolate_cup"
  | "cold_brew_base"
  | "oat_cup"
  | "oat_cold_brew_base"
  | "blended_base_1"
  | "blended_base_2"
  | "blended_base_3"
  | DrinkId;
export type StationId =
  | "grinder"
  | "espresso"
  | "cups"
  | "water"
  | "coldWater"
  | "fridge"
  | "steam"
  | "ice"
  | "sparkling"
  | "coldBrew"
  | "blender"
  | "serve";
export type InventoryItem = Readonly<{ uid: string; itemId: ItemId }>;
export type Order = Readonly<{ id: number; itemId: DrinkId; name: string; reward: number }>;
export type CombinationRecipe = Readonly<{ inputs: readonly [ItemId, ItemId]; output: ItemId }>;

export const labels: Readonly<Record<ItemId, string>> = {
  ground_coffee: "분쇄 원두",
  espresso: "에스프레소",
  cup: "컵",
  espresso_cup: "에스프레소 컵",
  hot_water: "뜨거운 물",
  cold_water: "차가운 물",
  milk: "우유",
  oat_milk: "오트밀크",
  steamed_milk: "스팀 밀크",
  ice: "얼음",
  iced_cup: "얼음 컵",
  sparkling_water: "탄산수",
  lemon_syrup: "레몬청",
  grapefruit_syrup: "자몽청",
  yuzu_syrup: "유자청",
  vanilla_syrup: "바닐라 시럽",
  vanilla_bean: "바닐라빈",
  chocolate_sauce: "초콜릿 소스",
  caramel_sauce: "카라멜 소스",
  matcha_powder: "말차 파우더",
  cold_brew_concentrate: "콜드브루 원액",
  lemon_base: "레몬 베이스",
  grapefruit_base: "자몽 베이스",
  yuzu_base: "유자 베이스",
  iced_espresso_base: "아이스 에스프레소",
  iced_milk_base: "아이스 밀크",
  vanilla_espresso: "바닐라 에스프레소",
  mocha_base: "모카 베이스",
  vanilla_cup: "바닐라 컵",
  vanilla_milk_cup: "바닐라 밀크",
  caramel_base: "마키아토 베이스",
  matcha_cup: "말차 베이스",
  chocolate_cup: "초콜릿 베이스",
  cold_brew_base: "콜드브루 베이스",
  oat_cup: "오트 베이스",
  oat_cold_brew_base: "오트 콜드브루",
  blended_base_1: "블렌디드 밀크",
  blended_base_2: "블렌디드 커피",
  blended_base_3: "블렌더 투입물",
  americano: "아메리카노",
  iced_americano: "아이스 아메리카노",
  latte: "카페라떼",
  iced_latte: "아이스 카페라떼",
  vanilla_latte: "바닐라 라떼",
  mocha: "카페모카",
  caramel_macchiato: "카라멜 마키아토",
  lemonade: "레몬에이드",
  grapefruitade: "자몽에이드",
  yuzu_tea: "유자차",
  matcha_latte: "말차라떼",
  chocolate_latte: "초콜릿 라떼",
  cold_brew: "콜드브루",
  vanilla_oat_cold_brew: "바닐라빈 오트 콜드브루",
  mocha_blended: "카페모카 아이스 블렌디드",
};
export const stationLabels: Readonly<Record<StationId, string>> = {
  grinder: "그라인더",
  espresso: "에스프레소 머신",
  cups: "컵 선반",
  water: "정수기",
  coldWater: "냉수기",
  fridge: "재료 냉장고",
  steam: "스팀",
  ice: "제빙기",
  sparkling: "탄산수 머신",
  coldBrew: "콜드브루 타워",
  blender: "블렌더",
  serve: "픽업 벨",
};
export const fridgeIngredients: ReadonlyArray<Readonly<{ itemId: ItemId; minStage: number }>> = [
  { itemId: "milk", minStage: 1 },
  { itemId: "oat_milk", minStage: 11 },
  { itemId: "vanilla_syrup", minStage: 2 },
  { itemId: "chocolate_sauce", minStage: 3 },
  { itemId: "caramel_sauce", minStage: 4 },
  { itemId: "lemon_syrup", minStage: 5 },
  { itemId: "grapefruit_syrup", minStage: 6 },
  { itemId: "yuzu_syrup", minStage: 7 },
  { itemId: "matcha_powder", minStage: 8 },
  { itemId: "vanilla_bean", minStage: 11 },
];

export type MenuDefinition = Readonly<{
  id: DrinkId;
  name: string;
  stage: number;
  reward: number;
  recipe: string;
}>;
export const menuCatalog: readonly MenuDefinition[] = [
  { id: "americano", name: "아메리카노", stage: 1, reward: 4000, recipe: "컵 + 에스프레소 + 온수" },
  {
    id: "iced_americano",
    name: "아이스 아메리카노",
    stage: 1,
    reward: 4300,
    recipe: "컵 + 얼음 + 에스프레소 + 냉수",
  },
  { id: "latte", name: "카페라떼", stage: 1, reward: 4500, recipe: "컵 + 에스프레소 + 스팀 밀크" },
  {
    id: "iced_latte",
    name: "아이스 카페라떼",
    stage: 1,
    reward: 4800,
    recipe: "컵 + 얼음 + 우유 + 에스프레소",
  },
  {
    id: "vanilla_latte",
    name: "바닐라 라떼",
    stage: 2,
    reward: 5000,
    recipe: "컵 + 에스프레소 + 바닐라 시럽 + 스팀 밀크",
  },
  {
    id: "mocha",
    name: "카페모카",
    stage: 3,
    reward: 5200,
    recipe: "컵 + 에스프레소 + 초콜릿 소스 + 스팀 밀크",
  },
  {
    id: "caramel_macchiato",
    name: "카라멜 마키아토",
    stage: 4,
    reward: 5200,
    recipe: "컵 + 바닐라 시럽 + 스팀 밀크 + 에스프레소 + 카라멜",
  },
  { id: "lemonade", name: "레몬에이드", stage: 5, reward: 5000, recipe: "컵 + 얼음 + 레몬청 + 탄산수" },
  {
    id: "grapefruitade",
    name: "자몽에이드",
    stage: 6,
    reward: 5500,
    recipe: "컵 + 얼음 + 자몽청 + 탄산수",
  },
  { id: "yuzu_tea", name: "유자차", stage: 7, reward: 4800, recipe: "컵 + 유자청 + 온수" },
  { id: "matcha_latte", name: "말차라떼", stage: 8, reward: 5200, recipe: "컵 + 말차 + 스팀 밀크" },
  {
    id: "chocolate_latte",
    name: "초콜릿 라떼",
    stage: 9,
    reward: 5200,
    recipe: "컵 + 초콜릿 소스 + 스팀 밀크",
  },
  {
    id: "cold_brew",
    name: "콜드브루",
    stage: 10,
    reward: 4800,
    recipe: "컵 + 얼음 + 콜드브루 원액 + 냉수",
  },
  {
    id: "vanilla_oat_cold_brew",
    name: "바닐라빈 오트 콜드브루",
    stage: 11,
    reward: 6000,
    recipe: "얼음 컵 + 오트밀크 + 콜드브루 + 바닐라빈",
  },
  {
    id: "mocha_blended",
    name: "카페모카 아이스 블렌디드",
    stage: 12,
    reward: 6500,
    recipe: "얼음 컵 + 우유 + 에스프레소 + 초콜릿을 블렌딩",
  },
];
export type StageDefinition = Readonly<{
  id: number;
  name: string;
  rewardMultiplier: number;
  unlock: DrinkId;
}>;
export const stages: readonly StageDefinition[] = Array.from(
  { length: Math.max(...menuCatalog.map(({ stage }) => stage)) },
  (_, index) => {
    const id = index + 1;
    return {
      id,
      name: id === 1 ? "첫 영업" : `${id}일차`,
      rewardMultiplier: 1 + index * 0.12,
      unlock: (menuCatalog.find(({ stage }) => stage === id) ?? menuCatalog[0]!).id,
    };
  },
);

export const recipes: readonly CombinationRecipe[] = [
  { inputs: ["espresso", "cup"], output: "espresso_cup" },
  { inputs: ["espresso_cup", "hot_water"], output: "americano" },
  { inputs: ["iced_cup", "espresso"], output: "iced_espresso_base" },
  { inputs: ["iced_espresso_base", "cold_water"], output: "iced_americano" },
  { inputs: ["espresso_cup", "steamed_milk"], output: "latte" },
  { inputs: ["iced_cup", "milk"], output: "iced_milk_base" },
  { inputs: ["iced_milk_base", "espresso"], output: "iced_latte" },
  { inputs: ["espresso_cup", "vanilla_syrup"], output: "vanilla_espresso" },
  { inputs: ["vanilla_espresso", "steamed_milk"], output: "vanilla_latte" },
  { inputs: ["espresso_cup", "chocolate_sauce"], output: "mocha_base" },
  { inputs: ["mocha_base", "steamed_milk"], output: "mocha" },
  { inputs: ["cup", "vanilla_syrup"], output: "vanilla_cup" },
  { inputs: ["vanilla_cup", "steamed_milk"], output: "vanilla_milk_cup" },
  { inputs: ["vanilla_milk_cup", "espresso"], output: "caramel_base" },
  { inputs: ["caramel_base", "caramel_sauce"], output: "caramel_macchiato" },
  { inputs: ["cup", "ice"], output: "iced_cup" },
  { inputs: ["iced_cup", "lemon_syrup"], output: "lemon_base" },
  { inputs: ["lemon_base", "sparkling_water"], output: "lemonade" },
  { inputs: ["iced_cup", "grapefruit_syrup"], output: "grapefruit_base" },
  { inputs: ["grapefruit_base", "sparkling_water"], output: "grapefruitade" },
  { inputs: ["cup", "yuzu_syrup"], output: "yuzu_base" },
  { inputs: ["yuzu_base", "hot_water"], output: "yuzu_tea" },
  { inputs: ["cup", "matcha_powder"], output: "matcha_cup" },
  { inputs: ["matcha_cup", "steamed_milk"], output: "matcha_latte" },
  { inputs: ["cup", "chocolate_sauce"], output: "chocolate_cup" },
  { inputs: ["chocolate_cup", "steamed_milk"], output: "chocolate_latte" },
  { inputs: ["iced_cup", "cold_brew_concentrate"], output: "cold_brew_base" },
  { inputs: ["cold_brew_base", "cold_water"], output: "cold_brew" },
  { inputs: ["iced_cup", "oat_milk"], output: "oat_cup" },
  { inputs: ["oat_cup", "cold_brew_concentrate"], output: "oat_cold_brew_base" },
  { inputs: ["oat_cold_brew_base", "vanilla_bean"], output: "vanilla_oat_cold_brew" },
  { inputs: ["iced_latte", "chocolate_sauce"], output: "blended_base_3" },
];
