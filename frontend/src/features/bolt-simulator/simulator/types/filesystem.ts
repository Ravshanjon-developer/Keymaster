export type NodeType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  content?: string;
  language?: string;
  children: string[];
  createdAt: number;
}

export interface FileSystemState {
  nodes: Record<string, FileNode>;
  rootId: string;
  expandedFolders: Set<string>;
  selectedId: string | null;
  clipboard: {
    nodeIds: string[];
    operation: 'copy' | 'cut';
  } | null;
}

export type FSAction =
  | { type: 'create'; parentId: string; name: string; nodeType: NodeType }
  | { type: 'rename'; nodeId: string; name: string }
  | { type: 'delete'; nodeId: string }
  | { type: 'move'; nodeId: string; newParentId: string }
  | { type: 'duplicate'; nodeId: string }
  | { type: 'copy'; nodeIds: string[] }
  | { type: 'cut'; nodeIds: string[] }
  | { type: 'paste'; targetId: string }
  | { type: 'write'; nodeId: string; content: string }
  | { type: 'toggleExpand'; nodeId: string }
  | { type: 'select'; nodeId: string | null };
