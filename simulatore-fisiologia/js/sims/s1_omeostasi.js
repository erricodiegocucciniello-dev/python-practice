/* Sezione 1 — Omeostasi ed energia (lezioni 1–3). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Anello di controllo
  F.registerSim('feedback', {
    title: 'Anello di controllo (feedback)',
    section: 'omeostasi',
    short: 'Sistema controllato, sensore, comparatore ed effettore: retroazione negativa e positiva, guadagno, ritardo, controllo a preazione, assuefazione del sensore.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = {
        type: P.type || 'neg', K: P.K === undefined ? 9 : P.K, d: P.d === undefined ? -2 : P.d,
        delay: P.delay || 0, ff: !!P.ff, adapt: !!P.adapt
      };
      var typeSel = U.seg({ label: 'Tipo di retroazione', options: [['neg', 'Negativa'], ['pos', 'Positiva'], ['open', 'Assente (ciclo aperto)']], value: st.type, onChange: function (v) { st.type = v; run(); } });
      var sK = U.slider({ label: 'Guadagno dell\'anello K', min: 0, max: 30, step: 0.5, value: st.K, digits: 1, onInput: function (v) { st.K = v; run(); } });
      var sD = U.slider({ label: 'Disturbo (es. freddo esterno)', min: -4, max: 4, step: 0.1, value: st.d, digits: 1, unit: '°C', onInput: function (v) { st.d = v; run(); } });
      var sDel = U.slider({ label: 'Ritardo del sensore', min: 0, max: 4, step: 0.1, value: st.delay, digits: 1, unit: 'min', onInput: function (v) { st.delay = v; run(); } });
      var tFF = U.toggle({ label: 'Controllo a preazione (feedforward)', value: st.ff, onChange: function (v) { st.ff = v; run(); } });
      var tAd = U.toggle({ label: 'Assuefazione del sensore', value: st.adapt, onChange: function (v) { st.adapt = v; run(); } });
      L.controls.appendChild(typeSel.el); L.controls.appendChild(sK.el); L.controls.appendChild(sD.el);
      L.controls.appendChild(U.advanced([sDel.el, tFF.el, tAd.el], 'Ritardo, preazione, assuefazione'));
      var diag = el('div'); L.main.appendChild(diag);
      var cv = U.canvas2d(diag, function (w) { return w < 520 ? 190 : 175; }, drawDiagram);
      var ro = U.readouts([{ key: 'err', label: 'Errore a regime', hl: true }, { key: 'th', label: 'Teoria: disturbo/(1+K)' }, { key: 'eff', label: 'Risposta dell\'effettore' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Variabile controllata', xlabel: 'tempo (min)', ylabel: 'valore (°C)', height: 220, xname: 't' });
      var last = null;
      function drawDiagram(ctx, w, h) {
        var css = U.css, txt = css('--text'), mu = css('--muted'), acc = css('--accent'), sur = css('--surface');
        ctx.clearRect(0, 0, w, h);
        var bw = Math.min(150, w / 4.6), bh = 42, y1 = 28, y2 = h - 78;
        var boxes = [
          { x: w * 0.06, y: y1, t: 'Sistema controllato', s: 'grandezza K' },
          { x: w * 0.40, y: y1, t: 'Sensore', s: '' },
          { x: w * 0.74, y: y1, t: 'Comparatore', s: 'valore ideale' },
          { x: w * 0.40, y: y2, t: 'Effettore', s: '' }
        ];
        ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        boxes.forEach(function (b) {
          ctx.fillStyle = sur; ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(b.x, b.y, bw, bh, 8) : ctx.rect(b.x, b.y, bw, bh); ctx.fill(); ctx.stroke();
          ctx.fillStyle = txt; ctx.fillText(b.t, b.x + bw / 2, b.y + bh / 2 - (b.s ? 7 : 0));
          if (b.s) { ctx.fillStyle = mu; ctx.font = '11px ' + css('--font'); ctx.fillText(b.s, b.x + bw / 2, b.y + bh / 2 + 9); ctx.font = '600 12px ' + css('--font'); }
        });
        var col = st.type === 'pos' ? css('--bad') : (st.type === 'open' ? mu : css('--ok'));
        U.arrow(ctx, boxes[0].x + bw, y1 + bh / 2, boxes[1].x, y1 + bh / 2, mu, 1.6);
        U.arrow(ctx, boxes[1].x + bw, y1 + bh / 2, boxes[2].x, y1 + bh / 2, mu, 1.6);
        if (st.type !== 'open') {
          ctx.strokeStyle = col; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(boxes[2].x + bw / 2, y1 + bh); ctx.lineTo(boxes[2].x + bw / 2, y2 + bh / 2); ctx.lineTo(boxes[3].x + bw + 6, y2 + bh / 2); ctx.stroke();
          U.arrow(ctx, boxes[3].x + bw + 8, y2 + bh / 2, boxes[3].x + bw, y2 + bh / 2, col, 2);
          ctx.beginPath(); ctx.moveTo(boxes[3].x, y2 + bh / 2); ctx.lineTo(boxes[0].x + bw / 2, y2 + bh / 2); ctx.stroke();
          U.arrow(ctx, boxes[0].x + bw / 2, y2 + bh / 2, boxes[0].x + bw / 2, y1 + bh, col, 2);
          ctx.fillStyle = col; ctx.font = '600 12px ' + css('--font');
          ctx.fillText(st.type === 'pos' ? 'retroazione POSITIVA: amplifica l\'errore' : 'retroazione NEGATIVA: corregge l\'errore (segnale E)', w / 2, h - 12);
        } else {
          ctx.fillStyle = mu; ctx.fillText('nessun canale di retroazione: il disturbo non viene corretto', w / 2, h - 12);
        }
        ctx.fillStyle = css('--na'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
        ctx.fillText('disturbo ↓', boxes[0].x + 4, 12);
        if (last) {
          ctx.fillStyle = txt; ctx.textAlign = 'center';
          ctx.fillText('valore attuale: ' + F.fmt(last.y, 2) + ' °C', boxes[0].x + bw / 2, y1 + bh + 14);
        }
      }
      function run() {
        var r = F.feedbackLoop({ K: st.K, tau: 5, set: 37, type: st.type, delay: st.delay, adaptTau: st.adapt ? 15 : 0, feedforward: st.ff ? 1 : 0, tmax: 80, disturbance: function (t) { return t >= 10 ? st.d : 0; } });
        var yEnd = r.y[r.y.length - 1];
        last = { y: yEnd };
        var ymin = Math.min.apply(null, r.y), ymax = Math.max.apply(null, r.y);
        p1.update({
          series: [{ x: r.t, y: r.y, color: '--c1' }],
          hlines: [{ y: 37, label: 'valore ideale 37 °C', color: '--ok', align: 'left' }],
          vlines: [{ x: 10, label: 'inizia il disturbo' }],
          ylim: [Math.max(ymin - 0.3, 25), Math.min(ymax + 0.3, 50)]
        });
        var err = yEnd - 37, unstable = Math.abs(err) > 20;
        ro.set('err', unstable ? 'instabile' : F.fmt(err, 2) + ' °C');
        ro.set('th', st.type === 'neg' && !st.ff && !st.adapt ? F.fmt(st.d / (1 + st.K), 2) + ' °C' : (st.type === 'open' ? F.fmt(st.d, 2) + ' °C' : '—'));
        ro.set('eff', F.fmt(r.u[r.u.length - 1], 2));
        cv.redraw();
      }
      run();
      return { destroy: function () { p1.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ Glicemia
  F.registerSim('glicemia', {
    title: 'Glicemia e insulina (OGTT)',
    section: 'omeostasi',
    short: 'Esempio di retroazione negativa: un carico di glucosio stimola l\'insulina, che riporta la glicemia al valore di riferimento.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { cond: P.cond || 'normale', meal: P.meal === undefined ? 75 : P.meal, ins: 0 };
      var conds = { normale: { sensitivity: 1, beta: 1 }, resistenza: { sensitivity: 0.35, beta: 1 }, tipo2: { sensitivity: 0.25, beta: 0.4 }, tipo1: { sensitivity: 1, beta: 0.02 } };
      var cSel = U.select({ label: 'Condizione', value: st.cond, options: [['normale', 'Soggetto sano'], ['resistenza', 'Insulino-resistenza (β compensa)'], ['tipo2', 'Diabete tipo 2 (resistenza + deficit β)'], ['tipo1', 'Diabete tipo 1 (niente insulina)']], onChange: function (v) { st.cond = v; run(); } });
      var sM = U.slider({ label: 'Glucosio ingerito', min: 0, max: 100, step: 5, value: st.meal, digits: 0, unit: 'g', onInput: function (v) { st.meal = v; run(); } });
      var sI = U.slider({ label: 'Insulina iniettata (a 60 min)', min: 0, max: 100, step: 5, value: 0, digits: 0, unit: 'µU/mL', onInput: function (v) { st.ins = v; run(); } });
      L.controls.appendChild(cSel.el); L.controls.appendChild(sM.el); L.controls.appendChild(sI.el);
      L.controls.appendChild(U.params('Modello compartimentale derivato dal modello minimo di Bergman (1979): azione insulinica con ritardo, secrezione sigmoidale, assorbimento intestinale con il 65% del glucosio che raggiunge il circolo sistemico. Calibrato sui criteri OGTT (OMS/ADA): normale a 2 h &lt; 7,8 mmol/L; diabete: digiuno ≥ 7,0 o 2 h ≥ 11,1 mmol/L. È un modello didattico: mostra la logica del controllo, non sostituisce dati clinici.'));
      var ro = U.readouts([{ key: 'f', label: 'Glicemia a digiuno' }, { key: 'p', label: 'Picco' }, { key: 'h2', label: 'A 2 ore dal carico', hl: true }, { key: 'dx', label: 'Interpretazione OGTT' }]);
      L.main.appendChild(ro.el);
      var pG = U.plot(L.main, { title: 'Glicemia', xlabel: 'tempo (min)', ylabel: 'glucosio (mmol/L)', height: 220 });
      var pI = U.plot(L.main, { title: 'Insulina plasmatica', xlabel: 'tempo (min)', ylabel: 'insulina (µU/mL)', height: 170 });
      function run() {
        var c = conds[st.cond];
        var r = F.glucoseModel({ sensitivity: c.sensitivity, beta: c.beta, mealGrams: st.meal, mealAt: 30, insulinAt: st.ins > 0 ? 90 : undefined, insulinDose: st.ins, tmax: 270 });
        var at = function (t) { return r.G[r.t.findIndex(function (x) { return x >= t; })]; };
        var fast = r.fasting[0], pk = Math.max.apply(null, r.G), h2 = at(150);
        pG.update({ series: [{ x: r.t, y: r.G, color: '--c1' }], vlines: [{ x: 30, label: 'carico di glucosio' }, { x: 150, label: '2 ore' }],
          hlines: [{ y: 7.8, label: '7,8', color: '--warn' }, { y: 11.1, label: '11,1 (soglia diabete)', color: '--bad' }], ylim: [0, Math.max(14, pk + 1)] });
        pI.update({ series: [{ x: r.t, y: r.I, color: '--c4' }], ylim: [0, null] });
        ro.set('f', F.fmt(fast, 1) + ' mmol/L'); ro.set('p', F.fmt(pk, 1) + ' mmol/L'); ro.set('h2', F.fmt(h2, 1) + ' mmol/L');
        var dx = (fast >= 7 || h2 >= 11.1) ? '<span style="color:var(--bad)">compatibile con diabete</span>' : (h2 >= 7.8 ? '<span style="color:var(--warn)">ridotta tolleranza</span>' : '<span style="color:var(--ok)">normale</span>');
        ro.set('dx', st.meal === 75 ? dx : '(test standard: 75 g)');
      }
      run();
      return { destroy: function () { pG.dispose(); pI.dispose(); } };
    }
  });

  // ================================================================ Compartimenti idrici
  F.registerSim('compartimenti', {
    title: 'Compartimenti idrici e osmolarità',
    section: 'omeostasi',
    short: 'Acqua corporea totale, liquido intracellulare ed extracellulare: dove va l\'acqua quando si aggiunge acqua o sale?',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mass: 70, sex: 'M', water: P.water || 0, nacl: P.nacl || 0 };
      var sMass = U.slider({ label: 'Peso corporeo', min: 40, max: 120, step: 1, value: 70, digits: 0, unit: 'kg', onInput: function (v) { st.mass = v; run(); } });
      var sSex = U.seg({ label: 'Sesso', options: [['M', 'Uomo (60%)'], ['F', 'Donna (50%)']], value: 'M', onChange: function (v) { st.sex = v; run(); } });
      var sW = U.slider({ label: 'Acqua aggiunta (+) o persa (−)', min: -3, max: 3, step: 0.1, value: st.water, digits: 1, unit: 'L', onInput: function (v) { st.water = v; run(); } });
      var sN = U.slider({ label: 'NaCl aggiunto (+) o perso (−)', min: -600, max: 600, step: 10, value: st.nacl, digits: 0, unit: 'mmol', onInput: function (v) { st.nacl = v; run(); } });
      var pre = el('div', { class: 'btn-row' }, [
        U.button('1 L di acqua', function () { sW.set(1); sN.set(0); }),
        U.button('1 L fisiologica 0,9%', function () { sW.set(1); sN.set(154); }),
        U.button('1 L salina 3%', function () { sW.set(1); sN.set(513); }),
        U.button('Disidratazione (−2 L)', function () { sW.set(-2); sN.set(0); }),
        U.button('Azzera', function () { sW.set(0); sN.set(0); })
      ]);
      L.controls.appendChild(sMass.el); L.controls.appendChild(sSex.el);
      L.controls.appendChild(U.group('Perturbazione', [sW.el, sN.el, pre]));
      L.controls.appendChild(U.params('Acqua totale = 60% (uomo) o 50% (donna) del peso; LIC = 2/3, LEC = 1/3; plasma = 20% del LEC (valori della lezione 1: 28 L, 11,2 L, 2,8 L per 70 kg). Osmolarità iniziale 290 mOsm/L; NaCl conta come 2 osmoli; equilibrio osmotico istantaneo; le cellule non perdono né acquistano soluti.'));
      var ro = U.readouts([{ key: 'osm', label: 'Osmolarità finale', hl: true }, { key: 'icf', label: 'Variazione LIC' }, { key: 'ecf', label: 'Variazione LEC' }, { key: 'pl', label: 'Variazione plasma' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var data = null;
      var cv = U.canvas2d(holder, 260, function (ctx, w, h) {
        if (!data) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var maxV = Math.max(data.before.TBW, data.after.TBW) * 1.05, x0 = 70, barW = w - x0 - 20;
        var drawBar = function (y, d, label) {
          var sx = function (v) { return v / maxV * barW; };
          var segs = [['LIC', d.ICF, '--k'], ['interstizio', d.inter, '--cl'], ['plasma', d.plasma, '--na']], x = x0;
          ctx.font = '600 12px ' + css('--font'); ctx.fillStyle = css('--text'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(label, x0 - 8, y + 30);
          segs.forEach(function (s) {
            var wv = sx(s[1]); ctx.fillStyle = css(s[2]); ctx.globalAlpha = 0.8; ctx.fillRect(x, y, wv, 60); ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '600 12px ' + css('--font');
            if (wv > 60) { ctx.fillText(s[0], x + wv / 2, y + 22); ctx.fillText(F.fmt(s[1], 1) + ' L', x + wv / 2, y + 40); }
            x += wv;
          });
          ctx.fillStyle = css('--muted'); ctx.textAlign = 'left'; ctx.font = '12px ' + css('--font');
          ctx.fillText(F.fmt(d.osm, 0) + ' mOsm/L', x + 6 > w - 80 ? x - 90 : x + 6, y + 72);
        };
        drawBar(20, data.before, 'Prima'); drawBar(140, data.after, 'Dopo');
      });
      function run() {
        data = F.bodyWater({ mass: st.mass, sex: st.sex, addWater: st.water, addNaClmmol: st.nacl });
        var b = data.before, a = data.after;
        var dv = function (x) { return (x >= 0 ? '+' : '') + F.fmt(x, 2) + ' L'; };
        if (a.TBW <= 0 || a.ICF <= 0) { ro.set('osm', '—'); return; }
        ro.set('osm', F.fmt(a.osm, 0) + ' mOsm/L'); ro.set('icf', dv(a.ICF - b.ICF)); ro.set('ecf', dv(a.ECF - b.ECF)); ro.set('pl', dv(a.plasma - b.plasma));
        cv.redraw();
      }
      run();
      return { destroy: function () { cv.dispose(); } };
    }
  });

  // ================================================================ Energia libera e ATP
  F.registerSim('energia', {
    title: 'Energia libera, reazioni accoppiate e ATP',
    section: 'omeostasi',
    short: 'ΔG = ΔG°′ + RT ln Q: direzione di una reazione, equilibrio, accoppiamento con l\'idrolisi dell\'ATP, resa energetica dell\'ossidazione del glucosio.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mode: P.mode || 'singola', dG0: P.dG0 === undefined ? 13.8 : P.dG0, logQ: 0, T: 37, couple: P.couple === undefined ? true : P.couple, rxn: 'g6p', ATP: 2.25, ADP: 0.25, Pi: 1.65 };
      var rxns = { g6p: ['Glucosio + Pᵢ → glucosio-6-P', 13.8], gln: ['Glutammato + NH₄⁺ → glutammina', 14.2], custom: ['Reazione A → B (scegli ΔG°′)', null] };
      var mSel = U.seg({ options: [['singola', 'Una reazione'], ['glucosio', 'Ossidazione del glucosio']], value: st.mode, onChange: function (v) { st.mode = v; build(); } });
      L.controls.appendChild(mSel.el);
      var box = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }); L.controls.appendChild(box);
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }, { key: 'd', label: '' }]);
      L.main.appendChild(ro.el);
      var info = el('div', { class: 'statusline' }); L.main.appendChild(info);
      var holder = el('div'); L.main.appendChild(holder);
      var draw = null;
      var cv = U.canvas2d(holder, 250, function (ctx, w, h) { if (draw) draw(ctx, w, h); });
      var setLabels = function (labels) { var n = ro.el.querySelectorAll('.rl'); labels.forEach(function (l, i) { n[i].innerHTML = l; }); };
      function build() {
        box.innerHTML = '';
        if (st.mode === 'singola') {
          var rSel = U.select({ label: 'Reazione', value: st.rxn, options: Object.keys(rxns).map(function (k) { return [k, rxns[k][0]]; }), onChange: function (v) { st.rxn = v; if (rxns[v][1] !== null) sG.set(rxns[v][1]); run(); } });
          var sG = U.slider({ label: 'ΔG°′ della reazione', min: -40, max: 40, step: 0.1, value: st.dG0, digits: 1, unit: 'kJ/mol', onInput: function (v) { st.dG0 = v; run(); } });
          var sQ = U.slider({ label: 'Rapporto [prodotti]/[reagenti] Q', min: 1e-6, max: 1e6, value: Math.pow(10, st.logQ), log: true, fmt: function (v) { return F.fmt(v, 2); }, onInput: function (v) { st.logQ = Math.log10(v); run(); } });
          var tC = U.toggle({ label: 'Accoppia con l\'idrolisi di ATP', value: st.couple, onChange: function (v) { st.couple = v; run(); } });
          var sATP = U.slider({ label: '[ATP]', min: 0.5, max: 8, step: 0.05, value: st.ATP, digits: 2, unit: 'mM', onInput: function (v) { st.ATP = v; run(); } });
          var sADP = U.slider({ label: '[ADP]', min: 0.01, max: 3, step: 0.01, value: st.ADP, digits: 2, unit: 'mM', onInput: function (v) { st.ADP = v; run(); } });
          var sPi = U.slider({ label: '[Pᵢ]', min: 0.1, max: 10, step: 0.05, value: st.Pi, digits: 2, unit: 'mM', onInput: function (v) { st.Pi = v; run(); } });
          [rSel.el, sG.el, sQ.el, tC.el].forEach(function (e) { box.appendChild(e); });
          box.appendChild(U.advanced([sATP.el, sADP.el, sPi.el], 'Concentrazioni di ATP, ADP, Pᵢ (default: eritrocita)'));
          box.appendChild(U.params('ΔG°′ (pH 7, 25 °C) da Lehninger: glucosio + Pᵢ → G6P +13,8; glutammato + NH₄⁺ → glutammina +14,2; ATP → ADP + Pᵢ −30,5 kJ/mol. Concentrazioni dell\'eritrocita umano (Lehninger): ATP 2,25, ADP 0,25, Pᵢ 1,65 mM. Temperatura 37 °C.'));
        } else {
          var sN = U.slider({ label: 'ATP prodotti per glucosio', min: 26, max: 38, step: 1, value: 32, digits: 0, onInput: function (v) { st.nATP = v; run(); } });
          st.nATP = 32;
          box.appendChild(sN.el);
          box.appendChild(U.params('C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O: ΔG°′ = −2840 kJ/mol (slide: −686 kcal/mol = −2870 kJ/mol). Resa: 30–32 ATP per glucosio (stima attuale; 36–38 nei testi più vecchi). ΔG dell\'ATP: −30,5 kJ/mol in condizioni standard, ≈ −52 kJ/mol nella cellula.'));
        }
        run();
      }
      function run() {
        var RT = F.RTkJ(st.T);
        if (st.mode === 'singola') {
          var dG = st.dG0 + RT * Math.LN10 * st.logQ, dATP = F.dGATP(st.ATP, st.ADP, st.Pi, st.T);
          var tot = dG + (st.couple ? dATP : 0);
          setLabels(['ΔG totale (nelle condizioni attuali)', 'ΔG della sola reazione', 'ΔG dell\'idrolisi di ATP nella cellula', 'K di equilibrio della reazione']);
          ro.set('a', F.fmt(tot, 1) + ' kJ/mol'); ro.set('b', F.fmt(dG, 1) + ' kJ/mol'); ro.set('c', F.fmt(dATP, 1) + ' kJ/mol'); ro.set('d', F.fmt(F.Keq(st.dG0, st.T), 3));
          info.className = 'statusline ' + (tot < 0 ? 'ok' : 'bad');
          info.innerHTML = tot < -0.05 ? 'ΔG &lt; 0: la reazione procede <b>spontaneamente</b> verso i prodotti (esoergonica).' : (tot > 0.05 ? 'ΔG &gt; 0: la reazione <b>non</b> procede spontaneamente (endoergonica); serve energia, ad esempio accoppiandola all\'ATP.' : 'ΔG ≈ 0: la reazione è all\'equilibrio.');
          draw = function (ctx, w, h) {
            var css = U.css; ctx.clearRect(0, 0, w, h);
            var items = [['Reagenti', 0, css('--c1')], ['Prodotti (reazione)', dG, css('--c2')]];
            if (st.couple) items.push(['Prodotti + ADP + Pᵢ', tot, css('--c3')]);
            var vals = items.map(function (i) { return i[1]; }), lo = Math.min(0, Math.min.apply(null, vals)) - 10, hi = Math.max(0, Math.max.apply(null, vals)) + 10;
            var y = function (v) { return 20 + (hi - v) / (hi - lo) * (h - 50); }, cw = (w - 40) / items.length;
            ctx.font = '12px ' + css('--font'); ctx.textAlign = 'center';
            items.forEach(function (it, i) {
              var x = 20 + i * cw;
              ctx.strokeStyle = it[2]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + cw * 0.15, y(it[1])); ctx.lineTo(x + cw * 0.85, y(it[1])); ctx.stroke();
              ctx.fillStyle = css('--text'); ctx.fillText(it[0], x + cw / 2, y(it[1]) - 12);
              ctx.fillStyle = css('--muted'); ctx.fillText('G = ' + F.fmt(it[1], 1) + ' kJ/mol', x + cw / 2, y(it[1]) + 16);
              if (i > 0) U.arrow(ctx, x - cw * 0.12, y(items[i - 1][1]), x + cw * 0.12, y(it[1]), it[1] <= items[i - 1][1] ? css('--ok') : css('--bad'), 2);
            });
            ctx.fillStyle = css('--faint'); ctx.textAlign = 'left'; ctx.fillText('energia libera (riferimento: reagenti = 0)', 8, h - 8);
          };
        } else {
          var dG0 = -2840, gATP = 30.5, cellATP = -F.dGATP(2.25, 0.25, 1.65, 37);
          var effStd = st.nATP * gATP / -dG0, effCell = st.nATP * cellATP / -dG0;
          setLabels(['ΔG°′ ossidazione glucosio', 'Energia conservata (standard)', 'Energia conservata (nella cellula)', 'Liberata come calore (cellula)']);
          ro.set('a', '−2840 kJ/mol'); ro.set('b', F.fmt(effStd * 100, 0) + '%'); ro.set('c', F.fmt(effCell * 100, 0) + '%'); ro.set('d', F.fmt((1 - effCell) * 100, 0) + '%');
          info.className = 'statusline'; info.innerHTML = 'Nessuna trasformazione è efficiente al 100% (II principio): la parte non conservata nell\'ATP diventa <b>calore</b>, che serve anche alla termogenesi.';
          draw = function (ctx, w, h) {
            var css = U.css; ctx.clearRect(0, 0, w, h);
            var bw = w - 60, x0 = 30, yb = 70;
            ctx.fillStyle = css('--c3'); ctx.globalAlpha = 0.85; ctx.fillRect(x0, yb, bw * effCell, 70);
            ctx.fillStyle = css('--na'); ctx.fillRect(x0 + bw * effCell, yb, bw * (1 - effCell), 70); ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff'; ctx.font = '600 13px ' + css('--font'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('ATP (' + st.nATP + ' × ' + F.fmt(cellATP, 0) + ' kJ)', x0 + bw * effCell / 2, yb + 35);
            ctx.fillText('calore', x0 + bw * effCell + bw * (1 - effCell) / 2, yb + 35);
            ctx.fillStyle = css('--text'); ctx.textAlign = 'left'; ctx.fillText('2840 kJ liberati da 1 mol di glucosio', x0, yb - 20);
          };
        }
        cv.redraw();
      }
      build();
      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
