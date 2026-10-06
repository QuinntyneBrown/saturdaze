#!/usr/bin/env node
// Video builder: docs/videos/<folder>/slides.html + <folder>.mp3 -> <folder>.mp4 (1920x1080, burned-in captions).
//
//   node tools/video-build <folder> --check         every data-cue resolves; print the schedule
//   node tools/video-build <folder> --slides-only   render slide PNGs to docs/videos/.cache/<folder>/slides/
//   node tools/video-build <folder>                 full build (needs the MP3 and timing manifest from video-audio)
//
// Without a timing manifest, --check and --slides-only estimate times at 150 wpm.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseScript, plainText, unitWeight, words } from '../video-audio/script-parser.mjs';

const WPM = 150;
const MIN_SLIDE = 4;
const MAX_SLIDE = 90;

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));
const mode = args.includes('--check') ? 'check' : args.includes('--slides-only') ? 'slides' : 'build';
if (!folder) {
  console.error('usage: node tools/video-build <docs/videos/NN-topic> [--check | --slides-only]');
  process.exit(2);
}

const dir = resolve(folder);
const name = basename(dir);
const cache = join(dirname(dir), '.cache', name);
let script;
try {
  script = parseScript(join(dir, 'script.md'));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const html = readFileSync(join(dir, 'slides.html'), 'utf8');

// ─── Timing ─────────────────────────────────────────────────────────────────

const manifestPath = join(cache, 'timing.json');
let manifest;
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.sections.length !== script.sections.length) {
    fail(`timing manifest has ${manifest.sections.length} sections, script has ${script.sections.length}; re-run video-audio`);
  }
} else {
  if (mode === 'build') fail(`no timing manifest at ${manifestPath}; run node tools/video-audio ${folder} first`);
  let clock = 0;
  manifest = { estimated: true, sections: [] };
  for (const s of script.sections) {
    const d = (s.units.reduce((n, u) => n + unitWeight(u, WPM), 0) / WPM) * 60;
    manifest.sections.push({ heading: s.heading, start: clock, end: clock + d });
    clock += d;
  }
  manifest.duration = clock;
}

/** Seconds at which narration reaches `weightOffset` words into section `i`. */
function timeAt(i, weightOffset) {
  const s = script.sections[i];
  const total = s.units.reduce((n, u) => n + unitWeight(u, WPM), 0);
  const m = manifest.sections[i];
  return m.start + (total ? weightOffset / total : 0) * (m.end - m.start);
}

// ─── Cues ───────────────────────────────────────────────────────────────────

const parts = (attr(/<body\b([^>]*)>/.exec(html)?.[1] ?? '', 'data-parts') ?? '').split('|').filter(Boolean);
const slides = [...html.matchAll(/<section\b([^>]*)>/g)].map((m, i) => ({
  index: i + 1,
  id: attr(m[1], 'id') ?? `slide-${i + 1}`,
  cue: attr(m[1], 'data-cue'),
  part: Number(attr(m[1], 'data-part') ?? 0),
}));

const errors = [];
if (!slides.length) errors.push('slides.html has no <section>');
if (!parts.length) errors.push('<body> has no data-parts');

const norm = (t) => plainText(t).replace(/\s+/g, ' ').trim();
const spans = [];
script.sections.forEach((s, i) => {
  if (s.heading) spans.push({ section: i, text: norm(s.heading), offset: 0 });
  let offset = 0;
  for (const u of s.units) {
    if (u.kind === 'speech') spans.push({ section: i, text: norm(u.text), offset, unit: u });
    offset += unitWeight(u, WPM);
  }
});

slides.forEach((slide, i) => {
  if (!Number.isInteger(slide.part) || slide.part < 0 || slide.part >= parts.length) {
    errors.push(`slide ${slide.index} #${slide.id}: data-part ${slide.part} is outside data-parts (0-${parts.length - 1})`);
  }
  if (i === 0) {
    slide.time = 0;
    return;
  }
  if (!slide.cue) {
    errors.push(`slide ${slide.index} #${slide.id}: missing data-cue`);
    return;
  }
  const cue = norm(slide.cue);
  const hits = [];
  for (const span of spans) {
    let at = span.text.indexOf(cue);
    while (at !== -1) {
      hits.push({ span, at });
      at = span.text.indexOf(cue, at + 1);
    }
  }
  if (hits.length !== 1) {
    errors.push(`slide ${slide.index} #${slide.id}: cue "${slide.cue}" found ${hits.length} times in script.md (must be exactly once)`);
    return;
  }
  const { span, at } = hits[0];
  const before = span.unit ? words(span.text.slice(0, at)).length : 0;
  slide.section = span.section;
  slide.time = timeAt(span.section, span.offset + before);
});

for (let i = 1; i < slides.length; i++) {
  if (slides[i].time !== undefined && slides[i - 1].time !== undefined && slides[i].time <= slides[i - 1].time) {
    errors.push(`slide ${slides[i].index} #${slides[i].id}: cue is not after the previous slide's cue (narration order)`);
  }
}
if (errors.length) fail(`slides.html cue check failed:\n  ${errors.join('\n  ')}`);

