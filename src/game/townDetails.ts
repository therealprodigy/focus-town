type Brush = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) => void;
import { TOWN_LAMPS } from "./world";
export function townBrush(ctx: CanvasRenderingContext2D): Brush {
  return (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
}
export function paintSurroundings(
  ctx: CanvasRenderingContext2D,
  time: number,
  daylight: number,
  width = 960,
) {
  const r = townBrush(ctx);
  r(-1600, -1200, 4160, 3000, "#1c2d47");
  // A continuous forest surrounds the map, including on wide monitors.
  for (let x = -1500; x < 2500; x += 56)
    for (const y of [-68, 652]) {
      r(x + 18, y - 20, 12, 96, "#2a334c");
      for (let tier = 0; tier < 4; tier++) {
        const w = 36 + tier * 20;
        r(
          x + 24 - w / 2,
          y - 108 + tier * 22,
          w,
          32,
          tier % 2 ? "#263f59" : "#2c4b63",
        );
        r(x + 28 - w / 2, y - 108 + tier * 22, w - 14, 3, "#42627a");
      }
    }
  for (let y = -80; y < 850; y += 72)
    for (const x of [-84, width + 48]) {
      r(x - 6, y, 12, 48, "#3b3b50");
      r(x - 52, y - 58, 104, 44, "#203b53");
      r(x - 40, y - 76, 80, 64, "#294d64");
      r(x - 24, y - 88, 48, 36, "#355c72");
      r(x - 40, y - 58, 56, 4, "#517990");
    }
  // Distant lights share the observatory's cool blue and warm brass palette.
  for (let i = 0; i < 36; i++) {
    const x = -1000 + i * 92,
      y = -46 + (i % 5) * 7;
    r(x, y, 2, 2, daylight > 0.6 ? "#7790a2" : "#cfcaac");
    if (i % 5 === 0)
      r(x - 2, y + 4 + Math.sin(time / 2300 + i) * 2, 6, 2, "#75869e");
  }
}
export function paintMoonCourt(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  // Weathered compass stones, laid around the fountain rather than a UI ring.
  [
    [388, 360, 24, 8],
    [500, 360, 24, 8],
    [448, 288, 16, 8],
    [448, 404, 16, 8],
    [404, 316, 12, 8],
    [500, 316, 12, 8],
    [404, 400, 12, 8],
    [500, 400, 12, 8],
  ].forEach(([x, y, w, h]) => {
    r(x, y, w, h, "#8794a1");
    r(x + 2, y, w - 4, 2, "#b2b5b5");
  });
  for (let i = 0; i < 5; i++) {
    r(244 + i * 36, 407 + (i % 2) * 12, 24, 10, "#707c90");
    r(246 + i * 36, 407 + (i % 2) * 12, 18, 2, "#a1a8b4");
  }
  // Flower beds and moon-pale ferns soften the edge of the path.
  for (let i = 0; i < 18; i++) {
    const x = 280 + i * 22,
      y = 456 + (i % 3) * 12;
    if (x > 574) continue;
    r(x, y, 2, 10, "#618886");
    r(x - 4, y + 4, 10, 2, "#749d99");
    r(x - 2, y - 2, 6, 4, i % 3 ? "#bdafcb" : "#edcfa4");
  }
}
export function paintLantern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  const r = townBrush(ctx),
    sway = Math.sin(time / 1900 + x) * 1.5;
  r(x - 12, y - 2, 24, 5, "#172639");
  r(x - 4, y - 14, 8, 16, "#677083");
  r(x - 2, y - 86, 4, 76, "#384155");
  r(x - 4, y - 90, 26, 4, "#a58e75");
  r(x + 18 + sway, y - 88, 2, 9, "#a58e75");
  r(x + 12 + sway, y - 79, 14, 19, "#272d44");
  r(x + 14 + sway, y - 76, 10, 12, "#f1cba0");
  r(x + 18 + sway, y - 74, 3, 8, "#fff0c8");
  r(x + 10 + sway, y - 81, 18, 3, "#bca184");
  r(x + 12 + sway, y - 62, 14, 3, "#a58e75");
}
export function paintTownAccents(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  // Lottie's striped canvas awning; the shop is open for village upgrades.
  for (let i = 0; i < 10; i++) {
    r(436 + i * 14, 190, 14, 13, i % 2 ? "#617489" : "#d0c3b0");
    r(436 + i * 14, 202, 14, 5, i % 2 ? "#475b74" : "#ad9f97");
  }
  // A brass telescope and a round star window identify the library.
  r(736, 102, 36, 28, "#303e60");
  r(740, 98, 28, 36, "#303e60");
  r(742, 104, 24, 24, "#deb68f");
  r(748, 104, 4, 24, "#7c6d80");
  r(742, 114, 24, 4, "#7c6d80");
  r(776, 54, 38, 8, "#bca584");
  r(780, 50, 26, 8, "#dbbc91");
  r(812, 50, 6, 14, "#d3b89a");
  r(790, 62, 4, 20, "#796c7b");
  r(784, 78, 18, 3, "#a18c88");
  // Hand-strung lights between the front gardens.
  for (let x = 310; x < 438; x += 4) {
    const y = 294 + Math.sin(((x - 310) / 128) * Math.PI) * 17;
    r(x, y, 4, 1, "#b0a28a");
    if ((x - 310) % 28 === 0) {
      r(x, y + 2, 3, 7, "#a79176");
      r(x - 2, y + 8, 7, 7, "#f2cf9d");
      r(x, y + 8, 3, 5, "#fff0c5");
    }
  }
}
export function paintLampPools(
  ctx: CanvasRenderingContext2D,
  darkness: number,
) {
  const r = townBrush(ctx);
  ctx.save();
  ctx.globalAlpha = 0.2 + darkness * 0.35;
  for (const { x, y } of TOWN_LAMPS) {
    r(x - 14, y - 14, 58, 26, "#d2ab7024");
    r(x - 6, y - 10, 40, 20, "#f6cc8830");
  }
  ctx.restore();
}

export function paintAtlas(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  // An atlas left outside the library: a real inspectable world object.
  r(702, 312, 30, 12, "#354257");
  r(704, 308, 26, 12, "#8a8193");
  r(706, 304, 22, 12, "#d9ccb3");
  r(716, 304, 2, 12, "#ac9a91");
  r(710, 307, 4, 1, "#697c8a");
}
export function paintBell(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  // The quiet bell is a small landmark, not a quest popup.
  r(374, 514, 24, 10, "#55667d");
  r(378, 510, 16, 4, "#a1a9b0");
  r(377, 470, 3, 40, "#6f687a");
  r(395, 470, 3, 40, "#6f687a");
  r(377, 470, 21, 4, "#ac9990");
  r(384, 479, 9, 12, "#c4a879");
  r(381, 489, 15, 3, "#ead1a0");
  r(387, 492, 3, 4, "#8d7a71");
}
