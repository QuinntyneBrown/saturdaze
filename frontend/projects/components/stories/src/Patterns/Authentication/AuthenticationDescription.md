The signed-out journey: Sign in, Create account, Reset password and Verify email. These routes use the **bare** shell (`data.shell: 'bare'`) — no top bar, no bottom nav — and every page is one `sd-auth-shell` around one `sd-auth-card`.

- **Forms** stack their fields with 14px gaps and end in one full-width, `lg` primary button. Text fields are `sd-text-input`; consent and opt-ins are `sd-checkbox`; "Remember me" is an `sd-toggle`. The new-password field is followed by `sd-strength`.
- **Errors** from the server go in an `sd-banner tone="warn" role="alert"` above the form, with the affected fields marked `invalid` (`aria-invalid`). Field validation uses the field's own `error` line.
- **Status cards** (check your email, verified, expired, password updated) are `center`ed with an `xl` `sd-disc` in `[slot=disc]` and stacked full-width buttons.
- The `[slot=alt]` line links to the neighbouring task.

Composition mirrors `docs/mocks/pages/sign-in.html`, `create-account.html`, `reset-password.html` and `verify-email.html`.
