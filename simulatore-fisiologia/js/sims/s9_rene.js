/* Sezione 9 — Bilancio idrico e rene (lezione 30). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Filtrazione glomerulare
  F.registerSim('glomerulo', {
    title: 'Filtrazione glomerulare: forze di Starling',
    section: 'rene',
    short: 'Pressione idrostatica glomerulare, pressione oncotica che aumenta lungo il capillare e pressione nella capsula di Bowman; effetti delle arteriole afferente ed efferente.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { Raff: 1, Reff: 1, Pa: 100, C: 7, PBS: 15, Kf: 1 };
      var sA = U.slider({ label: 'Resistenza dell\'arteriola afferente', min: 0.5, max: 2.5, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Raff = v; run(); } });
      var sE = U.slider({ label: 'Resistenza dell\'arteriola efferente', min: 0.5, max: 4, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Reff = v; run(); } });
      var sPa = U.slider({ label: 'Pressione arteriosa renale', min: 60, max: 160, step: 1, value: 100, digits: 0, unit: 'mmHg', onInput: function (v) { st.Pa = v; run(); } });
      var sC = U.slider({ label: 'Proteine plasmatiche', min: 3, max: 10, step: 0.1, value: 7, digits: 1, unit: 'g/dL', onInput: function (v) { st.C = v; run(); } });
      var sB = U.slider({ label: 'Pressione nella capsula di Bowman', min: 5, max: 40, step: 1, value: 15, digits: 0, unit: 'mmHg', onInput: function (v) { st.PBS = v; run(); } });
      var sK = U.slider({ label: 'Coefficiente di filtrazione K<sub>f</sub>', min: 0.3, max: 2, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Kf = v; run(); } });
      [sA.el, sE.el, sPa.el, sC.el, sB.el, sK.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [
        U.button('Simpatico: costrizione afferente', function () { reset(); sA.set(1.5); }),
        U.button('Angiotensina II: costrizione efferente', function () { reset(); sE.set(1.6); }),
        U.button('Ipoproteinemia', function () { reset(); sC.set(4.5); }),
        U.button('Ostruzione urinaria', function () { reset(); sB.set(30); }),
        U.button('Condizioni normali', function () { reset(); })
      ]));
      function reset() { [sA, sE, sK].forEach(function (s) { s.set(1, true); }); sPa.set(100, true); sC.set(7, true); sB.set(15, true); st = { Raff: 1, Reff: 1, Pa: 100, C: 7, PBS: 15, Kf: 1 }; run(); }
      L.controls.appendChild(U.params('Filtrazione calcolata integrando la legge di Starling lungo il capillare glomerulare: $dQ = K_f\\,(P_{GC} - P_{BS} - \\pi_{GC})\\,dx$, con π<sub>GC</sub> che sale perché le proteine si concentrano (Landis-Pappenheimer: $\\pi = 2{,}1C + 0{,}16C^2 + 0{,}009C^3$). Resistenze calibrate su: flusso ematico renale 1,1 L/min, P<sub>GC</sub> 55 mmHg, GFR 125 mL/min; K<sub>f</sub> calibrato di conseguenza. P<sub>GC</sub> di riferimento: le slide indicano 45–50 mmHg, altri testi (Guyton) 60 mmHg. L\'autoregolazione (miogena, feedback tubulo-glomerulare) <b>non</b> è inclusa, per vedere gli effetti diretti.'));
      U.texify(L.controls);
      var ro = U.readouts([{ key: 'gfr', label: 'GFR', hl: true }, { key: 'rpf', label: 'Flusso plasmatico renale' }, { key: 'ff', label: 'Frazione di filtrazione' }, { key: 'pgc', label: 'P<sub>GC</sub>' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Pressioni lungo il capillare glomerulare', xlabel: 'posizione lungo il capillare (inizio → fine)', ylabel: 'mmHg', height: 240, xlim: [0, 1] });
      var p2 = U.plot(L.main, { title: 'GFR e flusso plasmatico al variare della resistenza efferente', xlabel: 'resistenza efferente (× normale)', ylabel: 'mL/min', height: 210, xlim: [0.5, 4] });
      function run() {
        var g = F.glomerulus({ Raff: st.Raff, Reff: st.Reff, Pa: st.Pa, Cprot: st.C, PBS: st.PBS, Kf: st.Kf }), pr = g.profile;
        p1.update({ series: [{ name: 'P idrostatica glomerulare', x: pr.x, y: pr.PGC, color: '--c1' }, { name: 'P Bowman + π oncotica', x: pr.x, y: pr.pi.map(function (p) { return p + st.PBS; }), color: '--na' }, { name: 'pressione netta di filtrazione', x: pr.x, y: pr.NFP, color: '--c3', fill: true }], ylim: [0, 80], hlines: [] });
        ro.set('gfr', F.fmt(g.GFR, 0) + ' mL/min'); ro.set('rpf', F.fmt(g.RPF, 0) + ' mL/min'); ro.set('ff', F.fmt(g.FF * 100, 1) + '%');
        ro.set('pgc', F.fmt(g.PGC, 1) + ' mmHg' + (g.equilibrium ? ' · equilibrio di filtrazione' : ''));
        var rs = F.linspace(0.5, 4, 36), gg = rs.map(function (r) { return F.glomerulus({ Raff: st.Raff, Reff: r, Pa: st.Pa, Cprot: st.C, PBS: st.PBS, Kf: st.Kf }); });
        p2.update({ series: [{ name: 'GFR', x: rs, y: gg.map(function (x) { return x.GFR; }), color: '--c1' }, { name: 'flusso plasmatico (RPF)', x: rs, y: gg.map(function (x) { return x.RPF; }), color: '--na' }, { x: [st.Reff], y: [g.GFR], type: 'points', color: '--c1', r: 6 }], ylim: [0, null], vlines: [{ x: st.Reff, label: 'attuale' }] });
      }
      run();
      return { destroy: function () { p1.dispose(); p2.dispose(); } };
    }
  });

  // ================================================================ ADH e concentrazione delle urine
  F.registerSim('nefrone', {
    title: 'Il nefrone e l\'ADH: urina diluita o concentrata',
    section: 'rene',
    short: 'Osmolarità del liquido tubulare lungo il nefrone; l\'ADH inserisce le acquaporine AQP2 nel dotto collettore: urina da ~50 a ~1200 mOsm/L.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { Posm: P.Posm || 287, load: 900, mode: 'normal' };
      var sP = U.slider({ label: 'Osmolarità plasmatica', min: 270, max: 310, step: 0.5, value: st.Posm, digits: 1, unit: 'mOsm/kg', onInput: function (v) { st.Posm = v; run(); } });
      var sL = U.slider({ label: 'Carico osmotico da eliminare', min: 300, max: 1500, step: 10, value: st.load, digits: 0, unit: 'mOsm/giorno', onInput: function (v) { st.load = v; run(); } });
      var mSel = U.select({ label: 'Condizione', value: 'normal', options: [['normal', 'Normale'], ['dic', 'Diabete insipido centrale (niente ADH)'], ['din', 'Diabete insipido nefrogenico (AQP2/V2 non funzionanti)'], ['siadh', 'Secrezione inappropriata di ADH (SIADH)']], onChange: function (v) { st.mode = v; run(); } });
      [sP.el, sL.el, mSel.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [U.button('Dopo aver bevuto 1,5 L', function () { sP.set(281); }), U.button('Disidratazione', function () { sP.set(298); }), U.button('Normale', function () { sP.set(287); })]));
      L.controls.appendChild(U.params('ADH plasmatico ≈ 0,38 pg/mL per mOsm/kg sopra la soglia di ~280 (Robertson). Osmolarità urinaria ≈ lineare con l\'ADH fino al massimo (~1200 mOsm/L). Volume urinario = carico osmotico / osmolarità urinaria (relazione esatta): con 900 mOsm/giorno il volume minimo è ~0,75 L. Clearance dell\'acqua libera $C_{H_2O} = V - C_{osm}$.'));
      U.texify(L.controls);
      var ro = U.readouts([{ key: 'adh', label: 'ADH plasmatico' }, { key: 'u', label: 'Osmolarità urinaria', hl: true }, { key: 'v', label: 'Volume urinario' }, { key: 'c', label: 'Clearance dell\'acqua libera' }]);
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var k = null;
      var cv = U.canvas2d(holder, 300, function (ctx, w, h) {
        if (!k) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var top = 30, bot = h - 30, cort = top + (bot - top) * 0.3;
        // gradiente midollare
        for (var y = cort; y < bot; y += 4) {
          var f = (y - cort) / (bot - cort), osm = 300 + (k.medullaMax - 300) * f;
          ctx.fillStyle = 'hsla(' + (210 - (osm - 300) / 900 * 200) + ',70%,55%,0.18)'; ctx.fillRect(0, y, w, 4);
        }
        ctx.font = '11px ' + css('--font'); ctx.fillStyle = css('--muted'); ctx.textAlign = 'left';
        ctx.fillText('corticale (300)', 6, top + 12); ctx.fillText('midollare: fino a ' + F.fmt(k.medullaMax, 0) + ' mOsm/L', 6, bot - 6);
        ctx.strokeStyle = css('--muted'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, cort); ctx.lineTo(w, cort); ctx.stroke(); ctx.setLineDash([]);
        var X = function (f) { return w * f; };
        var col = function (osm) { return 'hsl(' + (210 - F.clamp((osm - 50) / 1150, 0, 1) * 200) + ',70%,45%)'; };
        var seg = function (pts, o0, o1, lab) {
          for (var i = 0; i < pts.length - 1; i++) {
            var f = i / (pts.length - 1), o = o0 + (o1 - o0) * f;
            ctx.strokeStyle = col(o); ctx.lineWidth = 9; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
          }
          if (lab) { ctx.fillStyle = css('--text'); ctx.textAlign = 'center'; ctx.fillText(lab[0], lab[1], lab[2]); }
        };
        var line = function (x0, y0, x1, y1, n) { var a = []; for (var i = 0; i <= n; i++) a.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]); return a; };
        ctx.fillStyle = col(300); ctx.beginPath(); ctx.arc(X(0.18), top + 10, 12, 0, 6.283); ctx.fill();
        ctx.fillStyle = css('--text'); ctx.textAlign = 'center'; ctx.fillText('glomerulo', X(0.18), top - 8);
        seg(line(X(0.2), top + 14, X(0.32), cort - 6, 6), 300, 300, ['tubulo prossimale: 300', X(0.24), cort + 14]);
        seg(line(X(0.34), cort, X(0.36), bot - 10, 12), 300, k.medullaMax, ['discendente', X(0.3), bot - 30]);
        seg(line(X(0.4), bot - 10, X(0.42), cort, 12), k.medullaMax, 100, ['ascendente spesso (diluisce)', X(0.5), bot - 50]);
        seg(line(X(0.44), cort - 4, X(0.6), top + 20, 6), 100, 100, ['distale: 100', X(0.55), top + 8]);
        var cdIn = st.mode === 'din' ? 100 : Math.min(300, 100 + 200 * Math.min(1, k.ADH / 2));
        seg(line(X(0.66), top + 20, X(0.7), cort, 4), 100, cdIn, null);
        seg(line(X(0.7), cort, X(0.72), bot - 8, 12), cdIn, k.Uosm, ['dotto collettore', X(0.63), bot - 70]);
        ctx.fillStyle = col(k.Uosm); ctx.font = '600 12px ' + css('--font'); ctx.fillText('urina: ' + F.fmt(k.Uosm, 0) + ' mOsm/L', X(0.8), bot + 18);
        // AQP2
        var n = Math.round(Math.min(1, k.ADH / 4.6) * 8) * (st.mode === 'din' ? 0 : 1);
        ctx.fillStyle = css('--c1');
        for (var i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(X(0.745), cort + 20 + i * (bot - cort - 40) / 8, 4, 0, 6.283); ctx.fill(); }
        ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillStyle = css('--c1'); ctx.fillText(n ? 'AQP2 inserite (ADH)' : 'niente AQP2', X(0.77), cort + 40);
      });
      function run() {
        var o = { Posm: st.Posm, osmLoad: st.load };
        if (st.mode === 'dic') o.ADH = 0;
        if (st.mode === 'siadh') o.ADH = 6;
        k = F.kidneyWater(o);
        if (st.mode === 'din') { k.Uosm = 80; k.V = st.load / 80; k.CH2O = k.V - k.Cosm; k.medullaMax = 600; }
        ro.set('adh', F.fmt(k.ADH, 1) + ' pg/mL'); ro.set('u', F.fmt(k.Uosm, 0) + ' mOsm/L');
        ro.set('v', F.fmt(k.V, 2) + ' L/giorno' + (k.V > 3 ? ' (poliuria)' : '')); ro.set('c', (k.CH2O >= 0 ? '+' : '') + F.fmt(k.CH2O, 2) + ' L/giorno');
        cv.redraw();
      }
      run();
      return { destroy: function () { cv.dispose(); } };
    }
  });

  // ================================================================ Bilancio idrico
  F.registerSim('bilancio', {
    title: 'Bilancio idrico giornaliero',
    section: 'rene',
    short: 'Entrate e uscite di acqua: il rene regola l\'urina per pareggiare il bilancio, entro i limiti di concentrazione e diluizione.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { drink: 2100, sweat: 100, load: 900 };
      var sD = U.slider({ label: 'Acqua bevuta', min: 300, max: 6000, step: 50, value: st.drink, digits: 0, unit: 'mL/giorno', onInput: function (v) { st.drink = v; run(); } });
      var sS = U.slider({ label: 'Sudorazione', min: 0, max: 4000, step: 50, value: st.sweat, digits: 0, unit: 'mL/giorno', onInput: function (v) { st.sweat = v; run(); } });
      var sL = U.slider({ label: 'Carico osmotico (dieta)', min: 300, max: 1500, step: 10, value: st.load, digits: 0, unit: 'mOsm/giorno', onInput: function (v) { st.load = v; run(); } });
      [sD.el, sS.el, sL.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Valori di riferimento (Guyton & Hall): entrate 2100 mL bevande + 200 mL acqua metabolica; uscite: perspiratio cutanea 350, respirazione 350, sudore 100, feci 100, urina 1400 mL. L\'urina necessaria al pareggio è entrate − altre uscite; l\'osmolarità richiesta è carico osmotico / volume, possibile solo tra ~50 e ~1200 mOsm/L.'));
      var ro = U.readouts([{ key: 'u', label: 'Urina necessaria per il pareggio', hl: true }, { key: 'o', label: 'Osmolarità urinaria richiesta' }, { key: 'e', label: 'Esito' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var bars = [];
      var cv = U.canvas2d(holder, 300, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var tot = { 1: 0, 2: 0 }; bars.forEach(function (b) { tot[b[1]] += b[2]; });
        var max = Math.max(tot[1], tot[2], 1) * 1.08, bw = Math.min(140, w * 0.22), x = { 1: w * 0.28 - bw / 2, 2: w * 0.62 - bw / 2 }, y0 = h - 30, sc = (h - 60) / max, acc = { 1: 0, 2: 0 };
        ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--text');
        ctx.fillText('ENTRATE ' + F.fmt(tot[1], 0) + ' mL', x[1] + bw / 2, h - 10); ctx.fillText('USCITE ' + F.fmt(tot[2], 0) + ' mL', x[2] + bw / 2, h - 10);
        bars.forEach(function (b) {
          var hh = b[2] * sc, yy = y0 - acc[b[1]] * sc - hh; acc[b[1]] += b[2];
          ctx.fillStyle = css(b[3]); ctx.globalAlpha = 0.8; ctx.fillRect(x[b[1]], yy, bw, hh); ctx.globalAlpha = 1;
          if (hh > 14) { ctx.fillStyle = '#fff'; ctx.font = '11px ' + css('--font'); ctx.fillText(b[0] + ' ' + F.fmt(b[2], 0), x[b[1]] + bw / 2, yy + hh / 2 + 4); }
          else if (b[2] > 0) { ctx.fillStyle = css('--muted'); ctx.textAlign = 'left'; ctx.font = '11px ' + css('--font'); ctx.fillText(b[0] + ' ' + F.fmt(b[2], 0), x[b[1]] + bw + 6, yy + hh / 2 + 4); ctx.textAlign = 'center'; }
        });
      });
      function run() {
        var inTot = st.drink + 200, other = 350 + 350 + st.sweat + 100, urine = inTot - other, osm = urine > 0 ? st.load / (urine / 1000) : Infinity;
        ro.set('u', F.fmt(urine, 0) + ' mL'); ro.set('o', isFinite(osm) ? F.fmt(osm, 0) + ' mOsm/L' : '—');
        ro.set('e', urine <= 0 || osm > 1200 ? '<span style="color:var(--bad)">impossibile: bilancio negativo → disidratazione, sete</span>' : (osm < 50 ? '<span style="color:var(--warn)">oltre la capacità di diluizione: rischio di iponatriemia</span>' : '<span style="color:var(--ok)">pareggio possibile</span>'));
        bars = [['bevande', 1, st.drink, '--c1'], ['metabolica', 1, 200, '--c6'], ['cute', 2, 350, '--c5'], ['respirazione', 2, 350, '--c4'], ['sudore', 2, st.sweat, '--na'], ['feci', 2, 100, '--muted'], ['urina', 2, Math.max(0, urine), '--c3']];
        cv.redraw();
      }
      run();
      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
