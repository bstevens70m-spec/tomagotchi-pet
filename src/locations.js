// Places the cat can visit on the neighborhood map. Positions are in the
// map image's own pixels (1890 x 832). Arriving somewhere applies its
// effect to the cat's stats once.
export const MAP_SIZE = { w: 1890, h: 832 };

export const LOCATIONS = [
  {
    id: "home",
    name: "Home",
    x: 1500,
    y: 480,
    blurb: "Your apartment, the blue building with the rooftop garden.",
    effect: {},
    arrive: "Back home. The cat flops onto the rug.",
  },
  {
    id: "park",
    name: "The park",
    x: 1750,
    y: 322,
    blurb: "Chase leaves across the soccer field.",
    effect: { joy: 20, energy: -12, hunger: -5 },
    arrive: "At the park! The cat zooms after a tumbling leaf.",
  },
  {
    id: "bodega",
    name: "Corner bodega",
    x: 455,
    y: 330,
    blurb: "The bodega cat always shares a snack.",
    effect: { hunger: 20, joy: 5 },
    arrive: "At the bodega. A crunchy treat appears.",
  },
  {
    id: "train",
    name: "The L",
    x: 320,
    y: 362,
    blurb: "Watch the trains rumble past overhead.",
    effect: { joy: 12, energy: -5 },
    arrive: "Under the L. The cat's ears swivel at every train.",
  },
  {
    id: "lot",
    name: "Leaf lot",
    x: 490,
    y: 560,
    blurb: "A grassy lot buried in crunchy leaf piles.",
    effect: { joy: 15, energy: -8 },
    arrive: "Leaf lot! The cat disappears into a pile.",
  },
  {
    id: "maple",
    name: "Maple Row",
    x: 720,
    y: 735,
    blurb: "A slow stroll under the red and gold trees.",
    effect: { joy: 8, energy: 6 },
    arrive: "A quiet walk down Maple Row.",
  },
];

export const locationById = (id) => LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
