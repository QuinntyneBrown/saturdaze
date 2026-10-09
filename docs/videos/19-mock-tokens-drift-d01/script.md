# 19 · Design drift D01: the mock tokens that pointed nowhere

Every design system has a place where it and the product quietly disagree. This short video covers the first drift in the Saturdaze drift log, D01: a mock stylesheet whose header pointed at a folder that no longer exists. We look at what drifted, why it matters, the fix in code, and the screen before and after. Recorded as of October 2026.

## What drifted

The mocks in `docs/mocks` have their own stylesheet of design tokens, called `tokens.css`. Its first line claimed it was a verbatim copy of a file in a design-system assets folder, and warned that a check script fails if the two ever differ.

That assets folder was deleted when architecture decision twelve moved the design system into Storybook. So the claim was false, and the check, section two of the mocks checker, could only report that its source file was missing. Every run of the checker ended with one finding that nobody could fix by editing the mocks.

## Why it matters

This is not an accessibility bug, so no WCAG criterion is involved; the design rule is simpler. A guard that always fails teaches people to ignore the guard. When the next real finding appears, it hides in the noise. And a header that sends a reader to a file that does not exist wastes the time of every new contributor.

The design system already named the resolution: the extracted reference now lives at `docs/design-system/tokens/tokens.css`, and the product's tokens are generated from the TypeScript theme, as architecture decision thirteen says. The mocks were deliberately left untouched, so this fix is small and local.

## The fix in code

Three edits. First, the header of the mock `tokens.css` now says that the mocks own the file and points to the extracted reference. The token values below it do not change.

Second, section two of the checker no longer compares bytes against a deleted file. It only asserts that `styles/tokens.css` exists. The source path constant and the long comparison block are gone, about forty lines removed.

Third, the mocks readme describes the check as it now works, and the D01 row is deleted from the drift log, with the mocks gate recorded as zero findings. Once the product and the design system agree, the record of the disagreement goes.

## Before and after

Here is the landing mock served from the commit before the fix, then from the fix. No token value changed, so the screen is identical, and that is the point: this was a documentation and tooling drift, not a visual one. The Angular app never shipped the pattern, so it needs no change and no Playwright baseline moves.

The proof is the checker. Before, it ends with one finding. After, it ends with zero.

## Recap

Things to remember.

- A header must not point at a file that does not exist.
- A check that can never pass is worse than no check.
- Fix the source of the claim, then delete the drift record.
