import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type PlayerProfile = Readonly<{ userId: string; email: string | null; nickname: string | null; avatarUrl: string | null }>;
export type SocialProvider = "google" | "kakao";

const secureAvatar = (value: unknown) => typeof value === "string" ? value.replace(/^http:\/\//, "https://") : null;
const socialProfile = (user: User) => ({
  email: user.email ?? null,
  avatar_url: secureAvatar(user.user_metadata.avatar_url ?? user.user_metadata.picture),
});

export const getRedirectUrl = () => `${window.location.origin}/auth/callback`;

let oauthStarting = false;
const signInWithProvider = async (provider: SocialProvider) => {
  if (!isSupabaseConfigured) throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  if (oauthStarting) return;
  oauthStarting = true;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectUrl(),
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });
  if (error) { oauthStarting = false; throw error; }
};
export const signInWithGoogle = () => signInWithProvider("google");
export const signInWithKakao = () => signInWithProvider("kakao");

export const signOut = async () => { const { error } = await supabase.auth.signOut(); if (error) throw error; };

let callbackExchange: Promise<Session> | null = null;
const exchangeOAuthCode = async (): Promise<Session> => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) { const { data, error } = await supabase.auth.exchangeCodeForSession(code); if (error) throw error; if (data.session) return data.session; }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error("소셜 로그인 세션을 확인하지 못했습니다.");
  return data.session;
};
export const completeOAuthCallback = (): Promise<Session> => callbackExchange ??= exchangeOAuthCode();

export const syncProfile = async (user: User): Promise<PlayerProfile> => {
  const metadata = socialProfile(user);
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
