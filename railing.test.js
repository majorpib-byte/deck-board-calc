import assert from "node:assert/strict";
import test from "node:test";
import { balustersInRun, railingEstimate } from "./railing.js";

test("8 ft run with 1.5 in balusters and a 4 in opening needs 17", () => {
  const one = balustersInRun(96, 1.5, 4);
  assert.equal(one.count, 17);
  assert.equal(one.gaps, 18);
  assert.ok(one.openingIn <= 4);
  assert.ok(Math.abs(one.openingIn - 70.5 / 18) < 1e-9);
});

test("6 ft section needs 13 balusters and the opening stays under 4 in", () => {
  const one = balustersInRun(72, 1.5, 4);
  assert.equal(one.count, 13);
  assert.ok(Math.abs(one.openingIn - 3.75) < 1e-9);
  assert.ok(one.openingIn <= 4);
});

test("24 ft straight rail in 6 ft sections buys 58 balusters at 10% waste", () => {
  const result = railingEstimate({
    lengthFt: 24,
    sectionFt: 6,
    balusterIn: 1.5,
    maxGapIn: 4,
    wastePct: 10,
    closedLoop: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.sections, 4);
  assert.equal(result.eachFt, 6);
  assert.equal(result.perSection, 13);
  assert.equal(result.cover, 52);
  assert.equal(result.toBuy, 58);
  assert.equal(result.posts, 5);
});

test("a closed rectangle counts posts once per corner", () => {
  const result = railingEstimate({
    lengthFt: 56,
    sectionFt: 6,
    balusterIn: 1.5,
    maxGapIn: 4,
    wastePct: 0,
    closedLoop: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.sections, 10);
  assert.equal(result.posts, 10);
  assert.equal(result.perSection, 12);
  assert.equal(result.cover, 120);
  assert.ok(result.openingIn <= 4);
});

test("a run shorter than the maximum opening needs no baluster", () => {
  const one = balustersInRun(3.5, 1.5, 4);
  assert.equal(one.count, 0);
  assert.equal(one.openingIn, 3.5);
});
