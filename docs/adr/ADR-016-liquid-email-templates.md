# ADR-016 — Email templates are written in Liquid and rendered with Fluid

**Status:** Accepted
**Date:** 2026-10-09
**Related:** [ADR-004](ADR-004-package-version-pins.md), [ADR-014](ADR-014-separate-admin-application.md). Requirements: L1-037, L2-127, L2-128, L2-131. Design: `docs/detailed-designs/administration/manage-email-templates/`.

## Context

Saturdaze Admin manages the email templates Saturdaze will send (L1-037). The first cut used a home-grown placeholder syntax: `{{name}}` replaced by a value, nothing else. The emails on the roadmap need more than substitution: a weekly digest lists a variable number of ideas, a notification shows a line only when something changed, a greeting formats a date. Each of those would otherwise need its own syntax, parser and rules, and administrators would learn a dialect nobody else uses.

Template HTML is written by administrators and will be sent to families, so whatever language is chosen must not execute code, must not reach files or the network, must be bounded in the work one render can do, and must HTML-encode values written into HTML.

## Decision

1. **Liquid is the template language** for subjects, preheaders and both bodies. It is widely known (Shopify, Jekyll, many email platforms), designed for untrusted authors, and the plain `{{name}}` placeholders already written are valid Liquid, so no stored template changes.
2. **Fluid** (`Fluid.Core`, pinned in `Directory.Packages.props` per ADR-004) parses and renders it in the Application layer. One renderer serves the preview and a future sender, so what an administrator previews is what is sent.
3. **A restricted profile** (L2-131), enforced when content is previewed or saved:
   - Standard tags and Fluid's standard filters only; an unknown filter is refused rather than silently ignored, which is Fluid's default.
   - No `include` or `render`: a template is self-contained, and Fluid's file provider stays empty.
   - No `raw` in the HTML body; values written into HTML are encoded with `HtmlEncoder.Default`, and `raw` would undo that.
   - At most 10 000 steps per render (`TemplateOptions.MaxSteps`), so a runaway loop fails fast.
   - Syntax errors are reported with the field, line and column.
4. **Sample data is a JSON object**, so previews can exercise loops and nested objects, not only strings.
5. **The HTML deny-list and the sandboxed preview frame stay** (L2-127, L2-128): Liquid controls substitution, not the markup an administrator types.

## Consequences

- The Application project gains a dependency on `Fluid.Core` and its parser combinator library (`Parlot`).
- Error codes change: `invalid_placeholder` becomes `invalid_template`; `unsafe_html` also covers `raw` in the HTML body.
- Required variables (a system template's link, a marketing unsubscribe) are found by walking the parsed template, so `{{ resetLink | escape }}` counts as using `resetLink`.
- The editor's sample data becomes one JSON field instead of one text field per placeholder.
- Video 20 describes the earlier placeholder syntax and should be re-recorded.
