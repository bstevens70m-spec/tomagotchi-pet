import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  loadSave,
  saveState,
  clearSave,
  applyOfflineDecay,
  formatDuration,
  TICK_MS,
  SLEEP_TICK_MS,
  SLEEP_ENERGY_PER_MIN,
  SLEEP_HUNGER_PER_MIN,
  SLEEP_JOY_PER_MIN,
} from "./persistence";
import catNeutral from "./assets/cat-neutral.png";
import catHappy from "./assets/cat-happy.png";
import catSad from "./assets/cat-sad.png";
import catSick from "./assets/cat-sick.png";
import catAsleep from "./assets/cat-asleep.png";
import roomMorning from "./assets/room-morning.png";
import roomDay from "./assets/room-day.png";
import roomEvening from "./assets/room-evening.png";
import roomNight from "./assets/room-night.png";
import AutumnLeaves, { isAutumn } from "./AutumnLeaves";
import { getTimeOfDay } from "./sky";
import { BowlIcon, BallIcon, MoonIcon, BrushIcon } from "./icons";
import leafIcon from "./assets/leaf-icon.png";

const CAT_SPRITES = {
  neutral: catNeutral,
  happy: catHappy,
  sad: catSad,
  sick: catSick,
  asleep: catAsleep,
};

// The room follows Chicago's real sunrise and sunset (see sky.js).
const ROOM_BACKGROUNDS = {
  morning: roomMorning,
  day: roomDay,
  evening: roomEvening,
  night: roomNight,
};

// All five sprites share the same 400x323 frame, so swapping moods
// never shifts the cat's position.
const SPRITE_ASPECT = 323 / 400;

// ---------- palette ----------
// Most of the look lives in leafkeep.css; these are the colors drawn
// inside the room's SVG and the per-stat bar colors.
const COLORS = {
  cream: "#F2E9D4", // sleeping "z"
  ink: "#2A1712", // mess blob
  mustard: "#F0C64E", // cooldown ring
  hunger: "#D9553B",
  energy: "#4E9E92",
  joy: "#EDC649",
};

// At 20 real minutes per in-game day, 72 in-game days pass per real day:
// hatchling for its first real day, sprout through days 2-3, elder from
// day 4 on.
const STAGES = [
  { name: "hatchling", minAge: 0, size: 0.62 },
  { name: "sprout", minAge: 72, size: 0.8 },
  { name: "elder", minAge: 216, size: 1 },
];

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function getStage(age) {
  let s = STAGES[0];
  for (const st of STAGES) if (age >= st.minAge) s = st;
  return s;
}

function getMood(stats, asleep) {
  if (asleep) return "asleep";
  if (stats.hunger < 20 || stats.energy < 15) return "sick";
  const avg = (stats.hunger + stats.energy + stats.joy) / 3;
  if (avg >= 70) return "happy";
  if (avg >= 40) return "neutral";
  return "sad";
}

// ---------- creature (pixel-art cat sprites) ----------
function Creature({ mood, stage, bump }) {
  const src = CAT_SPRITES[mood] ?? CAT_SPRITES.neutral;
  const w = 150 * stage.size;
  const h = w * SPRITE_ASPECT;

  return (
    <g
      transform={bump ? "translate(0,-6)" : undefined}
      style={{ transition: "transform 220ms ease" }}
    >
      <image
        href={src}
        x={140 - w / 2}
        y={232 - h}
        width={w}
        height={h}
        style={{ imageRendering: "pixelated" }}
      />
      {mood === "asleep" && (
        <text
          x={140 + w / 2}
          y={232 - h}
          fontSize="20"
          fontWeight="800"
          fill={COLORS.cream}
          stroke={COLORS.ink}
          strokeWidth="3.5"
          paintOrder="stroke"
          strokeLinejoin="round"
          fontFamily="'Fraunces Variable', Georgia, serif"
        >
          z
        </text>
      )}
    </g>
  );
}

