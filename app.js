import {
  calculate,
  formatInches,
  formatLength,
  formatMoney,
  formatNumber,
} from "./calc.js";

const form = document.querySelector("#deck-form");
const boardCount = document.querySelector("#board-count");
const countUnit = document.querySelector("#count-unit");
const resultsLabel = document.querySelector("#results-label");
const resultsSize = document.querySelector("#results-size");
const resultsKicker = document.querySelector("#results-kicker");
const stats = document.querySelector("#stats");
const warnings = document.querySelector("#warnings");
const cutPlan = document.querySelector("#cut-plan");
const shopLines = document.querySelector("#shop-lines");
const shopTotal = document.querySelector("#shop-total");
const shopNote = document.querySelector("#shop-note");
const resultsError = document.querySelector("#results-error");
const assumptions = document.querySelector("#assumptions");
const worked = document.querySelector("#worked");
const printBtn = document.querySelector("#print-btn");
const printBanner = document.querySelector("#print-banner");
const printMath = document.querySelector("#print-math");
const plan = document.querySelector("#plan");
const planBoards = document.querySelector("#plan-boards");
const dockMain = document.querySelector("#dock-main");
const dockSub = document.querySelector("#dock-sub");
const liveSummary = document.querySelector("#live-summary");
const results = document.querySelector("#results");
const lfField = document.querySelector("#price-lf-field");
const boardPriceFields = document.querySelector("#price-board-fields");

let liveTimer = 0;

form.addEventListener("submit", (event) => event.preventDefault());

form.addEventListener("input", (event) => {
  if (event.target.id === "waste-range") {
    document.querySelector("#waste").value = event.target.value;
  }
  if (event.target.id === "waste") {
    const n = Number(event.target.value);
    if (Number.isFinite(n)) {
      document.querySelector("#waste-range").value = String(Math.min(50, Math.max(0, n)));
    }
  }
  update();
});

document.querySelectorAll("[data-deck-length]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#length-ft").value = button.dataset.deckLength;
    document.querySelector("#length-in").value = "0";
    document.querySelector("#width-ft").value = button.dataset.deckWidth;
    document.querySelector("#width-in").value = "0";
    update();
  });
});

document.querySelectorAll("[data-width]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#board-width").value = button.dataset.width;
    update();
  });
});

document.querySelectorAll("[data-gap]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#gap").value = button.dataset.gap;
    update();
  });
});

printBtn.addEventListener("click", () => {
  stampPrint();
  window.print();
});

window.addEventListener("beforeprint", stampPrint);

document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener(
    "wheel",
    (event) => {
      if (document.activeElement === input) event.preventDefault();
    },
    { passive: false },
  );
});

update();

function update() {
  syncControls();
  const parsed = readInput();
  if (!parsed.ok) {
    render({
      ok: false,
      error: parsed.error,
      summary: parsed.error,
      warnings: [],
      steps: [],
      lines: [],
      total: 0,
    });
    return;
  }
  const result = calculate(parsed.input);
  if (result.ok && parsed.notes.length) {
    result.warnings = [...parsed.notes, ...result.warnings];
  }
  render(result);
}

function syncControls() {
  const lengthFt = numberOrNull("length-ft");
  const lengthIn = numberOrNull("length-in");
  const widthFt = numberOrNull("width-ft");
  const widthIn = numberOrNull("width-in");
  const boardWidth = numberOrNull("board-width");
  const gap = numberOrNull("gap");

  document.querySelectorAll("[data-deck-length]").forEach((button) => {
    const match =
      lengthFt === Number(button.dataset.deckLength) &&
      widthFt === Number(button.dataset.deckWidth) &&
      lengthIn === 0 &&
      widthIn === 0;
    button.setAttribute("aria-pressed", match ? "true" : "false");
  });

  document.querySelectorAll("[data-width]").forEach((button) => {
    const match = boardWidth !== null && Math.abs(boardWidth - Number(button.dataset.width)) < 0.001;
    button.setAttribute("aria-pressed", match ? "true" : "false");
  });

  document.querySelectorAll("[data-gap]").forEach((button) => {
    const match = gap !== null && Math.abs(gap - Number(button.dataset.gap)) < 0.001;
    button.setAttribute("aria-pressed", match ? "true" : "false");
  });

  const mode = document.querySelector('input[name="price-mode"]:checked')?.value || "lf";
  lfField.hidden = mode !== "lf";
  boardPriceFields.hidden = mode !== "board";

  document.querySelectorAll("[data-price-feet]").forEach((row) => {
    const box = document.querySelector(`input[name="stock"][value="${row.dataset.priceFeet}"]`);
    row.hidden = !box?.checked;
  });
}

