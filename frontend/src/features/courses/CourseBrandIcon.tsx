import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type Props = {
  slug: string
  icon?: string
  className?: string
  size?: number
}

type Brand =
  | { kind: 'img'; src: string; bg: string; glow: string }
  | { kind: 'svg'; bg: string; glow: string; node: ReactNode }

/** Course brand marks — real product icons where provided, SVG fallbacks otherwise. */
export function CourseBrandIcon({ slug, icon, className, size = 40 }: Props) {
  const key = resolveKey(slug, icon)
  const brand = BRANDS[key] ?? BRANDS.keyboard
  const box = size + 16

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] ring-1 ring-ink/10 dark:ring-white/10',
        className,
      )}
      style={{
        width: box,
        height: box,
        background: brand.bg,
        boxShadow: `0 10px 24px -12px ${brand.glow}`,
      }}
      aria-hidden
    >
      {brand.kind === 'img' ? (
        <img
          src={brand.src}
          alt=""
          width={box}
          height={box}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span style={{ width: size, height: size }} className="block [&>svg]:h-full [&>svg]:w-full">
          {brand.node}
        </span>
      )}
    </span>
  )
}

function resolveKey(slug: string, icon?: string): string {
  if (slug && BRANDS[slug]) return slug
  if (icon && ICON_ALIAS[icon]) return ICON_ALIAS[icon]
  if (icon && BRANDS[icon]) return icon
  return 'keyboard'
}

const ICON_ALIAS: Record<string, string> = {
  'graduation-cap': 'programmer-basics',
  code: 'vscode',
  monitor: 'windows',
  globe: 'chrome',
  sparkles: 'cursor',
  'git-branch': 'git',
  box: 'visual-studio',
  'file-text': 'word',
  table: 'excel',
  presentation: 'powerpoint',
  image: 'photoshop',
  figma: 'figma',
  coffee: 'intellij',
  snake: 'pycharm',
  github: 'github-desktop',
  terminal: 'terminal',
  penguin: 'linux',
  apple: 'macos',
  keyboard: 'keyboard',
}

