import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

function node(
  name: string,
  type: 'file' | 'folder',
  parentId: string | null,
  children: string[] = [],
  content = '',
): FileNode {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  const langMap: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    txt: 'text',
  };
  return {
    id: uid(name),
    name,
    type,
    parentId,
    children,
    content,
    language: type === 'file' ? (langMap[ext] ?? 'text') : undefined,
    createdAt: Date.now(),
  };
}

export function createInitialFileSystem(): {
  nodes: Record<string, FileNode>;
  rootId: string;
} {
  const nodes: Record<string, FileNode> = {};

  const root = node('keymaster-project', 'folder', null);
  nodes[root.id] = root;

  const src = node('src', 'folder', root.id);
  const components = node('components', 'folder', root.id);
  const utils = node('utils', 'folder', src.id);
  nodes[src.id] = src;
  nodes[components.id] = components;
  nodes[utils.id] = utils;

  const mainPy = node(
    'main.py',
    'file',
    src.id,
    [],
    `def main():
    print("Keymaster Code Lab")
    return True

if __name__ == "__main__":
    main()
`,
  );
  const appPy = node(
    'app.py',
    'file',
    src.id,
    [],
    `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, Keymaster"}
`,
  );
  const helperPy = node(
    'helpers.py',
    'file',
    utils.id,
    [],
    `def format_time(seconds):
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes}:{secs:02d}"
`,
  );
  const headerJsx = node(
    'Header.jsx',
    'file',
    components.id,
    [],
    `export default function Header() {
    return (
        <header className="app-header">
            <h1>Keymaster</h1>
        </header>
    );
}
`,
  );
  const buttonJsx = node(
    'Button.jsx',
    'file',
    components.id,
    [],
    `export default function Button({ label, onClick }) {
    return (
        <button onClick={onClick}>
            {label}
        </button>
    );
}
`,
  );
  const readme = node(
    'README.md',
    'file',
    root.id,
    [],
    `# Keymaster Project

A demo workspace for learning keyboard shortcuts.

## Getting Started

Open files in the Explorer and start practicing!
`,
  );
  const pkg = node(
    'package.json',
    'file',
    root.id,
    [],
    `{
  "name": "keymaster-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
`,
  );
  const indexHtml = node(
    'index.html',
    'file',
    root.id,
    [],
    `<!doctype html>
<html>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  );

  nodes[mainPy.id] = mainPy;
  nodes[appPy.id] = appPy;
  nodes[helperPy.id] = helperPy;
  nodes[headerJsx.id] = headerJsx;
  nodes[buttonJsx.id] = buttonJsx;
  nodes[readme.id] = readme;
  nodes[pkg.id] = pkg;
  nodes[indexHtml.id] = indexHtml;

  src.children = [mainPy.id, appPy.id, utils.id];
  components.children = [headerJsx.id, buttonJsx.id];
  utils.children = [helperPy.id];
  root.children = [src.id, components.id, readme.id, pkg.id, indexHtml.id];

  return { nodes, rootId: root.id };
}
