# Videos

Narrated slide-deck videos about this repository. Each folder holds the authored text files (`script.md`, `slides.html`, `README.md`) and the generated media (`NN-topic.mp3`, `NN-topic.mp4`, 1920x1080 with burned-in captions). The workflow is described in `.claude/skills/video-creator/SKILL.md`.

## Design tokens series

A six-part course on the Saturdaze design token system (ADR-013), from the idea of a token to building a production token system from scratch. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 01 | [Design tokens: what they are and why](01-design-tokens-what-and-why/README.md) | ~7.9 min | Tokens as named decisions; naming by role; the three layers; the TS → CSS pipeline. |
| 02 | [Global tokens: the raw values](02-global-tokens/README.md) | ~7.8 min | `types.ts`, the brand ramp, palettes, type, spacing, shape, motion and layout ramps. |
| 03 | [Alias tokens and the theme](03-alias-tokens-and-the-theme/README.md) | ~8.4 min | `generateColorTokens(brand)`, palette roles, shadows, `createLightTheme`, re-branding, responsive overrides. |
| 04 | [The generator: generate-tokens.mjs](04-the-token-generator/README.md) | ~9.6 min | The generator line by line: TS in Node, `themeToCss`, Prettier, write/check modes, CI. |
| 05 | [Consuming tokens](05-consuming-tokens/README.md) | ~7.8 min | Tokens by role in SCSS, fill/ink pairs, component knobs, breakpoints, TS usage, `[sdThemeProvider]`. |
| 06 | [Build your own production token system](06-build-your-own-token-system/README.md) | ~9.6 min | A ten-step recipe from an empty folder, plus pitfalls. |

## Building a video

Tooling lives in `tools/` (Node 22, no npm dependencies) and needs ffmpeg (libx264 + libass), Chrome/Chromium, and Python with the free `edge-tts` package (`python -m pip install edge-tts`; `PYTHON` overrides the interpreter, default `python3`).

```sh
# 1. Validate the script and estimate length (offline)
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why --spoken   # what the narrator will say

# 2. Synthesize the MP3 + timing manifest (.cache/<folder>/manifest.json) with free edge-tts
#    (needs internet; no key). Offline alternative: --engine piper with
#    pip install piper-tts; PIPER_MODEL=/path/to/en_US-ryan-high.onnx
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why

# 3. Cue check + layout audit, render slides, encode the MP4
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why --check
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why --slides-only
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why

# Pronunciation test for a lexicon entry (tools/video-audio/pronunciations.json)
node tools/video-audio/generate-audio.mjs --say '`_tokens.scss`' --out /tmp/say.wav
```

The engine is Edge by default (`--engine edge|piper` forces one); Edge voices default to `en-US-AndrewMultilingualNeural` for the narrator and `en-US-AvaMultilingualNeural` for `**Name:**` speakers (`EDGE_VOICE` / `EDGE_VOICE_2` override; `python -m edge_tts --list-voices` lists them). The design tokens series was narrated with Piper's `en_US-ryan-high` voice when it was produced; re-run steps 2 and 3 to re-voice it with Edge.

Slides use the shared `assets/slides.css` and `assets/slides.js`; open any `slides.html` in a browser and use the arrow keys, or `?slide=N`.
