/* Sezione 6 — Banco di elettrofisiologia e potenziale d'azione (lezioni 16–20, 28). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;
  var palette = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--k', '--na'];

  // ================================================================ Current clamp
  F.registerSim('currentclamp', {
    title: 'Current clamp: proprietà passive (R, C, τ)',
    section: 'elettro',
    short: 'Si inietta un gradino di corrente e si registra il potenziale: la risposta elettrotonica sale e scende con costante di tempo τ = R·C.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { R: P.R || 100, C: P.C || 100, I: P.I === undefined ? 0.1 : P.I, dur: 60, fam: !!P.fam, exc: !!P.exc };
      var sR = U.slider({ label: 'Resistenza di membrana R<sub>in</sub>', min: 10, max: 500, step: 5, value: st.R, digits: 0, unit: 'MΩ', onInput: function (v) { st.R = v; run(); } });
      var sC = U.slider({ label: 'Capacità di membrana C', min: 10, max: 500, step: 5, value: st.C, digits: 0, unit: 'pF', onInput: function (v) { st.C = v; run(); } });
      var sI = U.slider({ label: 'Corrente iniettata', min: -0.5, max: 0.5, step: 0.01, value: st.I, digits: 2, unit: 'nA', onInput: function (v) { st.I = v; run(); } });
      var tF = U.toggle({ label: 'Famiglia di gradini (iper- e depolarizzanti)', value: st.fam, onChange: function (v) { st.fam = v; run(); } });
      var tE = U.toggle({ label: 'Membrana eccitabile (canali Na⁺ e K⁺ di Hodgkin-Huxley)', value: st.exc, onChange: function (v) { st.exc = v; sR.el.style.opacity = v ? 0.4 : 1; run(); } });
      [sR.el, sC.el, sI.el, tF.el, tE.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Membrana passiva: $C\\,dV/dt = -(V - V_r)/R + I$. Risposta al gradino: $V(t) = V_r + IR(1 - e^{-t/\\tau})$, τ = RC (100 MΩ × 100 pF = 10 ms). In modalità eccitabile la cellula usa le conduttanze di Hodgkin-Huxley (6,3 °C) con area tale che C sia quella scelta: piccoli gradini danno risposte elettrotoniche, quelli sopra soglia il potenziale d\'azione.'));
      var ro = U.readouts([{ key: 'dv', label: 'ΔV a regime', hl: true }, { key: 'r', label: 'R misurata = ΔV/I' }, { key: 't', label: 'τ (tempo al 63%)' }, { key: 'c', label: 'C calcolata = τ/R' }]);
      L.main.appendChild(ro.el);
      var pV = U.plot(L.main, { title: 'Potenziale di membrana registrato', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 250 });
      var pI = U.plot(L.main, { title: 'Corrente iniettata', xlabel: 'tempo (ms)', ylabel: 'I (nA)', height: 110 });
      function sim(I) {
        var t0 = 10, t1 = t0 + st.dur, tmax = t1 + 50, C = st.C / 1000, Vr = -65;
        var stim = function (t) { return t >= t0 && t < t1 ? I : 0; };
        if (st.exc) {
          var p = F.HH.defaults(), dens = function (t) { return stim(t) / C; };
          var r = F.HH.simulate({ p: p, tmax: tmax, I: dens, every: 2 });
          return { t: r.t, V: r.V, I: r.t.map(stim) };
        }
        var dt = 0.05, V = Vr, T = [], VV = [], II = [];
        for (var t = 0; t <= tmax; t += dt) { T.push(t); VV.push(V); II.push(stim(t)); V += dt * (stim(t) - (V - Vr) / st.R) / C; }
        return { t: T, V: VV, I: II };
      }
      function run() {
        var amps = st.fam ? [-2, -1, -0.5, 0.5, 1, 2].map(function (k) { return k * Math.abs(st.I || 0.1); }) : [st.I];
        var ser = [], serI = [];
        amps.forEach(function (a, k) {
          var r = sim(a), col = palette[k % palette.length];
          var d = F.decimate(r.t, r.V, 800);
          ser.push({ x: d.x, y: d.y, color: col }); serI.push({ x: r.t, y: r.I, color: col });
        });
        var tau = st.R * st.C / 1000, dV = st.I * st.R;
        var vlines = st.exc ? [] : [{ x: 10 + tau, label: 'τ', color: '--ok' }];
        var hlines = st.exc || st.fam ? [] : [{ y: -65 + 0.632 * dV, label: '63%', color: '--ok', include: false }];
        pV.update({ series: ser, vlines: vlines, hlines: hlines });
        pI.update({ series: serI });
        if (!st.exc) {
          ro.set('dv', F.fmt(dV, 1) + ' mV'); ro.set('r', st.I ? F.fmt(dV / st.I, 0) + ' MΩ' : '—');
          ro.set('t', F.fmt(tau, 1) + ' ms'); ro.set('c', F.fmt(tau / st.R * 1000, 0) + ' pF');
        } else { ro.set('dv', 'variabile'); ro.set('r', 'dipende da V'); ro.set('t', '≈ 1,5 ms'); ro.set('c', F.fmt(st.C, 0) + ' pF'); }
      }
      run();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var ccBase = function () { tE.set(false); tF.set(false); sR.set(100); sC.set(100); sI.set(0.1); };
      U.explainer(L, {
        watch: ro,
        base: ccBase,
        legend: [['--c1', 'potenziale registrato'], ['--ok', 'verde: costante di tempo τ (63% della risposta)']],
        narrate: function () {
          var f = F.fmt, tau = st.R * st.C / 1000, dV = st.I * st.R;
          if (st.exc) {
            var dens = st.I / (st.C / 1000), rr = F.HH.simulate({ p: F.HH.defaults(), tmax: 10 + st.dur + 50, I: function (t) { return t >= 10 && t < 10 + st.dur ? dens : 0; }, every: 2 }), nsp = rr.spikes.length;
            var e = `Con la membrana <b>eccitabile</b> (canali Na⁺ e K⁺ di Hodgkin-Huxley) la risposta non è più un semplice circuito RC. Un gradino di ${f(st.I, 2)} nA su una cellula di ${f(st.C, 0)} pF equivale a una densità di corrente di ${f(dens, 1)} µA/cm². `;
            if (nsp > 0) e += `Questa corrente porta la depolarizzazione oltre la <b>soglia</b> (circa 15 mV sopra il riposo): i canali Na⁺ si aprono in modo rigenerativo e ${nsp === 1 ? 'compare' : 'compaiono'} ${nsp === 1 ? 'un <b>potenziale d\'azione</b>' : nsp + ' <b>potenziali d\'azione</b>'} di ampiezza fissa (tutto o nulla), non una risposta proporzionale alla corrente. `;
            else if (st.I > 0) e += `Questa corrente è <b>sottosoglia</b>: la risposta è ancora elettrotonica (proporzionale alla corrente) e non compare nessun potenziale d'azione. Per superare la soglia aumenta la corrente o riduci la capacità: la corrente <i>per unità di superficie</i> aumenta. `;
            else e += `Il gradino iperpolarizzante non apre i canali Na⁺: durante il gradino la risposta è passiva. `;
            if (st.I < 0 && nsp > 0) e += `Qui il PdA compare alla <b>fine</b> del gradino (potenziale «da rimbalzo», anode break): l'iperpolarizzazione ha tolto l'inattivazione ai canali Na⁺ e, rilasciata, la membrana scatta. `;
            return e;
          }
          return `Si inietta un gradino di corrente di ${f(st.I, 2)} nA (da 10 a 70 ms). La membrana si comporta come una <b>resistenza</b> (R = ${f(st.R, 0)} MΩ: i canali aperti) in parallelo a un <b>condensatore</b> (C = ${f(st.C, 0)} pF: il doppio strato). All'inizio la corrente carica il condensatore, quindi il potenziale ${st.I < 0 ? 'scende' : 'sale'} <i>gradualmente</i>; quando è carico tutta la corrente passa nella resistenza e il potenziale si ferma a ΔV = I·R = <b>${f(dV, 1)} mV</b>, con costante di tempo τ = R·C = <b>${f(tau, 1)} ms</b> (dopo τ ha raggiunto il 63%). Alla fine del gradino il condensatore si scarica con lo stesso τ.${st.I < 0 ? ' La corrente negativa iperpolarizza.' : ''}${st.fam ? ' Nella famiglia di gradini le risposte sono proporzionali alla corrente e simmetriche per iper- e depolarizzazione: è una risposta passiva (elettrotonica).' : ''}`;
        },
        experiments: [
          { label: 'Gradino standard', run: function () { ccBase(); }, why: `R = 100 MΩ, C = 100 pF: τ = 10 ms. Il potenziale sale esponenzialmente fino a ΔV = I·R = 10 mV.` },
          { label: 'Cellula più grande (C = 300 pF)', run: function () { ccBase(); sC.set(300); }, why: `Più capacità = più carica da accumulare: la risposta è <b>più lenta</b> (τ triplica), ma raggiunge lo stesso valore finale I·R.` },
          { label: 'Più canali aperti (R = 30 MΩ)', run: function () { ccBase(); sR.set(30); }, why: `Con più canali aperti la resistenza scende: a parità di corrente la risposta è <b>più piccola</b> (ΔV = I·R) e <b>più veloce</b> (τ = R·C).` },
          { label: 'Gradino iperpolarizzante', run: function () { ccBase(); sI.set(-0.1); }, why: `La corrente negativa fa scendere il potenziale con la stessa costante di tempo: la risposta passiva è simmetrica.` },
          { label: 'Famiglia di gradini', run: function () { ccBase(); tF.set(true); }, why: `Al raddoppiare della corrente raddoppia la risposta: relazione lineare, cioè legge di Ohm. Vale solo finché non si attivano canali voltaggio-dipendenti.` },
          { label: 'Membrana eccitabile + gradino forte', run: function () { ccBase(); tE.set(true); sC.set(40); sI.set(0.4); }, why: `Con canali Na⁺ e K⁺ voltaggio-dipendenti il gradino supera la soglia e genera potenziali d'azione: la risposta non è più proporzionale alla corrente.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { pV.dispose(); pI.dispose(); } };
    }
  });

  // ================================================================ Voltage clamp (Hodgkin & Huxley)
  F.registerSim('voltageclamp', {
    title: 'Voltage clamp: le correnti di Hodgkin e Huxley',
    section: 'elettro',
    short: 'Il potenziale viene bloccato a valori scelti e si misura la corrente: Na⁺ precoce entrante che si inattiva, K⁺ tardiva uscente. TTX, TEA, relazione I-V, conduttanze, recupero dall\'inattivazione.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mode: P.mode || 'step', V: P.V === undefined ? 0 : P.V, ttx: !!P.ttx, tea: !!P.tea, comp: P.comp === undefined ? true : P.comp, T: 6.3, gap: 5 };
      var mSel = U.seg({ label: 'Protocollo', value: st.mode, options: [['step', 'Un gradino'], ['family', 'Famiglia + I-V'], ['cond', 'Conduttanze g(t)'], ['pp', 'Due impulsi (recupero)']], onChange: function (v) { st.mode = v; run(); } });
      var sV = U.slider({ label: 'Potenziale imposto (gradino)', min: -100, max: 80, step: 1, value: st.V, digits: 0, unit: 'mV', onInput: function (v) { st.V = v; run(); } });
      var sG = U.slider({ label: 'Intervallo tra i due impulsi', min: 1, max: 30, step: 0.5, value: st.gap, digits: 1, unit: 'ms', onInput: function (v) { st.gap = v; run(); } });
      var tT = U.toggle({ label: 'TTX (blocca i canali Na⁺)', value: st.ttx, onChange: function (v) { st.ttx = v; run(); } });
      var tE = U.toggle({ label: 'TEA (blocca i canali K⁺)', value: st.tea, onChange: function (v) { st.tea = v; run(); } });
      var tC = U.toggle({ label: 'Mostra le componenti Na⁺ e K⁺', value: st.comp, onChange: function (v) { st.comp = v; run(); } });
      var sT = U.slider({ label: 'Temperatura', min: 6.3, max: 20, step: 0.1, value: 6.3, digits: 1, unit: '°C', onInput: function (v) { st.T = v; run(); } });
      [mSel.el, sV.el, sG.el, tT.el, tE.el, tC.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.advanced([sT.el]));
      L.controls.appendChild(U.params('Modello di Hodgkin & Huxley (1952) dell\'assone gigante di calamaro, potenziale di mantenimento −65 mV. Il clamp ha una costante di tempo di 20 µs (resistenza in serie): da qui il breve transiente capacitivo all\'inizio e alla fine del gradino. Convenzione: corrente entrante negativa. $g(t) = I(t)/(V_{clamp} - E_i)$ con E<sub>Na</sub> = +50 mV, E<sub>K</sub> = −77 mV.'));
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Corrente di membrana', xlabel: 'tempo (ms)', ylabel: 'I (µA/cm²)', height: 260 });
      var p2host = el('div'); L.main.appendChild(p2host);
      var p2 = U.plot(p2host, { title: '', xlabel: '', ylabel: '', height: 220 });
      var labs = function (a, b, c) { var n = ro.el.querySelectorAll('.rl'); n[0].innerHTML = a; n[1].innerHTML = b; n[2].innerHTML = c; };
      function vc(cmd, tmax) {
        var p = F.HH.defaults(); p.T = st.T;
        return F.HH.vclamp({ p: p, Vcmd: cmd, tmax: tmax, blockNa: st.ttx ? 1 : 0, blockK: st.tea ? 1 : 0, every: 4 });
      }
      function run() {
        sV.el.style.display = st.mode === 'step' || st.mode === 'cond' ? '' : 'none';
        sG.el.style.display = st.mode === 'pp' ? '' : 'none';
        tC.el.style.display = st.mode === 'step' ? '' : 'none';
        p2host.style.display = st.mode === 'step' ? 'none' : '';
        if (st.mode === 'step') {
          var r = vc(function (t) { return t >= 1 && t < 11 ? st.V : -65; }, 14);
          var ser = [{ name: 'corrente totale', x: r.t, y: r.I, color: '--text', width: 2.2 }];
          if (st.comp) { ser.push({ name: 'I Na', x: r.t, y: r.INa, color: '--na', dash: [5, 3] }); ser.push({ name: 'I K', x: r.t, y: r.IK, color: '--k', dash: [5, 3] }); }
          var lim = Math.max(200, Math.max.apply(null, r.INa.map(Math.abs).concat(r.IK.map(Math.abs))) * 1.15);
          p1.update({ series: ser, ylim: [-lim, lim], hlines: [], vlines: [{ x: 1, label: 'gradino a ' + F.fmt(st.V, 0) + ' mV' }] });
          var iNaPk = r.INa.reduce(function (m, v) { return Math.abs(v) > Math.abs(m) ? v : m; }, 0);
          labs('Picco della corrente Na⁺', 'Corrente K⁺ a fine gradino', 'Direzione della corrente Na⁺');
          ro.set('a', F.fmt(iNaPk, 0) + ' µA/cm²'); ro.set('b', F.fmt(r.IK[r.IK.length - 1 - Math.round(3 / 0.02)], 0) + ' µA/cm²');
          ro.set('c', Math.abs(iNaPk) < 1 ? 'nulla' + (Math.abs(st.V - 50) < 3 ? ' (V = E<sub>Na</sub>!)' : '') : (iNaPk < 0 ? 'entrante (V &lt; E<sub>Na</sub>)' : 'uscente (V &gt; E<sub>Na</sub>)'));
        } else if (st.mode === 'family') {
          var Vs = [], pk = [], ss = [], sr = [];
          for (var V = -100; V <= 80; V += 10) Vs.push(V);
          Vs.forEach(function (V, k) {
            var r2 = vc(function (t) { return t >= 1 && t < 11 ? V : -65; }, 12);
            var iNa = r2.INa.reduce(function (m, v) { return Math.abs(v) > Math.abs(m) ? v : m; }, 0);
            pk.push(iNa); ss.push(r2.IK[Math.round(10.5 / 0.02)]);
            if (k % 2 === 0) sr.push({ x: r2.t, y: r2.I, color: palette[(k / 2) % palette.length], width: 1.4 });
          });
          p1.update({ series: sr, ylim: [-1200, 1600], vlines: [], hlines: [] });
          p2.o.title = 'Relazione I-V'; p2.o.xlabel = 'potenziale imposto (mV)'; p2.o.ylabel = 'I (µA/cm²)';
          p2.update({ series: [{ name: 'picco I Na', x: Vs, y: pk, color: '--na' }, { name: 'I K a regime', x: Vs, y: ss, color: '--k' }], vlines: [{ x: 50, label: 'E Na', color: '--na' }, { x: -77, label: 'E K', color: '--k' }], hlines: [] });
          var vrev = NaN;
          for (var j = 1; j < Vs.length; j++) if (pk[j - 1] < 0 && pk[j] >= 0) vrev = Vs[j - 1] + (0 - pk[j - 1]) / (pk[j] - pk[j - 1]) * 10;
          labs('Potenziale di inversione di I<sub>Na</sub>', 'Corrente Na⁺ massima', 'Interpretazione');
          ro.set('a', F.fmt(vrev, 1) + ' mV'); ro.set('b', F.fmt(Math.min.apply(null, pk), 0) + ' µA/cm²'); ro.set('c', 'inversione a E<sub>Na</sub>: la corrente è portata da Na⁺');
        } else if (st.mode === 'cond') {
          var r3 = vc(function (t) { return t >= 1 && t < 11 ? st.V : -65; }, 12);
          var gNa = r3.INa.map(function (i, k) { return Math.abs(r3.V[k] - 50) > 1 ? i / (r3.V[k] - 50) : NaN; });
          var gK = r3.IK.map(function (i, k) { return Math.abs(r3.V[k] + 77) > 1 ? i / (r3.V[k] + 77) : NaN; });
          p1.update({ series: [{ name: 'I Na', x: r3.t, y: r3.INa, color: '--na' }, { name: 'I K', x: r3.t, y: r3.IK, color: '--k' }], ylim: [null, null], vlines: [], hlines: [] });
          p2.o.title = 'Conduttanze calcolate: g = I/(V − E)'; p2.o.xlabel = 'tempo (ms)'; p2.o.ylabel = 'g (mS/cm²)';
          p2.update({ series: [{ name: 'g Na', x: r3.t, y: gNa, color: '--na' }, { name: 'g K', x: r3.t, y: gK, color: '--k' }], ylim: [0, 40], vlines: [], hlines: [] });
          var gNaMax = Math.max.apply(null, gNa.filter(isFinite)), gKend = gK[gK.length - 60];
          labs('g<sub>Na</sub> massima', 'g<sub>K</sub> a fine gradino', 'Nota');
          ro.set('a', F.fmt(gNaMax, 1) + ' mS/cm²'); ro.set('b', F.fmt(gKend, 1) + ' mS/cm²'); ro.set('c', 'g<sub>Na</sub> sale e poi si inattiva; g<sub>K</sub> sale più lentamente e resta');
        } else {
          var gap = st.gap, d1 = 5;
          var r4 = vc(function (t) { return (t >= 1 && t < 1 + d1) || (t >= 1 + d1 + gap && t < 1 + 2 * d1 + gap) ? 0 : -65; }, 2 + 2 * d1 + gap + 3);
          p1.update({ series: [{ name: 'I Na', x: r4.t, y: r4.INa, color: '--na' }], ylim: [-900, 100], vlines: [], hlines: [] });
          var gaps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30], rec = gaps.map(function (g) {
            var rr = vc(function (t) { return (t >= 1 && t < 1 + d1) || (t >= 1 + d1 + g && t < 1 + 2 * d1 + g) ? 0 : -65; }, 2 + 2 * d1 + g);
            var a1 = 0, a2 = 0; rr.t.forEach(function (t, i) { if (t < 1 + d1) a1 = Math.min(a1, rr.INa[i]); else if (t >= 1 + d1 + g) a2 = Math.min(a2, rr.INa[i]); });
            return a2 / a1 * 100;
          });
          var cur = rec[gaps.indexOf(gap)];
          p2.o.title = 'Recupero dall\'inattivazione dei canali Na⁺'; p2.o.xlabel = 'intervallo tra gli impulsi (ms)'; p2.o.ylabel = 'I2/I1 (%)';
          p2.update({ series: [{ x: gaps, y: rec, color: '--na' }, { x: gaps, y: rec, type: 'points', color: '--na' }], ylim: [0, 105], vlines: [{ x: gap, label: F.fmt(gap, 1) + ' ms' }], hlines: [] });
          var rr2 = r4, a1 = 0, a2 = 0; rr2.t.forEach(function (t, i) { if (t < 1 + d1) a1 = Math.min(a1, rr2.INa[i]); else if (t >= 1 + d1 + gap) a2 = Math.min(a2, rr2.INa[i]); });
          labs('Seconda corrente / prima', 'Interpretazione', 'Effetto sul PdA');
          ro.set('a', F.fmt(a2 / a1 * 100, 0) + '%'); ro.set('b', gap < 3 ? 'gran parte dei canali è ancora inattivata' : (a2 / a1 > 0.9 ? 'canali quasi del tutto recuperati' : 'recupero parziale'));
          ro.set('c', 'è la base della refrattarietà');
          void cur;
        }
      }
      run();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var vcBase = function () { mSel.set('step'); sV.set(0); tT.set(false); tE.set(false); tC.set(true); };
      U.explainer(L, {
        watch: ro,
        base: vcBase,
        legend: [['--na', 'arancio: corrente del Na⁺ (negativa = entrante)'], ['--k', 'blu: corrente del K⁺ (positiva = uscente)'], ['--text', 'nero: corrente totale registrata']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot();
          var drug = st.ttx && st.tea ? ' Con TTX e TEA entrambi i canali sono bloccati: restano solo il transiente capacitivo e la corrente di fuga.' : (st.ttx ? ' La <b>TTX</b> blocca i canali Na⁺: resta solo la corrente K⁺ tardiva e uscente. Hodgkin e Huxley separarono così le due correnti.' : (st.tea ? ' Il <b>TEA</b> blocca i canali K⁺: resta solo la corrente Na⁺ precoce ed entrante, che si inattiva da sola in circa 2 ms.' : ''));
          if (st.mode === 'step') {
            var s = `Il potenziale è <b>bloccato</b> a −65 mV e poi portato a ${f(st.V, 0)} mV per 10 ms. L'amplificatore inietta a ogni istante la corrente necessaria a mantenere V: è uguale e opposta a quella che attraversa i canali, quindi la <b>misuriamo direttamente</b>. Per convenzione la corrente <b>negativa è entrante</b> (Na⁺) e quella <b>positiva è uscente</b> (K⁺). `;
            if (Math.abs(st.V - 50) < 4) s += `A V ≈ +50 mV (= E<sub>Na</sub>) la corrente Na⁺ è quasi nulla pur con i canali aperti: la forza motrice è zero (<b>potenziale di inversione</b>).`;
            else if (st.V > 55) s += `Sopra E<sub>Na</sub> la corrente Na⁺ cambia segno e diventa uscente.`;
            else if (st.V < -45) s += `Questa depolarizzazione è modesta: si aprono pochi canali e le correnti sono piccole.`;
            else s += `Si vedono: un brevissimo transiente capacitivo, la corrente <b>Na⁺ precoce</b> che si attiva e si inattiva in pochi ms, e la corrente <b>K⁺ più lenta</b> che resta finché dura il gradino.`;
            return s + drug;
          }
          if (st.mode === 'family') return `Il gradino viene ripetuto a molti potenziali (da −100 a +80 mV). In basso c'è la relazione <b>I–V</b>: il picco della corrente Na⁺ (arancio) è entrante, massimo intorno a −20…0 mV, si annulla a E<sub>Na</sub> (+50 mV) e poi diventa uscente; la corrente K⁺ a regime (blu) cresce con la depolarizzazione. Il potenziale di inversione della corrente Na⁺ è ${sn[0].value}: identifica lo ione che la porta.${drug}`;
          if (st.mode === 'cond') return `Dalla corrente si ricava la conduttanza istante per istante, g(t) = I/(V − E). <b>g<sub>Na</sub></b> (arancio) sale rapidamente e poi <b>cala</b> pur con la depolarizzazione ancora presente: è l'<b>inattivazione</b>. <b>g<sub>K</sub></b> (blu) sale più lentamente e <b>non si inattiva</b>. Queste due curve, dipendenti dal voltaggio e dal tempo, sono ciò che Hodgkin e Huxley inserirono nel loro modello.${drug}`;
          var pct = parseFloat(sn[0].value.replace(',', '.'));
          return `Due gradini identici a 0 mV separati da ${f(st.gap, 1)} ms a −65 mV. La seconda corrente Na⁺ è il <b>${sn[0].value}</b> della prima: ${pct < 60 ? 'molti canali sono ancora inattivati e non hanno avuto il tempo di recuperare' : (pct < 95 ? 'il recupero è parziale' : 'i canali sono quasi del tutto recuperati')}. Per uscire dall'inattivazione il canale deve restare a potenziale negativo per alcuni ms: questo recupero lento è la base del <b>periodo refrattario</b>.${drug}`;
        },
        experiments: [
          { label: 'Gradino a 0 mV', run: function () { vcBase(); }, why: `Entra Na⁺ (negativa, precoce) ed esce K⁺ (positiva, tardiva). La corrente totale nera è la somma.` },
          { label: 'Gradino a −50 mV', run: function () { vcBase(); sV.set(-50); }, why: `Siamo vicini alla soglia di attivazione: si apre solo una piccola frazione di canali e le correnti sono piccole.` },
          { label: 'A E_Na (+50 mV)', run: function () { vcBase(); sV.set(50); }, why: `Con V = E<sub>Na</sub> la forza motrice del Na⁺ è nulla: i canali si aprono ma non passa corrente netta di Na⁺. Resta quella del K⁺, molto grande.` },
          { label: 'Con TTX', run: function () { vcBase(); tT.set(true); }, why: `La tetrodotossina blocca i canali Na⁺: sparisce la corrente precoce entrante e resta la corrente K⁺ tardiva.` },
          { label: 'Con TEA', run: function () { vcBase(); tE.set(true); }, why: `Il tetraetilammonio blocca i canali K⁺: sparisce la corrente tardiva uscente e resta quella precoce Na⁺, che si inattiva.` },
          { label: 'Famiglia di gradini + I–V', run: function () { vcBase(); mSel.set('family'); }, why: `La relazione I–V del picco Na⁺ ha un minimo e poi risale fino a zero a E<sub>Na</sub>, dove inverte segno.` },
          { label: 'Conduttanze', run: function () { vcBase(); mSel.set('cond'); }, why: `g<sub>Na</sub> sale e ricade (inattivazione); g<sub>K</sub> sale più lentamente e resta.` },
          { label: 'Due impulsi a 3 ms', run: function () { vcBase(); mSel.set('pp'); sG.set(3); }, why: `Dopo 3 ms molti canali Na⁺ sono ancora inattivati: la seconda corrente è molto più piccola.` },
          { label: 'Due impulsi a 20 ms', run: function () { vcBase(); mSel.set('pp'); sG.set(20); }, why: `Dopo 20 ms i canali sono quasi tutti recuperati: la seconda corrente è quasi uguale alla prima.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { p1.dispose(); p2.dispose(); } };
    }
  });

  // ================================================================ Patch clamp: canale singolo
  F.registerSim('patchclamp', {
    title: 'Patch clamp: la corrente di un singolo canale',
    section: 'elettro',
    short: 'Aperture e chiusure casuali di un canale (pA): ampiezza i = γ(V − E), probabilità di apertura, tempi di permanenza, istogrammi, I-V a canale aperto.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { g: P.g || 20, V: P.V === undefined ? -60 : P.V, E: P.E === undefined ? 0 : P.E, a: P.a || 0.05, b: P.b || 0.2, n: 1, noise: 0.12, seed: 1 };
      var sGm = U.slider({ label: 'Conduttanza di canale singolo γ', min: 2, max: 100, step: 1, value: st.g, digits: 0, unit: 'pS', onInput: function (v) { st.g = v; run(); } });
      var sV = U.slider({ label: 'Potenziale della membrana nel patch', min: -100, max: 80, step: 1, value: st.V, digits: 0, unit: 'mV', onInput: function (v) { st.V = v; run(); } });
      var sE = U.slider({ label: 'Potenziale di inversione E', min: -90, max: 60, step: 1, value: st.E, digits: 0, unit: 'mV', onInput: function (v) { st.E = v; run(); } });
      var sA = U.slider({ label: 'Velocità di apertura α', min: 0.005, max: 1, value: st.a, log: true, fmt: function (v) { return F.fmt(v, 3) + ' /ms'; }, onInput: function (v) { st.a = v; run(); } });
      var sB = U.slider({ label: 'Velocità di chiusura β', min: 0.01, max: 2, value: st.b, log: true, fmt: function (v) { return F.fmt(v, 3) + ' /ms'; }, onInput: function (v) { st.b = v; run(); } });
      var nSel = U.seg({ label: 'Canali nel patch', value: 1, options: [[1, '1'], [3, '3'], [50, '50']], onChange: function (v) { st.n = +v; run(); } });
      var pre = el('div', { class: 'btn-row' }, [
        U.button('GABA-A: controllo', function () { sGm.set(27); sE.set(-70); sV.set(-20); sA.set(0.05); sB.set(0.33); }),
        U.button('+ benzodiazepina (↑ frequenza)', function () { sA.set(0.15); sB.set(0.33); }),
        U.button('+ barbiturico (↑ durata)', function () { sA.set(0.05); sB.set(0.08); }),
        U.button('Nuova registrazione', function () { st.seed++; run(); })
      ]);
      [sGm.el, sV.el, sE.el, sA.el, sB.el, nSel.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.group('Esempi', [pre]));
      L.controls.appendChild(U.params('Canale a due stati C ⇌ O (catena di Markov, simulazione esatta di Gillespie): tempi di permanenza esponenziali con medie 1/α (chiuso) e 1/β (aperto); P(aperto) = α/(α+β). Rumore di fondo gaussiano. Sigillo > 1 GΩ (Neher & Sakmann). GABA-A: γ ≈ 27 pS; le benzodiazepine aumentano la frequenza di apertura, i barbiturici la durata delle aperture.'));
      var ro = U.readouts([{ key: 'i', label: 'Corrente di canale aperto i = γ(V − E)', hl: true }, { key: 'po', label: 'P(aperto): teoria / misurata' }, { key: 'to', label: 'Apertura media: teoria / misurata' }, { key: 'f', label: 'Aperture al secondo' }]);
      L.main.appendChild(ro.el);
      var pT = U.plot(L.main, { title: 'Registrazione (500 ms)', xlabel: 'tempo (ms)', ylabel: 'corrente (pA)', height: 200 });
      var row = el('div', { class: 'plots-2' }); L.main.appendChild(row);
      var a1 = el('div'), a2 = el('div'); row.appendChild(a1); row.appendChild(a2);
      var pH = U.plot(a1, { title: 'Istogramma delle ampiezze', xlabel: 'corrente (pA)', ylabel: 'conteggi', height: 190 });
      var pD = U.plot(a2, { title: 'Durata delle aperture', xlabel: 'ms', ylabel: 'n. aperture', height: 190 });
      var pIV = U.plot(L.main, { title: 'Relazione I-V a canale aperto (misurata)', xlabel: 'V (mV)', ylabel: 'i (pA)', height: 190, xlim: [-100, 80] });
      function run() {
        var r = F.singleChannel({ alpha: st.a, beta: st.b, gamma: st.g, V: st.V, Erev: st.E, duration: 500, dtSample: 0.1, nChannels: st.n, noise: st.noise, seed: st.seed });
        var long = F.singleChannel({ alpha: st.a, beta: st.b, gamma: st.g, V: st.V, Erev: st.E, duration: 20000, dtSample: 0.1, nChannels: 1, noise: 0, seed: st.seed + 99 });
        var d = F.decimate(Array.from(r.t), Array.from(r.I), 1500);
        pT.update({ series: [{ x: d.x, y: d.y, color: '--c1', width: 1 }], hlines: [{ y: 0, label: 'chiuso', color: '--muted', align: 'left' }, { y: r.iOpen, label: 'aperto', color: '--ok', align: 'left' }] });
        var lo = Math.min(0, r.iOpen * st.n) - 1.2, hi = Math.max(0, r.iOpen * st.n) + 1.2;
        var hst = F.histogram(Array.from(r.I), lo, hi, 60);
        pH.update({ series: [{ x: hst.centers, y: hst.counts, type: 'bars', color: '--c1', barWidth: hst.width }] });
        var od = long.openDwell, maxT = Math.max(5, 4 / st.b), hd = F.histogram(od, 0, maxT, 30);
        var nOpen = od.length, theo = hd.centers.map(function (x) { return nOpen * hd.width * st.b * Math.exp(-st.b * x); });
        pD.update({ series: [{ x: hd.centers, y: hd.counts, type: 'bars', color: '--c4', barWidth: hd.width }, { x: hd.centers, y: theo, color: '--na', name: 'esponenziale 1/β' }] });
        var Vs = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80], iv = Vs.map(function (V) { return st.g * (V - st.E) * 1e-3; });
        pIV.update({ series: [{ x: Vs, y: iv, color: '--c1' }, { x: Vs, y: iv, type: 'points', color: '--c1' }], vlines: [{ x: st.E, label: 'E', color: '--ok' }], hlines: [] });
        ro.set('i', F.fmt(r.iOpen, 2) + ' pA');
        ro.set('po', F.fmt(r.Po, 2) + ' / ' + F.fmt(F.mean(Array.from(long.state)), 2));
        ro.set('to', F.fmt(1 / st.b, 1) + ' / ' + F.fmt(F.mean(od), 1) + ' ms');
        ro.set('f', F.fmt(od.length / 20, 0) + ' /s');
      }
      run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var pcBase = function () { sGm.set(20); sV.set(-60); sE.set(0); sA.set(0.05); sB.set(0.2); nSel.set(1); };
      U.explainer(L, {
        watch: ro,
        base: pcBase,
        narrate: function () {
          var f = F.fmt, i = st.g * (st.V - st.E) * 1e-3, Po = st.a / (st.a + st.b);
          var s = `Si registra la corrente di ${st.n === 1 ? 'un <b>singolo canale</b>' : st.n + ' canali'} in un piccolo frammento di membrana (patch). `;
          s += st.n === 1 ? `Il canale è come un interruttore che si apre e si chiude a caso: la traccia salta tra due livelli, <b>chiuso</b> (0 pA) e <b>aperto</b> (${f(i, 2)} pA). ` : `Con ${st.n} canali la traccia mostra più livelli (0, 1, 2… canali aperti); con molti canali la somma assomiglia alla corrente macroscopica del voltage clamp. `;
          s += `L'<b>ampiezza</b> dell'apertura dipende dalla conduttanza e dalla forza motrice: i = γ·(V − E) = ${f(st.g, 0)} pS × ${f(st.V - st.E, 0)} mV = ${f(i, 2)} pA${Math.abs(i) < 0.01 ? ' (V = E: nessuna corrente, è il potenziale di inversione)' : (i < 0 ? ' (negativa: entrante)' : ' (positiva: uscente)')}. I tempi sono casuali: il canale resta aperto in media 1/β = ${f(1 / st.b, 1)} ms e chiuso 1/α = ${f(1 / st.a, 1)} ms, quindi è aperto per il <b>${f(Po * 100, 0)}%</b> del tempo (P(aperto) = α/(α+β)).`;
          return s;
        },
        experiments: [
          { label: 'Canale singolo', run: function () { pcBase(); }, why: `Due livelli: chiuso e aperto. L'ampiezza non cambia da un'apertura all'altra, cambiano solo i tempi.` },
          { label: 'Si apre più spesso (α↑)', run: function () { pcBase(); sA.set(0.5); }, why: `Con una velocità di apertura maggiore i periodi di chiusura sono più brevi: la probabilità di apertura sale, ma la durata di ogni apertura resta quella.` },
          { label: 'Aperture più lunghe (β↓)', run: function () { pcBase(); sB.set(0.05); }, why: `Con una velocità di chiusura minore ogni apertura dura di più (1/β = 20 ms): la probabilità di apertura sale per un motivo diverso, come con i barbiturici.` },
          { label: 'V = E (nessuna corrente)', run: function () { pcBase(); sV.set(0); }, why: `Quando il potenziale coincide con il potenziale di inversione la forza motrice è nulla: il canale si apre e si chiude, ma non passa corrente.` },
          { label: 'Iperpolarizzato (−100 mV)', run: function () { pcBase(); sV.set(-100); }, why: `Più forza motrice, più corrente per canale aperto: l'ampiezza è proporzionale a V − E (I–V lineare a canale aperto).` },
          { label: '50 canali', run: function () { pcBase(); nSel.set(50); }, why: `La somma di molti canali indipendenti dà una corrente quasi continua con rumore, proporzionale a N·P(aperto): è la corrente che si misura con il voltage clamp.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { [pT, pH, pD, pIV].forEach(function (p) { p.dispose(); }); } };
    }
  });

  // ================================================================ Laboratorio Hodgkin-Huxley
  F.registerSim('hhlab', {
    title: 'Il potenziale d\'azione (modello di Hodgkin-Huxley)',
    section: 'elettro',
    short: 'Soglia, tutto-o-nulla, fasi del potenziale d\'azione, conduttanze, refrattarietà assoluta e relativa, codifica in frequenza, effetto della temperatura, del K⁺ esterno, di TTX e TEA.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = {
        mode: P.mode || 'single', I1: P.I1 === undefined ? 10 : P.I1, dur: P.dur || 1, gap: P.gap || 10, I2: P.I2 === undefined ? 30 : P.I2,
        Idc: P.Idc === undefined ? 10 : P.Idc, T: P.T === undefined ? 6.3 : P.T, Ko: 1, ttx: 0, tea: 0, show: P.show || 'g', allornone: !!P.allornone
      };
      var mSel = U.seg({ label: 'Esperimento', value: st.mode, options: [['single', 'Uno stimolo'], ['pair', 'Due stimoli'], ['dc', 'Corrente continua']], onChange: function (v) { st.mode = v; vis(); run(); } });
      var s1 = U.slider({ label: 'Intensità dello stimolo', min: 0, max: 50, step: 0.1, value: st.I1, digits: 1, unit: 'µA/cm²', onInput: function (v) { st.I1 = v; run(); } });
      var sD = U.slider({ label: 'Durata dello stimolo', min: 0.1, max: 5, step: 0.1, value: st.dur, digits: 1, unit: 'ms', onInput: function (v) { st.dur = v; run(); } });
      var sGap = U.slider({ label: 'Intervallo tra gli stimoli', min: 1, max: 30, step: 0.5, value: st.gap, digits: 1, unit: 'ms', onInput: function (v) { st.gap = v; run(); } });
      var s2 = U.slider({ label: 'Intensità del 2° stimolo', min: 0, max: 100, step: 0.5, value: st.I2, digits: 1, unit: 'µA/cm²', onInput: function (v) { st.I2 = v; run(); } });
      var sDC = U.slider({ label: 'Corrente continua', min: 0, max: 100, step: 0.5, value: st.Idc, digits: 1, unit: 'µA/cm²', onInput: function (v) { st.Idc = v; run(); } });
      var tAll = U.toggle({ label: 'Sovrapponi 6 intensità (tutto-o-nulla)', value: st.allornone, onChange: function (v) { st.allornone = v; run(); } });
      var shSel = U.seg({ label: 'Grafico inferiore', value: st.show, options: [['g', 'Conduttanze'], ['gates', 'Porte m, h, n'], ['I', 'Correnti']], onChange: function (v) { st.show = v; run(); } });
      var sT = U.slider({ label: 'Temperatura (Q10 = 3)', min: 0, max: 30, step: 0.5, value: st.T, digits: 1, unit: '°C', onInput: function (v) { st.T = v; run(); } });
      var sK = U.slider({ label: '[K⁺] esterno (× normale)', min: 0.25, max: 6, step: 0.05, value: 1, digits: 2, unit: '×', onInput: function (v) { st.Ko = v; run(); } });
      var sTTX = U.slider({ label: 'TTX: canali Na⁺ bloccati', min: 0, max: 1, step: 0.05, value: 0, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.ttx = v; run(); } });
      var sTEA = U.slider({ label: 'TEA: canali K⁺ bloccati', min: 0, max: 1, step: 0.05, value: 0, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.tea = v; run(); } });
      var bThr = U.button('Trova la soglia', function () { findThr(); });
      var bRef = U.button('Calcola la curva di refrattarietà', function () { refCurve(); }, 'primary');
      var bFI = U.button('Calcola la curva frequenza-corrente', function () { fiCurve(); }, 'primary');
      [mSel.el, s1.el, sD.el, sGap.el, s2.el, sDC.el, tAll.el].forEach(function (e) { L.controls.appendChild(e); });
      var btns = el('div', { class: 'btn-row' }, [bThr, bRef, bFI]); L.controls.appendChild(btns);
      L.controls.appendChild(shSel.el);
      L.controls.appendChild(U.advanced([sT.el, sK.el, sTTX.el, sTEA.el], 'Temperatura, K⁺ esterno, farmaci'));
      L.controls.appendChild(U.params('Equazioni originali di Hodgkin & Huxley (1952), assone gigante di calamaro, convenzione moderna (riposo −65 mV): g<sub>Na</sub> = 120, g<sub>K</sub> = 36, g<sub>L</sub> = 0,3 mS/cm²; E<sub>Na</sub> = +50, E<sub>K</sub> = −77 mV; C<sub>m</sub> = 1 µF/cm². Integrazione Runge-Kutta 4. Il K⁺ esterno modifica E<sub>K</sub> secondo Nernst. Un PdA è contato quando il potenziale supera 0 mV con una depolarizzazione rigenerativa dovuta al Na⁺. A 6,3 °C (temperatura degli esperimenti originali) i tempi sono più lunghi che nei mammiferi: aumenta la temperatura per vederli accorciare.'));
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }, { key: 'd', label: '' }]);
      L.main.appendChild(ro.el);
      var pV = U.plot(L.main, { title: 'Potenziale di membrana', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 250 });
      var pG = U.plot(L.main, { title: '', xlabel: 'tempo (ms)', ylabel: '', height: 190 });
      var pX = U.plot(L.main, { title: '', xlabel: '', ylabel: '', height: 220 });
      var labs = function (a, b, c, d) { var n = ro.el.querySelectorAll('.rl'); [a, b, c, d].forEach(function (x, i) { n[i].innerHTML = x; }); };
      var extra = null;
      function params() {
        var p = F.HH.defaults(); p.T = st.T;
        p.EK = -77 + F.RTF(st.T) * Math.log(st.Ko);
        var V0 = F.HH.rest(Object.assign({}, p))[0], g = F.HH.inf(V0); // riposo del controllo (senza farmaci)
        p.gNa *= (1 - st.ttx); p.gK *= (1 - st.tea);
        // i farmaci tolgono solo i canali voltaggio-dipendenti: la corrente di fuga è regolata in modo che il potenziale di riposo resti quello del controllo
        if (st.ttx > 0 || st.tea > 0) { var c = F.HH.currents(p, V0, g.m, g.h, g.n); p.EL = V0 + (c.INa + c.IK) / p.gL; }
        return p;
      }
      function vis() {
        s1.el.style.display = st.mode === 'dc' ? 'none' : '';
        sD.el.style.display = st.mode === 'dc' ? 'none' : '';
        sGap.el.style.display = st.mode === 'pair' ? '' : 'none';
        s2.el.style.display = st.mode === 'pair' ? '' : 'none';
        sDC.el.style.display = st.mode === 'dc' ? '' : 'none';
        tAll.el.style.display = st.mode === 'single' ? '' : 'none';
        bThr.style.display = st.mode === 'single' ? '' : 'none';
        bRef.style.display = st.mode === 'pair' ? '' : 'none';
        bFI.style.display = st.mode === 'dc' ? '' : 'none';
        extra = null; pX.wrap.style.display = 'none';
      }
      function run() {
        var p = params(), y0 = F.HH.rest(p), t0 = 2, tmax, stim, res;
        if (st.mode === 'single') {
          tmax = 25; stim = function (t) { return t >= t0 && t < t0 + st.dur ? st.I1 : 0; };
        } else if (st.mode === 'pair') {
          tmax = Math.max(30, t0 + st.gap + 20);
          stim = function (t) { return (t >= t0 && t < t0 + 0.5 ? 40 : 0) + (t >= t0 + st.gap && t < t0 + st.gap + 0.5 ? st.I2 : 0); };
        } else { tmax = 150; stim = function (t) { return t >= 10 && t < 140 ? st.Idc : 0; }; }
        res = F.HH.simulate({ p: p, tmax: tmax, I: stim, y0: y0 });
        var ser = [{ x: res.t, y: res.V, color: '--v', width: 2.2 }];
        if (st.mode === 'single' && st.allornone) {
          [0.25, 0.5, 0.8, 1.2, 2, 3].forEach(function (k, i) {
            var rr = F.HH.simulate({ p: p, tmax: tmax, I: function (t) { return t >= t0 && t < t0 + st.dur ? st.I1 * k : 0; }, y0: y0 });
            ser.push({ x: rr.t, y: rr.V, color: palette[i], width: 1.3, name: '× ' + F.fmt(k, 2) });
          });
        }
        var spans = [];
        if (st.mode === 'single') spans.push({ x0: t0, x1: t0 + st.dur, color: U.css('--warn'), alpha: 0.15 });
        if (st.mode === 'pair') { spans.push({ x0: t0, x1: t0 + 0.5, color: U.css('--warn'), alpha: 0.2 }); spans.push({ x0: t0 + st.gap, x1: t0 + st.gap + 0.5, color: U.css('--warn'), alpha: 0.2 }); }
        if (st.mode === 'dc') spans.push({ x0: 10, x1: 140, color: U.css('--warn'), alpha: 0.08, label: 'corrente applicata' });
        // numeri delle fasi del potenziale d'azione: ① salita, ② picco, ③ discesa, ④ iperpolarizzazione
        var fasi = [];
        if (st.mode === 'single' && !st.allornone && res.spikes.length === 1) {
          var Vv = res.V, Tt = res.t, ip = 0, q, iUp = -1, iDn = -1, iMin = 0;
          for (q = 1; q < Vv.length; q++) if (Vv[q] > Vv[ip]) ip = q;
          for (q = 0; q < ip; q++) if (Vv[q] >= -30) { iUp = q; break; }
          for (q = ip; q < Vv.length; q++) if (Vv[q] <= 0) { iDn = q; break; }
          iMin = ip; for (q = ip; q < Vv.length; q++) if (Vv[q] < Vv[iMin]) iMin = q;
          if (iUp >= 0) fasi.push({ x: Tt[iUp] - 0.2, y: Vv[iUp], text: '①', align: 'right', bold: true });
          fasi.push({ x: Tt[ip], y: Vv[ip] + 7, text: '②', align: 'center', bold: true });
          if (iDn >= 0) fasi.push({ x: Tt[iDn] + 0.2, y: Vv[iDn], text: '③', align: 'left', bold: true });
          if (Vv[iMin] < -45) fasi.push({ x: Tt[iMin], y: Vv[iMin] - 8, text: '④', align: 'center', bold: true });
        }
        pV.update({ series: ser, spans: spans, texts: fasi, ylim: [-90, fasi.length ? 66 : 55], hlines: [{ y: p.ENa, label: 'E Na', color: '--na', include: false }, { y: p.EK, label: 'E K', color: '--k', include: false }] });
        // grafico inferiore
        if (st.show === 'g') { pG.o.title = 'Conduttanze'; pG.o.ylabel = 'g (mS/cm²)'; pG.update({ series: [{ name: 'g Na', x: res.t, y: res.gNa, color: '--na' }, { name: 'g K', x: res.t, y: res.gK, color: '--k' }], ylim: [0, null] }); }
        else if (st.show === 'gates') { pG.o.title = 'Variabili di gating'; pG.o.ylabel = 'probabilità'; pG.update({ series: [{ name: 'm (attivazione Na)', x: res.t, y: res.m, color: '--na' }, { name: 'h (inattivazione Na)', x: res.t, y: res.h, color: '--c5' }, { name: 'n (attivazione K)', x: res.t, y: res.n, color: '--k' }], ylim: [0, 1] }); }
        else { pG.o.title = 'Correnti ioniche (entrante < 0)'; pG.o.ylabel = 'µA/cm²'; pG.update({ series: [{ name: 'I Na', x: res.t, y: res.INa, color: '--na' }, { name: 'I K', x: res.t, y: res.IK, color: '--k' }, { name: 'I L', x: res.t, y: res.IL, color: '--muted' }], ylim: [null, null] }); }
        var peak = Math.max.apply(null, res.V), minV = Math.min.apply(null, res.V.slice(Math.floor(res.V.length * 0.1)));
        if (st.mode === 'single') {
          labs('Potenziali d\'azione', 'Picco', 'Postpotenziale iperpolarizzante', 'Riposo');
          ro.set('a', res.spikes.length ? res.spikes.length + ' (sì)' : 'nessuno: risposta locale');
          ro.set('b', F.fmt(peak, 1) + ' mV'); ro.set('c', F.fmt(minV, 1) + ' mV'); ro.set('d', F.fmt(y0[0], 1) + ' mV');
        } else if (st.mode === 'pair') {
          var second = res.spikes.filter(function (s) { return s > t0 + st.gap; });
          var p2 = 0; res.t.forEach(function (t, i) { if (t > t0 + st.gap + 0.5 && res.V[i] > p2) p2 = res.V[i]; });
          labs('Secondo PdA', 'Picco del 2° PdA', 'Intervallo', 'Stato della membrana');
          ro.set('a', second.length ? 'sì' : 'no'); ro.set('b', second.length ? F.fmt(p2, 1) + ' mV' : '—'); ro.set('c', F.fmt(st.gap, 1) + ' ms');
          ro.set('d', second.length ? (p2 < peak - 5 ? 'refrattario relativo (PdA più piccolo)' : 'eccitabile') : 'refrattario (aumenta l\'intensità)');
        } else {
          var sp = res.spikes.filter(function (s) { return s > 30 && s < 140; });
          var f = sp.length > 1 ? 1000 * (sp.length - 1) / (sp[sp.length - 1] - sp[0]) : 0;
          labs('Frequenza di scarica', 'PdA totali', 'Picco', 'Nota');
          ro.set('a', F.fmt(f, 0) + ' Hz'); ro.set('b', res.spikes.length); ro.set('c', F.fmt(peak, 1) + ' mV');
          ro.set('d', st.Idc > 0 && res.spikes.length <= 1 ? (st.Idc > 100 ? 'blocco da depolarizzazione' : 'sotto la soglia per la scarica ripetitiva') : 'la frequenza codifica l\'intensità');
        }
        if (extra) extra();
      }
      function findThr() {
        var p = params(), y0 = F.HH.rest(p);
        bThr.textContent = 'Calcolo…';
        U.defer(function () {
          var th = F.HH.threshold(p, y0, 2, st.dur, 200);
          bThr.textContent = 'Trova la soglia';
          if (isFinite(th)) { s1.set(Math.ceil(th * 100) / 100); ro.set('a', 'soglia ≈ ' + F.fmt(th, 2) + ' µA/cm²'); }
        });
      }
      function refCurve() {
        var p = params(), y0 = F.HH.rest(p), base = F.HH.threshold(p, y0, 5, 0.5, 200);
        var gaps = [], ths = [], cond = function (t) { return t >= 0 && t < 0.5 ? 40 : 0; }, phi = F.HH.phi(st.T);
        for (var g = 1; g <= 30; g += (g < 8 ? 0.5 : 1)) gaps.push(g / Math.max(1, phi / 2));
        bRef.textContent = 'Calcolo… 0%';
        pX.wrap.style.display = '';
        var k = 0;
        var stepFn = function () {
          if (k >= gaps.length) { bRef.textContent = 'Calcola la curva di refrattarietà'; return; }
          var th = F.HH.threshold(p, y0, gaps[k], 0.5, 200, cond);
          ths.push(isFinite(th) ? th / base : NaN); k++;
          bRef.textContent = 'Calcolo… ' + Math.round(k / gaps.length * 100) + '%';
          var abs = gaps.filter(function (g, i) { return i < ths.length && !isFinite(ths[i]); });
          pX.o.title = 'Soglia del secondo stimolo (× soglia normale)'; pX.o.xlabel = 'intervallo dal primo stimolo (ms)'; pX.o.ylabel = 'soglia relativa';
          pX.update({ series: [{ x: gaps.slice(0, ths.length), y: ths, color: '--c1' }, { x: gaps.slice(0, ths.length), y: ths, type: 'points', color: '--c1' }],
            spans: abs.length ? [{ x0: 0, x1: abs[abs.length - 1] + 0.25, color: U.css('--bad'), alpha: 0.12, label: 'refrattario assoluto' }] : [],
            hlines: [{ y: 1, label: 'soglia normale', color: '--ok' }], ylim: [0, 8], xlim: [0, gaps[gaps.length - 1]] });
          setTimeout(stepFn, 0);
        };
        stepFn();
      }
      function fiCurve() {
        var p = params(), Is = [0, 2, 4, 5, 6, 6.5, 7, 8, 10, 15, 20, 30, 40, 60, 80, 100], fs = [], k = 0;
        bFI.textContent = 'Calcolo…'; pX.wrap.style.display = '';
        var y0 = F.HH.rest(p);
        var stepFn = function () {
          if (k >= Is.length) { bFI.textContent = 'Calcola la curva frequenza-corrente'; return; }
          var r = F.HH.simulate({ p: p, tmax: 400, I: (function (I) { return function () { return I; }; })(Is[k]), y0: y0, every: 1000 });
          var sp = r.spikes.filter(function (s) { return s > 100; });
          fs.push(sp.length > 1 ? 1000 * (sp.length - 1) / (sp[sp.length - 1] - sp[0]) : 0); k++;
          pX.o.title = 'Curva frequenza-corrente (f-I)'; pX.o.xlabel = 'corrente (µA/cm²)'; pX.o.ylabel = 'frequenza (Hz)';
          pX.update({ series: [{ x: Is.slice(0, fs.length), y: fs, color: '--c1' }, { x: Is.slice(0, fs.length), y: fs, type: 'points', color: '--c1' }, { x: [st.Idc], y: [null], type: 'points' }], xlim: [0, 100], ylim: [0, null], spans: [], hlines: [] });
          setTimeout(stepFn, 0);
        };
        stepFn();
      }
      vis(); run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var hhBase = function () { mSel.set('single'); s1.set(10); sD.set(1); tAll.set(false); sT.set(6.3); sK.set(1); sTTX.set(0); sTEA.set(0); shSel.set('g'); };
      U.explainer(L, {
        legend: [['--v', 'nero: potenziale di membrana'], ['--na', 'arancio: Na⁺ (g Na, m, I Na)'], ['--k', 'blu: K⁺ (g K, n, I K)'], ['--c5', 'giallo: inattivazione del Na⁺ (h)']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot(), p = params(), phi = F.HH.phi(st.T), extra = '';
          if (st.ttx > 0.5) extra += ` La <b>TTX</b> blocca i canali Na⁺ (${f(st.ttx * 100, 0)}%): senza g<sub>Na</sub> manca la retroazione positiva e non può nascere il potenziale d'azione.`;
          if (st.tea > 0.5) extra += ` Il <b>TEA</b> blocca i canali K⁺ (${f(st.tea * 100, 0)}%): la ripolarizzazione è molto più lenta: il potenziale d'azione si allarga, si riduce l'iperpolarizzazione${st.tea > 0.92 ? ' e con un blocco quasi completo il potenziale non torna più al riposo (plateau)' : ''}. Il potenziale di riposo è mantenuto uguale a quello del controllo.`;
          if (Math.abs(st.Ko - 1) > 0.05) extra += ` Con K⁺ esterno ×${f(st.Ko, 2)}, E<sub>K</sub> = ${f(p.EK, 0)} mV: ${st.Ko > 1 ? 'la membrana si depolarizza e la cellula è meno eccitabile' : 'la membrana si iperpolarizza e serve più stimolo'}.`;
          if (st.T > 7) extra += ` A ${f(st.T, 1)} °C i processi sono ${f(phi, 1)} volte più veloci che a 6,3 °C: il potenziale d'azione è più breve.`;
          if (st.mode === 'single') {
            var y0 = F.HH.rest(p), t0 = 2;
            var r = F.HH.simulate({ p: p, tmax: 25, I: function (t) { return t >= t0 && t < t0 + st.dur ? st.I1 : 0; }, y0: y0 });
            var peak = Math.max.apply(null, r.V), minV = Math.min.apply(null, r.V.slice(Math.floor(r.V.length * 0.1))), repol = minV < -45;
            if (r.spikes.length) return { kind: 'ok', html: `Lo stimolo (${f(st.I1, 1)} µA/cm² per ${f(st.dur, 1)} ms) porta la membrana oltre la <b>soglia</b>. Poi la sequenza è sempre la stessa, come numerata nel grafico: <b>① salita</b>: si aprono i canali Na⁺ (g<sub>Na</sub>, arancio), il Na⁺ entra, depolarizza ancora e apre altri canali Na⁺ (<b>retroazione positiva</b>, il ciclo di Hodgkin). <b>② picco</b> (${f(peak, 0)} mV: il potenziale si avvicina a E<sub>Na</sub> = +50 mV ma non la raggiunge: i canali Na⁺ si inattivano subito${st.tea < 0.5 ? ' e si aprono i canali K⁺' : ''}). <b>③ discesa</b>: i canali Na⁺ si <b>inattivano</b> e si aprono i canali K⁺ (g<sub>K</sub>, blu): il K⁺ esce. ${repol ? `<b>④ iperpolarizzazione</b> (${f(minV, 0)} mV, vicino a E<sub>K</sub> = ${f(p.EK, 0)} mV): i canali K⁺ si chiudono lentamente.` : `<b>④</b> con i canali K⁺ bloccati <b>manca l'iperpolarizzazione</b> e il potenziale non torna al riposo (plateau).`} Aumentando ancora lo stimolo il picco non cambia: <b>tutto o nulla</b>.${st.allornone ? ' Le curve sovrapposte sono lo stesso stimolo moltiplicato per 0,25…3: sotto soglia la risposta cresce con lo stimolo, sopra soglia il picco è identico.' : ''}${extra}` };
            return { kind: 'warn', html: `Lo stimolo (${f(st.I1, 1)} µA/cm²) è <b>sottosoglia</b>: depolarizza la membrana di soli ${f(peak - y0[0], 1)} mV. I canali Na⁺ si aprono solo in piccola parte e la corrente K⁺ e di fuga, che ripolarizza, prevale su quella Na⁺: la membrana torna al riposo senza potenziale d'azione. Aumenta l'intensità o la durata: appena superi la soglia il PdA parte con ampiezza sempre uguale.${st.allornone ? ' Le curve sovrapposte sono lo stesso stimolo moltiplicato per 0,25…3.' : ''}${extra}` };
          }
          if (st.mode === 'pair') {
            var second = sn[0].value === 'sì', rel = sn[3].value.indexOf('relativo') >= 0;
            return { kind: second ? (rel ? 'warn' : 'ok') : 'bad', html: `Il primo stimolo (40 µA/cm², 0,5 ms) provoca un potenziale d'azione. Il secondo (${f(st.I2, 0)} µA/cm²) arriva dopo ${f(st.gap, 1)} ms: ${second ? (rel ? `genera un PdA, ma <b>più piccolo</b>: siamo nel <b>periodo refrattario relativo</b>, in cui una parte dei canali Na⁺ è ancora inattivata e i canali K⁺ sono ancora aperti.` : `genera un potenziale d'azione normale: la membrana ha recuperato.`) : `<b>non</b> genera nulla: la membrana è nel <b>periodo refrattario assoluto</b>. I canali Na⁺ sono ancora inattivati e non possono riaprirsi, qualunque sia l'intensità dello stimolo.`} Il periodo refrattario limita la frequenza massima di scarica e impedisce al PdA di tornare indietro.${extra}` };
          }
          var n = parseInt(sn[1].value, 10) || 0;
          if (n <= 1) return { kind: 'warn', html: `Con ${f(st.Idc, 1)} µA/cm² la corrente continua non basta a una scarica ripetitiva (servono circa 6–7 µA/cm² a 6,3 °C): ${n === 1 ? 'parte un solo PdA e poi la membrana si stabilizza in uno stato depolarizzato con i canali Na⁺ inattivati' : 'la membrana si depolarizza un poco e resta sotto soglia'}.${extra}` };
          return { kind: 'ok', html: `Una corrente continua di ${f(st.Idc, 1)} µA/cm² produce un <b>treno</b> di potenziali d'azione (${sn[1].value} in totale, ${sn[0].value}). Dopo ogni PdA i canali Na⁺ sono inattivati; quando la membrana si ripolarizza e recuperano, la corrente continua la riporta alla soglia e ne parte un altro. Più la corrente è forte, più rapido è il ritorno alla soglia e più alta la frequenza: così il neurone <b>codifica l'intensità dello stimolo nella frequenza</b>.${extra}` };
        },
        experiments: [
          { label: 'Sottosoglia (3 µA/cm²)', run: function () { hhBase(); s1.set(3); }, why: `Una piccola depolarizzazione che si spegne: risposta locale, non propagata.` },
          { label: 'Sopra soglia (10 µA/cm²)', run: function () { hhBase(); }, why: `Oltre la soglia scatta il potenziale d'azione, con salita, picco, discesa e iperpolarizzazione.` },
          { label: 'Tutto o nulla (6 intensità)', run: function () { hhBase(); s1.set(8); tAll.set(true); }, why: `Le tre risposte sotto soglia crescono con lo stimolo; le tre sopra soglia hanno <b>lo stesso picco</b>: l'ampiezza del PdA non dipende dallo stimolo.` },
          { label: 'Con TTX', run: function () { hhBase(); sTTX.set(1); }, why: `Senza canali Na⁺ non c'è retroazione positiva: nessun potenziale d'azione, qualunque sia lo stimolo.` },
          { label: 'Con TEA (90%)', run: function () { hhBase(); sTEA.set(0.9); }, why: `Bloccando il 90% dei canali K⁺ la ripolarizzazione dipende soprattutto dall'inattivazione del Na⁺: il PdA dura circa il doppio (picco più alto) e l'iperpolarizzazione si riduce. Con un blocco ancora maggiore il potenziale resta depolarizzato (plateau).` },
          { label: 'Temperatura 18 °C', run: function () { hhBase(); sT.set(18.5); }, why: `Tutti i processi sono circa 3 volte più veloci per ogni 10 °C (Q<sub>10</sub> = 3): il PdA è più breve e più stretto.` },
          { label: 'K⁺ esterno ×4', run: function () { hhBase(); sK.set(4); s1.set(10); }, why: `Più K⁺ fuori sposta E<sub>K</sub> verso zero: la cellula si depolarizza e i canali Na⁺ si inattivano un poco, quindi è meno eccitabile.` },
          { label: 'Refrattarietà: due stimoli a 6 ms', run: function () { hhBase(); mSel.set('pair'); sGap.set(6); s2.set(30); }, why: `A 6 ms (a 6,3 °C) i canali Na⁺ sono ancora inattivati: il secondo stimolo non produce nulla, anche se è più forte. È il periodo refrattario assoluto.` },
          { label: 'Corrente continua → treno di PdA', run: function () { hhBase(); mSel.set('dc'); sDC.set(10); }, why: `Il neurone scarica ripetutamente: la frequenza dipende dall'intensità della corrente.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { pV.dispose(); pG.dispose(); pX.dispose(); } };
    }
  });

  // ================================================================ Treni di impulsi (Connor-Stevens)
  F.registerSim('treni', {
    title: 'Treni di impulsi: codifica in frequenza e adattamento',
    section: 'elettro',
    short: 'Il canale K_A permette di codificare l\'intensità dello stimolo nella frequenza; Ca²⁺ e K(Ca) producono adattamento (scarica fasica).',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { I: P.I === undefined ? 12 : P.I, A: P.A === undefined ? true : P.A, adapt: !!P.adapt, gCa: 0 };
      var sI = U.slider({ label: 'Intensità dello stimolo (1,2 s)', min: 0, max: 40, step: 0.25, value: st.I, digits: 2, unit: 'µA/cm²', onInput: function (v) { st.I = v; run(); } });
      var tA = U.toggle({ label: 'Canali K<sub>A</sub> presenti', value: st.A, onChange: function (v) { st.A = v; run(); fi(); } });
      var tAd = U.toggle({ label: 'Canali Ca²⁺ + K(Ca): adattamento', value: st.adapt, onChange: function (v) { st.adapt = v; run(); fi(); } });
      var sCa = U.slider({ label: 'Conduttanza Ca²⁺ aggiuntiva (eccitabilità)', min: 0, max: 1, step: 0.05, value: 0, digits: 2, unit: 'mS/cm²', onInput: function (v) { st.gCa = v; run(); } });
      [sI.el, tA.el, tAd.el, sCa.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [15, 20, 30, 40].map(function (v) { return U.button(F.fmt(v / 2, 1) + ' µA/cm²', function () { sI.set(v / 2); }); })));
      L.controls.appendChild(U.params('Modello di Connor & Stevens (1977) nella versione di Dayan & Abbott (2001): Na⁺ e K⁺ "delayed rectifier" più la corrente K<sub>A</sub> (si attiva a potenziali più negativi e si inattiva). Senza K<sub>A</sub>, E<sub>L</sub> viene ricalcolato per mantenere lo stesso riposo. Adattamento: corrente Ca²⁺ ad alta soglia e corrente K(Ca) di tipo AHP (Wang 1998).'));
      var ro = U.readouts([{ key: 'n', label: 'PdA in 1,2 s', hl: true }, { key: 'f', label: 'Frequenza media' }, { key: 'ad', label: 'Ultimo ISI / primo ISI' }, { key: 'k', label: 'Tipo di scarica' }]);
      L.main.appendChild(ro.el);
      var pV = U.plot(L.main, { title: 'Potenziale di membrana', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 230 });
      var pF = U.plot(L.main, { title: 'Curva frequenza-corrente', xlabel: 'corrente (µA/cm²)', ylabel: 'frequenza (Hz)', height: 210, xlim: [0, 40] });
      var fiCache = {};
      function params() {
        var q = F.CS.defaults(), Vr = F.CS.rest(q)[0];
        if (!st.A) { q.gA = 0; q.EL = F.CS.adjustEL(q, Vr); }
        if (st.adapt) { q.gCa = 0.4; q.gAHP = 5; }
        q.gCa += st.gCa;
        return q;
      }
      function run() {
        var q = params(), r = F.CS.simulate({ p: q, tmax: 1400, I: function (t) { return t >= 100 && t < 1300 ? st.I : 0; }, every: 4 });
        var d = F.decimate(r.t, r.V, 2000);
        pV.update({ series: [{ x: d.x, y: d.y, color: '--v', width: 1.2 }], spans: [{ x0: 100, x1: 1300, color: U.css('--warn'), alpha: 0.08, label: 'stimolo' }], ylim: [-90, 50] });
        var sp = r.spikes.filter(function (s) { return s >= 100 && s < 1300; });
        ro.set('n', sp.length); ro.set('f', F.fmt(sp.length / 1.2, 1) + ' Hz');
        if (sp.length > 3) { var i1 = sp[1] - sp[0], i2 = sp[sp.length - 1] - sp[sp.length - 2]; ro.set('ad', F.fmt(i2 / i1, 2)); ro.set('k', i2 / i1 > 1.5 ? 'fasica (si adatta)' : 'tonica'); }
        else { ro.set('ad', '—'); ro.set('k', sp.length ? 'pochi PdA' : 'nessuna'); }
      }
      function fi() {
        var key = (st.A ? 'A' : 'n') + (st.adapt ? 'd' : 'x');
        var draw = function () {
          var ser = [], cols = { Ax: '--c1', nx: '--c2', Ad: '--c3', nd: '--c4' }, names = { Ax: 'con K_A', nx: 'senza K_A', Ad: 'con K_A + adattamento', nd: 'senza K_A + adattamento' };
          Object.keys(fiCache).forEach(function (k) { var c = fiCache[k]; ser.push({ name: names[k].replace('_', ''), x: c.I, y: c.f, color: cols[k], width: k === key ? 2.6 : 1.4, dash: k === key ? [] : [4, 3] }); });
          pF.update({ series: ser, vlines: [{ x: st.I, label: 'stimolo attuale' }], ylim: [0, null] });
        };
        if (fiCache[key]) { draw(); return; }
        var q = params(), Is = [0, 2, 4, 6, 7, 8, 8.5, 9, 10, 12, 15, 20, 25, 30, 40], out = [], k = 0, y0 = F.CS.rest(q);
        var stepFn = function () {
          if (k >= Is.length) { fiCache[key] = { I: Is, f: out }; draw(); return; }
          var r = F.CS.simulate({ p: q, tmax: 1100, I: (function (I) { return function () { return I; }; })(Is[k]), y0: y0, every: 1000 });
          var s = r.spikes.filter(function (x) { return x > 100; });
          out.push(s.length / 1.0); k++;
          setTimeout(stepFn, 0);
        };
        stepFn();
      }
      run(); fi();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var trBase = function () { tA.set(true); tAd.set(false); sCa.set(0); sI.set(10); };
      U.explainer(L, {
        watch: ro,
        base: trBase,
        legend: [['--v', 'nero: potenziale di membrana'], ['--c1', 'curva blu: frequenza di scarica in funzione della corrente']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot(), n = parseInt(sn[0].value, 10) || 0;
          var s = `Una corrente costante di ${f(st.I, 1)} µA/cm² per 1,2 s produce ${n === 0 ? 'nessuna scarica' : 'una scarica di <b>' + n + ' potenziali d\'azione</b> (' + sn[1].value + ')'}: la <b>frequenza codifica l'intensità</b> dello stimolo (curva f–I in basso). `;
          s += st.A ? `Il canale <b>K<sub>A</sub></b> si attiva a potenziali più negativi del Kv e poi si inattiva: dopo ogni PdA frena la risalita della membrana e allunga l'intervallo. Così la scarica può partire da frequenze <b>basse</b> e crescere gradualmente con lo stimolo. ` : `<b>Senza K<sub>A</sub></b> appena la corrente supera la soglia la scarica parte già ad alta frequenza (~100 Hz): il neurone non può codificare stimoli deboli con scariche lente (la curva f–I fa un salto). `;
          if (st.adapt || st.gCa > 0.05) s += `Il Ca²⁺ che entra con ogni PdA attiva una corrente di K⁺ (K(Ca)) che si accumula e <b>rallenta</b> la scarica: adattamento. Rapporto ultimo/primo intervallo: ${sn[2].value}. `;
          return { kind: n > 0 ? 'ok' : '', html: s };
        },
        experiments: [
          { label: 'Con K_A, stimolo debole (10)', run: function () { trBase(); }, why: `Con K<sub>A</sub> la scarica a 10 µA/cm² è lenta (decine di Hz): lo stimolo debole è codificato con una frequenza bassa.` },
          { label: 'Stimolo forte (30)', run: function () { trBase(); sI.set(30); }, why: `Una corrente più forte dà una frequenza maggiore: la codifica è graduale.` },
          { label: 'Senza K_A', run: function () { trBase(); tA.set(false); }, why: `Senza K<sub>A</sub> la stessa corrente produce una scarica ad alta frequenza (oltre 100 Hz): il neurone non ha più frequenze basse. Confronta le due curve f–I.` },
          { label: 'Con adattamento (Ca²⁺ + K(Ca))', run: function () { trBase(); tAd.set(true); sI.set(15); }, why: `Gli intervalli tra i PdA si allungano durante lo stimolo: la scarica da tonica diventa <b>fasica</b>, e comunica soprattutto i <i>cambiamenti</i> di intensità.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { pV.dispose(); pF.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
