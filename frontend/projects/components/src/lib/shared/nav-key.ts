/**
 * The four primary destinations. Shared by `sd-top-bar` (≥720px) and
 * `sd-bottom-nav` (<720px); pages declare theirs through route data so the
 * shell can highlight the right one (ADR-006: four items is a fixed contract).
 */
export type NavKey = 'weekend' | 'ideas' | 'past' | 'family';

export interface NavItem {
  readonly key: NavKey;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'weekend', label: 'Weekend', icon: 'home', route: '/weekend' },
  { key: 'ideas', label: 'Ideas', icon: 'sparkle', route: '/ideas' },
  { key: 'past', label: 'Past', icon: 'star', route: '/past' },
  { key: 'family', label: 'Family', icon: 'user', route: '/family' },
];
