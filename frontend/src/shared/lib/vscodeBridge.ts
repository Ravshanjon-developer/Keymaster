import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem'
import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem'
import { getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter'

export const VSCODE_OPEN_FOLDER_KEY = 'km-vscode-open-folder-v1'

export type VsCodeOpenPayload = {
  folderName: string
  nodes: Record<string, FileNode>
  rootId: string
  expandedFolderIds: string[]
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Export a desktop VFS folder (and its descendants) into the VS Code simulator filesystem shape.
 * The folder itself becomes the workspace root so Explorer looks like “Open Folder”.
 */
export function exportVfsFolderToCodeLab(
  vfs: VirtualFileSystem,
  folderId: string,
): VsCodeOpenPayload | null {
  const root = vfs.getNode(folderId)
  if (!root || root.type !== 'folder') return null

  const nodes: Record<string, FileNode> = {}
  const expandedFolderIds: string[] = []
  const idMap = new Map<string, string>()

  const walk = (srcId: string, parentCodeId: string | null): string => {
    const src = vfs.getNode(srcId)
    if (!src) return parentCodeId ?? ''
    const codeId = newId(src.type === 'folder' ? 'dir' : 'file')
    idMap.set(srcId, codeId)

    if (src.type === 'folder') {
      const childSrc = vfs.getChildren(srcId)
      const childIds: string[] = []
      for (const child of childSrc) {
        childIds.push(walk(child.id, codeId))
      }
      nodes[codeId] = {
        id: codeId,
        name: parentCodeId === null ? src.name : src.name,
        type: 'folder',
        parentId: parentCodeId,
        children: childIds,
        createdAt: src.createdAt,
      }
      expandedFolderIds.push(codeId)
      return codeId
    }

    nodes[codeId] = {
      id: codeId,
      name: src.name,
      type: 'file',
      parentId: parentCodeId,
      content: src.content ?? '',
      language: getLanguageFromName(src.name),
      children: [],
      createdAt: src.createdAt,
    }
    return codeId
  }

  const rootId = walk(folderId, null)
  return {
    folderName: root.name,
    nodes,
    rootId,
    expandedFolderIds,
  }
}

/**
 * Open a single file in Code Lab: workspace root holds that file
 * (same idea as dropping a file onto the VS Code icon on Windows).
 */
export function exportVfsFileToCodeLab(
  vfs: VirtualFileSystem,
  fileId: string,
): VsCodeOpenPayload | null {
  const file = vfs.getNode(fileId)
  if (!file || file.type !== 'file') return null

  const rootId = newId('dir')
  const codeFileId = newId('file')
  const folderName = file.name.replace(/\.[^.]+$/, '') || 'workspace'

  return {
    folderName,
    rootId,
    expandedFolderIds: [rootId],
    nodes: {
      [rootId]: {
        id: rootId,
        name: folderName,
        type: 'folder',
        parentId: null,
        children: [codeFileId],
        createdAt: Date.now(),
      },
      [codeFileId]: {
        id: codeFileId,
        name: file.name,
        type: 'file',
        parentId: rootId,
        content: file.content ?? '',
        language: getLanguageFromName(file.name),
        children: [],
        createdAt: file.createdAt,
      },
    },
  }
}

/** Empty workspace named like a freshly opened folder in VS Code. */
export function emptyCodeLabWorkspace(folderName: string): VsCodeOpenPayload {
  const rootId = newId('dir')
  return {
    folderName,
    rootId,
    expandedFolderIds: [rootId],
    nodes: {
      [rootId]: {
        id: rootId,
        name: folderName,
        type: 'folder',
        parentId: null,
        children: [],
        createdAt: Date.now(),
      },
    },
  }
}

let memoryOpenFolder: VsCodeOpenPayload | null = null

export function stashVsCodeOpenFolder(payload: VsCodeOpenPayload): void {
  memoryOpenFolder = payload
  try {
    sessionStorage.setItem(VSCODE_OPEN_FOLDER_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

/** Read pending open-folder payload without clearing (Strict Mode safe). */
export function peekVsCodeOpenFolder(): VsCodeOpenPayload | null {
  if (memoryOpenFolder) return memoryOpenFolder
  try {
    const raw = sessionStorage.getItem(VSCODE_OPEN_FOLDER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VsCodeOpenPayload
    memoryOpenFolder = parsed
    return parsed
  } catch {
    return null
  }
}

export function clearVsCodeOpenFolder(): void {
  memoryOpenFolder = null
  try {
    sessionStorage.removeItem(VSCODE_OPEN_FOLDER_KEY)
  } catch {
    /* ignore */
  }
}

/** @deprecated prefer peek + clear; kept for callers that expect one-shot consume */
export function consumeVsCodeOpenFolder(): VsCodeOpenPayload | null {
  const payload = peekVsCodeOpenFolder()
  clearVsCodeOpenFolder()
  return payload
}
