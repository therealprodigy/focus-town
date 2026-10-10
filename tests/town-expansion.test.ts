import { describe, expect, it } from "vitest";
import {
  createSave,
  parseSave,
  serializeSave,
  startFocus,
  startBreak,
  pauseFocus,
  resumeFocus,
  pauseTimer,
  resumeTimer,
  settleTimer,
  cancelTimer,
  purchaseCoffee,
  coffeeActive,
  rewardsWithCoffee,
  getRewards,
  localDateKey,
  COFFEE_DURATION,
  type SaveData,
} from "../src/game/state";
import {
  purchaseUpgrade,
  settleStreakRewards,
  applySharedGrant,
  claimMission,
} from "../src/game/townProgress";
import { validAppearance, motivationLine } from "../src/game/personalization";
import {
  getWorldScene,
  canStand,
  getNearbyInteraction,
  WORLDS,
} from "../src/game/world";
import { getWorldClock, WORLD_DAY_MS } from "../src/game/renderer";
import { movePlayer } from "../src/game/engine";
const M = 60000,
  now = new Date(2026, 9, 10, 12).getTime();
const funded = (): SaveData => ({ ...createSave(), coins: 100, energy: 100 });
const drink = () => purchaseCoffee(funded(), now);
const load = (save: SaveData) => {
  const parsed = parseSave(serializeSave(save));
  expect(parsed.error).toBeNull();
  expect(parsed.save).toEqual(save);
  return parsed.save;
};
const streak = (days: number): SaveData => ({
  ...createSave(),
  sessions: Array.from({ length: days }, (_, i) => {
    const at = new Date(2026, 9, 10 - i, 12).getTime();
    return {
      id: "day_" + i,
      minutes: 25,
      completedAt: at,
      localDate: localDateKey(at),
    };
  }),
});
const repaired = () => {
  let s = funded();
  for (const id of ["crossing-cleared", "crossing-boards", "crossing-lanterns"])
    s = purchaseUpgrade(s, id, now);
  return s;
};
describe("saved personalization", () => {
  it("loads old saves and completions without metadata", () => {
    load(createSave());
    const s = settleTimer(
      startFocus(createSave(), 25, now, "legacy"),
      now + 25 * M,
    );
    delete s.lastCompletion!.coffeeFocusMs;
    load(s);
  });
  it("round trips appearance, lighting and motivation", () => {
    load({
      ...createSave(),
      appearance: { outfit: 5, skin: 3, hat: "none" },
      lighting: "local",
      motivation: "direct",
    });
  });
  it("rejects invalid presets instead of accepting arbitrary colors", () => {
    for (const appearance of [
      null,
      [],
      { outfit: -1, skin: 0, hat: "cap" },
      { outfit: 6, skin: 0, hat: "cap" },
      { outfit: 0, skin: 4, hat: "cap" },
      { outfit: 0.5, skin: 0, hat: "cap" },
      { outfit: 0, skin: 0, hat: "unknown" },
    ]) {
      expect(validAppearance(appearance)).toBe(false);
      expect(
        parseSave(JSON.stringify({ ...createSave(), appearance })).error,
      ).toBeTruthy();
    }
  });
  it("rejects corrupt coffee durations and impossible accrued time", () => {
    expect(
      parseSave(
        JSON.stringify({
          ...drink(),
          coffee: { startedAt: now, endsAt: now + COFFEE_DURATION + 1 },
        }),
      ).error,
    ).toBeTruthy();
    const s = startFocus(drink(), 25, now, "bad");
    expect(
      parseSave(
        JSON.stringify({ ...s, timer: { ...s.timer, coffeeFocusMs: M } }),
      ).error,
    ).toBeTruthy();
  });
  it("can hide motivation and rotates lines between completed sessions", () => {
    expect(motivationLine("off", 0, 0)).toBe("");
    expect(motivationLine("gentle", 0, 0)).not.toBe(
      motivationLine("gentle", 1, 0),
    );
  });
});
describe("Jun’s coffee", () => {
  it("charges exactly once and uses real-time expiry boundaries", () => {
    const s = drink();
    expect(s.coins).toBe(94);
    expect(coffeeActive(s, now - 1)).toBe(false);
    expect(coffeeActive(s, now)).toBe(true);
    expect(coffeeActive(s, now + 30 * M - 1)).toBe(true);
    expect(coffeeActive(s, now + 30 * M)).toBe(false);
    expect(purchaseCoffee(s, now + M)).toBe(s);
    load(s);
  });
  it("rejects insufficient funds and purchases during all timer states", () => {
    const poor = { ...funded(), coins: 5 };
    expect(purchaseCoffee(poor, now)).toBe(poor);
    const focus = startFocus(funded(), 60, now, "active");
    for (const s of [
      focus,
      pauseTimer(focus, now + M),
      startBreak(funded(), 5, now, "rest"),
    ])
      expect(purchaseCoffee(s, now + 31 * M)).toBe(s);
  });
  it("gives a full 25-minute session fifteen coins with unchanged energy and XP", () => {
    const s = settleTimer(startFocus(drink(), 25, now, "full"), now + 25 * M);
    expect(s.lastCompletion!.rewards).toEqual({
      coins: 15,
      energy: 25,
      xp: 25,
    });
    expect(s.lastCompletion!.coffeeFocusMs).toBe(25 * M);
    expect(s.coins).toBe(109);
    load(s);
  });
  it("caps a long session to thirty boosted minutes", () => {
    const s = settleTimer(startFocus(drink(), 60, now, "long"), now + 60 * M);
    expect(s.lastCompletion!.coffeeFocusMs).toBe(30 * M);
    expect(s.lastCompletion!.rewards.coins).toBe(33);
  });
  it("accounts for partial overlap and expired coffee", () => {
    const s = settleTimer(
      startFocus(drink(), 25, now + 20 * M, "partial"),
      now + 45 * M,
    );
    expect(s.lastCompletion!.coffeeFocusMs).toBe(10 * M);
    expect(s.lastCompletion!.rewards.coins).toBe(13);
    const expired = settleTimer(
      startFocus(drink(), 25, now + 30 * M, "expired"),
      now + 55 * M,
    );
    expect(expired.lastCompletion!.rewards.coins).toBe(12);
  });
  it("settles at the deadline after an offline interval", () => {
    const active = load(startFocus(drink(), 25, now, "offline"));
    const s = settleTimer(active, now + 48 * 60 * M);
    expect(s.lastCompletion!.rewards.coins).toBe(15);
    expect(s.sessions[0].completedAt).toBe(now + 25 * M);
  });
  it("excludes paused time using either pause API", () => {
    for (const [pause, resume] of [
      [pauseFocus, resumeFocus],
      [pauseTimer, resumeTimer],
    ]) {
      let s = startFocus(drink(), 25, now, "pause");
      s = load(pause(s, now + 10 * M));
      s = load(resume(s, now + 35 * M));
      s = settleTimer(s, now + 50 * M);
      expect(s.lastCompletion!.coffeeFocusMs).toBe(10 * M);
      expect(s.lastCompletion!.rewards.coins).toBe(13);
      load(s);
    }
  });
  it("accumulates repeated segments once", () => {
    let s = startFocus(drink(), 25, now, "segments");
    s = pauseTimer(s, now + 5 * M);
    expect(pauseTimer(s, now + 6 * M)).toBe(s);
    s = resumeTimer(s, now + 10 * M);
    s = pauseTimer(s, now + 15 * M);
    s = resumeTimer(s, now + 20 * M);
    s = settleTimer(s, now + 35 * M);
    expect(s.lastCompletion!.coffeeFocusMs).toBe(20 * M);
    expect(s.lastCompletion!.rewards.coins).toBe(14);
  });
  it("never awards a completion twice or accepts a corrupt bonus", () => {
    const s = load(
      settleTimer(startFocus(drink(), 25, now, "once"), now + 25 * M),
    );
    expect(settleTimer(s, now + 100 * M)).toBe(s);
    const corrupt = {
      ...s,
      lastCompletion: {
        ...s.lastCompletion!,
        rewards: { ...s.lastCompletion!.rewards, coins: 16 },
      },
    };
    expect(parseSave(serializeSave(corrupt)).error).toBeTruthy();
  });
  it("does not reward cancellation or breaks, or multiply shared receipts", () => {
    const s = cancelTimer(startFocus(drink(), 25, now, "cancel"), now + 10 * M);
    expect(s.coins).toBe(94);
    expect(s.sessions).toHaveLength(0);
    expect(
      settleTimer(startBreak(drink(), 5, now, "rest"), now + 5 * M).coins,
    ).toBe(94);
    expect(
      applySharedGrant(drink(), {
        id: "a".repeat(32),
        minutes: 25,
        completedAt: now + 25 * M,
        rewards: { coins: 12, energy: 25, xp: 25 },
      }).coins,
    ).toBe(106);
  });
  it("cannot repay its price through one long session", () => {
    for (let minutes = 1; minutes <= 720; minutes++)
      expect(
        rewardsWithCoffee(minutes, Math.min(minutes, 30) * M).coins -
          getRewards(minutes).coins,
      ).toBeLessThan(6);
  });
  it("increases walking speed without tunnelling through collision", () => {
    const p = {
      ...WORLDS.village.spawn,
      facing: "right" as const,
      walkFrame: 0,
    };
    const normal = movePlayer(WORLDS.village, p, 1, 0, 0.05);
    const fast = movePlayer(WORLDS.village, p, 1, 0, 0.05, 1.35);
    expect(fast.x - p.x).toBeCloseTo((normal.x - p.x) * 1.35);
    let wall = { ...p, x: 710, y: 424 };
    for (let i = 0; i < 100; i++)
      wall = movePlayer(WORLDS.village, wall, 1, 0, 0.05, 1.35) as typeof wall;
    expect(wall.x).toBeLessThan(748);
  });
});
describe("crossing and streaks", () => {
  it("rejects imported crossing stages with missing prerequisites", () => {
    for (const upgrades of [
      ["crossing-boards"],
      ["crossing-lanterns"],
      ["crossing-cleared", "crossing-lanterns"],
    ])
      expect(
        parseSave(JSON.stringify({ ...createSave(), upgrades })).error,
      ).toBeTruthy();
  });
  it("keeps stationary players walkable as residents pass", () => {
    for (const now of [0, 30000, 60000, 90000]) {
      const scene = getWorldScene("village", [], now);
      expect(canStand(scene, 370, 352)).toBe(true);
    }
  });

  it("requires repairs in order and charges resources atomically", () => {
    const s = funded();
    expect(purchaseUpgrade(s, "crossing-boards", now)).toBe(s);
    expect(purchaseUpgrade(s, "crossing-lanterns", now)).toBe(s);
    const poor = { ...s, energy: 14 };
    expect(purchaseUpgrade(poor, "crossing-cleared", now)).toBe(poor);
    const built = load(repaired());
    expect([built.coins, built.energy]).toEqual([45, 0]);
    expect(purchaseUpgrade(built, "crossing-lanterns", now)).toBe(built);
  });
  it("awards longer streak milestones once and retains them after a missed day", () => {
    const s = load(settleStreakRewards(streak(14), now));
    expect(s.coins).toBe(76);
    expect(s.streakClaims).toEqual([3, 7, 14]);
    expect(settleStreakRewards(s, now)).toBe(s);
    const old = { ...streak(30), streakClaims: [3, 7] };
    const a = load(settleStreakRewards(old, now));
    expect(a.coins).toBe(115);
    expect(settleStreakRewards(a, now + 2 * 86400000)).toBe(a);
  });
  it("does not award future milestones", () => {
    expect(settleStreakRewards(streak(13), now).streakClaims).toEqual([3, 7]);
    expect(settleStreakRewards(streak(29), now).streakClaims).toEqual([
      3, 7, 14,
    ]);
  });
  it("unlocks a mission from actual repair progress only once", () => {
    const s = funded();
    expect(claimMission(s, "old-crossing", now)).toBe(s);
    const built = repaired(),
      claimed = claimMission(built, "old-crossing", now);
    expect(claimed.coins).toBe(built.coins + 12);
    expect(claimMission(claimed, "old-crossing", now)).toBe(claimed);
  });
  it("opens only the repaired crossing, preserving river collisions", () => {
    const locked = getWorldScene("village", [], 0),
      open = getWorldScene("village", repaired().upgrades!, 0);
    expect(canStand(locked, 772, 428)).toBe(false);
    expect(canStand(open, 772, 428)).toBe(true);
    expect(canStand(open, 772, 380)).toBe(false);
    expect(canStand(open, 772, 480)).toBe(false);
    expect(locked.interactions.some((i) => i.id === "field-notes")).toBe(false);
    expect(open.interactions.some((i) => i.id === "field-notes")).toBe(true);
  });
  it("has a walkable route to every new garden interaction", () => {
    const scene = getWorldScene("village", repaired().upgrades!, 0);
    const queue = [scene.spawn],
      seen = new Set([scene.spawn.x + "," + scene.spawn.y]),
      found = new Set<string>();
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      const near = getNearbyInteraction(scene, p);
      if (near) found.add(near.id);
      for (const [dx, dy] of [
        [4, 0],
        [-4, 0],
        [0, 4],
        [0, -4],
      ]) {
        const x = p.x + dx,
          y = p.y + dy,
          key = x + "," + y;
        if (!seen.has(key) && canStand(scene, x, y)) {
          seen.add(key);
          queue.push({ x, y });
        }
      }
    }
    for (const id of [
      "field-notes",
      "garden-bench",
      "copper-scope",
      "crafting-note",
      "orchard-cat",
      "garden-coffee",
      "library",
      "home",
    ])
      expect(found.has(id), id).toBe(true);
  });
});
describe("one clock for the whole town", () => {
  it("completes a twelve-minute day without freezing at reduced motion", () => {
    expect(getWorldClock(now)).toEqual(getWorldClock(now + WORLD_DAY_MS));
    expect(getWorldClock(now).hour).not.toBe(
      getWorldClock(now + WORLD_DAY_MS / 2).hour,
    );
  });
  it("uses local clock and explicit lighting choices", () => {
    expect(getWorldClock(now, "local").hour).toBe(12);
    expect(getWorldClock(now, "day").daylight).toBe(1);
    expect(getWorldClock(now, "night").label).toBe("Night");
  });
});
