# 37 · Design drift D42: landmarks that say what they are

A page has a shape for people who cannot see it: landmarks, lists and buttons that say what they open. This short video covers drift D42 from the design-system drift log, four small gaps in that shape. We look at what drifted, why it matters, the fix in the mocks and the app, and the real pages before and after. Recorded as of October 2026.

## What drifted

There were four gaps. The site footer on the landing and legal pages sat inside the main element. A footer inside main is just a generic block; only a footer outside it is the page's content info landmark. The pager on the admin lists was a plain div, with no navigation landmark. The admin Places list was a div of links instead of a list. And the account avatar in the mocks was a link to the dialog gallery, where it should be a button that opens a menu.

In the app, two of those were already right: the list components carry the list and list item roles, and the avatar is a real button. What was missing there was small. The footer was inside main. The pager's navigation label read Pages instead of Pagination. And the avatar button did not say it opens a menu.

## Why it matters

The criteria are WCAG one point three point one, info and relationships, and four point one point two, name, role, value. Screen reader users jump between landmarks to skip to what they want, and a footer inside main is not on that list. A button that opens a menu should say so before they press it. None of this changes how the page looks.

## The fix in code

This changes what assistive technology reads, so the requirement came first. L2 one thirty eight says the site footer is a content info landmark outside main, a pager is a navigation named Pagination, lists are lists, and the account avatar is a button with `aria-haspopup` set to menu.

Then the mocks: footers moved after main on landing and legal, admin Places became a list, both pagers became nav elements, and the avatar became a button on all fifteen pages that have a top bar.

In the app there are three changes. The shell gets a small site footer component, rendered after main for routes that ask for it, and landing and legal ask for it; their own footers are gone. The pager's default label becomes Pagination. And the top bar's account button sets `aria-haspopup` to menu.

Four acceptance tests came first, each through a page object: the landing footer and the legal footer must be a content info landmark with no footer inside main; the pager must be a navigation named Pagination; and the avatar button must announce a menu. All four failed, and pass now. The footer's links moved to their own unit test. Two other tests in the landing and legal specs fail the same way on the main branch. Finally, the D42 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the landing page, scrolled to the bottom, and the panel shows the accessibility tree the browser builds. The footer's text and links sit inside the main part of the tree, as plain content. There is no content info landmark.

Now Admin Places. This is the Places list in Saturdaze Admin, scrolled to the pager under the last row. The panel shows the end of the tree: the list of places, and then a navigation called Pages, with the page count and the two disabled buttons.

And here is the fix. On the landing page the same footer text and links now sit under their own top-level content info landmark, outside the main part of the tree, which is what lets a screen reader list the footer as a landmark and jump straight to it. And on Admin Places the navigation is called Pagination. It is the same landmark, with the same count and buttons, but its name says what it is, so a screen reader can announce it and offer it in its landmarks list.

## Recap

Things to remember.

- A footer is only the content info landmark when it sits outside main.
- A pager is a navigation, named Pagination.
- A button that opens a menu says so with aria-haspopup.
- Requirement and mock first, failing tests, then delete the drift record.
