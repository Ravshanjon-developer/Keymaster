export interface CommandDef {
  id: string;
  label: string;
  shortcutId?: string;
  category: string;
}

export const COMMANDS: CommandDef[] = [
  // File
  { id: 'cmd.new-file', label: 'File: New File', shortcutId: 'new-file', category: 'File' },
  { id: 'cmd.new-folder', label: 'File: New Folder', category: 'File' },
  { id: 'cmd.save', label: 'File: Save', shortcutId: 'save', category: 'File' },
  { id: 'cmd.save-all', label: 'File: Save All', shortcutId: 'save-all', category: 'File' },
  { id: 'cmd.open-file', label: 'File: Open File', shortcutId: 'open-file', category: 'File' },
  { id: 'cmd.rename', label: 'File: Rename', category: 'File' },
  { id: 'cmd.delete', label: 'File: Delete', category: 'File' },
  { id: 'cmd.duplicate', label: 'File: Duplicate', category: 'File' },
  { id: 'cmd.copy-path', label: 'File: Copy Path', category: 'File' },

  // Edit
  { id: 'cmd.undo', label: 'Edit: Undo', shortcutId: 'undo', category: 'Edit' },
  { id: 'cmd.redo', label: 'Edit: Redo', shortcutId: 'redo', category: 'Edit' },
  { id: 'cmd.find', label: 'Edit: Find', shortcutId: 'find', category: 'Edit' },
  { id: 'cmd.replace', label: 'Edit: Replace', shortcutId: 'replace', category: 'Edit' },
  { id: 'cmd.toggle-comment', label: 'Edit: Toggle Line Comment', shortcutId: 'toggle-comment', category: 'Edit' },
  { id: 'cmd.move-line-up', label: 'Edit: Move Line Up', shortcutId: 'move-line-up', category: 'Edit' },
  { id: 'cmd.move-line-down', label: 'Edit: Move Line Down', shortcutId: 'move-line-down', category: 'Edit' },
  { id: 'cmd.duplicate-line-down', label: 'Edit: Duplicate Line Down', shortcutId: 'duplicate-line-down', category: 'Edit' },

  // View
  { id: 'cmd.toggle-sidebar', label: 'View: Toggle Sidebar', shortcutId: 'toggle-sidebar', category: 'View' },
  { id: 'cmd.toggle-terminal', label: 'View: Toggle Terminal', shortcutId: 'toggle-terminal', category: 'View' },
  { id: 'cmd.toggle-panel', label: 'View: Toggle Panel', shortcutId: 'toggle-panel', category: 'View' },
  { id: 'cmd.show-explorer', label: 'View: Show Explorer', shortcutId: 'show-explorer', category: 'View' },
  { id: 'cmd.global-search', label: 'View: Global Search', shortcutId: 'global-search', category: 'View' },

  // Go
  { id: 'cmd.quick-open', label: 'Go: Quick Open', shortcutId: 'quick-open', category: 'Go' },
  { id: 'cmd.go-to-line', label: 'Go: Go to Line', shortcutId: 'go-to-line', category: 'Go' },
  { id: 'cmd.next-tab', label: 'Go: Next Tab', shortcutId: 'next-tab', category: 'Go' },
  { id: 'cmd.close-tab', label: 'Go: Close Tab', shortcutId: 'close-tab', category: 'Go' },
  { id: 'cmd.reopen-closed-tab', label: 'Go: Reopen Closed Tab', shortcutId: 'reopen-closed-tab', category: 'Go' },

  // Run / Terminal
  { id: 'cmd.new-terminal', label: 'Terminal: Create New', shortcutId: 'new-terminal', category: 'Terminal' },
  { id: 'cmd.clear-terminal', label: 'Terminal: Clear', category: 'Terminal' },

  // Help / Tasks
  { id: 'cmd.next-task', label: 'Tasks: Next Task', category: 'Tasks' },
  { id: 'cmd.hint', label: 'Tasks: Show Hint', category: 'Tasks' },
  { id: 'cmd.skip-task', label: 'Tasks: Skip Task', category: 'Tasks' },
];
