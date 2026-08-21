import type { Task } from '@/features/bolt-simulator/simulator/types/tasks';
import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';

function findChildByName(
  nodes: Record<string, FileNode>,
  parentId: string,
  name: string,
  type?: 'file' | 'folder',
): FileNode | undefined {
  const parent = nodes[parentId];
  if (!parent) return undefined;
  return parent.children
    .map((id) => nodes[id])
    .find((n) => n && n.name === name && (!type || n.type === type));
}

function findDescendantByPath(
  nodes: Record<string, FileNode>,
  rootId: string,
  path: string[],
  type?: 'file' | 'folder',
): FileNode | undefined {
  let current = nodes[rootId];
  for (let i = 0; i < path.length; i++) {
    const isLast = i === path.length - 1;
    const child = findChildByName(nodes, current.id, path[i], isLast ? type : 'folder');
    if (!child) return undefined;
    current = child;
  }
  return current;
}

export const TASKS: Task[] = [
  // ===== BEGINNER =====
  {
    id: 'task.create-file',
    title: 'Create a New File',
    description: 'Create a new file anywhere in the project. Use a shortcut or the context menu.',
    difficulty: 'beginner',
    category: 'explorer',
    xp: 15,
    hints: [
      'Try right-clicking in the Explorer to create a file.',
      'The "New File" action can also be triggered from the Command Palette.',
      'Press Ctrl+N to create a new file quickly.',
    ],
    shortcutId: 'new-file',
    mode: 'learn',
    steps: [
      {
        id: 'file-created',
        label: 'A new file exists in the workspace',
        check: (ctx) => Object.values(ctx.fsNodes).some(
          (n) => n.type === 'file' && n.createdAt > 0 && !n.name.startsWith('Untitled'),
        ),
      },
    ],
  },
  {
    id: 'task.create-folder',
    title: 'Create a Folder',
    description: 'Create a new folder named "assets" inside the project root.',
    difficulty: 'beginner',
    category: 'explorer',
    xp: 20,
    hints: [
      'You need to create a folder at the top level of the project.',
      'Right-click the root folder or use the New Folder toolbar button.',
      'The folder must be named exactly "assets".',
    ],
    mode: 'learn',
    steps: [
      {
        id: 'folder-exists',
        label: 'Folder "assets" exists in root',
        check: (ctx) => !!findChildByName(ctx.fsNodes, ctx.rootId, 'assets', 'folder'),
      },
    ],
  },
  {
    id: 'task.rename-file',
    title: 'Rename a File',
    description: 'Rename "index.html" to "index2.html".',
    difficulty: 'beginner',
    category: 'explorer',
    xp: 15,
    hints: [
      'Right-click the file in the Explorer to find the Rename option.',
      'You can also press F2 when a file is selected.',
      'Rename "index.html" to "index2.html".',
    ],
    mode: 'learn',
    steps: [
      {
        id: 'renamed',
        label: 'index.html renamed to index2.html',
        check: (ctx) =>
          !findChildByName(ctx.fsNodes, ctx.rootId, 'index.html', 'file') &&
          !!findChildByName(ctx.fsNodes, ctx.rootId, 'index2.html', 'file'),
      },
    ],
  },
  {
    id: 'task.delete-file',
    title: 'Delete a File',
    description: 'Delete the file "package.json" from the project root.',
    difficulty: 'beginner',
    category: 'explorer',
    xp: 15,
    hints: [
      'Right-click the file and choose Delete.',
      'You can also select it and press the Delete key.',
      'The file "package.json" should no longer exist.',
    ],
    mode: 'learn',
    steps: [
      {
        id: 'deleted',
        label: 'package.json is deleted',
        check: (ctx) => !findChildByName(ctx.fsNodes, ctx.rootId, 'package.json', 'file'),
      },
    ],
  },
  {
    id: 'task.open-file',
    title: 'Open a File',
    description: 'Open the file "main.py" in the editor.',
    difficulty: 'beginner',
    category: 'navigation',
    xp: 10,
    hints: [
      'Click on the file in the Explorer to open it.',
      'You can also use Quick Open (Ctrl+P) to search for it.',
      'Open "main.py" — it should appear as a tab.',
    ],
    shortcutId: 'quick-open',
    mode: 'learn',
    steps: [
      {
        id: 'opened',
        label: 'main.py is open in a tab',
        check: (ctx) => {
          const f = findDescendantByPath(ctx.fsNodes, ctx.rootId, ['src', 'main.py'], 'file');
          return !!f && ctx.openFileIds.includes(f.id);
        },
      },
    ],
  },
  {
    id: 'task.save-file',
    title: 'Save a File',
    description: 'Open any file, modify it, then save it with Ctrl+S.',
    difficulty: 'beginner',
    category: 'files',
    xp: 15,
    hints: [
      'First open a file and type something to make it modified.',
      'Save with Ctrl+S.',
      'The modified indicator (dot) should disappear after saving.',
    ],
    shortcutId: 'save',
    mode: 'learn',
    steps: [
      {
        id: 'saved',
        label: 'A save action was performed',
        check: (ctx) => ctx.lastAction === 'save',
      },
    ],
  },
  {
    id: 'task.toggle-sidebar',
    title: 'Toggle the Sidebar',
    description: 'Hide and show the sidebar using Ctrl+B.',
    difficulty: 'beginner',
    category: 'layout',
    xp: 10,
    hints: [
      'There is a shortcut to toggle the left sidebar.',
      'The shortcut is Ctrl+B.',
      'Press Ctrl+B to toggle the sidebar visibility.',
    ],
    shortcutId: 'toggle-sidebar',
    mode: 'learn',
    steps: [
      {
        id: 'toggled',
        label: 'Sidebar was toggled',
        check: (ctx) => ctx.lastAction === 'toggle-sidebar',
      },
    ],
  },
  {
    id: 'task.toggle-terminal',
    title: 'Open the Terminal',
    description: 'Toggle the terminal panel using Ctrl+`.',
    difficulty: 'beginner',
    category: 'terminal',
    xp: 15,
    hints: [
      'There is a shortcut to toggle the bottom terminal panel.',
      'The shortcut is Ctrl+` (backtick).',
      'Press Ctrl+` to open the terminal.',
    ],
    shortcutId: 'toggle-terminal',
    mode: 'learn',
    steps: [
      {
        id: 'opened',
        label: 'Terminal is visible',
        check: (ctx) => ctx.terminalVisible,
      },
    ],
  },

  // ===== INTERMEDIATE =====
  {
    id: 'task.create-components-folder',
    title: 'Create components Folder in src',
    description: 'Create a folder named "components" inside the "src" folder.',
    difficulty: 'intermediate',
    category: 'explorer',
    xp: 25,
    hints: [
      'You need to create a folder inside src, not at the root.',
      'Expand the src folder first, then create a new folder inside it.',
      'The folder must be named "components" and live inside src.',
    ],
    mode: 'practice',
    steps: [
      {
        id: 'folder-in-src',
        label: 'src/components/ exists',
        check: (ctx) => {
          const src = findChildByName(ctx.fsNodes, ctx.rootId, 'src', 'folder');
          if (!src) return false;
          return !!findChildByName(ctx.fsNodes, src.id, 'components', 'folder');
        },
      },
    ],
  },
  {
    id: 'task.create-button-jsx',
    title: 'Create Button.jsx',
    description: 'Create a file named "Button.jsx" inside the "components" folder.',
    difficulty: 'intermediate',
    category: 'explorer',
    xp: 25,
    hints: [
      'The file must go inside the components folder.',
      'Right-click the components folder and choose New File.',
      'Name the file "Button.jsx" — it must be inside components.',
    ],
    mode: 'practice',
    steps: [
      {
        id: 'file-exists',
        label: 'components/Button.jsx exists',
        check: (ctx) => {
          const comp = findChildByName(ctx.fsNodes, ctx.rootId, 'components', 'folder');
          if (!comp) return false;
          return !!findChildByName(ctx.fsNodes, comp.id, 'Button.jsx', 'file');
        },
      },
    ],
  },
  {
    id: 'task.command-palette',
    title: 'Open Command Palette',
    description: 'Open the Command Palette using Ctrl+Shift+P.',
    difficulty: 'intermediate',
    category: 'command',
    xp: 20,
    hints: [
      'There is a special palette for running commands.',
      'The shortcut involves Ctrl, Shift, and P.',
      'Press Ctrl+Shift+P to open the command palette.',
    ],
    shortcutId: 'command-palette',
    mode: 'practice',
    steps: [
      {
        id: 'opened',
        label: 'Command palette was opened',
        check: (ctx) => ctx.commandPaletteOpen || ctx.lastAction === 'command-palette',
      },
    ],
  },
  {
    id: 'task.global-search',
    title: 'Search Across Files',
    description: 'Open the global search panel using Ctrl+Shift+F.',
    difficulty: 'intermediate',
    category: 'search',
    xp: 20,
    hints: [
      'There is a shortcut for searching across all files.',
      'The shortcut is Ctrl+Shift+F.',
      'Press Ctrl+Shift+F to open global search.',
    ],
    shortcutId: 'global-search',
    mode: 'practice',
    steps: [
      {
        id: 'search-opened',
        label: 'Global search is open',
        check: (ctx) => ctx.searchOpen || ctx.lastAction === 'global-search',
      },
    ],
  },
  {
    id: 'task.find-in-file',
    title: 'Find in File',
    description: 'Open the find bar inside the editor using Ctrl+F.',
    difficulty: 'intermediate',
    category: 'search',
    xp: 20,
    hints: [
      'There is a shortcut for finding text within the current file.',
      'The shortcut is Ctrl+F.',
      'Press Ctrl+F to open the find bar.',
    ],
    shortcutId: 'find',
    mode: 'practice',
    steps: [
      {
        id: 'find-opened',
        label: 'Find bar was opened',
        check: (ctx) => ctx.lastAction === 'find',
      },
    ],
  },
  {
    id: 'task.close-tab',
    title: 'Close a Tab',
    description: 'Open a file, then close its tab using Ctrl+W.',
    difficulty: 'intermediate',
    category: 'navigation',
    xp: 20,
    hints: [
      'First open a file so it appears as a tab.',
      'The shortcut to close the current tab is Ctrl+W.',
      'Press Ctrl+W to close the active tab.',
    ],
    shortcutId: 'close-tab',
    mode: 'practice',
    steps: [
      {
        id: 'closed',
        label: 'A tab was closed',
        check: (ctx) => ctx.lastAction === 'close-tab',
      },
    ],
  },
  {
    id: 'task.reopen-tab',
    title: 'Reopen a Closed Tab',
    description: 'Close a tab, then reopen it with Ctrl+Shift+T.',
    difficulty: 'intermediate',
    category: 'navigation',
    xp: 25,
    hints: [
      'First close a tab, then use the shortcut to reopen it.',
      'The shortcut is Ctrl+Shift+T.',
      'Press Ctrl+Shift+T after closing a tab.',
    ],
    shortcutId: 'reopen-closed-tab',
    mode: 'practice',
    steps: [
      {
        id: 'reopened',
        label: 'A closed tab was reopened',
        check: (ctx) => ctx.lastAction === 'reopen-closed-tab',
      },
    ],
  },
  {
    id: 'task.toggle-comment',
    title: 'Toggle a Line Comment',
    description: 'Open a file, place the cursor on a line, and toggle a comment with Ctrl+/.',
    difficulty: 'intermediate',
    category: 'editor',
    xp: 25,
    hints: [
      'Open a file first and click on a line of code.',
      'The shortcut to comment/uncomment a line is Ctrl+/',
      'Press Ctrl+/ to toggle a line comment.',
    ],
    shortcutId: 'toggle-comment',
    mode: 'practice',
    steps: [
      {
        id: 'commented',
        label: 'A comment was toggled',
        check: (ctx) => ctx.lastAction === 'toggle-comment',
      },
    ],
  },

  // ===== ADVANCED =====
  {
    id: 'task.move-line-down',
    title: 'Move a Line Down',
    description: 'Open a file, place the cursor on a line, and move it down with Alt+ArrowDown.',
    difficulty: 'advanced',
    category: 'editor',
    xp: 30,
    hints: [
      'Open a file and place the cursor on a line.',
      'The shortcut to move a line down is Alt+ArrowDown.',
      'Press Alt+ArrowDown to move the current line down.',
    ],
    shortcutId: 'move-line-down',
    mode: 'challenge',
    steps: [
      {
        id: 'moved',
        label: 'A line was moved',
        check: (ctx) => ctx.lastAction === 'move-line-down',
      },
    ],
  },
  {
    id: 'task.duplicate-line',
    title: 'Duplicate a Line',
    description: 'Duplicate the current line downwards using Shift+Alt+ArrowDown.',
    difficulty: 'advanced',
    category: 'editor',
    xp: 30,
    hints: [
      'Open a file and place the cursor on a line.',
      'The shortcut involves Shift, Alt, and the down arrow.',
      'Press Shift+Alt+ArrowDown to duplicate the line.',
    ],
    shortcutId: 'duplicate-line-down',
    mode: 'challenge',
    steps: [
      {
        id: 'duplicated',
        label: 'A line was duplicated',
        check: (ctx) => ctx.lastAction === 'duplicate-line-down',
      },
    ],
  },
  {
    id: 'task.undo',
    title: 'Undo an Action',
    description: 'Make a change in a file, then undo it with Ctrl+Z.',
    difficulty: 'advanced',
    category: 'editor',
    xp: 25,
    hints: [
      'Type something in a file first.',
      'The shortcut to undo is Ctrl+Z.',
      'Press Ctrl+Z to undo your last change.',
    ],
    shortcutId: 'undo',
    mode: 'challenge',
    steps: [
      {
        id: 'undone',
        label: 'Undo was performed',
        check: (ctx) => ctx.lastAction === 'undo',
      },
    ],
  },
  {
    id: 'task.select-next',
    title: 'Select Next Occurrence',
    description: 'Select a word, then add the next occurrence with Ctrl+D (multi-cursor).',
    difficulty: 'advanced',
    category: 'editor',
    xp: 35,
    hints: [
      'Double-click a word to select it first.',
      'The shortcut to add the next occurrence is Ctrl+D.',
      'Press Ctrl+D to add the next matching selection.',
    ],
    shortcutId: 'select-next',
    mode: 'challenge',
    steps: [
      {
        id: 'selected',
        label: 'Select next was used',
        check: (ctx) => ctx.lastAction === 'select-next',
      },
    ],
  },
  {
    id: 'task.create-structure',
    title: 'Build a Project Structure',
    description: 'Create a folder "styles" in root, then create "main.css" inside it.',
    difficulty: 'advanced',
    category: 'explorer',
    xp: 40,
    hints: [
      'You need to create a folder and a file inside it.',
      'Create "styles" in the project root first.',
      'Then create "main.css" inside the "styles" folder.',
    ],
    mode: 'challenge',
    steps: [
      {
        id: 'styles-folder',
        label: 'styles/ folder exists in root',
        check: (ctx) => !!findChildByName(ctx.fsNodes, ctx.rootId, 'styles', 'folder'),
      },
      {
        id: 'main-css',
        label: 'styles/main.css exists',
        check: (ctx) => {
          const styles = findChildByName(ctx.fsNodes, ctx.rootId, 'styles', 'folder');
          if (!styles) return false;
          return !!findChildByName(ctx.fsNodes, styles.id, 'main.css', 'file');
        },
      },
    ],
  },

  // ===== EXPERT =====
  {
    id: 'task.terminal-mkdir',
    title: 'Create Folder via Terminal',
    description: 'Open the terminal and run: mkdir lib',
    difficulty: 'expert',
    category: 'terminal',
    xp: 40,
    timeLimit: 30,
    hints: [
      'You need to use the terminal, not the Explorer.',
      'The command to create a directory is "mkdir".',
      'Type "mkdir lib" in the terminal and press Enter.',
    ],
    mode: 'challenge',
    steps: [
      {
        id: 'lib-created',
        label: 'lib/ folder exists in root',
        check: (ctx) => !!findChildByName(ctx.fsNodes, ctx.rootId, 'lib', 'folder'),
      },
    ],
  },
  {
    id: 'task.terminal-touch',
    title: 'Create File via Terminal',
    description: 'Open the terminal and run: touch config.json',
    difficulty: 'expert',
    category: 'terminal',
    xp: 40,
    timeLimit: 30,
    hints: [
      'You need to use the terminal.',
      'The command to create an empty file is "touch".',
      'Type "touch config.json" and press Enter.',
    ],
    mode: 'challenge',
    steps: [
      {
        id: 'config-created',
        label: 'config.json exists in root',
        check: (ctx) => !!findChildByName(ctx.fsNodes, ctx.rootId, 'config.json', 'file'),
      },
    ],
  },
];

export const TASK_MAP: Record<string, Task> = Object.fromEntries(
  TASKS.map((t) => [t.id, t]),
);
