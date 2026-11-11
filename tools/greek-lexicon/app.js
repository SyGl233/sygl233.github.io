(function () {
  'use strict';

  var DATA = null;
  var state = {
    query: '',
    lesson: 'all',
    pos: 'all'
  };

  var POS_LABELS = {
    noun: { zh: '名词', en: 'noun', es: 'sustantivo' },
    adjective: { zh: '形容词', en: 'adjective', es: 'adjetivo' },
    article: { zh: '冠词', en: 'article', es: 'artículo' },
    conjunction: { zh: '连词', en: 'conjunction', es: 'conjunción' },
    verb: { zh: '动词', en: 'verb', es: 'verbo' }
  };

  var CASE_LABELS = {
    nom: { zh: '主格', en: 'nominative', es: 'nominativo', abbr: 'nom.' },
    gen: { zh: '属格', en: 'genitive', es: 'genitivo', abbr: 'gen.' },
    dat: { zh: '与格', en: 'dative', es: 'dativo', abbr: 'dat.' },
    acc: { zh: '宾格', en: 'accusative', es: 'acusativo', abbr: 'acc.' },
    voc: { zh: '呼格', en: 'vocative', es: 'vocativo', abbr: 'voc.' }
  };

  var NUMBER_LABELS = {
    sg: { zh: '单数', en: 'singular', es: 'singular', abbr: 'sg.' },
    du: { zh: '双数', en: 'dual', es: 'dual', abbr: 'du.' },
    pl: { zh: '复数', en: 'plural', es: 'plural', abbr: 'pl.' }
  };

  // macOS "Greek – Polytonic" keyboard layout, extracted via UCKeyTranslate.
  // q maps to semicolon on that layout, so it is intentionally absent.
  var LATIN_TO_GREEK = {
    a: 'α', b: 'β', c: 'ψ', d: 'δ', e: 'ε', f: 'φ', g: 'γ', h: 'η',
    i: 'ι', j: 'ξ', k: 'κ', l: 'λ', m: 'μ', n: 'ν', o: 'ο', p: 'π',
    r: 'ρ', s: 'σ', t: 'τ', u: 'θ', v: 'ω', w: 'ς', x: 'χ', y: 'υ', z: 'ζ'
  };

  var els = {
    search: document.getElementById('searchInput'),
    lesson: document.getElementById('lessonFilter'),
    pos: document.getElementById('posFilter'),
    resultCount: document.getElementById('resultCount'),
    wordList: document.getElementById('wordList'),
    empty: document.getElementById('emptyState'),
    reset: document.getElementById('resetBtn'),
    heroCount: document.getElementById('heroCount'),
    heroLesson: document.getElementById('heroLesson'),
    footerScope: document.getElementById('footerScope'),
    mapBtn: document.getElementById('mapBtn'),
    mapPanel: document.getElementById('mapPanel'),
    mapGrid: document.getElementById('mapGrid'),
    demoBtn: document.getElementById('demoVerbBtn'),
    detail: document.getElementById('detail'),
    detailBody: document.getElementById('detailBody'),
    detailClose: document.getElementById('detailClose'),
    backdrop: document.getElementById('backdrop')
  };

  var lastFocus = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function foldLatin(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function normalizeGreek(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f\u0345\u1fbd-\u1fff]/g, '')
      .replace(/ς/g, 'σ')
      .replace(/ϲ/g, 'σ')
      .toLowerCase();
  }

  function latinToGreek(value) {
    return Array.from(String(value || '').toLowerCase())
      .map(function (ch) { return LATIN_TO_GREEK[ch] || ch; })
      .join('');
  }

  function posLabel(pos) {
    return POS_LABELS[pos] || { zh: pos, en: pos, es: pos };
  }

  function lessonBadges(lessons, limit, note) {
    var wrap = el('div', 'lesson-badges');
    if (note) {
      wrap.appendChild(el('span', 'lesson-badge', note));
      return wrap;
    }
    var shown = lessons.slice(0, limit || 3);
    shown.forEach(function (lesson) {
      wrap.appendChild(el('span', 'lesson-badge', '第 ' + lesson + ' 课'));
    });
    if (lessons.length > shown.length) {
      wrap.appendChild(el('span', 'lesson-badge', '+' + (lessons.length - shown.length)));
    }
    return wrap;
  }

  function addDefinition(parent, lang, text) {
    var row = el('div', 'def');
    var tag = el('span', 'tag tag-' + lang, '[' + (lang === 'zh' ? '中' : lang === 'en' ? 'Eng' : 'Esp') + ']');
    var body = el('p', null, text);
    row.appendChild(tag);
    row.appendChild(body);
    parent.appendChild(row);
  }

  function definitionsBlock(defs) {
    var wrap = el('div', 'defs');
    addDefinition(wrap, 'zh', defs.zh);
    addDefinition(wrap, 'en', defs.en);
    addDefinition(wrap, 'es', defs.es);
    return wrap;
  }

  function createCard(word) {
    var card = el('article', 'word-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', '查看 ' + word.lemma + ' 的释义和变格表');

    var top = el('div', 'word-top');
    var heading = el('div', 'word-heading');
    var lemma = el('h3', 'word-lemma', word.lemma);
    var translit = el('div', 'word-translit', word.translit || '');
    heading.appendChild(lemma);
    if (word.translit) heading.appendChild(translit);
    top.appendChild(heading);
    top.appendChild(el('span', 'pos-badge', posLabel(word.pos).zh));

    card.appendChild(top);

    if (word.headword && word.headword !== word.lemma) {
      card.appendChild(el('p', 'word-sub', word.headword));
    } else if (word.pos === 'conjunction') {
      card.appendChild(el('p', 'word-sub', '连词 · 无变格'));
    } else if (word.pos === 'article') {
      card.appendChild(el('p', 'word-sub', '定冠词 · 无呼格'));
    }

    card.appendChild(definitionsBlock(word.definitions));

    var foot = el('div', 'card-foot');
    foot.appendChild(lessonBadges(word.lessons, 3, word.lessonNote));
    foot.appendChild(el('span', 'card-more', '查看词条 →'));
    card.appendChild(foot);

    card.addEventListener('click', function () { openDetail(word); });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail(word);
      }
    });

    return card;
  }

  function wordMatches(word, query) {
    if (!query) return true;
    var raw = query.trim();
    if (!raw) return true;

    var lower = raw.toLowerCase();
    var folded = foldLatin(lower);
    var greekQuery = normalizeGreek(latinToGreek(lower));

    var fields = [
      normalizeGreek(word.lemma),
      normalizeGreek(word.headword || ''),
      foldLatin(word.translit || ''),
      foldLatin([word.definitions.zh, word.definitions.en, word.definitions.es].join(' '))
    ];

    return fields[0].indexOf(greekQuery) !== -1 ||
      fields[1].indexOf(greekQuery) !== -1 ||
      fields[2].indexOf(folded) !== -1 ||
      fields[3].indexOf(folded) !== -1;
  }

  function getVisibleWords() {
    if (!DATA) return [];
    return DATA.words.filter(function (word) {
      if (state.lesson !== 'all' && word.lessons.indexOf(Number(state.lesson)) === -1) return false;
      if (state.pos !== 'all' && word.pos !== state.pos) return false;
      return wordMatches(word, state.query);
    });
  }

  function render() {
    if (!DATA) return;
    var words = getVisibleWords();
    var total = DATA.words.length;

    els.wordList.replaceChildren();
    words.forEach(function (word) {
      els.wordList.appendChild(createCard(word));
    });

    els.empty.hidden = words.length !== 0;
    els.wordList.hidden = words.length === 0;

    var scope = state.lesson === 'all' ? '全部课次' : '第 ' + state.lesson + ' 课';
    if (state.query || state.pos !== 'all') {
      els.resultCount.innerHTML = scope + ' · 匹配 <em>' + words.length + '</em> / ' + total + ' 个词条';
    } else {
      els.resultCount.innerHTML = scope + ' · 共 <em>' + words.length + '</em> 个词条';
    }
  }

  function populateFilters() {
    var available = DATA.meta.availableLessons || [DATA.meta.lesson];
    els.lesson.replaceChildren();
    var allOption = el('option', null, '全部课次（' + DATA.words.length + '）');
    allOption.value = 'all';
    els.lesson.appendChild(allOption);
    available.forEach(function (lesson) {
      var count = DATA.words.filter(function (word) { return word.lessons.indexOf(lesson) !== -1; }).length;
      var option = el('option', null, '第 ' + lesson + ' 课（' + count + '）');
      option.value = String(lesson);
      els.lesson.appendChild(option);
    });
    els.lesson.value = String(DATA.meta.lesson || available[0]);

    var posCounts = {};
    DATA.words.forEach(function (word) {
      posCounts[word.pos] = (posCounts[word.pos] || 0) + 1;
    });
    els.pos.replaceChildren();
    var allPos = el('option', null, '全部词性');
    allPos.value = 'all';
    els.pos.appendChild(allPos);
    Object.keys(posCounts).sort().forEach(function (pos) {
      var option = el('option', null, posLabel(pos).zh + '（' + posCounts[pos] + '）');
      option.value = pos;
      els.pos.appendChild(option);
    });
  }

  function renderMap() {
    els.mapGrid.replaceChildren();
    Object.keys(LATIN_TO_GREEK).sort().forEach(function (latin) {
      var pair = el('div', 'map-pair');
      pair.appendChild(el('span', 'latin', latin));
      pair.appendChild(el('span', 'greek', LATIN_TO_GREEK[latin]));
      els.mapGrid.appendChild(pair);
    });
  }

  function tableForGender(inflection, gender) {
    var wrap = el('div', 'paradigm-wrap');
    var table = el('table', 'paradigm-table');
    var thead = el('thead');
    var headRow = el('tr');
    headRow.appendChild(el('th', null, '格'));
    inflection.numbers.forEach(function (number) {
      headRow.appendChild(el('th', null, NUMBER_LABELS[number].zh + ' ' + NUMBER_LABELS[number].abbr));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el('tbody');
    inflection.cases.forEach(function (caseKey) {
      var row = el('tr');
      var caseInfo = CASE_LABELS[caseKey];
      var th = el('th');
      th.appendChild(document.createTextNode(caseInfo.zh));
      th.appendChild(el('small', null, caseInfo.abbr));
      row.appendChild(th);
      inflection.numbers.forEach(function (number) {
        var form = gender.forms[caseKey] && gender.forms[caseKey][number];
        var cell = el('td', form ? 'greek-cell' : 'empty-cell', form || '—');
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function renderDeclension(word) {
    var inflection = word.inflection;
    var section = el('section', 'detail-section');
    var head = el('div', 'detail-section-head');
    var titleWrap = el('div');
    titleWrap.appendChild(el('h2', null, '变格表'));
    titleWrap.appendChild(el('div', 'detail-section-sub', inflection.label.zh + ' · ' + inflection.label.en));
    head.appendChild(titleWrap);
    section.appendChild(head);

    var tabs = null;
    var tableHost = el('div');

    if (inflection.genders.length > 1) {
      tabs = el('div', 'gender-tabs');
      section.appendChild(tabs);
    }

    function showGender(key) {
      var gender = inflection.genders.filter(function (item) { return item.key === key; })[0] || inflection.genders[0];
      tableHost.replaceChildren(tableForGender(inflection, gender));
      if (tabs) {
        Array.prototype.forEach.call(tabs.children, function (button) {
          button.classList.toggle('is-active', button.dataset.key === gender.key);
        });
      }
    }

    if (tabs) {
      inflection.genders.forEach(function (gender, index) {
        var button = el('button', 'gender-tab', gender.label.zh);
        button.type = 'button';
        button.dataset.key = gender.key;
        button.addEventListener('click', function () { showGender(gender.key); });
        tabs.appendChild(button);
        if (index === 0) button.classList.add('is-active');
      });
    }

    section.appendChild(tableHost);
    showGender(inflection.genders[0].key);

    var noteText = '按阿提卡方言列出单数、双数、复数；双数在多数教材中不作要求。';
    if (inflection.note) {
      noteText = inflection.note;
    } else if (word.pos === 'article') {
      noteText = '定冠词只有性、数、格的变化，没有呼格。';
    } else if (inflection.numbers.indexOf('du') === -1) {
      noteText = '按阿提卡方言列出单数与复数；双数从略。';
    } else if (inflection.genders.length > 1) {
      noteText = '这是第一/第二变格法形容词：阳性、中性按第二变格法，阴性按第一变格法。双数在多数教材中不作要求。';
    }
    section.appendChild(el('p', 'paradigm-note', noteText));
    return section;
  }

  function renderPrincipalParts(word) {
    var inflection = word.inflection;
    var section = el('section', 'detail-section');
    var head = el('div', 'detail-section-head');
    var titleWrap = el('div');
    titleWrap.appendChild(el('h2', null, 'Principal parts'));
    titleWrap.appendChild(el('div', 'detail-section-sub', '动词的主要部分 · 每个形式都说明它是什么'));
    head.appendChild(titleWrap);
    section.appendChild(head);
    section.appendChild(el('p', 'pp-intro', inflection.intro));

    var list = el('ol', 'pp-list');
    inflection.parts.forEach(function (part) {
      var item = el('li', 'pp-item');
      item.appendChild(el('span', 'pp-index', String(part.n)));
      var body = el('div');
      var formLine = el('div');
      formLine.appendChild(el('span', 'pp-form', part.form));
      formLine.appendChild(el('span', 'pp-label', part.label.zh + ' · ' + part.label.en));
      body.appendChild(formLine);
      body.appendChild(el('div', 'pp-gloss', part.gloss));
      body.appendChild(el('p', 'pp-explain', part.explain));
      item.appendChild(body);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  function openDetail(word) {
    lastFocus = document.activeElement;
    els.detailBody.replaceChildren();

    var lemma = el('h2', 'detail-lemma', word.lemma);
    lemma.id = 'detailTitle';
    els.detailBody.appendChild(lemma);

    if (word.translit) els.detailBody.appendChild(el('div', 'detail-translit', word.translit));

    var badges = el('div', 'detail-badges');
    badges.appendChild(el('span', null, posLabel(word.pos).zh + ' · ' + posLabel(word.pos).en));
    badges.appendChild(el('span', null, word.lessons.map(function (lesson) { return '第 ' + lesson + ' 课'; }).join('、')));
    if (word.gender) {
      badges.appendChild(el('span', null, word.gender === 'masc' ? '阳性' : word.gender === 'fem' ? '阴性' : word.gender === 'neut' ? '中性' : '阳性/通性'));
    }
    els.detailBody.appendChild(badges);

    var defs = el('div', 'detail-defs');
    addDefinition(defs, 'zh', word.definitions.zh);
    addDefinition(defs, 'en', word.definitions.en);
    addDefinition(defs, 'es', word.definitions.es);
    els.detailBody.appendChild(defs);

    if (word.headword && word.headword !== word.lemma) {
      els.detailBody.appendChild(el('p', 'detail-note', '词典形式：' + word.headword));
    }

    if (word.note) els.detailBody.appendChild(el('p', 'detail-note', word.note));

    if (word.inflection && word.inflection.type === 'declension') {
      els.detailBody.appendChild(renderDeclension(word));
    } else if (word.inflection && word.inflection.type === 'verb') {
      els.detailBody.appendChild(renderPrincipalParts(word));
    } else if (word.paradigmPending) {
      var pending = el('section', 'detail-section');
      pending.appendChild(el('h2', null, '变格 / 变位'));
      pending.appendChild(el('p', 'pp-intro', '该词条的完整变格/变位表还在整理。可以先点下方 Wiktionary 链接查看完整词形；下一批会补上表。'));
      els.detailBody.appendChild(pending);
    } else {
      var section = el('section', 'detail-section');
      section.appendChild(el('h2', null, '变格 / 变位'));
      section.appendChild(el('p', 'pp-intro', '这个词没有变格或变位形式。'));
      els.detailBody.appendChild(section);
    }

    if (word.wiktionary) {
      var links = el('div', 'detail-link-row');
      var wiktionary = el('a', 'outline-btn', '在 Wiktionary 查看 ↗');
      wiktionary.href = word.wiktionary;
      wiktionary.target = '_blank';
      wiktionary.rel = 'noopener';
      links.appendChild(wiktionary);
      els.detailBody.appendChild(links);
    }

    els.detail.classList.add('is-open');
    els.detail.setAttribute('aria-hidden', 'false');
    els.backdrop.hidden = false;
    requestAnimationFrame(function () { els.backdrop.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    els.detailBody.scrollTop = 0;
    els.detailClose.focus();
  }

  function closeDetail() {
    els.detail.classList.remove('is-open');
    els.detail.setAttribute('aria-hidden', 'true');
    els.backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      els.backdrop.hidden = true;
    }, 220);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function bindEvents() {
    els.search.addEventListener('input', function () {
      state.query = els.search.value;
      render();
    });

    els.lesson.addEventListener('change', function () {
      state.lesson = els.lesson.value;
      render();
    });

    els.pos.addEventListener('change', function () {
      state.pos = els.pos.value;
      render();
    });

    els.reset.addEventListener('click', function () {
      state.query = '';
      state.pos = 'all';
      els.search.value = '';
      els.pos.value = 'all';
      render();
      els.search.focus();
    });

    els.mapBtn.addEventListener('click', function () {
      var open = els.mapPanel.hidden;
      els.mapPanel.hidden = !open;
      els.mapBtn.setAttribute('aria-expanded', String(open));
    });

    els.demoBtn.addEventListener('click', function () {
      if (DATA && DATA.demoVerb) openDetail(DATA.demoVerb);
    });

    els.detailClose.addEventListener('click', closeDetail);
    els.backdrop.addEventListener('click', closeDetail);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (els.detail.classList.contains('is-open')) {
          closeDetail();
        } else if (els.search.value) {
          els.search.value = '';
          state.query = '';
          render();
        }
        return;
      }
      if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        event.preventDefault();
        els.search.focus();
      }
    });
  }

  function lessonRange(lessons) {
    var sorted = lessons.slice().sort(function (a, b) { return a - b; });
    if (!sorted.length) return '';
    return sorted.length === 1 ? '第 ' + sorted[0] + ' 课' : '第 ' + sorted[0] + '–' + sorted[sorted.length - 1] + ' 课';
  }

  function boot() {
    fetch('data/lessons.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        DATA = data;
        if (!DATA.meta.availableLessons) DATA.meta.availableLessons = [DATA.meta.lesson];
        state.lesson = String(DATA.meta.lesson || DATA.meta.availableLessons[0]);
        els.heroCount.textContent = DATA.words.length + ' 个词条';
        var range = lessonRange(DATA.meta.availableLessons || [DATA.meta.lesson]);
        if (els.heroLesson) els.heroLesson.textContent = range;
        if (els.footerScope) els.footerScope.textContent = '词汇范围：教材《ΛΟΓΟΣ》' + range + ' · ' + DATA.words.length + ' 个词条（跨课词条只计一次）。释义在教材西语释义基础上补充中文与英文。';
        populateFilters();
        renderMap();
        bindEvents();
        render();
      })
      .catch(function (error) {
        els.resultCount.textContent = '词典数据加载失败';
        els.wordList.replaceChildren();
        var message = el('p', 'empty', '无法载入 data/lessons.json（' + error.message + '）。请通过本地或线上服务器访问这个页面，而不是直接双击打开文件。');
        els.wordList.appendChild(message);
      });
  }

  boot();
})();
