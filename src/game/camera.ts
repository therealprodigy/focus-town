import type { Point, WorldScene } from "./world";

// Rendering follows the player; saves, collisions and co-op use map coordinates.
export function getCamera(
  scene: Pick<WorldScene, "id" | "width" | "height">,
  player: Point,
  width: number,
  height: number,
) {
  const w = Number.isFinite(width) ? Math.max(1, width) : 960;
  const h = Number.isFinite(height) ? Math.max(1, height) : 600;
  const scale = Math.max(h / (scene.id === "house" ? 560 : 650), w / 1440);
  const visibleWidth = w / scale,
    visibleHeight = h / scale;
  // Extra forest around each edge keeps the whole sprite visible at map limits.
  const follow = (at: number, size: number, visible: number, margin: number) =>
    visible >= size + margin * 2
      ? (size - visible) / 2
      : Math.max(-margin, Math.min(size - visible + margin, at - visible / 2));
  return {
    x: follow(player.x, scene.width, visibleWidth, 40),
    y: follow(player.y - 28, scene.height, visibleHeight, 88),
    scale,
    width: visibleWidth,
    height: visibleHeight,
  };
}
