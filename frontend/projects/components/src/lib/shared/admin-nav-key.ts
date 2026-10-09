/**
 * The destinations of Saturdaze Admin (ADR-014). Shared by `sd-admin-nav`
 * and the admin app's route data so the shell can highlight the current one.
 */
export type AdminNavKey = 'health' | 'places' | 'reviews' | 'skips' | 'activity' | 'emails';

export interface AdminNavItem {
  readonly key: AdminNavKey;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { key: 'health', label: 'Photo health', icon: 'sparkle', route: '/' },
  { key: 'places', label: 'Places', icon: 'map', route: '/places' },
  { key: 'reviews', label: 'Review queue', icon: 'check', route: '/reviews' },
  { key: 'skips', label: 'Ingestion skips', icon: 'refresh', route: '/ingestion-skips' },
  { key: 'activity', label: 'Activity log', icon: 'calendar', route: '/activity' },
  { key: 'emails', label: 'Email templates', icon: 'mail', route: '/email-templates' },
];
