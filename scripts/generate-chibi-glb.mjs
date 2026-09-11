import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// GLTFExporter expects the browser FileReader API when producing binary output.
globalThis.FileReader ??= class FileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const outputDir = resolve("public/assets/models");
const palette = ["#f5b7a8", "#9bc7e8", "#f1cd84", "#c9a7e8", "#9ed3b0", "#efa6c8"];

const material = (color, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
const mesh = (geometry, color) => new THREE.Mesh(geometry, material(color));

const addFace = (root, skin, hair) => {
  const head = mesh(new THREE.SphereGeometry(0.48, 16, 12), skin);
  head.scale.set(1, 1.08, 0.9);
  head.position.y = 1.62;
  root.add(head);
  const hairCap = mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.position.set(0, 1.78, 0.02);
  root.add(hairCap);
  for (const x of [-0.16, 0.16]) {
    const eye = mesh(new THREE.SphereGeometry(0.045, 8, 6), "#3b2a2a");
    eye.position.set(x, 1.66, 0.43);
    root.add(eye);
  }
  for (const x of [-0.27, 0.27]) {
    const cheek = mesh(new THREE.SphereGeometry(0.055, 8, 6), "#ed8f8b");
    cheek.scale.set(1.5, 0.6, 0.3);
    cheek.position.set(x, 1.53, 0.42);
    root.add(cheek);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI), "#8a4f55");
  mouth.rotation.x = Math.PI;
  mouth.position.set(0, 1.5, 0.44);
  root.add(mouth);
};

const createCharacter = ({ skin = "#f5c7ad", hair = "#5a3d36", outfit = "#86a98b", accent = "#f2c66f" } = {}) => {
  const root = new THREE.Group();
  addFace(root, skin, hair);
  const body = mesh(new THREE.CapsuleGeometry(0.34, 0.48, 6, 12), outfit);
  body.position.y = 0.98;
  root.add(body);
  const apron = mesh(new THREE.BoxGeometry(0.43, 0.42, 0.04), accent);
  apron.position.set(0, 1.03, 0.32);
  root.add(apron);
  for (const x of [-0.2, 0.2]) {
    const leg = mesh(new THREE.CapsuleGeometry(0.1, 0.34, 5, 8), "#6c5360");
    leg.position.set(x, 0.42, 0);
    root.add(leg);
    const shoe = mesh(new THREE.SphereGeometry(0.14, 10, 8), "#4e3940");
    shoe.scale.set(1.2, 0.55, 1.5);
    shoe.position.set(x, 0.18, 0.1);
    root.add(shoe);
  }
  for (const x of [-0.43, 0.43]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.32, 5, 8), skin);
    arm.rotation.z = x < 0 ? -0.3 : 0.3;
    arm.position.set(x, 1.04, 0);
    root.add(arm);
  }
  return root;
};

const exportGlb = async (scene, filename) => {
  const exporter = new GLTFExporter();
  const buffer = await new Promise((resolveExport, reject) =>
    exporter.parse(scene, resolveExport, reject, { binary: true, onlyVisible: true }),
  );
  await mkdir(dirname(resolve(outputDir, filename)), { recursive: true });
  await writeFile(resolve(outputDir, filename), Buffer.from(buffer));
};

await exportGlb(new THREE.Scene().add(createCharacter()), "jieun-cute.glb");
for (let index = 0; index < palette.length; index += 1) {
  await exportGlb(
    new THREE.Scene().add(
      createCharacter({ outfit: palette[index], hair: index % 2 ? "#6c4d3f" : "#45333d", accent: "#f4dfaa" }),
    ),
    `customer-cute-${String(index + 1).padStart(2, "0")}.glb`,
  );
}
