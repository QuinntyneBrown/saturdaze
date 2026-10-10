# 26 · Design drift D04: hint text too faint to read

Saturdaze uses a third, quieter grey for the small print: placeholders in empty fields, the duration under each stop in the timeline, the note in an empty state, the footer links and the line next to the landing page's call to action. That grey was so light that on the cream page it fell well below the contrast WCAG asks for text. This short video covers drift D04 from the design-system drift log: what drifted, why it matters, the fix in the mocks, the tokens and the components, and the real app before and after. Recorded as of October 2026.

## What drifted

The mocks define three ink strengths. `--sd-ink` for content, `--sd-ink-soft` for labels and metadata, and `--sd-ink-faint`, the grey 9 C A 3 A F, for hints. The mocks used that faint grey for placeholders, the required marker, block durations, empty-state notes, the auth and site footers, the hero note and the trailing text on list rows. The Angular app copied the value: `colorNeutralForeground3`, the role every one of those components reads, was 9 C A 3 A F too.

When the design system was extracted from the mocks, its contrast check measured that grey at two point five four to one on a white card, two point three eight to one on the cream canvas and lower still on the recessed wells. The design system moved hint text to a darker slate, 6 3 6 A 7 7, kept the light grey for disabled text only, and logged the difference as D04. The mocks and the product kept the old value.

## Why it matters

The success criterion is WCAG one point four point three, contrast minimum, at level double A. Text needs four and a half to one against its background. Placeholders and footers are still text: people read the placeholder to learn what a field wants, and the footer carries the links to the terms and the privacy policy. At two and a half to one, someone with low vision, or anyone on a phone in sunlight, simply cannot read it.

The new slate reaches four point seven five to one on the wells, the hardest background it sits on, five point zero nine on the canvas and five point four four on white. It stays well lighter than the ink used for content. For now it sits very close to the soft ink used for labels; drift D05 darkens the soft ink next, and that restores a clear step between the two.

## The fix in code

Start with the mocks, because the mocks are the design. In `docs/mocks/styles/tokens.css`, `--sd-ink-faint` now holds 6 3 6 A 7 7. Every hint rule in `app.css` already read that token, so the placeholders, durations, notes and footers change with it and no class names change. A new token, `--sd-ink-disabled`, keeps 9 C A 3 A F for the things that are not live text: the dialog grab handle, the dots on the browser frame and the empty rating stars. The resting thumbs on the vote row move to the soft ink, as the design system's vote row does.

In the product, token values change in the TypeScript theme, as architecture decision thirteen requires. The slate palette in `global/colors.ts` gains a step, slate forty three, 6 3 6 A 7 7. In `alias/lightColor.ts`, `colorNeutralForeground3` moves from slate sixty five to slate forty three. The accessible stroke keeps slate sixty five. Then `npm run tokens` regenerates `_tokens.scss` and `tokens.ts`, and a token unit test checks the new value.

Two components read the hint role for things that are not text. The empty stars now read `colorNeutralStrokeAccessible`, so they keep their light grey, and the vote row's resting icon reads `colorNeutralForeground2`.

The acceptance test came first. A Playwright test reads the colour of the sign-in footer, the family name placeholder on create account, and the landing page's hero note and footer. It failed with the old grey and passes now. The visual baselines are captured from the mocks, so the snapshots that show hint text were captured again, and only those. Finally, the D04 row is gone from the drift log, along with its citations on the component, foundation and pattern pages.

## Before and after

Here is the production build from the commit before the fix, zoomed in so the small print reads at video size. First the family name placeholder on create account, then the footer under the sign-in card, then the note next to the landing page's call to action and the site footer. All of it is a pale grey that fades into the page.

And here is the fix, the same pages in the same order. The family name placeholder is now a darker slate you can read at a glance, and it still looks like a placeholder rather than a typed value. The terms, privacy and back links under the sign-in card read clearly against the cream page. On the landing page, the beta note next to the button and the site footer are legible too, and the content above them is still clearly the strongest ink.

## Recap

Things to remember.

- Placeholders, notes and footers are text: they need four and a half to one.
- `colorNeutralForeground3` is hint text, now 6 3 6 A 7 7; the light grey is for disabled things only.
- Change token values in the TypeScript theme, then regenerate.
- Fix the mocks first, prove the change with a failing test, then delete the drift record.
