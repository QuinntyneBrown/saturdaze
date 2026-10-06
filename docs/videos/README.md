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

## AI via Microsoft Foundry series

Four videos on the one place Saturdaze calls a model: catalog ingestion through Claude on Microsoft Foundry (ADR-011). Written for a beginner who needs to change the AI's behaviour, stand up the Azure side, and configure the .NET hosts. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 07 | [How Saturdaze uses AI through Microsoft Foundry](07-how-saturdaze-uses-ai/README.md) | ~10 min | Where AI lives and where it doesn't; the pipeline from trigger to `IngestionRun`; why Foundry; the five cost rails. |
| 08 | [Prompts and AI behaviour, end to end](08-prompts-and-ai-behaviour/README.md) | ~12 min | Anatomy of `IngestionPrompts`; the schema as a contract with parser and upserter; change a prompt test-first, then `--dry-run`; context and model knobs from configuration. |
| 09 | [Provision Claude in Microsoft Foundry on Azure](09-provision-claude-in-foundry/README.md) | ~12 min | Account, deployment and key; `eng/foundry/claude.bicep` and `eng/Deploy-Foundry.ps1` line by line; verify, rotate, tear down. |
| 10 | [Configure the .NET solution to use Foundry](10-configure-the-dotnet-solution/README.md) | ~12 min | `AddIngestion` binding and key resolution; local run, Worker, run-once job, App Service WebJob; Anthropic fallback; failure-to-fix table. |

## Building a video

Tooling lives in `tools/` (Node 22, no npm dependencies) and needs ffmpeg (libx264 + libass) and Chrome/Chromium.

```sh
# 1. Validate the script and estimate length/cost (offline)
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why --spoken   # what the narrator will say

# 2. Synthesize the MP3 + timing manifest (.cache/<folder>/manifest.json)
#    Azure AI Speech (preferred):  AZURE_SPEECH_KEY=… [AZURE_SPEECH_REGION=eastus2]
#    Keyless fallback (edge-tts):  pip install edge-tts   (same Andrew/Ava voices via Edge read-aloud;
#                                  behind a TLS-inspecting proxy set SSL_CERT_FILE to its CA bundle)
#    Offline fallback (Piper):     pip install piper-tts; PIPER_MODEL=/path/to/en_US-ryan-high.onnx
node tools/video-audio/generate-audio.mjs docs/videos/01-design-tokens-what-and-why

# 3. Cue check + layout audit, render slides, encode the MP4
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why --check
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why --slides-only
node tools/video-build/build-video.mjs docs/videos/01-design-tokens-what-and-why

# Pronunciation test for a lexicon entry (tools/video-audio/pronunciations.json)
node tools/video-audio/generate-audio.mjs --say '`_tokens.scss`' --out /tmp/say.wav
```

The engine is Azure when `AZURE_SPEECH_KEY` is set, otherwise edge-tts when the package is installed, otherwise Piper (`--engine azure|edge|piper` forces one). The design tokens series was narrated with Piper's `en_US-ryan-high` voice and the AI series with edge-tts's `en-US-AndrewMultilingualNeural`, because no Azure Speech key was available when they were produced; re-run steps 2 and 3 with a key to re-voice either with Azure AI Speech.

Slides use the shared `assets/slides.css` and `assets/slides.js`; open any `slides.html` in a browser and use the arrow keys, or `?slide=N`.
