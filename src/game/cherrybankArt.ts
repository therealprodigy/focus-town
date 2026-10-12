import { CHERRY_TREES, CHERRYBANK_LAMPS, residentPositions } from "./world";
import { paintLantern, townBrush } from "./townDetails";

type Layer = { y: number; paint: () => void };
type ResidentId = "edda" | "oren" | "pip";
const PINK = ["#d991a5", "#ecb2bb", "#f7d0cf", "#ffe4d9"];

function label(
  ctx: CanvasRenderingContext2D,
  words: string,
  x: number,
  y: number,
  size = 8,
) {
  ctx.font = size + 'px "Silkscreen", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "#493c47";
  ctx.fillText(words, x + 1, y + 1);
  ctx.fillStyle = "#f4dfbf";
  ctx.fillText(words, x, y);
}

export function paintCherryTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number,
  time: number,
) {
  const r = townBrush(ctx);
  r(x - 42, y - 4, 84, 8, "#56664b50");
  r(x - 8, y - 62, 16, 64, "#66504c");
  r(x - 5, y - 55, 5, 55, "#a27869");
  r(x - 18, y - 3, 36, 5, "#77584e");
  r(x - 23, y - 56, 18, 7, "#795750");
  r(x - 29, y - 76, 8, 24, "#795750");
  r(x + 5, y - 65, 22, 8, "#66504c");
  r(x + 20, y - 83, 8, 24, "#66504c");
  const clusters = [
    [-50, -89, 44, 30],
    [-35, -116, 48, 34],
    [4, -112, 40, 34],
    [22, -88, 36, 28],
    [-15, -88, 46, 34],
    [-37, -65, 32, 18],
  ];
  clusters.forEach(([dx, dy, w, h], n) => {
    r(x + dx + 4, y + dy - 4, w - 8, h + 8, "#b4758b");
    r(x + dx, y + dy, w, h, PINK[n % 2]);
    r(x + dx + 4, y + dy, w - 8, h - 8, PINK[1 + (n % 2)]);
    r(x + dx + 8, y + dy - 2, w - 20, 6, PINK[3]);
    for (let k = 0; k < 8; k++) {
      const px = x + dx + 4 + ((k * 13 + seed * 3 + n) % (w - 10));
      const py = y + dy + 4 + ((k * 7 + seed + n) % (h - 8));
      r(px, py, 6, 3, PINK[(k + n) % 4]);
      if (k % 3 === 0) r(px + 2, py - 2, 2, 7, PINK[3]);
    }
  });
  // A fixed time still shows suspended petals and visible blossoms in quiet mode.
  for (let n = 0; n < 5; n++) {
    const phase = (time / 85 + n * 23 + seed * 7) % 106;
    const px = x - 42 + n * 20 + Math.sin(time / 1700 + seed + n) * 12;
    r(px, y - 103 + phase, 4, 2, PINK[2 + (n % 2)]);
  }
}

export function paintCherryLetter(ctx: CanvasRenderingContext2D) {
  const r = townBrush(ctx);
  r(358, 458, 26, 4, "#53604b50");
  r(368, 422, 4, 38, "#74564a");
  r(350, 426, 40, 24, "#785849");
  r(354, 428, 32, 18, "#efdbb4");
  r(356, 430, 24, 2, "#b5a385");
  r(356, 440, 20, 2, "#b5a385");
  r(379, 431, 4, 6, "#d88fa2");
  r(377, 433, 8, 2, "#eab4bd");
  r(368, 425, 3, 4, "#ccb27f");
}

