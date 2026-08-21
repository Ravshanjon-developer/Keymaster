import type { FileNode } from '@/features/bolt-simulator/simulator/types/filesystem';
import { getLanguageFromName } from '@/features/bolt-simulator/simulator/engine/highlighter';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
}

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

let pyodideReady: Promise<PyodideInterface> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      await loadScript(`${PYODIDE_CDN}pyodide.js`);
      if (!window.loadPyodide) throw new Error('Pyodide failed to load');
      return window.loadPyodide({ indexURL: PYODIDE_CDN });
    })();
  }
  return pyodideReady;
}

export function createHtmlPreviewBlob(html: string): string {
  const doc = html.includes('<html') ? html : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

export async function runPythonCode(source: string): Promise<string[]> {
  const lines: string[] = [];
  const py = await getPyodide();
  py.setStdout({ batched: (msg) => lines.push(...msg.split('\n').filter((l, i, a) => i < a.length - 1 || l)) });
  py.setStderr({ batched: (msg) => lines.push(...msg.split('\n').map((l) => (l ? `[stderr] ${l}` : l)).filter(Boolean)) });
  try {
    await py.runPythonAsync(source);
    if (lines.length === 0) lines.push('(finished — no output)');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    lines.push(`Python error: ${msg}`);
  }
  return lines;
}

export async function runJavaScriptCode(source: string): Promise<string[]> {
  const lines: string[] = [];
  const log = (...args: unknown[]) => lines.push(args.map(String).join(' '));
  try {
    const fn = new Function('console', '"use strict";\n' + source);
    fn({ log, error: log, warn: log, info: log });
    if (lines.length === 0) lines.push('(finished — no output)');
  } catch (e) {
    lines.push(`JavaScript error: ${e instanceof Error ? e.message : String(e)}`);
  }
  return lines;
}

function resolvePathParts(cwd: string, input: string): string[] {
  if (input.startsWith('/')) return input.split('/').filter(Boolean);
  const parts = cwd.split('/').filter(Boolean);
  for (const seg of input.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg === '.' || !seg) continue;
    else parts.push(seg);
  }
  return parts;
}

function findNodeByPath(
  nodes: Record<string, FileNode>,
  rootId: string,
  pathParts: string[],
): FileNode | undefined {
  let current = nodes[rootId];
  for (const seg of pathParts) {
    const child = current.children.map((id) => nodes[id]).find((n) => n?.name === seg);
    if (!child) return undefined;
    current = child;
  }
  return current;
}

export function readFileFromWorkspace(
  nodes: Record<string, FileNode>,
  rootId: string,
  cwd: string,
  fileArg: string,
): FileNode | null {
  const pathParts = resolvePathParts(cwd, fileArg);
  const node = findNodeByPath(nodes, rootId, pathParts);
  if (!node || node.type !== 'file') return null;
  return node;
}

export type RunKind = 'html-preview' | 'python' | 'javascript' | 'unsupported';

export function detectRunKind(fileName: string): RunKind {
  const lang = getLanguageFromName(fileName);
  if (lang === 'html') return 'html-preview';
  if (lang === 'python') return 'python';
  if (lang === 'javascript' || lang === 'typescript') return 'javascript';
  return 'unsupported';
}

export async function runFileContent(
  fileName: string,
  content: string,
): Promise<{ kind: RunKind; lines?: string[]; previewUrl?: string }> {
  const kind = detectRunKind(fileName);
  switch (kind) {
    case 'html-preview':
      return { kind, previewUrl: createHtmlPreviewBlob(content) };
    case 'python':
      return { kind, lines: await runPythonCode(content) };
    case 'javascript':
      return { kind, lines: await runJavaScriptCode(content) };
    default:
      return { kind: 'unsupported' };
  }
}