// ---------- stat bar ----------
function Gauge({ label, value, color }) {
  const pct = clamp(value);
  return (
    <div className="lk-stat">
      <span className="lk-stat-label">{label}</span>
      <div
        className="lk-bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        title={`${label}: ${Math.round(pct)}`}
      >
        <div className="lk-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ---------- round icon button ----------
function ActionButton({ label, icon: Icon, onClick, disabled, active, cooldownPct }) {
  // cooldown ring: unwinds from full to empty as the cooldown runs out
  const r = 46;
  const circ = 2 * Math.PI * r;
  return (
    <button
      type="button"
      className={`lk-btn${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon />
      {cooldownPct > 0 && (
        <svg className="lk-cooldown" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={COLORS.mustard}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(cooldownPct / 100) * circ} ${circ}`}
          />
        </svg>
      )}
    </button>
  );
}

// Figures out what the pet's state should be on first render: either a
// fresh hatchling, or a saved pet fast-forwarded for the time we were away.
function getInitialState() {
  const fresh = {
    stats: { hunger: 80, energy: 80, joy: 80 },
    age: 0,
    asleep: false,
    mess: false,
    log: "Your creature blinks awake for the first time.",
  };

  const saved = loadSave();
  if (!saved) return fresh;

  const result = applyOfflineDecay(saved);
  let log = saved.log || fresh.log;
  if (result.ticksPassed > 0 || result.elapsedMs >= 10 * 60 * 1000) {
    const away = formatDuration(result.elapsedMs);
    log = result.wokeUp
      ? `Welcome back! You were away ${away} — your creature woke up partway through.`
      : `Welcome back! You were away ${away}.`;
  }

  return {
    stats: result.stats,
    age: result.age,
    asleep: result.asleep,
    mess: result.mess,
    log,
  };
}

