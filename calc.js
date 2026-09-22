/**
 * DeckBoardCalc material math.
 *
 * Lengths are converted to sixteenths of an inch so stock-vs-run
 * comparisons stay exact (12 ft is not a repeating binary fraction).
 * See FORMULAS.md for the homeowner-facing writeup.
 */

const SIXTEENTHS = 16;

/** @param {number} inches */
export function toSixteenths(inches) {
  if (!Number.isFinite(inches)) return NaN;
  return Math.round(inches * SIXTEENTHS);
}

/** @param {number} sx */
export function fromSixteenths(sx) {
  return sx / SIXTEENTHS;
}

/** Feet + leftover inches → total inches (not yet snapped). */
export function toInches(feet, inches) {
  return feet * 12 + inches;
}

function divCeil(numerator, denominator) {
  return Math.floor((numerator + denominator - 1) / denominator);
}

/**
 * Rows of decking that cover `acrossInches`, with a gap between boards
 * and no gap after the last board.
 * n × board + (n − 1) × gap >= across
 */
export function boardRows(acrossInches, boardWidthInches, gapInches) {
  const across = toSixteenths(acrossInches);
  const board = toSixteenths(boardWidthInches);
  const gap = toSixteenths(gapInches);
  if (![across, board, gap].every(Number.isFinite)) return null;
  if (across <= 0 || board <= 0 || gap < 0) return null;
  const pitch = board + gap;
  if (pitch <= 0) return null;
  return divCeil(across + gap, pitch);
}

/** Joists along a run, including a joist at both ends. */
export function joistCount(runInches, spacingInches) {
  const run = toSixteenths(runInches);
  const spacing = toSixteenths(spacingInches);
  if (!Number.isFinite(run) || !Number.isFinite(spacing)) return null;
  if (run <= 0 || spacing <= 0) return null;
  return divCeil(run, spacing) + 1;
}

