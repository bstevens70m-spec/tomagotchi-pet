import React from "react";

// Flat storybook-style action icons with dark outlines (64x64 viewBox).
const INK = "#2A1712";
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };

export function BowlIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      {/* kibble */}
      {[
        [21, 30, 6],
        [43, 30, 6],
        [32, 25, 7],
        [27, 31, 5.5],
        [37, 31, 5.5],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#E2A24A" {...line} strokeWidth={2.5} />
      ))}
      {/* bowl */}
      <path d="M10 37 H54 L49.5 52 Q48.5 55 45.5 55 H18.5 Q15.5 55 14.5 52 Z" fill="#D9553B" {...line} />
      <rect x="7" y="33" width="50" height="7" rx="3.5" fill="#E8714F" {...line} />
      <path d="M20 46 H44" stroke="#F08A68" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BallIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="20" fill="#9BBF4E" {...line} />
      <path d="M18 19 Q30 32 18 45" fill="none" stroke="#F3EBD8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 19 Q34 32 46 45" fill="none" stroke="#F3EBD8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 17 Q28 15 32 15" fill="none" stroke="#C3DB82" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M29.8 15 A19 19 0 1 0 48.49 38.37 A15 15 0 0 1 29.8 15 Z"
        fill="#F0C64E"
        {...line}
      />
      <path d="M20 28 Q20 22 24 19" fill="none" stroke="#F8DE8C" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BrushIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(-18 32 32)">
        {/* bristles */}
        {[14, 20, 26, 32, 38, 44].map((x) => (
          <rect key={x} x={x} y="38" width="5" height="13" rx="1.5" fill="#F3EBD8" {...line} strokeWidth={2.5} />
        ))}
        {/* handle */}
        <path d="M38 30 L53 14" stroke={INK} strokeWidth="11" strokeLinecap="round" />
        <path d="M38 30 L53 14" stroke="#C98A5A" strokeWidth="6" strokeLinecap="round" />
        {/* wooden block */}
        <rect x="10" y="27" width="40" height="13" rx="6" fill="#C98A5A" {...line} />
        <path d="M16 32 H40" stroke="#DDA374" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
