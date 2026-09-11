import type { ItemId } from "./catalog";

export type ItemArtwork = Readonly<{
  vessel:
    | "bag"
    | "shot"
    | "cup"
    | "pitcher"
    | "carton"
    | "ice"
    | "bottle"
    | "jar"
    | "beans"
    | "glass"
    | "bowl"
    | "blended";
  color: string;
  accent: string;
  garnish?:
    "coffee" | "lemon" | "grapefruit" | "yuzu" | "vanilla" | "chocolate" | "caramel" | "matcha" | "oat";
  ice?: boolean;
  foam?: boolean;
  steam?: boolean;
  layers?: boolean;
}>;

// Every catalog item has an explicit illustration; adding an ItemId requires artwork here.
export const itemArtwork = {
  ground_coffee: { vessel: "bag", color: "#896044", accent: "#bba27c", garnish: "coffee" },
  espresso: { vessel: "shot", color: "#59311f", accent: "#d9a153", garnish: "coffee", steam: true },
  cup: { vessel: "cup", color: "#f9f4e8", accent: "#91b9b0" },
  espresso_cup: { vessel: "cup", color: "#59311f", accent: "#d9a153", garnish: "coffee" },
  hot_water: { vessel: "pitcher", color: "#b6dfeb", accent: "#df9270", steam: true },
  cold_water: { vessel: "pitcher", color: "#a2dced", accent: "#559ac4", ice: true },
  milk: { vessel: "carton", color: "#fff9e9", accent: "#73a4b8" },
  oat_milk: { vessel: "carton", color: "#eeddbc", accent: "#bba06a", garnish: "oat" },
  steamed_milk: { vessel: "pitcher", color: "#fff4de", accent: "#a9bcbc", foam: true, steam: true },
  ice: { vessel: "ice", color: "#b9e5ef", accent: "#69afc6", ice: true },
  iced_cup: { vessel: "glass", color: "#e0f2f3", accent: "#a6d5df", ice: true },
  sparkling_water: { vessel: "bottle", color: "#b4e3d8", accent: "#58a494" },
  lemon_syrup: { vessel: "jar", color: "#f3cb55", accent: "#dfa745", garnish: "lemon" },
  grapefruit_syrup: { vessel: "jar", color: "#ec9581", accent: "#d76561", garnish: "grapefruit" },
  yuzu_syrup: { vessel: "jar", color: "#e9b345", accent: "#aaa149", garnish: "yuzu" },
  vanilla_syrup: { vessel: "bottle", color: "#e3bf7b", accent: "#ab8150", garnish: "vanilla" },
  vanilla_bean: { vessel: "beans", color: "#654432", accent: "#ead7aa", garnish: "vanilla" },
  chocolate_sauce: { vessel: "bottle", color: "#744734", accent: "#b28160", garnish: "chocolate" },
  caramel_sauce: { vessel: "bottle", color: "#cb9142", accent: "#e8be70", garnish: "caramel" },
  matcha_powder: { vessel: "bowl", color: "#88a35b", accent: "#b7c993", garnish: "matcha" },
  cold_brew_concentrate: { vessel: "bottle", color: "#493128", accent: "#a48061", garnish: "coffee" },
  lemon_base: { vessel: "shot", color: "#eed371", accent: "#f5e9a4", garnish: "lemon" },
  grapefruit_base: { vessel: "shot", color: "#e99a8c", accent: "#f9c5a9", garnish: "grapefruit" },
  yuzu_base: { vessel: "shot", color: "#d9ad4e", accent: "#f1d88a", garnish: "yuzu" },
  iced_espresso_base: { vessel: "shot", color: "#654335", accent: "#bc8b58", ice: true },
  iced_milk_base: { vessel: "glass", color: "#fbf1db", accent: "#9ac9cd", ice: true },
  vanilla_espresso: { vessel: "shot", color: "#785339", accent: "#e8c485", garnish: "vanilla", layers: true },
  mocha_base: { vessel: "shot", color: "#704b3f", accent: "#a8795e", garnish: "chocolate", layers: true },
  vanilla_cup: { vessel: "shot", color: "#e5c892", accent: "#fff0c8", garnish: "vanilla" },
  vanilla_milk_cup: { vessel: "cup", color: "#f4e5c5", accent: "#d3b075", garnish: "vanilla", foam: true },
  caramel_base: { vessel: "shot", color: "#c29362", accent: "#edc989", garnish: "caramel", layers: true },
  matcha_cup: { vessel: "shot", color: "#89a462", accent: "#c1d598", garnish: "matcha" },
  chocolate_cup: { vessel: "shot", color: "#8d5b43", accent: "#c49470", garnish: "chocolate" },
  cold_brew_base: { vessel: "shot", color: "#4f3930", accent: "#ac876b", garnish: "coffee" },
  oat_cup: { vessel: "shot", color: "#ddcca9", accent: "#f2e5cc", garnish: "oat" },
  oat_cold_brew_base: { vessel: "glass", color: "#8e6b4e", accent: "#dfcdad", garnish: "oat", layers: true },
  americano: { vessel: "cup", color: "#69432b", accent: "#af8152", garnish: "coffee", steam: true },
  iced_americano: { vessel: "glass", color: "#80513a", accent: "#c99966", garnish: "coffee", ice: true },
  latte: { vessel: "cup", color: "#c39469", accent: "#f7e7c6", foam: true, steam: true },
  iced_latte: { vessel: "glass", color: "#c29670", accent: "#f4e5c8", ice: true, layers: true },
  vanilla_latte: {
    vessel: "cup",
    color: "#d4ae7e",
    accent: "#fff0cb",
    garnish: "vanilla",
    foam: true,
    steam: true,
  },
  mocha: {
    vessel: "cup",
    color: "#916447",
    accent: "#e3bf9d",
    garnish: "chocolate",
    foam: true,
    steam: true,
  },
  caramel_macchiato: {
    vessel: "glass",
    color: "#bb9264",
    accent: "#f4e4bd",
    garnish: "caramel",
    layers: true,
    foam: true,
  },
  lemonade: { vessel: "glass", color: "#f3d569", accent: "#fff0b7", garnish: "lemon", ice: true },
  grapefruitade: { vessel: "glass", color: "#e69585", accent: "#f9cdab", garnish: "grapefruit", ice: true },
  yuzu_tea: { vessel: "cup", color: "#ddb256", accent: "#f5d988", garnish: "yuzu", steam: true },
  matcha_latte: {
    vessel: "cup",
    color: "#91aa71",
    accent: "#e9ecd0",
    garnish: "matcha",
    foam: true,
    steam: true,
  },
  chocolate_latte: {
    vessel: "cup",
    color: "#aa7a59",
    accent: "#eed6b9",
    garnish: "chocolate",
    foam: true,
    steam: true,
  },
  cold_brew: { vessel: "glass", color: "#554035", accent: "#b38b63", ice: true },
  vanilla_oat_cold_brew: {
    vessel: "glass",
    color: "#a68360",
    accent: "#eee0bf",
    garnish: "vanilla",
    ice: true,
    layers: true,
    foam: true,
  },
  mocha_blended: { vessel: "blended", color: "#9c7057", accent: "#e9d0b2", garnish: "coffee" },
  vanilla_blended: { vessel: "blended", color: "#e7d4ab", accent: "#fff3d9", garnish: "vanilla" },
  matcha_blended: { vessel: "blended", color: "#9bae79", accent: "#e4eaca", garnish: "matcha" },
  chocolate_blended: { vessel: "blended", color: "#835640", accent: "#d2af8e", garnish: "chocolate" },
} as const satisfies Readonly<Record<ItemId, ItemArtwork>>;
