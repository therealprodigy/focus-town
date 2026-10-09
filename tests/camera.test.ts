import { describe, expect, it } from "vitest";
import { getCamera } from "../src/game/camera";
import { WORLDS, canStand } from "../src/game/world";

describe("town framing", () => {
  it.each([
    [390, 844],
    [1440, 900],
    [2560, 1080],
    [844, 390],
    [320, 360],
  ])(
    "keeps the whole character reachable on a %i x %i screen",
    (width, height) => {
      for (const scene of Object.values(WORLDS)) {
        const positions = [scene.spawn, { x: 7, y: 10 }, { x: 953, y: 600 }];
        for (let y = 10; y <= 600; y += 40)
          for (let x = 7; x <= 953; x += 40)
            if (canStand(scene, x, y)) positions.push({ x, y });
        for (const p of positions) {
          const c = getCamera(scene, p, width, height);
          expect(p.x - 32).toBeGreaterThanOrEqual(c.x);
          expect(p.x + 32).toBeLessThanOrEqual(c.x + c.width);
          expect(p.y - 64).toBeGreaterThanOrEqual(c.y);
          expect(p.y + 4).toBeLessThanOrEqual(c.y + c.height);
          expect(c.width * c.scale).toBeCloseTo(width);
          expect(c.height * c.scale).toBeCloseTo(height);
        }
      }
    },
  );
  it("does not change map coordinates or saved geometry when resized", () => {
    const player = { ...WORLDS.village.spawn },
      before = { ...player };
    getCamera(WORLDS.village, player, 390, 844);
    getCamera(WORLDS.village, player, 2560, 1080);
    expect(player).toEqual(before);
    expect(WORLDS.village.width).toBe(960);
  });
});
