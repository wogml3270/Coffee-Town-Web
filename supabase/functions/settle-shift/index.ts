import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import { verifyShift, defaultUpgrades } from "../_shared/shift-verifier.js";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return json({ error: "AUTH_REQUIRED" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"))[0] as string;
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // Verify with Supabase Auth even when gateway JWT verification is disabled for new signing keys.
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "AUTH_REQUIRED" }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 1500000) return json({ error: "PAYLOAD_TOO_LARGE" }, 413);
    const receipt = JSON.parse(raw);
    if (!receipt || typeof receipt.sessionId !== "string") return json({ error: "INVALID_SESSION" }, 400);
    const { data: session, error } = await admin.from("shift_sessions").select("*").eq("id", receipt.sessionId).eq("user_id", auth.user.id).single();
    if (error || !session) return json({ error: "SESSION_NOT_FOUND" }, 404);
    if (session.settled_at) return json({ settled: true });
    if (receipt.version !== session.protocol_version) return json({ error: "VERSION_MISMATCH" }, 409);
    let result;
    try {
      result = verifyShift({ id: session.id, stageId: session.stage_id, seed: session.seed, upgrades: { ...defaultUpgrades, ...session.upgrades } }, receipt, (Date.now() - Date.parse(session.started_at)) / 1000);
    } catch { return json({ error: "INVALID_SHIFT_RECORD" }, 422); }
    const { state, score, discoveries } = result;
    const { error: commitError } = await admin.rpc("commit_verified_shift", {
      p_user_id: auth.user.id, p_session_id: session.id,
      p_result: { elapsed: receipt.elapsed, gold: state.gold, score: score.total,
        completedOrders: state.orderSequence, mistakes: state.mistakes, discardedItems: state.discardedItems,
        maxCombo: state.maxCombo, averageSatisfaction: score.averageSatisfaction,
        discoveries, seenMenuStages: receipt.seenMenuStages },
    });
    if (commitError) { console.error("Shift commit failed", commitError.code); return json({ error: "SETTLEMENT_FAILED" }, 500); }
    return json({ settled: true });
  } catch { return json({ error: "INVALID_REQUEST" }, 400); }
});
