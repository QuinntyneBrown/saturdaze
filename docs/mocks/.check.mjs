#!/usr/bin/env node
// docs/mocks-v2/.check.mjs — static lint for the v2 mock set.
//
//   node docs/mocks-v2/.check.mjs        (any cwd; no dependencies; < 1s)
//
// Prints one line per finding as `file:line  message`, grouped under a
// heading per check, then `check: N finding(s)`. Exit 1 when N > 0.
//
// Checks, in order:
//   1. every page carries <body data-page data-shell="app|bare">; the
//      @shell:head / @shell:topbar / @shell:bottomnav regions match the
//      canonical copy in pages/_shell.html (bare pages: head only, and no
//      .topbar / .bottom-nav markup at all)
//   2. styles/tokens.css = provenance comment + verbatim
//      design-system/assets/tokens.css
//   3. no <style> tags or style="" attributes (page CSS lives in app.css)
//   4. index.html tiles <-> pages/*.html (non-underscore) is a bijection
//   5. <use href="#i-…"> names are keys of ICONS in app.js; every relative
//      href/src resolves to a file
//   6. ADR-005 strings are present (app.css rule, viewport-fit=cover,
//      trackBottomChrome)
//   7. <a>/<button> have an accessible name; state-*/dialog-* ids are unique

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join, relative, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)); // docs/mocks-v2
const REPO = resolve(ROOT, "..", "..");
const PAGES_DIR = join(ROOT, "pages");
const F = {
  index: join(ROOT, "index.html"),
  appJs: join(ROOT, "app.js"),
  appCss: join(ROOT, "styles", "app.css"),
  tokens: join(ROOT, "styles", "tokens.css"),
  tokensSrc: resolve(REPO, "design-system", "assets", "tokens.css"),
  shell: join(PAGES_DIR, "_shell.html"),
};
const ADR005_RULE = "max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px))";
const REGIONS = ["head", "topbar", "bottomnav"];

// ---------------------------------------------------------------- helpers

const rel = (abs) => relative(REPO, abs).split(sep).join("/");
const readText = (abs) => {
  try {
    return statSync(abs).isFile() ? readFileSync(abs, "utf8") : null;
  } catch {
    return null;
  }
};
const lineAt = (text, index) => text.slice(0, index).split("\n").length;
const show = (s) => (s === undefined ? "<end of region>" : JSON.stringify(s.trim().slice(0, 80)));
/** Blank out HTML comments but keep every newline so line numbers survive. */
const withoutComments = (text) => text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));

let total = 0;
let sectionStart = -1; // `total` when the current section opened; -1 = none open
function closeSection() {
  if (sectionStart >= 0 && total === sectionStart) console.log("  ok");
}
function section(title) {
  closeSection();
  console.log(`\n[${title}]`);
  sectionStart = total;
}
function finding(file, line, message) {
  total++;
  console.log(`${rel(file)}${line ? ":" + line : ""}  ${message}`);
}
function info(message) {
  console.log(`  ${message}`);
}

// ---------------------------------------------------------------- inputs

const pageFiles = existsSync(PAGES_DIR)
  ? readdirSync(PAGES_DIR)
      .filter((f) => f.toLowerCase().endsWith(".html"))
      .sort()
      .map((f) => join(PAGES_DIR, f))
  : [];
const pages = pageFiles
  .map((abs) => ({ abs, name: basename(abs), text: readText(abs) }))
  .filter((p) => p.text !== null);
const screenPages = pages.filter((p) => !p.name.startsWith("_"));
const indexText = readText(F.index);
const htmlFiles = [
  ...pages,
  ...(indexText !== null ? [{ abs: F.index, name: "index.html", text: indexText }] : []),
];

function bodyInfo(text) {
  const m = /<body\b([^>]*)>/i.exec(text);
  if (!m) return null;
  const get = (n) => {
    const a = new RegExp(`\\b${n}\\s*=\\s*"([^"]*)"`, "i").exec(m[1]);
    return a ? a[1] : null;
  };
  return { line: lineAt(text, m.index), page: get("data-page"), shell: get("data-shell") };
}

