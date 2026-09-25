import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const Svg = ({ children, ...p }: P & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);

export const ChevronLeft = (p: P) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>;
export const ChevronUp = (p: P) => <Svg {...p}><path d="M18 15l-6-6-6 6" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const Plus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Minus = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const CalendarIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>
);
export const Trophy = (p: P) => (
  <Svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3" /></Svg>
);
export const Gear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </Svg>
);
export const Copy = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" /></Svg>
);
export const Trash = (p: P) => (
  <Svg {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></Svg>
);
export const Timer = (p: P) => (
  <Svg {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></Svg>
);
export const Memo = (p: P) => (
  <Svg {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></Svg>
);
export const History = (p: P) => (
  <Svg {...p}><path d="M3 3v5h5M3.1 13a9 9 0 102.2-7.4L3 8M12 7v5l3 3" /></Svg>
);
export const Eye = (p: P) => (
  <Svg {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const EyeOff = (p: P) => (
  <Svg {...p}><path d="M17.9 17.9A10 10 0 0112 19C5 19 1 12 1 12a18 18 0 015.1-5.9M9.9 5.2A9 9 0 0112 5c7 0 11 7 11 7a18 18 0 01-2.2 3.2M1 1l22 22" /></Svg>
);
