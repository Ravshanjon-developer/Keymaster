import { useEffect, useMemo, useState } from 'react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { TASKS, TASK_MAP } from '@/features/bolt-simulator/simulator/data/tasks';
import { SHORTCUT_MAP, comboKey } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { buildValidationContext, checkTaskSteps, createTaskResult } from '@/features/bolt-simulator/simulator/engine/taskEngine';
import {
  getTaskCopy,
  localizeCategory,
  localizeDifficulty,
} from '@/features/bolt-simulator/simulator/i18n/taskTranslations';
import { useT } from '@/shared/i18n';
import { useLocaleStore } from '@/shared/i18n/localeStore';
import {
  Zap, Lightbulb, CheckCircle2, Circle, Clock, X, SkipForward,
  Trophy, TrendingUp, Target, ChevronRight, Star,
} from 'lucide-react';
import type { Difficulty, Task } from '@/features/bolt-simulator/simulator/types/tasks';

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'text-success bg-success/15',
  intermediate: 'text-warning bg-warning/15',
  advanced: 'text-danger bg-danger/15',
  expert: 'text-purple-400 bg-purple-400/15',
};

const difficultyDots: Record<Difficulty, string> = {
  beginner: 'bg-success',
  intermediate: 'bg-warning',
  advanced: 'bg-danger',
  expert: 'bg-purple-400',
};

