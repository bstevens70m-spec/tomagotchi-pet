// Handles saving/loading the pet's state to localStorage, and figuring out
// how much its stats should have drifted while the tab was closed.

export const STORAGE_KEY = "tomagotchi-save-v1";

// One in-game "day" (tick) — must match the interval used in the live loop.
// 30 minutes of real time per in-game day: hunger drains fully in ~13 hours
// if the pet is left alone, so it wants attention a few times a day.
export const TICK_MS = 30 * 60 * 1000;

// Sleep runs on its own faster clock so a nap takes ~40 real minutes
// instead of hours: energy recovers per minute, with a small hunger/joy
// cost. Must match the live sleep loop and the offline math below.
export const SLEEP_TICK_MS = 60 * 1000;
export const SLEEP_ENERGY_PER_MIN = 2.5;
export const SLEEP_HUNGER_PER_MIN = 0.05;
export const SLEEP_JOY_PER_MIN = 0.025;

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — same storage caveats as saveState
  }
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

  let { hunger, energy, joy } = saved.stats;
  let age = saved.age;
  let asleep = saved.asleep;
  let mess = saved.mess;
  let wokeUp = false;
  let awakeTicks = 0;

  // Age tracks real time regardless of sleeping.
  age = age + Math.floor(elapsedMs / TICK_MS);

  if (asleep) {
    const minutesElapsed = Math.floor(elapsedMs / SLEEP_TICK_MS);
    const minutesToFull =
      energy >= 100 ? 0 : Math.ceil((100 - energy) / SLEEP_ENERGY_PER_MIN);
    const slept = Math.min(minutesElapsed, minutesToFull);

    energy = clamp(energy + SLEEP_ENERGY_PER_MIN * slept);
    hunger = clamp(hunger - SLEEP_HUNGER_PER_MIN * slept);
    joy = clamp(joy - SLEEP_JOY_PER_MIN * slept);

    if (minutesElapsed >= minutesToFull) {
      // Woke up partway through the absence; awake decay for the rest.
      asleep = false;
      wokeUp = true;
      const awakeMs = elapsedMs - minutesToFull * SLEEP_TICK_MS;
      awakeTicks = Math.floor(awakeMs / TICK_MS);
    }
  } else {
    awakeTicks = Math.floor(elapsedMs / TICK_MS);
  }

  if (awakeTicks > 0) {
    hunger = clamp(hunger - 3 * awakeTicks);
    energy = clamp(energy - 2 * awakeTicks);
    joy = clamp(joy - 2 * awakeTicks);

    const probAtLeastOneMess = 1 - Math.pow(0.88, awakeTicks);
    if (Math.random() < probAtLeastOneMess) mess = true;
  }

  return {
    stats: { hunger, energy, joy },
    age,
    asleep,
    mess,
    ticksPassed: Math.floor(elapsedMs / TICK_MS),
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
