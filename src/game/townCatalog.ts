import type { SaveData } from "./state.js";
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
    id: "cherry-post",
    title: "A letter under the blossoms",
    detail:
      "Read Edda’s letter on the wayfinding post southwest of the fountain. Claim your brass compass here.",
    reward: 3,
    target: 1,
    item: "Brass compass",
  },
  {
    id: "lantern-cut",
    title: "Pip’s missing ending",
    detail:
      "Find the lantern reel at the outdoor cinema and the ticket at Platform Nine.",
    requires: "cherry-post",
    reward: 4,
    target: 2,
    item: "Pocket projector",
  },
  {
    id: "bellmaker-code",
    title: "The bellmaker’s last scene",
    detail:
      "Take Pip’s clues to Oren and choose the missing scene. A wrong guess costs nothing.",
    requires: "lantern-cut",
    reward: 4,
    target: 1,
  },
  {
    id: "keeper-watch",
    title: "A watch of your own",
    detail:
      "Complete 25 focus minutes in total, then collect the keeper’s seal. Earlier sessions count.",
    requires: "bellmaker-code",
    reward: 5,
    target: 25,
    item: "Keeper’s seal",
  },
  {
    id: "town-coronation",
    title: "A crown for showing up",
    detail:
      "Read Cherrybank’s star chart and complete 60 focus minutes in total. The crown is yours to wear.",
    requires: "keeper-watch",
    reward: 6,
    target: 2,
    item: "Keeper’s crown",
  },
  {
    id: "royal-rounds",
    title: "The long way home",
    detail:
      "With your crown earned, find the field notes, garden bench and copper telescope across the Old Crossing.",
    requires: "town-coronation",
    reward: 6,
    target: 3,
    item: "Garden ribbon",
  },
  {
    id: "kings-cloak",
    title: "The king’s cloak",
    detail:
      "Finish your garden rounds and reach 120 focus minutes in total. Edda has kept the cloak for you.",
    requires: "royal-rounds",
    reward: 8,
    target: 120,
    item: "King’s cloak",
  },
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
  MISSIONS.every(
    (mission) =>
      !x.includes(mission.id) ||
      !("requires" in mission) ||
      x.includes(mission.requires),
  );
export const validStreakClaims = (x: unknown): x is number[] =>
  Array.isArray(x) &&
  x.length <= STREAK_REWARDS.length &&
  x.every((n) => STREAK_REWARDS.some((r) => r.days === n)) &&
  new Set(x).size === x.length;

export const ROYAL_MISSION_IDS = [
  "cherry-post",
  "lantern-cut",
  "bellmaker-code",
  "keeper-watch",
  "town-coronation",
  "royal-rounds",
  "kings-cloak",
] as const satisfies readonly MissionId[];
export function missionRewardLabel(id: string): string {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) return "";
  return `${mission.reward} coins${"item" in mission ? ` + ${mission.item}` : ""}`;
}

/** Backups must carry the evidence for new keepsakes, as well as the claim chain. */
export function validRoyalHistory(
  save: Pick<SaveData, "missionClaims" | "discoveries" | "sessions">,
): boolean {
  const claimed = (id: MissionId) => save.missionClaims?.includes(id) ?? false;
  const found = (id: string) =>
    save.discoveries?.some((d) => d === id) ?? false;
  const minutes = save.sessions.reduce(
    (sum, session) => sum + session.minutes,
    0,
  );
  return (
    (!claimed("cherry-post") || found("cherry-letter")) &&
    (!claimed("lantern-cut") ||
      (found("lantern-reel") && found("platform-nine"))) &&
    (!found("bellmaker-riddle") ||
      (claimed("lantern-cut") &&
        found("lantern-reel") &&
        found("platform-nine"))) &&
    (!claimed("bellmaker-code") || found("bellmaker-riddle")) &&
    (!claimed("keeper-watch") || minutes >= 25) &&
    (!claimed("town-coronation") || (minutes >= 60 && found("star-chart"))) &&
    (!claimed("royal-rounds") ||
      ["field-notes", "garden-bench", "copper-scope"].every(found)) &&
    (!claimed("kings-cloak") || minutes >= 120)
  );
}
