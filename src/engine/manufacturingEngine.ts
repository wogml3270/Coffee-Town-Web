import type { InventoryStack, ManufacturingStep, StationDefinition } from "../types/game";

export type ProcessResult = Readonly<{
  success: boolean;
  inventory: readonly InventoryStack[];
  durationSec: number;
  error: "STATION_MISMATCH" | "MISSING_INPUT" | null;
}>;

const quantityOf = (inventory: readonly InventoryStack[], itemId: string): number =>
  inventory.find((stack) => stack.itemId === itemId)?.quantity ?? 0;

const hasInputs = (inventory: readonly InventoryStack[], step: ManufacturingStep): boolean =>
  step.inputs.every((input) => quantityOf(inventory, input.itemId) >= input.quantity);

const consumeInputs = (
  inventory: readonly InventoryStack[],
  step: ManufacturingStep,
): readonly InventoryStack[] => inventory
  .map((stack) => {
    const used = step.inputs.find((input) => input.itemId === stack.itemId)?.quantity ?? 0;
    return { ...stack, quantity: stack.quantity - used };
  })
  .filter((stack) => stack.quantity > 0);

const addOutput = (inventory: readonly InventoryStack[], itemId: string): readonly InventoryStack[] => {
  const exists = inventory.some((stack) => stack.itemId === itemId);
  return exists
    ? inventory.map((stack) => stack.itemId === itemId ? { ...stack, quantity: stack.quantity + 1 } : stack)
    : [...inventory, { itemId, quantity: 1 }];
};

export const processManufacturingStep = (
  inventory: readonly InventoryStack[],
  step: ManufacturingStep,
  station: StationDefinition,
  speedMultiplier = 1,
): ProcessResult => {
  if (station.id !== step.stationId || station.processType !== step.process) {
    return { success: false, inventory, durationSec: 0, error: "STATION_MISMATCH" };
  }
  if (!hasInputs(inventory, step)) {
    return { success: false, inventory, durationSec: 0, error: "MISSING_INPUT" };
  }
  const consumed = consumeInputs(inventory, step);
  return {
    success: true,
    inventory: addOutput(consumed, step.outputItemId),
    durationSec: Math.max(1, Math.ceil(step.durationSec / Math.max(0.1, speedMultiplier))),
    error: null,
  };
};

