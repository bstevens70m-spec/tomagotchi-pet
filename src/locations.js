import pizzaMorning from "./assets/places/pizza-lobo-morning.webp";
import pizzaDay from "./assets/places/pizza-lobo-day.webp";
import pizzaEvening from "./assets/places/pizza-lobo-evening.webp";
import pizzaNight from "./assets/places/pizza-lobo-night.webp";

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
    arrive: "Back home. The cat flops onto the rug.",
  },
  {
    id: "pizza",
    name: "Pizza Lobo",
    x: 76,
    y: 313,
    blurb: "The neighborhood's go-to pizza. Someone always drops a crust.",
    effect: { hunger: 25, joy: 6, energy: -4 },
    arrive: "At Pizza Lobo. The cat guards a fallen crust like treasure.",
    scene: {
      images: { morning: pizzaMorning, day: pizzaDay, evening: pizzaEvening, night: pizzaNight },
      cat: { x: 140, y: 213, scale: 0.4 }, // on the sidewalk by the patio
    },
  },
  {
    id: "native",
    name: "The Native",
    x: 508,
    y: 280,
    blurb: "Dive bar with a patio and a DJ. The cat is the real headliner.",
    effect: { joy: 18, energy: -10 },
    arrive: "Out on The Native's patio. The cat bobs its head to the DJ.",
  },
  {
    id: "seven",
    name: "7-Eleven",
    x: 667,
    y: 323,
    blurb: "Bright lights and late-night snacks. Open when nothing else is.",
    effect: { hunger: 15, joy: 5 },
    arrive: "7-Eleven run! The cat stares down the hot dog roller.",
  },
  {
    id: "train",
    name: "The L",
    x: 794,
    y: 608,
    blurb: "Watch the trains rumble past overhead.",
    effect: { joy: 12, energy: -5 },
    arrive: "Under the L. The cat's ears swivel at every train.",
  },
  {
    id: "park",
    name: "Haas Park",
    x: 1710,
    y: 307,
    blurb: "A whole soccer field built for zoomies. Goalkeeping optional.",
    effect: { joy: 20, energy: -15, hunger: -8 },
    arrive: "At Haas Park! The cat sprints the full length of the pitch.",
  },
];

export const locationById = (id) => LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
