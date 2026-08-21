import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';
import type { KeyEvent, KeyCombo, KeyModifier } from '@/features/bolt-simulator/simulator/types/keyboard';
import type { Task, TaskProgress, TaskResult } from '@/features/bolt-simulator/simulator/types/tasks';
import { createInitialFileSystem } from '@/features/bolt-simulator/simulator/data/initialFs';
import { SHORTCUTS, SHORTCUT_MAP, comboKey } from '@/features/bolt-simulator/simulator/data/shortcuts';
import { TASKS, TASK_MAP } from '@/features/bolt-simulator/simulator/data/tasks';
import { getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter';
import { importFilesFromDisk } from '@/features/bolt-simulator/simulator/engine/localFsImport';
import { runFileContent, readFileFromWorkspace } from '@/features/bolt-simulator/simulator/engine/codeRunner';
import { loadCodeLabCompletedIds, saveCodeLabCompletedIds } from '@/shared/lib/simulatorProgress'
import { clearVsCodeOpenFolder, peekVsCodeOpenFolder } from '@/shared/lib/vscodeBridge';

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function storedTaskResults(): TaskResult[] {
  return loadCodeLabCompletedIds().map((taskId) => ({
    taskId,
    timeMs: 0,
    accuracy: 100,
    xp: 0,
    mistakes: 0,
    shortcutsUsed: [],
  }));
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  text: string;
}

export interface EditorTab {
  fileId: string;
  savedContent: string;
  modified: boolean;
}

export interface SimulatorState {
  // File system
  nodes: Record<string, FileNode>;
  rootId: string;
  expandedFolders: Set<string>;
  selectedNodeId: string | null;
  clipboard: { nodeIds: string[]; operation: 'copy' | 'cut' } | null;

  // Editor
  openTabs: EditorTab[];
  activeTabId: string | null;
  closedTabHistory: string[];
  editorContent: string;
  cursorLine: number;
  cursorCol: number;
  findOpen: boolean;
  findQuery: string;

  // Panels
  sidebarVisible: boolean;
  sidebarWidth: number;
  terminalVisible: boolean;
  terminalHeight: number;
  taskPanelVisible: boolean;
  taskPanelWidth: number;
  keyboardVisible: boolean;
  activeView: 'explorer' | 'search' | 'scm' | 'run' | 'extensions' | 'tasks';

  // Overlays
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;

  // Terminal
  terminalLines: TerminalLine[];
  terminalCwd: string;

  // Keyboard
  pressedKeys: Set<string>;
  activeModifiers: Set<KeyModifier>;
  keyHistory: KeyEvent[];
  lastCombo: KeyCombo | null;
  lastAction: string | null;
  comboFlash: { combo: KeyCombo; shortcutId: string | null; timestamp: number } | null;

  // Tasks
  currentTaskId: string | null;
  taskProgress: TaskProgress | null;
  taskResults: TaskResult[];
  totalXp: number;
  showHintLevel: number;
  taskStartTime: number;

  // Notifications
  notifications: Notification[];

  // Theme
  theme: 'light' | 'dark';

  // HTML preview (run)
  previewOpen: boolean;
  previewSrc: string | null;
  previewTitle: string;

  // History for undo/redo
  undoStack: { action: string; data: unknown }[];
  redoStack: { action: string; data: unknown }[];
}

type Action =
  | { type: 'FS_CREATE'; parentId: string; name: string; nodeType: 'file' | 'folder' }
  | { type: 'FS_RENAME'; nodeId: string; name: string }
  | { type: 'FS_DELETE'; nodeId: string }
  | { type: 'FS_MOVE'; nodeId: string; newParentId: string }
  | { type: 'FS_DUPLICATE'; nodeId: string }
  | { type: 'FS_COPY'; nodeIds: string[] }
  | { type: 'FS_CUT'; nodeIds: string[] }
  | { type: 'FS_PASTE'; targetId: string }
  | { type: 'FS_TOGGLE_EXPAND'; nodeId: string }
  | { type: 'FS_SELECT'; nodeId: string | null }
  | { type: 'FS_LOAD'; nodes: Record<string, FileNode>; rootId: string; expandedFolderIds?: string[] }
  | { type: 'EDITOR_OPEN'; fileId: string }
  | { type: 'EDITOR_CLOSE'; fileId: string }
  | { type: 'EDITOR_SET_ACTIVE'; fileId: string }
  | { type: 'EDITOR_WRITE'; content: string }
  | { type: 'EDITOR_SAVE'; fileId?: string }
  | { type: 'EDITOR_REOPEN'; fileId: string }
  | { type: 'EDITOR_SET_CURSOR'; line: number; col: number }
  | { type: 'EDITOR_TOGGLE_FIND'; open?: boolean; query?: string }
  | { type: 'PANEL_TOGGLE_SIDEBAR' }
  | { type: 'PANEL_TOGGLE_TERMINAL' }
  | { type: 'PANEL_TOGGLE_TASKPANEL' }
  | { type: 'PANEL_TOGGLE_KEYBOARD' }
  | { type: 'PANEL_SET_SIDEBAR_WIDTH'; width: number }
  | { type: 'PANEL_SET_TERMINAL_HEIGHT'; height: number }
  | { type: 'PANEL_SET_TASKPANEL_WIDTH'; width: number }
  | { type: 'SET_ACTIVE_VIEW'; view: SimulatorState['activeView'] }
  | { type: 'OPEN_COMMAND_PALETTE'; open: boolean }
  | { type: 'OPEN_QUICK_OPEN'; open: boolean }
  | { type: 'TERMINAL_CLEAR' }
  | { type: 'TERMINAL_ADD'; line: Omit<TerminalLine, 'id'> }
  | { type: 'TERMINAL_SET_CWD'; cwd: string }
  | { type: 'KB_PRESS'; combo: KeyCombo; shortcutId: string | null; actionLabel: string }
  | { type: 'KB_RELEASE'; key: string }
  | { type: 'KB_CLEAR_MODIFIERS' }
  | { type: 'TASK_START'; taskId: string }
  | { type: 'TASK_COMPLETE'; result: TaskResult }
  | { type: 'TASK_FAIL'; result: TaskResult }
  | { type: 'TASK_NEXT' }
  | { type: 'TASK_SKIP' }
  | { type: 'TASK_HINT' }
  | { type: 'NOTIFY'; notification: Omit<Notification, 'id'> }
  | { type: 'NOTIFY_DISMISS'; id: string }
  | { type: 'THEME_TOGGLE' }
  | { type: 'THEME_SET'; theme: 'light' | 'dark' }
  | { type: 'PREVIEW_OPEN'; src: string; title: string }
  | { type: 'PREVIEW_CLOSE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' };

function cloneNode(node: FileNode, newParentId: string, nameOverride?: string): FileNode {
  return {
    ...node,
    id: uid(node.name),
    name: nameOverride ?? node.name,
    parentId: newParentId,
    children: [...node.children],
    createdAt: Date.now(),
  };
}

function deepDuplicate(nodes: Record<string, FileNode>, nodeId: string, newParentId: string): Record<string, FileNode> {
  const original = nodes[nodeId];
  const copy = cloneNode(original, newParentId);
  const result: Record<string, FileNode> = { [copy.id]: copy };

  if (original.type === 'folder') {
    copy.children = [];
    for (const childId of original.children) {
      const childCopies = deepDuplicate(nodes, childId, copy.id);
      Object.assign(result, childCopies);
      const childCopy = Object.values(childCopies).find((n) => n.parentId === copy.id);
      if (childCopy) copy.children.push(childCopy.id);
    }
  }

  return result;
}

function deleteNodeRecursive(nodes: Record<string, FileNode>, nodeId: string): void {
  const node = nodes[nodeId];
  if (!node) return;
  if (node.children) {
    for (const childId of [...node.children]) {
      deleteNodeRecursive(nodes, childId);
    }
  }
  delete nodes[nodeId];
}

function getPath(nodes: Record<string, FileNode>, nodeId: string): string[] {
  const path: string[] = [];
  let current: FileNode | undefined = nodes[nodeId];
  while (current && current.parentId !== null) {
    path.unshift(current.name);
    current = nodes[current.parentId];
  }
  return path;
}

function getNodeByPath(nodes: Record<string, FileNode>, rootId: string, path: string[]): FileNode | undefined {
  let current = nodes[rootId];
  for (const segment of path) {
    const child = current.children
      .map((id) => nodes[id])
      .find((n) => n && n.name === segment);
    if (!child) return undefined;
    current = child;
  }
  return current;
}

function getUniqueName(nodes: Record<string, FileNode>, parentId: string, baseName: string): string {
  const parent = nodes[parentId];
  if (!parent) return baseName;
  const existing = new Set(parent.children.map((id) => nodes[id]?.name));
  if (!existing.has(baseName)) return baseName;

  const dotIdx = baseName.lastIndexOf('.');
  const stem = dotIdx > 0 ? baseName.slice(0, dotIdx) : baseName;
  const ext = dotIdx > 0 ? baseName.slice(dotIdx) : '';

  let i = 1;
  while (existing.has(`${stem} ${i}${ext}`)) i++;
  return `${stem} ${i}${ext}`;
}

function pushUndo(state: SimulatorState, action: string, data: unknown): SimulatorState {
  return {
    ...state,
    undoStack: [...state.undoStack.slice(-49), { action, data }],
    redoStack: [],
  };
}

function reducer(state: SimulatorState, action: Action): SimulatorState {
  switch (action.type) {
    case 'FS_CREATE': {
      const parent = state.nodes[action.parentId];
      if (!parent || parent.type !== 'folder') return state;
      const name = getUniqueName(state.nodes, action.parentId, action.name);
      const newNode: FileNode = {
        id: uid(name),
        name,
        type: action.nodeType,
        parentId: action.parentId,
        children: [],
        content: action.nodeType === 'file' ? '' : undefined,
        language: action.nodeType === 'file' ? getLanguageFromName(name) : undefined,
        createdAt: Date.now(),
      };
      const nodes = {
        ...state.nodes,
        [newNode.id]: newNode,
        [parent.id]: { ...parent, children: [...parent.children, newNode.id] },
      };
      const expanded = new Set(state.expandedFolders);
      expanded.add(parent.id);
      return {
        ...pushUndo(state, 'fs-create', { nodeId: newNode.id }),
        nodes,
        expandedFolders: expanded,
        selectedNodeId: newNode.id,
        lastAction: action.nodeType === 'file' ? 'create-file' : 'create-folder',
      };
    }

    case 'FS_RENAME': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      const nodes = { ...state.nodes, [node.id]: { ...node, name: action.name, language: node.type === 'file' ? getLanguageFromName(action.name) : undefined } };
      return {
        ...pushUndo(state, 'fs-rename', { nodeId: node.id, oldName: node.name }),
        nodes,
        lastAction: 'rename',
      };
    }

    case 'FS_DELETE': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      const nodes = { ...state.nodes };
      const parent = node.parentId ? nodes[node.parentId] : null;
      if (parent) {
        nodes[parent.id] = { ...parent, children: parent.children.filter((id) => id !== node.id) };
      }
      deleteNodeRecursive(nodes, action.nodeId);
      const newOpenTabs = state.openTabs.filter((t) => t.fileId !== action.nodeId);
      const newActiveTabId = state.activeTabId === action.nodeId
        ? (newOpenTabs[0]?.fileId ?? null)
        : state.activeTabId;
      return {
        ...pushUndo(state, 'fs-delete', { node: state.nodes[action.nodeId], parentId: node.parentId }),
        nodes,
        openTabs: newOpenTabs,
        activeTabId: newActiveTabId,
        selectedNodeId: state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
        lastAction: 'delete',
      };
    }

    case 'FS_MOVE': {
      const node = state.nodes[action.nodeId];
      const newParent = state.nodes[action.newParentId];
      if (!node || !newParent || newParent.type !== 'folder') return state;
      if (action.nodeId === action.newParentId) return state;
      // Prevent moving into own descendant
      let check: string | null = action.newParentId;
      while (check) {
        if (check === action.nodeId) return state;
        check = state.nodes[check]?.parentId ?? null;
      }
      const oldParent = node.parentId ? state.nodes[node.parentId] : null;
      const nodes = { ...state.nodes };
      if (oldParent) {
        nodes[oldParent.id] = { ...oldParent, children: oldParent.children.filter((id) => id !== node.id) };
      }
      nodes[node.id] = { ...node, parentId: action.newParentId };
      nodes[newParent.id] = { ...newParent, children: [...newParent.children, node.id] };
      return {
        ...pushUndo(state, 'fs-move', { nodeId: node.id, oldParentId: node.parentId }),
        nodes,
        lastAction: 'move',
      };
    }

    case 'FS_DUPLICATE': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      const parent = node.parentId ? state.nodes[node.parentId] : null;
      if (!parent) return state;
      const newName = getUniqueName(state.nodes, parent.id, node.name);
      const copies = deepDuplicate(state.nodes, action.nodeId, parent.id);
      const copyId = Object.values(copies).find((n) => n.parentId === parent.id)!.id;
      copies[copyId].name = newName;
      const nodes = { ...state.nodes, ...copies };
      nodes[parent.id] = { ...parent, children: [...parent.children, copyId] };
      return {
        ...pushUndo(state, 'fs-duplicate', { copyId }),
        nodes,
        selectedNodeId: copyId,
        lastAction: 'duplicate',
      };
    }

    case 'FS_COPY': {
      return { ...state, clipboard: { nodeIds: action.nodeIds, operation: 'copy' } };
    }

    case 'FS_CUT': {
      return { ...state, clipboard: { nodeIds: action.nodeIds, operation: 'cut' } };
    }

    case 'FS_PASTE': {
      if (!state.clipboard) return state;
      const target = state.nodes[action.targetId];
      if (!target) return state;
      const targetFolder = target.type === 'folder' ? target : state.nodes[target.parentId!];
      if (!targetFolder) return state;
      const nodes = { ...state.nodes };
      for (const nodeId of state.clipboard.nodeIds) {
        const original = nodes[nodeId];
        if (!original) continue;
        if (state.clipboard.operation === 'copy') {
          const copies = deepDuplicate(nodes, nodeId, targetFolder.id);
          const copyId = Object.values(copies).find((n) => n.parentId === targetFolder.id)!.id;
          copies[copyId].name = getUniqueName(nodes, targetFolder.id, original.name);
          Object.assign(nodes, copies);
          nodes[targetFolder.id] = { ...targetFolder, children: [...targetFolder.children, copyId] };
        } else {
          const oldParent = original.parentId ? nodes[original.parentId] : null;
          if (oldParent) {
            nodes[oldParent.id] = { ...oldParent, children: oldParent.children.filter((id) => id !== nodeId) };
          }
          nodes[nodeId] = { ...original, parentId: targetFolder.id };
          nodes[targetFolder.id] = { ...targetFolder, children: [...targetFolder.children, nodeId] };
        }
      }
      return {
        ...pushUndo(state, 'fs-paste', { clipboard: state.clipboard, targetId: action.targetId }),
        nodes,
        clipboard: state.clipboard.operation === 'cut' ? null : state.clipboard,
        lastAction: 'paste',
      };
    }

    case 'FS_TOGGLE_EXPAND': {
      const expanded = new Set(state.expandedFolders);
      if (expanded.has(action.nodeId)) {
        expanded.delete(action.nodeId);
      } else {
        expanded.add(action.nodeId);
      }
      return { ...state, expandedFolders: expanded };
    }

    case 'FS_SELECT':
      return { ...state, selectedNodeId: action.nodeId };

    case 'FS_LOAD': {
      const expanded = action.expandedFolderIds?.length
        ? new Set(action.expandedFolderIds)
        : new Set([action.rootId]);
      return {
        ...state,
        nodes: action.nodes,
        rootId: action.rootId,
        expandedFolders: expanded,
        openTabs: [],
        activeTabId: null,
        closedTabHistory: [],
        editorContent: '',
        selectedNodeId: null,
        clipboard: null,
        terminalCwd: '/',
        previewOpen: false,
        previewSrc: null,
        previewTitle: '',
      };
    }

    case 'EDITOR_OPEN': {
      const file = state.nodes[action.fileId];
      if (!file || file.type !== 'file') return state;
      const existingTab = state.openTabs.find((t) => t.fileId === action.fileId);
      let openTabs: EditorTab[];
      if (existingTab) {
        openTabs = state.openTabs;
      } else {
        openTabs = [...state.openTabs, { fileId: action.fileId, savedContent: file.content ?? '', modified: false }];
      }
      return {
        ...state,
        openTabs,
        activeTabId: action.fileId,
        editorContent: file.content ?? '',
        cursorLine: 1,
        cursorCol: 1,
        lastAction: 'open-file',
      };
    }

    case 'EDITOR_CLOSE': {
      const openTabs = state.openTabs.filter((t) => t.fileId !== action.fileId);
      const closedTabHistory = [action.fileId, ...state.closedTabHistory.filter((id) => id !== action.fileId)].slice(0, 10);
      const newActive = state.activeTabId === action.fileId
        ? (openTabs[openTabs.length - 1]?.fileId ?? null)
        : state.activeTabId;
      const newContent = newActive ? (state.nodes[newActive]?.content ?? '') : '';
      return {
        ...state,
        openTabs,
        activeTabId: newActive,
        closedTabHistory,
        editorContent: newContent,
        lastAction: 'close-tab',
      };
    }

    case 'EDITOR_SET_ACTIVE': {
      const file = state.nodes[action.fileId];
      if (!file) return state;
      const tab = state.openTabs.find((t) => t.fileId === action.fileId);
      return {
        ...state,
        activeTabId: action.fileId,
        editorContent: tab ? (tab.modified ? state.editorContent : (file.content ?? '')) : (file.content ?? ''),
        cursorLine: 1,
        cursorCol: 1,
      };
    }

    case 'EDITOR_WRITE': {
      if (!state.activeTabId) return state;
      const file = state.nodes[state.activeTabId];
      if (!file) return state;
      const nodes = { ...state.nodes, [file.id]: { ...file, content: action.content } };
      const openTabs = state.openTabs.map((t) =>
        t.fileId === state.activeTabId ? { ...t, modified: true } : t,
      );
      return {
        ...pushUndo(state, 'editor-write', { fileId: state.activeTabId, oldContent: file.content }),
        nodes,
        openTabs,
        editorContent: action.content,
      };
    }

    case 'EDITOR_SAVE': {
      const targetId = action.fileId ?? state.activeTabId;
      if (!targetId) return state;
      const file = state.nodes[targetId];
      if (!file) return state;
      const openTabs = state.openTabs.map((t) =>
        t.fileId === targetId ? { ...t, savedContent: file.content ?? '', modified: false } : t,
      );
      return {
        ...state,
        openTabs,
        lastAction: 'save',
      };
    }

    case 'EDITOR_REOPEN': {
      const file = state.nodes[action.fileId];
      if (!file) return state;
      const existingTab = state.openTabs.find((t) => t.fileId === action.fileId);
      const openTabs = existingTab ? state.openTabs : [...state.openTabs, { fileId: action.fileId, savedContent: file.content ?? '', modified: false }];
      const closedTabHistory = state.closedTabHistory.filter((id) => id !== action.fileId);
      return {
        ...state,
        openTabs,
        activeTabId: action.fileId,
        editorContent: file.content ?? '',
        closedTabHistory,
        lastAction: 'reopen-closed-tab',
      };
    }

    case 'EDITOR_SET_CURSOR':
      return { ...state, cursorLine: action.line, cursorCol: action.col };

    case 'EDITOR_TOGGLE_FIND':
      return {
        ...state,
        findOpen: action.open ?? !state.findOpen,
        findQuery: action.query ?? state.findQuery,
        lastAction: action.open === false ? null : 'find',
      };

    case 'PANEL_TOGGLE_SIDEBAR':
      return { ...state, sidebarVisible: !state.sidebarVisible, lastAction: 'toggle-sidebar' };

    case 'PANEL_TOGGLE_TERMINAL':
      return { ...state, terminalVisible: !state.terminalVisible, lastAction: 'toggle-terminal' };

    case 'PANEL_TOGGLE_TASKPANEL':
      return { ...state, taskPanelVisible: !state.taskPanelVisible };

    case 'PANEL_TOGGLE_KEYBOARD':
      return { ...state, keyboardVisible: !state.keyboardVisible };

    case 'PANEL_SET_SIDEBAR_WIDTH':
      return { ...state, sidebarWidth: Math.max(160, Math.min(500, action.width)) };

    case 'PANEL_SET_TERMINAL_HEIGHT':
      return { ...state, terminalHeight: Math.max(80, Math.min(500, action.height)) };

    case 'PANEL_SET_TASKPANEL_WIDTH':
      return { ...state, taskPanelWidth: Math.max(200, Math.min(500, action.width)) };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view, sidebarVisible: true };

    case 'OPEN_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: action.open, lastAction: action.open ? 'command-palette' : state.lastAction };

    case 'OPEN_QUICK_OPEN':
      return { ...state, quickOpenOpen: action.open, lastAction: action.open ? 'quick-open' : state.lastAction };

    case 'TERMINAL_CLEAR':
      return { ...state, terminalLines: [] };

    case 'TERMINAL_ADD':
      return { ...state, terminalLines: [...state.terminalLines, { ...action.line, id: uid('term') }].slice(-200) };

    case 'TERMINAL_SET_CWD':
      return { ...state, terminalCwd: action.cwd };

    case 'KB_PRESS': {
      const keyEvent: KeyEvent = {
        combo: action.combo,
        shortcutId: action.shortcutId,
        timestamp: Date.now(),
        actionLabel: action.actionLabel,
      };
      return {
        ...state,
        keyHistory: [...state.keyHistory.slice(-99), keyEvent],
        lastCombo: action.combo,
        lastAction: action.shortcutId ?? state.lastAction,
        comboFlash: { combo: action.combo, shortcutId: action.shortcutId, timestamp: Date.now() },
      };
    }

    case 'KB_RELEASE': {
      const pressed = new Set(state.pressedKeys);
      pressed.delete(action.key);
      return { ...state, pressedKeys: pressed };
    }

    case 'KB_CLEAR_MODIFIERS':
      return { ...state, activeModifiers: new Set() };

    case 'TASK_START': {
      const task = TASK_MAP[action.taskId];
      if (!task) return state;
      return {
        ...state,
        currentTaskId: action.taskId,
        taskProgress: {
          taskId: action.taskId,
          completedSteps: [],
          startedAt: Date.now(),
          hintsUsed: 0,
          xpEarned: 0,
          mistakes: 0,
          shortcutsUsed: [],
        },
        showHintLevel: 0,
        taskStartTime: Date.now(),
        taskPanelVisible: true,
      };
    }

    case 'TASK_COMPLETE': {
      const taskResults = [...state.taskResults.filter((r) => r.taskId !== action.result.taskId), action.result];
      saveCodeLabCompletedIds(taskResults.map((r) => r.taskId));
      return {
        ...state,
        taskProgress: { ...state.taskProgress!, completedAt: Date.now(), xpEarned: action.result.xp },
        taskResults,
        totalXp: state.totalXp + action.result.xp,
      };
    }

    case 'TASK_FAIL': {
      return {
        ...state,
        taskProgress: { ...state.taskProgress!, mistakes: state.taskProgress!.mistakes + 1 },
        taskResults: [...state.taskResults, action.result],
      };
    }

    case 'TASK_NEXT': {
      const currentIdx = TASKS.findIndex((t) => t.id === state.currentTaskId);
      const nextTask = TASKS[currentIdx + 1] ?? TASKS[0];
      return {
        ...state,
        currentTaskId: nextTask.id,
        taskProgress: {
          taskId: nextTask.id,
          completedSteps: [],
          startedAt: Date.now(),
          hintsUsed: 0,
          xpEarned: 0,
          mistakes: 0,
          shortcutsUsed: [],
        },
        showHintLevel: 0,
        taskStartTime: Date.now(),
      };
    }

    case 'TASK_SKIP': {
      const currentIdx = TASKS.findIndex((t) => t.id === state.currentTaskId);
      const nextTask = TASKS[currentIdx + 1] ?? TASKS[0];
      return {
        ...state,
        currentTaskId: nextTask.id,
        taskProgress: {
          taskId: nextTask.id,
          completedSteps: [],
          startedAt: Date.now(),
          hintsUsed: 0,
          xpEarned: 0,
          mistakes: 0,
          shortcutsUsed: [],
        },
        showHintLevel: 0,
        taskStartTime: Date.now(),
      };
    }

    case 'TASK_HINT':
      return { ...state, showHintLevel: state.showHintLevel + 1, taskProgress: { ...state.taskProgress!, hintsUsed: state.taskProgress!.hintsUsed + 1 } };

    case 'NOTIFY': {
      const id = uid('notif');
      return { ...state, notifications: [...state.notifications, { ...action.notification, id }].slice(-5) };
    }

    case 'NOTIFY_DISMISS':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };

    case 'THEME_TOGGLE':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'THEME_SET':
      return { ...state, theme: action.theme };

    case 'PREVIEW_OPEN':
      return {
        ...state,
        previewOpen: true,
        previewSrc: action.src,
        previewTitle: action.title,
      };

    case 'PREVIEW_CLOSE':
      return {
        ...state,
        previewOpen: false,
        previewSrc: null,
        previewTitle: '',
      };

    case 'UNDO': {
      const entry = state.undoStack[state.undoStack.length - 1];
      if (!entry) return state;
      // Simplified undo — just restores lastAction flag; full undo would need data replay
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, entry],
        lastAction: 'undo',
      };
    }

    case 'REDO':
      return { ...state, lastAction: 'redo' };

    case 'RESET': {
      const { nodes, rootId } = createInitialFileSystem();
      return {
        ...state,
        nodes,
        rootId,
        openTabs: [],
        activeTabId: null,
        closedTabHistory: [],
        expandedFolders: new Set([rootId]),
        selectedNodeId: null,
        clipboard: null,
        terminalLines: [],
        undoStack: [],
        redoStack: [],
      };
    }

    default:
      return state;
  }
}

