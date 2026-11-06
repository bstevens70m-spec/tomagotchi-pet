import React from "react";
import windowMask from "./assets/window-mask.png";
import maple from "./assets/leaves/maple.png";
import oak from "./assets/leaves/oak.png";
import ginkgo from "./assets/leaves/ginkgo.png";
import elm from "./assets/leaves/elm.png";
import redbud from "./assets/leaves/redbud.png";
import beech from "./assets/leaves/beech.png";
import birch from "./assets/leaves/birch.png";
import sweetgum from "./assets/leaves/sweetgum.png";
import { chicagoMonth } from "./sky";
import "./autumn-leaves.css";

// Autumn = September through November on Chicago's calendar, where the
// cat's room is.
export function isAutumn(date = new Date()) {
  const m = chicagoMonth(date);
  return m >= 8 && m <= 10;
}

// The player's leaf sprites, redrawn on a small pixel grid so they stay
// crisp at in-game size. w/h are each sprite's size in pixels; one shared
// scale keeps the leaves' relative sizes from the original sheet.
const SPRITES = {
  maple: { src: maple, w: 17, h: 18 },
  oak: { src: oak, w: 14, h: 17 },
  ginkgo: { src: ginkgo, w: 18, h: 16 },
  elm: { src: elm, w: 14, h: 17 },
  redbud: { src: redbud, w: 15, h: 16 },
  beech: { src: beech, w: 14, h: 17 },
  birch: { src: birch, w: 14, h: 18 },
  sweetgum: { src: sweetgum, w: 18, h: 17 },
};

// Size of one sprite pixel in room units.
const PX = 0.75;

// Each leaf crosses the window on its own path. The glass spans roughly
// x 76-203 of the 280-unit room, so paths are centered on it. Negative
// delays mean the breeze is already mid-flow when the page opens.
const LEAVES = [
  { sprite: "maple", x0: 58, drift: 50, dur: 11, delay: -1, sway: 6, swayDur: 2.6, flipDur: 1.9 },
  { sprite: "ginkgo", x0: 104, drift: 45, dur: 9, delay: -6.5, sway: 4, swayDur: 2.1, flipDur: 1.4 },
  { sprite: "beech", x0: 145, drift: 40, dur: 12.5, delay: -3.5, sway: 5, swayDur: 3.0, flipDur: 2.3 },
  { sprite: "oak", x0: 125, drift: 55, dur: 10, delay: -8.2, sway: 7, swayDur: 2.4, flipDur: 1.6 },
  { sprite: "redbud", x0: 82, drift: 45, dur: 13, delay: -10.5, sway: 4, swayDur: 2.9, flipDur: 2.0 },
  { sprite: "birch", x0: 165, drift: 35, dur: 9.5, delay: -2.4, sway: 5, swayDur: 2.2, flipDur: 1.3 },
  { sprite: "sweetgum", x0: 70, drift: 60, dur: 12, delay: -5.2, sway: 6, swayDur: 2.7, flipDur: 2.1 },
  { sprite: "elm", x0: 112, drift: 50, dur: 11.5, delay: -9.5, sway: 5, swayDur: 2.5, flipDur: 1.7 },
];

// Outdoors there's no window, so the leaves use the whole 280-wide frame:
// they fall from just above the top to just below the bottom, some drift
// in from off-screen, and gusts carry a few out past the left and right
// edges partway down.
const OUTDOOR_LEAVES = [
  { sprite: "maple", x0: 15, drift: 70, dur: 11, delay: -2, sway: 6, swayDur: 2.6, flipDur: 1.9 },
  { sprite: "ginkgo", x0: 60, drift: 95, dur: 9.5, delay: -7, sway: 4, swayDur: 2.1, flipDur: 1.4 },
  { sprite: "beech", x0: 110, drift: 85, dur: 12.5, delay: -4.5, sway: 5, swayDur: 3.0, flipDur: 2.3 },
  { sprite: "oak", x0: 165, drift: 90, dur: 10.5, delay: -9, sway: 7, swayDur: 2.4, flipDur: 1.6 },
  { sprite: "redbud", x0: 230, drift: 70, dur: 13, delay: -1, sway: 4, swayDur: 2.9, flipDur: 2.0 },
  { sprite: "beech", x0: 255, drift: 40, dur: 12, delay: -6.5, sway: 5, swayDur: 2.8, flipDur: 2.2 },
  // drifting in from off the left edge
  { sprite: "birch", x0: -30, drift: 120, dur: 10, delay: -3.5, sway: 5, swayDur: 2.2, flipDur: 1.3 },
  { sprite: "ginkgo", x0: -60, drift: 200, dur: 12, delay: -10, sway: 6, swayDur: 2.5, flipDur: 1.8 },
  // gusts: blown out past the right edge partway down
  { sprite: "sweetgum", x0: 150, drift: 210, dur: 9, delay: -5.5, sway: 6, swayDur: 2.7, flipDur: 2.1 },
  { sprite: "maple", x0: 200, drift: 190, dur: 8.5, delay: -0.5, sway: 5, swayDur: 2.3, flipDur: 1.5 },
  // ...and out past the left edge
  { sprite: "elm", x0: 100, drift: -170, dur: 10.5, delay: -8, sway: 5, swayDur: 2.5, flipDur: 1.7 },
  { sprite: "oak", x0: 45, drift: -130, dur: 11, delay: -3, sway: 6, swayDur: 2.6, flipDur: 1.9 },
];

// Leaves are outside, so they pick up the scene's light: each color is
// mixed toward the tint by `amount`.
const TINTS = {
  morning: { color: [200, 204, 230], amount: 0.18 },
  day: { color: [255, 255, 255], amount: 0 },
  evening: { color: [138, 58, 98], amount: 0.22 },
  night: { color: [22, 29, 51], amount: 0.58 },
};

function tintMatrix({ color, amount: a }) {
  const [r, g, b] = color.map((c) => ((c / 255) * a).toFixed(4));
  const k = (1 - a).toFixed(4);
  return `${k} 0 0 0 ${r}  0 ${k} 0 0 ${g}  0 0 ${k} 0 ${b}  0 0 0 1 0`;
}

// Rendered inside the room's <svg viewBox="0 0 280 280">, above the room
// image. The mask shows the leaves only through the window glass, so they
// pass behind the frame and dividers.
// With `outdoors`, there's no window: leaves fall over the whole scene.
export default function AutumnLeaves({ timeOfDay, outdoors = false }) {
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
        <filter
          id="leaf-tint"
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="280"
          height="280"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix type="matrix" values={tintMatrix(tint)} />
        </filter>
      </defs>
      <g
        mask={outdoors ? undefined : "url(#window-glass)"}
        filter={tint.amount > 0 ? "url(#leaf-tint)" : undefined}
        style={outdoors ? { "--y0": "-12px", "--y1": "292px" } : undefined}
      >
        {(outdoors ? OUTDOOR_LEAVES : LEAVES).map((leaf, i) => {
          const s = SPRITES[leaf.sprite];
          const w = s.w * PX;
          const h = s.h * PX;
          return (
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
                  <image
                    href={s.src}
                    x={-w / 2}
                    y={-h / 2}
                    width={w}
                    height={h}
                    style={{ imageRendering: "pixelated" }}
                  />
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </>
  );
}
