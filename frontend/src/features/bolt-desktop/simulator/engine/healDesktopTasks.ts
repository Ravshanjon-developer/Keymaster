import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem'

function nextTaskId(completed: Set<number>): number | null {
  for (let id = 1; id <= 12; id++) {
    if (!completed.has(id)) return id
  }
  return null
}

/**
 * Task progress is stored in localStorage, but without VFS persistence users
 * lose Practice / notes.txt after refresh while still being on task 3+.
 * Only restore files needed for the *current* incomplete task (do not fight later delete/restore tasks).
 */
export function healDesktopForCompletedTasks(
  vfs: VirtualFileSystem,
  completed: Set<number>,
): boolean {
  const next = nextTaskId(completed)
  if (next == null || next > 5) return false

  const desktopId = vfs.getDesktopId()
  let changed = false

  const desktopHas = (name: string, type: 'file' | 'folder') =>
    vfs.getChildren(desktopId).some((n) => n.type === type && n.name === name)

  if (completed.has(1) && !desktopHas('Practice', 'folder')) {
    if (vfs.createFolder(desktopId, 'Practice')) changed = true
  }

  const hasNotes = desktopHas('notes.txt', 'file')
  const hasMyNotes = desktopHas('my-notes.txt', 'file')

  if (next === 3 && !hasNotes && !hasMyNotes) {
    if (vfs.createFile(desktopId, 'notes.txt', '')) changed = true
  }

  if ((next === 4 || next === 5) && !hasMyNotes && !hasNotes) {
    if (vfs.createFile(desktopId, 'my-notes.txt', '')) changed = true
  }

  if (next === 5 && completed.has(4) && !desktopHas('Projects', 'folder')) {
    if (vfs.createFolder(desktopId, 'Projects')) changed = true
  }

  return changed
}
