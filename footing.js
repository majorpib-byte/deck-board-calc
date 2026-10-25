const CUIN_PER_CUFT = 1728;

/**
 * Bags of concrete mix for round tube footings.
 * Volume is a cylinder: π × radius² × depth. Bells, gravel, and waste concrete
 * in the mixer are not included unless you raise the waste percent.
 * yieldCuFt is the cubic feet one bag makes. Many 80 lb concrete-mix bags
 * print about 0.60; read the bag you are buying.
 */
export function footingEstimate(input) {
  const diameterIn = Number(input.diameterIn);
  const depthIn = Number(input.depthIn);
  const holes = Number(input.holes);
  const yieldCuFt = Number(input.yieldCuFt);
  const wastePct = Number(input.wastePct);

  if (![diameterIn, depthIn, holes, yieldCuFt, wastePct].every(Number.isFinite)) {
    return { ok: false, error: "Enter a number in every field." };
  }
  if (diameterIn <= 0 || depthIn <= 0) {
    return { ok: false, error: "Diameter and depth have to be greater than zero." };
  }
  if (diameterIn > 48) {
    return { ok: false, error: "Diameter stops at 48 inches. This is a tube footing, not a slab." };
  }
  if (depthIn > 144) {
    return { ok: false, error: "Depth stops at 12 feet." };
  }
  if (!Number.isInteger(holes) || holes < 1 || holes > 80) {
    return { ok: false, error: "Enter a whole number of holes from 1 to 80." };
  }
  if (yieldCuFt <= 0 || yieldCuFt > 2) {
    return { ok: false, error: "Bag yield has to be greater than 0 and no more than 2 cubic feet." };
  }
  if (wastePct < 0 || wastePct > 100) {
    return { ok: false, error: "Waste has to be from 0 to 100 percent." };
  }

  const radius = diameterIn / 2;
  const cubicInEach = Math.PI * radius * radius * depthIn;
  const cubicFtEach = cubicInEach / CUIN_PER_CUFT;
  const exactBagsEach = cubicFtEach / yieldCuFt;
  const exactBags = exactBagsEach * holes;
  const withWaste = exactBags * (1 + (wastePct > 0 ? wastePct / 100 : 0));
  const bagsToBuy = Math.ceil(withWaste - 1e-9);

  return {
    ok: true,
    cubicFtEach,
    cubicFtTotal: cubicFtEach * holes,
    exactBagsEach,
    exactBags,
    withWaste,
    bagsToBuy,
    holes,
    yieldCuFt,
    wastePct,
  };
}
