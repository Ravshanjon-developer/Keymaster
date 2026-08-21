/** HTML5 DnD payload for desktop / File Manager VFS nodes. */
export const VFS_DND_MIME = 'application/x-km-vfs-node'

export type DesktopDropKind = 'vscode' | 'trash' | 'files' | 'folder' | 'desktop'

export function setVfsDragData(dataTransfer: DataTransfer, nodeId: string): void {
  dataTransfer.setData(VFS_DND_MIME, nodeId)
  dataTransfer.setData('text/plain', nodeId)
  dataTransfer.effectAllowed = 'copyMove'
}

export function getVfsDragNodeId(dataTransfer: DataTransfer): string | null {
  const id = dataTransfer.getData(VFS_DND_MIME) || dataTransfer.getData('text/plain')
  return id.trim() ? id.trim() : null
}

export type IconPos = { x: number; y: number }

const POS_KEY = 'km-desktop-icon-pos-v1'

export function loadDesktopIconPositions(): Record<string, IconPos> {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, IconPos>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDesktopIconPositions(positions: Record<string, IconPos>): void {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(positions))
  } catch {
    /* ignore */
  }
}

/** Default column layout like a fresh Windows desktop. */
export function defaultDesktopIconPos(index: number): IconPos {
  const col = Math.floor(index / 8)
  const row = index % 8
  return { x: 16 + col * 92, y: 16 + row * 92 }
}

const SYS_ICON_IDS = ['sys:files', 'sys:trash', 'sys:vscode'] as const

function tooClose(a: IconPos, b: IconPos): boolean {
  return Math.abs(a.x - b.x) < 56 && Math.abs(a.y - b.y) < 56
}

/**
 * Keep system icons visible and not stacked on each other
 * (common after drag when Files ends up under VS Code).
 */
export function sanitizeDesktopIconPositions(
  positions: Record<string, IconPos>,
): Record<string, IconPos> {
  const next = { ...positions }
  const defaults = SYS_ICON_IDS.map((id, i) => ({ id, pos: defaultDesktopIconPos(i) }))

  let resetSys = false
  for (const { id } of defaults) {
    const p = next[id]
    if (!p || p.x < -8 || p.y < -8 || p.x > 1800 || p.y > 1100) {
      resetSys = true
      break
    }
  }
  if (!resetSys) {
    for (let i = 0; i < defaults.length; i++) {
      for (let j = i + 1; j < defaults.length; j++) {
        const a = next[defaults[i].id]
        const b = next[defaults[j].id]
        if (a && b && tooClose(a, b)) {
          resetSys = true
          break
        }
      }
      if (resetSys) break
    }
  }
  if (resetSys) {
    for (const { id, pos } of defaults) next[id] = pos
  }
  return next
}

const VFS_KEY = 'km-desktop-vfs-v1'

export function loadDesktopVfsSnapshot(): unknown | null {
  try {
    const raw = localStorage.getItem(VFS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDesktopVfsSnapshot(snapshot: unknown): void {
  try {
    localStorage.setItem(VFS_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota */
  }
}
