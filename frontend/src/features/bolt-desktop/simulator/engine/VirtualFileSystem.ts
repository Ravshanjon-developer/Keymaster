import type { VNode, NodeType } from './types';
import { genId, getExtension } from './types';

type Listener = () => void;

const TRASH_ID = 'trash';
const DESKTOP_ID = 'desktop';

export class VirtualFileSystem {
  private nodes: Map<string, VNode> = new Map();
  private listeners: Set<Listener> = new Set();
  private undoStack: Array<() => void> = [];
  private restoreCount = 0;
  private copyCount = 0;
  private extractCount = 0;

  constructor() {
    this.seed();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private pushUndo(undo: () => void): void {
    this.undoStack.push(undo);
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  /* ---------- queries ---------- */

  getNode(id: string): VNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(parentId: string): VNode[] {
    const result: VNode[] = [];
    for (const n of this.nodes.values()) {
      if (n.parentId === parentId) result.push(n);
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  getPath(id: string): string {
    const parts: string[] = [];
    let cur = this.nodes.get(id);
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentId ? this.nodes.get(cur.parentId) : undefined;
    }
    return '/' + parts.join('/');
  }

  existsIn(parentId: string, name: string, excludeId?: string): boolean {
    return this.getChildren(parentId).some(
      (n) => n.name.toLowerCase() === name.toLowerCase() && n.id !== excludeId
    );
  }

  uniqueName(parentId: string, name: string): string {
    if (!this.existsIn(parentId, name)) return name;
    const ext = getExtension(name);
    const base = ext ? name.slice(0, name.length - ext.length - 1) : name;
    let i = 2;
    if (ext) {
      while (this.existsIn(parentId, `${base} ${i}.${ext}`)) i++;
      return `${base} ${i}.${ext}`;
    }
    while (this.existsIn(parentId, `${base} ${i}`)) i++;
    return `${base} ${i}`;
  }

  isDescendant(maybeChildId: string, ancestorId: string): boolean {
    let cur = this.nodes.get(maybeChildId);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = this.nodes.get(cur.parentId);
    }
    return false;
  }

  /* ---------- mutations ---------- */

  createFile(parentId: string, name: string, content = ''): string | null {
    if (!this.nodes.has(parentId) || this.existsIn(parentId, name)) return null;
    const id = genId('f');
    const node: VNode = {
      id,
      name,
      type: 'file',
      parentId,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.nodes.set(id, node);
    this.pushUndo(() => {
      this.nodes.delete(id);
      this.notify();
    });
    this.notify();
    return id;
  }

  createFolder(parentId: string, name: string): string | null {
    if (!this.nodes.has(parentId) || this.existsIn(parentId, name)) return null;
    const id = genId('d');
    const node: VNode = {
      id,
      name,
      type: 'folder',
      parentId,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.nodes.set(id, node);
    this.pushUndo(() => {
      this.nodes.delete(id);
      this.notify();
    });
    this.notify();
    return id;
  }

  rename(id: string, newName: string): boolean {
    const node = this.nodes.get(id);
    if (!node || !node.parentId) return false;
    if (this.existsIn(node.parentId, newName, id)) return false;
    const oldName = node.name;
    node.name = newName;
    node.updatedAt = Date.now();
    this.pushUndo(() => {
      node.name = oldName;
      this.notify();
    });
    this.notify();
    return true;
  }

  delete(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node || id === TRASH_ID || id === DESKTOP_ID) return false;
    const trash = this.nodes.get(TRASH_ID);
    if (!trash) return false;

    const descendants = this.collectDescendants(id);
    const snapshot = descendants.map((d) => ({
      node: { ...this.nodes.get(d)! },
      parentId: this.nodes.get(d)!.parentId,
    }));

    if (node.parentId === TRASH_ID) {
      for (const d of descendants) this.nodes.delete(d);
      this.pushUndo(() => {
        for (const s of snapshot) this.nodes.set(s.node.id, { ...s.node, parentId: s.parentId });
        this.notify();
      });
    } else {
      node.parentId = TRASH_ID;
      this.pushUndo(() => {
        const restored = this.nodes.get(id);
        if (restored) restored.parentId = snapshot[0].parentId;
        this.notify();
      });
    }
    this.notify();
    return true;
  }

  restore(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node || node.parentId !== TRASH_ID) return false;
    const desktop = this.nodes.get(DESKTOP_ID);
    const oldParent = TRASH_ID;
    const oldName = node.name;
    node.parentId = desktop ? DESKTOP_ID : node.parentId;
    node.name = this.uniqueName(node.parentId, node.name);
    this.restoreCount += 1;
    this.pushUndo(() => {
      const r = this.nodes.get(id);
      if (r) {
        r.parentId = oldParent;
        r.name = oldName;
        this.restoreCount -= 1;
        this.notify();
      }
    });
    this.notify();
    return true;
  }

  copy(nodeId: string, targetParentId: string): string | null {
    const node = this.nodes.get(nodeId);
    if (!node || !this.nodes.has(targetParentId)) return null;
    if (node.type === 'folder' && this.isDescendant(targetParentId, nodeId)) return null;
    const newName = this.uniqueName(targetParentId, node.name);
    const id = this.cloneTree(nodeId, targetParentId, newName);
    this.copyCount += 1;
    this.notify();
    return id;
  }

  private cloneTree(nodeId: string, parentId: string, name: string): string {
    const src = this.nodes.get(nodeId)!;
    const newId = genId(src.type === 'folder' ? 'd' : 'f');
    const clone: VNode = {
      ...src,
      id: newId,
      name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.nodes.set(newId, clone);
    if (src.type === 'folder') {
      for (const child of this.getChildren(nodeId)) {
        this.cloneTree(child.id, newId, child.name);
      }
    }
    return newId;
  }

  move(nodeId: string, targetParentId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node || !this.nodes.has(targetParentId)) return false;
    if (node.parentId === targetParentId) return false;
    if (node.type === 'folder' && this.isDescendant(targetParentId, nodeId)) return false;
    if (this.existsIn(targetParentId, node.name)) {
      node.name = this.uniqueName(targetParentId, node.name);
    }
    const oldParent = node.parentId;
    node.parentId = targetParentId;
    node.updatedAt = Date.now();
    this.pushUndo(() => {
      const r = this.nodes.get(nodeId);
      if (r) r.parentId = oldParent;
      this.notify();
    });
    this.notify();
    return true;
  }

  write(id: string, content: string): boolean {
    const node = this.nodes.get(id);
    if (!node || node.type !== 'file') return false;
    const oldContent = node.content;
    node.content = content;
    node.updatedAt = Date.now();
    this.pushUndo(() => {
      const r = this.nodes.get(id);
      if (r) {
        r.content = oldContent;
        this.notify();
      }
    });
    this.notify();
    return true;
  }

  read(id: string): string {
    return this.nodes.get(id)?.content ?? '';
  }

  undo(): boolean {
    const undo = this.undoStack.pop();
    if (!undo) return false;
    undo();
    return true;
  }

  /* ---------- archive ---------- */

  collectDescendants(id: string): string[] {
    const out: string[] = [id];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const n of this.nodes.values()) {
        if (n.parentId === cur) {
          out.push(n.id);
          stack.push(n.id);
        }
      }
    }
    return out;
  }

