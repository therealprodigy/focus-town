import { DESK_BACKGROUNDS } from "./DeskBackdrop";
import { deskDefaults } from "./deskPreferences";

type DeskOptions = typeof deskDefaults;
export function DeskAppearance({
  prefs,
  setting,
  onReset,
}: {
  prefs: DeskOptions;
  setting: <K extends keyof DeskOptions>(key: K, value: DeskOptions[K]) => void;
  onReset: () => void;
}) {
  return (
    <div className="desk-customizer">
      <p className="muted">
        Choose a view and a clock. Your current session keeps running.
      </p>
      <label>
        Scene lighting{" "}
        <select
          value={prefs.deskTheme}
          onChange={(e) => setting("deskTheme", e.target.value)}
        >
          <option value="lamplight">Lamplight</option>
          <option value="moonlight">Moonlight</option>
          <option value="ink">Quiet ink</option>
        </select>
      </label>
      <label>
        Clock{" "}
        <select
          value={prefs.clockStyle}
          onChange={(e) => setting("clockStyle", e.target.value)}
        >
          <option value="flip">Split-flap</option>
          <option value="plain">Plain digits</option>
        </select>
      </label>
      <div className="backdrop-setting">
        <span id="backdrop-label">Scenery</span>
        <div
          className="backdrop-choices"
          role="group"
          aria-labelledby="backdrop-label"
        >
          {(Object.keys(DESK_BACKGROUNDS) as (typeof prefs.background)[]).map(
            (kind) => (
              <button
                key={kind}
                className="backdrop-choice"
                aria-pressed={prefs.background === kind}
                onClick={() => setting("background", kind)}
              >
                <img
                  className="backdrop-preview"
                  src={DESK_BACKGROUNDS[kind].src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="160"
                  height="90"
                />
                <span className="backdrop-name">
                  {DESK_BACKGROUNDS[kind].name}
                </span>
              </button>
            ),
          )}
        </div>
      </div>
      <label>
        Finish{" "}
        <select
          value={prefs.deskFinish}
          onChange={(e) =>
            setting("deskFinish", e.target.value as typeof prefs.deskFinish)
          }
        >
          <option value="walnut">Walnut & brass</option>
          <option value="porcelain">Porcelain</option>
          <option value="terracotta">Terracotta</option>
        </select>
      </label>
      <label>
        Clock size{" "}
        <select
          value={prefs.clockSize}
          onChange={(e) =>
            setting("clockSize", e.target.value as typeof prefs.clockSize)
          }
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={prefs.showTask}
          onChange={(e) => setting("showTask", e.target.checked)}
        />
        Show task
      </label>
      <label>
        <input
          type="checkbox"
          checked={prefs.showAdvice}
          onChange={(e) => setting("showAdvice", e.target.checked)}
        />
        Show encouragement
      </label>
      <button className="reset-desk" onClick={onReset}>
        Reset appearance
      </button>
    </div>
  );
}