function readInput() {
  const required = [
    ["length-ft", "the length in feet"],
    ["length-in", "the length in inches (use 0 if you don't need inches)"],
    ["width-ft", "the width in feet"],
    ["width-in", "the width in inches (use 0 if you don't need inches)"],
    ["board-width", "the board width"],
    ["gap", "the gap"],
    ["waste", "the waste percent"],
  ];

  const values = {};
  let error = "";
  for (const [id, label] of required) {
    const el = document.querySelector(`#${id}`);
    const raw = el.value.trim();
    const value = raw === "" ? NaN : Number(raw);
    const bad = raw === "" || !Number.isFinite(value);
    el.setAttribute("aria-invalid", bad ? "true" : "false");
    if (bad && !error) error = `Enter a number for ${label}.`;
    values[id] = value;
  }

  const notes = [];
  const pricePerLf = optionalPrice("price-lf", "the price per linear foot", notes);
  const joistPricePerLf = optionalPrice("joist-price", "the joist price", notes);
  const screwPricePer100 = optionalPrice("screw-price", "the screw price", notes);
  const pricePerBoard = {};
  for (const feet of [8, 10, 12, 16]) {
    pricePerBoard[feet] = optionalPrice(`price-${feet}`, `the ${feet} ft board price`, notes);
  }

  if (error) return { ok: false, error };

  const stockLengthsFt = [...document.querySelectorAll('input[name="stock"]:checked')].map((el) =>
    Number(el.value),
  );

  return {
    ok: true,
    notes,
    input: {
      lengthFt: values["length-ft"],
      lengthIn: values["length-in"],
      widthFt: values["width-ft"],
      widthIn: values["width-in"],
      boardRun: document.querySelector('input[name="board-run"]:checked')?.value || "length",
      boardWidthIn: values["board-width"],
      gapIn: values.gap,
      stockLengthsFt,
      wastePct: values.waste,
      joistSpacingIn: Number(document.querySelector('input[name="spacing"]:checked')?.value || 16),
      priceMode: document.querySelector('input[name="price-mode"]:checked')?.value || "lf",
      pricePerLf,
      pricePerBoard,
      includeJoists: document.querySelector("#include-joists").checked,
      joistPricePerLf,
      screwPricePer100,
    },
  };
}

function optionalPrice(id, label, notes) {
  const el = document.querySelector(`#${id}`);
  const raw = el.value.trim();
  if (raw === "") {
    el.setAttribute("aria-invalid", "false");
    return 0;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    el.setAttribute("aria-invalid", "true");
    notes.push(`Enter a number for ${label}, or leave it blank.`);
    return 0;
  }
  if (value < 0) {
    el.setAttribute("aria-invalid", "true");
    notes.push(`${label.charAt(0).toUpperCase()}${label.slice(1)} can't be negative.`);
    return 0;
  }
  el.setAttribute("aria-invalid", "false");
  return value;
}

