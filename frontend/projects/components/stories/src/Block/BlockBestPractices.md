## Best practices

### Layout

- Blocks only live inside an `sd-day` (or another `role="list"`); never use one as a standalone card.
- Every planned row gets a "Why this" sparkle action; add Swap, Lock and (for errands) Done only where the planner allows them. Drive rows carry none.
- Keep to two chips at most — the highlight and the drive time, or the commitment / errand marker.

### Content

- Times are 24-hour clock without a leading zero ("8:30", "13:00"); durations are short ("30m", "2h").
- The title is the plan in the family's words ("Lunch at La Marina"); the subtitle is one line of why or where ("Wife-approved · patio · 3 of 4 votes"). It clamps to one line.
- Mark recurring anchors with `commitment` and a "Commitment" chip, so the family can see what the planner worked around.

### Accessibility

- Every action is icon-only, so give each a `label` that names the block: "Swap Lavender fields", "Lock Lunch at La Marina".
- Lock and Done are toggles: bind `pressed` so they announce their state.
- The phone chevron is named "Details for {title}"; keep titles unique within a day.
