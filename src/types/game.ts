export type ItemId = string;

export type Position = Readonly<{
  x: number;
  y: number;
}>;

export type GridCell = Readonly<{
  x: number;
  y: number;
  itemId: ItemId | null;
}>;

export type GameGrid = ReadonlyArray<ReadonlyArray<GridCell>>;

export type GameState = Readonly<{
  phase: "start" | "playing" | "ended";
  remainingTimeSec: number;
  gold: number;
  xp: number;
  level: number;
  grid: GameGrid;
  orders: ReadonlyArray<Order>;
  preparation: DrinkPreparation | null;
}>;

export type Order = Readonly<{
  id: string;
  customerName: string;
  itemId: ItemId;
  reward: number;
  rewardXp: number;
}>;

export type BaristaActionId =
  | "coffee_beans" | "grind" | "extract" | "hot_water" | "cold_water"
  | "ice" | "milk" | "steam" | "grapefruit_syrup" | "sparkling_water"
  | "cold_brew" | "vanilla_bean_sauce" | "oat_milk";

export type BaristaRecipe = Readonly<{
  itemId: ItemId;
  name: string;
  steps: readonly BaristaActionId[];
  unlockLevel: number;
}>;

export type DrinkPreparation = Readonly<{
  orderId: string;
  itemId: ItemId;
  completedSteps: readonly BaristaActionId[];
}>;

export type RecipeType = "SAME_MERGE" | "RECIPE_COMBINE";

export type Recipe = Readonly<{
  inputs: readonly [ItemId, ItemId];
  result: ItemId;
  type: RecipeType;
}>;

export type IngredientCategory = "COFFEE" | "WATER" | "DAIRY" | "ALT_MILK" | "SYRUP" | "POWDER" | "FRUIT" | "TEA" | "TOPPING" | "CONTAINER" | "DRINK";
export type IngredientState = "RAW" | "GROUND" | "LIQUID" | "FROZEN" | "STEAMED" | "FOAMED" | "EXTRACT" | "FINISHED";
export type Temperature = "AMBIENT" | "COLD" | "HOT";
export type ProcessType = "GRIND" | "BREW_ESPRESSO" | "BREW_COLD" | "HEAT" | "CHILL" | "STEAM" | "FOAM" | "BLEND" | "SHAKE" | "MIX" | "TOP" | "DISPENSE";
export type StationId = string;

export type IngredientDefinition = Readonly<{
  id: ItemId;
  name: string;
  category: IngredientCategory;
  state: IngredientState;
  temperature: Temperature;
  unlockLevel: number;
}>;

export type StationDefinition = Readonly<{
  id: StationId;
  name: string;
  processType: ProcessType;
  baseDurationSec: number;
  unlockLevel: number;
}>;

export type ManufacturingStep = Readonly<{
  order: number;
  stationId: StationId;
  process: ProcessType;
  inputs: ReadonlyArray<Readonly<{ itemId: ItemId; quantity: number }>>;
  outputItemId: ItemId;
  durationSec: number;
}>;

export type ManufacturingRecipe = Readonly<{
  id: string;
  name: string;
  outputItemId: ItemId;
  unlockLevel: number;
  rewardGold: number;
  rewardXp: number;
  steps: readonly ManufacturingStep[];
}>;

export type InventoryStack = Readonly<{ itemId: ItemId; quantity: number }>;
