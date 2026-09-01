import { describe, expect, it } from "vitest";
import { isCafePositionBlocked, resolveCafeMovement } from "./movement";

describe("cafe counter collision", () => {
  it("blocks movement through the pickup counter", () => {
    const result = resolveCafeMovement({ x: 3.8, z: 2.68 }, { x: 0, z: 0.2 });
    expect(result.z).toBe(2.68);
    expect(isCafePositionBlocked({ x: 3.8, z: 3 })).toBe(true);
  });

  it("allows movement along the front edge of the counter", () => {
    const result = resolveCafeMovement({ x: 0.7, z: 3.2 }, { x: 0, z: 0.35 });
    expect(result.z).toBeCloseTo(3.55);
  });

  it("uses axis-separated resolution so diagonal input slides along an edge", () => {
    const result = resolveCafeMovement({ x: 0.7, z: 2.68 }, { x: 0.3, z: 0.3 });
    expect(result.x).toBe(1);
    expect(result.z).toBe(2.68);
  });

  it("blocks the customer dining tables", () => {
    const result = resolveCafeMovement({ x: -3.3, z: 1.35 }, { x: 0, z: 0.3 });
    expect(result.z).toBe(1.35);
    expect(isCafePositionBlocked({ x: -3.3, z: 3.2 })).toBe(true);
  });

  it("lets a character escape if a layout change places it inside a collider", () => {
    const result = resolveCafeMovement({ x: -3.3, z: 3.2 }, { x: 0, z: -0.3 });
    expect(result.z).toBeCloseTo(2.9);
  });
});