/** Round a count up by a waste percent. 0% stays exact. */
export function scaleUp(count, wastePct) {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (!Number.isFinite(wastePct) || wastePct <= 0) return count;
  const scaled = count * (1 + wastePct / 100);
  return Math.ceil(scaled - 1e-9);
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** "5 1/2 in", "1/8 in", "16 ft", "12 ft 6 in". */
export function formatInches(inches) {
  if (!Number.isFinite(inches)) return "";
  const sign = inches < 0 ? "-" : "";
  const sx = Math.abs(toSixteenths(inches));
  const whole = Math.floor(sx / SIXTEENTHS);
  const frac = sx % SIXTEENTHS;
  let fracText = "";
  if (frac) {
    const g = gcd(frac, SIXTEENTHS);
    fracText = `${frac / g}/${SIXTEENTHS / g}`;
  }
  if (whole === 0 && fracText) return `${sign}${fracText} in`;
  if (whole === 0) return `${sign}0 in`;
  if (!fracText) return `${sign}${whole} in`;
  return `${sign}${whole} ${fracText} in`;
}

export function formatLength(inches) {
  if (!Number.isFinite(inches)) return "";
  const sign = inches < 0 ? "-" : "";
  let sx = Math.abs(toSixteenths(inches));
  let feet = Math.floor(sx / (12 * SIXTEENTHS));
  let rem = sx % (12 * SIXTEENTHS);
  if (rem === 12 * SIXTEENTHS) {
    feet += 1;
    rem = 0;
  }
  if (feet === 0) return formatInches((sign === "-" ? -1 : 1) * fromSixteenths(rem));
  if (rem === 0) return `${sign}${feet} ft`;
  return `${sign}${feet} ft ${formatInches(fromSixteenths(rem))}`;
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}

export function formatMoney(value) {
  if (!Number.isFinite(value)) return "";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatLfFromInches(inches) {
  return formatNumber(inches / 12);
}

function uniqueSorted(lengths) {
  return [...new Set(lengths.filter((n) => Number.isFinite(n) && n > 0))].sort(
    (a, b) => a - b,
  );
}

function sumQty(counts) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

function purchasedSixteenths(counts) {
  let total = 0;
  for (const [feet, qty] of Object.entries(counts)) {
    total += qty * Number(feet) * 12 * SIXTEENTHS;
  }
  return total;
}

function distinctKeys(counts) {
  return Object.keys(counts).length;
}

/** True when `a` is a better per-sum state than `b`. */
function betterRecipe(a, b, feetDesc) {
  if (a.boards !== b.boards) return a.boards < b.boards;
  const ad = distinctKeys(a.counts);
  const bd = distinctKeys(b.counts);
  if (ad !== bd) return ad < bd;
  for (const feet of feetDesc) {
    const diff = (a.counts[feet] || 0) - (b.counts[feet] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

/**
 * Least linear footage that covers one row, using whole stock boards.
 * Prefers fewer boards, then fewer different lengths, then longer boards.
 */
export function spliceRecipe(runInches, stockLengthsFt) {
  const run = toSixteenths(runInches);
  const stocks = uniqueSorted(stockLengthsFt);
  if (!Number.isFinite(run) || run <= 0 || stocks.length === 0) return null;

  const stockSx = stocks.map((feet) => ({
    feet,
    sx: feet * 12 * SIXTEENTHS,
  }));
  const maxSx = Math.max(...stockSx.map((s) => s.sx));
  const limit = run + maxSx - 1;
  /** @type {Array<{ boards: number, counts: Record<number, number> } | null>} */
  const dp = Array(limit + 1).fill(null);
  dp[0] = { boards: 0, counts: {} };
  const feetDesc = [...stocks].sort((a, b) => b - a);

  for (let len = 0; len <= limit; len += 1) {
    const state = dp[len];
    if (!state) continue;
    for (const stock of stockSx) {
      const next = len + stock.sx;
      if (next > limit) continue;
      const candidate = {
        boards: state.boards + 1,
        counts: { ...state.counts, [stock.feet]: (state.counts[stock.feet] || 0) + 1 },
      };
      if (!dp[next] || betterRecipe(candidate, dp[next], feetDesc)) {
        dp[next] = candidate;
      }
    }
  }

  let best = null;
  let bestLen = 0;
  for (let len = run; len <= limit; len += 1) {
    const state = dp[len];
    if (!state) continue;
    if (
      !best ||
      len < bestLen ||
      (len === bestLen && betterRecipe(state, best, feetDesc))
    ) {
      best = state;
      bestLen = len;
    }
  }
  if (!best) return null;
  return {
    counts: best.counts,
    purchasedInches: fromSixteenths(bestLen),
    boards: best.boards,
  };
}

function multiplyCounts(counts, factor) {
  /** @type {Record<number, number>} */
  const out = {};
  for (const [feet, qty] of Object.entries(counts)) {
    out[Number(feet)] = qty * factor;
  }
  return out;
}

function solidChoice(runSx, rowsToBuy, stocks) {
  let best = null;
  for (const feet of stocks) {
    const stockSx = feet * 12 * SIXTEENTHS;
    const per = Math.floor(stockSx / runSx);
    if (per < 1) continue;
    const boards = Math.ceil(rowsToBuy / per);
    const purchased = boards * stockSx;
    const offcut = stockSx - per * runSx;
    const candidate = { feet, per, boards, purchased, offcut };
    if (
      !best ||
      candidate.purchased < best.purchased ||
      (candidate.purchased === best.purchased && candidate.boards < best.boards) ||
      (candidate.purchased === best.purchased &&
        candidate.boards === best.boards &&
        candidate.offcut < best.offcut)
    ) {
      best = candidate;
    }
  }
  return best;
}

function shortestCover(spanSx, stocks) {
  let best = null;
  for (const feet of stocks) {
    const stockSx = feet * 12 * SIXTEENTHS;
    if (stockSx < spanSx) continue;
    if (!best || stockSx < best.sx) best = { feet, sx: stockSx };
  }
  return best;
}

function cents(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @param {object} input
 * @returns {object}
 */
export function calculate(input) {
  const lengthIn = toInches(input.lengthFt, input.lengthIn);
  const widthIn = toInches(input.widthFt, input.widthIn);
  const boardWidthIn = input.boardWidthIn;
  const gapIn = input.gapIn;
  const wastePct = input.wastePct;
  const spacingIn = input.joistSpacingIn;
  const stocks = uniqueSorted(input.stockLengthsFt || []);
  const boardRun = input.boardRun === "width" ? "width" : "length";

  if (![lengthIn, widthIn, boardWidthIn, gapIn, wastePct, spacingIn].every(Number.isFinite)) {
    return fail("Enter a number for every size. Decimals are fine, and inches can stay at 0.");
  }
  if (input.lengthFt < 0 || input.lengthIn < 0 || input.widthFt < 0 || input.widthIn < 0) {
    return fail("Length and width can't be negative.");
  }
  if (lengthIn <= 0 || widthIn <= 0) {
    return fail("Enter a length and a width greater than zero.");
  }
  if (lengthIn > 200 * 12 || widthIn > 200 * 12) {
    return fail("Enter a deck up to 200 ft on a side.");
  }
  if (boardWidthIn <= 0) return fail("Enter a board width greater than zero.");
  if (boardWidthIn > 24) return fail("Board width should be 24 inches or less.");
  if (gapIn < 0) return fail("The gap can't be negative. Use 0 for boards butted tight.");
  if (gapIn > 2) return fail("Use a gap of 2 inches or less.");
  if (wastePct < 0 || wastePct > 100) return fail("Use a waste allowance from 0% to 100%.");
  if (spacingIn <= 0) return fail("Pick a joist spacing.");
  if (stocks.length === 0) {
    return fail("Check at least one board length the yard sells (8, 10, 12, or 16 ft).");
  }

  const runIn = boardRun === "length" ? lengthIn : widthIn;
  const acrossIn = boardRun === "length" ? widthIn : lengthIn;
  const rows = boardRows(acrossIn, boardWidthIn, gapIn);
  const rowsTight = boardRows(acrossIn, boardWidthIn, 0);
  if (!rows) return fail("Those sizes don't produce a board count. Check the width and gap.");

  const rowsToBuy = scaleUp(rows, wastePct);
  const runSx = toSixteenths(runIn);
  const solid = solidChoice(runSx, rowsToBuy, stocks);

  let pattern;
  let piecesPerBoard = null;
  let stockFt = null;
  let offcutEach = null;
  /** @type {Record<number, number>} */
  let cover = {};
  /** @type {Record<number, number>} */
  let buy = {};
  let recipe = null;

  if (solid) {
    pattern = "solid";
    piecesPerBoard = solid.per;
    stockFt = solid.feet;
    offcutEach = fromSixteenths(solid.offcut);
    const coverBoards = Math.ceil(rows / solid.per);
    cover = { [solid.feet]: coverBoards };
    buy = { [solid.feet]: solid.boards };
  } else {
    pattern = "splice";
    recipe = spliceRecipe(runIn, stocks);
    if (!recipe) {
      return fail("Those stock lengths can't cover the board run. Add a longer length.");
    }
    cover = multiplyCounts(recipe.counts, rows);
    buy = multiplyCounts(recipe.counts, rowsToBuy);
  }

  const installedIn = rows * toSixteenths(runIn) / SIXTEENTHS;
  const purchasedIn = fromSixteenths(purchasedSixteenths(buy));
  const coverPurchasedIn = fromSixteenths(purchasedSixteenths(cover));
  const joists = joistCount(runIn, spacingIn);
  const screwsExact = rows * joists * 2;
  const screwsBuy = scaleUp(screwsExact, wastePct);

  const spanIn = acrossIn;
  const joistStock = shortestCover(toSixteenths(spanIn), stocks);
  const rimStock = shortestCover(toSixteenths(runIn), stocks);

  const joistBoards = joists;
  const joistPurchasedIn = joistStock
    ? joistBoards * joistStock.feet * 12
    : joistBoards * spanIn;
  const rimBoards = 1;
  const rimPurchasedIn = rimStock ? rimStock.feet * 12 : runIn;

  const priceMode = input.priceMode === "board" ? "board" : "lf";
  const pricePerLf = finiteOrZero(input.pricePerLf);
  const joistPricePerLf = finiteOrZero(input.joistPricePerLf);
  const screwPricePer100 = finiteOrZero(input.screwPricePer100);
  const includeJoists = Boolean(input.includeJoists);
  const boardPrices = input.pricePerBoard || {};

  const lines = [];
  const boardFace = formatInches(boardWidthIn);

  const buyEntries = Object.entries(buy)
    .map(([feet, qty]) => ({ feet: Number(feet), qty }))
    .filter((line) => line.qty > 0)
    .sort((a, b) => b.feet - a.feet);

  for (const line of buyEntries) {
    const coverQty = cover[line.feet] || 0;
    const extra = line.qty - coverQty;
    let note = `${boardFace} face. ${formatNumber(coverQty, 0)} cover the deck`;
    if (wastePct > 0 && extra > 0) {
      note += `, ${formatNumber(extra, 0)} extra for ${formatNumber(wastePct, 2)}% waste`;
    } else if (wastePct > 0 && extra === 0) {
      note += `. The ${formatNumber(wastePct, 2)}% allowance fits on boards already in this count`;
    }
    note += ".";
    const unit = priceMode === "board" ? finiteOrZero(boardPrices[line.feet]) : pricePerLf * line.feet;
    lines.push({
      group: "Decking",
      qty: line.qty,
      title: `${line.feet} ft deck boards`,
      note,
      cost: cents(line.qty * unit),
    });
  }

  lines.push({
    group: "Fasteners",
    qty: screwsBuy,
    title: "Deck screws",
    note: `2 screws × ${formatNumber(rows, 0)} boards × ${formatNumber(joists, 0)} joists = ${formatNumber(screwsExact, 0)}, plus ${formatNumber(wastePct, 2)}% waste.`,
    cost: cents((screwsBuy / 100) * screwPricePer100),
  });

  if (includeJoists) {
    const joistFeetLabel = joistStock ? `${joistStock.feet} ft` : formatLength(spanIn);
    let joistNote = `${formatInches(spacingIn)} on center, both ends included. Each spans ${formatLength(spanIn)}. Exact count, no waste added.`;
    if (joistStock && fromSixteenths(joistStock.sx) - spanIn > 0.01) {
      joistNote += ` Shortest checked length that covers the span is ${joistStock.feet} ft.`;
    }
    if (!joistStock) {
      joistNote += " None of the checked lengths cover this span, so the cost uses the span itself — buy a longer joist or add a beam.";
    }
    lines.push({
      group: "Framing",
      qty: joistBoards,
      title: joistStock ? `${joistStock.feet} ft joists` : `Joists, ${joistFeetLabel} span`,
      note: joistNote,
      cost: cents((joistPurchasedIn / 12) * joistPricePerLf),
    });

    let rimNote =
      "Outer band along the board run. End joists are already counted. Add a ledger if the deck is attached, and double this for a double rim.";
    if (!rimStock) {
      rimNote +=
        " None of the checked lengths cover this rim in one piece, so the cost uses the run itself.";
    } else if (rimStock.feet * 12 - runIn > 0.01) {
      rimNote += ` Shortest checked length that covers it is ${rimStock.feet} ft.`;
    }
    lines.push({
      group: "Framing",
      qty: rimBoards,
      title: rimStock ? `${rimStock.feet} ft rim board` : `Rim board, ${formatLength(runIn)}`,
      note: rimNote,
      cost: cents((rimPurchasedIn / 12) * joistPricePerLf),
    });
  }

  const total = cents(lines.reduce((sum, line) => sum + line.cost, 0));
  const deckingCost = cents(
    lines.filter((line) => line.group === "Decking").reduce((sum, line) => sum + line.cost, 0),
  );

  const warnings = [];
  if (gapIn === 0 || toSixteenths(gapIn) === 0) {
    warnings.push(
      "The gap is 0. Wood boards usually need about 1/8 in so water can drain and the boards can swell. Composite decking follows the manufacturer's gap instead.",
    );
  }
  if (toSixteenths(spacingIn) >= toSixteenths(24) && toSixteenths(boardWidthIn) <= toSixteenths(5.5)) {
    warnings.push(
      "24 in joist spacing is wide for boards about 5 1/2 in and narrower. A lot of 5/4 decking is installed at 16 in on center or less. This is general practice, not a code ruling.",
    );
  }
  const snappedGap = fromSixteenths(toSixteenths(gapIn));
  const snappedBoard = fromSixteenths(toSixteenths(boardWidthIn));
  if (Math.abs(snappedGap - gapIn) > 1e-6 || Math.abs(snappedBoard - boardWidthIn) > 1e-6) {
    warnings.push(
      `Sizes are rounded to the nearest 1/16 in for the count (board ${formatInches(snappedBoard)}, gap ${formatInches(snappedGap)}).`,
    );
  }

  const steps = buildSteps({
    lengthIn,
    widthIn,
    runIn,
    acrossIn,
    boardRun,
    boardWidthIn: snappedBoard,
    gapIn: snappedGap,
    wastePct,
    rows,
    rowsTight,
    rowsToBuy,
    pattern,
    piecesPerBoard,
    stockFt,
    offcutEach,
    cover,
    buy,
    recipe,
    installedIn,
    purchasedIn,
    coverPurchasedIn,
    joists,
    spacingIn,
    screwsExact,
    screwsBuy,
    includeJoists,
    joistStock,
    spanIn,
    rimStock,
    total,
    deckingCost,
    priceMode,
  });

  const buyPhrase = buyEntries
    .map((line) => `${formatNumber(line.qty, 0)} × ${line.feet} ft`)
    .join(" and ");
  const summary = `Buy ${buyPhrase} deck boards for this ${formatLength(lengthIn)} by ${formatLength(widthIn)} deck. Estimated materials ${formatMoney(total)}.`;
  const cutPlan = describeCut({
    pattern,
    piecesPerBoard,
    stockFt,
    offcutEach,
    runIn: fromSixteenths(toSixteenths(runIn)),
    recipe,
  });

  const sqft = (toSixteenths(lengthIn) / SIXTEENTHS / 12) * (toSixteenths(widthIn) / SIXTEENTHS / 12);

  return {
    ok: true,
    summary,
    warnings,
    steps,
    lines,
    total,
    sqft,
    boardRun,
    lengthIn: fromSixteenths(toSixteenths(lengthIn)),
    widthIn: fromSixteenths(toSixteenths(widthIn)),
    runIn: fromSixteenths(toSixteenths(runIn)),
    acrossIn: fromSixteenths(toSixteenths(acrossIn)),
    boardWidthIn: snappedBoard,
    gapIn: snappedGap,
    wastePct,
    spacingIn,
    rows,
    rowsToBuy,
    pattern,
    piecesPerBoard,
    stockFt,
    installedLf: installedIn / 12,
    purchasedLf: purchasedIn / 12,
    joists,
    screwsExact,
    screwsBuy,
    includeJoists,
    joistBoards,
    joistStockFt: joistStock ? joistStock.feet : null,
    rimStockFt: rimStock ? rimStock.feet : null,
    cutPlan,
    decking: { cover, buy },
  };
}

function describeCut(ctx) {
  if (ctx.pattern === "solid" && ctx.piecesPerBoard === 1 && ctx.offcutEach < 1 / 16) {
    return `Cut plan: each ${ctx.stockFt} ft board is one full row. No butt joint and no offcut.`;
  }
  if (ctx.pattern === "solid" && ctx.piecesPerBoard === 1) {
    return `Cut plan: one ${ctx.stockFt} ft board per row. Trim about ${formatLength(ctx.offcutEach)} off each board. That offcut is too short to start another row.`;
  }
  if (ctx.pattern === "solid") {
    const leftover =
      ctx.offcutEach >= 1 / 16 ? `, with about ${formatLength(ctx.offcutEach)} left on the board` : "";
    return `Cut plan: crosscut each ${ctx.stockFt} ft board into ${ctx.piecesPerBoard} pieces of ${formatLength(ctx.runIn)}${leftover}. One board covers ${ctx.piecesPerBoard} rows.`;
  }
  const mix = Object.entries(ctx.recipe.counts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([feet, qty]) => `${formatNumber(qty, 0)} × ${feet} ft`)
    .join(" + ");
  return `Cut plan: each row is ${mix}. Put the butt joint on a joist. This list does not mark which joist.`;
}

function finiteOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fail(error) {
  return {
    ok: false,
    error,
    summary: error,
    warnings: [],
    steps: [],
    lines: [],
    total: 0,
  };
}

function ratioText(acrossIn, boardWidthIn, gapIn) {
  const across = toSixteenths(acrossIn);
  const board = toSixteenths(boardWidthIn);
  const gap = toSixteenths(gapIn);
  const num = across + gap;
  const den = board + gap;
  const value = num / den;
  const exact = num % den === 0;
  return { value, exact };
}

function buildSteps(ctx) {
  const steps = [];
  const sqft = (ctx.lengthIn / 12) * (ctx.widthIn / 12);
  steps.push(
    `The deck is ${formatLength(ctx.lengthIn)} along the house by ${formatLength(ctx.widthIn)} out from the house (${formatNumber(sqft)} sq ft).`,
  );
  steps.push(
    ctx.boardRun === "length"
      ? `Deck boards run along the house, so each row is ${formatLength(ctx.runIn)} long and the rows stack across the ${formatLength(ctx.acrossIn)} width.`
      : `Deck boards run out from the house, so each row is ${formatLength(ctx.runIn)} long and the rows stack across the ${formatLength(ctx.acrossIn)} length. Joists would run along the house in this layout.`,
  );

  const ratio = ratioText(ctx.acrossIn, ctx.boardWidthIn, ctx.gapIn);
  const ratioRounded = formatNumber(ratio.value);
  steps.push(
    ratio.exact
      ? `Each row covers ${formatInches(ctx.boardWidthIn)} of board plus a ${formatInches(ctx.gapIn)} gap, with no gap after the last board. (${formatLength(ctx.acrossIn)} + ${formatInches(ctx.gapIn)}) ÷ (${formatInches(ctx.boardWidthIn)} + ${formatInches(ctx.gapIn)}) = ${ratioRounded}, exactly ${ctx.rows} ${ctx.rows === 1 ? "row" : "rows"}.`
      : `Each row covers ${formatInches(ctx.boardWidthIn)} of board plus a ${formatInches(ctx.gapIn)} gap, with no gap after the last board. (${formatLength(ctx.acrossIn)} + ${formatInches(ctx.gapIn)}) ÷ (${formatInches(ctx.boardWidthIn)} + ${formatInches(ctx.gapIn)}) = ${ratioRounded}, which rounds up to ${ctx.rows} ${ctx.rows === 1 ? "row" : "rows"}.`,
  );

  if (ctx.rowsTight !== ctx.rows) {
    steps.push(
      ctx.rowsTight > ctx.rows
        ? `Butted tight, with no gap, this width would take ${ctx.rowsTight} rows. The gaps are open space you don't buy, so the count is ${ctx.rows} rows.`
        : `With this gap the count is ${ctx.rows} rows (${ctx.rowsTight} if the boards were butted tight).`,
    );
  }

  steps.push(
    `${formatNumber(ctx.rows, 0)} rows × ${formatLength(ctx.runIn)} = ${formatLfFromInches(ctx.installedIn)} linear feet of decking on the deck.`,
  );

  if (ctx.pattern === "solid") {
    const offcut = ctx.offcutEach;
    if (ctx.piecesPerBoard === 1 && offcut < 1 / 16) {
      steps.push(
        `${formatLength(ctx.stockFt * 12)} stock covers a row exactly: one board per row, so ${formatNumber(ctx.cover[ctx.stockFt], 0)} boards cover the deck with no offcut.`,
      );
    } else if (ctx.piecesPerBoard === 1) {
      steps.push(
        `The shortest sensible stock that covers a ${formatLength(ctx.runIn)} row without a butt joint is ${ctx.stockFt} ft. One board per row, and each board leaves about ${formatLength(offcut)} of offcut — too short to start another row. ${formatNumber(ctx.cover[ctx.stockFt], 0)} boards cover the deck.`,
      );
    } else {
      steps.push(
        `Each ${ctx.stockFt} ft board yields ${ctx.piecesPerBoard} pieces of ${formatLength(ctx.runIn)}${offcut >= 1 / 16 ? ` with about ${formatLength(offcut)} left over` : ""}. ${formatNumber(ctx.rows, 0)} rows need ${formatNumber(ctx.cover[ctx.stockFt], 0)} boards before waste.`,
      );
    }
    if (ctx.wastePct > 0) {
      steps.push(
        `A ${formatNumber(ctx.wastePct, 2)}% waste allowance plans ${formatNumber(ctx.rowsToBuy, 0)} rows instead of ${formatNumber(ctx.rows, 0)} (split ends, bad cuts, mistakes). That is separate from offcuts. You buy ${formatNumber(ctx.buy[ctx.stockFt], 0)} × ${ctx.stockFt} ft boards — ${formatLfFromInches(ctx.purchasedIn)} linear feet.`,
      );
    } else {
      steps.push(
        `Waste is set to 0%, so the shopping list is the cover count: ${formatNumber(ctx.buy[ctx.stockFt], 0)} × ${ctx.stockFt} ft boards (${formatLfFromInches(ctx.purchasedIn)} linear feet).`,
      );
    }
  } else {
    const recipeBits = Object.entries(ctx.recipe.counts)
      .map(([feet, qty]) => `${formatNumber(qty, 0)} × ${feet} ft`)
      .join(" + ");
    steps.push(
      `No checked length covers a ${formatLength(ctx.runIn)} row in one piece. The least-waste mix per row is ${recipeBits} (${formatLfFromInches(ctx.recipe.purchasedInches)} purchased per row). Put the butt joint on a joist when you build — this list only counts boards, it does not lay out the joint.`,
    );
    steps.push(
      ctx.wastePct > 0
        ? `A ${formatNumber(ctx.wastePct, 2)}% waste allowance plans ${formatNumber(ctx.rowsToBuy, 0)} rows instead of ${formatNumber(ctx.rows, 0)}, using that same mix. Short offcuts are not reshuffled across rows, so the list can run slightly long on purpose.`
        : `Waste is 0%, so you buy that mix once for every row.`,
    );
  }

  const joistStockText = ctx.joistStock
    ? `${ctx.joists} × ${ctx.joistStock.feet} ft joists`
    : `${ctx.joists} joists spanning ${formatLength(ctx.spanIn)}`;
  steps.push(
    `Joists are estimated at ${formatInches(ctx.spacingIn)} on center along the board run, with a joist at both ends: ${joistStockText}. Each spans ${formatLength(ctx.spanIn)}. ${ctx.includeJoists ? "That count is on the shopping list with no extra waste." : "That count is left off the dollar total."}`,
  );
  steps.push(
    `End joists are already included. The outer rim is one more board, the length of the run. Add a ledger if the deck attaches to the house, and double the rim if your plan says to. This is not a span table or a code check.`,
  );
  steps.push(
    `Screws use a rule of thumb: 2 fasteners every time a deck board crosses a joist. ${formatNumber(ctx.rows, 0)} × ${formatNumber(ctx.joists, 0)} × 2 = ${formatNumber(ctx.screwsExact, 0)} screws. The same ${formatNumber(ctx.wastePct, 2)}% allowance brings that to ${formatNumber(ctx.screwsBuy, 0)}.`,
  );
  steps.push(
    `Decking comes to ${formatMoney(ctx.deckingCost)} at your ${ctx.priceMode === "board" ? "per-board" : "per-linear-foot"} prices. The estimated total on the list is ${formatMoney(ctx.total)}.`,
  );
  return steps;
}
