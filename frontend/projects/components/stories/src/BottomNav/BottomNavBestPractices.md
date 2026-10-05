## Best practices

### Layout

- Render it **once**, in the app shell, after `<main class="sd-frame">`. `.sd-frame` reserves `--sd-bottom-nav-h` + 36px + the safe-area inset at the bottom so the last row of content is never hidden behind the pill.
- Don't add another fixed element along the bottom edge (FABs, toasts, sticky action bars) on phones — it fights the nav for the same space.
- Never replace the `--sd-chrome-bottom` / `env(safe-area-inset-bottom)` maths with viewport units; ADR-005 lists the four CSS-only attempts that failed on iOS Safari.

### Content

- Four items, fixed (ADR-006). Labels are a single short word so they fit at 320px.
- Screens outside the four destinations pass `active = null` rather than highlighting a wrong tab.
