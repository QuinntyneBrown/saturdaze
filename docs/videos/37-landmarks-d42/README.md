# 37 · Design drift D42: landmarks that say what they are

> **Runtime:** ~4.5 min · **Audience:** contributors to the mocks, shell and components · **Prerequisites:** videos 02, 03 and 35

**Video:** [37-landmarks-d42.mp4](37-landmarks-d42.mp4) · [Slides](slides.html) · **Audio:** [37-landmarks-d42.mp3](37-landmarks-d42.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

Drift D42 (issue 80): the site footer sat inside `<main>`, the pager was a plain `<div>`, admin Places was a `<div>` of links, and the account avatar was a link to the dialog gallery rather than a menu button. The design system's resolution, now shipped (L2-138): `footer` outside `main`, `nav aria-label="Pagination"`, a list, and a `button aria-haspopup="menu"`.

## Learning objectives

By the end, the viewer can:

- Explain why a footer only becomes the `contentinfo` landmark outside `main`.
- List what changed in the mocks and what changed in the app (which already had two of the four right).
- Find the four acceptance tests and their page-object members.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Which criteria? | WCAG 2.2 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value. |
| What did the app already do? | `sd-list` / `sd-list-item` carry list roles; the avatar was a `<button>`. |
| How does the footer reach the landmark? | `SiteFooter` renders after `<main>` for routes with `data.footer`. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/specs/L2.md` | L2-138. |
| `frontend/projects/saturdaze/src/app/app.html`, `shell/site-footer.ts` | The footer after `<main>`. |
| `frontend/projects/components/src/lib/pager/pager.ts` | `label = input('Pagination')`. |
| `frontend/projects/components/src/lib/top-bar/top-bar.html` | `aria-haspopup="menu"`. |
| `e2e/tests/landing.spec.ts`, `legal.spec.ts`, `navigation.spec.ts`, `admin/places.spec.ts` | The four acceptance tests. |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:23 | Introduction | What the video covers. |
| 00:23-01:15 | What drifted | Four gaps; what the app already had. |
| 01:15-01:40 | Why it matters | 1.3.1 and 4.1.2. |
| 01:40-03:05 | The fix | Requirement, mocks, three app changes, tests. |
| 03:05-04:08 | Before and after | Landing footer and Admin Places pager trees. |
| 04:08-04:30 | Recap | Four things to remember. |

## Demo commands

```sh
cd frontend && npx ng test saturdaze --watch=false
cd e2e && npx playwright test tests/landing.spec.ts tests/legal.spec.ts tests/navigation.spec.ts --project=desktop
cd e2e && npx playwright test tests/admin/places.spec.ts --project=admin
# clips: development builds of the family app and Admin on main and the fix (:4401-:4404), API on :5100
node tools/video-record/record-clips.mjs docs/videos/37-landmarks-d42
```

## Pitfalls

- A `<footer>` inside `<main>` has no landmark role; check the accessibility tree, not the markup.
- Two other landing and legal tests (hero `aria-hidden`, privacy table of contents) fail on `main` too.

## References

- [WCAG 2.2 Understanding 1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)
- ADR-009 and ADR-010 in `docs/adr/`.
