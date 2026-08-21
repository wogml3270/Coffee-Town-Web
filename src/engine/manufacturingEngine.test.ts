import { describe, expect, it } from "vitest";
import { processManufacturingStep } from "./manufacturingEngine";
import type { ManufacturingStep, StationDefinition } from "../types/game";

const station: StationDefinition = { id: "espresso_machine", name: "에스프레소 머신", processType: "BREW_ESPRESSO", baseDurationSec: 8, unlockLevel: 1 };
const step: ManufacturingStep = { order: 2, stationId: station.id, process: "BREW_ESPRESSO", inputs: [{ itemId: "ground_espresso", quantity: 1 }], outputItemId: "espresso_shot", durationSec: 8 };

describe("processManufacturingStep", () => {
  it("consumes inputs and creates the processed output immutably", () => {
    const inventory = [{ itemId: "ground_espresso", quantity: 2 }] as const;
    const result = processManufacturingStep(inventory, step, station, 2);
    expect(result).toMatchObject({ success: true, durationSec: 4, error: null });
    expect(result.inventory).toEqual([{ itemId: "ground_espresso", quantity: 1 }, { itemId: "espresso_shot", quantity: 1 }]);
    expect(inventory[0].quantity).toBe(2);
  });

  it("rejects missing ingredients and a wrong station", () => {
    expect(processManufacturingStep([], step, station).error).toBe("MISSING_INPUT");
    expect(processManufacturingStep([{ itemId: "ground_espresso", quantity: 1 }], step, { ...station, id: "blender" }).error).toBe("STATION_MISMATCH");
  });
});

