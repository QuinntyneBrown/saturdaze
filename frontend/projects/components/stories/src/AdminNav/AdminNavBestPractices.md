## Best practices

### Layout

- Render it once, in the admin app shell, as the first child of the `.admin` grid; the routed screen is the second column from 1024px.
- Keep the destinations fixed; a new admin area is a new entry in `ADMIN_NAV_ITEMS`, not an ad-hoc link.

### Content

- Pass the signed-in administrator's email; the avatar shows its initial and the side navigation prints it in full.
- `signOut` only emits; the app owns the confirmation and the real sign-out.

### Accessibility

- The nav is labelled "Admin" so it does not collide with the family app's "Primary" navigation in assistive-technology landmarks.
