import { describe, expect, it } from "vitest";
import { exitEarnings, unlockedAfterFullDay } from "./store";

describe("exitEarnings", () => {
  it("영업 중 나가면 현재까지 획득한 골드를 정산한다", () => {
    expect(exitEarnings("shift", 350)).toBe(350);
  });

  it("결과·로비·업그레이드 화면에서는 이미 정산된 골드를 중복 지급하지 않는다", () => {
    expect(exitEarnings("result", 350)).toBe(0);
    expect(exitEarnings("title", 350)).toBe(0);
    expect(exitEarnings("upgrade", 350)).toBe(0);
  });
});

describe("business day progression", () => {
  it("21시 정상 마감만 다음 영업일을 해금한다", () => {
    expect(unlockedAfterFullDay(3, 3)).toBe(4);
    expect(exitEarnings("shift", 250)).toBe(250);
  });
  it("이미 앞선 스테이지를 다시 마감해도 해금 단계를 낮추지 않는다", () => {
    expect(unlockedAfterFullDay(8, 2)).toBe(8);
  });
});
