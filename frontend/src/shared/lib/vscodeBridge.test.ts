import { describe, expect, it } from 'vitest'

import { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem'
import { emptyCodeLabWorkspace, exportVfsFolderToCodeLab } from './vscodeBridge'

describe('vscodeBridge', () => {
  it('builds an empty workspace named like Open Folder', () => {
    const ws = emptyCodeLabWorkspace('Projects')
    expect(ws.folderName).toBe('Projects')
    expect(ws.nodes[ws.rootId]?.type).toBe('folder')
    expect(ws.nodes[ws.rootId]?.children).toEqual([])
  })

  it('exports a VFS folder tree into the code-lab filesystem', () => {
    const vfs = new VirtualFileSystem()
    const desktop = vfs.getDesktopId()
    const folderId = vfs.createFolder(desktop, 'Projects')
    expect(folderId).toBeTruthy()
    const fileId = vfs.createFile(folderId!, 'app.js', 'console.log(1)')
    expect(fileId).toBeTruthy()

    const payload = exportVfsFolderToCodeLab(vfs, folderId!)
    expect(payload?.folderName).toBe('Projects')
    const root = payload!.nodes[payload!.rootId]
    expect(root.type).toBe('folder')
    expect(root.children.length).toBe(1)
    const child = payload!.nodes[root.children[0]!]
    expect(child.name).toBe('app.js')
    expect(child.content).toBe('console.log(1)')
  })
})
