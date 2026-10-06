# 05 · Coding sd-banner: tones, roles and a live region

> **Runtime:** ~6.3 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [04 · sd-avatar](../avatar/README.md)

**Video:** [banner.mp4](banner.mp4) · [Slides](slides.html) · **Audio:** [banner.mp3](banner.mp3) · [Transcript](script.md)

## Why this video exists

`sd-banner` is the inline message strip for form errors, save failures and notices. It is tiny, but an error banner must be announced the moment it appears, so the component derives `aria-live` from its `role` input in one place. This video shows that accessibility contract and how the spec proves it.

## Learning objectives

By the end, the viewer can:

- Write a standalone, OnPush component whose host is the mock's `.banner` with one class binding per tone.
- Bind `role` from an input and derive `aria-live` (`assertive` for `alert`, `polite` for `status`) in the host map.
- Decide when a host-binding expression should move into a `computed()`.
- Project the message into a single default slot and render an optional leading icon.
- Use status/neutral background and foreground token pairs for tones.
- Explain what each test in `banner.spec.ts` proves.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why derive `aria-live` from `role`? | One place decides politeness; a page can't pair `alert` with `polite`. |
| When is `alert` right? | Errors that block the user; `status` (the default) for everything else. |
| Why is the default `status`? | Every banner is a live region even if a page forgets the role. |
| How do pages render errors? | `@if (error()) { <sd-banner tone="warn" role="alert" icon="close">…` |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Error banner inside `@if`. |
| `frontend/projects/saturdaze/src/app/pages/shared-weekend/shared-weekend.page.html` | Info banner as a note. |
| `frontend/projects/components/src/lib/banner/banner.ts` | Host bindings, three inputs. |
| `frontend/projects/components/src/lib/banner/banner.html` | Icon and text slot. |
| `frontend/projects/components/src/lib/banner/banner.scss` | Flex row, tone token pairs. |
| `frontend/projects/components/src/lib/banner/banner.spec.ts` | Five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:37 | Introduction | What the banner is; where errors and notices use it. |
| 00:38-01:52 | Decorator | Tone classes; role and the derived `aria-live`. |
| 01:53-02:48 | Inputs | Tone, icon, role; an input named `role`; when to use `computed()`. |
| 02:49-03:19 | Template | Optional icon, projected text. |
| 03:20-04:04 | Styles | Layout and tone token pairs. |
| 04:05-05:18 | Tests | Defaults, tones, alert, icon, projection. |
| 05:19-05:42 | Pitfalls | `aria-live` on pages, alert for good news, empty banners, colours. |
| 05:43-06:15 | Recap | Things to remember; preview of video 06. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/banner/*.spec.ts'
npm run storybook          # Components → Banner
```

## Pitfalls

- Setting `aria-live` on the page instead of letting the banner derive it.
- Using `role="alert"` for success messages.
- Leaving an empty banner on screen instead of wrapping it in `@if`.
- Hard-coding colours instead of using `tone`.

## References

- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [MDN: ARIA alert role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role)
- [Angular: Binding to the host element](https://angular.dev/guide/components/host-elements)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
