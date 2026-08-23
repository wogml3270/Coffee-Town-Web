import { readFile } from "node:fs/promises";
import process from "node:process";

const envPath = process.argv[2] ?? ".env";

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 1) return [line, ""];
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      const value = rawValue.replace(/^(["'])(.*)\1$/u, "$2");
      return [key, value];
    }),
);

const env = parseEnv(await readFile(envPath, "utf8"));
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");
}

const url = new URL(supabaseUrl);
if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) {
  throw new Error("VITE_SUPABASE_URL must be an HTTPS Supabase project URL.");
}
const isLegacyAnonKey = anonKey.startsWith("eyJ") && anonKey.length >= 80;
const isPublishableKey = anonKey.startsWith("sb_publishable_") && anonKey.length >= 32;
if (!isLegacyAnonKey && !isPublishableKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY does not look like a publishable/anon key.");
}

const request = async (label, path, authenticated = false) => {
  const headers = authenticated
    ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
    : { apikey: anonKey };
  const response = await fetch(new URL(path, url), { headers, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 240).replace(/\s+/gu, " ");
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
  console.log(`${label}: ${response.status}`);
};

await request("Supabase Auth health", "/auth/v1/health");
await request("Supabase REST catalog", "/rest/v1/upgrades?select=id&limit=1", true);
console.log("Supabase connection verified without exposing credentials.");
