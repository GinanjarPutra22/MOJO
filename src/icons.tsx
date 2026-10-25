import type { ReactNode } from "react";

/** Ikon SVG buatan sendiri (tanpa library ikon). */
const Svg = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);
type P = { size?: number };

export const Gear = (p: P) => (
  <Svg {...p}>
    <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Zm0 6.3a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" fillRule="evenodd" />
  </Svg>
);
export const Back = (p: P) => (
  <Svg {...p}>
    <path d="M15.5 4.5 8 12l7.5 7.5 1.5-1.5L11 12l6-6-1.5-1.5Z" />
  </Svg>
);
export const Quote = (p: P) => (
  <Svg {...p}>
    <path d="M3 5h7v7c0 4-2 6.5-6 7v-2.5c2-.5 3-1.8 3-3.500H3V5Zm11 0h7v7c0 4-2 6.5-6 7v-2.500c2-.500 3-1.8 3-3.500h-4V5Z" />
  </Svg>
);
export const Prev = (p: P) => (
  <Svg {...p}>
    <path d="M6 5h2v14H6V5Zm12 0v14L9.5 12 18 5Z" />
  </Svg>
);
export const Next = (p: P) => (
  <Svg {...p}>
    <path d="M16 5h2v14h-2V5ZM6 5l8.5 7L6 19V5Z" />
  </Svg>
);
export const Play = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.500v15l13-7.5-13-7.500Z" />
  </Svg>
);
export const Pause = (p: P) => (
  <Svg {...p}>
    <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z" />
  </Svg>
);
export const Volume = (p: P) => (
  <Svg {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3Zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4ZM14 3.200v2.100a7 7 0 0 1 0 13.400v2.100a9 9 0 0 0 0-17.600Z" />
  </Svg>
);
export const Mute = (p: P) => (
  <Svg {...p}>
    <path d="M3 9v6h4l5 4V5L7 9H3Zm12.5 1.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.100Z" />
  </Svg>
);
export const Bars = (p: P) => (
  <Svg {...p}>
    <path d="M3 10h2v4H3v-4Zm4-4h2v12H7V6Zm4-3h2v18h-2V3Zm4 5h2v8h-2V8Zm4 2h2v4h-2v-4Z" />
  </Svg>
);
export const Note = (p: P) => (
  <Svg {...p}>
    <path d="M9 3v11.300A3.5 3.5 0 1 0 11 17.500V8h6V3H9Z" />
  </Svg>
);
export const Caps = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 3 13h5v4h8v-4h5L12 3ZM8 19h8v2H8v-2Z" />
  </Svg>
);
export const Battery = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h14v10H4V7Zm15 3h2v4h-2v-4ZM6 9v6h10V9H6Z" fillRule="evenodd" />
  </Svg>
);
export const Bolt = (p: P) => (
  <Svg {...p}>
    <path d="M13 2 5 13.500h5L9 22l9-12h-5.500L13 2Z" />
  </Svg>
);
export const Wifi = (p: P) => (
  <Svg {...p}>
    <path d="M12 18.500a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.600ZM12 12c-2.2 0-4.2.9-5.7 2.300l1.6 1.700A6.2 6.2 0 0 1 12 14.300c1.6 0 3.1.6 4.2 1.700l1.6-1.700A8.6 8.6 0 0 0 12 12Zm0-5.500a14 14 0 0 0-10 4.100l1.6 1.700A11.7 11.7 0 0 1 12 8.800c3.2 0 6.1 1.3 8.4 3.500l1.6-1.700A14 14 0 0 0 12 6.500Z" />
  </Svg>
);
export const Headphones = (p: P) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 0 0-9 9v7h5v-7H5a7 7 0 0 1 14 0h-3v7h5v-7a9 9 0 0 0-9-9Z" />
  </Svg>
);
export const Check = (p: P) => (
  <Svg {...p}>
    <path d="m9 16.2-3.5-3.500L4 14.200l5 5 11-11-1.5-1.500L9 16.200Z" />
  </Svg>
);
export const Close = (p: P) => (
  <Svg {...p}>
    <path d="m6.4 5 5.6 5.600L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.600L6.4 19 5 17.600l5.6-5.600L5 6.4 6.4 5Z" />
  </Svg>
);
export const Timer = (p: P) => (
  <Svg {...p}>
    <path d="M9 2h6v2H9V2Zm3 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-1 3h2v4.600l3 1.8-1 1.7-4-2.400V9Z" />
  </Svg>
);
