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

const CAT_SPRITES = {
  neutral: catNeutral,
  happy: catHappy,
  sad: catSad,
  sick: catSick,
  asleep: catAsleep,
};

// The room follows the player's real clock.
const ROOM_BACKGROUNDS = {
  morning: roomMorning,
  day: roomDay,
  evening: roomEvening,
  night: roomNight,
};

function getTimeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// All five sprites share the same 400x323 frame, so swapping moods
// never shifts the cat's position.
const SPRITE_ASPECT = 323 / 400;

// ---------- palette ----------
// Soft Navy / Lime Signal / Calm Mint / Cool Charcoal / Off White
const COLORS = {
  navy: "#1F2A44", // frame, buttons
  navyLight: "#31436B", // frame gradient top
  lime: "#E1FF7C", // signal accent: rivets, cooldowns, mid gauges
  mint: "#4AD1B0", // window bezel, healthy gauges
  mintDark: "#2E9B80",
  charcoal: "#2E2E2E", // borders, button shadows
  offWhite: "#DBDBDB", // cards, light text
  offWhiteDark: "#C4C4C4", // window fallback, gauge tracks
  inkSoft: "#4A5568", // secondary text on light cards
  alert: "#B0473F", // low-stat warning (kept from the old palette)
};

// At 30 real minutes per in-game day, 48 in-game days pass per real day:
// hatchling for its first real day, sprout through days 2-3, elder from
// day 4 on.
const STAGES = [
  { name: "hatchling", minAge: 0, size: 0.62 },
  { name: "sprout", minAge: 48, size: 0.8 },
  { name: "elder", minAge: 144, size: 1 },
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
          fontSize="16"
          fill={COLORS.offWhite}
          fontFamily="Georgia, serif"
        >
          z
        </text>
      )}
    </g>
  );
}

// ---------- stat gauge ----------
function Gauge({ label, value, icon }) {
  const pct = clamp(value);
  const color = pct < 25 ? COLORS.alert : pct < 55 ? COLORS.lime : COLORS.mint;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: COLORS.inkSoft,
          marginBottom: 4,
          fontFamily: "'Trebuchet MS', sans-serif",
        }}
      >
        <span>{icon} {label}</span>
        <span>{Math.round(pct)}</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: COLORS.offWhiteDark,
          border: `1px solid ${COLORS.inkSoft}55`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 400ms ease, background 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

// ---------- action button ----------
function ActionButton({ label, onClick, disabled, cooldownPct }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "relative",
        overflow: "hidden",
        flex: 1,
        padding: "10px 6px",
        fontSize: 13,
        fontFamily: "'Trebuchet MS', sans-serif",
        letterSpacing: "0.02em",
        color: disabled ? "#7A8290" : COLORS.offWhite,
        background: disabled ? "#9FA6B2" : COLORS.navyLight,
        border: `1px solid ${COLORS.charcoal}`,
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 0 " + COLORS.charcoal,
        transform: "translateY(0)",
        transition: "transform 80ms ease, box-shadow 80ms ease",
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "translateY(2px)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {label}
      {disabled && cooldownPct != null && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 3,
            width: `${cooldownPct}%`,
            background: COLORS.lime,
          }}
        />
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
  const tickRef = useRef(null);

  // swap the room's lighting when the player's clock crosses a boundary
  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const stage = getStage(age);
  const mood = getMood(stats, asleep);

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

  const moodLabel = {
    happy: "content",
    neutral: "doing fine",
    sad: "a little low",
    sick: "unwell",
    asleep: "sleeping",
  }[mood];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 380,
        margin: "0 auto",
        fontFamily: "'Trebuchet MS', sans-serif",
        color: COLORS.charcoal,
      }}
    >
      {/* navy shadow-box frame */}
      <div
        style={{
          background: `linear-gradient(180deg, ${COLORS.navyLight}, ${COLORS.navy})`,
          borderRadius: 18,
          padding: 14,
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Iowan Old Style', serif",
            fontSize: 15,
            letterSpacing: "0.03em",
            color: COLORS.offWhite,
            textAlign: "center",
            marginBottom: 10,
            opacity: 0.9,
          }}
        >
          {stage.name} · day {age}
        </div>

        {/* the window */}
        <div
          style={{
            position: "relative",
            borderRadius: 10,
            overflow: "hidden",
            background: COLORS.offWhiteDark,
            border: `6px solid ${COLORS.mint}`,
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.15)",
          }}
        >
          {/* corner brackets */}
          {["0,0", "1,0", "0,1", "1,1"].map((pos, i) => {
            const [x, y] = pos.split(",");
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 10,
                  height: 10,
                  background: COLORS.lime,
                  borderRadius: "50%",
                  top: y === "0" ? 6 : undefined,
                  bottom: y === "1" ? 6 : undefined,
                  left: x === "0" ? 6 : undefined,
                  right: x === "1" ? 6 : undefined,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              />
            );
          })}

          <svg viewBox="0 0 280 280" style={{ width: "100%", display: "block" }}>
            {/* the room, lit for the player's time of day */}
            <image
              href={ROOM_BACKGROUNDS[timeOfDay]}
              x="0"
              y="0"
              width="280"
              height="280"
              style={{ imageRendering: "pixelated" }}
            />
            {mess && (
              <ellipse cx="205" cy="228" rx="16" ry="6" fill={COLORS.charcoal} opacity="0.5" />
            )}
            <Creature mood={mood} stage={stage} bump={bump} />
          </svg>
        </div>

        <div
          style={{
            textAlign: "center",
            color: COLORS.offWhite,
            fontSize: 12,
            marginTop: 8,
            marginBottom: 12,
            fontStyle: "italic",
            opacity: 0.85,
            minHeight: 16,
          }}
        >
          {log} — feeling {moodLabel}
          {mess ? " · needs tidying" : ""}
        </div>

        {/* gauges on an off-white card */}
        <div
          style={{
            background: COLORS.offWhite,
            borderRadius: 10,
            padding: "12px 14px 6px",
          }}
        >
          <Gauge label="hunger" value={stats.hunger} icon="◆" />
          <Gauge label="energy" value={stats.energy} icon="◆" />
          <Gauge label="joy" value={stats.joy} icon="◆" />
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <ActionButton label="Feed" onClick={feed} disabled={asleep || cooldowns.feed > 0} cooldownPct={cooldowns.feed} />
          <ActionButton label="Play" onClick={play} disabled={asleep || cooldowns.play > 0} cooldownPct={cooldowns.play} />
          <ActionButton label={asleep ? "Sleeping…" : "Rest"} onClick={rest} disabled={asleep} />
          <ActionButton label="Clean" onClick={clean} disabled={cooldowns.clean > 0} cooldownPct={cooldowns.clean} />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: COLORS.offWhite,
          opacity: 0.65,
          marginTop: 10,
        }}
      >
        stats drift on their own — check back in and keep them balanced.
      </div>

      <div style={{ textAlign: "center", marginTop: 6 }}>
        <button
          onClick={startOver}
          style={{
            background: "none",
            border: "none",
            padding: "4px 8px",
            fontSize: 11,
            fontFamily: "'Trebuchet MS', sans-serif",
            color: confirmReset ? "#E0685E" : COLORS.offWhite,
            textDecoration: "underline",
            cursor: "pointer",
            opacity: confirmReset ? 1 : 0.55,
          }}
        >
          {confirmReset
            ? "really start over? your creature will be gone — click again to confirm"
            : "start over"}
        </button>
      </div>
    </div>
  );
}
