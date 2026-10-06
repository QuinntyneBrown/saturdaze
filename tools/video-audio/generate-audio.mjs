#!/usr/bin/env node
// Narration generator for docs/videos/NN-topic/script.md.
//
//   node tools/video-audio/generate-audio.mjs docs/videos/01-x --dry-run   validate + estimate
//   node tools/video-audio/generate-audio.mjs docs/videos/01-x --spoken    print what the narrator says
//   node tools/video-audio/generate-audio.mjs docs/videos/01-x             synthesize the MP3
//   node tools/video-audio/generate-audio.mjs --say "`_tokens.scss`"        pronunciation test (WAV)
//
// Engines (--engine azure|piper, default: azure when AZURE_SPEECH_KEY is set, else piper):
//   azure  Azure AI Speech REST, one SSML request per `##` section. Reads AZURE_SPEECH_KEY and
//          AZURE_SPEECH_REGION (default eastus2) from the environment only.
//   piper  Offline neural TTS (`pip install piper-tts`), one request per paragraph. Needs
//          PIPER_MODEL pointing at a voice .onnx (e.g. en_US-ryan-high.onnx); PIPER_MODEL_2
//          optionally voices `**Name:**` paragraphs.
//
// Writes <folder>/<folder-name>.mp3 and the timing manifest
// .cache/<folder-name>/manifest.json that tools/video-build syncs slides and captions to.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const WORDS_PER_MINUTE = 150;
const PARAGRAPH_GAP = 0.35; // seconds of silence between paragraphs
const SECTION_GAP = 0.8; // and between sections
const AZURE_VOICE = 'en-US-AndrewMultilingualNeural';
const AZURE_VOICE_2 = 'en-US-AvaMultilingualNeural';
// Azure bills neural voices per character; override when the price list changes.
const USD_PER_MILLION_CHARS = Number(process.env.AZURE_TTS_USD_PER_MILLION ?? 15);

const ffmpeg = process.env.FFMPEG_PATH ?? 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH ?? 'ffprobe';

// ---------------------------------------------------------------- script parsing

