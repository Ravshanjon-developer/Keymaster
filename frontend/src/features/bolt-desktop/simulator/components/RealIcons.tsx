interface IconProps {
  size?: number
}

/** Windows-style yellow folder (user folders only). */
export function RealFolderIcon({ size = 36 }: IconProps) {
  const uid = `kmFold_${Math.round(size)}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`${uid}_back`} x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE08A" />
          <stop offset="1" stopColor="#E8B84A" />
        </linearGradient>
        <linearGradient id={`${uid}_front`} x1="24" y1="18" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD54F" />
          <stop offset="1" stopColor="#F0B429" />
        </linearGradient>
        <linearGradient id={`${uid}_tab`} x1="6" y1="8" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#F0C14D" />
        </linearGradient>
      </defs>
      <path d="M6 10C6 8.343 7.343 7 9 7H18L22 11H39C40.657 11 42 12.343 42 14V16H6V10Z" fill={`url(#${uid}_tab)`} />
      <path d="M6 14C6 12.343 7.343 11 9 11H39C40.657 11 42 12.343 42 14V38C42 39.657 40.657 41 39 41H9C7.343 41 6 39.657 6 38V14Z" fill={`url(#${uid}_back)`} />
      <path d="M6 18C6 16.343 7.343 15 9 15H39C40.657 15 42 16.343 42 18V38C42 39.657 40.657 41 39 41H9C7.343 41 6 39.657 6 38V18Z" fill={`url(#${uid}_front)`} />
      <path d="M6 18C6 16.343 7.343 15 9 15H39C40.657 15 42 16.343 42 18V20H6V18Z" fill="rgba(255,255,255,0.35)" />
    </svg>
  )
}

/**
 * Windows 11 “Этот компьютер” — desktop PC / monitor (not a folder).
 */
export function RealThisPcIcon({ size = 36 }: IconProps) {
  const uid = `kmPc_${Math.round(size)}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`${uid}_bezel`} x1="24" y1="6" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3A3F46" />
          <stop offset="1" stopColor="#1E2228" />
        </linearGradient>
        <linearGradient id={`${uid}_screen`} x1="14" y1="10" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5EB8F7" />
          <stop offset="0.55" stopColor="#2B88D8" />
          <stop offset="1" stopColor="#0F6CBD" />
        </linearGradient>
        <linearGradient id={`${uid}_stand`} x1="24" y1="34" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C5CCD4" />
          <stop offset="1" stopColor="#8A949E" />
        </linearGradient>
      </defs>
      {/* Monitor */}
      <rect x="7" y="6" width="34" height="26" rx="3" fill={`url(#${uid}_bezel)`} />
      <rect x="10" y="9" width="28" height="18" rx="1.5" fill={`url(#${uid}_screen)`} />
      <path d="M12 11h10v1.5H12V11Zm0 4h16v1.2H12V15Zm0 3.5h12v1.2H12v-1.2Z" fill="rgba(255,255,255,0.35)" />
      {/* Stand */}
      <path d="M20 32h8v3h-8v-3Z" fill={`url(#${uid}_stand)`} />
      <path d="M15 40h18c1.1 0 2 .9 2 2v1H13v-1c0-1.1.9-2 2-2Z" fill={`url(#${uid}_stand)`} />
      <circle cx="24" cy="17" r="1.2" fill="rgba(255,255,255,0.5)" />
    </svg>
  )
}

/**
 * Windows File Explorer app icon — yellow folder + blue accent (taskbar / Start).
 */
export function RealExplorerIcon({ size = 36 }: IconProps) {
  const uid = `kmExp_${Math.round(size)}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`${uid}_folder`} x1="24" y1="10" x2="24" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFCC4D" />
          <stop offset="1" stopColor="#F0A020" />
        </linearGradient>
        <linearGradient id={`${uid}_blue`} x1="8" y1="8" x2="28" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4DB8FF" />
          <stop offset="1" stopColor="#0078D4" />
        </linearGradient>
      </defs>
      {/* Soft app tile shadow */}
      <rect x="4" y="4" width="40" height="40" rx="9" fill="rgba(0,0,0,0.12)" />
      <rect x="4" y="4" width="40" height="40" rx="9" fill="#1A1A1A" opacity="0.35" />
      {/* Folder body */}
      <path
        d="M12 16.5c0-1.4 1.1-2.5 2.5-2.5H20l2.2 2.2H33.5c1.4 0 2.5 1.1 2.5 2.5V33c0 1.4-1.1 2.5-2.5 2.5h-19C12.6 35.5 11.5 34.4 11.5 33V16.5H12Z"
        fill={`url(#${uid}_folder)`}
        transform="translate(0.5 0.5)"
      />
      <path d="M12 20h24v2.5H12V20Z" fill="rgba(255,255,255,0.35)" />
      {/* Blue Explorer “clip” / tab — distinctive from plain folders */}
      <path
        d="M28 12.5c0-1.4 1.1-2.5 2.5-2.5H36c1.1 0 2 .9 2 2v14.5c0 1.7-1.3 3-3 3h-4.5c-1.4 0-2.5-1.1-2.5-2.5V12.5Z"
        fill={`url(#${uid}_blue)`}
      />
      <path d="M31 14.5h5v1.4h-5v-1.4Zm0 3.2h5v1.3h-5v-1.3Zm0 3.1h3.5v1.3H31v-1.3Z" fill="rgba(255,255,255,0.55)" />
    </svg>
  )
}

