import { describe, expect, it } from "vitest";
import { defaultUpgrades } from "./rules";
import {
  canBuyUpgrade,
  maxUpgradeLevel,
  unmetUpgradeRequirements,
  upgradeCost,
  upgradeNodeById,
} from "./upgradeTree";

describe("upgrade tree", () => {
  it("피버 지속은 피버 충전 2레벨 이후 열린다", () => {
    const node = upgradeNodeById("feverDuration");
    expect(unmetUpgradeRequirements(node, defaultUpgrades)).toHaveLength(1);
    expect(unmetUpgradeRequirements(node, { ...defaultUpgrades, feverCharge: 2 })).toHaveLength(0);
  });

  it("자동화는 여러 계통의 선행 조건을 모두 요구한다", () => {
    const node = upgradeNodeById("automation");
    expect(canBuyUpgrade(node, defaultUpgrades, 20000000)).toBe(false);
    expect(
      canBuyUpgrade(
        node,
        {
          ...defaultUpgrades,
          speed: 5,
          movement: 3,
          multitask: 1,
          feverCharge: 2,
          feverDuration: 3,
          tips: 3,
        },
        10000000,
      ),
    ).toBe(true);
  });

  it("프리미엄 자동화 비용과 최대 레벨을 강하게 제한한다", () => {
    expect(upgradeCost("automation", 0)).toBe(10000000);
    expect(maxUpgradeLevel("automation")).toBe(1);
  });
});
