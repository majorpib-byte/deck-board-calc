import assert from "node:assert/strict";
import test from "node:test";
import { stainEstimate } from "./stain.js";

test("12×16 deck, 2 coats at 200 sq ft/gal, 10% waste buys 3 gallons", () => {
  const result = stainEstimate({
    lengthFt: 16,
    widthFt: 12,
    coats: 2,
    coverage: 200,
    wastePct: 10,
  });
  assert.equal(result.ok, true);
  assert.equal(result.area, 192);
  assert.ok(Math.abs(result.rawGallons - 1.92) < 1e-9);
  assert.ok(Math.abs(result.withWaste - 2.112) < 1e-9);
  assert.equal(result.gallonsToBuy, 3);
});

test("one coat and 0% waste can be a single gallon", () => {
  const result = stainEstimate({
    lengthFt: 10,
    widthFt: 10,
    coats: 1,
    coverage: 250,
    wastePct: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(result.area, 100);
  assert.ok(Math.abs(result.rawGallons - 0.4) < 1e-9);
  assert.equal(result.gallonsToBuy, 1);
});

test("an exact gallon is not rounded up an extra can", () => {
  const result = stainEstimate({
    lengthFt: 10,
    widthFt: 20,
    coats: 1,
    coverage: 200,
    wastePct: 0,
  });
  assert.equal(result.gallonsToBuy, 1);
  assert.equal(result.rawGallons, 1);
});

test("bad stain input is a plain sentence", () => {
  const result = stainEstimate({
    lengthFt: 12,
    widthFt: 0,
    coats: 2,
    coverage: 200,
    wastePct: 10,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /greater than zero/);
});
