# 29 · Design drift D34: one clock

Saturdaze shows a lot of times. A swim lesson at nine, church at half past ten, an errand that landed on Sunday. In the mocks and the product those times were written on two different clocks, and the ranges between them in three different ways. This short video covers drift D34 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the code, and the real app before and after. Recorded as of October 2026.

## What drifted

The timeline used a twenty four hour clock. A dinner was six fifteen written as eighteen fifteen, and the evening block was written as twenty hundred. But dialog subtitles used a twelve hour clock with no am or pm at all, so a lunch read eleven to one, and a bath time read eight to nine pm, with the suffix on the second number only.

Ranges were written three ways: with no suffix, with a suffix on the last time only, and with a suffix on both. And the admin pages wrote timestamps two ways, one with the year first and a twenty four hour clock, and one with the day first and a zero padded hour.

## Why it matters

There is no single WCAG criterion for this, but the rule underneath is plain. A parent reads these times in a hurry, on a phone, with a kid asking what is happening. A range like eleven to one is ambiguous: it could be eleven at night. Two clocks on one screen make people stop and convert. And a screen reader reads a time with no am or pm exactly as ambiguously as it looks. One format, written the same way everywhere, removes all three problems.

## The fix in code

The rule is one sentence. Every time is on a twelve hour clock with lowercase am or pm and no leading zero. A range is joined with the word to, with am or pm on both ends. Admin timestamps read day, month, year, then the time, then UTC.

In the product, the work is in the api library, in `format.ts`. The old `hhmm` helper is gone. The timeline clock, the Keeping notes, the errand placement, the commitments summary and the admin timestamps all call `clock12`, and `timeRange` now simply joins two clocks.

One thing nearly broke. The restaurant section decided whether a meal was lunch or dinner by parsing the timeline clock back into minutes. Once that clock carried an am or pm, the parse failed and the lunch subtitle quietly fell back to close to home. A failing unit test caught it. The fix is a new field on the block row, `startMinutes`. Code now compares minutes, and only people read the clock text.

The acceptance test came first. The weekend spec expected the swim lesson to start at nine am, and failed for the right reason, because the page said nine. Then the formatter tests, the admin specs and the Family, Ideas and dialog expectations followed, each red before it went green. Then the mocks, with the same change in the weekend, landing, dialogs, family, ideas, review and admin pages. Last, the D34 row is gone from the drift log, and the content page now states the rule instead of describing the mess.

## Before and after

Here is the production build from the commit before the fix, on the landing page's sample weekend. The timeline clock column reads nine, ten thirty, eleven, with no am or pm, and the afternoon is not obvious.

And here is the fix, the same page. Every time now says am or pm. Nine becomes nine am, and ten thirty becomes ten thirty am. The layout is unchanged.

## Recap

Things to remember.

- One clock: twelve hour, lowercase am or pm, no leading zero.
- Ranges say am or pm on both ends: nine am to ten am.
- Code compares minutes, never the display text. That is why the block row has `startMinutes`.
- Mocks first, failing test, then delete the drift record.