export function parseScript(text, file = 'script.md') {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const fail = (n, msg) => {
    throw new Error(`${file}:${n + 1}: ${msg}`);
  };
  if (!/^# \d{2} · .+/.test(lines[0] ?? '')) fail(0, 'first line must be "# NN · Title"');
  const title = lines[0].replace(/^# /, '');
  const sections = [{ title: '', blocks: [] }];
  let para = null;
  const flush = () => {
    if (para) sections.at(-1).blocks.push(para);
    para = null;
  };
  for (let n = 1; n < lines.length; n++) {
    const line = lines[n];
    if (/^```/.test(line)) fail(n, 'fenced code blocks are not allowed');
    if (/^\s*\|/.test(line)) fail(n, 'tables are not allowed');
    if (/<\/?[a-z][^>]*>/i.test(line.replace(/`[^`]*`/g, ''))) fail(n, 'HTML is not allowed');
    if (/\]\(/.test(line)) fail(n, 'links are not allowed');
    if (/^#{3,} /.test(line) || /^# /.test(line)) fail(n, 'only one "#" title and "##" sections');
    if (/^## /.test(line)) {
      flush();
      sections.push({ title: line.slice(3).trim(), blocks: [] });
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    const pause = line.trim().match(/^\[pause (\d+(?:\.\d+)?)s\]$/);
    if (pause) {
      flush();
      sections.at(-1).blocks.push({ pause: Number(pause[1]) });
      continue;
    }
    if (/^- /.test(line)) {
      flush();
      para = { speaker: null, text: line.slice(2).trim() };
      continue;
    }
    if (!para) {
      const sp = line.match(/^\*\*([^*:]+):\*\*\s*(.*)$/);
      para = sp ? { speaker: sp[1], text: sp[2] } : { speaker: null, text: line.trim() };
    } else {
      para.text += ' ' + line.trim();
    }
  }
  flush();
  if (!sections[0].blocks.length) sections.shift();
  for (const s of sections) {
    if (!s.blocks.some((b) => b.text)) throw new Error(`${file}: section "${s.title}" is empty`);
  }
  return { title, sections };
}

// ---------------------------------------------------------------- pronunciation

const lexicon = JSON.parse(readFileSync(join(here, 'pronunciations.json'), 'utf8'));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lexKeys = Object.keys(lexicon).sort((a, b) => b.length - a.length);

/** How an inline `code` span is read aloud when the lexicon has no entry for it. */
export function speakCode(code) {
  if (lexicon[code] !== undefined) return lexicon[code];
  return code
    .replace(/^--/, 'dash dash ')
    .replace(/\(\)/g, '')
    .replace(/\.\.\./g, ' ')
    .replace(/[`'"{}[\]<>;:,]/g, ' ')
    .replace(/=>/g, ' arrow ')
    .replace(/===/g, ' equals ')
    .replace(/\*\*/g, ' ')
    .replace(/\//g, ' slash ')
    .replace(/(^|\s)_/g, '$1underscore ')
    .replace(/\./g, ' dot ')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)px\b/g, '$1 pixels')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => lexicon[w] ?? w)
    .join(' ');
}

/** Markdown paragraph → plain text the engine reads (code spans and lexicon words expanded). */
export function spoken(text) {
  let out = text.replace(/`([^`]+)`/g, (_, code) => ` ${speakCode(code)} `);
  out = out.replace(/\*\*|__|\*/g, '').replace(/(\d)px\b/g, '$1 pixels');
  for (const key of lexKeys) {
    if (!/^[\w.-]+$/.test(key)) continue;
    out = out.replace(new RegExp(`(?<![\\w-])${escapeRe(key)}(?![\\w-])`, 'g'), lexicon[key]);
  }
  return out.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

/** Markdown paragraph → caption text (code spans kept verbatim, emphasis dropped). */
export const caption = (text) =>
  text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*|__/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const words = (s) => s.split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- engines

function probeDuration(file) {
  return Number(
    execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])
      .toString()
      .trim(),
  );
}

function silence(file, seconds) {
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', String(seconds), '-c:a', 'pcm_s16le', file]);
}

function piperSay(text, model, out) {
  const r = spawnSync(process.env.PIPER_BIN ?? 'python3', [...(process.env.PIPER_BIN ? [] : ['-m', 'piper']), '-m', model, '-f', out, '--sentence-silence', '0.25'], {
    input: text,
  });
  if (r.status !== 0 || !existsSync(out)) throw new Error(`piper failed: ${r.stderr}`);
  // Normalise to 24 kHz mono so every clip concatenates cleanly.
  const norm = out.replace(/\.wav$/, '.24k.wav');
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', out, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', norm]);
  return norm;
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function azureSay(ssml, out) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION ?? 'eastus2';
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'saturdaze-video-audio',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure Speech ${res.status}: ${await res.text()}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  const wav = out.replace(/\.mp3$/, '.wav');
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', out, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
  return wav;
}

function sectionSsml(section) {
  const voice = (speaker) => (speaker ? AZURE_VOICE_2 : AZURE_VOICE);
  const parts = [];
  for (const b of section.blocks) {
    if (b.pause) parts.push(`<voice name="${AZURE_VOICE}"><break time="${b.pause}s"/></voice>`);
    else parts.push(`<voice name="${voice(b.speaker)}">${xml(spoken(b.text))}<break time="${PARAGRAPH_GAP * 1000}ms"/></voice>`);
  }
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">${parts.join('')}</speak>`;
}

// ---------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const engine = opt('--engine') ?? (process.env.AZURE_SPEECH_KEY ? 'azure' : 'piper');

  if (flag('--say')) {
    const text = spoken(opt('--say'));
    console.log(`spoken: ${text}`);
    const out = resolve(opt('--out') ?? 'pronunciation-test.wav');
    if (engine === 'piper') execFileSync('cp', [piperSay(text, process.env.PIPER_MODEL, out), out]);
    else execFileSync('cp', [await azureSay(`<speak version="1.0" xml:lang="en-US"><voice name="${AZURE_VOICE}">${xml(text)}</voice></speak>`, out.replace(/\.wav$/, '.mp3')), out]);
    console.log(`wrote ${out}`);
    return;
  }

  const folder = resolve(args.find((a) => !a.startsWith('--') && a !== opt('--engine')) ?? '');
  const name = basename(folder);
  const script = parseScript(readFileSync(join(folder, 'script.md'), 'utf8'), join(folder, 'script.md'));
  const paras = script.sections.flatMap((s) => s.blocks.filter((b) => b.text));
  const totalWords = paras.reduce((n, b) => n + words(spoken(b.text)), 0);
  const chars = paras.reduce((n, b) => n + spoken(b.text).length, 0);
  const pauses = script.sections.flatMap((s) => s.blocks).reduce((n, b) => n + (b.pause ?? 0), 0);

  if (flag('--spoken')) {
    for (const s of script.sections) {
      console.log(`\n## ${s.title || '(intro)'}`);
      for (const b of s.blocks) console.log(b.pause ? `[pause ${b.pause}s]` : `${b.speaker ? b.speaker + ': ' : ''}${spoken(b.text)}`);
    }
    return;
  }

  console.log(`${script.title}`);
  for (const s of script.sections) {
    const w = s.blocks.reduce((n, b) => n + (b.text ? words(spoken(b.text)) : 0), 0);
    const min = w / WORDS_PER_MINUTE;
    console.log(`  ${(s.title || '(intro)').padEnd(44)} ${String(w).padStart(5)} words  ~${min.toFixed(1)} min`);
    if (min > 9) throw new Error(`section "${s.title}" is over 9 minutes`);
  }
  const est = totalWords / WORDS_PER_MINUTE + pauses / 60;
  console.log(`  total ${totalWords} words, ~${est.toFixed(1)} min, ${chars} characters`);
  console.log(`  Azure neural cost estimate: ~$${((chars / 1e6) * USD_PER_MILLION_CHARS).toFixed(2)}`);
  if (flag('--dry-run')) return;

  if (engine === 'azure' && !process.env.AZURE_SPEECH_KEY) throw new Error('AZURE_SPEECH_KEY is not set');
  if (engine === 'piper' && !process.env.PIPER_MODEL) throw new Error('PIPER_MODEL is not set (path to a piper voice .onnx)');

  const cache = join(repo, '.cache', name);
  rmSync(join(cache, 'audio'), { recursive: true, force: true });
  mkdirSync(join(cache, 'audio'), { recursive: true });
  const clips = [];
  const manifest = { title: script.title, engine, voice: engine === 'azure' ? AZURE_VOICE : basename(process.env.PIPER_MODEL), sections: [] };
  let t = 0;
  let k = 0;
  const gapFile = (sec) => {
    const f = join(cache, 'audio', `gap-${sec}.wav`);
    if (!existsSync(f)) silence(f, sec);
    return f;
  };

  for (const [si, s] of script.sections.entries()) {
    const sec = { title: s.title, start: t, blocks: [] };
    if (engine === 'azure') {
      const wav = await azureSay(sectionSsml(s), join(cache, 'audio', `s${si}.mp3`));
      const d = probeDuration(wav);
      // Paragraph times inside a section are estimated from spoken length.
      const weights = s.blocks.map((b) => (b.pause ? null : spoken(b.text).length + PARAGRAPH_GAP * 15));
      const pauseTotal = s.blocks.reduce((n, b) => n + (b.pause ?? 0), 0);
      const totalW = weights.reduce((n, w) => n + (w ?? 0), 0);
      let bt = t;
      for (const [bi, b] of s.blocks.entries()) {
        const bd = b.pause ?? ((weights[bi] / totalW) * (d - pauseTotal));
        if (b.text) sec.blocks.push({ start: bt, end: bt + bd, speaker: b.speaker, text: b.text, caption: caption(b.text) });
        bt += bd;
      }
      clips.push(wav);
      t += d;
    } else {
      for (const b of s.blocks) {
        if (b.pause) {
          clips.push(gapFile(b.pause));
          t += b.pause;
          continue;
        }
        const model = b.speaker && process.env.PIPER_MODEL_2 ? process.env.PIPER_MODEL_2 : process.env.PIPER_MODEL;
        const wav = piperSay(spoken(b.text), model, join(cache, 'audio', `p${String(k++).padStart(3, '0')}.wav`));
        const d = probeDuration(wav);
        sec.blocks.push({ start: t, end: t + d, speaker: b.speaker, text: b.text, caption: caption(b.text) });
        clips.push(wav, gapFile(PARAGRAPH_GAP));
        t += d + PARAGRAPH_GAP;
        process.stdout.write('.');
      }
    }
    sec.end = t;
    manifest.sections.push(sec);
    if (si < script.sections.length - 1) {
      clips.push(gapFile(SECTION_GAP));
      t += SECTION_GAP;
    }
  }
  process.stdout.write('\n');

  const list = join(cache, 'audio', 'concat.txt');
  writeFileSync(list, clips.map((c) => `file '${c}'`).join('\n'));
  const mp3 = join(folder, `${name}.mp3`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', mp3]);
  manifest.duration = probeDuration(mp3);
  writeFileSync(join(cache, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`wrote ${mp3} (${manifest.duration.toFixed(1)} s) and .cache/${name}/manifest.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
