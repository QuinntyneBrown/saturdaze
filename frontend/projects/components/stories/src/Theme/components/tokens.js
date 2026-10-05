/**
 * Reads the token vocabulary straight from `_tokens.scss` so the Theme pages
 * can never drift from the stylesheet the components consume. The `?raw`
 * import is resolved by the `asset/source` rule in `.storybook/main.ts`.
 */
import tokensScss from '../../../../src/lib/styles/_tokens.scss?raw';

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Each `--sd-*` declaration inside one `{ … }` body, in source order. */
function declarations(body) {
  const out = [];
  const re = /(--sd-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body))) out.push({ name: m[1], value: m[2].replace(/\s+/g, ' ').trim() });
  return out;
}

/** The comment that sits on the same line as a declaration, used as its note. */
function notes(source) {
  const map = {};
  for (const line of source.split('\n')) {
    const m = /(--sd-[a-z0-9-]+)\s*:[^;]*;\s*\/\/\s*(.+)$/.exec(line);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

const clean = stripComments(tokensScss);
const rootMatch = /:root\s*\{([\s\S]*?)\n\}/.exec(clean);
const noteMap = notes(tokensScss);

/** Every default token: `{ name, value, note }`. */
export const tokens = declarations(rootMatch ? rootMatch[1] : '').map((t) => ({ ...t, note: noteMap[t.name] ?? '' }));

/** Responsive retunes: `[{ query, tokens: [{ name, value }] }]`. */
export const overrides = [];
{
  const re = /@media\s*([^{]+)\{\s*:root\s*\{([\s\S]*?)\}\s*\}/g;
  let m;
  while ((m = re.exec(clean))) overrides.push({ query: m[1].trim(), tokens: declarations(m[2]) });
}

export function byPrefix(...prefixes) {
  return tokens.filter((t) => prefixes.some((p) => t.name.startsWith(p)));
}

export function overridesFor(name) {
  return overrides.flatMap((o) => o.tokens.filter((t) => t.name === name).map((t) => ({ query: o.query, value: t.value })));
}
