import { componentMarkup, dialogMarkup, iconNames } from './catalog-content.js';

const manifest = await fetch('/component-manifest.json').then(response => {
  if (!response.ok) throw new Error(`Unable to load component manifest (${response.status}).`);
  return response.json();
});

const main = document.querySelector('#main');
const navigation = document.querySelector('#docs-nav');
const menu = document.querySelector('#menu');
const navScrim = document.querySelector('#nav-scrim');
const search = document.querySelector('#search');
const searchResults = document.querySelector('#search-results');
const status = document.querySelector('#status');
const dialogHost = document.querySelector('#dialog-host');
let lastDialogOpener;
let statusTimer;

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const slugTitle = value => String(value)
  .split('-')
  .map(word => word ? word[0].toUpperCase() + word.slice(1) : '')
  .join(' ');

const announce = message => {
  status.textContent = message;
  status.classList.add('show');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => status.classList.remove('show'), 1800);
};

const routeLink = (href, label, className = '') => `<a href="${href}" data-route${className ? ` class="${className}"` : ''}>${label}</a>`;

const navGroup = (title, href, items) => `
  <div class="nav-group">
    <div class="nav-group-title">${routeLink(href, title)}<span>${items.length}</span></div>
    ${items.map(item => routeLink(item.href, escapeHtml(item.label))).join('')}
  </div>`;

function renderNavigation() {
  const componentItems = manifest.components.map(component => ({ label: component.name, href: `/components/${component.selector}/overview` }));
  const dialogItems = manifest.dialogs.map(dialog => ({ label: dialog.name, href: `/dialogs/${dialog.id}/overview` }));
  const patternItems = manifest.patterns.map(pattern => ({ label: pattern.name, href: `/patterns/${pattern.id}/overview` }));
  navigation.innerHTML = `
    ${routeLink('/', '<sd-icon name="home" size="16"></sd-icon> Overview', 'nav-home')}
    <div class="nav-group">
      <div class="nav-group-title">System</div>
      ${routeLink('/foundations', 'Foundations')}
    </div>
    ${navGroup('Components', '/components', componentItems)}
    ${navGroup('Dialogs', '/dialogs', dialogItems)}
    ${navGroup('Patterns', '/patterns', patternItems)}
  `;
  updateActiveNavigation();
}

function updateActiveNavigation() {
  const current = location.pathname.replace(/\/$/, '') || '/';
  navigation.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '') || '/';
    const exact = href === current;
    const sectionIndex = ['/components', '/dialogs', '/patterns', '/foundations'].includes(href) && current.startsWith(href);
    link.classList.toggle('active', exact || sectionIndex);
    if (exact) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

const searchIndex = [
  { label: 'Foundations', description: 'Color, type, space, shape, motion, and icons', type: 'System', href: '/foundations', icon: 'sparkle' },
  ...manifest.components.map(component => ({ label: component.name, description: `${component.selector} · ${component.description}`, type: 'Component', href: `/components/${component.selector}/overview`, icon: component.selector === 'sd-icon' ? 'star' : 'sparkle' })),
  ...manifest.dialogs.map(dialog => ({ label: dialog.name, description: `${dialog.scenarios.length} rendered scenario${dialog.scenarios.length === 1 ? '' : 's'} · ${dialog.description}`, type: 'Dialog', href: `/dialogs/${dialog.id}/overview`, icon: 'more' })),
  ...manifest.patterns.map(pattern => ({ label: pattern.name, description: `${pattern.scenarios.length} responsive state${pattern.scenarios.length === 1 ? '' : 's'} · ${pattern.description}`, type: 'Pattern', href: `/patterns/${pattern.id}/overview`, icon: 'map' })),
];

function renderSearchResults() {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    searchResults.hidden = true;
    search.setAttribute('aria-expanded', 'false');
    return;
  }
  const results = searchIndex.filter(item => `${item.label} ${item.description} ${item.type}`.toLowerCase().includes(query)).slice(0, 12);
  searchResults.innerHTML = results.length ? results.map((item, index) => `
    <a class="search-result" href="${item.href}" data-route role="option" id="search-result-${index}">
      <span class="result-icon"><sd-icon name="${item.icon}" size="16"></sd-icon></span>
      <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>
      <small>${item.type}</small>
    </a>`).join('') : '<div class="search-empty">No catalog entries match that search.</div>';
  searchResults.hidden = false;
  search.setAttribute('aria-expanded', 'true');
}

const breadcrumbs = items => `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((item, index) => `${index ? '<span aria-hidden="true">/</span>' : ''}${item.href ? routeLink(item.href, escapeHtml(item.label)) : `<span aria-current="page">${escapeHtml(item.label)}</span>`}`).join('')}</nav>`;

const detailHeader = ({ eyebrow, title, description, badge }) => `
  <div class="detail-header">
    <div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
    ${badge ? `<code class="selector-badge">${escapeHtml(badge)}</code>` : ''}
  </div>`;

