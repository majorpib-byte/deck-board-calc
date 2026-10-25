import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const script =
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2388538564495463" crossorigin="anonymous"></script>';

test("ads.txt is the single AdSense record", () => {
  const text = readFileSync(new URL("./ads.txt", import.meta.url), "utf8").trim();
  assert.equal(text, "google.com, pub-2388538564495463, DIRECT, f08c47fec0942fa0");
});

test("every html page has the static AdSense head script and account meta", () => {
  const pages = [
    "index.html",
    "calculators.html",
    "stain.html",
    "footings.html",
    "railing.html",
    "about.html",
    "contact.html",
    "privacy.html",
    "terms.html",
    "404.html",
    "guides/index.html",
    "guides/estimate-deck-boards.html",
    "guides/pressure-treated-vs-composite.html",
    "guides/board-gap-and-spacing.html",
    "guides/joist-spacing.html",
    "guides/lumberyard-order.html",
    "guides/screws-vs-hidden-fasteners.html",
  ];
  for (const page of pages) {
    const html = readFileSync(new URL(`./${page}`, import.meta.url), "utf8");
    assert.ok(html.includes(script), page);
    assert.ok(html.includes('name="google-adsense-account" content="ca-pub-2388538564495463"'), page);
    assert.ok(html.includes('rel="canonical"'), page);
    assert.ok(html.includes("Last updated October 25, 2026"), page);
  }
});
