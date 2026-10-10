import {
  OUTFITS,
  SKINS,
  DEFAULT_APPEARANCE,
  type Appearance,
  type LightMode,
  type MotivationMode,
} from "./game/personalization";
import type { SaveData } from "./game/state";
export function TownPersonalization({
  save,
  update,
  canSave,
}: {
  save: SaveData;
  update: (fn: (s: SaveData) => SaveData) => boolean;
  canSave: boolean;
}) {
  const appearance = save.appearance ?? DEFAULT_APPEARANCE;
  const dress = (part: Partial<Appearance>) =>
    update((s) => ({
      ...s,
      appearance: { ...(s.appearance ?? DEFAULT_APPEARANCE), ...part },
    }));
  const coat = OUTFITS[appearance.outfit],
    skin = SKINS[appearance.skin];
  return (
    <fieldset className="wardrobe" disabled={!canSave}>
      <legend>Your traveller</legend>
      <div className="wardrobe-preview">
        <svg
          width="80"
          height="96"
          viewBox="0 0 20 24"
          shapeRendering="crispEdges"
          role="img"
          aria-label={coat.name + " outfit preview"}
        >
          <rect x="7" y="5" width="6" height="6" fill={skin.light} />
          <rect x="8" y="7" width="1" height="1" fill="#233c40" />
          <rect x="11" y="7" width="1" height="1" fill="#233c40" />
          {appearance.hat === "witch" ? (
            <path d="M9 0h2v2h2v2h2v2H5V4h2V2h2z" fill="#405966" />
          ) : appearance.hat === "cap" ? (
            <path d="M7 3h6v2h2v1H5V5h2z" fill="#697d7a" />
          ) : (
            <path d="M7 4h6v2H7z" fill="#233849" />
          )}
          <path d="M7 11h6v2h2v8H5v-8h2z" fill={coat.coat} />
          <rect x="9" y="11" width="2" height="10" fill={coat.light} />
          <rect x="8" y="11" width="4" height="1" fill={coat.trim} />
          <rect x="6" y="21" width="3" height="3" fill="#293c3e" />
          <rect x="11" y="21" width="3" height="3" fill="#293c3e" />
        </svg>
        <span>
          {save.characterName || "Your traveller"}
          <small>Changes save as you choose.</small>
        </span>
      </div>
      <label className="setting-row">
        Coat
        <select
          value={appearance.outfit}
          onChange={(e) => dress({ outfit: Number(e.target.value) })}
        >
          {OUTFITS.map((o, i) => (
            <option value={i} key={o.name}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <label className="setting-row">
        Skin tone
        <select
          value={appearance.skin}
          onChange={(e) => dress({ skin: Number(e.target.value) })}
        >
          {SKINS.map((s, i) => (
            <option value={i} key={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="setting-row">
        Headwear
        <select
          value={appearance.hat}
          onChange={(e) => dress({ hat: e.target.value as Appearance["hat"] })}
        >
          <option value="witch">Traveller’s hat</option>
          <option value="cap">Wool cap</option>
          <option value="none">No hat</option>
        </select>
      </label>
      <label className="setting-row">
        Town lighting
        <select
          value={save.lighting ?? "cycle"}
          onChange={(e) =>
            update((s) => ({ ...s, lighting: e.target.value as LightMode }))
          }
        >
          <option value="cycle">Living sky · 12-minute day</option>
          <option value="local">Follow my local time</option>
          <option value="day">Always daylight</option>
          <option value="night">Always evening</option>
        </select>
      </label>
      <label className="setting-row">
        A word before work
        <select
          value={save.motivation ?? "gentle"}
          onChange={(e) =>
            update((s) => ({
              ...s,
              motivation: e.target.value as MotivationMode,
            }))
          }
        >
          <option value="gentle">Gentle</option>
          <option value="direct">Direct</option>
          <option value="playful">Playful</option>
          <option value="off">Off</option>
        </select>
      </label>
      <p className="fine-print">
        Town lighting also sets the time for night discoveries. It does not
        change your real study timer or streak dates.
      </p>
    </fieldset>
  );
}
