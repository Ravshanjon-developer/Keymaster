import type { TaskValidationContext, TaskResult } from '@/features/bolt-simulator/simulator/types/tasks';
import type { SimulatorState } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import type { Task } from '@/features/bolt-simulator/simulator/types/tasks';

export function buildValidationContext(state: SimulatorState): TaskValidationContext {
  return {
    fsNodes: state.nodes,
    rootId: state.rootId,
    openFileIds: state.openTabs.map((t) => t.fileId),
    activeFileId: state.activeTabId,
    panelStates: {
      explorer: state.sidebarVisible && state.activeView === 'explorer',
      search: state.sidebarVisible && state.activeView === 'search',
      taskPanel: state.taskPanelVisible,
      terminal: state.terminalVisible,
    },
    terminalVisible: state.terminalVisible,
    commandPaletteOpen: state.commandPaletteOpen,
    searchOpen: state.sidebarVisible && state.activeView === 'search',
    sidebarVisible: state.sidebarVisible,
    lastAction: state.lastAction,
  };
}

export function checkTaskSteps(task: Task, ctx: TaskValidationContext): { completedSteps: string[]; allComplete: boolean } {
  const completedSteps: string[] = [];
  for (const step of task.steps) {
    try {
      if (step.check(ctx)) {
        completedSteps.push(step.id);
      }
    } catch {
      // ignore check errors
    }
  }
  return {
    completedSteps,
    allComplete: completedSteps.length === task.steps.length,
  };
}

export function createTaskResult(
  task: Task,
  startTime: number,
  mistakes: number,
  shortcutsUsed: string[],
  hintsUsed: number,
): TaskResult {
  const timeMs = Date.now() - startTime;
  const baseAccuracy = 100;
  const accuracy = Math.max(0, baseAccuracy - mistakes * 10 - hintsUsed * 5);
  const xp = Math.round(task.xp * (accuracy / 100));
  return {
    taskId: task.id,
    timeMs,
    accuracy,
    xp,
    mistakes,
    shortcutsUsed,
  };
}
