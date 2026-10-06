## Best practices

### Layout

- Anchor the popover to its trigger's end edge, 8px below (above when there's no room), and open it with CDK `Overlay` — never position it by hand in a page.
- Below 720px, show the same items with `sheet` inside an `sd-dialog` with a quiet "Close" action.
- Keep it to two to five items. More than that belongs on a screen.

### Content

- Labels start with a verb or name the destination: "Regenerate the weekend", "Add to calendar", "Family settings", "Sign out".
- Use `sub` to say what happens ("Locked blocks stay where they are") — it only shows in the sheet.
- Put the one `tone: 'warn'` item (Sign out) last, and confirm it in a dialog.
- Give items that only navigate an `href` so they render as real links.

### Accessibility

- Pass `label` (it becomes the menu's `aria-label`) — use the sheet title, "Account" or "Weekend options".
- Focus the first item on open, close on Escape and outside click, and return focus to the trigger.
