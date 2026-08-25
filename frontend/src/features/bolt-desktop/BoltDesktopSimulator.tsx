import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { FileText, ListTodo, Keyboard } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RealFolderIcon, RealThisPcIcon, RealTrashIcon, RealVsCodeIcon } from '@/features/bolt-desktop/simulator/components/RealIcons';
import { VirtualFileSystem } from '@/features/bolt-desktop/simulator/engine/VirtualFileSystem';
import { ArchiveEngine } from '@/features/bolt-desktop/simulator/engine/ArchiveEngine';
import { getLocalizedDesktopTasks } from '@/features/bolt-desktop/simulator/i18n/taskTranslations';
import type { VNode, ClipboardEntry } from '@/features/bolt-desktop/simulator/engine/types';
import { darkTheme, lightTheme, type ThemeTokens, type ThemeMode } from '@/features/bolt-desktop/simulator/theme';
import { useWindowManager, type WindowState } from '@/features/bolt-desktop/simulator/hooks/useWindowManager';
import { Window } from '@/features/bolt-desktop/simulator/components/Window';
import { Taskbar } from '@/features/bolt-desktop/simulator/components/Taskbar';
import { FileManager, type FileManagerActions } from '@/features/bolt-desktop/simulator/components/FileManager';
import { TextEditor } from '@/features/bolt-desktop/simulator/components/TextEditor';
import { TaskPanel } from '@/features/bolt-desktop/simulator/components/TaskPanel';
import { VirtualKeyboard } from '@/features/bolt-desktop/simulator/components/VirtualKeyboard';
import { FileTypeIcon } from '@/features/bolt-desktop/simulator/components/FileTree';
import { ContextMenu, type MenuItem } from '@/features/bolt-desktop/simulator/components/ContextMenu';
import { useT } from '@/shared/i18n';
import { useLocaleStore } from '@/shared/i18n/localeStore';
import { useAuthStore } from '@/features/auth/authStore';
import {
  creditDesktopTask,
  isLessonId,
  loadDesktopCompletedFromServer,
  loadDesktopLocalProgress,
  saveDesktopLocalProgress,
} from '@/shared/lib/simulatorProgress';
import { createItemForInlineRename, focusInlineRenameInput } from '@/features/bolt-desktop/simulator/engine/inlineCreate';
import {
  emptyCodeLabWorkspace,
  exportVfsFileToCodeLab,
  exportVfsFolderToCodeLab,
  stashVsCodeOpenFolder,
} from '@/shared/lib/vscodeBridge';
import {
  defaultDesktopIconPos,
  getVfsDragNodeId,
  loadDesktopIconPositions,
  loadDesktopVfsSnapshot,
  sanitizeDesktopIconPositions,
  saveDesktopIconPositions,
  saveDesktopVfsSnapshot,
  setVfsDragData,
  type IconPos,
} from '@/features/bolt-desktop/simulator/engine/desktopDnD';
import { healDesktopForCompletedTasks } from '@/features/bolt-desktop/simulator/engine/healDesktopTasks';
const DESKTOP_WALLPAPER = '/desktop/wallpaper-keymaster.png';