export function TaskPanel() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const { state, startTask, completeTask, nextTask, skipTask, showHint, toggleTaskPanel, notify, totalXp } = useSimulator();
  void state.totalXp;
  const [view, setView] = useState<'current' | 'list'>('current');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ xp: number; time: string; accuracy: number; mistakes: number } | null>(null);

  const rawTask = state.currentTaskId ? TASK_MAP[state.currentTaskId] : null;
  const currentTask = useMemo(
    () => (rawTask ? getTaskCopy(rawTask, locale) : null),
    [rawTask, locale],
  );

  // Check task completion (validation uses canonical task data)
  const taskCheck = useMemo(() => {
    if (!rawTask) return null;
    const ctx = buildValidationContext(state);
    return checkTaskSteps(rawTask, ctx);
  }, [rawTask, state.nodes, state.openTabs, state.activeTabId, state.lastAction, state.terminalVisible, state.commandPaletteOpen, state.sidebarVisible, state.activeView]);

  // Auto-complete when all steps pass
  useEffect(() => {
    if (taskCheck?.allComplete && rawTask && currentTask && state.taskProgress && !state.taskProgress.completedAt) {
      const result = createTaskResult(
        rawTask,
        state.taskStartTime,
        state.taskProgress.mistakes,
        state.taskProgress.shortcutsUsed,
        state.taskProgress.hintsUsed,
      );
      completeTask(result);
      setShowResult(true);
      setLastResult({
        xp: result.xp,
        time: `${(result.timeMs / 1000).toFixed(1)}s`,
        accuracy: result.accuracy,
        mistakes: result.mistakes,
      });
      notify({
        type: 'success',
        message: t('codeLabTasks.notifyCompleted', { title: currentTask.title }),
        detail: `+${result.xp} XP`,
      });
    }
  }, [taskCheck?.allComplete, rawTask, currentTask, state.taskProgress, state.taskStartTime, completeTask, notify, t]);

  const completedSteps = taskCheck?.completedSteps ?? [];
  const progress = rawTask ? (completedSteps.length / rawTask.steps.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-surface-1">
      <div className="flex h-[35px] items-center justify-between px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim no-select shrink-0">
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          <Zap size={13} className="text-accent" />
          <span>{t('codeLabTasks.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 rounded">
            <Trophy size={11} className="text-accent" />
            <span className="text-2xs font-mono text-accent font-semibold">{totalXp} XP</span>
          </div>
          <button onClick={toggleTaskPanel} className="p-1 hover:bg-surface-2 rounded transition-colors">
            <X size={14} className="text-ink-dim" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-edge no-select">
        <button
          onClick={() => setView('current')}
          className={`flex-1 px-3 py-1.5 text-2xs font-medium transition-colors ${
            view === 'current' ? 'text-accent border-b-2 border-accent' : 'text-ink-dim hover:text-ink-soft'
          }`}
        >
          {t('codeLabTasks.currentTask')}
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex-1 px-3 py-1.5 text-2xs font-medium transition-colors ${
            view === 'list' ? 'text-accent border-b-2 border-accent' : 'text-ink-dim hover:text-ink-soft'
          }`}
        >
          {t('codeLabTasks.allTasks')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'current' && (
          currentTask ? (
            <CurrentTaskView
              task={currentTask}
              locale={locale}
              completedSteps={completedSteps}
              progress={progress}
              hintLevel={state.showHintLevel}
              onHint={showHint}
              onSkip={skipTask}
              showResult={showResult}
              lastResult={lastResult}
              onCloseResult={() => { setShowResult(false); nextTask(); }}
            />
          ) : (
            <NoTaskView onSelect={(id) => { startTask(id); setView('current'); }} />
          )
        )}

        {view === 'list' && (
          <TaskListView
            locale={locale}
            onSelect={(id) => { startTask(id); setView('current'); }}
            currentTaskId={state.currentTaskId}
            completedTaskIds={state.taskResults.map((r) => r.taskId)}
          />
        )}
      </div>
    </div>
  );
}

function CurrentTaskView({ task, locale, completedSteps, progress, hintLevel, onHint, onSkip, showResult, lastResult, onCloseResult }: {
  task: Task;
  locale: import('@/shared/i18n/types').Locale;
  completedSteps: string[];
  progress: number;
  hintLevel: number;
  onHint: () => void;
  onSkip: () => void;
  showResult: boolean;
  lastResult: { xp: number; time: string; accuracy: number; mistakes: number } | null;
  onCloseResult: () => void;
}) {
  const t = useT();
  const diffLabel = localizeDifficulty(task.difficulty, locale);
  const catLabel = localizeCategory(task.category, locale);

  return (
    <div className="p-3 flex flex-col gap-3">
      {showResult && lastResult && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 animate-scale-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-sm font-semibold text-success">{t('codeLabTasks.taskCompleted')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-2xs">
            <div className="flex items-center gap-1.5 text-ink-dim">
              <Clock size={12} /> {t('codeLabTasks.time')}: <span className="text-ink font-mono">{lastResult.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-dim">
              <Target size={12} /> {t('codeLabTasks.accuracy')}: <span className="text-ink font-mono">{lastResult.accuracy}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-dim">
              <TrendingUp size={12} /> {t('codeLabTasks.mistakes')}: <span className="text-ink font-mono">{lastResult.mistakes}</span>
            </div>
            <div className="flex items-center gap-1.5 text-accent font-semibold">
              <Star size={12} /> +{lastResult.xp} XP
            </div>
          </div>
          <button
            onClick={onCloseResult}
            className="w-full mt-3 py-1.5 text-sm bg-accent text-surface-0 rounded font-medium hover:bg-accent/90 transition-colors"
          >
            {t('codeLabTasks.nextTask')}
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-2xs font-semibold px-2 py-0.5 rounded uppercase ${difficultyColors[task.difficulty]}`}>
            {diffLabel}
          </span>
          <span className="text-2xs text-ink-faint">{catLabel}</span>
          {task.timeLimit && (
            <span className="text-2xs text-ink-faint flex items-center gap-0.5">
              <Clock size={10} /> {task.timeLimit}s
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-ink mb-1">{task.title}</h3>
        <p className="text-2xs text-ink-dim leading-relaxed">{task.description}</p>
      </div>

      <div>
        <div className="flex items-center justify-between text-2xs text-ink-dim mb-1">
          <span>{t('codeLabTasks.progress')}</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">{t('codeLabTasks.steps')}</span>
        {task.steps.map((step) => {
          const done = completedSteps.includes(step.id);
          return (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 size={15} className="text-success shrink-0" />
              ) : (
                <Circle size={15} className="text-ink-faint shrink-0" />
              )}
              <span className={done ? 'text-ink-dim line-through' : 'text-ink-soft'}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {task.shortcutId && SHORTCUT_MAP[task.shortcutId] && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 rounded text-2xs">
          <span className="text-ink-dim">{t('codeLabTasks.shortcut')}:</span>
          <kbd className="font-mono text-2xs px-1.5 py-0.5 bg-surface-0 border border-edge rounded text-ink">
            {comboKey(SHORTCUT_MAP[task.shortcutId].combo)}
          </kbd>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <button
          onClick={onHint}
          disabled={hintLevel >= task.hints.length}
          className="flex items-center gap-2 px-2 py-1.5 text-2xs text-warning bg-warning/10 hover:bg-warning/15 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Lightbulb size={13} />
          {hintLevel >= task.hints.length
            ? t('codeLabTasks.noMoreHints')
            : t('codeLabTasks.showHint', { current: hintLevel, total: task.hints.length })}
        </button>
        {hintLevel > 0 && (
          <div className="flex flex-col gap-1 pl-2">
            {task.hints.slice(0, hintLevel).map((hint, i) => (
              <div key={i} className="text-2xs text-ink-dim leading-relaxed bg-surface-1 px-2 py-1.5 rounded border border-edge">
                <span className="text-warning font-semibold">{t('codeLabTasks.hintN', { n: i + 1 })}:</span> {hint}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onSkip}
        className="flex items-center justify-center gap-1.5 py-1.5 text-2xs text-ink-dim hover:text-ink-soft border border-edge rounded transition-colors"
      >
        <SkipForward size={12} />
        {t('codeLabTasks.skipTask')}
      </button>
    </div>
  );
}

function NoTaskView({ onSelect }: { onSelect: (id: string) => void }) {
  const t = useT();
  const firstTask = TASKS[0];
  return (
    <div className="p-4 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
        <Zap size={28} className="text-accent" />
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">{t('codeLabTasks.readyTitle')}</h3>
      <p className="text-2xs text-ink-dim mb-4 leading-relaxed">
        {t('codeLabTasks.readyDesc')}
      </p>
      <button
        onClick={() => onSelect(firstTask.id)}
        className="px-4 py-2 text-sm bg-accent text-surface-0 rounded-lg font-medium hover:bg-accent/90 transition-colors"
      >
        {t('codeLabTasks.startFirst')}
      </button>
    </div>
  );
}

function TaskListView({ locale, onSelect, currentTaskId, completedTaskIds }: {
  locale: import('@/shared/i18n/types').Locale;
  onSelect: (id: string) => void;
  currentTaskId: string | null;
  completedTaskIds: string[];
}) {
  const localizedTasks = useMemo(
    () => TASKS.map((task) => getTaskCopy(task, locale)),
    [locale],
  );

  return (
    <div className="py-1">
      {localizedTasks.map((task) => {
        const isCompleted = completedTaskIds.includes(task.id);
        const isCurrent = currentTaskId === task.id;
        return (
          <button
            key={task.id}
            onClick={() => onSelect(task.id)}
            className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors ${
              isCurrent ? 'bg-accent/10' : 'hover:bg-surface-2'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${difficultyDots[task.difficulty]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-ink-soft truncate">{task.title}</span>
                {isCompleted && <CheckCircle2 size={12} className="text-success shrink-0" />}
              </div>
              <span className="text-2xs text-ink-faint">
                +{task.xp} XP · {localizeDifficulty(task.difficulty, locale)}
              </span>
            </div>
            <ChevronRight size={14} className="text-ink-faint shrink-0 mt-1" />
          </button>
        );
      })}
    </div>
  );
}
