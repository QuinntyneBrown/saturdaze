A small status or category tag. The `sd-chip` host *is* the chip: it carries `.chip` plus the modifiers from `docs/mocks/styles/app.css` (`.chip--sun`, `.chip--leaf`, `.chip--sm`, `.chip--count`, …), so cards can list "Outdoor", "All ages" or "Pending review" exactly as the mocks do.

Project text, optionally led by an `sd-icon` (sized to 13px for you). `removable` appends a `.chip__x` button that emits `remove` — the likes / dislikes editor on the family screen uses it.