const duration = manifest.duration;
const warnings = [];
slides.forEach((s, i) => {
  s.end = i + 1 < slides.length ? slides[i + 1].time : duration;
  const d = s.end - s.time;
  if (d < MIN_SLIDE) warnings.push(`slide ${s.index} #${s.id} is on screen ${d.toFixed(1)}s (< ${MIN_SLIDE}s)`);
  if (d > MAX_SLIDE) warnings.push(`slide ${s.index} #${s.id} is on screen ${d.toFixed(1)}s (> ${MAX_SLIDE}s)`);
});

console.log(`${script.number} · ${script.title}  (${manifest.estimated ? `estimated at ${WPM} wpm` : 'from timing manifest'}, ${fmt(duration)})`);
for (const s of slides) {
  console.log(`  ${String(s.index).padStart(2)}  ${fmt(s.time)}-${fmt(s.end)}  ${(s.end - s.time).toFixed(1).padStart(5)}s  ${(parts[s.part] ?? '?').padEnd(14)} #${s.id}`);
}
if (warnings.length) {
  console.error(`\n${warnings.length} timing problem(s):\n  ${warnings.join('\n  ')}`);
  process.exit(1);
}
if (mode === 'check') {
  console.log('\ncue check clean');
  process.exit(0);
}

// ─── Render slides ──────────────────────────────────────────────────────────

const browser = findBrowser();
const slideDir = join(cache, 'slides');
rmSync(slideDir, { recursive: true, force: true });
mkdirSync(slideDir, { recursive: true });
const url = pathToFileURL(join(dir, 'slides.html')).href;
// Headless Chrome/Edge lay out a viewport somewhat shorter than --window-size, so render
// into a taller window (the stage is pinned to 0,0 at 1920x1080) and crop to 1080p.
const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg';
for (const s of slides) {
  s.png = join(slideDir, `slide-${String(s.index).padStart(2, '0')}.png`);
  const raw = join(slideDir, 'raw.png');
  execFileSync(browser, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1920,1400',
    '--virtual-time-budget=3000',
    `--screenshot=${raw}`,
    `${url}?slide=${s.index}&render=1`,
  ], { stdio: 'ignore' });
  if (!existsSync(raw)) fail(`browser did not write a screenshot for slide ${s.index}`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', raw, '-vf', 'crop=1920:1080:0:0', s.png]);
  rmSync(raw);
}
console.log(`\nrendered ${slides.length} slides to ${slideDir}`);
if (mode === 'slides') process.exit(0);

// ─── Captions ───────────────────────────────────────────────────────────────

const cues = [];
script.sections.forEach((s, i) => {
  let offset = 0;
  for (const u of s.units) {
    if (u.kind === 'speech') {
      for (const chunk of captionChunks(norm(u.text))) {
        const n = words(chunk).length;
        cues.push({ start: timeAt(i, offset), end: timeAt(i, offset + n), text: u.speaker ? `${u.speaker}: ${chunk}` : chunk });
        offset += n;
      }
    } else {
      offset += unitWeight(u, WPM);
    }
  }
});
const srt = join(cache, `${name}.srt`);
writeFileSync(srt, cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n'));

// ─── Encode ─────────────────────────────────────────────────────────────────

const mp3 = join(dir, `${name}.mp3`);
if (!existsSync(mp3)) fail(`missing ${mp3}; run node tools/video-audio ${folder}`);
const list = join(cache, 'slides.txt');
writeFileSync(
  list,
  slides.map((s) => `file '${s.png}'\nduration ${(s.end - s.time).toFixed(3)}`).join('\n') + `\nfile '${slides.at(-1).png}'\n`,
);
const mp4 = join(dir, `${name}.mp4`);
const subtitleFilter =
  `subtitles='${srt.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")}'` +
  `:original_size=1920x1080:force_style='FontName=DejaVu Sans,FontSize=13,PrimaryColour=&H00FFFFFF,` +
  `BackColour=&H33000000,BorderStyle=4,Outline=0,Shadow=0,MarginV=24,MarginL=120,MarginR=120'`;
execFileSync(ffmpeg, [
  '-y', '-v', 'error',
  '-f', 'concat', '-safe', '0', '-i', list,
  '-i', mp3,
  '-vf', `fps=30,format=yuv420p,${subtitleFilter}`,
  '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage', '-crf', '20',
  '-c:a', 'aac', '-b:a', '128k',
  '-t', duration.toFixed(3),
  '-movflags', '+faststart',
  mp4,
], { stdio: 'inherit' });
console.log(`wrote ${mp4} and ${srt}`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function attr(attrs, key) {
  const m = new RegExp(`\\s${key}="([^"]*)"`).exec(attrs);
  return m ? decodeEntities(m[1]) : undefined;
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Sentences, then wrapped to at most 14 words per caption. */
function captionChunks(text) {
  const out = [];
  for (const sentence of text.match(/[^.!?]+[.!?]*["”']?\s*/g) ?? [text]) {
    const w = sentence.trim().split(/\s+/).filter(Boolean);
    const n = Math.ceil(w.length / 14);
    const size = Math.ceil(w.length / n);
    for (let i = 0; i < w.length; i += size) out.push(w.slice(i, i + size).join(' '));
  }
  return out;
}

function findBrowser() {
  if (process.env.EDGE_PATH) return process.env.EDGE_PATH;
  const candidates = [
    ...(existsSync('/opt/pw-browsers')
      ? readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
      : []),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) fail('no Chrome/Edge found; set EDGE_PATH');
  return found;
}

function srtTime(t) {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}

function fmt(seconds) {
  const s = Math.round(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
