export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded board background */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#4F46E5" />

      {/* Three kanban columns */}
      <rect x="6" y="7" width="5.5" height="18" rx="1.5" fill="#818CF8" opacity="0.6" />
      <rect x="13.25" y="7" width="5.5" height="18" rx="1.5" fill="#818CF8" opacity="0.6" />
      <rect x="20.5" y="7" width="5.5" height="18" rx="1.5" fill="#818CF8" opacity="0.6" />

      {/* Cards in columns — staggered to show kanban flow */}
      {/* Column 1: 2 cards */}
      <rect x="7" y="9" width="3.5" height="3" rx="0.75" fill="white" />
      <rect x="7" y="13.5" width="3.5" height="3" rx="0.75" fill="white" />

      {/* Column 2: 1 card (in progress) */}
      <rect x="14.25" y="9" width="3.5" height="3" rx="0.75" fill="#FCD34D" />

      {/* Column 3: 1 card (done) */}
      <rect x="21.5" y="9" width="3.5" height="3" rx="0.75" fill="#34D399" />

      {/* Vibe wave accent at bottom */}
      <path
        d="M6 22 C9 19, 11 25, 14 22 C17 19, 19 25, 22 22 C25 19, 27 24, 26 22"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
