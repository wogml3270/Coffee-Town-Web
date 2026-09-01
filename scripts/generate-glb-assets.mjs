import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const FileReaderPolyfill = function () {
  this.result = null;
  this.onloadend = null;
};
FileReaderPolyfill.prototype.readAsArrayBuffer = function (blob) {
  void blob.arrayBuffer().then((buffer) => {
    this.result = buffer;
    this.onloadend?.();
  });
};
FileReaderPolyfill.prototype.readAsDataURL = function (blob) {
  void blob.arrayBuffer().then((buffer) => {
    this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
    this.onloadend?.();
  });
};
globalThis.FileReader = FileReaderPolyfill;

const outputDirectory = path.resolve("public/assets/models");
const material = (color, metalness = 0.05, roughness = 0.55) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const box = (group, size, position, color, name, metalness = 0.05) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, metalness));
  mesh.position.set(...position);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
};
const cylinder = (group, args, position, color, name, rotation = [0, 0, 0], metalness = 0.05) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...args), material(color, metalness));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.name = name;
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
};
const groupNamed = (name) => {
  const group = new THREE.Group();
  group.name = name;
  return group;
};

const grinder = () => {
  const g = groupNamed("Grinder");
  box(g, [1, 1.12, 0.82], [0, 0.58, 0], "#202b28", "PowderCoatedBody", 0.42);
  box(g, [0.74, 0.18, 0.08], [0, 0.95, 0.44], "#111917", "DigitalPanel", 0.3);
  [0.18, 0.38, 0.58].forEach((x, index) =>
    cylinder(
      g,
      [0.045, 0.045, 0.035, 12],
      [x - 0.38, 0.95, 0.5],
      index === 2 ? "#72df91" : "#d8ad62",
      "PanelButton",
      [Math.PI / 2, 0, 0],
      0.4,
    ),
  );
  const hopper = cylinder(g, [0.38, 0.29, 0.7, 24], [0, 1.48, 0], "#8bb0a8", "GlassHopper");
  hopper.material.transparent = true;
  hopper.material.opacity = 0.32;
  hopper.material.depthWrite = false;
  [-0.2, -0.06, 0.08, 0.21].forEach((x, index) =>
    cylinder(
      g,
      [0.065, 0.05, 0.15, 10],
      [x, 1.34 + (index % 2) * 0.1, 0.02],
      "#6b341d",
      "CoffeeBean",
      [0, 0, 0.45],
    ),
  );
  cylinder(g, [0.25, 0.25, 0.08, 20], [0, 0.55, 0.43], "#d0a856", "GrindDial", [Math.PI / 2, 0, 0], 0.55);
  cylinder(g, [0.08, 0.08, 0.22, 12], [0, 0.18, 0.38], "#b5b8b2", "GroundChute", [Math.PI / 2, 0, 0], 0.55);
  box(g, [0.64, 0.12, 0.74], [0, 0.08, 0.07], "#35251d", "GroundTray", 0.3);
  return g;
};
const espresso = () => {
  const g = groupNamed("EspressoMachine");
  box(g, [2.25, 1.28, 1], [0, 0.73, 0], "#667178", "BrushedSteelBody", 0.78);
  box(g, [2.02, 0.13, 0.84], [0, 0.08, 0.08], "#252827", "DripTray", 0.62);
  for (let x = -0.82; x <= 0.82; x += 0.2)
    box(g, [0.09, 0.025, 0.68], [x, 0.16, 0.12], "#aeb4b2", "TrayRail", 0.65);
  [-0.62, 0.62].forEach((x) => {
    cylinder(g, [0.14, 0.14, 0.3, 18], [x, 0.42, 0.48], "#393a37", "GroupHead", [Math.PI / 2, 0, 0], 0.65);
    box(g, [0.72, 0.09, 0.09], [x + 0.34, 0.25, 0.52], "#37251e", "Portafilter", 0.3);
  });
  box(g, [1.65, 0.28, 0.1], [0, 1.02, 0.52], "#161c1b", "ControlPanel", 0.4);
  [-0.62, -0.2, 0.2, 0.62].forEach((x, index) =>
    cylinder(
      g,
      [0.065, 0.065, 0.035, 16],
      [x, 1.02, 0.59],
      index % 2 ? "#d6a855" : "#73c58c",
      "BrewButton",
      [Math.PI / 2, 0, 0],
      0.55,
    ),
  );
  cylinder(g, [0.2, 0.2, 0.05, 24], [0, 0.77, 0.54], "#eee4cc", "PressureGauge", [Math.PI / 2, 0, 0], 0.25);
  cylinder(
    g,
    [0.045, 0.045, 0.82, 12],
    [1.04, 0.32, 0.25],
    "#c4c8c4",
    "IntegratedSteamWand",
    [0, 0, 0.28],
    0.82,
  );
  cylinder(g, [0.08, 0.08, 0.12, 16], [1.24, 0.85, 0.36], "#d0a657", "SteamKnob", [Math.PI / 2, 0, 0], 0.55);
  [-0.72, -0.24, 0.24, 0.72].forEach((x) =>
    cylinder(g, [0.14, 0.12, 0.24, 18], [x, 1.5, 0], "#eee3cc", "WarmingCup"),
  );
  box(g, [2.08, 0.07, 0.82], [0, 1.36, 0], "#b8bcb8", "CupWarmer", 0.7);
  return g;
};
const cupShelf = () => {
  const g = groupNamed("CupShelf");
  box(g, [1.5, 0.12, 0.82], [0, 0.08, 0], "#4b3022", "ShelfBase", 0.12);
  box(g, [0.1, 1.25, 0.78], [-0.7, 0.68, 0], "#70482f", "LeftFrame");
  box(g, [0.1, 1.25, 0.78], [0.7, 0.68, 0], "#70482f", "RightFrame");
  [0.28, 0.7, 1.12].forEach((y) => box(g, [1.38, 0.07, 0.72], [0, y, 0], "#5a3827", "ShelfBoard"));
  [-0.46, -0.15, 0.16, 0.47].forEach((x) => {
    cylinder(g, [0.16, 0.13, 0.34, 20], [x, 0.48, 0.02], "#f2e7d1", "PorcelainCup");
    cylinder(g, [0.18, 0.15, 0.28, 20], [x, 0.9, 0.02], "#e8d9bf", "StackedCup");
  });
  box(g, [0.7, 0.13, 0.08], [0, 1.42, 0.38], "#c99a58", "BrassLabel", 0.45);
  return g;
};
const coldCupShelf = () => {
  const g = groupNamed("ColdCupShelf");
  box(g, [1.25, 0.16, 0.72], [0, 0.08, 0], "#384b47", "Base", 0.2);
  [-0.36, 0, 0.36].forEach((x) => {
    for (let y = 0.28; y < 1.25; y += 0.22)
      cylinder(g, [0.17, 0.14, 0.2, 20], [x, y, 0], "#b9dce1", "ClearCup");
  });
  box(g, [1.1, 0.08, 0.64], [0, 1.35, 0], "#c4a36a", "TopRail", 0.4);
  return g;
};
const dispenser = () => {
  const g = groupNamed("HotWaterDispenser");
  cylinder(g, [0.42, 0.46, 1.35, 28], [0, 0.72, 0], "#59625e", "InsulatedBoiler", [0, 0, 0], 0.65);
  cylinder(
    g,
    [0.3, 0.3, 0.07, 24],
    [0, 1.17, 0.39],
    "#202827",
    "TemperatureDisplay",
    [Math.PI / 2, 0, 0],
    0.45,
  );
  cylinder(
    g,
    [0.19, 0.19, 0.035, 20],
    [0, 1.17, 0.46],
    "#e8c66f",
    "TemperatureFace",
    [Math.PI / 2, 0, 0],
    0.2,
  );
  cylinder(g, [0.055, 0.055, 0.54, 12], [0, 0.49, 0.5], "#c9a055", "BrassSpout", [Math.PI / 2, 0, 0], 0.72);
  cylinder(g, [0.12, 0.12, 0.08, 18], [0, 0.84, 0.44], "#7ce09b", "DispenseButton", [Math.PI / 2, 0, 0], 0.2);
  box(g, [0.68, 0.1, 0.58], [0, 0.06, 0.08], "#313b38", "CupTray", 0.5);
  return g;
};
const fridge = () => {
  const g = groupNamed("IngredientFridge");
  box(g, [1.9, 2.65, 0.16], [0, 1.33, -0.48], "#233b38", "BackPanel", 0.34);
  box(g, [0.16, 2.65, 1.05], [-0.88, 1.33, 0], "#233b38", "LeftFrame", 0.34);
  box(g, [0.16, 2.65, 1.05], [0.88, 1.33, 0], "#233b38", "RightFrame", 0.34);
  box(g, [1.9, 0.16, 1.05], [0, 2.57, 0], "#233b38", "TopFrame", 0.34);
  box(g, [1.9, 0.16, 1.05], [0, 0.08, 0], "#233b38", "FloorBase", 0.34);
  [0.72, 1.35, 1.98].forEach((y) => box(g, [1.62, 0.07, 0.8], [0, y, 0.08], "#d8d7cd", "CoolingShelf", 0.38));
  [-0.58, -0.2, 0.2, 0.58].forEach((x) => {
    box(g, [0.28, 0.52, 0.34], [x, 0.98, 0.2], "#f6f1df", "MilkCarton");
    box(g, [0.21, 0.1, 0.29], [x, 1.29, 0.2], "#79a8ca", "MilkCartonTop");
  });
  ["#e5b83f", "#d96e55", "#86b85b", "#d49c45"].forEach((color, index) => {
    cylinder(g, [0.15, 0.18, 0.55, 20], [-0.58 + index * 0.39, 1.7, 0.18], color, "FruitSyrupBottle");
    cylinder(g, [0.07, 0.07, 0.12, 14], [-0.58 + index * 0.39, 2.04, 0.18], "#d8c69a", "BottleCap");
  });
  [-0.45, 0, 0.45].forEach((x) =>
    box(g, [0.34, 0.34, 0.32], [x, 2.25, 0.18], "#eee3c8", "FreshIngredientBox"),
  );
  const door = box(g, [1.62, 2.3, 0.05], [0, 1.34, 0.55], "#8fc5c8", "GlassDoor", 0.3);
  door.material.transparent = true;
  door.material.opacity = 0.2;
  door.material.depthWrite = false;
  box(g, [0.065, 1.75, 0.08], [0.68, 1.34, 0.63], "#d5b66c", "DoorHandle", 0.68);
  cylinder(g, [0.055, 0.055, 0.05, 14], [-0.7, 2.45, 0.6], "#71e39a", "CoolingLight", [Math.PI / 2, 0, 0]);
  return g;
};
const iceMachine = () => {
  const g = groupNamed("IceMachine");
  box(g, [1.45, 1.2, 0.92], [0, 0.62, 0], "#63747a", "SteelBody", 0.65);
  const window = box(g, [1.13, 0.58, 0.06], [0, 0.72, 0.49], "#86b4c1", "IceWindow", 0.15);
  window.material.transparent = true;
  window.material.opacity = 0.42;
  [-0.38, -0.12, 0.14, 0.39].forEach((x) => {
    cylinder(g, [0.12, 0.16, 0.22, 8], [x, 0.72, 0.32], "#d9f4ff", "IceCube", [0.3, 0, 0.2]);
  });
  box(g, [0.82, 0.12, 0.08], [0, 0.18, 0.5], "#262d2e", "Vent", 0.3);
  cylinder(g, [0.07, 0.07, 0.05, 16], [0.52, 1.05, 0.48], "#76e298", "ReadyLight", [Math.PI / 2, 0, 0]);
  return g;
};
const sparklingMachine = () => {
  const g = groupNamed("SparklingWaterMachine");
  box(g, [0.86, 1.5, 0.76], [0, 0.77, 0], "#304246", "Body", 0.58);
  box(g, [0.62, 0.34, 0.07], [0, 1.16, 0.4], "#172326", "ControlInset", 0.35);
  cylinder(g, [0.2, 0.2, 0.05, 24], [0, 1.18, 0.46], "#87dceb", "BubbleGauge", [Math.PI / 2, 0, 0], 0.2);
  [0.1, 0.18, 0.26].forEach((radius, index) =>
    cylinder(
      g,
      [0.025 + index * 0.008, 0.025 + index * 0.008, 0.02, 12],
      [radius - 0.18, 1.18, 0.5],
      "#e8fbff",
      "Bubble",
      [Math.PI / 2, 0, 0],
    ),
  );
  cylinder(
    g,
    [0.05, 0.05, 0.48, 12],
    [0, 0.59, 0.49],
    "#d6b66d",
    "CarbonationNozzle",
    [Math.PI / 2, 0, 0],
    0.72,
  );
  cylinder(g, [0.22, 0.22, 0.72, 20], [-0.29, 0.57, -0.18], "#789296", "CO2Cylinder", [0, 0, 0], 0.62);
  cylinder(g, [0.08, 0.08, 0.1, 14], [-0.29, 0.98, -0.18], "#d6b66d", "CO2Valve");
  box(g, [0.64, 0.12, 0.54], [0, 0.08, 0.08], "#202e30", "DripTray", 0.58);
  return g;
};
const coldWaterDispenser = () => {
  const g = groupNamed("ColdWaterDispenser");
  box(g, [0.72, 1.36, 0.68], [0, 0.7, 0], "#d7e5e4", "CoolingBody", 0.48);
  box(g, [0.5, 0.28, 0.06], [0, 1.03, 0.37], "#18333a", "ColdDisplay", 0.38);
  cylinder(g, [0.1, 0.1, 0.04, 16], [0, 1.03, 0.42], "#65d9ff", "SnowButton", [Math.PI / 2, 0, 0], 0.2);
  cylinder(g, [0.045, 0.045, 0.42, 12], [0, 0.56, 0.42], "#b7c8c8", "ColdSpout", [Math.PI / 2, 0, 0], 0.7);
  box(g, [0.56, 0.1, 0.48], [0, 0.07, 0.08], "#263a3c", "DripTray", 0.55);
  return g;
};
const coldBrewTower = () => {
  const g = groupNamed("ColdBrewTower");
  box(g, [0.8, 0.12, 0.7], [0, 0.06, 0], "#5a3828", "WalnutBase");
  [0.18, 0.82, 1.46].forEach((y) =>
    cylinder(g, [0.28, 0.28, 0.38, 24], [0, y, 0], y > 0.9 ? "#8f5a35" : "#dbe6dd", "GlassChamber"),
  );
  cylinder(g, [0.045, 0.045, 1.45, 12], [-0.34, 0.78, 0], "#c99e55", "BrassPost", [0, 0, 0], 0.7);
  cylinder(g, [0.045, 0.045, 1.45, 12], [0.34, 0.78, 0], "#c99e55", "BrassPost", [0, 0, 0], 0.7);
  cylinder(g, [0.05, 0.05, 0.25, 12], [0, 0.42, 0.32], "#c99e55", "Tap", [Math.PI / 2, 0, 0], 0.7);
  return g;
};
const blender = () => {
  const g = groupNamed("CafeBlender");
  box(g, [0.82, 0.38, 0.72], [0, 0.2, 0], "#263735", "MotorBase", 0.5);
  const jar = box(g, [0.62, 0.9, 0.58], [0, 0.83, 0], "#9bc5c5", "BlenderJar", 0.15);
  jar.material.transparent = true;
  jar.material.opacity = 0.35;
  jar.material.depthWrite = false;
  cylinder(g, [0.28, 0.34, 0.12, 20], [0, 1.35, 0], "#2c3532", "Lid", [0, 0, 0], 0.45);
  cylinder(g, [0.24, 0.24, 0.08, 16], [0, 0.48, 0], "#d6b05e", "Blade", [0, 0, 0], 0.7);
  [0, 0.2, -0.2].forEach((x) =>
    cylinder(g, [0.045, 0.045, 0.04, 12], [x, 0.2, 0.38], x === 0 ? "#6ee08b" : "#e2b657", "Button", [
      Math.PI / 2,
      0,
      0,
    ]),
  );
  return g;
};
const syrupDispenser = (name, color, accent) => {
  const g = groupNamed(name);
  box(g, [0.74, 1.14, 0.72], [0, 0.59, 0], "#65432f", "WalnutStand", 0.16);
  const jar = cylinder(g, [0.28, 0.31, 0.75, 24], [0, 0.91, 0], "#d9efe8", "GlassSyrupJar");
  jar.material.transparent = true;
  jar.material.opacity = 0.28;
  jar.material.depthWrite = false;
  cylinder(g, [0.245, 0.255, 0.58, 24], [0, 0.82, 0], color, "FruitSyrup");
  [-0.12, 0, 0.13].forEach((x, index) =>
    cylinder(g, [0.09, 0.09, 0.025, 16], [x, 0.88 + (index % 2) * 0.16, 0.26], accent, "FruitSlice", [
      Math.PI / 2,
      0,
      0,
    ]),
  );
  cylinder(g, [0.11, 0.11, 0.16, 18], [0, 1.36, 0], accent, "MetalPump", [0, 0, 0], 0.65);
  cylinder(g, [0.038, 0.038, 0.38, 12], [0.15, 1.41, 0], accent, "PumpSpout", [0, 0, Math.PI / 2], 0.65);
  box(g, [0.52, 0.2, 0.06], [0, 0.28, 0.39], accent, "EnamelFruitLabel", 0.25);
  cylinder(g, [0.04, 0.04, 0.08, 12], [-0.16, 0.28, 0.43], "#fff0b4", "LabelMark", [Math.PI / 2, 0, 0]);
  return g;
};
const bell = () => {
  const g = groupNamed("PickupBell");
  cylinder(g, [0.52, 0.62, 0.12, 24], [0, 0.06, 0], "#5c3b24", "Base");
  cylinder(g, [0.44, 0.18, 0.42, 24], [0, 0.3, 0], "#d7a93e", "Bell", [0, 0, 0], 0.65);
  cylinder(g, [0.08, 0.08, 0.14, 16], [0, 0.58, 0], "#f0cf69", "Button", [0, 0, 0], 0.55);
  return g;
};
const workbench = () => {
  const g = groupNamed("DrinkAssemblyWorkbench");
  box(g, [1.75, 0.18, 0.9], [0, 0.86, 0], "#b98250", "WalnutTop", 0.12);
  box(g, [1.5, 0.72, 0.72], [0, 0.42, 0], "#496252", "SageCabinet", 0.08);
  box(g, [0.62, 0.38, 0.05], [-0.38, 0.43, 0.39], "#31473c", "DoorLeft", 0.15);
  box(g, [0.62, 0.38, 0.05], [0.38, 0.43, 0.39], "#31473c", "DoorRight", 0.15);
  cylinder(
    g,
    [0.035, 0.035, 0.16, 10],
    [-0.1, 0.43, 0.45],
    "#d1a756",
    "HandleLeft",
    [Math.PI / 2, 0, 0],
    0.5,
  );
  cylinder(
    g,
    [0.035, 0.035, 0.16, 10],
    [0.1, 0.43, 0.45],
    "#d1a756",
    "HandleRight",
    [Math.PI / 2, 0, 0],
    0.5,
  );
  cylinder(g, [0.3, 0.3, 0.025, 24], [-0.38, 0.98, 0.05], "#eadcc3", "MixPad");
  cylinder(g, [0.3, 0.3, 0.025, 24], [0.38, 0.98, 0.05], "#eadcc3", "FinishPad");
  return g;
};
const cafeShell = () => {
  const g = groupNamed("CafeShell");
  box(g, [15, 0.35, 11], [0, -0.18, 0.1], "#c8976d", "ExpandedFloor");
  box(g, [15, 4.4, 0.28], [0, 2.2, -5.25], "#ead7b5", "BackWall");
  box(g, [0.28, 4.4, 11], [-7.35, 2.2, 0.1], "#ead7b5", "SideWall");
  box(g, [11.65, 1.12, 1.35], [-1.2, 0.56, -4.1], "#405e50", "OpenBackCounter");
  box(g, [11.8, 0.16, 1.5], [-1.2, 1.2, -4.08], "#8b5a38", "BackWalnutTop", 0.18);
  box(g, [1.35, 1.12, 7.1], [-6.55, 0.56, -0.55], "#405e50", "OpenSideCounter");
  box(g, [1.5, 0.16, 7.25], [-6.55, 1.2, -0.55], "#8b5a38", "SideWalnutTop", 0.18);
  box(g, [5.3, 1.12, 1.35], [3.85, 0.56, 3.75], "#405e50", "ServeCounter");
  box(g, [5.45, 0.16, 1.5], [3.85, 1.2, 3.75], "#8b5a38", "ServeWalnutTop", 0.18);
  box(g, [11.4, 0.12, 0.08], [-1.2, 0.18, -3.4], "#2d433a", "BackCounterKickboard");
  box(g, [15, 0.18, 0.16], [0, 1.15, -5.05], "#9b6a47", "WallTrim");
  return g;
};
const character = (name, palette) => {
  const g = groupNamed(name);
  box(g, [0.82, 0.96, 0.46], [0, 1.05, 0], palette.shirt, "Shirt");
  box(g, [0.66, 0.76, 0.05], [0, 1, 0.25], palette.apron, "Apron");
  box(g, [0.36, 0.2, 0.04], [0, 0.82, 0.29], palette.apronDark, "ApronPocket");
  cylinder(g, [0.31, 0.3, 0.4, 24], [0, 1.87, 0], palette.skin, "Head");
  cylinder(g, [0.34, 0.31, 0.18, 24], [0, 2.09, -0.01], palette.hair, "HairCap");
  box(g, [0.62, 0.18, 0.22], [0, 2.02, -0.09], palette.hair, "HairFringe");
  [-0.12, 0.12].forEach((x) =>
    cylinder(g, [0.025, 0.025, 0.025, 10], [x, 1.91, 0.31], "#34251f", "Eye", [Math.PI / 2, 0, 0]),
  );
  cylinder(g, [0.05, 0.05, 0.018, 12], [0, 1.8, 0.32], "#b66e68", "Smile", [Math.PI / 2, 0, 0]);
  [-0.22, 0.22].forEach((x) => {
    box(g, [0.19, 0.72, 0.2], [x, 0.38, 0], palette.pants, "Leg");
    box(g, [0.24, 0.14, 0.36], [x, 0.05, 0.09], palette.shoes, "Shoe");
  });
  [-0.49, 0.49].forEach((x) => {
    box(g, [0.19, 0.7, 0.2], [x, 1.1, 0], palette.shirt, "Sleeve");
    cylinder(g, [0.1, 0.1, 0.18, 12], [x, 0.72, 0], palette.skin, "Hand");
  });
  return g;
};

