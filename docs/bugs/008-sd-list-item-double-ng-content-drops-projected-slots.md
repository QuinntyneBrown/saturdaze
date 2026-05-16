# Bug 008 — `sd-list-item` swallowed its projected slot content

## Symptom

Every page that rendered `<sd-list-item>` without an `href` lost its
`slot="leading"` and `slot="trailing"` projected children. Visually: list
rows with no avatars / no icons / no chevrons / no chips. Profile, Saved,
Dialogs, and Components Gallery all looked broken.

The profile spec `each member carries an avatar with the correct tone`
caught it first:

```
locator.toHaveAttribute: timeout
locator('sd-list-item[title="Quinn"]').locator('sd-avatar[name="Quinn"]')
expected: "primary"
- element(s) not found
```

DOM dump for a Quinn row before the fix:

```html
<sd-list-item title="Quinn" subtitle="Parent · 38">
  <div class="row">
    <div class="body"><div class="title">Quinn</div><div class="subtitle">Parent · 38</div></div>
    <div class="trailing"></div>
  </div>
</sd-list-item>
```

The `<sd-avatar slot="leading">` and `<sd-icon slot="trailing">` were gone.

## Root cause

`sd-list-item.html` repeated three identical `<ng-content select="…">`
slots inside both the `@if (href())` and `@else` branches of the template:

```html
@if (href()) {
  <a class="row">
    <ng-content select="[slot=leading]" />
    ...
    <ng-content select="[slot=trailing]" />
  </a>
} @else {
  <div class="row">
    <ng-content select="[slot=leading]" />
    ...
    <ng-content select="[slot=trailing]" />
  </div>
}
```

Angular ng-content is a *projection* — there is exactly one logical slot
per selector per component instance. Listing the same selector twice in
the template makes Angular pick one location at runtime; in this case
the false branch (no href) lost the projection entirely.

## Fix

Hoist the slots into a single `<ng-template>` and stamp it inside either
branch with `[ngTemplateOutlet]`:

```html
<ng-template #body>
  <ng-content select="[slot=leading]" />
  <div class="body">...<ng-content /></div>
  <div class="trailing"><ng-content select="[slot=trailing]" /></div>
</ng-template>

@if (href()) {
  <a class="row" [attr.href]="href()">
    <ng-container [ngTemplateOutlet]="body" />
  </a>
} @else {
  <div class="row">
    <ng-container [ngTemplateOutlet]="body" />
  </div>
}
```

Each ng-content selector is now declared exactly once. `NgTemplateOutlet`
is added to the component's `imports`.

## Status

- Logged: 2026-05-16
- **Fixed: 2026-05-16.** Verified by re-running `profile.spec.ts` — all
  8 tests pass against the live API.
