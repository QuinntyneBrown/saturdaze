## Best practices

### Layout

- Put cards in a `sd-grid-cards` grid; let the grid, not the card, decide the width.
- Use `span` only for the one card that leads the grid (the top restaurant pick) — never for two in a row.
- Use `padding="lg"` for cards that read like a document (a submission in the review queue), `md` everywhere else.
- `variant="sunk"` is for a recessed panel inside a surface (a dialog's summary), not for a card on the cream page.

### Content

- Lead with what the family will recognise — a place, an event, a weekend title — then the where and when on a softer line.
- Keep a card to one decision. If it needs a form, open a dialog from its footer button.

### Accessibility

- `locked`, `dimmed` and `muted` are visual only. Say the state in text too — a "Locked for lunch" chip, a "Pending review" chip — so it is not carried by border or opacity alone.
- `interactive` adds the hover lift but no semantics; put the real `<button>` or `<a>` inside the card.
