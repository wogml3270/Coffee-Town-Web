import type { Provider, Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseService";
import { mergeGuestProgress, type PlayerProgress } from "./progressionService";

type SocialProvider = Extract<Provider, "google" | "kakao">;
type RedirectEnvironment = Readonly<{ origin: string; hostname: string; nativeApp: boolean }>;

const GUEST_PROGRESS_KEY = "coffee-town.guest-progress";
const APP_CALLBACK_URL = "coffeetown://auth/callback";

export type AuthUser = Readonly<{
  id: string;
  isAnonymous: boolean;
  displayName: string;
  provider: string | null;
  avatarUrl: string | null;
}>;

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  isAnonymous: user.is_anonymous ?? false,
  displayName:
    (typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata.name === "string" && user.user_metadata.name) ||
    (typeof user.user_metadata.preferred_username === "string" && user.user_metadata.preferred_username) ||
    user.email?.split("@")[0] ||
    "바리스타",
  provider: typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : null,
  avatarUrl: typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url.replace(/^http:\/\//, "https://") : null,
});

export const resolveRedirectUrl = (environment: RedirectEnvironment): string =>
  environment.nativeApp ? APP_CALLBACK_URL : `${environment.origin}/auth/callback`;

const isNativeApp = (): boolean =>
  typeof window !== "undefined" &&
  Boolean((window as Window & { __COFFEE_TOWN_NATIVE__?: boolean }).__COFFEE_TOWN_NATIVE__);

export const getRedirectUrl = (): string => {
  if (typeof window === "undefined") return APP_CALLBACK_URL;
  return resolveRedirectUrl({ origin: window.location.origin, hostname: window.location.hostname, nativeApp: isNativeApp() });
};

const getOAuthOptions = (customRedirect?: string) => ({ redirectTo: customRedirect ?? getRedirectUrl() });
const signInWithProvider = (provider: SocialProvider, customRedirect?: string) =>
  getSupabase().auth.signInWithOAuth({ provider, options: getOAuthOptions(customRedirect) });

export const signInWithGoogle = (customRedirect?: string) => signInWithProvider("google", customRedirect);
export const signInWithKakao = (customRedirect?: string) => signInWithProvider("kakao", customRedirect);

export const ensureGuestSession = async () => {
  const supabase = getSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session) return sessionData.session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error("익명 게스트 세션을 만들지 못했습니다.");
  return data.session;
};

export const saveGuestProgressSnapshot = (progress: PlayerProgress): void => {
  if (typeof window !== "undefined") window.localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
};

const readGuestProgressSnapshot = (): PlayerProgress | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(GUEST_PROGRESS_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PlayerProgress>;
    if (![parsed.gold, parsed.xp, parsed.level].every((entry) => typeof entry === "number")) return null;
    return {
      gold: parsed.gold as number,
      xp: parsed.xp as number,
      level: parsed.level as number,
      unlockedRecipes: Array.isArray(parsed.unlockedRecipes) ? parsed.unlockedRecipes.filter((item): item is string => typeof item === "string") : [],
    };
  } catch {
    return null;
  }
};

const sessionFromCallbackUrl = async (): Promise<Session | null> => {
  const supabase = getSupabase();
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return data.session;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const completeOAuthCallback = async (): Promise<Session> => {
  let unsubscribe: () => void = () => {};
  const authStateSession = new Promise<Session | null>((resolve) => {
    const timeout = window.setTimeout(() => { unsubscribe(); resolve(null); }, 2500);
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      window.clearTimeout(timeout);
      resolve(session);
    });
    unsubscribe = () => data.subscription.unsubscribe();
  });
  const parsedSession = await sessionFromCallbackUrl();
  const session = parsedSession ?? await authStateSession;
  unsubscribe();
  if (!session) throw new Error("로그인 세션을 확인하지 못했습니다.");
  await mergeGuestProgress(session.user.id, readGuestProgressSnapshot());
  window.localStorage.removeItem(GUEST_PROGRESS_KEY);
  return session;
};

export const subscribeToAuth = (listener: (user: AuthUser | null) => void) => {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => listener(session ? toAuthUser(session.user) : null));
  void getSupabase().auth.getSession().then(({ data: sessionData }) => listener(sessionData.session ? toAuthUser(sessionData.session.user) : null));
  return () => data.subscription.unsubscribe();
};

export const signOut = async (): Promise<void> => {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
};

export const linkAccountWithProvider = async (provider: SocialProvider, customRedirect?: string) => {
  const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
  if (sessionError) return { data: null, error: sessionError };
  if (!sessionData.session) throw new Error("계정 연동 전에 게스트 세션이 필요합니다.");
  return getSupabase().auth.linkIdentity({ provider, options: getOAuthOptions(customRedirect) });
};
