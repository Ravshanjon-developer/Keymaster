import { useState, useEffect, useRef } from 'react';
import { Plus, FilePlus, Clipboard, RefreshCw, FolderUp, Check } from 'lucide-react';
import { RealFolderIcon, RealTrashIcon } from '@/features/bolt-desktop/simulator/components/RealIcons';
import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem';
import type { ArchiveEngine } from '@/features/bolt-desktop/simulator/engine/ArchiveEngine';
import type { VNode, ClipboardEntry } from '@/features/bolt-desktop/simulator/engine/types';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';
import { FileTree, FileTypeIcon } from './FileTree';
import { ContextMenu, type MenuItem } from './ContextMenu';
import { useT } from '@/shared/i18n';
import { useLocaleStore } from '@/shared/i18n/localeStore';
import { localizeVfsPath } from '@/features/bolt-desktop/simulator/i18n/vfsLabels';
import { createItemForInlineRename, focusInlineRenameInput } from '@/features/bolt-desktop/simulator/engine/inlineCreate';
import { getVfsDragNodeId, setVfsDragData } from '@/features/bolt-desktop/simulator/engine/desktopDnD';

interface Props {
  vfs: VirtualFileSystem;
  archive: ArchiveEngine;
  theme: ThemeTokens;
  initialFolderId?: string;
  /** When the parent window navigates (e.g. desktop double-click), sync folder. */
  folderId?: string;
  onOpenFile: (node: VNode) => void;
  onOpenInVsCode?: (folderId: string) => void;
  clipboard: ClipboardEntry | null;
  setClipboard: (entry: ClipboardEntry | null) => void;
  registerActions?: (actions: FileManagerActions | null) => void;
}

export interface FileManagerActions {
  newFile: () => void;
  newFolder: () => void;
  paste: () => void;
  refresh: () => void;
  /** Live selection for global Ctrl+C / Ctrl+X while Explorer is open. */
  getSelectedId: () => string | null;
}

