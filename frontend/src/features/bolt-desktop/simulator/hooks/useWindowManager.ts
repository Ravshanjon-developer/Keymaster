import { useState, useCallback, useRef } from 'react';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  data?: unknown;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

let zCounter = 10;

export function useWindowManager() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const idRef = useRef(0);

  const openWindow = useCallback(
    (appId: string, title: string, data?: unknown, size?: Partial<Rect>) => {
      setWindows((prev) => {
        const existingSame = prev.find((w) => w.appId === appId && w.data === data);
        if (existingSame) {
          return prev.map((w) =>
            w.id === existingSame.id
              ? { ...w, minimized: false, zIndex: ++zCounter, title }
              : w,
          );
        }

        // One «Files» window for normal folders; navigate when opening another path.
        if (appId === 'files' && data !== 'trash') {
          const filesWin = prev.find((w) => w.appId === 'files' && w.data !== 'trash');
          if (filesWin) {
            return prev.map((w) =>
              w.id === filesWin.id
                ? { ...w, data, title, minimized: false, zIndex: ++zCounter }
                : w,
            );
          }
        }

        if (appId === 'editor' && data !== undefined) {
          const editorWin = prev.find((w) => w.appId === 'editor' && w.data === data);
          if (editorWin) {
            return prev.map((w) =>
              w.id === editorWin.id
                ? { ...w, title, minimized: false, zIndex: ++zCounter }
                : w,
            );
          }
        }

        idRef.current += 1;
        const id = `win_${idRef.current}`;
        const offset = (idRef.current % 6) * 28;
        const w = size?.width ?? 760;
        const h = size?.height ?? 500;
        const newWin: WindowState = {
          id,
          appId,
          title,
          x: Math.max(24, 80 + offset),
          y: Math.max(24, 60 + offset),
          width: w,
          height: h,
          zIndex: ++zCounter,
          minimized: false,
          maximized: false,
          data,
        };
        return [...prev, newWin];
      });
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: ++zCounter, minimized: false } : w))
    );
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  return {
    windows,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximize,
    moveWindow,
    resizeWindow,
  };
}
