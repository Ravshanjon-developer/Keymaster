export type NodeType = 'file' | 'folder';

export interface VNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ClipboardEntry {
  nodeId: string;
  mode: 'copy' | 'cut';
}

let idCounter = 0;
export function genId(prefix = 'n'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function getExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

export function getBaseName(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? name : name.slice(0, i);
}
