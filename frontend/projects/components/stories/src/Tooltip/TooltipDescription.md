A short hint for a control, shown on hover and keyboard focus. Modelled on the Fluent UI v9 Tooltip and rendered with `@angular/cdk/overlay`, anchored to its trigger.

Most consumers never touch it directly: every icon-only `sd-button` shows its `label` as a tooltip, and its `tooltip` input sets different text (or `''` to turn it off). Elsewhere, put `[sdTooltip]` on any focusable element.

`sdTooltipRelationship` tells assistive tech what the text is. `label` (what `sd-button` uses for icon-only buttons) leaves the accessible name on the trigger's `aria-label` and hides the bubble from the accessibility tree, so nothing is read twice. `description` (the default) adds the bubble to the trigger's `aria-describedby` while it shows.

It never shows for touch, waits 400ms on hover (but not when moving along from another open hint), shows at once on keyboard focus, stays open while the pointer moves onto it, and is dismissed by Escape, blur, pointer-out or a press (WCAG 1.4.13).
