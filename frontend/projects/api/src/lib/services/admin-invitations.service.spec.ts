import { PlatformInvitationDto, ProspectDto } from '../models/admin';
import {
  daysUntil,
  formatSaturday,
  toInvitationRow,
  toProspectRow,
} from './admin-invitations.service';

// Traces to: L2-157 AC9, L2-158 AC1, L2-159 AC5
describe('admin invitation view mapping', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const base: PlatformInvitationDto = {
    id: 'inv-1',
    email: 'ana@example.com',
    status: 'Pending',
    sampleWeekend: null,
    invitedByEmail: 'admin@saturdaze.ca',
    message: null,
    createdAtUtc: '2026-10-20T10:00:00Z',
    expiresAtUtc: '2026-11-03T10:00:00Z',
    acceptedAtUtc: null,
    url: null,
  };

  it('reads a pending invite as sent, with the days it has left', () => {
    const row = toInvitationRow(base, now);
    expect(row.status.label).toBe('Invite sent');
    expect(row.sample).toBe('No sample weekend');
    expect(row.meta).toBe('Invited by admin@saturdaze.ca · 2 hours ago · Expires in 14 days');
    expect(row.canRevoke).toBe(true);
  });

  it('names the sample weekend and its Saturday', () => {
    const row = toInvitationRow(
      {
        ...base,
        sampleWeekend: { prospectId: 'p', familyName: 'The Riveras', weekendOf: '2026-10-24' },
      },
      now,
    );
    expect(row.sample).toBe('Sample weekend · The Riveras · Sat 24 Oct');
  });

  it('maps the other statuses to their chips without a revoke action', () => {
    expect(
      toInvitationRow({ ...base, status: 'Accepted', acceptedAtUtc: '2026-10-20T11:00:00Z' }, now),
    ).toMatchObject({
      status: { label: 'Accepted', tone: 'accent' },
      canRevoke: false,
    });
    expect(toInvitationRow({ ...base, status: 'Revoked' }, now).status.label).toBe('Revoked');
    expect(toInvitationRow({ ...base, status: 'Expired' }, now).status).toEqual({
      tone: 'warn',
      label: 'Expired',
    });
  });

  it('never counts negative days', () => {
    expect(daysUntil('2026-10-19T10:00:00Z', now)).toBe(0);
    expect(formatSaturday('2026-10-24')).toBe('Sat 24 Oct');
  });

  it('describes a prospect row with its dates, members and home', () => {
    const dto: ProspectDto = {
      id: 'p-1',
      familyName: 'The Riveras',
      homeLocation: 'Port Credit, Mississauga, ON',
      members: [
        { name: 'Dani', age: 38 },
        { name: 'Mateo', age: 7 },
      ],
      likes: ['parks'],
      weekendOf: '2026-10-24',
      weekendId: 'w-1',
      status: 'Invited',
      createdAtUtc: '2026-10-20T10:00:00Z',
      invitationCount: 2,
      weekend: null,
    };
    const row = toProspectRow(dto);
    expect(row.meta).toBe('Sat 24 Oct – Sun 25 Oct · Dani 38, Mateo 7 · Port Credit');
    expect(row.status.label).toBe('Invited · 2');
    expect(row.href).toBe('/invitations/samples/p-1');
    expect(row.optionLabel).toBe('The Riveras · Sat 24 Oct');
    expect(toProspectRow({ ...dto, status: 'Draft', invitationCount: 0 }).status.label).toBe(
      'Draft',
    );
    expect(toProspectRow({ ...dto, status: 'Claimed' }).status.label).toBe('Claimed');
  });
});
