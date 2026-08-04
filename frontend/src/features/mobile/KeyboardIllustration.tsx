export function KeyboardIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="24" width="304" height="148" rx="16" className="fill-brand-100 stroke-brand-300 dark:fill-brand-950 dark:stroke-brand-700" strokeWidth="2" />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={`r1-${i}`}
          x={20 + i * 28}
          y={40}
          width="22"
          height="18"
          rx="4"
          className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={`r2-${i}`}
          x={34 + i * 28}
          y={64}
          width="22"
          height="18"
          rx="4"
          className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600"
          strokeWidth="1"
        />
      ))}
      <rect x="20" y="88" width="36" height="18" rx="4" className="fill-accent-200 stroke-accent-400 dark:fill-accent-900 dark:stroke-accent-600" strokeWidth="1" />
      <rect x="60" y="88" width="200" height="18" rx="4" className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" strokeWidth="1" />
      <rect x="264" y="88" width="36" height="18" rx="4" className="fill-accent-200 stroke-accent-400 dark:fill-accent-900 dark:stroke-accent-600" strokeWidth="1" />
      <rect x="20" y="112" width="280" height="18" rx="4" className="fill-brand-500/20 stroke-brand-400 dark:fill-brand-500/30" strokeWidth="1" />
      <rect x="20" y="136" width="48" height="18" rx="4" className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" strokeWidth="1" />
      <rect x="72" y="136" width="48" height="18" rx="4" className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" strokeWidth="1" />
      <rect x="124" y="136" width="120" height="18" rx="4" className="fill-success-500/25 stroke-success-500 dark:fill-success-500/20" strokeWidth="1" />
      <rect x="248" y="136" width="52" height="18" rx="4" className="fill-white stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600" strokeWidth="1" />
    </svg>
  )
}
