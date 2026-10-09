import {
  paintReadingCorner,
  paintMailbox,
  paintTeaStall,
  paintCat,
  paintNorthFence,
  paintUpgrades,
  paintMoonflower,
  paintFountainUpgrade,
  paintDiscoveries,
  type TownLife,
} from "./townLife";
import {
  BUILDINGS,
  TOWN_LAMPS,
  VILLAGE_TREES,
  WORLDS,
  type Player,
  type SceneId,
} from "./world";
import {
  paintSurroundings,
  paintMoonCourt,
  paintTownAccents,
  paintLantern,
  paintLampPools,
  paintAtlas,
  paintBell,
} from "./townDetails";
export type Peer = {
  id: string;
  name: string;
  scene: SceneId;
  x: number;
  y: number;
  facing: Player["facing"];
  walking?: boolean;
  walkFrame?: number;
};
type Options = TownLife & {
  camera?: { x: number; y: number; width: number; height: number };
  peers?: Peer[];
  sharedMinutes?: number;
  characterName?: string;
  time: number;
  activity: "idle" | "walking" | "focusing" | "sleeping";
  streak: number;
  interactionId?: string;
};
export const WORLD_DAY_MS = 12 * 60 * 1000;
export function getWorldClock(now = Date.now()) {
  const safe = Number.isFinite(now) ? now : 0;
  const hourFloat =
    (((((safe % WORLD_DAY_MS) / WORLD_DAY_MS) * 24 + 8) % 24) + 24) % 24;
  const hour = Math.floor(hourFloat),
    minute = Math.floor((hourFloat % 1) * 60);
  const label =
    hour < 5 || hour >= 20
      ? "Night"
      : hour < 8
        ? "Dawn"
        : hour < 17
          ? "Day"
          : "Dusk";
  const daylight = Math.max(
    0,
    Math.min(1, (Math.sin(((hourFloat - 6) / 24) * Math.PI * 2) + 0.18) * 1.5),
  );
  return { hour, minute, label, daylight };
}
const C = {
  ink: "#192b42",
  grass: "#32475f",
  path: "#727b8f",
  pale: "#eddbc2",
  wood: "#69576a",
  amber: "#f1c799",
  teal: "#89b6bb",
  water: "#3b6285",
};
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const palette: Record<string, string> = {
  X: "#243139",
  H: "#253d49",
  h: "#416271",
  S: "#e0af83",
  s: "#bb805f",
  T: "#376f70",
  t: "#67a79c",
  B: "#4c4540",
  A: "#d9af65",
  L: "#fff0b1",
  W: "#e7d9b0",
  E: "#253139",
};
const front = [
  ".......HH.......",
  "......HhHH......",
  ".....HhhhHH.....",
  "....HHHHHHHH....",
  "...HHAAAAAHHH...",
  ".....hSSSSh.....",
  ".....SESESS.....",
  "......SSSS......",
  ".....XATAX......",
  "....XTTtTTX.....",
  "...XTTTtTTTX....",
  "...STTTtTTSA....",
  "....TTTTTT.AL...",
  "...XTTTTTTXAA...",
  ".....BB.BB......",
  ".....XX.XX......",
];
const back = front.map((r, i) =>
  i === 5
    ? ".....hhhhhh....."
    : i === 6
      ? ".....hHHHhh....."
      : i === 7
        ? "......hhhh......"
        : i === 8
          ? ".....XTTTX......"
          : r,
);
const side = [
  ".......HH.......",
  "......HhHH......",
  "......HhhHH.....",
  ".....HHHHHHH....",
  "....HHAAAAAHHH..",
  "......hSSSS.....",
  "......hSESS.....",
  ".......SSSSS....",
  "......XTAX......",
  ".....XTTtTX.....",
  "....XTTTtTX.....",
  ".....TTTSSA.....",
  ".....TTTT.AL....",
  ".....XTTTXAA....",
  "......BBBB......",
  "......XXXX......",
];
function matrix(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  scale = 4,
  colors = palette,
) {
  rows.forEach((row, j) =>
    [...row].forEach((cell, i) => {
      if (colors[cell]) {
        ctx.fillStyle = colors[cell];
        ctx.fillRect(
          Math.round(x + i * scale),
          Math.round(y + j * scale),
          scale,
          scale,
        );
      }
    }),
  );
}
export function renderWorld(
  ctx: CanvasRenderingContext2D,
  sceneId: SceneId,
  player: Player,
  o: Options,
) {
  const t = o.time / 1000,
    clock = getWorldClock(),
    darkness = 1 - clock.daylight;
  const layers: { y: number; paint: () => void }[] = [];
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const text = (
    value: string,
    x: number,
    y: number,
    color = C.pale,
    size = 10,
  ) => {
    ctx.font = size + 'px "Silkscreen", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = C.ink;
    ctx.fillText(value, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  };
  const shadow = (x: number, y: number, w: number) => {
    rect(x - w / 2 + 6, y - 5, w - 12, 10, "#111c354d");
    rect(x - w / 2, y - 2, w, 4, "#111c354d");
  };
  const lightPatch = (
    x: number,
    y: number,
    w: number,
    h: number,
    strength = 1,
  ) => {
    if (darkness < 0.1) return;
    ctx.save();
    ctx.globalAlpha = darkness * strength;
    rect(x - w / 2 + 8, y, w - 16, h, "#e8b56620");
    rect(x - w / 2, y + 8, w, h - 16, "#e8b56618");
    rect(x - w / 2 + 16, y + 4, w - 32, h - 8, "#f4cd7624");
    ctx.restore();
  };
  const candle = (x: number, y: number) => {
    rect(x - 8, y + 8, 20, 4, C.wood);
    rect(x, y - 8, 4, 16, C.pale);
    rect(x - 4, y - 16, 12, 8, "#e5b86622");
    rect(x, y - 16 - (Math.floor(t * 3) % 2) * 2, 4, 8, C.amber);
    rect(x, y - 12, 4, 4, "#fff0c1");
  };
  const sign = (x: number, y: number, value: string) => {
    shadow(x, y + 22, 32);
    rect(x - 2, y, 4, 24, "#634932");
    rect(x - 22, y - 14, 44, 22, C.ink);
    rect(x - 20, y - 12, 40, 18, "#936d45");
    rect(x - 18, y - 10, 36, 2, "#ba915e");
    rect(x - 18, y + 2, 36, 2, "#6b4d37");
    text(value, x, y + 1, C.pale, 8);
  };
  const flower = (x: number, y: number, seed: number) => {
    rect(x, y, 2, 8, "#476739");
    rect(x - 4, y + 4, 4, 2, "#8aa05b");
    const color = ["#e8b69a", "#c3aad6", "#edcd76", "#e0d5ad"][seed % 4];
    rect(x - 2, y - 4, 6, 6, color);
    rect(x - 4, y - 2, 10, 2, color);
    rect(x, y - 2, 2, 2, "#f8e0a0");
  };
  const rock = (x: number, y: number, seed: number) => {
    const w = seed % 3 === 0 ? 16 : 10;
    shadow(x + w / 2, y + 4, w + 4);
    rect(x + 2, y - 6, w - 4, 10, "#647367");
    rect(x, y - 2, w, 6, "#748477");
    rect(x + 2, y - 6, w - 6, 3, "#a1ad8b");
    rect(x + w - 4, y - 2, 4, 6, "#526457");
    rect(x + 2, y + 2, 4, 2, "#526457");
  };
  const tree = (x: number, y: number, seed: number) => {
    shadow(x, y, 80);
    rect(x - 16, y - 8, 32, 8, "#243b50");
    rect(x - 12, y - 52, 24, 48, "#434255");
    rect(x - 8, y - 48, 8, 44, "#7b6d7c");
    rect(x + 4, y - 44, 4, 40, "#2d3448");
    rect(x - 20, y - 4, 12, 4, "#645668");
    rect(x + 8, y - 4, 12, 4, "#2d3448");
    rect(x - 20, y - 52, 12, 8, "#434255");
    rect(x - 24, y - 60, 8, 12, "#434255");
    rect(x + 8, y - 64, 16, 8, "#434255");
    [
      [-20, -120, 40, 24],
      [-36, -104, 68, 28],
      [-48, -84, 96, 32],
      [-40, -60, 80, 24],
      [-24, -44, 48, 12],
    ].forEach(([dx, dy, w, h], index) => {
      rect(x + dx + 4, y + dy - 4, w - 8, h + 8, "#142d44");
      rect(x + dx, y + dy, w, h, "#204157");
      rect(x + dx + 4, y + dy, w - 12, h - 8, "#325b6e");
      rect(x + dx + 8, y + dy, w - 24, 4, "#688e9b");
      for (let k = 0; k < 13; k++) {
        const lx =
            x +
            dx +
            4 +
            Math.floor((hash(seed + index * 47 + k) * (w - 12)) / 4) * 4,
          ly =
            y +
            dy +
            4 +
            Math.floor((hash(seed + index * 73 + k + 500) * (h - 8)) / 4) * 4;
        rect(lx, ly, k % 3 ? 8 : 4, 4, k % 4 ? "#477687" : "#7ea1a7");
        if (k % 5 === 0) rect(lx + 4, ly + 4, 4, 4, "#294b63");
      }
    });
    rect(x - 28, y - 90, 12, 4, "#9ab3b5");
    rect(x - 32, y - 86, 4, 4, "#779fa7");
    rect(x + 20, y - 62, 12, 4, "#608895");
    rect(x + 8, y - 40, 8, 4, "#30556a");
    if (seed % 3 === 0) {
      rect(x - 22, y - 2, 4, 6, "#d6c59a");
      rect(x - 26, y - 4, 12, 4, "#bd7859");
      rect(x - 22, y - 4, 2, 2, "#f0d7aa");
    }
  };
  const building = (b: (typeof BUILDINGS)[number]) => {
    const { x, y, width: w, height: h, doorX } = b;
    shadow(x + w / 2, y + h, w + 24);
    rect(x - 4, y - 4, w + 8, h + 4, C.ink);
    rect(x, y, w, h, "#8b8d9b");
    for (let row = 0; row < h; row += 12) {
      rect(x, y + row, w, 2, "#73798b");
      for (let col = 12; col < w - 12; col += 32) {
        rect(x + col + (row % 24 ? 12 : 0), y + row + 2, 2, 10, "#798295");
        if ((col + row) % 3 === 0) rect(x + col, y + row + 5, 10, 2, "#a8a5ad");
      }
    }
    rect(x, y + h - 12, w, 12, "#546379");
    for (let col = 4; col < w; col += 20)
      rect(x + col, y + h - 8, 14, 2, "#939dac");
    rect(x + 4, y, 8, h, C.wood);
    rect(x + w - 12, y, 8, h, C.wood);
    rect(x, y + 60, w, 8, "#68576a");
    rect(x + 12, y + 64, w - 24, 2, "#c3b6ac");
    [x + 28, x + w - 60].forEach((wx) => {
      rect(wx - 6, y + 26, 44, 48, "#604632");
      rect(wx - 2, y + 30, 36, 40, "#d2b778");
      rect(wx + 2, y + 34, 28, 32, "#83a69b");
      rect(wx + 4, y + 36, 10, 14, "#b6ccc0");
      rect(wx + 18, y + 52, 10, 12, "#668b83");
      rect(wx + 12, y + 32, 4, 36, "#6e513c");
      rect(wx, y + 48, 32, 4, "#6e513c");
      rect(wx - 6, y + 72, 44, 8, "#624a37");
      rect(wx - 2, y + 70, 36, 6, "#587b48");
      [4, 16, 26].forEach((offset, i) => {
        rect(wx + offset, y + 66 - (i % 2) * 4, 4, 8, "#78914b");
        rect(
          wx + offset - 2,
          y + 64 - (i % 2) * 4,
          8,
          4,
          i % 2 ? "#d3b2c1" : "#edc69a",
        );
      });
    });
    rect(doorX - 20, y + h - 60, 40, 60, "#463d32");
    rect(doorX - 16, y + h - 56, 32, 52, "#805e40");
    for (let dx = -12; dx <= 12; dx += 8)
      rect(doorX + dx, y + h - 50, 2, 44, "#624730");
    rect(doorX - 12, y + h - 52, 24, 12, "#a9b391");
    rect(doorX - 2, y + h - 52, 4, 12, "#624730");
    rect(doorX + 8, y + h - 28, 4, 4, C.amber);
    rect(doorX - 24, y + h, 48, 8, "#7c8673");
    rect(doorX - 20, y + h, 40, 2, "#b8b497");
    for (let row = 0; row < 8; row++) {
      const inset = (7 - row) * 7,
        ry = y - 76 + row * 12;
      rect(x - 16 + inset, ry, w + 32 - inset * 2, 16, "#1f304a");
      rect(x - 12 + inset, ry, w + 24 - inset * 2, 12, b.roof);
      for (let tx = x - 8 + inset; tx < x + w + 8 - inset; tx += 24) {
        rect(tx + (row % 2) * 4, ry + 2, 16, 2, "#e2bd864c");
        rect(tx + (row % 2) * 4 + 16, ry + 4, 2, 8, "#263a3f55");
        rect(tx + (row % 2) * 4, ry + 10, 18, 2, "#263a3f44");
      }
    }
    rect(x - 16, y + 20, w + 32, 6, "#3b405a");
    rect(x - 12, y + 20, w + 24, 2, "#a39399");
    rect(x + w - 44, y - 96, 24, 48, "#807663");
    for (let cy = y - 92; cy < y - 52; cy += 8)
      rect(x + w - 44, cy, 24, 2, "#b7a187");
    rect(x + w - 32, y - 90, 2, 10, "#5f5b50");
    rect(x + w - 48, y - 100, 32, 8, "#3c443e");
    for (let j = 0; j < 3; j++) {
      const phase = (t * 8 + j * 14) % 44;
      rect(
        x + w - 36 + Math.sin(t + j) * 4,
        y - 108 - phase,
        12 + j * 4,
        8,
        "#d5d8be35",
      );
    }
    rect(x + 16, y + 80, w - 32, 16, "#293e55");
    rect(x + 18, y + 80, w - 36, 2, "#84949f");
    text(b.name, x + w / 2, y + 92, C.pale, 9);
    for (let k = 0; k < 6; k++) {
      rect(x + w - 8 + (k % 2) * 4, y + 28 + k * 12, 4, 16, "#3d6879");
      rect(x + w - 12 + (k % 2) * 8, y + 36 + k * 12, 8, 4, "#739397");
    }
    rect(doorX + 28, y + h - 54, 4, 12, "#4a4033");
    rect(doorX + 24, y + h - 46, 12, 16, "#544839");
    rect(doorX + 28, y + h - 42, 4, 8, "#e8c276");
    {
      ctx.save();
      ctx.globalAlpha = 0.65 + darkness * 0.3;
      [x + 28, x + w - 60].forEach((wx) => {
        rect(wx + 2, y + 34, 10, 14, "#f3d38c");
        rect(wx + 16, y + 34, 14, 14, "#e6b970");
        rect(wx + 2, y + 52, 10, 14, "#e6b970");
        rect(wx + 16, y + 52, 14, 14, "#f3d38c");
      });
      rect(doorX + 28, y + h - 42, 4, 8, "#ffdc8c");
      ctx.restore();
    }
  };
  const character = (
    x: number,
    y: number,
    facing: Player["facing"],
    npc = false,
    peer?: Peer,
  ) => {
    const walking = peer
        ? peer.walking === true
        : !npc && o.activity === "walking",
      step = walking ? Math.floor(peer?.walkFrame ?? player.walkFrame) % 2 : 0,
      bob = walking ? step * 2 : Math.floor(t * 0.8) % 2;
    shadow(x, y, 36);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - bob));
    if (facing === "left") ctx.scale(-1, 1);
    const colors = npc
      ? x < 500
        ? {
            ...palette,
            H: "#65513b",
            h: "#97724a",
            T: "#5d7950",
            t: "#94a86a",
            A: "#dbaf64",
          }
        : {
            ...palette,
            H: "#5c4a61",
            h: "#94738c",
            T: "#795b76",
            t: "#b08898",
            A: "#c9b78a",
          }
      : peer
        ? {
            ...palette,
            T: ["#665881", "#456e85", "#93614e", "#527749"][
              parseInt(peer.id.slice(0, 4), 16) % 4
            ],
            t: "#b8b9ab",
          }
        : palette;
    matrix(
      ctx,
      facing === "up"
        ? back
        : facing === "left" || facing === "right"
          ? side
          : front,
      -32,
      -64,
      4,
      colors,
    );
    if (walking) {
      rect(-12, -4, 8, 4, "#243139");
      rect(0, -4, 8, 4, "#243139");
      rect(step ? 0 : -12, -6, 8, 2, "#9a8061");
    }
    if (!npc) {
      rect(16, -20, 4, 4, "#fff0b1");
      rect(16, -16, 4, 2, "#f1c799");
    }
    ctx.restore();
  };
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const frame = o.camera ?? { x: 0, y: 0, width: 960, height: 600 };
  ctx.clearRect(frame.x, frame.y, frame.width, frame.height);
  paintSurroundings(ctx, o.time, clock.daylight);
  if (sceneId === "village") {
    rect(0, 0, 960, 600, C.grass);
    for (let i = 0; i < 170; i++) {
      const x = Math.floor(hash(i + 6000) * 240) * 4,
        y = Math.floor(hash(i + 9000) * 150) * 4;
      rect(
        x,
        y,
        12 + (i % 4) * 4,
        4 + (i % 3) * 4,
        i % 2 ? "#384f64" : "#2c4158",
      );
      if (i % 4 === 0) rect(x + 4, y + 4, 12, 4, "#3e576b");
    }
    for (let i = 0; i < 520; i++) {
      const x = Math.floor(hash(i) * 240) * 4,
        y = Math.floor(hash(i + 1900) * 150) * 4;
      rect(x, y, i % 5 ? 4 : 8, 2, i % 3 ? "#547383" : "#2b435b");
      if (i % 7 === 0) {
        rect(x + 2, y - 4, 2, 6, "#6b8d99");
        rect(x + 6, y - 2, 2, 4, "#6b8d99");
      }
    }
    const path = (x: number, y: number, w: number, h: number) => {
      rect(x - 6, y - 4, w + 12, h + 8, "#41576c");
      rect(x - 2, y - 2, w + 4, h + 4, "#5a6c7d");
      rect(x, y, w, h, C.path);
      for (let i = 0; i < (w * h) / 150; i++) {
        const px = x + Math.floor((hash(i + x) * (w - 8)) / 4) * 4,
          py = y + Math.floor((hash(i + y + 99) * (h - 4)) / 4) * 4;
        rect(px, py, i % 3 ? 4 : 8, 2, i % 2 ? "#8e98a6" : "#616d82");
        if (i % 11 === 0) rect(px + 2, py - 2, 6, 2, "#b2b7be");
      }
      for (let i = 0; i < h / 18; i++) {
        rect(x - 4, y + i * 18 + 4, 4, 6, "#3d5b70");
        rect(x + w, y + i * 18 + 10, 4, 4, "#4a687a");
      }
    };
    path(220, 280, 48, 148);
    path(220, 396, 512, 48);
    path(484, 244, 48, 164);
    path(724, 272, 48, 100);
    path(408, 312, 100, 124);
    path(432, 428, 48, 136);
    rect(736, 312, 72, 288, "#405974");
    rect(740, 316, 64, 284, "#8895a0");
    rect(744, 320, 56, 280, "#4c748d");
    rect(748, 320, 48, 280, C.water);
    rect(756, 320, 32, 280, "#325375");
    for (let i = 0; i < 35; i++) {
      const x = 752 + ((i * 12 + Math.floor(t * 3) * 4) % 32);
      rect(x, 324 + i * 8, 8 + (i % 2) * 4, 2, i % 2 ? "#95b6c4" : "#628ca6");
      if (i % 4 === 0) rect(748, 324 + i * 8, 4, 6, "#c2cfd0");
    }
    for (let y = 336; y < 600; y += 44) {
      rect(734, y, 2, 16, "#4c6a3d");
      rect(740, y + 4, 2, 12, "#788c49");
      rect(734, y - 2, 2, 6, "#b79e68");
      rect(802, y + 12, 2, 16, "#4c6a3d");
      rect(808, y + 16, 2, 12, "#788c49");
      rock(802, y + 36, y);
    }
    [724, 788].forEach((x) => {
      rect(x, 400, 24, 56, "#543f35");
      for (let y = 404; y < 456; y += 12) {
        rect(x, y, 24, 8, "#b18b5c");
        rect(x + 2, y, 20, 2, "#d1ac74");
        rect(x + 4, y + 4, 2, 2, "#634b35");
      }
      rect(x + 4, 392, 4, 16, C.wood);
      rect(x + 4, 448, 4, 16, C.wood);
    });
    rect(748, 416, 8, 8, "#aa8055");
    rect(780, 428, 8, 8, "#aa8055");
    rect(580, 432, 100, 48, "#4c697c");
    rect(588, 428, 84, 56, "#4c697c");
    rect(584, 436, 92, 40, "#8796a1");
    rect(592, 436, 76, 40, C.water);
    rect(584, 444, 92, 24, C.water);
    rect(596, 448, 68, 20, "#315573");
    for (let i = 0; i < 6; i++)
      rect(596 + i * 12, 442 + (i % 3) * 10, 8, 2, "#8babbc");
    [604, 632, 652].forEach((x, i) => {
      rect(x, 448 + (i % 2) * 12, 16, 8, "#95af60");
      rect(x + 8, 448 + (i % 2) * 12, 4, 4, C.water);
      rect(x + 2, 448 + (i % 2) * 12, 6, 2, "#b7c777");
    });
    rect(620, 438, 12, 8, "#a8b678");
    rect(620, 434, 4, 4, C.pale);
    rect(628, 434, 4, 4, C.pale);
    rect(620, 434, 2, 2, C.ink);
    rect(628, 434, 2, 2, C.ink);
    for (let i = 0; i < 78; i++) {
      const x = 140 + Math.floor(hash(i + 42) * 138) * 4,
        y = 456 + Math.floor(hash(i + 142) * 22) * 4;
      if ((x > 576 && x < 688) || (x > 420 && x < 492)) continue;
      flower(x, y, i);
    }
    [
      [146, 366],
      [302, 360],
      [556, 292],
      [832, 462],
      [340, 474],
      [566, 402],
      [150, 470],
    ].forEach(([x, y], i) => {
      rock(x, y, i);
      flower(x + 16, y - 4, i + 1);
      rect(x - 8, y, 2, 8, "#8da458");
    });
    for (let i = 0; i < 12; i++) {
      const x = 834 + (i % 4) * 18,
        y = 236 + Math.floor(i / 4) * 14;
      rect(x, y, 10, 2, "#7f9450");
      if (i % 3 === 0) flower(x, y, i);
    }
    paintMoonCourt(ctx);
    layers.push(
      { y: 396, paint: () => paintReadingCorner(ctx) },
      { y: 304, paint: () => paintMailbox(ctx) },
      { y: 476, paint: () => paintTeaStall(ctx, o.time) },
    );
    layers.push({ y: 320, paint: () => paintNorthFence(ctx) });
    layers.push({ y: 292, paint: () => paintUpgrades(ctx, o, o.time) });
    if (o.upgrades?.includes("moonflowers"))
      for (let n = 0; n < 12; n++)
        layers.push({
          y: 490 + (n % 2) * 12,
          paint: () => paintMoonflower(ctx, n),
        });
    layers.push({
      y: 284,
      paint: () => paintCat(ctx, 554, 284, o.time, o.effect === "cat"),
    });
    paintLampPools(ctx, darkness);
    for (const lamp of TOWN_LAMPS)
      layers.push({
        y: lamp.y,
        paint: () => paintLantern(ctx, lamp.x, lamp.y, o.time),
      });
    BUILDINGS.forEach((b) => {
      lightPatch(b.doorX, b.y + b.height + 4, 76, 44, 0.8);
      layers.push({ y: b.y + b.height, paint: () => building(b) });
    });
    VILLAGE_TREES.forEach((p, i) =>
      layers.push({ y: p.y, paint: () => tree(p.x, p.y, i * 23) }),
    );
    lightPatch(216, 340, 72, 40);
    layers.push({
      y: 380,
      paint: () => {
        shadow(456, 380, 84);
        rect(424, 344, 64, 36, "#516f66");
        rect(428, 368, 56, 12, "#39574e");
        rect(420, 340, 72, 12, "#9ead8d");
        rect(424, 340, 64, 4, "#cad0aa");
        rect(428, 348, 56, 16, "#407984");
        rect(436, 352, 40, 4, "#619b9a");
        rect(444, 320, 24, 36, "#7c9b84");
        rect(448, 308, 16, 20, "#b0c4a0");
        rect(452, 296, 8, 16, "#72b1a3");
        rect(452, 300, 4, 8, "#d3efca");
        rect(444, 328, 4, 12, "#b5ceab");
        rect(464, 336, 4, 12, "#b5ceab");
        rect(432 + (Math.floor(t * 4) % 3) * 12, 356, 12, 2, "#a3c4ac");
        if (o.upgrades?.includes("fountain")) paintFountainUpgrade(ctx, o.time);
      },
    });
    layers.push(
      { y: 290, paint: () => paintTownAccents(ctx) },
      { y: 324, paint: () => paintAtlas(ctx) },
      { y: 524, paint: () => paintBell(ctx) },
    );
    layers.push(
      { y: 352, paint: () => character(352, 352, "down", true) },
      { y: 314, paint: () => character(600, 314, "left", true) },
    );
    layers.push({
      y: 344,
      paint: () => {
        shadow(216, 344, 40);
        rect(204, 328, 24, 16, "#667567");
        rect(208, 328, 16, 4, "#a6ae86");
        rect(208, 316, 16, 16, "#393c38");
        const hue = o.streak >= 7 ? "#8cdbd0" : "#edba6d",
          h = o.streak >= 30 ? 32 : 20;
        rect(208, 316 - h, 16, h, hue);
        rect(212, 308 - h, 8, h, "#eee1a4");
        rect(212, 300 - h + (Math.floor(t * 4) % 2) * 4, 4, 8, hue);
        if (!o.streak) rect(208, 304, 16, 20, "#829b86");
      },
    });
    layers.push(
      { y: 440, paint: () => sign(710, 420, "CLOSED") },
      { y: 488, paint: () => sign(672, 468, "CHOIR") },
      { y: 388, paint: () => sign(710, 366, "SEALED") },
    );
  } else {
    rect(frame.x, frame.y, frame.width, frame.height, "#19263c");
    rect(204, 68, 552, 464, "#23344c");
    rect(208, 72, 544, 456, "#485068");
    rect(216, 76, 528, 444, "#4c4359");
    rect(224, 80, 512, 64, "#73647a");
    for (let x = 224; x < 736; x += 32) {
      rect(x, 84, 28, 52, "#8a788b");
      rect(x + 4, 88, 2, 44, "#b39ba4");
      rect(x, 136, 32, 8, "#4a3d53");
    }
    rect(224, 144, 512, 368, "#77677a");
    for (let y = 144; y < 512; y += 24) {
      rect(224, y, 512, 2, "#514758");
      for (let x = 224; x < 736; x += 64) {
        const offset = y % 48 ? 28 : 0;
        if (x + offset < 736) rect(x + offset, y, 2, 24, "#514758");
        rect(x + 12, y + 8, 28, 2, "#968693");
        rect(x + 24, y + 16, 16, 2, "#6a5a6f");
        rect(x + 5, y + 4, 2, 2, "#534559");
      }
    }
    rect(216, 144, 8, 376, C.ink);
    rect(736, 144, 8, 376, C.ink);
    rect(224, 144, 512, 8, "#463f55");
    rect(224, 504, 232, 16, "#493c51");
    rect(504, 504, 232, 16, "#493c51");
    rect(456, 500, 48, 20, "#c1a571");
    rect(456, 500, 48, 2, "#dfc78f");
    text("OUT", 480, 516, C.ink, 8);
    const sky =
      darkness > 0.7 ? "#26374f" : darkness > 0.2 ? "#c08d77" : "#91bac0";
    rect(436, 80, 88, 56, C.ink);
    rect(440, 84, 80, 48, sky);
    if (darkness > 0.5) {
      [
        [450, 94],
        [470, 88],
        [512, 116],
        [460, 116],
      ].forEach(([x, y]) => rect(x, y, 2, 2, "#d7d4ac"));
      rect(496, 88, 12, 12, "#ebe2b8");
      rect(500, 84, 12, 12, sky);
    } else {
      rect(496, 90, 12, 12, "#f4df9b");
      rect(446, 96, 16, 4, "#d6dfc9");
      rect(450, 92, 8, 4, "#d6dfc9");
    }
    rect(440, 122, 80, 10, "#49694d");
    rect(448, 118, 12, 8, "#49694d");
    rect(508, 114, 12, 12, "#49694d");
    rect(476, 84, 8, 48, "#674c36");
    rect(440, 108, 80, 4, "#674c36");
    rect(432, 80, 8, 56, "#b49a74");
    rect(520, 80, 8, 56, "#b49a74");
    rect(432, 132, 96, 8, "#c5a879");
    rect(440, 144, 80, 48, "#e4d99c10");
    rect(452, 192, 80, 24, "#e4d99c0b");
    rect(426, 84, 6, 44, "#6d8576");
    rect(528, 84, 6, 44, "#6d8576");
    rect(380, 328, 184, 112, "#4b463d");
    rect(384, 332, 176, 104, "#9c7960");
    rect(392, 340, 160, 88, "#d0b686");
    rect(400, 348, 144, 72, "#415b7d");
    for (let x = 400; x < 544; x += 16) {
      rect(x, 348, 8, 4, "#c6c195");
      rect(x, 416, 8, 4, "#c6c195");
      rect(x, 324, 4, 4, "#d0b686");
      rect(x, 440, 4, 4, "#d0b686");
    }
    for (let y = 356; y < 416; y += 16) {
      rect(400, y, 4, 8, "#c6c195");
      rect(540, y, 4, 8, "#c6c195");
    }
    rect(456, 372, 32, 24, "#a6b187");
    rect(464, 364, 16, 40, "#a6b187");
    rect(464, 376, 16, 16, "#e0c894");
    rect(468, 380, 8, 8, "#7c9675");
    rect(240, 156, 112, 32, "#60452f");
    for (let i = 0; i < 12; i++) {
      const bx = 248 + i * 8,
        by = 156 + (i % 3) * 4;
      rect(
        bx,
        by,
        6,
        24 - (i % 3) * 4,
        ["#789a82", "#c29d63", "#9e7783"][i % 3],
      );
      rect(bx + 1, by + 4, 4, 2, "#e4cda0");
    }
    rect(240, 180, 112, 8, "#b68b56");
    rect(240, 180, 112, 2, "#d2aa72");
    lightPatch(314, 216, 88, 56, 0.8);
    lightPatch(686, 164, 72, 48, 0.7);
    layers.push({
      y: 254,
      paint: () => {
        shadow(356, 254, 128);
        rect(308, 240, 8, 28, "#57412f");
        rect(396, 240, 8, 28, "#57412f");
        rect(296, 204, 120, 40, "#57412f");
        rect(300, 200, 112, 40, "#b88c59");
        rect(304, 204, 104, 4, "#dab17a");
        rect(304, 232, 104, 4, "#956d46");
        rect(332, 212, 44, 24, C.ink);
        rect(336, 208, 36, 24, "#eee0b5");
        rect(352, 208, 4, 24, "#baa782");
        for (let y = 212; y < 228; y += 8) {
          rect(340, y, 8, 2, "#968774");
          rect(360, y, 8, 2, "#968774");
        }
        rect(380, 216, 8, 12, "#385c61");
        rect(384, 200, 4, 20, "#ddd1a4");
        rect(388, 198, 4, 8, "#ddd1a4");
        candle(312, 212);
        rect(340, 268, 32, 8, "#60442f");
        rect(344, 264, 24, 8, "#b48b56");
        rect(344, 276, 4, 16, "#60442f");
        rect(364, 276, 4, 16, "#60442f");
      },
    });
    layers.push({
      y: 350,
      paint: () => {
        shadow(644, 350, 104);
        rect(596, 218, 96, 132, "#604831");
        rect(600, 218, 88, 16, "#c29c68");
        rect(604, 222, 80, 4, "#debd86");
        rect(604, 234, 80, 108, "#d1c39a");
        rect(612, 238, 64, 28, "#eee0b8");
        rect(616, 242, 56, 16, "#f7eccc");
        rect(616, 260, 56, 4, "#c9bb98");
        rect(604, 272, 80, 68, "#4c628a");
        rect(608, 276, 72, 8, "#899dc0");
        for (let y = 292; y < 336; y += 16) {
          rect(608, y, 72, 4, "#7289ac");
          rect(620, y - 4, 4, 12, "#a6b0c7");
          rect(660, y - 4, 4, 12, "#a6b0c7");
        }
        rect(600, 336, 88, 12, "#ac8354");
        rect(600, 336, 88, 2, "#d2a76d");
        rect(600, 348, 8, 12, "#60442f");
        rect(680, 348, 8, 12, "#60442f");
        if (o.activity === "sleeping") {
          matrix(
            ctx,
            [".HHHHH.", "HSSSSSH", "HSESESH", ".SSSSS.", "..sss.."],
            630,
            240,
            4,
          );
          text(
            "z",
            670 + (Math.floor(t) % 2) * 4,
            222 - (Math.floor(t * 5) % 20),
            "#dfdfb8",
            12,
          );
        }
      },
    });
    layers.push({
      y: 192,
      paint: () => {
        rect(660, 164, 60, 28, "#765436");
        rect(660, 156, 60, 12, "#bd915b");
        rect(664, 156, 52, 2, "#dfb578");
        candle(684, 156);
        rect(704, 144, 8, 12, "#a77b52");
        rect(700, 140, 16, 4, "#809954");
        rect(704, 132, 4, 12, "#8fa85c");
        rect(708, 136, 8, 4, "#a8b568");
      },
    });
    layers.push({
      y: 448,
      paint: () => {
        rect(248, 388, 48, 60, "#62462f");
        rect(248, 388, 48, 8, "#bf935d");
        rect(248, 436, 48, 8, "#bf935d");
        rect(256, 396, 8, 32, "#789a82");
        rect(268, 400, 8, 28, "#b57f67");
        rect(280, 396, 8, 32, "#cfb06e");
        rect(256, 404, 8, 2, "#d6c49a");
        rect(280, 404, 8, 2, "#ede0b2");
        rect(252, 380, 40, 8, "#e1d3a7");
      },
    });
  }
  if (o.activity !== "sleeping")
    layers.push({
      y: player.y,
      paint: () => {
        character(
          player.x,
          player.y,
          o.activity === "focusing" ? "up" : player.facing,
        );
        if (
          o.characterName &&
          !(o.peers ?? []).some(
            (p) =>
              p.scene === sceneId &&
              Math.hypot(p.x - player.x, p.y - player.y) < 28,
          )
        )
          text(o.characterName, player.x, player.y - 78, "#e8dfbf", 10);
        if (o.activity === "focusing") {
          rect(player.x - 6, player.y - 8, 12, 8, "#b48b56");
          if (Math.floor(t * 2) % 2)
            rect(player.x + 18, player.y - 42, 4, 4, C.pale);
        }
      },
    });
  const groups: Peer[][] = [];
  for (const peer of o.peers ?? []) {
    if (peer.scene !== sceneId) continue;
    const group = groups.find(
      (g) => Math.hypot(g[0].x - peer.x, g[0].y - peer.y) < 28,
    );
    if (group) group.push(peer);
    else groups.push([peer]);
  }
  for (const group of groups) {
    const p = group[0],
      withYou = Math.hypot(p.x - player.x, p.y - player.y) < 28;
    layers.push({
      y: p.y,
      paint: () => {
        if (!withYou) character(p.x, p.y, p.facing, false, p);
        const label = withYou
          ? "You + " + group.length
          : group.length > 1
            ? p.name.slice(0, 12) + " + " + (group.length - 1)
            : p.name.slice(0, 16);
        text(label, p.x, p.y - 78, "#e8dfbf", 10);
      },
    });
  }
  if (sceneId === "village") {
    layers.push({
      y: 390,
      paint: () => {
        const light = Math.min((o.sharedMinutes ?? 0) / 120, 1);
        rect(808, 364, 24, 24, "#3e5552");
        rect(812, 340, 16, 28, "#75998c");
        rect(808, 332, 24, 8, "#b5c5a4");
        rect(816, 320, 8, 12, light > 0 ? "#a9f0d8" : "#435e61");
        if (light > 0) {
          rect(812, 312, 16, 12, "#72beb0");
          rect(816, 306 - (Math.floor(t * 2) % 2) * 4, 8, 14, "#e4ffe0");
          for (let i = 0; i < Math.ceil(light * 6); i++)
            rect(800 + i * 8, 300 - (i % 3) * 8, 2, 2, "#d7f8c9");
        }
        text("BEACON", 820, 408, "#d8dcbb", 8);
      },
    });
  }
  if (sceneId === "house" && o.discoveries?.includes("shop-cat"))
    layers.push({ y: 416, paint: () => paintCat(ctx, 568, 416, o.time) });
  layers.sort((a, b) => a.y - b.y).forEach((layer) => layer.paint());
  paintDiscoveries(ctx, sceneId, o, o.time, clock.hour < 5 || clock.hour >= 20);
  if (o.activity === "idle" && (o.idleSeconds ?? 0) > 16) {
    rect(player.x - 12, player.y - 31, 24, 13, "#a08aa4");
    rect(player.x - 10, player.y - 30, 20, 9, "#e5d4b8");
    rect(player.x, player.y - 30, 2, 10, "#89778d");
  }
  // A uniform tint keeps every pixel crisp; illumination uses rectangular patches.
  ctx.save();
  ctx.globalAlpha = darkness * (sceneId === "village" ? 0.24 : 0.14);
  rect(frame.x, frame.y, frame.width, frame.height, "#15243e");
  ctx.restore();
  if (sceneId === "village") {
    for (let i = 0; i < 16; i++) {
      const x = 40 + hash(i + 400) * 880 + Math.sin(t * 0.2 + i) * 16,
        y = 70 + hash(i + 700) * 470 + Math.cos(t * 0.4 + i) * 8;
      if (i % 3 && darkness > 0.25)
        rect(x, y, 2, 2, Math.sin(t + i) > 0 ? "#f4df8bbb" : "#cbd28c55");
      else if (i % 3 === 0) rect((x + t * 5) % 940, y, 4, 2, "#d3c18b70");
    }
  }
  if (o.interactionId) {
    const interaction = WORLDS[sceneId].interactions.find(
      (value) => value.id === o.interactionId,
    );
    if (interaction) {
      const x = interaction.bounds.x + interaction.bounds.width / 2,
        y = interaction.bounds.y - 16 + (Math.floor(t * 2) % 2) * 2;
      rect(x - 10, y - 14, 20, 20, C.ink);
      rect(x - 8, y - 12, 16, 16, C.pale);
      rect(x - 2, y + 6, 4, 4, C.ink);
      text("E", x, y, C.ink, 11);
    }
  }
  ctx.restore();
}
