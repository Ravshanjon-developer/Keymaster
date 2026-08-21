import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';
import { getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter';

const MAX_BYTES = 2 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
  '.py', '.xml', '.svg', '.yaml', '.yml', '.env', '.gitignore', '.csv', '.sql',
  '.vue', '.svelte', '.php', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h',
]);

function isLikelyText(name: string, type: string): boolean {
  if (type && !type.startsWith('text/') && type !== 'application/json' && type !== 'application/javascript') {
    if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) return false;
  }
  const dot = name.lastIndexOf('.');
  if (dot === -1) return true;
  return TEXT_EXTENSIONS.has(name.slice(dot).toLowerCase());
}

let importId = 0;
function nextId(prefix: string): string {
  importId += 1;
  return `${prefix}_${Date.now().toString(36)}_${importId}`;
}

export interface ImportResult {
  nodes: Record<string, FileNode>;
  rootId: string;
  folderIds: string[];
  fileCount: number;
  skippedBinary: number;
}

/** Build virtual FS from `<input webkitdirectory>` or multi-file pick. */
export async function importFilesFromDisk(files: File[], projectName?: string): Promise<ImportResult> {
  const list = [...files].filter((f) => f.name && f.size >= 0);
  if (list.length === 0) {
    throw new Error('No files selected');
  }

  const hasRelative = list.some((f) => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
  const rootLabel =
    projectName ??
    (hasRelative ? list[0].webkitRelativePath.split('/')[0] : 'imported-project');

  const nodes: Record<string, FileNode> = {};
  const folderIds: string[] = [];
  const rootId = nextId('root');
  const now = Date.now();

  nodes[rootId] = {
    id: rootId,
    name: rootLabel,
    type: 'folder',
    parentId: null,
    children: [],
    createdAt: now,
  };
  folderIds.push(rootId);

  const folderByPath = new Map<string, string>();
  folderByPath.set('', rootId);

  const ensureFolder = (pathParts: string[]): string => {
    let currentPath = '';
    let parentId = rootId;
    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let id = folderByPath.get(currentPath);
      if (!id) {
        id = nextId('folder');
        nodes[id] = {
          id,
          name: part,
          type: 'folder',
          parentId,
          children: [],
          createdAt: now,
        };
        nodes[parentId].children.push(id);
        folderByPath.set(currentPath, id);
        folderIds.push(id);
      }
      parentId = id;
    }
    return parentId;
  };

  let fileCount = 0;
  let skippedBinary = 0;

  for (const file of list) {
    const rel = file.webkitRelativePath || file.name;
    const segments = rel.split('/').filter(Boolean);
    const fileName = segments.pop()!;
    if (!fileName || fileName.startsWith('.')) continue;

    const parentId = segments.length ? ensureFolder(segments) : rootId;

    const fileId = nextId('file');
    let content: string;

    if (file.size > MAX_BYTES) {
      content = `/* File too large to import (${Math.round(file.size / 1024)} KB). Max ${MAX_BYTES / 1024 / 1024} MB. */`;
      skippedBinary += 1;
    } else if (!isLikelyText(fileName, file.type)) {
      content = `/* Binary file "${fileName}" — open in an external app. */`;
      skippedBinary += 1;
    } else {
      try {
        content = await file.text();
      } catch {
        content = `/* Could not read file "${fileName}". */`;
        skippedBinary += 1;
      }
    }

    const lang = getLanguageFromName(fileName);
    nodes[fileId] = {
      id: fileId,
      name: fileName,
      type: 'file',
      parentId,
      content,
      language: lang,
      children: [],
      createdAt: now,
    };
    nodes[parentId].children.push(fileId);
    fileCount += 1;
  }

  if (fileCount === 0) {
    throw new Error('No supported files in selection');
  }

  return { nodes, rootId, folderIds, fileCount, skippedBinary };
}
