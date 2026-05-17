// Verifier — loads every mock page at mobile / tablet / desktop widths,
// confirms components upgrade and rendered content matches, and captures a
// screenshot per (page, viewport) into ./.screenshots/.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:8765";

const PAGES = [
  { url: "/",                       expects: { selector: ".mock-launcher h1", text: "Saturdaze mocks" } },

  // Base screens
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

  // New public + legal pages (docs/mocks-plan.md M-P1 / M-P2 / M-P4)
  { url: "/pages/terms.html",            expects: { selector: ".legal h1", text: "Terms of Service" } },
  { url: "/pages/privacy.html",          expects: { selector: ".legal h1", text: "Privacy Policy" } },
  { url: "/pages/sample-weekend.html",   expects: { tag: "sd-hero", shadowText: "Morning, sample family" } },

  // Auth flow state variants (M-S1, M-S2, M-S3, M-S4, M-S6, M-S7, M-S8)
  { url: "/pages/forgot-password.error.html",   expects: { selector: ".form-error strong", text: "Couldn't send" } },
  { url: "/pages/check-email.with-email.html",  expects: { selector: ".email-chip", text: "quinntynebrown@gmail.com" } },
  { url: "/pages/check-email.empty.html",       expects: { selector: ".auth-card h1", text: "Where should I send" } },
  { url: "/pages/verify-email.verifying.html",  expects: { selector: ".auth-card h1", text: "Confirming your email" } },
  { url: "/pages/verify-email.expired.html",    expects: { selector: ".auth-card h1", text: "This link has expired" } },
  { url: "/pages/reset-password.success.html",  expects: { selector: ".auth-card h1", text: "Password updated" } },
  { url: "/pages/reset-password.expired.html",  expects: { selector: ".auth-card h1", text: "Reset link expired" } },

  // App state variants (M-S9 .. M-S19)
  { url: "/pages/home.empty.html",             expects: { selector: ".first-run-hero h2", text: "first weekend" } },
  { url: "/pages/home.generating.html",        expects: { selector: ".gen-hero h2", text: "Sketching" } },
  { url: "/pages/home.lock-mode.html",         expects: { selector: ".lock-mode-strip .title", text: "Tap to lock" } },
  { url: "/pages/itinerary.sunday.html",       expects: { tag: "sd-timeline-block", shadowText: "Rec Room" } },
  { url: "/pages/itinerary.locked-day.html",   expects: { selector: ".locked-banner .title", text: "Saturday is locked" } },
  { url: "/pages/restaurants.refreshing.html", expects: { selector: ".refresh-status", text: "Refreshing" } },
  { url: "/pages/restaurants.voted.html",      expects: { tag: "sd-vote-row", shadowText: "Quinn" } },
  { url: "/pages/restaurants.consensus.html",  expects: { selector: ".consensus .label", text: "4 of 4 yes" } },
  { url: "/pages/restaurants.locked.html",     expects: { selector: ".locked-card .name", text: "La Marina" } },
  { url: "/pages/errand.alt-slots.html",       expects: { selector: ".slot .when", text: "Sunday 9:15am" } },
  { url: "/pages/errand.added.html",           expects: { selector: ".added-card h1", text: "Added to Sunday" } },
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
