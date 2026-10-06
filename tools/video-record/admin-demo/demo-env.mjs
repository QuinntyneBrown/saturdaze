// Shared settings for the Saturdaze Admin demo environment (see README.md).
// Everything it writes lives under .cache/admin-demo/, which is never committed.
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repo = resolve(here, '../../..');
export const state = join(repo, '.cache', 'admin-demo');
/** The stand-in provider CDN serves this folder at https://localhost:5443/. */
export const www = join(state, 'www');
export const photos = join(www, 'provider');
export const API = process.env.SD_API_URL ?? 'http://localhost:5100';
export const IMAGE_HOST = process.env.SD_DEMO_IMAGE_HOST ?? 'https://localhost:5443';
export const DATABASE = 'SaturdazeDemo';

/** The LocalDB named pipe (the (localdb) shortcut is unreliable on Windows, ADR-001). */
export function localDbPipe() {
  return execFileSync('sqllocaldb', ['info', 'MSSQLLocalDB']).toString().match(/pipe name:\s*(\S+)/)[1];
}

/** Runs T-SQL against the demo database and returns the output, trimmed. */
export function sql(query, database = DATABASE) {
  return execFileSync('sqlcmd', [
    '-S', localDbPipe(), '-d', database, '-E', '-C', '-N', 'o', '-I', '-b', '-W', '-h', '-1',
    '-Q', 'SET NOCOUNT ON; ' + query,
  ]).toString().trim();
}

/** Stages an ingestion run whose skip reasons read the way CatalogUpserter writes them. */
export function stageIngestionRun({ type, startedUtc = new Date(), skips }) {
  const types = { Events: 0, Activities: 1, Restaurants: 2 };
  const started = startedUtc.toISOString();
  const finished = new Date(startedUtc.getTime() + 190_000).toISOString();
  const reasons = skips.map((s) => `N'${s.replace(/'/g, "''")}'`).join(' + CHAR(10) + ');
  sql(`INSERT INTO IngestionRuns (Id, StartedUtc, FinishedUtc, Type, Status, ItemsConsidered, ItemsUpserted, ItemsRejected,
         InputTokens, OutputTokens, WebSearchCount, SkipReasons)
       VALUES (NEWID(), '${started}', '${finished}', ${types[type]}, 1, 9, 8, 0, 15400, 3600, 5, ${reasons})`);
}
