// Shared runtime for docs/videos/NN-topic/slides.html decks.
// One <section> is visible at a time. Navigate with ?slide=N (1-based), #N,
// or the arrow keys / space. The video builder screenshots ?slide=N.
(function () {
  const body = document.body;
  const sections = Array.from(document.querySelectorAll('body > section'));
  const parts = (body.dataset.parts || '').split('|').filter(Boolean);

  // Build the 1920x1080 stage and move the slides into it.
  const stage = document.createElement('div');
  stage.className = 'stage';
  const chrome = document.createElement('header');
  chrome.className = 'chrome';
  chrome.innerHTML = '<span class="series"></span><span class="part"></span>';
  chrome.querySelector('.series').textContent = `Video ${body.dataset.videoNumber || ''} · ${body.dataset.videoTitle || document.title}`;
  const progress = document.createElement('div');
  progress.className = 'progress';
  parts.forEach(() => progress.appendChild(document.createElement('span')));
  stage.append(chrome, ...sections, progress);
  body.prepend(stage);

  // Progressive builds: <section data-template="id" data-show="3" | data-highlight="2-4">.
  sections.forEach((s) => {
    if (!s.dataset.template) return;
    const tpl = document.getElementById(s.dataset.template);
    if (!tpl) throw new Error(`slide #${s.id}: no <template id="${s.dataset.template}">`);
    s.appendChild(tpl.content.cloneNode(true));
    const items = Array.from(s.querySelectorAll('.item'));
    if (s.dataset.show) {
      const n = Number(s.dataset.show);
      items.forEach((el, i) => el.classList.toggle('pending', i >= n));
    }
    if (s.dataset.highlight) {
      const [a, b] = s.dataset.highlight.split('-').map(Number);
      items.forEach((el, i) => el.classList.toggle('dim', i + 1 < a || i + 1 > (b || a)));
    }
  });

  // Code blocks: wrap each line so data-mark="2,5" or "3-6" can highlight it.
  document.querySelectorAll('pre.code').forEach((pre) => {
    const marks = new Set();
    (pre.dataset.mark || '').split(',').filter(Boolean).forEach((r) => {
      const [a, b] = r.split('-').map(Number);
      for (let i = a; i <= (b || a); i++) marks.add(i);
    });
    const lines = pre.innerHTML.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
    pre.innerHTML = lines
      .map((l, i) => `<span class="line${marks.has(i + 1) ? ' mark' : ''}">${l || ' '}</span>`)
      .join('');
  });

  // ?render=1 (used by the video builder): the window is exactly 1920x1080, so never scale.
  // Headless Chrome can lay out a viewport shorter than the screenshot, so pin the page size too.
  const render = new URLSearchParams(location.search).has('render');
  if (render) document.documentElement.classList.add('render');
  function fit() {
    if (render) return;
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `translate(${(window.innerWidth - 1920 * scale) / 2}px, ${(window.innerHeight - 1080 * scale) / 2}px) scale(${scale})`;
  }

  let index = 0;
  function show(i) {
    index = Math.max(0, Math.min(sections.length - 1, i));
    sections.forEach((s, j) => s.classList.toggle('active', j === index));
    const part = Number(sections[index].dataset.part || 0);
    chrome.querySelector('.part').textContent = parts[part] || '';
    Array.from(progress.children).forEach((el, j) => {
      el.classList.toggle('done', j < part);
      el.classList.toggle('current', j === part);
    });
    body.classList.toggle('title-slide', index === 0);
    if (location.hash !== `#${index + 1}`) history.replaceState(null, '', `#${index + 1}`);
  }

  const fromUrl = Number(new URLSearchParams(location.search).get('slide')) || Number(location.hash.slice(1)) || 1;
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', () => show(Number(location.hash.slice(1)) - 1));
  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) show(index + 1);
    if (['ArrowLeft', 'PageUp'].includes(e.key)) show(index - 1);
  });
  fit();
  show(fromUrl - 1);
  body.dataset.ready = 'true';
})();
