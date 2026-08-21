import { useState } from 'react'
import { FileText, ChevronRight, ChevronDown } from 'lucide-react'
import {
  RealCodeFileIcon,
  RealFolderIcon,
  RealTextFileIcon,
  RealTrashIcon,
  RealZipFileIcon,
} from '@/features/bolt-desktop/simulator/components/RealIcons'
import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem'
import type { VNode } from '@/features/bolt-desktop/simulator/engine/types'
import { getExtension } from '@/features/bolt-desktop/simulator/engine/types'
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme'
import { useT } from '@/shared/i18n'
import { useLocaleStore } from '@/shared/i18n/localeStore'
import { localizeVfsNodeName, localizeVfsPath } from '@/features/bolt-desktop/simulator/i18n/vfsLabels'

interface Props {
  vfs: VirtualFileSystem;
  theme: ThemeTokens;
  currentFolderId: string;
  onNavigate: (id: string) => void;
  onOpen: (node: VNode) => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

export function FileTree({
  vfs,
  theme,
  currentFolderId,
  onNavigate,
  onOpen,
  onSelect,
  selectedId,
}: Props) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([vfs.getDesktopId()]));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: VNode, depth: number): React.ReactNode => {
    if (node.id === vfs.getTrashId()) {
      return (
        <div key={node.id}>
          <SidebarItem
            node={node}
            displayName={localizeVfsNodeName(node.id, node.name, locale)}
            depth={depth}
            theme={theme}
            selected={selectedId === node.id}
            onClick={() => {
              onNavigate(node.id);
              onSelect(node.id);
            }}
            icon={<span style={{ width: 14 }} />}
            leadingIcon={<RealTrashIcon size={16} />}
          />
        </div>
      );
    }
    const children = node.type === 'folder' ? vfs.getChildren(node.id) : [];
    const isExpanded = expanded.has(node.id);
    return (
      <div key={node.id}>
        <SidebarItem
          node={node}
          displayName={localizeVfsNodeName(node.id, node.name, locale)}
          depth={depth}
          theme={theme}
          selected={selectedId === node.id}
          onClick={() => {
            if (node.type === 'folder') {
              onNavigate(node.id);
              toggle(node.id);
              onSelect(node.id);
            } else {
              onOpen(node);
            }
          }}
          icon={
            node.type === 'folder' ? (
              isExpanded && children.length > 0 ? (
                <ChevronDown size={14} color={theme.textSubtle} />
              ) : children.length > 0 ? (
                <ChevronRight size={14} color={theme.textSubtle} />
              ) : (
                <span style={{ width: 14 }} />
              )
            ) : (
              <span style={{ width: 14 }} />
            )
          }
          leadingIcon={
            node.type === 'folder' ? (
              <RealFolderIcon size={16} />
            ) : (
              <FileTypeIcon name={node.name} theme={theme} />
            )
          }
        />
        {isExpanded && children.length > 0 && (
          <div>
            {children.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const roots = [
    vfs.getNode(vfs.getDesktopId())!,
    vfs.getNode('documents')!,
    vfs.getNode('downloads')!,
    vfs.getNode('projects')!,
    vfs.getNode(vfs.getTrashId())!,
  ];

  return (
    <div style={{ padding: '6px 4px' }}>
      {roots.map((r) => renderNode(r, 0))}
      <div style={{ height: 8 }} />
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: theme.textSubtle,
          padding: '4px 12px',
        }}
      >
        {t('desktopSimulator.currentPath', {
          path: localizeVfsPath(vfs.getPath(currentFolderId), locale),
        })}
      </div>
    </div>
  );
}

function SidebarItem({
  node,
  displayName,
  depth,
  theme,
  selected,
  onClick,
  icon,
  leadingIcon,
}: {
  node: VNode;
  displayName?: string;
  depth: number;
  theme: ThemeTokens;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  leadingIcon?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        paddingLeft: 8 + depth * 16,
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        color: selected ? theme.accent : theme.text,
        background: selected ? theme.accentSoft : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = theme.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
      {leadingIcon}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {displayName ?? node.name}
      </span>
    </div>
  );
}

export function FileTypeIcon({
  name,
  theme,
  size = 16,
}: {
  name: string
  theme: ThemeTokens
  /** Desktop icons should be ~40; list rows stay ~16. */
  size?: number
}) {
  const ext = getExtension(name)

  if (ext === 'txt' || ext === 'md') {
    return <RealTextFileIcon size={size} />
  }
  if (ext === 'zip') {
    return <RealZipFileIcon size={size} />
  }
  if (ext === 'js' || ext === 'ts') {
    return <RealCodeFileIcon size={size} badge={ext.toUpperCase()} color="#F7DF1E" />
  }
  if (ext === 'html') {
    return <RealCodeFileIcon size={size} badge="HTML" color="#E34F26" />
  }
  if (ext === 'css') {
    return <RealCodeFileIcon size={size} badge="CSS" color="#264DE4" />
  }
  if (ext === 'json') {
    return <RealCodeFileIcon size={size} badge="{}" color="#CBCB41" />
  }
  if (ext === 'py') {
    return <RealCodeFileIcon size={size} badge="PY" color="#3776AB" />
  }
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
    return <RealCodeFileIcon size={size} badge="IMG" color="#A78BFA" />
  }

  if (size >= 28) {
    return <RealTextFileIcon size={size} />
  }

  return <FileText size={size} color={theme.textMuted} />
}
