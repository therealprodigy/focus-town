import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { intervalProgress, SessionMeter } from "../src/SessionMeter";

describe("interval progress", () => {
  it("uses the actual running duration, including long custom intervals", () => {
    expect(intervalProgress(12.5 * 60000, 25)).toBe(50);
    expect(intervalProgress(360 * 60000, 720)).toBe(50);
  });
  it("clamps an expired or temporarily stale countdown", () => {
    expect(intervalProgress(-1000, 25)).toBe(100);
    expect(intervalProgress(26 * 60000, 25)).toBe(0);
    expect(intervalProgress(1000, 0)).toBe(0);
    expect(intervalProgress(NaN, 25)).toBe(0);
  });
  it("does not show a made-up progress bar before a session starts", () => {
    expect(
      renderToStaticMarkup(
        <SessionMeter
          remaining={0}
          durationMinutes={25}
          active={false}
          paused={false}
        />,
      ),
    ).toBe("");
  });
  it("exposes paused progress without a live announcement every timer tick", () => {
    const html = renderToStaticMarkup(
      <SessionMeter
        remaining={12.5 * 60000}
        durationMinutes={25}
        active
        paused
      />,
    );
    expect(html).toContain('value="50"');
    expect(html).toContain('aria-label="Interval progress, paused"');
    expect(html).not.toContain("aria-live");
  });
});
