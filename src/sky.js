// The cat's room is in Chicago: the lighting follows Chicago's real sun,
// whatever the visitor's own time zone.
import SunCalc from "suncalc";

const CHICAGO = { lat: 41.8781, lng: -87.6298 };
const HOUR = 60 * 60 * 1000;

// Which room image to show at a given instant.
// - night:   after dusk (end of civil twilight) until dawn
// - morning: dawn until 2 hours after sunrise
// - day:     until 30 minutes before golden hour
// - evening: 30 minutes before golden hour until dusk (the sunset glow)
export function getTimeOfDay(date = new Date()) {
  // SunCalc picks the solar day nearest this instant, which is always
  // Chicago's current calendar day.
  const t = SunCalc.getTimes(date, CHICAGO.lat, CHICAGO.lng);
  const now = date.getTime();
  if (now < t.dawn.getTime() || now >= t.dusk.getTime()) return "night";
  if (now < t.sunrise.getTime() + 2 * HOUR) return "morning";
  if (now < t.goldenHour.getTime() - 0.5 * HOUR) return "day";
  return "evening";
}

// Chicago's calendar month (0 = January), for seasonal touches.
export function chicagoMonth(date = new Date()) {
  const m = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "numeric",
  }).format(date);
  return Number(m) - 1;
}
