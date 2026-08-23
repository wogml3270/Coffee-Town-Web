import { useState } from "react";
import { signInWithGoogle, signInWithKakao, signOut } from "../services/authService";
import type { AuthUser } from "../services/authService";

type StartScreenProps = Readonly<{
  authReady: boolean;
  currentUser: AuthUser | null;
  onGuestStart: () => Promise<void> | void;
  onPlayerStart: () => void;
}>;

export const StartScreen = ({ authReady, currentUser, onGuestStart, onPlayerStart }: StartScreenProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [guestPending, setGuestPending] = useState(false);

  const socialLogin = async (provider: "kakao" | "google") => {
    setMessage(null);
    try {
      const result = provider === "kakao" ? await signInWithKakao() : await signInWithGoogle();
      if (result.error) setMessage(result.error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 설정을 확인해 주세요.");
    }
  };

  const startGuest = async () => {
    setGuestPending(true);
    setMessage(null);
    try {
      await onGuestStart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "게스트 세션을 시작하지 못했습니다.");
    } finally {
      setGuestPending(false);
    }
  };

  const logout = async () => {
    setMessage(null);
    try {
      await signOut();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그아웃하지 못했습니다.");
    }
  };

  return (
    <main className="animate-screen-in flex min-h-dvh items-center justify-center bg-[#F8F5F0] px-5 py-10">
      <section className="w-full max-w-sm text-center">
        <div className="animate-float mx-auto mb-8 grid size-28 place-items-center rounded-[2rem] bg-[#DCEBE2] shadow-[0_18px_45px_rgba(71,91,78,.16)]">
          <svg viewBox="0 0 96 96" className="size-20" aria-hidden="true">
            <path d="M21 35h48v29c0 12-10 20-24 20S21 76 21 64V35Z" fill="#FFFDF9" stroke="#35584A" strokeWidth="4"/>
            <path d="M69 43h7c13 0 13 22 0 22h-7" fill="none" stroke="#35584A" strokeWidth="5"/>
            <ellipse cx="45" cy="35" rx="24" ry="9" fill="#A87560" stroke="#35584A" strokeWidth="4"/>
            <path d="M35 13c-7 7 5 10-1 17M51 10c-7 8 6 11 0 20" fill="none" stroke="#7EAB90" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="animate-rise mb-2 text-xs font-bold tracking-[.28em] text-[#6E8C7A]">YOUR EVERYDAY CAFE</p>
        <h1 className="animate-rise-delay text-4xl font-black tracking-[-.045em] text-[#283E35]">Coffee Town</h1>
        <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-[#68736D]">주문을 읽고, 장비를 다루고,<br/>한 손으로 나만의 카페 영업을 시작하세요.</p>

        <div className="animate-rise-late mt-10 space-y-3">
          {!authReady ? (
            <div className="min-h-40 animate-pulse rounded-[1.75rem] bg-[#E8ECE8]" aria-label="로그인 상태 확인 중" />
          ) : currentUser && !currentUser.isAnonymous ? (
            <div className="rounded-[1.75rem] border border-[#D9E4DC] bg-white p-4 text-left shadow-[0_12px_35px_rgba(53,94,77,.1)]">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#DCEBE2] text-[#355E4D]">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#789180]">로그인 완료</p><p className="truncate text-lg font-black text-[#293A33]">{currentUser.displayName} 바리스타</p></div>
                <span className="rounded-full bg-[#EEF6F0] px-2.5 py-1 text-[10px] font-bold uppercase text-[#47705E]">{currentUser.provider ?? "social"}</span>
              </div>
              <button className="ui-button mt-4 min-h-14 w-full rounded-2xl bg-[#355E4D] px-5 font-bold text-white shadow-[0_8px_20px_rgba(53,94,77,.2)]" onClick={onPlayerStart} type="button">내 카페 시작하기</button>
              <button className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-[#78827D]" onClick={() => void logout()} type="button">다른 계정으로 로그인</button>
            </div>
          ) : (
            <>
              <button className="ui-button min-h-14 w-full rounded-2xl bg-[#355E4D] px-5 font-bold text-white shadow-[0_8px_20px_rgba(53,94,77,.2)] disabled:opacity-60" disabled={guestPending} onClick={() => void startGuest()} type="button">{guestPending ? "게스트 세션 준비 중..." : "게스트로 5분 체험하기"}</button>
              <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-[#DED9D1]"/><span className="text-[11px] font-semibold text-[#8A948F]">로그인하면 진행 상황을 저장할 수 있어요</span><span className="h-px flex-1 bg-[#DED9D1]"/></div>
              <button className="ui-button min-h-13 w-full rounded-2xl bg-[#FEE500] px-5 font-bold text-[#302E27]" onClick={() => void socialLogin("kakao")} type="button">카카오 로그인</button>
              <button className="ui-button min-h-13 w-full rounded-2xl border border-[#D8D8D8] bg-white px-5 font-bold text-[#3F4542]" onClick={() => void socialLogin("google")} type="button">Google 로그인</button>
            </>
          )}
        </div>
        {message ? <p className="mt-4 rounded-xl bg-[#FFF0ED] p-3 text-sm text-[#A14F43]" role="alert">{message}</p> : null}
      </section>
    </main>
  );
};
