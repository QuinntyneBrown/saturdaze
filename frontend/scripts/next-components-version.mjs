// Release versioning for the published components library (ADR-016):
// works out whether `@saturdaze/components` needs a new npm release and which
// version it gets, from the conventional-commit messages of the commits that
// touched the library since the last `components-v*` tag.
//
//   feat!: / fix(scope)!: / a `BREAKING CHANGE:` footer   → major
//   feat: / feat(scope):                                  → minor
//   anything else                                         → patch
//   no library commits since the last release             → no release
//
// The version is never committed: the source package.json stays at 0.0.0 and
// CI stamps the result into dist/components/package.json before publishing.
// The base is the highest of the last tag, the version on npm and the source
// package.json, so a run after a publish whose tag push failed still moves on.
//
// Usage (from frontend/):  npm run release:components:version
// Read-only; in GitHub Actions it also writes `release` and `version` to
// $GITHUB_OUTPUT.
import { execFileSync, execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG_PREFIX = 'components-v';
const FIRST_VERSION = '0.1.0';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const library = resolve(frontend, 'projects/components');
// What ends up in the tarball; stories, Storybook config and specs do not.
const libraryPaths = ['src', 'package.json', 'ng-package.json', 'README.md'].map((path) =>
  resolve(library, path),
);

const { name, version: sourceVersion } = JSON.parse(
  readFileSync(resolve(library, 'package.json'), 'utf8'),
);

const git = (...args) => execFileSync('git', args, { cwd: frontend, encoding: 'utf8' }).trim();

const parse = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
  return match ? match.slice(1).map(Number) : null;
};
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const highest = (versions) => versions.filter(Boolean).sort(compare).at(-1) ?? null;
const format = (version) => version.join('.');

function publishedVersion() {
  try {
    return execSync(`npm view ${name} version`, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    if (/E404/.test(String(error.stderr))) return null; // never published
    throw error;
  }
}

function bumpFor(messages) {
  let bump = 'patch';
  for (const message of messages) {
    const [subject] = message.split('\n');
    const header = /^(\w+)(?:\([^)]*\))?(!)?:\s/.exec(subject);
    if (header?.[2] || /^BREAKING[ -]CHANGE:/m.test(message)) return 'major';
    if (header?.[1] === 'feat') bump = 'minor';
  }
  return bump;
}

function next([major, minor, patch], bump) {
  if (bump === 'major') return [major + 1, 0, 0];
  if (bump === 'minor') return [major, minor + 1, 0];
  return [major, minor, patch + 1];
}

const lastTag = highest(
  git('tag', '--list', `${TAG_PREFIX}*`)
    .split('\n')
    .map((tag) => parse(tag.slice(TAG_PREFIX.length))),
);
const published = parse(publishedVersion());
const base = highest([lastTag, published, parse(sourceVersion)]);

let release;
let version;
let reason;
if (!published) {
  release = true;
  version = format(highest([base, parse(FIRST_VERSION)]));
  reason = `${name} is not on npm yet`;
} else {
  const range = lastTag ? [`${TAG_PREFIX}${format(lastTag)}..HEAD`] : ['HEAD'];
  const messages = git('log', '--no-merges', '--format=%B%x00', ...range, '--', ...libraryPaths)
    .split('\0')
    .map((message) => message.trim())
    .filter(Boolean);
  release = messages.length > 0;
  const bump = bumpFor(messages);
  version = release ? format(next(base, bump)) : format(base);
  reason = release
    ? `${messages.length} library commit(s) since ${lastTag ? format(lastTag) : 'the start'} → ${bump}`
    : `no library commits since ${format(lastTag ?? base)}`;
}

console.log(`${name}: ${release ? `release ${version}` : 'nothing to release'} (${reason})`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `release=${release}\nversion=${version}\n`);
}
