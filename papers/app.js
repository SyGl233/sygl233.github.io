(() => {
  const state = { papers: [], query: '', tag: '全部', slug: null, tab: 'summary' };
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => ({
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>',
  }[name] || '');

  const normalize = (s) => String(s ?? '').toLowerCase();
  const currentPaper = () => state.papers.find((p) => p.slug === state.slug) || state.papers[0];

  function readHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!raw) return;
    const [slug, tab] = raw.split('/');
    if (state.papers.some((p) => p.slug === slug)) {
      state.slug = slug;
      state.tab = ['summary', 'transcript', 'pdf'].includes(tab) ? tab : 'summary';
    }
  }

  function writeHash() {
    const next = `#${state.slug}${state.tab === 'summary' ? '' : '/' + state.tab}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  }

  function filtered() {
    const q = normalize(state.query).trim();
    return state.papers.filter((p) => {
      const tagOk = state.tag === '全部' || p.tags.includes(state.tag);
      if (!tagOk) return false;
      if (!q) return true;
      return normalize([p.title, p.authors, p.venue, p.year, p.abstract, ...p.tags].join(' ')).includes(q);
    });
  }

  function renderTags() {
    const tags = ['全部', ...Array.from(new Set(state.papers.flatMap((p) => p.tags)))];
    $('#tagFilter').innerHTML = tags.map((t) => `<button type="button" data-tag="${esc(t)}" class="${t === state.tag ? 'active' : ''}">${esc(t)}</button>`).join('');
  }

  function renderList() {
    const list = filtered();
    $('#paperCount').textContent = state.papers.length;
    $('#resultCount').textContent = `${list.length} 篇`;
    $('#emptyList').hidden = list.length > 0;
    if (!list.some((p) => p.slug === state.slug) && list[0]) {
      state.slug = list[0].slug;
      state.tab = 'summary';
      writeHash();
    }
    $('#paperList').innerHTML = list.map((p, i) => `
      <li>
        <button type="button" data-slug="${esc(p.slug)}" class="${p.slug === state.slug ? 'active' : ''}">
          <span class="item-kicker"><span>${String(i + 1).padStart(2, '0')} · ${esc(p.year)}</span><span>${esc(p.venue.replace(/^arXiv:/, 'arXiv '))}</span></span>
          <span class="item-title">${esc(p.shortTitle || p.title)}</span>
          <span class="item-meta">${esc(p.authors)}</span>
          <span class="item-tags">${p.tags.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join('')}</span>
        </button>
      </li>`).join('');
  }

  function panelHtml(p) {
    if (state.tab === 'transcript') {
      return `<div class="panel" data-panel="transcript"><div class="doc transcript-doc">${p.transcript_html}</div><p class="doc-end">转写稿由 PDF 页面整理；公式与图表以原文为准。</p></div>`;
    }
    if (state.tab === 'pdf') {
      return `<div class="panel pdf-panel" data-panel="pdf"><div class="pdf-hint"><span>原始 PDF · ${esc(p.venue)}</span><a class="btn" href="${esc(p.pdf)}" target="_blank" rel="noopener">在新标签页打开 ${icon('pdf')}</a></div><iframe class="pdf-frame" src="${esc(p.pdf)}" title="${esc(p.title)} PDF" loading="lazy"></iframe></div>`;
    }
    return `<div class="panel" data-panel="summary"><div class="doc summary-doc">${p.summary_html}</div><p class="doc-end">总结基于论文原文；具体数字与表述请以 PDF 为准。</p></div>`;
  }

  function renderReader() {
    const p = currentPaper();
    if (!p) { $('#workspace').innerHTML = '<div class="loading">没有可显示的论文。</div>'; return; }
    document.title = `${p.shortTitle} · Papers · SyGl`;
    const tabs = [
      ['summary', '总结稿'],
      ['transcript', '转写稿'],
      ['pdf', '原始 PDF'],
    ];
    $('#workspace').innerHTML = `
      <header class="paper-hero">
        <div class="paper-kicker"><span>Paper ${esc(p.year)}</span><span class="sep"></span><span>${esc(p.venue)}</span></div>
        <h1>${esc(p.title)}</h1>
        <p class="paper-authors">${esc(p.authors)}</p>
        <div class="paper-meta">
          <span>${esc(p.year)}</span><span class="dot"></span><span>${esc(p.venue)}</span><span class="dot"></span><span>总结 ${p.summary_chars} 字</span><span class="dot"></span><span>${esc(p.read)}</span>
        </div>
        <div class="paper-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="paper-actions">
          <a class="btn primary" href="${esc(p.pdf)}" target="_blank" rel="noopener">原始 PDF ${icon('pdf')}</a>
          <a class="btn" href="${esc(p.arxiv)}" target="_blank" rel="noopener">arXiv ${icon('arrow')}</a>
          <button class="btn" type="button" id="copyLink">复制链接 ${icon('link')}</button>
        </div>
      </header>
      <div class="reader">
        <div class="tabs" role="tablist" aria-label="论文视图">
          ${tabs.map(([key, label]) => `<button type="button" role="tab" data-tab="${key}" aria-selected="${state.tab === key}" class="${state.tab === key ? 'active' : ''}">${label}</button>`).join('')}
          <span class="tab-note">${p.transcript_html.length > 50000 ? '长文 · 可用 Ctrl/⌘+F 检索章节标题' : ''}</span>
        </div>
        ${panelHtml(p)}
      </div>`;
  }

  function update(render = true) {
    renderTags();
    renderList();
    if (render) renderReader();
    writeHash();
  }

  function setTab(tab) {
    if (!['summary', 'transcript', 'pdf'].includes(tab)) return;
    state.tab = tab;
    document.querySelectorAll('.tabs [data-tab]').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    const panel = $('.panel');
    if (panel) panel.outerHTML = panelHtml(currentPaper());
    writeHash();
  }

  async function boot() {
    try {
      const res = await fetch('/papers/data/papers.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.papers = data.papers || [];
      readHash();
      if (!state.slug && state.papers[0]) state.slug = state.papers[0].slug;
      $('#loading')?.remove();
      update();
    } catch (err) {
      $('#workspace').innerHTML = `<div class="loading">论文数据加载失败：${esc(err.message)}</div>`;
    }
  }

  document.addEventListener('click', (e) => {
    const tag = e.target.closest('[data-tag]');
    if (tag) {
      state.tag = tag.dataset.tag;
      update();
      return;
    }
    const item = e.target.closest('[data-slug]');
    if (item) {
      state.slug = item.dataset.slug;
      state.tab = 'summary';
      update();
      $('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const tab = e.target.closest('[data-tab]');
    if (tab) { setTab(tab.dataset.tab); return; }
    if (e.target.closest('#copyLink')) {
      navigator.clipboard?.writeText(location.href).then(() => {
        const b = $('#copyLink');
        if (!b) return;
        const old = b.textContent;
        b.textContent = '已复制';
        setTimeout(() => { b.textContent = old; }, 1600);
      });
    }
  });

  $('#paperSearch')?.addEventListener('input', (e) => {
    state.query = e.target.value;
    update(false);
    renderReader();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      $('#paperSearch')?.focus();
    }
    if (e.key === 'Escape' && document.activeElement === $('#paperSearch')) {
      $('#paperSearch').value = '';
      state.query = '';
      update(false);
      renderReader();
      $('#paperSearch').blur();
    }
  });
  window.addEventListener('hashchange', () => {
    readHash();
    update(false);
    renderReader();
  });

  boot();
})();
