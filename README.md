# Snake & Dare: Roll Your Fate

A local multiplayer party game: classic snakes and ladders mixed with Truth or Dare. Two to six people play on one phone or computer. There is no account and no server — the whole match stays in the browser.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (the dev server in this project uses port **43123**).

Other commands:

```bash
npm test        # game-rule unit tests
npm run build   # typecheck and production build
npm run preview # serve the production build
```

## How a match works

- Tile 1 is the bottom-left square. Numbers zigzag, so the finish sits at the end of the last row.
- Roll one die on your turn. The button stays locked until the token finishes moving.
- Ladders climb, snakes slide. A shield blocks one snake.
- You win only by landing exactly on the last tile. A roll that would pass it is wasted.
- Truth, Dare, Lucky, Mystery, Double Dice, and Shield tiles resolve once. Bonus steps do not chain into another event, so nothing loops.
- Completing a Truth is +10, a Dare is +15, Lucky is +5, and the finish is +50. Skip is always free. Points do not decide the winner.
- Cards are not repeated until that category’s deck is used up. Funny, Friendship, Couple, Family, and Mixed each have their own pool. Couple prompts stay sweet and optional.
- Progress, settings, and language are saved in LocalStorage. Continue is on the main menu. Starting a new game asks before it erases the save.
- Sound and music start only after you tap or click. Reduce motion shortens the dice and token animation.

### Boards

100 tiles uses the classic links: ladders 3→22, 8→30, 20→41, 28→55, 44→63, 71→92 and snakes 27→5, 39→17, 58→34, 67→49, 83→61, 97→76.

50 tiles is a shorter course: ladders 2→18, 8→26, 14→32, 21→39, 33→48 and snakes 16→4, 24→7, 36→19, 44→22, 47→29.

## Deploy

The app is a static Vite build. Output is the `dist` folder.

### Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Vite**.
3. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. `vercel.json` rewrites unknown paths to `index.html`.

Or from the CLI, after `npx vercel login`:

```bash
npx vercel
```

### Netlify

1. New site from Git, or drag the `dist` folder onto Netlify Drop.
2. Build command: `npm run build`. Publish directory: `dist`.
3. `netlify.toml` already sets that, plus an SPA fallback.

## Project map

`src/game` holds the rules (board, deck, turns) with no React. `src/components` and `src/pages` are the 2D interface. `src/store/gameStore.ts` saves the match and plays the animations. Tests live next to the rules in `src/game/logic.test.ts`.

## Stack

React, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, Lucide, Web Audio, LocalStorage. The board is HTML and SVG. There is no WebGL and no 3D.
