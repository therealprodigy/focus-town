import type { UpgradeId } from "./townCatalog";
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
  kind: "door" | "desk" | "bed" | "npc" | "sign" | "shop";
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
    roof: "#a96949",
    doorX: 244,
  },
  {
    x: 424,
    y: 116,
    width: 168,
    height: 128,
    name: "LOTTIE’S GOODS",
    roof: "#69775b",
    doorX: 508,
  },
  {
    x: 664,
    y: 132,
    width: 192,
    height: 140,
    name: "MOTHWICK LIBRARY",
    roof: "#637b7c",
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
    width: 1440,
    height: 600,
    spawn: { x: 448, y: 416 },
    solids: [
      ...TOWN_LAMPS.map(({ x, y }) => r(x - 4, y - 8, 8, 8)),
      r(150, 382, 52, 14),
      r(302, 292, 16, 12),
      r(136, 456, 68, 20),
      r(538, 272, 32, 12),
      r(374, 514, 24, 10),
      r(702, 312, 30, 12),
      ...BUILDINGS.map(({ x, y, width, height }) => r(x, y, width, height)),
      ...VILLAGE_TREES.map(({ x, y }) => r(x - 12, y - 18, 24, 20)),
      r(856, 0, 104, 320),
      r(796, 0, 644, 600),
      r(748, 292, 108, 28),
      r(748, 320, 48, 280),
      r(424, 336, 64, 44),
      r(342, 334, 20, 18),
      r(590, 296, 20, 18),
      r(204, 320, 24, 24),
      r(584, 432, 92, 48),
    ],
    interactions: [
      {
        id: "bench",
        label: "Check the reading bench",
        kind: "sign",
        bounds: r(150, 382, 52, 14),
        title: "Borrowed time",
        lines: [
          "There is a blanket, a warm cup and a library book under the seat.",
          "The due date was three years ago. Mira says the late fee is telling her whether the ending was any good.",
        ],
      },
      {
        id: "mail",
        label: "Open the little mailbox",
        kind: "sign",
        bounds: r(302, 292, 16, 12),
        title: "A letter for tomorrow",
        lines: [
          "To: Whoever needs an extra minute.",
          "You can start again from here. No stamp, no signature. Just a tiny drawing of your house.",
        ],
      },
      {
        id: "tea",
        label: "Talk to Jun at the tea stall",
        kind: "npc",
        bounds: r(136, 456, 68, 20),
        title: "Jun / keeper of the kettle",
        lines: [
          "I was an adventurer once. Then I discovered sitting down.",
          "One leaf, hot water, and absolutely no side quests until the kettle boils. Take a short break. Your work will still be there.",
        ],
      },
      {
        id: "cat",
        label: "Say hello to the cat",
        kind: "npc",
        bounds: r(538, 272, 32, 12),
      },
      {
        id: "atlas",
        label: "Read the river atlas",
        kind: "sign",
        bounds: r(702, 312, 30, 12),
        title: "A page left open",
        lines: [
          "An old route crosses the river, then stops at a drawing of a bell.",
          "Three little marks sit beside the bell. In the margin: If the lamps answer, you are on the right path.",
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
        label: "Browse Lottie’s Goods",
        kind: "shop",
        bounds: r(492, 234, 32, 16),
        title: "Lottie’s Goods",
        lines: [
          "Window boxes. No loot boxes.",
          "Earn coins at your desk. Keep a streak to open the rest of the catalogue.",
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
        bounds: r(696, 362, 28, 24),
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
          "Twenty-five minutes today lights the lantern. Miss a day and it waits for you. It does not repossess your house.",
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
      r(542, 144, 64, 52),
      r(248, 388, 48, 60),
    ],
    interactions: [
      {
        id: "blue-door",
        label: "Read the blue door poster",
        kind: "sign",
        bounds: r(366, 144, 40, 8),
        title: "Room for one more",
        lines: [
          "A battered blue box stands on a travel poster. The caption reads: MUCH ROOMIER THAN THE RENT SUGGESTS.",
          "Rowan ordered one for the village. Delivery date: yesterday, apparently.",
        ],
      },
      {
        id: "hearth",
        label: "Warm up by the hearth",
        kind: "sign",
        bounds: r(548, 186, 50, 10),
        title: "The fellowship of the kettle",
        lines: [
          "Jun left a meal schedule on the mantel: breakfast, second breakfast, elevenses, lunch. No space left for the quest.",
          "Beside it: You have my mug. And my biscuit.",
        ],
      },
      {
        id: "window",
        label: "Look through the window",
        kind: "sign",
        bounds: r(444, 146, 72, 8),
      },
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
          "[::] A folded note slips from a book. Three quiet knocks. Leave room for an answer.",
          "Below it, in smaller letters: This is a save point. Take a breath.",
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

export const GARDEN_TREES = [
  { x: 1012, y: 120 },
  { x: 1124, y: 82 },
  { x: 1252, y: 76 },
  { x: 1376, y: 92 },
  { x: 1380, y: 244 },
  { x: 1400, y: 416 },
  { x: 1376, y: 568 },
  { x: 1240, y: 556 },
  { x: 1040, y: 564 },
  { x: 952, y: 556 },
  { x: 954, y: 216 },
];
export const GARDEN_INTERACTIONS: Interaction[] = [
  {
    id: "field-notes",
    kind: "sign",
    label: "Read the gardener’s field notes",
    bounds: r(1144, 274, 30, 18),
    title: "The glasshouse journal",
    lines: [
      "Leave a lamp beside the last row. Someone may still be finding their way home.",
      "Rowan recognised the handwriting. The garden had been keeping a place for the same traveller as the clocks.",
    ],
  },
  {
    id: "garden-bench",
    kind: "sign",
    label: "Rest at the two-mug bench",
    bounds: r(1274, 396, 64, 16),
    title: "Start / Again",
    lines: [
      "Two mugs wait on the bench. One says Start. The other says Again.",
      "The gardener did not leave instructions about which one to use first.",
    ],
  },
  {
    id: "copper-scope",
    kind: "sign",
    label: "Look through the copper telescope",
    bounds: r(1304, 292, 24, 18),
    title: "Kettle major",
    lines: [
      "Five stars make a surprisingly convincing kettle.",
      "Jun insists this is established astronomy. Mira has asked to see the sources.",
    ],
  },
  {
    id: "crafting-note",
    kind: "sign",
    label: "Inspect the old workbench",
    bounds: r(978, 466, 54, 20),
    title: "Nine squares",
    lines: [
      "[ ][#][ ]  [ ][#][ ]  [#][#][#]",
      "Two sticks, three planks. A chair. Someone has crossed out diamond sword three times.",
    ],
  },
  {
    id: "orchard-cat",
    kind: "npc",
    label: "Meet the orchard supervisor",
    bounds: r(1234, 176, 32, 18),
    title: "Miso’s very official report",
    lines: [
      "One muddy paw print. No structural concerns. More fish requested.",
      "There is a smaller paw print underneath. Miso has hired an intern.",
    ],
  },
  {
    id: "garden-coffee",
    kind: "shop",
    label: "Read Jun’s delivery menu",
    bounds: r(1084, 380, 32, 20),
    title: "Coffee, delivered",
  },
];
export function crossingOpen(upgrades: readonly UpgradeId[]) {
  return upgrades.includes("crossing-lanterns");
}
export function residentPositions(now: number) {
  const walk = (offset: number) => {
    const phase = ((now / 1000 + offset) % 120) / 60;
    return phase <= 1 ? phase : 2 - phase;
  };
  return {
    rowan: { x: 346 + walk(0) * 44, y: 352 },
    mira: { x: 590 + walk(30) * 42, y: 314 },
    cat: { x: 546 + walk(65) * 24, y: 284 },
  };
}
export function getWorldScene(
  id: SceneId,
  upgrades: readonly UpgradeId[],
  now = 0,
): WorldScene {
  const base = WORLDS[id];
  if (id !== "village") return base;
  const open = crossingOpen(upgrades),
    residents = residentPositions(now);
  let solids = base.solids.filter(
    (s) =>
      !(
        (s.x === 342 && s.y === 334) ||
        (s.x === 590 && s.y === 296) ||
        (s.x === 538 && s.y === 272)
      ),
  );
  // Residents yield to the player; moving collision bodies can trap an idle apprentice.
  if (open) {
    solids = solids.filter(
      (s) => !(s.x === 796 && s.width === 644) && !(s.x === 748 && s.y === 320),
    );
    solids.push(
      r(748, 320, 48, 80),
      r(748, 456, 48, 144),
      r(724, 396, 88, 4),
      r(724, 456, 88, 4),
    );
  }
  solids.push(
    ...GARDEN_TREES.map((p) => r(p.x - 12, p.y - 18, 24, 20)),
    r(1092, 174, 132, 104),
    r(1274, 396, 64, 16),
    r(978, 466, 54, 20),
    r(1304, 292, 24, 18),
  );
  const interactions = base.interactions.map((i): Interaction => {
    if (i.id === "rowan" || i.id === "mira" || i.id === "cat") {
      const p = residents[i.id];
      return { ...i, bounds: r(p.x - 14, p.y - 16, 28, 18) };
    }
    if (i.id === "bridge")
      return {
        ...i,
        kind: "shop",
        label: open ? "Read the crossing plaque" : "Repair the Old Crossing",
        title: "The Old Crossing",
        lines: open
          ? [
              "Rebuilt one interval at a time.",
              "The glasshouse journal is waiting across the river.",
            ]
          : [
              "Three repairs will open the eastern gardens.",
              "Lottie keeps the materials. Rowan handles the splinters.",
            ],
      };
    if (i.id === "forest")
      return {
        ...i,
        title: open ? "Whispering Garden" : "The Old Crossing",
        lines: open
          ? [
              "The crossing is open. Follow the oak boards east to the glasshouse.",
              "Someone left a field journal beside the door.",
            ]
          : [
              "Rowan needs timber, energy and three good repair jobs.",
              "The crossing repairs are in Lottie’s catalogue. Each finished stage stays built.",
            ],
      };
    return i;
  });
  return {
    ...base,
    solids,
    interactions: open
      ? [...interactions, ...GARDEN_INTERACTIONS]
      : interactions,
  };
}
