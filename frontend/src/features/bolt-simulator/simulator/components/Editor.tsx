import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { tokenize, tokenClass, getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter';
import { Search } from 'lucide-react';

export function Editor() {
  const { state, writeEditor, setCursor, activeFile, toggleFind } = useSimulator();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const content = state.editorContent;
  const language = activeFile ? getLanguageFromName(activeFile.name) : 'text';

  const tokenizedLines = useMemo(() => tokenize(content, language), [content, language]);
  const lineCount = content.split('\n').length;

  useEffect(() => {
    if (textareaRef.current && codeRef.current) {
      codeRef.current.scrollTop = textareaRef.current.scrollTop;
      codeRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [content]);

  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;
    if (codeRef.current) {
      codeRef.current.scrollTop = textareaRef.current.scrollTop;
      codeRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const updateCursor = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const lines = before.split('\n');
    setCursor(lines.length, lines[lines.length - 1].length + 1);
  }, [setCursor]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    writeEditor(e.target.value);
  };

  // Find highlight
  const findMatches = useMemo(() => {
    if (!state.findOpen || !state.findQuery) return [];
    const matches: { line: number; col: number }[] = [];
    const lines = content.split('\n');
    const query = state.findQuery.toLowerCase();
    lines.forEach((line, i) => {
      let idx = 0;
      while ((idx = line.toLowerCase().indexOf(query, idx)) !== -1) {
        matches.push({ line: i, col: idx });
        idx += query.length;
      }
    });
    return matches;
  }, [content, state.findOpen, state.findQuery]);

  if (!activeFile) {
    const rows = [
      ['Show All Commands', 'Ctrl+Shift+P'],
      ['Go to File', 'Ctrl+P'],
      ['Find in Files', 'Ctrl+Shift+F'],
      ['Toggle Terminal', 'Ctrl+`'],
      ['Toggle Primary Side Bar', 'Ctrl+B'],
    ];
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-0">
        <div className="flex w-[min(22rem,90%)] flex-col gap-3 text-[13px] text-ink-dim">
          {rows.map(([label, keys]) => (
            <div key={label} className="flex items-center justify-between gap-8">
              <span>{label}</span>
              <span className="text-[12px] tracking-wide text-ink-faint">{keys}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-0 min-w-0">
      {/* Find bar */}
      {state.findOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-1 border-b border-edge animate-slide-down">
          <Search size={14} className="text-ink-dim" />
          <input
            autoFocus
            value={state.findQuery}
            onChange={(e) => toggleFind(true, e.target.value)}
            placeholder="Find"
            className="flex-1 max-w-xs px-2 py-1 text-sm bg-surface-0 border border-edge rounded outline-none focus:border-accent text-ink"
          />
          <span className="text-2xs text-ink-dim">
            {findMatches.length} {findMatches.length === 1 ? 'result' : 'results'}
          </span>
          <button
            onClick={() => toggleFind(false)}
            className="text-2xs text-ink-dim hover:text-ink px-2"
          >
            Esc
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="shrink-0 overflow-hidden py-3 px-2 text-right text-sm font-mono text-ink-faint select-none bg-surface-0"
          style={{ minWidth: `${String(lineCount).length * 8 + 16}px` }}
        >
          {tokenizedLines.map((_, i) => (
            <div
              key={i}
              className={`leading-[21px] h-[21px] ${state.cursorLine === i + 1 ? 'text-ink-soft' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Syntax highlighted layer */}
          <pre
            ref={codeRef}
            className="absolute inset-0 overflow-auto py-3 px-3 font-mono text-sm leading-[21px] pointer-events-none whitespace-pre"
            aria-hidden="true"
          >
            {tokenizedLines.map((tokens, i) => (
              <div key={i} className={`h-[21px] ${state.cursorLine === i + 1 ? 'bg-accent/5' : ''}`}>
                {tokens.length === 0 ? ' ' : tokens.map((tok, j) => (
                  <span key={j} className={tokenClass(tok.type)}>{tok.value}</span>
                ))}
              </div>
            ))}
          </pre>

          {/* Transparent textarea on top */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onKeyDown={updateCursor}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="absolute inset-0 w-full h-full py-3 px-3 font-mono text-sm leading-[21px] bg-transparent text-transparent caret-accent resize-none outline-none whitespace-pre overflow-auto"
            style={{ caretColor: 'rgb(var(--accent))' }}
          />
        </div>
      </div>
    </div>
  );
}
