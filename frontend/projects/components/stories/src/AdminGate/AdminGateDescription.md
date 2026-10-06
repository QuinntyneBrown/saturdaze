The state a signed-in non-administrator sees in Saturdaze Admin (L2-111). `sd-admin-gate` wraps an `sd-auth-card.admin-gate` in `sd-auth-shell`, mirroring the `#state-gate` specimen in `docs/mocks/pages/admin.sign-in.html`: a warn disc, the title "This account can't use Saturdaze Admin", the signed-in `email` in an `.email-chip`, a danger **Sign out** button and an "Open Saturdaze" link to `familyAppUrl`.

The admin app renders it in place of the router outlet, so no admin screen is constructed and nothing from `/api/admin/*` is requested for that account.
