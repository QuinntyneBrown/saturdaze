A restaurant pick on Ideas · Food. `sd-food-card` is a `.card` host (the food card in `docs/mocks/pages/ideas.food.html`): a fork `sd-disc`, the `h3.card__title` and a `.card__meta` style line, projected chips, the family's `sd-vote-row`, and a `.card__footer` with "See menu" (when `menuUrl` is set) and the coral "Lock it in".

State lives on the host: `topPick` adds `.card--span` and a "Top pick" chip, `locked` adds `.card--locked`, an accent disc and a `lockedLabel` chip in place of the lock button, and `dimmed` (`.card--dimmed`) fades a locked pick's siblings and disables their Lock it in. `votes` feeds the vote row (hidden when empty); `voteChange` re-emits its `{ index, vote }` and `lockIn` fires from the lock button.

Every food card leads with an `sd-media` photo frame (L2-106): the restaurant's photo, or a `sun` fallback tile with a fork.
