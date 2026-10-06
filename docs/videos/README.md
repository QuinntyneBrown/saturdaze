# Videos

Narrated walkthroughs of the Saturdaze codebase. Each video is a folder of three
text files (`script.md`, `slides.html`, `README.md`) plus the generated
`NN-topic.mp3` and `NN-topic.mp4`. The process is defined by the
`video-creator` skill (`.claude/skills/video-creator/SKILL.md`).

| # | Video | Audience | Runtime |
| --- | --- | --- | --- |
| 01 | [How a Weekend Gets Planned](01-how-a-weekend-gets-planned/README.md) | New contributors | ~8 min |

## Shared files

- `assets/slides.css`, `assets/slides.js` — the 1920x1080 deck stylesheet and runtime
  (`?slide=N` or `#N` selects a slide; arrow keys navigate).
- `pronunciations.json` — how inline code (`code`) and prose terms (`text`) are
  spoken; a video folder may add its own `pronunciations.json`.
- `.cache/` — section audio, the timing manifest, rendered slides and captions.
  Generated and git-ignored.

## Tooling

Both tools are dependency-free Node scripts, run from the repository root.

```sh
# Validate the script, check pronunciations, estimate length and cost (offline)
node tools/video-audio docs/videos/NN-topic --dry-run

# Synthesize narration with Azure AI Speech (writes NN-topic.mp3 and .cache/NN-topic/timing.json)
export AZURE_SPEECH_KEY=...        # never commit it
export AZURE_SPEECH_REGION=eastus2 # optional
node tools/video-audio docs/videos/NN-topic

# Check cues, render slides for review, then build the captioned 1080p MP4
node tools/video-build docs/videos/NN-topic --check
node tools/video-build docs/videos/NN-topic --slides-only
node tools/video-build docs/videos/NN-topic
```

`EDGE_PATH` overrides the Chrome/Edge executable, and `FFMPEG_PATH` the ffmpeg
binary (which needs libx264 and libass). The voices can be overridden with
`VIDEO_NARRATOR_VOICE` and `VIDEO_SECOND_VOICE`.
