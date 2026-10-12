import { Button } from "./components/ui/button";
import { useState } from "react";
import { RoyalKeepsakes, KeepsakeIcon } from "./RoyalKeepsakes";
import type { SaveData } from "./game/state";
import { coffeeActive, purchaseCoffee, COFFEE_PRICE } from "./game/state";
import { getProgress } from "./game/state";
import { UPGRADES, MISSIONS, type UpgradeId } from "./game/townCatalog";
import {
  purchaseUpgrade,
  claimMission,
  missionProgress,
  missionUnlocked,
  missionLockReason,
  missionRewardLabel,
  ROYAL_MISSION_IDS,
  compassHint,
} from "./game/townProgress";
type Props = {
  kind: "shop" | "missions";
  inRoom?: boolean;
  worldUpgrades?: readonly UpgradeId[];
  save: SaveData;
  now: number;
  canSave: boolean;
  update: (fn: (s: SaveData) => SaveData) => boolean;
  message: (text: string) => void;
  openShop: () => void;
  openWardrobe: () => void;
};
export function TownLedger({
  kind,
  inRoom = false,
  worldUpgrades,
  save,
  now,
  canSave,
  update,
  message,
  openShop,
  openWardrobe,
}: Props) {
  const [page, setPage] = useState<"cherrybank" | "town" | "keepsakes">(
    "cherrybank",
  );
  const best = getProgress(save, now).bestStreak;
  const perform = (fn: (s: SaveData) => SaveData, text: string) => {
    let changed = false;
    const saved = update((s) => {
      const next = fn(s);
      changed = next !== s;
      return next;
    });
    if (saved && changed) message(text);
  };
  return (
    <>
      <div className="ledger-heading">
        <span>Village level {1 + (save.upgrades?.length ?? 0)}</span>
        <strong>
          {save.coins} coins · {save.energy} energy
        </strong>
      </div>
      {kind === "shop" ? (
        <>
          <p className="muted">
            Lottie’s catalogue. Built things stay, even when a streak ends.
          </p>
          <div className="coffee-counter">
            <div>
              <h3>Jun’s trail coffee</h3>
              <p>
                Walk 35% faster for 30 minutes. Earn up to 25% extra solo focus
                coins for the portion you spend focusing while it is warm.
              </p>
              <small>
                {coffeeActive(save, now)
                  ? Math.ceil((save.coffee!.endsAt - now) / 60000) +
                    " minutes left"
                  : COFFEE_PRICE +
                    " coins · expires even while the game is closed"}
              </small>
            </div>
            <Button
              disabled={
                !canSave ||
                inRoom ||
                !!save.timer ||
                coffeeActive(save, now) ||
                save.coins < COFFEE_PRICE
              }
              onClick={() =>
                perform(
                  (s) => purchaseCoffee(s, Date.now()),
                  "One trail coffee. The kettle has done its part.",
                )
              }
            >
              {coffeeActive(save, now)
                ? "Still warm"
                : inRoom
                  ? "Solo only"
                  : save.timer
                    ? "After this interval"
                    : "Buy coffee"}
            </Button>
          </div>
          <div className="ledger-list">
            {UPGRADES.map((item) => {
              const owned = save.upgrades?.includes(item.id),
                locked =
                  best < item.streak ||
                  ("requires" in item &&
                    !save.upgrades?.includes(item.requires));
              const energy = "energy" in item ? item.energy : 0;
              return (
                <article key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                    <small>
                      {owned
                        ? "Built"
                        : item.price +
                          " coins" +
                          (energy ? " · " + energy + " energy" : "") +
                          (item.streak
                            ? " · " + item.streak + " day best streak"
                            : "")}
                    </small>
                  </div>
                  <Button
                    disabled={
                      !canSave ||
                      owned ||
                      locked ||
                      save.coins < item.price ||
                      save.energy < energy
                    }
                    onClick={() =>
                      perform(
                        (s) => purchaseUpgrade(s, item.id, now),
                        item.name + " built. Take a look outside.",
                      )
                    }
                  >
                    {owned
                      ? "Built"
                      : locked
                        ? "requires" in item
                          ? "Previous repair first"
                          : "Keep a streak"
                        : "Build"}
                  </Button>
                </article>
              );
            })}
          </div>
          <p className="fine-print">
            Streak milestones: 3 days earns 12 coins, 7 earns 24, 14 earns 40,
            and 30 earns 75. Each milestone pays once.
          </p>
        </>
      ) : (
        <>
          <div
            className="ledger-tabs"
            role="group"
            aria-label="Noticeboard pages"
          >
            {(["cherrybank", "town", "keepsakes"] as const).map((id) => (
              <button
                key={id}
                aria-pressed={page === id}
                onClick={() => setPage(id)}
              >
                {id === "cherrybank"
                  ? "Cherrybank"
                  : id === "town"
                    ? "Town errands"
                    : "Keepsakes"}
              </button>
            ))}
          </div>
          {page === "keepsakes" ? (
            <RoyalKeepsakes save={save} openWardrobe={openWardrobe} />
          ) : (
            <>
              {page === "cherrybank" ? (
                <div className="compass-note">
                  <KeepsakeIcon kind="compass" />
                  <p>{compassHint(save, worldUpgrades)}</p>
                </div>
              ) : (
                <p className="muted">
                  Small jobs around Greenvale. Earlier sessions count, and there
                  is no deadline.
                </p>
              )}
              <div className="ledger-list royal-requests">
                {MISSIONS.filter(
                  (m) =>
                    (ROYAL_MISSION_IDS as readonly string[]).includes(m.id) ===
                    (page === "cherrybank"),
                ).map((m) => {
                  const value = missionProgress(save, m.id, now),
                    claimed = save.missionClaims?.includes(m.id),
                    unlocked = missionUnlocked(save, m.id);
                  return (
                    <article key={m.id} data-complete={!!claimed}>
                      <div>
                        <h3>{m.title}</h3>
                        <p>{m.detail}</p>
                        <progress
                          aria-label={m.title}
                          max={m.target}
                          value={value}
                        />
                        <small>
                          {value} / {m.target} · {missionRewardLabel(m.id)}
                        </small>
                        {!unlocked && (
                          <small className="quest-prerequisite">
                            {missionLockReason(save, m.id)}
                          </small>
                        )}
                      </div>
                      <Button
                        disabled={
                          !canSave || claimed || !unlocked || value < m.target
                        }
                        onClick={() =>
                          perform(
                            (s) => claimMission(s, m.id, now),
                            missionRewardLabel(m.id) +
                              ("item" in m
                                ? " saved. Check your keepsakes."
                                : " saved."),
                          )
                        }
                      >
                        {claimed ? "Done" : !unlocked ? "Locked" : "Collect"}
                      </Button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          <Button onClick={openShop}>Lottie’s catalogue</Button>
        </>
      )}
    </>
  );
}
