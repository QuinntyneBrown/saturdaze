A checklist of the rules a new password must meet (Create account, Reset password), shown under the password field above the strength meter. The page decides which rules are met; `sd-password-rules` only draws them.

The host carries the `.rules` block from `docs/mocks/styles/app.css` and is a `role="list"` named "Password rules". Each rule is a `.rules__item` with a `.rules__mark` disc, and gains `.rules__item--met` once satisfied. Each item ends in visually hidden ": met" or ": not yet met" text.
