/* Sezione 8 — Sistema somatosensoriale (lezione 29; codifica: lezione 28). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;
  var REC = {
    SA1: { name: 'Disco di Merkel (SA I)', col: '--c1', depth: 0.18, adapt: 'lento', field: 'piccolo', fn: 'forma, bordi, texture fine' },
    RA: { name: 'Corpuscolo di Meissner (RA I)', col: '--c3', depth: 0.3, adapt: 'rapido', field: 'piccolo', fn: 'tocco leggero, scivolamento, vibrazione lenta (flutter)' },
    PC: { name: 'Corpuscolo di Pacini (RA II)', col: '--na', depth: 0.78, adapt: 'molto rapido', field: 'grande', fn: 'vibrazione ad alta frequenza, ruvidità' },
    SA2: { name: 'Corpuscolo di Ruffini (SA II)', col: '--c4', depth: 0.62, adapt: 'lento', field: 'grande', fn: 'stiramento della cute, posizione delle dita' }
  };

  // ================================================================ Meccanocettori
  F.registerSim('meccanocettori', {
    title: 'Meccanocettori cutanei: adattamento e frequenze preferite',
    section: 'sensoriale',
    short: 'Pressione mantenuta e vibrazione: risposte dei recettori ad adattamento lento (Merkel, Ruffini) e rapido (Meissner, Pacini); la capsula del Pacini come filtro (esperimento di Loewenstein).',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { stim: P.stim || 'press', A: P.A || 50, f: P.f || 40, decaps: false };
      var sSel = U.seg({ label: 'Stimolo', value: st.stim, options: [['press', 'Pressione mantenuta'], ['vib', 'Vibrazione']], onChange: function (v) { st.stim = v; vis(); run(); } });
      var sA = U.slider({ label: 'Ampiezza dell\'indentazione', min: 0.1, max: 300, value: st.A, log: true, fmt: function (v) { return F.fmt(v, v < 1 ? 2 : 1) + ' µm'; }, onInput: function (v) { st.A = v; run(); } });
      var sF = U.slider({ label: 'Frequenza della vibrazione', min: 2, max: 500, value: st.f, log: true, fmt: function (v) { return F.fmt(v, 0) + ' Hz'; }, onInput: function (v) { st.f = v; run(); } });
      var tD = U.toggle({ label: 'Pacini senza capsula (Loewenstein & Mendelson, 1965)', value: false, onChange: function (v) { st.decaps = v; run(); } });
      var bT = U.button('Calcola le curve di soglia', function () { tuning(); }, 'primary');
      [sSel.el, sA.el, sF.el, tD.el, bT].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Trasduzione: filtri meccanici del 2° ordine (Merkel: posizione + velocità, Ruffini: posizione/stiramento, Meissner: velocità filtrata a ~40 Hz, Pacini: capsula lamellare = filtro passa-alto a ~150 Hz) seguiti da una zona di innesco "integra e scarica" con refrattarietà e adattamento lento. Modello semplificato tarato sulle frequenze preferite note: Meissner ≈ 10–50 Hz, Pacini ≈ 200–300 Hz con soglie sotto 1 µm.'));
      var ro = U.readouts(Object.keys(REC).map(function (k) { return { key: k, label: REC[k].name }; }));
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var pS = U.plot(L.main, { title: 'Stimolo', xlabel: 'tempo (ms)', ylabel: 'µm', height: 120 });
      var pR = U.plot(L.main, { title: 'Scariche delle fibre afferenti (ogni trattino è un PdA)', xlabel: 'tempo (ms)', ylabel: '', height: 190, yfmt: function () { return ''; } });
      var pT = U.plot(L.main, { title: 'Soglia in funzione della frequenza di vibrazione', xlabel: 'frequenza (Hz)', ylabel: 'soglia (µm)', xlog: true, ylog: true, height: 230, xlim: [2, 500] });
      pT.wrap.style.display = 'none';
      var rates = {};
      var cv = U.canvas2d(holder, 170, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = css('--na'); ctx.globalAlpha = 0.12; ctx.fillRect(0, 10, w, h * 0.22); ctx.globalAlpha = 0.07; ctx.fillRect(0, 10 + h * 0.22, w, h * 0.7); ctx.globalAlpha = 1;
        ctx.font = '11px ' + css('--font'); ctx.fillStyle = css('--muted'); ctx.textAlign = 'left';
        ctx.fillText('epidermide', 6, 22); ctx.fillText('derma', 6, 10 + h * 0.3); ctx.fillText('derma profondo / sottocute', 6, h - 8);
        var keys = Object.keys(REC);
        keys.forEach(function (k, i) {
          var r = REC[k], x = w * (0.25 + i * 0.18), y = 10 + r.depth * (h - 20), act = Math.min(1, (rates[k] || 0) / 150);
          ctx.fillStyle = css(r.col); ctx.globalAlpha = 0.25 + 0.75 * act;
          ctx.beginPath();
          if (k === 'PC') { for (var q = 4; q >= 1; q--) { ctx.globalAlpha = (0.15 + 0.6 * act) * (q === 1 ? 1 : 0.5); ctx.beginPath(); ctx.ellipse(x, y, 7 * q, 4.5 * q, 0, 0, 6.283); ctx.fill(); } }
          else if (k === 'RA') { ctx.ellipse(x, y, 9, 15, 0, 0, 6.283); ctx.fill(); }
          else if (k === 'SA2') { ctx.ellipse(x, y, 20, 6, 0.3, 0, 6.283); ctx.fill(); }
          else { ctx.arc(x, y, 7, 0, 6.283); ctx.fill(); }
          ctx.globalAlpha = 1; ctx.strokeStyle = css('--muted'); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + 6, h); ctx.stroke();
          ctx.fillStyle = css('--text'); ctx.textAlign = 'center'; ctx.fillText(r.name.split(' (')[0], x, y - 18 > 12 ? y - 18 : y + 28);
        });
        // sonda
        var px = w * 0.52;
        ctx.fillStyle = css('--text'); ctx.fillRect(px - 4, 0, 8, 10 + (st.stim === 'press' ? 6 : 3));
      });
      function xfun() {
        if (st.stim === 'press') return function (t) { return t > 100 && t < 600 ? Math.min(1, (t - 100) / 20) * st.A : (t >= 600 && t < 620 ? (1 - (t - 600) / 20) * st.A : 0); };
        return function (t) { return t > 100 && t < 600 ? st.A * (1 - Math.cos(2 * Math.PI * st.f * (t - 100) / 1000)) / 2 : 0; };
      }
      function vis() { sF.el.style.display = st.stim === 'vib' ? '' : 'none'; }
      function run() {
        var xf = xfun(), keys = Object.keys(REC), ser = [], tt = F.linspace(0, 800, 1600);
        pS.update({ series: [{ x: tt, y: tt.map(xf), color: '--text', width: 1.2 }], ylim: [0, null] });
        keys.forEach(function (k, i) {
          var r = F.mechano(k, xf, { tmax: 800, decapsulated: k === 'PC' && st.decaps, sample: 1 });
          var y0 = keys.length - i, xs = [], ys = [];
          r.spikes.forEach(function (s) { xs.push(s, s, NaN); ys.push(y0 - 0.35, y0 + 0.35, NaN); });
          ser.push({ x: xs, y: ys, color: REC[k].col, width: 1.4, name: REC[k].name.split(' (')[0] + (k === 'PC' && st.decaps ? ' senza capsula' : ''), noHover: true });
          var hold = r.spikes.filter(function (s) { return s > 250 && s < 590; }).length / 0.34;
          var on = r.spikes.filter(function (s) { return s >= 100 && s < 250; }).length;
          rates[k] = r.spikes.filter(function (s) { return s > 100 && s < 600; }).length / 0.5;
          ro.set(k, r.spikes.length ? (st.stim === 'press' ? (hold > 2 ? 'scarica sostenuta ' + F.fmt(hold, 0) + ' Hz' : 'solo all\'inizio/fine (' + r.spikes.length + ' PdA)') : F.fmt(rates[k], 0) + ' PdA/s') : 'silente');
        });
        pR.update({ series: ser, ylim: [0.3, keys.length + 0.7], legendRight: true, spans: [{ x0: 100, x1: 600, color: U.css('--warn'), alpha: 0.07 }] });
        cv.redraw();
      }
      function tuning() {
        pT.wrap.style.display = ''; bT.textContent = 'Calcolo…';
        var fs = [2, 5, 10, 20, 40, 80, 150, 250, 400], keys = ['SA1', 'RA', 'PC'], res = {}, k = 0, j = 0;
        keys.forEach(function (kk) { res[kk] = []; });
        var thr = function (type, fHz) {
          var lo = 0.002, hi = 400;
          var fires = function (A) { return F.mechano(type, function (t) { return A * (1 - Math.cos(2 * Math.PI * fHz * t / 1000)) / 2; }, { tmax: Math.max(300, 6000 / fHz), sample: 50 }).spikes.length >= 3; };
          if (!fires(hi)) return NaN;
          for (var i = 0; i < 16; i++) { var m = Math.sqrt(lo * hi); if (fires(m)) hi = m; else lo = m; }
          return hi;
        };
        var stepFn = function () {
          if (k >= keys.length) { bT.textContent = 'Calcola le curve di soglia'; return; }
          res[keys[k]].push(thr(keys[k], fs[j])); j++;
          if (j >= fs.length) { j = 0; k++; }
          pT.update({ series: keys.map(function (kk) { return { name: REC[kk].name, x: fs.slice(0, res[kk].length), y: res[kk], color: REC[kk].col }; }), ylim: [0.05, 400], legendRight: true });
          setTimeout(stepFn, 0);
        };
        stepFn();
      }
      vis(); run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var mcBase = function () { sSel.set('press'); sA.set(50); sF.set(40); tD.set(false); };
      U.explainer(L, {
        watch: ro,
        base: mcBase,
        legend: [['--c1', 'Merkel (SA I)'], ['--c3', 'Meissner (RA I)'], ['--na', 'Pacini (RA II)'], ['--c4', 'Ruffini (SA II)'], ['--warn', 'fascia chiara: durata dello stimolo']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot(), keys = Object.keys(REC), s;
          var elenco = keys.map(function (k, i) { return '<b>' + REC[k].name.split(' (')[0] + '</b>: ' + sn[i].value; }).join(' · ');
          if (st.stim === 'press') {
            s = `Pressione mantenuta di <b>${f(st.A, st.A < 1 ? 2 : 0)} µm</b> sulla pelle, da 100 a 600 ms (grafico in alto). I recettori <b>ad adattamento lento</b> (Merkel, Ruffini) continuano a scaricare finché la pressione dura: dicono <b>quanto</b> e <b>per quanto</b> si preme. I recettori <b>ad adattamento rapido</b> (Meissner, Pacini) scaricano solo quando lo stimolo cambia, cioè all'inizio e alla fine: segnalano la <b>variazione</b>, non il valore costante. Ora: ${elenco}.`;
            if (st.decaps) s += ` <b>Senza capsula</b> il Pacini non si comporta più da recettore rapido: è la capsula lamellare a filtrare via la pressione costante e a lasciar passare solo i cambiamenti rapidi (Loewenstein e Mendelson, 1965).`;
          } else {
            s = `Vibrazione a <b>${f(st.f, 0)} Hz</b> con ampiezza ${f(st.A, st.A < 1 ? 2 : 0)} µm. La soglia di ogni recettore dipende dalla frequenza: la sua <b>frequenza preferita</b> è quella a cui la soglia è più bassa (Meissner circa 40 Hz, Pacini circa 250 Hz); Merkel e Ruffini rispondono soprattutto alle deformazioni lente e seguono poco le vibrazioni rapide. Ora: ${elenco}. `;
            var attivi = keys.filter(function (k) { return (rates[k] || 0) > 0; });
            s += attivi.length === 0 ? `A questa ampiezza <b>nessun recettore</b> raggiunge la soglia. ` : (attivi.length === 1 ? `Scarica soltanto il <b>${REC[attivi[0]].name.split(' (')[0]}</b>. ` : `Rispondono più recettori insieme: la selettività per la frequenza si vede soprattutto avvicinandosi alla soglia (riduci l'ampiezza). `);
            if (st.decaps) s += `Il Pacini è privato della capsula, quindi ha perso la selettività per le alte frequenze. `;
            s += `Per vedere la soglia di ogni recettore a tutte le frequenze usa «Calcola le curve di soglia».`;
          }
          return s;
        },
        experiments: [
          { label: 'Pressione mantenuta', run: function () { mcBase(); }, why: `Merkel e Ruffini scaricano per tutto il tempo; Meissner e Pacini scaricano pochissimo, solo ai bordi dello stimolo.` },
          { label: 'Pressione sotto soglia (3 µm)', run: function () { mcBase(); sA.set(3); }, why: `Sotto una indentazione minima nessun recettore scarica: lo stimolo non viene percepito.` },
          { label: 'Pressione forte (250 µm)', run: function () { mcBase(); sA.set(250); }, why: `Una pressione più forte fa scaricare di più i recettori lenti: più indentazione = più PdA al secondo (l'intensità è codificata dalla frequenza di scarica).` },
          { label: 'Vibrazione molto lenta (5 Hz, 60 µm)', run: function () { mcBase(); sSel.set('vib'); sF.set(5); sA.set(60); }, why: `Una vibrazione molto lenta è quasi una pressione che varia piano: rispondono i recettori lenti (Merkel e Ruffini), mentre quelli rapidi non scaricano.` },
          { label: 'Vibrazione lenta (10 Hz, 40 µm)', run: function () { mcBase(); sSel.set('vib'); sF.set(10); sA.set(40); }, why: `A 10 Hz scaricano Meissner e Merkel (tocco lento, «flutter») mentre il Pacini ha ancora una soglia troppo alta e resta silente.` },
          { label: 'Vibrazione rapida (250 Hz, 1 µm)', run: function () { mcBase(); sSel.set('vib'); sF.set(250); sA.set(1); }, why: `Con appena 1 µm, a 250 Hz scarica solo il Pacini, un PdA per ogni ciclo: la capsula lamellare lascia passare le oscillazioni rapide e il recettore ha qui la soglia più bassa (sotto 1 µm).` },
          { label: 'Pacini senza capsula + pressione', run: function () { mcBase(); tD.set(true); }, why: `Tolta la capsula il Pacini scarica per tutta la pressione, come un recettore lento: l'adattamento rapido è una proprietà della capsula, non del terminale nervoso.` },
          { label: 'Curve di soglia', run: function () { mcBase(); tuning(); }, why: `Il grafico in fondo mostra, per ogni recettore, l'ampiezza minima che lo fa scaricare in funzione della frequenza: ognuno ha il minimo a una frequenza diversa (Meissner circa 40 Hz, Pacini circa 250 Hz), per questo insieme coprono un ampio intervallo di vibrazioni. Il Merkel ha soglie quasi costanti: risponde meglio alle deformazioni lente.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { pS.dispose(); pR.dispose(); pT.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ Discriminazione di due punti
  F.registerSim('duepunti', {
    title: 'Acuità tattile: discriminazione di due punti',
    section: 'sensoriale',
    short: 'Due punte vicine sono percepite come due solo se attivano popolazioni di recettori distinguibili: contano la densità dei recettori, la grandezza dei campi recettivi e l\'inibizione laterale.',
    mount: function (host, P) {
      var regions = { dito: ['Polpastrello', 2.5], labbro: ['Labbro superiore', 5], palmo: ['Palmo della mano', 10], avambraccio: ['Avambraccio', 38], dorso: ['Dorso', 40], polpaccio: ['Polpaccio', 47] };
      var L = U.simLayout(host), st = { reg: P.reg || 'dito', d: P.d || 3, inhib: P.inhib === undefined ? true : P.inhib };
      var k1 = F.twoPointThreshold(1, true);
      var rSel = U.select({ label: 'Regione del corpo', value: st.reg, options: Object.keys(regions).map(function (k) { return [k, regions[k][0] + ' (soglia tipica ≈ ' + regions[k][1] + ' mm)']; }), onChange: function (v) { st.reg = v; run(); } });
      var sD = U.slider({ label: 'Distanza tra le due punte', min: 0.5, max: 80, value: st.d, log: true, fmt: function (v) { return F.fmt(v, 1) + ' mm'; }, onInput: function (v) { st.d = v; run(); } });
      var tI = U.toggle({ label: 'Inibizione laterale (nelle vie centrali)', value: st.inhib, onChange: function (v) { st.inhib = v; run(); } });
      [rSel.el, sD.el, tI.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Popolazione di recettori con campi recettivi gaussiani; la larghezza dei campi è scelta per ogni regione in modo che il modello (con inibizione laterale) riproduca le soglie tipiche misurate da Weinstein (1968). Due punti sono percepiti come distinti se il profilo di attività presenta un avvallamento centrale ≥ 10%.'));
      var ro = U.readouts([{ key: 'p', label: 'Percezione', hl: true }, { key: 'w', label: 'Ampiezza dei campi recettivi' }, { key: 't', label: 'Soglia del modello' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Attività della popolazione di recettori lungo la cute', xlabel: 'posizione (mm)', ylabel: 'attività (rel.)', height: 250 });
      function run() {
        var w = regions[st.reg][1] / k1, pr = F.twoPointProfile(st.d, w, st.inhib), raw = F.twoPointProfile(st.d, w, false);
        var mx = Math.max.apply(null, pr.a) || 1, mr = Math.max.apply(null, raw.a) || 1;
        plot.update({ series: [{ name: st.inhib ? 'con inibizione laterale' : 'attività dei recettori', x: pr.x, y: pr.a.map(function (v) { return v / mx; }), color: '--c1' }].concat(st.inhib ? [{ name: 'senza inibizione', x: raw.x, y: raw.a.map(function (v) { return v / mr; }), color: '--faint', dash: [5, 4] }] : []),
          vlines: [{ x: -st.d / 2, label: 'punta 1', color: '--na' }, { x: st.d / 2, label: 'punta 2', color: '--na', dy: 14 }], ylim: [0, 1.1] });
        ro.set('p', pr.two ? '<span style="color:var(--ok)">due punti</span>' : '<span style="color:var(--bad)">un punto solo</span>');
        ro.set('w', F.fmt(w, 1) + ' mm'); ro.set('t', F.fmt(F.twoPointThreshold(w, st.inhib), 1) + ' mm');
      }
      run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var dpBase = function () { rSel.set('dito'); sD.set(3); tI.set(true); };
      U.explainer(L, {
        watch: ro,
        base: dpBase,
        legend: [['--c1', 'blu: attività dei recettori (con inibizione laterale)'], ['--faint', 'tratteggio: senza inibizione'], ['--na', 'linee arancio: posizione delle punte']],
        narrate: function () {
          var f = F.fmt, w = regions[st.reg][1] / k1, pr = F.twoPointProfile(st.d, w, st.inhib);
          var tYes = F.twoPointThreshold(w, true), tNo = F.twoPointThreshold(w, false), thr = st.inhib ? tYes : tNo;
          var s = `Appoggio due punte a <b>${f(st.d, 1)} mm</b> di distanza sul «${regions[st.reg][0].toLowerCase()}». Ogni recettore risponde a una piccola area di cute (il suo <b>campo recettivo</b>), qui larga circa ${f(w, 1)} mm. Se le due punte stimolano campi che si sovrappongono, l'attività dei recettori forma un <b>unico picco</b> e il cervello sente un punto solo. Le punte sono percepite come due solo se tra i due picchi di attività c'è un avvallamento (almeno il 10%). `;
          s += pr.two ? `Qui l'avvallamento c'è (distanza maggiore della soglia di ${f(thr, 1)} mm): <b>due punti</b>. ` : `Qui i due picchi si fondono (distanza minore della soglia di ${f(thr, 1)} mm): <b>un punto solo</b>. `;
          s += st.inhib ? `L'<b>inibizione laterale</b> sopprime l'attività ai lati dei picchi e li rende più stretti: la soglia scende da ${f(tNo, 1)} a ${f(tYes, 1)} mm (il tratteggio mostra il profilo senza inibizione).` : `Senza inibizione laterale i picchi sono più larghi e si fondono prima: la soglia è ${f(tNo, 1)} mm invece di ${f(tYes, 1)}.`;
          return { kind: pr.two ? 'ok' : '', html: s };
        },
        experiments: [
          { label: 'Polpastrello, 3 mm', run: function () { dpBase(); }, why: `Nel polpastrello i campi sono piccolissimi e molto fitti: due punte a 3 mm danno due picchi separati.` },
          { label: 'Polpastrello, 1 mm', run: function () { dpBase(); sD.set(1); }, why: `A 1 mm le punte cadono nello stesso campo: un picco solo e quindi un punto solo, anche sulla zona più sensibile.` },
          { label: 'Avambraccio, 10 mm', run: function () { dpBase(); rSel.set('avambraccio'); sD.set(10); }, why: `La stessa distanza che sul polpastrello è enorme, sull'avambraccio (campi grandi, recettori più radi) è sotto soglia: si sente un punto solo.` },
          { label: 'Avambraccio, 50 mm', run: function () { dpBase(); rSel.set('avambraccio'); sD.set(50); }, why: `Per sentire due punte sull'avambraccio servono punte molto più lontane, oltre la soglia di circa 38 mm.` },
          { label: 'Polpastrello, 2,7 mm con inibizione', run: function () { dpBase(); sD.set(2.7); }, why: `Vicino alla soglia (2,5 mm) i due picchi si distinguono appena.` },
          { label: 'Polpastrello, 2,7 mm senza inibizione', base: function () { dpBase(); sD.set(2.7); }, run: function () { dpBase(); sD.set(2.7); tI.set(false); }, why: `Senza inibizione laterale i picchi sono più larghi e si fondono: la soglia sale da 2,5 a 2,8 mm e la stessa distanza ora è percepita come un punto solo. L'inibizione laterale affina quindi la discriminazione.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
