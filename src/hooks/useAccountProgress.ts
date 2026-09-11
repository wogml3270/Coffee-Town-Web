import { useEffect, useRef, useState } from "react";
import { getCurrentProfile, subscribeToAuth, type PlayerProfile } from "../services/authService";
import { loadProgress } from "../services/progressService";
import { purchaseUpgrade } from "../services/upgradeService";
import { beginShiftSession, settleShiftSession } from "../services/sessionService";
import { ProgressSync, type SyncState } from "../services/progressSync";
import { receiptStorage } from "../game/receiptStorage";
import { setGuestPersistenceEnabled } from "../game/progressPersistence";
import { setProgressGateway, useGame } from "../game/store";

export const useAccountProgress = () => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [sync, setSync] = useState<SyncState>({
    status: "loading",
    message: "로그인 상태를 확인하고 있습니다",
  });
  const [authError, setAuthError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const retryAuth = useRef<() => void>(() => {});
  const coordinator = useRef<ProgressSync | null>(null);
  useEffect(() => {
    let active = true;
    let authGeneration = 0;
    let account: string | null | undefined;
    let firstLoad = true;
    const controller = new ProgressSync(
      { load: loadProgress, begin: beginShiftSession, settle: settleShiftSession, purchase: purchaseUpgrade },
      receiptStorage,
      (progress) => {
        const game = useGame.getState();
        if (firstLoad)
          game.replaceProgress(
            progress.gold,
            progress.unlockedStage,
            progress.upgrades,
            progress.discoveredRecipes,
            progress.seenMenuStages,
          );
        else
          game.hydrateProgress(
            progress.gold,
            progress.unlockedStage,
            progress.upgrades,
            progress.discoveredRecipes,
            progress.seenMenuStages,
          );
        firstLoad = false;
        setLoaded(true);
      },
      (next) => {
        if (active) setSync(next);
      },
    );
    coordinator.current = controller;
    const applyProfile = (next: PlayerProfile | null) => {
      if (!active) return;
      setAuthError(false);
      setProfile(next);
      const id = next?.userId ?? null;
      if (account === id) {
        setSync(controller.snapshot);
        return;
      }
      const previous = account;
      account = id;
      firstLoad = true;
      setLoaded(!id);
      // Disable persistence before clearing an old account's state.
      if (previous !== undefined || id) {
        setGuestPersistenceEnabled(false);
        useGame.getState().resetGuestProgress();
      }
      setGuestPersistenceEnabled(!id);
      setProgressGateway(
        id
          ? {
              ready: () => controller.ready,
              begin: (stage) => controller.begin(stage),
              settle: (receipt) => controller.settle(receipt),
              purchase: (upgrade) => controller.purchase(upgrade),
            }
          : null,
      );
      void controller.connect(id);
    };
    const fail = () => {
      if (active) {
        setAuthError(true);
        setSync({ status: "error", message: "로그인 상태를 확인하지 못했습니다. 다시 시도하세요." });
      }
    };
    const readAuth = () => {
      const generation = ++authGeneration;
      setSync({ status: "loading", message: "로그인 상태를 확인하고 있습니다" });
      void getCurrentProfile()
        .then((next) => {
          if (generation === authGeneration) applyProfile(next);
        })
        .catch(() => {
          if (generation === authGeneration) fail();
        });
    };
    retryAuth.current = readAuth;
    const unsubscribe = subscribeToAuth((next) => {
      authGeneration++;
      applyProfile(next);
    }, fail);
    readAuth();
    return () => {
      active = false;
      authGeneration++;
      controller.cancel();
      unsubscribe();
      setProgressGateway(null);
    };
  }, []);
  useEffect(() => {
    const retry = () => {
      if (authError) retryAuth.current();
      else void coordinator.current?.retry();
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [authError]);
  return {
    profile,
    sync,
    blocked: !loaded || authError,
    retry: () => {
      if (authError) retryAuth.current();
      else void coordinator.current?.retry();
    },
  };
};
