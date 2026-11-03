import React from "react";
import windowMask from "./assets/window-mask.png";
import "./autumn-leaves.css";

// Autumn = September through November (northern hemisphere), following
// the player's real calendar like the rest of the game.
export function isAutumn(date = new Date()) {
  const m = date.getMonth();
  return m >= 8 && m <= 10;
}

// Pixel-art leaf sprites. X = leaf color, s = darker stem/vein.
const SPRITES = {
  maple: [
    "...X...",
    ".X.X.X.",
    ".XXXXX.",
    "XXXXXXX",
    ".XXsXX.",
    "..XsX..",
    "...s...",
  ],
  oval: [
    "...XX",
    "..XXX",
    ".XXXX",
    "XXsX.",
    "Xs...",
    "s....",
  ],
  round: [
    ".XX.",
    "XXXX",
    "XsXX",
    ".s..",
  ],
};

// Size of one leaf pixel in room units, close to the room art's pixels.
const PX = 1.4;

const LEAF_COLORS = ["#C2452D", "#D9732B", "#E8A33D", "#A8452A", "#8C5A2F", "#E3B341"];

// Each leaf crosses the window on its own path. The glass spans roughly
// x 76-203 of the 280-unit room, so paths are centered on it. Negative
// delays mean the breeze is already mid-flow when the page opens.
const LEAVES = [
  { sprite: "maple", color: 0, x0: 58, drift: 50, dur: 11, delay: -1, sway: 6, swayDur: 2.6, flipDur: 1.9 },
  { sprite: "oval", color: 2, x0: 104, drift: 45, dur: 9, delay: -6.5, sway: 4, swayDur: 2.1, flipDur: 1.4 },
  { sprite: "round", color: 4, x0: 145, drift: 40, dur: 12.5, delay: -3.5, sway: 5, swayDur: 3.0, flipDur: 2.3 },
  { sprite: "maple", color: 1, x0: 125, drift: 55, dur: 10, delay: -8.2, sway: 7, swayDur: 2.4, flipDur: 1.6 },
  { sprite: "oval", color: 3, x0: 82, drift: 45, dur: 13, delay: -10.5, sway: 4, swayDur: 2.9, flipDur: 2.0 },
  { sprite: "round", color: 5, x0: 165, drift: 35, dur: 9.5, delay: -2.4, sway: 5, swayDur: 2.2, flipDur: 1.3 },
  { sprite: "maple", color: 2, x0: 70, drift: 60, dur: 12, delay: -5.2, sway: 6, swayDur: 2.7, flipDur: 2.1 },
];

// Leaves are outside, so they pick up the scene's light.
const TINTS = {
  morning: { color: "#C8CCE6", amount: 0.18 },
  day: { color: "#FFFFFF", amount: 0 },
  evening: { color: "#8A3A62", amount: 0.22 },
  night: { color: "#161D33", amount: 0.58 },
};

function mix(hex, toHex, amount) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(toHex.slice(1), 16);
  const ch = (v, shift) => (v >> shift) & 255;
  const out = [16, 8, 0].map((s) =>
    Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * amount)
  );
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function LeafSprite({ rows, color }) {
  const stem = mix(color, "#2A140C", 0.45);
  const w = rows[0].length;
  const h = rows.length;
  const rects = [];
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === ".") return;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={(x - w / 2) * PX}
          y={(y - h / 2) * PX}
          width={PX + 0.05}
          height={PX + 0.05}
          fill={c === "s" ? stem : color}
        />
      );
    })
  );
  return <>{rects}</>;
}

// Rendered inside the room's <svg viewBox="0 0 280 280">, above the room
// image. The mask shows the leaves only through the window glass, so they
// pass behind the frame and dividers.
export default function AutumnLeaves({ timeOfDay }) {
  const tint = TINTS[timeOfDay] ?? TINTS.day;
  return (
    <>
      <defs>
        <mask id="window-glass" maskUnits="userSpaceOnUse" x="0" y="0" width="280" height="280">
          <image
            href={windowMask}
            x="0"
            y="0"
            width="280"
            height="280"
            style={{ imageRendering: "pixelated" }}
          />
        </mask>
      </defs>
      <g mask="url(#window-glass)">
        {LEAVES.map((leaf, i) => (
          <g
            key={i}
            className="leaf-fall"
            style={{
              "--x0": leaf.x0,
              "--drift": leaf.drift,
              animationDuration: `${leaf.dur}s`,
              animationDelay: `${leaf.delay}s`,
            }}
          >
            <g
              className="leaf-sway"
              style={{
                "--sway": leaf.sway,
                animationDuration: `${leaf.swayDur}s`,
                animationDelay: `${leaf.delay}s`,
              }}
            >
              <g
                className="leaf-flip"
                style={{ animationDuration: `${leaf.flipDur}s`, animationDelay: `${leaf.delay}s` }}
              >
                <LeafSprite
                  rows={SPRITES[leaf.sprite]}
                  color={mix(LEAF_COLORS[leaf.color], tint.color, tint.amount)}
                />
              </g>
            </g>
          </g>
        ))}
      </g>
    </>
  );
}
