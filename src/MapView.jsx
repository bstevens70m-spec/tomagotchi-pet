import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import mapImage from "./assets/map.webp";
import catIcon from "./assets/cat-neutral.png";
import { LOCATIONS, MAP_SIZE, locationById } from "./locations";
import "./map.css";

const pct = (loc) => ({
  left: `${(loc.x / MAP_SIZE.w) * 100}%`,
  top: `${(loc.y / MAP_SIZE.h) * 100}%`,
});

// The map matches the room's lighting for the time of day.
const MAP_TINT = {
  morning: "rgba(200, 204, 230, 0.12)",
  day: "transparent",
  evening: "rgba(138, 58, 98, 0.22)",
  night: "rgba(18, 24, 44, 0.5)",
};

function EffectChips({ effect }) {
  const entries = Object.entries(effect).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className="map-effects">
      {entries.map(([stat, v]) => (
        <span key={stat} className={`map-chip ${v > 0 ? "up" : "down"}`}>
          {stat} {v > 0 ? `+${v}` : `−${-v}`}
        </span>
      ))}
    </div>
  );
}

// Shown inside the room window. The cat marker walks to the chosen spot,
// then onArrive(id) fires.
export default function MapView({ current, timeOfDay, onArrive, onClose }) {
  const scroller = useRef(null);
  const drag = useRef(null);
  const [selected, setSelected] = useState(null);
  const [markerAt, setMarkerAt] = useState(current);
  const [travelingTo, setTravelingTo] = useState(null);

  // open centered on wherever the cat is
  useLayoutEffect(() => {
    const el = scroller.current;
    const here = locationById(current);
    const canvasW = el.scrollWidth;
    el.scrollLeft = (here.x / MAP_SIZE.w) * canvasW - el.clientWidth / 2;
  }, [current]);

  // click-and-drag panning for mouse users (touch scrolls natively)
  function onPointerDown(e) {
    if (e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft, moved: false };
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    scroller.current.scrollLeft = d.left - dx;
  }
  function onPointerUp() {
    // let a click that follows a drag know it was a drag
    setTimeout(() => (drag.current = null), 0);
  }
  const wasDrag = () => drag.current?.moved;

  // Close the place card when clicking anywhere outside it (or pressing
  // Escape). Clicking another pin switches the card instead, and dragging
  // the map to pan doesn't count as a click.
  useEffect(() => {
    if (!selected) return;
    function onClick(e) {
      if (e.target.closest(".map-card, .map-pin") || wasDrag()) return;
      setSelected(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  function go() {
    if (!selected || selected === markerAt || travelingTo) return;
    setTravelingTo(selected);
    setMarkerAt(selected); // CSS transition walks the marker there
  }

  function onMarkerArrived(e) {
    if (e.propertyName !== "left" || !travelingTo) return;
    const dest = travelingTo;
    setTravelingTo(null);
    onArrive(dest);
  }

  const sel = selected ? locationById(selected) : null;

  return (
    <div className="map-view">
      <div
        ref={scroller}
        className="map-scroll"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="map-canvas">
          <img src={mapImage} alt="Neighborhood map" draggable="false" />
          <div className="map-tint" style={{ background: MAP_TINT[timeOfDay] }} />
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className={`map-pin${selected === loc.id ? " is-selected" : ""}${
                loc.id === "home" ? " is-home" : ""
              }`}
              style={pct(loc)}
              onClick={() => !wasDrag() && setSelected(loc.id)}
            >
              <span className="map-pin-label">{loc.name}</span>
              <span className="map-pin-dot" />
            </button>
          ))}
          <div
            className={`map-cat${travelingTo ? " is-walking" : ""}`}
            style={pct(locationById(markerAt))}
            onTransitionEnd={onMarkerArrived}
          >
            <img src={catIcon} alt="" />
          </div>
        </div>
      </div>

      <button type="button" className="map-close" onClick={onClose} aria-label="Close map">
        ✕
      </button>
      {!sel && <div className="map-hint">drag to explore · tap a place</div>}

      {sel && (
        <div className="map-card">
          <div className="map-card-text">
            <strong>{sel.name}</strong>
            <span>{sel.blurb}</span>
            <EffectChips effect={sel.effect} />
          </div>
          <button
            type="button"
            className="map-go"
            onClick={go}
            disabled={sel.id === markerAt || !!travelingTo}
          >
            {travelingTo ? "Walking…" : sel.id === markerAt ? "You're here" : "Go"}
          </button>
        </div>
      )}
    </div>
  );
}
