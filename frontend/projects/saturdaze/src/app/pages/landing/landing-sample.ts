import { DayWeather } from 'components';

/** One row of the landing miniature, fed straight into `sd-block`. */
export interface SampleBlock {
  readonly time: string;
  readonly duration: string;
  readonly icon: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly commitment?: boolean;
  readonly drive?: boolean;
  readonly errand?: boolean;
  readonly chips?: readonly { readonly tone: 'accent' | 'primary' | 'sky' | 'indoor'; readonly icon?: string; readonly label: string }[];
}

export interface SampleDay {
  readonly title: string;
  readonly meta: string;
  readonly weather: DayWeather;
  readonly blocks: readonly SampleBlock[];
}

/**
 * The fixed weekend drawn inside the landing hero's browser frame — the
 * same rows the mocks use, rendered with the real `sd-day` / `sd-block`.
 */
export const LANDING_SAMPLE: readonly SampleDay[] = [
  {
    title: 'Saturday',
    meta: '17 May · 22° / 14° · Light breeze',
    weather: 'sun',
    blocks: [
      {
        time: '9:00',
        duration: '60m',
        icon: 'bike',
        title: 'Swim lessons',
        subtitle: 'Every Saturday · locked in',
        commitment: true,
        chips: [{ tone: 'accent', icon: 'lock', label: 'Commitment' }],
      },
      { time: '10:30', duration: '45m', icon: 'car', title: 'Drive to Terre Bleu', drive: true },
      {
        time: '11:00',
        duration: '2h',
        icon: 'tree',
        title: 'Lavender fields',
        subtitle: 'Terre Bleu, Milton · walk the rows',
        chips: [
          { tone: 'primary', label: 'Day highlight' },
          { tone: 'sky', icon: 'car', label: '45 min drive' },
        ],
      },
    ],
  },
  {
    title: 'Sunday',
    meta: '18 May · 18° / 12° · Cloudy by 2pm',
    weather: 'cloud',
    blocks: [
      { time: '8:30', duration: '45m', icon: 'home', title: 'Pancakes at home', subtitle: 'Mae flips, Eli pours' },
      {
        time: '9:15',
        duration: '45m',
        icon: 'bag',
        title: 'Costco run',
        subtitle: 'Paper towels, bread, yogurt',
        errand: true,
        chips: [{ tone: 'indoor', label: 'Errand' }],
      },
      {
        time: '10:30',
        duration: '75m',
        icon: 'pin',
        title: 'Church',
        subtitle: 'Every Sunday · locked in',
        commitment: true,
        chips: [{ tone: 'accent', icon: 'lock', label: 'Commitment' }],
      },
    ],
  },
];
