import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter';
import { GitBranch, Zap, Keyboard } from 'lucide-react';

export function StatusBar() {
  const { state, activeFile, currentTask, toggleTaskPanel, toggleKeyboard, setActiveView } = useSimulator();

  const lang = activeFile ? getLanguageFromName(activeFile.name) : 'plaintext';
  const langDisplay: Record<string, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    markdown: 'Markdown',
    text: 'Plain Text',
    plaintext: 'Plain Text',
  };

  return (
    <div className="flex h-[22px] shrink-0 items-center gap-0 bg-[#007acc] px-0 text-[12px] leading-none text-white no-select">
      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={() => setActiveView('scm')}
          className="flex h-full items-center gap-1 px-2 transition-colors hover:bg-white/20"
        >
          <GitBranch size={12} />
          <span>main</span>
        </button>
        <button
          type="button"
          onClick={toggleTaskPanel}
          className="flex h-full max-w-[240px] items-center gap-1 truncate px-2 transition-colors hover:bg-white/20"
        >
          <Zap size={12} />
          <span className="truncate">{currentTask ? currentTask.title : 'Tasks'}</span>
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex h-full items-center">
        <span className="flex h-full items-center px-2">
          Ln {state.cursorLine}, Col {state.cursorCol}
        </span>
        <span className="flex h-full items-center px-2">Spaces: 2</span>
        <span className="flex h-full items-center px-2">UTF-8</span>
        <span className="flex h-full items-center px-2">{langDisplay[lang] ?? lang}</span>
        <button
          type="button"
          className={`flex h-full items-center px-2 transition-colors hover:bg-white/20 ${
            state.keyboardVisible ? 'bg-white/25' : ''
          }`}
          onClick={toggleKeyboard}
          title={state.keyboardVisible ? 'Hide keyboard visualizer' : 'Show keyboard visualizer'}
          aria-pressed={state.keyboardVisible}
        >
          <Keyboard size={12} />
        </button>
      </div>
    </div>
  );
}
