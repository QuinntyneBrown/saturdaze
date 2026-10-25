# Videos

Narrated slide-deck videos about this repository. Each folder holds the authored text files (`script.md`, `slides.html`, `README.md`) and the generated media (`NN-topic.mp3`, `NN-topic.mp4`, 1920x1080 with burned-in captions). The workflow is described in `.claude/skills/creating-videos/SKILL.md`.

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

Five videos on the one place Saturdaze calls a model: catalog ingestion through Claude on Microsoft Foundry (ADR-011). Written for a beginner who needs to change the AI's behaviour, stand up the Azure side, and configure the .NET hosts, then operate ingestion on a sensible cadence. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 07 | [How Saturdaze uses AI through Microsoft Foundry](07-how-saturdaze-uses-ai/README.md) | ~10 min | Where AI lives and where it doesn't; the pipeline from trigger to `IngestionRun`; why Foundry; the five cost rails. |
| 08 | [Prompts and AI behaviour, end to end](08-prompts-and-ai-behaviour/README.md) | ~12 min | Anatomy of `IngestionPrompts`; the schema as a contract with parser and upserter; change a prompt test-first, then `--dry-run`; context and model knobs from configuration. |
| 09 | [Provision Claude in Microsoft Foundry on Azure](09-provision-claude-in-foundry/README.md) | ~12 min | Account, deployment and key; `eng/foundry/claude.bicep` and `eng/Deploy-Foundry.ps1` line by line; verify, rotate, tear down. |
| 10 | [Configure the .NET solution to use Foundry](10-configure-the-dotnet-solution/README.md) | ~12 min | `AddIngestion` binding and key resolution; local run, Worker, run-once job, App Service WebJob; Anthropic fallback; failure-to-fix table. |
| 11 | [Event ingestion: the suggested workflow and cadence](11-event-ingestion-workflow-and-cadence/README.md) | ~10 min | Why one Friday pass covers two weekends; Friday 08:00 UTC; events weekly, activities monthly, restaurants quarterly; the weekly checklist; reading `IngestionRuns`; safe reruns. |

## Saturdaze Admin series

