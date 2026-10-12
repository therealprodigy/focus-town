import type { SaveData } from "./state.js";
import type { Interaction } from "./world.js";

export const DISCOVERIES = {
  "cherry-letter": {
    title: "The Cherrybank invitation",
    text: "Edda’s letter is pinned to the wayfinding post southwest of the fountain: We need a keeper, not a conqueror. First job: help Pip find the ending of his film. There is a brass compass with your name on it in the quest ledger.",
  },
  "lantern-reel": {
    title: "One frame short",
    text: "Pip’s reel shows the same station at sunrise, then at midday. The last frame is missing. A tiny blue police box in the background has been fined for parking across two centuries.",
  },
  "platform-nine": {
    title: "A ticket to almost somewhere",
    text: "The timetable lists Platform Nine and a Bit. Its train has been delayed by an owl. On the back of the ticket, Pip wrote: Last scene: lamps lit, stars out, not a scrap of sunlight.",
  },
  "star-chart": {
    title: "The kettle nebula",
    text: "Five stars make a saucepan. A sixth makes Edda’s argument that it is a crown. Edda has drawn a suspiciously ring-shaped moon and stamped it: not for lending.",
  },
  "bellmaker-riddle": {
    title: "The missing final frame",
    text: "Nightfall. Oren fits the little bell to Pip’s projector: one clear note when the final stars appear. Pip calls it surround sound. Oren calls it a bell.",
  },
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
  // The bellmaker answer is deliberate input, never an automatic proximity reward.
  if (!known(id) || id === "bellmaker-riddle" || save.discoveries?.includes(id))
    return save;
  if ((id === "night-choir" || id === "window-star") && !isTownNight(hour))
    return save;
  if (id === "quiet-bell" && (!canAnswerBell(save) || taps !== 3)) return save;
  return { ...save, discoveries: [...(save.discoveries ?? []), id] };
}
export function discoveryAt(id: string): DiscoveryId | undefined {
  return (
    {
      "cherry-letter": "cherry-letter",
      "lantern-reel": "lantern-reel",
      "platform-nine": "platform-nine",
      "star-chart": "star-chart",
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
  if (i.id === "edda")
    return {
      ...i,
      title: "Edda / keeper of things people meant to return",
      lines: save.missionClaims?.includes("kings-cloak")
        ? [
            "The cloak fits. Good. I guessed your size from how much shelf space you take up.",
            "A keeper visits the town, does the work, and comes back. You have managed all three.",
          ]
        : save.missionClaims?.includes("town-coronation")
          ? [
              "That crown is for showing up. We tried handing it to the most dramatic person, but Pip would not give it back.",
              "Take the long way through the garden. The field notes, bench and copper telescope are still worth your time.",
            ]
          : [
              "I sent the letter to Rowan because the postbox here is mostly bees. Polite bees. Terrible clerks.",
              "Pip has misplaced a film ending. Look beside his projector, then at the little station to the south.",
              "The crown is earned with attention, not coins. The quest ledger has the particulars.",
            ],
    };
  if (i.id === "pip")
    return {
      ...i,
      title: "Pip / director, audience of one",
      lines: save.missionClaims?.includes("lantern-cut")
        ? [
            "You found my ending. That is already better than the last festival jury.",
            "Keep the pocket projector. It plays my three tiny films, and only one of them is about a kettle.",
            "Oren is fitting the bell. Take him the station clues; he refuses to ring it at the wrong time.",
          ]
        : [
            "My epic has a beginning, a middle and an empty reel tin. A bold choice, according to nobody.",
            "Check the reel beside the projector. Then the ticket at Platform Nine, south of here.",
            "The train is not magical. The punctuality is pure fantasy, though.",
          ],
    };
  if (i.id === "oren")
    return {
      ...i,
      title: "Oren / bellmaker, fewer words than bells",
      lines: save.discoveries?.includes("bellmaker-riddle")
        ? [
            "Nightfall. Bell fitted. Film finished.",
            "Pip wanted thunder. I make bells.",
          ]
        : canSolveBellmaker(save)
          ? [
              "Pip’s film: sunrise, midday, missing frame. The ticket says lamps lit, stars out, no sunlight.",
              "Which scene comes last? Choose it below. No charge for thinking twice.",
            ]
          : [
              "No guessing without the clues. Reel by the cinema. Ticket by the station.",
              "Collect Pip’s missing ending in the quest ledger, then bring me the pocket projector.",
            ],
    };
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

export const BELLMAKER_CHOICES = [
  { id: "sunrise", label: "Sunrise: the first train" },
  { id: "midday", label: "Midday: the busy platform" },
  { id: "nightfall", label: "Nightfall: the station lights" },
] as const;
export const canSolveBellmaker = (save: SaveData) =>
  !!save.missionClaims?.includes("lantern-cut") &&
  ["lantern-reel", "platform-nine"].every((id) =>
    save.discoveries?.some((found) => found === id),
  ) &&
  !save.discoveries?.includes("bellmaker-riddle");
export function solveBellmaker(save: SaveData, choice: unknown): SaveData {
  if (!canSolveBellmaker(save) || choice !== "nightfall") return save;
  return {
    ...save,
    discoveries: [...(save.discoveries ?? []), "bellmaker-riddle"],
  };
}

export const POCKET_FILMS = [
  {
    title: "The Long Walk to the Kettle",
    frames: [
      "A traveller packs for a grand expedition.",
      "A mountain of unread books blocks the path.",
      "Jun points out the kettle is on this side of the mountain.",
    ],
  },
  {
    title: "Platform Nine and a Bit",
    frames: [
      "Sunrise. One traveller and a very large suitcase.",
      "Midday. The suitcase has become a cat bed.",
      "Nightfall. The train arrives. The cat declines to travel.",
    ],
  },
  {
    title: "A Small Disturbance in the Orchard",
    frames: [
      "A tiny gardener raises a wooden rake.",
      "An apple falls with unusual dramatic timing.",
      "Miso takes the credit. The orchard remains unconvinced.",
    ],
  },
] as const;
