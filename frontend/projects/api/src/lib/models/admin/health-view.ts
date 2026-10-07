/** One flag line on a catalog's stat card: "4 without a photo" → Places filtered to that flag. */
export interface HealthLinkView {
  readonly flag: 'no-photo' | 'blocked-url' | 'unreviewed' | 'missing-alt';
  readonly count: number;
  readonly label: string;
  /** `/places?kind=…&flag=…` (plus `upcoming=true` for events). */
  readonly href: string;
}

/** One `sd-stat-card` on the admin Photo health screen (A2). */
export interface CatalogHealthView {
  readonly catalog: 'activities' | 'restaurants' | 'upcomingEvents';
  readonly label: string;
  readonly tone: 'leaf' | 'sun' | 'sky';
  readonly places: number;
  readonly withPrimary: number;
  /** 0–100, rounded; 0 when the catalog is empty. */
  readonly percent: number;
  readonly links: readonly HealthLinkView[];
}

/** The admin Photo health screen (A2). */
export interface HealthView {
  readonly catalogs: readonly CatalogHealthView[];
  readonly pendingReviews: number;
}
