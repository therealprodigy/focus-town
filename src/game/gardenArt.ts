import { townBrush, paintLantern } from "./townDetails";
import { paintCat } from "./townLife";
import type { UpgradeId } from "./townCatalog";
type Layer = { y: number; paint: () => void };
export function paintBuildingIdentity(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; width: number; height: number; name: string },
) {
  const r = townBrush(ctx),
    { x, y, width: w, height: h } = b;
  if (b.name.includes("HOUSE")) {
    // Exposed oak, a repaired plaster patch, and stacked logs by the porch.
    [14, w - 20].forEach((dx) => r(x + dx, y + 26, 5, h - 28, "#5b594a"));
    r(x + w / 2 - 5, y + 26, 5, 32, "#5b594a");
    r(x + 20, y + 100, 28, 15, "#b7ae8b");
    r(x + 22, y + 100, 24, 2, "#ddd0aa");
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        r(x - 18 + col * 7, y + h - 8 - row * 6, 6, 5, "#805f42");
        r(x - 17 + col * 7, y + h - 7 - row * 6, 3, 2, "#bb9966");
      }
    r(x + 48, y - 48, 50, 32, "#2e424a");
    r(x + 52, y - 44, 42, 24, "#b4c1b6");
    r(x + 70, y - 44, 4, 24, "#655b49");
    r(x + 52, y - 34, 42, 3, "#655b49");
  } else if (b.name.includes("GOODS")) {
    for (const n of [0, 1, 3]) {
      r(x + 8 + n * 36, y + 96, 28, 18, "#726048");
      r(x + 10 + n * 36, y + 98, 24, 2, "#af956c");
    }
    r(x + w - 22, y + 44, 14, 26, "#c8a46d");
    r(x + w - 20, y + 46, 10, 22, "#343e39");
    r(x + w - 16, y + 49, 3, 12, "#d6b272");
  } else {
    // Limestone corner blocks and a copper roof lantern distinguish the library.
    for (let i = 0; i < 7; i++)
      for (const dx of [0, w - 12]) {
        r(x + dx, y + 30 + i * 14, 12, 9, "#b4b8ae");
        r(x + dx, y + 30 + i * 14, 12, 2, "#d0ccb6");
      }
    r(x + w / 2 - 22, y - 106, 44, 10, "#36595c");
    r(x + w / 2 - 14, y - 130, 28, 24, "#708c81");
    r(x + w / 2 - 10, y - 126, 20, 16, "#e2c281");
    r(x + w / 2 - 2, y - 130, 4, 24, "#3c5554");
    r(x + w / 2 - 18, y - 136, 36, 6, "#557b73");
    r(x + w / 2 - 10, y - 144, 20, 8, "#739288");
    r(x + w / 2 - 2, y - 151, 4, 8, "#dbbd7b");
  }
}
export function paintGarden(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  time: number,
  upgrades: readonly UpgradeId[],
  daylight: number,
) {
  const r = townBrush(ctx),
    open = upgrades.includes("crossing-lanterns");
  const label = (value: string, x: number, y: number, size = 9) => {
    ctx.font = size + 'px "Silkscreen", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = "#dfd1ac";
    ctx.fillText(value, x, y);
  };
  const path = (x: number, y: number, w: number, h: number) => {
    r(x - 4, y - 4, w + 8, h + 8, "#41565a");
    r(x, y, w, h, "#7b837b");
    for (let yy = y + 4; yy < y + h; yy += 12)
      for (let xx = x + 4; xx < x + w - 4; xx += 16) {
        r(xx, yy, 10, 2, (xx + yy) % 3 ? "#a0a596" : "#637773");
      }
  };
  r(960, 0, 480, 600, daylight > 0.6 ? "#3c5757" : "#324b55");
  for (let i = 0; i < 260; i++) {
    const x = 964 + ((i * 73) % 472),
      y = (i * 47) % 596;
    r(x, y, 4, 2, i % 3 ? "#597a73" : "#2c4348");
    if (i % 7 === 0) {
      r(x + 2, y - 4, 2, 6, "#819783");
    }
  }
  path(808, 404, 340, 44);
  path(1128, 284, 44, 164);
  path(1168, 342, 152, 36);
  path(1288, 308, 36, 112);
  path(1168, 196, 44, 160);
  // The beds are cultivated in rows rather than scattered decoration.
  for (let bed = 0; bed < 3; bed++) {
    const x = 978 + bed * 36,
      y = 292;
    r(x - 2, y - 2, 28, 80, "#a28c64");
    r(x, y, 24, 76, "#514f41");
    for (let n = 0; n < 5; n++) {
      const yy = y + 8 + n * 13;
      r(x + 10, yy, 2, 8, "#9dae7f");
      r(x + 5, yy + 3, 12, 3, "#6c9174");
      r(x + 8, yy - 2, 7, 5, n % 2 ? "#d1cea4" : "#a2bbad");
    }
  }
  layers.push({
    y: 278,
    paint: () => {
      r(1088, 170, 140, 108, "#273d44");
      r(1092, 174, 132, 104, "#4d706f");
      // Glass panes, narrow copper mullions and plants visible inside.
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 5; col++) {
          const x = 1096 + col * 25,
            y = 180 + row * 39;
          r(x, y, 21, 34, "#7eaaa3");
          r(x + 2, y + 2, 16, 2, "#c5d9c1");
          r(x + 2, y + 6, 3, 14, "#97c0b7");
          r(x + 5, y + 24, 10, 8, "#456c54");
          r(x + 8, y + 17, 4, 14, "#a0b886");
        }
      for (let row = 0; row < 5; row++) {
        const inset = (4 - row) * 12;
        r(1080 + inset, 120 + row * 11, 156 - inset * 2, 12, "#537c7c");
        r(1084 + inset, 120 + row * 11, 148 - inset * 2, 2, "#a8bbae");
      }
      r(1150, 224, 24, 54, "#705b43");
      r(1154, 228, 16, 42, "#476a69");
      r(1168, 249, 3, 3, "#e2c280");
      r(1146, 278, 32, 6, "#bbb48e");
      r(1100, 208, 120, 12, "#354f50");
      label("THE GLASSHOUSE", 1160, 217, 8);
      r(1144, 280, 30, 7, "#ded0a6");
      r(1158, 280, 2, 7, "#84785b");
    },
  });
  layers.push({
    y: 412,
    paint: () => {
      r(1274, 372, 64, 16, "#817759");
      r(1274, 389, 64, 8, "#b19868");
      r(1280, 397, 6, 15, "#4e5144");
      r(1326, 397, 6, 15, "#4e5144");
      r(1288, 382, 6, 6, "#e0d3a7");
      r(1304, 382, 6, 6, "#b6cbb7");
      r(1278, 375, 56, 2, "#cbb383");
    },
  });
  layers.push({
    y: 310,
    paint: () => {
      r(1314, 267, 4, 35, "#a38961");
      r(1304, 304, 26, 4, "#726c55");
      r(1309, 293, 3, 14, "#a38961");
      r(1321, 293, 3, 14, "#a38961");
      r(1298, 263, 36, 10, "#ab915e");
      r(1302, 261, 30, 4, "#e3c38a");
      r(1332, 260, 6, 16, "#b6ad8a");
      r(1335, 263, 3, 10, "#263f48");
    },
  });
  layers.push({
    y: 486,
    paint: () => {
      r(978, 452, 54, 18, "#99784e");
      r(978, 452, 54, 3, "#caab73");
      r(982, 470, 6, 16, "#5c5140");
      r(1022, 470, 6, 16, "#5c5140");
      for (let yy = 455; yy < 467; yy += 4)
        for (let xx = 992; xx < 1012; xx += 6) r(xx, yy, 4, 3, "#5a513e");
      r(982, 447, 8, 5, "#879b9a");
      r(988, 445, 3, 10, "#b1996b");
    },
  });
  layers.push({
    y: 400,
    paint: () => {
      r(1084, 374, 32, 24, "#9e7955");
      r(1084, 374, 32, 3, "#d6b078");
      r(1094, 365, 9, 10, "#ded2ab");
      r(1103, 368, 3, 4, "#ded2ab");
      label("JUN", 1100, 392, 7);
    },
  });
  // Orchard canopies are compact, with a clear walking lane below them.
  [1218, 1280, 1340].forEach((x, i) =>
    layers.push({
      y: 208 + (i % 2) * 22,
      paint: () => {
        const y = 208 + (i % 2) * 22;
        r(x - 4, y - 44, 8, 44, "#645d4b");
        r(x - 25, y - 64, 50, 32, "#456759");
        r(x - 19, y - 76, 38, 24, "#577c62");
        r(x - 10, y - 84, 20, 14, "#73947a");
        [
          [-14, -56],
          [10, -64],
          [1, -40],
        ].forEach(([dx, dy]) => {
          r(x + dx, y + dy, 6, 6, "#c89b65");
          r(x + dx, y + dy, 2, 2, "#f2ce85");
        });
      },
    }),
  );
  layers.push({ y: 194, paint: () => paintCat(ctx, 1250, 194, time, false) });
  [
    [920, 454],
    [1180, 458],
    [1344, 432],
  ].forEach(([x, y]) =>
    layers.push({ y, paint: () => paintLantern(ctx, x, y, time) }),
  );
  if (open)
    for (const x of [724, 808])
      layers.push({ y: 460, paint: () => paintLantern(ctx, x, 460, time) });
  // Low stone seating and a bank of ferns close the southern path.
  for (let n = 0; n < 8; n++) {
    r(1070 + n * 16, 506 + (n % 2) * 4, 12, 8, "#778d86");
    r(1072 + n * 16, 506 + (n % 2) * 4, 8, 2, "#b4bfa4");
  }
  label("WHISPERING GARDEN", 1190, 326, 9);
  if (!open) {
    r(812, 402, 12, 48, "#53634f");
    r(800, 408, 40, 5, "#ac946c");
    r(800, 435, 40, 5, "#ac946c");
  }
}
