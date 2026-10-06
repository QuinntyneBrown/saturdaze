# 38 · Coding sd-segments: router links or an ARIA tab list

> **Runtime:** ~7.5 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [segments.mp4](segments.mp4) · [Slides](slides.html) · **Audio:** [segments.mp3](segments.mp3) · [Transcript](script.md)

## Why this video exists

`sd-segments` is the pill track on the Ideas, Legal and Weekend pages. It shows how one component can serve two accessibility patterns (a navigation of router links, or a tab list of buttons), how `model()` gives a two-way binding with a generated `selectedChange` output, and how to style ARIA state directly.

## Learning objectives

By the end, the viewer can:

- Type tab data with an interface whose fields depend on the mode.
- Compute the host `role` from a signal input (`navigation` or `tablist`).
- Use `booleanAttribute` for a bare `narrow` attribute and a string union for `mode`.
- Explain `model()` and bind it with `[selected]` / `(selectedChange)` or `[(selected)]`.
- Implement a roving tab index with arrow keys where selection follows focus.
- Choose between `routerLinkActive` + `ariaCurrentWhenActive` and an explicit `active` label.
- Test router-driven state with `provideRouter` and `navigateByUrl`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| When does `active` beat the router? | When the state lives in a URL fragment, which the router doesn't match on (Legal page). |
| What does `model()` generate? | A writable signal input plus a `selectedChange` output. |
| Why style `[aria-current='page']` / `[aria-selected='true']`? | The visuals can't disagree with what assistive tech announces. |
| What does the spec not cover? | Tabs mode: roles, roving tab index and arrow keys. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Tabs mode with `[selected]` / `(selectedChange)`. |
| `frontend/projects/components/src/lib/segments/segments.ts` | `SegmentTab`, host role, inputs, `model`, `onKeydown`. |
| `frontend/projects/components/src/lib/segments/segments.html` | Tabs branch and the two nav branches. |
| `frontend/projects/components/src/lib/segments/segments.scss` | Track, ARIA-state styling, tablet widths. |
| `frontend/projects/components/src/lib/segments/segments.spec.ts` | Router setup and the five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:27 | Introduction | Coding sd-segments. |
| 00:28-00:57 | Usage | Three ways the app uses it. |
| 00:58-01:40 | Decorator | The tab type; The decorator: role from the mode. |
| 01:41-02:41 | Inputs | Five inputs and a model; model(): a writable input. |
| 02:42-03:26 | Methods | Helpers; Arrow keys: selection follows focus. |
| 03:27-04:15 | Template | Tabs mode: a roving tab index; Nav mode: explicit or router-driven. |
| 04:16-05:06 | Styles | The host is the track; Style the ARIA state, not a class. |
| 05:07-06:26 | Tests | Spec setup: a real router; What each test proves; Testing with real navigation. |
| 06:27-06:45 | Pitfalls | Pitfalls. |
| 06:46-07:27 | Recap | Things to remember; Coding sd-select. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/segments/segments.spec.ts'   # run the segments spec
npm run storybook                                                                # open the Segments stories
```

## Pitfalls

- Leaving `exact: true` off a parent link such as `/ideas`: child routes mark it current too.
- Expecting the router to match fragments: pass `active` instead.
- Tabs mode without a `panel` id on each tab leaves `aria-controls` empty.

## References

- [Angular: model inputs](https://angular.dev/guide/components/inputs#model-inputs)
- [Angular: RouterLinkActive](https://angular.dev/api/router/RouterLinkActive)
- [WAI-ARIA APG: Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
