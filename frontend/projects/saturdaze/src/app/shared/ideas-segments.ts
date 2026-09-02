import { SegmentTab } from 'components';

/** The three Ideas segments, as router links. */
export const IDEAS_SEGMENTS: readonly SegmentTab[] = [
  { label: 'Activities', link: '/ideas', exact: true },
  { label: 'Food', link: '/ideas/food' },
  { label: 'Events', link: '/ideas/events' },
];
