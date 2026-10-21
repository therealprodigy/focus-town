import { describe, expect, it } from "vitest";
import { movePlayer } from "../src/game/engine";
import { renderWorld } from "../src/game/renderer";
import {
  BUILDINGS,
  canStand,
  getWorldScene,
  type Player,
} from "../src/game/world";

type Draw = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alpha: number;
};

// Record the renderer's actual rectangles, including character transforms.
function renderTown(player: Player, idleSeconds = 0): Draw[] {
  const draws: Draw[] = [];
  let state = { x: 0, y: 0, sx: 1, sy: 1, color: "", alpha: 1 };
  const stack: (typeof state)[] = [];
  const ctx = {
    get fillStyle() {
      return state.color;
    },
    set fillStyle(value: string) {
      state.color = value;
    },
    get globalAlpha() {
      return state.alpha;
    },
    set globalAlpha(value: number) {
      state.alpha = value;
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
    fillRect(x: number, y: number, width: number, height: number) {
      const left = state.x + x * state.sx;
      const top = state.y + y * state.sy;
      draws.push({
        x: Math.min(left, left + width * state.sx),
        y: Math.min(top, top + height * state.sy),
        width: Math.abs(width * state.sx),
        height: Math.abs(height * state.sy),
        color: state.color,
        alpha: state.alpha,
      });
    },
  } as unknown as CanvasRenderingContext2D;
  renderWorld(ctx, "village", player, {
    time: 0,
    activity: "idle",
    streak: 0,
    lighting: "day",
    idleSeconds,
  });
  return draws;
}

const playerAt = (x: number, y: number): Player => ({
  x,
  y,
  facing: "down",
  walkFrame: 0,
});

function expectRoofSupport(draws: Draw[], prop: Draw, roofColor: string) {
  const bottom = prop.y + prop.height;
  expect(
    draws.some(
      (roof) =>
        roof.alpha === 1 &&
        (roof.color === roofColor || roof.color === "#513e31") &&
        roof.y <= bottom - 4 &&
        roof.y + roof.height >= bottom &&
        roof.x <= prop.x &&
        roof.x + roof.width >= prop.x + prop.width,
    ),
  ).toBe(true);
}

describe("town rendering and fountain collision", () => {
  it("keeps an idle reader's book behind the same foreground tree as its owner", () => {
    const draws = renderTown(playerAt(304, 525), 20);
    const book = draws.findIndex(
      (draw) => draw.x === 292 && draw.y === 494 && draw.color === "#a08aa4",
    );
    const trunk = draws.findIndex(
      (draw) => draw.x === 292 && draw.y === 496 && draw.color === "#5e4835",
    );
    expect(book).toBeGreaterThanOrEqual(0);
    expect(trunk).toBeGreaterThan(book);
  });

  it.each([
    [1218, 208],
    [1280, 230],
    [1340, 208],
    [920, 454],
    [1180, 458],
    [1344, 432],
    [1100, 398],
    [820, 388],
  ])("blocks the garden prop's visible base at %i, %i", (x, y) => {
    const scene = getWorldScene("village", ["crossing-lanterns"]);
    expect(canStand(scene, x, y)).toBe(false);
  });

  it("anchors all three chimney bodies to opaque roof geometry", () => {
    const draws = renderTown(playerAt(448, 416));
    for (const building of BUILDINGS) {
      const chimney = draws.find(
        (draw) =>
          draw.color === "#807663" &&
          draw.x >= building.x &&
          draw.x < building.x + building.width,
      );
      expect(chimney, building.name).toBeDefined();
      expectRoofSupport(draws, chimney!, building.roof);
    }
  });

  it("anchors the library roof lantern plinth to its roof", () => {
    const draws = renderTown(playerAt(448, 416));
    const library = BUILDINGS.find((building) =>
      building.name.includes("LIBRARY"),
    )!;
    const plinth = draws.find(
      (draw) =>
        draw.color === "#36595c" &&
        draw.width === 44 &&
        draw.x >= library.x &&
        draw.x < library.x + library.width,
    );
    expect(plinth).toBeDefined();
    expectRoofSupport(draws, plinth!, library.roof);
  });

  it.each([330, 400])(
    "sorts the fountain against a player's feet at y=%i",
    (y) => {
      const draws = renderTown(playerAt(456, y));
      const playerIndex = draws.findIndex(
        (draw) =>
          draw.color === "#fff0b1" && draw.x === 472 && draw.y === y - 20,
      );
      const fountainIndex = draws.findIndex(
        (draw) => draw.color === "#516f66" && draw.x === 424 && draw.y === 344,
      );
      expect(playerIndex).toBeGreaterThanOrEqual(0);
      expect(fountainIndex).toBeGreaterThanOrEqual(0);
      if (y < 380) expect(playerIndex).toBeLessThan(fountainIndex);
      else expect(playerIndex).toBeGreaterThan(fountainIndex);
    },
  );

  it("blocks feet that overlap either visible side lip of the fountain", () => {
    const scene = getWorldScene("village", []);
    expect(canStand(scene, 415, 350)).toBe(false);
    expect(canStand(scene, 497, 350)).toBe(false);
    expect(canStand(scene, 413, 350)).toBe(true);
    expect(canStand(scene, 499, 350)).toBe(true);
  });

  it.each([
    { side: "north", x: 456, y: 310, dx: 0, dy: 1, axis: "y", edge: 336 },
    { side: "south", x: 456, y: 420, dx: 0, dy: -1, axis: "y", edge: 390 },
    { side: "west", x: 390, y: 358, dx: 1, dy: 0, axis: "x", edge: 413 },
    { side: "east", x: 526, y: 358, dx: -1, dy: 0, axis: "x", edge: 499 },
  ] as const)(
    "stops boosted long-frame movement at the $side fountain edge",
    ({ x, y, dx, dy, axis, edge }) => {
      const scene = getWorldScene("village", []);
      let player = playerAt(x, y);
      for (let frame = 0; frame < 20; frame++) {
        player = movePlayer(scene, player, dx, dy, 1, 1.35);
        expect(canStand(scene, player.x, player.y)).toBe(true);
      }
      const remaining = (edge - player[axis]) * (dx || dy);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(3);
    },
  );
});
