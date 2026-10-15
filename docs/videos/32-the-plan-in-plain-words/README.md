# 32 · The plan, in plain words

> **Runtime:** ~9:06 · **Audience:** the founder's family and friends, early partners, and anyone who asks how a free weekend planner makes money · **Prerequisites:** none

**Video:** [32-the-plan-in-plain-words.mp4](32-the-plan-in-plain-words.mp4) · [Slides](slides.html) · **Audio:** [32-the-plan-in-plain-words.mp3](32-the-plan-in-plain-words.mp3) · [Transcript](script.md)

## Why this video exists

The business plan in [`docs/business-plan/README.md`](../../business-plan/README.md)
is written for someone who reads forecasts. This video explains it the way you
would to a five-year-old: one picture per idea, few words, no jargon. It ends
with a what-if the plan does not cover: the CAD $2.0M seed never arrives, even
though every year of the plan assumes it.

## Learning objectives

By the end, the viewer can:

- Say what Saturdaze does for a family and why planning stays free.
- Explain grown-up likes, the one new idea in the plan, and why it matters to both families and revenue.
- Name the five jars the money comes from, and say that businesses, not families, pay most of it.
- Weigh what changes, what stays and what it costs if the seed never comes.

## Key questions

| Question | What a strong answer includes |
|---|---|
| How does a free planner make money? | Five jars: Saturdaze Plus ($6.99 a month or $59.99 a year), booking referrals (~$3), featured placements ($200 to $300 a month), Fan Reach ($100 to $125 a month) and Local Insights ($500 to $750 a month) (plan, "Business model and monetization") |
| Why do grown-up likes matter? | Plans fit every adult (shared likes first, taking turns, adults-only slots, vetoes); Fan Reach and Local Insights exist only because of them, $960k of 2029 revenue (plan, "Adult member profiles and likes", "3-year revenue projection") |
| How big does it get? | ~$124k, ~$1.27M, ~$5.26M in 2027 to 2029; businesses pay 82% of 2029; the downside case is ~$3.9M (plan, "3-year revenue projection") |
| What does the seed pay for? | $1.44M of losses in 2027 and 2028 with about six months of slack; 55% product, 25% families, 10% venue partners, 10% privacy and legal (plan, "Costs, team and funding") |
| What will Saturdaze never do? | Sell identifiable likes, use children's data for offers, alerts or insights, or let a paid placement beat a pass or a family constraint (plan, "What Saturdaze will not do") |
| What if the seed never comes? | 2027 income covers about a seventh of costs; keep the built planner and catalog; one city, the cheapest jars first, grow by invites and parent groups; slower, a closing window, one person's hours; launch small and let the plan's metrics make the case |

## Code / assets on screen

| File | What to show |
|---|---|
| `docs/business-plan/README.md` | Every figure on screen, except the what-if's "our own thinking" card |
| `docs/business-plan/milestones.png` | The milestones redrawn as the road slide |
| `docs/business-plan/revenue-by-line.png` | The 2027 to 2029 revenue split, redrawn as the year bars and the 2029 split |

The pictures are inline SVG in `slides.html`, drawn with the colours in
`../assets/slides.css`. There are no screen recordings: nothing in this video is
the running app. The coins in each jar are a rough picture of that jar's share
of 2029 revenue, not a count.

## Run sheet

| Time | Segment | Content |
|---|---|---|
| 00:00-00:33 | Introduction | A helper that knows the family hands over a weekend that fits; planning is free; how does free pay? |
| 00:33-01:27 | The problem | Pieces everywhere, a personal puzzle, nothing remembers; ~39.6M families, ~12M in big cities, ~1M in the GTA |
| 01:27-02:00 | Grown-up likes | Every adult gets their own likes; shared likes first, taking turns, adults-only slots, a no removes a place; kids' data plans only |
| 02:00-03:23 | Five jars | Plus, bookings, featured spots, Fan Reach, Local Insights; the jars feed each other |
| 03:23-04:15 | Year by year | ~$124k, ~$1.27M, ~$5.26M; businesses pay 82% of 2029; careful case ~$3.9M |
| 04:15-04:56 | Spending and the seed | Costs $860k, $1.98M, $4.02M; team of 4, 8, 15; $1.44M of losses; the $2.0M seed and where it goes |
| 04:56-05:44 | The road | April 2027 GTA launch; milestones Dec 2026 to Sep 2029; 2027 targets |
| 05:44-06:12 | The never list | No selling likes, no children's data, paid never beats a no; one screen for every like and yes |
| 06:12-06:50 | The biggest risks | Few pay, venues wait, a privacy slip, big platforms |
| 06:50-08:32 | What if the seed never comes? | The gap, what you keep, what you'd change (our own thinking), what it costs, the verdict |
| 08:32-09:06 | Things to remember | Five-point recap; next, grown-up likes from plan to requirement, design and mock |

## Demo commands

```sh
node tools/video-audio/generate-audio.mjs docs/videos/32-the-plan-in-plain-words --dry-run
node tools/video-audio/generate-audio.mjs docs/videos/32-the-plan-in-plain-words
node tools/video-build/build-video.mjs docs/videos/32-the-plan-in-plain-words --check
node tools/video-build/build-video.mjs docs/videos/32-the-plan-in-plain-words --slides-only
node tools/video-build/build-video.mjs docs/videos/32-the-plan-in-plain-words
```

The Edge read-aloud service refused connections from the build machine (HTTP
403, with `edge-tts` 7.2.8), so the published narration was synthesized
offline with the Kokoro `af_heart` voice through the generator's `piper`
engine slot. A small stand-in `piper` module ran Kokoro ONNX: it reads the
paragraph on stdin and writes the WAV named by `-f`.

```sh
python -m pip install kokoro-onnx soundfile   # plus kokoro-v1.0.onnx and voices-v1.0.bin
PYTHONPATH=path/to/shim KOKORO_DIR=path/to/model PIPER_MODEL=af_heart PYTHON=python \
  node tools/video-audio/generate-audio.mjs docs/videos/32-the-plan-in-plain-words --engine piper
```

The default Edge voice works just as well once the service answers.

## Pitfalls

- The what-if chapter's "What you'd change" card is this video's own thinking, not the plan's. The narration and the slide both say so.
- Kokoro reads "$5.26" as "dollar five point two six" and years as "two thousand twenty-seven", so the script spells every number and year in words. Slides keep the digits.
- The narration says "the founder" rather than a name, so the voice never mispronounces it.
- "Sam" comes from the plan's own example ("Sam's pick this week"); "Alex" on the likes slide is an invented second grown-up.
- Nothing here is a requirement. Grown-up likes and every revenue line still need L1/L2 requirements, a detailed design and mocks before code (`AGENTS.md`).

## References

- `docs/business-plan/README.md` (every figure in the video)
- Statistics Canada, A portrait of Canada's families in 2021: <https://www.statcan.gc.ca/o1/en/plus/1375-infographic-portrait-canadas-families-2021>
- FRED, Total Families with Children under 18 Years Old: <https://fred.stlouisfed.org/series/TTLFMCU>
- kokoro-onnx: <https://github.com/thewh1teagle/kokoro-onnx>
