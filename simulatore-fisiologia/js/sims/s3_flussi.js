/* Sezione 3 — Flussi, permeabilità, osmosi (lezioni 6–9, 13). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Diffusione (particelle + Fick)
  F.registerSim('diffusione', {
    title: 'Diffusione tra due compartimenti (leggi di Fick)',
    section: 'flussi',
    short: 'Particelle in moto casuale attraversano una membrana con pori: flusso netto ∝ (C₁ − C₂) e avvicinamento esponenziale all\'equilibrio.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { pores: P.pores || 4, N: 400, playing: true, speed: 1 };
      var sP = U.slider({ label: 'Numero di pori nella membrana (permeabilità)', min: 1, max: 12, step: 1, value: st.pores, digits: 0, onInput: function (v) { st.pores = v; } });
      var bR = U.button('Ricomincia', function () { reset(); }, 'primary');
      var bE = U.button('Aggiungi soluto a destra', function () { for (var i = 0; i < 150; i++) parts.push([W0 * 0.55 + rng() * W0 * 0.43, 8 + rng() * (H0 - 16)]); });
      L.controls.appendChild(sP.el); L.controls.appendChild(el('div', { class: 'btn-row' }, [bR, bE]));
      L.controls.appendChild(U.params('Ogni particella compie un moto browniano (passi gaussiani). La membrana è impermeabile tranne che nei pori. Il flusso netto è la differenza fra i passaggi 1→2 e 2→1, entrambi proporzionali alla concentrazione di partenza: $F = P(C_1 - C_2)$. La curva teorica è $C_2(t) = \\tfrac{C_0}{2}(1 - e^{-t/\\tau})$.'));
      var ro = U.readouts([{ key: 'n1', label: 'Particelle a sinistra' }, { key: 'n2', label: 'Particelle a destra' }, { key: 'f', label: 'Flusso netto (1→2)', hl: true }]);
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Concentrazione nei due compartimenti', xlabel: 'tempo (s di simulazione)', ylabel: 'n. particelle', height: 190 });
      U.texify(L.controls);
      var rng = F.rng(3), parts = [], W0 = 600, H0 = 220, t = 0, hist = { t: [], a: [], b: [] }, flows = [];
      function reset() { parts = []; for (var i = 0; i < st.N; i++) parts.push([4 + rng() * (W0 / 2 - 10), 4 + rng() * (H0 - 8)]); t = 0; hist = { t: [], a: [], b: [] }; flows = []; }
      function poreOpen(y) {
        var n = st.pores, gap = H0 / n;
        for (var k = 0; k < n; k++) { var c = (k + 0.5) * gap; if (Math.abs(y - c) < 8) return true; }
        return false;
      }
      var cv = U.canvas2d(holder, 230, function (ctx, w, h) {
        var css = U.css, sx = w / W0, sy = h / H0;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = css('--surface'); ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = css('--muted'); ctx.fillRect(w / 2 - 3, 0, 6, h);
        var n = st.pores, gap = H0 / n;
        ctx.fillStyle = css('--surface');
        for (var k = 0; k < n; k++) { ctx.fillRect(w / 2 - 4, ((k + 0.5) * gap - 8) * sy, 8, 16 * sy); }
        ctx.fillStyle = css('--c2');
        parts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0] * sx, p[1] * sy, 2.6, 0, 6.283); ctx.fill(); });
        ctx.fillStyle = css('--text'); ctx.font = '600 12px ' + css('--font'); ctx.fillText('compartimento 1', 10, 16); ctx.fillText('compartimento 2', w / 2 + 10, 16);
      });
      var crossings = 0;
      function frame(dt) {
        if (!st.playing) return;
        var sub = 6, s = 4;
        for (var q = 0; q < sub; q++) {
          parts.forEach(function (p) {
            var nx = p[0] + s * rng.gauss(), ny = p[1] + s * rng.gauss();
            if (ny < 2) ny = 4 - ny; if (ny > H0 - 2) ny = 2 * (H0 - 2) - ny;
            if (nx < 2) nx = 4 - nx; if (nx > W0 - 2) nx = 2 * (W0 - 2) - nx;
            var side0 = p[0] < W0 / 2, side1 = nx < W0 / 2;
            if (side0 !== side1) {
              if (!poreOpen((p[1] + ny) / 2)) { nx = p[0]; }
              else crossings += side0 ? 1 : -1;
            }
            p[0] = nx; p[1] = ny;
          });
        }
        t += dt;
        var a = 0; parts.forEach(function (p) { if (p[0] < W0 / 2) a++; });
        hist.t.push(t); hist.a.push(a); hist.b.push(parts.length - a);
        flows.push([t, crossings]); while (flows.length && flows[0][0] < t - 2) flows.shift();
        var fl = flows.length > 1 ? (flows[flows.length - 1][1] - flows[0][1]) / (flows[flows.length - 1][0] - flows[0][0]) : 0;
        ro.set('n1', a); ro.set('n2', parts.length - a); ro.set('f', F.fmt(fl, 1) + ' /s');
        cv.redraw();
        if (hist.t.length % 6 === 0) {
          plot.update({ series: [{ name: 'compartimento 1', x: hist.t, y: hist.a, color: '--c2' }, { name: 'compartimento 2', x: hist.t, y: hist.b, color: '--c1' }],
            hlines: [{ y: parts.length / 2, label: 'equilibrio (C₁ = C₂)', color: '--ok', align: 'left' }], ylim: [0, parts.length] });
        }
      }
      reset();
      var loop = U.loop(holder, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        poll: 600,
        legend: [['--c2', 'compartimento 1 (sinistra)'], ['--c1', 'compartimento 2 (destra)'], ['--ok', 'tratteggio: equilibrio (C₁ = C₂)']],
        narrate: function () {
          var a = parts.filter(function (p) { return p[0] < W0 / 2; }).length, b = parts.length - a, dif = (a - b) / parts.length;
          var s = `Ogni punto è una molecola in <b>moto casuale</b> (browniano): non «sa» dove deve andare. La membrana al centro la blocca, tranne che nei ${st.pores} pori. Ogni molecola ha la stessa probabilità di imboccare un poro, quindi i passaggi da sinistra a destra sono proporzionali a quante molecole ci sono a sinistra (${a}), e quelli opposti a quante ce ne sono a destra (${b}). `;
          if (Math.abs(dif) > 0.12) return s + `Qui prevalgono i passaggi da <b>${dif > 0 ? 'sinistra a destra' : 'destra a sinistra'}</b>: c'è un <b>flusso netto</b> dal lato più concentrato a quello meno concentrato, proporzionale alla differenza (C₁ − C₂): è la prima legge di Fick. Man mano che le concentrazioni si avvicinano il flusso cala, per questo la curva si appiattisce.`;
          return { kind: 'ok', html: s + `Ora i due lati hanno quasi la stessa concentrazione: i passaggi nei due sensi si <b>bilanciano</b> e il flusso netto è zero. Le molecole però continuano a muoversi e a passare dai pori: è un <b>equilibrio dinamico</b>.` };
        },
        experiments: [
          { label: 'Pochi pori (1)', run: function () { sP.set(1); reset(); }, why: `Con un solo poro passano meno molecole al secondo: la permeabilità è bassa e l'equilibrio arriva molto più tardi (la costante di tempo è τ = V/2PA).` },
          { label: 'Molti pori (12)', run: function () { sP.set(12); reset(); }, why: `Più pori = più permeabilità: l'equilibrio si raggiunge in fretta, ma il valore finale (metà e metà) è lo stesso.` },
          { label: 'Aggiungi soluto a destra', run: function () { bE.click(); }, why: `Ora il lato destro è più concentrato: il flusso netto cambia direzione, dalla destra verso la sinistra, finché le concentrazioni si riequilibrano.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { loop.stop(); plot.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ t ∝ x²
  F.registerSim('tdiff', {
    title: 'Tempo di diffusione e distanza (t ∝ x²)',
    section: 'flussi',
    short: 'La seconda legge di Fick: il tempo per diffondere cresce con il quadrato della distanza. Rapidissima su scala cellulare, lentissima su scala macroscopica.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mol: P.mol || 'Glucosio', x: P.x || 10 };
      var mSel = U.select({ label: 'Molecola (in acqua, ~25 °C)', value: st.mol, options: Object.keys(F.Dwater).map(function (k) { return [k, k + ' — D = ' + F.fmt(F.Dwater[k], 1) + ' cm²/s']; }), onChange: function (v) { st.mol = v; upd(); } });
      var sX = U.slider({ label: 'Distanza', min: 0.01, max: 100000, value: st.x, log: true, fmt: function (v) { return v < 1 ? F.fmt(v * 1000, 0) + ' nm' : (v < 1000 ? F.fmt(v, 1) + ' µm' : (v < 1e4 ? F.fmt(v / 1000, 2) + ' mm' : F.fmt(v / 1e4, 1) + ' cm')); }, onInput: function (v) { st.x = v; upd(); } });
      L.controls.appendChild(mSel.el); L.controls.appendChild(sX.el);
      var marks = [['Fessura sinaptica (50 nm)', 0.05], ['Spessore della membrana (5 nm)', 0.005], ['Raggio di una cellula (10 µm)', 10], ['Capillare → cellula (50 µm)', 50], ['1 mm', 1000], ['1 cm', 10000]];
      L.controls.appendChild(el('div', { class: 'btn-row' }, marks.map(function (m) { return U.button(m[0], function () { sX.set(m[1]); }); })));
      L.controls.appendChild(U.params('$t = x^2/(2D)$ (tempo quadratico medio per una distanza x in una dimensione). Coefficienti di diffusione in acqua da tabelle di letteratura (arrotondati).'));
      var ro = U.readouts([{ key: 't', label: 'Tempo medio di diffusione', hl: true }, { key: 'x2', label: 'Se la distanza raddoppia…' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Tempo necessario in funzione della distanza', xlabel: 'distanza (µm)', ylabel: 'tempo (s)', xlog: true, ylog: true, height: 260, xlim: [0.001, 1e5], ylim: [1e-12, 1e8] });
      U.texify(L.controls);
      function human(s) {
        if (s < 1e-6) return F.fmt(s * 1e9, 1) + ' ns';
        if (s < 1e-3) return F.fmt(s * 1e6, 1) + ' µs';
        if (s < 1) return F.fmt(s * 1e3, 1) + ' ms';
        if (s < 120) return F.fmt(s, 1) + ' s';
        if (s < 7200) return F.fmt(s / 60, 1) + ' min';
        if (s < 3 * 86400) return F.fmt(s / 3600, 1) + ' ore';
        if (s < 365 * 86400) return F.fmt(s / 86400, 1) + ' giorni';
        return F.fmt(s / (365 * 86400), 1) + ' anni';
      }
      function upd() {
        var D = F.Dwater[st.mol], tt = F.tDiff(st.x * 1e-4, D);
        ro.set('t', human(tt)); ro.set('x2', '×4 → ' + human(4 * tt));
        var xs = F.logspace(-3, 5, 100);
        plot.update({
          series: [{ name: st.mol, x: xs, y: xs.map(function (x) { return F.tDiff(x * 1e-4, D); }), color: '--c1' },
            { name: 'Albumina (proteina)', x: xs, y: xs.map(function (x) { return F.tDiff(x * 1e-4, F.Dwater.Albumina); }), color: '--faint', dash: [5, 4] },
            { x: [st.x], y: [tt], type: 'points', color: '--na', r: 6 }],
          hlines: [{ y: 1, label: '1 s', include: false }, { y: 3600, label: '1 ora', include: false }, { y: 86400 * 365, label: '1 anno', include: false }],
          vlines: [{ x: 10, label: 'cellula' }, { x: 10000, label: '1 cm' }]
        });
      }
      upd();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { mSel.set('Glucosio'); sX.set(10); },
        narrate: function () {
          var f = F.fmt, D = F.Dwater[st.mol], tt = F.tDiff(st.x * 1e-4, D);
          var dist = st.x < 1 ? f(st.x * 1000, 0) + ' nm' : (st.x < 1000 ? f(st.x, 1) + ' µm' : (st.x < 1e4 ? f(st.x / 1000, 1) + ' mm' : f(st.x / 1e4, 1) + ' cm'));
          var ctx = st.x <= 0.1 ? `È la scala della <b>membrana</b> o della <b>fessura sinaptica</b>: la diffusione è praticamente istantanea.` : (st.x <= 50 ? `È la scala di una <b>cellula</b>: la diffusione basta a distribuire le molecole in millisecondi.` : (st.x < 5000 ? `Su queste distanze la diffusione è già lenta: per questo nei tessuti nessuna cellula è lontana da un capillare più di qualche decina di µm.` : `Su distanze macroscopiche la diffusione è <b>lentissima</b> (ore o giorni): il corpo usa il <b>flusso di massa</b>, cioè la circolazione, per trasportare le sostanze.`));
          return `${st.mol} (D = ${f(D, 1)} cm²/s) impiega in media <b>${human(tt)}</b> per diffondere per ${dist}. ${ctx} Il tempo cresce col <b>quadrato</b> della distanza (t = x²/2D): se la distanza raddoppia il tempo diventa ${human(4 * tt)}.`;
        },
        experiments: [
          { label: 'Dentro una cellula (10 µm)', run: function () { mSel.set('Glucosio'); sX.set(10); }, why: `In una cellula la diffusione è rapidissima: non servono sistemi di trasporto interni per i piccoli soluti.` },
          { label: 'Fessura sinaptica (50 nm)', run: function () { mSel.set('Acetilcolina'); sX.set(0.05); }, why: `L'acetilcolina attraversa la fessura in circa 1–2 µs: la diffusione non è il passo lento della trasmissione sinaptica.` },
          { label: '1 cm', run: function () { mSel.set('Glucosio'); sX.set(10000); }, why: `Su 1 cm il tempo è di ore: moltiplicare la distanza per 1000 moltiplica il tempo per un milione. Senza sangue e capillari gli organismi grandi non potrebbero esistere.` },
          { label: 'Una proteina (albumina)', run: function () { mSel.set('Albumina'); sX.set(10); }, why: `Le molecole più grandi hanno un coefficiente di diffusione minore (D ∝ 1/raggio) e impiegano più tempo.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); } };
    }
  });

  // ================================================================ Nernst "dal vivo"
  F.registerSim('nernstlive', {
    title: 'Come nasce il potenziale di equilibrio (Nernst)',
    section: 'potenziale',
    short: 'Si aprono canali selettivi per un solo ione: pochissimi ioni attraversano la membrana, la carica separata crea un potenziale che frena il flusso fino all\'equilibrio elettrochimico.',
    mount: function (host, P) {
      var L = U.simLayout(host), ions = { K: ['K⁺', 1, 140, 5, '--k'], Na: ['Na⁺', 1, 12, 145, '--na'], Cl: ['Cl⁻', -1, 10, 110, '--cl'] };
      var st = { ion: P.ion || 'K', ci: null, co: null, T: 37, open: false, t: 0, V: 0, Q: 0, perm: 1 };
      st.ci = ions[st.ion][2]; st.co = ions[st.ion][3];
      var iSel = U.seg({ label: 'Ione permeante', value: st.ion, options: Object.keys(ions).map(function (k) { return [k, ions[k][0]]; }), onChange: function (v) { st.ion = v; sCi.set(ions[v][2]); sCo.set(ions[v][3]); reset(); } });
      var sCi = U.slider({ label: 'Concentrazione interna', min: 0.0001, max: 500, value: st.ci, log: true, fmt: function (v) { return F.fmt(v, v < 1 ? 4 : 1) + ' mM'; }, onInput: function (v) { st.ci = v; reset(); } });
      var sCo = U.slider({ label: 'Concentrazione esterna', min: 0.0001, max: 500, value: st.co, log: true, fmt: function (v) { return F.fmt(v, v < 1 ? 4 : 1) + ' mM'; }, onInput: function (v) { st.co = v; reset(); } });
      var sT = U.slider({ label: 'Temperatura', min: 0, max: 45, step: 1, value: 37, digits: 0, unit: '°C', onInput: function (v) { st.T = v; reset(); } });
      var sPm = U.slider({ label: 'Numero di canali aperti (permeabilità)', min: 0.2, max: 5, step: 0.1, value: 1, digits: 1, unit: '×', onInput: function (v) { st.perm = v; } });
      var bO = U.button('Apri i canali', function () { st.open = !st.open; bO.textContent = st.open ? 'Chiudi i canali' : 'Apri i canali'; if (st.open && st.t === 0) st.hist = { t: [], V: [] }; }, 'primary');
      var bR = U.button('Ricomincia', function () { reset(); });
      [iSel.el, sCi.el, sCo.el, sT.el, sPm.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [bO, bR]));
      L.controls.appendChild(U.params('Cellula sferica di raggio 10 µm (volume 4,2 pL, capacità 12,6 pF con 1 µF/cm²). Il flusso segue l\'equazione GHK; il potenziale è $V = Q/C$. Le concentrazioni cambiano di conseguenza (in genere in modo trascurabile). Il "numero di canali" cambia solo la <b>velocità</b>, non il valore finale.'));
      var ro = U.readouts([{ key: 'v', label: 'Potenziale di membrana', hl: true }, { key: 'e', label: 'Potenziale di Nernst atteso' }, { key: 'n', label: 'Ioni che hanno attraversato' }, { key: 'f', label: 'Frazione degli ioni interni' }]);
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Potenziale di membrana dopo l\'apertura', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 190 });
      U.texify(L.controls);
      var R = 10e-4, A = 4 * Math.PI * R * R, Vol = 4 / 3 * Math.PI * R * R * R * 1e-3, C = 1e-6 * A; // cm², L, F
      var molMoved = 0;
      function reset() {
        st.t = 0; st.V = 0; st.Q = 0; molMoved = 0; st.open = false; bO.textContent = 'Apri i canali'; st.hist = { t: [0], V: [0] };
        upd(); cv.redraw();
      }
      function E() { // con le concentrazioni attuali (cambiano in modo trascurabile)
        var ciNow = st.ci - molMoved / Vol * 1000, coNow = st.co; // bagno esterno molto grande
        return F.nernst(coNow, ciNow, ions[st.ion][1], st.T);
      }
      function upd() {
        var e = E();
        ro.set('v', F.fmt(st.V, 1) + ' mV'); ro.set('e', F.fmt(e, 1) + ' mV');
        var nIons = Math.abs(molMoved) * 6.022e23;
        ro.set('n', nIons < 1 ? '0' : F.fmt(nIons, 2)); ro.set('f', F.fmt(Math.abs(molMoved) / (st.ci * 1e-3 * Vol) , 2));
        plot.update({ series: [{ x: st.hist.t, y: st.hist.V, color: ions[st.ion][4] }], hlines: [{ y: e, label: 'E = ' + F.fmt(e, 1) + ' mV', color: '--ok' }] });
      }
      function frame(dt) {
        if (st.open) {
          var z = ions[st.ion][1], RTF = F.RTF(st.T) / 1000, Pk = 2e-6 * st.perm; // cm/s
          var simDt = Math.min(dt, 0.05) * 8e-3; // 8 ms di simulazione per ogni secondo reale
          var nsub = 40, h = simDt / nsub;
          for (var k = 0; k < nsub; k++) {
            var ci = st.ci * 1e-3 - molMoved / Vol; // mol/L
            var u = z * (st.V / 1000) / RTF, co = st.co * 1e-3;
            // densità di flusso uscente (mol/cm²/s): P·u·(ci − co e^{−u})/(1 − e^{−u}) (mol/L → mol/cm³: ×1e-3)
            var g = Math.abs(u) < 1e-6 ? 1 : u / (1 - Math.exp(-u));
            var J = Pk * g * (ci - co * Math.exp(-u)) * 1e-3;
            var dmol = J * A * h; // moli uscite
            molMoved += dmol;
            st.Q -= z * F.C.F * dmol;     // la carica uscente lascia l'interno più negativo (per cationi)
            st.V = st.Q / C * 1000;       // mV
          }
          st.t += simDt * 1000;
          st.hist.t.push(st.t); st.hist.V.push(st.V);
          if (st.t > 40) { st.open = false; bO.textContent = 'Apri i canali'; }
          upd();
        }
        cv.redraw();
      }
      var cv = U.canvas2d(holder, 230, function (ctx, w, h) {
        var css = U.css, col = css(ions[st.ion][4]); ctx.clearRect(0, 0, w, h);
        var mx = w * 0.42;
        ctx.fillStyle = css('--surface'); ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = css('--surface-3'); ctx.fillRect(mx - 6, 0, 12, h);
        var gap = h / 4;
        for (var k = 0; k < 3; k++) { var y = gap * (k + 1); ctx.fillStyle = st.open ? css('--ok') : css('--bad'); ctx.fillRect(mx - 6, y - 7, 12, 14); }
        ctx.font = '600 12px ' + css('--font'); ctx.fillStyle = css('--text'); ctx.textAlign = 'center';
        ctx.fillText('INTERNO (' + F.fmt(st.ci, st.ci < 1 ? 4 : 0) + ' mM)', mx / 2, 16); ctx.fillText('ESTERNO (' + F.fmt(st.co, st.co < 1 ? 4 : 0) + ' mM)', mx + (w - mx) / 2, 16);
        // densità di ioni ∝ log della concentrazione (illustrativa)
        var dens = function (c) { return Math.round(Math.max(0, Math.min(60, 10 + 10 * Math.log10(c)))); };
        var rr = F.rng(7);
        ctx.fillStyle = col;
        for (var i = 0; i < dens(st.ci); i++) { ctx.beginPath(); ctx.arc(14 + rr() * (mx - 34), 30 + rr() * (h - 40), 3, 0, 6.283); ctx.fill(); }
        for (i = 0; i < dens(st.co); i++) { ctx.beginPath(); ctx.arc(mx + 20 + rr() * (w - mx - 34), 30 + rr() * (h - 40), 3, 0, 6.283); ctx.fill(); }
        // cariche separate lungo la membrana: ∝ |V|
        var nq = Math.min(14, Math.round(Math.abs(st.V) / 8)), inSign = st.V < 0 ? '−' : '+', outSign = st.V < 0 ? '+' : '−';
        ctx.font = '700 14px ' + css('--font');
        for (i = 0; i < nq; i++) {
          var yy = 26 + i * (h - 34) / 14;
          ctx.fillStyle = st.V < 0 ? css('--k') : css('--na'); ctx.fillText(inSign, mx - 16, yy);
          ctx.fillStyle = st.V < 0 ? css('--na') : css('--k'); ctx.fillText(outSign, mx + 16, yy);
        }
        // forze: chimica e elettrica (in mV equivalenti), positivo = verso l'esterno
        var z = ions[st.ion][1], chem = F.RTF(st.T) / z * Math.log(st.ci / st.co) * z; // tendenza ad uscire (mV·z)
        var elec = z * st.V;                                                            // V negativo trattiene i cationi
        var sc = Math.min(1.2, (w - mx - 60) / Math.max(40, Math.abs(chem), Math.abs(elec)));
        var yc = h - 46, ye = h - 22;
        ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
        if (Math.abs(chem) > 1) U.arrow(ctx, mx, yc, mx + chem * sc, yc, css('--c5'), 3);
        if (Math.abs(elec) > 1) U.arrow(ctx, mx, ye, mx + elec * sc, ye, css('--c4'), 3);
        ctx.fillStyle = css('--c5'); ctx.fillText('forza chimica', 8, yc + 4);
        ctx.fillStyle = css('--c4'); ctx.fillText('forza elettrica', 8, ye + 4);
      });
      reset();
      var loop = U.loop(holder, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var nl = function (ion, perm) { iSel.set(ion); sPm.set(perm || 1); reset(); bO.click(); };
      U.explainer(L, {
        poll: 400,
        legend: [['--c5', 'freccia gialla: forza chimica (gradiente di concentrazione)'], ['--c4', 'freccia viola: forza elettrica (potenziale)']],
        narrate: function () {
          var f = F.fmt, io = ions[st.ion], z = io[1], name = io[0], E = F.nernst(st.co, st.ci, z, st.T), out = st.ci > st.co;
          var dirTxt = out ? 'uscire' : 'entrare', inSign = ((out && z > 0) || (!out && z < 0)) ? 'negativo' : 'positivo';
          if (Math.abs(molMoved) === 0 && !st.open) return `${name} è più concentrato ${out ? 'dentro' : 'fuori'} (${f(st.ci, st.ci < 1 ? 4 : 0)} mM dentro, ${f(st.co, st.co < 1 ? 4 : 0)} mM fuori): c'è una <b>forza chimica</b> che lo spinge a ${dirTxt} (freccia gialla). I canali sono chiusi, quindi non passa nulla e il potenziale è 0 mV. Premi «Apri i canali».`;
          if (Math.abs(st.V - E) >= 1.5) return `I canali selettivi per ${name} sono aperti: lo ione ${out ? 'esce' : 'entra'} seguendo il gradiente di concentrazione e porta con sé carica. L'interno diventa <b>${inSign}</b> (ora ${f(st.V, 1)} mV). Questo potenziale crea una <b>forza elettrica</b> (freccia viola) che si oppone a quella chimica: il flusso netto rallenta man mano che V si avvicina a E = ${f(E, 1)} mV.${st.open ? '' : ' (I canali si sono richiusi prima di arrivare all\'equilibrio: riaprili.)'}`;
          return { kind: 'ok', html: `<b>Equilibrio elettrochimico</b>: forza chimica ed elettrica sono uguali e opposte, il flusso netto è nullo e il potenziale (${f(st.V, 1)} mV) coincide con quello di Nernst, E = ${f(E, 1)} mV. Per arrivarci è bastata una quantità minuscola di ioni (${f(Math.abs(molMoved) * 6.022e23, 1)}, cioè ${f(Math.abs(molMoved) / (st.ci * 1e-3 * Vol) * 100, 4)}% di quelli interni): le concentrazioni non sono praticamente cambiate. Più canali aprono = si arriva prima, ma E non cambia.` };
        },
        experiments: [
          { label: 'K⁺ (esce)', run: function () { nl('K'); }, why: `Il K⁺ è più concentrato dentro: esce portando carica positiva fuori, l'interno diventa negativo e V tende a E<sub>K</sub> ≈ −89 mV.` },
          { label: 'Na⁺ (entra)', run: function () { nl('Na'); }, why: `Il Na⁺ è più concentrato fuori: entra e rende l'interno positivo. V tende a E<sub>Na</sub> ≈ +66 mV, un valore positivo.` },
          { label: 'Cl⁻ (anione)', run: function () { nl('Cl'); }, why: `Il Cl⁻ ha carica negativa ed è più concentrato fuori: entra e porta carica <i>negativa</i> all'interno. V tende a E<sub>Cl</sub> ≈ −64 mV: il segno è opposto a quello dello stesso gradiente per un catione.` },
          { label: 'K⁺ con 5× più canali', run: function () { nl('K', 5); }, why: `Il potenziale finale è lo <b>stesso</b>, ma si raggiunge circa 5 volte più in fretta: la permeabilità cambia la velocità, non il valore di equilibrio.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { loop.stop(); plot.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ Permeabilità
  F.registerSim('permeabilita', {
    title: 'Permeabilità: liposolubilità e dimensioni',
    section: 'flussi',
    short: 'P = β·D/Δx per la via lipidica; diffusione ristretta (Renkin) per la via dei pori: perché le molecole liposolubili passano e gli ioni no.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mode: P.mode || 'lipidi', beta: 0.01, D: 1e-6, dx: 5, pore: 4 };
      var mSel = U.seg({ options: [['lipidi', 'Via lipidica (β)'], ['pori', 'Via dei pori (dimensioni)']], value: st.mode, onChange: function (v) { st.mode = v; build(); } });
      L.controls.appendChild(mSel.el);
      var box = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }); L.controls.appendChild(box);
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { height: 260 });
      var labs = function (a, b) { var n = ro.el.querySelectorAll('.rl'); n[0].innerHTML = a; n[1].innerHTML = b; };
      // Ordini di grandezza della permeabilità di un doppio strato sintetico (cm/s), da tabelle di testo (Alberts, Lodish)
      var mols = [['O₂, CO₂', 2e-1], ['Etanolo', 1e-2], ['Acqua', 3e-3], ['Urea', 4e-6], ['Glicerolo', 5e-6], ['Glucosio', 4e-10], ['Cl⁻', 1e-11], ['K⁺', 5e-12], ['Na⁺', 1e-12]];
      // Raggi di Stokes (Å)
      var radii = [['Acqua', 1.4], ['Urea', 1.8], ['Glicerolo', 2.6], ['Glucosio', 3.6], ['Saccarosio', 4.4]];
      function build() {
        box.innerHTML = '';
        if (st.mode === 'lipidi') {
          var sB = U.slider({ label: 'Coefficiente di ripartizione olio/acqua β', min: 1e-8, max: 10, value: st.beta, log: true, fmt: function (v) { return F.fmt(v, 2); }, onInput: function (v) { st.beta = v; run(); } });
          var sD = U.slider({ label: 'Diffusione nella membrana Dₘ', min: 1e-8, max: 1e-5, value: st.D, log: true, fmt: function (v) { return F.fmt(v, 1) + ' cm²/s'; }, onInput: function (v) { st.D = v; run(); } });
          var sX = U.slider({ label: 'Spessore della membrana Δx', min: 3, max: 10, step: 0.5, value: st.dx, digits: 1, unit: 'nm', onInput: function (v) { st.dx = v; run(); } });
          [sB.el, sD.el, sX.el].forEach(function (e) { box.appendChild(e); });
          box.appendChild(U.params('$P_m = \\beta D_m/\\Delta x$ (lezione 7). Nel grafico: ordini di grandezza della permeabilità di un doppio strato fosfolipidico <b>senza proteine</b> (da tabelle dei testi di biologia cellulare): le molecole piccole e apolari passano, gli ioni praticamente no.'));
        } else {
          var sR = U.slider({ label: 'Raggio del poro', min: 1.5, max: 10, step: 0.1, value: st.pore, digits: 1, unit: 'Å', onInput: function (v) { st.pore = v; run(); } });
          box.appendChild(sR.el);
          box.appendChild(U.params('Diffusione ristretta (lezione 9): fattore di impedimento di Renkin (1954) $H(\\lambda) = (1-\\lambda)^2(1 - 2{,}104\\lambda + 2{,}09\\lambda^3 - 0{,}95\\lambda^5)$, con λ = raggio della particella/raggio del poro. L\'"ipotesi del setaccio" ammetteva pori di diametro 8 Å (raggio 4 Å). Raggi di Stokes da letteratura.'));
        }
        U.texify(box);
        run();
      }
      function run() {
        if (st.mode === 'lipidi') {
          var Pm = F.permeability(st.beta, st.D, st.dx * 1e-7);
          labs('Permeabilità Pₘ', 'Tempo per dimezzare il gradiente in una cellula di 10 µm');
          ro.set('a', F.fmt(Pm, 2) + ' cm/s');
          var tau = (10e-4 / 3) / (2 * Pm); // V/A = R/3 per una sfera; τ ≈ (V/A)/P (cellula + grande volume esterno: ≈ (V/A)/P)
          var t12 = tau * 2 * Math.LN2;
          ro.set('b', t12 < 1 ? F.fmt(t12 * 1000, 2) + ' ms' : (t12 < 3600 ? F.fmt(t12, 1) + ' s' : F.fmt(t12 / 3600, 1) + ' ore'));
          var bs = F.logspace(-8, 1, 50);
          plot.o.xlog = true; plot.o.ylog = true;
          plot.update({ xlabel: 'molecole attraverso un doppio strato senza proteine (ordini di grandezza)', ylabel: 'P (cm/s)', xlim: [0.5, mols.length + 0.5], ylim: [1e-13, 30],
            series: [{ x: mols.map(function (_, i) { return i + 1; }), y: mols.map(function (m) { return m[1]; }), type: 'points', color: '--c1', r: 6 }],
            hlines: [{ y: Pm, color: '--na', label: 'la tua molecola' }], texts: mols.map(function (m, i) { return { x: i + 1, y: m[1] * 3, text: m[0], align: 'center' }; }), vlines: [] });
          plot.o.xlog = false; plot.o.xfmt = function () { return ''; }; plot.draw();
        } else {
          plot.o.xlog = false; plot.o.ylog = false; plot.o.xfmt = null;
          var xs = F.linspace(0, 10, 201);
          labs('Permeabilità relativa del glucosio (r = 3,6 Å)', 'Particella più grande che passa');
          ro.set('a', F.fmt(F.renkin(3.6 / st.pore) * 100, 1) + '%');
          ro.set('b', 'raggio &lt; ' + F.fmt(st.pore, 1) + ' Å (diametro ' + F.fmt(2 * st.pore, 1) + ' Å)');
          plot.update({ xlabel: 'raggio della particella (Å)', ylabel: 'permeabilità relativa (%)', xlim: [0, 10], ylim: [0, 105],
            series: [{ x: xs, y: xs.map(function (r) { return 100 * F.renkin(r / st.pore); }), color: '--c1', name: 'poro di raggio ' + F.fmt(st.pore, 1) + ' Å' },
              { x: radii.map(function (r) { return r[1]; }), y: radii.map(function (r) { return 100 * F.renkin(r[1] / st.pore); }), type: 'points', color: '--na', r: 5 }],
            texts: radii.map(function (r) { return { x: r[1] + 0.15, y: 100 * F.renkin(r[1] / st.pore) + 5, text: r[0] }; }),
            vlines: [{ x: st.pore, label: 'raggio del poro', color: '--bad' }], hlines: [] });
        }
      }
      build();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var pmSet = function (o2) { st.mode = o2.mode; mSel.set(o2.mode, true); if (o2.beta) st.beta = o2.beta; if (o2.pore) st.pore = o2.pore; build(); };
      U.explainer(L, {
        watch: ro,
        narrate: function () {
          var f = F.fmt;
          if (st.mode === 'lipidi') {
            var Pm = F.permeability(st.beta, st.D, st.dx * 1e-7);
            var cls = Pm > 1e-3 ? 'molto permeabile (come O₂, CO₂, etanolo)' : (Pm > 1e-6 ? 'moderatamente permeabile (come acqua e urea)' : (Pm > 1e-9 ? 'poco permeabile (come il glucosio)' : 'praticamente impermeabile (come gli ioni)'));
            return `Per attraversare la membrana attraverso i lipidi una molecola deve prima <b>sciogliersi</b> nel doppio strato (la facilità è il coefficiente di ripartizione olio/acqua, β = ${f(st.beta, 2)}) e poi <b>diffondere</b> nello spessore di ${f(st.dx, 1)} nm con D<sub>m</sub> = ${f(st.D, 1)} cm²/s. La permeabilità è P = β·D<sub>m</sub>/Δx = <b>${f(Pm, 2)} cm/s</b>: ${cls}. I punti blu nel grafico sono molecole reali: gli ioni (carichi, con β minuscolo) non passano dai lipidi, servono canali o trasportatori.`;
          }
          var p = st.pore;
          return `Nel poro la molecola avanza in fila singola e urta le pareti: più il suo raggio si avvicina a quello del poro (${f(p, 1)} Å), più il moto è <b>ostacolato</b> (fattore di Renkin). Con questo poro l'acqua (raggio 1,4 Å) passa al ${f(F.renkin(1.4 / p) * 100, 0)}%, l'urea al ${f(F.renkin(1.8 / p) * 100, 0)}%, il glucosio (3,6 Å) al <b>${f(F.renkin(3.6 / p) * 100, 1)}%</b>, il saccarosio (4,4 Å) al ${f(F.renkin(4.4 / p) * 100, 1)}%. Una particella grande quanto il poro non passa affatto.`;
        },
        experiments: [
          { label: 'Molecola liposolubile (β = 1)', run: function () { pmSet({ mode: 'lipidi', beta: 1 }); }, why: `Con β alto la molecola si scioglie bene nei lipidi: permeabilità alta, come O₂ o etanolo.` },
          { label: 'Ione (β = 10⁻⁸)', run: function () { pmSet({ mode: 'lipidi', beta: 1e-8 }); }, why: `Una particella carica non si scioglie nei lipidi (β minuscolo): la permeabilità è bassissima. Gli ioni passano solo dai <b>canali</b>.` },
          { label: 'Poro stretto (4 Å)', run: function () { pmSet({ mode: 'pori', pore: 4 }); }, why: function () { var r = F.renkin; return `In un poro di 8 Å di diametro (l'«ipotesi del setaccio») la diffusione è ostacolata anche per le molecole piccole: rispetto alla diffusione libera passa il ${F.fmt(r(1.4 / 4) * 100, 0)}% per l'acqua e il ${F.fmt(r(1.8 / 4) * 100, 0)}% per l'urea, ma solo il ${F.fmt(r(3.6 / 4) * 100, 1)}% per il glucosio, che ha quasi il raggio del poro.`; } },
          { label: 'Poro largo (10 Å)', run: function () { pmSet({ mode: 'pori', pore: 10 }); }, why: function () { return `Con un poro più largo (raggio 10 Å) il glucosio non è più quasi bloccato: passa il ${F.fmt(F.renkin(3.6 / 10) * 100, 0)}% della diffusione libera. Più la particella è piccola rispetto al poro, meno è ostacolata.`; } }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); } };
    }
  });

  // ================================================================ Osmosi: eritrocita 3D
  F.registerSim('eritrocita', {
    title: 'Osmosi: l\'eritrocita in soluzioni diverse',
    section: 'flussi',
    short: 'Soluzioni isotoniche, ipotoniche e ipertoniche; soluti permeanti (urea) e non permeanti; acquaporine e mercurio.',
    mount: function (host, P) {
      var sols = {
        iso: ['NaCl 0,9% (isotonica, ~290 mOsm)', 290, 0, 1, 0],
        hypo: ['NaCl 0,45% (ipotonica, ~145 mOsm)', 145, 0, 1, 0],
        hypo2: ['NaCl 0,6% (~195 mOsm)', 195, 0, 1, 0],
        water: ['Acqua distillata', 0, 0, 1, 0],
        hyper: ['NaCl 1,8% (ipertonica, ~580 mOsm)', 580, 0, 1, 0],
        urea: ['Urea 300 mM (isosmotica ma NON isotonica)', 0, 300, 1, 1e-4],
        gly: ['Glicerolo 300 mM (permeante lento)', 0, 300, 1, 1.5e-6],
        sucr: ['Saccarosio 300 mM (non permeante)', 0, 300, 1, 0],
        mix: ['NaCl 0,9% + urea 300 mM', 290, 300, 1, 1e-4]
      };
      var L = U.simLayout(host), st = { sol: P.sol || 'hypo', aqp: P.aqp || 'aqp', running: true };
      var sSel = U.select({ label: 'Soluzione esterna', value: st.sol, options: Object.keys(sols).map(function (k) { return [k, sols[k][0]]; }), onChange: function (v) { st.sol = v; start(); } });
      var aSel = U.seg({ label: 'Acquaporine (AQP1)', value: st.aqp, options: [['aqp', 'Normali'], ['hg', 'Bloccate da Hg²⁺'], ['null', 'Assenti (Colton-null)']], onChange: function (v) { st.aqp = v; start(); } });
      var bR = U.button('Rimetti la cellula nella soluzione', function () { start(); }, 'primary');
      L.controls.appendChild(sSel.el); L.controls.appendChild(aSel.el); L.controls.appendChild(bR);
      L.controls.appendChild(U.params('Eritrocita umano: V₀ = 90 fL a 290 mOsm, volume osmoticamente inattivo 40%, area 135 µm². Lisi quando il volume supera quello della sfera con la stessa area (≈147 fL; la membrana non si distende oltre il 3–4%). Permeabilità osmotica all\'acqua P<sub>f</sub> ≈ 0,02 cm/s con AQP1, ≈ 1/5 senza (Hg²⁺ o eritrociti Colton-null). Flussi secondo Kedem-Katchalsky con σ = 1 per i soluti non permeanti; il soluto permeante entra con permeabilità P<sub>s</sub>.'));
      var ro = U.readouts([{ key: 'v', label: 'Volume cellulare', hl: true }, { key: 'o', label: 'Osmolarità efficace iniziale' }, { key: 's', label: 'Esito' }]);
      var scn = F.scene3d(L.main, { height: 280, camPos: [0, 7, 15], hint: 'Trascina per ruotare' });
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Volume dell\'eritrocita nel tempo', xlabel: 'tempo (s)', ylabel: 'volume (fL)', height: 190 });
      var THREE = G.THREE, mesh, base, sim = null, tPlay = 0;
      if (scn) {
        var g = new THREE.SphereGeometry(1, 64, 40);
        base = g.attributes.position.array.slice();
        mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6, transparent: true, opacity: 1 }));
        scn.scene.add(mesh);
      }
      var R0 = 3.91, c0 = 0.207161, c1 = 2.002558, c2 = -1.122762, Vb = F.RBC.b * F.RBC.V0;
      function shape(V, lysed) {
        if (!mesh) return;
        var pos = mesh.geometry.attributes.position.array;
        var Rs = Math.pow(3 * V / (4 * Math.PI), 1 / 3);
        var s = V >= F.RBC.V0 ? F.clamp((V - F.RBC.V0) / (F.RBC.Vcrit - F.RBC.V0), 0, 1) : 0;
        var shrink = V < F.RBC.V0 ? F.clamp((F.RBC.V0 - V) / (F.RBC.V0 - Vb), 0, 1) : 0;
        var k = Math.pow(V / F.RBC.V0, 1 / 3);
        for (var i = 0; i < pos.length; i += 3) {
          var x = base[i], y = base[i + 1], z = base[i + 2], th = Math.acos(F.clamp(y, -1, 1)), ph = Math.atan2(z, x);
          var rho = Math.sin(th), zd = 0.5 * R0 * Math.sqrt(Math.max(0, 1 - rho * rho)) * (c0 + c1 * rho * rho + c2 * Math.pow(rho, 4)) * Math.sign(Math.cos(th));
          var rd = R0 * rho;
          var rr = (1 - s) * rd + s * Rs * Math.sin(th), yy = (1 - s) * zd + s * Rs * Math.cos(th);
          if (shrink > 0) { rr *= k; yy *= k; var sp = 1 + 0.35 * shrink * Math.pow(Math.max(0, Math.cos(9 * ph) * Math.cos(5 * th)), 6); rr *= sp; yy *= (1 + 0.2 * shrink * Math.pow(Math.max(0, Math.cos(7 * ph)), 6)); }
          pos[i] = rr * Math.cos(ph); pos[i + 1] = yy; pos[i + 2] = rr * Math.sin(ph);
        }
        mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.computeVertexNormals();
        mesh.material.opacity = lysed ? 0.22 : 1; mesh.material.color.setHex(lysed ? 0xd7a8a0 : 0xc0392b);
      }
      function start() {
        var s = sols[st.sol], Pf = st.aqp === 'aqp' ? 0.02 : 0.004;
        sim = F.RBC.simulate({ osmImpOut: s[1], Cp: s[2], sigma: s[3], Ps: s[4], Pf: Pf, tmax: s[4] > 0 && s[4] < 1e-5 ? 120 : (Pf < 0.01 ? 60 : 10), dt: 0.002, sample: 0.05 });
        tPlay = 0;
        var Vline = sim.V.map(function (v) { return Math.min(v, F.RBC.Vcrit); });
        var tl = sim.lysed ? sim.t.filter(function (t) { return t <= sim.tLysis; }) : sim.t;
        plot.update({ series: [{ x: tl, y: Vline.slice(0, tl.length), color: '--c2' }], hlines: [{ y: F.RBC.Vcrit, label: 'lisi (sfera, 147 fL)', color: '--bad' }, { y: 90, label: 'volume normale 90 fL', color: '--ok', align: 'left' }], ylim: [30, 160] });
        ro.set('o', F.fmt(s[1], 0) + ' mOsm/L (+ ' + F.fmt(s[2], 0) + ' mM permeante)');
      }
      function frame(dt) {
        if (!sim) return;
        var dur = sim.t[sim.t.length - 1], speed = dur > 20 ? dur / 8 : 1;
        if (!isFinite(dt)) return;
        tPlay = Math.min(dur, tPlay + dt * speed);
        var step = sim.t[1] - sim.t[0], i = Math.max(0, Math.min(sim.t.length - 1, Math.round(tPlay / (step > 0 ? step : 1))));
        var V = sim.V[i], lysed = sim.lysed && sim.t[i] >= sim.tLysis;
        if (!isFinite(V)) return; // mai passare valori non validi alla geometria 3D
        shape(Math.min(V, F.RBC.Vcrit), lysed);
        if (mesh) mesh.rotation.y += dt * 0.2;
        ro.set('v', lysed ? 'lisata' : F.fmt(V, 0) + ' fL');
        ro.set('s', lysed ? '<span style="color:var(--bad)">emolisi a ' + F.fmt(sim.tLysis, 1) + ' s</span>' : (V > 100 ? 'rigonfiamento' : (V < 80 ? 'raggrinzimento (crenatura)' : 'volume normale')));
      }
      start();
      var loop = null;
      if (scn) scn.onFrame(frame); else loop = U.loop(L.main, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        poll: 700,
        narrate: function () {
          var f = F.fmt;
          var T = {
            iso: `La soluzione ha circa 290 mOsm/L, come il citoplasma: è <b>isotonica</b>. L'acqua entra ed esce alla stessa velocità e il volume resta 90 fL.`,
            hypo: `L'esterno ha circa metà dei soluti del citoplasma (≈145 mOsm/L): è <b>ipotonico</b>. Dentro la cellula ci sono più soluti non diffusibili (emoglobina, ioni) che fuori, quindi l'acqua <b>entra</b> per osmosi e la cellula si gonfia verso la forma sferica.`,
            hypo2: `L'esterno è ipotonico (≈195 mOsm/L): l'acqua <b>entra</b> per osmosi e la cellula si gonfia.`,
            water: `In acqua distillata non c'è soluto fuori: l'acqua entra senza controparte e la cellula si gonfia fino a rompersi.`,
            hyper: `L'esterno ha il doppio dei soluti (≈580 mOsm/L): è <b>ipertonico</b>. L'acqua <b>esce</b> dalla cellula, che si raggrinzisce (crenatura).`,
            urea: `300 mM di urea hanno la stessa osmolarità del citoplasma (<b>isosmotica</b>), ma l'urea attraversa la membrana: entra nella cellula secondo gradiente e l'acqua la segue. La soluzione è quindi <b>ipotonica</b> e la cellula si gonfia. La <b>tonicità</b> dipende solo dai soluti che NON passano.`,
            gly: `Il glicerolo è isosmotico ma permea lentamente: entra nella cellula e con lui l'acqua. Il rigonfiamento è molto più lento che con l'urea.`,
            sucr: `Il saccarosio non attraversa la membrana: 300 mM equivalgono a circa 300 mOsm, quindi la soluzione è praticamente <b>isotonica</b> e il volume resta quasi stabile.`,
            mix: `NaCl 0,9% è isotonico, ma l'urea aggiunta attraversa la membrana: entra con l'acqua e la cellula si gonfia.`
          };
          var s = T[st.sol] || '';
          if (sim) s += sim.lysed ? ` <b>Risultato:</b> il volume raggiunge il limite della sfera (147 fL) e la cellula va in <b>emolisi</b> dopo ${f(sim.tLysis, 1)} s.` : ` <b>Risultato:</b> volume finale ${f(sim.Vfinal, 0)} fL (${sim.Vfinal >= 90 ? '+' : ''}${f((sim.Vfinal - 90) / 90 * 100, 0)}% rispetto a 90 fL).`;
          if (st.aqp !== 'aqp') s += ` Le acquaporine sono ${st.aqp === 'hg' ? 'bloccate dal Hg²⁺' : 'assenti'}: l'acqua passa solo dai lipidi, quindi la cellula impiega molto più tempo ma il valore finale di equilibrio non cambia.`;
          return { kind: sim && sim.lysed ? 'bad' : '', html: s };
        },
        experiments: [
          { label: 'Isotonica (NaCl 0,9%)', run: function () { aSel.set('aqp'); sSel.set('iso'); }, why: `Nessun gradiente osmotico efficace: il volume non cambia.` },
          { label: 'Acqua distillata', run: function () { aSel.set('aqp'); sSel.set('water'); }, why: `L'acqua entra fino a raggiungere il volume critico (~147 fL, la sfera con la stessa area): la membrana non si distende oltre e la cellula scoppia (<b>emolisi</b>).` },
          { label: 'Ipertonica (NaCl 1,8%)', run: function () { aSel.set('aqp'); sSel.set('hyper'); }, why: `L'acqua esce e la cellula si rimpicciolisce e si raggrinzisce.` },
          { label: 'Urea 300 mM', run: function () { aSel.set('aqp'); sSel.set('urea'); }, why: `Isosmotica ma NON isotonica: l'urea entra con l'acqua e la cellula va in emolisi. Ciò che conta è la tonicità, non l'osmolarità totale.` },
          { label: 'Ipotonica senza acquaporine', run: function () { sSel.set('hypo'); aSel.set('hg'); }, why: `Senza acquaporine l'acqua passa solo attraverso i lipidi: la cellula si gonfia molto più lentamente, ma lo stato finale è lo stesso. Le AQP cambiano la <b>velocità</b>, non l'equilibrio.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ Osmometro
  F.registerSim('osmometro', {
    title: 'Pressione osmotica: osmometro e coefficiente di riflessione',
    section: 'flussi',
    short: 'π = σ·R·T·ΔC: osmolarità, temperatura e coefficiente di riflessione determinano la pressione necessaria ad annullare il flusso osmotico.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { c: P.c || 150, n: P.n || 2, T: 37, sigma: 1 };
      var sC = U.slider({ label: 'Concentrazione del soluto (lato 2)', min: 1, max: 1000, step: 1, value: st.c, digits: 0, unit: 'mM', onInput: function (v) { st.c = v; upd(); } });
      var sN = U.seg({ label: 'Particelle per molecola', value: st.n, options: [[1, '1 (glucosio, urea)'], [2, '2 (NaCl)'], [3, '3 (CaCl₂)']], onChange: function (v) { st.n = v; upd(); } });
      var sT = U.slider({ label: 'Temperatura', min: 0, max: 40, step: 1, value: 37, digits: 0, unit: '°C', onInput: function (v) { st.T = v; upd(); } });
      var sS = U.slider({ label: 'Coefficiente di riflessione σ', min: 0, max: 1, step: 0.01, value: 1, digits: 2, onInput: function (v) { st.sigma = v; upd(); } });
      [sC.el, sN.el, sT.el, sS.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Equazione di van\'t Hoff $\\pi = \\sigma R T C_{osm}$ con $R$ = 0,0821 L·atm/(mol·K). σ = 1: membrana impermeabile al soluto; σ = 0: il soluto passa come l\'acqua e non esercita effetto osmotico. Soluzioni ideali (coefficiente osmotico = 1).'));
      var ro = U.readouts([{ key: 'osm', label: 'Osmolarità' }, { key: 'atm', label: 'Pressione osmotica', hl: true }, { key: 'mm', label: 'in mmHg' }, { key: 'h', label: 'Colonna d\'acqua equivalente' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var res = null;
      var cv = U.canvas2d(holder, 280, function (ctx, w, h) {
        if (!res) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var cx = w / 2, tw = 54, base = h - 30, top = 30, maxH = base - top - 40;
        var hScaled = Math.min(1, Math.log10(1 + res.waterColumn_m) / Math.log10(1 + 200)) * maxH;
        ctx.strokeStyle = css('--muted'); ctx.lineWidth = 2;
        // tubo a U
        ctx.fillStyle = css('--c1'); ctx.globalAlpha = 0.25;
        ctx.fillRect(cx - 120, base - 60 - hScaled * 0 , tw, 60);
        ctx.fillRect(cx + 66, base - 60 - hScaled, tw, 60 + hScaled);
        ctx.fillRect(cx - 120, base - 14, 240, 14); ctx.globalAlpha = 1;
        ctx.strokeRect(cx - 120, top, tw, base - top); ctx.strokeRect(cx + 66, top, tw, base - top);
        ctx.fillStyle = css('--warn'); ctx.fillRect(cx - 3, base - 16, 6, 18);
        ctx.font = '12px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--text');
        ctx.fillText('lato 1: acqua', cx - 93, base + 18); ctx.fillText('lato 2: soluzione', cx + 93, base + 18);
        ctx.fillText('membrana', cx, base - 24);
        if (hScaled > 4) { U.arrow(ctx, cx + 140, base - 60, cx + 140, base - 60 - hScaled, css('--na'), 2); ctx.textAlign = 'left'; ctx.fillStyle = css('--na'); ctx.fillText('Δh = ' + F.fmt(res.waterColumn_m, 2) + ' m', cx + 148, base - 60 - hScaled / 2); }
        ctx.fillStyle = css('--faint'); ctx.textAlign = 'left'; ctx.fillText('(altezza in scala logaritmica)', 8, 16);
      });
      U.texify(L.controls);
      function upd() {
        var osm = st.c * st.n;
        res = F.vantHoff(osm, st.T, st.sigma);
        ro.set('osm', F.fmt(osm, 0) + ' mOsm/L'); ro.set('atm', F.fmt(res.atm, 2) + ' atm'); ro.set('mm', F.fmt(res.mmHg, 0) + ' mmHg'); ro.set('h', F.fmt(res.waterColumn_m, 1) + ' m');
        cv.redraw();
      }
      upd();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { sC.set(150); sN.set(2); sS.set(1); sT.set(37); },
        narrate: function () {
          var f = F.fmt, osm = st.c * st.n, r = F.vantHoff(osm, st.T, st.sigma);
          var s = `Il lato 2 contiene ${f(st.c, 0)} mM di un soluto che si dissocia in ${st.n === 1 ? '1 particella' : st.n + ' particelle'}: osmolarità <b>${f(osm, 0)} mOsm/L</b>. Il lato 1 è acqua. `;
          if (st.sigma < 0.02) return s + `Con σ = 0 il soluto attraversa la membrana come l'acqua: non esercita alcuna pressione osmotica e i livelli restano uguali.`;
          s += `L'acqua passa per <b>osmosi</b> dal lato 1 al lato 2 (verso la soluzione più concentrata) e fa salire il livello a destra. L'altezza smette di crescere quando la pressione idrostatica uguaglia la <b>pressione osmotica</b> π = σ·R·T·C = ${f(r.atm, 2)} atm (${f(r.mmHg, 0)} mmHg), cioè una colonna d'acqua di ${f(r.waterColumn_m, 1)} m: lì il flusso netto è zero. `;
          if (st.sigma < 0.98) s += `Con σ = ${f(st.sigma, 2)} la membrana trattiene solo una parte del soluto e π si riduce in proporzione. `;
          return s + `π dipende dal <b>numero di particelle</b> (NaCl conta il doppio del glucosio) e dalla temperatura.`;
        },
        experiments: [
          { label: 'Glucosio 150 mM', run: function () { sC.set(150); sN.set(1); sS.set(1); sT.set(37); }, why: `150 mM di glucosio sono 150 mOsm: metà della pressione di una soluzione di NaCl con la stessa molarità.` },
          { label: 'NaCl 150 mM', run: function () { sC.set(150); sN.set(2); sS.set(1); sT.set(37); }, why: `NaCl si dissocia in due particelle: 150 mM valgono 300 mOsm, cioè la pressione osmotica del plasma (≈ 7,6 atm a 37 °C).` },
          { label: 'Soluto permeante (σ = 0)', run: function () { sC.set(150); sN.set(2); sS.set(0); sT.set(37); }, why: `Se il soluto passa liberamente la membrana non lo «vede»: nessuna pressione osmotica, come l'urea per l'eritrocita.` },
          { label: '1 Osm a 0 °C (valore della slide)', run: function () { sC.set(1000); sN.set(1); sS.set(1); sT.set(0); }, why: `A 0 °C una soluzione 1 Osm dà 22,4 atm, il valore riportato nelle slide.` },
          { label: '1 Osm a 37 °C', run: function () { sC.set(1000); sN.set(1); sS.set(1); sT.set(37); }, why: `Alla temperatura corporea la stessa soluzione dà <b>25,4 atm</b>: la pressione osmotica è proporzionale alla temperatura assoluta.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
