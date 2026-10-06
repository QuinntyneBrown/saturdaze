/**
 * Weekend fixtures shared by the pattern stories — the Saturday and Sunday
 * of `docs/mocks/pages/weekend.html`, rendered as the real `sd-day` /
 * `sd-block` markup the Weekend page (`weekend.page.html`) produces.
 */

export interface ChipFixture {
  readonly tone: string;
  readonly label: string;
  readonly icon?: string;
}

export interface BlockFixture {
  readonly time: string;
  readonly duration: string;
  readonly icon: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly commitment?: boolean;
  readonly locked?: boolean;
  readonly drive?: boolean;
  readonly errand?: boolean;
  readonly done?: boolean;
  readonly chips?: readonly ChipFixture[];
}

const COMMITMENT: ChipFixture = { tone: 'accent', icon: 'lock', label: 'Commitment' };
const LOCKED: ChipFixture = { tone: 'accent', icon: 'lock', label: 'Locked' };
const HIGHLIGHT: ChipFixture = { tone: 'primary', label: 'Day highlight' };

export const SATURDAY: readonly BlockFixture[] = [
  {
    time: '8:30',
    duration: '30m',
    icon: 'home',
    title: 'Breakfast at home',
    subtitle: "Cereal day, Eli's choice",
  },
  {
    time: '9:00',
    duration: '60m',
    icon: 'bike',
    title: 'Swim lessons',
    subtitle: 'Every Saturday · locked in',
    commitment: true,
    chips: [COMMITMENT],
  },
  { time: '10:30', duration: '45m', icon: 'car', title: 'Drive to Terre Bleu', drive: true },
  {
    time: '11:00',
    duration: '2h',
    icon: 'tree',
    title: 'Lavender fields',
    subtitle: 'Terre Bleu, Milton · walk the rows',
    chips: [HIGHLIGHT, { tone: 'sky', icon: 'car', label: '45 min drive' }],
  },
  {
    time: '13:00',
    duration: '75m',
    icon: 'fork',
    title: 'Lunch at La Marina',
    subtitle: 'Wife-approved · patio · 3 of 4 votes',
  },
  { time: '14:30', duration: '45m', icon: 'car', title: 'Drive home', drive: true },
  {
    time: '15:30',
    duration: '90m',
    icon: 'bed',
    title: 'Quiet time at home',
    subtitle: 'Recharge before evening',
  },
  {
    time: '17:00',
    duration: '60m',
    icon: 'bike',
    title: 'Workout window',
    subtitle: 'Every Saturday · locked in',
    commitment: true,
    chips: [COMMITMENT],
  },
  {
    time: '18:15',
    duration: '75m',
    icon: 'fork',
    title: 'Dinner at home',
    subtitle: 'Pasta and veg, picky-approved',
  },
  {
    time: '20:00',
    duration: '60m',
    icon: 'bed',
    title: 'Bath and books',
    subtitle: 'Lights out at 9',
    locked: true,
    chips: [LOCKED],
  },
];

export const SUNDAY: readonly BlockFixture[] = [
  {
    time: '8:30',
    duration: '45m',
    icon: 'home',
    title: 'Pancakes at home',
    subtitle: 'Mae flips, Eli pours',
  },
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
    chips: [COMMITMENT],
  },
  {
    time: '12:15',
    duration: '60m',
    icon: 'fork',
    title: 'Lunch at Symposium Café',
    subtitle: 'Brunch · family booths',
  },
  { time: '13:30', duration: '10m', icon: 'car', title: 'Drive to Square One', drive: true },
  {
    time: '14:00',
    duration: '2h',
    icon: 'popcorn',
    title: 'The Rec Room',
    subtitle: "Bowling and arcade · Eli's pick",
    chips: [HIGHLIGHT],
  },
  { time: '16:30', duration: '10m', icon: 'car', title: 'Drive home', drive: true },
  {
    time: '18:30',
    duration: 'open',
    icon: 'bed',
    title: 'Quiet evening',
    subtitle: 'Sunday dinner stays open on purpose',
  },
];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function chipMarkup(chip: ChipFixture): string {
  const icon = chip.icon ? `<sd-icon name="${chip.icon}" [size]="13" [stroke]="2" />` : '';
  return `<sd-chip slot="chips" tone="${chip.tone}">${icon}${esc(chip.label)}</sd-chip>`;
}

