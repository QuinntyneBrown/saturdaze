# 19 · Design drift D01: the mock tokens that pointed nowhere

> **Runtime:** ~3 min · **Audience:** contributors to the mocks and design system · **Prerequisites:** video 01

**Video:** [19-mock-tokens-drift-d01.mp4](19-mock-tokens-drift-d01.mp4) · [Slides](slides.html) · **Audio:** [19-mock-tokens-drift-d01.mp3](19-mock-tokens-drift-d01.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D01 (issue 39): `docs/mocks/styles/tokens.css` claimed to be a verbatim copy of a design-system catalog deleted with ADR-012, so `.check.mjs` section 2 always failed.

## Learning objectives

By the end, the viewer can:

- Explain what drifted and why an always-failing check is harmful.
- Read the three-part fix (header, check, docs and drift log).
- Confirm the fix with `node docs/mocks/.check.mjs`.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Is there a WCAG criterion? | No; it is a tooling and documentation drift. |
| Does the UI change? | No token value changed; no Angular change, no baseline moves. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/mocks/styles/tokens.css` | Old and new header. |
| `docs/mocks/.check.mjs` | Section 2 after the fix. |
| `docs/design-system/README.md` | D01 row removed. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:25 | Introduction | What the video covers. |
| 00:25-01:15 | What drifted, why | Header, deleted folder, noisy guard. |
| 01:15-02:00 | The fix | Three edits. |
| 02:00-03:00 | Before and after, recap | Landing mock, checker 1 to 0 findings. |

## Demo commands

```sh
node docs/mocks/.check.mjs
```

## Pitfalls

- Do not reintroduce a byte-comparison against a path that is not in the repo.

## References

- ADR-012, ADR-013 in `docs/adr/`.
