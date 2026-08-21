import { VirtualFileSystem } from './VirtualFileSystem';
import { getExtension, getBaseName } from './types';

interface ZipIndexEntry {
  originalId: string;
  name: string;
  parentId: string | null;
  type: 'file' | 'folder';
  content: string;
}

/**
 * ArchiveEngine implements real compress/extract within the VFS.
 * A .zip file stores a JSON index of the original subtree in its content.
 * Extract reconstructs the subtree from that index.
 */
export class ArchiveEngine {
  private vfs: VirtualFileSystem;

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
  }

  compress(nodeId: string, targetParentId: string): string | null {
    const node = this.vfs.getNode(nodeId);
    if (!node) return null;
    const descendants = this.vfs.collectDescendants(nodeId);
    const entries: ZipIndexEntry[] = descendants.map((id) => {
      const n = this.vfs.getNode(id)!;
      return {
        originalId: id,
        name: n.name,
        parentId: n.parentId,
        type: n.type,
        content: n.content,
      };
    });
    // Rewrite parentIds to be relative to root for reconstruction
    const index = new Map(entries.map((e) => [e.originalId, e]));
    for (const e of entries) {
      if (e.parentId === node.parentId) {
        e.parentId = null; // root of archive
      } else if (e.parentId && index.has(e.parentId)) {
        // keep relative id (originalId)
      }
    }
    const baseName = node.type === 'folder' || !getExtension(node.name) ? node.name : getBaseName(node.name);
    const zipName = this.vfs.uniqueName(targetParentId, `${baseName}.zip`);
    const content = JSON.stringify(
      { format: 'keymaster-zip-v1', root: { name: node.name, type: node.type }, entries },
      null,
      0
    );
    const zipId = this.vfs.createFile(targetParentId, zipName, content);
    return zipId;
  }

  extract(zipId: string): boolean {
    const zip = this.vfs.getNode(zipId);
    if (!zip || zip.type !== 'file' || getExtension(zip.name) !== 'zip') return false;
    let data: { format: string; root: { name: string; type: string }; entries: ZipIndexEntry[] };
    try {
      data = JSON.parse(zip.content);
    } catch {
      return false;
    }
    if (!data.entries || !Array.isArray(data.entries)) return false;
    const rootEntry = data.entries.find((e) => e.parentId === null);
    if (!rootEntry) return false;
    const targetParent = zip.parentId!;

    const idMap = new Map<string, string>();
    // Create root
    const rootName = this.vfs.uniqueName(targetParent, rootEntry.name);
    const rootId =
      rootEntry.type === 'folder'
        ? this.vfs.createFolder(targetParent, rootName)
        : this.vfs.createFile(targetParent, rootName, rootEntry.content);
    if (!rootId) return false;
    idMap.set(rootEntry.originalId, rootId);

    // Create children in order
    const remaining = data.entries.filter((e) => e.parentId !== null);
    let progress = true;
    while (remaining.length && progress) {
      progress = false;
      for (let i = 0; i < remaining.length; i++) {
        const e = remaining[i];
        const mappedParent = idMap.get(e.parentId!);
        if (mappedParent) {
          const name = this.vfs.uniqueName(mappedParent, e.name);
          const newId =
            e.type === 'folder'
              ? this.vfs.createFolder(mappedParent, name)
              : this.vfs.createFile(mappedParent, name, e.content);
          if (newId) idMap.set(e.originalId, newId);
          remaining.splice(i, 1);
          i--;
          progress = true;
        }
      }
    }
    this.vfs.recordExtract();
    return true;
  }
}
