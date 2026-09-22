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

- **GitHub Pages:** Settings → Pages → deploy from the branch → root (`/`). The live site is [https://majorpib-byte.github.io/deck-board-calc/](https://majorpib-byte.github.io/deck-board-calc/). Styles, scripts, and the favicon use relative paths (`styles.css`, not `/styles.css`) so they load under that project path.
- **Netlify or Cloudflare Pages:** build command empty, publish directory `.`
- **Render:** New Static Site. Build command empty (or a no-op if the form requires one). Publish directory `.`

The site is a single page: `index.html`, `styles.css`, `app.js`, `calc.js`, `ads.js`, and `favicon.svg`.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Page, FAQ, and FAQ schema |
| `styles.css` | Layout, including print styles for the shopping list |
| `app.js` | Reads the form and updates the list as you type |
| `ads.js` | AdSense switch. Off until a publisher ID is pasted in |
| `calc.js` | Pure math, no DOM |
| `calc.test.js` | Unit tests for that math |
| `FORMULAS.md` | The formulas in plain language, with the 12×16 example |

## Defaults

The page opens on a 16 ft by 12 ft deck (a common 12×16), 5 1/2 in boards, 1/8 in gap, 10% waste, joists at 16 in on center, and big-box ballpark prices. Change any input and the list updates.

## SEO

The title, meta description, and Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`) describe a DIY shopping list, not a permit tool. The canonical URL and `og:url` are `https://majorpib-byte.github.io/deck-board-calc/`. The visible FAQ and the FAQPage JSON-LD use the same questions and answers. Anchors: `#calculator`, `#shopping-list`, `#math`, `#faq`.

## Print

**Print list** opens the browser print dialog. The print stylesheet hides the header, hero, form, diagram, FAQ, ad slots, and the long math essay. It keeps the DeckBoardCalc name, the date, the deck size, the cut plan, a short math summary, the line items (boards by length, fasteners, and joists when they are included), and the total. The footer line is `Printed from DeckBoardCalc · https://majorpib-byte.github.io/deck-board-calc/`. Text is black on white, and each shopping line tries to stay on one page.

To check it: open the page, choose **Print list**, and look at the preview. The form, FAQ, and ad slots should be gone. The list, prices, and short summary should remain.

## Ads

Ads stay off until you paste a publisher ID. Open `ads.js` and set:

```js
const ADSENSE_CLIENT = ""; // ca-pub-XXXXXXXX
```

`ADS_ENABLED` is true only when that string is filled in. While it is empty, the page does not load `adsbygoogle.js`. The two slots stay hidden, so nothing that looks like an ad is on the page.

Leave them off until AdSense approves the site.

1. Apply at [https://www.google.com/adsense/](https://www.google.com/adsense/) and submit [https://majorpib-byte.github.io/deck-board-calc/](https://majorpib-byte.github.io/deck-board-calc/).
2. After approval, create two Display ad units. Paste their slot IDs into `AD_SLOT_PRIMARY` and `AD_SLOT_SECONDARY` in `ads.js`.
3. Paste the publisher ID (`ca-pub-…`) into `ADSENSE_CLIENT`.

The primary unit sits under the shopping list. The secondary unit sits after the FAQ. Neither covers the inputs or the Print button. Both are hidden in print. A unit with a blank slot ID is skipped, even if the publisher ID is set.
