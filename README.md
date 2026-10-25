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

`npm test` is the same thing. Node 20+ is enough. The tests cover the row formula, waste rounding, stock choice, splices, joist count, the default 12×16 totals, stain gallons, footing bags, baluster counts, and the AdSense head snippet.

## Deploy

Publish the repository root as a static site. There is no build command and no environment variables.

- **GitHub Pages:** Settings → Pages → deploy from the branch → root (`/`). The live site is [https://deckboardcalc.com/](https://deckboardcalc.com/) (`CNAME` is `deckboardcalc.com`). Styles, scripts, and the favicon stay relative (`styles.css`, not `/styles.css`).
- **Netlify or Cloudflare Pages:** build command empty, publish directory `.`
- **Render:** New Static Site. Build command empty (or a no-op if the form requires one). Publish directory `.`

The board calculator is the homepage. Other pages are static HTML next to it: `calculators.html`, `stain.html`, `footings.html`, `railing.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html`, and `guides/`. Styles and scripts use relative paths (`styles.css`, or `../styles.css` from a guide) so they load on the custom domain. `sitemap.xml`, `robots.txt`, and `ads.txt` sit at the site root.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Page, FAQ, and FAQ schema |
| `styles.css` | Layout, including print styles for the shopping list |
| `app.js` | Reads the form and updates the list as you type |
| `ads.js` | AdSense. Skips a second loader if the head script is already there |
| `ads.txt` | AdSense seller record for the publisher ID |
| `calc.js` | Board, joist, and screw math, no DOM |
| `stain.js`, `footing.js`, `railing.js` | The other calculators’ math |
| `calc.test.js` and the matching `*.test.js` files | Unit tests |
| `FORMULAS.md` | The formulas in plain language, with the 12×16 example |

## Defaults

The page opens on a 16 ft by 12 ft deck (a common 12×16), 5 1/2 in boards, 1/8 in gap, 10% waste, joists at 16 in on center, and big-box ballpark prices. Change any input and the list updates.

## SEO

The title, meta description, and Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`) describe a DIY shopping list, not a permit tool. The homepage canonical URL and `og:url` are `https://deckboardcalc.com/`. Other pages set their own canonical and Open Graph URLs. `sitemap.xml` lists the public pages. `robots.txt` allows crawling and points at that sitemap. The visible FAQ on the homepage and the FAQPage JSON-LD use the same questions and answers. Each page shows “Last updated October 25, 2026.”

## Print

**Print list** opens the browser print dialog. The print stylesheet hides the header, hero, form, diagram, FAQ, ad slots, Auto ads, and the long math essay. It keeps the DeckBoardCalc name, the date, the deck size, the cut plan, a short math summary, the line items (boards by length, fasteners, and joists when they are included), and the total. The footer line is `Printed from DeckBoardCalc · https://deckboardcalc.com/`. Text is black on white, and each shopping line tries to stay on one page.

To check it: open the page, choose **Print list**, and look at the preview. The form, FAQ, and ad slots should be gone. The list, prices, and short summary should remain.

## Ads

Every HTML page includes this in `<head>`, which is what AdSense site verification looks for:

```html
<meta name="google-adsense-account" content="ca-pub-2388538564495463" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2388538564495463" crossorigin="anonymous"></script>
```

`ads.js` still has `const ADSENSE_CLIENT = "ca-pub-2388538564495463"`. If that head script is already on the page, `ads.js` does not add a second copy. `ads.txt` at the site root is:

```text
google.com, pub-2388538564495463, DIRECT, f08c47fec0942fa0
```

`AD_SLOT_PRIMARY` and `AD_SLOT_SECONDARY` are still empty, so manual units stay hidden. Where they appear later, they sit under the results, never above the inputs. Trust pages (`about.html`, `contact.html`, `privacy.html`, `terms.html`) and `404.html` set `data-ads="off"`: the verification script stays, and `ads.js` does not request page-level ads or fill a slot. Calculator pages set `data-ads="slots"`: a slot ID mounts a unit below the list, and page-level Auto ads are not requested, so the page is not asking Google to place an ad over the form. Guide pages set `data-ads="auto"`: with both slot IDs blank, Auto ads are enabled once.

If the AdSense account has Auto ads turned on for the whole site, Google can still place ads from the head script alone. Exclude the trust-page URLs in the AdSense dashboard if those pages should stay ad-free.

Print hides ad hosts, `ins.adsbygoogle`, Auto-placed units, and syndication iframes. Manage the account at [https://www.google.com/adsense/](https://www.google.com/adsense/) for [https://deckboardcalc.com/](https://deckboardcalc.com/).
