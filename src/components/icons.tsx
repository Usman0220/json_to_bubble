import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (p: P) => {
  const { size = 16, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

export const IconLogo = ({ size = 22, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <circle cx="9" cy="10" r="5.5" stroke="#5eead4" strokeWidth="1.6" />
    <circle cx="16" cy="14.5" r="4" stroke="#fbbf24" strokeWidth="1.6" />
    <circle cx="12.5" cy="7" r="2.2" stroke="#60a5fa" strokeWidth="1.6" />
    <circle cx="9" cy="10" r="1.4" fill="#5eead4" />
    <circle cx="16" cy="14.5" r="1.1" fill="#fbbf24" />
  </svg>
);

export const IconBraces = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 4c-2 0-2.5 1-2.5 2.5v2C5.5 10 4.5 11 3 11v2c1.5 0 2.5 1 2.5 2.5v2C5.5 19 6 20 8 20" />
    <path d="M16 4c2 0 2.5 1 2.5 2.5v2c0 1.5 1 2.5 2.5 2.5v2c-1.5 0-2.5 1-2.5 2.5v2C18.5 19 18 20 16 20" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconWand = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 19 9.5-9.5M17 3l.9 2.1L20 6l-2.1.9L17 9l-.9-2.1L14 6l2.1-.9L17 3Z" />
    <path d="M7 4v3M5.5 5.5h3M19 14v3M17.5 15.5h3" />
  </svg>
);

export const IconOrbit = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.6 8.2c1.7 1 2.4 2.2 1.8 3.3-1 1.9-5.4 2.3-9.9 1S3.6 8.6 4.6 6.7c.6-1.1 2-1.5 3.9-1.3" />
    <path d="M8.5 19.8c-1.9.3-3.3-.1-3.9-1.2" />
  </svg>
);

export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7.5C4 5.6 5.6 4 7.5 4H20v12.5c0 1.9-1.6 3.5-3.5 3.5H4V7.5Z" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCrosshair = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.5V17M12 7.2v.2" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 9.5v5M12 17.4v.2" />
  </svg>
);

export const IconSliders = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
    <circle cx="15" cy="8" r="2" />
    <circle cx="9" cy="16" r="2" />
  </svg>
);

export const IconNodes = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.6" />
    <circle cx="18" cy="9" r="2.2" />
    <circle cx="10" cy="18" r="2.8" />
    <path d="m8.3 7.2 7.5 1.4M7 8.3l2.2 7.2M16.5 10.8l-4.8 5.4" />
  </svg>
);

export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.5 12.8 4.7a3.9 3.9 0 0 1 5.5 5.5L16.5 12" />
    <path d="M13 17.5l-1.8 1.8a3.9 3.9 0 0 1-5.5-5.5L7.5 12" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7M3.5 16.5 12 21.2l8.5-4.7" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconPanel = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </svg>
);

export const IconFocus = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
  </svg>
);

export const IconParticles = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 12c4-6.5 13-6.5 17 0" strokeDasharray="0.1 3.4" />
    <circle cx="7" cy="8.6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="13.5" cy="7.2" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
