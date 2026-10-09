export const CHAPTERS = [
  {
    at: 0,
    title: "The missing hour",
    place: "Greenvale Observatory",
    text: 'At midnight, every clock in Greenvale stopped one hour short. Rowan left a key beneath your door. "The lamps still work. Start with yours."',
    goal: "Keep the west lamp lit",
    target: 25,
  },
  {
    at: 25,
    title: "A light across the river",
    place: "Lantern House",
    text: "Your window is the first to glow. Across the river, someone answers with a lantern. Mira finds a pencilled route in the margin of an atlas.",
    goal: "Read the river atlas",
    target: 100,
  },
  {
    at: 100,
    title: "The bell without a tower",
    place: "Mothwick Library",
    text: "The atlas marks a bell in the woods, where no tower has ever stood. Rowan recognises the handwriting. It is his own, from a winter he cannot remember.",
    goal: "Piece together Rowan’s notes",
    target: 250,
  },
  {
    at: 250,
    title: "What the town kept",
    place: "The old crossing",
    text: "The missing hour was never stolen. Greenvale put it aside for a traveller who did not come home. Every lamp you light makes the path a little easier to see.",
    goal: "Light the way home",
    target: 500,
  },
  {
    at: 500,
    title: "An hour returned",
    place: "Greenvale",
    text: "At dawn, the bells ring once. A coat hangs beside Rowan’s at the door. Nobody asks you for a grand spell. There is tea on the desk, and another ordinary day ahead.",
    goal: "Keep a little time for yourself",
    target: 500,
  },
];
export const getChapter = (minutes: number) =>
  CHAPTERS.filter((c) => minutes >= c.at).at(-1)!;
