# 30 · Product accessibility: expose state and preserve focus

Issue eighty-five follows four small accessibility gaps through the Saturdaze product. The goal is not a screen-reader checklist. It is to make the interface expose the state it already shows or implies, and to keep keyboard focus on the page a person is using.

## The four gaps

Four small gaps share one property: they make essential state invisible to assistive technology. The Admin app's navigation had no named landmark. A text field could reference both an error and a hint, even when the hint was hidden. Duplicate Likes and Dislikes could disappear without an explanation, or contradict each other across the two lists. The skip link pointed at the main element without keeping the current route in its destination. These are separate components, but a person needs to know where navigation begins, which message explains an invalid field, why a preference was rejected, and where the skip link will take them.

## Make information perceivable

Start with the Admin shell. In `admin-nav.ts`, the custom element now exposes the navigation role and the accessible name, Admin. That makes the side navigation available as a named landmark on both narrow and wide screens; the visual design does not need to change. In `text-input.ts`, `aria-describedby` now follows what is visible: a non-empty error points to the error message, otherwise a non-empty hint is referenced. This prevents stale guidance from being announced while preserving the hint when the field is valid. The input already marks an error as invalid, so its description now matches the message the person can see.

## Keep chip edits clear

The chip editor trims a draft, then compares without case: `Parks` and `parks` are the same preference. It checks the current list first, then the opposite list that the Likes dialog supplies through `otherValues`. A rejected draft stays in the input and gets a visible explanation; a successful addition or removal is announced too. In `chip-input.html`, the status has the status role and polite live updates, and the field references that message with `aria-describedby`. The dialog passes Dislikes to Likes and Likes to Dislikes, preventing a conflict before it is saved. That is more useful than silently clearing a person's text or waiting for a later validation error.

## Preserve skip-link context

Skip links are route-aware, but still do not navigate. `skip-link.ts` builds the destination from the current pathname and query string, then updates it after Angular reports a completed route change. A link on `/sign-in?state=error` therefore points to that page's main content, not the root page. On activation, the handler still prevents normal navigation, makes the main target focusable when needed, and moves focus there. The route stays put, the query stays intact, and the next Tab continues into page content.

## Before and after

Here is the baseline, a fresh build from `origin/main`. The family profile already has a tag in Likes. In the real dialog, typing that tag into Likes again silently loses the draft. Typing the same tag into Dislikes creates a contradictory chip, with no warning. Now the fixed build shows the intended behavior: both attempts leave the draft in each input and display which list already contains the tag, then tell the person to remove it there first. The conflict is visible, announced politely, and tied to the field that needs attention. The recording uses the same local API and profile for both builds, and does not save the dialog.

## Prove the behavior

The acceptance tests make those outcomes repeatable. Admin coverage checks the named navigation landmark at three hundred ninety and one thousand four hundred forty pixels, with no horizontal overflow. Family coverage verifies duplicate retention and feedback; the field tests verify that only the visible description is referenced. Skip-link tests check route and query preservation, focus on the main content, and navigation updates. This is the useful boundary for accessibility tests: assert what a person can perceive or do, not the shape of the component tree.

## Recap

Keep four rules in mind. Give navigation landmarks a clear role and accessible name. Describe a field with its visible error, or its visible hint, never both by default. Keep rejected chip input, explain the conflict, and announce successful changes. Preserve route context in skip links while moving focus to the main content.