function createInitialState(): SimulatorState {
  const { nodes, rootId } = createInitialFileSystem();
  const taskResults = storedTaskResults();
  return {
    nodes,
    rootId,
    expandedFolders: new Set([rootId]),
    selectedNodeId: null,
    clipboard: null,
    openTabs: [],
    activeTabId: null,
    closedTabHistory: [],
    editorContent: '',
    cursorLine: 1,
    cursorCol: 1,
    findOpen: false,
    findQuery: '',
    sidebarVisible: true,
    sidebarWidth: 260,
    terminalVisible: false,
    terminalHeight: 220,
    taskPanelVisible: true,
    taskPanelWidth: 300,
    keyboardVisible: false,
    activeView: 'explorer',
    commandPaletteOpen: false,
    quickOpenOpen: false,
    terminalLines: [],
    terminalCwd: '/',
    pressedKeys: new Set(),
    activeModifiers: new Set(),
    keyHistory: [],
    lastCombo: null,
    lastAction: null,
    comboFlash: null,
    currentTaskId: null,
    taskProgress: null,
    taskResults,
    totalXp: taskResults.reduce((sum, row) => sum + row.xp, 0),
    showHintLevel: 0,
    taskStartTime: 0,
    notifications: [],
    theme: 'dark',
    previewOpen: false,
    previewSrc: null,
    previewTitle: '',
    undoStack: [],
    redoStack: [],
  };
}

