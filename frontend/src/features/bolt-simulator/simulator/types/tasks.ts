export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type TaskCategory =
  | 'explorer'
  | 'editor'
  | 'navigation'
  | 'terminal'
  | 'layout'
  | 'search'
  | 'command'
  | 'files';

export interface TaskStep {
  id: string;
  label: string;
  check: (state: TaskValidationContext) => boolean;
}

export interface TaskValidationContext {
  fsNodes: Record<string, import('./filesystem').FileNode>;
  rootId: string;
  openFileIds: string[];
  activeFileId: string | null;
  panelStates: PanelStates;
  terminalVisible: boolean;
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  sidebarVisible: boolean;
  lastAction: string | null;
}

export interface PanelStates {
  explorer: boolean;
  search: boolean;
  taskPanel: boolean;
  terminal: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: TaskCategory;
  xp: number;
  timeLimit?: number;
  hints: string[];
  steps: TaskStep[];
  shortcutId?: string;
  mode: 'learn' | 'practice' | 'challenge';
}

export interface TaskProgress {
  taskId: string;
  completedSteps: string[];
  startedAt: number;
  completedAt?: number;
  hintsUsed: number;
  xpEarned: number;
  mistakes: number;
  shortcutsUsed: string[];
}

export interface TaskResult {
  taskId: string;
  timeMs: number;
  accuracy: number;
  xp: number;
  mistakes: number;
  shortcutsUsed: string[];
}
