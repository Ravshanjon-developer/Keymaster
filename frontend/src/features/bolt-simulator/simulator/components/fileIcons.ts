import {
  FileText, FileCode, FileType, FileTerminal, Braces, Hash,
  type LucideIcon,
} from 'lucide-react';

export function getFileIcon(name: string): LucideIcon {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  switch (ext) {
    case 'py': return FileTerminal;
    case 'js': case 'jsx': case 'ts': case 'tsx': return FileCode;
    case 'json': return Braces;
    case 'md': return Hash;
    case 'html': return FileText;
    case 'css': return FileType;
    case 'txt': return FileText;
    default: return FileText;
  }
}

export function getFileColor(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  switch (ext) {
    case 'py': return 'text-[#3572A5]';
    case 'js': return 'text-[#cbcb41]';
    case 'jsx': return 'text-[#519aba]';
    case 'ts': case 'tsx': return 'text-[#519aba]';
    case 'json': return 'text-[#cbcb41]';
    case 'md': return 'text-[#519aba]';
    case 'html': return 'text-[#e37933]';
    case 'css': return 'text-[#519aba]';
    default: return 'text-ink-dim';
  }
}
