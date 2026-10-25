import { stainEstimate } from "./stain.js";

const form = document.querySelector("#stain-form");
const gallons = document.querySelector("#gallons");
const detail = document.querySelector("#stain-detail");
const error = document.querySelector("#stain-error");
const summary = document.querySelector("#stain-summary");

function num(value, digits) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function render() {
  const result = stainEstimate({
    lengthFt: form.lengthFt.value,
    widthFt: form.widthFt.value,
    coats: form.coats.value,
    coverage: form.coverage.value,
    wastePct: form.waste.value,
  });
  if (!result.ok) {
    gallons.textContent = "—";
    detail.textContent = "";
    error.hidden = false;
    error.textContent = result.error;
    summary.textContent = result.error;
    return;
  }
  error.hidden = true;
  gallons.textContent = String(result.gallonsToBuy);
  const sentence = `${num(result.area, 0)} sq ft, ${num(result.coats, 0)} coat${result.coats === 1 ? "" : "s"} at ${num(result.coverage, 0)} sq ft per gallon is ${num(result.rawGallons, 2)} gallons. With ${num(result.wastePct, 0)}% waste that is ${num(result.withWaste, 2)} gallons, so buy ${result.gallonsToBuy} gallon${result.gallonsToBuy === 1 ? "" : "s"}.`;
  detail.textContent = sentence;
  summary.textContent = `${result.gallonsToBuy} gallons. ${sentence}`;
}

form.addEventListener("input", render);
document.querySelectorAll("[data-deck-length]").forEach((button) => {
  button.addEventListener("click", () => {
    form.lengthFt.value = button.dataset.deckLength;
    form.widthFt.value = button.dataset.deckWidth;
    render();
  });
});
document.querySelector("#print-btn").addEventListener("click", () => window.print());
render();