const assets = {
  "cafe-shell.glb": cafeShell(),
  "grinder.glb": grinder(),
  "espresso-machine.glb": espresso(),
  "cup-shelf.glb": cupShelf(),
  "cold-cup-shelf.glb": coldCupShelf(),
  "hot-water-dispenser.glb": dispenser(),
  "cold-water-dispenser.glb": coldWaterDispenser(),
  "ingredient-fridge.glb": fridge(),
  "ice-machine.glb": iceMachine(),
  "sparkling-machine.glb": sparklingMachine(),
  "cold-brew-tower.glb": coldBrewTower(),
  "blender.glb": blender(),
  "pickup-bell.glb": bell(),
  "jieun.glb": character("Jieun", {
    apron: "#6d8f78",
    apronDark: "#496756",
    shirt: "#efe6d5",
    skin: "#e9b99b",
    hair: "#3b2823",
    pants: "#3f3734",
    shoes: "#eee3d4",
  }),
  "customer.glb": character("Customer", {
    apron: "#c3866c",
    apronDark: "#875849",
    shirt: "#f2d8b5",
    skin: "#dca98c",
    hair: "#5a3527",
    pants: "#536173",
    shoes: "#342d2a",
  }),
};
await fs.mkdir(outputDirectory, { recursive: true });
const exporter = new GLTFExporter();
for (const [fileName, object] of Object.entries(assets)) {
  const data = await exporter.parseAsync(object, { binary: true, onlyVisible: true });
  await fs.writeFile(path.join(outputDirectory, fileName), Buffer.from(data));
}
console.log(`Generated ${Object.keys(assets).length} GLB assets in ${outputDirectory}`);
