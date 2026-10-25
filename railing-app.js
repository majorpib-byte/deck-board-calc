import { railingEstimate } from "./railing.js";

const form = document.querySelector("#railing-form");
const buy = document.querySelector("#balusters");
const detail = document.querySelector("#railing-detail");
const error = document.querySelector("#railing-error");
const summary = document.querySelector("#railing-summary");

function num(value, digits) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function render() {
  const result = railingEstimate({
    lengthFt: form.lengthFt.value,
    sectionFt: form.sectionFt.value,
    balusterIn: form.baluster.value,
    maxGapIn: form.maxGap.value,
    wastePct: form.waste.value,
    closedLoop: form.closed.checked,
  });
  if (!result.ok) {
    buy.textContent = "—";
    detail.textContent = "";
    error.hidden = false;
    error.textContent = result.error;
    summary.textContent = result.error;
    return;
  }
  error.hidden = true;
  buy.textContent = String(result.toBuy);
  const opening = num(result.openingIn, 2);
  const sentence = `${num(result.sections, 0)} equal section${result.sections === 1 ? "" : "s"} of ${num(result.eachFt, 2)} ft. Each section needs ${result.perSection} balusters, with an opening of ${opening} in (your maximum is ${num(result.maxGapIn, 2)} in). That is ${result.cover} balusters before waste and ${result.toBuy} to buy at ${num(result.wastePct, 0)}% waste. ${result.closedLoop ? "Closed loop" : "Straight run"}: ${result.posts} posts.`;
  detail.textContent = sentence;
  summary.textContent = `${result.toBuy} balusters. ${sentence}`;
}

form.addEventListener("input", render);
document.querySelector("#print-btn").addEventListener("click", () => window.print());
render();
