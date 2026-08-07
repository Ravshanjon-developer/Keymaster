/** Decorative visuals for home feature cards (aria-hidden). */
export function HomeFeatureVisual({ variant }: { variant: 'path' | 'keyboard' | 'exam' }) {
  if (variant === 'path') return <PathMapVisual />
  if (variant === 'keyboard') return <KeyboardVisual />
  return <ExamVisual />
}

function PathMapVisual() {
  return (
    <svg viewBox="0 0 240 136" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="km-path-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(37 99 235 / 0.35)" />
          <stop offset="100%" stopColor="rgb(6 182 212 / 0.2)" />
        </linearGradient>
      </defs>
      <rect width="240" height="136" fill="transparent" />
      <path
        d="M28 98 C 48 98, 52 42, 72 40 S 108 88, 128 72 S 168 28, 212 36"
        fill="none"
        stroke="url(#km-path-glow)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M28 98 C 48 98, 52 42, 72 40 S 108 88, 128 72"
        fill="none"
        stroke="var(--color-brand-500, #3b82f6)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 0"
      />
      {[
        { cx: 28, cy: 98, done: true },
        { cx: 72, cy: 40, done: true },
        { cx: 128, cy: 72, done: true },
        { cx: 212, cy: 36, done: false },
      ].map((p, i) => (
        <g key={i}>
          <circle
            cx={p.cx}
            cy={p.cy}
            r={p.done ? 11 : 9}
            fill={p.done ? 'var(--color-brand-600, #2563eb)' : 'var(--bg-elevated)'}
            stroke={p.done ? 'var(--color-brand-400, #60a5fa)' : 'var(--border-default)'}
            strokeWidth="2"
          />
          {p.done ? (
            <path
              d={`M${p.cx - 4} ${p.cy} l3 3 6-7`}
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <circle cx={p.cx} cy={p.cy} r="3" fill="var(--text-muted)" opacity="0.5" />
          )}
        </g>
      ))}
      <text x="20" y="124" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-sans)">
        XP
      </text>
      <rect x="36" y="116" width="48" height="6" rx="3" fill="var(--bg-muted)" />
      <rect x="36" y="116" width="32" height="6" rx="3" fill="var(--color-brand-500, #3b82f6)" />
    </svg>
  )
}

function KeyboardVisual() {
  const keys = [
    ['Esc', '1', '2', '3', '4', '5', '6'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'K', 'Enter'],
  ]
  const hot = new Set(['Ctrl', 'K'])
  return (
    <svg viewBox="0 0 240 136" className="h-full w-full" aria-hidden>
      <rect x="16" y="12" width="208" height="112" rx="12" fill="var(--bg-muted)" opacity="0.35" />
      <g transform="translate(24, 22)">
        {keys.map((row, ri) =>
          row.map((label, ci) => {
            const w = label === 'Space' ? 52 : label.length > 3 ? 36 : 26
            const x = row.slice(0, ci).reduce((acc, k) => acc + (k === 'Space' ? 52 : k.length > 3 ? 36 : 26) + 4, 0)
            const y = ri * 32
            const active = hot.has(label)
            return (
              <g key={`${ri}-${ci}`} transform={`translate(${x}, ${y})`}>
                {active && (
                  <rect
                    x="-1"
                    y="-1"
                    width={w + 2}
                    height="26"
                    rx="7"
                    fill="rgb(37 99 235 / 0.25)"
                  />
                )}
                <rect
                  width={w}
                  height="24"
                  rx="6"
                  fill={active ? 'var(--color-brand-600, #2563eb)' : 'var(--bg-elevated)'}
                  stroke={active ? 'var(--color-brand-400)' : 'var(--border-default)'}
                  strokeWidth="1"
                />
                <text
                  x={w / 2}
                  y="15"
                  textAnchor="middle"
                  fill={active ? '#fff' : 'var(--text-secondary)'}
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="var(--font-sans)"
                >
                  {label === 'Space' ? '—' : label}
                </text>
              </g>
            )
          }),
        )}
      </g>
      <g transform="translate(168, 8)">
        <rect width="56" height="22" rx="6" fill="var(--color-accent-muted)" stroke="var(--border-default)" />
        <text x="28" y="14" textAnchor="middle" fill="var(--color-brand-700, #1d4ed8)" fontSize="8" fontWeight="700">
          Ctrl+K
        </text>
      </g>
      <text x="24" y="128" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-sans)">
        KeyboardEvent
      </text>
    </svg>
  )
}

function ExamVisual() {
  const pts = '24,88 48,72 72,78 96,52 120,58 144,38 168,44 192,28'
  return (
    <svg viewBox="0 0 240 136" className="h-full w-full" aria-hidden>
      <rect x="20" y="16" width="200" height="96" rx="12" fill="var(--bg-elevated)" stroke="var(--border-default)" />
      <rect x="20" y="16" width="200" height="22" rx="12" fill="var(--bg-muted)" />
      <rect x="20" y="26" width="200" height="12" fill="var(--bg-muted)" />
      <circle cx="34" cy="27" r="4" fill="var(--color-danger)" opacity="0.7" />
      <circle cx="46" cy="27" r="4" fill="var(--color-warning)" opacity="0.7" />
      <circle cx="58" cy="27" r="4" fill="var(--color-success)" opacity="0.7" />
      <text x="72" y="30" fill="var(--text-muted)" fontSize="8" fontWeight="600">
        Exam · 12/15
      </text>
      <rect x="32" y="48" width="120" height="6" rx="3" fill="var(--bg-muted)" />
      <rect x="32" y="48" width="96" height="6" rx="3" fill="var(--color-brand-500, #3b82f6)" />
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-brand-500, #3b82f6)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={pts}
        fill="rgb(37 99 235 / 0.12)"
        stroke="none"
        transform="translate(0, 8)"
      />
      <circle cx="192" cy="28" r="3" fill="var(--color-success)" />
      <g transform="translate(178, 78)">
        <circle r="22" cx="22" cy="22" fill="var(--color-brand-600, #2563eb)" />
        <circle r="18" cx="22" cy="22" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" />
        <path
          d="M22 14 l2 6 6 1 -4.5 4.5 1 6 -5.5-3 -5.5 3 1-6 L16 21 l6-1z"
          fill="#fff"
        />
        <text x="22" y="52" textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontWeight="700">
          PASS
        </text>
      </g>
    </svg>
  )
}
