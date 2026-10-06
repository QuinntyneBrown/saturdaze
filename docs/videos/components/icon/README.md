# 27 · Coding sd-icon: one source of truth for every glyph

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular · **Prerequisites:** none; [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [icon.mp4](icon.mp4) · [Slides](slides.html) · **Audio:** [icon.mp3](icon.mp3) · [Transcript](script.md)

## Why this video exists

`sd-icon` draws every glyph in Saturdaze from one constant map of 40 inline SVG paths. It is small, but it touches two things worth teaching carefully: a `computed()` that looks up, falls back and passes markup through `DomSanitizer.bypassSecurityTrustHtml` (safe only because the markup is constant), and a private `--_size` custom property set from a host style binding.

## Learning objectives

By the end, the viewer can:

- Keep a single source of truth (`ICONS`) and derive `ICON_NAMES` from it.
- Expose state CSS needs as a host class (`[class.icon--filled]`), not a reflected attribute (ADR-009).
- Bind a custom property on the host (`'[style.--_size.px]': 'size()'`) and read it in SCSS.
- Explain why `size`/`stroke` have no `numberAttribute` and must be bound (`[size]="13"`) under `strictTemplates`.
- Explain when `bypassSecurityTrustHtml` is safe and when it becomes an XSS hole.
- Keep icons decorative (`aria-hidden`, `focusable="false"`) and recolourable (`currentColor`).
- Read `icon.spec.ts`, including the fallback test.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is the sanitizer bypass acceptable here? | Markup only comes from the constant `ICONS` map; `name` selects a key and unknown keys fall back to `sparkle`. |
| How does a parent resize every icon inside it? | Set `--_size` (e.g. `.filter-chip ::ng-deep sd-icon { --_size: 14px; }`). |
| How does `filled` work? | Host class `.icon--filled` (the mock's own modifier) → `:host(.icon--filled) svg { fill: currentColor; stroke: none; }`. Inputs are not reflected to host attributes (ADR-009). |
| Where does an icon-only control get its name? | From the control (e.g. `sd-button`'s `label`), never from the icon. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/icon/icon.ts` | `ICONS`, `ICON_NAMES`, decorator, inputs, `path`. |
| `frontend/projects/components/src/lib/icon/icon.html` | The SVG. |
| `frontend/projects/components/src/lib/icon/icon.scss` | `--_size`, `:host(.icon--filled)` rule. |
| `frontend/projects/components/src/lib/filter-chip/filter-chip.scss` | A parent setting `--_size`. |
| `frontend/projects/components/src/lib/stars/stars.html`, `past-card/past-card.html` | `[filled]` usages. |
| `frontend/projects/components/src/lib/icon/icon.spec.ts` | Seven tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:36 | Introduction | What it is; usages. |
| 00:36-01:10 | Glyph map | `ICONS`, `ICON_NAMES`. |
| 01:10-02:06 | Decorator | `.icon--filled` host class, inputs stay inputs (ADR-009), the `--_size` knob. |
| 02:06-03:47 | Inputs | `inject(DomSanitizer)`, inputs, numbers, `path`, the bypass. |
| 03:47-04:27 | Template | Decorative SVG. |
| 04:27-05:09 | Styles | Size knob, filled, parent knob. |
| 05:09-06:08 | Spec | Seven tests. |
| 06:08-06:31 | Pitfalls | Four mistakes. |
| 06:31-07:12 | Recap | Things to remember; preview of `sd-leg`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/icon/icon.spec.ts'   # run the icon spec
npm run storybook                                           # Icon stories
```

## Pitfalls

- Passing external SVG through the sanitizer bypass.
- Relying on an icon for meaning.
- Writing `size="16"` instead of `[size]="16"`.
- Adding a glyph without updating the spec's count of 40.

## References

- [Angular: Security (sanitization)](https://angular.dev/best-practices/security)
- [Angular: computed](https://angular.dev/guide/signals#computed-signals)
- [MDN: currentColor](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword)
