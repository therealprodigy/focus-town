import { describe, expect, it } from "vitest";
import {
  createSave,
  startFocus,
  startBreak,
  settleTimer,
  pauseFocus,
  resumeFocus,
  cancelTimer,
  remainingMs,
  serializeSave,
  parseSave,
  getProgress,
  REWARDS,
  type FocusMinutes,
} from "../src/game/state";
import {
  WORLDS,
  canStand,
  getNearbyInteraction,
  HOUSE_DESK_SEAT,
  type WorldScene,
  type Player,
} from "../src/game/world";
import { movePlayer, PLAYER_SPEED } from "../src/game/engine";
const start = new Date(2026, 9, 8, 10).getTime();
const complete = (minutes: FocusMinutes = 25, at = start, id = "session-1") =>
  settleTimer(startFocus(createSave(), minutes, at, id), at + minutes * 60000);
describe("persistent focus sessions", () => {
  it.each([15, 25, 45, 60] as const)(
    "awards the %i minute session exactly once, including after reload",
    (minutes) => {
      let save = startFocus(createSave(), minutes, start, "one");
      expect(settleTimer(save, start + minutes * 60000 - 1)).toBe(save);
      save = settleTimer(
        parseSave(serializeSave(save)).save,
        start + minutes * 60000,
      );
      expect({ energy: save.energy, xp: save.xp, coins: save.coins }).toEqual(
        REWARDS[minutes],
      );
      expect(save.sessions).toHaveLength(1);
      const reloaded = parseSave(serializeSave(save)).save;
      expect(settleTimer(reloaded, start + 9e8)).toBe(reloaded);
      expect(startFocus(reloaded, minutes, start + 9e8, "one")).toBe(reloaded);
    },
  );
  it("preserves a paused timer across a reload and a long absence", () => {
    let save = pauseFocus(
      startFocus(createSave(), 15, start, "pause"),
      start + 120000,
    );
    expect(save.timer?.status).toBe("paused");
    expect(remainingMs(save.timer!, start + 9e8)).toBe(13 * 60000);
    save = resumeFocus(parseSave(serializeSave(save)).save, start + 9e8);
    expect(save.timer?.endAt).toBe(start + 9e8 + 13 * 60000);
    expect(parseSave(serializeSave(save)).error).toBeNull();
    expect(settleTimer(save, save.timer!.endAt!).coins).toBe(6);
  });
  it("cancels an unfinished session without rewarding it", () => {
    const save = cancelTimer(
      startFocus(createSave(), 25, start, "cancel"),
      start + 1000,
    );
    expect(save.timer).toBeNull();
    expect(save.sessions).toEqual([]);
    expect(save.coins).toBe(0);
  });
  it("settles before pause or cancel at the exact deadline", () => {
    const save = startFocus(createSave(), 25, start, "boundary");
    for (const change of [pauseFocus, cancelTimer])
      expect(change(save, start + 25 * 60000).coins).toBe(12);
  });
  it("does not let another session overwrite an active timer", () => {
    const save = startFocus(createSave(), 25, start, "first");
    expect(startFocus(save, 15, start + 1000, "second")).toBe(save);
    expect(startBreak(save, 3, start + 1000, "rest")).toBe(save);
  });
  it("restores a break and gives it no focus rewards", () => {
    let save = startBreak(complete(), 5, start + 25 * 60000, "rest");
    save = parseSave(serializeSave(save)).save;
    const done = settleTimer(save, start + 30 * 60000);
    expect(done.timer).toBeNull();
    expect(done.coins).toBe(12);
    expect(done.sessions).toHaveLength(1);
  });
  it("records the deadline date, even when reopened days later", () => {
    const late = new Date(2026, 9, 8, 23, 50).getTime(),
      save = settleTimer(
        startFocus(createSave(), 25, late, "midnight"),
        late + 4 * 86400000,
      );
    expect(save.sessions[0].localDate).toBe("2026-10-09");
    expect(save.sessions[0].completedAt).toBe(late + 25 * 60000);
  });
  it("caps remaining time after a backward clock change and rejects invalid settlement times", () => {
    const save = startFocus(createSave(), 15, start, "clock");
    expect(remainingMs(save.timer!, start - 1000)).toBe(900000);
    expect(settleTimer(save, NaN)).toBe(save);
    expect(settleTimer(save, Infinity)).toBe(save);
    const resumed = resumeFocus(pauseFocus(save, start + 1000), start - 100000);
    expect(parseSave(serializeSave(resumed)).error).toBeNull();
  });
  it("keeps damaged and unsupported saves out of the game", () => {
    expect(parseSave(null).error).toBeNull();
    expect(parseSave("{broken").error).toBeTruthy();
    for (const patch of [
      { version: 2 },
      { coins: -1 },
      { energy: NaN },
      {
        sessions: [
          { id: "x", minutes: 25, completedAt: start, localDate: "2026-02-31" },
        ],
      },
    ])
      expect(
        parseSave(JSON.stringify({ ...createSave(), ...patch })).error,
      ).toBeTruthy();
    const good = complete();
    expect(
      parseSave(
        serializeSave({
          ...good,
          sessions: [...good.sessions, ...good.sessions],
        }),
      ).error,
    ).toBeTruthy();
    const running = startFocus(createSave(), 25, start, "bad-time");
    running.timer!.endAt! += 1000;
    expect(parseSave(serializeSave(running)).error).toBeTruthy();
  });
  it("counts 25 completed minutes per local day and allows yesterday’s streak", () => {
    let save = createSave();
    const day = (n: number) => new Date(2026, 9, n, 10).getTime();
    for (const [n, mins, id] of [
      [6, 25, "a"],
      [7, 15, "b"],
      [7, 15, "c"],
      [8, 25, "d"],
    ] as const) {
      save = startFocus(save, mins, day(n), id);
      save = settleTimer(save, day(n) + mins * 60000);
    }
    expect(getProgress(save, day(8))).toMatchObject({
      currentStreak: 3,
      bestStreak: 3,
      todayMinutes: 25,
      totalMinutes: 80,
    });
    expect(getProgress(save, day(9)).currentStreak).toBe(3);
    expect(getProgress(save, day(10)).currentStreak).toBe(0);
  });
});
const empty: WorldScene = {
  id: "village",
  width: 1000,
  height: 1000,
  spawn: { x: 500, y: 500 },
  solids: [],
  interactions: [],
};
const player = (): Player => ({ x: 500, y: 500, facing: "down", walkFrame: 0 });
describe("movement", () => {
  it("has equal straight and diagonal speed", () => {
    const a = movePlayer(empty, player(), 1, 0, 0.05),
      b = movePlayer(empty, player(), 1, 1, 0.05);
    expect(a.x - 500).toBeCloseTo(PLAYER_SPEED * 0.05);
    expect(Math.hypot(b.x - 500, b.y - 500)).toBeCloseTo(a.x - 500);
  });
  it("has equal travel at 20 and 60 frames per second", () => {
    const travel = (n: number) => {
      let p = player();
      for (let i = 0; i < n; i++) p = movePlayer(empty, p, 1, 0, 1 / n);
      return p;
    };
    expect(travel(20).x).toBeCloseTo(650);
    expect(travel(60).x).toBeCloseTo(650);
  });
  it("cannot tunnel through a thin wall and can slide along it", () => {
    const scene = {
      ...empty,
      solids: [{ x: 512, y: 0, width: 1, height: 1000 }],
    };
    expect(movePlayer(scene, player(), 1, 0, 3).x).toBeLessThanOrEqual(505);
    const slide = movePlayer(scene, player(), 1, 1, 0.1);
    expect(slide.x).toBeLessThanOrEqual(505);
    expect(slide.y).toBeGreaterThan(500);
  });
  it("ignores malformed input and no movement", () => {
    const p = player();
    for (const args of [
      [NaN, 0, 0.05],
      [Infinity, 0, 0.05],
      [1, 0, NaN],
      [0, 0, 0.05],
      [1, 0, 0],
      [1, 0, -1],
    ])
      expect(movePlayer(empty, p, args[0], args[1], args[2])).toBe(p);
  });
});
describe("world routes", () => {
  it.each(["village", "house"] as const)(
    "every %s interaction can be reached from its spawn",
    (id) => {
      const scene = WORLDS[id],
        queue = [scene.spawn],
        seen = new Set([scene.spawn.x + "," + scene.spawn.y]),
        reached = new Set<string>();
      expect(canStand(scene, scene.spawn.x, scene.spawn.y)).toBe(true);
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i],
          near = getNearbyInteraction(scene, p);
        if (near) reached.add(near.id);
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
      expect([...reached].sort()).toEqual(
        scene.interactions.map((i) => i.id).sort(),
      );
      for (const i of scene.interactions)
        if (i.targetScene && i.targetSpawn)
          expect(
            canStand(WORLDS[i.targetScene], i.targetSpawn.x, i.targetSpawn.y),
          ).toBe(true);
    },
  );
  it("keeps the study seat and desk-to-bed walk clear", () => {
    const points = [
      HOUSE_DESK_SEAT,
      { x: 530, y: 286 },
      { x: 530, y: 372 },
      { x: 644, y: 372 },
    ];
    for (let n = 1; n < points.length; n++) {
      const a = points[n - 1],
        b = points[n],
        steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
      for (let j = 0; j <= steps; j++)
        expect(
          canStand(
            WORLDS.house,
            a.x + ((b.x - a.x) * j) / steps,
            a.y + ((b.y - a.y) * j) / steps,
          ),
        ).toBe(true);
    }
    expect(getNearbyInteraction(WORLDS.house, HOUSE_DESK_SEAT)?.id).toBe(
      "desk",
    );
    expect(getNearbyInteraction(WORLDS.house, { x: 644, y: 372 })?.id).toBe(
      "bed",
    );
  });
});