function regionsOf(text) {
  const out = {};
  for (const r of REGIONS) {
    const re = new RegExp(`<!--\\s*@shell:${r}\\s*-->([\\s\\S]*?)<!--\\s*@/shell:${r}\\s*-->`, "g");
    out[r] = [...text.matchAll(re)].map((m) => ({ body: m[1], index: m.index, line: lineAt(text, m.index) }));
  }
  return out;
}

function normaliseRegion(s) {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/<title>[\s\S]*?<\/title>/gi, "<title>__TITLE__</title>")
    .replace(/ aria-current="page"/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

/** Number of leading blank lines a region body has before normalisation eats them. */
function leadingBlankLines(raw) {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let n = 0;
  while (n < lines.length && lines[n].trim() === "") n++;
  return n;
}

function firstDiff(got, expected) {
  const a = got.split("\n");
  const b = expected.split("\n");
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return { line: i + 1, expected: b[i], got: a[i] };
  return null;
}

// ---------------------------------------------------------------- 1. shell

section("1. shell regions vs pages/_shell.html");
if (!existsSync(PAGES_DIR)) finding(PAGES_DIR, 0, "pages/ directory missing");
else if (pages.length === 0) finding(PAGES_DIR, 0, "no pages/*.html yet");

const shellText = readText(F.shell);
const shellRegions = shellText === null ? null : regionsOf(shellText);
if (shellText === null) finding(F.shell, 0, "missing — region comparison skipped");
else {
  for (const r of REGIONS) {
    if (shellRegions[r].length !== 1) {
      finding(F.shell, 0, `expected exactly one @shell:${r} region, found ${shellRegions[r].length}`);
    }
  }
}

for (const p of pages) {
  const body = bodyInfo(p.text);
  if (!body) {
    finding(p.abs, 0, "no <body> tag");
    continue;
  }
  const slug = p.name.replace(/\.html$/i, "").split(".")[0];
  if (!body.page) finding(p.abs, body.line, 'body lacks data-page="<route>"');
  else if (!p.name.startsWith("_") && body.page !== slug) {
    finding(p.abs, body.line, `data-page="${body.page}" should be "${slug}" (route slug of ${p.name})`);
  }
  if (body.shell !== "app" && body.shell !== "bare") {
    const found = body.shell === null ? "none" : `"${body.shell}"`;
    finding(p.abs, body.line, `body lacks data-shell="app|bare" (found ${found})`);
  }
  p.shell = body.shell;
  if (!shellRegions || p.abs === F.shell) continue;

  const own = regionsOf(p.text);
  const wanted = body.shell === "bare" ? ["head"] : REGIONS;
  const headOpen = p.text.search(/<head\b/i);
  const headClose = p.text.search(/<\/head\s*>/i);
  const bodyOpen = p.text.search(/<body\b/i);
  const bodyClose = p.text.search(/<\/body\s*>/i);

  for (const r of wanted) {
    const found = own[r];
    if (found.length === 0) {
      finding(p.abs, 0, `missing <!-- @shell:${r} --> … <!-- @/shell:${r} --> region`);
      continue;
    }
    if (found.length > 1) finding(p.abs, found[1].line, `duplicate @shell:${r} region`);
    const [lo, hi] = r === "head" ? [headOpen, headClose] : [bodyOpen, bodyClose];
    if (lo >= 0 && hi >= 0 && !(found[0].index > lo && found[0].index < hi)) {
      finding(p.abs, found[0].line, `@shell:${r} region must sit inside <${r === "head" ? "head" : "body"}>`);
    }
    const canon = shellRegions[r][0];
    if (!canon) continue;
    const diff = firstDiff(normaliseRegion(found[0].body), normaliseRegion(canon.body));
    if (diff) {
      const line = found[0].line + leadingBlankLines(found[0].body) + diff.line - 1;
      finding(
        p.abs,
        line,
        `@shell:${r} differs from _shell.html (region line ${diff.line}): expected ${show(diff.expected)}, got ${show(diff.got)}`,
      );
    }
  }

  if (body.shell === "bare") {
    for (const r of ["topbar", "bottomnav"]) {
      for (const f of own[r]) finding(p.abs, f.line, `bare page must not contain the @shell:${r} region`);
    }
    const chromeLines = new Map(); // line -> first offending class
    for (const m of withoutComments(p.text).matchAll(/\bclass\s*=\s*"([^"]*)"/g)) {
      const bad = m[1].split(/\s+/).find((c) => /^(topbar|bottom-nav)(__|--|$)/.test(c));
      if (bad) {
        const line = lineAt(p.text, m.index);
        if (!chromeLines.has(line)) chromeLines.set(line, bad);
      }
    }
    for (const [line, cls] of chromeLines) {
      finding(p.abs, line, `bare page must not contain shell chrome markup (class "${cls}")`);
    }
  }
}