/** Windows-style desktop simulator from `Desktop/Bolt-рабочий стол` (Bolt.host MVP). */
export function BoltDesktopSimulator() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const requestedTaskId = Number(search.get('task') || 0) || null;
  const fromLessonRaw = search.get('fromLesson');
  const fromLesson = isLessonId(fromLessonRaw) ? fromLessonRaw : null;
  const tasks = useMemo(() => getLocalizedDesktopTasks(locale), [locale]);

  const vfsRef = useRef<VirtualFileSystem | null>(null);
  if (!vfsRef.current) {
    const vfs = new VirtualFileSystem();
    const snap = loadDesktopVfsSnapshot();
    if (snap) vfs.importSnapshot(snap);
    const progress = loadDesktopLocalProgress();
    healDesktopForCompletedTasks(vfs, progress.completed);
    vfsRef.current = vfs;
  }
  const vfs = vfsRef.current;
  const archiveRef = useRef<ArchiveEngine | null>(null);
  if (!archiveRef.current) archiveRef.current = new ArchiveEngine(vfs);
  const archive = archiveRef.current;

  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const theme: ThemeTokens = themeMode === 'dark' ? darkTheme : lightTheme;

  const wm = useWindowManager();
  const [vfsTick, setVfsTick] = useState(0);
  const refresh = useCallback(() => setVfsTick((n) => n + 1), []);
  void vfsTick;

  const [clipboard, setClipboard] = useState<ClipboardEntry | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [taskPanelOpen, setTaskPanelOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return Boolean(Number(search.get('task') || 0));
    }
    return true;
  });
  const [completed, setCompleted] = useState<Set<number>>(() => loadDesktopLocalProgress().completed);
  const [xp, setXp] = useState(() => loadDesktopLocalProgress().xp);
  const creditingRef = useRef<Set<number>>(new Set());
  const awardedRef = useRef<Set<number>>(new Set(loadDesktopLocalProgress().completed));
  const [taskToast, setTaskToast] = useState<string | null>(null);
  const [showFirstRunHint, setShowFirstRunHint] = useState(() => {
    try {
      return localStorage.getItem('km-desktop-firstrun-v1') !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (requestedTaskId) setTaskPanelOpen(true);
  }, [requestedTaskId]);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [desktopEditingId, setDesktopEditingId] = useState<string | null>(null);
  const [desktopEditName, setDesktopEditName] = useState('');
  const [desktopSelected, setDesktopSelected] = useState<string | null>(null);
  const desktopEditRef = useRef<HTMLInputElement>(null);
  const fmActionsRef = useRef<FileManagerActions | null>(null);
  const desktopSurfaceRef = useRef<HTMLDivElement>(null);
  const dragNodeIdRef = useRef<string | null>(null);
  const dropAcceptedRef = useRef(false);
  const [iconPositions, setIconPositions] = useState<Record<string, IconPos>>(() =>
    sanitizeDesktopIconPositions(loadDesktopIconPositions()),
  );
  const dropHighlightRef = useRef<string | null>(null);
  const dropTargetElRef = useRef<HTMLElement | null>(null);
  const dragSourceElRef = useRef<HTMLElement | null>(null);

  const setIconPos = useCallback((id: string, pos: IconPos) => {
    setIconPositions((prev) => {
      const next = sanitizeDesktopIconPositions({ ...prev, [id]: pos });
      saveDesktopIconPositions(next);
      return next;
    });
  }, []);

  const clearDropTargetEl = useCallback(() => {
    if (dropTargetElRef.current) {
      dropTargetElRef.current.classList.remove('km-desk-drop');
      dropTargetElRef.current = null;
    }
    dropHighlightRef.current = null;
  }, []);

  const setDropTargetEl = useCallback(
    (id: string, el: HTMLElement | null) => {
      if (dropHighlightRef.current === id && dropTargetElRef.current === el) return;
      if (dropTargetElRef.current && dropTargetElRef.current !== el) {
        dropTargetElRef.current.classList.remove('km-desk-drop');
      }
      dropHighlightRef.current = id;
      dropTargetElRef.current = el;
      if (el) el.classList.add('km-desk-drop');
    },
    [],
  );

  const finishDesktopEdit = useCallback(() => {
    if (!desktopEditingId) return;
    const trimmed = desktopEditName.trim();
    if (trimmed) vfs.rename(desktopEditingId, trimmed);
    setDesktopEditingId(null);
  }, [desktopEditingId, desktopEditName, vfs]);

  const createOnDesktop = useCallback(
    (kind: 'file' | 'folder') => {
      const parentId = vfs.getDesktopId();
      const defaultName =
        kind === 'file'
          ? t('desktopSimulator.defaultNewFile')
          : t('desktopSimulator.defaultNewFolder');
      const id = createItemForInlineRename(vfs, parentId, kind, defaultName);
      if (id) {
        const node = vfs.getNode(id);
        setDesktopEditingId(id);
        setDesktopEditName(node?.name ?? defaultName);
        setDesktopSelected(id);
      }
    },
    [t, vfs],
  );

  useEffect(() => {
    if (desktopEditingId && desktopEditRef.current) {
      const node = vfs.getNode(desktopEditingId);
      if (node) {
        focusInlineRenameInput(desktopEditRef.current, node.name, node.type === 'folder');
      }
    }
  }, [desktopEditingId, vfs]);

  const pasteOnDesktop = useCallback(() => {
    if (!clipboard) return;
    const parentId = vfs.getDesktopId();
    const src = vfs.getNode(clipboard.nodeId);
    if (!src) return;
    if (clipboard.mode === 'copy') {
      vfs.copy(clipboard.nodeId, parentId);
    } else {
      vfs.move(clipboard.nodeId, parentId);
      setClipboard(null);
    }
  }, [clipboard, vfs]);

  const filesExplorerActive = useCallback(() => {
    return wm.windows.some(
      (w) => w.appId === 'files' && !w.minimized && w.data !== 'trash' && w.data !== vfs.getTrashId(),
    );
  }, [wm.windows, vfs]);

  const runNewFile = useCallback(() => {
    if (filesExplorerActive() && fmActionsRef.current) fmActionsRef.current.newFile();
    else createOnDesktop('file');
  }, [createOnDesktop, filesExplorerActive]);

  const runNewFolder = useCallback(() => {
    if (filesExplorerActive() && fmActionsRef.current) fmActionsRef.current.newFolder();
    else createOnDesktop('folder');
  }, [createOnDesktop, filesExplorerActive]);

  const runPaste = useCallback(() => {
    // Prefer Explorer only while its window is open and not minimized.
    // Stale fmActions after close used to swallow Ctrl+V (clipboard stayed null in closure).
    if (filesExplorerActive() && fmActionsRef.current) fmActionsRef.current.paste();
    else pasteOnDesktop();
  }, [pasteOnDesktop, filesExplorerActive]);

  const copySelectionToClipboard = useCallback(
    (mode: 'copy' | 'cut') => {
      const fmSel = filesExplorerActive() ? fmActionsRef.current?.getSelectedId() : null;
      const nodeId =
        fmSel && !fmSel.startsWith('sys:')
          ? fmSel
          : desktopSelected && !desktopSelected.startsWith('sys:')
            ? desktopSelected
            : null;
      if (!nodeId) return;
      setClipboard({ nodeId, mode });
    },
    [desktopSelected, filesExplorerActive],
  );

  const showDesktopMenu = useCallback((x: number, y: number, items: MenuItem[]) => {
    setDesktopMenu({ x, y, items });
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const unsub = vfs.subscribe(() => {
      refresh();
      saveDesktopVfsSnapshot(vfs.exportSnapshot());
    });
    saveDesktopVfsSnapshot(vfs.exportSnapshot());
    return unsub;
  }, [vfs, refresh]);

  useEffect(() => {
    // After server progress merges, restore any missing task files.
    healDesktopForCompletedTasks(vfs, completed);
  }, [completed, vfs]);

  const currentTaskIndex = tasks.findIndex((item) => !completed.has(item.id));
  const currentTask = currentTaskIndex >= 0 ? tasks[currentTaskIndex] : null;

  useEffect(() => {
    saveDesktopLocalProgress(completed, xp);
  }, [completed, xp]);

  useEffect(() => {
    let cancelled = false;
    void loadDesktopCompletedFromServer()
      .then((ids) => {
        if (cancelled || ids.size === 0) return;
        setCompleted((prev) => {
          const next = new Set(prev);
          let changed = false;
          for (const id of ids) {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
            awardedRef.current.add(id);
          }
          return changed ? next : prev;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentTask || completed.has(currentTask.id)) return;
    if (!currentTask.check(vfs)) return;
    const task = currentTask;
    if (awardedRef.current.has(task.id)) return;
    awardedRef.current.add(task.id);
    setCompleted((prev) => {
      if (prev.has(task.id)) return prev;
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });
    setXp((value) => value + task.xp);

    if (creditingRef.current.has(task.id)) return;
    creditingRef.current.add(task.id);
    void creditDesktopTask(
      task.id,
      requestedTaskId === task.id ? fromLesson : null,
    )
      .then(async (result) => {
        const accountXp = result?.xp_gained ?? 0;
        setTaskToast(
          accountXp > 0
            ? t('desktopSimulator.taskCompletedToast', { xp: accountXp })
            : t('desktopSimulator.taskCompletedLocal'),
        );
        if (accountXp > 0) await refreshUser();
      })
      .catch(() => {
        setTaskToast(t('desktopSimulator.taskCompletedLocal'));
      })
      .finally(() => {
        window.setTimeout(() => setTaskToast(null), 3000);
      });
  }, [currentTask, vfs, completed, vfsTick, t, refreshUser, fromLesson, requestedTaskId]);

  const openFiles = useCallback((folderId?: string) => {
    const target = folderId ?? vfs.getDesktopId();
    const title =
      target === vfs.getTrashId()
        ? t('desktopSimulator.windowTrash')
        : t('desktopSimulator.windowFiles');
    wm.openWindow('files', title, target, { width: 820, height: 540 });
  }, [wm, t, vfs]);

  const openTrash = useCallback(() => {
    wm.openWindow('files', t('desktopSimulator.windowTrash'), vfs.getTrashId(), { width: 820, height: 540 });
  }, [wm, vfs, t]);

  const openFile = useCallback((node: VNode) => {
    wm.openWindow('editor', node.name, node.id, { width: 680, height: 480 });
  }, [wm]);

  const openInVsCode = useCallback(
    (nodeId?: string) => {
      if (nodeId) {
        const node = vfs.getNode(nodeId);
        if (!node) return;
        const payload =
          node.type === 'folder'
            ? exportVfsFolderToCodeLab(vfs, nodeId)
            : exportVfsFileToCodeLab(vfs, nodeId);
        if (payload) stashVsCodeOpenFolder(payload);
      } else {
        stashVsCodeOpenFolder(emptyCodeLabWorkspace('workspace'));
      }
      navigate({ pathname: '/simulator', search: '' });
    },
    [navigate, vfs],
  );

  const acceptDesktopDrop = useCallback(
    (target: 'vscode' | 'trash' | 'files' | 'desktop' | `folder:${string}`, nodeId: string): boolean => {
      const node = vfs.getNode(nodeId);
      if (!node || nodeId.startsWith('sys:')) return false;

      if (target === 'vscode') {
        dropAcceptedRef.current = true;
        clearDropTargetEl();
        openInVsCode(nodeId);
        return true;
      }
      if (target === 'trash') {
        dropAcceptedRef.current = true;
        clearDropTargetEl();
        if (vfs.delete(nodeId)) setDesktopSelected(null);
        return true;
      }
      if (target === 'files' || target === 'desktop') {
        // Already on desktop → let drag-end reposition the icon instead of "eating" the drop.
        if (node.parentId === vfs.getDesktopId()) return false;
        dropAcceptedRef.current = true;
        clearDropTargetEl();
        vfs.move(nodeId, vfs.getDesktopId());
        return true;
      }
      if (target.startsWith('folder:')) {
        const folderId = target.slice('folder:'.length);
        if (!folderId || folderId === nodeId) return false;
        const dest = vfs.getNode(folderId);
        if (!dest || dest.type !== 'folder') return false;
        dropAcceptedRef.current = true;
        clearDropTargetEl();
        if (vfs.move(nodeId, folderId)) {
          setIconPositions((prev) => {
            if (!(nodeId in prev)) return prev;
            const next = { ...prev };
            delete next[nodeId];
            saveDesktopIconPositions(next);
            return next;
          });
          setDesktopSelected(null);
        }
        return true;
      }
      return false;
    },
    [clearDropTargetEl, openInVsCode, vfs],
  );

  const resolveDragNodeId = useCallback((dataTransfer?: DataTransfer | null): string | null => {
    const fromDt = dataTransfer ? getVfsDragNodeId(dataTransfer) : null;
    if (fromDt && !fromDt.startsWith('sys:')) return fromDt;
    const fromRef = dragNodeIdRef.current;
    if (fromRef && !fromRef.startsWith('sys:')) return fromRef;
    return null;
  }, []);

  /** Prefer live hit-test — dragleave often clears highlight before drop/dragend. */
  const resolveDropTargetAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const host = el?.closest?.('[data-desk-drop]') as HTMLElement | null;
    const kind = host?.getAttribute('data-desk-drop');
    return kind || dropHighlightRef.current;
  }, []);

  const onDesktopDragOver = useCallback(
    (e: React.DragEvent, highlightId: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = highlightId === 'sys:vscode' ? 'copy' : 'move';
      setDropTargetEl(highlightId, e.currentTarget as HTMLElement);
    },
    [setDropTargetEl],
  );

  const onDesktopDragLeave = useCallback((e: React.DragEvent, highlightId: string) => {
    const related = e.relatedTarget as Node | null;
    // Stay highlighted while pointer moves across label/icon children.
    if (related && e.currentTarget.contains(related)) return;
    // Do NOT clear here — clearing races with drop and breaks “drop on VS Code”.
    void highlightId;
  }, []);

  const beginVfsDrag = useCallback((e: React.DragEvent, nodeId: string) => {
    // No setState here — React re-render mid-dragStart cancels native HTML5 drag.
    dropAcceptedRef.current = false;
    dragNodeIdRef.current = nodeId;
    setVfsDragData(e.dataTransfer, nodeId);
    const el = e.currentTarget as HTMLElement;
    dragSourceElRef.current = el;
    el.classList.add('km-desk-dragging');
  }, []);

  const beginSysIconDrag = useCallback((e: React.DragEvent, sysId: string) => {
    dropAcceptedRef.current = false;
    dragNodeIdRef.current = sysId;
    e.dataTransfer.setData('text/plain', sysId);
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    dragSourceElRef.current = el;
    el.classList.add('km-desk-dragging');
  }, []);

  const finishDesktopIconDrag = useCallback(
    (e: React.DragEvent) => {
      const id = dragNodeIdRef.current;
      const highlight = resolveDropTargetAtPoint(e.clientX, e.clientY);
      dragNodeIdRef.current = null;
      if (dragSourceElRef.current) {
        dragSourceElRef.current.classList.remove('km-desk-dragging');
        dragSourceElRef.current = null;
      }
      clearDropTargetEl();
      if (!id || dropAcceptedRef.current) return;

      // Drop may not fire in some browsers; complete the action from dragend + hit-test.
      if (!id.startsWith('sys:')) {
        if (highlight === 'sys:vscode' || highlight === 'vscode') {
          acceptDesktopDrop('vscode', id);
          return;
        }
        if (highlight === 'sys:trash' || highlight === 'trash') {
          acceptDesktopDrop('trash', id);
          return;
        }
        if (highlight === 'sys:files' || highlight === 'files') {
          acceptDesktopDrop('files', id);
          return;
        }
        if (highlight != null && highlight.startsWith('folder:')) {
          acceptDesktopDrop(highlight as `folder:${string}`, id);
          return;
        }
      }

      const surface = desktopSurfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom - 4) return;
      if (e.clientX < rect.left || e.clientX > rect.right) return;
      const x = Math.max(8, Math.min(e.clientX - rect.left - 39, rect.width - 90));
      const y = Math.max(8, Math.min(e.clientY - rect.top - 36, rect.height - 96));
      setIconPos(id, { x: Math.round(x), y: Math.round(y) });
    },
    [acceptDesktopDrop, clearDropTargetEl, resolveDropTargetAtPoint, setIconPos],
  );

  const openDesktopSelection = useCallback(() => {
    if (!desktopSelected || desktopEditingId) return;
    if (desktopSelected === 'sys:files') {
      openFiles();
      return;
    }
    if (desktopSelected === 'sys:trash') {
      openTrash();
      return;
    }
    if (desktopSelected === 'sys:vscode') {
      openInVsCode();
      return;
    }
    const node = vfs.getNode(desktopSelected);
    if (!node) return;
    if (node.type === 'folder') openFiles(node.id);
    else openFile(node);
  }, [desktopSelected, desktopEditingId, vfs, openFiles, openTrash, openFile, openInVsCode]);

  const startDesktopRenameFor = useCallback(
    (nodeId: string) => {
      const node = vfs.getNode(nodeId);
      if (!node) return;
      setDesktopSelected(nodeId);
      setDesktopEditingId(node.id);
      setDesktopEditName(node.name);
    },
    [vfs],
  );

  const startDesktopRename = useCallback(() => {
    if (!desktopSelected || desktopSelected.startsWith('sys:')) return;
    startDesktopRenameFor(desktopSelected);
  }, [desktopSelected, startDesktopRenameFor]);

  const desktopNodeMenuItems = useCallback(
    (node: VNode): MenuItem[] => {
      const items: MenuItem[] = [
        {
          label: t('desktopSimulator.menuOpen'),
          action: () => {
            if (node.type === 'folder') openFiles(node.id);
            else openFile(node);
          },
        },
      ];
      items.push({
        label: t('desktopSimulator.menuOpenWithCode'),
        action: () => openInVsCode(node.id),
      });
      items.push(
        { label: t('desktopSimulator.menuRename'), action: () => startDesktopRenameFor(node.id) },
        { label: t('desktopSimulator.menuCopy'), action: () => setClipboard({ nodeId: node.id, mode: 'copy' }) },
        { label: t('desktopSimulator.menuCut'), action: () => setClipboard({ nodeId: node.id, mode: 'cut' }) },
      );
      if (node.type === 'file' && node.name.endsWith('.zip')) {
        items.push({
          label: t('desktopSimulator.menuExtractHere'),
          action: () => archive.extract(node.id),
        });
      }
      if (node.parentId) {
        items.push({
          label: t('desktopSimulator.menuCompressZip'),
          action: () => {
            const zipId = archive.compress(node.id, node.parentId!);
            if (zipId) setDesktopSelected(zipId);
          },
        });
      }
      items.push({
        label: t('desktopSimulator.menuDelete'),
        action: () => {
          if (vfs.delete(node.id)) {
            setDesktopSelected(null);
          }
        },
        danger: true,
      });
      return items;
    },
    [t, openFiles, openFile, openInVsCode, startDesktopRenameFor, vfs, archive],
  );

  const handleDesktopIconContextMenu = useCallback(
    (e: React.MouseEvent, kind: 'sys:files' | 'sys:trash' | 'sys:vscode' | VNode) => {
      e.preventDefault();
      e.stopPropagation();
      if (kind === 'sys:files') {
        setDesktopSelected('sys:files');
        showDesktopMenu(e.clientX, e.clientY, [
          { label: t('desktopSimulator.menuOpen'), action: () => openFiles() },
        ]);
        return;
      }
      if (kind === 'sys:trash') {
        setDesktopSelected('sys:trash');
        showDesktopMenu(e.clientX, e.clientY, [
          { label: t('desktopSimulator.menuOpen'), action: () => openTrash() },
        ]);
        return;
      }
      if (kind === 'sys:vscode') {
        setDesktopSelected('sys:vscode');
        showDesktopMenu(e.clientX, e.clientY, [
          { label: t('desktopSimulator.menuOpen'), action: () => openInVsCode() },
        ]);
        return;
      }
      setDesktopSelected(kind.id);
      showDesktopMenu(e.clientX, e.clientY, desktopNodeMenuItems(kind));
    },
    [t, openFiles, openTrash, openInVsCode, showDesktopMenu, desktopNodeMenuItems],
  );

  const handleDesktopContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDesktopSelected(null);
      const items: MenuItem[] = [
        { label: t('desktopSimulator.menuNewFile'), action: () => createOnDesktop('file') },
        { label: t('desktopSimulator.menuNewFolder'), action: () => createOnDesktop('folder') },
        { label: t('desktopSimulator.menuOpenFiles'), action: () => openFiles() },
      ];
      if (clipboard) {
        items.push({ label: t('desktopSimulator.menuPaste'), action: pasteOnDesktop });
      }
      showDesktopMenu(e.clientX, e.clientY, items);
    },
    [t, clipboard, createOnDesktop, pasteOnDesktop, openFiles, showDesktopMenu],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const ctrl = e.ctrlKey || e.metaKey;

      if (isEditing && !(ctrl && e.key === 's')) return;
      if (ctrl && e.key === 's') return;

      if (ctrl && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        runNewFolder();
      } else if (ctrl && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        runNewFile();
      } else if (ctrl && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        runPaste();
      } else if (ctrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        vfs.undo();
      } else if (ctrl && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copySelectionToClipboard('copy');
      } else if (ctrl && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        copySelectionToClipboard('cut');
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (desktopSelected && !desktopSelected.startsWith('sys:')) {
          if (vfs.delete(desktopSelected)) {
            setDesktopSelected(null);
          }
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        startDesktopRename();
      } else if (e.key === 'Enter' && desktopSelected && !isEditing) {
        e.preventDefault();
        openDesktopSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    vfs,
    runNewFile,
    runNewFolder,
    runPaste,
    startDesktopRename,
    openDesktopSelection,
    desktopSelected,
    copySelectionToClipboard,
  ]);

  const registerActions = useCallback((actions: FileManagerActions | null) => {
    fmActionsRef.current = actions;
  }, []);

  const renderWindowContent = (win: WindowState) => {
    if (win.appId === 'files') {
      const folderId = (win.data as string) ?? vfs.getDesktopId();
      const isTrash = folderId === 'trash' || folderId === vfs.getTrashId();
      return (
        <FileManager
          vfs={vfs}
          archive={archive}
          theme={theme}
          initialFolderId={folderId}
          folderId={folderId}
          onOpenFile={openFile}
          onOpenInVsCode={openInVsCode}
          clipboard={clipboard}
          setClipboard={setClipboard}
          registerActions={isTrash ? undefined : registerActions}
        />
      );
    }
    if (win.appId === 'editor') {
      const node = vfs.getNode(win.data as string);
      if (!node) {
        return <div style={{ padding: 20, color: theme.textMuted }}>{t('desktopSimulator.fileNotFound')}</div>;
      }
      return (
        <TextEditor
          vfs={vfs}
          theme={theme}
          node={node}
          onClose={() => wm.closeWindow(win.id)}
        />
      );
    }
    return null;
  };

  const desktopItems = vfs.getChildren(vfs.getDesktopId());

  return (
    <div
      className="bolt-desktop-root relative flex h-full min-h-0 w-full flex-1 overflow-hidden antialiased"
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        background: theme.desktop,
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}
    >
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {fromLesson ? (
          <Link
            to={`/lessons/${fromLesson}`}
            className="absolute left-3 top-3 z-[50] rounded-lg bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/70"
          >
            {t('lesson.backToLesson')}
          </Link>
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${DESKTOP_WALLPAPER}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            zIndex: 0,
          }}
        />
        {!isMobile && (
          <div
            ref={desktopSurfaceRef}
            style={{ position: 'absolute', inset: 0, bottom: 52, zIndex: 1 }}
            onContextMenu={handleDesktopContextMenu}
            onMouseDown={(e) => {
              if (e.button === 0 && e.target === e.currentTarget) setDesktopSelected(null);
            }}
            onDragOver={(e) => {
              // Only treat empty desktop as target — icons stopPropagation themselves.
              if (e.target !== e.currentTarget) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTargetEl('desktop', e.currentTarget as HTMLElement);
            }}
            onDragLeave={(e) => onDesktopDragLeave(e, 'desktop')}
            onDrop={(e) => {
              if (e.target !== e.currentTarget) return;
              e.preventDefault();
              const nodeId = getVfsDragNodeId(e.dataTransfer);
              if (nodeId && !nodeId.startsWith('sys:')) {
                acceptDesktopDrop('desktop', nodeId);
              } else {
                clearDropTargetEl();
              }
            }}
          >
            {(
              [
                {
                  id: 'sys:files',
                  label: t('desktopSimulator.iconFiles'),
                  index: 0,
                  icon: <RealThisPcIcon size={44} />,
                  onOpen: () => openFiles(),
                  dropKind: 'files' as const,
                },
                {
                  id: 'sys:trash',
                  label: t('desktopSimulator.iconTrash'),
                  index: 1,
                  icon: <RealTrashIcon size={44} />,
                  onOpen: openTrash,
                  dropKind: 'trash' as const,
                },
                {
                  id: 'sys:vscode',
                  label: t('desktopSimulator.iconVsCode'),
                  index: 2,
                  icon: <RealVsCodeIcon size={44} />,
                  onOpen: () => openInVsCode(),
                  dropKind: 'vscode' as const,
                },
              ] as const
            ).map((sys) => {
              const pos = iconPositions[sys.id] ?? defaultDesktopIconPos(sys.index);
              return (
                <DesktopIcon
                  key={sys.id}
                  theme={theme}
                  label={sys.label}
                  selected={desktopSelected === sys.id}
                  position={pos}
                  draggable
                  dropKind={sys.id}
                  onSelect={() => setDesktopSelected(sys.id)}
                  onOpen={sys.onOpen}
                  onContextMenu={(e) => handleDesktopIconContextMenu(e, sys.id)}
                  onDragStart={(e) => beginSysIconDrag(e, sys.id)}
                  onDragEnd={finishDesktopIconDrag}
                  onDragOver={(e) => onDesktopDragOver(e, sys.id)}
                  onDragLeave={(e) => onDesktopDragLeave(e, sys.id)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const nodeId = resolveDragNodeId(e.dataTransfer);
                    if (nodeId) {
                      acceptDesktopDrop(sys.dropKind, nodeId);
                    } else {
                      clearDropTargetEl();
                    }
                  }}
                >
                  {sys.icon}
                </DesktopIcon>
              );
            })}
            {desktopItems.map((node, i) => {
              const pos = iconPositions[node.id] ?? defaultDesktopIconPos(3 + i);
              return (
                <DesktopIcon
                  key={node.id}
                  theme={theme}
                  label={node.name}
                  selected={desktopSelected === node.id}
                  position={pos}
                  draggable={!desktopEditingId || desktopEditingId !== node.id}
                  editing={desktopEditingId === node.id}
                  editValue={desktopEditName}
                  editInputRef={desktopEditRef}
                  onEditChange={setDesktopEditName}
                  onEditFinish={finishDesktopEdit}
                  onEditCancel={() => setDesktopEditingId(null)}
                  onSelect={() => setDesktopSelected(node.id)}
                  onOpen={() => {
                    if (desktopEditingId === node.id) return;
                    if (node.type === 'folder') openFiles(node.id);
                    else openFile(node);
                  }}
                  onContextMenu={(e) => handleDesktopIconContextMenu(e, node)}
                  onDragStart={(e) => beginVfsDrag(e, node.id)}
                  onDragEnd={finishDesktopIconDrag}
                  dropKind={node.type === 'folder' ? `folder:${node.id}` : undefined}
                  onDragOver={
                    node.type === 'folder'
                      ? (e) => onDesktopDragOver(e, `folder:${node.id}`)
                      : undefined
                  }
                  onDragLeave={
                    node.type === 'folder'
                      ? (e) => onDesktopDragLeave(e, `folder:${node.id}`)
                      : undefined
                  }
                  onDrop={
                    node.type === 'folder'
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const nodeId = resolveDragNodeId(e.dataTransfer);
                          if (nodeId && nodeId !== node.id) {
                            acceptDesktopDrop(`folder:${node.id}`, nodeId);
                          } else {
                            clearDropTargetEl();
                          }
                        }
                      : undefined
                  }
                >
                  {node.type === 'folder' ? (
                    <RealFolderIcon size={44} />
                  ) : (
                    <FileTypeIcon name={node.name} theme={theme} size={44} />
                  )}
                </DesktopIcon>
              );
            })}
          </div>
        )}
        {isMobile && (
          <div
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              background: theme.taskbar,
              backdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${theme.border}`,
              zIndex: 100,
            }}
          >
            <Link
              to="/practice"
              style={{ fontSize: 13, color: theme.text, textDecoration: 'none', fontWeight: 600 }}
            >
              {t('practiceShell.exitSim')}
            </Link>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setKeyboardOpen((o) => !o)}
                style={{
                  width: 34,
                  height: 34,
                  border: 'none',
                  borderRadius: 8,
                  background: keyboardOpen ? theme.accentSoft : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title={t('desktopSimulator.tbKeyboard')}
                aria-label={t('desktopSimulator.tbKeyboard')}
              >
                <Keyboard size={18} color={keyboardOpen ? theme.accent : theme.textMuted} />
              </button>
              <button
                type="button"
                onClick={() => setTaskPanelOpen((o) => !o)}
                style={{
                  width: 34,
                  height: 34,
                  border: 'none',
                  borderRadius: 8,
                  background: taskPanelOpen ? theme.accentSoft : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title={t('desktopSimulator.tbTasks')}
                aria-label={t('desktopSimulator.tbTasks')}
              >
                <ListTodo size={18} color={taskPanelOpen ? theme.accent : theme.textMuted} />
              </button>
            </div>
          </div>
        )}

        {isMobile ? (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <FileManager
              vfs={vfs}
              archive={archive}
              theme={theme}
              onOpenFile={openFile}
              onOpenInVsCode={openInVsCode}
              clipboard={clipboard}
              setClipboard={setClipboard}
              registerActions={registerActions}
            />
            {wm.windows
              .filter((w) => w.appId === 'editor')
              .map((win) => {
                const node = vfs.getNode(win.data as string);
                if (!node) return null;
                return (
                  <div
                    key={win.id}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: win.zIndex,
                      background: theme.bg,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                        background: theme.windowHeader,
                        borderBottom: `1px solid ${theme.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color={theme.textMuted} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{win.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => wm.closeWindow(win.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          fontSize: 18,
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <TextEditor vfs={vfs} theme={theme} node={node} onClose={() => wm.closeWindow(win.id)} />
                    </div>
                  </div>
                );
              })}
            <VirtualKeyboard theme={theme} visible={keyboardOpen} />
          </div>
        ) : (
          <>
            {wm.windows.map((win) => (
              <Window
                key={win.id}
                win={win}
                theme={theme}
                isMobile={false}
                onFocus={() => wm.focusWindow(win.id)}
                onClose={() => wm.closeWindow(win.id)}
                onMinimize={() => wm.minimizeWindow(win.id)}
                onToggleMaximize={() => wm.toggleMaximize(win.id)}
                onMove={(x, y) => wm.moveWindow(win.id, x, y)}
              >
                {renderWindowContent(win)}
              </Window>
            ))}
            <VirtualKeyboard theme={theme} visible={keyboardOpen} />
          </>
        )}

        {desktopMenu && !isMobile && (
          <ContextMenu
            x={desktopMenu.x}
            y={desktopMenu.y}
            items={desktopMenu.items}
            theme={theme}
            onClose={() => setDesktopMenu(null)}
          />
        )}

        {taskToast && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.success,
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: theme.shadow,
              zIndex: 9800,
              animation: 'boltDesktopSlideUp 0.3s ease',
            }}
          >
            {taskToast}
          </div>
        )}

        {showFirstRunHint && (
          <div
            style={{
              position: 'absolute',
              top: isMobile ? 56 : 12,
              left: 12,
              right: isMobile ? 12 : undefined,
              maxWidth: 340,
              zIndex: 9700,
              background: theme.bgElevated,
              border: `1px solid ${theme.borderStrong}`,
              borderRadius: 10,
              padding: '12px 14px',
              boxShadow: theme.shadow,
              color: theme.text,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t('desktopSimulator.firstRunTitle')}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, margin: '6px 0 10px', lineHeight: 1.45 }}>
              {t('desktopSimulator.firstRunHint')}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowFirstRunHint(false);
                try {
                  localStorage.setItem('km-desktop-firstrun-v1', '1');
                } catch {
                  /* ignore */
                }
                setTaskPanelOpen(true);
              }}
              style={{
                border: 'none',
                borderRadius: 7,
                background: theme.accent,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              {t('desktopSimulator.firstRunOk')}
            </button>
          </div>
        )}

        <Taskbar
          theme={theme}
          windows={wm.windows}
          onOpenFiles={() => openFiles()}
          onOpenTrash={openTrash}
          onOpenVsCode={() => openInVsCode()}
          onDropOnVsCode={(nodeId) => acceptDesktopDrop('vscode', nodeId)}
          onDropOnTrash={(nodeId) => acceptDesktopDrop('trash', nodeId)}
          onToggleKeyboard={() => setKeyboardOpen((o) => !o)}
          onToggleTasks={() => setTaskPanelOpen((o) => !o)}
          onToggleTheme={() => setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          keyboardOpen={keyboardOpen}
          tasksOpen={taskPanelOpen}
          onFocusWindow={(id) => wm.focusWindow(id)}
        />
      </div>

      <TaskPanel
        theme={theme}
        tasks={tasks}
        currentIndex={currentTaskIndex}
        completed={completed}
        xp={xp}
        onShowHint={() => {}}
        isMobile={isMobile}
        open={taskPanelOpen}
        onClose={() => setTaskPanelOpen(false)}
      />

      <style>{`
        .km-desk-icon.km-desk-dragging {
          opacity: 0.4;
        }
        .km-desk-icon.km-desk-drop {
          outline: 2px solid #60cdff !important;
          background: rgba(96, 205, 255, 0.22) !important;
          box-shadow: 0 0 0 4px rgba(96, 205, 255, 0.18);
        }
        @keyframes boltDesktopSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

function DesktopIcon({
  children,
  label,
  onOpen,
  onSelect,
  onContextMenu,
  selected,
  theme,
  editing,
  editValue,
  editInputRef,
  onEditChange,
  onEditFinish,
  onEditCancel,
  position,
  draggable,
  dropKind,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  children: ReactNode
  label: string
  onOpen: () => void
  onSelect: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  selected?: boolean
  theme: ThemeTokens
  editing?: boolean
  editValue?: string
  editInputRef?: React.RefObject<HTMLInputElement | null>
  onEditChange?: (value: string) => void
  onEditFinish?: () => void
  onEditCancel?: () => void
  position?: IconPos
  draggable?: boolean
  /** Hit-test id for drop-on-release (vscode / trash / folder:…). */
  dropKind?: string
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}) {
  const highlight = editing || selected
  return (
    <div
      role="button"
      tabIndex={0}
      className="km-desk-icon"
      data-desk-drop={dropKind || undefined}
      draggable={Boolean(draggable && !editing)}
      onDragStart={(e) => {
        if (editing) {
          e.preventDefault()
          return
        }
        // Do not call onSelect/setState here — remounts cancel HTML5 drag in React.
        onDragStart?.(e)
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => {
        e.stopPropagation()
        if (!editing) onSelect()
      }}
      onDoubleClick={(e) => {
        if (editing) return
        e.preventDefault()
        e.stopPropagation()
        onOpen()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu?.(e)
      }}
      onKeyDown={(e) => {
        if (editing) return
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen()
        }
      }}
      style={{
        position: position ? 'absolute' : undefined,
        left: position?.x,
        top: position?.y,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 78,
        padding: '8px 4px',
        borderRadius: 6,
        cursor: editing ? 'text' : draggable ? 'grab' : 'default',
        outline: highlight ? `1px solid rgba(255,255,255,0.55)` : undefined,
        background: editing || selected ? 'rgba(0, 120, 212, 0.28)' : 'transparent',
        zIndex: 2,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!editing && !selected && !e.currentTarget.classList.contains('km-desk-drop')) {
          e.currentTarget.style.background = theme.bgHover
        }
      }}
      onMouseLeave={(e) => {
        if (!editing && !selected && !e.currentTarget.classList.contains('km-desk-drop')) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <div style={{ pointerEvents: 'none', display: 'flex', lineHeight: 0 }}>{children}</div>
      {editing && editInputRef && onEditChange && onEditFinish && onEditCancel ? (
        <input
          ref={editInputRef}
          value={editValue ?? label}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditFinish}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') onEditFinish()
            if (e.key === 'Escape') onEditCancel()
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            fontSize: 11,
            padding: '2px 4px',
            border: `1px solid ${theme.accent}`,
            borderRadius: 4,
            background: theme.bgElevated,
            color: theme.text,
            textAlign: 'center',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: 12,
            color: '#fff',
            textAlign: 'center',
            wordBreak: 'break-word',
            textShadow: '0 1px 2px rgba(0,0,0,.8)',
            maxWidth: '100%',
            lineHeight: 1.25,
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
