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

The page opens on a 16 ft by 12 ft deck (a common 12×16), 5 1/2 in boards, 1/8 in gap, 10% waste, joists at 16 in on center, and big-box ballpark prices. Change any input and the list updates.

## SEO

The title, meta description, and Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`) describe a DIY shopping list, not a permit tool. `og:url` is `https://example.com/` until you replace it with the live address. The visible FAQ and the FAQPage JSON-LD use the same questions and answers. Anchors: `#calculator`, `#shopping-list`, `#math`, `#faq`.

## Print

**Print list** opens the browser print dialog. The print stylesheet hides the header, hero, form, diagram, FAQ, and the long math essay. It keeps the DeckBoardCalc name, the date, the deck size, the cut plan, a short math summary, the line items (boards by length, fasteners, and joists when they are included), and the total. The footer line is `Printed from DeckBoardCalc · https://example.com` — swap in your URL when you have one. Text is black on white, and each shopping line tries to stay on one page.

To check it: open the page, choose **Print list**, and look at the preview. The form and FAQ should be gone. The list, prices, and short summary should remain.
