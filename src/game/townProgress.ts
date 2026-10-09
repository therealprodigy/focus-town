import {
  getProgress,
  type Rewards,
  localDateKey,
  isValidMinutes,
  type SaveData,
} from "./state";
import { UPGRADES, MISSIONS, STREAK_REWARDS } from "./townCatalog";
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
    getProgress(save, now).bestStreak < item.streak
  )
    return save;
  return {
    ...save,
    coins: save.coins - item.price,
    upgrades: [...(save.upgrades ?? []), item.id],
  };
}
export function missionProgress(save: SaveData, id: string, now: number) {
  const total = getProgress(save, now).totalMinutes;
  switch (id) {
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
  if (p.bestStreak >= 7)
    return "Seven steady days. The town is starting to look like someone lives here.";
  if (p.bestStreak > p.currentStreak && !p.todayMinutes)
    return "Welcome back. You kept your upgrades. Start with the next page.";
  if (save.sessions.length)
    return "A finished session, a few coins. That is how this town gets built. Lottie is by the shop.";
  return "Your homework is not the final boss. Pick one small task. The desk is in your house, west of the fountain.";
}
