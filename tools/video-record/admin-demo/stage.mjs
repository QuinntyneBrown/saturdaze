// Stages the freshly seeded SaturdazeDemo database for the admin demo recordings (run by
// stage.ps1). Curated photos go through the real admin API, so their audit entries are
// genuine. Provider photos, weekend covers and an earlier ingestion run are inserted with
// SQL, because only a live ingestion run or a family's planning would create them.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { API, IMAGE_HOST, photos, sql, stageIngestionRun } from './demo-env.mjs';

const credits = JSON.parse(readFileSync(join(photos, 'credits.json'), 'utf8'));
const commons = (key) => `Photo · ${credits[key].artist}, Wikimedia Commons`;
const id = (table, name) => sql(`SELECT Id FROM ${table} WHERE Name LIKE N'${name}%'`).toLowerCase();
const A = (name) => id('Activities', name);
const R = (name) => id('Restaurants', name);
const E = (name) => id('LocalEvents', name);

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  return (await res.json()).token.accessToken;
}

async function upload(token, kind, placeId, key, alt, licence) {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(join(photos, `${key}.jpg`))], { type: 'image/jpeg' }), `${key}.jpg`);
  form.append('alt', alt);
  form.append('attribution', commons(key));
  form.append('licence', licence);
  const res = await fetch(`${API}/api/admin/places/${kind}/${placeId}/photos`, {
    method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form,
  });
  if (res.status !== 201) throw new Error(`upload ${key}: ${res.status} ${await res.text()}`);
}

/** A provider photo as ingestion stores it: unreviewed unless said otherwise. */
function provider(kind, placeId, key, { primary, reviewed = false, url, alt, attribution }) {
  const c = credits[key] ?? { width: 1600, height: 1067, artist: 'Unknown' };
  const kindNo = { Activity: 1, Restaurant: 2, LocalEvent: 3 }[kind];
  sql(`INSERT INTO PlacePhotos (Id, PlaceKind, PlaceId, Url, Width, Height, AltText, Attribution, Source, License, IsPrimary, AdminLocked, ReviewState)
       VALUES (NEWID(), ${kindNo}, '${placeId}', N'${url ?? `${IMAGE_HOST}/provider/${key}.jpg`}', ${c.width}, ${c.height},
               N'${alt}', N'${attribution ?? `Photo · ${c.artist} via provider feed`}', 2, N'Provider terms',
               ${primary ? 1 : 0}, 0, ${reviewed ? 2 : 1})`);
}

// A second administrator, so the activity log has two people to filter by.
const reg = await fetch(`${API}/api/auth/register`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'jo.curator@saturdaze.app', password: 'password123', familyName: 'Curators', homeLocation: 'Port Credit, Mississauga, ON' }),
});
if (!reg.ok && reg.status !== 409) throw new Error(`register: ${reg.status} ${await reg.text()}`);
sql(`UPDATE Users SET Role = 1, EmailVerifiedUtc = SYSDATETIMEOFFSET() WHERE Email = 'jo.curator@saturdaze.app'`);

const admin = await login('admin@saturdaze.app');
const jo = await login('jo.curator@saturdaze.app');

await upload(admin, 'Activity', A('Bronte Creek'), 'bronte-meadow', 'Wildflower meadow under a wide sky at Bronte Creek', 'CC0');
await upload(admin, 'Activity', A('Bronte Creek'), 'bronte-trail', 'Boardwalk trail through the trees', 'CC0');
await upload(jo, 'Activity', A('Bronte Creek'), 'bronte-shore', 'Creek bed and wooded shore in the park', 'Public domain');
await upload(admin, 'Activity', A('Royal Botanical'), 'rbg-garden', 'A broad leaf in the Royal Botanical Gardens', 'CC0');
await upload(jo, 'Activity', A('Living Arts'), 'lac', 'The Living Arts Centre beside Celebration Square', 'CC BY 4.0');
await upload(jo, 'Activity', A('Ontario Science'), 'science', '', 'CC0');
await upload(jo, 'LocalEvent', E('Port Credit Farmer'), 'aerial', 'Port Credit and the harbour from the air', 'CC BY-SA 4.0');
await upload(admin, 'LocalEvent', E('Terre Bleu'), 'lavender', 'Rows of lavender in full bloom', 'CC BY 2.0');

provider('Activity', A('Royal Botanical'), 'rbg-path', { primary: false, alt: 'Cactus spines in the desert collection' });
provider('Activity', A('Toronto Zoo'), 'zoo', { primary: true, alt: 'Toronto Zoo entrance' });
provider('Restaurant', R('Snug Harbour'), 'snug', { primary: true, alt: 'Snug Harbour on the water' });
provider('Restaurant', R('La Marina'), 'lighthouse', { primary: true, alt: 'Lighthouse at the harbour mouth' });
provider('Activity', A('Terre Bleu Lavender Farm'), 'lavender-field', {
  primary: true, reviewed: true, url: 'http://www.terrebleu.ca/images/lavender-field.jpg',
  alt: 'Lavender field', attribution: 'Photo · Terre Bleu',
});

// Weekends whose cover follows a place: the cover impact the dialogs state.
const family = sql(`SELECT TOP 1 FamilyId FROM Users WHERE Email = 'quinntynebrown@gmail.com'`);
const covers = [
  [1, A('Bronte Creek'), ['2026-07-25', '2026-08-08', '2026-08-22', '2026-09-05', '2026-09-19']],
  [2, R('Snug Harbour'), ['2026-08-01', '2026-08-29', '2026-09-26']],
];
for (const [kind, placeId, dates] of covers) {
  for (const date of dates) {
    sql(`INSERT INTO Weekends (Id, FamilyId, WeekendOf, IsFavourite, Notes, RegenerateCount, CoverSource, CoverPlaceKind, CoverPlaceId)
         VALUES (NEWID(), '${family}', '${date}', 0, N'', 0, 1, ${kind}, '${placeId}')`);
  }
}

stageIngestionRun({
  type: 'Activities',
  startedUtc: new Date('2026-10-02T08:00:12Z'),
  skips: [
    'Toronto Zoo: photo https://zoo-media.example.net/gate.jpg skipped, missing attribution or licence',
    'Harbourfront Splash Pad: photo https://cdn.example.org/splash-pad.jpg skipped, missing attribution or licence',
  ],
});

console.log(`staged ${sql('SELECT COUNT(*) FROM PlacePhotos')} photos`);
