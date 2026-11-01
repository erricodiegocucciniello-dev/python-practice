/* Motore delle prove d'esame: archivio, selezione delle domande, punteggio, statistiche e storico.
   Non usa il DOM: si può provare anche in Node (tests/quiz.test.js).

   Una domanda ha: l (id della lezione), t (argomento), q (testo), o (opzioni: LA PRIMA È LA GIUSTA,
   le opzioni vengono rimescolate a ogni prova), w (spiegazione), s (fonte: 'slide', 'prof', 'user'),
   d (difficoltà 1–3, facoltativa), p (0 = nessun legame con le trascrizioni; 1 = argomento trattato a lezione; 2 = la prof ha detto esplicitamente che è d'esame, un errore frequente o un trabocchetto). */
(function (G) {
  'use strict';
  var F = G.Fisio = G.Fisio || {}, Q = F.quiz = F.quiz || {};

  // ------------------------------------------------------------------ lezioni
  Q.LESSON_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '24bis', '24ter', '25', '26', '28', '29', '30'];
  Q.lessonNum = function (id) { return id === '24bis' ? '24-bis' : id === '24ter' ? '24-ter' : id; };
  Q.lessonIndex = function (id) { return Q.LESSON_IDS.indexOf(id); };
  /** Lezioni comprese tra from e to (estremi inclusi, nell'ordine del corso). */
  Q.lessonsBetween = function (from, to) {
    var a = Q.lessonIndex(from), b = Q.lessonIndex(to);
    if (a < 0) a = 0; if (b < 0) b = Q.LESSON_IDS.length - 1;
    if (a > b) { var t = a; a = b; b = t; }
    return Q.LESSON_IDS.slice(a, b + 1);
  };

  // ------------------------------------------------------------------ numeri casuali
  /** Generatore riproducibile (mulberry32). Senza seme usa Math.random. */
  Q.rng = function (seed) {
    var a = (seed === undefined ? Math.floor(Math.random() * 4294967296) : seed) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  Q.hash = function (s) {
    var h = 5381; s = String(s);
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  };
  Q.shuffle = function (arr, rng) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(rng() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  /** Estrae un indice con probabilità proporzionale ai pesi (>= 0). */
  function pickWeighted(weights, rng) {
    var tot = 0, i;
    for (i = 0; i < weights.length; i++) tot += Math.max(0, weights[i]);
    if (tot <= 0) return Math.floor(rng() * weights.length);
    var r = rng() * tot;
    for (i = 0; i < weights.length; i++) { r -= Math.max(0, weights[i]); if (r < 0) return i; }
    return weights.length - 1;
  }

  // ------------------------------------------------------------------ archivio
  Q.bank = [];          // domande dell'archivio incluso nel sito
  Q.gens = [];          // generatori di domande calcolate dal motore (gen.js)
  var knownIds = {};

  /** Aggiunge una domanda. opt: {s: fonte, d: difficoltà, p: 1 se la prof ne ha parlato in modo esplicito}. */
  Q.add = function (l, t, q, o, w, opt) {
    var item = { l: l, t: t, q: q, o: o, w: w || '', s: (opt && opt.s) || 'slide', d: (opt && opt.d) || 2, p: (opt && opt.p) || 0 };
    item.id = 'q' + Q.hash(l + '|' + q);
    if (knownIds[item.id]) throw new Error('Domanda duplicata (' + l + '): ' + q.slice(0, 60));
    knownIds[item.id] = 1;
    Q.bank.push(item);
    return item;
  };
  /** Registra un generatore: make(rng) restituisce {q, o:[giusta, ...], w}. */
  Q.addGen = function (id, l, t, make, opt) {
    Q.gens.push({ id: 'g:' + id, l: l, t: t, make: make, s: 'modello', d: (opt && opt.d) || 2, gen: true });
  };

  // ------------------------------------------------------------------ memoria (browser) con ripiego
  var mem = {}, storage = (function () {
    try { var s = G.localStorage; s.setItem('__t', '1'); s.removeItem('__t'); return s; } catch (e) { return null; }
  })();
  var KEY = 'fisio-quiz-v1';
  Q.storageAvailable = !!storage;

  function defaults() {
    return {
      v: 1,
      settings: {
        n: { p1: 15, p2: 15, all: 30 },
        minutes: { p1: 30, p2: 30, all: 45 },
        range: { p1: ['01', '14'], p2: ['15', '30'], all: ['01', '30'] },
        feedback: 'end'           // 'end' = come all'esame; 'now' = dopo ogni risposta
      },
      attempts: [],
      user: [],
      flagged: [],      // domande segnalate come dubbie: [{id, l, q, o, c, w, ts, note}]
      run: null
    };
  }
  Q.data = defaults();
  Q.stats = {};

  Q.load = function () {
    var raw = null;
    try { raw = storage ? storage.getItem(KEY) : mem[KEY]; } catch (e) { raw = mem[KEY] || null; }
    var d = defaults();
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && p.v === 1) {
          if (p.settings) {
            ['n', 'minutes', 'range'].forEach(function (k) { if (p.settings[k]) Object.keys(d.settings[k]).forEach(function (kk) { if (p.settings[k][kk] !== undefined) d.settings[k][kk] = p.settings[k][kk]; }); });
            if (p.settings.feedback) d.settings.feedback = p.settings.feedback;
          }
          d.attempts = Array.isArray(p.attempts) ? p.attempts : [];
          d.user = Array.isArray(p.user) ? p.user : [];
          d.flagged = Array.isArray(p.flagged) ? p.flagged : [];
          d.run = p.run || null;
        }
      } catch (e) { /* dati rovinati: si riparte da zero senza bloccare il sito */ }
    }
    Q.data = d;
    Q.rebuildStats();
    Q.mergeUserQuestions();
    return d;
  };
  Q.save = function () {
    var s = JSON.stringify(Q.data);
    try { if (storage) storage.setItem(KEY, s); else mem[KEY] = s; return true; } catch (e) { mem[KEY] = s; return false; }
  };

  // ------------------------------------------------------------------ domande aggiunte dall'utente
  Q.userBank = [];
  Q.mergeUserQuestions = function () {
    Q.userBank = [];
    (Q.data.user || []).forEach(function (u) {
      if (Q.validateQuestion(u).errors.length === 0) {
        var it = { l: u.l, t: u.t || 'domanda aggiunta', q: u.q, o: u.o, w: u.w || '', s: 'user', d: 2, p: 0, id: u.id || ('u' + Q.hash(u.l + '|' + u.q)), user: 1 };
        Q.userBank.push(it);
      }
    });
  };
  /** Tutte le domande utilizzabili (archivio + aggiunte). */
  Q.allQuestions = function () { return Q.bank.concat(Q.userBank); };

  var BAD_PHRASES = /tutte le (precedenti|altre|risposte)|nessuna delle (precedenti|altre)|entrambe le precedenti|\ba e b\b|le prime due|la prima e la seconda/i;
  /** Controlla una domanda (archivio o aggiunta dall'utente). Restituisce {errors, warnings, q: domanda normalizzata}. */
  Q.validateQuestion = function (raw) {
    var errors = [], warnings = [], x = raw || {};
    var l = String(x.l !== undefined ? x.l : (x.lezione !== undefined ? x.lezione : '')).trim().replace(/\s+/g, '').replace(/^0*(\d)$/, '0$1').replace('-', '').toLowerCase();
    var q = String(x.q !== undefined ? x.q : (x.domanda !== undefined ? x.domanda : '')).trim();
    var o = x.o !== undefined ? x.o : x.opzioni;
    var w = String(x.w !== undefined ? x.w : (x.spiegazione !== undefined ? x.spiegazione : '')).trim();
    var t = String(x.t !== undefined ? x.t : (x.argomento !== undefined ? x.argomento : '')).trim();
    if (Q.LESSON_IDS.indexOf(l) < 0) errors.push('lezione «' + (x.l !== undefined ? x.l : x.lezione) + '» non valida (usa 01–26, 24bis, 24ter, 28, 29, 30)');
    if (q.length < 12) errors.push('testo della domanda troppo corto');
    if (!Array.isArray(o)) errors.push('mancano le opzioni');
    else {
      o = o.map(function (s) { return String(s).trim(); });
      if (o.length < 3 || o.length > 5) errors.push('servono da 3 a 5 opzioni (meglio 4), ce ne sono ' + o.length);
      if (o.some(function (s) { return !s; })) errors.push('c\'è un\'opzione vuota');
      var low = o.map(function (s) { return s.toLowerCase(); });
      if (low.some(function (s, i) { return low.indexOf(s) !== i; })) errors.push('due opzioni sono uguali');
      if (o.some(function (s) { return BAD_PHRASES.test(s); })) errors.push('opzione del tipo «tutte le precedenti»: le opzioni vengono rimescolate, non usarle');
      if (o.length !== 4 && o.length >= 3 && o.length <= 5) warnings.push('meglio 4 opzioni');
    }
    if (!w) warnings.push('manca la spiegazione');
    return { errors: errors, warnings: warnings, q: { l: l, t: t, q: q, o: o, w: w } };
  };

  // ------------------------------------------------------------------ statistiche (derivate dallo storico)
  /** Ricostruisce le statistiche per domanda a partire dai tentativi: s = viste, w = errori, k = saltate,
      last = 1 se l'ultima risposta era giusta, 0 se sbagliata o saltata, streak = giuste di fila. */
  Q.rebuildStats = function () {
    var st = {}, att = (Q.data.attempts || []).slice().sort(function (a, b) { return a.ts - b.ts; });
    att.forEach(function (a) {
      (a.items || []).forEach(function (it) {
        var s = st[it.id] || (st[it.id] = { s: 0, w: 0, k: 0, last: null, streak: 0, ts: 0, l: it.l });
        s.s++; s.ts = a.ts;
        if (it.ok === 1) { s.last = 1; s.streak++; }
        else { s.last = 0; s.streak = 0; if (it.ok === 0) s.w++; else s.k++; }
      });
    });
    Q.stats = st;
    return st;
  };

  /** Percentuale di risposte giuste per lezione: [{l, seen, bank, right, wrong, pct}] */
  Q.lessonStats = function () {
    var out = {};
    Q.LESSON_IDS.forEach(function (l) { out[l] = { l: l, bank: 0, seen: 0, right: 0, wrong: 0 }; });
    Q.allQuestions().forEach(function (q) { if (out[q.l]) out[q.l].bank++; });
    Q.gens.forEach(function (g) { if (out[g.l]) out[g.l].bank++; });
    Object.keys(Q.stats).forEach(function (id) {
      var s = Q.stats[id], o = out[s.l]; if (!o) return;
      o.seen++; o.right += s.s - s.w - s.k; o.wrong += s.w + s.k;
    });
    return Q.LESSON_IDS.map(function (l) { var o = out[l]; o.pct = (o.right + o.wrong) ? o.right / (o.right + o.wrong) : null; return o; });
  };

  // ------------------------------------------------------------------ selezione
  /** Voci disponibili in un intervallo di lezioni: domande fisse e generatori. */
  Q.pool = function (from, to) {
    var ls = Q.lessonsBetween(from, to), set = {};
    ls.forEach(function (l) { set[l] = 1; });
    return Q.allQuestions().concat(Q.gens).filter(function (e) { return set[e.l]; });
  };

  function entryStat(e) { return Q.stats[e.id] || null; }

  /** Prova casuale: una domanda per lezione a turno (così nessun argomento resta fuori),
      con una leggera preferenza per le domande mai viste. */
  Q.selectRandom = function (pool, n, rng) {
    var by = {}, ls, out = [];
    pool.forEach(function (e) { (by[e.l] = by[e.l] || []).push(e); });
    n = Math.min(n, pool.length);
    while (out.length < n) {
      ls = Q.shuffle(Object.keys(by).filter(function (l) { return by[l].length; }), rng);
      if (!ls.length) break;
      for (var i = 0; i < ls.length && out.length < n; i++) {
        var list = by[ls[i]], w = list.map(function (e) { var s = entryStat(e); return !s ? 3 : (s.last === 0 ? 1.5 : 1); });
        out.push(list.splice(pickWeighted(w, rng), 1)[0]);
      }
    }
    return Q.shuffle(out, rng);
  };

  /** Prova «sui miei errori»: circa 60% domande sbagliate di recente o spesso (più peso alle lezioni deboli),
      25% domande nuove, 15% ripasso di domande già indovinate. Se una fascia è vuota si riempie con le altre. */
  Q.selectWeak = function (pool, n, rng) {
    n = Math.min(n, pool.length);
    var lst = {}; Q.lessonStats().forEach(function (o) { lst[o.l] = o; });
    var lessonWeak = function (l) { var o = lst[l]; if (!o) return 1; var e = (o.wrong + 1) / (o.right + o.wrong + 2); return 0.5 + 1.5 * e; };
    var buckets = { weak: [], nuova: [], ok: [] };
    pool.forEach(function (e) {
      var s = entryStat(e);
      if (!s) buckets.nuova.push(e);
      else if (s.last === 0 || (s.w + s.k) / s.s >= 0.5 && s.streak < 2) buckets.weak.push(e);
      else buckets.ok.push(e);
    });
    var weightOf = function (e, kind) {
      var s = entryStat(e), lw = lessonWeak(e.l);
      if (kind === 'weak') return (1 + s.w + 0.5 * s.k) * Math.pow(0.5, s.streak || 0) * lw * (s.last === 0 ? 2 : 1);
      if (kind === 'ok') return lw / (1 + s.streak);
      return lw;
    };
    var target = { weak: Math.round(n * 0.6), nuova: Math.round(n * 0.25) };
    target.ok = n - target.weak - target.nuova;
    var out = [], taken = { weak: 0, nuova: 0, ok: 0 }, lessonCount = {};
    function take(kind, count) {
      var list = buckets[kind];
      while (count > 0 && list.length) {
        var w = list.map(function (e) { return weightOf(e, kind) * Math.pow(0.6, lessonCount[e.l] || 0); });
        var e = list.splice(pickWeighted(w, rng), 1)[0];
        out.push(e); taken[kind]++; lessonCount[e.l] = (lessonCount[e.l] || 0) + 1; count--;
      }
      return count;
    }
    var missing = 0;
    ['weak', 'nuova', 'ok'].forEach(function (k) { missing += take(k, target[k]); });
    // ridistribuisce ciò che manca: prima le sbagliate, poi le nuove, poi il ripasso
    ['weak', 'nuova', 'ok'].forEach(function (k) { if (missing > 0) missing = take(k, missing); });
    var res = Q.shuffle(out, rng); res.kinds = taken;
    return res;
  };

  /** Trasforma una voce dell'archivio o un generatore in una domanda pronta da mostrare (opzioni rimescolate). */
  Q.instantiate = function (e, rng) {
    var src = e.gen ? e.make(rng) : e, opts = src.o.slice(), correct = src.o[0], shuffled = Q.shuffle(opts, rng);
    return {
      id: e.id, l: e.l, t: e.t, q: src.q, o: shuffled, c: shuffled.indexOf(correct),
      w: src.w || '', s: e.s, d: e.d || 2, p: e.p || 0, gen: e.gen ? 1 : 0, user: e.user ? 1 : 0
    };
  };

  /** Prepara una prova. kind: 'p1' | 'p2' | 'all'; mode: 'random' | 'weak'. opt: {n, from, to, rng}. */
  Q.build = function (kind, mode, opt) {
    var S = Q.data.settings, o = opt || {}, rng = o.rng || Q.rng();
    var from = o.from || S.range[kind][0], to = o.to || S.range[kind][1], n = o.n || S.n[kind];
    var pool = Q.pool(from, to);
    var chosen = mode === 'weak' ? Q.selectWeak(pool, n, rng) : Q.selectRandom(pool, n, rng);
    return {
      id: 'a' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36),
      kind: kind, mode: mode, from: from, to: to, n: chosen.length, wanted: n,
      minutes: o.minutes !== undefined ? o.minutes : S.minutes[kind],
      feedback: o.feedback || S.feedback,
      items: chosen.map(function (e) { return Q.instantiate(e, rng); }),
      answers: [], flags: [], startTs: Date.now(), kinds: chosen.kinds || null
    };
  };

  /** Prova con una lista precisa di domande (per «rifai le sbagliate»). */
  Q.buildFrom = function (items, kind, opt) {
    var S = Q.data.settings, rng = (opt && opt.rng) || Q.rng();
    return {
      id: 'a' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36),
      kind: kind || 'all', mode: 'ripasso', from: '01', to: '30', n: items.length, wanted: items.length,
      minutes: 0, feedback: (opt && opt.feedback) || S.feedback,
      items: items.map(function (it) {
        var e = it.gen ? Q.gens.filter(function (g) { return g.id === it.id; })[0] : Q.allQuestions().filter(function (x) { return x.id === it.id; })[0];
        return e ? Q.instantiate(e, rng) : it;
      }),
      answers: [], flags: [], startTs: Date.now()
    };
  };

  // ------------------------------------------------------------------ correzione
  /** Punteggio: 1 punto per risposta giusta, nessuna penalità. answers[i] = indice scelto o undefined/null. */
  Q.score = function (test) {
    var correct = 0, wrong = 0, blank = 0, detail = [];
    test.items.forEach(function (it, i) {
      var a = test.answers[i];
      var ok = (a === undefined || a === null) ? null : (a === it.c ? 1 : 0);
      if (ok === 1) correct++; else if (ok === 0) wrong++; else blank++;
      detail.push(ok);
    });
    return { correct: correct, wrong: wrong, blank: blank, total: test.items.length, detail: detail };
  };

  /** Registra la prova conclusa nello storico e aggiorna le statistiche. */
  Q.finish = function (test, endTs) {
    var sc = Q.score(test), end = endTs || Date.now();
    var attempt = {
      id: test.id, ts: end, kind: test.kind, mode: test.mode, from: test.from, to: test.to,
      n: test.items.length, correct: sc.correct, secs: Math.max(1, Math.round((end - test.startTs) / 1000)),
      limit: test.minutes || 0,
      items: test.items.map(function (it, i) { return { id: it.id, l: it.l, ok: sc.detail[i] }; })
    };
    Q.data.attempts.push(attempt);
    Q.data.run = null;
    Q.rebuildStats();
    Q.save();
    return { attempt: attempt, score: sc };
  };

  /** Domande sbagliate più spesso: [{id, l, w, s}] (dalle statistiche, solo quelle ancora presenti nell'archivio). */
  Q.worstQuestions = function (limit) {
    var byId = {}; Q.allQuestions().concat(Q.gens).forEach(function (e) { byId[e.id] = e; });
    return Object.keys(Q.stats).map(function (id) { var s = Q.stats[id]; return { id: id, l: s.l, w: s.w + s.k, s: s.s, e: byId[id] }; })
      .filter(function (x) { return x.e && x.w > 0; })
      .sort(function (a, b) { return (b.w / b.s - a.w / a.s) || (b.w - a.w); })
      .slice(0, limit || 10);
  };

  // ------------------------------------------------------------------ esporta / importa
  Q.exportJSON = function () {
    return JSON.stringify({
      app: 'fisiologia-prove', v: 1, exportedAt: new Date().toISOString(),
      settings: Q.data.settings, attempts: Q.data.attempts, user: Q.data.user, flagged: Q.data.flagged
    }, null, 1);
  };
  /** Unisce un file esportato con i dati attuali (senza duplicare i tentativi). Restituisce un riassunto. */
  Q.importJSON = function (text) {
    var p;
    try { p = JSON.parse(text); } catch (e) { throw new Error('Il testo non è un file di storico valido (JSON non leggibile).'); }
    if (!p || p.app !== 'fisiologia-prove' || p.v !== 1 || !Array.isArray(p.attempts)) throw new Error('Questo non sembra un file esportato da questa pagina.');
    var have = {}, addedA = 0, addedU = 0;
    Q.data.attempts.forEach(function (a) { have[a.id] = 1; });
    p.attempts.forEach(function (a) {
      if (a && a.id && Array.isArray(a.items) && !have[a.id]) { Q.data.attempts.push(a); have[a.id] = 1; addedA++; }
    });
    var haveU = {}; Q.data.user.forEach(function (u) { haveU[u.id || ('u' + Q.hash(u.l + '|' + u.q))] = 1; });
    (p.user || []).forEach(function (u) {
      var v = Q.validateQuestion(u);
      if (v.errors.length) return;
      var id = u.id || ('u' + Q.hash(v.q.l + '|' + v.q.q));
      if (!haveU[id]) { Q.data.user.push({ id: id, l: v.q.l, t: v.q.t, q: v.q.q, o: v.q.o, w: v.q.w }); haveU[id] = 1; addedU++; }
    });
    Q.data.flagged = Q.data.flagged || [];
    var haveF = {}; Q.data.flagged.forEach(function (f) { haveF[f.id + '|' + f.q] = 1; });
    (p.flagged || []).forEach(function (f) { if (f && f.q && Array.isArray(f.o) && !haveF[f.id + '|' + f.q]) { Q.data.flagged.push(f); haveF[f.id + '|' + f.q] = 1; } });
    Q.rebuildStats(); Q.mergeUserQuestions(); Q.save();
    return { attempts: addedA, user: addedU, total: Q.data.attempts.length };
  };

  /** Aggiunge domande scritte dall'utente (testo JSON: lista o singolo oggetto). */
  Q.addUserQuestions = function (text) {
    var arr;
    try { arr = JSON.parse(text); } catch (e) { throw new Error('Il testo non è un JSON valido. Controlla di aver incollato solo la lista tra parentesi quadre [ ... ].'); }
    if (!Array.isArray(arr)) arr = [arr];
    var good = [], report = [], seen = {};
    Q.allQuestions().forEach(function (q) { seen[q.id] = 1; });
    arr.forEach(function (x, i) {
      var v = Q.validateQuestion(x), n = i + 1;
      if (v.errors.length) { report.push({ n: n, ok: false, msg: v.errors.join('; ') }); return; }
      var id = 'u' + Q.hash(v.q.l + '|' + v.q.q);
      if (seen[id]) { report.push({ n: n, ok: false, msg: 'domanda già presente' }); return; }
      seen[id] = 1;
      good.push({ id: id, l: v.q.l, t: v.q.t, q: v.q.q, o: v.q.o, w: v.q.w });
      report.push({ n: n, ok: true, msg: v.warnings.length ? v.warnings.join('; ') : 'ok' });
    });
    return { good: good, report: report };
  };
  Q.commitUserQuestions = function (good) {
    good.forEach(function (g) { Q.data.user.push(g); });
    Q.mergeUserQuestions(); Q.save();
  };
  Q.clearUserQuestions = function () { Q.data.user = []; Q.mergeUserQuestions(); Q.save(); };
  Q.resetHistory = function () { Q.data.attempts = []; Q.data.run = null; Q.rebuildStats(); Q.save(); };

  // ------------------------------------------------------------------ domande segnalate come dubbie
  /** Segnala (o toglie la segnalazione a) una domanda vista in una prova: si salva il testo com'era, con la risposta giusta. */
  Q.toggleFlag = function (it) {
    var i = -1; Q.data.flagged = Q.data.flagged || [];
    Q.data.flagged.forEach(function (f, k) { if (f.id === it.id && f.q === it.q) i = k; });
    if (i >= 0) { Q.data.flagged.splice(i, 1); Q.save(); return false; }
    Q.data.flagged.push({ id: it.id, l: it.l, t: it.t || '', q: it.q, o: it.o, c: it.c, w: it.w || '', ts: Date.now() });
    Q.save(); return true;
  };
  Q.isFlagged = function (it) { return (Q.data.flagged || []).some(function (f) { return f.id === it.id && f.q === it.q; }); };

  // ------------------------------------------------------------------ prova in corso (per riprenderla dopo un aggiornamento della pagina)
  Q.saveRun = function (test) { Q.data.run = test; Q.save(); };
  Q.clearRun = function () { Q.data.run = null; Q.save(); };

  /** Prompt da dare a un altro assistente per scrivere nuove domande nel formato accettato. */
  Q.PROMPT = [
    'Scrivi domande d\'esame a risposta multipla (una sola risposta giusta) per il corso di Fisiologia Generale, ',
    'a partire dal testo che ti incollo qui sotto. Stile: la docente non chiede calcoli lunghi, ma definizioni precise, ',
    'il significato delle formule, come si comporta una grandezza quando ne cambia un\'altra e trabocchetti concettuali ',
    '(per esempio la differenza tra «tela fosfolipidica» e «membrana plasmatica»).\n\n',
    'Rispondi SOLO con una lista JSON, senza altro testo, in questo formato:\n',
    '[\n  {\n    "l": "13",\n    "t": "Nernst",\n    "q": "Testo della domanda?",\n',
    '    "o": ["opzione GIUSTA (sempre la prima)", "errata plausibile", "errata plausibile", "errata plausibile"],\n',
    '    "w": "Spiegazione breve del perché la prima è giusta e le altre no."\n  }\n]\n\n',
    'Regole: "l" è il numero della lezione (01–26, 24bis, 24ter, 28, 29, 30); 4 opzioni; la PRIMA è sempre quella corretta ',
    '(il sito le rimescola); niente opzioni come «tutte le precedenti»; le opzioni errate devono essere plausibili e di lunghezza simile; ',
    'non inventare numeri che non compaiono nel testo; scrivi in italiano.\n\nTESTO DA CUI PARTIRE:\n'
  ].join('');
})(typeof globalThis !== 'undefined' ? globalThis : this);