function actionMarkup(label: string, icon: string, pressed?: boolean): string {
  const state = pressed === undefined ? '' : ` [pressed]="${pressed}"`;
  return `<sd-button slot="actions" variant="ghost" size="sm" icon label="${esc(label)}"${state}><sd-icon name="${icon}" /></sd-button>`;
}

/** One `sd-block` with the same chips and action buttons the Weekend page renders. */
export function blockMarkup(
  b: BlockFixture,
  opts: { readonly forceLocked?: boolean } = {},
): string {
  const locked = !!b.locked || (!!opts.forceLocked && !b.commitment && !b.drive);
  const flags = [
    b.commitment && 'commitment',
    locked && 'locked',
    b.drive && 'drive',
    b.errand && 'errand',
    b.done && 'done',
  ]
    .filter(Boolean)
    .join(' ');
  const actions: string[] = [];
  if (!b.drive)
    actions.push(actionMarkup((b.commitment ? 'About ' : 'Why this: ') + b.title, 'sparkle'));
  if (!b.drive && !b.commitment && !b.errand) actions.push(actionMarkup('Swap ' + b.title, 'swap'));
  if (b.errand)
    actions.push(
      actionMarkup(`Mark ${b.title} ${b.done ? 'not done' : 'done'}`, 'check', !!b.done),
    );
  if (!b.drive && !b.commitment)
    actions.push(
      actionMarkup((locked ? 'Unlock ' : 'Lock ') + b.title, locked ? 'unlock' : 'lock', locked),
    );
  const sub = b.subtitle ? ` subtitle="${esc(b.subtitle)}"` : '';
  return `
    <sd-block time="${b.time}" duration="${b.duration}" icon="${b.icon}" title="${esc(b.title)}"${sub} ${flags}>
      ${(b.chips ?? []).map(chipMarkup).join('')}
      ${actions.join('')}
    </sd-block>`;
}

export interface DayFixture {
  readonly title: string;
  readonly meta: string;
  readonly weather: 'sun' | 'cloud' | 'rain' | 'snow';
  readonly blocks: readonly BlockFixture[];
}

export const SATURDAY_DAY: DayFixture = {
  title: 'Saturday',
  meta: '17 May · 22° / 14° · Light breeze, good for outdoors',
  weather: 'sun',
  blocks: SATURDAY,
};

export const SUNDAY_DAY: DayFixture = {
  title: 'Sunday',
  meta: '18 May · 18° / 12° · Cloudy by 2pm, indoor afternoon',
  weather: 'cloud',
  blocks: SUNDAY,
};

/** An `sd-day` with its blocks and the "Add an errand" ghost row. */
export function dayMarkup(day: DayFixture, opts: { readonly locked?: boolean } = {}): string {
  const blocks = day.blocks.map((b) => blockMarkup(b, { forceLocked: opts.locked })).join('');
  return `
    <sd-day title="${day.title}" meta="${esc(day.meta)}" weather="${day.weather}"${opts.locked ? ' locked' : ''}>
      ${blocks}
      <sd-ghost-row slot="footer" icon="bag">Add an errand</sd-ghost-row>
    </sd-day>`;
}

/** A day while the planner works: header only, six skeleton rows. */
export function skeletonDayMarkup(title: string): string {
  return `
    <sd-day title="${title}" [actions]="false">
      ${'<sd-skeleton-row />'.repeat(6)}
    </sd-day>`;
}

/** The Weekend page header with its three actions. */
export function weekendHeaderMarkup(
  title: string,
  subtitle: string,
  opts: { readonly disabled?: boolean } = {},
): string {
  const d = opts.disabled ? ' disabled' : '';
  return `
    <sd-page-header title="${esc(title)}" subtitle="${esc(subtitle)}">
      <sd-button slot="more" variant="quiet" icon label="More options"${d}><sd-icon name="more" /></sd-button>
      <sd-button slot="actions" variant="quiet"${d}><sd-icon name="calendar" />Add to calendar</sd-button>
      <sd-button slot="primary" variant="primary"${d}><sd-icon name="share" />Share</sd-button>
    </sd-page-header>`;
}
