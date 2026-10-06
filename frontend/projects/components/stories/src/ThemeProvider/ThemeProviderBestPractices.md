## Best practices

- Override **alias** tokens (`colorBrandBackground`), not component internals; components only read theme tokens, so that is all a provider needs to change.
- Prefer `createLightTheme(brand)` over hand-listing brand colours — it keeps every brand role (fill, text, stroke, focus) consistent.
- Keep themes outside templates (a constant or a field) so the object identity is stable and the directive does not rewrite styles on every change detection.
- Don't use it for one-off tweaks to a single element; a component-scoped custom property (`--sd-btn-h`) or a modifier class is clearer.
