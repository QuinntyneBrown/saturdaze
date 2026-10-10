# 25 · Design drift D03: a focus ring you could barely see

If you use Saturdaze with a keyboard, the focus ring is how you know where you are. Press Tab and a ring moves to the next link, button or field. In Saturdaze that ring was the light brand coral, and on the cream page it was too faint. This short video covers drift D03 from the design-system drift log: what drifted, why it matters, the fix in the mocks, the tokens and the components, and the real app before and after. Recorded as of October 2026.

## What drifted

The mocks draw every keyboard focus ring with one token, `--sd-focus-ring`, defined as a two pixel solid outline in `--sd-primary`, the coral E07856. Text fields draw no outline; their border turns the same coral instead. The Angular app copied the value: `colorStrokeFocus2`, the token every focus ring reads, was E07856 too.

When the design system was extracted from the mocks, its contrast check measured that coral against the cream canvas at two point eight one to one. The design system moved its focus ring to a deeper coral, A 0 4 B 2 C, and logged the difference as D03. The mocks and the product kept the old value.

## Why it matters

Two WCAG success criteria apply. One point four point eleven, non-text contrast, at level double A, says the visual information needed to identify a component's state, and keyboard focus is a state, needs three to one against the colours next to it. Two point four point seven, focus visible, says a keyboard user must be able to see where focus is. A ring at two point eight one to one fails the first and puts the second at risk, especially on a bright screen.

The deeper coral reaches five point five six to one on the canvas and five point one eight to one on the recessed wells. It is the same coral the app already uses for coral text on the soft tint, so no new colour enters the palette.

## The fix in code

Start with the mocks, because the mocks are the design. In `docs/mocks/styles/app.css`, `--sd-focus-ring` now reads `--sd-primary-deep`, which already holds A 0 4 B 2 C. The focused text field border and the focused chip input border read the same token. No class names change.

In the product, token values change in the TypeScript theme, as architecture decision thirteen requires. In `alias/lightColor.ts`, `colorStrokeFocus2` moves from brand step ninety to brand step seventy. Step ninety stays the brand coral for the brand mark, underlines and icons; only the focus role moves. Then `npm run tokens` regenerates `_tokens.scss` and `tokens.ts`. The token unit test now expects A 0 4 B 2 C, and checks that a rebranded ramp carries the focus ring with it.

Every component that draws a focus ring already read `colorStrokeFocus2`, except two links, the stat card link and the admin review queue link, which used the brand stroke. They now read the focus token too. The text input, select and chip input draw their focus border with it as well.

The acceptance test came first. A Playwright test opens sign-in, presses Tab until the forgot password link, the sign in button and the email field have focus, and checks the colour each draws. It failed with the old coral and passes now. No visual baseline shows a focused element, so none had to change. Finally, the D03 row is gone from the drift log, along with its citations on twenty component pages and the accessibility, colour and theming foundations.

## Before and after

Here is the production build from the commit before the fix, zoomed in so the two pixel ring reads at video size. Watch the email field, then the forgot password link, then the sign in button. The ring is a pale coral that almost melts into the cream page.

And here is the fix, the same keystrokes. The ring is a deep coral that stands out against the white card and the cream page. The brand mark and the button fill are unchanged; only the focus colour moved.

## Recap

Things to remember.

- A focus ring is non-text contrast: it needs three to one against what it sits on.
- One role, `colorStrokeFocus2`, draws every focus ring; never use the brand stroke for focus.
- Change token values in the TypeScript theme, then regenerate.
- Fix the mocks first, prove the change with a failing test, then delete the drift record.
