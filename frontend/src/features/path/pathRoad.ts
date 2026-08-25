/** Waypoints for a winding S-curve. Coordinates match the SVG viewBox. */

export const ROAD_VIEW_W = 1080
export const ROAD_PAD_Y = 88
export const ROAD_ROW = 200

export type RoadPoint = { x: number; y: number }

export function roadHeight(count: number) {
  if (count <= 0) return ROAD_PAD_Y * 2
  return ROAD_PAD_Y * 2 + (count - 1) * ROAD_ROW
}

export function roadWaypoints(count: number): RoadPoint[] {
  const mid = ROAD_VIEW_W / 2
  const swing = ROAD_VIEW_W * 0.34
  return Array.from({ length: count }, (_, i) => ({
    x: mid + (i % 2 === 0 ? -swing : swing),
    y: ROAD_PAD_Y + i * ROAD_ROW,
  }))
}

export function roadCurve(points: RoadPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const dy = curr.y - prev.y
    d += ` C ${prev.x} ${prev.y + dy * 0.62}, ${curr.x} ${curr.y - dy * 0.62}, ${curr.x} ${curr.y}`
  }
  return d
}

export function traveledRatio(nextIndex: number, total: number) {
  if (total <= 1) return nextIndex < 0 ? 1 : 0
  if (nextIndex < 0) return 1
  return nextIndex / (total - 1)
}
