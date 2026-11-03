// The elevated train that runs across the neighborhood map. Everything is
// in the map image's own pixels (1890 x 832).
import { useEffect } from "react";
import trainSprite from "./assets/train.png";
import occluderSprite from "./assets/train-occluder.png";

export { trainSprite, occluderSprite };

export const TRAIN_SIZE = { w: 185, h: 116 };

// The building near the bottom of the map that the track runs behind;
// drawn on top of the train so it disappears behind it.
export const OCCLUDER = { x: 1031, y: 757, w: 131, h: 75 };

// Points along the rail the train rides on, measured from the map art.
const RAIL = [
  [-300, 66],
  [110, 279],
  [565, 515],
  [870, 667],
  [1400, 931],
];

// The sprite's top-left corner relative to the rail point under the
// train's middle (the train's original spot on the map art).
const OFFSET = [-92, -73.9];

// Where the train parks for players who prefer reduced motion: the spot
// it was drawn in.
export const PARKED = { x: 226, y: 313 };

const CYCLE_MS = 22000; // one trip plus a pause before the next train
const TRAVEL = 0.41; // share of the cycle spent crossing the map
const START_X = -110; // fully off the left edge
const END_X = 1360; // fully off the bottom edge

function railY(x) {
  for (let i = 1; i < RAIL.length; i++) {
    const [x0, y0] = RAIL[i - 1];
    const [x1, y1] = RAIL[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return RAIL[RAIL.length - 1][1];
}

// Keyframe stops: the train's top-left at each rail bend, timed so it
// moves at a steady speed, then holds off-screen for the pause.
const STOPS = (() => {
  const xs = [START_X, ...RAIL.map(([x]) => x).filter((x) => x > START_X && x < END_X), END_X];
  const pts = xs.map((x) => [x, railY(x)]);
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let run = 0;
  const stops = pts.map(([x, y], i) => {
    if (i > 0) run += lens[i - 1];
    return { x: x + OFFSET[0], y: y + OFFSET[1], offset: (run / total) * TRAVEL };
  });
  stops.push({ ...stops[stops.length - 1], offset: 1 });
  return stops;
})();

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Runs the train on `ref`'s element. `toStyle({x, y})` turns a map
// position into the CSS for one keyframe (left/top on the map, a
// transform on a close-up view).
export function useTrainAnimation(ref, toStyle, deps = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !el.animate) return;
    const anim = el.animate(
      STOPS.map(({ x, y, offset }) => ({ ...toStyle({ x, y }), offset })),
      { duration: CYCLE_MS, iterations: Infinity, delay: -1800, easing: "linear" }
    );
    return () => anim.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
