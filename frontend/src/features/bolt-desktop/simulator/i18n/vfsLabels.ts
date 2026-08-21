import type { Locale } from '@/shared/i18n/types';

const ROOT_LABELS: Record<Locale, Record<string, string>> = {
  ru: {
    desktop: 'Рабочий стол',
    documents: 'Документы',
    downloads: 'Загрузки',
    projects: 'Projects',
    trash: 'Корзина',
  },
  tg: {
    desktop: 'Мизи кор',
    documents: 'Санадҳо',
    downloads: 'Боргириҳо',
    projects: 'Projects',
    trash: 'Сабад',
  },
};

/** Display name for built-in VFS roots; user files keep `name`. */
export function localizeVfsNodeName(id: string, name: string, locale: Locale): string {
  return ROOT_LABELS[locale][id] ?? name;
}

export function localizeVfsPath(path: string, locale: Locale): string {
  if (!path.startsWith('/')) return path;
  const segments = path.slice(1).split('/');
  const labels = ROOT_LABELS[locale];
  const first = segments[0];
  const roots = ['Desktop', 'Documents', 'Downloads', 'Projects', 'Trash'];
  const ids = ['desktop', 'documents', 'downloads', 'projects', 'trash'];
  const idx = roots.indexOf(first);
  if (idx >= 0) {
    segments[0] = labels[ids[idx]] ?? first;
  }
  return '/' + segments.join('/');
}
