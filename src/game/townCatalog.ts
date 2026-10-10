export const UPGRADES = [
  {
    id: "crossing-cleared",
    name: "Clear the crossing",
    price: 10,
    energy: 15,
    streak: 0,
    detail:
      "Rowan clears the old beams. The first step toward the eastern gardens.",
  },
  {
    id: "crossing-boards",
    name: "Lay the new boards",
    price: 20,
    energy: 35,
    streak: 0,
    requires: "crossing-cleared",
    detail: "Oak boards, two railings, and considerably fewer splinters.",
  },
  {
    id: "crossing-lanterns",
    name: "Open the Old Crossing",
    price: 25,
    energy: 50,
    streak: 0,
    requires: "crossing-boards",
    detail: "Light the path to the glasshouse, orchard and Whispering Garden.",
  },
  {
    id: "porch-lanterns",
    name: "Porch lanterns",
    price: 12,
    streak: 1,
    detail: "Two warm lights to find your way home.",
  },
  {
    id: "moonflowers",
    name: "Moonflower beds",
    price: 24,
    streak: 3,
    detail: "Window boxes. No loot boxes.",
  },
  {
    id: "fountain",
    name: "Fountain restoration",
    price: 36,
    streak: 5,
    detail: "The old fountain gets its sparkle back.",
  },
  {
    id: "festival",
    name: "Festival lights",
    price: 48,
    streak: 7,
    detail: "Lottie kept the good bunting for this.",
  },
] as const;
export type UpgradeId = (typeof UPGRADES)[number]["id"];
export const validUpgrades = (x: unknown): x is UpgradeId[] =>
  Array.isArray(x) &&
  x.length <= UPGRADES.length &&
  x.every((id) => UPGRADES.some((u) => u.id === id)) &&
  new Set(x).size === x.length &&
  (!x.includes("crossing-boards") || x.includes("crossing-cleared")) &&
  (!x.includes("crossing-lanterns") || x.includes("crossing-boards"));
export const STREAK_REWARDS = [
  { days: 3, coins: 12 },
  { days: 7, coins: 24 },
  { days: 14, coins: 40 },
  { days: 30, coins: 75 },
] as const;
export const MISSIONS = [
  {
    id: "old-crossing",
    title: "A way across",
    detail: "Finish all three crossing repairs in Lottie’s catalogue.",
    reward: 12,
    target: 1,
  },
  {
    id: "garden-pages",
    title: "The missing field notes",
    detail:
      "Find the field journal, the gardener’s bench and the copper telescope across the river.",
    reward: 10,
    target: 3,
  },
  {
    id: "steady-week",
    title: "A week with the lamp on",
    detail: "Reach a seven-day best streak. Your old record counts.",
    reward: 12,
    target: 7,
  },
  {
    id: "five-visits",
    title: "A habit taking root",
    detail: "Finish five focus sessions of any length.",
    reward: 5,
    target: 5,
  },
  {
    id: "two-hours",
    title: "Two hours, one page at a time",
    detail: "Complete 120 focus minutes in total.",
    reward: 12,
    target: 120,
  },
  {
    id: "first-page",
    title: "Main quest: one page",
    detail: "Finish 15 minutes of focus. Several short sessions count.",
    reward: 3,
    target: 15,
  },
  {
    id: "meet-town",
    title: "Say hello",
    detail: "Meet Miso, read the river atlas and check the shelf at home.",
    reward: 6,
    target: 3,
  },
  {
    id: "first-build",
    title: "Make yourself at home",
    detail: "Buy your first village upgrade from Lottie.",
    reward: 6,
    target: 1,
  },
  {
    id: "quiet-hour",
    title: "A little time adds up",
    detail: "Complete 60 minutes of focus in total.",
    reward: 8,
    target: 60,
  },
  {
    id: "reply",
    title: "Someone is listening",
    detail: "Find out how to wake the quiet bell.",
    reward: 6,
    target: 1,
  },
] as const;
export type MissionId = (typeof MISSIONS)[number]["id"];
export const validMissionClaims = (x: unknown): x is MissionId[] =>
  Array.isArray(x) &&
  x.length <= MISSIONS.length &&
  x.every((id) => MISSIONS.some((m) => m.id === id)) &&
  new Set(x).size === x.length &&
  (!x.includes("crossing-boards") || x.includes("crossing-cleared")) &&
  (!x.includes("crossing-lanterns") || x.includes("crossing-boards"));
export const validStreakClaims = (x: unknown): x is number[] =>
  Array.isArray(x) &&
  x.length <= STREAK_REWARDS.length &&
  x.every((n) => STREAK_REWARDS.some((r) => r.days === n)) &&
  new Set(x).size === x.length &&
  (!x.includes("crossing-boards") || x.includes("crossing-cleared")) &&
  (!x.includes("crossing-lanterns") || x.includes("crossing-boards"));
