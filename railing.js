import { scaleUp } from "./calc.js";

/**
 * Balusters for one straight run so every opening is at most maxGapInches.
 * Openings sit on both ends (between the end posts and the first baluster)
 * as well as between balusters: n balusters create n + 1 openings.
 * n = ceil((run − maxGap) / (baluster + maxGap)).
 * This is a shopping count, not a code ruling. Confirm the opening with the inspector.
 */
export function balustersInRun(runInches, balusterInches, maxGapInches) {
  if (runInches <= 0 || balusterInches <= 0 || maxGapInches <= 0) return null;
  if (runInches <= maxGapInches) {
    return { count: 0, gaps: 1, openingIn: runInches };
  }
  const count = Math.ceil((runInches - maxGapInches) / (balusterInches + maxGapInches) - 1e-9);
  const gaps = count + 1;
  const openingIn = (runInches - count * balusterInches) / gaps;
  if (openingIn < -1e-6) return null;
  return { count, gaps, openingIn };
}

/**
 * Split a rail into equal sections no longer than sectionFt, then count balusters.
 * A straight run has a post at both ends (sections + 1). A closed loop shares
 * every corner, so the post count equals the section count.
 */
export function railingEstimate(input) {
  const lengthFt = Number(input.lengthFt);
  const sectionFt = Number(input.sectionFt);
  const balusterIn = Number(input.balusterIn);
  const maxGapIn = Number(input.maxGapIn);
  const wastePct = Number(input.wastePct);
  const closedLoop = Boolean(input.closedLoop);

  if (![lengthFt, sectionFt, balusterIn, maxGapIn, wastePct].every(Number.isFinite)) {
    return { ok: false, error: "Enter a number in every field." };
  }
  if (lengthFt <= 0 || sectionFt <= 0) {
    return { ok: false, error: "Rail length and section length have to be greater than zero." };
  }
  if (lengthFt > 400) {
    return { ok: false, error: "Rail length stops at 400 feet." };
  }
  if (balusterIn <= 0 || balusterIn > 6) {
    return { ok: false, error: "Baluster width has to be greater than 0 and no more than 6 inches." };
  }
  if (maxGapIn <= 0 || maxGapIn > 12) {
    return { ok: false, error: "Maximum opening has to be greater than 0 and no more than 12 inches." };
  }
  if (wastePct < 0 || wastePct > 100) {
    return { ok: false, error: "Waste has to be from 0 to 100 percent." };
  }

  const sections = Math.max(1, Math.ceil(lengthFt / sectionFt - 1e-9));
  const eachFt = lengthFt / sections;
  const eachIn = eachFt * 12;
  const one = balustersInRun(eachIn, balusterIn, maxGapIn);
  if (!one) {
    return { ok: false, error: "Those sizes do not fit a baluster in the section. Check the width and the opening." };
  }

  const cover = one.count * sections;
  const toBuy = scaleUp(cover, wastePct);
  const posts = closedLoop ? sections : sections + 1;

  return {
    ok: true,
    sections,
    eachFt,
    eachIn,
    perSection: one.count,
    openingIn: one.openingIn,
    gaps: one.gaps,
    cover,
    toBuy,
    posts,
    closedLoop,
    wastePct,
    maxGapIn,
    balusterIn,
  };
}
