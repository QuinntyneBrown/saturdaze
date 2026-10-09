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

## Design drift series

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 19 | [Design drift D01: the mock tokens that pointed nowhere](19-mock-tokens-drift-d01/README.md) | ~3.3 min | A mock stylesheet whose header pointed at a deleted catalog; retiring the always-failing check; before and after. |

## Family members series

Four videos on family member sign-in (L1-037, ADR-016): the account that creates a family owns it, invites members who sign in with their own credentials, adds members such as young children who never sign in, and removes members, which ends their access. Each mixes screen recordings of the family app, made against the Rivera family (`tools/video-record/family-demo`), with the code behind each step. Watch in order.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 20 | [Who owns a family, and who's in](20-who-owns-a-family/README.md) | ~5.7 min | `OwnerUserId` and its backfill; None, Invited and Account; the owner-only 403; adding a child who never signs in. |
| 21 | [Inviting a family member](21-inviting-a-family-member/README.md) | ~5.5 min | "Invite to sign in"; the hashed, single-use, 7-day `FamilyInvitation`; why the owner shares the link (no email provider); `email_in_use` and `already_invited`. |
| 22 | [Joining from an invite link](22-joining-from-an-invite-link/README.md) | ~6.2 min | `/accept-invite` and its two anonymous endpoints; the verified account it creates; unusable links; the read-only member view and its server guard. |
| 23 | [Removing a family member](23-removing-a-family-member/README.md) | ~6.3 min | D21's three consequences; what `DELETE` cascades; delete, not detach; the per-request family lookup that ends an open tab's access; `member_has_access`. |

## Email templates series

Videos on email template administration in Saturdaze Admin (L1-037, L2-124 to L2-131): the templates Saturdaze sends, written, previewed, versioned and retired by administrators. Videos 19 to 21 mix screen recordings of the real app, made against the email demo data (`tools/video-record/email-demo`), with the code behind each screen; video 22 explains the detailed design behind them, as revised for Liquid templates (ADR-016). Watch in order; video 18 sets the scene.

| # | Video | Runtime | What you learn |
| --- | --- | --- | --- |
| 19 | [Email templates: the catalog and new templates](19-email-templates-catalog-and-new/README.md) | ~6.7 min | What a template is (key, category, status, version); the seeded system templates; the Email templates screen; New template, starters and Duplicate. |
| 20 | [Editing and previewing email templates](20-editing-and-previewing-email-templates/README.md) | ~8.2 min | The editor and its version; placeholders, built-ins and sample data; the live preview and its renderer; keeping template HTML inert; required placeholders; stale saves. |
| 21 | [Email template lifecycle and history](21-email-template-lifecycle-and-history/README.md) | ~6.1 min | Draft, Active, Archived; why system templates stay active; Delete; the revision history and loading an old version; what a future sender needs. |
| 22 | [Email template administration: the detailed design](22-email-template-design/README.md) | ~9.1 min | The design behind 19-21, revised for Liquid (ADR-016): C4 context, container and component views; the data model; the create, edit-and-preview and lifecycle sequences; the Liquid profile, inert HTML, required placeholders and `template_stale`; traceability to L1-037 and L2-124 to L2-131. |

## Components series

Fifty-two instructional videos, one per component in `frontend/projects/components/src/lib/`: each codes the component step by step, calls out its best practices (especially signals) and walks through its unit tests. See the [series index](components/README.md).

## Vitest series

Fourteen videos, one per Vitest feature the frontend specs use: the Angular unit-test builder setup, structure and `describe.each`, matchers and asymmetric matchers, async assertions, `vi.fn` and mock programming, call assertions, `vi.spyOn` and restoring, fake timers with `vi.advanceTimersByTime`, and `vi.setSystemTime`. See the [series index](vitest/README.md).

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

The admin series records against a separate demo database and image host; see `tools/video-record/admin-demo/README.md`. The family members series records against a freshly reset database of its own; see `tools/video-record/family-demo/README.md`. The email templates series has its own cross-platform demo data; see `tools/video-record/email-demo/README.md`. `CHROME_PATH` points the recorder at an installed Chromium instead of Playwright's download.
