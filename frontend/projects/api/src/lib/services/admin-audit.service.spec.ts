import { PhotoAuditEntryDto } from '../models/admin/photo-audit.dto';
import { changeText, fileName, toIngestionRunSkips, utcStamp } from './admin-audit.service';

// Traces to: L2-122 AC4, L2-120 AC5
describe('admin audit view mapping', () => {
  const entry = (
    action: PhotoAuditEntryDto['action'],
    before: object | null,
    after: object | null,
  ): PhotoAuditEntryDto => ({
    id: 'e',
    occurredAt: '2026-10-06T14:02:00+00:00',
    adminId: 'a',
    adminEmail: 'admin@saturdaze.app',
    kind: 'Activity',
    placeId: 'p',
    placeName: 'Port Credit Memorial Park',
    photoId: 'ph',
    action,
    before: before ? JSON.stringify(before) : null,
    after: after ? JSON.stringify(after) : null,
  });

  it('stamps the UTC time and names files without their path', () => {
    expect(utcStamp('2026-10-06T14:02:00+00:00')).toBe('2026-10-06 14:02 UTC');
    expect(fileName('https://images.example.com/a/memorial-park.jpg?x=1')).toBe(
      'memorial-park.jpg',
    );
    expect(fileName(null)).toBe('—');
  });

  it('words each action as the Activity log shows it', () => {
    expect(
      changeText(
        entry('upload', null, {
          url: 'https://x/memorial-park.jpg',
          bytes: 421888,
          width: 1200,
          height: 675,
        }),
      ),
    ).toBe('Added memorial-park.jpg · 1200 × 675 · 412 KB');
    expect(
      changeText(
        entry(
          'edit',
          { alt: '', attribution: 'Photo · Jo', licence: 'CC0' },
          { alt: 'Patio tables', attribution: 'Photo · Jo', licence: 'CC0' },
        ),
      ),
    ).toBe('Alt text: — → Patio tables');
    expect(
      changeText(
        entry(
          'primary',
          { primaryId: '1', url: 'https://x/memorial-park-side.jpg' },
          { primaryId: '2', url: 'https://x/memorial-park.jpg' },
        ),
      ),
    ).toBe('memorial-park-side.jpg → memorial-park.jpg');
    expect(
      changeText(entry('primary', null, { primaryId: '2', url: 'https://x/memorial-park.jpg' })),
    ).toBe('— → memorial-park.jpg');
    expect(
      changeText(
        entry(
          'remove',
          { url: 'https://x/rec-room-old.jpg', primary: true, nextPrimaryId: null },
          null,
        ),
      ),
    ).toBe('Removed rec-room-old.jpg · next primary: —');
    expect(
      changeText(
        entry(
          'review',
          { url: 'https://x/harbourfest-2024.jpg' },
          { decision: 'reject', reason: 'Wrong year' },
        ),
      ),
    ).toBe('Rejected harbourfest-2024.jpg · Wrong year');
  });

  it('links a skip to its place only when the run found one', () => {
    const view = toIngestionRunSkips({
      runId: 'r',
      startedUtc: '2026-10-06T04:12:00+00:00',
      type: 'Events',
      status: 'Succeeded',
      skips: [
        {
          placeName: 'Festival',
          url: 'https://x/a.jpg',
          reason: 'previously rejected',
          kind: 'LocalEvent',
          placeId: 'e1',
        },
        {
          placeName: 'Gym',
          url: 'https://x/b.jpg',
          reason: 'missing attribution or licence',
          kind: null,
          placeId: null,
        },
      ],
    });
    expect(view.meta).toBe('6 Oct 2026, 04:12 UTC · 2 photo skips');
    expect(view.status.label).toBe('Succeeded');
    expect(view.skips[0].placeHref).toBe('/places/LocalEvent/e1');
    expect(view.skips[1].placeHref).toBeNull();
  });
});
