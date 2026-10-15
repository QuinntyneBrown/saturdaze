# 35 · Design drift D40: a stop that says "Stop"

The numbered circles on the Weekend timeline are easy to read if you can see them. For someone using a screen reader, they were a bare number. This short video covers drift D40 from the design-system drift log: what drifted, why it matters, the fix in the mock and the component, and the real page before and after. Recorded as of October 2026.

## What drifted

Each stop on a day gets a numbered disc: one, two, three. The label said stop two, but it was set as an `aria-label` on a `<span>`. A span is not interactive and has no role, and most screen readers ignore an aria-label on an element like that. So the people the label was written for heard only the number, with no word for what it counted.

The design system's resolution is simple: put the word in the page. A visually hidden "Stop" sits before the number, so the disc reads Stop two.

## Why it matters

The success criteria are WCAG one point three point one, info and relationships, and four point one point two, name, role, value. A name that most assistive technology ignores is not a name. Text is the most reliable way to carry meaning: it is read, it is searchable, and it survives anything a screen reader does with roles. The disc looks exactly as before, so sighted users notice nothing.

## The fix in code

This changes what assistive technology reads, so the requirement came first. L2 one thirty seven says a numbered stop disc carries its meaning as text, a visually hidden Stop before the visible number, and does not rely on an aria-label on a non-interactive element.

Then the mock. In the weekend mock, each numbered disc now holds a span with the visually hidden class, containing the word Stop and a space, followed by the number. The design system's note on stop numbers says the same.

In the app, the block component's template drops the `aria-label` binding and renders a span with the global visually hidden class, then the number.

The acceptance test came first. It takes the first numbered disc on the Weekend page and expects its text to be Stop one, with no aria-label. It failed because the disc's text was just one. The existing stop tests, which found a stop by its number, now look for the text Stop and the number. The one remaining failure in that spec, about Directions links, fails the same way on the main branch. Finally, the D40 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the Weekend page, with the first numbered stop. The panel on the right shows the accessibility tree the browser builds for that block. The time and duration read ten ten am, two hours thirty, and then just the number one. The aria-label is gone.

And here is the fix. The page looks identical, but the same block now reads ten ten am, two hours thirty, Stop one. The word is part of the page.

## Recap

Things to remember.

- An aria-label on a plain span is usually ignored; put the word in the page.
- A visually hidden "Stop" before the number keeps the look and fixes the name.
- Find a stop in tests by its text, "Stop 2", not the bare number.
- Requirement and mock first, a failing test, then delete the drift record.
