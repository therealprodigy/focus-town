import { townBrush, paintLantern } from "./townDetails";
import type { DiscoveryId, DiscoveryEffect } from "./discoveries";
import type { UpgradeId } from "./townCatalog";
export type TownLife = {
  discoveries?: DiscoveryId[];
  upgrades?: UpgradeId[];
  effect?: DiscoveryEffect;
  idleSeconds?: number;
};
export function paintCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  happy = false,
) {
  const r = townBrush(ctx);
  r(x - 18, y - 2, 38, 5, "#172639");
  r(x - 14, y - 12, 24, 12, "#b5a8b3");
  r(x - 12, y - 20, 14, 12, "#d7c5c0");
  r(x - 12, y - 24, 4, 8, "#b5a8b3");
  r(x - 2, y - 24, 4, 8, "#b5a8b3");
  r(x - 9, y - 14, 2, 2, "#353c52");
  r(x - 3, y - 14, 2, 2, "#353c52");
  r(x - 6, y - 10, 2, 2, "#93687c");
  r(x + 10, y - 8, 12, 4, "#b5a8b3");
  r(x + 20, y - 12 - (Math.sin(time / 1200) > 0 ? 3 : 0), 4, 8, "#b5a8b3");
  if (happy) {
    r(x - 4, y - 38, 4, 4, "#edacaf");
    r(x + 2, y - 38, 4, 4, "#edacaf");
    r(x - 2, y - 34, 6, 4, "#edacaf");
    r(x, y - 30, 2, 2, "#edacaf");
  }
}
export function paintNorthFence(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  r(748, 288, 112, 4, "#ac9990");
  r(748, 304, 112, 4, "#716478");
  for (let x = 750; x <= 858; x += 18) {
    r(x, 280, 6, 40, "#655970");
    r(x, 280, 2, 38, "#bcaba0");
    r(x - 2, 278, 10, 4, "#8898a7");
  }
  // Dense roots continue north to the map boundary; the east bank stays sealed.
  for (let y = 0; y < 292; y += 28) {
    r(856, y, 12, 30, "#294157");
    r(860, y + 5, 26, 5, "#4b6679");
    r(872, y + 10, 6, 18, "#365167");
  }
}
export function paintUpgrades(
  ctx: CanvasRenderingContext2D,
  o: TownLife,
  time: number,
) {
  const r = townBrush(ctx),
    has = (id: UpgradeId) => o.upgrades?.includes(id);
  if (has("porch-lanterns")) {
    paintLantern(ctx, 176, 292, time);
    paintLantern(ctx, 310, 292, time);
  }
  if (has("festival"))
    for (let x = 432; x < 584; x += 4) {
      const y = 162 + Math.sin(((x - 432) / 152) * Math.PI) * 15;
      r(x, y, 4, 2, "#b9a7a0");
      if ((x - 432) % 20 === 0) {
        const c = (x - 432) % 40 ? "#c1abd9" : "#edc794";
        r(x, y + 2, 10, 5, c);
        r(x + 2, y + 7, 6, 4, c);
        r(x + 4, y + 11, 2, 3, c);
      }
    }
}
export function paintMoonflower(ctx: CanvasRenderingContext2D, n: number) {
  const r = townBrush(ctx),
    x = 292 + n * 23,
    y = 486 + (n % 2) * 12;
  r(x - 6, y + 2, 18, 8, "#62576c");
  r(x, y - 12, 2, 16, "#82a9a2");
  r(x - 4, y - 14, 10, 6, "#d5cbea");
  r(x - 2, y - 16, 6, 10, "#d5cbea");
  r(x, y - 12, 2, 2, "#f5dfad");
}
export function paintFountainUpgrade(
  ctx: CanvasRenderingContext2D,
  time: number,
) {
  const r = townBrush(ctx);
  for (let n = 0; n < 7; n++) {
    const phase = (time / 80 + n * 7) % 28,
      x = 431 + n * 8;
    r(x, 326 - phase, 2, 5, "#b6d9dc");
    r(x, 359 + Math.sin(time / 380 + n) * 3, 5, 2, "#e3e6d1");
  }
  r(450, 294, 12, 4, "#ead1a0");
}
export function paintDiscoveries(
  ctx: CanvasRenderingContext2D,
  scene: "village" | "house",
  o: TownLife,
  time: number,
  night: boolean,
) {
  const r = townBrush(ctx),
    has = (id: DiscoveryId) => o.discoveries?.includes(id);
  if (scene === "village") {
    if (night)
      for (let n = 0; n < 3; n++) {
        const x = 604 + n * 22,
          y = 452 + (n % 2) * 9;
        r(x, y, 10, 6, "#91b9a0");
        r(x, y - 3, 3, 3, "#ece0b7");
        r(x + 7, y - 3, 3, 3, "#ece0b7");
        if (o.effect === "choir") {
          r(
            x + 2,
            y + 4,
            6,
            4 + (Math.sin(time / 180 + n) > 0 ? 2 : 0),
            "#d5d5a7",
          );
          const sy = y - 20 - ((time / 180 + n * 4) % 14);
          r(x + 2, sy, 4, 2, "#e7dcb4");
          r(x + 5, sy - 6, 2, 8, "#e7dcb4");
        }
      }
    if (has("quiet-bell"))
      for (let n = 0; n < 3; n++) {
        const x = 838 + n * 26,
          y = 466 - (n % 2) * 22;
        r(x - 2, y, 6, 24, "#6f6479");
        r(x - 6, y - 10, 14, 14, "#d9c094");
        r(x - 2, y - 7, 6, 8, "#fff0c9");
        if (o.effect === "bell") r(x - 9, y - 14, 20, 2, "#d9c094");
      }
  } else {
    if (night) {
      const x = 488 + Math.sin(time / 2100) * 7,
        y = 99 + Math.cos(time / 1300) * 3;
      r(x - 5, y, 4, 4, "#d2d7e2");
      r(x + 2, y, 4, 4, "#d2d7e2");
      r(x, y, 2, 6, "#f5e7c9");
      if (has("window-star")) {
        r(504, 101, 2, 6, "#efe1b1");
        r(502, 103, 6, 2, "#efe1b1");
      }
    }
  }
}

