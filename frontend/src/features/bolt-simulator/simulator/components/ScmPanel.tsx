import { GitBranch } from 'lucide-react';

/** Placeholder — real Git is not wired in the browser lab. */
export function ScmPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-edge px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim no-select">
        Source Control
      </div>
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <GitBranch size={32} className="text-ink-faint" strokeWidth={1.25} />
        <p className="text-sm text-ink-soft">Git не подключён</p>
        <p className="text-2xs leading-relaxed text-ink-dim">
          В учебном симуляторе нет связи с Git на ноутбуке. Импортируйте папку через Explorer и работайте с
          файлами локально в редакторе.
        </p>
      </div>
    </div>
  );
}
