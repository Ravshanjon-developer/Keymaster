/** Paths that belong to the Practice product area (nav highlight + hub back-links). */
export const PRACTICE_ROUTE_PREFIXES = [
  '/practice',
  '/typing',
  '/simulator',
  '/training',
  '/speed',
  '/review',
  '/quiz',
  '/exam',
] as const

export function isPracticeRoute(pathname: string): boolean {
  return PRACTICE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
