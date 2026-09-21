# DeckBoardCalc formulas

These are shopping estimates for a rectangular deck. They are not a building-code span table, a permit drawing, or a framing plan. Confirm spacing, spans, ledgers, guards, and footings locally before you buy or build.

Lengths are snapped to the nearest 1/16 inch before the count, so 12 ft divided by 12 ft stays exact.

## Names

- **Length** runs along the house.
- **Width** is out from the house.
- **Run** is the direction the deck boards travel. By default that is the length.
- **Across** is the other side, the one the rows stack along.
- **Board width** is the face width, in inches. A 5/4×6 and a 2×6 are both 5 1/2 in on the face. A 2×4-style face is 3 1/2 in.
- **Gap** is the opening between boards, not after the last board. Default 1/8 in.

## 1. Rows of decking

Let `A` be the across distance, `B` the board width, and `G` the gap, all in the same units.

You need the smallest whole number of boards `n` such that:

```
n × B + (n − 1) × G ≥ A
```

which solves to:

```
n = ceil( (A + G) / (B + G) )
```

The `+ G` on top is there because the last board does not get a gap after it.

### Worked example, default 12×16

Length 16 ft, width 12 ft, boards along the house, so across = 12 ft = 144 in. Board = 5.5 in. Gap = 0.125 in.

```
(144 + 0.125) / (5.5 + 0.125) = 144.125 / 5.625 = 25.622…
n = 26 rows
```

Check: 26 × 5.5 + 25 × 0.125 = 146.125 in, which covers 144 in. 25 boards only reach 140.5 in, so 26 is required.

Butted tight (`G = 0`): `ceil(144 / 5.5) = 27` rows. The gaps are open space, so they can drop a row.

The other direction (boards run the 12 ft width, rows stack across 16 ft):

```
(192 + 0.125) / 5.625 = 34.155…
n = 35 rows
```

Linear feet **on the deck** (no waste, no offcuts):

```
installed linear feet = rows × run length in feet
```

Default: 26 × 16 = **416 lf**. The other direction: 35 × 12 = **420 lf**.

## 2. Which stock boards to buy

Checked lengths are 8, 10, 12, and 16 ft. Two cases:

### A row fits on one board

If any checked length is at least the run, do not splice (a butt joint is worse, and with these lengths it does not save lumber).

For each stock length `S ≥ run`:

```
pieces per board = floor(S / run)
boards to buy    = ceil(rows-with-waste / pieces per board)
linear feet      = boards to buy × S
```

Pick the length with the fewest linear feet after waste. Ties go to fewer boards, then less offcut.

If `pieces per board` is 2 or more, one purchased board covers that many rows. An 8 ft run cut from 16 ft stock is two rows per board, not two boards per row.

Offcuts shorter than a full row are not reused on another row. A 16 ft board trimmed to 12 ft leaves 4 ft, and that 4 ft does not count as another 12 ft row.

### Nothing is long enough

Each row is spliced. For one row, find the mix of checked lengths whose sum is at least the run, with:

1. the smallest purchased length
2. then the fewest boards
3. then the fewest different lengths
4. then longer boards

That mix is repeated for every row. Short offcuts are not reshuffled across rows, so a spliced list can run slightly long. The butt joint should land on a joist when you build. This tool does not mark which joist.

Example: an 18 ft row with 8, 10, and 12 ft stock is one 10 ft board plus one 8 ft board (18 ft, no offcut). Two 12s would buy 24 ft.

Example: a 16 ft row with 16 ft unchecked and 8 / 10 / 12 checked is two 8 ft boards per row.

## 3. Waste

Default 10%. Waste is extra rows for bad cuts, split ends, and mistakes. It is not the offcut already counted in the stock choice.

```
rows to buy = ceil(rows × (1 + waste% / 100))
```

`ceil` uses a tiny epsilon so `26 × 1.10 = 28.6` becomes 29, and an exact integer does not bump up from floating-point noise.

0% waste buys the cover count only. 26 rows at 0% is 26 boards when one board is one row.

Then the stock rule in section 2 runs on `rows to buy`, not on the bare row count.

Default: `ceil(26 × 1.10) = 29` boards of 16 ft. Purchased linear feet = 29 × 16 = **464 lf**.

The other 12×16 direction: `ceil(35 × 1.10) = 39` boards of 12 ft, **468 lf**.

Spliced rows use the same idea: plan `rows to buy` copies of the per-row mix. One row at 10% rounds up to two rows, because you cannot buy part of a row.

## 4. Joists

Joists run perpendicular to the deck boards, spaced along the run, with a joist at both ends.

```
spaces = ceil(run / spacing)
joists = spaces + 1
```

16 ft at 16 in on center: 192 / 16 = 12 spaces, **13 joists**.

16 ft 1 in at 16 in: `ceil(193 / 16) + 1 = 14` joists. The last bay is shorter than the spacing, not longer.

10 ft at 16 in: `ceil(120 / 16) + 1 = 9` joists.

Each joist spans the **across** distance. The shopping list picks the shortest checked length that covers that span. If none does, the line still shows the span and the cost uses the span itself — buy a longer joist or add a beam.

The end joists are already inside that count. The list adds **one rim board** the length of the run (shortest checked length that covers it). Add a ledger yourself if the deck attaches to the house. Double the rim if your plan says to.

Joist and rim quantities are exact. The decking waste percent is not applied to them.

This spacing does not say whether 12, 16, or 24 in on center is allowed for your board or your span. 24 in is flagged in the page when the face is about 5 1/2 in or narrower, as general practice only.

## 5. Screws

Rule of thumb, not a clip-system count:

```
screws = rows × joists × 2
screws to buy = ceil(screws × (1 + waste% / 100))
```

The rows here are the rows on the deck, before the waste extra rows. Waste is applied once, at the end.

Default: 26 × 13 × 2 = **676**, then 10% → **744** screws.

Check against the rough "350 screws per 100 sq ft" saying: the default deck is 192 sq ft, and 350 × 1.92 = 672. The two rules land in the same place for this layout. Hidden fasteners are a different product; follow that manufacturer.

## 6. Cost

Two decking price modes:

- **Per linear foot:** `purchased linear feet × price`. Default price $1.25, so 464 × 1.25 = **$580.00**.
- **Per board:** `quantity of that length × price of that length`. Default 16 ft price is $20, so 29 × 20 = **$580.00** as well.

Joists and the rim use one price per linear foot of the stock you buy (or of the bare span, if no checked length covers it). Default $1.60.

```
13 joists × 12 ft × $1.60 = $249.60
1 rim × 16 ft × $1.60     = $25.60
```

Screws: `(screws to buy / 100) × price per 100`. Default $10, so 744 / 100 × 10 = **$74.40**.

Default estimated total, with joists included: 580 + 249.60 + 25.60 + 74.40 = **$929.60**.

With joists left off the total: 580 + 74.40 = **$654.40**.

Prices are editable starting points for big-box pressure-treated lumber. They are not a quote.

## What this page does not calculate

- IRC or local span ratings, beam size, post spacing, or footings
- Ledger bolts, flashing, or house attachment
- Stairs, guards, or diagonal picture-frame borders
- Hidden fastener clips
- Crown, specific species, or which boards to reject at the yard
- A cut diagram that places each butt joint on a joist

Those are real parts of building a deck. They are out of scope on purpose so the shopping list stays short and the math stays visible.
