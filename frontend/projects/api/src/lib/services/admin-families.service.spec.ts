import { AdminFamilyDto } from '../models/admin/admin-family.dto';
import {
  toChangeRow,
  toFamilyHeader,
  toFamilyRow,
  toPastRow,
  weekendSpan,
} from './admin-families.service';

// Traces to: L2-157 AC5, L2-159, L2-161 AC4
describe('admin families view mapping', () => {
  const family = (upcoming: AdminFamilyDto['upcoming']): AdminFamilyDto => ({
    id: 'f1',
    name: 'The Browns',
    homeLocation: 'Port Credit, Mississauga, ON',
    memberCount: 4,
    accounts: ['quinn@example.com', 'admin@saturdaze.ca'],
    ownerEmail: 'quinn@example.com',
    upcoming,
  });

  it('words a row with its members, accounts and the Upcoming chip', () => {
    const planned = toFamilyRow(
      family({
        id: 'w',
        weekendOf: '2026-05-16',
        title: null,
        blockCount: 14,
        lockedCount: 2,
        regenerateCount: 0,
      }),
    );
    expect(planned.meta).toBe('4 members · 2 accounts · Port Credit, Mississauga, ON');
    expect(planned.accounts).toBe('quinn@example.com · admin@saturdaze.ca');
    expect(planned.flags.map((c) => c.label)).toEqual(['Planned · 14 blocks', '2 locked']);
    expect(planned.href).toBe('/families/f1');

    const bare = toFamilyRow({
      ...family(null),
      homeLocation: '',
      memberCount: 1,
      accounts: ['a@b.c'],
    });
    expect(bare.meta).toBe('1 member · 1 account');
    expect(bare.flags.map((c) => c.label)).toEqual(['Not planned']);
  });

  it('spans a weekend across days and months', () => {
    expect(weekendSpan('2026-05-16')).toBe('16 – 17 May');
    expect(weekendSpan('2026-10-31')).toBe('31 Oct – 1 Nov');
    expect(
      toFamilyHeader({
        family: family(null),
        upcomingWeekendOf: '2026-05-16',
        members: [],
        commitments: [],
      }).meta,
    ).toBe('Port Credit, Mississauga, ON · 4 members · 2 accounts · Weekend of 16 – 17 May');
  });

  it('chips each change by action and keeps the server summary', () => {
    const row = toChangeRow({
      id: 'c',
      occurredAt: '2026-05-15T14:02:00+00:00',
      adminId: 'a',
      adminEmail: 'admin@saturdaze.ca',
      weekendId: 'w',
      weekendOf: '2026-05-16',
      action: 'swap',
      day: 'Saturday',
      blockId: 'b',
      before: '{"title":"Bronte Creek"}',
      after: '{"title":"Lavender fields"}',
      summary: 'Saturday · Bronte Creek → Lavender fields',
    });
    expect(row.time).toBe('15 May 2026, 2:02pm UTC');
    expect(row.action).toEqual({ tone: 'sky', label: 'Swap' });
    expect(row.summary).toBe('Saturday · Bronte Creek → Lavender fields');
  });

  it('titles a past weekend with its span, title, highlights and rating', () => {
    const row = toPastRow({
      id: 'p',
      weekendOf: '2026-05-09',
      isFavourite: true,
      regenerateCount: 1,
      blockCount: 12,
      activityHighlights: ['Bronte Creek Provincial Park', 'Rec Room Mississauga'],
      title: 'Bronte Creek + Rec Room',
      rating: 5,
      cover: null,
    });
    expect(row.title).toBe('9 – 10 May · Bronte Creek + Rec Room');
    expect(row.subtitle).toBe('Bronte Creek Provincial Park · Rec Room Mississauga · 5 of 5');
    expect(row.icon).toBe('star');
  });
});
