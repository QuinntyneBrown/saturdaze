An inline message strip for form errors, read-only notices and save failures. The `sd-banner` host carries `.banner` and one of `.banner--info` (default), `.banner--warn` or `.banner--success` from `docs/mocks/styles/app.css`; the projected message sits in `.banner__text`.

`icon` adds an optional 20px leading glyph. `role` is `status` by default (announced politely) or `alert` for errors (announced assertively) — `aria-live` follows the role.
