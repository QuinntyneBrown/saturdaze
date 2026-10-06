#!/usr/bin/env node
// Narration generator: docs/videos/<folder>/script.md -> <folder>.mp3 + timing manifest.
//
//   node tools/video-audio <folder> --dry-run   validate, pronunciation check, length + cost estimate (offline)
//   node tools/video-audio <folder>             synthesize with Azure AI Speech (needs AZURE_SPEECH_KEY)
//
// <folder> is a path like docs/videos/01-how-a-weekend-gets-planned.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { parseScript, plainText, unitWeight, words } from './script-parser.mjs';

const WPM = 150;
const MAX_SECTION_MINUTES = 9;
const NARRATOR = process.env.VIDEO_NARRATOR_VOICE ?? 'en-US-AndrewMultilingualNeural';
const SECOND_VOICE = process.env.VIDEO_SECOND_VOICE ?? 'en-US-AvaMultilingualNeural';
// Assumed Azure neural TTS list price in USD per million characters; check the Azure pricing page.
const PRICE_PER_MILLION = Number(process.env.VIDEO_TTS_PRICE_PER_MILLION ?? 15);
// Abbreviations a neural voice already says correctly.
const KNOWN_ACRONYMS = new Set(['API', 'ADR', 'ID', 'UI', 'URL', 'HTTP', 'JSON', 'SQL', 'CSS', 'HTML', 'CLI', 'JWT', 'DTO', 'EF', 'CI', 'OK']);

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!folder) {
  console.error('usage: node tools/video-audio <docs/videos/NN-topic> [--dry-run]');
  process.exit(2);
}

