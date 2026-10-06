## Best practices

### Layout

- Lay past cards out newest first in `sd-grid-cards`, under the filter chips (All, Favourites, This year, 5★).
- Keep Remix (quiet) and Repeat (primary) together in the footer; Repeat is the one coral action on the card.

### Content

- `dateRange` is the weekend's dates, en-dash separated: "10 – 11 May 2026".
- The title is whatever the family called it — short and memorable ("Bronte Creek + Rec Room"). The planner's draft name is fine until they rename it.
- Lead with the same cover the Weekend screen shows. Credit it "Your photo" for a family upload and "From {place}" for a stop's photo.
- `highlights` is the family's own note of what made the weekend: "Mae found a frog. Eli won the basketball arcade." It clamps to two lines.

### Accessibility

- The title button is named "Rename: {title}" and the rating button announces the current score ("currently 4 of 5"), so both read as actions.
- The "Add a photo" tile is a button named "Add a photo to {title}", so each card's control is distinct in a list of links and buttons.
- The heart is an icon-only toggle named "Favourite this weekend" with `aria-pressed`; keep `favourite` in sync after `favouriteToggle`.
