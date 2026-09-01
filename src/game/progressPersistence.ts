export const guestProgressStorageKey = "coffee-town-local-progress";

let guestPersistenceEnabled = true;
const browserStorage = () =>
  typeof globalThis.localStorage?.getItem === "function" &&
  typeof globalThis.localStorage?.setItem === "function" &&
  typeof globalThis.localStorage?.removeItem === "function"
    ? globalThis.localStorage
    : null;

export const guestProgressStorage = {
  getItem: (name: string) => browserStorage()?.getItem(name) ?? null,
  setItem: (name: string, value: string) => {
    if (guestPersistenceEnabled) browserStorage()?.setItem(name, value);
  },
  removeItem: (name: string) => browserStorage()?.removeItem(name),
};

export const setGuestPersistenceEnabled = (enabled: boolean) => {
  guestPersistenceEnabled = enabled;
  if (!enabled) browserStorage()?.removeItem(guestProgressStorageKey);
};

export const clearGuestProgress = () => browserStorage()?.removeItem(guestProgressStorageKey);