function numberOrNull(id) {
  const raw = document.querySelector(`#${id}`).value.trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function render(result) {
  announce(result.summary || result.error || "");
  results.classList.toggle("is-error", !result.ok);
  printBtn.hidden = !result.ok;

  if (!result.ok) {
    resultsKicker.textContent = "Check a size";
    boardCount.textContent = "—";
    countUnit.textContent = "";
    resultsLabel.textContent = result.error;
    resultsSize.textContent = "";
    stats.hidden = true;
    stats.replaceChildren();
    warnings.replaceChildren();
    cutPlan.textContent = "";
    printMath.textContent = "";
    assumptions.textContent = "";
    shopLines.replaceChildren();
    shopTotal.hidden = true;
    shopNote.textContent = "";
    resultsError.hidden = false;
    resultsError.textContent = result.error;
    worked.replaceChildren();
    plan.hidden = true;
    dockMain.textContent = "Check sizes";
    dockSub.textContent = "";
    return;
  }

  resultsError.hidden = true;
  stats.hidden = false;
  shopTotal.hidden = false;
  plan.hidden = false;

  const deckLines = result.lines.filter((line) => line.group === "Decking");
  const boards = deckLines.reduce((sum, line) => sum + line.qty, 0);
  resultsKicker.textContent = "Shopping list";
  boardCount.textContent = formatNumber(boards, 0);
  countUnit.textContent = boards === 1 ? "board" : "boards";
  resultsLabel.textContent =
    deckLines.length === 1
      ? `${deckLines[0].title}, including waste`
      : deckLines.map((line) => `${formatNumber(line.qty, 0)} × ${line.title}`).join(" · ");

  const direction =
    result.boardRun === "length" ? "boards along the house" : "boards out from the house";
  resultsSize.textContent = `${formatLength(result.lengthIn)} × ${formatLength(result.widthIn)} · ${formatNumber(result.sqft)} sq ft · ${direction}`;

  plan.style.setProperty("--along", String(Math.max(result.lengthIn / 12, 0.5)));
  plan.style.setProperty("--out", String(Math.max(result.widthIn / 12, 0.5)));
  planBoards.classList.toggle("is-across", result.boardRun === "width");

  stats.replaceChildren(
    stat("On the deck", `${formatNumber(result.installedLf)} lf`),
    stat("To buy", `${formatNumber(result.purchasedLf)} lf`),
    stat("Screws", formatNumber(result.screwsBuy, 0)),
    stat("Estimate", formatMoney(result.total)),
  );

  assumptions.textContent = `${formatInches(result.boardWidthIn)} boards · ${formatInches(result.gapIn)} gap · ${formatNumber(result.wastePct, 2)}% waste · joists ${formatInches(result.spacingIn)} on center`;
  cutPlan.textContent = result.cutPlan;
  const buyBits = deckLines
    .map((line) => `${formatNumber(line.qty, 0)} × ${line.title.replace(" deck boards", "")}`)
    .join(" and ");
  const joistBit = result.includeJoists
    ? ` Joists and one rim board are listed as an exact count, not with waste added.`
    : "";
  printMath.textContent = `${formatLength(result.lengthIn)} along the house by ${formatLength(result.widthIn)} out (${formatNumber(result.sqft)} sq ft), ${direction}. ${formatNumber(result.rows, 0)} rows cover the deck. After ${formatNumber(result.wastePct, 2)}% waste, buy ${buyBits} (${formatNumber(result.purchasedLf)} linear ft to buy, ${formatNumber(result.installedLf)} on the deck). ${result.cutPlan} Screws to buy: ${formatNumber(result.screwsBuy, 0)}, from 2 fasteners where each board crosses each of ${formatNumber(result.joists, 0)} joists, plus the same waste percent.${joistBit}`;

  warnings.replaceChildren(
    ...result.warnings.map((text) => {
      const p = document.createElement("p");
      p.className = "warning";
      p.textContent = text;
      return p;
    }),
  );

  shopLines.innerHTML = renderShop(result.lines);
  shopTotal.replaceChildren();
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Estimated total";
  const totalAmt = document.createElement("span");
  totalAmt.textContent = formatMoney(result.total);
  shopTotal.append(totalLabel, totalAmt);

  shopNote.textContent = result.includeJoists
    ? "Joist and rim counts are exact. Decking and screws include your waste percent. Prices are whatever you typed — the defaults are a big-box ballpark, not a quote."
    : `Joists are off the dollar total. This layout still wants ${formatNumber(result.joists, 0)} joists. Decking and screws include your waste percent.`;

  worked.replaceChildren(
    ...result.steps.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }),
  );

  dockMain.textContent = `${formatNumber(boards, 0)} ${boards === 1 ? "board" : "boards"}`;
  dockSub.textContent = formatMoney(result.total);
  stampPrint();
}

function stat(label, value) {
  const wrap = document.createElement("div");
  const term = document.createElement("dt");
  term.textContent = label;
  const desc = document.createElement("dd");
  desc.textContent = value;
  wrap.append(term, desc);
  return wrap;
}

function renderShop(lines) {
  const groups = [];
  for (const line of lines) {
    const last = groups.at(-1);
    if (!last || last.name !== line.group) groups.push({ name: line.group, lines: [] });
    groups.at(-1).lines.push(line);
  }
  return groups
    .map(
      (group) => `<section class="shop-group"><h3>${esc(group.name)}</h3><ul>${group.lines
        .map(
          (line) => `<li>
            <span class="qty">${esc(formatNumber(line.qty, 0))}</span>
            <span class="item">
              <span class="item-title">${esc(line.title)}</span>
              <span class="item-note">${esc(line.note)}</span>
            </span>
            <span class="amt">${esc(formatMoney(line.cost))}</span>
          </li>`,
        )
        .join("")}</ul></section>`,
    )
    .join("");
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function announce(text) {
  window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => {
    if (liveSummary.textContent !== text) liveSummary.textContent = text;
  }, 400);
}

function stampPrint() {
  const when = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  printBanner.textContent = `DeckBoardCalc · ${when}`;
}
