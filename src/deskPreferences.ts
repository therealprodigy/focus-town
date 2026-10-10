export const deskDefaults = {
  deskTheme: "lamplight",
  clockStyle: "flip",
  deskFinish: "walnut" as "walnut" | "porcelain" | "terracotta",
  clockSize: "medium" as "small" | "medium" | "large",
  background: "observatory" as "observatory" | "paper" | "garden",
  showTask: true,
  showAdvice: true,
  focusCollapsed: false,
};
export function parseDeskPrefs(raw: unknown): typeof deskDefaults {
  const p =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    deskTheme: ["lamplight", "moonlight", "ink"].includes(String(p.deskTheme))
      ? String(p.deskTheme)
      : "lamplight",
    clockStyle: p.clockStyle === "plain" ? "plain" : "flip",
    deskFinish:
      p.deskFinish === "porcelain" || p.deskFinish === "terracotta"
        ? p.deskFinish
        : "walnut",
    clockSize:
      p.clockSize === "small" || p.clockSize === "large"
        ? p.clockSize
        : "medium",
    background:
      p.background === "paper" || p.background === "garden"
        ? p.background
        : "observatory",
    showTask: p.showTask !== false,
    showAdvice: p.showAdvice !== false,
    focusCollapsed: p.focusCollapsed === true,
  };
}
