export const guestProgressStorageKey = "coffee-town-local-progress";

let guestPersistenceEnabled = true;

export const guestProgressStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    if (guestPersistenceEnabled) localStorage.setItem(name, value);
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const setGuestPersistenceEnabled = (enabled: boolean) => {
  guestPersistenceEnabled = enabled;
  if (!enabled) localStorage.removeItem(guestProgressStorageKey);
};

export const clearGuestProgress = () => localStorage.removeItem(guestProgressStorageKey);
