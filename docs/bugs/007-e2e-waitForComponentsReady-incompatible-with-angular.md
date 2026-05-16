# Bug 007 — `BasePage.waitForComponentsReady()` hangs on the Angular app

## Symptom

Every Playwright spec that calls `await pages.xxx.waitForComponentsReady()`
in `beforeEach` times out after 30 s. Page snapshots taken at the failure
moment show the page IS rendered correctly; the readiness check is the
only thing blocking.

## Root cause

The POM was written for the mock skeleton in `docs/mocks/`, which uses
real Web Components — `customElements.get('sd-top-bar')` returns the
constructor once the bundle loads. The Angular app uses standalone
components with the same selectors but **does not** register them as
custom elements (no `createCustomElement` / `@angular/elements`), so
`customElements.get(...)` returns `undefined` forever and
`page.waitForFunction(...)` never resolves.

```ts
// e2e/pages/base.page.ts
async waitForComponentsReady(): Promise<void> {
  await this.page.waitForFunction(() => {
    const tags = ['sd-top-bar', 'sd-bottom-nav', 'sd-button', 'sd-icon', 'sd-section'];
    return tags.every((t) => !!customElements.get(t));
  });
}
```

## Impact

All behaviour specs that use the readiness hook (home, itinerary,
activities, restaurants, saved, events, errand, profile, dialogs,
components-gallery) abort in `beforeEach`, hiding any actual integration
defects underneath.

## Fix

Replace the customElements check with a DOM-presence check:

```ts
async waitForComponentsReady(): Promise<void> {
  await this.page.waitForSelector('sd-top-bar, sd-bottom-nav, sd-section', {
    state: 'attached',
    timeout: 8_000,
  });
}
```

This works against both worlds — the mock registers + renders the
custom element in one step; the Angular app stamps the DOM with the
tag name the moment the route loads.

## Status

- Logged: 2026-05-16
- **Fix applied this session.**
