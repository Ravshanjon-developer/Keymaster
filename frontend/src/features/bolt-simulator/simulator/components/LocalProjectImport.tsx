import { useRef, useCallback } from 'react';
import { FolderOpen, FileUp } from 'lucide-react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';

type Props = {
  /** Icon-only in explorer toolbar */
  compact?: boolean;
  /** Stacked buttons with text (under Explorer title) */
  showLabels?: boolean;
};

/** Hidden file inputs + buttons to import from the laptop. */
export function LocalProjectImport({ compact, showLabels }: Props) {
  const { importLocalFiles, notify } = useSimulator();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const onFolderChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files?.length) return;
      try {
        const stats = await importLocalFiles(files);
        notify({
          type: 'success',
          message: 'Folder imported',
          detail: `${stats.fileCount} file(s)${stats.skippedBinary ? `, ${stats.skippedBinary} skipped` : ''}`,
        });
      } catch (err) {
        notify({
          type: 'error',
          message: 'Import failed',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [importLocalFiles, notify],
  );

  const onFilesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files?.length) return;
      try {
        const stats = await importLocalFiles(files);
        notify({
          type: 'success',
          message: 'Files imported',
          detail: `${stats.fileCount} file(s) added to project`,
        });
      } catch (err) {
        notify({
          type: 'error',
          message: 'Import failed',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [importLocalFiles, notify],
  );

  const btnClass = compact
    ? 'p-1 hover:bg-surface-2 rounded transition-colors'
    : 'flex items-center gap-1.5 rounded px-1 py-1 hover:bg-surface-2 transition-colors text-ink-dim hover:text-ink';

  const labeledBtn =
    'flex w-full items-center gap-2 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-left text-2xs text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink';

  return (
    <>
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        // @ts-expect-error webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        directory=""
        multiple
        onChange={onFolderChange}
      />
      <input ref={filesInputRef} type="file" className="hidden" multiple onChange={onFilesChange} />

      {showLabels ? (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className={labeledBtn}
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderOpen size={14} className="shrink-0 text-accent" />
            <span>Папка с компьютера</span>
          </button>
          <button
            type="button"
            className={labeledBtn}
            onClick={() => filesInputRef.current?.click()}
          >
            <FileUp size={14} className="shrink-0 text-accent" />
            <span>Файлы с компьютера</span>
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={btnClass}
            title="Open folder from computer"
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderOpen size={compact ? 13 : 14} className="text-ink-dim" />
          </button>
          <button
            type="button"
            className={btnClass}
            title="Open files from computer"
            onClick={() => filesInputRef.current?.click()}
          >
            <FileUp size={compact ? 13 : 14} className="text-ink-dim" />
          </button>
        </>
      )}
    </>
  );
}