Six videos on Saturdaze Admin, the second web application that curates the catalog's place photos (L1-036, ADR-014, ADR-015). Each mixes screen recordings of the real app, made against the admin demo data (`tools/video-record/admin-demo`), with the code behind each screen. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 12 | [Saturdaze Admin: a second app, one sign-in](12-saturdaze-admin-a-second-app/README.md) | ~7.6 min | Why admin is its own app; shared libraries and tokens; sign-in, the admin gate and the `Admin` policy; layout; CI and the `admin-web` deploy job. |
| 13 | [Photo health and finding places](13-photo-health-and-finding-places/README.md) | ~5.9 min | The four health flags; the Photo health home; Places search, filters and sort; why the counts always match. |
| 14 | [Managing a place's photos](14-managing-a-places-photos/README.md) | ~6.7 min | Slot previews and cover impact; Make primary and the one-primary rule; editing details; removing with a chosen next primary; the admin lock. |
| 15 | [Adding curated photos: upload and URL](15-adding-curated-photos/README.md) | ~7 min | Uploads, the sanitizer and the promotion rule; the public curated store (ADR-015) and its settings; adding from an allow-listed URL. |
| 16 | [Reviewing ingested photos](16-reviewing-ingested-photos/README.md) | ~5.8 min | The review queue; Keep, Make primary, Reject; rejections that stick; ingestion photo skips; seeding and the lock. |
| 17 | [The photo activity log](17-the-photo-activity-log/README.md) | ~4.4 min | What every audit entry records; committing it with the change; the Activity log and its filters. |

## Accounts

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 18 | [How account emails are drafted](18-how-account-emails-are-drafted/README.md) | ~7.1 min | Verification and reset links as built: random tokens stored as SHA-256 hashes, single use via `ConsumedAtUtc`, no account leak, `DevDelivery` and `devToken`; no email provider yet (G01). |

## Product accessibility

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 30 | [Product accessibility: expose state and preserve focus](30-product-accessibility/README.md) | ~4.9 min | Follow-up accessibility behavior: paired-list chip feedback, route-aware skip links; real before/after recording and acceptance tests (L2-141; original fixes merged in #143). |

## Design drift series

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 19 | [Design drift D01: the mock tokens that pointed nowhere](19-mock-tokens-drift-d01/README.md) | ~3.3 min | A mock stylesheet whose header pointed at a deleted catalog; retiring the always-failing check; before and after. |
| 24 | [Design drift D02: a primary button you could not read](24-primary-button-contrast-d02/README.md) | ~4.5 min | White on coral #E07856 at 3.00:1 (WCAG 1.4.3); the #BF5130 fill in the mocks, the TypeScript theme and the components; the static brand coral; before and after in the app. |
| 25 | [Design drift D03: a focus ring you could barely see](25-focus-ring-contrast-d03/README.md) | ~5 min | The #E07856 focus ring at 2.81:1 on the canvas (WCAG 1.4.11, 2.4.7); `colorStrokeFocus2` #A04B2C in the mocks, the TypeScript theme and the components; a failing Playwright test first; tabbing through sign-in before and after. |
| 26 | [Design drift D04: hint text too faint to read](26-hint-text-contrast-d04/README.md) | ~6 min | Hint text in #9CA3AF at 2.38 to 2.54:1 (WCAG 1.4.3); `colorNeutralForeground3` #636A77 in the mocks, the TypeScript theme and the components, #9CA3AF kept for disabled things; a failing Playwright test first; create account, sign-in and landing before and after. |
| 27 | [Design drift D05: soft text on wells](27-soft-text-contrast-d05/README.md) | ~5.5 min | Secondary text in #6B7280 at 4.22:1 on wells (WCAG 1.4.3); `colorNeutralForeground2` #5B6270 in the mocks and the TypeScript theme; a failing Playwright test first; legal, sign-in and landing before and after. |
| 28 | [Design drift D06: control edges](28-control-edge-contrast-d06/README.md) | ~6.5 min | Field borders and the off switch track in 16% ink at 1.36:1 (WCAG 1.4.11); `colorNeutralStrokeAccessible` #80868F in the mocks, the TypeScript theme and the components; a failing Playwright test first; sign-in and create account before and after. |
| 29 | [Design drift D34: one clock](29-time-format-d34/README.md) | ~4.5 min | Two clocks and three range styles become one: a 12-hour clock with am or pm every time; `BlockRow.startMinutes` so code never parses display text. |
| 30 | [Design drift D35: a button that tells you what is missing](30-submit-stays-enabled-d35/README.md) | ~4.3 min | Suggest an event and Add member stay enabled; a failed press shows a focused error summary (L2-134, WCAG 3.3.1, 3.3.3, 4.1.3); `sd-error-summary`. |
| 31 | [Design drift D36: the forecast, in words](31-forecast-word-d36/README.md) | ~4.1 min | The day meta line names the weather ("17 May · Sunny · 22° / 14° · …") so the `aria-hidden` weather disc is not the only forecast (L2-135, WCAG 1.1.1, 1.4.1). |
| 32 | [Design drift D37: one icon, one meaning](32-icon-meanings-d37/README.md) | ~3.8 min | Arrows gain a shaft and a new `bookmark` marks the primary photo, so the star only means a rating. |
| 33 | [Design drift D38: errors that say warning, once](33-error-alert-icon-d38/README.md) | ~3.8 min | Error banners and field errors use the alert icon instead of the close glyph, and are announced by `role="alert"` alone (L2-136, WCAG 4.1.3). |
| 34 | [Design drift D39: signing out is not dangerous](34-signout-not-danger-d39/README.md) | ~3.2 min | The admin gate's Sign out becomes a quiet warn-text button, as on Family; danger is reserved for confirming destruction. |
| 35 | [Design drift D40: a stop that says "Stop"](35-stop-disc-name-d40/README.md) | ~3.5 min | Numbered stop discs read "Stop N" through visually hidden text instead of an `aria-label` on a `<span>` (L2-137, WCAG 1.3.1, 4.1.2). |
| 36 | [Design drift D41: the dividers that disappeared](36-list-dividers-d41/README.md) | ~2.9 min | A `:last-child` rule stripped every action row's hairline in the mocks; the divider moves to `.list > li:not(:last-child) > .list__item`. |
| 37 | [Design drift D42: landmarks that say what they are](37-landmarks-d42/README.md) | ~4.5 min | The footer is a `contentinfo` landmark outside `main`, the pager a `navigation` named Pagination, lists are lists, and the account avatar a button with `aria-haspopup="menu"` (L2-138). |
| 38 | [Design drift D43: the day tabs, by keyboard](38-day-tabs-keyboard-d43/README.md) | ~3.8 min | The Weekend day tabs follow the APG Tabs keyboard model: one Tab stop, arrows with wrap, Home and End (L2-139, WCAG 2.1.1, 4.1.2). |
| 39 | [Design drift D44: stepping back without fading out](39-dimmed-card-contrast-d44/README.md) | ~4 min | Dimmed, muted and done states stop using opacity (meta text 2.63:1 to 5.35:1; WCAG 1.4.3): a sunk surface, secondary ink and a dashed edge. |
| 40 | [Design drift D45: focus that follows what you see](40-primary-first-order-d45/README.md) | ~3.5 min | The generating Weekend mock puts the primary action first in the DOM, as `sd-page-header` does, so Tab matches the phone layout (WCAG 2.4.3). |
| 41 | [Design drift D46: a selected tab you can actually see](41-selected-segment-edge-d46/README.md) | ~3.3 min | The selected segment of `segments` and `seg-radio` gets a 1px accessible-stroke inset edge (fill 1.15:1 on the track before, edge 3.20:1 after; WCAG 1.4.11). |
| 42 | [Design drift D47: four small gaps in the product](42-a11y-gaps-d47/README.md) | ~4.7 min | Admin nav is a landmark named Admin, a field's `aria-describedby` lists only elements in the page, a duplicate chip is refused with a message, and the skip link is confirmed correct (L2-140). |
| 43 | [Reset links: say what the server does](43-reset-link-lifetime-88/README.md) | ~4.5 min | The reset screens now say 60 minutes, as the server enforces; L2-005 gains AC5 and AC6, with clock tests at T+59 and T+61 minutes (issue 88). |

## Family members series

Four videos on family member sign-in (L1-037, ADR-016): the account that creates a family owns it, invites members who sign in with their own credentials, adds members such as young children who never sign in, and removes members, which ends their access. Each mixes screen recordings of the family app, made against the Rivera family (`tools/video-record/family-demo`), with the code behind each step. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 20 | [Who owns a family, and who's in](20-who-owns-a-family/README.md) | ~5.7 min | `OwnerUserId` and its backfill; None, Invited and Account; the owner-only 403; adding a child who never signs in. |
| 21 | [Inviting a family member](21-inviting-a-family-member/README.md) | ~5.5 min | "Invite to sign in"; the hashed, single-use, 7-day `FamilyInvitation`; why the owner shares the link (no email provider); `email_in_use` and `already_invited`. |
| 22 | [Joining from an invite link](22-joining-from-an-invite-link/README.md) | ~6.2 min | `/accept-invite` and its two anonymous endpoints; the verified account it creates; unusable links; the read-only member view and its server guard. |
| 23 | [Removing a family member](23-removing-a-family-member/README.md) | ~6.3 min | D21's three consequences; what `DELETE` cascades; delete, not detach; the per-request family lookup that ends an open tab's access; `member_has_access`. |

## The business

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 34 | [The plan, in plain words](34-the-plan-in-plain-words/README.md) | ~9.1 min | The business plan explained simply: grown-up likes, the five jars, 2027 to 2029, the $2.0M seed, the never list and the risks; then what changes if the seed never comes. |

## Components series

Fifty-two instructional videos, one per component in `frontend/projects/components/src/lib/`: each codes the component step by step, calls out its best practices (especially signals) and walks through its unit tests. See the [series index](components/README.md).

## Vitest series

Fourteen videos, one per Vitest feature the frontend specs use: the Angular unit-test builder setup, structure and `describe.each`, matchers and asymmetric matchers, async assertions, `vi.fn` and mock programming, call assertions, `vi.spyOn` and restoring, fake timers with `vi.advanceTimersByTime`, and `vi.setSystemTime`. See the [series index](vitest/README.md).

## The product

The one-minute brand video, served on the marketing site at www.saturdaze.ca (ADR-018).

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 44 | [Meet Saturdaze](44-meet-saturdaze/README.md) | ~1.3 min | What Saturdaze does for a family's weekend, recorded from the real app. |

### Voices

Every video uses the free Edge voices (the generator's default engine), except the brand video, which uses the voice of Shelfie's brand video.

| | Edge (free) | Azure Speech (paid) |
| --- | --- | --- |
| Used by | 01 to 43 and the component videos | 44, Meet Saturdaze |
| Voice | `en-US-AndrewMultilingualNeural` (`EDGE_VOICE`) | `en-US-JennyNeural`, `cheerful` style, rate `-5%` (`AZURE_VOICE`, `AZURE_STYLE`, `AZURE_RATE`; `AZURE_STYLE=` for no style) |
| Command | `node tools/video-audio/generate-audio.mjs docs/videos/NN-name` | `node tools/video-audio/generate-audio.mjs docs/videos/NN-name --engine azure` |
| Setup | `python3 -m pip install edge-tts` | `export AZURE_SPEECH_REGION=canadacentral AZURE_SPEECH_KEY=$(az cognitiveservices account keys list -n shelfie-speech -g shelfie-prod --query key1 -o tsv)` after `az login`: the Speech resource (SpeechServices, S0) Shelfie's video was narrated with |

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

The engine is Edge by default (`--engine edge|piper` forces one); Edge voices default to `en-US-AndrewMultilingualNeural` for the narrator and `en-US-AvaMultilingualNeural` for `**Name:**` speakers (`EDGE_VOICE` / `EDGE_VOICE_2` override; `python -m edge_tts --list-voices` lists them). The design tokens series was narrated with Piper's `en_US-ryan-high` voice when it was produced, and the AI series with Edge's `en-US-AndrewMultilingualNeural`; re-run steps 2 and 3 to re-voice the design tokens series with Edge. Behind a TLS-inspecting proxy, set `SSL_CERT_FILE` to its CA bundle; `HTTPS_PROXY` is passed to edge-tts.

Slides use the shared `assets/slides.css` and `assets/slides.js`; open any `slides.html` in a browser and use the arrow keys, or `?slide=N`.

### Screen recordings

A slide with `data-clip="clips/x.mp4"` plays a screen recording in a 1408x792 box, with notes in an `<aside class="clip-notes">` beside it (`<video class="clip phone">` for a 390-wide recording). `tools/video-record/record-clips.mjs` drives the real app with Playwright (from `e2e/node_modules`) and records each clip in a folder's `clips/clips.mjs` through the Chrome DevTools screencast, with a drawn cursor. The builder overlays each MP4 on its box for the slide's duration: it holds the last frame when the narration runs longer, and speeds the clip up evenly when the narration is shorter (it warns above x1.6). `data-clip-delay="s"` holds the first frame while the narration introduces the clip.

```sh
SD_DEMO_RESET="node tools/video-record/admin-demo/reset.mjs" \
  node tools/video-record/record-clips.mjs docs/videos/14-managing-a-places-photos   # all clips, or add name,name
```

The admin series records against a separate demo database and image host; see `tools/video-record/admin-demo/README.md`. The family members series records against a freshly reset database of its own; see `tools/video-record/family-demo/README.md`.

### Background music

`--music <file>` on the builder mixes a music bed under the narration. It is opt-in: only the brand video (44) passes it, and every other video builds exactly as before, narration only. The mix copies Shelfie's brand video (`meet-shelfie.mp4`), measured from that file:

| | Value |
| --- | --- |
| Narration | brought to -18.3 LUFS integrated, Shelfie's narration loudness |
| Music | looped from 0:00, -11.43 dB below the track's own level, no ducking |
| Fades | 1.5 s fade-in at the start, 2 s fade-out at the end |
| Tail | last slide held 3 s after the narration, music only |
| Result | about -18.6 LUFS integrated, AAC 128 kb/s stereo at 48 kHz |

```sh
node tools/video-build/build-video.mjs docs/videos/44-meet-saturdaze --music docs/videos/assets/music/on-the-beach-intro-outro.mp3
```

The track is [assets/music/on-the-beach-intro-outro.mp3](assets/music/on-the-beach-intro-outro.mp3): "On the Beach Intro Outro" by NaturesEye (1:16, about 100 BPM, upbeat Caribbean/reggae feel), from [Pixabay](https://pixabay.com/music/happy-childrens-tunes-on-the-beach-intro-outro-10278/) under the [Pixabay Content License](https://pixabay.com/service/license-summary/). The licence allows free commercial use in a video without attribution. It does not allow distributing the track on its own, so use it only as a source for our videos. It is the same track Shelfie's brand video uses.
