#!/usr/bin/env node
// docs/mocks-v2/.verify.mjs — renders every v2 mock page in Chromium at five
// widths (320 / 390 / 820 / 1440 / 1920) and, per page x width, requires:
//   1. a 2xx document and no failed or >= 400 subresource
//   2. the `expects` text to be present
//   3. zero console errors and zero page errors
//   4. no horizontal overflow: scrollWidth <= innerWidth AND an element walk
//      (ported from e2e/fixtures/overflow.ts, sees through html/body
//      overflow-x: clip) finds nothing past the viewport edge
//   5. shell chrome: app pages show .bottom-nav below 720px and .topbar from
//      720px, never both; the `nav` link (and only it) carries
//      aria-current="page" in the visible nav; bare pages have neither
//   6. optional `cols` grid-column counts at a given width
//   7. fonts settled (document.fonts.ready) before any screenshot
// Once per run: styles/app.css must contain the ADR-005 clearance rule.
//
// Screenshots: viewport crops at mobile/tablet/desktop into ./.screenshots/
// (<viewport>__<slug>.png). With --capture, full-page PNGs with animations
// frozen also land in ./screenshots/<slug>.<viewport>.png (index: desktop
// only).
//
//   node docs/mocks-v2/.verify.mjs               # serves docs/mocks-v2 on :5180
//   node docs/mocks-v2/.verify.mjs --capture     # + full-page captures
//   SD_MOCKS_PORT=5175 node docs/mocks-v2/.verify.mjs
//   SD_MOCKS_URL=http://localhost:5173 node docs/mocks-v2/.verify.mjs   # no built-in server
//
// Playwright is resolved from e2e/node_modules (nothing is installed above docs/).

import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { createReadStream, readFileSync, statSync } from "node:fs";
import { resolve, dirname, extname, join, relative, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../../e2e/package.json", import.meta.url));

// ---------------------------------------------------------------- pages
//
// Row fields:
//   url      path served from docs/mocks-v2 ("/" = index.html)
//   shell    "app" (default) or "bare"
//   nav      data-nav of the link that must carry aria-current="page"
//            (null = no link is current; omit = don't check)
//   expects  { selector, text } — textContent of the first match contains text
//   cols     { selector: { width: n } } — grid column count at that width

export const PAGES = [
  { url: "/",                     shell: "bare", expects: { selector: ".launcher h1", text: "Saturdaze mocks v2" } },
  { url: "/pages/_shell.html",    nav: null,     expects: { selector: "main h1", text: "Shell" } },

  // Core
  { url: "/pages/weekend.html",            nav: "weekend", expects: { selector: ".day__header", text: "Saturday" },                         cols: { ".grid-days": { 390: 1, 820: 1, 1440: 2, 1920: 2 } } },
  { url: "/pages/ideas.html",              nav: "ideas",   expects: { selector: '.segments__tab[aria-current="page"]', text: "Activities" }, cols: { ".grid-cards": { 390: 1, 820: 2, 1440: 3 } } },
  { url: "/pages/ideas.food.html",         nav: "ideas",   expects: { selector: '.segments__tab[aria-current="page"]', text: "Food" },       cols: { ".grid-cards": { 390: 1, 820: 2, 1440: 2 } } },
  { url: "/pages/ideas.events.html",       nav: "ideas",   expects: { selector: '.segments__tab[aria-current="page"]', text: "Events" },     cols: { ".grid-cards": { 390: 1, 820: 2, 1440: 3 } } },
  { url: "/pages/past.html",               nav: "past",    expects: { selector: ".page-header__title", text: "Past weekends" },              cols: { ".grid-cards": { 390: 1, 820: 2, 1440: 3 } } },
  { url: "/pages/family.html",             nav: "family",  expects: { selector: ".page-header__title", text: "The Browns" },                 cols: { ".family-grid": { 390: 1, 820: 1, 1440: 2 } } },
  { url: "/pages/review-submissions.html", nav: "family",  expects: { selector: ".page-header__title", text: "Review submissions" } },

  // States
  { url: "/pages/weekend.empty.html",            nav: "weekend", expects: { selector: ".empty__title", text: "drafted around the Browns" } },
  { url: "/pages/weekend.generating.html",       nav: "weekend", expects: { selector: ".status-row", text: "Working through" } },
  { url: "/pages/past.empty.html",               nav: "past",    expects: { selector: ".empty__title", text: "Nothing here yet" } },
  { url: "/pages/review-submissions.empty.html", nav: "family",  expects: { selector: ".empty__title", text: "Queue is clear" } },

  // Auth (bare shell, stacked states addressed by id)
  { url: "/pages/sign-in.html",        shell: "bare", expects: { selector: "#state-error .banner", text: "did not match" } },
  { url: "/pages/create-account.html", shell: "bare", expects: { selector: ".auth-card__title", text: "Start planning weekends" } },
  { url: "/pages/reset-password.html", shell: "bare", expects: { selector: "#state-expired .auth-card__title", text: "This link has expired" } },
  { url: "/pages/verify-email.html",   shell: "bare", expects: { selector: "#state-verified .auth-card__title", text: "You are verified" } },

  // Public
  { url: "/pages/landing.html", shell: "bare", expects: { selector: ".hero__title", text: "Already planned" }, cols: { ".hero__grid": { 390: 1, 820: 1, 1440: 2 }, ".steps": { 390: 1, 820: 3, 1440: 3 } } },
  { url: "/pages/legal.html",   shell: "bare", expects: { selector: ".prose__title", text: "Terms of Service" } },

  // Dialogs gallery
  { url: "/pages/dialogs.html", nav: null, expects: { selector: "#dialog-block .dialog__title", text: "Terre Bleu Lavender Farm" } },
];

export const VIEWPORTS = [
  { label: "narrow",  width: 320,  height: 568 },
  { label: "mobile",  width: 390,  height: 844,  shot: "mobile" },
  { label: "tablet",  width: 820,  height: 1180, shot: "tablet" },
  { label: "desktop", width: 1440, height: 900,  shot: "desktop" },
  { label: "wide",    width: 1920, height: 1080 },
];

const TOPBAR_MIN_WIDTH = 720;
const PAGE_TIMEOUT = 10_000;
const MAX_OFFENDERS_SHOWN = 5;
const ADR005_RULE = "max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px))";

const ROOT = dirname(fileURLToPath(import.meta.url)); // docs/mocks-v2
const REPO = resolve(ROOT, "..", "..");
const SHOT_DIR = join(ROOT, ".screenshots");
const CAPTURE_DIR = join(ROOT, "screenshots");
const rel = (abs) => relative(REPO, abs).split(sep).join("/");

// ---------------------------------------------------------------- static server

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function startServer(root, port) {
  const server = createServer((req, res) => {
    const notFound = () => {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("not found");
    };
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url ?? "/").split("?")[0].split("#")[0]);
    } catch {
      return notFound();
    }
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = resolve(root, "." + urlPath);
    if (!filePath.startsWith(root + sep)) return notFound(); // no escaping the folder
    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      return notFound();
    }
    if (!stat.isFile()) return notFound(); // no directory listing
    res.writeHead(200, {
      "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(filePath).pipe(res);
  });
  return new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => ok(server));
  });
}

