# 24 · Design drift D02: a primary button you could not read

Every primary button in Saturdaze, from "Create your account" on the landing page to "Sign in" and the confirm button in every dialog, put white text on a warm coral. That coral was too light. This short video covers drift D02 from the design-system drift log: what drifted, why it matters, the fix in the mocks, the tokens and the components, and the real app before and after. Recorded as of October 2026.

## What drifted

The mocks drew the primary button with `--sd-primary`, the coral E07856, and a white label. The Angular app copied that value into its theme, so `--colorBrandBackground` was the same coral, and every `sd-button` with the primary appearance rendered it.

When the design system was extracted from the mocks, its contrast check measured white on that coral at three to one. The design system fixed it on its own side, with a deeper coral, B F 5 1 3 0, and logged the difference as D02. The mocks and the product kept the old value.

## Why it matters

The rule is WCAG success criterion one point four point three, contrast minimum, at level double A. Button labels are fourteen pixel semibold text, which is normal-size text, so they need four and a half to one. Three to one only passes for large text. The primary button is the one action we want everyone to take, so it is the worst place to fail.

The new coral gives the white label four point seven four to one. The old coral is not thrown away: it is still the brand, and it stays on the brand mark, the current-page underline, the focus ring and the coral icons, where nothing is written on top of it.

## The fix in code

Start with the mocks, because the mocks are the design. In `docs/mocks/styles/tokens.css` a new token, `--sd-primary-fill`, holds B F 5 1 3 0, and `--sd-primary` keeps E07856 with a comment that it never sits behind text. In `app.css` the primary button and its hover state read the fill token. The class names do not change.

In the product, token values change in the TypeScript theme, as architecture decision thirteen requires. In the brand ramp, step eighty, the button fill, becomes B F 5 1 3 0, and step ninety becomes the old coral. The alias tokens follow: `colorBrandBackground` and its hover read step eighty, a new `colorBrandBackgroundStatic` reads step ninety for the brand mark, and the focus ring, brand text and brand stroke stay on step ninety, so they keep their current colour until their own drift items are fixed. Then `npm run tokens` regenerates `_tokens.scss` and `tokens.ts`.

Four components drew the brand mark with the button token, so they now read `colorBrandBackgroundStatic`: the top bar, the site bar, the auth shell and the admin nav. The current-page underline and the stat bar read `colorBrandStroke1`. The token unit test was written first and failed until the theme had the new role.

Finally, the Playwright visual baselines were captured again from the mocks, and only the screenshots that contain a primary button were updated. The D02 row is gone from the drift log, along with the D02 citations on the button, dialog, accessibility, colour, iconography and theming pages.

## Before and after

Here is the production build from the commit before the fix. The landing call to action and the sign-in button are the light coral, and the white label is hard to read, especially on a phone in sunlight.

And here is the fix. The same buttons are a deeper coral and the label is crisp. Look at the brand mark in the corner: it has not changed, because it now reads the static brand token. Only the fill behind text moved.

## Recap

Things to remember.

- White on the brand fill must reach four and a half to one; three to one was not enough.
- Change token values in the TypeScript theme, then regenerate; never edit the generated files.
- Keep the brand colour, but only where nothing is written on it.
- Fix the mocks first, re-capture only the affected baselines, then delete the drift record.
