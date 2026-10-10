export const OUTFITS = [
  { name: "Brook teal", coat: "#376f70", light: "#80b2a3", trim: "#d9af65" },
  { name: "Brick red", coat: "#945446", light: "#c88b67", trim: "#e7c68e" },
  { name: "Moss keeper", coat: "#526d43", light: "#9daf71", trim: "#dfc99a" },
  { name: "Ink blue", coat: "#395879", light: "#8ba7b9", trim: "#dfba78" },
  { name: "Honey wool", coat: "#95703e", light: "#d1af70", trim: "#f0dbb0" },
  { name: "Chalk linen", coat: "#9faaa0", light: "#ddd8bf", trim: "#536f71" },
] as const;
export const SKINS = [
  { name: "Warm sand", light: "#e0af83", shade: "#bb805f" },
  { name: "Copper", light: "#b77a52", shade: "#885134" },
  { name: "Umber", light: "#80513e", shade: "#563629" },
  { name: "Rose", light: "#f0c6a7", shade: "#c39278" },
] as const;
export type Appearance = {
  outfit: number;
  skin: number;
  hat: "witch" | "cap" | "none";
};
export const DEFAULT_APPEARANCE: Appearance = {
  outfit: 0,
  skin: 0,
  hat: "witch",
};
export function validAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const a = value as Appearance;
  return (
    Number.isInteger(a.outfit) &&
    a.outfit >= 0 &&
    a.outfit < OUTFITS.length &&
    Number.isInteger(a.skin) &&
    a.skin >= 0 &&
    a.skin < SKINS.length &&
    ["witch", "cap", "none"].includes(a.hat)
  );
}
export type LightMode = "cycle" | "local" | "day" | "night";
export const validLightMode = (x: unknown): x is LightMode =>
  typeof x === "string" && ["cycle", "local", "day", "night"].includes(x);
export type MotivationMode = "gentle" | "direct" | "playful" | "off";
export const validMotivation = (x: unknown): x is MotivationMode =>
  typeof x === "string" && ["gentle", "direct", "playful", "off"].includes(x);
const LINES = {
  gentle: [
    "Start with one page. Leave the rest for later.",
    "The lamp is on. There is room to begin again.",
    "A short session still belongs in the journal.",
    "You do not have to finish everything this evening.",
    "Take the break. The bookmark will hold your place.",
    "Yesterday can stay yesterday. Pick somewhere to start.",
    "A little attention, given often, builds a town.",
    "Your next step can be a small one.",
  ],
  direct: [
    "Pick the question you keep skipping.",
    "Write the first sentence before fixing the title.",
    "Put the phone away for this one interval.",
    "If you are stuck, write down exactly where.",
    "Choose one task. Give it the next twenty minutes.",
    "Read the example, then try it without looking.",
    "Finish the paragraph before opening another tab.",
    "You can tidy the desk after the first question.",
  ],
  playful: [
    "Jun has put the kettle on. Try to beat it to one paragraph.",
    "Miso has completed eight naps. Your move.",
    "No side quests until this page is done.",
    "The final boss appears to be question three.",
    "Your inventory has room for one more useful fact.",
    "The library has asked you to stop speedrunning the contents page.",
    "Achievement pending: opening the actual textbook.",
    "Even a crafting table starts with one plank.",
  ],
} as const;
export function motivationLine(
  mode: MotivationMode,
  completed: number,
  day: number,
) {
  if (mode === "off") return "";
  const lines = LINES[mode];
  return lines[Math.abs(Math.floor(completed + day)) % lines.length];
}
