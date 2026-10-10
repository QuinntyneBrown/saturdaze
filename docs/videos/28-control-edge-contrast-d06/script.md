# 28 · Design drift D06: control edges

A text field is an empty box. The only thing that tells you where to tap is its edge. In Saturdaze those edges, and the track of a switch that is turned off, were drawn so faintly that on the cream canvas they nearly disappeared. This short video covers drift D06 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the TypeScript theme, and the real app before and after. Recorded as of October 2026.

## What drifted

The mocks have two line tokens. `--sd-line` is ink at eight percent, for card edges and dividers. `--sd-line-strong` is ink at sixteen percent. The mocks used the stronger line for every field border, for the chip input on the Family page, and as the fill of a switch track when the switch is off. The Angular app copied it: text inputs, selects, the chip input and the switch all read `colorNeutralStroke1`, the same sixteen percent ink.

When the design system was extracted from the mocks, its contrast check measured that line at one point three six to one against white, the cream canvas and the sand wells alike. The design system gave controls their own stroke, `colorNeutralStrokeAccessible`, the slate 8 0 8 6 8 F, and logged the difference as D06. The mocks and the product kept the faint line.

## Why it matters

The success criterion is WCAG one point four point eleven, non-text contrast, at level double A. Anything a person needs to see to identify a control, or its state, needs three to one against what sits next to it. An empty text field is identified by its border, and an off switch is identified by its track. At one point three six to one, a person with low vision, or anyone on a phone in sunlight, sees a label floating above nothing.

The new slate is three point six seven to one on white, three point four three on the cream canvas and three point two zero on the sand wells. That passes everywhere a control sits, and it is still far lighter than the text, so a form keeps its calm look. The sixteen percent line is not deleted: it stays for decorative edges such as card hovers and the vertical divider between filter groups, where nothing has to be found.

The same rule covers other edges a person has to find. Filter chips that are off, vote buttons nobody has pressed, the dashed rows that add a family member or an errand, and the dashed tile that uploads a photo all move to the same stroke. The quiet button is the one exception: it has its own drift record, D28, and its own fix.

## The fix in code

Start with the mocks, because the mocks are the design. In `docs/mocks/styles/tokens.css`, a new token, `--sd-line-control`, holds 8 0 8 6 8 F, with a comment that gives its ratios. In `app.css`, the field input, the chip input, the switch track, the filter chip, the vote button, the dashed add row and the photo upload tile read it. No class names change, and `--sd-line-strong` is now commented as decorative.

In the product, token values change in the TypeScript theme, as architecture decision thirteen requires. The slate palette in `global/colors.ts` gains slate fifty three, 8 0 8 6 8 F. In `alias/lightColor.ts`, `colorNeutralStrokeAccessible` moves from the old light grey, 9 C A 3 A F, to slate fifty three. That old grey was also used for grab handles, the dots of the browser frame and empty rating stars, which match the mocks' disabled ink, so they move to a new role, `colorNeutralForegroundDisabled`, and look exactly as before. Then the components: text input, select, chip input, switch, filter chip, vote row, ghost row and both photo upload tiles read `colorNeutralStrokeAccessible` instead of the decorative strokes. `npm run tokens` regenerates `_tokens.scss` and `tokens.ts`, and a token unit test checks the new value.

The acceptance test came first. A Playwright test reads the border of the email field on the sign-in card, and the fill of the Remember me track after a person turns it off. A second slice adds the Indoor filter on activity ideas, an unpressed vote on a lunch card, the add a family member row, and the upload tile in the cover photo dialog. Every check failed with the old faint line and passes now. The visual baselines are captured from the mocks, so the snapshots whose mock capture changed were captured again, and only those. Finally, the D06 row is gone from the drift log, along with its citations on the component, foundation and pattern pages.

## Before and after

Here is the production build from the commit before the fix, zoomed in so the one pixel borders read at video size. First the sign-in card: the email and password fields are pale outlines that fade into the white card. Then Remember me is turned off, and the track becomes a pale grey lozenge with a white thumb you can barely separate from the card. Last, the create account form, a stack of boxes that are hard to tell apart from the page.

And here is the fix, the same pages in the same order. Each field now has a clear slate edge, so you can see exactly where to tap. When Remember me is off, the track is a solid slate with the white thumb standing out. On create account, every field reads as a box, and the labels and hints are unchanged.

## Recap

Things to remember.

- Edges that identify a control need three to one, WCAG one point four point eleven.
- `colorNeutralStrokeAccessible` is the control stroke, now 8 0 8 6 8 F, three point two zero to one on wells.
- Decorative lines stay faint; only edges a person has to find get the accessible stroke.
- Fix the mocks first, prove the change with a failing test, then delete the drift record.
