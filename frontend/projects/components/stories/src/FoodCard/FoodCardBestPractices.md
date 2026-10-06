## Best practices

### Layout

- Group food cards by meal in an `sd-section` ("Lunch · Near Terre Bleu · 12:00 to 1:30") inside `sd-grid-cards sd-grid-cards--2`.
- One `topPick` per meal, first in the grid. Once a pick is `locked`, drop `topPick` from the group and `dimmed` + `votesDisabled` the rest.

### Content

- `meta` reads cuisine · vibe · distance from the activity: "Mediterranean · Patio · 6 min from Terre Bleu".
- Chips are the reasons the family cares about — "Wife-approved", the drive time — not the cuisine again.
- `lockedLabel` names the meal: "Locked for lunch", "Locked for dinner".

### Accessibility

- The vote row is a group named "Family vote for {title}"; each thumb says who is voting and is a pressed toggle.
- Lock it in confirms in a dialog before it reshuffles the day; don't lock on a single tap.
- "Locked" and "Top pick" are spelled out in chips, not carried by the border or the disc colour alone.
