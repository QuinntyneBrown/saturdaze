An initials disc for a family member. The `sd-avatar` host carries `.avatar` from `docs/mocks/styles/app.css` and renders the upper-cased first letter of `name` (or `?` when blank). It is decorative — `aria-hidden` — so the member's name always appears beside it.

Person tones map onto the mocks' per-person classes: `primary` → `.avatar--q`, `leaf` → `.avatar--s`, `sky` → `.avatar--e`, `sun` → `.avatar--m`, plus `indoor`. Pages assign tones by member order. Sizes are `sm` 24px, `md` 28px, `lg` 32px (default) and `xl` 36px.

A `src` shows a profile photo instead of the initial (`.avatar--photo` with an `img.avatar__img` cropped to the disc). Only the signed-in user's own avatar takes a photo — in the top bar and on the Family Account card.
