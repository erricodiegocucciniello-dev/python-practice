/* Sezione 7b — Neurotrasmettitori, placca motrice, integrazione sinaptica (lezioni 24-ter, 25, 26). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Sinapsi monoaminergica e farmaci
  F.registerSim('monoamine', {
    title: 'Sinapsi dopaminergica: farmaci e droghe',
    section: 'sinapsi',
    short: 'Rilascio, ricaptazione (DAT), vescicole (VMAT) e MAO: come cocaina, anfetamina, reserpina, inibitori delle MAO e L-DOPA cambiano la concentrazione di dopamina nella fessura.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { drug: P.drug || 'none', f: 20, dur: 0.5 };
      var drugs = {
        none: ['Nessun farmaco', {}],
        coc: ['Cocaina (blocca DAT)', { cocaine: 1 }],
        amph: ['Anfetamina (substrato di DAT: trasporto invertito)', { amph: 1, vesicleFactor: 0.7 }],
        res: ['Reserpina (blocca VMAT: vescicole vuote)', { vesicleFactor: 0.1 }],
        maoi: ['Inibitore delle MAO', { vesicleFactor: 1.3 }],
        park: ['Parkinson (−80% dei neuroni dopaminergici)', { vesicleFactor: 0.2 }],
        ldopa: ['Parkinson + L-DOPA', { vesicleFactor: 0.55 }]
      };
      var dSel = U.select({ label: 'Condizione', value: st.drug, options: Object.keys(drugs).map(function (k) { return [k, drugs[k][0]]; }), onChange: function (v) { st.drug = v; run(); } });
      var sF = U.slider({ label: 'Frequenza di scarica del neurone', min: 1, max: 60, step: 1, value: 20, digits: 0, unit: 'Hz', onInput: function (v) { st.f = v; run(); } });
      var sD = U.slider({ label: 'Durata della scarica', min: 0.05, max: 2, step: 0.05, value: 0.5, digits: 2, unit: 's', onInput: function (v) { st.dur = v; run(); } });
      [dSel.el, sF.el, sD.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Modello di Wightman per la dopamina nello striato: ogni impulso libera ≈ 0,1 µM; ricaptazione da DAT con V<sub>max</sub> = 4 µM/s e K<sub>m</sub> = 0,2 µM (Michaelis-Menten). Cocaina: inibitore competitivo di DAT (1 µM, K<sub>i</sub> ≈ 0,3 µM). Anfetamina: substrato competitivo che inverte il trasportatore (efflusso) e svuota le vescicole tramite VMAT. Reserpina: blocca VMAT. La dopamina non attraversa la barriera ematoencefalica: in terapia si usa la L-DOPA. Modello didattico: i valori dei farmaci sono indicativi.'));
      var ro = U.readouts([{ key: 'p', label: 'Picco di dopamina', hl: true }, { key: 'h', label: 'Tempo di dimezzamento dopo la scarica' }, { key: 'b', label: 'Livello finale (tonico)' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Dopamina nella fessura sinaptica', xlabel: 'tempo (s)', ylabel: '[DA] (µM)', height: 260 });
      function half(r) {
        var pk = Math.max.apply(null, r.DA), ip = r.DA.indexOf(pk), base = r.DA[r.DA.length - 1];
        for (var i = ip; i < r.DA.length; i++) if (r.DA[i] - base < (pk - base) / 2) return r.t[i] - r.t[ip];
        return NaN;
      }
      function run() {
        var o = Object.assign({ freq: st.f, trainDur: st.dur, tmax: 6 }, drugs[st.drug][1]);
        var r = F.monoamine(o), c = F.monoamine({ freq: st.f, trainDur: st.dur, tmax: 6 });
        plot.update({ series: [{ name: 'controllo', x: c.t, y: c.DA, color: '--faint', dash: [5, 4] }, { name: drugs[st.drug][0], x: r.t, y: r.DA, color: '--c1' }], spans: [{ x0: 1, x1: 1 + st.dur, color: U.css('--warn'), alpha: 0.1, label: 'scarica' }], ylim: [0, null] });
        ro.set('p', F.fmt(Math.max.apply(null, r.DA), 2) + ' µM'); ro.set('h', F.fmt(half(r) * 1000, 0) + ' ms'); ro.set('b', F.fmt(r.DA[r.DA.length - 1], 3) + ' µM');
      }
      run();
      return { destroy: function () { plot.dispose(); } };
    }
  });

  // ================================================================ Placca motrice
  F.registerSim('placca', {
    title: 'La giunzione neuromuscolare: quanti, sicurezza, curaro, miastenia',
    section: 'sinapsi',
    short: 'Rilascio quantale (del Castillo & Katz), potenziali in miniatura, fattore di sicurezza, curaro, neostigmina, miastenia grave e decremento con la distanza (Fatt & Katz).',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { mode: P.mode || 'quanti', Ca: P.Ca || 0.8, Mg: P.Mg === undefined ? 6.8 : P.Mg, cur: 0, neo: false, mg: false, seed: 1 };
      var mSel = U.seg({ label: 'Esperimento', value: st.mode, options: [['quanti', 'Rilascio quantale'], ['sic', 'Sicurezza e farmaci'], ['dist', 'Fatt & Katz: distanza']], onChange: function (v) { st.mode = v; vis(); run(); } });
      var sCa = U.slider({ label: '[Ca²⁺] esterno', min: 0.2, max: 2.5, step: 0.05, value: st.Ca, digits: 2, unit: 'mM', onInput: function (v) { st.Ca = v; run(); } });
      var sMg = U.slider({ label: '[Mg²⁺] esterno', min: 0, max: 12, step: 0.1, value: st.Mg, digits: 1, unit: 'mM', onInput: function (v) { st.Mg = v; run(); } });
      var bQ = el('div', { class: 'btn-row' }, [U.button('Ringer normale (Ca 2, Mg 1)', function () { sCa.set(2); sMg.set(1); }), U.button('Basso Ca²⁺ / alto Mg²⁺', function () { sCa.set(0.8); sMg.set(6.8); }), U.button('Nuova serie di stimoli', function () { st.seed++; run(); })]);
      var sCur = U.slider({ label: 'Curaro: recettori nicotinici bloccati', min: 0, max: 0.95, step: 0.05, value: 0, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.cur = v; run(); } });
      var tMG = U.toggle({ label: 'Miastenia grave (−70% recettori, anticorpi)', value: false, onChange: function (v) { st.mg = v; run(); } });
      var tNeo = U.toggle({ label: 'Neostigmina (anticolinesterasico)', value: false, onChange: function (v) { st.neo = v; run(); } });
      [mSel.el, sCa.el, sMg.el, bQ, sCur.el, tMG.el, tNeo.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Rilascio binomiale da 2000 siti; probabilità secondo Dodge & Rahamimoff (1967): $p \\propto \\left(\\frac{[Ca]/K_{Ca}}{1 + [Ca]/K_{Ca} + [Mg]/K_{Mg}}\\right)^4$. Quanto = 0,4 mV (≈ 5000–7000 molecole di ACh), CV 20%. Correzione di Martin per la sommazione non lineare (forza elettromotrice 75 mV). Fibra: riposo −80 mV, soglia −60 mV. Stimolazione ripetitiva a 3 Hz con deplezione (15% del pool per impulso, recupero τ = 0,8 s). Fatt & Katz: fibra di 50 µm, R<sub>m</sub> = 4000 Ω·cm², R<sub>i</sub> = 250 Ω·cm (λ ≈ 1,4 mm, τ = 4 ms).'));
      U.texify(L.controls);
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }, { key: 'd', label: '' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: '', xlabel: '', ylabel: '', height: 230 });
      var p2 = U.plot(L.main, { title: '', xlabel: '', ylabel: '', height: 200 });
      var labs = function (a) { var n = ro.el.querySelectorAll('.rl'); a.forEach(function (x, i) { n[i].innerHTML = x; }); };
      function vis() {
        [sCa.el, sMg.el, bQ].forEach(function (e) { e.style.display = st.mode === 'quanti' ? '' : 'none'; });
        [sCur.el, tMG.el, tNeo.el].forEach(function (e) { e.style.display = st.mode === 'sic' ? '' : 'none'; });
      }
      function run() {
        if (st.mode === 'quanti') {
          var p = F.releaseProb(st.Ca, st.Mg), m = 2000 * p;
          var q = F.quantalEPP({ p: p, trials: 400, q: 0.4, cv: 0.2, nonlinear: m > 20, seed: st.seed });
          var fails = q.k.filter(function (k) { return k === 0; }).length, amps = q.amp, mean = F.mean(amps);
          var hi = Math.max(1, Math.max.apply(null, amps) * 1.05), nb = m > 20 ? 40 : Math.max(20, Math.ceil(hi / 0.05));
          var h = F.histogram(amps.filter(function (a) { return a > 0; }), 0, hi, nb);
          var ser = [{ x: h.centers, y: h.counts, type: 'bars', color: '--c1', barWidth: h.width, name: 'potenziali di placca evocati' }];
          if (m <= 20) {
            var xs = F.linspace(0.01, hi, 300);
            ser.push({ x: xs, y: xs.map(function (x) { return 400 * h.width * F.quantalPDF(x, m, 0.4, 0.08); }), color: '--na', name: 'previsione di Poisson' });
            ser.push({ x: [0.02], y: [fails], type: 'bars', color: '--muted', barWidth: h.width, name: 'fallimenti' });
          }
          p1.o.title = 'Istogramma delle ampiezze (400 stimoli)'; p1.o.xlabel = 'ampiezza (mV)'; p1.o.ylabel = 'n. di risposte';
          p1.update({ series: ser, ylim: [0, null], vlines: m <= 20 ? [0.4, 0.8, 1.2, 1.6].map(function (x, i) { return { x: x, label: (i + 1) + 'q', color: '--muted' }; }) : [], hlines: [] });
          var mp = F.mepps({ rate: 1, duration: 8000, q: 0.4, seed: st.seed + 5 }), d = F.decimate(Array.from(mp.t).map(function (t) { return t / 1000; }), Array.from(mp.V), 1500);
          p2.o.title = 'Potenziali di placca in miniatura spontanei (≈1 al secondo)'; p2.o.xlabel = 'tempo (s)'; p2.o.ylabel = 'mV';
          p2.update({ series: [{ x: d.x, y: d.y, color: '--c4', width: 1 }], ylim: [-0.2, 1.2], hlines: [], vlines: [] });
          labs(['Contenuto quantico medio m', 'm dai fallimenti = ln(N/N₀)', 'm = media PPP / quanto', 'Stimoli senza risposta']);
          ro.set('a', F.fmt(m, m < 10 ? 2 : 0)); ro.set('b', fails > 0 ? F.fmt(Math.log(400 / fails), 2) : 'nessun fallimento');
          ro.set('c', F.fmt(mean / 0.4, m < 10 ? 2 : 0) + (m > 20 ? ' (sottostimato: sommazione non lineare)' : '')); ro.set('d', F.fmt(fails / 400 * 100, 1) + '%');
        } else if (st.mode === 'sic') {
          var rec = (1 - st.cur) * (st.mg ? 0.3 : 1), neo = st.neo ? 1.5 : 1, tau = st.neo ? 9 : 3, m0 = 200, thr = 20, Ed = 75;
          var eppAmp = function (mm) { var lin = mm * 0.4 * rec * neo; return lin / (1 + lin / Ed); };
          // treno a 3 Hz con deplezione
          var R = 1, amps2 = [], ok = 0;
          for (var k = 0; k < 10; k++) {
            if (k > 0) R = 1 - (1 - R) * Math.exp(-(1 / 3) / 0.8);
            var a = eppAmp(m0 * R); amps2.push(a); if (a >= thr) ok++;
            R *= (1 - 0.15);
          }
          var a1 = amps2[0], ts = F.linspace(0, 30, 301), epp = ts.map(function (t) { return t < 1 ? 0 : a1 * (Math.exp(-(t - 1) / tau) - Math.exp(-(t - 1) / 0.6)) / 0.75; });
          var ap = a1 >= thr;
          var Vm = epp.map(function (v, i) { var t = ts[i]; return ap && t > 2 && t < 6 ? -80 + Math.max(v, 110 * Math.exp(-Math.pow((t - 3) / 0.7, 2))) : -80 + v; });
          p1.o.title = 'Potenziale di placca (singolo stimolo)'; p1.o.xlabel = 'tempo (ms)'; p1.o.ylabel = 'Vm (mV)';
          p1.update({ series: [{ x: ts, y: epp.map(function (v) { return -80 + v; }), color: '--c1', name: 'potenziale di placca' }].concat(ap ? [{ x: ts, y: Vm, color: '--na', name: 'PdA muscolare', dash: [4, 3] }] : []), hlines: [{ y: -60, label: 'soglia', color: '--bad' }, { y: -80, label: 'riposo', color: '--muted', align: 'left' }], ylim: [-85, 40], vlines: [] });
          p2.o.title = 'Stimolazione ripetitiva a 3 Hz (test clinico)'; p2.o.xlabel = 'n. dello stimolo'; p2.o.ylabel = 'ampiezza (mV)';
          p2.update({ series: [{ x: amps2.map(function (_, i) { return i + 1; }), y: amps2, type: 'bars', color: '--c1', barWidth: 0.6 }], hlines: [{ y: thr, label: 'necessario per la soglia (20 mV)', color: '--bad' }], ylim: [0, 50], vlines: [] });
          labs(['Fattore di sicurezza', 'Primo potenziale di placca', 'PdA muscolari su 10 stimoli', 'Esito']);
          ro.set('a', F.fmt(a1 / thr, 2)); ro.set('b', F.fmt(a1, 1) + ' mV'); ro.set('c', ok + ' / 10');
          ro.set('d', ok === 10 ? '<span style="color:var(--ok)">trasmissione affidabile</span>' : (ok === 0 ? '<span style="color:var(--bad)">blocco neuromuscolare (paralisi)</span>' : '<span style="color:var(--warn)">risposta decrementale: affaticabilità</span>'));
        } else {
          var c = F.Cable.passive({ d_um: 50, length_um: 8000, n: 160, Ri: 250, Rm: 4000 }), mid = 80;
          c.reset(-80, false);
          for (var i = 0; i < c.n; i++) { c.EL[i] = -80; c.V[i] = -80; }
          var dists = [0, 0.5, 1, 2, 3], idx = dists.map(function (dm) { return mid + Math.round(dm / 0.05); }), tr = dists.map(function () { return []; }), T = [];
          for (var t = 0; t <= 25; t += 0.02) {
            c.Iext[mid] = t > 1 ? 0.25 * F.alphaFn(t - 1, 0.6) : 0;
            c.step(0.02); T.push(t); idx.forEach(function (j, kk) { tr[kk].push(c.V[j]); });
          }
          // scala: potenziale di placca con curaro di 15 mV nella regione della placca (sottosoglia)
          var pk0 = Math.max.apply(null, tr[0]) + 80, kf = 15 / pk0;
          tr = tr.map(function (a) { return a.map(function (v) { return -80 + (v + 80) * kf; }); });
          var cols = ['--c1', '--c3', '--c5', '--na', '--c4'];
          p1.o.title = 'Potenziale di placca (con curaro) registrato a distanze crescenti'; p1.o.xlabel = 'tempo (ms)'; p1.o.ylabel = 'Vm (mV)';
          p1.update({ series: dists.map(function (dm, kk) { return { name: F.fmt(dm, 1) + ' mm', x: T, y: tr[kk], color: cols[kk] }; }), hlines: [], vlines: [], ylim: [null, null] });
          var pk = tr.map(function (a) { return Math.max.apply(null, a) + 80; }), tpk = tr.map(function (a) { return T[a.indexOf(Math.max.apply(null, a))]; });
          p2.o.title = 'Ampiezza in funzione della distanza'; p2.o.xlabel = 'distanza dalla placca (mm)'; p2.o.ylabel = 'ampiezza (mV)';
          p2.update({ series: [{ x: dists, y: pk, color: '--c1' }, { x: dists, y: pk, type: 'points', color: '--c1' }], hlines: [], vlines: [{ x: c.lambda_um / 1000, label: 'λ', color: '--ok' }], ylim: [0, null] });
          labs(['λ della fibra', 'Ampiezza a 2 mm', 'Tempo al picco a 0 → 2 mm', 'Conclusione']);
          ro.set('a', F.fmt(c.lambda_um / 1000, 2) + ' mm'); ro.set('b', F.fmt(pk[3] / pk[0] * 100, 0) + '% di quella in placca');
          ro.set('c', F.fmt(tpk[0] - 1, 1) + ' → ' + F.fmt(tpk[3] - 1, 1) + ' ms'); ro.set('d', 'il potenziale di placca è locale: si attenua e rallenta');
        }
      }
      vis(); run();
      return { destroy: function () { p1.dispose(); p2.dispose(); } };
    }
  });

  // ================================================================ Integrazione sinaptica
  F.registerSim('integrazione', {
    title: 'Integrazione sinaptica: sommazione spaziale e temporale',
    section: 'sinapsi',
    short: 'Un neurone con dendrite, soma e segmento iniziale dell\'assone: i PPSE si attenuano lungo il dendrite e si sommano nello spazio e nel tempo; inibizione postsinaptica e presinaptica.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = {
        e1: P.e1 === undefined ? 100 : P.e1, e2: P.e2 === undefined ? 150 : P.e2, i1: P.i1 === undefined ? 50 : P.i1,
        onE1: true, onE2: !!P.onE2, onI: !!P.onI, inhE: -75, dt: P.dt === undefined ? 0 : P.dt, rep: P.rep || 1, g: P.g || 1, pre: false
      };
      var sE1 = U.slider({ label: 'Sinapsi eccitatoria A: distanza dal soma', min: 0, max: 780, step: 20, value: st.e1, digits: 0, unit: 'µm', onInput: function (v) { st.e1 = v; run(); } });
      var sE2 = U.slider({ label: 'Sinapsi eccitatoria B: distanza dal soma', min: 0, max: 780, step: 20, value: st.e2, digits: 0, unit: 'µm', onInput: function (v) { st.e2 = v; run(); } });
      var tE2 = U.toggle({ label: 'Attiva la sinapsi B', value: st.onE2, onChange: function (v) { st.onE2 = v; run(); } });
      var sDt = U.slider({ label: 'Ritardo di B rispetto ad A', min: 0, max: 30, step: 1, value: st.dt, digits: 0, unit: 'ms', onInput: function (v) { st.dt = v; run(); } });
      var sRep = U.slider({ label: 'Impulsi in sequenza sulla sinapsi A (sommazione temporale)', min: 1, max: 5, step: 1, value: st.rep, digits: 0, onInput: function (v) { st.rep = v; run(); } });
      var sGap = U.slider({ label: 'Intervallo tra gli impulsi di A', min: 2, max: 40, step: 1, value: 5, digits: 0, unit: 'ms', onInput: function (v) { st.gap = v; run(); } });
      st.gap = 5;
      var tI = U.toggle({ label: 'Sinapsi inibitoria C (vicino al soma)', value: st.onI, onChange: function (v) { st.onI = v; run(); } });
      var iSel = U.seg({ label: 'Tipo di inibizione C', value: -75, options: [[-75, 'Iperpolarizzante (Cl⁻, −75 mV)'], [-66, 'Di shunt (E = riposo)']], onChange: function (v) { st.inhE = +v; run(); } });
      var tPre = U.toggle({ label: 'Inibizione presinaptica su A (−70% di rilascio)', value: false, onChange: function (v) { st.pre = v; run(); } });
      var sG = U.slider({ label: 'Conduttanza di ogni sinapsi eccitatoria', min: 0.2, max: 3, step: 0.1, value: st.g, digits: 1, unit: 'nS', onInput: function (v) { st.g = v; run(); } });
      [sE1.el, sE2.el, tE2.el, sDt.el, sRep.el, sGap.el, tI.el, iSel.el, tPre.el, sG.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Neurone "palla e bastoncino": dendrite passivo di 800 µm × 2 µm (R<sub>m</sub> = 20 kΩ·cm², R<sub>i</sub> = 150 Ω·cm → λ ≈ 816 µm, τ = 20 ms), soma e segmento iniziale dell\'assone con canali di Hodgkin-Huxley (più densi nel segmento iniziale, dove nasce il PdA). Sinapsi a conduttanza (funzione alfa, τ = 1,5 ms; E = 0 mV per le eccitatorie).'));
      var ro = U.readouts([{ key: 'ep', label: 'Depolarizzazione massima al soma', hl: true }, { key: 'ap', label: 'Potenziale d\'azione nell\'assone' }, { key: 'l', label: 'λ del dendrite' }]);
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Registrazioni', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 250 });
      var cell = F.Cable.ballStick({});
      var cv = U.canvas2d(holder, 140, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var x0 = 30, xs = w * 0.62, y = h / 2, sx = function (um) { return xs - 18 - um / 800 * (xs - 18 - x0); };
        ctx.strokeStyle = css('--muted'); ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xs, y); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(w - 20, y); ctx.stroke();
        ctx.fillStyle = css('--c4'); ctx.beginPath(); ctx.arc(xs, y, 20, 0, 6.283); ctx.fill();
        ctx.fillStyle = css('--na'); ctx.fillRect(xs + 22, y - 3, 40, 6);
        ctx.font = '12px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--text');
        ctx.fillText('dendrite', (x0 + xs) / 2, y + 26); ctx.fillText('soma', xs, y + 36); ctx.fillText('segmento iniziale → assone', xs + 90, y + 22);
        var syn = function (um, col, lab, on) {
          if (!on) return; var x = sx(um);
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 9, y - 26); ctx.lineTo(x + 9, y - 26); ctx.closePath(); ctx.fill();
          ctx.fillStyle = css('--text'); ctx.fillText(lab, x, y - 32);
        };
        syn(st.e1, css('--c3'), 'A' + (st.pre ? ' (inib. presinaptica)' : ''), true);
        syn(st.e2, css('--c3'), 'B', st.onE2);
        syn(st.i1, css('--bad'), 'C (inib.)', st.onI);
        ctx.fillStyle = css('--c1'); ctx.beginPath(); ctx.arc(xs, y - 30, 4, 0, 6.283); ctx.fill(); ctx.fillText('elettrodo', xs + 32, y - 40);
      });
      function idx(um) { return Math.max(0, Math.min(cell.nDend - 1, cell.nDend - 1 - Math.round(um / 800 * cell.nDend))); }
      function run() {
        cell.reset(-65);
        var soma = cell.somaIndex, axon = cell.n - 1, Vr = cell.V[soma], dt = 0.025, tmax = 80;
        var events = [];
        for (var k = 0; k < st.rep; k++) events.push({ i: idx(st.e1), t: 5 + k * st.gap, g: st.g * 1e-6 * (st.pre ? 0.3 : 1), E: 0 });
        if (st.onE2) events.push({ i: idx(st.e2), t: 5 + st.dt, g: st.g * 1e-6, E: 0 });
        if (st.onI) events.push({ i: idx(st.i1), t: 4, g: 3e-6, E: st.inhE, tau: 5 });
        var T = [], Vs = [], Va = [], vmax = -999, ap = false;
        for (var t = 0; t <= tmax; t += dt) {
          cell.gSyn.fill(0);
          events.forEach(function (e) { var g = e.g * F.alphaFn(t - e.t, e.tau || 1.5); cell.ESyn[e.i] = (cell.gSyn[e.i] * cell.ESyn[e.i] + g * e.E) / Math.max(1e-30, cell.gSyn[e.i] + g); cell.gSyn[e.i] += g; });
          cell.step(dt);
          T.push(t); Vs.push(cell.V[soma]); Va.push(cell.V[axon]);
          if (cell.V[soma] > vmax) vmax = cell.V[soma];
          if (cell.V[axon] > 0) ap = true;
        }
        plot.update({ series: [{ name: 'soma', x: T, y: Vs, color: '--c1' }, { name: 'assone', x: T, y: Va, color: '--na', dash: [4, 3] }], hlines: [{ y: Vr, label: 'riposo', color: '--muted', align: 'left' }], ylim: [-80, 50] });
        ro.set('ep', ap ? 'soglia superata' : '+' + F.fmt(vmax - Vr, 2) + ' mV');
        ro.set('ap', ap ? '<span style="color:var(--ok)">sì</span>' : 'no');
        ro.set('l', F.fmt(cell.lambda_um, 0) + ' µm');
        cv.redraw();
      }
      run();
      return { destroy: function () { plot.dispose(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
