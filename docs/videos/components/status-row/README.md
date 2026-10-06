# 44 · Coding sd-status-row: a polite live region with a spinner

> **Runtime:** ~5.8 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 42, sd-spinner](../spinner/README.md)

**Video:** [status-row.mp4](status-row.mp4) · [Slides](slides.html) · **Audio:** [status-row.mp3](status-row.mp3) · [Transcript](script.md)

## Why this video exists

`sd-status-row` is the "what's happening" card on the Weekend, Ideas, Past, Family and review pages. It composes `sd-spinner` and adds the words a screen reader announces, through static `role="status"` and `aria-live="polite"` host attributes and a single default slot.

## Learning objectives

By the end, the viewer can:

- Make a host element a polite live region with static `host` attributes.
- Give a signal input a sensible default (`icon = 'sparkle'`).
- Compose another library component and forward an input to it.
- Separate decoration (`aria-hidden` spinner) from the announced message (projected text).
- Declare one unconditional default `ng-content` slot.
- Test projection with a standalone host component.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `role="status"` + `aria-live="polite"`? | Advisory messages announced without interrupting the user. |
| Why are they static host attributes? | They never change, so there is no signal to bind. |
| Who is announced, the spinner or the text? | The text; the spinner is `aria-hidden`. |
| Where should errors go instead? | A banner with `role="alert"`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | The generating status row. |
| `frontend/projects/components/src/lib/status-row/status-row.ts` | The whole component. |
| `frontend/projects/components/src/lib/status-row/status-row.html` | Spinner and text slot. |
| `frontend/projects/components/src/lib/status-row/status-row.scss` | Card styles by role. |
| `frontend/projects/components/src/lib/status-row/status-row.spec.ts` | `glyph`/`drawn` helpers, `HostCmp`, setup and the four tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:27 | Introduction | Coding sd-status-row. |
| 00:27-00:57 | Usage | On almost every loading page. |
| 00:57-01:44 | Decorator | The whole component; A polite live region. |
| 01:44-02:01 | Input | One input, a sensible default. |
| 02:01-02:46 | Template | The template; Decoration vs message. |
| 02:46-03:26 | Styles | A card, by role. |
| 03:26-04:49 | Tests | Spec setup: a host for the content; What each test proves. |
| 04:49-05:14 | Pitfalls | Pitfalls. |
| 05:14-05:47 | Recap | Things to remember; Coding sd-strength. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/status-row/status-row.spec.ts'   # run the status-row spec
npm run storybook                                                                    # open the StatusRow stories
```

## Pitfalls

- Inserting the live region together with its text; many screen readers only announce changes to a region already on the page.
- Putting buttons or links inside a status region.
- Using it for errors that need attention instead of a `role="alert"` banner.

## References

- [MDN: ARIA status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/status_role)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- `docs/adr/ADR-013-fluent-design-tokens.md`
