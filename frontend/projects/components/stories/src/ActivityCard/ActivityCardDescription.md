An activity suggestion on Ideas. `sd-activity-card` is a `.card` host (the activity card in `docs/mocks/pages/ideas.html`): a `.card__head` with a large tinted `sd-disc` (`icon`, `tone`), the `h3.card__title` and a `.card__meta` place line, then a two-line `.card__body` for the `why`.

Project `sd-chip`s (drive time, ages) into `[slot=chips]`. When `mapUrl` is set a `.card__footer` adds a quiet "Map" button that opens it in a new tab. Cards are informational — there is no "add to day"; the planner places activities.

Every activity card leads with an `sd-media` photo frame flush with its top edge (L2-106): the place's primary photo with its credit, or a tinted fallback tile with the card's icon and tone when there is none.

With `addable` the footer adds a primary "Add to day" button named "Add to day: {title}" and the card emits `addToDay` (L2-107). `sd-event-card` offers the same for this weekend's events.