export function paintCherryResident(
  ctx: CanvasRenderingContext2D,
  id: ResidentId,
  x: number,
  y: number,
  time: number,
) {
  const r = townBrush(ctx);
  r(x - 17, y - 2, 34, 5, "#35493955");
  const bob = Math.sin(time / 1800 + x) > 0 ? 1 : 0;
  y -= bob;
  r(x - 10, y - 8, 8, 8, "#403c44");
  r(x + 3, y - 8, 8, 8, "#403c44");
  if (id === "edda") {
    // Silver bun, round spectacles, long plum skirt and a ledger under one arm.
    r(x - 13, y - 34, 26, 27, "#765b79");
    r(x - 17, y - 17, 34, 9, "#765b79");
    r(x - 9, y - 34, 5, 23, "#b290a8");
    r(x - 10, y - 54, 21, 21, "#deb69a");
    r(x - 13, y - 57, 24, 9, "#c5c5be");
    r(x + 6, y - 63, 10, 10, "#e2dbcc");
    r(x - 12, y - 50, 4, 13, "#c5c5be");
    r(x - 9, y - 46, 8, 6, "#584b5e");
    r(x + 3, y - 46, 8, 6, "#584b5e");
    r(x - 7, y - 45, 4, 3, "#c5d7d0");
    r(x + 5, y - 45, 4, 3, "#c5d7d0");
    r(x - 1, y - 44, 4, 2, "#584b5e");
    r(x + 10, y - 30, 10, 19, "#b2b98f");
    r(x + 12, y - 28, 6, 2, "#e8ddbc");
    r(x - 17, y - 29, 5, 15, "#deb69a");
  } else if (id === "oren") {
    // Rolled sleeves, a broad leather apron, red beard and a brass tuning hammer.
    r(x - 17, y - 36, 34, 24, "#819796");
    r(x - 11, y - 33, 23, 28, "#866045");
    r(x - 8, y - 28, 17, 2, "#b99262");
    r(x - 4, y - 19, 9, 8, "#5b4a3a");
    r(x - 12, y - 56, 24, 22, "#b98061");
    r(x - 14, y - 60, 28, 8, "#9f653f");
    r(x - 13, y - 41, 26, 10, "#9f653f");
    r(x - 8, y - 34, 16, 7, "#ae794c");
    r(x - 7, y - 48, 3, 3, "#342f38");
    r(x + 6, y - 48, 3, 3, "#342f38");
    r(x - 21, y - 29, 7, 17, "#b98061");
    r(x + 15, y - 29, 7, 17, "#b98061");
    r(x + 21, y - 29, 3, 19, "#c09f68");
    r(x + 17, y - 32, 12, 5, "#aebcb3");
  } else {
    // Short jacket, tilted cap, striped scarf and a round film canister.
    r(x - 12, y - 34, 25, 26, "#477c80");
    r(x - 9, y - 31, 6, 20, "#77aa9e");
    r(x - 9, y - 54, 20, 20, "#e2b88c");
    r(x - 13, y - 58, 27, 9, "#5b5076");
    r(x - 17, y - 51, 30, 4, "#83729a");
    r(x - 7, y - 44, 3, 3, "#393449");
    r(x + 6, y - 44, 3, 3, "#393449");
    r(x - 11, y - 36, 23, 5, "#e1ae75");
    r(x + 7, y - 34, 6, 18, "#e1ae75");
    r(x + 7, y - 29, 6, 3, "#ae795e");
    r(x + 7, y - 22, 6, 3, "#ae795e");
    r(x - 18, y - 25, 11, 13, "#b9c0b2");
    r(x - 15, y - 22, 5, 7, "#657e83");
    r(x + 14, y - 28, 5, 16, "#e2b88c");
  }
}

