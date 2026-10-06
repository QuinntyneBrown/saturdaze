// Restores the staged demo database and curated photo store (stage.ps1's snapshot), so every
// recording starts from the same data. record-clips.mjs runs it when SD_DEMO_RESET names it.
import { cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { API, sql, state } from './demo-env.mjs';

sql(`ALTER DATABASE SaturdazeDemo SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
     RESTORE DATABASE SaturdazeDemo FROM DISK='${join(state, 'staged.bak')}' WITH REPLACE;
     ALTER DATABASE SaturdazeDemo SET MULTI_USER;`, 'master');
rmSync(join(state, 'catalog-photos'), { recursive: true, force: true });
cpSync(join(state, 'catalog-photos.staged'), join(state, 'catalog-photos'), { recursive: true });

// The restore killed the API's pooled connections; let it reconnect before a clip starts.
for (let i = 0; i < 5; i++) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@saturdaze.app', password: 'password123' }),
  }).catch(() => null);
  if (res?.ok) break;
  await new Promise((done) => setTimeout(done, 1000));
}
console.log('demo data restored');
