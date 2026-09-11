import type { ReceiptStorage } from "../services/progressSync";
import type { ShiftReceipt } from "./shiftProtocol";

const prefix = "coffee-town-pending-shift-v1:";
const read = (userId: string): readonly ShiftReceipt[] => {
  const raw = localStorage.getItem(prefix + userId);
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry.sessionId !== "string" || !Array.isArray(entry.actions))) throw new Error("INVALID_PENDING_PROGRESS");
  return value as ShiftReceipt[];
};
export const receiptStorage: ReceiptStorage = {
  read,
  put: (userId, receipt) => {
    const entries = read(userId);
    if (!entries.some(({ sessionId }) => sessionId === receipt.sessionId)) localStorage.setItem(prefix + userId, JSON.stringify([...entries, receipt]));
  },
  remove: (userId, sessionId) => {
    const entries = read(userId).filter((entry) => entry.sessionId !== sessionId);
    if (entries.length) localStorage.setItem(prefix + userId, JSON.stringify(entries));
    else localStorage.removeItem(prefix + userId);
  },
};
