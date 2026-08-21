import { useState, useRef, useEffect, useCallback } from 'react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { executeCommand } from '@/features/bolt-simulator/simulator/engine/terminalEngine';
import { X, Trash2 } from 'lucide-react';

export function Terminal() {
  const { state, addTerminalLine, clearTerminal, setTerminalCwd, createNode, toggleTerminal, runWorkspaceFile } = useSimulator();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const prompt = `$ ${state.terminalCwd === '/' ? '~' : state.terminalCwd}`;

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.terminalLines]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const runCommand = (cmd: string) => {
    addTerminalLine({ text: `${prompt} ${cmd}`, type: 'input' });
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    if (command === 'python' || command === 'node' || command === 'run' || command === 'preview') {
      const target = args[0];
      if (!target) {
        addTerminalLine({ text: `${command}: missing file argument`, type: 'error' });
        return;
      }
      void runWorkspaceFile(target);
      return;
    }

    const result = executeCommand(cmd, {
      nodes: state.nodes,
      rootId: state.rootId,
      cwd: state.terminalCwd,
    });

    if (result.output.length === 1 && result.output[0] === '__CLEAR__') {
      clearTerminal();
      return;
    }

    for (const line of result.output) {
      addTerminalLine({ text: line, type: line.includes('No such file') || line.includes('error') || line.includes('not found') ? 'error' : 'output' });
    }

    if (result.newCwd !== undefined) {
      setTerminalCwd(result.newCwd);
    }

    if (result.fsMutation) {
      const mut = result.fsMutation;
      if (mut.type === 'create') {
        createNode(mut.parentId, mut.name, mut.nodeType);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (cmd) {
        runCommand(cmd);
        setHistory((h) => [...h, cmd]);
      }
      setInput('');
      setHistoryIdx(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-0" onClick={focusInput}>
      {/* Terminal header */}
      <div className="flex h-[35px] shrink-0 items-center justify-between border-t border-edge bg-surface-1 px-2 no-select">
        <div className="flex h-full items-center">
          <span className="flex h-full items-center border-b border-ink px-3 text-[13px] text-ink">
            Terminal
          </span>
        </div>
        <div className="flex items-center">
          <button type="button" onClick={clearTerminal} className="rounded-[2px] p-1 hover:bg-surface-2" title="Clear Terminal">
            <Trash2 size={13} className="text-ink-dim" />
          </button>
          <button type="button" onClick={toggleTerminal} className="rounded-[2px] p-1 hover:bg-surface-2" title="Close Panel">
            <X size={14} className="text-ink-dim" />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-sm leading-[20px]">
        <div className="mb-1 text-ink-dim">python index.py · node app.js · run page.html · help</div>
        {state.terminalLines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap ${
              line.type === 'input'
                ? 'text-accent'
                : line.type === 'error'
                  ? 'text-danger'
                  : 'text-ink-soft'
            }`}
          >
            {line.text}
          </div>
        ))}
        {/* Input line */}
        <div className="flex items-center mt-0.5">
          <span className="text-accent whitespace-pre">{prompt} </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="flex-1 bg-transparent outline-none text-ink font-mono text-sm caret-accent"
          />
        </div>
      </div>
    </div>
  );
}
