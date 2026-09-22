import assert from "node:assert/strict";
import test from "node:test";
import {
  boardRows,
  calculate,
  formatInches,
  formatLength,
  joistCount,
  scaleUp,
  spliceRecipe,
} from "./calc.js";

const base = {
  lengthFt: 16,
  lengthIn: 0,
  widthFt: 12,
  widthIn: 0,
  boardRun: "length",
  boardWidthIn: 5.5,
  gapIn: 0.125,
  stockLengthsFt: [8, 10, 12, 16],
  wastePct: 10,
  joistSpacingIn: 16,
  priceMode: "lf",
  pricePerLf: 1.25,
  pricePerBoard: { 8: 10, 10: 12.5, 12: 15, 16: 20 },
  includeJoists: true,
  joistPricePerLf: 1.6,
  screwPricePer100: 10,
};

test("12×16 default: 26 rows, 29 boards of 16 ft, 13 joists, 744 screws", () => {
  const result = calculate(base);
  assert.equal(result.ok, true);
  assert.equal(result.rows, 26);
  assert.equal(result.decking.cover[16], 26);
  assert.equal(result.decking.buy[16], 29);
  assert.equal(result.installedLf, 416);
  assert.equal(result.purchasedLf, 464);
  assert.equal(result.joists, 13);
  assert.equal(result.screwsExact, 676);
  assert.equal(result.screwsBuy, 744);
  assert.equal(result.joistStockFt, 12);
  assert.equal(result.rimStockFt, 16);
  assert.equal(result.total, 929.6);
  assert.equal(result.sqft, 192);
  assert.match(result.cutPlan, /each 16 ft board is one full row/);
  assert.match(result.steps.join(" "), /26 rows/);
  assert.match(result.steps.join(" "), /29 × 16 ft/);
});

test("waste 0% buys the cover count only", () => {
  const result = calculate({ ...base, wastePct: 0 });
  assert.equal(result.decking.buy[16], 26);
  assert.equal(result.screwsBuy, 676);
  assert.equal(result.purchasedLf, 416);
});

test("boards running the 12 ft way use 12 ft stock", () => {
  const result = calculate({ ...base, boardRun: "width" });
  assert.equal(result.rows, 35);
  assert.equal(result.decking.cover[12], 35);
  assert.equal(result.decking.buy[12], 39);
  assert.equal(result.installedLf, 420);
  assert.equal(result.purchasedLf, 468);
  assert.equal(result.runIn, 144);
  assert.equal(result.acrossIn, 192);
});

test("per-board prices use the 16 ft unit price", () => {
  const result = calculate({ ...base, priceMode: "board" });
  const decking = result.lines.find((line) => line.group === "Decking");
  assert.equal(decking.qty, 29);
  assert.equal(decking.cost, 580);
});

test("dropping 16 ft stock splices a 16 ft run from 8 ft boards", () => {
  const result = calculate({
    ...base,
    stockLengthsFt: [8, 10, 12],
  });
  assert.equal(result.pattern, "splice");
  assert.equal(result.decking.cover[8], 52);
  assert.equal(result.decking.buy[8], 58);
});

test("a 16 ft board covers two 8 ft rows", () => {
  const result = calculate({
    ...base,
    lengthFt: 8,
    widthFt: 10,
    wastePct: 0,
    stockLengthsFt: [16],
  });
  assert.equal(result.pattern, "solid");
  assert.equal(result.piecesPerBoard, 2);
  assert.equal(result.rows, 22);
  assert.equal(result.decking.buy[16], 11);
  assert.equal(result.purchasedLf, 176);
});

test("9 ft run prefers a 10 ft board over a 16", () => {
  const result = calculate({
    ...base,
    lengthFt: 9,
    widthFt: 10,
    wastePct: 0,
  });
  assert.equal(result.stockFt, 10);
  assert.equal(result.pattern, "solid");
});

test("splice of an 18 ft run is one 10 and one 8", () => {
  const recipe = spliceRecipe(18 * 12, [8, 10, 12]);
  assert.deepEqual(recipe.counts, { 10: 1, 8: 1 });
  assert.equal(recipe.purchasedInches, 18 * 12);
});

test("24 ft run with 12 and 16 uses two 12s, not two 16s", () => {
  const recipe = spliceRecipe(24 * 12, [12, 16]);
  assert.deepEqual(recipe.counts, { 12: 2 });
});

test("joist count includes both ends and an odd last bay", () => {
  assert.equal(joistCount(16 * 12, 16), 13);
  assert.equal(joistCount(16 * 12 + 1, 16), 14);
  assert.equal(joistCount(10 * 12, 16), 9);
});

test("row formula accounts for gaps between boards only", () => {
  assert.equal(boardRows(12 * 12, 5.5, 0.125), 26);
  assert.equal(boardRows(16 * 12, 5.5, 0.125), 35);
  assert.equal(boardRows(12 * 12, 5.5, 0), 27);
  assert.equal(boardRows(11, 5.5, 0), 2);
  assert.equal(boardRows(11.125, 5.5, 0.125), 2);
});

test("narrower 3.5 in boards increase the row count", () => {
  assert.equal(boardRows(12 * 12, 3.5, 0.125), 40);
});

test("scaleUp rounds waste up and leaves 0% alone", () => {
  assert.equal(scaleUp(26, 10), 29);
  assert.equal(scaleUp(35, 10), 39);
  assert.equal(scaleUp(26, 0), 26);
  assert.equal(scaleUp(1, 10), 2);
});

test("length formatting uses feet and reduced fractions", () => {
  assert.equal(formatLength(16 * 12), "16 ft");
  assert.equal(formatLength(12.5 * 12), "12 ft 6 in");
  assert.equal(formatLength(192.125), "16 ft 1/8 in");
  assert.equal(formatInches(5.5), "5 1/2 in");
  assert.equal(formatInches(0.125), "1/8 in");
  assert.equal(formatInches(0.1875), "3/16 in");
  assert.equal(formatInches(7.25), "7 1/4 in");
});

test("leaving joists off drops framing dollars but keeps the screw count", () => {
  const result = calculate({ ...base, includeJoists: false });
  assert.equal(result.lines.some((line) => line.group === "Framing"), false);
  assert.equal(result.screwsBuy, 744);
  assert.equal(result.total, 654.4);
});

test("24 in spacing warns for narrow decking and still calculates", () => {
  const result = calculate({ ...base, joistSpacingIn: 24 });
  assert.equal(result.ok, true);
  assert.equal(result.joists, 9);
  assert.ok(result.warnings.some((warning) => warning.includes("24 in")));
});

test("bad input returns a plain-language error", () => {
  assert.equal(calculate({ ...base, lengthFt: 0, lengthIn: 0 }).ok, false);
  assert.match(calculate({ ...base, stockLengthsFt: [] }).error, /at least one board length/);
  assert.equal(calculate({ ...base, wastePct: 140 }).ok, false);
});

test("feet plus inches add before the row count", () => {
  const result = calculate({
    ...base,
    widthFt: 11,
    widthIn: 6,
    wastePct: 0,
  });
  assert.equal(result.acrossIn, 11 * 12 + 6);
  assert.equal(result.rows, boardRows(11 * 12 + 6, 5.5, 0.125));
});
