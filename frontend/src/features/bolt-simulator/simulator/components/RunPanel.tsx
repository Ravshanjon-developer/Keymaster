import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { detectRunKind } from '@/features/bolt-simulator/simulator/engine/codeRunner';
import { Play, Terminal, FileCode } from 'lucide-react';

export function RunPanel() {
  const { state, runActiveFile, toggleTerminal, notify } = useSimulator();
  const file = state.activeTabId ? state.nodes[state.activeTabId] : null;
  const kind = file?.type === 'file' ? detectRunKind(file.name) : null;

  const run = () => {
    if (!file || file.type !== 'file') {
      notify({ type: 'warning', message: 'Откройте файл в редакторе', detail: 'Выберите .html, .py или .js' });
      return;
    }
    void runActiveFile();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-edge px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim no-select">
        Run and Debug
      </div>
      <div className="flex flex-col gap-3 p-3">
        <button
          type="button"
          onClick={run}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent/90"
        >
          <Play size={16} fill="currentColor" />
          Run (F5)
        </button>

        {file?.type === 'file' ? (
          <div className="rounded-lg border border-edge bg-surface-0 p-2.5">
            <div className="flex items-center gap-2 text-2xs text-ink-dim">
              <FileCode size={14} />
              <span className="truncate font-mono text-ink-soft">{file.name}</span>
            </div>
            <p className="mt-2 text-2xs leading-relaxed text-ink-dim">
              {kind === 'html-preview' && 'HTML откроется в панели Preview справа.'}
              {kind === 'python' && 'Python выполнится в терминале (Pyodide, нужен интернет при первом запуске).'}
              {kind === 'javascript' && 'JavaScript выполнится в терминале.'}
              {kind === 'unsupported' && 'Этот тип не запускается автоматически. Попробуйте .html, .py или .js'}
            </p>
          </div>
        ) : (
          <p className="text-2xs leading-relaxed text-ink-faint">Нет открытого файла. Откройте файл из Explorer.</p>
        )}

        <div className="text-2xs text-ink-dim">
          <p className="mb-1 font-semibold text-ink-soft">Терминал</p>
          <ul className="list-inside list-disc space-y-0.5 text-ink-faint">
            <li>
              <code className="font-mono text-ink-dim">run file.py</code>
            </li>
            <li>
              <code className="font-mono text-ink-dim">python file.py</code>
            </li>
            <li>
              <code className="font-mono text-ink-dim">preview index.html</code>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => toggleTerminal()}
            className="mt-2 flex items-center gap-1.5 text-accent hover:underline"
          >
            <Terminal size={12} />
            {state.terminalVisible ? 'Скрыть терминал' : 'Показать терминал'}
          </button>
        </div>
      </div>
    </div>
  );
}
