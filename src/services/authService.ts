import type { Provider, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseService";

type SocialProvider = Extract<Provider, "google" | "kakao">;

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
    (typeof user.user_metadata.preferred_username === "string" &&
      user.user_metadata.preferred_username) ||
    user.email?.split("@")[0] ||
    "바리스타",
  provider:
    typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : null,
  avatarUrl:
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url.replace(/^http:\/\//, "https://")
      : null,
});

const getRedirectUrl = (): string | undefined =>
  typeof window === "undefined" ? undefined : `${window.location.origin}/`;

const getOAuthOptions = (): Readonly<{ redirectTo?: string }> => {
  const redirectTo = getRedirectUrl();
  return redirectTo ? { redirectTo } : {};
};

const signInWithProvider = async (provider: SocialProvider) =>
  getSupabase().auth.signInWithOAuth({
    provider,
    options: getOAuthOptions(),
  });

export const signInWithGoogle = () => signInWithProvider("google");

export const signInWithKakao = () => signInWithProvider("kakao");

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

export const subscribeToAuth = (
  listener: (user: AuthUser | null) => void,
) => {
  const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
    if (
      typeof window !== "undefined" &&
      event === "SIGNED_IN" &&
      window.location.hash.includes("access_token=")
    ) {
      window.history.replaceState(null, "", `${window.location.origin}/`);
    }
    listener(session ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
};

export const signOut = async (): Promise<void> => {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
};

/**
 * Links an OAuth identity to the current (typically anonymous guest) auth user.
 * Supabase keeps the current auth.users.id, so user_progress.user_id remains valid.
 */
export const linkAccountWithProvider = async (provider: SocialProvider) => {
  const { data: sessionData, error: sessionError } =
    await getSupabase().auth.getSession();

  if (sessionError) return { data: null, error: sessionError };
  if (!sessionData.session) {
    throw new Error("계정 연동 전에 게스트 세션이 필요합니다.");
  }

  return getSupabase().auth.linkIdentity({
    provider,
    options: getOAuthOptions(),
  });
};
