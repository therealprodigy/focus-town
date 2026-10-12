import { describe, expect, it } from "vitest";
import {
  CHERRYBANK_INTERACTIONS,
  CHERRYBANK_SOLIDS,
  CHERRY_TREES,
  WORLDS,
  canStand,
  getNearbyInteraction,
  getWorldScene,
  residentPositions,
  type Player,
  type WorldScene,
} from "../src/game/world";
import { renderWorld } from "../src/game/renderer";
import { paintFountainWater } from "../src/game/townLife";
import {
  DEFAULT_APPEARANCE,
  type Appearance,
} from "../src/game/personalization";
import type { UpgradeId } from "../src/game/townCatalog";
import { handleApi } from "../server/room-service";
import { openTestDatabase } from "./database";

const repaired: UpgradeId[] = [
  "crossing-cleared",
  "crossing-boards",
  "crossing-lanterns",
];
function reachable(scene: WorldScene) {
  const queue = [scene.spawn],
    seen = new Set([scene.spawn.x + "," + scene.spawn.y]),
    found = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      interaction = getNearbyInteraction(scene, p);
    if (interaction) found.add(interaction.id);
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
  return { points: queue, found };
}

type Draw = { x: number; y: number; w: number; h: number; color: string };
function recordingContext() {
  const draws: Draw[] = [];
  let state = { x: 0, y: 0, sx: 1, sy: 1, color: "", alpha: 1 };
  const stack: (typeof state)[] = [];
  const ctx = {
    get fillStyle() {
      return state.color;
    },
    set fillStyle(v: string) {
      state.color = v;
    },
    get globalAlpha() {
      return state.alpha;
    },
    set globalAlpha(v: number) {
      state.alpha = v;
    },
    save() {
      stack.push({ ...state });
    },
    restore() {
      state = stack.pop()!;
    },
    translate(x: number, y: number) {
      state.x += x * state.sx;
      state.y += y * state.sy;
    },
    scale(x: number, y: number) {
      state.sx *= x;
      state.sy *= y;
    },
    clearRect() {},
    fillText() {},
    fillRect(x: number, y: number, w: number, h: number) {
      const left = state.x + x * state.sx,
        top = state.y + y * state.sy;
      draws.push({
        x: Math.min(left, left + w * state.sx),
        y: Math.min(top, top + h * state.sy),
        w: Math.abs(w * state.sx),
        h: Math.abs(h * state.sy),
        color: state.color,
      });
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, draws };
}
const playerAt = (x: number, y: number): Player => ({
  x,
  y,
  facing: "down",
  walkFrame: 0,
});
function drawTown(
  player: Player,
  appearance = DEFAULT_APPEARANCE,
  peerAppearance?: Appearance | null,
) {
  const { ctx, draws } = recordingContext();
  renderWorld(ctx, "village", player, {
    time: 0,
    residentTime: 0,
    activity: "idle",
    streak: 0,
    lighting: "day",
    upgrades: repaired,
    appearance,
    peers:
      peerAppearance !== undefined
        ? [
            {
              id: "abcd",
              name: "Guest",
              scene: "village",
              x: 1650,
              y: 520,
              facing: "up",
              appearance: peerAppearance ?? undefined,
            },
          ]
        : [],
  });
  return draws;
}

describe("Cherrybank map and progression access", () => {
  it("preserves the original spawn and house and expands the east bank", () => {
    expect(WORLDS.village).toMatchObject({
      width: 1920,
      height: 800,
      spawn: { x: 448, y: 416 },
    });
    expect(WORLDS.house).toMatchObject({ width: 960, height: 600 });
  });
  it("keeps the starter letter reachable while sealing every route around the unrepaired crossing", () => {
    for (const upgrades of [
      [],
      ["crossing-cleared"],
      ["crossing-cleared", "crossing-boards"],
    ] as UpgradeId[][]) {
      const scene = getWorldScene("village", upgrades);
      const result = reachable(scene);
      expect(result.found.has("cherry-letter")).toBe(true);
      expect(result.points.some((p) => p.x >= 796 || p.y > 600)).toBe(false);
      expect(scene.interactions.some((i) => i.id === "oren")).toBe(false);
    }
  });
  it("has a walking route from home to every Cherrybank interaction and the expanded southern meadow", () => {
    const result = reachable(getWorldScene("village", repaired));
    for (const i of CHERRYBANK_INTERACTIONS)
      expect(result.found.has(i.id), i.id).toBe(true);
    for (const id of [
      "cherry-letter",
      "home",
      "field-notes",
      "copper-scope",
      "garden-bench",
    ])
      expect(result.found.has(id), id).toBe(true);
    expect(result.points.some((p) => p.x > 1840 && p.y > 720)).toBe(true);
  });
  it("blocks the river and scenery feet while leaving canopy space and residents walkable", () => {
    const scene = getWorldScene("village", repaired);
    expect(canStand(scene, 772, 428)).toBe(true);
    for (const y of [380, 480, 600, 720, 800])
      expect(canStand(scene, 772, y)).toBe(false);
    for (const p of CHERRY_TREES) {
      expect(canStand(scene, p.x, p.y)).toBe(false);
      // Forty pixels north stays inside the canopy and clear of nearby lamp feet.
      expect(canStand(scene, p.x - 30, p.y - 40)).toBe(true);
    }
    for (const s of CHERRYBANK_SOLIDS)
      expect(canStand(scene, s.x + s.width / 2, s.y + s.height)).toBe(false);
    for (const time of [0, 30000, 60000, 90000]) {
      const residents = residentPositions(time),
        liveScene = getWorldScene("village", repaired, time);
      for (const id of ["edda", "oren", "pip"] as const) {
        const p = residents[id];
        expect(canStand(liveScene, p.x, p.y), id).toBe(true);
        expect(getNearbyInteraction(liveScene, p)?.id).toBe(id);
      }
    }
  });
});

describe("Cherrybank depth, flowing fountain and royal silhouette", () => {
  it.each([268, 324])(
    "sorts a cherry tree at y294 correctly against player feet at %i",
    (y) => {
      const draws = drawTown(playerAt(1688, y));
      const trunk = draws.findIndex(
        (d) => d.x === 1680 && d.y === 232 && d.color === "#66504c",
      );
      const player = draws.findIndex(
        (d) => d.x === 1704 && d.y === y - 20 && d.color === "#fff0b1",
      );
      expect(trunk).toBeGreaterThan(-1);
      expect(player).toBeGreaterThan(-1);
      if (y < 296) expect(player).toBeLessThan(trunk);
      else expect(player).toBeGreaterThan(trunk);
    },
  );
  it("gives every resident a distinct silhouette and accessory", () => {
    const draws = drawTown(playerAt(448, 416));
    expect(
      draws.some(
        (d) => d.color === "#e2dbcc" && d.w === 10 && d.h === 10 && d.x > 1500,
      ),
    ).toBe(true); // Edda's bun
    expect(
      draws.some(
        (d) => d.color === "#aebcb3" && d.w === 12 && d.h === 5 && d.x > 1560,
      ),
    ).toBe(true); // Oren's hammer
    expect(
      draws.some(
        (d) => d.color === "#b9c0b2" && d.w === 11 && d.h === 13 && d.x > 1780,
      ),
    ).toBe(true); // Pip's film can
  });
  it("keeps a visible base trickle at time zero and adds stronger repaired jets", () => {
    const still = recordingContext(),
      later = recordingContext(),
      repair = recordingContext();
    paintFountainWater(still.ctx, 0);
    paintFountainWater(later.ctx, 900);
    paintFountainWater(repair.ctx, 0, true);
    expect(still.draws.some((d) => d.h >= 27 && d.color === "#c7e9da")).toBe(
      true,
    );
    expect(later.draws).not.toEqual(still.draws);
    expect(repair.draws.length).toBeGreaterThan(still.draws.length);
    expect(repair.draws.some((d) => d.y < 294)).toBe(true);
    const repeated = recordingContext();
    paintFountainWater(repeated.ctx, 0);
    expect(repeated.draws).toEqual(still.draws);
  });
  it("keeps a peer without appearance in the default outfit when the local player wears royal gear", () => {
    const royal: Appearance = {
      ...DEFAULT_APPEARANCE,
      hat: "crown",
      cloak: "royal",
    };
    const missing = drawTown(playerAt(448, 416), royal, null);
    const explicitDefault = drawTown(
      playerAt(448, 416),
      royal,
      DEFAULT_APPEARANCE,
    );
    expect(missing).toEqual(explicitDefault);
    expect(
      missing.some(
        (d) =>
          d.x === 1622 && d.y === 512 && d.w === 56 && d.color === "#e2ba70",
      ),
    ).toBe(false);
    expect(
      missing.filter(
        (d) =>
          d.color === "#fff0bc" && d.x >= 1632 && d.x <= 1668 && d.y <= 460,
      ),
    ).toHaveLength(0);
  });
  it("renders five crown points and a broad gold-trimmed cloak for local and peer avatars", () => {
    const royal: Appearance = {
      ...DEFAULT_APPEARANCE,
      hat: "crown",
      cloak: "royal",
    };
    const draws = drawTown(playerAt(448, 416), royal, royal);
    for (const [x, y] of [
      [448, 416],
      [1650, 520],
    ]) {
      expect(
        draws.filter(
          (d) =>
            d.color === "#fff0bc" &&
            d.w === 4 &&
            d.h === 3 &&
            d.x >= x - 18 &&
            d.x <= x + 18 &&
            d.y <= y - 60,
        ),
      ).toHaveLength(5);
      expect(
        draws.some(
          (d) =>
            d.x === x - 28 &&
            d.y === y - 8 &&
            d.w === 56 &&
            d.color === "#e2ba70",
        ),
      ).toBe(true);
    }
    const plain = drawTown(playerAt(448, 416));
    expect(
      plain.some(
        (d) =>
          d.x === 420 && d.y === 408 && d.w === 56 && d.color === "#e2ba70",
      ),
    ).toBe(false);
  });
});

describe("shared-room map dimensions", () => {
  it("accepts Cherrybank positions while rejecting outside edges and oversized house positions", async () => {
    const db = await openTestDatabase();
    const now = Date.UTC(2026, 9, 12, 12);
    const request = async (
      path: string,
      data: unknown,
      headers: Record<string, string> = {},
    ) => {
      const reply = await handleApi(
        new Request("https://town.test/api/" + path, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "CF-Connecting-IP": "192.0.2.2",
            ...headers,
          },
          body: JSON.stringify(data),
        }),
        { DB: db },
        now,
      );
      return {
        status: reply.status,
        body: (await reply.json()) as Record<string, any>,
      };
    };
    try {
      const secret = "f".repeat(64);
      expect(
        (
          await request(
            "profile/create",
            { name: "Map Tester" },
            { Authorization: "Bearer " + secret },
          )
        ).status,
      ).toBe(201);
      const room = await request(
        "rooms",
        { name: "Map Tester" },
        { "X-Focus-Profile": secret },
      );
      expect(room.status).toBe(201);
      const c = room.body.credentials;
      let seq = 0;
      for (const [scene, x, y, expected] of [
        ["village", 1810, 720, 200],
        ["village", 1913, 800, 200],
        ["village", 1914, 720, 400],
        ["village", 1810, 801, 400],
        ["house", 1000, 520, 400],
        ["house", 480, 601, 400],
        ["house", 480, 468, 200],
      ] as const) {
        const result = await request(
          "rooms/" + c.roomId + "/sync",
          { position: { scene, x, y, facing: "down" }, positionSeq: ++seq },
          { Authorization: "Bearer " + c.token },
        );
        expect(result.status, `${scene} ${x},${y}`).toBe(expected);
      }
    } finally {
      db.close();
    }
  });
});
