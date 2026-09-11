import { useEffect } from "react";
import { soundPlayer } from "../audio/soundPlayer";
import { useGame } from "../game/store";
import { calculateShiftScore } from "../game/rules";
import type { PlayerProfile } from "../services/authService";
import type { SyncState } from "../services/progressSync";

export const Result = ({ profile, sync }: Readonly<{ profile: PlayerProfile | null; sync: SyncState }>) => {
  const shift = useGame(({ shift }) => shift);
  const exit = useGame(({ exit }) => exit);
  const start = useGame(({ start }) => start);
  const openUpgrade = useGame(({ openUpgrade }) => openUpgrade);
  const bankGold = useGame(({ bankGold }) => bankGold);
  const breakdown = calculateShiftScore(shift);
  const scoreStatus = !profile ? "게스트 기록" : sync.status === "ready" ? "영업 기록 저장 완료" : sync.message;
  useEffect(() => { soundPlayer.startLobbyMusic(); }, []);
  return (
    <main className="result-screen">
      <section>
        <p>STAGE {shift.stageId} · 21:00 CLOSED</p>
        <h1>오늘도 수고했어요</h1>
        <div>
          <strong>+{shift.gold} G</strong>
          <span>
            {shift.orderSequence}잔 완료 · 보유 골드 {bankGold} G
          </span>
        </div>
        <div className="result-score">
          <small>{scoreStatus}</small>
          <strong>{breakdown.total.toLocaleString("ko-KR")} P</strong>
          <dl>
            <div>
              <dt>주문 처리</dt>
              <dd>{breakdown.orderPoints.toLocaleString("ko-KR")}</dd>
            </div>
            <div>
              <dt>정확도 {breakdown.accuracy}%</dt>
              <dd>+{breakdown.accuracyBonus}</dd>
            </div>
            <div>
              <dt>최대 콤보 {shift.maxCombo}</dt>
              <dd>+{breakdown.comboBonus}</dd>
            </div>
            <div>
              <dt>만족도 {breakdown.averageSatisfaction}</dt>
              <dd>+{breakdown.satisfactionBonus}</dd>
            </div>
            <div>
              <dt>정상 마감</dt>
              <dd>+{breakdown.closingBonus}</dd>
            </div>
          </dl>
        </div>
        <button type="button" onClick={openUpgrade}>
          카페 업그레이드
        </button>
        <button type="button" onClick={() => start()}>
          다시 영업하기
        </button>
        <button className="secondary" type="button" onClick={exit}>
          로비로
        </button>
      </section>
    </main>
  );
};

