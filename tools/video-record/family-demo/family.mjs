// The Rivera family, staged through the real API for the family member videos (20 to 23).
// Each video's clips/clips.mjs imports these helpers. Run with SD_DEMO_RESET so every
// recording starts from the bundled seed and the fixed demo emails are free (see README.md).
export const api = process.env.SD_API_URL ?? 'http://localhost:5100';
export const PASSWORD = 'lavender-weekend';

export const people = {
  alex: 'alex.rivera@example.com',
  jordan: 'jordan.rivera@example.com',
  rosa: 'rosa.rivera@example.com',
  theo: 'theo.rivera@example.com',
};

async function call(method, path, body, bearer) {
  const headers = { 'content-type': 'application/json' };
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  const res = await fetch(`${api}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function login(email) {
  const { token } = await call('POST', '/api/auth/login', { email, password: PASSWORD });
  return token.accessToken;
}

/** Alex registers The Riveras (and so owns it), with Alex and Eli on the profile. */
export async function createFamily(extra = []) {
  await call('POST', '/api/auth/register', {
    email: people.alex, password: PASSWORD, familyName: 'The Riveras', homeLocation: 'Port Credit, ON',
  });
  const owner = await login(people.alex);
  for (const member of [{ name: 'Alex', age: 39 }, { name: 'Eli', age: 9 }, ...extra])
    await call('POST', '/api/family/members', member, owner);
  return owner;
}

/** The owner invites a member; returns the invite (email, token, url). */
export async function invite(owner, name, age, email) {
  const { invite } = await call('POST', '/api/family/members', { name, age, email }, owner);
  return invite;
}

/** The invitee chooses a password (L2-127). */
export async function accept(token) {
  await call('POST', '/api/auth/accept-invitation', { token, password: PASSWORD });
}

/** The owner removes a member by name, as the D21 confirmation would (L2-128). */
export async function remove(owner, name) {
  const family = await call('GET', '/api/family', undefined, owner);
  const member = family.members.find((m) => m.name === name);
  await call('DELETE', `/api/family/members/${member.id}`, undefined, owner);
}
