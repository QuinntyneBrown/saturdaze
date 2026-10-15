# 32 · Design drift D37: one icon, one meaning

An icon is a tiny word. If the same drawing means two things, people have to guess which one you meant. This short video covers drift D37 from the design-system drift log: what drifted, why it matters, the fix in the mocks and the app, and the real admin screens before and after. Recorded as of October 2026.

## What drifted

Two pairs of icons were tangled. First, the star. In the family app the star means a rating: it is the Past tab and the five stars you tap to rate a weekend. But in the admin app the same star meant Make primary, the action that chooses which photo represents a place. And the Primary chip on that photo wore the star too.

Second, the arrows. The icon called arrow right and the icon called chevron right drew exactly the same shape, a bare chevron, and so did arrow left. So a button that says go to, and a row that says opens its details, looked identical, and a redraw of one would have changed the other.

## Why it matters

There is no single WCAG criterion here, but the idea sits close to consistent identification, success criterion three point two point four: things that do the same job should look the same, and things that do different jobs should not. A star that sometimes means rate and sometimes means promote makes people stop and check. A design system exists so each shape has one job.

## The fix in code

This is a visual change with no new behaviour, so there is no new acceptance test, and the design system and the mocks lead. Icons are defined in three places: the mocks, the design system, and the component library. All three change the same way.

For the arrows, arrow left and arrow right now have a shaft as well as a head, so they read as arrows. The chevron stays a bare chevron for rows that open their details.

For the primary photo, there is a new icon, bookmark, a ribbon that marks one item as the chosen one. It replaces the star on the Make primary button in the place photos screen and in the review queue, on the well inside the make primary dialog, and on the Primary chip that the places service attaches to the photo tile. The star keeps one job: ratings and the Past tab.

The unit test that lists the sprite grows by one, to forty two icons. In the design system, the iconography page gains the bookmark, the arrow captions say what each one looks like, the note about two meanings to untangle is gone, and the D37 row is removed from the drift log.

## Before and after

Here is the build from before the fix. This is the Photo health screen in Saturdaze Admin. The button All places ends in an arrow, but it is a bare chevron, the same shape that a row uses to say open.

On the Place photos screen for Bronte Creek, the Primary chip and the Make primary button both carry a star, the same star that means a rating everywhere else.

And here is the fix. On Photo health, All places now ends in a proper arrow, with a shaft. On Place photos, the Primary chip and the Make primary button carry the new bookmark, and the star is left to ratings.

## Recap

Things to remember.

- One icon, one meaning: add a new icon rather than lending an old one a second job.
- Arrows have a shaft; chevrons are bare. They are different icons for different jobs.
- The bookmark marks the primary photo; the star is for ratings.
- Change all three icon definitions together, then delete the drift record.
