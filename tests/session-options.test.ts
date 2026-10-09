import { describe, expect, it } from "vitest";
import {
  createSave,
  startFocus,
  startBreak,
  settleTimer,
  pauseFocus,
  resumeFocus,
  parseSave,
  serializeSave,
  getProgress,
  getRewards,
  parseMinutes,
  recommendedBreakMinutes,
  REWARDS,
  type SaveData,
} from "../src/game/state";
import { getWorldClock, WORLD_DAY_MS } from "../src/game/renderer";
const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).getTime();
const start = at(8);
const complete = (save: SaveData, minutes: number, day: number, id: string) =>
  settleTimer(
    startFocus(save, minutes, at(day), id),
    at(day) + minutes * 60000,
  );
describe("custom session choices", () => {
  it.each([1, 30, 90, 720])(
    "saves a %i minute session and awards it once",
    (minutes) => {
      const running = startFocus(createSave(), minutes, start, "custom", 17);
      const loaded = parseSave(serializeSave(running));
      expect(loaded.error).toBeNull();
      const done = settleTimer(loaded.save, start + minutes * 60000);
      expect(done.sessions).toHaveLength(1);
      expect(done.lastCompletion?.breakMinutes).toBe(17);
      expect({ energy: done.energy, xp: done.xp, coins: done.coins }).toEqual(
        getRewards(minutes),
      );
      const saved = parseSave(serializeSave(done));
      expect(saved.error).toBeNull();
      expect(settleTimer(saved.save, start + 1e9)).toBe(saved.save);
    },
  );
  it.each([0, -1, 721, 1.5, NaN, Infinity])(
    "rejects invalid minutes %s",
    (minutes) => {
      const save = createSave();
      expect(startFocus(save, minutes, start, "bad")).toBe(save);
      expect(startBreak(save, minutes, start, "bad")).toBe(save);
      expect(startFocus(save, 25, start, "bad", minutes)).toBe(save);
      expect(parseMinutes(minutes)).toBeNull();
    },
  );
  it("validates typed minutes without coercing empty or fractional values", () => {
    expect(parseMinutes(" 30 ")).toBe(30);
    expect(parseMinutes("720")).toBe(720);
    for (const value of [
      "",
      " ",
      "0",
      "721",
      "1.5",
      "1e2",
      "-5",
      "+5",
      "five",
      null,
      true,
    ])
      expect(parseMinutes(value)).toBeNull();
  });
  it("preserves established rewards and scales custom rewards", () => {
    for (const minutes of [15, 25, 45, 60])
      expect(getRewards(minutes)).toEqual(REWARDS[minutes]);
    expect(getRewards(30)).toEqual({ energy: 30, xp: 31, coins: 15 });
    expect(getRewards(90)).toEqual({ energy: 90, xp: 110, coins: 46 });
  });
  it("preserves custom duration and chosen break through pause and reload", () => {
    let save = pauseFocus(
      startFocus(createSave(), 30, start, "pause-custom", 23),
      start + 120000,
    );
    save = resumeFocus(parseSave(serializeSave(save)).save, at(9));
    expect(save.timer?.endAt).toBe(at(9) + 28 * 60000);
    const done = settleTimer(save, at(9) + 28 * 60000);
    expect(done.lastCompletion?.breakMinutes).toBe(23);
    expect(done.sessions[0].localDate).toBe("2026-10-09");
  });
  it("preserves legacy saves and supplies the original suggested break", () => {
    const legacy = startFocus(createSave(), 45, start, "legacy");
    delete legacy.timer!.breakMinutes;
    const loaded = parseSave(serializeSave(legacy));
    expect(loaded.error).toBeNull();
    const done = settleTimer(loaded.save, start + 45 * 60000);
    expect(done.lastCompletion?.breakMinutes).toBe(8);
    expect(recommendedBreakMinutes(45)).toBe(8);
    expect(parseSave(serializeSave(done)).error).toBeNull();
  });
  it("allows custom short and long rests with no focus credit", () => {
    for (const minutes of [2, 17, 720]) {
      const earned = complete(createSave(), 30, 8, "earned");
      const running = startBreak(earned, minutes, start + 30 * 60000, "rest");
      const loaded = parseSave(serializeSave(running));
      expect(loaded.error).toBeNull();
      const done = settleTimer(loaded.save, start + (30 + minutes) * 60000);
      expect(done.timer).toBeNull();
      expect(done.sessions).toEqual(earned.sessions);
      expect(done.coins).toBe(earned.coins);
    }
  });
  it("blocks damaged custom break selections and reward records", () => {
    const running = startFocus(createSave(), 30, start, "damaged", 17);
    expect(
      parseSave(
        JSON.stringify({
          ...running,
          timer: { ...running.timer, breakMinutes: 0 },
        }),
      ).error,
    ).toBeTruthy();
    const done = settleTimer(running, start + 30 * 60000);
    expect(
      parseSave(
        JSON.stringify({
          ...done,
          lastCompletion: {
            ...done.lastCompletion,
            rewards: { energy: 30, xp: 31, coins: 999 },
          },
        }),
      ).error,
    ).toBeTruthy();
  });
});
describe("calendar streaks", () => {
  it("combines short sessions and keeps yesterday active while today is below goal", () => {
    let save = complete(createSave(), 25, 7, "yesterday");
    save = complete(save, 10, 8, "today-a");
    save = complete(save, 14, 8, "today-b");
    expect(getProgress(save, at(8, 12))).toMatchObject({
      currentStreak: 1,
      todayMinutes: 24,
      dailyGoalMinutes: 25,
    });
    expect(getProgress(save, at(8, 12)).weekActivity.at(-1)).toEqual({
      date: "2026-10-08",
      minutes: 24,
      goalMet: false,
      isToday: true,
    });
    save = complete(save, 1, 8, "today-c");
    expect(getProgress(save, at(8, 12)).currentStreak).toBe(2);
  });
  it("keeps best history after a gap and excludes future days from the streak", () => {
    let save = createSave();
    for (const day of [4, 5, 6, 8, 10])
      save = complete(save, 25, day, "day-" + day);
    expect(getProgress(save, at(8, 12))).toMatchObject({
      currentStreak: 1,
      bestStreak: 3,
    });
    expect(getProgress(save, at(9, 12)).currentStreak).toBe(1);
    expect(getProgress(save, at(12, 12)).currentStreak).toBe(0);
  });
  it("includes empty calendar days in order across the year boundary", () => {
    const timestamp = new Date(2026, 11, 31, 10).getTime();
    const save = settleTimer(
      startFocus(createSave(), 25, timestamp, "year-end"),
      timestamp + 25 * 60000,
    );
    const week = getProgress(
      save,
      new Date(2027, 0, 2, 10).getTime(),
    ).weekActivity;
    expect(week.map((day) => day.date)).toEqual([
      "2026-12-27",
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
    expect(week.map((day) => day.minutes)).toEqual([0, 0, 0, 0, 25, 0, 0]);
  });
});
describe("world clock", () => {
  it("cycles through daylight, dusk and night and repeats after twelve minutes", () => {
    expect(getWorldClock(0)).toMatchObject({
      hour: 8,
      minute: 0,
      label: "Day",
    });
    expect(getWorldClock(300000)).toMatchObject({ hour: 18, label: "Dusk" });
    expect(getWorldClock(360000)).toMatchObject({ hour: 20, label: "Night" });
    expect(getWorldClock(WORLD_DAY_MS)).toEqual(getWorldClock(0));
  });
  it("keeps clock values in range for negative and invalid timestamps", () => {
    for (const timestamp of [-1, NaN, Infinity, Date.now()]) {
      const clock = getWorldClock(timestamp);
      expect(Number.isInteger(clock.hour)).toBe(true);
      expect(clock.hour).toBeGreaterThanOrEqual(0);
      expect(clock.hour).toBeLessThan(24);
      expect(clock.minute).toBeGreaterThanOrEqual(0);
      expect(clock.minute).toBeLessThan(60);
      expect(clock.daylight).toBeGreaterThanOrEqual(0);
      expect(clock.daylight).toBeLessThanOrEqual(1);
    }
  });
});
