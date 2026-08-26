function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-2.5 -1.5 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
        fill="black"
      />
      <path
        d="M2 13.2a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 13.2"
        stroke="black"
        strokeWidth={4.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 19.6a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 19.6"
        stroke="black"
        strokeWidth={4.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <div className="text-3xl font-extrabold tracking-tight">SIDEWALK</div>
    </div>
  );
}
