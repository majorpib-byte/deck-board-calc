# DeckBoardCalc

Free, one-page deck board calculator for DIY homeowners. Enter a deck size, board width, and gap. It returns a shopping list: boards by stock length, linear feet, a screw estimate, a light joist count, and a cost you can edit.

The math runs in the browser. There is no account, no upload, and no server.

It is a material estimate, not a permit drawing or a code span table. See [FORMULAS.md](FORMULAS.md).

## Run locally

The page uses ES modules, so open it through a local server. Opening `index.html` as a file will not load the calculator in most browsers.

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

`npm start` runs the same command. There is no install step and no build.

## Tests

```bash
node --test
```

`npm test` is the same thing. Node 20+ is enough. The tests cover the row formula, waste rounding, stock choice, splices, joist count, and the default 12×16 totals.

## Deploy

Publish the repository root as a static site. There is no build command and no environment variables.

- **GitHub Pages:** Settings → Pages → deploy from the branch → root (`/`).
- **Netlify or Cloudflare Pages:** build command empty, publish directory `.`
- **Render:** New Static Site. Build command empty (or a no-op if the form requires one). Publish directory `.`

The site is a single page: `index.html`, `styles.css`, `app.js`, `calc.js`, and `favicon.svg`.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Page, FAQ, and FAQ schema |
| `styles.css` | Layout, including print styles for the shopping list |
| `app.js` | Reads the form and updates the list as you type |
| `calc.js` | Pure math, no DOM |
| `calc.test.js` | Unit tests for that math |
| `FORMULAS.md` | The formulas in plain language, with the 12×16 example |

## Defaults

The page opens on a 16 ft by 12 ft deck (a common 12×16), 5 1/2 in boards, 1/8 in gap, 10% waste, joists at 16 in on center, and big-box ballpark prices. Change any input and the list updates. **Print list** uses the browser print dialog and a print stylesheet that keeps the shopping list and the worked math.