export function paintReadingCorner(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  r(144, 391, 66, 8, "#1b2d45");
  r(150, 371, 52, 9, "#a38a84");
  r(150, 382, 52, 10, "#806f80");
  r(154, 392, 5, 8, "#586078");
  r(194, 392, 5, 8, "#586078");
  r(153, 374, 46, 2, "#cebaa4");
  r(175, 369, 18, 22, "#8588b5");
  r(179, 369, 3, 22, "#c4b3cf");
  r(175, 387, 18, 3, "#d6c2b5");
  r(162, 387, 14, 7, "#e0d1b7");
  r(168, 387, 2, 7, "#91839d");
  r(155, 378, 6, 5, "#e1c699");
  r(161, 378, 2, 3, "#e1c699");
  for (let n = 0; n < 6; n++) {
    r(143 + n * 12, 408 + (n % 2) * 5, 8, 4, "#9aa5b2");
    r(145 + n * 12, 408 + (n % 2) * 5, 5, 1, "#c1bdc5");
  }
}
export function paintMailbox(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  r(307, 282, 5, 23, "#7b6b81");
  r(298, 275, 24, 15, "#476c82");
  r(301, 272, 18, 3, "#7494a4");
  r(303, 281, 13, 2, "#142b42");
  r(303, 280, 9, 2, "#eed5a7");
  r(320, 272, 2, 13, "#ba987e");
  r(322, 271, 7, 5, "#d7ad91");
}
export function paintTeaStall(ctx: CanvasRenderingContext2D, time: number) {
  const r = townBrush(ctx);
  r(130, 473, 82, 8, "#1d2e45");
  r(136, 449, 68, 27, "#7c6e86");
  r(140, 454, 60, 3, "#baacb0");
  r(140, 468, 60, 3, "#4f526e");
  r(134, 444, 72, 7, "#c5ae94");
  r(138, 407, 5, 40, "#a98f85");
  r(198, 407, 5, 40, "#a98f85");
  for (let i = 0; i < 8; i++) {
    r(128 + i * 10, 400, 10, 13, i % 2 ? "#7f86a7" : "#c7b6ac");
    r(128 + i * 10, 411, 10, 5, i % 2 ? "#596985" : "#a59198");
  }
  r(157, 420, 13, 10, "#d6b196");
  r(155, 418, 17, 4, "#6c6887");
  r(157, 430, 15, 14, "#858daa");
  r(155, 433, 3, 10, "#b69eaa");
  r(171, 433, 3, 10, "#b69eaa");
  r(160, 424, 2, 2, "#37455f");
  r(167, 424, 2, 2, "#37455f");
  r(181, 434, 12, 10, "#b7c1c4");
  r(183, 431, 8, 3, "#dce0d5");
  r(177, 437, 5, 4, "#b7c1c4");
  r(146, 440, 7, 5, "#e8cfa5");
  r(153, 440, 3, 3, "#e8cfa5");
  for (let i = 0; i < 3; i++) {
    const y = 430 - ((time / 140 + i * 5) % 18);
    r(184 + Math.sin(time / 900 + i) * 2, y, 3, 3, "#d4dce080");
  }
}