const tabs = (base, active, names = ['overview', 'api', 'examples']) => `<nav class="page-tabs" aria-label="Page sections">${names.map(name => routeLink(`${base}/${name}`, slugTitle(name), name === active ? 'active' : '')).join('')}</nav>`;

const componentCard = component => `
  <article class="catalog-card" data-component-card="${component.selector}">
    <div class="card-preview">${componentMarkup(component)}</div>
    <a class="catalog-card-link" href="/components/${component.selector}/overview" data-route>
      <h3>${escapeHtml(component.name)}</h3>
      <p><code>&lt;${component.selector}&gt;</code></p>
      <p>${escapeHtml(component.description)}</p>
    </a>
  </article>`;

const previewUrl = (type, item, scenario) => `/preview.html?type=${encodeURIComponent(type)}&item=${encodeURIComponent(item)}&scenario=${encodeURIComponent(scenario)}`;

const patternCard = pattern => {
  const scenario = pattern.scenarios[0];
  return `<article class="catalog-card" data-pattern-card="${pattern.id}">
    <div class="card-preview"><iframe loading="lazy" title="${escapeHtml(pattern.name)} rendered preview" src="${previewUrl('pattern', pattern.id, scenario.id)}"></iframe></div>
    <a class="catalog-card-link" href="/patterns/${pattern.id}/overview" data-route><h3>${escapeHtml(pattern.name)}</h3><p>${pattern.scenarios.length} responsive state${pattern.scenarios.length === 1 ? '' : 's'}</p><p>${escapeHtml(pattern.description)}</p></a>
  </article>`;
};

const dialogCard = dialog => {
  const scenario = dialog.scenarios[0];
  return `<article class="catalog-card" data-dialog-card="${dialog.id}">
    <div class="card-preview">${dialogMarkup(dialog.id, scenario.id, { staticPreview: true })}</div>
    <a class="catalog-card-link" href="/dialogs/${dialog.id}/overview" data-route><h3>${escapeHtml(dialog.name)}</h3><p>${dialog.scenarios.length} rendered scenario${dialog.scenarios.length === 1 ? '' : 's'}</p><p>${escapeHtml(dialog.description)}</p></a>
  </article>`;
};