const dir = resolve(folder);
const name = basename(dir);
let script;
try {
  script = parseScript(join(dir, 'script.md'));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const lexicon = loadLexicon(dir);

// ─── Pronunciation check ────────────────────────────────────────────────────

const problems = [];
const spoken = new Map();
for (const section of script.sections) {
  for (const unit of section.units.filter((u) => u.kind === 'speech')) {
    for (const [, code] of unit.text.matchAll(/`([^`]+)`/g)) spoken.set('`' + code + '`', speakCode(code));
    const prose = unit.text.replace(/`[^`]*`/g, ' ');
    for (const [token] of prose.matchAll(/[A-Za-z][A-Za-z0-9-]*[A-Z][A-Za-z0-9-]*/g)) {
      if (lexicon.text[token]) continue;
      const caps = token.replace(/s$/, '').split('-')[0];
      if (/^[A-Z]{2,}$/.test(caps) && !KNOWN_ACRONYMS.has(caps)) {
        problems.push(`line ${unit.line}: "${token}" has no entry in pronunciations.json`);
      }
    }
  }
}

// ─── Estimate ───────────────────────────────────────────────────────────────

let totalWords = 0;
let totalChars = 0;
const rows = script.sections.map((s) => {
  const w = s.units.reduce((n, u) => n + unitWeight(u, WPM), 0);
  const chars = s.units.filter((u) => u.kind === 'speech').reduce((n, u) => n + plainText(u.text).length, 0);
  totalWords += s.units.filter((u) => u.kind === 'speech').reduce((n, u) => n + words(u.text).length, 0);
  totalChars += chars;
  const minutes = w / WPM;
  if (minutes > MAX_SECTION_MINUTES) problems.push(`section "${s.heading ?? 'intro'}" is ~${minutes.toFixed(1)} min; split it (max ${MAX_SECTION_MINUTES})`);
  return { section: s.heading ?? '(intro)', minutes };
});

console.log(`${script.number} · ${script.title}`);
for (const r of rows) console.log(`  ${fmt(r.minutes * 60)}  ${r.section}`);
const totalSeconds = rows.reduce((n, r) => n + r.minutes * 60, 0);
console.log(`  ${totalWords} words, ~${fmt(totalSeconds)} at ${WPM} wpm, ${script.sections.length} synthesis requests`);
console.log(`  ${totalChars} characters, ~$${((totalChars / 1e6) * PRICE_PER_MILLION).toFixed(2)} at an assumed $${PRICE_PER_MILLION}/1M characters`);
console.log('  spoken code:');
for (const [code, say] of [...spoken].sort()) console.log(`    ${code} -> "${say}"`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
if (dryRun) {
  console.log('\ndry run clean');
  process.exit(0);
}

// ─── Synthesis ──────────────────────────────────────────────────────────────

const key = process.env.AZURE_SPEECH_KEY;
if (!key) {
  console.error('AZURE_SPEECH_KEY is not set; export it in your shell and re-run.');
  process.exit(2);
}
const region = process.env.AZURE_SPEECH_REGION ?? 'eastus2';
const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH ?? (process.env.FFMPEG_PATH ? join(dirname(ffmpeg), basename(ffmpeg).replace(/ffmpeg/i, 'ffprobe')) : 'ffprobe');
const cache = join(dirname(dir), '.cache', name);
mkdirSync(cache, { recursive: true });

const manifest = { video: name, audio: `${name}.mp3`, estimated: false, generatedAt: new Date().toISOString(), sections: [] };
const parts = [];
let clock = 0;
for (const [i, section] of script.sections.entries()) {
  const out = join(cache, `section-${String(i).padStart(2, '0')}.mp3`);
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'saturdaze-video-audio',
    },
    body: ssml(section),
  });
  if (!res.ok) {
    console.error(`section ${i} "${section.heading ?? 'intro'}": HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  const duration = probe(out);
  manifest.sections.push({ heading: section.heading, start: round(clock), end: round(clock + duration) });
  clock += duration;
  parts.push(out);
  console.log(`  synthesized ${fmt(duration)}  ${section.heading ?? '(intro)'}`);
}

const list = join(cache, 'sections.txt');
writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
const mp3 = join(dir, `${name}.mp3`);
execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'libmp3lame', '-b:a', '96k', '-ar', '24000', '-ac', '1', mp3]);
manifest.duration = round(probe(mp3));
writeFileSync(join(cache, 'timing.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nwrote ${mp3} (${fmt(manifest.duration)}) and ${join(cache, 'timing.json')}`);

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadLexicon(videoDir) {
  const merged = { code: {}, text: {} };
  for (const p of [join(dirname(videoDir), 'pronunciations.json'), join(videoDir, 'pronunciations.json')]) {
    if (!existsSync(p)) continue;
    const l = JSON.parse(readFileSync(p, 'utf8'));
    Object.assign(merged.code, l.code ?? {});
    Object.assign(merged.text, l.text ?? {});
  }
  return merged;
}

/** How an inline-code identifier is spoken: lexicon first, else split into words. */
function speakCode(code) {
  if (lexicon.code[code]) return lexicon.code[code];
  const word = (part) =>
    /^[A-Z0-9_]+$/.test(part) && part.includes('_')
      ? part.toLowerCase().replace(/_/g, ' ')
      : part
          .replace(/_/g, ' ')
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return code
    .split('/')
    .map((segment) => segment.split('.').filter(Boolean).map((p) => word(p.replace(/-/g, ' '))).join(' dot '))
    .join(' slash ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function speechSsml(text) {
  const textKeys = Object.keys(lexicon.text).sort((a, b) => b.length - a.length);
  return text
    .split(/(`[^`]+`)/)
    .map((chunk) => {
      if (/^`[^`]+`$/.test(chunk)) {
        const code = chunk.slice(1, -1);
        return `<sub alias="${escapeXml(speakCode(code))}">${escapeXml(code)}</sub>`;
      }
      let out = escapeXml(plainText(chunk));
      for (const k of textKeys) {
        const re = new RegExp(`(?<![\\w-])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g');
        out = out.replace(re, `<sub alias="${escapeXml(lexicon.text[k])}">${escapeXml(k)}</sub>`);
      }
      return out;
    })
    .join('');
}

function ssml(section) {
  const body = section.units
    .map((u) => {
      if (u.kind === 'pause') return `<voice name="${NARRATOR}"><break time="${u.seconds}s"/></voice>`;
      const voice = u.speaker ? SECOND_VOICE : NARRATOR;
      return `<voice name="${voice}"><p>${speechSsml(u.text)}</p></voice>`;
    })
    .join('\n');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">\n${body}\n</speak>`;
}

function probe(file) {
  return Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function fmt(seconds) {
  const s = Math.round(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
