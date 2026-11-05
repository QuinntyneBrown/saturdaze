# 45 · Couples dates: the product

> **Runtime:** ~5 min · **Audience:** product, design and anyone deciding whether the feature is right · **Prerequisites:** none

**Video:** [45-couples-date-the-product.mp4](45-couples-date-the-product.mp4) · [Slides](slides.html) · **Audio:** [45-couples-date-the-product.mp3](45-couples-date-the-product.mp3) · [Transcript](script.md)

First of three videos on couples date planning (L1-042, ADR-025). Narrated with the free Kokoro voice from Hugging Face, no captions, a soca bed from Pixabay under it.

## Why this video exists

The couples date build (L2-219 → L2-225) touched the mocks, the dialogs gallery, a new screen, the Weekend, Food and Past pages, and the whole planning stack. This video shows what the family gets and why it was shaped the way it was, before the two engineering videos go under the hood.

## Learning objectives

By the end, the viewer can:

- Say what a date is in Saturdaze: two adults, one meal, an optional nearby activity, the drives, planned around their busy time
- Find "Plan a date" on the Weekend page, the date block on its day, and the date's own screen
- Change a date through D39–D43: swap the restaurant, change or drop the activity, move, regenerate, cancel
- Explain the five design choices: no fifth navigation item, dialogs only, one locked block, says who needs care but books nothing, says why when nothing fits

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Who goes on a date? | Two adults (18+); the two oldest by default; a family with fewer than two sees D38b and cannot plan |
| What happens to the kids? | They stay on the family plan, which pauses for the date; the block and the screen say when they need care; nothing is booked |
| Where does a date live in the UI? | "Plan a date" on `/weekend`, one block in its day, `/weekend/dates/{id}` under the Weekend item |
| What can go wrong, and how is it shown? | 409 `no_restaurant_fits` or `date_clash`, shown in a warn banner in the server's words |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `docs/mocks/pages/weekend.html` | "Plan a date" action; Sunday's date block with "Date" and "Kids need care" chips |
| `docs/mocks/pages/dialogs.html` | D38, D38b, D39, D40, D41, D42, D43 |
| `docs/mocks/pages/weekend.date.html` | The date's screen and its three states |
| `docs/mocks/pages/ideas.food.html`, `past.html` | Breakfast filter; the date line |
| The app at `/weekend`, `/weekend/dates/{id}`, `/ideas/food`, `/past` | The same flows live, against the seeded Browns family |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00–00:20 | Introduction | What Saturdaze plans today; what parents asked for |
| 00:20–00:45 | The ask | Different audience, shape and meal; it must still fit the weekend |
| 00:45–02:13 | The mocks | Weekend, dialogs D38–D43, the date's screen, Food and Past |
| 02:13–03:41 | The app | Plan a date, the block, swap and drop, move/regenerate/cancel, breakfast and Past |
| 03:41–04:21 | The choices | The five decisions |
| 04:21–04:53 | Recap | Things to remember; what the next videos cover |

## Demo commands

```powershell
# API (SQLite, seeded) and the family app
pwsh -File eng/Start-E2eApi.ps1 -Build
cd frontend; npm start

# clips, narration (Kokoro), build without captions and with the soca bed
node tools/video-record/record-clips.mjs docs/videos/45-couples-date-the-product
$env:PYTHON = "python"; node tools/video-audio/generate-audio.mjs docs/videos/45-couples-date-the-product --engine kokoro
node tools/video-build/build-video.mjs docs/videos/45-couples-date-the-product --no-captions --music docs/videos/assets/music/en-la-playa-trinidad-and-tobago-soca.mp3
```

## Pitfalls

- The app clips plan and cancel a real date on the seeded family's current weekend; run them against the e2e API, never a development database.
- Past weekends cannot get a date, so the Past clip stubs the history response with one, as `e2e/fixtures/couple-date.ts` does.
- A date can only be planned for this weekend or next; the staging helper plans the current weekend first.

## References

- `docs/specs/L1.md` L1-042; `docs/specs/L2.md` L2-219 → L2-225
- `docs/adr/ADR-025-couples-date-planning.md`
- `docs/detailed-designs/weekend-planning/plan-a-couples-date/README.md`
- Music: "En La Playa - Trinidad and Tobago Soca" by JuliusH, [Pixabay](https://pixabay.com/music/world-en-la-playa-trinidad-and-tobago-soca-4662/), Pixabay Content License
- Voice: Kokoro-82M, [hexgrad/Kokoro-82M on Hugging Face](https://huggingface.co/hexgrad/Kokoro-82M), via `kokoro-onnx`