/** Recycle bin. */
export function RealTrashIcon({ size = 36 }: IconProps) {
  const uid = `kmTrash_${Math.round(size)}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`${uid}_body`} x1="24" y1="14" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D7DEE7" />
          <stop offset="1" stopColor="#9AA7B5" />
        </linearGradient>
        <linearGradient id={`${uid}_lid`} x1="24" y1="6" x2="24" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8EEF4" />
          <stop offset="1" stopColor="#B0BCC8" />
        </linearGradient>
      </defs>
      <rect x="8" y="7" width="32" height="5" rx="2.5" fill={`url(#${uid}_lid)`} />
      <rect x="20" y="4" width="8" height="4" rx="1.5" fill="#A8B4C0" />
      <path d="M11 14H37L35 41C34.9 42.7 33.5 44 31.8 44H16.2C14.5 44 13.1 42.7 13 41L11 14Z" fill={`url(#${uid}_body)`} />
      <line x1="18" y1="18" x2="17.5" y2="40" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="18" x2="24" y2="40" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="18" x2="30.5" y2="40" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M20.5 26.2c.6-1.4 2-2.3 3.5-2.3 1.2 0 2.3.5 3 1.4M27.5 30.8c-.6 1.4-2 2.3-3.5 2.3-1.2 0-2.3-.5-3-1.4"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Visual Studio Code ribbon — same silhouette as the Windows desktop shortcut.
 */
export function RealVsCodeIcon({ size = 36 }: IconProps) {
  const gid = `kmVsCode_${Math.round(size)}`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#41A5EE" />
          <stop offset="0.45" stopColor="#1F9CF0" />
          <stop offset="1" stopColor="#0078D4" />
        </linearGradient>
      </defs>
      {/* Classic VS Code “ribbon” path (simple-icons style) */}
      <path
        fill={`url(#${gid})`}
        d="M17.18 0L7.64 9.28 2.91 5.66 0 7.36v9.28l2.91 1.7 4.73-3.62L17.18 24 24 20.55V3.45L17.18 0zM2.91 14.82V9.18l3.18 2.82-3.18 2.82zm14.27 4.91L9.55 12l7.63-7.73v15.46z"
      />
    </svg>
  )
}

/** Windows text-document icon (Welcome.txt / notes.txt). */
export function RealTextFileIcon({ size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="kmDocPage" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E8EEF5" />
        </linearGradient>
        <linearGradient id="kmDocFold" x1="30" y1="4" x2="42" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D5DEE9" />
          <stop offset="1" stopColor="#B8C4D4" />
        </linearGradient>
      </defs>
      <path
        d="M10 6C10 4.895 10.895 4 12 4H30L40 14V42C40 43.105 39.105 44 38 44H12C10.895 44 10 43.105 10 42V6Z"
        fill="url(#kmDocPage)"
      />
      <path d="M30 4V12C30 13.105 30.895 14 32 14H40L30 4Z" fill="url(#kmDocFold)" />
      <rect x="10" y="4" width="20" height="9" rx="1" fill="#2B88D8" />
      <text x="14.5" y="10.5" fill="white" fontSize="5.8" fontWeight="700" fontFamily="Segoe UI, system-ui, sans-serif">
        TXT
      </text>
      <line x1="15" y1="20" x2="33" y2="20" stroke="#9AA7B8" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="25" x2="33" y2="25" stroke="#9AA7B8" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="30" x2="29" y2="30" stroke="#9AA7B8" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="35" x2="31" y2="35" stroke="#9AA7B8" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M10 6C10 4.895 10.895 4 12 4H30L40 14V42C40 43.105 39.105 44 38 44H12C10.895 44 10 43.105 10 42V6Z"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
    </svg>
  )
}

/** Generic code/file document for js/html/etc. */
export function RealCodeFileIcon({ size = 40, badge = 'JS', color = '#F7DF1E' }: IconProps & { badge?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10 6C10 4.895 10.895 4 12 4H30L40 14V42C40 43.105 39.105 44 38 44H12C10.895 44 10 43.105 10 42V6Z"
        fill="#F4F7FB"
      />
      <path d="M30 4V12C30 13.105 30.895 14 32 14H40L30 4Z" fill="#CDD6E2" />
      <rect x="14" y="28" width="20" height="10" rx="2" fill={color} />
      <text
        x="24"
        y="35.5"
        textAnchor="middle"
        fill="#111"
        fontSize="6"
        fontWeight="800"
        fontFamily="Segoe UI, system-ui, sans-serif"
      >
        {badge}
      </text>
      <line x1="15" y1="18" x2="28" y2="18" stroke="#A8B4C4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="23" x2="25" y2="23" stroke="#A8B4C4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function RealZipFileIcon({ size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M10 6C10 4.895 10.895 4 12 4H30L40 14V42C40 43.105 39.105 44 38 44H12C10.895 44 10 43.105 10 42V6Z"
        fill="#FFF8E7"
      />
      <path d="M30 4V12C30 13.105 30.895 14 32 14H40L30 4Z" fill="#E8C56A" />
      <rect x="21" y="8" width="6" height="4" fill="#5C4A1F" />
      <rect x="21" y="14" width="6" height="4" fill="#C9A227" />
      <rect x="21" y="20" width="6" height="4" fill="#5C4A1F" />
      <rect x="21" y="26" width="6" height="4" fill="#C9A227" />
      <rect x="18" y="32" width="12" height="8" rx="1.5" fill="#5C4A1F" />
      <text x="24" y="38" textAnchor="middle" fill="#FFE08A" fontSize="5.5" fontWeight="800" fontFamily="Segoe UI, system-ui, sans-serif">
        ZIP
      </text>
    </svg>
  )
}

export function RealFolderIconSmall({ size = 16 }: IconProps) {
  return <RealFolderIcon size={size} />
}

export function RealTrashIconSmall({ size = 16 }: IconProps) {
  return <RealTrashIcon size={size} />
}
