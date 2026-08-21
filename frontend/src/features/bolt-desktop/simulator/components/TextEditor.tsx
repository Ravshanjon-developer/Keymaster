import { useState, useEffect, useRef } from 'react';
import { Save, FileText } from 'lucide-react';
import type { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem';
import type { VNode } from '@/features/bolt-desktop/simulator/engine/types';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';
import { getExtension } from '@/features/bolt-desktop/simulator/engine/types';
import { useT } from '@/shared/i18n';

interface Props {
  vfs: VirtualFileSystem;
  theme: ThemeTokens;
  node: VNode;
  onClose: () => void;
}

export function TextEditor({ vfs, theme, node, onClose: _onClose }: Props) {
  const t = useT();
  const [content, setContent] = useState(node.content);
  const [savedContent, setSavedContent] = useState(node.content);
  const [saved, setSaved] = useState(true);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const ext = getExtension(node.name);
  const isImage = ext === 'png' || ext === 'jpg';

  useEffect(() => {
    setContent(node.content);
    setSavedContent(node.content);
    setSaved(true);
  }, [node.id, node.content]);

  const handleSave = () => {
    vfs.write(node.id, content);
    setSavedContent(content);
    setSaved(true);
  };

  const handleChange = (val: string) => {
    setContent(val);
    setSaved(val === savedContent);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Z are native to textarea
  };

  if (isImage) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
          gap: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            width: '60%',
            aspectRatio: '4/3',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.accentSoft}, ${theme.bgHover})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${theme.border}`,
          }}
        >
          <FileText size={48} color={theme.textSubtle} />
        </div>
        <span style={{ fontSize: 13, color: theme.textMuted }}>
          Image preview not available in MVP
        </span>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bgElevated,
        }}
      >
        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            background: saved ? theme.bgHover : theme.accentSoft,
            color: saved ? theme.textMuted : theme.accent,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Save size={13} /> {t('desktopSimulator.editorSave')}
        </button>
        <span style={{ fontSize: 12, color: theme.textSubtle }}>
          {node.name}
          {!saved && <span style={{ color: theme.warning, marginLeft: 6 }}>{t('desktopSimulator.editorUnsaved')}</span>}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: theme.textSubtle }}>
          {t('desktopSimulator.editorStats', {
            chars: content.length,
            lines: content.split('\n').length,
          })}
        </span>
      </div>

      {/* Editor area */}
      <textarea
        ref={textRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: 16,
          background: theme.bg,
          color: theme.text,
          fontFamily: ext === 'json' || ext === 'py' || ext === 'js' || ext === 'css'
            ? "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace"
            : ext === 'html'
            ? "monospace"
            : "'Inter', system-ui, sans-serif",
          fontSize: 14,
          lineHeight: 1.6,
          tabSize: 2,
        }}
      />
    </div>
  );
}
