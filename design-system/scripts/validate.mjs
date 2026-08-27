import { access, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const componentDirectory = new URL('assets/components/', root);
const failures = [];
const fail = message => failures.push(message);
const read = path => readFile(new URL(path, root), 'utf8');
const exists = async url => {
  try { await access(url); return true; } catch { return false; }
};

const manifest = JSON.parse(await read('component-manifest.json'));
const packageJson = JSON.parse(await read('package.json'));
const registry = await read('assets/components.js');
const docs = await read('assets/docs.js');
const catalogContent = await read('assets/catalog-content.js');

if (manifest.schemaVersion !== 3) fail('component-manifest.json must use schemaVersion 3.');
if (manifest.product?.version !== packageJson.version) fail('Manifest and package versions must match.');
if (manifest.components?.length !== 29) fail(`Expected 29 components, found ${manifest.components?.length ?? 0}.`);
if (manifest.dialogs?.length !== 7) fail(`Expected 7 dialog families, found ${manifest.dialogs?.length ?? 0}.`);
if (manifest.patterns?.length !== 8) fail(`Expected 8 product-pattern families, found ${manifest.patterns?.length ?? 0}.`);

const dialogScenarioCount = manifest.dialogs.reduce((total, dialog) => total + dialog.scenarios.length, 0);
const patternScenarioCount = manifest.patterns.reduce((total, pattern) => total + pattern.scenarios.length, 0);
if (dialogScenarioCount !== 18) fail(`Expected 18 dialog scenarios, found ${dialogScenarioCount}.`);
if (patternScenarioCount !== 40) fail(`Expected 40 product-pattern states, found ${patternScenarioCount}.`);

const selectors = manifest.components.map(component => component.selector);
if (new Set(selectors).size !== selectors.length) fail('Component selectors must be unique.');
const categories = new Set(manifest.categories.map(category => category.id));
const scenarioIds = (families, type) => {
  for (const family of families) {
    if (!family.id || !family.name || !family.description) fail(`${type} family metadata is incomplete.`);
    const ids = family.scenarios.map(scenario => scenario.id);
    if (new Set(ids).size !== ids.length) fail(`${type} ${family.id} has duplicate scenario IDs.`);
    for (const scenario of family.scenarios) {
      if (!scenario.id || !scenario.name) fail(`${type} ${family.id} has incomplete scenario metadata.`);
    }
  }
};
scenarioIds(manifest.dialogs, 'Dialog');
scenarioIds(manifest.patterns, 'Pattern');

const componentsBySource = new Map();
for (const component of manifest.components) {
  if (!/^sd-[a-z0-9-]+$/.test(component.selector)) fail(`Invalid selector: ${component.selector}`);
  if (!categories.has(component.category)) fail(`Invalid category for ${component.selector}: ${component.category}`);
  if (!/^sd-[a-z0-9-]+\.js$/.test(component.source)) fail(`Invalid source for ${component.selector}: ${component.source}`);
  if (!await exists(new URL(component.source, componentDirectory))) fail(`Missing source for ${component.selector}: ${component.source}`);
  if (!component.name || !component.description) fail(`Missing name or description for ${component.selector}.`);
  for (const key of ['attributes', 'slots', 'events', 'examples']) {
    if (!Array.isArray(component[key])) fail(`${component.selector} must define ${key}.`);
  }
  if (!component.examples?.length) fail(`${component.selector} needs at least one rendered example.`);
  for (const example of component.examples ?? []) {
    if (!example.id || !example.title || !example.description || !example.markup?.includes(`<${component.selector}`)) {
      fail(`${component.selector} has incomplete or invalid example metadata.`);
    }
  }
  const attributeNames = component.attributes.map(attribute => attribute.name);
  if (new Set(attributeNames).size !== attributeNames.length) fail(`${component.selector} has duplicate attributes.`);
  for (const attribute of component.attributes) {
    if (!attribute.type || !attribute.description || !('default' in attribute)) fail(`${component.selector}.${attribute.name} has incomplete API metadata.`);
    if (attribute.type === 'enum' && !attribute.values?.length) fail(`${component.selector}.${attribute.name} must define enum values.`);
  }
  const group = componentsBySource.get(component.source) ?? [];
  group.push(component);
  componentsBySource.set(component.source, group);
}

for (const [source, components] of componentsBySource) {
  const contents = await readFile(new URL(source, componentDirectory), 'utf8');
  const observed = [...contents.matchAll(/observedAttributes\(\)\s*\{[\s\S]*?return\s*\[([^\]]*)\]/g)]
    .flatMap(match => [...match[1].matchAll(/["']([^"']+)["']/g)].map(value => value[1]));
  const documented = new Set(components.flatMap(component => component.attributes.map(attribute => attribute.name)));
  for (const attribute of observed) {
    if (!documented.has(attribute)) fail(`${source} observes undocumented attribute: ${attribute}.`);
  }
}

const manifestSources = new Set(manifest.components.map(component => component.source));
const registrySources = new Set([...registry.matchAll(/['"]\.\/components\/(sd-[a-z0-9-]+\.js)['"]/g)].map(match => match[1]));
for (const source of manifestSources) if (!registrySources.has(source)) fail(`Component registry does not import ${source}.`);
for (const source of registrySources) if (!manifestSources.has(source)) fail(`Component registry imports unmanifested source ${source}.`);

for (const required of ['renderPlayground', 'renderVariantMatrix', 'renderDialogExamples', 'renderedPatternScenario', 'renderFoundations']) {
  if (!docs.includes(required)) fail(`Documentation application is missing ${required}.`);
}
for (const required of ['dialogMarkup', 'patternMarkup', 'componentMarkup']) {
  if (!catalogContent.includes(`function ${required}`)) fail(`Catalog content is missing ${required}.`);
}

const requiredScripts = ['start', 'build', 'preview', 'serve:test', 'validate', 'test:browser', 'test'];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) fail(`Missing package script: ${script}`);
  if (packageJson.scripts?.[script]?.includes('..')) fail(`Package script escapes the design-system folder: ${script}`);
}

const ignoredDirectories = new Set(['node_modules', 'dist', 'test-results', 'playwright-report', 'blob-report', '.playwright-cli', '.run']);
const files = [];
const walk = async (directory, relative = '') => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    const childRelative = `${relative}${entry.name}${entry.isDirectory() ? '/' : ''}`;
    if (entry.isDirectory()) await walk(childUrl, childRelative);
    else files.push({ url: childUrl, relative: childRelative });
  }
};
await walk(root);

const forbiddenReferences = [
  ['docs', 'mocks'].join('/'),
  ['..', 'design-system'].join('/'),
  ['..', 'frontend'].join('/'),
  ['frontend', 'projects'].join('/'),
];
let tokenDeclarationFiles = 0;
for (const file of files) {
  if (!/\.(?:css|html|js|mjs|json|md)$/.test(file.relative)) continue;
  const contents = await readFile(file.url, 'utf8');
  const normalized = contents.replaceAll('\\', '/');
  for (const reference of forbiddenReferences) {
    if (normalized.includes(reference)) fail(`${file.relative} contains forbidden external reference: ${reference}`);
  }
  if (/--sd-bg\s*:/.test(contents)) tokenDeclarationFiles += 1;
  if (/\.(?:js|mjs)$/.test(file.relative)) {
    for (const match of contents.matchAll(/(?:from\s+|import\s*)['"](\.\.?\/[^'"]+)['"]/g)) {
      const resolved = new URL(match[1], file.url);
      if (!fileURLToPath(resolved).startsWith(fileURLToPath(root))) fail(`${file.relative} imports outside the design-system folder: ${match[1]}`);
    }
  }
}
if (tokenDeclarationFiles !== 1) fail(`Expected one token declaration file, found ${tokenDeclarationFiles}.`);

for (const page of ['index.html', 'preview.html']) {
  const html = await read(page);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (reference.startsWith('#') || /^(?:https?:|data:)/.test(reference)) continue;
    const local = reference.startsWith('/') ? reference.slice(1) : reference;
    const target = new URL(local, root);
    if (!fileURLToPath(target).startsWith(fileURLToPath(root))) fail(`${page} reference escapes the folder: ${reference}`);
    else if (!await exists(target)) fail(`${page} references missing file: ${reference}`);
  }
}

if (failures.length) {
  console.error(failures.map(message => `- ${message}`).join('\n'));
  process.exit(1);
}

console.log(`Validated standalone schema v3: ${selectors.length} components, ${dialogScenarioCount} dialog scenarios, ${patternScenarioCount} responsive pattern states, and local-only assets.`);
