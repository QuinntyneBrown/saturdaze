A rotating ring. `sd-spinner` renders the `.spinner` ring from `docs/mocks/styles/app.css` — a coral arc turning on a hairline track. Given an `icon`, the host gains `.spinner-disc` and a 16px glyph sits still inside the turning ring; that's the form used by the generating status row and the verifying auth card.

`size` is `md` (40px, default) or `sm` (20px, `.spinner--sm`). The spinner is decorative (`aria-hidden`): pair it with text in a live region — usually by using `sd-status-row`.
