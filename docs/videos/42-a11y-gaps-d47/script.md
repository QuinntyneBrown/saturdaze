# 42 · Design drift D47: four small gaps in the product

Most of the drifts in the log are between the mocks and the design system. This one is different: it is about the product itself. This short video covers drift D47: four small accessibility gaps in shared components. We look at what each one was, why it matters, the fixes, and the real screens before and after. Recorded as of October 2026.

## What drifted

First, the admin navigation. The component put an aria-label of Admin on its host element, but a custom element with no role has no landmark, so the label named nothing. Second, text fields. When a field shows an error, the hint under it is hidden, but the field still listed the hint's id in aria-describedby, pointing at an element that is not in the page. Third, the chip input behind Likes and Dislikes. Add something that is already there, and the input quietly cleared the text and did nothing. And fourth, the skip link, whose href is a bare hash that would resolve against the base tag and leave the page.

## Why it matters

The criteria are WCAG one point three point one, info and relationships, three point three point one, error identification, and four point one point two, name, role, value. A landmark with no role is invisible to the people who navigate by landmarks. A reference to a missing element is noise for a screen reader. And a value that disappears with no message looks like the app lost it. The skip link turned out to be fine already: it handles the click, prevents the navigation and moves focus to the main content, so that one needed a requirement and no change.

## The fix in code

This changes what assistive technology reads and what the chip input says, so the requirement came first. L2 one forty covers all four. The admin navigation is a navigation landmark named Admin. A field's aria-describedby lists only elements that are in the page. A duplicate in a chip input stays in the field, marks it invalid and says so. And the skip link keeps moving focus without leaving the page.

In the app there are three changes. The admin navigation's host gets `role="navigation"`. The text input lists the error's id when an error is showing and the hint's id only when the hint is. And the chip input keeps a duplicate in the field, sets aria-invalid, and shows a message under the box, the value is already in the list's name, tied to the input with aria-describedby. The message clears when the text changes or a chip is removed. The wording and the behaviour come from the design system's chip input page.

Three acceptance tests came first, each through a page object. One expects the admin navigation landmark named Admin. One clears the Starts field in Suggest an event and expects every id in its aria-describedby to exist. And one adds a duplicate like in the Family dialog and expects the message, the text still in the field, the field invalid, and the chips unchanged. All three failed, and pass now. Two component specs that described the old silent behaviour were updated, and the D47 row is gone from the drift log.

## Before and after

Here is the build from before the fix. In the Likes box, we type the word lavender and press Enter. Lavender is already there, so the text simply vanishes and nothing says why. Then we clear the Starts field in Suggest an event. The panel lists what the field's description points to: the error, which is in the page, and the hint, which is missing.

Now Saturdaze Admin. The panel shows the top of the accessibility tree. The links to Photo health, Places and the rest sit at the top level, with no landmark around them.

And here is the fix. We type lavender again and press Enter. The text stays, the box is marked invalid, and a message says lavender is already in Likes. Then in Suggest an event the description lists only the error, and it is in the page.

In Saturdaze Admin the links now sit under a navigation called Admin, so a screen reader lists it with the page's landmarks and can jump straight to it, or skip past it to the content.

## Recap

Things to remember.

- A landmark needs a role as well as a name.
- Describe a field only with elements that exist: the error in place of the hint.
- Never drop input silently: keep it in the field and say why.
- Requirement first, failing tests, then delete the drift record.
