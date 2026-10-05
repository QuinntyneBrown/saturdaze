The dashed "add" affordance under a list: "Add an errand", "Add a family member", "Add a commitment". `sd-ghost-row` has a `display: contents` host; the real `<button class="ghost-row">` (or `<a class="ghost-row">`) carries the `.ghost-row` styles from `docs/mocks-v2/styles/app.css` — full width, 44px tall, dashed border.

It leads with a 16px `sd-icon` named by `icon` (default `plus`) and projects the label. Without `href` it is a button that emits `pressed` (usually to open a CDK dialog); with `href` it renders an anchor whose plain clicks on in-app paths route through the Angular router.
