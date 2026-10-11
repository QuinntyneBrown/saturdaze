## Best practices

### Layout

- Place a leg directly before the block it leads to, inside the day's list.
- Do not put a leg between two blocks at home.

### Content

- Say where the leg ends: "… to {block title}", or "… home" when it ends at home.
- Pass `directionsUrl` only for legs over ten minutes; it carries coordinates, never family or weekend identifiers.

### Accessibility

- Always set `ariaLabel` with whole words ("minutes", "kilometres"); the visible label abbreviates them.
- Set `destination` ("to Lavender fields", "home") whenever the leg has directions. The link keeps its short visible label and reads "Directions to Lavender fields (opens in a new tab)", so the Directions links on a day never share a name (2.4.4).
