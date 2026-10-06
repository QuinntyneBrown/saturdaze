## Best practices

### Layout

- One `sd-auth-shell` per auth page, with exactly one `sd-auth-card` in the normal case. Use `stack` only when cards are deliberately shown together (the design gallery's state specimens).
- Don't add a site bar or app chrome around it; the brand lockup is the way home.

### Content

- Keep the card's job to a single task — sign in, create the account, request a reset. Links to the other tasks go in the card's `[slot=alt]` line.
- The footer links are fixed by the component; don't project extra legal copy below the card.
