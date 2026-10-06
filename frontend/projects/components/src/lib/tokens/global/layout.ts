import type { LayoutTokens, ZIndexTokens } from '../types';

/** v2 is a full-width web app with a 1120px reading width and no phone canvas (ADR-009). */
export const layout: LayoutTokens = {
  layoutContentMaxWidth: '1120px',
  layoutStackMaxWidth: '720px',
  layoutGutter: '16px',
  layoutTopBarHeight: '64px', // ≥720px sticky top bar
  layoutBottomNavHeight: '60px', // <720px floating bottom nav
};

export const zIndexes: ZIndexTokens = {
  zIndexSticky: '5',
  zIndexTopBar: '20',
  zIndexBottomNav: '30',
};
