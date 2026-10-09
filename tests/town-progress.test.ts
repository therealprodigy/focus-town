import { describe, it, expect } from "vitest";
import {
  createSave,
  parseSave,
  localDateKey,
  type SaveData,
} from "../src/game/state";
import { recordDiscovery } from "../src/game/discoveries";
import {
  purchaseUpgrade,
  claimMission,
  settleStreakRewards,
  applySharedGrant,
} from "../src/game/townProgress";
import { WORLDS, canStand, getNearbyInteraction } from "../src/game/world";
import { movePlayer } from "../src/game/engine";
const now = new Date(2026, 9, 9, 12).getTime();
const streak = (days: number): SaveData => ({
  ...createSave(),
  coins: 120,
  sessions: Array.from({ length: days }, (_, i) => {
    const at = now - i * 86400000;
    return {
      id: "day_" + i,
      minutes: 25,
      completedAt: at,
      localDate: localDateKey(at),
    };
  }),
});
describe("town progression", () => {
  it("preserves old saves and validates each optional collection", () => {
    expect(parseSave(JSON.stringify(createSave()))).toBeTruthy();
    for (const field of [
      "discoveries",
      "upgrades",
      "missionClaims",
      "streakClaims",
    ]) {
      expect(
        parseSave(JSON.stringify({ ...createSave(), [field]: ["nope"] })).error,
      ).toBeTruthy();
    }
    const a = recordDiscovery(createSave(), "shop-cat", 12);
    expect(parseSave(JSON.stringify(a)).save).toEqual(a);
    expect(
      parseSave(JSON.stringify({ ...a, discoveries: ["shop-cat", "shop-cat"] }))
        .error,
    ).toBeTruthy();
  });
  it("requires night, two clues and exactly three taps without settling timers", () => {
    const s = { ...createSave(), coins: 4 };
    expect(recordDiscovery(s, "night-choir", 12)).toBe(s);
    expect(recordDiscovery(s, "quiet-bell", 22, 3)).toBe(s);
    const clues = recordDiscovery(
      recordDiscovery(s, "river-atlas", 12),
      "margin-note",
      12,
    );
    expect(recordDiscovery(clues, "quiet-bell", 12, 2)).toBe(clues);
    const found = recordDiscovery(clues, "quiet-bell", 12, 3);
    expect(found.discoveries).toContain("quiet-bell");
    expect(found.coins).toBe(4);
    expect(recordDiscovery(found, "quiet-bell", 12, 3)).toBe(found);
    expect(recordDiscovery(s, "night-choir", 22).discoveries).toContain(
      "night-choir",
    );
  });
  it("buys only affordable, unlocked upgrades once", () => {
    const s = streak(1);
    expect(purchaseUpgrade(s, "moonflowers", now)).toBe(s);
    const bought = purchaseUpgrade(s, "porch-lanterns", now);
    expect(bought.coins).toBe(108);
    expect(purchaseUpgrade(bought, "porch-lanterns", now)).toBe(bought);
    expect(
      purchaseUpgrade({ ...s, coins: 0 }, "porch-lanterns", now).upgrades,
    ).toBeUndefined();
    expect(purchaseUpgrade(s, "porch-lanterns", NaN)).toBe(s);
  });
  it("pays missions and streak milestones once and keeps buildings after a missed day", () => {
    const s = streak(7),
      a = settleStreakRewards(s, now);
    expect(a.coins).toBe(156);
    expect(settleStreakRewards(a, now)).toBe(a);
    const b = claimMission(a, "first-page", now);
    expect(b.coins).toBe(159);
    expect(claimMission(b, "first-page", now)).toBe(b);
    const built = purchaseUpgrade(b, "festival", now + 86400000 * 4);
    expect(built.upgrades).toContain("festival");
    expect(built.streakClaims).toEqual([3, 7]);
  });
  it("applies shared receipts once and keeps an unrelated local timer unchanged", () => {
    const grant = {
        id: "a".repeat(32),
        minutes: 25,
        completedAt: now,
        rewards: { coins: 12, energy: 25, xp: 25 },
      },
      s = createSave(),
      a = applySharedGrant(s, grant);
    expect(a.coins).toBe(12);
    expect(a.sessions[0].id).toBe("coop_" + grant.id);
    expect(applySharedGrant(a, grant)).toBe(a);
    expect(a.lastCompletion).toBeNull();
    expect(applySharedGrant(s, { ...grant, minutes: 0 })).toBe(s);
  });
});
describe("closed forest boundary", () => {
  it("cannot bypass the brook but keeps library and notices reachable", () => {
    const scene = WORLDS.village,
      queue = [scene.spawn],
      seen = new Set([scene.spawn.x + "," + scene.spawn.y]);
    let crossed = false,
      library = false,
      bridge = false;
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      crossed ||= p.x >= 863 || (p.x >= 803 && p.y >= 330);
      const near = getNearbyInteraction(scene, p);
      library ||= near?.id === "library";
      bridge ||= near?.id === "bridge";
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
    expect(crossed).toBe(false);
    expect(library).toBe(true);
    expect(bridge).toBe(true);
    expect(canStand(scene, 760, 282)).toBe(true);
  });
  it("stops downward movement at the visible north-bank fence", () => {
    let p = { x: 780, y: 282, facing: "down" as const, walkFrame: 0 };
    for (let i = 0; i < 60; i++)
      p = movePlayer(WORLDS.village, p, 0, 1, 1 / 60) as typeof p;
    expect(p.y).toBeLessThanOrEqual(292);
  });
});
