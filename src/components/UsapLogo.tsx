import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const UsapLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconDimensions = {
    sm: { w: 32, h: 32 },
    md: { w: 46, h: 46 },
    lg: { w: 68, h: 68 },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Exact Visual Replication of USAP Community School Emblem */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Open Book Pages at Base (Double teal strokes) */}
        {/* Outer book line */}
        <path
          d="M10 65 V88 C32 102, 54 94, 60 92 C66 94, 88 102, 110 88 V65"
          stroke="#47807d"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner book line */}
        <path
          d="M15 72 V92 C34 104, 54 98, 60 96 C66 98, 86 104, 105 92 V72"
          stroke="#558f8b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Open Book spine center */}
        <path d="M60 92 V96" stroke="#47807d" strokeWidth="3" />

        {/* Tree Trunk growing from book spine */}
        <path
          d="M58 92 C58 75, 59 45, 60 22 C61 45, 62 75, 62 92 Z"
          fill="#1e2229"
        />

        {/* Pair 1 (Bottom Leaves) */}
        <path
          d="M60 76 C42 74, 25 64, 20 48 C36 46, 52 58, 60 76 Z"
          fill="#47807d"
        />
        <path
          d="M60 76 C78 74, 95 64, 100 48 C84 46, 68 58, 60 76 Z"
          fill="#47807d"
        />

        {/* Pair 2 (Middle Leaves) */}
        <path
          d="M60 56 C44 54, 32 44, 34 32 C48 32, 56 42, 60 56 Z"
          fill="#538f8b"
        />
        <path
          d="M60 56 C76 54, 88 44, 86 32 C72 32, 64 42, 60 56 Z"
          fill="#538f8b"
        />

        {/* Pair 3 (Top Leaves) */}
        <path
          d="M60 38 C50 36, 42 26, 44 16 C54 18, 58 26, 60 38 Z"
          fill="#629e9a"
        />
        <path
          d="M60 38 C70 36, 78 26, 76 16 C66 18, 62 26, 60 38 Z"
          fill="#629e9a"
        />

        {/* Bird perched on top of branch (facing left) */}
        <g transform="translate(48, 6)">
          {/* Bird Body & Tail */}
          <path
            d="M12 16 L2 18 C3 14, 5 12, 8 10 C11 8, 14 6, 17 8 C20 10, 19 14, 15 15 L22 20 L16 19 L12 16 Z"
            fill="#1e2229"
          />
          {/* Head & Beak */}
          <circle cx="9" cy="8" r="2.8" fill="#1e2229" />
          <path d="M7 8 L2 9 L7 10 Z" fill="#1e2229" />
          {/* Bird feet on perch */}
          <line x1="12" y1="16" x2="12" y2="18" stroke="#1e2229" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Typography from Logo */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div
            className={`font-serif font-black tracking-tight text-slate-900 leading-none ${
              size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl'
            }`}
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            USAP
          </div>
          <div
            className={`font-sans tracking-normal text-slate-700 font-medium leading-tight ${
              size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-xs' : 'text-sm'
            }`}
          >
            Community School
          </div>
        </div>
      )}
    </div>
  );
};
