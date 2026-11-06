import pizzaMorning from "./assets/places/pizza-lobo-morning.webp";
import pizzaDay from "./assets/places/pizza-lobo-day.webp";
import pizzaEvening from "./assets/places/pizza-lobo-evening.webp";
import pizzaNight from "./assets/places/pizza-lobo-night.webp";
import nativeMorning from "./assets/places/the-native-morning.webp";
import nativeDay from "./assets/places/the-native-day.webp";
import nativeEvening from "./assets/places/the-native-evening.webp";
import nativeNight from "./assets/places/the-native-night.webp";
import haasMorning from "./assets/places/haas-park-morning.webp";
import haasDay from "./assets/places/haas-park-day.webp";
import haasEvening from "./assets/places/haas-park-evening.webp";
import haasNight from "./assets/places/haas-park-night.webp";
import sevenMorning from "./assets/places/seven-eleven-morning.webp";
import sevenDay from "./assets/places/seven-eleven-day.webp";
import sevenEvening from "./assets/places/seven-eleven-evening.webp";
import sevenNight from "./assets/places/seven-eleven-night.webp";

// Places the cat can visit on the neighborhood map. Positions are in the
// map image's own pixels (1890 x 832). Arriving somewhere applies its
// effect to the cat's stats once.
//
// A place with `scene` has its own art, one image per time of day, shown
// in the window while the cat visits. `cat` says where the cat stands in
// it (window units, 280 x 280: center x and the y of its feet) and how big
// it is relative to its size at home. Places without a scene show a
// close-up of the map instead.
export const MAP_SIZE = { w: 1890, h: 832 };

export const LOCATIONS = [
  {
    id: "home",
    name: "Home",
    x: 1114,
    y: 327,
    blurb: "Your apartment. Rug, lamp, and a window full of sky.",
    effect: {},
    arrive: "Back home. Oxford flops onto the rug.",
  },
  {
    id: "pizza",
    name: "Pizza Lobo",
    x: 76,
    y: 313,
    blurb: "The neighborhood's go-to pizza. Oxford knows exactly which tables drop crusts.",
    effect: { hunger: 25, joy: 6, energy: -4 },
    arrive: "Oxford makes his usual Pizza Lobo stop. The bartenders already know his name.",
    scene: {
      images: { morning: pizzaMorning, day: pizzaDay, evening: pizzaEvening, night: pizzaNight },
      cat: { x: 140, y: 252, scale: 0.6 }, // in the street, close to the viewer
    },
  },
  {
    id: "native",
    name: "The Native",
    x: 508,
    y: 280,
    blurb: "Dive bar with a patio and a DJ. Oxford is the real headliner.",
    effect: { joy: 18, energy: -10 },
    arrive: "Posted up outside The Native. The bass is coming through the door.",
    scene: {
      images: { morning: nativeMorning, day: nativeDay, evening: nativeEvening, night: nativeNight },
      cat: { x: 112, y: 229, scale: 0.24 }, // on the sidewalk in front of the bar, about 2/3 door height
    },
  },
  {
    id: "seven",
    name: "7-Eleven",
    x: 667,
    y: 323,
    blurb: "Bright lights and late-night snacks. Open when nothing else is.",
    effect: { hunger: 15, joy: 5 },
    arrive: "7-Eleven run! Oxford waits by the door for someone to hold it.",
    scene: {
      images: { morning: sevenMorning, day: sevenDay, evening: sevenEvening, night: sevenNight },
      cat: { x: 168, y: 229, scale: 0.24 }, // on the sidewalk just right of the doors
    },
  },
  {
    id: "park",
    name: "Haas Park",
    x: 1710,
    y: 307,
    blurb: "Oxford's home pitch. He plays keeper, and nothing gets past him.",
    effect: { joy: 20, energy: -15, hunger: -8 },
    arrive: "Oxford takes his spot in goal. Clean sheet incoming.",
    scene: {
      images: { morning: haasMorning, day: haasDay, evening: haasEvening, night: haasNight },
      cat: { x: 102, y: 245, scale: 0.4 }, // out on the field, goals behind him
    },
  },
];

export const locationById = (id) => LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
