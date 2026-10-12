import { describe, expect, it } from "vitest";
import {
  createSave,
  localDateKey,
  parseSave,
  startFocus,
  type SaveData,
} from "../src/game/state";
import {
  recordDiscovery,
  solveBellmaker,
  canSolveBellmaker,
  discoveryAt,
} from "../src/game/discoveries";
import {
  claimMission,
  compassHint,
  equipAppearance,
  missionUnlocked,
  ownedRoyalItems,
} from "../src/game/townProgress";
import {
  DEFAULT_APPEARANCE,
  validAppearance,
} from "../src/game/personalization";
import { ROYAL_MISSION_IDS, validMissionClaims } from "../src/game/townCatalog";

const now = new Date(2026, 9, 12, 12).getTime();
const find = (save: SaveData, ...ids: string[]) =>
  ids.reduce((next, id) => recordDiscovery(next, id, 12), save);
const focused = (save: SaveData, minutes: number): SaveData => ({
  ...save,
  sessions: [
    {
      id: "earned_focus",
      minutes,
      completedAt: now,
      localDate: localDateKey(now),
    },
  ],
});
function filmClues() {
  const compass = claimMission(
    find(createSave(), "cherry-letter"),
    "cherry-post",
    now,
  );
  return claimMission(
    find(compass, "lantern-reel", "platform-nine"),
    "lantern-cut",
    now,
  );
}
function coronation() {
  let save = solveBellmaker(filmClues(), "nightfall");
  save = claimMission(save, "bellmaker-code", now);
  save = claimMission(focused(save, 25), "keeper-watch", now);
  return claimMission(
    find(focused(save, 60), "star-chart"),
    "town-coronation",
    now,
  );
}