// ---------------------------------------------------------------- 2. tokens

section("2. styles/tokens.css is a verbatim copy of design-system/assets/tokens.css");
const tokens = readText(F.tokens);
const tokensSrc = readText(F.tokensSrc);
if (tokens === null) finding(F.tokens, 0, "missing");
if (tokensSrc === null) finding(F.tokensSrc, 0, "missing (source of truth)");
if (tokens !== null) {
  const t = tokens.replace(/\r\n?/g, "\n");
  const header = /^\s*\/\*[\s\S]*?\*\//.exec(t);
  if (!header) finding(F.tokens, 1, "must start with a provenance comment block (/* … */)");
  else {
    const sha = /sha ([0-9a-f]{7,})/i.exec(header[0]);
    if (sha) info(`provenance header claims sha ${sha[1]}`);
    else finding(F.tokens, 1, "provenance header names no source sha (expected 'sha <hex>')");
    if (tokensSrc !== null) {
      let rest = t.slice(header.index + header[0].length);
      rest = rest.replace(/^[ \t]*\n/, ""); // remainder of the comment's own line
      rest = rest.replace(/^[ \t]*\n/, ""); // one optional blank line
      const headerLines = t.slice(0, t.length - rest.length).split("\n").length - 1;
      const got = rest.replace(/\n+$/, "");
      const want = tokensSrc.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
      if (got !== want) {
        const d = firstDiff(got, want);
        finding(
          F.tokens,
          headerLines + d.line,
          `drifts from ${rel(F.tokensSrc)} (source line ${d.line}): expected ${show(d.expected)}, got ${show(d.got)}`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------- 3. no inline CSS

section("3. no <style> tags or style= attributes");
for (const f of htmlFiles) {
  const text = withoutComments(f.text);
  for (const m of text.matchAll(/<style\b/gi)) {
    finding(f.abs, lineAt(text, m.index), "<style> tag — page CSS belongs in styles/app.css");
  }
  for (const m of text.matchAll(/\sstyle\s*=\s*["']/gi)) {
    finding(f.abs, lineAt(text, m.index), 'style="…" attribute — use a class in styles/app.css');
  }
}

// ---------------------------------------------------------------- 4. index <-> pages

section("4. index.html tiles <-> pages/*.html");
if (indexText === null) finding(F.index, 0, "missing");
else {
  const text = withoutComments(indexText);
  const anchors = [...text.matchAll(/<a\b[^>]*>/gi)].filter((m) => /\bclass\s*=\s*"[^"]*\btile\b[^"]*"/i.test(m[0]));
  const tiles = new Map(); // absolute target -> first line
  if (anchors.length === 0) finding(F.index, 0, 'no <a class="tile" href="…"> tiles');
  for (const m of anchors) {
    const line = lineAt(text, m.index);
    const h = /\bhref\s*=\s*"([^"]*)"/i.exec(m[0]);
    if (!h) {
      finding(F.index, line, "tile without href");
      continue;
    }
    const path = h[1].split(/[?#]/)[0];
    const target = path.startsWith("/") ? resolve(ROOT, "." + path) : resolve(ROOT, path);
    if (!existsSync(target)) {
      finding(F.index, line, `tile href "${h[1]}" does not resolve to a file`);
      continue;
    }
    if (tiles.has(target)) finding(F.index, line, `duplicate tile for ${rel(target)} (first at line ${tiles.get(target)})`);
    else tiles.set(target, line);
  }
  for (const p of screenPages) {
    if (!tiles.has(resolve(p.abs))) finding(p.abs, 0, "no tile in index.html");
  }
}

// ---------------------------------------------------------------- 5. icons + links

section("5. icon hrefs match app.js ICONS; relative href/src resolve to files");
const appJs = readText(F.appJs);
let iconKeys = null;
if (appJs === null) finding(F.appJs, 0, "missing — icon names not checked");
else {
  const start = appJs.search(/var ICONS\s*=\s*\{/);
  if (start < 0) finding(F.appJs, 0, "no `var ICONS = {` block — icon names not checked");
  else {
    const end = appJs.indexOf("};", start);
    const block = appJs.slice(start, end < 0 ? undefined : end);
    iconKeys = new Set([...block.matchAll(/^\s*([a-z_]+):\s*'/gm)].map((m) => m[1]));
    info(`${iconKeys.size} icon(s) defined in app.js ICONS`);
  }
}
const SKIP_SCHEME = /^(#|https?:\/\/|\/\/|mailto:|tel:|javascript:|data:|blob:)/i;
for (const f of htmlFiles) {
  const text = withoutComments(f.text);
  if (iconKeys) {
    for (const m of text.matchAll(/\bhref\s*=\s*["']#i-([^"']*)["']/gi)) {
      if (!iconKeys.has(m[1])) finding(f.abs, lineAt(text, m.index), `icon "${m[1]}" is not a key of ICONS in app.js`);
    }
  }
  for (const m of text.matchAll(/\b(href|src)\s*=\s*["']([^"']*)["']/gi)) {
    const value = m[2].trim();
    if (value === "" || SKIP_SCHEME.test(value)) continue;
    const path = value.split(/[?#]/)[0];
    if (path === "") continue;
    let target;
    try {
      target = path.startsWith("/") ? resolve(ROOT, "." + path) : resolve(dirname(f.abs), decodeURIComponent(path));
    } catch {
      target = resolve(dirname(f.abs), path);
    }
    if (!existsSync(target)) finding(f.abs, lineAt(text, m.index), `${m[1]}="${value}" does not resolve to a file`);
  }
}

// ---------------------------------------------------------------- 6. ADR-005

section("6. ADR-005 bottom-chrome clearance strings");
const appCss = readText(F.appCss);
if (appCss === null) finding(F.appCss, 0, "missing");
else if (!appCss.includes(ADR005_RULE)) finding(F.appCss, 0, `missing the clearance rule substring ${ADR005_RULE}`);
if (shellText === null) finding(F.shell, 0, "missing — cannot check viewport-fit=cover");
else if (!shellText.includes("viewport-fit=cover")) {
  const meta = /<meta\b[^>]*\bname\s*=\s*"viewport"[^>]*>/i.exec(shellText);
  finding(F.shell, meta ? lineAt(shellText, meta.index) : 0, "viewport meta lacks viewport-fit=cover");
}
if (appJs === null) finding(F.appJs, 0, "missing");
else if (!appJs.includes("trackBottomChrome")) finding(F.appJs, 0, "missing trackBottomChrome (VisualViewport -> --sd-chrome-bottom)");

// ---------------------------------------------------------------- 7. a11y + ids

section("7. accessible names on <a>/<button>; unique state-*/dialog-* ids");
for (const f of htmlFiles) {
  const text = withoutComments(f.text);
  for (const m of text.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi)) {
    const attrs = m[2];
    const inner = m[3];
    const labelled =
      /\baria-label\s*=\s*"[^"]*\S[^"]*"/i.test(attrs) || /\baria-labelledby\s*=\s*"[^"]*\S[^"]*"/i.test(attrs);
    if (labelled) continue;
    const alt = [...inner.matchAll(/<img\b[^>]*\balt\s*=\s*"([^"]*)"/gi)].some((a) => a[1].trim() !== "");
    const visibleText = inner
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
    if (!visibleText && !alt) {
      finding(f.abs, lineAt(text, m.index), `<${m[1].toLowerCase()}> has no accessible name (no text, aria-label or aria-labelledby)`);
    }
  }
  const ids = new Map();
  for (const m of text.matchAll(/\bid\s*=\s*"((?:state|dialog)-[^"]*)"/g)) {
    const line = lineAt(text, m.index);
    if (ids.has(m[1])) finding(f.abs, line, `duplicate id="${m[1]}" (first at line ${ids.get(m[1])})`);
    else ids.set(m[1], line);
  }
}

// ---------------------------------------------------------------- done

closeSection();
console.log(`\ncheck: ${total} finding(s)`);
process.exit(total ? 1 : 0);
