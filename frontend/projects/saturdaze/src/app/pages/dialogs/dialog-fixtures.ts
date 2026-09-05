import type { BlockRow, EventSubmissionDto, FoodCard, SubmissionCard } from 'api';
import type { MenuItem } from 'components';

import type { ConfirmDialogData } from '../../dialogs/confirm-dialog/confirm-dialog';

/**
 * Sample data for the dialogs gallery — the same copy as
 * docs/mocks-v2/pages/dialogs.html so the visual baselines line up.
 */

const BASE_BLOCK: BlockRow = {
  id: 'b-lavender',
  day: 'Saturday',
  kind: 'Activity',
  refId: 'a-lavender',
  time: '11:00',
  timeRange: '11:00 to 1:00',
  duration: '2h',
  durationMinutes: 120,
  icon: 'tree',
  title: 'Terre Bleu Lavender Farm',
  subtitle: 'Terre Bleu, Milton · walk the rows',
  reason: 'Lavender peaks 17 to 24 May, Saturday is the sunny day, and Mae can walk the rows this year.',
  chips: [
    { tone: 'primary', label: 'Day highlight' },
    { tone: 'sky', icon: 'car', label: '45 min drive' },
  ],
  locked: false,
  commitment: false,
  errand: false,
  done: false,
  drive: false,
  highlight: true,
  swappable: true,
  lockable: true,
};

export const BLOCK: BlockRow = BASE_BLOCK;

export const BLOCK_LOCKED: BlockRow = {
  ...BASE_BLOCK,
  id: 'b-bath',
  refId: null,
  kind: 'Downtime',
  time: '20:00',
  timeRange: '8:00 to 9:00pm',
  duration: '60m',
  durationMinutes: 60,
  icon: 'bed',
  title: 'Bath and books',
  subtitle: 'Lights out at 9',
  reason: 'Lights out at 9 keeps Sunday morning easy. It has been in every weekend since April.',
  chips: [{ tone: 'accent', icon: 'lock', label: 'Locked' }],
  locked: true,
  highlight: false,
};

export const BLOCK_COMMITMENT: BlockRow = {
  ...BASE_BLOCK,
  id: 'b-swim',
  refId: 'c-swim',
  kind: 'Commitment',
  time: '9:00',
  timeRange: '9:00 to 10:00',
  duration: '60m',
  durationMinutes: 60,
  icon: 'bike',
  title: 'Swim lessons',
  subtitle: 'Port Credit Pool',
  reason: null,
  chips: [{ tone: 'accent', icon: 'lock', label: 'Commitment' }],
  commitment: true,
  highlight: false,
  swappable: false,
  lockable: false,
};

export const REGENERATE: ConfirmDialogData = {
  title: 'Regenerate the weekend?',
  body: 'Locked blocks stay where they are.',
  well: {
    icon: 'lock',
    tone: 'accent',
    title: 'Keeping',
    body: 'Swim 9:00 · Church 10:30 · Workout 5:00 · Bath and books 8:00',
  },
  confirmLabel: 'Regenerate',
  icon: 'refresh',
};

export const REGENERATE_DAY: ConfirmDialogData = {
  title: 'Regenerate Saturday?',
  body: 'Sunday will not change.',
  well: {
    icon: 'lock',
    tone: 'accent',
    title: 'Keeping on Saturday',
    body: 'Swim 9:00 · Workout 5:00 · Bath and books 8:00',
  },
  confirmLabel: 'Regenerate Saturday',
  icon: 'refresh',
};

export const REPEAT: ConfirmDialogData = {
  title: 'Use this weekend again?',
  body: 'It replaces the current draft. Saved weekends stay.',
  well: {
    icon: 'refresh',
    tone: 'warn',
    title: 'The lavender weekend draft goes away',
    body: 'Locks and family settings stay.',
  },
  confirmLabel: 'Replace draft',
  danger: true,
};