describe("Cherrybank quest rewards", () => {
  it("starts with a free letter and pays each linked quest only once", () => {
    const start = createSave();
    expect(claimMission(start, "cherry-post", now)).toBe(start);
    const letter = find(start, "cherry-letter");
    const compass = claimMission(letter, "cherry-post", now);
    expect(compass.coins).toBe(3);
    expect(ownedRoyalItems(compass).compass).toBe(true);
    expect(compass.sessions).toHaveLength(0);
    expect(claimMission(compass, "cherry-post", now)).toBe(compass);
    expect(find(compass, "cherry-letter")).toBe(compass);
    expect(compassHint(compass)).toContain("three Old Crossing repairs");
    expect(
      compassHint(compass, [
        "crossing-cleared",
        "crossing-boards",
        "crossing-lanterns",
      ]),
    ).toContain("Pip’s outdoor cinema");
  });

  it("rejects prerequisite bypass even with sufficient discoveries and focus", () => {
    const save = focused(
      find(createSave(), "lantern-reel", "platform-nine", "star-chart"),
      120,
    );
    expect(missionUnlocked(save, "lantern-cut")).toBe(false);
    for (const id of ROYAL_MISSION_IDS.slice(1))
      expect(claimMission(save, id, now)).toBe(save);
    expect(validMissionClaims(["town-coronation"])).toBe(false);
    expect(validMissionClaims(["cherry-post", "cherry-post"])).toBe(false);
  });

  it("requires the deliberate correct puzzle choice and never pays for guessing", () => {
    const empty = createSave();
    expect(solveBellmaker(empty, "nightfall")).toBe(empty);
    const save = filmClues();
    expect(canSolveBellmaker(save)).toBe(true);
    for (const choice of [
      "sunrise",
      "midday",
      null,
      2,
      {},
      "NIGHTFALL",
      ["nightfall"],
    ]) {
      expect(solveBellmaker(save, choice)).toBe(save);
    }
    expect(recordDiscovery(save, "bellmaker-riddle", 12)).toBe(save);
    expect(discoveryAt("oren")).toBeUndefined();
    const solved = solveBellmaker(save, "nightfall");
    expect(solved.discoveries).toContain("bellmaker-riddle");
    expect(solved.coins).toBe(save.coins);
    expect(solveBellmaker(solved, "nightfall")).toBe(solved);
    const claimed = claimMission(solved, "bellmaker-code", now);
    expect(claimed.coins).toBe(solved.coins + 4);
    expect(claimMission(claimed, "bellmaker-code", now)).toBe(claimed);
  });

  it("requires both focus and the chart for the crown; the cloak needs the final quest", () => {
    let save = claimMission(
      solveBellmaker(filmClues(), "nightfall"),
      "bellmaker-code",
      now,
    );
    save = claimMission(focused(save, 25), "keeper-watch", now);
    expect(claimMission(save, "town-coronation", now)).toBe(save);
    const chart = find(save, "star-chart");
    expect(claimMission(chart, "town-coronation", now)).toBe(chart);
    const noChart = focused(save, 60);
    expect(claimMission(noChart, "town-coronation", now)).toBe(noChart);
    const crowned = coronation();
    expect(ownedRoyalItems(crowned)).toMatchObject({
      crown: true,
      cloak: false,
    });
    const rounds = claimMission(
      find(crowned, "field-notes", "garden-bench", "copper-scope"),
      "royal-rounds",
      now,
    );
    expect(claimMission(rounds, "kings-cloak", now)).toBe(rounds);
    const cloaked = claimMission(focused(rounds, 120), "kings-cloak", now);
    expect(ownedRoyalItems(cloaked).cloak).toBe(true);
    expect(claimMission(cloaked, "kings-cloak", now)).toBe(cloaked);
    const equipped = equipAppearance(cloaked, {
      ...DEFAULT_APPEARANCE,
      hat: "crown",
      cloak: "royal",
    });
    expect(equipped.appearance?.cloak).toBe("royal");
    expect(parseSave(JSON.stringify(equipped))).toEqual({
      save: equipped,
      error: null,
    });
    for (const id of ROYAL_MISSION_IDS)
      expect(claimMission(equipped, id, now)).toBe(equipped);
  });

  it("gates equipment in the action and imported save without changing old outfits", () => {
    const old = {
      ...createSave(),
      appearance: { outfit: 4, skin: 2, hat: "cap" as const },
    };
    expect(parseSave(JSON.stringify(old))).toEqual({ save: old, error: null });
    expect(parseSave(JSON.stringify(createSave())).error).toBeNull();
    const crown = { ...DEFAULT_APPEARANCE, hat: "crown" as const };
    const cloak = { ...DEFAULT_APPEARANCE, cloak: "royal" as const };
    expect(validAppearance(crown)).toBe(true);
    expect(equipAppearance(old, crown)).toBe(old);
    expect(equipAppearance(old, cloak)).toBe(old);
    expect(equipAppearance(old, { ...crown, cloak: "cape" })).toBe(old);
    expect(
      parseSave(JSON.stringify({ ...old, appearance: crown })).error,
    ).toBeTruthy();
    expect(
      parseSave(JSON.stringify({ ...old, appearance: cloak })).error,
    ).toBeTruthy();
    const earned = coronation();
    expect(equipAppearance(earned, crown).appearance?.hat).toBe("crown");
    expect(equipAppearance(earned, cloak)).toBe(earned);
    const regular = equipAppearance(earned, {
      ...DEFAULT_APPEARANCE,
      hat: "none",
      cloak: "none",
    });
    expect(ownedRoyalItems(regular).crown).toBe(true);
  });

  it("validates reward evidence and puzzle prerequisites in backups", () => {
    const valid = coronation();
    expect(parseSave(JSON.stringify(valid)).error).toBeNull();
    for (const patch of [
      { sessions: [] },
      { discoveries: valid.discoveries?.filter((d) => d !== "star-chart") },
      { missionClaims: ["town-coronation"] },
      {
        missionClaims: [
          "cherry-post",
          "lantern-cut",
          "bellmaker-code",
          "keeper-watch",
          "town-coronation",
          "kings-cloak",
        ],
      },
    ])
      expect(
        parseSave(JSON.stringify({ ...valid, ...patch })).error,
      ).toBeTruthy();
    expect(
      parseSave(
        JSON.stringify({ ...createSave(), discoveries: ["bellmaker-riddle"] }),
      ).error,
    ).toBeTruthy();
  });

  it("does not settle timers or overflow balances during quest interactions", () => {
    const save = find(
      startFocus(createSave(), 25, now, "active_timer"),
      "cherry-letter",
    );
    const claimed = claimMission(save, "cherry-post", now + 30 * 60000);
    expect(claimed.timer).toBe(save.timer);
    expect(claimed.sessions).toBe(save.sessions);
    expect(claimed.energy).toBe(save.energy);
    expect(claimed.xp).toBe(save.xp);
    const full = { ...save, coins: Number.MAX_SAFE_INTEGER };
    expect(claimMission(full, "cherry-post", now)).toBe(full);
    expect(claimMission(save, "cherry-post", NaN)).toBe(save);
  });
});
