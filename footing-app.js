import { footingEstimate } from "./footing.js";

const form = document.querySelector("#footing-form");
const bags = document.querySelector("#bags");
const detail = document.querySelector("#footing-detail");
const error = document.querySelector("#footing-error");
const summary = document.querySelector("#footing-summary");

function num(value, digits) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function render() {
  const result = footingEstimate({
    diameterIn: form.diameter.value,
    depthIn: form.depth.value,
    holes: form.holes.value,
    yieldCuFt: form.yield.value,
    wastePct: form.waste.value,
  });
  if (!result.ok) {
    bags.textContent = "—";
    detail.textContent = "";
    error.hidden = false;
    error.textContent = result.error;
    summary.textContent = result.error;
    return;
  }
  error.hidden = true;
  bags.textContent = String(result.bagsToBuy);
  const sentence = `Each hole is ${num(result.cubicFtEach, 2)} cubic feet. At ${num(result.yieldCuFt, 2)} cubic feet per bag that is ${num(result.exactBagsEach, 2)} bags a hole, ${num(result.exactBags, 2)} bags for ${result.holes} hole${result.holes === 1 ? "" : "s"}. With ${num(result.wastePct, 0)}% waste, buy ${result.bagsToBuy} bags.`;
  detail.textContent = sentence;
  summary.textContent = `${result.bagsToBuy} bags. ${sentence}`;
}

form.addEventListener("input", render);
document.querySelectorAll("[data-yield]").forEach((button) => {
  button.addEventListener("click", () => {
    form.yield.value = button.dataset.yield;
    render();
  });
});
document.querySelector("#print-btn").addEventListener("click", () => window.print());
render();
