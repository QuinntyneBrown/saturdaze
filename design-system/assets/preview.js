import { componentMarkup, dialogMarkup, patternMarkup } from './catalog-content.js';

const manifest = await fetch('/component-manifest.json').then(response => {
  if (!response.ok) throw new Error(`Unable to load component manifest (${response.status}).`);
  return response.json();
});

const params = new URLSearchParams(location.search);
const type = params.get('type') ?? 'pattern';
const item = params.get('item') ?? '';
const scenario = params.get('scenario') ?? '';
const root = document.querySelector('#preview');
root.dataset.type = type;

if (type === 'component') {
  const component = manifest.components.find(entry => entry.selector === item);
  root.innerHTML = componentMarkup(component);
  document.title = `${component?.name ?? 'Component'} specimen · Saturdaze`;
} else if (type === 'dialog') {
  root.innerHTML = dialogMarkup(item, scenario, { staticPreview: true });
  document.title = `${scenario || 'Dialog'} specimen · Saturdaze`;
} else {
  root.innerHTML = patternMarkup(item, scenario);
  const pattern = manifest.patterns.find(entry => entry.id === item);
  document.title = `${pattern?.name ?? 'Pattern'} specimen · Saturdaze`;
}

document.addEventListener('click', event => {
  const path = event.composedPath();
  const anchor = path.find(node => node?.tagName === 'A');
  if (anchor) event.preventDefault();
  const vote = path.find(node => node?.localName === 'sd-vote-row');
  const voteButton = path.find(node => node?.tagName === 'BUTTON');
  if (vote && voteButton) vote.setAttribute('vote', voteButton.classList.contains('up') ? 'up' : 'down');
});
