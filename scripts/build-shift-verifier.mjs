import { rolldown } from "rolldown";
const bundle = await rolldown({ input: "src/game/serverVerifier.ts" });
await bundle.write({ file: "supabase/functions/_shared/shift-verifier.js", format: "esm" });
await bundle.close();
