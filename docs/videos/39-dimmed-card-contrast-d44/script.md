# 39 · Design drift D44: stepping back without fading out

When a dinner is locked in, the other picks step back. Opacity is the easy way to do that, and it quietly makes their text hard to read. This short video covers drift D44 from the design-system drift log: what drifted, why it matters, the fix in the mocks, the design system and the app, and the real card before and after, with the contrast measured on screen. Recorded as of October 2026.

## What drifted

Three states faded things out with opacity. A dimmed card, a pick that stepped back, was sixty percent opaque. A muted card, content only you can see yet, such as your own event before approval, was eighty five percent. And a done block on the timeline was sixty percent. Opacity fades the text and its surface together toward the page, so the contrast between them collapses.

The design system had already changed the done block: a muted, struck-through title and a neutral disc. For dimmed and muted cards it recorded an open item.

## Why it matters

The success criterion is WCAG one point four point three, contrast, at level double A: body and meta text needs four and a half to one. A dimmed card's meta text sat at about two and a half to one, and a muted card's at about four point four. The text is exactly what a person needs in order to decide whether to unlock a pick or wait for an event to be approved, so it cannot be the thing that fades.

## The fix in code

The new rule is that stepping back never fades the text. A dimmed card moves to the sunk surface, the sand colour used for wells, with its title in the secondary ink. Only the photo fades, to sixty percent, because a photo is not text. A muted card keeps full colour and gets a dashed edge in the accessible stroke. A done block gets a neutral disc and a struck-through title in the secondary ink.

The same change lands in three places: the mocks' stylesheet, the design system's component styles, and the app. In the app it is four small edits: the generic card, the food card, the event card and the block. The comment in each cites the contrast requirement, L2 zero three eight, and WCAG one point four point three.

The acceptance test came first. It locks Saturday's dinner through the API, as the visual tests do, opens the Food ideas page, and takes the first dimmed card. It expects the card's opacity to be one, and the contrast of its meta text against its surface to be at least four and a half. It failed with an opacity of zero point six, and passes now. The design system's card page now describes the new states, the open item is closed, and the D44 row is gone from the drift log.

## Before and after

Here is the build from before the fix. This is the Dinner section of the Food ideas page, with Jack Astor's locked in. The panel measures Snug Harbour, a dimmed sibling: the card's opacity is zero point six, and its meta text sits at two point six three to one, well under four and a half.

And here is the fix. The same card. It sits on the sunk surface with a readable title and meta, and the photo is still softened. The panel now says the opacity is one, and the meta text measures five point three five to one.

## Recap

Things to remember.

- Opacity fades text and surface together; it cannot be how a card steps back.
- Step back with a sunk surface, secondary ink and a faded photo, or a dashed edge.
- Measure it: the dimmed card went from two point six three to five point three five to one.
- Mock and design system first, a failing test, then delete the drift record.
