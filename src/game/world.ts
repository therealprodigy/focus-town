export type SceneId = "village" | "house";
export type Facing = "up" | "down" | "left" | "right";
export interface Point {
  x: number;
  y: number;
}
export interface Rect extends Point {
  width: number;
  height: number;
}
export interface Player extends Point {
  facing: Facing;
  walkFrame: number;
}
export interface Interaction {
  id: string;
  label: string;
  kind: "door" | "desk" | "bed" | "npc" | "sign";
  bounds: Rect;
  targetScene?: SceneId;
  targetSpawn?: Point;
  title?: string;
  lines?: string[];
}
export interface WorldScene {
  id: SceneId;
  width: number;
  height: number;
  spawn: Point;
  solids: Rect[];
  interactions: Interaction[];
}
export const HOUSE_DESK_SEAT: Point = { x: 356, y: 286 };
export const HOUSE_BED_POSITION: Point = { x: 644, y: 294 };
export const TOWN_LAMPS = [
  { x: 136, y: 350 },
  { x: 386, y: 430 },
  { x: 560, y: 330 },
  { x: 824, y: 488 },
];
export const VILLAGE_TREES: Point[] = [
  { x: 64, y: 160 },
  { x: 104, y: 228 },
  { x: 64, y: 320 },
  { x: 116, y: 420 },
  { x: 80, y: 536 },
  { x: 188, y: 552 },
  { x: 304, y: 548 },
  { x: 548, y: 548 },
  { x: 664, y: 548 },
  { x: 864, y: 536 },
  { x: 912, y: 432 },
  { x: 896, y: 332 },
  { x: 904, y: 104 },
  { x: 796, y: 72 },
  { x: 656, y: 64 },
  { x: 544, y: 60 },
  { x: 408, y: 64 },
  { x: 288, y: 68 },
  { x: 164, y: 64 },
  { x: 64, y: 64 },
];
export const BUILDINGS = [
  {
    x: 156,
    y: 160,
    width: 176,
    height: 120,
    name: "LANTERN HOUSE",
    roof: "#566580",
    doorX: 244,
  },
  {
    x: 424,
    y: 116,
    width: 168,
    height: 128,
    name: "LOTTIE’S GOODS",
    roof: "#45677c",
    doorX: 508,
  },
  {
    x: 664,
    y: 132,
    width: 192,
    height: 140,
    name: "MOTHWICK LIBRARY",
    roof: "#615f89",
    doorX: 760,
  },
];
const r = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});
export const WORLDS: Record<SceneId, WorldScene> = {
  village: {
    id: "village",
    width: 960,
    height: 600,
    spawn: { x: 448, y: 416 },
    solids: [
      ...TOWN_LAMPS.map(({ x, y }) => r(x - 4, y - 8, 8, 8)),
      r(374, 514, 24, 10),
      r(702, 312, 30, 12),
      ...BUILDINGS.map(({ x, y, width, height }) => r(x, y, width, height)),
      ...VILLAGE_TREES.map(({ x, y }) => r(x - 12, y - 18, 24, 20)),
      r(748, 320, 48, 280),
      r(424, 336, 64, 44),
      r(342, 334, 20, 18),
      r(590, 296, 20, 18),
      r(204, 320, 24, 24),
      r(584, 432, 92, 48),
    ],
    interactions: [
      {
        id: "atlas",
        label: "Read the river atlas",
        kind: "sign",
        bounds: r(702, 312, 30, 12),
        title: "A page left open",
        lines: [
          "An old route crosses the river, then stops at a drawing of a bell.",
          "In the margin: If the lamps answer, you are on the right path.",
        ],
      },
      {
        id: "bell",
        label: "Inspect the quiet bell",
        kind: "sign",
        bounds: r(374, 514, 24, 10),
        title: "The bell without a tower",
        lines: [
          "Its clapper is warm. It has not rung in years.",
          "Someone tied a note to the frame: Keep a little time for whoever is coming home.",
        ],
      },
      {
        id: "home",
        label: "Enter home",
        kind: "door",
        bounds: r(228, 270, 32, 16),
        targetScene: "house",
        targetSpawn: { x: 480, y: 468 },
      },
      {
        id: "lottie",
        label: "Read shop notice",
        kind: "door",
        bounds: r(492, 234, 32, 16),
        title: "Lottie’s Goods / closed",
        lines: [
          "Back after the lantern festival. Please stop feeding the delivery moths.",
          "Furniture and trading will arrive in a later chapter.",
        ],
      },
      {
        id: "library",
        label: "Visit Mira’s journal desk",
        kind: "door",
        bounds: r(744, 262, 32, 16),
        title: "Mothwick Library",
        lines: [
          "Mira has left the journal outside. The shelves inside are still being repaired.",
          "No need to count pages. We keep the time you gave them.",
        ],
      },
      {
        id: "rowan",
        label: "Talk to Rowan",
        kind: "npc",
        bounds: r(338, 332, 28, 22),
        title: "Rowan / village keeper",
        lines: [
          "The observatory lost an hour. Every clock in town stopped, except the one on your desk.",
          "Home is west of the fountain. Keep that lamp on. We will work out the rest.",
        ],
      },
      {
        id: "mira",
        label: "Talk to Mira",
        kind: "npc",
        bounds: r(586, 294, 28, 22),
        title: "Mira / librarian",
        lines: [
          "Rowan says the clocks stopped. The records say they are waiting.",
          "I keep your finished sessions in the journal. Small entries count.",
        ],
      },
      {
        id: "bridge",
        label: "Inspect broken bridge",
        kind: "sign",
        bounds: r(696, 414, 28, 26),
        title: "The unfinished crossing",
        lines: [
          "Beyond the brook lies Whispering Forest.",
          "The bridge is closed. Repairing it is planned for a later chapter; your energy is safe for now.",
        ],
      },
      {
        id: "frog",
        label: "Read tiny notice",
        kind: "sign",
        bounds: r(660, 468, 24, 20),
        title: "A notice at frog height",
        lines: [
          "(o.o)  POND RESERVED FOR THE MIDNIGHT CHOIR.",
          "Someone has added: No auditions. We remember the last song.",
        ],
      },
      {
        id: "forest",
        label: "Read forest sign",
        kind: "sign",
        bounds: r(860, 364, 28, 24),
        title: "Whispering Forest / sealed",
        lines: [
          "The academy has sealed this trail until the bridge is repaired.",
          "Even the trees need a little preparation.",
        ],
      },
      {
        id: "flame",
        label: "Inspect streak lantern",
        kind: "sign",
        bounds: r(200, 318, 32, 30),
        title: "The keeper flame",
        lines: [
          "This flame remembers the days you give yourself 25 minutes of focus.",
          "A small steady light is still a light.",
        ],
      },
    ],
  },
  house: {
    id: "house",
    width: 960,
    height: 600,
    spawn: { x: 480, y: 468 },
    solids: [
      r(0, 0, 960, 144),
      r(0, 512, 960, 88),
      r(0, 144, 224, 368),
      r(736, 144, 224, 368),
      r(300, 202, 112, 52),
      r(600, 218, 88, 132),
      r(240, 156, 112, 32),
      r(660, 156, 60, 36),
      r(248, 388, 48, 60),
    ],
    interactions: [
      {
        id: "exit",
        label: "Go outside",
        kind: "door",
        bounds: r(456, 492, 48, 20),
        targetScene: "village",
        targetSpawn: { x: 244, y: 308 },
      },
      {
        id: "desk",
        label: "Sit and focus",
        kind: "desk",
        bounds: r(300, 244, 112, 18),
      },
      {
        id: "bed",
        label: "Rest in bed",
        kind: "bed",
        bounds: r(600, 338, 88, 16),
      },
      {
        id: "shelf",
        label: "Read apprentice note",
        kind: "sign",
        bounds: r(248, 426, 48, 22),
        title: "A note in the margin",
        lines: [
          "[::] No grand spell today. Just one page, one problem, one beginning.",
          "The candle will keep you company.",
        ],
      },
    ],
  },
};
export function canStand(scene: WorldScene, x: number, y: number): boolean {
  const feet = r(x - 7, y - 10, 14, 10);
  if (
    feet.x < 0 ||
    feet.y < 0 ||
    feet.x + feet.width > scene.width ||
    y > scene.height
  )
    return false;
  return !scene.solids.some(
    (s) =>
      feet.x < s.x + s.width &&
      feet.x + feet.width > s.x &&
      feet.y < s.y + s.height &&
      y > s.y,
  );
}
export function getNearbyInteraction(
  scene: WorldScene,
  player: Point,
): Interaction | undefined {
  return scene.interactions
    .map((interaction) => {
      const b = interaction.bounds;
      const dx = Math.max(b.x - player.x, 0, player.x - b.x - b.width);
      const dy = Math.max(b.y - player.y, 0, player.y - b.y - b.height);
      return { interaction, distance: Math.hypot(dx, dy) };
    })
    .filter((v) => v.distance <= 30)
    .sort((a, b) => a.distance - b.distance)[0]?.interaction;
}
