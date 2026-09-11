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
  "vanilla_blended",
  "matcha_blended",
  "chocolate_blended",
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
export const stationUnlockStage: Readonly<Record<StationId, number>> = {
  grinder: 1,
  espresso: 1,
  cups: 1,
  water: 1,
  coldWater: 1,
  fridge: 1,
  steam: 1,
  ice: 1,
  sparkling: 5,
  // The tower is available from the first stage; the finished cold-brew
  // drinks remain locked until their menu stages.
  coldBrew: 1,
  blender: 12,
  serve: 1,
};
export type StationProcess = Readonly<{
  station: StationId;
  output: ItemId;
  seconds: number;
  input?: ItemId;
  additionalInputs?: readonly ItemId[];
  instant?: boolean;
}>;
export const stationProcesses: readonly StationProcess[] = [
  { station: "grinder", output: "ground_coffee", seconds: 4 },
  { station: "cups", output: "cup", seconds: 0, instant: true },
  { station: "water", output: "hot_water", seconds: 3 },
  { station: "coldWater", output: "cold_water", seconds: 2 },
  { station: "ice", output: "ice", seconds: 4 },
  { station: "sparkling", output: "sparkling_water", seconds: 3 },
  { station: "coldBrew", output: "cold_brew_concentrate", seconds: 5 },
  { station: "espresso", input: "ground_coffee", output: "espresso", seconds: 7 },
  { station: "steam", input: "milk", output: "steamed_milk", seconds: 6 },
  {
    station: "blender",
    input: "mocha_base",
    additionalInputs: ["milk", "ice"],
    output: "mocha_blended",
    seconds: 7,
  },
  {
    station: "blender",
    input: "vanilla_cup",
    additionalInputs: ["milk", "ice"],
    output: "vanilla_blended",
    seconds: 7,
  },
  {
    station: "blender",
    input: "matcha_cup",
    additionalInputs: ["milk", "ice"],
    output: "matcha_blended",
    seconds: 8,
  },
  {
    station: "blender",
    input: "chocolate_cup",
    additionalInputs: ["milk", "ice"],
    output: "chocolate_blended",
    seconds: 8,
  },
];
export type InventoryItem = Readonly<{ uid: string; itemId: ItemId }>;
export type Order = Readonly<{ id: number; itemId: DrinkId; name: string; reward: number }>;
export type CombinationRecipe = Readonly<{ inputs: readonly [ItemId, ItemId]; output: ItemId }>;

