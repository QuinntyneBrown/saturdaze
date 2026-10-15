# 36 · Design drift D41: the dividers that disappeared

A list of people is easier to read when each person has a thin line under them. This short video covers drift D41 from the design-system drift log: a CSS rule in the mocks that quietly removed every one of those lines. We look at what drifted, why it matters, the one-rule fix, and the page before and after. Recorded as of October 2026.

## What drifted

In the mocks, a list row is the class `list__item`. It draws a thin line under itself, and the stylesheet then removes that line from the last row with a last-child rule, so the list does not end in a stray line.

The trouble is the markup. On Family, in the confirmation dialogs and on the admin pages, each row is an action: a link or a button. Those rows sit inside a list item element, one per row. That makes every action row the last child of its own list item, so the last-child rule matched every row, and every divider went away. Only plain rows that were direct children of the list kept their lines.

## Why it matters

There is no WCAG criterion for a hairline, but it is about scanning. With the lines gone, Quinn, Sara, Eli and Mae run together into one block, and the card no longer shows where one tap target ends and the next begins. The design system had already found the problem during extraction and fixed it, so the mocks, which are the design, were out of step with it.

## The fix in code

This is a one-rule change in the stylesheet, with no new behaviour, so there is no acceptance test. In the mocks' `app.css`, a new rule sets the divider on the direct list items that are not the last one: `.list > li:not(:last-child) > .list__item`. The old last-child rule stays for rows that are direct children.

The app did not need a change. The `sd-list-item` component draws its divider from its own host element being the last child, which is the right element. In the design system, the list page's note is reworded to state the rule, and the D41 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the Family mock, with the Who's in card. Quinn, Sara, Eli and Mae sit in one block, with no line between them.

And here is the fix. The same card, and each row now has its hairline, so you can see where one person ends and the next begins. The last row has no line, so the card ends cleanly.

## Recap

Things to remember.

- A last-child rule on a row inside its own list item matches every row.
- Put the divider on `.list > li:not(:last-child) > .list__item`.
- The product component was already right; the mock was the drift.
- Fix the mock, then delete the drift record.