  getRestoreCount(): number {
    return this.restoreCount;
  }

  getCopyCount(): number {
    return this.copyCount;
  }

  recordExtract(): void {
    this.extractCount += 1;
  }

  getExtractCount(): number {
    return this.extractCount;
  }

  getTrashId(): string {
    return TRASH_ID;
  }

  getDesktopId(): string {
    return DESKTOP_ID;
  }

  /** Snapshot for localStorage so desktop files survive refresh. */
  exportSnapshot(): { version: 1; nodes: VNode[] } {
    return { version: 1, nodes: [...this.nodes.values()].map((n) => ({ ...n })) };
  }

  /** Replace tree from a saved snapshot. Returns false if invalid. */
  importSnapshot(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const snap = data as { version?: number; nodes?: VNode[] };
    if (snap.version !== 1 || !Array.isArray(snap.nodes) || snap.nodes.length < 2) return false;
    const next = new Map<string, VNode>();
    for (const raw of snap.nodes) {
      if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') continue;
      if (raw.type !== 'file' && raw.type !== 'folder') continue;
      next.set(raw.id, {
        id: raw.id,
        name: raw.name,
        type: raw.type,
        parentId: raw.parentId ?? null,
        content: typeof raw.content === 'string' ? raw.content : '',
        createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
      });
    }
    if (!next.has(DESKTOP_ID) || !next.has(TRASH_ID)) return false;
    this.nodes = next;
    this.undoStack = [];
    this.notify();
    return true;
  }

  /** Desktop «Projects» wins; otherwise the seeded sidebar library. */
  findProjectsId(): string | null {
    const onDesktop = this.getChildren(DESKTOP_ID).find(
      (n) => n.type === 'folder' && n.name === 'Projects',
    );
    if (onDesktop) return onDesktop.id;
    if (this.nodes.get('projects')?.type === 'folder') return 'projects';
    return null;
  }

  /* ---------- seeding ---------- */

  private seed(): void {
    const now = Date.now();
    const mk = (
      id: string,
      name: string,
      type: NodeType,
      parentId: string | null,
      content = ''
    ): VNode => ({
      id,
      name,
      type,
      parentId,
      content,
      createdAt: now,
      updatedAt: now,
    });

    this.nodes.set(DESKTOP_ID, mk(DESKTOP_ID, 'Desktop', 'folder', null));
    this.nodes.set('documents', mk('documents', 'Documents', 'folder', null));
    this.nodes.set('downloads', mk('downloads', 'Downloads', 'folder', null));
    this.nodes.set('projects', mk('projects', 'Projects', 'folder', null));
    this.nodes.set(TRASH_ID, mk(TRASH_ID, 'Trash', 'folder', null));

    // Desktop children
    const welcomeId = genId('f');
    this.nodes.set(
      welcomeId,
      mk(welcomeId, 'Welcome.txt', 'file', DESKTOP_ID, 'Welcome to Keymaster Desktop Simulator!\n\nThis is a virtual environment where you can practice file operations safely.\n\nTry right-clicking on the desktop to create a new folder or file.')
    );

    // Documents children
    const readme = genId('f');
    this.nodes.set(readme, mk(readme, 'README.md', 'file', 'documents', '# Keymaster\n\nA desktop simulator for learning file system operations.\n'));
    const notesDoc = genId('f');
    this.nodes.set(notesDoc, mk(notesDoc, 'notes.txt', 'file', 'documents', 'My personal notes.\n'));

    // Downloads children
    const dataJson = genId('f');
    this.nodes.set(dataJson, mk(dataJson, 'data.json', 'file', 'downloads', '{\n  "name": "Keymaster",\n  "version": "1.0"\n}\n'));

    // Projects children
    const helloPy = genId('f');
    this.nodes.set(helloPy, mk(helloPy, 'hello.py', 'file', 'projects', 'print("Hello, Keymaster!")\n'));
    const appJs = genId('f');
    this.nodes.set(appJs, mk(appJs, 'app.js', 'file', 'projects', "console.log('Hello from Keymaster');\n"));
  }
}
