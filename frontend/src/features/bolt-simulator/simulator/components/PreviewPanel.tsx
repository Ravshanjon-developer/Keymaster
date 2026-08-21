import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { X, ExternalLink } from 'lucide-react';

export function PreviewPanel() {
  const { state, closePreview } = useSimulator();

  if (!state.previewOpen || !state.previewSrc) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l border-edge bg-surface-0">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-edge bg-surface-1 px-3 no-select">
        <span className="truncate text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Preview — {state.previewTitle}
        </span>
        <div className="flex items-center gap-1">
          <a
            href={state.previewSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            onClick={closePreview}
            className="rounded p-1 text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
            title="Close preview"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <iframe
        title={state.previewTitle}
        src={state.previewSrc}
        className="min-h-0 flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />
    </div>
  );
}
