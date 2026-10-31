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

  function lessonLabel(L) { return L.num; }
  function renderSide() {
    tabL.setAttribute('aria-selected', String(sideMode === 'L'));
    tabA.setAttribute('aria-selected', String(sideMode === 'A'));
    sideList.innerHTML = '';
    var hash = location.hash;
    var ul = el('ul', { class: 'side-list' });
    if (sideMode === 'L') {
      ul.appendChild(el('li', null, [el('a', { href: '#/', class: hash === '' || hash === '#/' ? 'active' : '' }, [el('span', { class: 'num', text: '⌂' }), el('span', { text: 'Inizio' })])]));
      F.LESSONS.forEach(function (L) {
        var href = '#/lezione/' + L.id;
        ul.appendChild(el('li', null, [el('a', { href: href, class: hash === href ? 'active' : '' }, [el('span', { class: 'num', text: lessonLabel(L) }), el('span', { text: L.title })])]));
      });
      sideList.appendChild(ul);
    } else {
      F.SECTIONS.forEach(function (S) {
        sideList.appendChild(el('div', { class: 'side-group', text: S.title }));
        var u = el('ul', { class: 'side-list' });
        Object.keys(F.sims).forEach(function (id) {
          var s = F.sims[id]; if (s.section !== S.id) return;
          var href = '#/sim/' + id;
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
    c.appendChild(el('h2', { class: 'section-title', text: 'Le lezioni' }));
    var g = el('div', { class: 'card-grid' });
    F.LESSONS.forEach(function (L) {
      g.appendChild(el('a', { class: 'card', href: '#/lezione/' + L.id }, [
        el('div', { class: 'kicker', text: 'Lezione ' + L.num }), el('h3', { text: L.title }), el('p', { text: L.card || '' })
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
        el('div', { class: 'related', style: { marginTop: '6px' } }, list.map(function (id) { return el('a', { class: 'chip', href: '#/sim/' + id, text: F.sims[id].title }); }))
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
    c.appendChild(U.texify(el('div', { class: 'oneliner', html: L.oneliner })));
    var left = el('div', { class: 'box' }, [el('h3', { text: 'Concetti chiave' }), U.texify(el('ul', null, L.points.map(function (p) { return el('li', { html: p }); })))]);
    var right = el('div', { class: 'box' }, [el('h3', { text: L.formulas && L.formulas.length ? 'Formule' : 'In pratica' })]);
    (L.formulas || []).forEach(function (f) {
      right.appendChild(el('div', { class: 'formula' }, [f.label ? el('div', { class: 'flabel', html: f.label }) : null, U.tex(f.tex, true)]));
    });
    if (L.practical) right.appendChild(U.texify(el('p', { html: L.practical })));
    c.appendChild(el('div', { class: 'two-col' }, [left, right]));
    (L.warn || []).forEach(function (w) { c.appendChild(U.texify(U.note('warn', 'Attenzione (errore nella slide).', w))); });
    (L.info || []).forEach(function (w) { c.appendChild(U.texify(U.note('info', 'Nota.', w))); });

    (L.sims || []).forEach(function (s, k) {
      var sim = F.sims[s.id];
      var block = el('section', { class: 'sim-block' });
      block.appendChild(el('h2', null, [el('span', { text: (s.title || (sim ? sim.title : s.id)) }), el('a', { class: 'tag', href: '#/sim/' + s.id, text: 'apri da solo' })]));
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
        return R ? el('a', { class: 'chip', href: '#/lezione/' + R.id, text: R.num + ' · ' + R.title }) : null;
      })));
    }
    var prev = F.LESSONS[idx - 1], next = F.LESSONS[idx + 1];
    c.appendChild(el('nav', { class: 'lesson-nav' }, [
      prev ? el('a', { class: 'card', href: '#/lezione/' + prev.id }, [el('div', { class: 'kicker', text: '← Lezione ' + prev.num }), el('h3', { text: prev.title })]) : el('span'),
      next ? el('a', { class: 'card', href: '#/lezione/' + next.id, style: { textAlign: 'right' } }, [el('div', { class: 'kicker', text: 'Lezione ' + next.num + ' →' }), el('h3', { text: next.title })]) : el('span')
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
      c.appendChild(el('div', { class: 'related' }, ls.map(function (L) { return el('a', { class: 'chip', href: '#/lezione/' + L.id, text: L.num + ' · ' + L.title }); })));
    }
    return c;
  }
  function pageNotFound() { return el('div', null, [el('h1', { text: 'Pagina non trovata' }), el('p', null, [el('a', { href: '#/', text: 'Torna all\'inizio' })])]); }

  function route() {
    cleanup();
    document.body.classList.remove('nav-open');
    var h = location.hash.replace(/^#\/?/, ''), parts = h.split('/'), page;
    if (parts[0] === 'lezione' && parts[1]) { page = pageLesson(decodeURIComponent(parts[1])); if (sideMode !== 'L') sideMode = 'L'; }
    else if (parts[0] === 'sim' && parts[1]) { page = pageSim(decodeURIComponent(parts[1])); sideMode = 'A'; }
    else page = pageHome();
    content.innerHTML = '';
    content.appendChild(page);
    var t = page.querySelector('h1');
    document.title = (t && h ? t.textContent + ' · ' : '') + 'Simulatore di Fisiologia';
    G.scrollTo(0, 0);
    renderSide();
  }
  G.addEventListener('hashchange', route);
  route();
})(typeof globalThis !== 'undefined' ? globalThis : this);
