# 14 · Coding sd-copy-field: async work, a timed signal and an output

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular and want to build or change `sd-copy-field` · **Prerequisites:** [Video 09 · sd-button](../button/README.md) (the button it composes), [Video 12 · sd-chip](../chip/README.md) (`output()`)

**Video:** [copy-field.mp4](copy-field.mp4) · [Slides](slides.html) · **Audio:** [copy-field.mp3](copy-field.mp3) · [Transcript](script.md)

## Why this video exists

`sd-copy-field` is the share link in the Share dialog. It is small but introduces an `async` method, a local `signal()` that a `setTimeout` resets, graceful handling of a denied clipboard, a typed `output<string>()`, composition of `sd-button` (`label`, `pressed` → `aria-pressed`), and fake-timer testing.

## Learning objectives

By the end, the viewer can:

- Hold short-lived UI state in a protected `signal()` and reset it from a timer under OnPush.
- Write an `async` handler that reads its input once, tolerates a clipboard failure and still confirms.
- Emit a typed `output<string>()` with the copied text.
- Announce a state change with `aria-pressed` and an `aria-live="polite"` region.
- Test async and timed behaviour with a stubbed `navigator.clipboard`, a `flush()` helper and `vi.useFakeTimers`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why read `value()` before the `await`? | So the copied and emitted text are the same even if the input changes mid-flight. |
| Why is the `catch` empty? | A denied clipboard is not fatal; the value stays visible to select by hand. |
| Why no `markForCheck()` after the timeout? | Setting a signal the OnPush template reads schedules the update. |
| How does the test prove "two seconds"? | Advance 1999 ms (still Copied), then 1 ms (back to Copy). |
| What is not cleaned up? | The pending timeout on destroy or a second click; harmless here, use `DestroyRef` for longer timers. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/copy-field/copy-field.ts` | Decorator, input, output, signal, `copy()`. |
| `frontend/projects/components/src/lib/copy-field/copy-field.html` | Value span, `sd-button` with `@if` content. |
| `frontend/projects/components/src/lib/copy-field/copy-field.scss` | Host grid and ellipsis value box. |
| `frontend/projects/components/src/lib/copy-field/copy-field.spec.ts` | Clipboard stub, `flush()`, four tests. |
| `frontend/projects/saturdaze/src/app/dialogs/share-dialog/share-dialog.html` | The share link usage. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:37 | Introduction | Title; Where the app uses it. |
| 00:38-01:07 | Decorator | The decorator. |
| 01:08-01:45 | State | One input, one output, one signal. |
| 01:46-02:55 | Copy | The copy method; Three deliberate choices. |
| 02:56-03:47 | Template | The template composes sd-button; Accessible state. |
| 03:48-04:21 | Styles | Styles. |
| 04:22-06:06 | Spec | Spec setup; Starting state and the happy path; Prove the boundary from both sides; The forgiving catch, locked in. |
| 06:07-06:37 | Pitfalls | Pitfalls. |
| 06:38-07:12 | Recap | Things to remember; preview of `sd-cover`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/copy-field/copy-field.spec.ts'   # run the copy-field spec
npm run storybook                                                     # Components → CopyField
```

## Pitfalls

- Reading the input after an `await`.
- Letting a clipboard rejection escape.
- Relying on an icon swap alone to communicate "Copied".
- Faking every timer, or forgetting `vi.useRealTimers()`.

## References

- [Angular: Signals](https://angular.dev/guide/signals)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [MDN: Clipboard.writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [Vitest: Fake timers](https://vitest.dev/guide/mocking#timers)
