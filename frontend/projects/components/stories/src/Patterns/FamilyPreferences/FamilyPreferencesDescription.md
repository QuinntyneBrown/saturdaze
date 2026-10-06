The Family screen — everything the planner plans around. Two columns from 1024px (`.family-grid`, page-owned), one below:

- **Who's in** — an `sd-list card` of tappable `sd-list-item action chevron` rows with an `sd-avatar`, plus an `sd-ghost-row` to add a member.
- **Locked in every weekend** — commitments as list items with an accent `sd-disc`; the same ghost-row pattern.
- **Home** and **Likes and dislikes** — read-only summaries with a quiet **Edit** button in the section's `[slot=action]`. Likes are leaf chips, dislikes warn chips.
- **Preferences** — list items with an `sd-toggle` in `[slot=trailing]` (the toggle uses `srLabel` because the row title is its visible name).
- **Account** — a sunk `sd-card` with the email and the quiet, warn-text Sign out.

Editing never happens inline (no inline forms in pages): tapping a row or Edit opens a CDK dialog — the **Likes and dislikes** story shows that dialog with its two `sd-chip-input`s. Composition mirrors `docs/mocks/pages/family.html`.