interface SimulatorContextValue {
  state: SimulatorState;
  dispatch: React.Dispatch<Action>;
  // Convenience actions
  createNode: (parentId: string, name: string, nodeType: 'file' | 'folder') => void;
  renameNode: (nodeId: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string) => void;
  duplicateNode: (nodeId: string) => void;
  copyNodes: (nodeIds: string[]) => void;
  cutNodes: (nodeIds: string[]) => void;
  pasteNodes: (targetId: string) => void;
  toggleExpand: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  writeEditor: (content: string) => void;
  saveFile: (fileId?: string) => void;
  reopenTab: (fileId: string) => void;
  setCursor: (line: number, col: number) => void;
  toggleFind: (open?: boolean, query?: string) => void;
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  toggleTaskPanel: () => void;
  toggleKeyboard: () => void;
  setSidebarWidth: (w: number) => void;
  setTerminalHeight: (h: number) => void;
  setTaskPanelWidth: (w: number) => void;
  setActiveView: (v: SimulatorState['activeView']) => void;
  openCommandPalette: (open: boolean) => void;
  openQuickOpen: (open: boolean) => void;
  clearTerminal: () => void;
  addTerminalLine: (line: Omit<TerminalLine, 'id'>) => void;
  setTerminalCwd: (cwd: string) => void;
  recordKey: (combo: KeyCombo, shortcutId: string | null, actionLabel: string) => void;
  startTask: (taskId: string) => void;
  completeTask: (result: TaskResult) => void;
  failTask: (result: TaskResult) => void;
  nextTask: () => void;
  skipTask: () => void;
  showHint: () => void;
  notify: (n: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  reset: () => void;
  importLocalFiles: (files: FileList | File[]) => Promise<{ fileCount: number; skippedBinary: number }>;
  runActiveFile: () => Promise<void>;
  runWorkspaceFile: (path: string) => Promise<void>;
  openPreview: (src: string, title: string) => void;
  closePreview: () => void;
  // Computed
  currentTask: Task | null;
  activeFile: FileNode | null;
  isMobile: boolean;
  totalXp: number;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider');
  return ctx;
}

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const previewBlobRef = useRef<string | null>(null);
  const importedFolderRef = useRef(false);

