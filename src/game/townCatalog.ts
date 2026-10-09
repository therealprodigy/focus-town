export const UPGRADES = [
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
  new Set(x).size === x.length;
export const STREAK_REWARDS = [
  { days: 3, coins: 12 },
  { days: 7, coins: 24 },
] as const;
export const MISSIONS = [
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
  new Set(x).size === x.length;
export const validStreakClaims = (x: unknown): x is number[] =>
  Array.isArray(x) &&
  x.length <= STREAK_REWARDS.length &&
  x.every((n) => STREAK_REWARDS.some((r) => r.days === n)) &&
  new Set(x).size === x.length;