export function paintCherrybank(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  time: number,
  residentTime: number,
) {
  const r = townBrush(ctx);
  const path = (x: number, y: number, w: number, h: number) => {
    r(x - 5, y - 4, w + 10, h + 8, "#8a8a68");
    r(x, y, w, h, "#c1ad91");
    for (let yy = y + 4; yy < y + h; yy += 12)
      for (let xx = x + 4; xx < x + w - 4; xx += 20) {
        r(xx, yy, 12, 2, "#dbc6a5");
        r(xx + 3, yy + 5, 5, 2, "#ac997f");
      }
  };
  // Match the old town's blocked southern edge with an actual hedge and forest floor.
  r(0, 600, 796, 200, "#3e563b");
  for (let x = 0; x < 796; x += 28) {
    r(x, 594, 28, 16, "#49633f");
    r(x + 3, 588, 22, 10, "#6e8150");
    r(x + 7, 588, 12, 3, "#95a66b");
  }
  for (let n = 0; n < 270; n++) {
    const x = 1444 + ((n * 73) % 470),
      y = 8 + ((n * 47) % 772);
    r(x, y, 4 + (n % 2) * 4, 2, n % 3 ? "#aab37c" : "#788c5e");
    if (n % 9 === 0) r(x + 2, y - 4, 2, 6, "#b6be88");
  }
  // The garden path widens into a continuous walking circuit with short branches.
  path(1308, 342, 520, 40);
  path(1648, 352, 44, 338);
  path(1512, 288, 36, 66);
  path(1560, 378, 36, 122);
  path(1788, 376, 36, 262);
  path(1508, 682, 302, 34);
  path(1510, 596, 36, 96);
  path(1510, 488, 278, 32);
  // Newly walkable southern garden is a quiet meadow, not an empty green rectangle.
  for (let n = 0; n < 150; n++) {
    const x = 830 + ((n * 83) % 1074),
      y = 608 + ((n * 53) % 176);
    if (
      (x > 1498 && x < 1552) ||
      (x > 1640 && x < 1700) ||
      (y > 672 && y < 724)
    )
      continue;
    r(x, y, 4, 2, n % 3 ? "#b4b67c" : "#728454");
    if (n % 8 === 0) {
      r(x, y - 6, 2, 8, "#607e58");
      r(x - 2, y - 8, 6, 4, "#dfbfac");
    }
  }
  for (const [i, p] of CHERRY_TREES.entries()) {
    for (let n = 0; n < 10; n++)
      r(
        p.x - 45 + ((n * 17 + i * 9) % 94),
        p.y + 7 + ((n * 7) % 15),
        4,
        2,
        PINK[1 + (n % 3)],
      );
    layers.push({
      y: p.y + 2,
      paint: () => paintCherryTree(ctx, p.x, p.y, i, time),
    });
  }
  // Low wildflower beds leave the promenade and all interaction approaches clear.
  for (let n = 0; n < 25; n++) {
    const x = 1440 + n * 17,
      y = 178 + (n % 3) * 13;
    r(x, y, 2, 11, "#58775c");
    r(x - 3, y - 2, 8, 4, n % 2 ? "#ebcbbc" : "#c8b5cc");
  }
  layers.push({
    y: 282,
    paint: () => {
      r(1484, 204, 120, 78, "#5c4c46");
      r(1488, 206, 112, 76, "#cfb897");
      r(1492, 214, 104, 2, "#e9d8b6");
      for (let n = 0; n < 7; n++) {
        r(1497 + n * 13, 224, 9, 23, ["#7b7383", "#6d8c7d", "#b18468"][n % 3]);
        r(1498 + n * 13, 228, 7, 2, "#dec69f");
      }
      r(1492, 247, 104, 5, "#80664e");
      r(1492, 267, 104, 5, "#80664e");
      r(1510, 256, 27, 9, "#f2dfbb");
      r(1522, 256, 2, 9, "#b4a38b");
      r(1480, 190, 128, 16, "#7b5c69");
      r(1488, 177, 112, 14, "#a67781");
      r(1500, 166, 88, 12, "#c39499");
      r(1512, 160, 64, 6, "#e4b8b3");
      r(1482, 203, 124, 3, "#e3c0ab");
      r(1500, 207, 88, 12, "#685252");
      label(ctx, "EDDA'S ARCHIVE", 1544, 217, 7);
      r(1581, 256, 9, 10, "#708d81");
      r(1584, 249, 2, 10, "#a7b78a");
    },
  });
  layers.push({
    y: 446,
    paint: () => {
      r(1528, 420, 96, 12, "#9b7754");
      r(1528, 420, 96, 3, "#dbb57e");
      r(1532, 432, 6, 14, "#654e41");
      r(1614, 432, 6, 14, "#654e41");
      for (let n = 0; n < 3; n++) {
        const x = 1540 + n * 28;
        r(x + 3, 398 - n * 3, 10, 17 + n * 3, "#bf935a");
        r(x, 413, 16, 5, "#edc583");
        r(x + 7, 394 - n * 3, 3, 5, "#f0d6a1");
        r(x + 4, 402, 3, 10, "#e4bd7d");
      }
      r(1536, 435, 80, 9, "#644e43");
      label(ctx, "OREN / BELLS", 1576, 443, 7);
    },
  });
  layers.push({
    y: 402,
    paint: () => {
      r(1796, 322, 5, 80, "#79624e");
      r(1859, 322, 5, 80, "#79624e");
      r(1792, 322, 76, 5, "#baa17a");
      r(1800, 328, 60, 54, "#e2d5b8");
      r(1804, 332, 52, 45, "#f1e5c8");
      r(1818, 343, 24, 27, "#99b4a9");
      r(1824, 348, 12, 14, "#ebc681");
      r(1828, 340, 4, 7, "#645e55");
      r(1827, 349, 6, 10, "#fff0c3");
      label(ctx, "PIP'S PICTURES", 1830, 393, 7);
    },
  });
  layers.push({
    y: 492,
    paint: () => {
      r(1766, 470, 44, 13, "#7e6552");
      r(1770, 483, 5, 9, "#4e4b47");
      r(1800, 483, 5, 9, "#4e4b47");
      r(1772, 448, 26, 22, "#49656a");
      r(1798, 451, 10, 10, "#bda87b");
      r(1806, 452, 3, 8, "#e1d8bb");
      for (const x of [1771, 1789]) {
        r(x, 434, 14, 14, "#aebeb3");
        r(x + 4, 438, 6, 6, "#50696c");
        r(x + 6, 435 + (Math.floor(time / 300) % 2) * 8, 2, 4, "#e5dcc3");
      }
      r(1774, 473, 22, 5, "#d6bea0");
    },
  });
  // Platform floor is flush paving; only its bench and luggage block feet.
  r(1718, 598, 152, 60, "#8e8b77");
  for (let x = 1720; x < 1870; x += 12) r(x, 640, 8, 3, "#d4c294");
  r(1718, 654, 152, 4, "#656e64");
  layers.push({
    y: 634,
    paint: () => {
      r(1738, 588, 112, 18, "#7c6a58");
      r(1738, 610, 112, 10, "#b39a6f");
      r(1744, 620, 6, 14, "#625849");
      r(1838, 620, 6, 14, "#625849");
      r(1742, 591, 104, 3, "#c2aa7d");
      r(1750, 591, 26, 17, "#e1d1af");
      for (let yy = 595; yy < 606; yy += 4) r(1754, yy, 18, 2, "#a39175");
      r(1810, 603, 25, 18, "#746475");
      r(1818, 599, 10, 5, "#c6a779");
      r(1815, 604, 3, 17, "#c6a779");
      r(1736, 578, 116, 10, "#445d60");
      label(ctx, "PLATFORM 9 + A BIT", 1794, 586, 7);
    },
  });
  layers.push({
    y: 668,
    paint: () => {
      r(1496, 646, 64, 12, "#967a58");
      r(1500, 658, 5, 10, "#615243");
      r(1550, 658, 5, 10, "#615243");
      r(1502, 638, 50, 16, "#ddd0ad");
      r(1506, 639, 42, 13, "#54697b");
      for (let n = 0; n < 8; n++)
        r(1509 + ((n * 11) % 36), 641 + ((n * 3) % 9), 2, 2, "#f1dcad");
      r(1525, 639, 2, 13, "#a7b6bb");
      r(1507, 644, 39, 1, "#a7b6bb");
      r(1554, 641, 5, 6, "#b0c2b0");
    },
  });
  layers.push({
    y: 344,
    paint: () => {
      r(1638, 276, 8, 68, "#795d4c");
      r(1588, 280, 108, 16, "#73575b");
      r(1594, 278, 96, 2, "#b79880");
      label(ctx, "CHERRYBANK", 1642, 292, 8);
      r(1594, 300, 96, 13, "#806952");
      label(ctx, "< HOME  PIP >", 1642, 310, 7);
      r(1603, 317, 78, 12, "#806952");
      label(ctx, "BELLS / SOUTH", 1642, 326, 6);
    },
  });
  // Copper lanterns stitch the new district to the existing garden palette.
  for (const { x, y } of CHERRYBANK_LAMPS)
    layers.push({ y, paint: () => paintLantern(ctx, x, y, time) });
  const residents = residentPositions(residentTime);
  for (const id of ["edda", "oren", "pip"] as const) {
    const p = residents[id];
    layers.push({
      y: p.y,
      paint: () => paintCherryResident(ctx, id, p.x, p.y, time),
    });
  }
}
