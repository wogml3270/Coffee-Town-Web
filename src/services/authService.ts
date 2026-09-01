import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type PlayerProfile = Readonly<{ userId: string; email: string | null; nickname: string | null; avatarUrl: string | null }>;

const secureAvatar = (value: unknown) => typeof value === "string" ? value.replace(/^http:\/\//, "https://") : null;
const googleProfile = (user: User) => ({
  email: user.email ?? null,
  avatar_url: secureAvatar(user.user_metadata.avatar_url ?? user.user_metadata.picture),
});

export const getRedirectUrl = () => `${window.location.origin}/auth/callback`;

export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getRedirectUrl(), queryParams: { prompt: "select_account" } } });
  if (error) throw error;
};

export const signOut = async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; };

export const completeOAuthCallback = async (): Promise<Session> => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) { const { data, error } = await supabase.auth.exchangeCodeForSession(code); if (error) throw error; if (data.session) return data.session; }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("Google 로그인 세션을 확인하지 못했습니다.");
  return data.session;
};

export const syncProfile = async (user: User): Promise<PlayerProfile> => {
  const metadata = googleProfile(user);
  const { data: existing, error: readError } = await supabase.from("profiles").select("nickname").eq("user_id", user.id).maybeSingle();
  if (readError) throw readError;
  const { data, error } = await supabase.from("profiles").upsert({ user_id: user.id, ...metadata, nickname: existing?.nickname ?? null, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("user_id,email,nickname,avatar_url").single();
  if (error) throw error;
  return { userId: data.user_id, email: data.email, nickname: data.nickname, avatarUrl: data.avatar_url };
};

export const saveNickname = async (userId: string, nickname: string): Promise<PlayerProfile> => {
  const { data, error } = await supabase.from("profiles").update({ nickname: nickname.trim(), updated_at: new Date().toISOString() }).eq("user_id", userId).select("user_id,email,nickname,avatar_url").single();
  if (error) throw error;
  return { userId: data.user_id, email: data.email, nickname: data.nickname, avatarUrl: data.avatar_url };
};

export const getCurrentProfile = async (): Promise<PlayerProfile | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ? syncProfile(data.session.user) : null;
};

export const subscribeToAuth = (listener: (profile: PlayerProfile | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => { window.setTimeout(() => { void (session ? syncProfile(session.user).then(listener) : Promise.resolve(listener(null))); }, 0); });
  return () => data.subscription.unsubscribe();
};
