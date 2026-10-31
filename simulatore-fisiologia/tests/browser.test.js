/* Test nel browser (Playwright + Chromium).
   Esecuzione:  node tests/browser.test.js [cartella-screenshot]
   Apre ogni lezione e ogni simulatore, fa scorrere la pagina per caricare tutti i simulatori
   e verifica: nessun errore JavaScript, nessun "NaN"/"undefined" nel testo visibile,
   ogni simulatore montato senza errori, grafici non vuoti, domande "Prevedi" funzionanti. */
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

  const routes = [{ r: 'inizio', name: 'home' }]
    .concat(lessons.map(l => ({ r: 'lezione-' + l.id, name: 'lezione_' + l.id })))
    .concat(sims.map(s => ({ r: 'sim-' + s, name: 'sim_' + s })));

  for (const { r, name } of routes) {
    errors = [];
    await page.goto(url + '#' + r);
    await page.waitForTimeout(250);
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h + 1000; y += 500) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(90); }
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
    const realErr = errors.filter(e => !/GPU stall|GL Driver|WebGL/i.test(e));
    if (realErr.length) res.bad.push('errori JS: ' + realErr.slice(0, 3).join(' | '));
    if (res.blank) res.bad.push(res.blank + '/' + res.total + ' grafici vuoti');
    const ok = res.bad.length === 0;
    console.log(`${ok ? 'OK ' : 'ERR'} ${r || '(home)'} — simulatori: ${res.sims}, grafici: ${res.total}, 3D: ${res.webgl}${ok ? '' : ' — ' + res.bad.join('; ')}`);
    if (!ok) failures.push(r + ': ' + res.bad.join('; '));
    if (shotDir) await page.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: true });
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
