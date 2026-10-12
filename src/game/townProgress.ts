import {
  getProgress,
  type Rewards,
  localDateKey,
  isValidMinutes,
  type SaveData,
} from "./state";
import {
  UPGRADES,
  MISSIONS,
  STREAK_REWARDS,
  type UpgradeId,
} from "./townCatalog";
export { ownedRoyalItems, equipAppearance } from "./personalization";
export function missionUnlocked(save: SaveData, id: string): boolean {
  const mission = MISSIONS.find((item) => item.id === id);
  return (
    !!mission &&
    (!("requires" in mission) ||
      !!save.missionClaims?.includes(mission.requires))
  );
}
export { ROYAL_MISSION_IDS, missionRewardLabel } from "./townCatalog";
export function missionLockReason(save: SaveData, id: string): string {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission || !("requires" in mission) || missionUnlocked(save, id))
    return "";
  return `First collect ${MISSIONS.find((item) => item.id === mission.requires)?.title ?? "the previous quest"}.`;
}
const validNow = (now: number) =>
  Number.isSafeInteger(now) && now >= 0 && now <= 8640000000000000;
export function purchaseUpgrade(
  save: SaveData,
  id: unknown,
  now: number,
): SaveData {
  if (!validNow(now)) return save;
  const item = UPGRADES.find((u) => u.id === id);
  if (
    !item ||
    save.upgrades?.includes(item.id) ||
    save.coins < item.price ||
    save.energy < ("energy" in item ? item.energy : 0) ||
    ("requires" in item && !(save.upgrades ?? []).includes(item.requires)) ||
    getProgress(save, now).bestStreak < item.streak
  )
    return save;
  return {
    ...save,
    coins: save.coins - item.price,
    energy: save.energy - ("energy" in item ? item.energy : 0),
    upgrades: [...(save.upgrades ?? []), item.id],
  };
}
export function missionProgress(save: SaveData, id: string, now: number) {
  const total = getProgress(save, now).totalMinutes;
  switch (id) {
    case "cherry-post":
      return save.discoveries?.includes("cherry-letter") ? 1 : 0;
    case "lantern-cut":
      return ["lantern-reel", "platform-nine"].filter((found) =>
        save.discoveries?.some((d) => d === found),
      ).length;
    case "bellmaker-code":
      return save.discoveries?.includes("bellmaker-riddle") ? 1 : 0;
    case "keeper-watch":
      return Math.min(total, 25);
    case "town-coronation":
      return (
        Number(total >= 60) +
        Number(save.discoveries?.includes("star-chart") ?? false)
      );
    case "royal-rounds":
      return ["field-notes", "garden-bench", "copper-scope"].filter((found) =>
        save.discoveries?.some((d) => d === found),
      ).length;
    case "kings-cloak":
      return Math.min(total, 120);
    case "old-crossing":
      return save.upgrades?.includes("crossing-lanterns") ? 1 : 0;
    case "garden-pages":
      return ["field-notes", "garden-bench", "copper-scope"].filter((id) =>
        save.discoveries?.some((d) => d === id),
      ).length;
    case "steady-week":
      return Math.min(getProgress(save, now).bestStreak, 7);
    case "five-visits":
      return Math.min(save.sessions.length, 5);
    case "two-hours":
      return Math.min(total, 120);
    case "first-page":
      return Math.min(total, 15);
    case "quiet-hour":
      return Math.min(total, 60);
    case "first-build":
      return (save.upgrades?.length ?? 0) > 0 ? 1 : 0;
    case "reply":
      return save.discoveries?.includes("quiet-bell") ? 1 : 0;
    case "meet-town":
      return ["shop-cat", "river-atlas", "margin-note"].filter((id) =>
        save.discoveries?.some((d) => d === id),
      ).length;
    default:
      return 0;
  }
}
export function claimMission(
  save: SaveData,
  id: unknown,
  now: number,
): SaveData {
  if (!validNow(now)) return save;
  const mission = MISSIONS.find((m) => m.id === id);
  if (
    !mission ||
    !missionUnlocked(save, mission.id) ||
    save.missionClaims?.includes(mission.id) ||
    missionProgress(save, mission.id, now) < mission.target ||
    !Number.isSafeInteger(save.coins + mission.reward)
  )
    return save;
  return {
    ...save,
    coins: save.coins + mission.reward,
    missionClaims: [...(save.missionClaims ?? []), mission.id],
  };
}
export function settleStreakRewards(save: SaveData, now: number): SaveData {
  if (!validNow(now)) return save;
  const best = getProgress(save, now).bestStreak;
  const earned = STREAK_REWARDS.filter(
    (r) => best >= r.days && !save.streakClaims?.includes(r.days),
  );
  const coins = save.coins + earned.reduce((n, r) => n + r.coins, 0);
  if (!earned.length || !Number.isSafeInteger(coins)) return save;
  return {
    ...save,
    coins,
    streakClaims: [...(save.streakClaims ?? []), ...earned.map((r) => r.days)],
  };
}
export type SharedGrant = {
  id: string;
  minutes: number;
  completedAt: number;
  rewards: Rewards;
};
export function applySharedGrant(save: SaveData, grant: SharedGrant): SaveData {
  if (
    !/^[a-f0-9]{32}$/.test(grant.id) ||
    !isValidMinutes(grant.minutes) ||
    !Number.isSafeInteger(grant.completedAt) ||
    grant.completedAt < 0 ||
    grant.completedAt > 8640000000000000
  )
    return save;
  const id = "coop_" + grant.id;
  if (save.sessions.some((s) => s.id === id)) return save;
  const r = grant.rewards;
  if (
    !r ||
    ![r.coins, r.energy, r.xp].every((n) => Number.isSafeInteger(n) && n >= 0)
  )
    return save;
  if (
    ![save.coins + r.coins, save.energy + r.energy, save.xp + r.xp].every(
      Number.isSafeInteger,
    )
  )
    return save;
  return {
    ...save,
    coins: save.coins + r.coins,
    energy: save.energy + r.energy,
    xp: save.xp + r.xp,
    sessions: [
      ...save.sessions,
      {
        id,
        minutes: grant.minutes,
        completedAt: grant.completedAt,
        localDate: localDateKey(grant.completedAt),
      },
    ],
  };
}
export function rowanAdvice(save: SaveData, now: number): string {
  const p = getProgress(save, now);
  if (save.upgrades?.includes("crossing-lanterns"))
    return "The crossing is open. I left the field notes at the glasshouse. Mind the cat. It thinks the whole garden is a bed.";
  if (p.bestStreak >= 30)
    return "Thirty days. No speech from me. There is a fresh chair by the fire, and your name is on it.";
  if (p.bestStreak >= 7)
    return "Seven steady days. The town is starting to look like someone lives here.";
  if (p.bestStreak > p.currentStreak && !p.todayMinutes)
    return "Welcome back. You kept your upgrades. Start with the next page.";
  if (save.sessions.length)
    return "A finished session, a few coins. That is how this town gets built. Lottie is by the shop.";
  return "Your homework is not the final boss. Pick one small task. The desk is in your house, west of the fountain.";
}

