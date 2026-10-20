# 44 · Meet Saturdaze

> **Runtime:** ~1.3 min · **Audience:** families hearing about Saturdaze · **Where it plays:** the marketing site, www.saturdaze.ca (ADR-018, L2-150 AC7)

**Video:** [44-meet-saturdaze.mp4](44-meet-saturdaze.mp4) · [Slides](slides.html) · **Audio:** [44-meet-saturdaze.mp3](44-meet-saturdaze.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The brand video on the marketing site: what Saturdaze does for a family's weekend in about a minute, recorded from the real app and narrated with the same voice as Shelfie's brand video, Azure Speech `en-US-JennyNeural`, `cheerful` style, rate `-5%`.

## Outline

1. **Introduction**: two days, already planned, around what never moves and the weather.
2. **The weekend**: both days as timelines with drives and a map (clip `the-weekend`).
3. **Anchors**: who is in the family, and the commitments locked into every weekend (clip `anchors`).
4. **Ideas**: activities, food and events close to home, each with its drive time (clip `ideas`).
5. **Make it yours**: swap a stop, lock a day (clip `make-it-yours`).
6. **Share and look back**: the Share button, then rated past weekends (clip `share-and-past`).
7. **Outro**: free during the beta at www.saturdaze.ca.

## Run sheet

| Time | Segment |
|------|---------|
| 00:00-00:09 | Introduction |
| 00:09-00:20 | The weekend |
| 00:21-00:34 | Anchors |
| 00:35-00:47 | Ideas |
| 00:47-00:56 | Make it yours |
| 00:56-01:06 | Share and look back |
| 01:07-01:17 | Outro |

## Rebuild it

Against a disposable, freshly seeded database (`tools/video-record/family-demo/README.md`), with the API on :5100 and the family app on :4200, from the repository root:

```sh
node tools/video-audio/generate-audio.mjs docs/videos/44-meet-saturdaze --dry-run
node tools/video-record/record-clips.mjs docs/videos/44-meet-saturdaze
export AZURE_SPEECH_REGION=canadacentral AZURE_SPEECH_KEY=$(az cognitiveservices account keys list -n shelfie-speech -g shelfie-prod --query key1 -o tsv)
node tools/video-audio/generate-audio.mjs docs/videos/44-meet-saturdaze --engine azure
node tools/video-build/build-video.mjs docs/videos/44-meet-saturdaze --check
node tools/video-build/build-video.mjs docs/videos/44-meet-saturdaze
cp docs/videos/44-meet-saturdaze/44-meet-saturdaze.mp4 marketing/assets/video/meet-saturdaze.mp4
ffmpeg -y -ss 4 -i marketing/assets/video/meet-saturdaze.mp4 -frames:v 1 -q:v 3 marketing/assets/video/meet-saturdaze.jpg
cp marketing/assets/video/meet-saturdaze.jpg docs/mocks/images/marketing/meet-saturdaze.jpg
```

Then re-capture the marketing visual baseline (`tools/marketing-screenshots/README.md`). The clip setup plans this weekend and two rated past weekends for the seeded Browns. The share dialog stays closed on camera: against a local API its link reads `localhost`.
