import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DeskClock } from "../src/DeskClock";
import { createAmbient } from "../src/ambientAudio";
import { canStand, getNearbyInteraction, WORLDS } from "../src/game/world";
import { discoveryAt, recordDiscovery } from "../src/game/discoveries";
import { createSave, parseSave } from "../src/game/state";

describe("cozy town regressions", () => {
  it("keeps the maximum supported 720-minute clock readable to assistive technology", () => {
    const html = renderToStaticMarkup(
      <DeskClock value="720:00" label="Focus" />,
    );
    expect(html).toContain('aria-label="Focus 720:00"');
    expect(html.match(/class="clock-digit"/g)).toHaveLength(5);
    expect(html).toContain('aria-hidden="true"');
  });
  it("offers a plain clock without decorative maker lettering", () => {
    const html = renderToStaticMarkup(
      <DeskClock value="00:00" label="Short break" plain />,
    );
    expect(html).toContain("plain-clock");
    expect(html).not.toContain("GREENVALE CLOCKWORKS");
  });
  it("blocks walking through the new hearth and leaves its interaction accessible", () => {
    expect(canStand(WORLDS.house, 568, 180)).toBe(false);
    expect(canStand(WORLDS.house, 568, 220)).toBe(true);
    expect(getNearbyInteraction(WORLDS.house, { x: 568, y: 216 })?.id).toBe(
      "hearth",
    );
  });
  it("can walk from the door to both new discoveries", () => {
    const scene = WORLDS.house;
    const queue = [{ x: 480, y: 468 }];
    const seen = new Set<string>();
    const found = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      const key = point.x + "," + point.y;
      if (seen.has(key) || !canStand(scene, point.x, point.y)) continue;
      seen.add(key);
      const nearby = getNearbyInteraction(scene, point);
      if (nearby) found.add(nearby.id);
      for (const [dx, dy] of [
        [4, 0],
        [-4, 0],
        [0, 4],
        [0, -4],
      ])
        queue.push({ x: point.x + dx, y: point.y + dy });
    }
    expect(found.has("hearth")).toBe(true);
    expect(found.has("blue-door")).toBe(true);
    expect(found.has("desk")).toBe(true);
    expect(found.has("bed")).toBe(true);
  });
  it("records each new discovery once and accepts it in a saved game", () => {
    let save = createSave();
    for (const id of ["blue-door", "hearth"]) {
      const key = discoveryAt(id)!;
      save = recordDiscovery(save, key, 12);
      expect(recordDiscovery(save, key, 12)).toBe(save);
    }
    expect(parseSave(JSON.stringify(save)).save.discoveries).toEqual([
      "blue-door",
      "hearth",
    ]);
  });
  it("creates a fresh noise source and disposes each audio node only once", async () => {
    const nodes: any[] = [];
    const param = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      setTargetAtTime: vi.fn(),
    });
    const node = () => {
      const n: any = {
        connect: vi.fn((destination: any) => destination),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        gain: param(),
        frequency: param(),
        Q: param(),
        onended: null,
      };
      nodes.push(n);
      return n;
    };
    let context: any;
    class FakeContext {
      sampleRate = 44100;
      currentTime = 0;
      state = "running";
      destination = {};
      close = vi.fn(async () => {});
      resume = vi.fn(async () => {});
      constructor() {
        context = this;
      }
      createBufferSource = node;
      createBiquadFilter = node;
      createGain = node;
      createOscillator = node;
      createBuffer = (_channels: number, length: number) => ({
        getChannelData: () => new Float32Array(length),
      });
    }
    vi.stubGlobal("AudioContext", FakeContext);
    try {
      const sound = createAmbient("shore", 0.4);
      await sound.ready;
      sound.setVolume(0.7);
      sound.stop();
      sound.stop();
      expect(nodes[0].start).toHaveBeenCalledTimes(1);
      expect(nodes[0].stop).toHaveBeenCalledTimes(1);
      nodes[0].onended();
      expect(context.close).toHaveBeenCalledTimes(1);
      expect(nodes.every((n) => n.disconnect.mock.calls.length === 1)).toBe(
        true,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
