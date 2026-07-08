# Little Creature

A browser-based Tamagotchi-style virtual pet. Feed it, play with it, let it
rest, keep its corner clean — its stats drift on their own, even while the
tab is closed, so check back in.

## Running it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## How it works

- `src/App.jsx` — the game itself: the creature, its stats, and the
  Feed/Play/Rest/Clean actions.
- `src/persistence.js` — saves the pet's state to the browser's
  `localStorage` and fast-forwards its stats based on real time elapsed
  since your last visit, so leaving the tab closed for a few hours (or
  days) has a real effect.

## Deploying

This is a static Vite app, so it deploys cleanly to Vercel — see the setup
notes shared alongside this project for a step-by-step walkthrough.
