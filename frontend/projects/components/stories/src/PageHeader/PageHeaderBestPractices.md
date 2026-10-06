## Best practices

### Layout

- One page header per screen, always first in `<main>`.
- At most one `[slot=primary]` and two `[slot=actions]`; anything else goes behind `[slot=more]`.
- Use `backHref` only for a screen that is a drill-down of another (Review submissions → Family), not as a substitute for the bottom nav.

### Content

- The title says where you are in plain words: "This weekend", "Ideas", "The Browns", "Past weekends".
- The subtitle is one sentence that reflects the data — the weather, a count, the home location — not a tagline.
- Action labels are verbs: "Share", "Add to calendar".

### Accessibility

- The title is the page's only `h1`; sections and days below use `h2`.
- The overflow button is icon-only, so it **must** have a `label` ("More options").
- `backLabel` names the destination; the phone back button reads "Back to {backLabel}".
