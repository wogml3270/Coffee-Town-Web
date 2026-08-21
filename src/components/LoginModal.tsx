"use client";

import { useState } from "react";
import {
  linkAccountWithProvider,
  signInWithGoogle,
  signInWithKakao,
} from "../services/authService";

type LoginModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  mode?: "sign-in" | "link";
}>;

type Provider = "google" | "kakao";

export const LoginModal = ({
  open,
  onClose,
  mode = "sign-in",
}: LoginModalProps) => {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const continueWith = async (provider: Provider): Promise<void> => {
    setPending(provider);
    setError(null);

    try {
      const result =
        mode === "link"
          ? await linkAccountWithProvider(provider)
          : provider === "kakao"
            ? await signInWithKakao()
            : await signInWithGoogle();
      if (result.error) setError(result.error.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
    } finally {
      setPending(null);
    }
  };

  const title = mode === "link" ? "게스트 기록 지키기" : "카페에 돌아오셨네요!";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-3 sm:items-center"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        aria-labelledby="login-modal-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-[2rem] bg-[#fffaf0] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-700">COFFEE TOWN</p>
            <h2 id="login-modal-title" className="text-2xl font-black text-stone-800">
              {title}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {mode === "link"
                ? "지금 연동하면 골드와 레시피가 그대로 보존돼요."
                : "로그인하고 카페의 성장 기록을 안전하게 저장하세요."}
            </p>
          </div>
          <button
            aria-label="닫기"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-stone-200 text-xl text-stone-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <button
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 font-bold text-[#191919] disabled:opacity-60"
            disabled={pending !== null}
            onClick={() => void continueWith("kakao")}
            type="button"
          >
            <span aria-hidden="true" className="text-xl">●</span>
            {pending === "kakao" ? "연결 중..." : "카카오로 계속하기"}
          </button>
          <button
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-5 font-bold text-stone-800 disabled:opacity-60"
            disabled={pending !== null}
            onClick={() => void continueWith("google")}
            type="button"
          >
            <span aria-hidden="true" className="text-xl font-black text-blue-600">G</span>
            {pending === "google" ? "연결 중..." : "Google로 계속하기"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
};
