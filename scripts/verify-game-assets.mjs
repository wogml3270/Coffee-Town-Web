import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const assetRoot = path.resolve(import.meta.dirname, "../public/assets/game");
const requirementsPath = path.join(assetRoot, "asset-requirements.json");
const requirements = JSON.parse(await readFile(requirementsPath, "utf8"));

if (requirements.version !== 1 || !Array.isArray(requirements.requiredForVerticalSlice)) {
  throw new Error("Invalid game asset requirements manifest.");
}

const missing = [];
for (const relativePath of requirements.requiredForVerticalSlice) {
  try {
    await access(path.join(assetRoot, relativePath));
  } catch {
    missing.push(relativePath);
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} required game asset(s):`);
  for (const relativePath of missing) console.error(`- public/assets/game/${relativePath}`);
  process.exitCode = 1;
} else {
  console.log(`Game asset verification passed: ${requirements.requiredForVerticalSlice.length} required file(s).`);
}
