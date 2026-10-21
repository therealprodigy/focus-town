export function intervalProgress(remaining: number, durationMinutes: number) {
  if (
    !Number.isFinite(remaining) ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  )
    return 0;
  return Math.max(
    0,
    Math.min(100, (1 - remaining / (durationMinutes * 60000)) * 100),
  );
}

export function SessionMeter({
  remaining,
  durationMinutes,
  active,
  paused,
}: {
  remaining: number;
  durationMinutes: number;
  active: boolean;
  paused: boolean;
}) {
  if (!active) return null;
  return (
    <progress
      className="interval-progress"
      max={100}
      value={intervalProgress(remaining, durationMinutes)}
      aria-label={paused ? "Interval progress, paused" : "Interval progress"}
    />
  );
}
