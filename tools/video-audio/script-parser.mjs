// Strict parser for docs/videos/*/script.md. Shared by video-audio and video-build.
import { readFileSync } from 'node:fs';

const FORBIDDEN = [
  [/^\s*\|/, 'tables are not allowed'],
  [/^\s*(```|~~~)/, 'fenced code blocks are not allowed'],
  [/\[[^\]]*\]\([^)]*\)/, 'links are not allowed'],
  [/<\/?[a-zA-Z][^>]*>/, 'HTML is not allowed'],
  [/^\s*#{3,}\s/, 'only "#" (title) and "##" (section) headings are allowed'],
  [/^\s*\d+\.\s/, 'numbered lists are not allowed; use "-" items'],
];

/**
 * Parse a script into { number, title, sections: [{ heading, units }] }.
 * A unit is { kind: 'speech', speaker, text } or { kind: 'pause', seconds }.
 * Throws with every problem found, each prefixed by its line number.
 */
export function parseScript(path) {
  const lines = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const errors = [];
  const title = /^# (\d{2}) · (.+)$/.exec(lines[0] ?? '');
  if (!title) errors.push('line 1: must be "# NN · Title"');

  const sections = [];
  let current = { heading: null, line: 2, units: [] };
  let paragraph = null;

  const flush = () => {
    if (!paragraph) return;
    const text = paragraph.lines.join(' ').replace(/\s+/g, ' ').trim();
    const speaker = /^\*\*([^*]+):\*\*\s*(.+)$/.exec(text);
    if (speaker) current.units.push({ kind: 'speech', speaker: speaker[1], text: speaker[2], line: paragraph.line });
    else current.units.push({ kind: 'speech', speaker: null, text, line: paragraph.line });
    paragraph = null;
  };

  lines.slice(1).forEach((raw, i) => {
    const n = i + 2;
    const line = raw.trimEnd();
    for (const [re, msg] of FORBIDDEN) if (re.test(line)) errors.push(`line ${n}: ${msg}`);
    if (/^# /.test(line)) errors.push(`line ${n}: only one "#" title is allowed`);

    const heading = /^## (.+)$/.exec(line);
    const pause = /^\[pause (\d+(?:\.\d+)?)s\]$/.exec(line.trim());
    if (heading) {
      flush();
      if (current.heading !== null || current.units.length) sections.push(current);
      current = { heading: heading[1].trim(), line: n, units: [] };
    } else if (pause) {
      flush();
      current.units.push({ kind: 'pause', seconds: Number(pause[1]), line: n });
    } else if (line.trim() === '') {
      flush();
    } else if (/^- /.test(line)) {
      flush();
      paragraph = { line: n, lines: [line.slice(2)] };
    } else if (/^\s+\S/.test(line) && paragraph) {
      paragraph.lines.push(line.trim());
    } else if (/^\[/.test(line.trim())) {
      errors.push(`line ${n}: unknown directive "${line.trim()}"`);
    } else {
      if (!paragraph) paragraph = { line: n, lines: [] };
      paragraph.lines.push(line);
    }
  });
  flush();
  if (current.heading !== null || current.units.length) sections.push(current);

  sections.forEach((s) => {
    if (!s.units.some((u) => u.kind === 'speech')) errors.push(`line ${s.line}: section "${s.heading ?? 'intro'}" has no narration`);
    s.units.forEach((u) => {
      if (u.kind === 'speech' && (u.text.match(/`/g) ?? []).length % 2) errors.push(`line ${u.line}: unbalanced backtick`);
    });
  });
  if (!sections.length) errors.push('script has no narration');
  if (errors.length) throw new Error(`${path} is invalid:\n  ${errors.join('\n  ')}`);

  return { number: title[1], title: title[2].trim(), sections };
}

/** Text as a reader sees it: markdown emphasis and backticks removed. */
export function plainText(text) {
  return text.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1$2');
}

export function words(text) {
  return plainText(text).split(/\s+/).filter(Boolean);
}

/** Speaking weight of a unit in "words": pauses count at the speaking rate. */
export function unitWeight(unit, wordsPerMinute = 150) {
  return unit.kind === 'pause' ? (unit.seconds * wordsPerMinute) / 60 : words(unit.text).length;
}
