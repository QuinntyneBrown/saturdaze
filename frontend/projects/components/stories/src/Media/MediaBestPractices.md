## Best practices

### Layout

- Give the frame its slot's width; it sets its own height from the ratio.
- Inside a card, add `class="card__media"` so it sits flush with the card's top and sides.

### Content

- Pass the API's photo (`src`, `alt`, `width`, `height`, `credit`) unchanged; never drop the credit, the licence requires it.
- Match the fallback `tone` and `icon` to the category: `leaf` + `tree` outdoors, `indoor` + `popcorn` indoors, `sun` + `fork` for food, `sky` + `ticket` for events.

### Performance

- Cards stay lazy. Set `eager` only for an image above the fold, such as a weekend cover.

### Accessibility

- The image's `alt` describes the photo, not the place's name alone.
- The credit chip keeps 4.5:1 contrast over any image through its scrim.