  // Theme is scoped on .bolt-simulator-root in BoltCodeLab (do not touch documentElement).

  // Folder opened from the desktop simulator (“Open with VS Code” / drag onto icon)
  useEffect(() => {
    if (importedFolderRef.current) return;
    const payload = peekVsCodeOpenFolder();
    if (!payload) return;
    importedFolderRef.current = true;
    dispatch({
      type: 'FS_LOAD',
      nodes: payload.nodes,
      rootId: payload.rootId,
      expandedFolderIds: payload.expandedFolderIds,
    });
    dispatch({
      type: 'NOTIFY',
      notification: {
        type: 'success',
        message: `Opened folder: ${payload.folderName}`,
      },
    });
    // Delay clear so React Strict Mode remount can still peek the same payload.
    const t = window.setTimeout(() => clearVsCodeOpenFolder(), 800);
    return () => window.clearTimeout(t);
  }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (state.notifications.length === 0) return;
    const timers = state.notifications.map((n) =>
      setTimeout(() => dispatch({ type: 'NOTIFY_DISMISS', id: n.id }), n.type === 'error' ? 6000 : 3500),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.notifications]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const value: SimulatorContextValue = {
    state,
    dispatch,
    createNode: (parentId, name, nodeType) => dispatch({ type: 'FS_CREATE', parentId, name, nodeType }),
    renameNode: (nodeId, name) => dispatch({ type: 'FS_RENAME', nodeId, name }),
    deleteNode: (nodeId) => dispatch({ type: 'FS_DELETE', nodeId }),
    moveNode: (nodeId, newParentId) => dispatch({ type: 'FS_MOVE', nodeId, newParentId }),
    duplicateNode: (nodeId) => dispatch({ type: 'FS_DUPLICATE', nodeId }),
    copyNodes: (nodeIds) => dispatch({ type: 'FS_COPY', nodeIds }),
    cutNodes: (nodeIds) => dispatch({ type: 'FS_CUT', nodeIds }),
    pasteNodes: (targetId) => dispatch({ type: 'FS_PASTE', targetId }),
    toggleExpand: (nodeId) => dispatch({ type: 'FS_TOGGLE_EXPAND', nodeId }),
    selectNode: (nodeId) => dispatch({ type: 'FS_SELECT', nodeId }),
    openFile: (fileId) => dispatch({ type: 'EDITOR_OPEN', fileId }),
    closeFile: (fileId) => dispatch({ type: 'EDITOR_CLOSE', fileId }),
    setActiveFile: (fileId) => dispatch({ type: 'EDITOR_SET_ACTIVE', fileId }),
    writeEditor: (content) => dispatch({ type: 'EDITOR_WRITE', content }),
    saveFile: (fileId) => dispatch({ type: 'EDITOR_SAVE', fileId }),
    reopenTab: (fileId) => dispatch({ type: 'EDITOR_REOPEN', fileId }),
    setCursor: (line, col) => dispatch({ type: 'EDITOR_SET_CURSOR', line, col }),
    toggleFind: (open, query) => dispatch({ type: 'EDITOR_TOGGLE_FIND', open, query }),
    toggleSidebar: () => dispatch({ type: 'PANEL_TOGGLE_SIDEBAR' }),
    toggleTerminal: () => dispatch({ type: 'PANEL_TOGGLE_TERMINAL' }),
    toggleTaskPanel: () => dispatch({ type: 'PANEL_TOGGLE_TASKPANEL' }),
    toggleKeyboard: () => dispatch({ type: 'PANEL_TOGGLE_KEYBOARD' }),
    setSidebarWidth: (w) => dispatch({ type: 'PANEL_SET_SIDEBAR_WIDTH', width: w }),
    setTerminalHeight: (h) => dispatch({ type: 'PANEL_SET_TERMINAL_HEIGHT', height: h }),
    setTaskPanelWidth: (w) => dispatch({ type: 'PANEL_SET_TASKPANEL_WIDTH', width: w }),
    setActiveView: (v) => dispatch({ type: 'SET_ACTIVE_VIEW', view: v }),
    openCommandPalette: (open) => dispatch({ type: 'OPEN_COMMAND_PALETTE', open }),
    openQuickOpen: (open) => dispatch({ type: 'OPEN_QUICK_OPEN', open }),
    clearTerminal: () => dispatch({ type: 'TERMINAL_CLEAR' }),
    addTerminalLine: (line) => dispatch({ type: 'TERMINAL_ADD', line }),
    setTerminalCwd: (cwd) => dispatch({ type: 'TERMINAL_SET_CWD', cwd }),
    recordKey: (combo, shortcutId, actionLabel) => dispatch({ type: 'KB_PRESS', combo, shortcutId, actionLabel }),
    startTask: (taskId) => dispatch({ type: 'TASK_START', taskId }),
    completeTask: (result) => dispatch({ type: 'TASK_COMPLETE', result }),
    failTask: (result) => dispatch({ type: 'TASK_FAIL', result }),
    nextTask: () => dispatch({ type: 'TASK_NEXT' }),
    skipTask: () => dispatch({ type: 'TASK_SKIP' }),
    showHint: () => dispatch({ type: 'TASK_HINT' }),
    notify: (n) => dispatch({ type: 'NOTIFY', notification: n }),
    dismissNotification: (id) => dispatch({ type: 'NOTIFY_DISMISS', id }),
    toggleTheme: () => dispatch({ type: 'THEME_TOGGLE' }),
    setTheme: (t) => dispatch({ type: 'THEME_SET', theme: t }),
    reset: () => dispatch({ type: 'RESET' }),
    importLocalFiles: async (fileList) => {
      const arr = Array.from(fileList as FileList);
      const result = await importFilesFromDisk(arr);
      dispatch({
        type: 'FS_LOAD',
        nodes: result.nodes,
        rootId: result.rootId,
        expandedFolderIds: result.folderIds,
      });
      return { fileCount: result.fileCount, skippedBinary: result.skippedBinary };
    },
    openPreview: (src, title) => {
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
      previewBlobRef.current = src;
      dispatch({ type: 'PREVIEW_OPEN', src, title });
    },
    closePreview: () => {
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
      previewBlobRef.current = null;
      dispatch({ type: 'PREVIEW_CLOSE' });
    },
    runActiveFile: async () => {
      const s = stateRef.current;
      const fileId = s.activeTabId;
      if (!fileId) {
        dispatch({
          type: 'NOTIFY',
          notification: { type: 'warning', message: 'Open a file to run' },
        });
        return;
      }
      const file = s.nodes[fileId];
      if (!file || file.type !== 'file') return;
      const content = s.editorContent;
      const result = await runFileContent(file.name, content);
      if (result.kind === 'html-preview' && result.previewUrl) {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = result.previewUrl;
        dispatch({ type: 'PREVIEW_OPEN', src: result.previewUrl, title: file.name });
        dispatch({
          type: 'NOTIFY',
          notification: { type: 'info', message: 'HTML preview opened', detail: file.name },
        });
        return;
      }
      if (result.lines) {
        if (!stateRef.current.terminalVisible) dispatch({ type: 'PANEL_TOGGLE_TERMINAL' });
        for (const line of result.lines) {
          dispatch({ type: 'TERMINAL_ADD', line: { text: line, type: 'output' } });
        }
      }
      if (result.kind === 'unsupported') {
        dispatch({
          type: 'NOTIFY',
          notification: {
            type: 'warning',
            message: 'Cannot run this file type',
            detail: 'Try .html, .py, .js — or use python file.py in terminal',
          },
        });
      }
    },
    runWorkspaceFile: async (path) => {
      const s = stateRef.current;
      const file = readFileFromWorkspace(s.nodes, s.rootId, s.terminalCwd, path);
      if (!file) {
        dispatch({ type: 'TERMINAL_ADD', line: { text: `run: ${path}: not found`, type: 'error' } });
        return;
      }
      const content = file.content ?? '';
      dispatch({ type: 'TERMINAL_ADD', line: { text: `Running ${file.name}…`, type: 'output' } });
      const result = await runFileContent(file.name, content);
      if (result.kind === 'html-preview' && result.previewUrl) {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = result.previewUrl;
        dispatch({ type: 'PREVIEW_OPEN', src: result.previewUrl, title: file.name });
        return;
      }
      if (result.lines) {
        for (const line of result.lines) {
          dispatch({ type: 'TERMINAL_ADD', line: { text: line, type: 'output' } });
        }
      }
    },
    currentTask: state.currentTaskId ? TASK_MAP[state.currentTaskId] ?? null : null,
    activeFile: state.activeTabId ? state.nodes[state.activeTabId] ?? null : null,
    isMobile,
    totalXp: state.totalXp,
  };

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
}

// Re-export helpers for convenience
export { SHORTCUTS, SHORTCUT_MAP, comboKey, TASKS, TASK_MAP, getLanguageFromName, getPath, getNodeByPath, uid };
export type { FileNode };
