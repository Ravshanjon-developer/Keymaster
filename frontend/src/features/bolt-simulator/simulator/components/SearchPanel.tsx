import { useState, useMemo } from 'react';
import { useSimulator, getPath } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { getFileIcon, getFileColor } from '@/features/bolt-simulator/simulator/components/fileIcons';

export function SearchPanel() {
  const { state, openFile } = useSimulator();
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  const results = useMemo(() => {
    if (!query) return [];
    const search = caseSensitive ? query : query.toLowerCase();
    return Object.values(state.nodes)
      .filter((n) => n.type === 'file' && n.content)
      .map((n) => {
        const content = n.content!;
        const lines = content.split('\n');
        const matches: { line: number; text: string; col: number }[] = [];
        lines.forEach((line, i) => {
          const haystack = caseSensitive ? line : line.toLowerCase();
          const idx = haystack.indexOf(search);
          if (idx !== -1) {
            matches.push({ line: i + 1, text: line.trim(), col: idx });
          }
        });
        return { node: n, matches };
      })
      .filter((r) => r.matches.length > 0);
  }, [query, state.nodes, caseSensitive]);

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim no-select border-b border-edge">
        Search
      </div>
      <div className="p-2">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2.5 text-ink-dim" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across files"
            className="w-full pl-7 pr-16 py-2 text-sm bg-surface-0 border border-edge rounded outline-none focus:border-accent text-ink"
          />
          <div className="absolute right-1.5 top-1.5 flex gap-0.5">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={`px-1.5 py-1 text-2xs rounded font-mono transition-colors ${
                caseSensitive ? 'bg-accent/20 text-accent' : 'text-ink-faint hover:bg-surface-2'
              }`}
              title="Case Sensitive"
            >
              Aa
            </button>
          </div>
        </div>
      </div>

      {query && (
        <div className="px-3 pb-2 text-2xs text-ink-dim">
          {totalMatches} {totalMatches === 1 ? 'result' : 'results'} in {results.length} {results.length === 1 ? 'file' : 'files'}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {results.map((r) => {
          const Icon = getFileIcon(r.node.name);
          const path = getPath(state.nodes, r.node.id).join('/');
          return (
            <div key={r.node.id} className="no-select">
              <div
                className="flex items-center gap-1.5 px-3 py-1 text-sm text-ink-soft hover:bg-surface-2 cursor-pointer"
                onClick={() => openFile(r.node.id)}
              >
                <ChevronDown size={14} className="text-ink-faint" />
                <Icon size={14} className={getFileColor(r.node.name)} />
                <span className="truncate">{r.node.name}</span>
                <span className="text-2xs text-ink-faint truncate">{path}</span>
                <span className="text-2xs bg-surface-3 text-ink-dim rounded-full px-1.5 font-mono">{r.matches.length}</span>
              </div>
              {r.matches.map((match, i) => (
                <div
                  key={i}
                  onClick={() => openFile(r.node.id)}
                  className="flex items-center gap-2 pl-8 pr-3 py-1 text-sm text-ink-dim hover:bg-surface-2 hover:text-accent cursor-pointer transition-colors"
                >
                  <ChevronRight size={12} className="opacity-0" />
                  <span className="truncate flex-1 font-mono text-2xs">
                    {match.text.slice(0, 80)}
                  </span>
                  <span className="text-2xs text-ink-faint font-mono shrink-0">:{match.line}</span>
                </div>
              ))}
            </div>
          );
        })}
        {query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-ink-faint">
            <FileText size={28} className="mb-2" />
            <span className="text-sm">No results found</span>
          </div>
        )}
        {!query && (
          <div className="px-3 py-8 text-center text-sm text-ink-faint">
            Type to search across all files
          </div>
        )}
      </div>
    </div>
  );
}
