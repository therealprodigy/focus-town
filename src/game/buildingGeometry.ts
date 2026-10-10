import type { Rect } from "./world";

type RoofBuilding = Pick<Rect, "x" | "y" | "width"> & { name: string };

export function getRoofGeometry(b: RoofBuilding) {
  const count = b.name.includes("GOODS")
    ? 5
    : b.name.includes("LIBRARY")
      ? 9
      : 8;
  const courses: Rect[] = Array.from({ length: count }, (_, row) => {
    const inset = (count - 1 - row) * 7;
    return {
      x: b.x - 16 + inset,
      y: b.y - (count * 12 - 20) + row * 12,
      width: b.width + 32 - inset * 2,
      height: 16,
    };
  });
  const chimneyX = b.x + b.width - 44;
  // A chimney must sit on the slope under its whole base, not the ridge height.
  const support = courses.find(
    (course) =>
      chimneyX >= course.x && chimneyX + 24 <= course.x + course.width,
  )!;
  return {
    courses,
    chimney: { x: chimneyX, y: support.y + 4 - 48, width: 24, height: 48 },
    lanternBaseY: courses[0].y + 4,
  };
}
