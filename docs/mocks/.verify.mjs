// Verifier — loads every mock page at mobile / tablet / desktop widths,
// confirms components upgrade and rendered content matches, and captures a
// screenshot per (page, viewport) into ./.screenshots/.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:8765";

const PAGES = [
  { url: "/",                       expects: { selector: ".mock-launcher h1", text: "Saturdaze mocks" } },
  { url: "/pages/home.html",        expects: { tag: "sd-hero", shadowText: "Plan This Weekend" } },
  { url: "/pages/itinerary.html",   expects: { tag: "sd-timeline-block", shadowText: "Swim lessons" } },
  { url: "/pages/activities.html",  expects: { tag: "sd-activity-card", shadowText: "Terre Bleu" } },
  { url: "/pages/restaurants.html", expects: { tag: "sd-restaurant-card", shadowText: "La Marina" } },
  { url: "/pages/saved.html",       expects: { tag: "sd-saved-card", shadowText: "Bronte Creek" } },
  { url: "/pages/events.html",      expects: { tag: "sd-event-card", shadowText: "Lavender Bloom" } },
  { url: "/pages/errand.html",      expects: { tag: "sd-text-input", shadowText: "What's needed" } },
  { url: "/pages/profile.html",     expects: { tag: "sd-list-item", shadowText: "Quinn" } },
  { url: "/pages/dialogs.html",     expects: { tag: "sd-dialog", shadowText: "Terre Bleu Lavender Farm" } },
  { url: "/pages/components.html",  expects: { tag: "sd-button", shadowText: "Primary" } },
];

const VIEWPORTS = [
  { name: "mobile",  width: 440,  height: 900 },
  { name: "tablet",  width: 820,  height: 1100 },
  { name: "desktop", width: 1366, height: 900 },
];

await mkdir("./.screenshots", { recursive: true });

const results = [];
let failed = 0;

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const page of PAGES) {
    const p = await context.newPage();
    const errors = [];
    p.on("pageerror", e => errors.push("page: " + e.message));
    p.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });

    let ok = false;
    let why = "";
    try {
      const resp = await p.goto(BASE + page.url, { waitUntil: "load", timeout: 8000 });
      if (!resp || !resp.ok()) {
        why = `HTTP ${resp ? resp.status() : "?"}`;
      } else if (page.expects.selector) {
        await p.waitForSelector(page.expects.selector, { timeout: 5000 });
        const text = await p.textContent(page.expects.selector);
        ok = (text || "").includes(page.expects.text);
        if (!ok) why = `selector text mismatch: "${text}"`;
      } else {
        const tag = page.expects.tag;
        await p.waitForFunction(t => !!customElements.get(t), tag, { timeout: 5000 });
        await p.waitForSelector(tag, { timeout: 5000, state: "attached" });
        const found = await p.evaluate(({ tag, needle }) => {
          const els = document.querySelectorAll(tag);
          for (const el of els) {
            const root = el.shadowRoot || el;
            const txt = (root.textContent || "") + " " + (el.textContent || "");
            if (txt.includes(needle)) return true;
          }
          return false;
        }, { tag, needle: page.expects.shadowText });
        ok = found;
        if (!ok) why = `text "${page.expects.shadowText}" not found in <${tag}>`;
      }

      // Take a screenshot regardless of pass/fail to aid debugging.
      const safe = page.url.replace(/\W+/g, "_").replace(/^_+|_+$/g, "") || "root";
      await p.screenshot({
        path: `./.screenshots/${vp.name}__${safe}.png`,
        fullPage: false,
      });
    } catch (e) {
      why = e.message;
    }

    if (!ok) failed++;
    results.push({ viewport: vp.name, url: page.url, ok, why, errors });
    await p.close();
  }
  await context.close();
}

await browser.close();

console.log("\n=== Saturdaze responsive verification ===\n");
let lastVp = "";
for (const r of results) {
  if (r.viewport !== lastVp) {
    console.log(`\n[${r.viewport}]`);
    lastVp = r.viewport;
  }
  const mark = r.ok ? "OK " : "FAIL";
  console.log(`  ${mark}  ${r.url}${r.why ? "   — " + r.why : ""}`);
  for (const e of r.errors) console.log("         ! " + e);
}
console.log(`\n${results.length - failed}/${results.length} checks passed across ${VIEWPORTS.length} viewports.`);
console.log(`Screenshots in ./.screenshots/`);
process.exit(failed === 0 ? 0 : 1);
