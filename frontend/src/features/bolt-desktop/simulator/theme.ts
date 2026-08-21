export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  mode: ThemeMode;
  bg: string;
  bgElevated: string;
  bgSurface: string;
  bgHover: string;
  bgActive: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  success: string;
  warning: string;
  error: string;
  desktop: string;
  taskbar: string;
  windowHeader: string;
  shadow: string;
  captionHover: string;
  closeHover: string;
}

export const darkTheme: ThemeTokens = {
  mode: 'dark',
  bg: '#202020',
  bgElevated: '#2c2c2c',
  bgSurface: '#1c1c1c',
  bgHover: 'rgba(255,255,255,0.08)',
  bgActive: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#ffffff',
  textMuted: '#cfcfcf',
  textSubtle: '#b3b3b3',
  accent: '#60cdff',
  accentHover: '#4cc2ff',
  accentSoft: 'rgba(96, 205, 255, 0.18)',
  success: '#6ccb5f',
  warning: '#fce100',
  error: '#ff99a4',
  desktop: '#000000',
  taskbar: 'rgba(32, 32, 32, 0.72)',
  windowHeader: '#202020',
  shadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
  captionHover: 'rgba(255,255,255,0.06)',
  closeHover: '#c42b1c',
};

export const lightTheme: ThemeTokens = {
  mode: 'light',
  bg: '#f2f2f2',
  bgElevated: '#ffffff',
  bgSurface: '#ffffff',
  bgHover: 'rgba(0,0,0,0.06)',
  bgActive: 'rgba(0,0,0,0.1)',
  border: 'rgba(0,0,0,0.14)',
  borderStrong: 'rgba(0,0,0,0.22)',
  text: '#1a1a1a',
  textMuted: '#3d3d3d',
  textSubtle: '#4a4a4a',
  accent: '#005fb8',
  accentHover: '#004e99',
  accentSoft: 'rgba(0, 95, 184, 0.14)',
  success: '#0f7b0f',
  warning: '#9d5d00',
  error: '#c42b1c',
  desktop: '#e8e8e8',
  taskbar: 'rgba(243, 243, 243, 0.94)',
  windowHeader: '#ffffff',
  shadow: '0 8px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08)',
  captionHover: 'rgba(0,0,0,0.06)',
  closeHover: '#c42b1c',
};

export const fileIcons: Record<string, { label: string; color: string }> = {
  txt: { label: 'TXT', color: '#94a3b8' },
  md: { label: 'MD', color: '#60a5fa' },
  json: { label: '{}', color: '#fbbf24' },
  py: { label: 'PY', color: '#34d399' },
  js: { label: 'JS', color: '#facc15' },
  html: { label: '<>', color: '#fb923c' },
  css: { label: 'CSS', color: '#38bdf8' },
  png: { label: 'IMG', color: '#a78bfa' },
  jpg: { label: 'IMG', color: '#a78bfa' },
  zip: { label: 'ZIP', color: '#f472b6' },
};