const BRANDS: Record<string, Brand> = {
  // Real icons you provided
  vscode: {
    kind: 'img',
    src: '/course-icons/vscode.png',
    bg: '#000',
    glow: 'rgba(0,120,212,.55)',
  },
  cursor: {
    kind: 'img',
    src: '/course-icons/cursor.png',
    bg: '#000',
    glow: 'rgba(255,255,255,.22)',
  },
  'visual-studio': {
    kind: 'img',
    src: '/course-icons/visual-studio.png',
    bg: '#000',
    glow: 'rgba(139,92,246,.55)',
  },
  edge: {
    kind: 'img',
    src: '/course-icons/edge.png',
    bg: '#fff',
    glow: 'rgba(12,89,164,.45)',
  },

  'programmer-basics': {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#1d4ed8,#06b6d4)',
    glow: 'rgba(37,99,235,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="10" y="12" width="28" height="20" rx="3" fill="#fff" fillOpacity=".95" />
        <path d="M15 19h5v3h-5V19Zm7 0h5v3h-5V19Zm7 0h4v3h-4V19ZM15 25h18v3H15v-3Z" fill="#2563eb" />
        <path d="M18 34h12l-2 4H20l-2-4Z" fill="#67e8f9" />
      </svg>
    ),
  },

  windows: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#0078d4,#00bcf2)',
    glow: 'rgba(0,120,212,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M8 10h14.5v14.5H8V10Zm17.5 0H40v14.5H25.5V10ZM8 27.5h14.5V42H8V27.5Zm17.5 0H40V42H25.5V27.5Z" fill="#fff" />
      </svg>
    ),
  },

  chrome: {
    kind: 'svg',
    bg: 'linear-gradient(160deg,#ffffff,#f3f4f6)',
    glow: 'rgba(234,67,53,.35)',
    node: (
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="18" fill="#fff" />
        <path d="M24 6a18 18 0 0 1 15.6 9H24a9 9 0 0 0-7.8 4.5L8.4 12A18 18 0 0 1 24 6Z" fill="#EA4335" />
        <path d="M39.6 15A18 18 0 0 1 24 42a18 18 0 0 1-15.6-9H24a9 9 0 0 0 7.8-4.5L39.6 15Z" fill="#FBBC05" />
        <path d="M8.4 33A18 18 0 0 1 8.4 15l7.8 7.5A9 9 0 0 0 24 33H8.4Z" fill="#34A853" />
        <circle cx="24" cy="24" r="7" fill="#4285F4" stroke="#fff" strokeWidth="2" />
      </svg>
    ),
  },

  git: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#f05033,#c43c28)',
    glow: 'rgba(240,80,51,.5)',
    node: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M22.6 11.4 12.6 1.4a1.9 1.9 0 0 0-2.7 0L7.7 3.6l3.4 3.4a2.3 2.3 0 0 1 2.9 2.9l3.3 3.3a2.3 2.3 0 1 1-1.3 1.3l-3.3-3.3v8.4a2.3 2.3 0 1 1-1.8.1V11.3a2.3 2.3 0 0 1-1.2-3L5.5 4.9.9 9.5a1.9 1.9 0 0 0 0 2.7l10 10a1.9 1.9 0 0 0 2.7 0l9-9a1.9 1.9 0 0 0 0-2.7Z"
          fill="#fff"
        />
      </svg>
    ),
  },

  'github-desktop': {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#24292f,#57606a)',
    glow: 'rgba(36,41,47,.5)',
    node: (
      <svg viewBox="0 0 24 24" fill="#fff">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.9 1.2 2 1.2 3.3 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
      </svg>
    ),
  },

  word: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#185abd,#2b7cd3)',
    glow: 'rgba(43,124,211,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="16" y="8" width="22" height="32" rx="2" fill="#fff" />
        <path d="M8 16h16v16H8a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2Z" fill="#0e3f8a" />
        <path d="M10.5 20h2.1l1.1 5.5L15 20h1.9l1.2 5.5L19.3 20H21.4L19.2 30h-2l-1.3-5.4L14.5 30h-2L10.5 20Z" fill="#fff" />
        <path d="M24 18h10M24 23h10M24 28h7" stroke="#185abd" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },

  excel: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#107c41,#21a366)',
    glow: 'rgba(16,124,65,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="16" y="8" width="22" height="32" rx="2" fill="#fff" />
        <path d="M8 16h16v16H8a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2Z" fill="#0b5c2e" />
        <path d="M11 20.5h7L15.5 25 18 29.5h-2.3L13.8 26l-1.9 3.5H9.6L12.2 25 9.6 20.5H11Z" fill="#fff" />
        <path d="M24 17h4v4h-4v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4ZM24 22h4v4h-4v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4ZM24 27h4v4h-4v-4Zm5 0h4v4h-4v-4Z" fill="#107c41" />
      </svg>
    ),
  },

  powerpoint: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#c43e1c,#d24726)',
    glow: 'rgba(196,62,28,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="16" y="8" width="22" height="32" rx="2" fill="#fff" />
        <path d="M8 16h16v16H8a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2Z" fill="#a13212" />
        <path d="M11.5 20h4a3.2 3.2 0 1 1 0 6.4H13V30h-1.5V20Zm1.5 1.7v3h2.3a1.5 1.5 0 0 0 0-3H13Z" fill="#fff" />
        <circle cx="30" cy="24" r="6.5" stroke="#c43e1c" strokeWidth="2.4" />
        <path d="M30 17.5V24h5" stroke="#c43e1c" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },

  photoshop: {
    kind: 'svg',
    bg: '#001e36',
    glow: 'rgba(49,168,255,.5)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="6" y="6" width="36" height="36" rx="8" fill="#001e36" />
        <path
          d="M14.5 34.5V13.5H22c4.1 0 6.7 2.3 6.7 5.9 0 3.7-2.7 6-7 6h-3.7v9.1h-3.5Zm3.5-12.4h3.5c2.1 0 3.3-1.1 3.3-2.7 0-1.6-1.2-2.6-3.3-2.6H18v5.3Z"
          fill="#31a8ff"
        />
        <path
          d="M29.2 25.2c.7-.4 1.8-.7 3.1-.7 2.9 0 4.7 1.5 4.7 4.3v7.7h-3.1v-1.4c-.6.9-1.7 1.6-3.2 1.6-2 0-3.4-1.2-3.4-3.1 0-2.1 1.7-3.2 4.5-3.2.9 0 1.6.1 2.1.3v-.5c0-1.2-.8-1.9-2.2-1.9-1.1 0-2 .4-2.5.9l-.8-2.9Zm4.7 5c-.5-.1-1-.2-1.6-.2-1.4 0-2.2.5-2.2 1.4 0 .7.5 1.2 1.4 1.2 1.2 0 2.4-.8 2.4-2.1v-.3Z"
          fill="#31a8ff"
        />
      </svg>
    ),
  },

  figma: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#1e1e1e,#2c2c2c)',
    glow: 'rgba(162,89,255,.4)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M18 8h6a6 6 0 0 1 0 12h-6V8Z" fill="#F24E1E" />
        <path d="M24 8h6a6 6 0 1 1 0 12h-6V8Z" fill="#FF7262" />
        <path d="M18 20h6a6 6 0 0 1 0 12h-6V20Z" fill="#A259FF" />
        <path d="M24 20h6a6 6 0 1 1 0 12h-6V20Z" fill="#1ABCFE" />
        <path d="M18 32h6a6 6 0 1 1-6-6v6Z" fill="#0ACF83" />
      </svg>
    ),
  },

  intellij: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#fe315d,#fc801d)',
    glow: 'rgba(254,49,93,.45)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="6" fill="#000" />
        <path d="M14 33h20" stroke="#fff" strokeWidth="2.5" />
        <path d="M16 14h3.2v14H16V14Zm6.5 0H28c2.8 0 4.6 1.7 4.6 4.3 0 2.7-1.9 4.4-4.8 4.4h-2.3V28h-3V14Zm3 2.5v3.8H28c1.3 0 2-.7 2-1.9s-.7-1.9-2-1.9h-2.5Z" fill="#fff" />
      </svg>
    ),
  },

  pycharm: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#21d789,#0e8f5a)',
    glow: 'rgba(33,215,137,.4)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="6" fill="#000" />
        <path d="M14 33h20" stroke="#fff" strokeWidth="2.5" />
        <path d="M16 14h3v14h-3V14Zm6.2 0H29c2.6 0 4.3 1.5 4.3 3.9 0 2.3-1.5 3.5-3.4 3.9l4 6.2h-3.4l-3.5-5.7h-2.6V28h-3V14Zm3 2.4v4.2h3.2c1.2 0 1.9-.6 1.9-1.6s-.7-1.6-1.9-1.6h-3.2Z" fill="#fff" />
      </svg>
    ),
  },

  terminal: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#0f172a,#1e293b)',
    glow: 'rgba(34,197,94,.35)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="11" width="32" height="26" rx="4" fill="#020617" stroke="#22c55e" strokeWidth="1.6" />
        <path d="M14 20 20 24l-6 4" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 28h10" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },

  linux: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#fcc624,#1a1a1a)',
    glow: 'rgba(252,198,36,.4)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="29" rx="11" ry="13" fill="#333" />
        <ellipse cx="24" cy="16" rx="8.5" ry="7.5" fill="#f5f5f5" />
        <circle cx="20.5" cy="15" r="1.5" fill="#111" />
        <circle cx="27.5" cy="15" r="1.5" fill="#111" />
        <ellipse cx="24" cy="18.5" rx="2" ry="1.3" fill="#fcc624" />
      </svg>
    ),
  },

  macos: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#555,#111)',
    glow: 'rgba(120,120,120,.4)',
    node: (
      <svg viewBox="0 0 24 24" fill="#fff">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 10.0.0.5 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.22-1.98 1.09-3.13-1.05.04-2.31.7-3.06 1.58-.67.78-1.26 2.02-1.1 3.21 1.16.09 2.34-.59 3.07-1.66" />
      </svg>
    ),
  },

  keyboard: {
    kind: 'svg',
    bg: 'linear-gradient(145deg,#6366f1,#4f46e5)',
    glow: 'rgba(99,102,241,.45)',
    node: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="14" width="32" height="20" rx="4" fill="#fff" />
        <path d="M14 20h4v3h-4V20Zm6 0h4v3h-4V20Zm6 0h4v3h-4V20Zm6 0h4v3h-4V20ZM14 26h20v3H14v-3Z" fill="#4f46e5" />
      </svg>
    ),
  },
}
