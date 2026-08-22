import { useEffect, useState } from "react";
import { completeOAuthCallback } from "../services/authService";

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void completeOAuthCallback()
      .then(() => { if (active) window.location.replace("/"); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "로그인 콜백 처리에 실패했습니다."); });
    return () => { active = false; };
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center bg-[#171114] px-6 text-center text-[#ffebca]">
      <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#2b2023] p-8 shadow-2xl">
        <p className="text-xs font-bold tracking-[.24em] text-[#e76f56]">COFFEE TOWN</p>
        <h1 className="mt-3 text-2xl font-black">{error ? "로그인을 완료하지 못했습니다" : "로그인 정보를 확인하고 있습니다"}</h1>
        <p className="mt-4 text-sm leading-6 text-[#d7c7ba]">{error ?? "세션과 카페 성장 데이터를 안전하게 연결하는 중입니다."}</p>
        {error ? <button className="mt-6 min-h-12 w-full rounded-2xl bg-[#e76f56] font-bold text-white" onClick={() => window.location.replace("/")} type="button">처음 화면으로</button> : null}
      </section>
    </main>
  );
};