export default function TamagotchiApp() {
  const [initial] = useState(getInitialState);
  const [stats, setStats] = useState(initial.stats);
  const [age, setAge] = useState(initial.age); // "days" — each tick = 1 in-game day
  const [asleep, setAsleep] = useState(initial.asleep);
  const [bump, setBump] = useState(false);
  const [cooldowns, setCooldowns] = useState({ feed: 0, play: 0, clean: 0 });
  const [log, setLog] = useState(initial.log);
  const [mess, setMess] = useState(initial.mess);
  const [confirmReset, setConfirmReset] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const [autumn, setAutumn] = useState(isAutumn);
  const tickRef = useRef(null);

  // swap the room's lighting when the player's clock crosses a boundary
  // (and bring the leaves in or out when the season changes)
  useEffect(() => {
    const t = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
      setAutumn(isAutumn());
    }, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const stage = getStage(age);
  const mood = getMood(stats, asleep);
  // `age` counts in-game days (one per TICK_MS); the badge shows the cat's
  // age in real days, starting at Day 01.
  const realDay = Math.floor((age * TICK_MS) / (24 * 60 * 60 * 1000)) + 1;

  const doBump = useCallback(() => {
    setBump(true);
    setTimeout(() => setBump(false), 220);
  }, []);

  // Persist to localStorage whenever the pet's state changes, so it
  // survives closing the tab or the browser.
  useEffect(() => {
    saveState({ stats, age, asleep, mess, log });
  }, [stats, age, asleep, mess, log]);

  // Also save right before the tab actually closes/hides, as a safety net.
  useEffect(() => {
    const handler = () => saveState({ stats, age, asleep, mess, log });
    window.addEventListener("pagehide", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("pagehide", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [stats, age, asleep, mess, log]);

  // main decay loop — one tick roughly = one in-game day.
  // Awake decay only; sleep recovery runs on its own faster loop below.
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setAge((a) => a + 1);
      if (!asleep) {
        setStats((s) => ({
          hunger: clamp(s.hunger - 3),
          energy: clamp(s.energy - 2),
          joy: clamp(s.joy - 2),
        }));
        if (Math.random() < 0.12) setMess(true);
      }
    }, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [asleep]);

  // sleep loop — a nap recovers energy by the minute (~40 min from empty)
  useEffect(() => {
    if (!asleep) return;
    const t = setInterval(() => {
      setStats((s) => ({
        hunger: clamp(s.hunger - SLEEP_HUNGER_PER_MIN),
        energy: clamp(s.energy + SLEEP_ENERGY_PER_MIN),
        joy: clamp(s.joy - SLEEP_JOY_PER_MIN),
      }));
    }, SLEEP_TICK_MS);
    return () => clearInterval(t);
  }, [asleep]);

  // cooldown ticker
  useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((c) => ({
        feed: Math.max(0, c.feed - 5),
        play: Math.max(0, c.play - 5),
        clean: Math.max(0, c.clean - 5),
      }));
    }, 150);
    return () => clearInterval(t);
  }, []);

  // auto-wake once energy is full
  useEffect(() => {
    if (asleep && stats.energy >= 100) {
      setAsleep(false);
      setLog("Your creature wakes up refreshed.");
    }
  }, [stats.energy, asleep]);

  function feed() {
    if (asleep || cooldowns.feed > 0) return;
    setStats((s) => ({ ...s, hunger: clamp(s.hunger + 22) }));
    setCooldowns((c) => ({ ...c, feed: 100 }));
    setLog("You offer a little snack. Munch munch.");
    doBump();
  }

  function play() {
    if (asleep || cooldowns.play > 0) return;
    setStats((s) => ({ ...s, joy: clamp(s.joy + 20), energy: clamp(s.energy - 8) }));
    setCooldowns((c) => ({ ...c, play: 100 }));
    setLog("A quick game together. Tail wags.");
    doBump();
  }

  function rest() {
    if (asleep) return;
    setAsleep(true);
    setLog("Your creature curls up for a nap.");
  }

  function clean() {
    if (cooldowns.clean > 0) return;
    setMess(false);
    setStats((s) => ({ ...s, joy: clamp(s.joy + 6) }));
    setCooldowns((c) => ({ ...c, clean: 100 }));
    setLog("Tidied up the little corner.");
  }

  function startOver() {
    if (!confirmReset) {
      setConfirmReset(true);
      // back out automatically if they don't confirm within a few seconds
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearSave();
    setStats({ hunger: 80, energy: 80, joy: 80 });
    setAge(0);
    setAsleep(false);
    setMess(false);
    setCooldowns({ feed: 0, play: 0, clean: 0 });
    setLog("A brand-new creature blinks awake for the first time.");
    setConfirmReset(false);
  }

  return (
    <main className="lk">
      <header className="lk-card lk-header">
        <img src={leafIcon} alt="" />
        <h1 className="lk-title">Leafkeep</h1>
        <div className="lk-day" title={`${stage.name}, ${realDay === 1 ? "first day" : `day ${realDay}`}`}>
          Day {String(realDay).padStart(2, "0")}
        </div>
      </header>

      {/* the room, framed like a storybook illustration */}
      <div className="lk-scene">
        <svg viewBox="0 0 280 280">
          <image
            href={ROOM_BACKGROUNDS[timeOfDay]}
            x="0"
            y="0"
            width="280"
            height="280"
            style={{ imageRendering: "pixelated" }}
          />
          {autumn && <AutumnLeaves timeOfDay={timeOfDay} />}
          {mess && <ellipse cx="205" cy="228" rx="16" ry="6" fill={COLORS.ink} opacity="0.45" />}
          <Creature mood={mood} stage={stage} bump={bump} />
        </svg>
      </div>

      <section className="lk-card lk-panel">
        <Gauge label="Hunger" value={stats.hunger} color={COLORS.hunger} />
        <Gauge label="Energy" value={stats.energy} color={COLORS.energy} />
        <Gauge label="Joy" value={stats.joy} color={COLORS.joy} />

        <div className="lk-actions">
          <ActionButton
            label="Feed"
            icon={BowlIcon}
            onClick={feed}
            disabled={asleep || cooldowns.feed > 0}
            cooldownPct={cooldowns.feed}
          />
          <ActionButton
            label="Play"
            icon={BallIcon}
            onClick={play}
            disabled={asleep || cooldowns.play > 0}
            cooldownPct={cooldowns.play}
          />
          <ActionButton
            label={asleep ? "Sleeping…" : "Rest"}
            icon={MoonIcon}
            onClick={rest}
            disabled={asleep}
            active={asleep}
          />
          <ActionButton
            label="Clean"
            icon={BrushIcon}
            onClick={clean}
            disabled={cooldowns.clean > 0}
            cooldownPct={cooldowns.clean}
          />
        </div>
      </section>

      <footer className="lk-footer">
        <button
          type="button"
          className={`lk-reset${confirmReset ? " is-confirming" : ""}`}
          onClick={startOver}
        >
          {confirmReset
            ? "really start over? your creature will be gone — click again to confirm"
            : "start over"}
        </button>
      </footer>
    </main>
  );
}
