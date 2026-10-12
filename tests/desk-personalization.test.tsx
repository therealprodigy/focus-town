import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { deskDefaults, parseDeskPrefs } from "../src/deskPreferences";
import {
  practiceStart,
  practiceAction,
  nearPracticeSign,
  TourPractice,
} from "../src/TourPractice";
import { DeskBackdrop, DESK_BACKGROUNDS } from "../src/DeskBackdrop";

describe("personal desk and first visit", () => {
  it("migrates older preferences without removing their chosen light or clock", () => {
    expect(
      parseDeskPrefs({ deskTheme: "moonlight", clockStyle: "plain" }),
    ).toEqual({ ...deskDefaults, deskTheme: "moonlight", clockStyle: "plain" });
  });
  it("keeps all desk choices through a JSON round trip", () => {
    const chosen = {
      deskTheme: "ink",
      clockStyle: "plain",
      deskFinish: "porcelain",
      clockSize: "small",
      background: "garden",
      showTask: false,
      showAdvice: false,
      focusCollapsed: true,
    };
    expect(parseDeskPrefs(JSON.parse(JSON.stringify(chosen)))).toEqual(chosen);
  });
  it("rejects unknown themes and background URLs and accepts only boolean flags", () => {
    expect(
      parseDeskPrefs({
        deskTheme: "sunburn",
        background: "https://example.com/tracker",
        clockSize: 5000,
        deskFinish: "neon",
        showTask: "false",
        focusCollapsed: "true",
      }),
    ).toEqual(deskDefaults);
    for (const bad of [null, undefined, false, "broken"])
      expect(parseDeskPrefs(bad)).toEqual(deskDefaults);
  });
  it("clamps the practice walker and blocks the stone and sign", () => {
    let s = practiceStart;
    for (let i = 0; i < 30; i++) s = practiceAction(s, "ArrowLeft");
    expect(s.x).toBe(0);
    expect(practiceAction({ ...s, x: 2, y: 2 }, "D").x).toBe(2);
    expect(practiceAction({ ...s, x: 5, y: 1 }, "d").x).toBe(5);
    expect(practiceAction(s, "Tab")).toBe(s);
  });
  it("requires reaching the sign before Use works, and does not mutate its input", () => {
    expect(practiceAction(practiceStart, "e")).toBe(practiceStart);
    let s = practiceStart;
    for (const k of ["d", "d", "d", "d", "w", "w"]) s = practiceAction(s, k);
    expect(nearPracticeSign(s)).toBe(true);
    expect(practiceAction(s, "E").read).toBe(true);
    expect(s.read).toBe(false);
    expect(practiceStart).toEqual({ x: 1, y: 3, moved: false, read: false });
  });
  it("offers touch and keyboard instructions without giving the practice access to progress", () => {
    const html = renderToStaticMarkup(<TourPractice />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Walk left"');
    expect(html).toContain("Practice only");
    expect(html).toContain("disabled");
  });
  it("keeps the old paper choice when loading the new library artwork", () => {
    const prefs = parseDeskPrefs({
      background: "paper",
      deskFinish: "porcelain",
    });
    expect(prefs.background).toBe("paper");
    expect(prefs.deskFinish).toBe("porcelain");
    expect(DESK_BACKGROUNDS[prefs.background].name).toBe("Library window");
  });
  it("ships every background locally and keeps decorative images out of the accessibility tree", () => {
    for (const kind of ["observatory", "paper", "garden"] as const) {
      const html = renderToStaticMarkup(<DeskBackdrop kind={kind} />);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('alt=""');
      const { src } = DESK_BACKGROUNDS[kind];
      expect(html).toContain('src="' + src + '"');
      expect(html).not.toContain("https:");
      const bytes = readFileSync(new URL("../public" + src, import.meta.url));
      if (src.endsWith(".webp")) {
        expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
        expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      } else {
        expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      }
    }
  });
});
