/**
 * Gallons of stain or sealer for a rectangular deck surface.
 * Coverage is square feet per gallon for one coat, as printed on the can.
 * Stairs, rails, and the edges of the boards are not included.
 */
export function stainEstimate(input) {
  const lengthFt = Number(input.lengthFt);
  const widthFt = Number(input.widthFt);
  const coats = Number(input.coats);
  const coverage = Number(input.coverage);
  const wastePct = Number(input.wastePct);

  if (![lengthFt, widthFt, coats, coverage, wastePct].every(Number.isFinite)) {
    return { ok: false, error: "Enter a number in every field." };
  }
  if (lengthFt <= 0 || widthFt <= 0) {
    return { ok: false, error: "Length and width have to be greater than zero." };
  }
  if (lengthFt > 200 || widthFt > 200) {
    return { ok: false, error: "This calculator stops at 200 feet on a side." };
  }
  if (coats < 1 || coats > 5) {
    return { ok: false, error: "Enter 1 to 5 coats." };
  }
  if (coverage < 50 || coverage > 600) {
    return { ok: false, error: "Coverage has to be between 50 and 600 square feet per gallon." };
  }
  if (wastePct < 0 || wastePct > 100) {
    return { ok: false, error: "Waste has to be from 0 to 100 percent." };
  }

  const area = lengthFt * widthFt;
  const rawGallons = (area * coats) / coverage;
  const withWaste = rawGallons * (1 + (wastePct > 0 ? wastePct / 100 : 0));
  const gallonsToBuy = Math.ceil(withWaste - 1e-9);

  return {
    ok: true,
    area,
    coats,
    coverage,
    wastePct,
    rawGallons,
    withWaste,
    gallonsToBuy,
  };
}