export function FileManager({
  vfs,
  archive,
  theme,
  initialFolderId,
  folderId: folderIdProp,
  onOpenFile,
  onOpenInVsCode,
  clipboard,
  setClipboard,
  registerActions,
}: Props) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId ?? vfs.getDesktopId());
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [tick, setTick] = useState(0);
  const [propertiesNode, setPropertiesNode] = useState<VNode | null>(null);
  const refresh = () => setTick((t) => t + 1);
  const editRef = useRef<HTMLInputElement>(null);
  const clipboardRef = useRef(clipboard);
  clipboardRef.current = clipboard;
  const folderIdRef = useRef(currentFolderId);
  folderIdRef.current = currentFolderId;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    return vfs.subscribe(refresh);
  }, [vfs]);

  const resolvedFolderId = folderIdProp ?? initialFolderId;
  useEffect(() => {
    if (resolvedFolderId) {
      setCurrentFolderId(resolvedFolderId);
      setSelectedId(null);
    }
  }, [resolvedFolderId]);

  useEffect(() => {
    if (editingId && editRef.current) {
      const node = vfs.getNode(editingId);
      if (node) {
        focusInlineRenameInput(editRef.current, node.name, node.type === 'folder');
      }
    }
  }, [editingId, vfs]);

  const children = vfs.getChildren(currentFolderId);

  const navigate = (id: string) => {
    setCurrentFolderId(id);
    setSelectedId(null);
  };

  const openNode = (node: VNode) => {
    if (node.type === 'folder') {
      navigate(node.id);
    } else {
      onOpenFile(node);
    }
  };

  const openSelected = () => {
    if (!selectedId) return;
    const node = vfs.getNode(selectedId);
    if (node) openNode(node);
  };

  const startRename = (node: VNode) => {
    setEditingId(node.id);
    setEditName(node.name);
  };

  const finishRename = () => {
    if (editingId) {
      const trimmed = editName.trim();
      if (trimmed) vfs.rename(editingId, trimmed);
    }
    setEditingId(null);
  };

  const newFile = () => {
    const id = createItemForInlineRename(
      vfs,
      folderIdRef.current,
      'file',
      t('desktopSimulator.defaultNewFile'),
    );
    if (id) {
      const node = vfs.getNode(id);
      setSelectedId(id);
      setEditingId(id);
      setEditName(node?.name ?? t('desktopSimulator.defaultNewFile'));
    }
  };

  const newFolder = () => {
    const id = createItemForInlineRename(
      vfs,
      folderIdRef.current,
      'folder',
      t('desktopSimulator.defaultNewFolder'),
    );
    if (id) {
      const node = vfs.getNode(id);
      setSelectedId(id);
      setEditingId(id);
      setEditName(node?.name ?? t('desktopSimulator.defaultNewFolder'));
    }
  };

  const doCopy = (node: VNode) => setClipboard({ nodeId: node.id, mode: 'copy' });
  const doCut = (node: VNode) => setClipboard({ nodeId: node.id, mode: 'cut' });

  const paste = () => {
    const clip = clipboardRef.current;
    if (!clip) return;
    const src = vfs.getNode(clip.nodeId);
    if (!src) return;
    const parentId = folderIdRef.current;
    if (clip.mode === 'copy') {
      vfs.copy(clip.nodeId, parentId);
    } else {
      vfs.move(clip.nodeId, parentId);
      setClipboard(null);
    }
  };

  useEffect(() => {
    if (!registerActions) return;
    registerActions({
      newFile,
      newFolder,
      paste,
      refresh,
      getSelectedId: () => selectedIdRef.current,
    });
    return () => registerActions(null);
    // Stable actions read clipboard/folder/selection via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerActions]);

  const doDelete = (node: VNode) => {
    if (node.id === vfs.getTrashId()) return;
    vfs.delete(node.id);
    setSelectedId(null);
  };

  const doRestore = (node: VNode) => {
    vfs.restore(node.id);
  };

  const doCompress = (node: VNode) => {
    const zipId = archive.compress(node.id, node.parentId!);
    if (zipId) setSelectedId(zipId);
  };

  const doExtract = (node: VNode) => {
    archive.extract(node.id);
  };

  const showProperties = (node: VNode) => setPropertiesNode(node);

  const fileMenuItems = (node: VNode): MenuItem[] => {
    const items: MenuItem[] = [
      { label: t('desktopSimulator.menuOpen'), action: () => openNode(node) },
    ];
    if (onOpenInVsCode) {
      items.push({
        label: t('desktopSimulator.menuOpenWithCode'),
        action: () => onOpenInVsCode(node.id),
      });
    }
    items.push(
      { label: t('desktopSimulator.menuRename'), action: () => startRename(node) },
      { label: t('desktopSimulator.menuCopy'), action: () => doCopy(node) },
      { label: t('desktopSimulator.menuCut'), action: () => doCut(node) },
    );
    if (node.type === 'file' && node.name.endsWith('.zip')) {
      items.push({ label: t('desktopSimulator.menuExtractHere'), action: () => doExtract(node) });
    }
    if (node.type === 'file') {
      items.push({ label: t('desktopSimulator.menuCompressZip'), action: () => doCompress(node) });
    } else {
      items.push({ label: t('desktopSimulator.menuCompressZip'), action: () => doCompress(node) });
    }
    if (node.parentId === vfs.getTrashId()) {
      items.push({ label: t('desktopSimulator.menuRestore'), action: () => doRestore(node) });
    }
    items.push({ label: t('desktopSimulator.menuDelete'), action: () => doDelete(node), danger: true });
    items.push({ label: '', action: () => {}, separator: true });
    items.push({ label: t('desktopSimulator.menuProperties'), action: () => showProperties(node) });
    return items;
  };

  const folderMenuItems = (node: VNode): MenuItem[] => {
    const items: MenuItem[] = [
      { label: t('desktopSimulator.menuOpen'), action: () => openNode(node) },
    ];
    if (onOpenInVsCode) {
      items.push({
        label: t('desktopSimulator.menuOpenWithCode'),
        action: () => onOpenInVsCode(node.id),
      });
    }
    items.push(
      { label: t('desktopSimulator.menuNewFile'), action: () => { navigate(node.id); setTimeout(newFile, 0); } },
      { label: t('desktopSimulator.menuNewFolder'), action: () => { navigate(node.id); setTimeout(newFolder, 0); } },
      { label: t('desktopSimulator.menuRename'), action: () => startRename(node) },
      { label: t('desktopSimulator.menuCopy'), action: () => doCopy(node) },
      { label: t('desktopSimulator.menuCut'), action: () => doCut(node) },
      { label: t('desktopSimulator.menuCompressZip'), action: () => doCompress(node) },
      { label: t('desktopSimulator.menuDelete'), action: () => doDelete(node), danger: true },
      { label: '', action: () => {}, separator: true },
      { label: t('desktopSimulator.menuProperties'), action: () => showProperties(node) },
    );
    return items;
  };

  const emptyMenuItems = (): MenuItem[] => [
    { label: t('desktopSimulator.menuNewFile'), action: newFile },
    { label: t('desktopSimulator.menuNewFolder'), action: newFolder },
    { label: t('desktopSimulator.menuPaste'), action: paste, disabled: !clipboard },
    { label: '', action: () => {}, separator: true },
    { label: t('desktopSimulator.menuRefresh'), action: refresh },
  ];

  const handleContext = (e: React.MouseEvent, node?: VNode) => {
    e.preventDefault();
    e.stopPropagation();
    const items = node
      ? node.type === 'folder'
        ? folderMenuItems(node)
        : fileMenuItems(node)
      : emptyMenuItems();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const goUp = () => {
    const cur = vfs.getNode(currentFolderId);
    if (cur && cur.parentId) navigate(cur.parentId);
  };

  const canGoUp = vfs.getNode(currentFolderId)?.parentId !== null;

  void tick;

  return (
    <div style={{ display: 'flex', height: '100%', background: theme.bg }}>
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: `1px solid ${theme.border}`,
          overflowY: 'auto',
          background: theme.bgElevated,
        }}
      >
        <FileTree
          vfs={vfs}
          theme={theme}
          currentFolderId={currentFolderId}
          onNavigate={navigate}
          onOpen={(n) => (n.type === 'folder' ? navigate(n.id) : onOpenFile(n))}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      </div>

      {/* Main area */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onContextMenu={(e) => handleContext(e)}
        onClick={() => setSelectedId(null)}
        onMouseDown={() => gridRef.current?.focus()}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.bgElevated,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ToolbarBtn theme={theme} onClick={goUp} disabled={!canGoUp} title={t('desktopSimulator.toolbarUp')}>
            <FolderUp size={15} />
          </ToolbarBtn>
          <ToolbarBtn theme={theme} onClick={newFile} title={t('desktopSimulator.toolbarNewFile')}>
            <FilePlus size={15} />
          </ToolbarBtn>
          <ToolbarBtn theme={theme} onClick={newFolder} title={t('desktopSimulator.toolbarNewFolder')}>
            <Plus size={15} />
          </ToolbarBtn>
          <ToolbarBtn theme={theme} onClick={paste} disabled={!clipboard} title={t('desktopSimulator.toolbarPaste')}>
            <Clipboard size={15} />
          </ToolbarBtn>
          <ToolbarBtn theme={theme} onClick={refresh} title={t('desktopSimulator.toolbarRefresh')}>
            <RefreshCw size={15} />
          </ToolbarBtn>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              marginLeft: 6,
              borderRadius: 4,
              border: `1px solid ${theme.border}`,
              background: theme.bgSurface,
              fontSize: 12,
              color: theme.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={localizeVfsPath(vfs.getPath(currentFolderId), locale)}
          >
            {localizeVfsPath(vfs.getPath(currentFolderId), locale)}
          </div>
          <span style={{ fontSize: 11, color: theme.textSubtle, paddingLeft: 8 }}>
            {t('desktopSimulator.itemCount', { count: children.length })}
          </span>
        </div>

        {/* File grid */}
        <div
          ref={gridRef}
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const srcId = getVfsDragNodeId(e.dataTransfer);
            if (srcId && !srcId.startsWith('sys:')) {
              vfs.move(srcId, currentFolderId);
            }
          }}
          onKeyDown={(e) => {
            if (editingId) return;
            if (e.key === 'Enter' && selectedId) {
              e.preventDefault();
              openSelected();
            }
            if (e.key === 'F2' && selectedId) {
              e.preventDefault();
              const node = vfs.getNode(selectedId);
              if (node) startRename(node);
            }
          }}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: 8,
            outline: 'none',
          }}
        >
          {children.length === 0 && (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                color: theme.textSubtle,
                fontSize: 13,
                marginTop: 40,
              }}
            >
              {t('desktopSimulator.emptyFolder')}
            </div>
          )}
          {children.map((node) => (
            <div
              key={node.id}
              draggable={editingId !== node.id}
              onDragStart={(e) => {
                if (editingId === node.id) {
                  e.preventDefault();
                  return;
                }
                setVfsDragData(e.dataTransfer, node.id);
                setSelectedId(node.id);
              }}
              onDragOver={
                node.type === 'folder'
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  : undefined
              }
              onDrop={
                node.type === 'folder'
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const srcId = getVfsDragNodeId(e.dataTransfer);
                      if (srcId && srcId !== node.id) vfs.move(srcId, node.id);
                    }
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(node.id);
              }}
              onDoubleClick={() => openNode(node)}
              onContextMenu={(e) => {
                setSelectedId(node.id);
                handleContext(e, node);
              }}
              style={{
                width: 92,
                borderRadius: 8,
                padding: '10px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: editingId === node.id ? 'text' : 'grab',
                background: selectedId === node.id ? theme.accentSoft : 'transparent',
                border: `1px solid ${selectedId === node.id ? theme.accent : 'transparent'}`,
                transition: 'background 0.12s, border 0.12s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedId !== node.id) e.currentTarget.style.background = theme.bgHover;
              }}
              onMouseLeave={(e) => {
                if (selectedId !== node.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              {node.type === 'folder' ? (
                node.id === vfs.getTrashId() ? (
                  <RealTrashIcon size={44} />
                ) : (
                  <RealFolderIcon size={44} />
                )
              ) : (
                <FileTypeIcon name={node.name} theme={theme} size={44} />
              )}
              {editingId === node.id ? (
                <input
                  ref={editRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 11,
                    width: '100%',
                    padding: '2px 4px',
                    border: `1px solid ${theme.accent}`,
                    borderRadius: 4,
                    background: theme.bg,
                    color: theme.text,
                    textAlign: 'center',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: theme.text,
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    lineHeight: 1.3,
                  }}
                >
                  {node.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          theme={theme}
          onClose={() => setContextMenu(null)}
        />
      )}

      {propertiesNode && (
        <PropertiesModal node={propertiesNode} vfs={vfs} theme={theme} locale={locale} onClose={() => setPropertiesNode(null)} />
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
  theme,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  theme: ThemeTokens;
  title: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 6,
        background: 'transparent',
        color: theme.textMuted,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = theme.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function PropertiesModal({
  node,
  vfs,
  theme,
  locale,
  onClose,
}: {
  node: VNode;
  vfs: VirtualFileSystem;
  theme: ThemeTokens;
  locale: import('@/shared/i18n/types').Locale;
  onClose: () => void;
}) {
  const t = useT();
  const childCount = node.type === 'folder' ? vfs.getChildren(node.id).length : 0;
  const sizeBytes = node.content.length;
  const locationPath = localizeVfsPath(vfs.getPath(node.parentId ?? ''), locale);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bgElevated,
          border: `1px solid ${theme.borderStrong}`,
          borderRadius: 12,
          padding: 20,
          width: 320,
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {node.type === 'folder' ? (
            <RealFolderIcon size={32} />
          ) : (
            <FileTypeIcon name={node.name} theme={theme} />
          )}
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{node.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PropRow label={t('desktopSimulator.propType')} value={node.type === 'folder' ? t('desktopSimulator.typeFolder') : t('desktopSimulator.typeFile')} theme={theme} />
          <PropRow label={t('desktopSimulator.propLocation')} value={locationPath} theme={theme} />
          {node.type === 'file' && <PropRow label={t('desktopSimulator.propSize')} value={t('desktopSimulator.sizeBytes', { n: sizeBytes })} theme={theme} />}
          {node.type === 'folder' && <PropRow label={t('desktopSimulator.propContents')} value={t('desktopSimulator.contentsItems', { count: childCount })} theme={theme} />}
          <PropRow label={t('desktopSimulator.propCreated')} value={new Date(node.createdAt).toLocaleString()} theme={theme} />
          <PropRow label={t('desktopSimulator.propModified')} value={new Date(node.updatedAt).toLocaleString()} theme={theme} />
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            width: '100%',
            padding: '8px',
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            background: theme.bgHover,
            color: theme.text,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Check size={14} /> {t('desktopSimulator.propClose')}
        </button>
      </div>
    </div>
  );
}

function PropRow({ label, value, theme }: { label: string; value: string; theme: ThemeTokens }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: theme.textSubtle }}>{label}</span>
      <span style={{ color: theme.text, textAlign: 'right', maxWidth: 180, wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}