function renderHome() {
  const featuredComponents = ['sd-button', 'sd-dialog', 'sd-activity-card'].map(selector => manifest.components.find(component => component.selector === selector));
  main.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">FIRST-CLASS PRODUCT · v${escapeHtml(manifest.product.version)}</p>
      <h1>Warm, useful interfaces for weekends together.</h1>
      <p>The canonical foundations, live component APIs, complete dialogs, and responsive product patterns for Saturdaze.</p>
      <div class="hero-actions">${routeLink('/components', 'Explore components', 'doc-button primary')}${routeLink('/foundations', 'View foundations', 'doc-button')}</div>
    </section>
    <div class="metrics" aria-label="Catalog coverage">
      <div class="metric"><strong>${manifest.components.length}</strong><span>live components</span></div>
      <div class="metric"><strong>${manifest.dialogs.reduce((total, dialog) => total + dialog.scenarios.length, 0)}</strong><span>dialog scenarios</span></div>
      <div class="metric"><strong>${manifest.patterns.length}</strong><span>pattern families</span></div>
      <div class="metric"><strong>${manifest.patterns.reduce((total, pattern) => total + pattern.scenarios.length, 0)}</strong><span>responsive states</span></div>
    </div>
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">BUILDING BLOCKS</p><h2>Components you can inspect and tune</h2><p>Every public option is rendered, documented, and available in an interactive playground.</p></div>${routeLink('/components', 'All components →', 'doc-button')}</div>
      <div class="card-grid">${featuredComponents.map(componentCard).join('')}</div>
    </section>
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">COMPLETE FLOWS</p><h2>Patterns in their real context</h2><p>Responsive screens are isolated from the documentation shell and can be viewed at mobile, tablet, or desktop widths.</p></div>${routeLink('/patterns', 'All patterns →', 'doc-button')}</div>
      <div class="card-grid">${manifest.patterns.slice(0, 3).map(patternCard).join('')}</div>
    </section>
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">FOCUSED TASKS</p><h2>Dialogs, fully rendered</h2><p>Every confirmation, form, decision, and product-action variant is visible in the catalog.</p></div>${routeLink('/dialogs', 'All dialogs →', 'doc-button')}</div>
      <div class="card-grid">${manifest.dialogs.slice(0, 3).map(dialogCard).join('')}</div>
    </section>`;
  document.title = 'Saturdaze Design System';
}

function renderComponentsIndex() {
  main.innerHTML = `
    ${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Components' }])}
    ${detailHeader({ eyebrow: '29 NATIVE CUSTOM ELEMENTS', title: 'Components', description: 'Reusable Saturdaze building blocks with live variants, API contracts, accessibility notes, and copyable examples.' })}
    ${manifest.categories.map(category => {
      const entries = manifest.components.filter(component => component.category === category.id);
      return `<section class="category-section"><div class="category-title"><h2>${escapeHtml(category.label)}</h2><span>${escapeHtml(category.description)}</span></div><div class="card-grid">${entries.map(componentCard).join('')}</div></section>`;
    }).join('')}`;
  document.title = 'Components · Saturdaze Design System';
}

function renderApiTable(title, columns, rows, emptyMessage) {
  return `<section class="section-block"><div class="section-heading"><div><h2>${escapeHtml(title)}</h2></div></div><div class="api-table-wrap">${rows.length ? `<table class="api-table"><thead><tr>${columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>` : `<div class="empty-api">${escapeHtml(emptyMessage)}</div>`}</div></section>`;
}

const attributeRows = attributes => attributes.map(attribute => `<tr><td><code>${escapeHtml(attribute.name)}</code></td><td><span class="type-pill">${escapeHtml(attribute.type)}</span></td><td>${attribute.values ? attribute.values.map(value => `<code>${escapeHtml(value)}</code>`).join(', ') : '—'}</td><td><code>${escapeHtml(String(attribute.default ?? '—'))}</code></td><td>${escapeHtml(attribute.description)}</td></tr>`);
const contractRows = items => items.map(item => `<tr><td><code>${escapeHtml(item.name)}</code></td><td>${escapeHtml(item.description)}</td></tr>`);

function controlMarkup(attribute, initialValue) {
  const label = `<span><code>${escapeHtml(attribute.name)}</code></span>`;
  const initial = initialValue ?? attribute.default ?? '';
  if (attribute.type === 'boolean') return `<label class="control boolean">${label}<input type="checkbox" data-control="${attribute.name}" data-type="boolean"${initial ? ' checked' : ''}></label>`;
  if (attribute.type === 'enum' || attribute.type === 'icon') {
    const values = attribute.type === 'icon' ? iconNames : attribute.values;
    return `<label class="control">${label}<select data-control="${attribute.name}" data-type="${attribute.type}">${values.map(value => `<option value="${escapeHtml(value)}"${String(value) === String(initial) ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`;
  }
  return `<label class="control">${label}<input type="${attribute.type === 'number' ? 'number' : 'text'}" value="${escapeHtml(initial)}" data-control="${attribute.name}" data-type="${attribute.type}"></label>`;
}

function exampleElement(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function renderPlayground(component) {
  const markup = component.examples[0].markup;
  const element = exampleElement(markup);
  const controls = component.attributes.map(attribute => controlMarkup(attribute, attribute.type === 'boolean' ? element?.hasAttribute(attribute.name) : element?.getAttribute(attribute.name))).join('');
  return `<section class="playground" data-playground data-selector="${component.selector}" data-original="${escapeHtml(markup)}">
    <div class="playground-stage">
      <div class="showcase-head"><h2>Playground</h2><span class="type-pill">Live custom element</span></div>
      <div class="specimen" data-playground-preview>${markup}</div>
      ${renderCodePanel(markup, component)}
    </div>
    <aside class="playground-controls"><h2>Options</h2><p>Changes update the specimen and HTML immediately.</p>${controls || '<p>This component has no host attributes. Compose it through its documented slots.</p>'}<div class="control-actions"><button class="doc-button small" type="button" data-reset>Reset</button><a class="doc-button small ghost" href="/assets/components/${component.source}" target="_blank" rel="noreferrer">Source ↗</a></div></aside>
  </section>`;
}

function renderCodePanel(markup, component) {
  const css = `/* Components consume the shared Saturdaze design tokens. */\n${component.selector} {\n  color: var(--sd-ink);\n}`;
  const js = `import '/assets/components/${component.source}';\n\nconst element = document.querySelector('${component.selector}');`;
  return `<div class="code-panel" data-code-panel data-html="${escapeHtml(markup)}" data-css="${escapeHtml(css)}" data-js="${escapeHtml(js)}"><div class="code-tabs" role="tablist" aria-label="Example source"><button class="active" type="button" role="tab" aria-selected="true" data-code-tab="html">HTML</button><button type="button" role="tab" aria-selected="false" data-code-tab="css">CSS</button><button type="button" role="tab" aria-selected="false" data-code-tab="js">JavaScript</button><button class="copy-code" type="button" data-copy-code>Copy</button></div><pre><code>${escapeHtml(markup)}</code></pre></div>`;
}

function markupWithAttribute(markup, attribute, value) {
  const element = exampleElement(markup);
  if (!element) return markup;
  if (attribute.type === 'boolean') element.toggleAttribute(attribute.name, Boolean(value));
  else if (value === '' || value === attribute.default) element.removeAttribute(attribute.name);
  else element.setAttribute(attribute.name, value);
  if (element.localName === 'sd-dialog') {
    element.setAttribute('open', '');
    element.setAttribute('static', '');
  }
  return element.outerHTML;
}

function renderVariantMatrix(component) {
  if (component.selector === 'sd-icon') {
    return `<div class="icon-grid">${iconNames.map(name => `<div class="icon-card"><sd-icon name="${name}" size="25"></sd-icon><code>${name}</code></div>`).join('')}</div>`;
  }
  const variants = [];
  for (const attribute of component.attributes) {
    if (attribute.type === 'enum') {
      for (const value of attribute.values) variants.push({ label: `${attribute.name}: ${value}`, markup: markupWithAttribute(component.examples[0].markup, attribute, value) });
    } else if (attribute.type === 'boolean' && !['open', 'static'].includes(attribute.name)) {
      variants.push({ label: `${attribute.name}: false`, markup: markupWithAttribute(component.examples[0].markup, attribute, false) });
      variants.push({ label: `${attribute.name}: true`, markup: markupWithAttribute(component.examples[0].markup, attribute, true) });
    }
  }
  if (!variants.length) return `<div class="showcase"><div class="showcase-head"><h3>Canonical specimen</h3></div><div class="specimen">${component.examples[0].markup}</div></div>`;
  return `<div class="variant-grid">${variants.map(variant => `<article class="variant-card"><h3>${escapeHtml(variant.label)}</h3><div class="mini-specimen">${variant.markup}</div></article>`).join('')}</div>`;
}

function renderComponentDetail(component, activeTab) {
  const base = `/components/${component.selector}`;
  let body = '';
  if (activeTab === 'api') {
    body = `${renderApiTable('Attributes', ['Name', 'Type', 'Values', 'Default', 'Description'], attributeRows(component.attributes), 'This component has no public host attributes.')}${renderApiTable('Slots', ['Name', 'Description'], contractRows(component.slots), 'This component has no content slots.')}${renderApiTable('Events', ['Name', 'Description'], contractRows(component.events), 'This presentation component does not dispatch a custom event.')}
      <section class="section-block prose"><h2>Styling contract</h2><p>The component consumes the shared <code>--sd-*</code> design tokens and renders in an open shadow root. Override product tokens at a containing scope; do not reach into internal implementation classes.</p><p><a class="doc-button" href="/assets/components/${component.source}" target="_blank" rel="noreferrer">Open local source ↗</a></p></section>`;
  } else if (activeTab === 'examples') {
    body = `${renderPlayground(component)}<section class="section-block"><div class="section-heading"><div><h2>Rendered options</h2><p>Every enumerated and boolean presentation option is shown below.</p></div></div>${renderVariantMatrix(component)}</section>${component.examples.map(example => `<section class="showcase"><div class="showcase-head"><div><h3>${escapeHtml(example.title)}</h3><small>${escapeHtml(example.description)}</small></div></div><div class="specimen">${example.markup}</div>${renderCodePanel(example.markup, component)}</section>`).join('')}`;
  } else {
    body = `<div class="content-grid"><div class="prose"><h2>When to use</h2><p>${escapeHtml(component.description)} Use it when the same product meaning and interaction should remain consistent across screens.</p><h2>Composition</h2><p>Set behavior through the documented host attributes and provide content through slots. Keep product state in the consuming feature rather than inside this presentation component.</p><h2>Accessibility</h2><p>Preserve visible keyboard focus, concise labels, semantic order, and sufficient contrast. Icon-only actions require an explicit label; form fields require visible labels; status must never rely on color alone.</p><h2>Responsive behavior</h2><p>The component grows within its container and inherits responsive tokens. Test it with realistic long content rather than fixed placeholder widths.</p></div><aside class="guidance-card"><h3>Contract at a glance</h3><ul><li>${component.attributes.length} documented attribute${component.attributes.length === 1 ? '' : 's'}</li><li>${component.slots.length} content slot${component.slots.length === 1 ? '' : 's'}</li><li>${component.examples.length} curated example${component.examples.length === 1 ? '' : 's'}</li><li>Native custom element</li><li>Open shadow root</li></ul></aside></div><section class="section-block"><div class="section-heading"><div><h2>Canonical specimen</h2><p>${escapeHtml(component.examples[0].description)}</p></div>${routeLink(`${base}/examples`, 'Open playground →', 'doc-button')}</div><div class="showcase"><div class="specimen">${component.examples[0].markup}</div></div></section>`;
  }
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Components', href: '/components' }, { label: component.name }])}${detailHeader({ eyebrow: manifest.categories.find(category => category.id === component.category)?.label ?? 'Component', title: component.name, description: component.description, badge: `<${component.selector}>` })}${tabs(base, activeTab)}${body}`;
  document.title = `${component.name} · Saturdaze Design System`;
}

function renderDialogsIndex() {
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Dialogs' }])}${detailHeader({ eyebrow: '7 FAMILIES · 18 SCENARIOS', title: 'Dialogs', description: 'Every focused Saturdaze form, confirmation, and product action is rendered inline and can be launched as a working modal.' })}<section class="section-block"><div class="card-grid">${manifest.dialogs.map(dialogCard).join('')}</div></section>`;
  document.title = 'Dialogs · Saturdaze Design System';
}

function renderDialogExamples(dialog) {
  return `<div class="dialog-gallery">${dialog.scenarios.map(scenario => `<article class="dialog-example" id="${scenario.id}"><div class="dialog-example-head"><div><p class="eyebrow">${escapeHtml(dialog.name)}</p><h2>${escapeHtml(scenario.name)}</h2></div><button class="doc-button small primary" type="button" data-launch-dialog="${dialog.id}" data-scenario="${scenario.id}"><sd-icon name="arrow_right" size="14"></sd-icon> Launch live</button></div><div class="dialog-inline">${dialogMarkup(dialog.id, scenario.id, { staticPreview: true })}</div></article>`).join('')}</div>`;
}

function renderDialogDetail(dialog, activeTab) {
  const base = `/dialogs/${dialog.id}`;
  let body;
  if (activeTab === 'api') {
    const scenarioRows = dialog.scenarios.map(scenario => `<tr><td><code>${escapeHtml(scenario.id)}</code></td><td>${escapeHtml(scenario.name)}</td></tr>`);
    body = `${renderApiTable('Scenarios', ['Stable ID', 'Rendered composition'], scenarioRows, '')}${renderApiTable('Base component', ['Contract', 'Behavior'], [
      '<tr><td><code>open</code></td><td>Controls visibility and modal semantics.</td></tr>',
      '<tr><td><code>static</code></td><td>Renders the same dialog sheet inline for documentation.</td></tr>',
      '<tr><td><code>actions</code> slot</td><td>Contains the safe, primary, and destructive actions.</td></tr>',
    ], '')}`;
  } else if (activeTab === 'examples') {
    body = renderDialogExamples(dialog);
  } else {
    body = `<div class="content-grid"><div class="prose"><h2>Purpose</h2><p>${escapeHtml(dialog.description)} Each scenario uses the same dialog anatomy while keeping consequence, hierarchy, and recovery explicit.</p><h2>Interaction</h2><p>Opening moves focus into the dialog. Tab remains within the modal, Escape closes non-blocking dialogs, and closing restores focus to the opener. Inline specimens use the <code>static</code> option and do not take over the page.</p><h2>Content guidance</h2><p>Use a direct title, one sentence of context, and actions ordered from least to most consequential. Destructive actions use the danger treatment and name the consequence.</p></div><aside class="guidance-card"><h3>Family coverage</h3><ul><li>${dialog.scenarios.length} rendered scenario${dialog.scenarios.length === 1 ? '' : 's'}</li><li>Static and live presentation</li><li>Keyboard dismissal</li><li>Focus containment and return</li><li>Responsive bottom-sheet behavior</li></ul></aside></div><section class="section-block"><div class="section-heading"><div><h2>Rendered scenarios</h2><p>No scenario is represented by a text-only placeholder.</p></div>${routeLink(`${base}/examples`, 'View all examples →', 'doc-button')}</div>${renderDialogExamples({ ...dialog, scenarios: dialog.scenarios.slice(0, 1) })}</section>`;
  }
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Dialogs', href: '/dialogs' }, { label: dialog.name }])}${detailHeader({ eyebrow: `${dialog.scenarios.length} RENDERED SCENARIO${dialog.scenarios.length === 1 ? '' : 'S'}`, title: dialog.name, description: dialog.description, badge: 'sd-dialog' })}${tabs(base, activeTab)}${body}`;
  document.title = `${dialog.name} dialogs · Saturdaze Design System`;
}

function viewportControls() {
  return `<div class="viewport-controls" aria-label="Preview viewport"><button type="button" data-viewport="mobile" aria-label="Mobile viewport" title="Mobile viewport">390</button><button type="button" data-viewport="tablet" aria-label="Tablet viewport" title="Tablet viewport">820</button><button class="active" type="button" data-viewport="desktop" aria-label="Desktop viewport" title="Desktop viewport">Full</button></div>`;
}

function renderedPatternScenario(pattern, scenario, heading = 'h2') {
  return `<article class="pattern-card" id="${scenario.id}"><div class="pattern-card-head"><${heading}>${escapeHtml(scenario.name)}</${heading}>${viewportControls()}</div><div class="pattern-stage"><iframe class="pattern-frame" data-viewport="desktop" title="${escapeHtml(pattern.name)} — ${escapeHtml(scenario.name)}" src="${previewUrl('pattern', pattern.id, scenario.id)}"></iframe></div></article>`;
}

function renderPatternsIndex() {
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Patterns' }])}${detailHeader({ eyebrow: `8 FAMILIES · ${manifest.patterns.reduce((total, pattern) => total + pattern.scenarios.length, 0)} STATES`, title: 'Product patterns', description: 'Complete, responsive Saturdaze screens built from the canonical components and tokens in this standalone product.' })}<section class="section-block"><div class="card-grid">${manifest.patterns.map(patternCard).join('')}</div></section>`;
  document.title = 'Patterns · Saturdaze Design System';
}

function renderPatternDetail(pattern, activeTab) {
  const base = `/patterns/${pattern.id}`;
  let body;
  if (activeTab === 'examples') {
    body = `<div class="pattern-scenarios">${pattern.scenarios.map(scenario => renderedPatternScenario(pattern, scenario)).join('')}</div>`;
  } else {
    body = `<div class="content-grid"><div class="prose"><h2>Pattern intent</h2><p>${escapeHtml(pattern.description)} The composition demonstrates real content hierarchy, component relationships, loading or decision states, and breakpoint behavior.</p><h2>Responsive contract</h2><p>Mobile, tablet, and desktop controls change the iframe viewport itself, so media queries and fixed navigation behave exactly as they do in a deployed page.</p><h2>Implementation boundary</h2><p>The specimen is assembled entirely from assets inside this design-system folder. It is a reference composition, not a runtime import from the application.</p></div><aside class="guidance-card"><h3>States included</h3><ul>${pattern.scenarios.map(scenario => `<li>${escapeHtml(scenario.name)}</li>`).join('')}</ul></aside></div><section class="section-block"><div class="section-heading"><div><h2>Representative rendering</h2><p>${escapeHtml(pattern.scenarios[0].name)}</p></div>${routeLink(`${base}/examples`, `View all ${pattern.scenarios.length} states →`, 'doc-button')}</div>${renderedPatternScenario(pattern, pattern.scenarios[0], 'h3')}</section>`;
  }
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Patterns', href: '/patterns' }, { label: pattern.name }])}${detailHeader({ eyebrow: `${pattern.scenarios.length} RESPONSIVE STATE${pattern.scenarios.length === 1 ? '' : 'S'}`, title: pattern.name, description: pattern.description, badge: 'Product pattern' })}${tabs(base, activeTab, ['overview', 'examples'])}${body}`;
  document.title = `${pattern.name} · Saturdaze Design System`;
}

const colorTokens = [
  ['bg', 'Canvas'], ['bg-elev', 'Elevated canvas'], ['surface', 'Surface'], ['surface-2', 'Recessed surface'],
  ['ink', 'Primary ink'], ['ink-soft', 'Secondary ink'], ['ink-faint', 'Faint ink'], ['line-strong', 'Strong divider'],
  ['primary', 'Primary action'], ['primary-soft', 'Primary wash'], ['accent', 'Confirmed'], ['accent-soft', 'Confirmed wash'],
  ['warn', 'Warning'], ['warn-soft', 'Warning wash'], ['sun', 'Sun'], ['sky', 'Sky'], ['leaf', 'Leaf'], ['indoor', 'Indoor'],
];
const typeTokens = [['xxl', 'Weekend plans feel better together.'], ['xl', 'A useful Saturday'], ['lg', 'Plan section'], ['md', 'Component heading'], ['base', 'Comfortable body copy for product guidance.'], ['sm', 'Supporting context and metadata'], ['xs', 'COMPACT LABEL']];
const spacingTokens = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const radiusTokens = [['sm', '8px'], ['md', '12px'], ['lg', '16px'], ['xl', '22px'], ['pill', '999px']];

function renderFoundations() {
  main.innerHTML = `${breadcrumbs([{ label: 'Overview', href: '/' }, { label: 'Foundations' }])}${detailHeader({ eyebrow: 'DESIGN FOUNDATIONS', title: 'Foundations', description: 'The visual decisions underneath every component: color, typography, spacing, shape, elevation, motion, responsive breakpoints, and iconography.' })}
    <section class="foundation-section"><h2>Color</h2><p>Warm neutrals make the interface feel calm; coral identifies the primary next step; green confirms decisions without feeling clinical.</p><div class="token-grid">${colorTokens.map(([token, label]) => `<article class="token-card"><div class="token-swatch" style="background:var(--sd-${token})"></div><div class="token-info"><code>--sd-${token}</code><small>${label}</small></div></article>`).join('')}</div></section>
    <section class="foundation-section"><h2>Typography</h2><p>A compact scale keeps mobile planning comfortable while allowing confident editorial moments.</p><div class="type-scale">${typeTokens.map(([token, sample]) => `<div class="type-row"><code>--sd-fs-${token}</code><p style="font-size:var(--sd-fs-${token})">${sample}</p></div>`).join('')}</div></section>
    <section class="foundation-section"><h2>Spacing</h2><p>A four-pixel base creates predictable density from compact metadata through full page sections.</p><div class="scale-grid">${spacingTokens.map(token => `<article class="scale-card"><code>--sd-s-${token}</code><div class="measure" style="width:max(2px,var(--sd-s-${token}));height:12px"></div><small>${getComputedStyle(document.documentElement).getPropertyValue(`--sd-s-${token}`).trim()}</small></article>`).join('')}</div></section>
    <section class="foundation-section"><h2>Shape & elevation</h2><p>Soft radii and restrained shadows make surfaces approachable while preserving hierarchy.</p><div class="scale-grid">${radiusTokens.map(([token, value]) => `<article class="scale-card"><code>--sd-r-${token}</code><div class="measure" style="height:52px;width:76px;border-radius:var(--sd-r-${token})"></div><small>${value}</small></article>`).join('')}${[1,2,3].map(token => `<article class="scale-card" style="box-shadow:var(--sd-shadow-${token})"><code>--sd-shadow-${token}</code><div class="measure" style="height:36px;border-radius:12px;background:white"></div><small>Elevation ${token}</small></article>`).join('')}</div></section>
    <section class="foundation-section"><h2>Motion & breakpoints</h2><p>Motion is brief and useful. Layout changes at the two documented application breakpoints.</p><div class="scale-grid"><article class="scale-card"><code>--sd-dur-fast</code><div class="motion-demo" style="transition-duration:var(--sd-dur-fast)"></div><small>120ms · hover</small></article><article class="scale-card"><code>--sd-dur-base</code><div class="motion-demo"></div><small>220ms · state change</small></article><article class="scale-card"><code>--sd-bp-tablet</code><div class="measure" style="width:72%;height:18px"></div><small>720px</small></article><article class="scale-card"><code>--sd-bp-desktop</code><div class="measure" style="width:100%;height:18px"></div><small>1024px</small></article></div></section>
    <section class="foundation-section"><h2>Icons</h2><p>The complete dependency-free symbol set. Icons inherit color and remain decorative unless paired with a visible or accessible label.</p><div class="icon-grid">${iconNames.map(name => `<article class="icon-card"><sd-icon name="${name}" size="26"></sd-icon><code>${name}</code></article>`).join('')}</div></section>`;
  document.title = 'Foundations · Saturdaze Design System';
}

function renderNotFound() {
  main.innerHTML = `<div class="error-page"><p class="eyebrow">404 · NOT FOUND</p><h1>That page wandered off.</h1><p>The catalog entry may have moved or never existed.</p>${routeLink('/', 'Return to the design system', 'doc-button primary')}</div>`;
  document.title = 'Not found · Saturdaze Design System';
}

function normalizedRoute() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  return path === '/index.html' ? '/' : path;
}

function renderRoute({ focus = false } = {}) {
  closeNavigation();
  const path = normalizedRoute();
  const parts = path.split('/').filter(Boolean);
  if (path === '/') renderHome();
  else if (path === '/foundations') renderFoundations();
  else if (path === '/components') renderComponentsIndex();
  else if (parts[0] === 'components' && parts[1]) {
    const component = manifest.components.find(entry => entry.selector === parts[1]);
    const tab = ['overview', 'api', 'examples'].includes(parts[2]) ? parts[2] : 'overview';
    if (component) renderComponentDetail(component, tab); else renderNotFound();
  } else if (path === '/dialogs') renderDialogsIndex();
  else if (parts[0] === 'dialogs' && parts[1]) {
    const dialog = manifest.dialogs.find(entry => entry.id === parts[1]);
    const tab = ['overview', 'api', 'examples'].includes(parts[2]) ? parts[2] : 'overview';
    if (dialog) renderDialogDetail(dialog, tab); else renderNotFound();
  } else if (path === '/patterns') renderPatternsIndex();
  else if (parts[0] === 'patterns' && parts[1]) {
    const pattern = manifest.patterns.find(entry => entry.id === parts[1]);
    const tab = ['overview', 'examples'].includes(parts[2]) ? parts[2] : 'overview';
    if (pattern) renderPatternDetail(pattern, tab); else renderNotFound();
  } else renderNotFound();
  updateActiveNavigation();
  bindPlaygrounds();
  if (focus) {
    scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }
}

function navigate(href) {
  if (href === location.pathname) return;
  history.pushState({}, '', href);
  renderRoute({ focus: true });
}

function openNavigation() {
  document.body.classList.add('nav-armed');
  navigation.classList.add('open');
  navScrim.hidden = false;
  menu.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-label', 'Close documentation navigation');
  document.body.classList.add('nav-open');
}

function closeNavigation() {
  navigation.classList.remove('open');
  navScrim.hidden = true;
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open documentation navigation');
  document.body.classList.remove('nav-open');
}

function bindPlaygrounds() {
  document.querySelectorAll('[data-playground]').forEach(playground => {
    const preview = playground.querySelector('[data-playground-preview]');
    const original = playground.dataset.original;
    const codePanel = playground.querySelector('[data-code-panel]');
    const updateCode = () => {
      const markup = preview.innerHTML.trim();
      codePanel.dataset.html = markup;
      if (codePanel.querySelector('[data-code-tab="html"]').classList.contains('active')) codePanel.querySelector('code').textContent = markup;
    };
    playground.querySelectorAll('[data-control]').forEach(control => {
      control.dataset.initial = control.type === 'checkbox' ? String(control.checked) : control.value;
      control.addEventListener('input', () => {
        const element = preview.firstElementChild;
        if (!element) return;
        if (control.dataset.type === 'boolean') element.toggleAttribute(control.dataset.control, control.checked);
        else if (control.value === '') element.removeAttribute(control.dataset.control);
        else element.setAttribute(control.dataset.control, control.value);
        updateCode();
      });
    });
    playground.querySelector('[data-reset]')?.addEventListener('click', () => {
      preview.innerHTML = original;
      playground.querySelectorAll('[data-control]').forEach(control => {
        if (control.type === 'checkbox') control.checked = control.dataset.initial === 'true';
        else control.value = control.dataset.initial;
      });
      updateCode();
      announce('Playground reset');
    });
  });
}

function closeLiveDialog(message = 'Dialog closed') {
  dialogHost.replaceChildren();
  lastDialogOpener?.focus();
  lastDialogOpener = undefined;
  announce(message);
}

document.addEventListener('click', event => {
  const route = event.target.closest('a[data-route]');
  if (route && route.origin === location.origin) {
    event.preventDefault();
    search.value = '';
    renderSearchResults();
    navigate(route.pathname);
    return;
  }

  const launch = event.target.closest('[data-launch-dialog]');
  if (launch) {
    lastDialogOpener = launch;
    dialogHost.innerHTML = dialogMarkup(launch.dataset.launchDialog, launch.dataset.scenario, { staticPreview: false });
    requestAnimationFrame(() => dialogHost.querySelector('sd-dialog sd-button')?.shadowRoot?.querySelector('button')?.focus());
    announce('Dialog opened');
    return;
  }

  if (event.composedPath().some(node => node?.hasAttribute?.('data-dialog-close'))) {
    closeLiveDialog('Dialog cancelled');
    return;
  }
  if (event.composedPath().some(node => node?.hasAttribute?.('data-dialog-confirm'))) {
    closeLiveDialog('Action confirmed');
    return;
  }

  const viewport = event.target.closest('[data-viewport]');
  if (viewport) {
    const card = viewport.closest('.pattern-card');
    card.querySelectorAll('[data-viewport]').forEach(button => button.classList.toggle('active', button === viewport));
    card.querySelector('.pattern-frame').dataset.viewport = viewport.dataset.viewport;
    announce(`${slugTitle(viewport.dataset.viewport)} preview selected`);
    return;
  }

  const codeTab = event.target.closest('[data-code-tab]');
  if (codeTab) {
    const panel = codeTab.closest('[data-code-panel]');
    panel.querySelectorAll('[data-code-tab]').forEach(button => {
      const active = button === codeTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    panel.querySelector('code').textContent = panel.dataset[codeTab.dataset.codeTab];
    return;
  }

  const copyCode = event.target.closest('[data-copy-code]');
  if (copyCode) {
    const panel = copyCode.closest('[data-code-panel]');
    const active = panel.querySelector('[data-code-tab].active').dataset.codeTab;
    navigator.clipboard?.writeText(panel.dataset[active]);
    announce(`${active.toUpperCase()} copied`);
    return;
  }

  const copyLink = event.target.closest('[data-copy]');
  if (copyLink) {
    navigator.clipboard?.writeText(copyLink.closest('.copy-row')?.querySelector('code')?.textContent ?? '');
    announce('Link copied');
    return;
  }

  const path = event.composedPath();
  const specimenAnchor = path.find(node => node?.tagName === 'A' && node.closest?.('.specimen, .card-preview, .dialog-inline'));
  if (specimenAnchor) event.preventDefault();
  const vote = path.find(node => node?.localName === 'sd-vote-row');
  const voteButton = path.find(node => node?.tagName === 'BUTTON');
  if (vote && voteButton) {
    vote.setAttribute('vote', voteButton.classList.contains('up') ? 'up' : 'down');
    announce(voteButton.classList.contains('up') ? 'Voted yes' : 'Voted no');
  }
});

document.addEventListener('change', event => {
  if (event.target?.localName === 'sd-toggle') announce(event.target.hasAttribute('checked') ? 'Toggle on' : 'Toggle off');
});
document.addEventListener('sd-close', () => {
  if (dialogHost.children.length) closeLiveDialog();
});

menu.addEventListener('click', () => navigation.classList.contains('open') ? closeNavigation() : openNavigation());
navScrim.addEventListener('click', closeNavigation);
search.addEventListener('input', renderSearchResults);
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    search.value = '';
    renderSearchResults();
    search.blur();
  }
  if (event.key === 'Enter') searchResults.querySelector('a')?.click();
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-search')) {
    searchResults.hidden = true;
    search.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === 'Escape') {
    if (dialogHost.children.length) closeLiveDialog();
    if (navigation.classList.contains('open')) {
      closeNavigation();
      menu.focus();
    }
  }
});
addEventListener('popstate', () => renderRoute({ focus: true }));
matchMedia('(max-width: 860px)').addEventListener('change', () => {
  document.body.classList.remove('nav-armed');
  closeNavigation();
});

renderNavigation();
renderRoute();
document.documentElement.dataset.ready = 'true';
