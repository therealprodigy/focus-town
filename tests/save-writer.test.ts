import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSaveWriter,
  type WriterChannel,
  type WriterState,
} from "../src/saveWriter";
import {
  createSave,
  parseSave,
  serializeSave,
  startFocus,
  settleTimer,
  type SaveData,
} from "../src/game/state";

// A granted Web Lock ignores AbortSignal. Only resolving hold() releases it.
function fakeLocks() {
  type Ticket = {
    signal: AbortSignal;
    hold: () => Promise<void>;
    resolve: () => void;
    reject: (e: unknown) => void;
    abort: () => void;
  };
  const queue: Ticket[] = [];
  let held = false;
  const request = (signal: AbortSignal, hold: () => Promise<void>) =>
    new Promise<void>((resolve, reject) => {
      const t: Ticket = {
        signal,
        hold,
        resolve,
        reject,
        abort() {
          const i = queue.indexOf(t);
          if (i < 0) return;
          queue.splice(i, 1);
          reject(new DOMException("Aborted", "AbortError"));
        },
      };
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      queue.push(t);
      signal.addEventListener("abort", t.abort, { once: true });
    });
  return {
    request,
    grant() {
      if (held || !queue.length) return false;
      const t = queue.shift()!;
      t.signal.removeEventListener("abort", t.abort);
      held = true;
      void Promise.resolve()
        .then(t.hold)
        .then(t.resolve, t.reject)
        .finally(() => {
          held = false;
        });
      return true;
    },
    pending: () => queue.length,
    held: () => held,
  };
}
function fakeBroadcast() {
  const endpoints: Array<WriterChannel & { closed: boolean }> = [];
  const deliveries: Array<() => void> = [];
  return {
    channel() {
      const self: WriterChannel & { closed: boolean } = {
        closed: false,
        onmessage: null,
        postMessage(data) {
          if (self.closed) throw new Error("Closed");
          for (const peer of endpoints)
            if (peer !== self && !peer.closed) {
              const copy = structuredClone(data);
              deliveries.push(() => {
                if (!peer.closed) peer.onmessage?.({ data: copy });
              });
            }
        },
        close() {
          self.closed = true;
          self.onmessage = null;
        },
      };
      endpoints.push(self);
      return self;
    },
    flush(reverse = false) {
      while (deliveries.length)
        (reverse ? deliveries.pop()! : deliveries.shift()!)();
    },
  };
}
const microtasks = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const cleanups: Array<() => void> = [];
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  cleanups.splice(0).forEach((f) => f());
  await microtasks();
  vi.useRealTimers();
});
function setup() {
  const locks = fakeLocks(),
    bus = fakeBroadcast();
  let disk = serializeSave(createSave());
  const tabs: Array<{ owned: boolean }> = [];
  function tab(
    id: string,
    messages: "normal" | "missing" | "throwing" = "normal",
  ) {
    const t = {
      owned: false,
      state: "opening" as WriterState,
      save: createSave(),
      history: [] as WriterState[],
    };
    tabs.push(t);
    const channel = messages === "missing" ? null : bus.channel();
    if (messages === "throwing" && channel)
      channel.postMessage = () => {
        throw new Error("Blocked");
      };
    const writer = createSaveWriter({
      id,
      now: () => 1000,
      request: locks.request,
      channel,
      onOwnership(owned) {
        if (owned) t.save = parseSave(disk).save;
        t.owned = owned;
        expect(tabs.filter((v) => v.owned).length).toBeLessThanOrEqual(1);
      },
      onState(state) {
        t.state = state;
        t.history.push(state);
      },
    });
    cleanups.push(writer.dispose);
    return {
      ...writer,
      data: t,
      channel,
      write(change: (s: SaveData) => SaveData) {
        if (!t.owned) return false;
        t.save = change(t.save);
        disk = serializeSave(t.save);
        return true;
      },
    };
  }
  return { locks, bus, tab, disk: () => parseSave(disk).save };
}
describe("save ownership across tabs", () => {
  it("opens the sole tab without flashing a conflict message", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    await vi.advanceTimersByTimeAsync(4000);
    expect(a.data.owned).toBe(true);
    expect(a.data.history).toEqual(["opening", "owned"]);
  });
  it("revokes old writes synchronously, reloads the exact timer and awards completion once", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    const at = new Date(2026, 9, 10, 10).getTime();
    a.write((s) => startFocus({ ...s, coins: 7 }, 25, at, "transfer"));
    const saved = h.disk();
    const b = h.tab("b");
    b.claim();
    h.bus.flush();
    expect(a.data.owned).toBe(false);
    expect(a.write((s) => ({ ...s, coins: 999 }))).toBe(false);
    expect(b.data.owned).toBe(false);
    await microtasks();
    h.locks.grant();
    await microtasks();
    expect(b.data.save).toEqual(saved);
    b.write((s) => settleTimer(s, at + 25 * 60000));
    a.claim();
    h.bus.flush();
    await microtasks();
    h.locks.grant();
    await microtasks();
    a.write((s) => settleTimer(s, at + 60 * 60000));
    expect(h.disk().sessions).toHaveLength(1);
    expect(h.disk().coins).toBe(19);
  });
  it("cancels a third tab queued ahead of the requested tab", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    const c = h.tab("c"),
      b = h.tab("b");
    b.claim();
    h.bus.flush();
    await microtasks();
    expect(h.locks.pending()).toBe(1);
    expect(c.data.state).toBe("yielded");
    h.locks.grant();
    await microtasks();
    expect(b.data.owned).toBe(true);
    expect(a.data.owned).toBe(false);
    await vi.advanceTimersByTimeAsync(4000);
    expect(c.data.state).toBe("yielded");
  });
  it.each([false, true])(
    "converges simultaneous equal-time claims, reverse delivery=%s",
    async (reverse) => {
      const h = setup(),
        a = h.tab("a");
      h.locks.grant();
      await microtasks();
      const b = h.tab("b"),
        c = h.tab("c");
      b.claim();
      c.claim();
      h.bus.flush(reverse);
      await microtasks();
      h.locks.grant();
      await microtasks();
      expect(c.data.owned).toBe(true);
      expect(b.data.state).toBe("yielded");
      c.channel?.onmessage?.({
        data: { type: "request-writer", tab: "b", stamp: 1000 },
      });
      expect(c.data.owned).toBe(true);
      expect(a.data.owned).toBe(false);
    },
  );
  it("automatically opens a waiting tab when the owner closes", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    const b = h.tab("b");
    await vi.advanceTimersByTimeAsync(600);
    expect(b.data.state).toBe("waiting");
    a.dispose();
    await microtasks();
    h.locks.grant();
    await microtasks();
    expect(b.data.state).toBe("owned");
  });
  it("survives StrictMode cleanup before a granted callback starts", async () => {
    const h = setup(),
      old = h.tab("old");
    h.locks.grant();
    old.dispose();
    const fresh = h.tab("fresh");
    await microtasks();
    h.locks.grant();
    await microtasks();
    expect(old.data.owned).toBe(false);
    expect(old.data.history).not.toContain("owned");
    expect(fresh.data.owned).toBe(true);
  });
  it("lets a tab request again after the chosen claimant disappears", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    const b = h.tab("b");
    b.claim();
    h.bus.flush();
    b.dispose();
    await microtasks();
    expect(h.locks.pending()).toBe(0);
    a.claim();
    h.bus.flush();
    h.locks.grant();
    await microtasks();
    expect(a.data.owned).toBe(true);
  });
  it.each(["missing", "throwing"] as const)(
    "keeps the lock safe when messaging is %s",
    async (mode) => {
      const h = setup(),
        old = h.tab("old", "missing");
      h.locks.grant();
      await microtasks();
      const b = h.tab("b", mode);
      b.claim();
      h.bus.flush();
      await vi.advanceTimersByTimeAsync(3100);
      expect(b.data.state).toBe("stalled");
      expect(old.data.owned).toBe(true);
      expect(b.data.owned).toBe(false);
      old.dispose();
      await microtasks();
      h.locks.grant();
      await microtasks();
      expect(b.data.owned).toBe(true);
    },
  );
  it("ignores malformed messages", async () => {
    const h = setup(),
      a = h.tab("a");
    h.locks.grant();
    await microtasks();
    for (const data of [
      null,
      {},
      { type: "request-writer", tab: "b", stamp: NaN },
      { type: "request-writer", tab: "b", stamp: -1 },
    ])
      a.channel?.onmessage?.({ data });
    expect(a.data.owned).toBe(true);
  });
  it("reports a failed lock request without allowing writes", async () => {
    let owned = false,
      state: WriterState = "opening";
    const writer = createSaveWriter({
      id: "a",
      channel: null,
      request: () => Promise.reject(new Error("Unavailable")),
      onOwnership: (v) => {
        owned = v;
      },
      onState: (v) => {
        state = v;
      },
    });
    cleanups.push(writer.dispose);
    await microtasks();
    expect(state).toBe("unavailable");
    expect(owned).toBe(false);
  });
});
