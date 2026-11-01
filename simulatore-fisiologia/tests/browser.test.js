/* Test nel browser (Playwright + Chromium).
   Esecuzione:  node tests/browser.test.js [cartella-screenshot]
   Apre ogni lezione e ogni simulatore, fa scorrere la pagina per caricare tutti i simulatori
   e verifica: nessun errore JavaScript, nessun "NaN"/"undefined" nel testo visibile,
   ogni simulatore montato senza errori, grafici non vuoti, domande "Prevedi" funzionanti,
   riquadro «Cosa sta succedendo» presente e tutte le prove interattive eseguibili senza errori. */
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright non disponibile: ' + e.message); process.exit(2); }

const root = path.resolve(__dirname, '..');
const url = 'file://' + path.join(root, 'index.html');
const shotDir = process.argv[2];
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(url);
  await page.waitForTimeout(500);
  const lessons = await page.evaluate(() => Fisio.LESSONS.map(l => ({ id: l.id, sims: l.sims.map(s => s.id) })));
  const sims = await page.evaluate(() => Object.keys(Fisio.sims));
  const used = new Set(lessons.flatMap(l => l.sims));
  const unknown = [...used].filter(s => !sims.includes(s));
  const failures = [];
  if (unknown.length) failures.push('Simulatori citati ma non registrati: ' + unknown.join(', '));
  console.log(`Lezioni: ${lessons.length}, simulatori: ${sims.length}`);

  const routes = [{ r: 'inizio', name: 'home' }, { r: 'prova', name: 'prova' }]
    .concat(lessons.map(l => ({ r: 'lezione-' + l.id, name: 'lezione_' + l.id })))
    .concat(sims.map(s => ({ r: 'sim-' + s, name: 'sim_' + s })));

  for (const { r, name } of routes) {
    errors = [];
    await page.goto(url + '#' + r);
    await page.waitForTimeout(250);
    // i simulatori si montano quando entrano nella finestra e la pagina si allunga: si ricalcola l'altezza a ogni passo
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)) + 800; y += 500) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(110); }
    await page.waitForTimeout(700);
    const res = await page.evaluate(() => {
      const txt = document.getElementById('content').innerText;
      const bad = [];
      if (/\bNaN\b/.test(txt)) bad.push('NaN nel testo');
      if (/\bundefined\b/.test(txt)) bad.push('undefined nel testo');
      if (txt.indexOf('Errore nel simulatore') >= 0) bad.push('errore di montaggio di un simulatore');
      if (txt.indexOf('Simulatore non trovato') >= 0) bad.push('simulatore non trovato');
      if (txt.indexOf('Caricamento del simulatore') >= 0) bad.push('simulatore non caricato');
      // grafici 2D vuoti
      let blank = 0, total = 0;
      document.querySelectorAll('.plot canvas, canvas.canvas2d').forEach(c => {
        if (c.offsetParent === null || c.width === 0) return;
        total++;
        const ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++;
        if (n < 20) blank++;
      });
      return { bad, blank, total, sims: document.querySelectorAll('.sim').length, webgl: document.querySelectorAll('.view3d canvas').length };
    });
    // prova la prima domanda "Prevedi" (se c'è)
    const pred = await page.$('.predict .choice');
    if (pred) { await pred.click(); const fb = await page.$eval('.predict .feedback', e => e.textContent.length); if (!fb) res.bad.push('feedback della domanda vuoto'); }
    // riquadro «Cosa sta succedendo» e prove interattive (solo nelle pagine dei simulatori)
    if (r.indexOf('sim-') === 0) {
      if (!(await page.$('.explain'))) res.bad.push('manca il riquadro di spiegazione');
      else {
        const liveOk = await page.$eval('.explain', e => { const l = e.querySelector('.ex-live'); return !l || l.textContent.trim().length > 40; });
        if (!liveOk) res.bad.push('testo «Cosa sta succedendo» vuoto');
        const n = await page.$$eval('.ex-btn', b => b.length);
        if (n < 2) res.bad.push('meno di 2 prove interattive');
        for (let i = 0; i < n; i++) {
          const btn = (await page.$$('.ex-btn'))[i], label = (await btn.innerText()).trim();
          await btn.click(); await page.waitForTimeout(350);
          const out = await page.$eval('.explain', e => {
            const rr = e.querySelector('.ex-result'), t = e.innerText;
            return { shown: !!rr && !rr.hidden && rr.innerText.trim().length > 10, bad: /\bNaN\b|\bundefined\b|Infinity/.test(t) };
          });
          if (!out.shown) res.bad.push('prova «' + label + '» senza risultato');
          if (out.bad) res.bad.push('prova «' + label + '»: NaN/undefined nel testo');
        }
        res.explain = n;
      }
    }
    const realErr = errors.filter(e => !/GPU stall|GL Driver|WebGL/i.test(e));
    if (realErr.length) res.bad.push('errori JS: ' + realErr.slice(0, 3).join(' | '));
    if (res.blank) res.bad.push(res.blank + '/' + res.total + ' grafici vuoti');
    const ok = res.bad.length === 0;
    console.log(`${ok ? 'OK ' : 'ERR'} ${r || '(home)'} — simulatori: ${res.sims}, grafici: ${res.total}, 3D: ${res.webgl}${res.explain ? ', prove: ' + res.explain : ''}${ok ? '' : ' — ' + res.bad.join('; ')}`);
    if (!ok) failures.push(r + ': ' + res.bad.join('; '));
    if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: true });
  }

  // ---- prova d'esame: svolgimento, storico, errori frequenti, ripresa, scadenza, esporta/importa, domande aggiunte
  {
    errors = [];
    const step = async (name, fn) => { try { await fn(); } catch (e) { failures.push('prova d\'esame — ' + name + ': ' + e.message.split('\n')[0]); console.log('ERR prova d\'esame — ' + name + ': ' + e.message.split('\n')[0]); } };
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url + '#inizio'); await page.evaluate(() => { try { localStorage.removeItem('fisio-quiz-v1'); } catch (e) { /* niente */ } });
    await page.goto(url + '#prova'); await page.waitForTimeout(400);
    await step('tre prove e «sui miei errori» disattivato all\'inizio', async () => {
      const n = await page.$$eval('.pcard', c => c.length); if (n !== 3) throw new Error(n + ' schede invece di 3');
      const dis = await page.$$eval('.pcard .btn:not(.primary)', b => b.map(x => x.disabled)); if (!dis.every(Boolean)) throw new Error('«Sui miei errori» dovrebbe essere disattivato');
    });
    await step('simulazione del primo intercorso', async () => {
      await page.click('.pcard:nth-child(1) .btn.primary'); await page.waitForTimeout(300);
      const n = await page.$$eval('.pdot', d => d.length); if (n !== 15) throw new Error(n + ' domande invece di 15');
      const t = await page.$eval('.ptimer', e => e.textContent); if (!/29:|30:/.test(t)) throw new Error('timer: ' + t);
      for (let i = 0; i < n; i++) { await page.keyboard.press(['a', 'b', 'c', 'd'][i % 4]); if (i === 3) await page.keyboard.press('f'); if (i < n - 1) await page.keyboard.press('ArrowRight'); }
      const done = await page.$$eval('.pdot.done', d => d.length); if (done !== 15) throw new Error('risposte date: ' + done);
      await page.click('.pnav button:text-is("Consegna")'); await page.click('button:text-is("Sì, consegna")'); await page.waitForTimeout(300);
      const sc = await page.$eval('.pscore-n', e => e.textContent); if (!/^\d+ \/ 15$/.test(sc)) throw new Error('punteggio: ' + sc);
      const corr = await page.$$eval('.pc', c => c.length); if (corr !== 15) throw new Error('correzioni: ' + corr);
      const bad = await page.$eval('.prova', e => /NaN|undefined/.test(e.innerText)); if (bad) throw new Error('NaN o undefined nella correzione');
    });
    await step('storico e «sui miei errori» attivo', async () => {
      await page.click('button:text-is("Torna alle prove")'); await page.waitForTimeout(300);
      const rows = await page.$$eval('.ptable tbody tr', r => r.length); if (rows !== 1) throw new Error('righe di storico: ' + rows);
      const dis = await page.$eval('.pcard:nth-child(1) .btn:not(.primary)', b => b.disabled); if (dis) throw new Error('«Sui miei errori» ancora disattivato');
      const dis2 = await page.$eval('.pcard:nth-child(2) .btn:not(.primary)', b => b.disabled); if (!dis2) throw new Error('«Sui miei errori» del secondo intercorso dovrebbe restare disattivato (nessun dato in quelle lezioni)');
    });
    await step('prova sui miei errori', async () => {
      await page.click('.pcard:nth-child(1) .btn:not(.primary)'); await page.waitForTimeout(300);
      const comp = await page.$$eval('.prova p.small', p => p.map(x => x.textContent).join(' ')); if (!/Composizione/.test(comp)) throw new Error('manca la composizione della prova');
      const n = await page.$$eval('.pdot', d => d.length);
      for (let i = 0; i < n; i++) { await page.keyboard.press('a'); if (i < n - 1) await page.keyboard.press('ArrowRight'); }
      await page.click('.pnav button:text-is("Consegna")'); await page.click('button:text-is("Sì, consegna")'); await page.waitForTimeout(300);
      await page.click('button:has-text("Rifai solo le sbagliate")'); await page.waitForTimeout(300);
      const train = await page.$$eval('.pdot', d => d.length); if (!train) throw new Error('nessuna domanda da rifare');
      await page.keyboard.press('a'); await page.waitForTimeout(150);
      const fb = await page.$$eval('.pq .feedback', f => f.length); if (!fb) throw new Error('in «rifai» la correzione dovrebbe comparire subito');
      await page.goto(url + '#inizio'); await page.goto(url + '#prova'); await page.waitForTimeout(300);
    });
    await step('ripresa di una prova in corso e scadenza del tempo', async () => {
      const banner = await page.$('.presume, .note.info .btn'); if (!banner) throw new Error('manca il riquadro «prova in corso»');
      await page.click('button:text-is("Riprendi")'); await page.waitForTimeout(300);
      await page.evaluate(() => { const r = Fisio.quiz.data.run; r.startTs = Date.now() - 3 * 3600 * 1000; r.minutes = 30; Fisio.quiz.save(); });
      await page.goto(url + '#inizio'); await page.goto(url + '#prova'); await page.waitForTimeout(300);
      await page.click('button:text-is("Riprendi")'); await page.waitForTimeout(400);
      const note = await page.$eval('.prova', e => /Tempo scaduto/.test(e.innerText)); if (!note) throw new Error('la prova scaduta non è stata consegnata da sola');
      await page.click('button:text-is("Torna alle prove")'); await page.waitForTimeout(200);
    });
    await step('i dati restano dopo il ricaricamento', async () => {
      await page.reload(); await page.waitForTimeout(500);
      const rows = await page.$$eval('.ptable tbody tr', r => r.length); if (rows < 2) throw new Error('righe dopo il ricaricamento: ' + rows);
    });
    await step('esporta e importa senza duplicati', async () => {
      const before = await page.evaluate(() => Fisio.quiz.data.attempts.length);
      const txt = await page.evaluate(() => Fisio.quiz.exportJSON());
      await page.fill('.ptext[aria-label="Testo da importare"]', txt); await page.click('button:text-is("Importa dal testo")'); await page.waitForTimeout(300);
      const msg = await page.$eval('.pdata .pmsg', e => e.textContent); if (!/Importati 0 tentativi/.test(msg)) throw new Error('messaggio: ' + msg);
      await page.waitForTimeout(1100);
      const after = await page.evaluate(() => Fisio.quiz.data.attempts.length); if (after !== before) throw new Error('duplicati: ' + before + ' → ' + after);
      await page.fill('.ptext[aria-label="Testo da importare"]', 'non json'); await page.click('button:text-is("Importa dal testo")');
      const m2 = await page.$eval('.pdata .pmsg', e => e.textContent); if (!/JSON|esportato|valido/.test(m2)) throw new Error('nessun errore per un testo non valido: ' + m2);
    });
    await step('aggiungere domande con il modulo', async () => {
      await page.click('.padd summary'); await page.waitForTimeout(150);
      const prompt = await page.$eval('.padd textarea[readonly]', e => e.value); if (!/JSON/.test(prompt)) throw new Error('prompt non presente');
      const ok = JSON.stringify([{ l: '13', t: 'Nernst', q: 'Se [K⁺] esterno aumenta e quello interno resta uguale, E_K come cambia?', o: ['Diventa meno negativo', 'Diventa più negativo', 'Non cambia', 'Cambia segno sempre'], w: 'E_K = 61·log([K]o/[K]i): più K⁺ fuori, meno negativo.' }, { l: '99', q: 'domanda con lezione sbagliata?', o: ['a', 'b', 'c', 'd'] }]);
      await page.fill('.padd textarea[aria-label="Domande da aggiungere"]', ok); await page.click('.padd button:text-is("Controlla")'); await page.waitForTimeout(200);
      const rep = await page.$$eval('.preport .prep', r => r.map(x => x.className)); if (rep.length !== 2 || !/ok/.test(rep[0]) || !/bad/.test(rep[1])) throw new Error('esito: ' + rep.join(','));
      await page.click('.padd button:text-is("Salva le domande valide")'); await page.waitForTimeout(1200);
      const n = await page.evaluate(() => Fisio.quiz.userBank.length); if (n !== 1) throw new Error('domande aggiunte: ' + n);
      const inPool = await page.evaluate(() => Fisio.quiz.pool('13', '13').some(e => e.user)); if (!inPool) throw new Error('la domanda aggiunta non entra nelle prove');
    });
    await step('azzera lo storico', async () => {
      await page.click('button:text-is("Azzera lo storico")'); await page.click('button:text-is("Sì, cancella")'); await page.waitForTimeout(300);
      const rows = await page.$$eval('.ptable tbody tr', r => r.length); if (rows !== 0) throw new Error('storico non azzerato');
    });
    await step('impostazioni: numero di domande e intervallo', async () => {
      await page.click('.psettings summary'); await page.fill('.prow:nth-child(1) input[type="number"]', '5'); await page.dispatchEvent('.prow:nth-child(1) input[type="number"]', 'change'); await page.waitForTimeout(200);
      await page.reload(); await page.waitForTimeout(400);
      const t = await page.$eval('.pcard:nth-child(1) p:nth-of-type(1)', e => e.textContent); if (!/5 domande/.test(t)) throw new Error('impostazione non salvata: ' + t);
      await page.evaluate(() => { localStorage.removeItem('fisio-quiz-v1'); });
    });
    const realErr = errors.filter(e => !/GPU stall|GL Driver|WebGL/i.test(e));
    if (realErr.length) failures.push('prova d\'esame — errori JS: ' + realErr.slice(0, 3).join(' | '));
    console.log(failures.some(f => f.indexOf('prova d\'esame') === 0) ? 'ERR scenario della prova d\'esame' : 'OK  scenario della prova d\'esame (svolgimento, storico, errori, ripresa, scadenza, esporta/importa, domande aggiunte)');
  }

  // prova del tema scuro
  await page.goto(url + '#lezione-19');
  await page.click('#themeBtn');
  await page.waitForTimeout(500);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (!theme) failures.push('cambio tema non riuscito');
  // prova su schermo da telefono
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + '#lezione-15');
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) failures.push('scorrimento orizzontale su telefono: ' + overflow + ' px');
  if (shotDir) await page.screenshot({ path: path.join(shotDir, 'mobile_lezione_15.png'), fullPage: false });
  await browser.close();
  console.log(failures.length ? '\nPROBLEMI:\n' + failures.join('\n') : '\nTutte le pagine superano i controlli.');
  process.exit(failures.length ? 1 : 0);
})();
