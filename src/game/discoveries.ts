import type { SaveData } from "./state.js";
import type { Interaction } from "./world.js";

export const DISCOVERIES = {
  "blue-door": {
    title: "Room for one more",
    text: "A blue box on a travel poster promises more room than the rent suggests. Delivery date: yesterday.",
  },
  hearth: {
    title: "The fellowship of the kettle",
    text: "Jun's meal schedule leaves no time for the quest. You have my mug. And my biscuit.",
  },
  "field-notes": {
    title: "The missing hour",
    text: "The gardener kept a lamp beside the last row of moonflowers. The missing hour and the garden were waiting for the same traveller.",
  },
  "garden-bench": {
    title: "A place for the late ones",
    text: "Two mugs wait on a bench. One says Start. The other says Again.",
  },
  "copper-scope": {
    title: "An ordinary constellation",
    text: "The telescope points at five stars shaped like a kettle. Jun insists this is established astronomy.",
  },
  "crafting-note": {
    title: "Nine squares",
    text: "A workbench diagram reads: two sticks, three planks. Underneath: This is a chair. Please stop trying to craft a diamond sword.",
  },
  "orchard-cat": {
    title: "A very small supervisor",
    text: "Miso has signed the orchard inspection with one muddy paw. No structural concerns. More fish requested.",
  },
  "borrowed-time": {
    title: "Borrowed time",
    text: "A library book lives under the bench. Due back three years ago. Mira has stopped charging interest.",
  },
  "wrong-address": {
    title: "A letter for tomorrow",
    text: "The envelope is addressed to Whoever needs an extra minute. Inside: You can start again from here.",
  },
  "tea-secret": {
    title: "Jun’s secret recipe",
    text: "One leaf, hot water, and absolutely no side quests until the kettle boils.",
  },
  "river-atlas": {
    title: "The river atlas",
    text: "A pencilled route ends at a bell. Three small marks sit beside it.",
  },
  "margin-note": {
    title: "A note in the margin",
    text: "Three quiet knocks. Leave room for an answer.",
  },
  "shop-cat": {
    title: "Miso",
    text: "The shop cat has decided your house is also its house.",
  },
  "night-choir": {
    title: "The midnight choir",
    text: "The smallest frog conducts. Nobody follows its lead.",
  },
  "window-star": {
    title: "One spare star",
    text: "A moth in the window completes a constellation that was missing its last point.",
  },
  "quiet-bell": {
    title: "An answer",
    text: "Three taps on the bell. Three lights across the river. Someone is still there.",
  },
} as const;
export type DiscoveryId = keyof typeof DISCOVERIES;
export type DiscoveryEffect = "cat" | "choir" | "bell" | "star";
const known = (id: unknown): id is DiscoveryId =>
  typeof id === "string" && Object.hasOwn(DISCOVERIES, id);
export function validDiscoveries(value: unknown): value is DiscoveryId[] {
  return (
    Array.isArray(value) &&
    value.length <= Object.keys(DISCOVERIES).length &&
    value.every(known) &&
    new Set(value).size === value.length
  );
}
export const isTownNight = (hour: number) =>
  Number.isFinite(hour) && hour >= 0 && hour < 24 && (hour < 5 || hour >= 20);
export const canAnswerBell = (save: SaveData) =>
  ["river-atlas", "margin-note"].every((id) =>
    save.discoveries?.includes(id as DiscoveryId),
  );
export function recordDiscovery(
  save: SaveData,
  id: unknown,
  hour: number,
  taps = 0,
): SaveData {
  if (!known(id) || save.discoveries?.includes(id)) return save;
  if ((id === "night-choir" || id === "window-star") && !isTownNight(hour))
    return save;
  if (id === "quiet-bell" && (!canAnswerBell(save) || taps !== 3)) return save;
  return { ...save, discoveries: [...(save.discoveries ?? []), id] };
}
export function discoveryAt(id: string): DiscoveryId | undefined {
  return (
    {
      "blue-door": "blue-door",
      hearth: "hearth",
      "field-notes": "field-notes",
      "garden-bench": "garden-bench",
      "copper-scope": "copper-scope",
      "crafting-note": "crafting-note",
      "orchard-cat": "orchard-cat",
      bench: "borrowed-time",
      mail: "wrong-address",
      tea: "tea-secret",
      atlas: "river-atlas",
      shelf: "margin-note",
      cat: "shop-cat",
      frog: "night-choir",
      window: "window-star",
    } as Record<string, DiscoveryId>
  )[id];
}
export function encounterText(
  i: Interaction,
  save: SaveData,
  hour: number,
): Interaction {
  if (i.id === "cat")
    return {
      ...i,
      title: "Miso / unofficial shopkeeper",
      lines: [
        save.discoveries?.includes("shop-cat")
          ? "Miso recognises you. The inspection of your pockets is much less formal this time."
          : "The cat checks your empty hand, then leans into it. Its collar reads Miso.",
        "A house key would be wasted on a cat. It already knows the way in.",
      ],
    };
  if (i.id === "frog" && isTownNight(hour))
    return {
      ...i,
      title: "The midnight choir",
      lines: [
        "(o.o)  (o.o)  (o.o)",
        "The smallest frog raises a foot. Three throats puff out a beat too early.",
        "The notice still says no auditions. A sensible rule.",
      ],
    };
  if (i.id === "window")
    return {
      ...i,
      title: isTownNight(hour) ? "One spare star" : "The observatory window",
      lines: isTownNight(hour)
        ? [
            "A silver moth settles on the glass. For a moment it finishes the little star map scratched into the pane.",
            "Underneath: Leave a light for the late ones.",
          ]
        : [
            "A tiny star map has been scratched into the glass. Its last point is missing.",
            "Something silver might return after dark.",
          ],
    };
  if (i.id === "bell")
    return {
      ...i,
      title: save.discoveries?.includes("quiet-bell")
        ? "An answer across the river"
        : "The quiet bell",
      lines: save.discoveries?.includes("quiet-bell")
        ? [
            "The three distant lamps are still lit. There is no need to knock again.",
          ]
        : canAnswerBell(save)
          ? [
              "The marks in the atlas match the note from your shelf.",
              "Three quiet knocks. Leave room for an answer.",
            ]
          : [
              "There are three scratches beneath the bell. Something about them looks like handwriting.",
              "Mira’s atlas and the books at home might explain it.",
            ],
    };
  return i;
}
