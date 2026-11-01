/* Pagina «Prova d'esame»: scelta della prova, svolgimento a tempo, correzione, storico, aggiunta di domande. */
(function (G) {
  'use strict';
  var F = G.Fisio, Q = F.quiz, U = F.ui, el = U.el;

  var KIND = {
    p1: { name: 'Primo intercorso', tag: 'Prima prova' },
    p2: { name: 'Secondo intercorso', tag: 'Seconda prova' },
    all: { name: 'Prova completa', tag: 'Tutto il programma' }
  };
  var MODE = { random: 'Simulazione', weak: 'Sui miei errori', ripasso: 'Ripasso' };
  var MINUTES = [[0, 'nessun limite'], [10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '60 min'], [90, '90 min']];

  // ---------------------------------------------------------------- utilità
  function lessonTitle(id) {
    var L = (F.LESSONS || []).filter(function (x) { return x.id === id; })[0];
    return L ? L.title : '';
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec)); var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtDate(ts) {
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /** Testo delle domande aggiunte dall'utente: niente HTML tranne apici e pedici e il grassetto. */
  function safe(s) { return esc(s).replace(/&lt;(\/?)(sub|sup|b|i)&gt;/g, '<$1$2>'); }
  function setText(node, html, user) { node.innerHTML = user ? safe(html) : html; U.texify(node); return node; }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function rangeText(kind) { var r = Q.data.settings.range[kind]; return 'slide ' + Q.lessonNum(r[0]) + '–' + Q.lessonNum(r[1]); }

  // ---------------------------------------------------------------- pagina
  function pageProva() {
    Q.load();
    var root = el('div', { class: 'prova' });
    var S = { view: 'home', test: null, idx: 0, timer: 0, plots: [], keyFn: null, result: null, filter: 'tutte', ui: {} };

    function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = 0; } }
    function disposePlots() { S.plots.forEach(function (p) { try { p.dispose(); } catch (e) { /* già rimosso */ } }); S.plots = []; }
    function setKeys(fn) {
      if (S.keyFn) document.removeEventListener('keydown', S.keyFn);
      S.keyFn = fn; if (fn) document.addEventListener('keydown', fn);
    }
    function destroy() { stopTimer(); disposePlots(); setKeys(null); }

    function render() {
      stopTimer(); disposePlots(); setKeys(null);
      root.innerHTML = '';
      try {
        if (S.view === 'run') renderRun();
        else if (S.view === 'result') renderResult();
        else renderHome();
      } catch (e) {
        console.error(e);
        root.appendChild(el('div', { class: 'note warn', text: 'Errore nella pagina delle prove: ' + e.message }));
      }
      G.scrollTo(0, 0);
    }

    // ================================================================ HOME
    function hasHistory(kind) {
      var ls = Q.lessonsBetween(Q.data.settings.range[kind][0], Q.data.settings.range[kind][1]), set = {};
      ls.forEach(function (l) { set[l] = 1; });
      return Object.keys(Q.stats).some(function (id) { return set[Q.stats[id].l]; });
    }
    function kindStats(kind) {
      var a = Q.data.attempts.filter(function (x) { return x.kind === kind; });
      if (!a.length) return null;
      var last = a[a.length - 1], best = a.reduce(function (m, x) { return Math.max(m, x.correct / x.n); }, 0);
      return { n: a.length, last: last, best: best };
    }

    function renderHome() {
      var S0 = Q.data.settings;
      root.appendChild(el('header', { class: 'lesson-head' }, [
        el('div', { class: 'kicker', text: 'Verifica' }),
        el('h1', { text: 'Prova d\'esame' }),
        el('p', { class: 'small', html: 'Domande a crocette con <b>una sola risposta giusta</b>: 1 punto per ogni risposta esatta, nessuna penalità. La <b>simulazione</b> pesca le domande a caso (una per lezione a turno, così nessun argomento resta fuori). <b>Sui miei errori</b> sceglie soprattutto le domande che hai sbagliato, insieme a qualcuna nuova e a un po\' di ripasso.' })
      ]));
      if (!Q.storageAvailable) root.appendChild(U.note('warn', 'Salvataggio non disponibile.', 'Questo browser non permette di salvare i dati: lo storico resta solo finché la pagina è aperta. Usa <b>Esporta</b> in fondo alla pagina per non perderlo.'));

      // prova in corso
      if (Q.data.run && Q.data.run.items && Q.data.run.items.length) {
        var run = Q.data.run, answered = run.answers.filter(function (a) { return a !== undefined && a !== null; }).length;
        var left = run.minutes ? run.startTs + run.minutes * 60000 - Date.now() : null;
        root.appendChild(el('div', { class: 'note info presume' }, [
          el('span', { class: 'ttl', text: 'Hai una prova in corso. ' }),
          el('span', { text: KIND[run.kind].name + ' (' + MODE[run.mode] + '), risposte date: ' + answered + ' su ' + run.items.length + (left !== null ? (left > 0 ? ', tempo rimasto ' + fmtTime(left / 1000) : ', tempo scaduto') : '') + '. ' }),
          U.button('Riprendi', function () { resume(); }, 'primary'),
          U.button('Abbandona', function () { Q.clearRun(); render(); })
        ]));
      }

      // le tre prove
      var grid = el('div', { class: 'card-grid pcards' });
      ['p1', 'p2', 'all'].forEach(function (k) {
        var st = kindStats(k), weakOk = hasHistory(k);
        var line = st ? 'Ultimo risultato: <b>' + st.last.correct + '/' + st.last.n + '</b> · migliore: ' + Math.round(100 * st.best) + '% · tentativi: ' + st.n : 'Nessun tentativo ancora.';
        grid.appendChild(el('div', { class: 'card pcard' }, [
          el('div', { class: 'kicker', text: KIND[k].tag }),
          el('h3', { text: KIND[k].name }),
          el('p', { html: rangeText(k) + ' · <b>' + S0.n[k] + ' domande</b> · ' + (S0.minutes[k] ? S0.minutes[k] + ' minuti' : 'senza limite di tempo') }),
          el('p', { class: 'small', html: line }),
          el('div', { class: 'btn-row' }, [
            U.button('Simulazione', function () { startTest(k, 'random'); }, 'primary'),
            (function () { var b = U.button('Sui miei errori', function () { startTest(k, 'weak'); }); if (!weakOk) { b.disabled = true; b.title = 'Disponibile dopo la prima simulazione su queste lezioni'; } return b; })()
          ]),
          weakOk ? null : el('p', { class: 'small', style: { marginTop: '6px' }, text: '«Sui miei errori» si attiva dopo la prima simulazione.' })
        ]));
      });
      root.appendChild(grid);

      root.appendChild(settingsBox());
      root.appendChild(historyBox());
      root.appendChild(addBox());
    }

    // ---------------------------------------------------------------- impostazioni
    function settingsBox() {
      var S0 = Q.data.settings, box = el('details', { class: 'adv psettings' });
      box.appendChild(el('summary', { text: 'Impostazioni delle prove (numero di domande, durata, lezioni incluse)' }));
      var inner = el('div', { class: 'pset' });
      var ids = Q.LESSON_IDS.map(function (l) { return [l, Q.lessonNum(l)]; });
      ['p1', 'p2', 'all'].forEach(function (k) {
        var from = U.select({ label: 'Dalla slide', value: S0.range[k][0], options: ids, onChange: function (v) { S0.range[k][0] = v; Q.save(); } });
        var to = U.select({ label: 'Alla slide', value: S0.range[k][1], options: ids, onChange: function (v) { S0.range[k][1] = v; Q.save(); } });
        var n = el('input', { type: 'number', min: 3, max: 60, value: S0.n[k], 'aria-label': 'Numero di domande' });
        n.addEventListener('change', function () { var v = Math.max(3, Math.min(60, parseInt(n.value, 10) || S0.n[k])); n.value = v; S0.n[k] = v; Q.save(); });
        var mn = U.select({ label: 'Durata', value: S0.minutes[k], options: MINUTES, onChange: function (v) { S0.minutes[k] = parseInt(v, 10); Q.save(); } });
        inner.appendChild(el('div', { class: 'prow' }, [
          el('div', { class: 'ptitle', text: KIND[k].name }),
          from.el, to.el,
          el('div', { class: 'ctl' }, [el('div', { class: 'ctl-row' }, [el('label', { text: 'N. domande' })]), n]),
          mn.el
        ]));
      });
      var fb = U.seg({
        label: 'Correzione', value: S0.feedback, options: [['end', 'a fine prova (come all\'esame)'], ['now', 'subito dopo ogni risposta']],
        onChange: function (v) { S0.feedback = v; Q.save(); }
      });
      inner.appendChild(fb.el);
      inner.appendChild(el('p', { class: 'small', text: 'Le modifiche si salvano da sole e valgono dalla prossima prova. Gli intervalli sono nella numerazione delle slide (01–30). I valori predefiniti (15 domande, 30 minuti; prova completa 30 domande, 45 minuti) sono una stima: cambiali quando conosci quelli della prof.' }));
      inner.appendChild(U.button('Ripristina i valori predefiniti', function () {
        var d = JSON.parse(JSON.stringify({ n: { p1: 15, p2: 15, all: 30 }, minutes: { p1: 30, p2: 30, all: 45 }, range: { p1: ['01', '14'], p2: ['15', '30'], all: ['01', '30'] }, feedback: 'end' }));
        Q.data.settings = d; Q.save(); render();
      }));
      box.appendChild(inner);
      if (S.ui.settingsOpen) box.open = true;
      box.addEventListener('toggle', function () { S.ui.settingsOpen = box.open; });
      return box;
    }

    // ---------------------------------------------------------------- storico
    function historyBox() {
      var wrap = el('section', { class: 'phist' });
      wrap.appendChild(el('h2', { class: 'section-title', text: 'Il mio storico' }));
      var att = Q.data.attempts.slice().sort(function (a, b) { return a.ts - b.ts; });
      if (!att.length) {
        wrap.appendChild(el('p', { class: 'small', text: 'Quando avrai concluso una prova, qui vedrai i tentativi, l\'andamento, gli argomenti più deboli e le domande che sbagli più spesso.' }));
      } else {
        // andamento
        var host = el('div'); wrap.appendChild(host);
        var plot = U.plot(host, { title: 'Andamento (percentuale di risposte esatte)', xlabel: 'tentativo', ylabel: '%', height: 190, xlim: [0.5, Math.max(att.length, 2) + 0.5] });
        S.plots.push(plot);
        var series = [], colors = { p1: '--c1', p2: '--c2', all: '--c3' };
        ['p1', 'p2', 'all'].forEach(function (k) {
          var xs = [], ys = [];
          att.forEach(function (a, i) { if (a.kind === k) { xs.push(i + 1); ys.push(100 * a.correct / a.n); } });
          if (xs.length) { series.push({ name: KIND[k].name, x: xs, y: ys, color: colors[k] }); series.push({ x: xs, y: ys, type: 'points', color: colors[k], r: 4 }); }
        });
        plot.update({ series: series, ylim: [0, 100] });

        // tabella dei tentativi
        var rows = att.slice().reverse(), shown = S.ui.allAttempts ? rows : rows.slice(0, 8);
        var tbody = el('tbody');
        shown.forEach(function (a) {
          tbody.appendChild(el('tr', null, [
            el('td', { text: fmtDate(a.ts) }), el('td', { text: KIND[a.kind] ? KIND[a.kind].name : a.kind }), el('td', { text: MODE[a.mode] || a.mode }),
            el('td', { html: '<b>' + a.correct + '/' + a.n + '</b>' }), el('td', { text: pct(a.correct, a.n) + '%' }),
            el('td', { text: fmtTime(a.secs) + (a.limit ? ' / ' + a.limit + ':00' : '') })
          ]));
        });
        wrap.appendChild(el('div', { class: 'ex-scroll' }, [el('table', { class: 'ex-diff ptable' }, [
          el('thead', null, [el('tr', null, ['Data', 'Prova', 'Tipo', 'Punti', '%', 'Tempo'].map(function (h) { return el('th', { text: h }); }))]), tbody
        ])]));
        if (rows.length > 8) wrap.appendChild(U.button(S.ui.allAttempts ? 'Mostra solo gli ultimi' : 'Mostra tutti i tentativi (' + rows.length + ')', function () { S.ui.allAttempts = !S.ui.allAttempts; render(); }));

        // per lezione
        var ls = Q.lessonStats().filter(function (o) { return o.pct !== null; }).sort(function (a, b) { return a.pct - b.pct; });
        if (ls.length) {
          wrap.appendChild(el('h3', { class: 'section-title', text: 'Argomenti, dal più debole' }));
          var list = el('div', { class: 'pbars' });
          ls.forEach(function (o) {
            var p = Math.round(100 * o.pct);
            list.appendChild(el('a', { class: 'pbar', href: '#lezione-' + o.l, title: 'Apri la lezione' }, [
              el('span', { class: 'pb-l', text: Q.lessonNum(o.l) + ' · ' + lessonTitle(o.l) }),
              el('span', { class: 'pb-track' }, [el('span', { class: 'pb-fill ' + (p >= 75 ? 'ok' : p >= 50 ? 'mid' : 'low'), style: { width: Math.max(3, p) + '%' } })]),
              el('span', { class: 'pb-v', text: p + '% (' + o.right + '/' + (o.right + o.wrong) + ')' })
            ]));
          });
          wrap.appendChild(list);
        }
        // domande più sbagliate
        var worst = Q.worstQuestions(8);
        if (worst.length) {
          wrap.appendChild(el('h3', { class: 'section-title', text: 'Le domande che sbagli più spesso' }));
          var ul = el('ul', { class: 'pworst' });
          worst.forEach(function (x) {
            var txt = x.e.gen ? '(domanda calcolata) ' + x.e.t : x.e.q;
            ul.appendChild(el('li', null, [
              setText(el('span', { class: 'pw-q' }), txt.length > 140 ? txt.slice(0, 137) + '…' : txt, x.e.user),
              el('span', { class: 'small', text: ' — sbagliata ' + x.w + ' volte su ' + x.s + ' · ' }),
              el('a', { class: 'chip', href: '#lezione-' + x.l, text: 'lezione ' + Q.lessonNum(x.l) })
            ]));
          });
          wrap.appendChild(ul);
        }
      }
      if ((Q.data.flagged || []).length) {
        wrap.appendChild(el('h3', { class: 'section-title', text: 'Domande segnalate come dubbie (' + Q.data.flagged.length + ')' }));
        wrap.appendChild(el('p', { class: 'small', text: 'Hai segnalato queste domande perché la risposta o il testo non ti convincono. Confrontale con le slide o chiedi alla prof; se ne trovi una sbagliata puoi correggerla nel file dell\'archivio (vedi il README). Le segnalazioni sono incluse nell\'esportazione.' }));
        var fl = el('ul', { class: 'pworst' });
        Q.data.flagged.forEach(function (f, k) {
          var li = el('li', null, [setText(el('span', { class: 'pw-q' }), f.q), el('div', { class: 'small', text: 'Risposta indicata come giusta: ' + (f.o && f.o[f.c] !== undefined ? f.o[f.c] : '—') + ' · lezione ' + Q.lessonNum(f.l) + ' · ' }), el('span', null, [U.button('Togli la segnalazione', function () { Q.data.flagged.splice(k, 1); Q.save(); render(); })])]);
          fl.appendChild(li);
        });
        wrap.appendChild(fl);
      }
      wrap.appendChild(dataBox());
      return wrap;
    }

    // ---------------------------------------------------------------- esporta / importa / azzera
    function dataBox() {
      var box = el('div', { class: 'pdata' });
      var msg = el('div', { class: 'small pmsg', 'aria-live': 'polite' });
      box.appendChild(el('h3', { class: 'section-title', text: 'Salvare o spostare lo storico' }));
      box.appendChild(el('p', { class: 'small', text: 'Lo storico è salvato in questo browser e in questo computer. Per tenerne una copia o per spostarlo su un altro dispositivo, esportalo e poi importalo dove vuoi: i tentativi già presenti non vengono duplicati.' }));
      var ta = el('textarea', { class: 'ptext', rows: 4, placeholder: 'Per importare senza file: incolla qui il testo esportato, poi premi «Importa dal testo».', 'aria-label': 'Testo da importare' });
      var file = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
      file.addEventListener('change', function () {
        var f = file.files && file.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () { doImport(String(r.result)); file.value = ''; };
        r.readAsText(f);
      });
      function doImport(text) {
        try {
          var res = Q.importJSON(text);
          msg.className = 'small pmsg ok';
          msg.textContent = 'Importati ' + res.attempts + ' tentativi nuovi' + (res.user ? ' e ' + res.user + ' domande aggiunte' : '') + '. Tentativi totali: ' + res.total + '.';
          setTimeout(render, 900);
        } catch (e) { msg.className = 'small pmsg bad'; msg.textContent = e.message; }
      }
      function download() {
        var txt = Q.exportJSON(), d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
        var name = 'storico-prove-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.json';
        try {
          var blob = new Blob([txt], { type: 'application/json' }), url = URL.createObjectURL(blob);
          var a = el('a', { href: url, download: name }); document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          msg.className = 'small pmsg ok'; msg.textContent = 'File «' + name + '» scaricato. Se il browser lo ha bloccato, usa «Copia il testo».';
        } catch (e) { msg.className = 'small pmsg bad'; msg.textContent = 'Download non riuscito: usa «Copia il testo» e incollalo in un file.'; }
      }
      function copy() {
        var txt = Q.exportJSON();
        ta.value = txt;
        var done = function (okk) { msg.className = 'small pmsg ' + (okk ? 'ok' : ''); msg.textContent = okk ? 'Testo copiato negli appunti (e mostrato nella casella qui sotto).' : 'Copia non riuscita: seleziona il testo nella casella qui sotto e copialo a mano.'; };
        try { if (G.navigator.clipboard && G.navigator.clipboard.writeText) G.navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { ta.select(); done(false); }); else { ta.select(); done(document.execCommand && document.execCommand('copy')); } } catch (e) { ta.select(); done(false); }
      }
      var resetWrap = el('span');
      function resetButton() {
        resetWrap.innerHTML = '';
        resetWrap.appendChild(U.button('Azzera lo storico', function () {
          resetWrap.innerHTML = '';
          resetWrap.appendChild(el('span', { class: 'small', text: 'Cancellare tutti i tentativi? ' }));
          resetWrap.appendChild(U.button('Sì, cancella', function () { Q.resetHistory(); render(); }, 'danger'));
          resetWrap.appendChild(U.button('No', resetButton));
        }));
      }
      resetButton();
      box.appendChild(el('div', { class: 'btn-row' }, [
        U.button('Esporta (scarica file)', download, 'primary'), U.button('Copia il testo', copy),
        U.button('Importa da file', function () { file.click(); }), U.button('Importa dal testo', function () { doImport(ta.value); }),
        resetWrap
      ]));
      box.appendChild(file); box.appendChild(ta); box.appendChild(msg);
      return box;
    }

    // ---------------------------------------------------------------- aggiungere domande
    function addBox() {
      var box = el('details', { class: 'adv padd' });
      box.appendChild(el('summary', { text: 'Aggiungere nuove domande (anche con un altro assistente)' }));
      var inner = el('div', { class: 'pset' });
      var nUser = Q.data.user.length, nBank = Q.bank.length;
      inner.appendChild(el('p', { class: 'small', html: 'L\'archivio incluso nel sito ha <b>' + nBank + ' domande</b>' + (Q.gens.length ? ' più <b>' + Q.gens.length + ' tipi di domanda calcolata dal motore</b> (numeri sempre diversi)' : '') + '; ne hai aggiunte <b>' + nUser + '</b>. Puoi crearne altre così: copia il testo qui sotto e incollalo, insieme al testo di una lezione (slide o appunti), in un assistente come ChatGPT o Gemini. Poi incolla qui la risposta, premi «Controlla» e «Salva».' }));
      var prompt = el('textarea', { class: 'ptext', rows: 6, readonly: true, 'aria-label': 'Testo da dare all\'assistente' }); prompt.value = Q.PROMPT;
      var msg = el('div', { class: 'small pmsg', 'aria-live': 'polite' });
      inner.appendChild(prompt);
      inner.appendChild(el('div', { class: 'btn-row' }, [U.button('Copia le istruzioni', function () {
        prompt.select();
        try { if (G.navigator.clipboard && G.navigator.clipboard.writeText) G.navigator.clipboard.writeText(Q.PROMPT); else document.execCommand('copy'); msg.className = 'small pmsg ok'; msg.textContent = 'Istruzioni copiate.'; } catch (e) { msg.className = 'small pmsg'; msg.textContent = 'Selezionate: premi Ctrl+C.'; }
      })]));
      var ta = el('textarea', { class: 'ptext', rows: 8, placeholder: 'Incolla qui la lista JSON ricevuta dall\'assistente: [ { "l": "13", "q": "…", "o": ["…","…","…","…"], "w": "…" } ]', 'aria-label': 'Domande da aggiungere' });
      var rep = el('div', { class: 'preport' }), pending = null;
      var save = U.button('Salva le domande valide', function () {
        if (!pending || !pending.good.length) return;
        Q.commitUserQuestions(pending.good);
        msg.className = 'small pmsg ok'; msg.textContent = 'Salvate ' + pending.good.length + ' domande. Compariranno nelle prossime prove (nelle lezioni indicate).';
        pending = null; save.disabled = true; ta.value = ''; rep.innerHTML = '';
        S.ui.addOpen = true; setTimeout(render, 900);
      }, 'primary');
      save.disabled = true;
      inner.appendChild(ta);
      inner.appendChild(el('div', { class: 'btn-row' }, [U.button('Controlla', function () {
        rep.innerHTML = ''; msg.textContent = '';
        try {
          pending = Q.addUserQuestions(ta.value);
        } catch (e) { pending = null; save.disabled = true; msg.className = 'small pmsg bad'; msg.textContent = e.message; return; }
        var okN = pending.good.length, bad = pending.report.length - okN;
        msg.className = 'small pmsg ' + (bad ? 'warn' : 'ok');
        msg.textContent = okN + ' domande valide' + (bad ? ', ' + bad + ' da correggere o già presenti' : '') + '.';
        pending.report.forEach(function (r) { rep.appendChild(el('div', { class: 'prep ' + (r.ok ? 'ok' : 'bad'), text: 'Domanda ' + r.n + ': ' + (r.ok ? '✓ ' : '✗ ') + r.msg })); });
        save.disabled = okN === 0;
      }), save]));
      inner.appendChild(rep); inner.appendChild(msg);
      if (nUser) {
        var delWrap = el('div', { class: 'btn-row', style: { marginTop: '8px' } });
        var delBtn = function () {
          delWrap.innerHTML = '';
          delWrap.appendChild(U.button('Elimina le ' + nUser + ' domande che ho aggiunto', function () {
            delWrap.innerHTML = ''; delWrap.appendChild(el('span', { class: 'small', text: 'Sicuro? ' }));
            delWrap.appendChild(U.button('Sì, elimina', function () { Q.clearUserQuestions(); S.ui.addOpen = true; render(); }, 'danger'));
            delWrap.appendChild(U.button('No', delBtn));
          }));
        };
        delBtn(); inner.appendChild(delWrap);
      }
      box.appendChild(inner);
      if (S.ui.addOpen) box.open = true;
      box.addEventListener('toggle', function () { S.ui.addOpen = box.open; });
      return box;
    }

    // ================================================================ AVVIO / RIPRESA
    function startTest(kind, mode) {
      var t = Q.build(kind, mode);
      if (!t.items.length) { root.insertBefore(U.note('warn', 'Nessuna domanda disponibile', 'in queste lezioni non ci sono ancora domande: cambia l\'intervallo nelle impostazioni.'), root.firstChild.nextSibling); return; }
      S.test = t; S.idx = 0; S.view = 'run'; Q.saveRun(t); render();
    }
    function resume() {
      S.test = Q.data.run; S.idx = Math.max(0, (S.test.answers || []).filter(function (a) { return a !== undefined && a !== null; }).length);
      if (S.idx >= S.test.items.length) S.idx = 0;
      S.view = 'run'; render();
    }
    function deadline() { return S.test.minutes ? S.test.startTs + S.test.minutes * 60000 : 0; }

    // ================================================================ SVOLGIMENTO
    function renderRun() {
      var T = S.test, N = T.items.length, training = T.feedback === 'now';
      var dl0 = deadline(); if (dl0 && Date.now() >= dl0) { finish(true); return; }   // tempo già scaduto (prova ripresa tardi)
      T.answers = T.answers || []; T.flags = T.flags || [];
      var head = el('div', { class: 'prun-head' });
      var title = el('div', { class: 'prun-title' }, [
        el('div', { class: 'kicker', text: KIND[T.kind].name + ' · ' + MODE[T.mode] + ' · ' + rangeTextFor(T) }),
        el('div', { class: 'prun-count' })
      ]);
      var timerEl = el('div', { class: 'ptimer', 'aria-live': 'off', title: 'Tempo rimasto' });
      head.appendChild(title); head.appendChild(timerEl);
      var dots = el('div', { class: 'pdots', role: 'group', 'aria-label': 'Domande' });
      var card = el('div', { class: 'pq' });
      var nav = el('div', { class: 'pnav' });
      var confirmBox = el('div', { class: 'pconfirm' });
      root.appendChild(head); root.appendChild(dots); root.appendChild(card); root.appendChild(nav); root.appendChild(confirmBox);
      if (T.mode === 'weak' && T.kinds) root.appendChild(el('p', { class: 'small', text: 'Composizione: ' + T.kinds.weak + ' da rivedere, ' + T.kinds.nuova + ' nuove, ' + T.kinds.ok + ' di ripasso.' }));

      function answered(i) { return T.answers[i] !== undefined && T.answers[i] !== null; }
      function paintDots() {
        dots.innerHTML = '';
        for (var i = 0; i < N; i++) {
          (function (i) {
            var b = el('button', { type: 'button', class: 'pdot' + (answered(i) ? ' done' : '') + (T.flags[i] ? ' flag' : '') + (i === S.idx ? ' cur' : ''), text: String(i + 1), 'aria-label': 'Domanda ' + (i + 1) + (answered(i) ? ', risposta data' : ', senza risposta') + (T.flags[i] ? ', da rivedere' : '') });
            b.addEventListener('click', function () { S.idx = i; show(); });
            dots.appendChild(b);
          })(i);
        }
        var done = 0; for (var k = 0; k < N; k++) if (answered(k)) done++;
        title.querySelector('.prun-count').textContent = 'Domanda ' + (S.idx + 1) + ' di ' + N + ' · risposte date: ' + done;
      }
      function choose(i, j) {
        if (training && answered(i)) return;     // in modalità allenamento la risposta data non si cambia
        T.answers[i] = j; Q.saveRun(T); show(true);
      }
      function show(keepScroll) {
        confirmBox.innerHTML = '';
        var it = T.items[S.idx], i = S.idx, locked = training && answered(i);
        paintDots();
        card.innerHTML = '';
        card.appendChild(setText(el('div', { class: 'pq-text' }), (i + 1) + '. ' + it.q, it.user));
        var opts = el('div', { class: 'popts', role: 'radiogroup', 'aria-label': 'Risposte' });
        it.o.forEach(function (op, j) {
          var cls = 'popt' + (T.answers[i] === j ? ' sel' : '');
          if (locked) { if (j === it.c) cls += ' right'; else if (T.answers[i] === j) cls += ' wrong'; }
          var b = el('button', { type: 'button', class: cls, role: 'radio', 'aria-checked': String(T.answers[i] === j) }, [el('span', { class: 'popt-k', text: 'ABCDE'.charAt(j) }), setText(el('span', { class: 'popt-t' }), op, it.user)]);
          b.addEventListener('click', function () { choose(i, j); });
          opts.appendChild(b);
        });
        card.appendChild(opts);
        if (locked) {
          var ok = T.answers[i] === it.c;
          var fb = el('div', { class: 'feedback ' + (ok ? 'ok' : 'no'), 'aria-live': 'polite' });
          fb.innerHTML = (ok ? 'Corretto.' : 'Sbagliato.') + ' <span class="why">' + (it.user ? safe(it.w) : it.w) + '</span>';
          U.texify(fb); card.appendChild(fb);
        }
        nav.innerHTML = '';
        nav.appendChild(U.button('← Indietro', function () { if (S.idx > 0) { S.idx--; show(); } }));
        nav.appendChild(U.button(T.flags[i] ? '★ Da rivedere' : '☆ Segna per rivedere', function () { T.flags[i] = !T.flags[i]; Q.saveRun(T); show(true); }));
        if (i < N - 1) nav.appendChild(U.button('Avanti →', function () { S.idx++; show(); }, 'primary'));
        nav.appendChild(U.button('Consegna', askSubmit, i === N - 1 ? 'primary' : ''));
      }
      function askSubmit() {
        var done = 0, fl = 0, k; for (k = 0; k < N; k++) { if (answered(k)) done++; if (T.flags[k]) fl++; }
        confirmBox.innerHTML = '';
        confirmBox.appendChild(el('div', { class: 'note info' }, [
          el('span', { class: 'ttl', text: 'Consegni la prova? ' }),
          el('span', { text: 'Hai risposto a ' + done + ' domande su ' + N + (done < N ? ' (' + (N - done) + ' senza risposta: valgono 0 punti)' : '') + (fl ? ' e ne hai segnate ' + fl + ' da rivedere' : '') + '. ' }),
          U.button('Sì, consegna', function () { finish(false); }, 'primary'), U.button('Continua', function () { confirmBox.innerHTML = ''; })
        ]));
        confirmBox.scrollIntoView && confirmBox.scrollIntoView({ block: 'nearest' });
      }
      // tasti rapidi: A–E scelgono, ← → scorrono, F segna
      setKeys(function (e) {
        var tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
        var k = e.key.toLowerCase(), it = T.items[S.idx], j = 'abcde'.indexOf(k);
        if (j < 0 && /^[1-5]$/.test(k)) j = parseInt(k, 10) - 1;
        if (j >= 0 && j < it.o.length) { choose(S.idx, j); e.preventDefault(); }
        else if (k === 'arrowright' && S.idx < N - 1) { S.idx++; show(); }
        else if (k === 'arrowleft' && S.idx > 0) { S.idx--; show(); }
        else if (k === 'f') { T.flags[S.idx] = !T.flags[S.idx]; Q.saveRun(T); show(true); }
      });
      // timer
      var dl = deadline();
      function tick() {
        if (!dl) { timerEl.textContent = '⏱ ' + fmtTime((Date.now() - T.startTs) / 1000) + ' (senza limite)'; timerEl.className = 'ptimer'; return; }
        var left = (dl - Date.now()) / 1000;
        if (left <= 0) { finish(true); return; }
        timerEl.textContent = '⏱ ' + fmtTime(left);
        timerEl.className = 'ptimer' + (left < 120 ? ' bad' : left < 300 ? ' warn' : '');
      }
      tick(); S.timer = setInterval(tick, 1000);
      show();
    }
    function rangeTextFor(T) { return 'slide ' + Q.lessonNum(T.from) + '–' + Q.lessonNum(T.to); }

    function finish(auto) {
      var T = S.test, end = Date.now();
      if (T.minutes && end > T.startTs + T.minutes * 60000) end = T.startTs + T.minutes * 60000;
      var res = Q.finish(T, end);
      S.result = { test: T, attempt: res.attempt, score: res.score, auto: !!auto };
      S.view = 'result'; S.filter = 'tutte'; render();
    }

    // ================================================================ RISULTATO
    function renderResult() {
      var R = S.result, T = R.test, sc = R.score, p = pct(sc.correct, sc.total);
      root.appendChild(el('header', { class: 'lesson-head' }, [el('div', { class: 'kicker', text: KIND[T.kind].name + ' · ' + MODE[T.mode] }), el('h1', { text: 'Risultato' })]));
      if (R.auto) root.appendChild(U.note('warn', 'Tempo scaduto.', 'La prova è stata consegnata automaticamente con le risposte date.'));
      root.appendChild(el('div', { class: 'pscore' }, [
        el('div', { class: 'pscore-n ' + (p >= 75 ? 'ok' : p >= 50 ? 'mid' : 'low'), text: sc.correct + ' / ' + sc.total }),
        el('div', { class: 'pscore-d' }, [
          el('div', { html: '<b>' + p + '%</b> di risposte esatte' }),
          el('div', { class: 'small', text: 'Esatte ' + sc.correct + ' · sbagliate ' + sc.wrong + ' · senza risposta ' + sc.blank }),
          el('div', { class: 'small', text: 'Tempo impiegato ' + fmtTime(R.attempt.secs) + (T.minutes ? ' su ' + T.minutes + ':00' : '') })
        ])
      ]));
      // da ripassare
      var byL = {}; T.items.forEach(function (it, i) { if (sc.detail[i] !== 1) byL[it.l] = (byL[it.l] || 0) + 1; });
      var keys = Object.keys(byL).sort(function (a, b) { return Q.lessonIndex(a) - Q.lessonIndex(b); });
      if (keys.length) {
        root.appendChild(el('h3', { class: 'section-title', text: 'Da ripassare' }));
        root.appendChild(el('div', { class: 'related' }, keys.map(function (l) { return el('a', { class: 'chip', href: '#lezione-' + l, text: 'Lezione ' + Q.lessonNum(l) + ' · ' + lessonTitle(l) + ' (' + byL[l] + ')' }); })));
      }
      var wrongItems = T.items.filter(function (it, i) { return sc.detail[i] !== 1; });
      var acts = [];
      if (wrongItems.length) acts.push(U.button('Rifai solo le sbagliate (' + wrongItems.length + ')', function () {
        var t = Q.buildFrom(wrongItems, T.kind, { feedback: 'now' }); S.test = t; S.idx = 0; S.view = 'run'; Q.saveRun(t); render();
      }, 'primary'));
      if (T.kind !== 'all' || T.mode !== 'ripasso') acts.push(U.button('Nuova ' + (T.mode === 'weak' ? 'prova sui miei errori' : 'simulazione'), function () { startTest(T.kind, T.mode === 'ripasso' ? 'random' : T.mode); }));
      acts.push(U.button('Torna alle prove', function () { S.view = 'home'; render(); }));
      root.appendChild(el('div', { class: 'btn-row', style: { margin: '12px 0' } }, acts));

      // correzione
      root.appendChild(el('h2', { class: 'section-title', text: 'Correzione' }));
      var seg = U.seg({ value: S.filter, options: [['tutte', 'tutte'], ['errori', 'sbagliate e saltate'], ['giuste', 'giuste']], onChange: function (v) { S.filter = v; paint(); } });
      root.appendChild(seg.el);
      var list = el('div', { class: 'pcorr' }); root.appendChild(list);
      function paint() {
        list.innerHTML = '';
        T.items.forEach(function (it, i) {
          var ok = sc.detail[i];
          if (S.filter === 'errori' && ok === 1) return;
          if (S.filter === 'giuste' && ok !== 1) return;
          var a = T.answers[i];
          var box = el('div', { class: 'pc ' + (ok === 1 ? 'ok' : ok === 0 ? 'bad' : 'skip') });
          box.appendChild(el('div', { class: 'pc-head' }, [
            el('span', { class: 'pc-n', text: (i + 1) + '.' }),
            el('span', { class: 'pc-r', text: ok === 1 ? '✓ giusta' : ok === 0 ? '✗ sbagliata' : '– senza risposta' }),
            el('a', { class: 'chip', href: '#lezione-' + it.l, text: 'lezione ' + Q.lessonNum(it.l) + (it.t ? ' · ' + it.t : '') }),
            it.p ? el('span', { class: 'chip prof', title: 'La prof ne ha parlato a lezione', text: 'detto a lezione' }) : null
          ]));
          box.appendChild(setText(el('div', { class: 'pc-q' }), it.q, it.user));
          var ul = el('ul', { class: 'pc-o' });
          it.o.forEach(function (op, j) {
            var cls = j === it.c ? 'right' : (j === a ? 'wrong' : '');
            ul.appendChild(el('li', { class: cls }, [el('span', { class: 'popt-k', text: 'ABCDE'.charAt(j) }), setText(el('span'), op, it.user), j === a ? el('span', { class: 'small', text: ' ← tua risposta' }) : null, j === it.c ? el('span', { class: 'small', text: ' ← giusta' }) : null]));
          });
          box.appendChild(ul);
          if (it.w) box.appendChild(setText(el('div', { class: 'pc-w' }), '<b>Perché:</b> ' + it.w, it.user));
          var fb = U.button(Q.isFlagged(it) ? '⚑ Segnalata come dubbia (clic per togliere)' : '⚐ Segnala come dubbia', function () { var on = Q.toggleFlag(it); fb.textContent = on ? '⚑ Segnalata come dubbia (clic per togliere)' : '⚐ Segnala come dubbia'; });
          fb.className += ' btn-flag'; box.appendChild(fb);
          list.appendChild(box);
        });
        if (!list.children.length) list.appendChild(el('p', { class: 'small', text: 'Nessuna domanda in questa categoria.' }));
      }
      paint();
    }

    render();
    return { el: root, destroy: destroy };
  }

  F.quizPage = pageProva;
})(typeof globalThis !== 'undefined' ? globalThis : this);
