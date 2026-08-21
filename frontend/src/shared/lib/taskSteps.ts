/** Split lesson usage_example into checklist steps (semicolon-separated). */
export function parseTaskSteps(usageExample: string): string[] {
  const parts = usageExample.split(';').map((s) => s.trim()).filter(Boolean)
  return parts.length > 0 ? parts : [usageExample.trim()].filter(Boolean)
}
