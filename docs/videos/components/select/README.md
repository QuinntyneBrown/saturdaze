# 39 · Coding sd-select: a native select in field clothes

> **Runtime:** ~7.3 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 37, sd-seg-radio](../seg-radio/README.md) covers the same forms pattern

**Video:** [select.mp4](select.mp4) · [Slides](slides.html) · **Audio:** [select.mp3](select.mp3) · [Transcript](script.md)

## Why this video exists

`sd-select` is the dropdown in the add errand and add to day dialogs. It shows the house approach to form controls: keep the native element for keyboard, mobile and screen-reader behaviour, add only the `.field` clothes, and plug into Angular forms as a `ControlValueAccessor` with signal-backed state.

## Learning objectives

By the end, the viewer can:

- Register `NG_VALUE_ACCESSOR` with `forwardRef` and implement the four accessor methods.
- Keep form-owned `value` and `disabled` in `signal()` so OnPush templates react.
- Use `booleanAttribute` for `required` and forward `name` to the native element.
- Link a `<label for>` to the select and show a visible "Required" marker.
- Style the field with tokens by role and explain the one hex value in the chevron SVG.
- Test the accessor by calling its methods and dispatching native `change` events.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not a custom dropdown? | Native gives keyboard, type-ahead, the mobile picker and semantics for free. |
| Why does the chevron SVG contain a hex colour? | It is a data URL background image; custom properties can't reach inside it. |
| What fires `onChange`? | Both `(change)` and `(blur)` call `handleChange`. |
| How is the label associated? | `[attr.for]` on the label equals the select's generated id. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/add-errand-dialog/add-errand-dialog.html` | `[ngModel]` / `(ngModelChange)` usage. |
| `frontend/projects/components/src/lib/select/select.ts` | Decorator, providers, inputs, signals, accessor methods. |
| `frontend/projects/components/src/lib/select/select.html` | Label, native select, options, hint. |
| `frontend/projects/components/src/lib/select/select.scss` | Field box, chevron, focus and disabled. |
| `frontend/projects/components/src/lib/select/select.spec.ts` | Setup and the six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:24 | Introduction | Coding sd-select. |
| 00:24-01:02 | Usage | Where it is used; Why stay native. |
| 01:02-01:57 | Decorator | The decorator; Plugging into forms. |
| 01:57-02:45 | State | Inputs and signals; What it doesn't need. |
| 02:45-03:06 | Methods | The methods. |
| 03:06-04:05 | Template | A real label, visible Required; The native select. |
| 04:05-05:03 | Styles | Label, control, hint; The field box; Focus and disabled. |
| 05:03-06:14 | Tests | Spec setup; Structure and labelling; Driving the accessor. |
| 06:14-06:38 | Pitfalls | Pitfalls. |
| 06:38-07:17 | Recap | Things to remember; Coding sd-sitebar. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/select/select.spec.ts'   # run the select spec
npm run storybook                                                            # open the Select stories
```

## Pitfalls

- `(blur)` also calls `handleChange`, so the form hears the value again on blur; keep change handlers idempotent.
- There is no placeholder option; include an explicit empty option if nothing should be preselected.
- Replacing it with a custom dropdown means rebuilding keyboard and mobile behaviour.

## References

- [Angular: ControlValueAccessor](https://angular.dev/api/forms/ControlValueAccessor)
- [MDN: &lt;select&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