// ---------------------------------------------------------------- in-page probes

/** Port of e2e/fixtures/overflow.ts (no shadow roots in the mocks). */
function measureOverflow() {
  const MAX = 25;
  const TOLERANCE = 1;
  const innerWidth = window.innerWidth;
  const minLeft = -TOLERANCE;
  const maxRight = innerWidth + TOLERANCE;
  const offenders = [];
  const seen = new Set();

  const describe = (el, rect) => {
    const id = el.id ? "#" + el.id : "";
    const cls = el.classList.length ? "." + Array.from(el.classList).slice(0, 3).join(".") : "";
    return `${el.tagName.toLowerCase()}${id}${cls} (${Math.round(rect.left)}..${Math.round(rect.right)})`;
  };

  // clipLeft/clipRight: bounds imposed by ancestors that clip or scroll.
  // Infinite at the root — the html/body clip is the mask under audit.
  const walk = (el, clipLeft, clipRight) => {
    if (seen.has(el)) return;
    seen.add(el);
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const visible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    const overflowX = style.overflowX;
    const isScroller = overflowX === "auto" || overflowX === "scroll";

    if (visible) {
      // A scroller is judged by its content box: full-bleed padding may hang past the edge.
      let boxLeft = rect.left;
      let boxRight = rect.right;
      if (isScroller) {
        boxLeft += parseFloat(style.paddingLeft) || 0;
        boxRight -= parseFloat(style.paddingRight) || 0;
      }
      const effectiveLeft = Math.max(boxLeft, clipLeft);
      const effectiveRight = Math.min(boxRight, clipRight);
      if (
        effectiveRight - effectiveLeft > 0 &&
        (effectiveLeft < minLeft || effectiveRight > maxRight) &&
        offenders.length < MAX
      ) {
        offenders.push(describe(el, rect));
      }
    }

    // Inside a horizontal scroller everything can be scrolled into view.
    if (visible && isScroller) return;

    let childClipLeft = clipLeft;
    let childClipRight = clipRight;
    if (visible && (overflowX === "hidden" || overflowX === "clip")) {
      childClipLeft = Math.max(childClipLeft, rect.left);
      childClipRight = Math.min(childClipRight, rect.right);
    }
    for (const child of Array.from(el.children)) walk(child, childClipLeft, childClipRight);
  };

  for (const child of Array.from(document.body.children)) walk(child, -Infinity, Infinity);
  return { innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
}

function inspectShell() {
  const probe = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return { exists: false, visible: false, links: [] };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const visible = cs.display !== "none" && cs.visibility !== "hidden" && rect.height > 0;
    const links = Array.from(el.querySelectorAll("[data-nav]")).map((a) => ({
      nav: a.getAttribute("data-nav"),
      current: a.getAttribute("aria-current") === "page",
    }));
    return { exists: true, visible, links };
  };
  return { topbar: probe(".topbar"), bottomNav: probe(".bottom-nav") };
}

