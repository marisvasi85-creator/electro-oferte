import type { CalculationConfig } from "./types";

export function horizontalMeters(
  from: { x: number; y: number },
  to: { x: number; y: number },
  metersPerPixel: number,
  routing: CalculationConfig["routing"],
): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const pixels = routing === "floor_euclidean" ? Math.hypot(dx, dy) : dx + dy;
  return pixels * metersPerPixel;
}

export function pixelDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
