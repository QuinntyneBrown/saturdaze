Label / value pairs. `sd-details` renders a `<dl>`-style grid carrying `.details` from `docs/mocks-v2/styles/app.css`: each entry in `items` becomes a `dt.details__label` and a `dd.details__value`. It is how the review queue lays out a submitted event's Location, Cost, Ages, Link and Notes.

A `null` value renders the `missing` text ("Not given" by default) in faint ink (`.details__value--faint`). Give an item an `href` and its value renders as an external `.details__link` that opens in a new tab with `rel="noopener"`.
