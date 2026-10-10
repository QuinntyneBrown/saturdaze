# 27 · Design drift D05: soft text on wells

Saturdaze uses a softer grey for everything that supports the content: subtitles, metadata, field labels, the second line of a list row, the resting option of a segmented switch and the text on a neutral chip. Many of those sit on the recessed sand wells, and on a well that grey fell just short of the contrast WCAG asks for text. This short video covers drift D05 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the TypeScript theme, and the real app before and after. Recorded as of October 2026.

## What drifted

The mocks define three ink strengths. `--sd-ink` for content, `--sd-ink-soft` for labels and metadata, and `--sd-ink-faint` for hints. The soft ink was the grey 6 B 7 2 8 0. The mocks used it for chips, the body of a well, the resting segment on the Weekend and Legal switches, subtitles, labels and list metadata. The Angular app copied the value: `colorNeutralForeground2`, the role all of those components read, was 6 B 7 2 8 0 too.

When the design system was extracted from the mocks, its contrast check measured that grey at four point two two to one on `--sd-surface-2`, the sand of the wells and segment tracks. The design system moved secondary text to a darker slate, 5 B 6 2 7 0, and logged the difference as D05. The mocks and the product kept the old value.

## Why it matters

The success criterion is WCAG one point four point three, contrast minimum, at level double A. Text needs four and a half to one against its background. The old grey passed on white, at four point eight three, and only just on the cream canvas, at four point five two. But on a well it dropped to four point two two, and wells are exactly where Saturdaze puts the short version of the terms, the unselected day on the Weekend switch and the neutral chips. Those are not decoration: they are how a person picks Sunday or learns what a chip means.

The new slate reaches five point three five to one on the wells, five point seven four on the canvas and six point one three on white. It is also darker than the hint text from drift D04, 6 3 6 A 7 7, so labels once again read a clear step stronger than placeholders, and both stay lighter than the content ink.

## The fix in code

Start with the mocks, because the mocks are the design. In `docs/mocks/styles/tokens.css`, `--sd-ink-soft` now holds 5 B 6 2 7 0. Every rule in `app.css` that draws secondary text already read that token, so chips, wells, segments, subtitles and metadata change with it and no class names change. The select chevron is an inline icon with its own literal colour, so it moves to the same slate.

In the product, token values change in the TypeScript theme, as architecture decision thirteen requires. The slate palette in `global/colors.ts` gains a step, slate forty, 5 B 6 2 7 0, and the old slate forty six is gone because nothing reads it any more. In `alias/lightColor.ts`, `colorNeutralForeground2` moves to slate forty. Then `npm run tokens` regenerates `_tokens.scss` and `tokens.ts`, and a token unit test checks the new value. No component changes: they all read the role, not the hex.

The acceptance test came first. A Playwright test reads the colour of the resting Privacy segment on the legal page's well, the subtitle on the sign-in card and the lede on the landing page. It failed with the old grey and passes now. The visual baselines are captured from the mocks, so the snapshots whose mock capture changed were captured again, and only those. Finally, the D05 row is gone from the drift log, along with its citations on the component and foundation pages.

## Before and after

Here is the production build from the commit before the fix, zoomed in so the text reads at video size. First the legal page: the resting Privacy segment on its sand track, and the short version in its well below the title. Then the subtitle under the sign-in card title, and the lede beside the landing page's call to action. The grey on the sand is noticeably washed out.

And here is the fix, the same pages in the same order. Privacy on the track and the short version in its well now read clearly, while the selected Terms segment still stands out. The sign-in subtitle and the landing lede are a touch firmer, and the titles above them are still clearly the strongest ink.

## Recap

Things to remember.

- Text on a well is held to four and a half to one, the same as text on white.
- `colorNeutralForeground2` is secondary text, now 5 B 6 2 7 0, five point three five to one on wells.
- Change token values in the TypeScript theme, then regenerate; components read roles, never hex.
- Fix the mocks first, prove the change with a failing test, then delete the drift record.
