/* Applicazione: navigazione, pagina iniziale, pagine di lezione e di simulatore. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;
  var content = document.getElementById('content'), sideList = document.getElementById('sideList');
  var mounted = [], observers = [];
  var sideMode = 'L';

  // ---------------------------------------------------------------- tema
  var themeBtn = document.getElementById('themeBtn');
  try { var saved = localStorage.getItem('fisio-theme'); if (saved) document.documentElement.setAttribute('data-theme', saved); } catch (e) { /* nessun salvataggio */ }
  themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : G.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('fisio-theme', next); } catch (e) { /* ignora */ }
    G.dispatchEvent(new Event('fisio-theme'));
  });
  if (G.matchMedia) G.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { G.dispatchEvent(new Event('fisio-theme')); });

  // ---------------------------------------------------------------- menu laterale
  document.getElementById('menuBtn').addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
  document.getElementById('scrim').addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  var tabL = document.getElementById('tabL'), tabA = document.getElementById('tabA');
  tabL.addEventListener('click', function () { sideMode = 'L'; renderSide(); });
  tabA.addEventListener('click', function () { sideMode = 'A'; renderSide(); });

  // lezioni segnate come studiate (salvate nel browser)
  var DONE_KEY = 'fisio-done', done = {};
  try { (JSON.parse(localStorage.getItem(DONE_KEY) || '[]') || []).forEach(function (id) { done[id] = 1; }); } catch (e) { done = {}; }
  function saveDone() { try { localStorage.setItem(DONE_KEY, JSON.stringify(Object.keys(done))); } catch (e) { /* senza salvataggio */ } }
  function lessonLabel(L) { return done[L.id] ? '✓' : L.num; }

  // ---------------------------------------------------------------- ricerca
  var searchBox = document.getElementById('searchBox'), searchIdx = null, searching = '';
  function plain(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\$[^$]*\$/g, ' ').replace(/\s+/g, ' ').trim(); }
  function fold(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function buildIndex() {
    searchIdx = [];
    F.LESSONS.forEach(function (L) {
      var parts = [L.title, L.card, L.oneliner].concat(L.points || [], (L.formulas || []).map(function (f) { return f.label; }), [L.practical], L.warn || [], L.info || [], L.prof || [], (L.quiz || []).map(function (q) { return q.q; })).map(plain).filter(Boolean);
      searchIdx.push({ kind: 'L', id: L.id, href: '#lezione-' + L.id, label: L.num + ' · ' + L.title, title: fold(L.title), parts: parts, folded: parts.map(fold) });
    });
    Object.keys(F.sims).forEach(function (id) {
      var sm = F.sims[id], parts = [sm.title, sm.short].map(plain).filter(Boolean);
      searchIdx.push({ kind: 'S', id: id, href: '#sim-' + id, label: 'Simulatore · ' + sm.title, title: fold(sm.title), parts: parts, folded: parts.map(fold) });
    });
  }
  function runSearch(qs) {
    if (!searchIdx) buildIndex();
    var words = fold(qs).split(/\s+/).filter(function (w) { return w.length > 1; });
    sideList.innerHTML = '';
    if (!words.length) { renderSide(); return; }
    var hits = [];
    searchIdx.forEach(function (e) {
      var score = 0, snippet = '';
      var ok = words.every(function (w) {
        var inTitle = e.title.indexOf(w) >= 0, inText = e.folded.some(function (t) { return t.indexOf(w) >= 0; });
        if (inTitle) score += 5; if (inText) { score += 1; if (!snippet) { for (var i = 0; i < e.folded.length; i++) { var k = e.folded[i].indexOf(w); if (k >= 0) { var raw = e.parts[i]; snippet = (k > 40 ? '…' : '') + raw.slice(Math.max(0, k - 40), k + 80) + (raw.length > k + 80 ? '…' : ''); break; } } } }
        return inTitle || inText;
      });
      if (ok) hits.push({ e: e, score: score + (e.kind === 'L' ? 0.5 : 0), snippet: snippet });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    var ul = el('ul', { class: 'side-list search-res' });
    hits.slice(0, 40).forEach(function (h) {
      ul.appendChild(el('li', null, [el('a', { href: h.e.href }, [el('span', { class: 'num', text: h.e.kind === 'L' ? '▸' : '◆' }), el('span', null, [el('span', { text: h.e.label }), h.snippet ? el('span', { class: 'snip', text: h.snippet }) : null])])]));
    });
    if (!hits.length) ul.appendChild(el('li', { class: 'snip', style: { padding: '8px' }, text: 'Nessun risultato per «' + qs + '».' }));
    sideList.appendChild(ul);
  }
  var searchTimer = 0;
  searchBox.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(function () { searching = searchBox.value.trim(); runSearch(searching); }, 120); });
  sideList.addEventListener('click', function (e) { if (searching && e.target.closest && e.target.closest('a')) { searchBox.value = ''; searching = ''; setTimeout(renderSide, 0); } });
  function renderSide() {
    if (searching) { runSearch(searching); return; }
    tabL.setAttribute('aria-selected', String(sideMode === 'L'));
    tabA.setAttribute('aria-selected', String(sideMode === 'A'));
    sideList.innerHTML = '';
    var hash = location.hash;
    var ul = el('ul', { class: 'side-list' });
    var provaLink = el('li', null, [el('a', { href: '#prova', class: hash === '#prova' ? 'active' : '' }, [el('span', { class: 'num', text: '✎' }), el('span', { text: 'Prova d\'esame' })])]);
    if (sideMode === 'L') {
      ul.appendChild(el('li', null, [el('a', { href: '#inizio', class: (hash === '' || hash === '#inizio') ? 'active' : '' }, [el('span', { class: 'num', text: '⌂' }), el('span', { text: 'Inizio' })])]));
      ul.appendChild(provaLink);
      F.LESSONS.forEach(function (L) {
        var href = '#lezione-' + L.id;
        ul.appendChild(el('li', null, [el('a', { href: href, class: hash === href ? 'active' : '' }, [el('span', { class: 'num', text: lessonLabel(L) }), el('span', { text: L.title })])]));
      });
      sideList.appendChild(ul);
    } else {
      var pu = el('ul', { class: 'side-list' }); pu.appendChild(provaLink); sideList.appendChild(pu);
      F.SECTIONS.forEach(function (S) {
        sideList.appendChild(el('div', { class: 'side-group', text: S.title }));
        var u = el('ul', { class: 'side-list' });
        Object.keys(F.sims).forEach(function (id) {
          var s = F.sims[id]; if (s.section !== S.id) return;
          var href = '#sim-' + id;
          u.appendChild(el('li', null, [el('a', { href: href, class: hash === href ? 'active' : '' }, [el('span', { class: 'num', text: '▸' }), el('span', { text: s.title })])]));
        });
        sideList.appendChild(u);
      });
    }
    var act = sideList.querySelector('a.active');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }

  // ---------------------------------------------------------------- montaggio pigro dei simulatori
  function cleanup() {
    observers.forEach(function (o) { o.disconnect(); }); observers = [];
    mounted.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { console.error(e); } });
    mounted = [];
  }
  function lazyMount(host, simId, preset) {
    var sim = F.sims[simId];
    if (!sim) { host.appendChild(el('div', { class: 'note warn', text: 'Simulatore non trovato: ' + simId })); return; }
    var placeholder = el('div', { class: 'small', text: 'Caricamento del simulatore…', style: { padding: '24px' } });
    host.appendChild(placeholder);
    var done = false, doMount = function () {
      if (done) return; done = true;
      host.removeChild(placeholder);
      try { mounted.push(sim.mount(host, preset || {})); }
      catch (e) { console.error(e); host.appendChild(el('div', { class: 'note warn', text: 'Errore nel simulatore: ' + e.message })); }
    };
    if ('IntersectionObserver' in G) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); doMount(); } }, { rootMargin: '300px' });
      io.observe(host); observers.push(io);
    } else doMount();
  }

  // ---------------------------------------------------------------- pagine
  function lessonsUsing(simId) { return F.LESSONS.filter(function (L) { return (L.sims || []).some(function (s) { return s.id === simId; }); }); }

  function pageHome() {
    var c = el('div');
    c.appendChild(el('div', { class: 'hero' }, [
      el('h1', { text: 'Fisiologia Generale, da vedere e da provare' }),
      el('p', { html: 'Per ogni lezione del corso trovi il concetto chiave, le formule e uno o più <b>simulatori già impostati</b> sul punto da capire. Prima di toccare i cursori, fai la tua previsione: è il modo più rapido per capire davvero.' }),
      el('p', { class: 'small', html: 'I modelli sono equazioni della fisiologia (Nernst, Goldman, Hodgkin-Huxley, Fick, van\'t Hoff, Starling…) calcolate in tempo reale e verificate con test automatici sui valori di letteratura e delle slide. Dove una slide contiene un errore, la lezione lo segnala nel riquadro <b>Attenzione</b>.' })
    ]));
    c.appendChild(el('a', { class: 'card promo', href: '#prova' }, [
      el('div', { class: 'kicker', text: 'Verifica' }), el('h3', { text: 'Prova d\'esame: intercorsi a crocette' }),
      el('p', { text: 'Simulazioni a tempo del primo e del secondo intercorso, e prove costruite sui tuoi errori. Con storico dei tentativi.' })
    ]));
    var nDone = Object.keys(done).length;
    c.appendChild(el('h2', { class: 'section-title', text: 'Le lezioni' + (nDone ? ' (' + nDone + ' studiate su ' + F.LESSONS.length + ')' : '') }));
    var g = el('div', { class: 'card-grid' });
    F.LESSONS.forEach(function (L) {
      g.appendChild(el('a', { class: 'card' + (done[L.id] ? ' is-done' : ''), href: '#lezione-' + L.id }, [
        el('div', { class: 'kicker', text: 'Lezione ' + L.num + (done[L.id] ? ' · studiata ✓' : '') }), el('h3', { text: L.title }), el('p', { text: L.card || '' })
      ]));
    });
    c.appendChild(g);
    c.appendChild(el('h2', { class: 'section-title', text: 'Per argomento' }));
    var g2 = el('div', { class: 'card-grid' });
    F.SECTIONS.forEach(function (S) {
      var list = Object.keys(F.sims).filter(function (id) { return F.sims[id].section === S.id; });
      if (!list.length) return;
      g2.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'kicker', text: 'Lezioni ' + S.lessons }), el('h3', { text: S.title }),
        el('div', { class: 'related', style: { marginTop: '6px' } }, list.map(function (id) { return el('a', { class: 'chip', href: '#sim-' + id, text: F.sims[id].title }); }))
      ]));
    });
    c.appendChild(g2);
    return c;
  }

  function pageLesson(id) {
    var idx = F.LESSONS.findIndex(function (L) { return L.id === id; });
    if (idx < 0) return pageNotFound();
    var L = F.LESSONS[idx], c = el('article');
    c.appendChild(el('header', { class: 'lesson-head' }, [
      el('div', { class: 'kicker', text: 'Lezione ' + L.num }),
      el('h1', { text: L.title }),
      L.src ? el('div', { class: 'src', text: 'Slide: ' + L.src }) : null
    ]));
    var chk = el('input', { type: 'checkbox' }); chk.checked = !!done[L.id];
    chk.addEventListener('change', function () { if (chk.checked) done[L.id] = 1; else delete done[L.id]; saveDone(); renderSide(); });
    c.appendChild(el('div', { class: 'lesson-tools' }, [
      el('label', { class: 'switch' }, [chk, el('span', { text: 'Segna come studiata' })]),
      U.button('Stampa la scheda', function () { G.print(); })
    ]));
    c.appendChild(U.texify(el('div', { class: 'oneliner', html: L.oneliner })));
    var left = el('div', { class: 'box' }, [el('h3', { text: 'Concetti chiave' }), U.texify(el('ul', null, L.points.map(function (p) { return el('li', { html: p }); })))]);
    var right = el('div', { class: 'box' }, [el('h3', { text: L.formulas && L.formulas.length ? 'Formule' : 'In pratica' })]);
    (L.formulas || []).forEach(function (f) {
      right.appendChild(el('div', { class: 'formula' }, [f.label ? el('div', { class: 'flabel', html: f.label }) : null, U.tex(f.tex, true)]));
    });
    if (L.practical) right.appendChild(U.texify(el('p', { html: L.practical })));
    c.appendChild(el('div', { class: 'two-col' }, [left, right]));
    if (L.prof && L.prof.length) {
      c.appendChild(U.texify(el('div', { class: 'box prof' }, [el('h3', { text: 'Detto a lezione' }), el('ul', null, L.prof.map(function (p) { return el('li', { html: p }); }))])));
    }
    (L.warn || []).forEach(function (w) { c.appendChild(U.texify(U.note('warn', 'Attenzione (errore nella slide).', w))); });
    (L.info || []).forEach(function (w) { c.appendChild(U.texify(U.note('info', 'Nota.', w))); });

    (L.sims || []).forEach(function (s, k) {
      var sim = F.sims[s.id];
      var block = el('section', { class: 'sim-block' });
      block.appendChild(el('h2', null, [el('span', { text: (s.title || (sim ? sim.title : s.id)) }), el('a', { class: 'tag', href: '#sim-' + s.id, text: 'apri da solo' })]));
      if (s.predict) block.appendChild(U.predict(s.predict));
      var host = el('div');
      block.appendChild(host);
      if (s.observe) block.appendChild(U.texify(el('div', { class: 'observe', html: '<b>Cosa osservare:</b> ' + s.observe })));
      c.appendChild(block);
      lazyMount(host, s.id, s.preset);
    });
    if (L.quiz && L.quiz.length) {
      c.appendChild(el('h2', { class: 'section-title', text: 'Verifica rapida' }));
      c.appendChild(U.quiz(L.quiz));
    }
    if (L.related && L.related.length) {
      c.appendChild(el('h3', { class: 'section-title', text: 'Lezioni collegate' }));
      c.appendChild(el('div', { class: 'related' }, L.related.map(function (rid) {
        var R = F.LESSONS.find(function (x) { return x.id === rid; });
        return R ? el('a', { class: 'chip', href: '#lezione-' + R.id, text: R.num + ' · ' + R.title }) : null;
      })));
    }
    var prev = F.LESSONS[idx - 1], next = F.LESSONS[idx + 1];
    c.appendChild(el('nav', { class: 'lesson-nav' }, [
      prev ? el('a', { class: 'card', href: '#lezione-' + prev.id }, [el('div', { class: 'kicker', text: '← Lezione ' + prev.num }), el('h3', { text: prev.title })]) : el('span'),
      next ? el('a', { class: 'card', href: '#lezione-' + next.id, style: { textAlign: 'right' } }, [el('div', { class: 'kicker', text: 'Lezione ' + next.num + ' →' }), el('h3', { text: next.title })]) : el('span')
    ]));
    return c;
  }

  function pageSim(id) {
    var sim = F.sims[id];
    if (!sim) return pageNotFound();
    var c = el('article');
    var S = F.SECTIONS.find(function (x) { return x.id === sim.section; });
    c.appendChild(el('header', { class: 'lesson-head' }, [
      el('div', { class: 'kicker', text: S ? S.title : 'Simulatore' }), el('h1', { text: sim.title }),
      sim.short ? U.texify(el('p', { class: 'small', html: sim.short })) : null
    ]));
    var host = el('div'); c.appendChild(host);
    lazyMount(host, id, {});
    var ls = lessonsUsing(id);
    if (ls.length) {
      c.appendChild(el('h3', { class: 'section-title', text: 'Usato nelle lezioni' }));
      c.appendChild(el('div', { class: 'related' }, ls.map(function (L) { return el('a', { class: 'chip', href: '#lezione-' + L.id, text: L.num + ' · ' + L.title }); })));
    }
    return c;
  }
  function pageNotFound() { return el('div', null, [el('h1', { text: 'Pagina non trovata' }), el('p', null, [el('a', { href: '#inizio', text: 'Torna all\'inizio' })])]); }

  function route() {
    cleanup();
    document.body.classList.remove('nav-open');
    // indirizzi semplici (#lezione-13, #sim-ghk, #inizio): funzionano anche dentro la pagina pubblicata
    var h = location.hash.replace(/^#/, ''), page, m;
    var qp = null;
    if (h === 'prova' && F.quizPage) { qp = F.quizPage(); page = qp.el; mounted.push(qp); sideMode = 'L'; }
    else if ((m = /^lezione-(.+)$/.exec(h))) { page = pageLesson(m[1]); sideMode = 'L'; }
    else if ((m = /^sim-(.+)$/.exec(h))) { page = pageSim(m[1]); sideMode = 'A'; }
    else page = pageHome();
    content.innerHTML = '';
    content.appendChild(page);
    var t = page.querySelector('h1');
    document.title = (t && (m || qp) ? t.textContent + ' · ' : '') + 'Simulatore di Fisiologia';
    G.scrollTo(0, 0);
    renderSide();
  }
  G.addEventListener('hashchange', route);
  route();
})(typeof globalThis !== 'undefined' ? globalThis : this);