export function compassHint(
  save: SaveData,
  worldUpgrades: readonly UpgradeId[] = save.upgrades ?? [],
): string {
  const has = (id: string) => save.discoveries?.some((found) => found === id);
  const claimed = (id: string) =>
    save.missionClaims?.some((claim) => claim === id);
  if (!claimed("cherry-post"))
    return "Read Edda’s letter on the wayfinding post southwest of the fountain, then collect A letter under the blossoms in Quests.";
  if (!worldUpgrades.includes("crossing-lanterns"))
    return "Open Lottie’s catalogue and finish the three Old Crossing repairs. Then follow the garden path east into Cherrybank.";
  if (!has("lantern-reel"))
    return "Follow Cherrybank’s eastern promenade to Pip’s outdoor cinema. Inspect the reel beside the projector.";
  if (!has("platform-nine"))
    return "Walk south from the cinema to the little station. Inspect the ticket at Platform Nine.";
  if (!claimed("lantern-cut"))
    return "Both film clues found. Collect Pip’s missing ending in Quests, then visit Oren’s bell workshop.";
  if (!has("bellmaker-riddle"))
    return "Oren works near the centre of Cherrybank. Speak to him and choose the missing film scene.";
  if (!claimed("bellmaker-code"))
    return "Oren’s puzzle is solved. Collect The bellmaker’s last scene in Quests.";
  if (!claimed("keeper-watch"))
    return "Complete 25 focus minutes in total at your desk, then collect A watch of your own in Quests.";
  if (!has("star-chart"))
    return "Visit the stargazing table in Cherrybank’s southwest clearing and read the chart.";
  if (!claimed("town-coronation"))
    return "Complete 60 focus minutes in total, then collect A crown for showing up in Quests. Equip it in Wardrobe.";
  if (!claimed("royal-rounds"))
    return "Explore the eastern garden: field notes by the glasshouse, the garden bench, and the copper telescope. Then collect The long way home.";
  if (!claimed("kings-cloak"))
    return "Complete 120 focus minutes in total, then collect The king’s cloak in Quests and equip it in Wardrobe.";
  return "The trail is complete. Crown and cloak are in your wardrobe. Pip still owes the town a sequel.";
}
