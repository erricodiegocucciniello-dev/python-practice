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
      return { destroy: function () { plot.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