function gridColumnCount(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return getComputedStyle(el).gridTemplateColumns.split(" ").length;
}

// ---------------------------------------------------------------- one page x viewport

const shotSlug = (url) => url.replace(/\W+/g, "_").replace(/^_+|_+$/g, "") || "root";
const fileSlug = (url) => {
  const name = basename(url.split(/[?#]/)[0]);
  return name === "" ? "index" : name.replace(/\.html$/i, "");
};
const shortUrl = (url, base) => (url.startsWith(base) ? url.slice(base.length) : url);
const SELECTOR = { topbar: ".topbar", bottomNav: ".bottom-nav" };

async function checkPage(context, vp, row, base, opts) {
  const page = await context.newPage();
  const reasons = [];
  const details = [];
  const netErrors = [];
  const consoleErrors = [];

  page.on("response", (r) => {
    if (r.status() >= 400 && !r.request().isNavigationRequest()) {
      netErrors.push(`${r.status()} ${shortUrl(r.url(), base)}`);
    }
  });
  page.on("requestfailed", (r) => {
    if (!r.isNavigationRequest()) {
      netErrors.push(`failed ${shortUrl(r.url(), base)} (${r.failure()?.errorText ?? "unknown"})`);
    }
  });
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push("console: " + m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  try {
    const resp = await page.goto(base + row.url, { waitUntil: "load", timeout: PAGE_TIMEOUT });
    if (!resp) reasons.push("no response");
    else if (!resp.ok()) reasons.push(`HTTP ${resp.status()}`);
    else {
      await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});

      // 2. expected text
      if (row.expects) {
        const { selector, text } = row.expects;
        const el = await page.$(selector);
        if (!el) reasons.push(`expects: no element matches "${selector}"`);
        else {
          const got = (await el.textContent()) ?? "";
          if (!got.includes(text)) {
            reasons.push(`expects: "${selector}" text does not contain "${text}"`);
            details.push(`text: ${JSON.stringify(got.trim().slice(0, 120))}`);
          }
        }
      }

      // 4. horizontal overflow
      const ov = await page.evaluate(measureOverflow);
      if (ov.scrollWidth > ov.innerWidth) {
        reasons.push(`overflow: scrollWidth ${ov.scrollWidth} > innerWidth ${ov.innerWidth}`);
      }
      if (ov.offenders.length) {
        reasons.push(`overflow: ${ov.offenders.length} element(s) past the viewport edge`);
        for (const o of ov.offenders.slice(0, MAX_OFFENDERS_SHOWN)) details.push(o);
        if (ov.offenders.length > MAX_OFFENDERS_SHOWN) {
          details.push(`… +${ov.offenders.length - MAX_OFFENDERS_SHOWN} more`);
        }
      }

      // 5. shell chrome
      const shell = row.shell ?? "app";
      const s = await page.evaluate(inspectShell);
      if (shell === "bare") {
        const present = [s.topbar.exists && SELECTOR.topbar, s.bottomNav.exists && SELECTOR.bottomNav].filter(Boolean);
        if (present.length) reasons.push(`shell: bare page must not contain ${present.join(" or ")}`);
      } else {
        const phone = vp.width < TOPBAR_MIN_WIDTH;
        const shown = phone ? "bottomNav" : "topbar";
        const hidden = phone ? "topbar" : "bottomNav";
        if (!s[shown].visible) {
          reasons.push(`shell: ${SELECTOR[shown]} should be visible at ${vp.width}px${s[shown].exists ? "" : " (not in DOM)"}`);
        }
        if (s[hidden].visible) reasons.push(`shell: ${SELECTOR[hidden]} should be hidden at ${vp.width}px`);
        if (row.nav !== undefined && s[shown].exists) {
          const links = s[shown].links;
          const current = links.filter((l) => l.current).map((l) => l.nav);
          const expected = row.nav === null ? [] : links.filter((l) => l.nav === row.nav).map((l) => l.nav);
          if (row.nav !== null && expected.length === 0) {
            reasons.push(`nav: no ${SELECTOR[shown]} link has data-nav="${row.nav}"`);
          } else if (current.join(",") !== expected.join(",")) {
            reasons.push(
              `nav: aria-current="page" on [${current.join(", ") || "none"}], expected [${expected.join(", ") || "none"}] in ${SELECTOR[shown]}`,
            );
          }
        }
      }

      // 6. grid columns
      if (row.cols) {
        for (const [selector, byWidth] of Object.entries(row.cols)) {
          const want = byWidth[vp.width];
          if (want === undefined) continue;
          const got = await page.evaluate(gridColumnCount, selector);
          if (got === null) reasons.push(`cols: no element matches "${selector}"`);
          else if (got !== want) reasons.push(`cols: "${selector}" has ${got} column(s) at ${vp.width}px, expected ${want}`);
        }
      }

      // 7. screenshots (fonts already settled above)
      if (vp.shot) {
        await page.screenshot({ path: join(SHOT_DIR, `${vp.shot}__${shotSlug(row.url)}.png`), fullPage: false });
        if (opts.capture && (row.url !== "/" || vp.shot === "desktop")) {
          await page.screenshot({
            path: join(CAPTURE_DIR, `${fileSlug(row.url)}.${vp.shot}.png`),
            fullPage: true,
            animations: "disabled",
          });
        }
      }
    }
  } catch (e) {
    reasons.push(String(e.message ?? e).split("\n")[0]);
  }

  // 1. subresources / 3. console — collected throughout the visit
  if (netErrors.length) {
    reasons.push(`${netErrors.length} failed subresource(s)`);
    for (const n of netErrors) details.push("net: " + n);
  }
  if (consoleErrors.length) {
    reasons.push(`${consoleErrors.length} console/page error(s)`);
    for (const c of consoleErrors) details.push(c);
  }

  await page.close();
  return { group: vp.label, label: row.url, ok: reasons.length === 0, reasons, details };
}

// ---------------------------------------------------------------- run

async function main() {
  const capture = process.argv.includes("--capture");
  const results = [];

  // Static check, once per run.
  let appCss = null;
  try {
    appCss = readFileSync(join(ROOT, "styles", "app.css"), "utf8");
  } catch {
    /* missing */
  }
  const hasRule = appCss !== null && appCss.includes(ADR005_RULE);
  results.push({
    group: "static",
    label: "styles/app.css",
    ok: hasRule,
    reasons: appCss === null ? ["missing"] : hasRule ? [] : [`missing the ADR-005 clearance rule ${ADR005_RULE}`],
    details: [],
  });

  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error(`Could not load Playwright from e2e/node_modules: ${e.message}`);
    console.error("Run `cd e2e; npm install` and retry.");
    process.exit(2);
  }

  let server = null;
  let base;
  if (process.env.SD_MOCKS_URL) {
    base = process.env.SD_MOCKS_URL.replace(/\/+$/, "");
  } else {
    const port = Number(process.env.SD_MOCKS_PORT || 5180);
    try {
      server = await startServer(ROOT, port);
    } catch (e) {
      console.error(`Could not serve ${rel(ROOT)} on port ${port}: ${e.message}`);
      console.error("Set SD_MOCKS_PORT to a free port, or SD_MOCKS_URL to an already-running server.");
      process.exit(2);
    }
    base = `http://127.0.0.1:${port}`;
  }

  await mkdir(SHOT_DIR, { recursive: true });
  if (capture) await mkdir(CAPTURE_DIR, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error(`Could not launch Chromium: ${String(e.message).split("\n")[0]}`);
    console.error("Run `cd e2e; npx playwright install chromium` and retry.");
    server?.close();
    process.exit(2);
  }

  try {
    for (const vp of VIEWPORTS) {
      // No reducedMotion here: shimmer runs live; only --capture freezes animations.
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      context.setDefaultTimeout(PAGE_TIMEOUT);
      for (const row of PAGES) results.push(await checkPage(context, vp, row, base, { capture }));
      await context.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }

  // Report, grouped by viewport.
  console.log("\n=== Saturdaze mocks v2 verification ===");
  let lastGroup = null;
  for (const r of results) {
    if (r.group !== lastGroup) {
      const vp = VIEWPORTS.find((v) => v.label === r.group);
      console.log(`\n[${r.group}${vp ? ` ${vp.width}x${vp.height}` : ""}]`);
      lastGroup = r.group;
    }
    console.log(`  ${r.ok ? "OK  " : "FAIL"} ${r.label}${r.reasons.length ? " — " + r.reasons.join("; ") : ""}`);
    for (const d of r.details) console.log(`         ! ${d}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed across ${VIEWPORTS.length} widths.`);
  console.log(`Screenshots in ${rel(SHOT_DIR)}/${capture ? ` and ${rel(CAPTURE_DIR)}/` : ""}`);
  process.exit(failed ? 1 : 0);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
