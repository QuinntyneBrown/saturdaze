Five stars for rating a past weekend. The `sd-stars` host carries `.stars` (and `.stars--lg`) from `docs/mocks/styles/app.css`.

In display mode it draws filled `sd-icon` stars up to `rating`, with an optional `.stars__label` caption ("5 of 5"). With `editable` it becomes a `role="radiogroup"` (named by `groupLabel`) of five `.stars__btn` radios labelled "1 star" … "5 stars"; clicking emits `ratingChange` with the picked step, and clicking the current star again emits `0` to clear it. The component doesn't store the rating — bind it back.
