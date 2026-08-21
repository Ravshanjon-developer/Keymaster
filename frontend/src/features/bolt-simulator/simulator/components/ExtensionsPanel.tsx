import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { LocalProjectImport } from '@/features/bolt-simulator/simulator/components/LocalProjectImport';
import { Keyboard, Moon, Sun, Zap } from 'lucide-react';

export function ExtensionsPanel() {
  const { state, toggleTheme, toggleKeyboard, toggleTaskPanel } = useSimulator();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-edge px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim no-select">
        Extensions &amp; Lab
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        <p className="text-2xs leading-relaxed text-ink-dim">
          Магазин расширений VS Code здесь не подключён. Ниже — настройки и импорт проекта с вашего компьютера.
        </p>

        <div>
          <p className="mb-1.5 text-2xs font-semibold text-ink-soft">Проект с компьютера</p>
          <LocalProjectImport showLabels />
        </div>

        <div className="flex flex-col gap-1">
          <p className="mb-0.5 text-2xs font-semibold text-ink-soft">Интерфейс</p>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-left text-2xs text-ink-soft hover:bg-surface-3"
          >
            {state.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button
            type="button"
            onClick={toggleKeyboard}
            className="flex items-center gap-2 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-left text-2xs text-ink-soft hover:bg-surface-3"
          >
            <Keyboard size={14} />
            {state.keyboardVisible ? 'Скрыть клавиатуру' : 'Показать клавиатуру'}
          </button>
          <button
            type="button"
            onClick={toggleTaskPanel}
            className="flex items-center gap-2 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-left text-2xs text-ink-soft hover:bg-surface-3"
          >
            <Zap size={14} />
            {state.taskPanelVisible ? 'Скрыть Tasks' : 'Показать Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
