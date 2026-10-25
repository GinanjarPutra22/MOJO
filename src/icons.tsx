import type { ReactNode } from "react";

/** Ikon SVG buatan sendiri (tanpa library ikon). */
const Svg = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);
type P = { size?: number };

export const Hex = (p: P) => (
  <Svg {...p}>
    <path d="M12 2l8.7 5v10L12 22l-8.7-5V7L12 2zm0 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fillRule="evenodd" />
  </Svg>
);
export const Quote = (p: P) => (
  <Svg {...p}>
    <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
  </Svg>
);
export const Prev = (p: P) => (
  <Svg {...p}>
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </Svg>
);
export const Next = (p: P) => (
  <Svg {...p}>
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </Svg>
);
export const Play = (p: P) => (
  <Svg {...p}>
    <path d="M8 5v14l11-7z" />
  </Svg>
);
export const Pause = (p: P) => (
  <Svg {...p}>
    <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
  </Svg>
);
export const Volume = (p: P) => (
  <Svg {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.2v2.1a7 7 0 010 13.4v2.1a9 9 0 000-17.6z" />
  </Svg>
);
export const Mute = (p: P) => (
  <Svg {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3zm12.5 1.1l1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1z" />
  </Svg>
);
export const Note = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v10.6A4 4 0 1014 17V7h4V3h-6z" />
  </Svg>
);
export const Clock = (p: P) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="12" r="8" strokeWidth="3" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const Drop = (p: P) => (
  <Svg {...p}>
    <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />
  </Svg>
);
export const Caps = (p: P) => (
  <Svg {...p}>
    <path d="M12 3L3 13h5v4h8v-4h5L12 3zM8 19h8v2H8v-2z" />
  </Svg>
);
export const Battery = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h14v10H4V7zm15 3h2v4h-2v-4zM6 9v6h10V9H6z" fillRule="evenodd" />
  </Svg>
);
export const Bolt = (p: P) => (
  <Svg {...p}>
    <path d="M13 2L5 13.5h5L9 22l9-12h-5.5L13 2z" />
  </Svg>
);
export const Wifi = (p: P) => (
  <Svg {...p}>
    <path d="M12 18.5a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM12 12c-2.2 0-4.2.9-5.7 2.3l1.6 1.7A6.2 6.2 0 0112 14.3c1.6 0 3.1.6 4.2 1.7l1.6-1.7A8.6 8.6 0 0012 12zm0-5.5a14 14 0 00-10 4.1l1.6 1.7A11.7 11.7 0 0112 8.8c3.2 0 6.1 1.3 8.4 3.5l1.6-1.7A14 14 0 0012 6.5z" />
  </Svg>
);
export const Headphones = (p: P) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 00-9 9v7h5v-7H5a7 7 0 0114 0h-3v7h5v-7a9 9 0 00-9-9z" />
  </Svg>
);
export const Check = (p: P) => (
  <svg width={p.size ?? 10} height={p.size ?? 10} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" aria-hidden="true">
    <path d="M5 12l5 5 9-10" />
  </svg>
);
export const Pen = (p: P) => (
  <Svg {...p}>
    <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" />
  </Svg>
);
export const Cross = (p: P) => (
  <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