export const REMIX: ConfirmDialogData = {
  title: 'Remix this weekend?',
  body: 'Same shape, new places.',
  well: {
    icon: 'sparkle',
    title: 'What changes',
    body: 'The same rhythm with new picks. Commitments and locked blocks stay.',
  },
  confirmLabel: 'Remix',
  icon: 'sparkle',
};

export const REMOVE_MEMBER: ConfirmDialogData = {
  title: 'Remove Mae from the family?',
  body: 'Future weekends will not plan for her.',
  confirmLabel: 'Remove',
  danger: true,
  icon: 'trash',
};

export const REMOVE_COMMITMENT: ConfirmDialogData = {
  title: 'Remove Swim lessons?',
  body: 'Weekends stop planning around it.',
  confirmLabel: 'Remove',
  danger: true,
  icon: 'trash',
};

export const SIGN_OUT: ConfirmDialogData = {
  title: 'Sign out?',
  body: 'Your family and weekends stay saved.',
  cancelLabel: 'Stay signed in',
  confirmLabel: 'Sign out',
  danger: true,
  icon: 'sign_out',
};

export const SUBMISSION: EventSubmissionDto = {
  id: 's-buskerfest',
  title: 'Port Credit Buskerfest',
  startsAtLocal: '2026-06-20T14:00:00',
  endsAtLocal: '2026-06-20T21:00:00',
  location: 'Memorial Park, Lakeshore Rd',
  description: "Street performers along Lakeshore. The kids' zone runs 2 to 5, then it gets loud.",
  costNote: 'Free',
  ageRange: 'All ages',
  sourceUrl: 'https://example.com/port-credit-buskerfest-2026',
  status: 'Pending',
  submittedByUserId: 'u-quinn',
  submittedByEmail: 'quinntynebrown@gmail.com',
  submittedAtUtc: '2026-05-15T14:00:00Z',
  reviewedAtUtc: null,
  rejectionReason: null,
};

export const SUBMISSION_CARD: SubmissionCard = {
  id: SUBMISSION.id,
  state: 'pending',
  title: SUBMISSION.title,
  tile: { mon: 'Jun', day: '20' },
  when: 'Sat 20 Jun · 2:00 to 9:00pm',
  location: 'Memorial Park',
  cost: 'Free',
  ages: 'All ages',
  link: 'example.com/port-credit-buskerfest-2026',
  notes: SUBMISSION.description,
  submitter: { email: 'quinntynebrown@gmail.com', initial: 'Q', ago: '2 hours ago' },
  dto: SUBMISSION,
};

export const FOOD_CARD: FoodCard = {
  id: 'r-la-marina',
  name: 'La Marina',
  meta: 'Mediterranean · Patio · 6 min from Terre Bleu',
  chips: [
    { tone: 'accent', icon: 'heart', label: 'Wife-approved' },
    { tone: 'leaf', label: '3 of 4 yes' },
  ],
  votes: [],
  menuUrl: 'https://example.com/la-marina/menu',
  topPick: true,
  locked: false,
  lockedLabel: null,
  dimmed: false,
  votesDisabled: false,
};

export const MORE_ITEMS: readonly MenuItem[] = [
  { id: 'regenerate', label: 'Regenerate the weekend', icon: 'refresh', sub: 'Locked blocks stay where they are' },
  { id: 'calendar', label: 'Add to calendar', icon: 'calendar', sub: 'One .ics with both days' },
];

export const ACCOUNT_ITEMS: readonly MenuItem[] = [
  { id: 'family', label: 'Family settings', icon: 'user', href: '/family' },
  { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
];

export const MEMBER_NAMES = ['Quinn', 'Sara', 'Eli', 'Mae'];
export const LIKES = ['Parks', 'Short hikes', 'Zoo', 'Rec Room', 'Lavender', 'Live theatre'];
export const DISLIKES = ['Camping', 'Drives over 60 min'];
