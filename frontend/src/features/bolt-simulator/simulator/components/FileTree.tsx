import { useState, useRef, useEffect, memo } from 'react';
import { useSimulator, type FileNode } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { ChevronRight, Folder, FolderOpen, Plus, FolderPlus } from 'lucide-react';
import { getFileIcon, getFileColor } from '@/features/bolt-simulator/simulator/components/fileIcons';
import { LocalProjectImport } from '@/features/bolt-simulator/simulator/components/LocalProjectImport';
import { ContextMenu, type ContextMenuItem } from '@/features/bolt-simulator/simulator/components/ContextMenu';

interface FileTreeItemProps {
  nodeId: string;
  depth: number;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
}

function FileTreeItemBase({ nodeId, depth, onContextMenu, renamingId, setRenamingId }: FileTreeItemProps) {
  const { state, toggleExpand, selectNode, openFile, setActiveFile, renameNode } = useSimulator();
  const node = state.nodes[nodeId];
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renaming = renamingId === nodeId;

  useEffect(() => {
    if (renaming && node && inputRef.current) {
      setRenameValue(node.name);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming, node]);

  if (!node) return null;

  const isExpanded = state.expandedFolders.has(nodeId);
  const isSelected = state.selectedNodeId === nodeId;

  const handleClick = () => {
    selectNode(nodeId);
    if (node.type === 'folder') {
      toggleExpand(nodeId);
    } else {
      const tab = state.openTabs.find((t) => t.fileId === nodeId);
      if (tab) {
        setActiveFile(nodeId);
      } else {
        openFile(nodeId);
      }
    }
  };

  const submitRename = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      renameNode(nodeId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const Icon = node.type === 'folder'
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(node.name);
  const colorClass = node.type === 'folder' ? 'text-[#dcb67a]' : getFileColor(node.name);

  return (
    <>
      <div
        className={`flex items-center h-[22px] cursor-pointer text-[13px] transition-colors group ${
          isSelected ? 'bg-[#094771]' : 'hover:bg-surface-2'
        }`}
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node); }}
        onDoubleClick={node.type === 'file' ? handleClick : undefined}
        title={node.name}
      >
        {node.type === 'folder' ? (
          <ChevronRight
            size={14}
            className={`shrink-0 text-ink-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <Icon size={16} fill={node.type === 'folder' ? 'currentColor' : 'none'} className={`shrink-0 ml-1 ${colorClass}`} />
        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setRenamingId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="ml-1.5 px-1 py-0 text-sm bg-surface-0 border border-accent rounded outline-none flex-1 min-w-0"
          />
        ) : (
          <span className={`ml-1.5 truncate text-[13px] ${isSelected ? 'text-white' : 'text-ink-soft'}`}>
            {node.name}
          </span>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map((childId) => (
            <FileTreeItemBase
              key={childId}
              nodeId={childId}
              depth={depth + 1}
              onContextMenu={onContextMenu}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
            />
          ))}
        </div>
      )}
    </>
  );
}

const FileTreeItem = memo(FileTreeItemBase);

export function FileTree() {
  const { state, createNode, deleteNode, duplicateNode, copyNodes, cutNodes, pasteNodes, openFile } = useSimulator();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ parentId: string; type: 'file' | 'folder' } | null>(null);
  const [createName, setCreateName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);
  const root = state.nodes[state.rootId];

  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creating]);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleCreate = () => {
    if (creating && createName.trim()) {
      createNode(creating.parentId, createName.trim(), creating.type);
    }
    setCreating(null);
    setCreateName('');
  };

  const buildMenuItems = (node: FileNode): ContextMenuItem[] => {
    if (node.type === 'folder') {
      return [
        { label: 'New File', action: () => setCreating({ parentId: node.id, type: 'file' }) },
        { label: 'New Folder', action: () => setCreating({ parentId: node.id, type: 'folder' }) },
        { label: '', action: () => {}, separator: true },
        { label: 'Rename', action: () => setRenamingId(node.id), shortcut: 'F2' },
        { label: 'Delete', action: () => deleteNode(node.id), danger: true, shortcut: 'Del' },
        { label: '', action: () => {}, separator: true },
        { label: 'Copy', action: () => copyNodes([node.id]), shortcut: 'Ctrl+C' },
        { label: 'Cut', action: () => cutNodes([node.id]), shortcut: 'Ctrl+X' },
        { label: 'Paste', action: () => pasteNodes(node.id), disabled: !state.clipboard, shortcut: 'Ctrl+V' },
        { label: 'Duplicate', action: () => duplicateNode(node.id) },
      ];
    }
    return [
      { label: 'Open', action: () => openFile(node.id) },
      { label: '', action: () => {}, separator: true },
      { label: 'Rename', action: () => setRenamingId(node.id), shortcut: 'F2' },
      { label: 'Delete', action: () => deleteNode(node.id), danger: true, shortcut: 'Del' },
      { label: 'Duplicate', action: () => duplicateNode(node.id) },
      { label: '', action: () => {}, separator: true },
      { label: 'Copy', action: () => copyNodes([node.id]), shortcut: 'Ctrl+C' },
      { label: 'Cut', action: () => cutNodes([node.id]), shortcut: 'Ctrl+X' },
    ];
  };

  if (!root) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Explorer header */}
      <div className="flex h-[35px] items-center justify-between px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim no-select">
        <span>Explorer</span>
        <div className="flex items-center gap-0.5">
          <LocalProjectImport compact />
          <button
            type="button"
            onClick={() => setCreating({ parentId: state.rootId, type: 'file' })}
            className="p-1 hover:bg-surface-2 rounded transition-colors"
            title="New File"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCreating({ parentId: state.rootId, type: 'folder' })}
            className="p-1 hover:bg-surface-2 rounded transition-colors"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        <div className="px-2 py-1 text-2xs font-bold text-ink-soft no-select">
          {root.name.toUpperCase()}
        </div>

        {creating && (
          <div className="flex items-center h-[26px] mx-2" style={{ paddingLeft: 0 }}>
            {creating.type === 'folder' ? (
              <Folder size={15} className="shrink-0 text-accent" />
            ) : (
              (() => { const I = getFileIcon(createName || 'file.txt'); return <I size={15} className={`shrink-0 ${getFileColor(createName || 'file.txt')}`} />; })()
            )}
            <input
              ref={createInputRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onBlur={handleCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(null); setCreateName(''); }
              }}
              placeholder={creating.type === 'file' ? 'filename.js' : 'folder name'}
              className="ml-1.5 px-1 py-0 text-sm bg-surface-0 border border-accent rounded outline-none w-40"
            />
          </div>
        )}

        {root.children.map((childId) => (
          <FileTreeItem
            key={childId}
            nodeId={childId}
            depth={1}
            onContextMenu={handleContextMenu}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
          />
        ))}
      </div>

      <ContextMenu
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        items={contextMenu ? buildMenuItems(contextMenu.node) : []}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
