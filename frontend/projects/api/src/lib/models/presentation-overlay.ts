/**
 * Per-name overlays for presentation-only fields that the catalog API
 * doesn't yet model (tag, "why this was suggested", curated subtitle).
 * These live frontend-side until the planner emits them as part of the
 * suggestion bundle for a given weekend.
 */
export interface PresentationOverlay {
  readonly subtitle?: string;
  readonly ages?: string;
  readonly tag?: string;
  readonly why?: string;
}
