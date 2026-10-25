import assert from "node:assert/strict";
import test from "node:test";
import { footingEstimate } from "./footing.js";

test("12 in by 48 in tube is one pi cubic feet", () => {
  const result = footingEstimate({
    diameterIn: 12,
    depthIn: 48,
    holes: 1,
    yieldCuFt: 0.6,
    wastePct: 0,
  });
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.cubicFtEach - Math.PI) < 1e-9);
  assert.ok(Math.abs(result.exactBagsEach - Math.PI / 0.6) < 1e-9);
  assert.equal(result.bagsToBuy, 6);
});

test("four 12×48 tubes at 10% waste buy 24 bags of 80 lb mix", () => {
  const result = footingEstimate({
    diameterIn: 12,
    depthIn: 48,
    holes: 4,
    yieldCuFt: 0.6,
    wastePct: 10,
  });
  assert.equal(result.ok, true);
  const exact = (Math.PI / 0.6) * 4;
  assert.ok(Math.abs(result.exactBags - exact) < 1e-9);
  assert.equal(result.bagsToBuy, Math.ceil(exact * 1.1 - 1e-9));
  assert.equal(result.bagsToBuy, 24);
});

test("a smaller yield buys more bags", () => {
  const eighty = footingEstimate({
    diameterIn: 8,
    depthIn: 48,
    holes: 1,
    yieldCuFt: 0.6,
    wastePct: 0,
  });
  const sixty = footingEstimate({
    diameterIn: 8,
    depthIn: 48,
    holes: 1,
    yieldCuFt: 0.45,
    wastePct: 0,
  });
  assert.ok(sixty.exactBagsEach > eighty.exactBagsEach);
  assert.ok(sixty.bagsToBuy >= eighty.bagsToBuy);
});

test("hole count has to be a whole number", () => {
  const result = footingEstimate({
    diameterIn: 12,
    depthIn: 48,
    holes: 1.5,
    yieldCuFt: 0.6,
    wastePct: 0,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /whole number/);
});
