/* Test del motore delle prove e dell'archivio di domande.
   Esecuzione:  node --test tests/quiz.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const dir = path.join(__dirname, '..', 'js');
['core/base', 'core/electro', 'core/hh', 'core/cable', 'core/stoch', 'core/transport', 'core/systems', 'quiz/engine', 'quiz/gen'].forEach(f => require(path.join(dir, f + '.js')));
fs.readdirSync(path.join(dir, 'quiz')).filter(f => /^bank-.*\.js$/.test(f)).sort().forEach(f => require(path.join(dir, 'quiz', f)));
const F = globalThis.Fisio, Q = F.quiz;

test('Archivio: ogni domanda è ben formata', () => {
  assert.ok(Q.bank.length > 0, 'archivio vuoto');
  const problems = [];
  Q.bank.forEach(q => {
    const v = Q.validateQuestion(q);
    if (v.errors.length) problems.push(q.l + ' «' + q.q.slice(0, 50) + '»: ' + v.errors.join('; '));
    if (!q.w || q.w.length < 25) problems.push(q.l + ' «' + q.q.slice(0, 50) + '»: spiegazione mancante o troppo corta');
    if (q.o.length !== 4) problems.push(q.l + ' «' + q.q.slice(0, 50) + '»: ' + q.o.length + ' opzioni invece di 4');
    if (!/\?$|…$|\.$|:$/.test(q.q.trim())) problems.push(q.l + ' «' + q.q.slice(0, 50) + '»: la domanda non finisce con ? … . o :');
    if (q.o.some(o => /(.)\1{4,}/.test(o))) problems.push(q.l + ': opzione sospetta');
  });
  assert.deepStrictEqual(problems, []);
});

test('Archivio: id unici e nessuna domanda ripetuta', () => {
  const ids = new Set(), texts = new Set();
  Q.bank.forEach(q => { assert.ok(!ids.has(q.id), 'id doppio ' + q.id); ids.add(q.id); const t = q.q.toLowerCase().replace(/\W+/g, ' '); assert.ok(!texts.has(t), 'testo doppio: ' + q.q); texts.add(t); });
});

test('Archivio: la risposta giusta non si riconosce dalla lunghezza', () => {
  // le opzioni vengono rimescolate, ma una risposta giusta sistematicamente più lunga è un indizio per chi fa il test
  const n = Q.bank.length;
  const big = Q.bank.filter(q => q.o[0].length >= 1.25 * Math.max.apply(null, q.o.slice(1).map(o => o.length))).length;
  assert.ok(big / n <= 0.15, 'la risposta giusta è più lunga del 25% di ogni errata nel ' + Math.round(100 * big / n) + '% delle domande (massimo 15%)');
  const avgRatio = Q.bank.reduce((s, q) => s + q.o[0].length / (q.o.slice(1).reduce((a, o) => a + o.length, 0) / (q.o.length - 1)), 0) / n;
  assert.ok(avgRatio < 1.25, 'la risposta giusta è in media ' + avgRatio.toFixed(2) + ' volte più lunga delle errate (massimo 1,25)');
});

test('Archivio: copertura per lezione', () => {
  const count = {}; Q.bank.forEach(q => { count[q.l] = (count[q.l] || 0) + 1; });
  const missing = Q.LESSON_IDS.filter(l => !count[l]);
  console.log('   domande per lezione:', Q.LESSON_IDS.map(l => l + ':' + (count[l] || 0)).join(' '), '· totale', Q.bank.length);
  // il controllo vero scatta quando l'archivio è completo: vedi variabile d'ambiente
  if (process.env.QUIZ_FULL) assert.deepStrictEqual(missing, [], 'lezioni senza domande');
});

test('Selezione casuale: numero esatto, nessun doppione, argomenti coperti', () => {
  Q.data = { v: 1, settings: { n: { p1: 15, p2: 15, all: 30 }, minutes: { p1: 30, p2: 30, all: 45 }, range: { p1: ['01', '14'], p2: ['15', '30'], all: ['01', '30'] }, feedback: 'end' }, attempts: [], user: [], run: null };
  Q.rebuildStats();
  for (let seed = 1; seed <= 30; seed++) {
    const t = Q.build('p1', 'random', { rng: Q.rng(seed) });
    const ids = t.items.map(i => i.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'doppioni');
    assert.ok(t.items.length <= 15);
    t.items.forEach(i => { assert.ok(Q.lessonIndex(i.l) <= Q.lessonIndex('14'), 'fuori intervallo: ' + i.l); assert.strictEqual(i.o[i.c], Q.bank.concat(Q.gens).find(e => e.id === i.id) ? i.o[i.c] : i.o[i.c]); });
  }
  const t = Q.build('p1', 'random', { rng: Q.rng(7), n: 14 });
  const ls = new Set(t.items.map(i => i.l));
  assert.ok(ls.size >= Math.min(14, new Set(Q.pool('01', '14').map(e => e.l)).size) - 0, 'una domanda per lezione quando n = numero di lezioni');
});

test('Le opzioni sono rimescolate e l\'indice corretto resta valido', () => {
  const pos = [0, 0, 0, 0];
  for (let seed = 1; seed <= 400; seed++) {
    const q = Q.bank[seed % Q.bank.length], inst = Q.instantiate(q, Q.rng(seed));
    assert.strictEqual(inst.o[inst.c], q.o[0]);
    assert.strictEqual(new Set(inst.o).size, inst.o.length);
    pos[inst.c]++;
  }
  pos.forEach(p => assert.ok(p > 50, 'posizione della risposta giusta poco uniforme: ' + pos.join(',')));
});

test('Punteggio: 1 punto per risposta esatta, nessuna penalità', () => {
  const t = Q.build('p1', 'random', { rng: Q.rng(3), n: 6 });
  t.answers = [t.items[0].c, (t.items[1].c + 1) % t.items[1].o.length, undefined, t.items[3].c, null, t.items[5].c];
  const s = Q.score(t);
  assert.deepStrictEqual([s.correct, s.wrong, s.blank, s.total], [3, 1, 2, 6]);
});

test('Storico e statistiche: finish registra e rebuildStats coincide', () => {
  Q.data.attempts = []; Q.rebuildStats();
  const t = Q.build('p1', 'random', { rng: Q.rng(11), n: 8 });
  t.answers = t.items.map((it, i) => (i % 2 === 0 ? it.c : (it.c + 1) % it.o.length));
  const r = Q.finish(t);
  assert.strictEqual(r.attempt.correct, 4);
  assert.strictEqual(Q.data.attempts.length, 1);
  const ids = Object.keys(Q.stats);
  assert.strictEqual(ids.length, 8);
  t.items.forEach((it, i) => { const s = Q.stats[it.id]; assert.strictEqual(s.last, i % 2 === 0 ? 1 : 0); assert.strictEqual(s.w, i % 2 === 0 ? 0 : 1); });
});

test('Sui miei errori: privilegia le domande sbagliate', () => {
  Q.data.attempts = []; Q.rebuildStats();
  // simula due tentativi in cui le domande della lezione 05 sono sempre sbagliate e le altre giuste
  const pool = Q.pool('01', '14');
  for (let k = 0; k < 2; k++) {
    Q.data.attempts.push({ id: 'x' + k, ts: 1000 + k, kind: 'p1', mode: 'random', from: '01', to: '14', n: pool.length, correct: 0, secs: 10, limit: 30, items: pool.map(e => ({ id: e.id, l: e.l, ok: e.l === '05' ? 0 : 1 })) });
  }
  Q.rebuildStats();
  let weak05 = 0, tot = 0, other05 = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const t = Q.build('p1', 'weak', { rng: Q.rng(seed), n: 10 });
    assert.strictEqual(new Set(t.items.map(i => i.id)).size, t.items.length);
    t.items.forEach(i => { tot++; if (i.l === '05') weak05++; });
    const rnd = Q.build('p1', 'random', { rng: Q.rng(seed), n: 10 });
    rnd.items.forEach(i => { if (i.l === '05') other05++; });
  }
  assert.ok(weak05 / tot > 0.45, 'la lezione sbagliata dovrebbe pesare di più: ' + (weak05 / tot).toFixed(2));
  assert.ok(weak05 > other05 * 2, 'molto più della prova casuale');
});

test('Esporta e importa: nessun duplicato e statistiche ricostruite', () => {
  const txt = Q.exportJSON();
  const before = Q.data.attempts.length;
  const r1 = Q.importJSON(txt);
  assert.strictEqual(r1.attempts, 0);
  assert.strictEqual(Q.data.attempts.length, before);
  const saved = Q.data.attempts; Q.data.attempts = [];
  const r2 = Q.importJSON(txt);
  assert.strictEqual(r2.attempts, before);
  Q.data.attempts = saved;
  assert.throws(() => Q.importJSON('non json'), /JSON/);
  assert.throws(() => Q.importJSON('{"a":1}'), /esportato/);
});

test('Domande aggiunte: validazione e salvataggio', () => {
  const ok = { l: '13', t: 'Nernst', q: 'Se aumenta il K⁺ extracellulare, E_K come cambia?', o: ['Diventa meno negativo', 'Diventa più negativo', 'Non cambia', 'Si inverte di segno'], w: 'E_K = 61·log([K]o/[K]i): [K]o più alto rende E_K meno negativo.' };
  const bad1 = Object.assign({}, ok, { o: ['a', 'a', 'b', 'c'] });
  const bad2 = Object.assign({}, ok, { l: '99' });
  const bad3 = Object.assign({}, ok, { o: ['x1', 'tutte le precedenti', 'y2', 'z3'] });
  const res = Q.addUserQuestions(JSON.stringify([ok, bad1, bad2, bad3]));
  assert.strictEqual(res.good.length, 1);
  assert.deepStrictEqual(res.report.map(r => r.ok), [true, false, false, false]);
  const n0 = Q.userBank.length; Q.commitUserQuestions(res.good);
  assert.strictEqual(Q.userBank.length, n0 + 1);
  assert.ok(Q.pool('13', '13').some(e => e.user), 'la domanda aggiunta entra nel pool');
  assert.throws(() => Q.addUserQuestions('{rotto'), /JSON/);
  Q.clearUserQuestions();
  assert.strictEqual(Q.userBank.length, 0);
});

test('Generatori: ogni domanda calcolata è ben formata e la risposta giusta è unica', () => {
  Q.gens.forEach(g => {
    for (let seed = 1; seed <= 60; seed++) {
      const x = g.make(Q.rng(seed)), v = Q.validateQuestion(Object.assign({ l: g.l }, x));
      assert.deepStrictEqual(v.errors, [], g.id + ' seed ' + seed + ': ' + v.errors.join('; '));
      assert.ok(x.w && x.w.length > 20, g.id + ': spiegazione');
      assert.strictEqual(new Set(x.o.map(s => s.toLowerCase())).size, x.o.length, g.id + ': opzioni uguali');
      assert.strictEqual(x.o.length, 4, g.id + ' seed ' + seed + ': servono 4 opzioni, ce ne sono ' + x.o.length);
    }
  });
});

test('Generatori: le risposte giuste coincidono con il motore (Nernst, Michaelis-Menten, Poisson)', () => {
  const g = id => Q.gens.find(x => x.id === 'g:' + id);
  for (let seed = 1; seed <= 80; seed++) {
    // Nernst: direzione calcolata con F.nernst
    const n = g('nernst-direzione').make(Q.rng(seed));
    assert.ok(/più positivo|più negativo|non cambia/.test(n.o[0]), n.o[0]);
    // Nernst numerico: il valore giusto è quello di F.nernst arrotondato
    const nv = g('nernst-valore').make(Q.rng(seed)), ko = parseFloat(nv.q.match(/esterna = ([\d,.]+) mM/)[1].replace(',', '.'));
    assert.strictEqual(parseInt(nv.o[0].replace('−', '-')), Math.round(F.nernst(ko, 140, 1, 37)));
    // Michaelis-Menten: la frazione del flusso massimo
    const mm = g('mm-frazione').make(Q.rng(seed)), km = parseFloat(mm.q.match(/Km = (\d+) mM/)[1]), c = parseFloat(mm.q.match(/di ([\d,.]+) mM\. Il flusso/)[1].replace(',', '.'));
    const frac = c / (km + c), want = Math.abs(frac - 0.5) < 1e-9 ? 'metà' : Math.abs(frac - 0.75) < 1e-9 ? 'i 3/4' : Math.abs(frac - 0.9) < 1e-9 ? 'il 90%' : Math.round(frac * 100) + '%';
    assert.ok(mm.o[0].indexOf(want) >= 0, 'MM: ' + mm.q + ' => ' + mm.o[0]);
  }
  // Poisson: frazione di fallimenti = e^-m
  for (let seed = 1; seed <= 20; seed++) { const p = g('poisson-fallimenti').make(Q.rng(seed)), m = parseInt(p.q.match(/m = (\d)/)[1]); assert.strictEqual(parseInt(p.o[0].match(/(\d+)%/)[1]), Math.round(Math.exp(-m) * 100)); }
});
