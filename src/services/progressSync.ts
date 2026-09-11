import type { CloudProgress } from "./progressService";
import type { ShiftReceipt, ShiftSession } from "../game/shiftProtocol";
import type { UpgradeId } from "../game/upgradeTree";

export type SyncState = Readonly<{ status: "loading" | "ready" | "saving" | "error"; message: string }>;
export type ProgressApi = Readonly<{
  load: (userId: string) => Promise<CloudProgress>;
  begin: (stage: number) => Promise<ShiftSession>;
  settle: (receipt: ShiftReceipt) => Promise<void>;
  purchase: (id: UpgradeId) => Promise<unknown>;
}>;
export type ReceiptStorage = Readonly<{
  read: (userId: string) => readonly ShiftReceipt[];
  put: (userId: string, receipt: ShiftReceipt) => void;
  remove: (userId: string, sessionId: string) => void;
}>;

// A single coordinator serializes cloud mutations. Account generations prevent late
// responses from an old session replacing the current account's in-memory progress.
export class ProgressSync {
  private generation = 0;
  private userId: string | null = null;
  private operation: (() => Promise<void>) | null = null;
  private state: SyncState = { status: "loading", message: "로그인 상태를 확인하고 있습니다" };
  private unpersisted: { userId: string; receipt: ShiftReceipt } | null = null;
  constructor(
    private readonly api: ProgressApi,
    private readonly storage: ReceiptStorage,
    private readonly apply: (progress: CloudProgress) => void,
    private readonly notify: (state: SyncState) => void,
  ) {}
  private update(status: SyncState["status"], message = "") {
    this.state = { status, message };
    this.notify(this.state);
  }
  private current(userId: string, generation: number) {
    return this.userId === userId && this.generation === generation;
  }
  get ready() {
    return this.state.status === "ready";
  }
  get snapshot() {
    return this.state;
  }
  cancel() {
    this.generation++;
    this.userId = null;
    this.operation = null;
  }

  async connect(userId: string | null) {
    const generation = ++this.generation;
    this.userId = userId;
    this.operation = null;
    if (!userId) {
      this.update("ready");
      return;
    }
    const run = async () => {
      if (!this.current(userId, generation)) return;
      this.update("loading", "계정 진행도를 불러오고 있습니다");
      try {
        const progress = await this.api.load(userId);
        if (!this.current(userId, generation)) return;
        this.apply(progress);
        this.operation = null;
        this.update("ready");
        // A stale or temporarily unavailable settlement endpoint must not prevent
        // the account's existing progress from loading. Keep the receipt queued.
        try {
          await this.flush(userId, generation);
          if (!this.current(userId, generation)) return;
          const refreshed = await this.api.load(userId);
          if (this.current(userId, generation)) this.apply(refreshed);
        } catch {
          if (this.current(userId, generation))
            this.update("ready", "미전송 영업 기록은 연결이 복구되면 다시 저장합니다.");
        }
      } catch {
        if (this.current(userId, generation))
          this.update("error", "진행도를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.");
      }
    };
    this.operation = run;
    await run();
  }
  private async flush(userId: string, generation: number) {
    if (this.unpersisted?.userId === userId) {
      this.storage.put(userId, this.unpersisted.receipt);
      this.unpersisted = null;
    }
    for (const receipt of this.storage.read(userId)) {
      if (!this.current(userId, generation)) return;
      await this.api.settle(receipt);
      // Removing the old account's acknowledged receipt is safe; applying its data isn't.
      this.storage.remove(userId, receipt.sessionId);
    }
  }
  async begin(stage: number): Promise<ShiftSession | null> {
    if (!this.userId || !this.ready) return null;
    const userId = this.userId,
      generation = this.generation;
    this.update("saving", "영업을 준비하고 있습니다");
    try {
      const session = await this.api.begin(stage);
      if (!this.current(userId, generation)) return null;
      this.update("ready");
      return session;
    } catch {
      if (this.current(userId, generation))
        this.update("ready", "영업을 시작하지 못했습니다. 다시 시도하세요.");
      return null;
    }
  }
  async settle(receipt: ShiftReceipt) {
    if (!this.userId || !this.ready) return;
    const userId = this.userId,
      generation = this.generation;
    this.unpersisted = { userId, receipt };
    const run = async () => {
      if (!this.current(userId, generation)) return;
      this.update("saving", "오늘의 영업 기록을 저장하고 있습니다");
      try {
        await this.flush(userId, generation);
        const progress = await this.api.load(userId);
        if (!this.current(userId, generation)) return;
        this.apply(progress);
        this.operation = null;
        this.update("ready");
      } catch (reason) {
        if (this.current(userId, generation)) {
          const message =
            reason instanceof Error && reason.message === "SETTLEMENT_FUNCTION_NOT_DEPLOYED"
              ? "정산 서버가 아직 배포되지 않았습니다. 관리자에게 Edge Function 배포를 요청하세요."
              : "영업 기록을 저장하지 못했습니다. 다시 시도하면 이어서 저장합니다.";
          this.update("error", message);
        }
      }
    };
    this.operation = run;
    await run();
  }
  async purchase(id: UpgradeId) {
    if (!this.userId || !this.ready) return;
    const userId = this.userId,
      generation = this.generation;
    this.update("saving", "업그레이드를 구매하고 있습니다");
    let message = "";
    try {
      await this.api.purchase(id);
    } catch {
      message = "구매 결과를 확인했습니다. 골드와 선행 조건을 확인한 뒤 다시 시도하세요.";
    }
    if (!this.current(userId, generation)) return;
    // A lost purchase response is ambiguous: reload, never blindly repeat a debit.
    await this.connect(userId);
    if (this.userId === userId && this.ready && message) this.update("ready", message);
  }
  async retry() {
    if (this.state.status === "error") await this.operation?.();
  }
}
