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
      var L = U.simLayout(host), st = { Raff: 1, Reff: 1, Pa: 100, C: 7, PBS: 15, Kf: 1, auto: !!P.auto };
      var sA = U.slider({ label: 'Resistenza dell\'arteriola afferente', min: 0.5, max: 2.5, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Raff = v; run(); } });
      var sE = U.slider({ label: 'Resistenza dell\'arteriola efferente', min: 0.5, max: 4, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Reff = v; run(); } });
      var sPa = U.slider({ label: 'Pressione arteriosa renale', min: 60, max: 160, step: 1, value: 100, digits: 0, unit: 'mmHg', onInput: function (v) { st.Pa = v; run(); } });
      var sC = U.slider({ label: 'Proteine plasmatiche', min: 3, max: 10, step: 0.1, value: 7, digits: 1, unit: 'g/dL', onInput: function (v) { st.C = v; run(); } });
      var sB = U.slider({ label: 'Pressione nella capsula di Bowman', min: 5, max: 40, step: 1, value: 15, digits: 0, unit: 'mmHg', onInput: function (v) { st.PBS = v; run(); } });
      var sK = U.slider({ label: 'Coefficiente di filtrazione K<sub>f</sub>', min: 0.3, max: 2, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Kf = v; run(); } });
      var tAuto = U.toggle({ label: 'Autoregolazione (miogena e feedback tubulo-glomerulare)', value: st.auto, onChange: function (v) { st.auto = v; run(); } });
      [sA.el, sE.el, sPa.el, sC.el, sB.el, sK.el, tAuto.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [
        U.button('Simpatico: costrizione afferente', function () { reset(); sA.set(1.5); }),
        U.button('Angiotensina II: costrizione efferente', function () { reset(); sE.set(1.6); }),
        U.button('Ipoproteinemia', function () { reset(); sC.set(4.5); }),
        U.button('Ostruzione urinaria', function () { reset(); sB.set(30); }),
        U.button('Condizioni normali', function () { reset(); })
      ]));
      function reset() { var au = st.auto; [sA, sE, sK].forEach(function (s) { s.set(1, true); }); sPa.set(100, true); sC.set(7, true); sB.set(15, true); st = { Raff: 1, Reff: 1, Pa: 100, C: 7, PBS: 15, Kf: 1, auto: au }; run(); }
      // Autoregolazione: la resistenza dell'afferente si adatta alla pressione di perfusione (tra 80 e 180 mmHg il flusso resta quello di 100 mmHg).
      function opts(extra) { return Object.assign({ Raff: st.Raff, Reff: st.Reff, Pa: st.Pa, Cprot: st.C, PBS: st.PBS, Kf: st.Kf }, extra || {}); }
      function autoK() {
        if (!st.auto) return 1;
        var target = F.glomerulus(opts({ Pa: 100 })).RPF, pc = Math.max(80, Math.min(180, st.Pa)), lo = 0.3, hi = 4, i, mid;
        for (i = 0; i < 40; i++) { mid = (lo + hi) / 2; if (F.glomerulus(opts({ Pa: pc, Raff: st.Raff * mid })).RPF > target) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      }
      function glom(extra) { return F.glomerulus(opts(Object.assign({ Raff: st.Raff * autoK() }, extra || {}))); }
      L.controls.appendChild(U.params('Filtrazione calcolata integrando la legge di Starling lungo il capillare glomerulare: $dQ = K_f\\,(P_{GC} - P_{BS} - \\pi_{GC})\\,dx$, con π<sub>GC</sub> che sale perché le proteine si concentrano (Landis-Pappenheimer: $\\pi = 2{,}1C + 0{,}16C^2 + 0{,}009C^3$). Resistenze calibrate su: flusso ematico renale 1,1 L/min, P<sub>GC</sub> 55 mmHg, GFR 125 mL/min; K<sub>f</sub> calibrato di conseguenza. P<sub>GC</sub> di riferimento: le slide indicano 45–50 mmHg, altri testi (Guyton) 60 mmHg. L\'autoregolazione (miogena, feedback tubulo-glomerulare) è <b>facoltativa</b>: spenta, si vedono gli effetti diretti; accesa, la resistenza dell\'afferente si adatta in modo da mantenere il flusso di quello a 100 mmHg tra 80 e 180 mmHg di pressione arteriosa (fuori da questo intervallo l\'autoregolazione non basta).'));
      U.texify(L.controls);
      var ro = U.readouts([{ key: 'gfr', label: 'GFR', hl: true }, { key: 'rpf', label: 'Flusso plasmatico renale' }, { key: 'ff', label: 'Frazione di filtrazione' }, { key: 'pgc', label: 'P<sub>GC</sub>' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Pressioni lungo il capillare glomerulare', xlabel: 'posizione lungo il capillare (inizio → fine)', ylabel: 'mmHg', height: 240, xlim: [0, 1] });
      var p2 = U.plot(L.main, { title: 'GFR e flusso plasmatico al variare della resistenza efferente', xlabel: 'resistenza efferente (× normale)', ylabel: 'mL/min', height: 210, xlim: [0.5, 4] });
      function run() {
        var g = glom(), pr = g.profile;
        p1.update({ series: [{ name: 'P idrostatica glomerulare', x: pr.x, y: pr.PGC, color: '--c1' }, { name: 'P Bowman + π oncotica', x: pr.x, y: pr.pi.map(function (p) { return p + st.PBS; }), color: '--na' }, { name: 'pressione netta di filtrazione', x: pr.x, y: pr.NFP, color: '--c3', fill: true }], ylim: [0, 80], hlines: [] });
        ro.set('gfr', F.fmt(g.GFR, 0) + ' mL/min'); ro.set('rpf', F.fmt(g.RPF, 0) + ' mL/min'); ro.set('ff', F.fmt(g.FF * 100, 1) + '%');
        ro.set('pgc', F.fmt(g.PGC, 1) + ' mmHg' + (g.equilibrium ? ' · equilibrio di filtrazione' : ''));
        var rs = F.linspace(0.5, 4, 36), gg = rs.map(function (r) { return glom({ Reff: r }); });
        p2.update({ series: [{ name: 'GFR', x: rs, y: gg.map(function (x) { return x.GFR; }), color: '--c1' }, { name: 'flusso plasmatico (RPF)', x: rs, y: gg.map(function (x) { return x.RPF; }), color: '--na' }, { x: [st.Reff], y: [g.GFR], type: 'points', color: '--c1', r: 6 }], ylim: [0, null], vlines: [{ x: st.Reff, label: 'attuale' }] });
      }
      run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var glBase = function () { tAuto.set(false); reset(); };
      U.explainer(L, {
        watch: ro,
        base: glBase,
        legend: [['--c1', 'P idrostatica nel capillare (spinge fuori)'], ['--na', 'P della capsula di Bowman + π oncotica (trattengono)'], ['--c3', 'verde: pressione netta di filtrazione']],
        narrate: function () {
          var f = F.fmt, g = glom(), n = F.glomerulus({}), pr = g.profile, last = pr.x.length - 1;
          var s = `Il plasma viene filtrato verso la capsula di Bowman perché la pressione idrostatica nel capillare (P<sub>GC</sub> = <b>${f(g.PGC, 0)} mmHg</b>) spinge fuori più di quanto trattengano la pressione nella capsula (${f(st.PBS, 0)} mmHg) e la pressione oncotica delle proteine plasmatiche (π<sub>GC</sub>). Man mano che l'acqua esce, le proteine restano nel capillare e si concentrano: π<sub>GC</sub> sale da ${f(pr.pi[0], 0)} a ${f(pr.pi[last], 0)} mmHg e la pressione netta di filtrazione scende da ${f(pr.NFP[0], 0)} a ${f(pr.NFP[last], 0)} mmHg (area verde). `;
          if (g.equilibrium) s += `Verso la fine la pressione netta arriva a zero: <b>equilibrio di filtrazione</b>, l'ultimo tratto del capillare non filtra più. `;
          s += `Risultato: GFR <b>${f(g.GFR, 0)} mL/min</b> (condizioni normali: ${f(n.GFR, 0)}), con un flusso plasmatico di ${f(g.RPF, 0)} mL/min. `;
          var c = [];
          if (st.Raff > 1.05) c.push(`L'<b>afferente stretta</b> (×${f(st.Raff, 2)}) riduce sia il flusso sia la pressione nel glomerulo: la GFR cala.`);
          if (st.Raff < 0.95) c.push(`L'<b>afferente dilatata</b> aumenta flusso e pressione: la GFR sale.`);
          if (st.Reff > 1.05) c.push(`L'<b>efferente stretta</b> (×${f(st.Reff, 2)}) fa salire P<sub>GC</sub> (il sangue esce a fatica) ma riduce il flusso plasmatico: la GFR aumenta per costrizioni moderate, ma se è forte il flusso diventa così basso che le proteine si concentrano subito e la GFR torna a calare (curva in basso: ha un massimo).`);
          if (st.Reff < 0.95) c.push(`L'<b>efferente dilatata</b> abbassa P<sub>GC</sub>: la GFR cala.`);
          if (Math.abs(st.C - 7) > 0.3) c.push(st.C < 7 ? `Con <b>poche proteine</b> la pressione oncotica è bassa: trattiene meno e la GFR aumenta.` : `Con <b>molte proteine</b> la pressione oncotica è alta: trattiene di più e la GFR cala.`);
          if (st.PBS > 17) c.push(`Con la <b>pressione di Bowman alta</b> (per esempio per un'ostruzione delle vie urinarie) la filtrazione è ostacolata e la GFR cala.`);
          if (Math.abs(st.Pa - 100) > 3) c.push(st.auto ? (st.Pa >= 80 && st.Pa <= 180 ? `Con la <b>pressione arteriosa</b> a ${f(st.Pa, 0)} mmHg l'<b>autoregolazione</b> adatta la resistenza dell'afferente (×${f(autoK(), 2)}) e la GFR resta quasi quella normale (tra circa 80 e 180 mmHg).` : `A ${f(st.Pa, 0)} mmHg siamo <b>fuori dall'intervallo di autoregolazione</b> (80–180 mmHg): l'afferente non riesce più a compensare e la GFR segue la pressione.`) : `Cambiando la <b>pressione arteriosa</b> senza autoregolazione (accendila qui sotto) la GFR varia con essa; nel rene reale resta quasi costante tra circa 80 e 180 mmHg.`);
          if (Math.abs(st.Kf - 1) > 0.05) c.push(st.Kf < 1 ? `Un <b>K<sub>f</sub> ridotto</b> (meno superficie o permeabilità filtrante, per esempio per un danno glomerulare) abbassa la GFR.` : `Un <b>K<sub>f</sub> aumentato</b> alza la GFR.`);
          return s + c.join(' ');
        },
        experiments: [
          { label: 'Condizioni normali', run: function () { glBase(); }, why: `P<sub>GC</sub> circa 55 mmHg, GFR circa 125 mL/min: valori di riferimento.` },
          { label: 'Afferente stretta (simpatico)', run: function () { glBase(); sA.set(1.5); }, why: `Meno sangue entra nel glomerulo e la pressione cala: sia la GFR sia il flusso plasmatico diminuiscono.` },
          { label: 'Efferente stretta (angiotensina II)', run: function () { glBase(); sE.set(1.6); }, why: `La pressione nel glomerulo sale perché il sangue fatica a uscire, il flusso plasmatico cala: la frazione di filtrazione aumenta e la GFR sale.` },
          { label: 'Efferente molto stretta', run: function () { glBase(); sE.set(4); }, why: `La GFR non cresce all'infinito: ha un massimo per costrizioni moderate e poi ridiscende. Con una costrizione estrema il flusso plasmatico scende a meno della metà, le proteine si concentrano subito, π sale fino a fermare la filtrazione (equilibrio) e il vantaggio della pressione alta si perde.` },
          { label: 'Ipoproteinemia', run: function () { glBase(); sC.set(4.5); }, why: `Meno proteine = pressione oncotica più bassa = meno forza che trattiene l'acqua: la GFR aumenta molto.` },
          { label: 'Ostruzione urinaria', run: function () { glBase(); sB.set(30); }, why: `Una pressione più alta nella capsula si oppone alla filtrazione: la GFR cala molto.` },
          { label: 'Pressione arteriosa 140 (senza autoregolazione)', run: function () { glBase(); sPa.set(140); }, why: `Senza autoregolazione la GFR segue la pressione: aumenta molto, come in un sistema di semplici resistenze.` },
          { label: 'Pressione arteriosa 140 con autoregolazione', run: function () { glBase(); sPa.set(140); tAuto.set(true); }, why: `L'afferente si costringe all'aumentare della pressione (risposta miogena e feedback tubulo-glomerulare): flusso e GFR restano quasi quelli normali. È per questo che la GFR è stabile tra circa 80 e 180 mmHg.` },
          { label: 'Pressione arteriosa 60 con autoregolazione', run: function () { glBase(); sPa.set(60); tAuto.set(true); }, why: `Sotto circa 80 mmHg l'afferente è già al massimo della dilatazione e l'autoregolazione non basta: la GFR cala con la pressione (per questo nello shock si riduce la diuresi).` }
        ]
      });
      /*EXPLAIN-END*/

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
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var nfBase = function () { sP.set(287); sL.set(900); mSel.set('normal'); };
      U.explainer(L, {
        watch: ro,
        base: nfBase,
        legend: [['#2f6fd0', 'blu: liquido diluito (osmolarità bassa)'], ['#d9a63a', 'giallo/verde: osmolarità intermedia'], ['#d03a2f', 'rosso: liquido concentrato (osmolarità alta)']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot(), adh = parseFloat(sn[0].value.replace(',', '.')), s;
          var pos = st.Posm > 281 ? `sopra` : `sotto`;
          if (st.mode === 'dic') s = `<b>Diabete insipido centrale</b>: l'ipotalamo non produce ADH (${sn[0].value}), anche se il plasma è a ${f(st.Posm, 1)} mOsm/kg. Senza ADH le acquaporine AQP2 non vengono inserite nella membrana del dotto collettore, che resta impermeabile all'acqua: l'urina rimane diluita (${sn[1].value}) e abbondante (${sn[2].value}, poliuria). Il paziente perde acqua, l'osmolarità plasmatica sale e provoca sete intensa.`;
          else if (st.mode === 'din') s = `<b>Diabete insipido nefrogenico</b>: l'ADH è presente (${sn[0].value}), ma il rene non risponde (recettore V2 o AQP2 non funzionanti). Il dotto collettore resta impermeabile all'acqua e il gradiente midollare si dissipa: urina diluita (${sn[1].value}) e abbondante (${sn[2].value}). L'ADH viene secreto normalmente (e salirebbe ancora se il plasma diventasse iperosmotico), ma senza recettori funzionanti è inutile.`;
          else if (st.mode === 'siadh') s = `<b>SIADH</b>: l'ADH è alto (${sn[0].value}) qualunque sia l'osmolarità del plasma (qui ${f(st.Posm, 1)} mOsm/kg). Le AQP2 restano sempre inserite, il rene risparmia acqua e produce urina concentrata (${sn[1].value}) in poca quantità (${sn[2].value}) anche se il plasma è già diluito: l'acqua si accumula, il sodio plasmatico si diluisce (iponatriemia).`;
          else {
            s = `L'osmolarità plasmatica è <b>${f(st.Posm, 1)} mOsm/kg</b>, ${pos} la soglia di circa 280 per la secrezione di ADH. Gli osmocettori dell'ipotalamo rispondono: ADH = <b>${sn[0].value}</b>. `;
            if (adh < 1) s += `Con poco ADH le acquaporine AQP2 non sono inserite: il dotto collettore, che attraversa la midollare ipertonica, resta impermeabile all'acqua e il liquido esce diluito. Urina <b>${sn[1].value}</b>, volume <b>${sn[2].value}</b>: si elimina acqua in eccesso (clearance dell'acqua libera positiva: ${sn[3].value}).`;
            else s += `L'ADH si lega ai recettori V2, che fanno inserire acquaporine AQP2 nella membrana apicale del dotto collettore: l'acqua esce per osmosi verso la midollare ipertonica (fino a ${f(1200, 0)} mOsm/L) e l'urina si concentra: <b>${sn[1].value}</b>, volume <b>${sn[2].value}</b>. L'acqua viene risparmiata (clearance dell'acqua libera: ${sn[3].value}). Il volume non può scendere sotto carico osmotico / 1200: è il volume minimo obbligato.`;
          }
          return s;
        },
        experiments: [
          { label: 'Normale', run: function () { nfBase(); }, why: `Plasma a 287 mOsm/kg: ADH moderato, urina un po' concentrata.` },
          { label: 'Dopo aver bevuto 1,5 L', run: function () { nfBase(); sP.set(281); }, why: `Il plasma si diluisce, l'ADH quasi scompare, le AQP2 vengono rimosse dalla membrana: si elimina l'acqua in eccesso con urina diluita e abbondante (i volumi sono espressi per giorno, come se la condizione durasse 24 ore).` },
          { label: 'Disidratazione', run: function () { nfBase(); sP.set(298); }, why: `Il plasma è più concentrato: l'ADH sale molto, l'urina è al massimo della concentrazione e il volume minimo, per risparmiare acqua (e c'è sete).` },
          { label: 'Diabete insipido centrale', run: function () { nfBase(); mSel.set('dic'); }, why: `Senza ADH il dotto è impermeabile: poliuria con urina diluita. È curabile con ADH sintetico (desmopressina).` },
          { label: 'Diabete insipido nefrogenico', run: function () { nfBase(); mSel.set('din'); }, why: `L'ADH c'è ma il rene non risponde: stessi sintomi, ma la desmopressina non funziona perché il difetto è nel recettore V2/AQP2.` },
          { label: 'SIADH (plasma diluito)', run: function () { nfBase(); sP.set(281); mSel.set('siadh'); }, why: `L'ADH resta alto anche con plasma già diluito: l'urina resta concentrata e poca, l'acqua si accumula.` },
          { label: 'Carico osmotico alto (1500)', base: function () { nfBase(); sP.set(298); }, run: function () { nfBase(); sP.set(298); sL.set(1500); }, why: `Partendo dalla disidratazione (urina già al massimo di 1200 mOsm/L): con più soluti da eliminare e la stessa osmolarità massima serve più acqua, quindi il volume minimo obbligato sale (carico / 1200).` }
        ]
      });
      /*EXPLAIN-END*/

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
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var biBase = function () { sD.set(2100); sS.set(100); sL.set(900); };
      U.explainer(L, {
        watch: ro,
        base: biBase,
        legend: [['--c1', 'barra sinistra: entrate'], ['--c3', 'urina: unica uscita regolata dal rene']],
        narrate: function () {
          var f = F.fmt, inTot = st.drink + 200, other = 350 + 350 + st.sweat + 100, urine = inTot - other, osm = urine > 0 ? st.load / (urine / 1000) : Infinity;
          var s = `Entrate: ${f(st.drink, 0)} mL di bevande + 200 mL di acqua prodotta dal metabolismo = <b>${f(inTot, 0)} mL</b>. Uscite non regolate dal rene: cute 350, respirazione 350, sudore ${f(st.sweat, 0)}, feci 100 = <b>${f(other, 0)} mL</b>. Il rene può modificare solo l'urina: per pareggiare il bilancio deve produrne <b>${f(urine, 0)} mL</b> (${f(inTot, 0)} − ${f(other, 0)}). `;
          if (urine <= 0) return { kind: 'bad', html: s + `Ma le uscite superano già le entrate anche con urina uguale a zero: il bilancio è negativo di ${f(-urine, 0)} mL, quindi disidratazione, aumento di ADH e sete.` };
          if (osm > 1200) return { kind: 'bad', html: s + `Per eliminare ${f(st.load, 0)} mOsm in quel volume l'urina dovrebbe avere ${f(osm, 0)} mOsm/L, ma il rene non riesce a superare circa 1200: bisognerebbe produrre almeno ${f(st.load / 1.2, 0)} mL di urina, e quindi bere di più o sudare meno.` };
          if (osm < 50) return { kind: 'warn', html: s + `Per smaltire quell'acqua l'urina dovrebbe avere ${f(osm, 0)} mOsm/L, ma il rene non può diluire sotto circa 50: l'acqua in eccesso si accumula e il sodio plasmatico si diluisce (iponatriemia).` };
          return { kind: 'ok', html: s + `Quell'urina ha una osmolarità di ${f(osm, 0)} mOsm/L (carico ${f(st.load, 0)} mOsm/giorno), dentro i limiti 50–1200 del rene: il pareggio è possibile, e l'ADH regola l'osmolarità per ottenerlo.` };
        },
        experiments: [
          { label: 'Giornata normale', run: function () { biBase(); }, why: `Entrate 2300 mL e uscite extrarenali 900 mL: servono 1400 mL di urina, con osmolarità di circa 640 mOsm/L.` },
          { label: 'Poca acqua (500 mL)', run: function () { biBase(); sD.set(500); }, why: `Le entrate (700 mL) sono inferiori alle uscite che il rene non controlla (900 mL): anche con urina uguale a zero il bilancio è negativo e non si può pareggiare.` },
          { label: 'Sudorazione intensa (3000 mL)', run: function () { biBase(); sS.set(3000); }, why: `Il sudore porta via acqua che il rene non può recuperare del tutto: senza bere di più il bilancio diventa negativo.` },
          { label: 'Sudorazione + bere 5000 mL', run: function () { biBase(); sS.set(3000); sD.set(5000); }, why: `Bevendo di più le entrate compensano il sudore: il pareggio richiede la stessa quantità di urina di una giornata normale (1400 mL), quindi nulla cambia nel rene.` },
          { label: 'Troppa acqua (6000 mL)', run: function () { biBase(); sD.set(6000); }, why: `Il rene può diluire l'urina solo fino a circa 50 mOsm/L: con troppa acqua il volume necessario richiede una diluizione impossibile e si rischia l'iponatriemia.` },
          { label: 'Dieta ricca di soluti (1500 mOsm)', run: function () { biBase(); sL.set(1500); sD.set(1000); }, why: `Più soluti da eliminare richiedono più acqua: con poche bevande l'urina dovrebbe essere troppo concentrata.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
