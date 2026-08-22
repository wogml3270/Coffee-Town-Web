import { describe, expect, it } from "vitest";
import { resolveRedirectUrl } from "./authService";

describe("resolveRedirectUrl", () => {
  it("uses the current web origin for production", () => {
    expect(resolveRedirectUrl({ origin: "https://coffee-town-pink.vercel.app", hostname: "coffee-town-pink.vercel.app", nativeApp: false }))
      .toBe("https://coffee-town-pink.vercel.app/auth/callback");
  });

  it("preserves the local development port", () => {
    expect(resolveRedirectUrl({ origin: "http://localhost:5173", hostname: "localhost", nativeApp: false }))
      .toBe("http://localhost:5173/auth/callback");
  });

  it("uses the Coffee Town deep link for the native app", () => {
    expect(resolveRedirectUrl({ origin: "https://unused.example", hostname: "unused.example", nativeApp: true }))
      .toBe("coffeetown://auth/callback");
  });
});
