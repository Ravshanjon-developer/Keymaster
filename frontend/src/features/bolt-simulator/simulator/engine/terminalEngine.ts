import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';
import type { TerminalLine } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';

export interface TerminalContext {
  nodes: Record<string, FileNode>;
  rootId: string;
  cwd: string;
}

export interface TerminalResult {
  output: string[];
  newCwd?: string;
  fsMutation?: {
    type: 'create' | 'delete';
    parentId: string;
    name: string;
    nodeType: 'file' | 'folder';
  };
}

function resolvePath(cwd: string, input: string): string[] {
  if (input.startsWith('/')) {
    return input.split('/').filter(Boolean);
  }
  const parts = cwd.split('/').filter(Boolean);
  for (const seg of input.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg === '.') continue;
    else if (seg) parts.push(seg);
  }
  return parts;
}

function findNode(nodes: Record<string, FileNode>, rootId: string, pathParts: string[]): FileNode | undefined {
  let current = nodes[rootId];
  for (const seg of pathParts) {
    const child = current.children.map((id) => nodes[id]).find((n) => n && n.name === seg);
    if (!child) return undefined;
    current = child;
  }
  return current;
}

export function executeCommand(cmd: string, ctx: TerminalContext): TerminalResult {
  const trimmed = cmd.trim();
  if (!trimmed) return { output: [] };

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'pwd':
      return { output: ['/' + resolvePath(ctx.cwd, '.').join('/')] };

    case 'ls': {
      const targetPath = args[0] ? resolvePath(ctx.cwd, args[0]) : resolvePath(ctx.cwd, '.');
      const node = findNode(ctx.nodes, ctx.rootId, targetPath);
      if (!node) return { output: [`ls: ${args[0] ?? '.'}: No such file or directory`] };
      if (node.type === 'file') return { output: [node.name] };
      const children = node.children.map((id) => ctx.nodes[id]).filter(Boolean);
      if (children.length === 0) return { output: [''] };
      return { output: [children.map((c) => (c.type === 'folder' ? `${c.name}/` : c.name)).join('  ')] };
    }

    case 'cd': {
      if (!args[0] || args[0] === '~') return { output: [], newCwd: '/' };
      const targetPath = resolvePath(ctx.cwd, args[0]);
      const node = findNode(ctx.nodes, ctx.rootId, targetPath);
      if (!node) return { output: [`cd: ${args[0]}: No such file or directory`] };
      if (node.type !== 'folder') return { output: [`cd: ${args[0]}: Not a directory`] };
      return { output: [], newCwd: '/' + targetPath.join('/') };
    }

    case 'mkdir': {
      if (!args[0]) return { output: ['mkdir: missing operand'] };
      const targetPath = resolvePath(ctx.cwd, args[0]);
      const parentPath = targetPath.slice(0, -1);
      const name = targetPath[targetPath.length - 1];
      const parent = findNode(ctx.nodes, ctx.rootId, parentPath.length ? parentPath : resolvePath(ctx.cwd, '.'));
      if (!parent || parent.type !== 'folder') return { output: [`mkdir: cannot create directory '${args[0]}': No such file or directory`] };
      if (parent.children.some((id) => ctx.nodes[id]?.name === name)) return { output: [`mkdir: cannot create directory '${args[0]}': File exists`] };
      return {
        output: [],
        fsMutation: { type: 'create', parentId: parent.id, name, nodeType: 'folder' },
      };
    }

    case 'touch': {
      if (!args[0]) return { output: ['touch: missing operand'] };
      const targetPath = resolvePath(ctx.cwd, args[0]);
      const parentPath = targetPath.slice(0, -1);
      const name = targetPath[targetPath.length - 1];
      const parent = findNode(ctx.nodes, ctx.rootId, parentPath.length ? parentPath : resolvePath(ctx.cwd, '.'));
      if (!parent || parent.type !== 'folder') return { output: [`touch: cannot create file '${args[0]}': No such file or directory`] };
      if (parent.children.some((id) => ctx.nodes[id]?.name === name)) return { output: [] };
      return {
        output: [],
        fsMutation: { type: 'create', parentId: parent.id, name, nodeType: 'file' },
      };
    }

    case 'cat': {
      if (!args[0]) return { output: ['cat: missing operand'] };
      const targetPath = resolvePath(ctx.cwd, args[0]);
      const node = findNode(ctx.nodes, ctx.rootId, targetPath);
      if (!node) return { output: [`cat: ${args[0]}: No such file or directory`] };
      if (node.type === 'folder') return { output: [`cat: ${args[0]}: Is a directory`] };
      return { output: (node.content ?? '').split('\n') };
    }

    case 'echo':
      return { output: [args.join(' ').replace(/^["']|["']$/g, '')] };

    case 'clear':
      return { output: ['__CLEAR__'] };

    case 'whoami':
      return { output: ['keymaster'] };

    case 'help':
      return {
        output: [
          'Available commands:',
          '  pwd          Print working directory',
          '  ls [path]    List directory contents',
          '  cd [path]    Change directory',
          '  mkdir <name> Create a directory',
          '  touch <name> Create an empty file',
          '  cat <file>   Display file contents',
          '  echo <text>  Print text',
          '  clear        Clear the terminal',
          '  whoami       Print current user',
          '  help         Show this help',
          '  python <file>  Run Python (Pyodide, first run loads ~8MB)',
          '  node <file>    Run JavaScript',
          '  run <file>     Auto by extension (.html preview / .py / .js)',
          '  preview <file> Open HTML file in preview panel',
        ],
      };

    default:
      return { output: [`command not found: ${command}. Type 'help' for available commands.`] };
  }
}

export function createTerminalLine(text: string, type: TerminalLine['type']): Omit<TerminalLine, 'id'> {
  return { text, type };
}