export const labels: Readonly<Record<ItemId, string>> = {
  ground_coffee: "분쇄 원두",
  espresso: "에스프레소",
  cup: "컵",
  espresso_cup: "에스프레소 컵",
  hot_water: "온수",
  cold_water: "냉수",
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
  vanilla_cup: "바닐라 베이스",
  vanilla_milk_cup: "바닐라 밀크",
  caramel_base: "마키아토 베이스",
  matcha_cup: "말차 베이스",
  chocolate_cup: "초콜릿 베이스",
  cold_brew_base: "콜드브루 베이스",
  oat_cup: "오트 베이스",
  oat_cold_brew_base: "오트 콜드브루",
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
  vanilla_blended: "바닐라 아이스 블렌디드",
  matcha_blended: "말차 아이스 블렌디드",
  chocolate_blended: "초콜릿 아이스 블렌디드",
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
    recipe: "모카 베이스 + 우유 + 얼음 → 블렌더로 블렌딩",
  },
  {
    id: "vanilla_blended",
    name: "바닐라 아이스 블렌디드",
    stage: 13,
    reward: 6500,
    recipe: "바닐라 베이스 + 우유 + 얼음 → 블렌더로 블렌딩",
  },
  {
    id: "matcha_blended",
    name: "말차 아이스 블렌디드",
    stage: 14,
    reward: 6800,
    recipe: "말차 베이스 + 우유 + 얼음 → 블렌더로 블렌딩",
  },
  {
    id: "chocolate_blended",
    name: "초콜릿 아이스 블렌디드",
    stage: 15,
    reward: 6800,
    recipe: "초콜릿 베이스 + 우유 + 얼음 → 블렌더로 블렌딩",
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

// 조합을 수정할 때는 이 그룹만 편집하면 됩니다.
// 같은 input 조합이 DB에도 있으면 이 코드의 결과가 우선 적용됩니다.
export const recipeGroups = {
  cupBases: [
    { inputs: ["espresso", "cup"], output: "espresso_cup" },
    { inputs: ["cup", "ice"], output: "iced_cup" },
    { inputs: ["iced_cup", "milk"], output: "iced_milk_base" },
  ],
  coffee: [
    { inputs: ["espresso_cup", "hot_water"], output: "americano" },
    { inputs: ["espresso_cup", "ice"], output: "iced_espresso_base" },
    { inputs: ["iced_cup", "espresso"], output: "iced_espresso_base" },
    { inputs: ["iced_espresso_base", "cold_water"], output: "iced_americano" },
    { inputs: ["iced_espresso_base", "milk"], output: "iced_latte" },
    { inputs: ["iced_milk_base", "espresso"], output: "iced_latte" },
    { inputs: ["espresso_cup", "steamed_milk"], output: "latte" },
  ],
  flavoredCoffee: [
    { inputs: ["espresso_cup", "vanilla_syrup"], output: "vanilla_espresso" },
    { inputs: ["vanilla_espresso", "steamed_milk"], output: "vanilla_latte" },
    { inputs: ["espresso_cup", "chocolate_sauce"], output: "mocha_base" },
    { inputs: ["mocha_base", "steamed_milk"], output: "mocha" },
    { inputs: ["cup", "vanilla_syrup"], output: "vanilla_cup" },
    { inputs: ["vanilla_cup", "steamed_milk"], output: "vanilla_milk_cup" },
    { inputs: ["vanilla_milk_cup", "espresso"], output: "caramel_base" },
    { inputs: ["caramel_base", "caramel_sauce"], output: "caramel_macchiato" },
  ],
  nonCoffee: [
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
  ],
  coldBrew: [
    { inputs: ["iced_cup", "cold_brew_concentrate"], output: "cold_brew_base" },
    { inputs: ["cold_brew_base", "cold_water"], output: "cold_brew" },
    { inputs: ["iced_cup", "oat_milk"], output: "oat_cup" },
    { inputs: ["oat_cup", "cold_brew_concentrate"], output: "oat_cold_brew_base" },
    { inputs: ["oat_cold_brew_base", "vanilla_bean"], output: "vanilla_oat_cold_brew" },
  ],
} as const satisfies Readonly<Record<string, readonly CombinationRecipe[]>>;

export const recipes: readonly CombinationRecipe[] = Object.values(recipeGroups).flat();

export type RecipeArchiveEntry = Readonly<{
  id: ItemId;
  name: string;
  stage: number;
  recipe: string;
  price?: number;
  category: "source" | "intermediate" | "final";
  temperature: RecipeTemperature;
  tier: RecipeTier;
}>;
export type RecipeTemperature = "hot" | "iced" | "neutral";

const hotRecipeIds = new Set<ItemId>([
  "hot_water",
  "espresso",
  "steamed_milk",
  "espresso_cup",
  "americano",
  "latte",
  "vanilla_latte",
  "mocha",
  "caramel_macchiato",
  "yuzu_tea",
  "matcha_latte",
  "chocolate_latte",
]);
const icedRecipeIds = new Set<ItemId>([
  "cold_water",
  "ice",
  "cold_brew_concentrate",
  "iced_cup",
  "iced_milk_base",
  "iced_espresso_base",
  "cold_brew_base",
  "oat_cold_brew_base",
  "iced_americano",
  "iced_latte",
  "lemonade",
  "grapefruitade",
  "cold_brew",
  "vanilla_oat_cold_brew",
]);
export const recipeTemperatureOf = (itemId: ItemId): RecipeTemperature => {
  if (hotRecipeIds.has(itemId)) return "hot";
  if (icedRecipeIds.has(itemId)) return "iced";
  return "neutral";
};

export type RecipeTier = 1 | 2 | 3 | 4 | 5;
export const recipeTierMeta = {
  1: { name: "기본 재료", color: "#668a62" },
  2: { name: "1차 가공", color: "#4f8d9b" },
  3: { name: "중간 베이스", color: "#9a6fb0" },
  4: { name: "일반 완성 음료", color: "#c77b45" },
  5: { name: "시그니처·블렌디드", color: "#c09a35" },
} as const satisfies Readonly<Record<RecipeTier, Readonly<{ name: string; color: string }>>>;

export const recipeTierGroups = {
  1: [
    "ground_coffee",
    "cup",
    "hot_water",
    "cold_water",
    "milk",
    "oat_milk",
    "ice",
    "sparkling_water",
    "lemon_syrup",
    "grapefruit_syrup",
    "yuzu_syrup",
    "vanilla_syrup",
    "vanilla_bean",
    "chocolate_sauce",
    "caramel_sauce",
    "matcha_powder",
    "cold_brew_concentrate",
  ],
  2: [
    "espresso",
    "steamed_milk",
    "iced_cup",
    "vanilla_cup",
    "matcha_cup",
    "chocolate_cup",
    "yuzu_base",
    "oat_cup",
  ],
  3: [
    "espresso_cup",
    "iced_milk_base",
    "iced_espresso_base",
    "vanilla_espresso",
    "mocha_base",
    "vanilla_milk_cup",
    "caramel_base",
    "lemon_base",
    "grapefruit_base",
    "cold_brew_base",
    "oat_cold_brew_base",
  ],
  4: [
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
  ],
  5: ["vanilla_oat_cold_brew", "mocha_blended", "vanilla_blended", "matcha_blended", "chocolate_blended"],
} as const satisfies Readonly<Record<RecipeTier, readonly ItemId[]>>;

export const recipeTierOf = (itemId: ItemId): RecipeTier => {
  const entry = (Object.entries(recipeTierGroups) as [string, readonly ItemId[]][]).find(([, ids]) =>
    ids.includes(itemId),
  );
  return entry ? (Number(entry[0]) as RecipeTier) : 1;
};
const recipeStages: Partial<Record<ItemId, number>> = {
  vanilla_syrup: 2,
  vanilla_espresso: 2,
  chocolate_sauce: 3,
  mocha_base: 3,
  caramel_sauce: 4,
  vanilla_cup: 4,
  vanilla_milk_cup: 4,
  caramel_base: 4,
  sparkling_water: 5,
  lemon_syrup: 5,
  lemon_base: 5,
  grapefruit_syrup: 6,
  grapefruit_base: 6,
  yuzu_syrup: 7,
  yuzu_base: 7,
  matcha_powder: 8,
  matcha_cup: 8,
  chocolate_cup: 9,
  cold_brew_concentrate: 1,
  cold_brew_base: 10,
  oat_milk: 11,
  vanilla_bean: 11,
  oat_cup: 11,
  oat_cold_brew_base: 11,
};
const sourceRecipes = [
  {
    id: "ground_coffee",
    name: labels.ground_coffee,
    stage: 1,
    recipe: "그라인더에서 원두 분쇄",
    category: "source",
  },
  {
    id: "espresso",
    name: labels.espresso,
    stage: 1,
    recipe: "분쇄 원두를 에스프레소 머신으로 추출",
    category: "source",
  },
  { id: "cup", name: labels.cup, stage: 1, recipe: "컵 선반에서 컵 꺼내기", category: "source" },
  { id: "hot_water", name: labels.hot_water, stage: 1, recipe: "정수기에서 온수 선택", category: "source" },
  { id: "cold_water", name: labels.cold_water, stage: 1, recipe: "정수기에서 냉수 선택", category: "source" },
  { id: "milk", name: labels.milk, stage: 1, recipe: "재료 냉장고에서 우유 꺼내기" },
  { id: "steamed_milk", name: labels.steamed_milk, stage: 1, recipe: "우유를 스팀 완드로 데우기" },
  { id: "ice", name: labels.ice, stage: 1, recipe: "제빙기에서 얼음 받기" },
  { id: "vanilla_syrup", name: labels.vanilla_syrup, stage: 2, recipe: "재료 냉장고에서 꺼내기" },
  { id: "chocolate_sauce", name: labels.chocolate_sauce, stage: 3, recipe: "재료 냉장고에서 꺼내기" },
  { id: "caramel_sauce", name: labels.caramel_sauce, stage: 4, recipe: "재료 냉장고에서 꺼내기" },
  { id: "sparkling_water", name: labels.sparkling_water, stage: 5, recipe: "탄산수 머신에서 받기" },
  { id: "lemon_syrup", name: labels.lemon_syrup, stage: 5, recipe: "재료 냉장고에서 꺼내기" },
  { id: "grapefruit_syrup", name: labels.grapefruit_syrup, stage: 6, recipe: "재료 냉장고에서 꺼내기" },
  { id: "yuzu_syrup", name: labels.yuzu_syrup, stage: 7, recipe: "재료 냉장고에서 꺼내기" },
  { id: "matcha_powder", name: labels.matcha_powder, stage: 8, recipe: "재료 냉장고에서 꺼내기" },
  {
    id: "cold_brew_concentrate",
    name: labels.cold_brew_concentrate,
    stage: 1,
    recipe: "콜드브루 타워에서 추출",
  },
  { id: "oat_milk", name: labels.oat_milk, stage: 11, recipe: "재료 냉장고에서 꺼내기" },
  { id: "vanilla_bean", name: labels.vanilla_bean, stage: 11, recipe: "재료 냉장고에서 꺼내기" },
] as const satisfies readonly Readonly<{
  id: ItemId;
  name: string;
  stage: number;
  recipe: string;
  category?: "source";
}>[];
export const recipeArchive: readonly RecipeArchiveEntry[] = [
  ...sourceRecipes.map((entry) => ({
    ...entry,
    category: "source" as const,
    temperature: recipeTemperatureOf(entry.id),
    tier: recipeTierOf(entry.id),
  })),
  ...[...new Set(recipes.map(({ output }) => output))].map((output) => {
    const alternatives = recipes
      .filter((recipe) => recipe.output === output)
      .map(({ inputs }) => `${labels[inputs[0]]} + ${labels[inputs[1]]}`);
    return {
      id: output,
      name: labels[output],
      stage: recipeStages[output] ?? menuCatalog.find(({ id }) => id === output)?.stage ?? 1,
      recipe:
        alternatives.length > 1 ? alternatives.map((recipe) => `- ${recipe}`).join("\n") : alternatives[0]!,
      price: menuCatalog.find(({ id }) => id === output)?.reward,
      category: drinkIds.includes(output as DrinkId) ? ("final" as const) : ("intermediate" as const),
      temperature: recipeTemperatureOf(output),
      tier: recipeTierOf(output),
    };
  }),
  ...menuCatalog
    .filter(({ id }) => !recipes.some(({ output }) => output === id))
    .map(({ id, name, stage, reward, recipe }) => ({
      id,
      name,
      stage,
      recipe,
      price: reward,
      category: "final" as const,
      temperature: recipeTemperatureOf(id),
      tier: recipeTierOf(id),
    })),
];
