// Handles saving/loading the pet's state to localStorage, and figuring out
// how much its stats should have drifted while the tab was closed.

export const STORAGE_KEY = "tomagotchi-save-v1";

// One in-game "day" (tick) — must match the interval used in the live loop.
// 1 hour of real time per in-game day: hunger/energy/joy drain over roughly
// a day if the pet is left alone, so checking in once or twice a day keeps
// it healthy.
export const TICK_MS = 60 * 60 * 1000;

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState({ stats, age, asleep, mess, log }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        stats,
        age,
        asleep,
        mess,
        log,
        lastUpdated: Date.now(),
      })
    );
  } catch {
    // localStorage can fail in private-browsing/storage-full situations —
    // the game still works, it just won't remember between visits.
  }
}

// Given a saved snapshot and the real time that has passed since it was
// written, fast-forward the pet's stats to where they'd be "now" — without
// looping tick-by-tick (which could be thousands of iterations after a
// long absence). Decay is linear per tick, so a closed-form calculation
// gives the same result.
export function applyOfflineDecay(saved, nowMs = Date.now()) {
  const elapsedMs = Math.max(0, nowMs - saved.lastUpdated);
  const ticks = Math.floor(elapsedMs / TICK_MS);

  let { hunger, energy, joy } = saved.stats;
  let age = saved.age;
  let asleep = saved.asleep;
  let mess = saved.mess;
  let wokeUp = false;
  let awakeTicks = 0;

  if (ticks > 0) {
    if (!asleep) {
      hunger = clamp(hunger - 3 * ticks);
      energy = clamp(energy - 2 * ticks);
      joy = clamp(joy - 2 * ticks);
      age = age + ticks;
      awakeTicks = ticks;
    } else {
      const ticksToFull = energy >= 100 ? 0 : Math.ceil((100 - energy) / 6);
      if (ticks < ticksToFull) {
        // Slept the entire time away.
        energy = clamp(energy + 6 * ticks);
        hunger = clamp(hunger - 1 * ticks);
        joy = clamp(joy - 0.5 * ticks);
        age = age + ticks;
      } else {
        // Finished sleeping partway through, then drifted awake for the rest.
        const remaining = ticks - ticksToFull;
        energy = clamp(energy + 6 * ticksToFull);
        hunger = clamp(hunger - 1 * ticksToFull);
        joy = clamp(joy - 0.5 * ticksToFull);
        age = age + ticksToFull;

        hunger = clamp(hunger - 3 * remaining);
        energy = clamp(energy - 2 * remaining);
        joy = clamp(joy - 2 * remaining);
        age = age + remaining;

        asleep = false;
        wokeUp = true;
        awakeTicks = remaining;
      }
    }
  }

  if (awakeTicks > 0) {
    const probAtLeastOneMess = 1 - Math.pow(0.88, awakeTicks);
    if (Math.random() < probAtLeastOneMess) mess = true;
  }

  return {
    stats: { hunger, energy, joy },
    age,
    asleep,
    mess,
    ticksPassed: ticks,
    elapsedMs,
    wokeUp,
  };
}

export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "a few moments";
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (days === 0 && hours === 0) parts.push(`${mins} minute${mins === 1 ? "" : "s"}`);

  return parts.slice(0, 2).join(", ");
}
