A three-segment password strength meter shown under a new-password field (Create account, Reset password). The page computes the level; `sd-strength` only draws it.

The host carries the `.strength` block from `docs/mocks-v2/styles/app.css` plus `.strength--weak`, `.strength--ok` or `.strength--strong` from `level`; inside are the `.strength__bar` of three `.strength__seg`s (hidden from assistive tech) and an optional `.strength__label`. The host is an `aria-live="polite"` region, so a change of label is announced as the person types.
