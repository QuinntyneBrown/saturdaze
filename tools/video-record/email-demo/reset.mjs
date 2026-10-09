// Rebuilds the email template demo data from scratch: `saturdaze reset` on the demo database
// (the bundled seed plus a second administrator), then a morning of template work through the
// real admin API by two administrators, so every revision is genuine. record-clips.mjs runs it
// when SD_DEMO_RESET names it.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ADMIN, CURATOR, PASSWORD, API, call, connection, repo, save, setStatus, state, token } from './demo-env.mjs';

const seedDir = join(state, 'seed');
mkdirSync(seedDir, { recursive: true });
// The CLI copies every other bundled seed file into this folder; only the users differ.
writeFileSync(join(seedDir, 'users.json'), JSON.stringify([
  { email: ADMIN, password: PASSWORD, role: 'Admin', emailVerified: true, familyHomeLocation: 'Port Credit, Mississauga, ON' },
  { email: CURATOR, password: PASSWORD, role: 'Admin', emailVerified: true, familyHomeLocation: 'Port Credit, Mississauga, ON' },
], null, 2));

const cli = join(repo, 'backend', 'src', 'Saturdaze.Cli', 'bin', 'Debug', 'net10.0', 'saturdaze.dll');
if (!existsSync(cli)) throw new Error(`${cli} missing: run dotnet build backend/Saturdaze.sln first`);
try {
  execFileSync(process.env.DOTNET ?? 'dotnet', [cli, '--connection', connection(), '--seed-dir', seedDir, 'reset', '--yes'], {
    stdio: 'pipe',
  });
} catch (err) {
  // The CLI logs every SQL command; show them only when the reset fails.
  process.stderr.write(err.stdout ?? '');
  process.stderr.write(err.stderr ?? '');
  throw err;
}

// The reset dropped the database under the API's pooled connections; wait for a clean login.
let admin;
for (let i = 0; i < 10 && !admin; i++) {
  admin = await token(ADMIN).catch(() => null);
  if (!admin) await new Promise((done) => setTimeout(done, 1000));
}
if (!admin) throw new Error(`The API at ${API} does not answer; is it running against SaturdazeEmailDemo?`);
const jo = await token(CURATOR);
const create = (bearer, body) => call(bearer, 'POST', '/api/admin/email-templates', { description: '', ...body });

// A notification, written, revised by the second curator and activated.
const ready = await create(admin, {
  key: 'notify.weekend-ready', name: 'Weekend plan is ready', category: 'Notification',
  description: 'Sent on Thursday evening when the weekend plan is generated.',
});
await save(admin, ready.id, {
  subject: 'Your weekend plan is ready, {{recipientName}}',
  sampleData: { headline: 'Your weekend plan is ready', message: 'Saturday is the farmers market and a picnic at Jack Darling Park; Sunday stays easy.' },
});
await save(jo, ready.id, { preheader: 'Two days, planned around the forecast.' });
await setStatus(admin, ready.id, 'Active');

// A scheduled digest and a holiday greeting, still drafts.
await create(jo, {
  key: 'schedule.weekly-digest', name: 'Your weekly plan', category: 'Scheduled',
  description: 'Every Friday at 08:00: ideas for the weekend ahead.',
});
await create(jo, {
  key: 'occasion.holidays', name: 'Happy holidays', category: 'SpecialOccasion',
  description: 'December greeting with winter ideas.',
});

// A marketing email that ran and was retired.
const sale = await create(admin, {
  key: 'promo.spring-sale', name: 'Spring sale', category: 'Marketing',
  description: 'March campaign for the premium planner.',
});
await setStatus(admin, sale.id, 'Active');
await setStatus(admin, sale.id, 'Archived');

console.log(`email demo data staged (${(await call(admin, 'GET', '/api/admin/email-templates')).length} templates)`);

