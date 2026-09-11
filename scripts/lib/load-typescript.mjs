import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// For dependency-free catalog modules only; type-only imports disappear during transpilation.
export const loadTypescript = async (path) => {
  const source = await readFile(path, "utf8");
  const outputText = stripTypeScriptTypes(source);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
};
