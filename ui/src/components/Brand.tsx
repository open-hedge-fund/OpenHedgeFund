export function LogoIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#3C50E0" />
      <path
        d="M14 32V16l10 8-10 8ZM24 32V16l10 8-10 8Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function DotGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {Array.from({ length: 25 }, (_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        return (
          <circle
            key={i}
            cx={col * 28 + 8}
            cy={row * 28 + 8}
            r="3"
            fill="white"
          />
        );
      })}
    </svg>
  );
}
