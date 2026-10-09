import { describe, expect, it } from "vitest";
import {
  beginCycle,
  createSave,
  cycleBreak,
  nextCycleFocus,
  parseSave,
  pauseTimer,
  resumeTimer,
  settleTimer,
  skipCycleBreak,
  startBreak,
  startFocus,
  validCycle,
} from "../src/game/state";
const now = Date.UTC(2026, 9, 9, 8),
  config = { focus: 1, short: 1, long: 2, rounds: 2, autoBreak: false };
const reload = (s: ReturnType<typeof createSave>) => {
  const parsed = parseSave(JSON.stringify(s));
  expect(parsed.error).toBeNull();
  return parsed.save;
};
describe("Pomodoro plans", () => {
  it("keeps completed rounds, waits for explicit focus, and uses a final long break", () => {
    let s = beginCycle(createSave(), config, now, "first");
    s = reload(settleTimer(s, now + 60000));
    expect(s.cycle).toMatchObject({ completed: 1, next: "break" });
    expect(s.timer).toBeNull();
    s = cycleBreak(s, now + 60000, "rest");
    expect(s.timer).toMatchObject({ breakType: "short", durationMinutes: 1 });
    s = reload(settleTimer(s, now + 120000));
    expect(s.cycle?.next).toBe("focus");
    expect(s.timer).toBeNull();
    s = nextCycleFocus(s, now + 360000, "second");
    s = settleTimer(s, now + 420000);
    expect(s.cycle).toMatchObject({ completed: 2, next: "break" });
    expect(s.lastCompletion?.breakMinutes).toBe(2);
    s = cycleBreak(s, now + 420000, "long-rest");
    expect(s.timer).toMatchObject({ breakType: "long", durationMinutes: 2 });
    s = reload(settleTimer(s, now + 540000));
    expect(s.cycle?.next).toBe("done");
    expect(s.sessions).toHaveLength(2);
    expect(nextCycleFocus(s, now + 600000, "extra")).toBe(s);
  });
  it("starts only the break automatically and settles rewards once after a long absence", () => {
    const started = beginCycle(
      createSave(),
      { ...config, autoBreak: true },
      now,
      "work",
    );
    let s = reload(settleTimer(started, now + 86400000));
    expect(s.sessions).toHaveLength(1);
    expect(s.timer?.startedAt).toBe(now + 86400000);
    expect(s.timer?.kind).toBe("break");
    s = reload(settleTimer(s, now + 86500000));
    expect(s.timer).toBeNull();
    expect(s.cycle?.next).toBe("focus");
    expect(s.sessions).toHaveLength(1);
    expect(settleTimer(s, now + 9e8)).toBe(s);
  });
  it("pauses a break across reload without earning rewards or losing its type", () => {
    let s = startBreak(createSave(), 1, now, "long", "long");
    s = reload(pauseTimer(s, now + 15000));
    expect(s.timer).toMatchObject({
      status: "paused",
      remainingMs: 45000,
      breakType: "long",
    });
    s = reload(resumeTimer(s, now + 86400000));
    expect(s.timer?.endAt).toBe(now + 86445000);
    expect(settleTimer(s, now + 86445000).sessions).toHaveLength(0);
  });
  it("skips a rest without inventing a completed focus interval", () => {
    let s = settleTimer(
      beginCycle(createSave(), config, now, "a"),
      now + 60000,
    );
    s = skipCycleBreak(s);
    expect(s.cycle?.next).toBe("focus");
    expect(s.sessions).toHaveLength(1);
    expect(s.timer).toBeNull();
  });
  it("keeps legacy saves and rejects malformed plan enums and durations", () => {
    expect(reload(createSave()).cycle).toBeUndefined();
    for (const patch of [
      { next: ["focus"] },
      { focus: 0 },
      { rounds: 1.5 },
      { completed: 3 },
      { autoBreak: "yes" },
    ]) {
      const cycle = { ...config, completed: 0, next: "focus", ...patch };
      expect(validCycle(cycle)).toBe(false);
      expect(
        parseSave(JSON.stringify({ ...createSave(), cycle })).error,
      ).toBeTruthy();
    }
  });
  it("does not overwrite a running session with another plan", () => {
    const s = startFocus(createSave(), 25, now, "active");
    expect(beginCycle(s, config, now, "new")).toBe(s);
  });
  it("avoids automatic break IDs already used by a valid imported session", () => {
    let s = settleTimer(
      startFocus(createSave(), 1, now, "rest_work"),
      now + 60000,
    );
    s = beginCycle(s, { ...config, autoBreak: true }, now + 120000, "work");
    s = settleTimer(s, now + 180000);
    expect(s.timer?.id).not.toBe("rest_work");
    expect(reload(s).sessions).toHaveLength(2);
  });
});
