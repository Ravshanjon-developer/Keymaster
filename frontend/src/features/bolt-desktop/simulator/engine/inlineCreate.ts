import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem';

/** Create item with a unique default name (no browser prompt). Returns new node id. */
export function createItemForInlineRename(
  vfs: VirtualFileSystem,
  parentId: string,
  kind: 'file' | 'folder',
  defaultName: string,
): string | null {
  const name = vfs.uniqueName(parentId, defaultName);
  return kind === 'file' ? vfs.createFile(parentId, name) : vfs.createFolder(parentId, name);
}

/** Focus rename field; for files, select basename without extension (Windows-like). */
export function focusInlineRenameInput(
  input: HTMLInputElement,
  fileName: string,
  isFolder: boolean,
): void {
  input.focus();
  if (isFolder) {
    input.select();
    return;
  }
  const dot = fileName.lastIndexOf('.');
  if (dot > 0) {
    input.setSelectionRange(0, dot);
  } else {
    input.select();
  }
}
