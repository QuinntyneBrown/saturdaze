import type { SegmentTab } from 'components';

/** The three Ideas segments (`ideas-segments.ts` in the app). */
export const IDEAS_TABS: readonly SegmentTab[] = [
  { label: 'Activities', link: '/ideas', exact: true },
  { label: 'Food', link: '/ideas/food' },
  { label: 'Events', link: '/ideas/events' },
];

/** The page-scoped spacing from `ideas*.page.scss`. */
export const IDEAS_STYLES = [
  `.segments-row { margin-bottom: 16px; }`,
  `.filters { margin-bottom: 24px; }`,
  `.section + .section { margin-top: 32px; }`,
];

export function ideasHeader(subtitle: string, active: string, primary = ''): string {
  return `
    <sd-page-header title="Ideas" subtitle="${subtitle}">${primary}</sd-page-header>
    <sd-segments class="segments-row" label="Idea type" [tabs]="tabs" active="${active}" />
  `;
}
