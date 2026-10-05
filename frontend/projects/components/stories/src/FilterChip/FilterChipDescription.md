A toggle chip for filter rows on the Ideas, Food, Events and Past screens. `sd-filter-chip` has a `display: contents` host; the real `<button class="filter-chip">` carries the classes from `docs/mocks-v2/styles/app.css` (`.filter-chip--leaf`, `.filter-chip--sun`, …) and the state as `aria-pressed`.

Off is an outline; on is filled — ink by default, or the chip's hue when a `tone` is set. The chip never owns its state: clicking emits `pressedChange` with the next value and the page decides whether to apply it. Project the label, optionally with a leading `sd-icon` (sized to 14px).
