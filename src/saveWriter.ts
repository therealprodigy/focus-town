// Messages request a handoff. Only the browser's Web Lock grants write access.
export type WriterState =
  | "opening"
  | "owned"
  | "waiting"
  | "switching"
  | "yielded"
  | "stalled"
  | "unavailable";
export interface WriterChannel {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(data: unknown): void;
  close(): void;
}
type Claim = { type: "request-writer"; tab: string; stamp: number };
type Options = {
  request: (signal: AbortSignal, hold: () => Promise<void>) => Promise<unknown>;
  channel: WriterChannel | null;
  id: string;
  now?: () => number;
  onOwnership: (owned: boolean) => void;
  onState: (state: WriterState) => void;
};
function isClaim(value: unknown): value is Claim {
  if (!value || typeof value !== "object") return false;
  const claim = value as Partial<Claim>;
  return (
    claim.type === "request-writer" &&
    typeof claim.tab === "string" &&
    claim.tab.length > 0 &&
    claim.tab.length <= 100 &&
    Number.isSafeInteger(claim.stamp) &&
    claim.stamp! >= 0
  );
}
const newer = (a: Claim, b: Claim) =>
  a.stamp > b.stamp || (a.stamp === b.stamp && a.tab > b.tab);
export function createSaveWriter(options: Options) {
  let alive = true,
    owned = false,
    generation = 0;
  let controller: AbortController | undefined;
  let release: (() => void) | undefined;
  let hint: ReturnType<typeof setTimeout> | undefined;
  let stalled: ReturnType<typeof setTimeout> | undefined;
  let latest: Claim = { type: "request-writer", tab: "", stamp: 0 };
  const clearTimers = () => {
    clearTimeout(hint);
    clearTimeout(stalled);
  };
  const revoke = () => {
    // Ref guards change before another tab can acquire the browser lock.
    ++generation;
    owned = false;
    options.onOwnership(false);
    clearTimers();
    controller?.abort();
    controller = undefined;
    const finish = release;
    release = undefined;
    finish?.();
  };
  const queue = (explicit: boolean) => {
    revoke();
    const version = generation;
    controller = new AbortController();
    const signal = controller.signal;
    const current = () => alive && version === generation && !signal.aborted;
    options.onState(explicit ? "switching" : "opening");
    if (explicit)
      stalled = setTimeout(() => {
        if (current() && !owned) options.onState("stalled");
      }, 3000);
    else
      hint = setTimeout(() => {
        if (current() && !owned) options.onState("waiting");
      }, 500);
    const hold = async () => {
      if (!current()) return;
      clearTimers();
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      // Reload the persisted save before allowing the new tab to write.
      options.onOwnership(true);
      owned = true;
      options.onState("owned");
      await held;
    };
    try {
      void options.request(signal, hold).catch(() => {
        if (!current()) return;
        revoke();
        options.onState("unavailable");
      });
    } catch {
      if (current()) {
        revoke();
        options.onState("unavailable");
      }
    }
  };
  if (options.channel)
    options.channel.onmessage = ({ data }) => {
      if (
        !alive ||
        !isClaim(data) ||
        data.tab === options.id ||
        !newer(data, latest)
      )
        return;
      latest = data;
      revoke();
      options.onState("yielded");
      // Wait for a human click. Requeueing here would take the save back.
    };
  queue(false);
  return {
    claim() {
      if (!alive || owned) return;
      latest = {
        type: "request-writer",
        tab: options.id,
        stamp: Math.max((options.now ?? Date.now)(), latest.stamp + 1),
      };
      queue(true);
      try {
        options.channel?.postMessage(latest);
      } catch {
        // Still safely queued: closing an older tab will release its lock.
      }
    },
    dispose() {
      if (!alive) return;
      alive = false;
      revoke();
      if (options.channel) {
        options.channel.onmessage = null;
        options.channel.close();
      }
    },
  };
}
export const WRITER_MESSAGES: Record<WriterState, string> = {
  opening: "",
  owned: "",
  waiting: "Your save is active in another tab. Continue here instead?",
  switching: "Switching your save to this tab...",
  yielded: "Your save moved to another tab. You can switch it back here.",
  stalled:
    "The other tab has not responded. Close other Focus Town tabs; this one will open your save automatically.",
  unavailable:
    "Could not open the save for editing. Try again or reload this page.",
};
