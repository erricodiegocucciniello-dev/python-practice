/* Sezione 5 — Potenziale di membrana: Donnan, Goldman, circuito equivalente (lezioni 13–15). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Donnan
  F.registerSim('donnan', {
    title: 'Equilibrio di Gibbs-Donnan',
    section: 'potenziale',
    short: 'Un anione non diffusibile (proteine) da un lato: distribuzione ineguale degli ioni diffusibili, potenziale e squilibrio osmotico.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { a: 100, b: 100, P: P.P === undefined ? 50 : P.P, z: 1, T: 20 };
      var sA = U.slider({ label: 'KCl iniziale nel lato 1 (esterno)', min: 10, max: 200, step: 1, value: st.a, digits: 0, unit: 'mM', onInput: function (v) { st.a = v; upd(); } });
      var sB = U.slider({ label: 'KCl iniziale nel lato 2 (con le proteine)', min: 0, max: 200, step: 1, value: st.b, digits: 0, unit: 'mM', onInput: function (v) { st.b = v; upd(); } });
      var sP = U.slider({ label: 'Proteina (anione non diffusibile) nel lato 2', min: 0, max: 150, step: 1, value: st.P, digits: 0, unit: 'mM', onInput: function (v) { st.P = v; upd(); } });
      var sZ = U.slider({ label: 'Cariche negative per molecola di proteina', min: 1, max: 10, step: 1, value: 1, digits: 0, onInput: function (v) { st.z = v; upd(); } });
      [sA.el, sB.el, sP.el, sZ.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Volumi uguali, membrana permeabile a K⁺ e Cl⁻ ma non alla proteina (accompagnata da K⁺). Soluzione esatta: all\'equilibrio $[K^+]_1[Cl^-]_1 = [K^+]_2[Cl^-]_2$ con elettroneutralità in ciascun lato; Vm = (RT/F)·ln([K]₁/[K]₂). Temperatura 20 °C. La pressione osmotica è calcolata con van\'t Hoff (σ = 1).'));
      var ro = U.readouts([{ key: 'v', label: 'Potenziale (lato 2 rispetto al lato 1)', hl: true }, { key: 'r', label: 'Rapporto di Donnan [K]₂/[K]₁ = [Cl]₁/[Cl]₂' }, { key: 'x', label: 'KCl passato dal lato 1 al lato 2' }, { key: 'o', label: 'Eccesso osmotico nel lato 2' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var d = null;
      var cv = U.canvas2d(holder, 260, function (ctx, w, h) {
        if (!d) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var max = Math.max(d.K1, d.K2, d.Cl1, d.Cl2, st.P, st.a, st.b, 1), bh = h - 70;
        var bars = [[0.08, 'K⁺', d.K1, '--k'], [0.2, 'Cl⁻', d.Cl1, '--cl'], [0.56, 'K⁺', d.K2, '--k'], [0.68, 'Cl⁻', d.Cl2, '--cl'], [0.8, 'Prot⁻', st.P, '--c4']];
        ctx.fillStyle = css('--muted'); ctx.fillRect(w * 0.48 - 2, 10, 4, h - 30);
        ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center';
        ctx.fillStyle = css('--text'); ctx.fillText('Lato 1', w * 0.2, 14); ctx.fillText('Lato 2', w * 0.72, 14);
        bars.forEach(function (b) {
          var x = w * b[0], bw = w * 0.1, hh = b[2] / max * bh;
          ctx.fillStyle = css(b[3]); ctx.globalAlpha = 0.8; ctx.fillRect(x, h - 30 - hh, bw, hh); ctx.globalAlpha = 1;
          ctx.fillStyle = css('--text'); ctx.fillText(b[1], x + bw / 2, h - 14); ctx.fillText(F.fmt(b[2], 1), x + bw / 2, h - 36 - hh);
        });
        ctx.fillStyle = d.V < 0 ? css('--k') : css('--na'); ctx.font = '700 13px ' + css('--font');
        ctx.fillText((d.V < 0 ? '−' : '+') + ' ' + F.fmt(Math.abs(d.V), 1) + ' mV', w * 0.72, 32);
      });
      function upd() {
        d = F.donnan(st.a, st.b, st.P, st.z, st.T);
        ro.set('v', F.fmt(d.V, 1) + ' mV'); ro.set('r', F.fmt(d.ratioK, 3));
        ro.set('x', F.fmt(d.x, 1) + ' mM'); ro.set('o', '+' + F.fmt(d.dOsm, 1) + ' mOsm/L → ' + F.fmt(d.pi_mmHg, 0) + ' mmHg');
        cv.redraw();
      }
      upd();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { sA.set(100); sB.set(100); sZ.set(1); sP.set(50); },
        legend: [['--k', 'K⁺'], ['--cl', 'Cl⁻'], ['--c4', 'proteina (anione non diffusibile)']],
        narrate: function () {
          var f = F.fmt, d = F.donnan(st.a, st.b, st.P, st.z, st.T);
          if (st.P <= 0) return `Senza proteine non c'è nulla che rompa la simmetria: K⁺ e Cl⁻ si distribuiscono in modo uguale ai due lati e il potenziale è zero.`;
          return `Il lato 2 contiene proteine, anioni che <b>non possono attraversare</b> la membrana (${f(st.P, 0)} mM, ${st.z === 1 ? '1 carica negativa' : st.z + ' cariche negative'} ciascuna). K⁺ e Cl⁻ invece passano. Le cariche negative fisse trattengono il K⁺: il lato 2 ha più K⁺ (${f(d.K2, 1)} contro ${f(d.K1, 1)} mM) e meno Cl⁻ (${f(d.Cl2, 1)} contro ${f(d.Cl1, 1)} mM), perché il Cl⁻ è respinto. Il rapporto è lo stesso per i due ioni (${f(d.ratioK, 3)}): [K]₁[Cl]₁ = [K]₂[Cl]₂ (<b>regola di Donnan</b>). Ne risulta un potenziale di <b>${f(d.V, 1)} mV</b> (negativo dal lato delle proteine) e più particelle nel lato 2: un eccesso osmotico di ${f(d.dOsm, 1)} mOsm/L che richiamerebbe acqua (≈ ${f(d.pi_mmHg, 0)} mmHg).${st.a < 40 && st.b < 40 ? ' I sali sono poco concentrati rispetto alle proteine: l\'effetto è marcato.' : ''}`;
        },
        experiments: [
          { label: 'Senza proteine', run: function () { sP.set(0); }, why: `Tutto simmetrico: nessuna differenza di concentrazione, potenziale zero, nessun eccesso osmotico.` },
          { label: 'Proteine 50 mM', run: function () { sA.set(100); sB.set(100); sZ.set(1); sP.set(50); }, why: `Le proteine non possono uscire: nel lato 2 si accumulano K⁺ e mancano Cl⁻. Nasce un potenziale di diffusione e una differenza osmotica.` },
          { label: '5 cariche per proteina', run: function () { sA.set(100); sB.set(100); sP.set(20); sZ.set(5); }, why: `Con più cariche negative per molecola ci sono più cationi trattenuti: l'asimmetria e il potenziale crescono.` },
          { label: 'Sali molto concentrati', run: function () { sA.set(200); sB.set(200); sZ.set(1); sP.set(50); }, why: `Se i sali sono molto più concentrati delle proteine, l'effetto Donnan si attenua: il potenziale e l'eccesso osmotico diminuiscono.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { cv.dispose(); } };
    }
  });

  // ================================================================ Goldman-Hodgkin-Katz
  var cells = {
    neurone: { name: 'Neurone di mammifero (37 °C)', T: 37, o: { K: 5, Na: 145, Cl: 110 }, i: { K: 140, Na: 12, Cl: 10 }, P: { K: 1, Na: 0.04, Cl: 0.45 } },
    rana: { name: 'Fibra muscolare di rana (esempio lezione 15, 20 °C)', T: 20, o: { K: 2.5, Na: 120, Cl: 0 }, i: { K: 140, Na: 10, Cl: 0 }, P: { K: 1, Na: 0.01, Cl: 0 } },
    glia: { name: 'Cellula gliale (quasi solo K⁺)', T: 37, o: { K: 5, Na: 145, Cl: 110 }, i: { K: 140, Na: 12, Cl: 10 }, P: { K: 1, Na: 0.001, Cl: 0 } },
    calamaro: { name: 'Assone di calamaro (Hodgkin & Katz)', T: 20, o: { K: 20, Na: 440, Cl: 560 }, i: { K: 400, Na: 50, Cl: 52 }, P: { K: 1, Na: 0.04, Cl: 0.45 } }
  };
  F.cells = cells;
  F.registerSim('ghk', {
    title: 'Equazione di Goldman-Hodgkin-Katz',
    section: 'potenziale',
    short: 'Il potenziale di riposo come potenziale di diffusione: media dei potenziali di equilibrio pesata dalle permeabilità.',
    mount: function (host, P) {
      var key = P.cell || 'neurone', c = JSON.parse(JSON.stringify(cells[key]));
      var L = U.simLayout(host), st = c;
      var cSel = U.select({ label: 'Cellula', value: key, options: Object.keys(cells).map(function (k) { return [k, cells[k].name]; }), onChange: function (k) { var n = JSON.parse(JSON.stringify(cells[k])); st.T = n.T; sKo.set(n.o.K, true); st.o = n.o; st.i = n.i; sPNa.set(n.P.Na, true); sPCl.set(n.P.Cl, true); st.P = n.P; upd(); } });
      var sKo = U.slider({ label: '[K⁺] esterno', min: 0.5, max: 200, value: st.o.K, log: true, fmt: function (v) { return F.fmt(v, 1) + ' mM'; }, onInput: function (v) { st.o.K = v; upd(); } });
      var sPNa = U.slider({ label: 'P<sub>Na</sub>/P<sub>K</sub>', min: 0, max: 1, step: 0.001, value: st.P.Na, digits: 3, onInput: function (v) { st.P.Na = v; upd(); } });
      var sPCl = U.slider({ label: 'P<sub>Cl</sub>/P<sub>K</sub>', min: 0, max: 2, step: 0.01, value: st.P.Cl, digits: 2, onInput: function (v) { st.P.Cl = v; upd(); } });
      var bAP = U.button('Picco del PdA: P<sub>Na</sub>/P<sub>K</sub> = 20', function () { sPNa.el.querySelector('input').max = 25; sPNa.set(20); });
      [cSel.el, sKo.el, sPNa.el, sPCl.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [bAP, U.button('Riposo', function () { sPNa.set(cells[cSel.get()].P.Na); })]));
      L.controls.appendChild(U.params('$V_m = \\frac{RT}{F}\\ln\\frac{P_K[K]_o + P_{Na}[Na]_o + P_{Cl}[Cl]_i}{P_K[K]_i + P_{Na}[Na]_i + P_{Cl}[Cl]_o}$. Valori di riposo P<sub>K</sub>:P<sub>Na</sub>:P<sub>Cl</sub> = 1 : 0,04 : 0,45 (assone di calamaro, Hodgkin & Katz 1949). Durante il picco del potenziale d\'azione P<sub>Na</sub>/P<sub>K</sub> ≈ 20.'));
      var ro = U.readouts([{ key: 'vm', label: 'Vm (GHK)', hl: true }, { key: 'ek', label: 'E<sub>K</sub>' }, { key: 'ena', label: 'E<sub>Na</sub>' }, { key: 'ecl', label: 'E<sub>Cl</sub>' }]);
      L.main.appendChild(ro.el);
      var bar = el('div'); L.main.appendChild(bar);
      var vals = null;
      var cv = U.canvas2d(bar, 80, function (ctx, w, h) {
        if (!vals) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var x = function (v) { return 20 + (v + 120) / 200 * (w - 40); };
        ctx.strokeStyle = css('--axis'); ctx.beginPath(); ctx.moveTo(x(-120), 40); ctx.lineTo(x(80), 40); ctx.stroke();
        ctx.font = '11px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--muted');
        for (var v = -120; v <= 80; v += 20) { ctx.fillText(String(v).replace('-', '−'), x(v), 58); ctx.fillRect(x(v), 37, 1, 6); }
        ctx.fillText('mV', x(80) + 2, 72);
        [['E_K', vals.EK, '--k'], ['E_Cl', vals.ECl, '--cl'], ['E_Na', vals.ENa, '--na']].forEach(function (e, i) {
          if (!isFinite(e[1])) return;
          ctx.fillStyle = css(e[2]); ctx.beginPath(); ctx.arc(x(F.clamp(e[1], -120, 80)), 40, 6, 0, 6.283); ctx.fill();
          ctx.fillText(e[0].replace('_', ''), x(F.clamp(e[1], -120, 80)), 22 - (i % 2) * 10);
        });
        ctx.fillStyle = css('--text'); ctx.beginPath(); ctx.moveTo(x(vals.Vm), 30); ctx.lineTo(x(vals.Vm) - 7, 18); ctx.lineTo(x(vals.Vm) + 7, 18); ctx.closePath(); ctx.fill();
        ctx.font = '600 12px ' + css('--font'); ctx.fillText('Vm', x(vals.Vm), 12);
      });
      var plot = U.plot(L.main, { title: 'Vm in funzione del K⁺ esterno', xlabel: '[K⁺] esterno (mM, scala log)', ylabel: 'Vm (mV)', xlog: true, height: 230, xlim: [0.5, 200] });
      function upd() {
        var T = st.T, EK = F.nernst(st.o.K, st.i.K, 1, T), ENa = F.nernst(st.o.Na, st.i.Na, 1, T), ECl = st.o.Cl > 0 ? F.nernst(st.o.Cl, st.i.Cl, -1, T) : NaN;
        var Vm = F.ghk(st.P, st.o, st.i, T);
        vals = { EK: EK, ENa: ENa, ECl: ECl, Vm: Vm };
        ro.set('vm', F.fmt(Vm, 1) + ' mV'); ro.set('ek', F.fmt(EK, 1) + ' mV'); ro.set('ena', F.fmt(ENa, 1) + ' mV'); ro.set('ecl', isFinite(ECl) ? F.fmt(ECl, 1) + ' mV' : '—');
        var Ks = F.logspace(Math.log10(0.5), Math.log10(200), 120);
        plot.update({ series: [
          { name: 'Vm (Goldman)', x: Ks, y: Ks.map(function (k) { return F.ghk(st.P, { K: k, Na: st.o.Na, Cl: st.o.Cl }, st.i, T); }), color: '--c1' },
          { name: 'E_K (Nernst)'.replace('_', ''), x: Ks, y: Ks.map(function (k) { return F.nernst(k, st.i.K, 1, T); }), color: '--k', dash: [5, 4] },
          { x: [st.o.K], y: [Vm], type: 'points', color: '--na', r: 6 }], ylim: [-140, 40] });
        cv.redraw();
      }
      upd();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { cSel.set('neurone'); },
        legend: [['--k', 'E K'], ['--na', 'E Na'], ['--cl', 'E Cl'], ['--text', 'triangolo: Vm calcolato']],
        narrate: function () {
          var f = F.fmt, T = st.T, EK = F.nernst(st.o.K, st.i.K, 1, T), ENa = F.nernst(st.o.Na, st.i.Na, 1, T), ECl = st.o.Cl > 0 ? F.nernst(st.o.Cl, st.i.Cl, -1, T) : null, Vm = F.ghk(st.P, st.o, st.i, T);
          var s = `Il potenziale di riposo non coincide con l'E di nessuno ione: è un <b>potenziale di diffusione</b>, una media dei potenziali di equilibrio pesata dalle permeabilità. Qui K⁺ ha E = ${f(EK, 0)} mV, Na⁺ ha E = ${f(ENa, 0)} mV${ECl !== null ? ', Cl⁻ ha E = ' + f(ECl, 0) + ' mV' : ''}. Permeabilità relative: K⁺ 1, Na⁺ ${f(st.P.Na, 3)}${ECl !== null ? ', Cl⁻ ' + f(st.P.Cl, 2) : ''}. Risultato: Vm = <b>${f(Vm, 1)} mV</b>. `;
          if (st.P.Na > 3) s += `Ora il Na⁺ è molto più permeabile del K⁺ e Vm si avvicina a E<sub>Na</sub>: è ciò che accade al <b>picco del potenziale d'azione</b>.`;
          else if (st.P.Na < 0.005 && st.P.Cl < 0.05) s += `Passa quasi solo il K⁺: Vm ≈ E<sub>K</sub>, come nelle cellule gliali.`;
          else s += `Il K⁺ domina perché ha la permeabilità maggiore, ma il piccolo contributo del Na⁺ (che tende a portare Vm verso ${f(ENa, 0)} mV) rende Vm meno negativo di E<sub>K</sub> di ${f(Vm - EK, 1)} mV.`;
          if (st.o.K > 15) s += ` Con [K⁺]<sub>o</sub> alto E<sub>K</sub> si avvicina a zero e la membrana si depolarizza: è il motivo per cui l'iperpotassiemia altera l'eccitabilità (e può fermare il cuore).`;
          return s;
        },
        experiments: [
          { label: 'Neurone a riposo', run: function () { cSel.set('neurone'); }, why: `P<sub>Na</sub>/P<sub>K</sub> piccolo ma non nullo: Vm è vicino a E<sub>K</sub>, un poco più positivo.` },
          { label: 'Picco del potenziale d\'azione', run: function () { cSel.set('neurone'); bAP.click(); }, why: `Quando i canali Na⁺ si aprono, P<sub>Na</sub> supera P<sub>K</sub> e Vm si avvicina a E<sub>Na</sub> (positivo): è la fase ascendente del PdA.` },
          { label: 'K⁺ esterno alto (20 mM)', run: function () { cSel.set('neurone'); sKo.set(20); }, why: function () { return `Con 20 mM di K⁺ fuori E<sub>K</sub> sale a ${F.fmt(F.nernst(20, 140, 1, 37), 0)} mV e Vm lo segue: la cellula si depolarizza. Nel grafico Vm si appoggia alla retta di Nernst.`; } },
          { label: 'Cellula gliale', run: function () { cSel.set('glia'); }, why: `Quasi solo canali K⁺ aperti: Vm coincide con E<sub>K</sub> (circa −90 mV a 37 °C con questi valori).` },
          { label: 'Solo K⁺ (P Na = P Cl = 0)', run: function () { cSel.set('neurone'); sPNa.set(0); sPCl.set(0); }, why: `Con un solo ione permeante la GHK diventa l'equazione di Nernst: Vm = E<sub>K</sub>.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ Circuito equivalente
  F.registerSim('circuito', {
    title: 'Circuito elettrico equivalente della membrana',
    section: 'potenziale',
    short: 'Batterie (gradienti), resistenze (canali), condensatore (doppio strato) e generatore di corrente (pompa): allo stato stazionario la somma delle correnti è zero.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { gK: 0.1, gNa: 0.005, gCl: 0.01, pump: true, Ko: 5 };
      var sK = U.slider({ label: 'g<sub>K</sub>', min: 0, max: 0.3, step: 0.001, value: st.gK, digits: 3, unit: 'mS/cm²', onInput: function (v) { st.gK = v; upd(); } });
      var sNa = U.slider({ label: 'g<sub>Na</sub>', min: 0, max: 0.3, step: 0.001, value: st.gNa, digits: 3, unit: 'mS/cm²', onInput: function (v) { st.gNa = v; upd(); } });
      var sCl = U.slider({ label: 'g<sub>Cl</sub>', min: 0, max: 0.3, step: 0.001, value: st.gCl, digits: 3, unit: 'mS/cm²', onInput: function (v) { st.gCl = v; upd(); } });
      var sKo = U.slider({ label: '[K⁺] esterno', min: 1, max: 50, step: 0.5, value: 5, digits: 1, unit: 'mM', onInput: function (v) { st.Ko = v; upd(); } });
      var tP = U.toggle({ label: 'Pompa Na⁺/K⁺ elettrogenica', value: true, onChange: function (v) { st.pump = v; upd(); } });
      [sK.el, sNa.el, sCl.el, sKo.el, tP.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Neurone di mammifero a 37 °C: K⁺ 140/5, Na⁺ 12/145 mM, E<sub>Cl</sub> = −70 mV (distribuzione passiva del Cl⁻). Conduttanze tipiche di un neurone a riposo (resistenza specifica ≈ 9 kΩ·cm²). Corrente della pompa 0,35 µA/cm² uscente (1 carica netta per ciclo): contribuisce per ≈ −3 mV, come nella lezione 15. $I_i = g_i(V_m - E_i)$ e $V_m = \\frac{\\sum g_i E_i - I_{pompa}}{\\sum g_i}$.'));
      var ro = U.readouts([{ key: 'vm', label: 'Vm a riposo', hl: true }, { key: 'pc', label: 'Contributo della pompa' }, { key: 'sum', label: 'Somma delle correnti' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var r = null;
      var cv = U.canvas2d(holder, 300, function (ctx, w, h) {
        if (!r) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var top = 40, bot = h - 50, br = [['K⁺', r.EK, r.IK, '--k'], ['Na⁺', r.ENa, r.INa, '--na'], ['Cl⁻', r.ECl, r.ICl, '--cl'], ['pompa', null, r.Ip, '--c5'], ['C', null, 0, '--muted']];
        var n = br.length, dx = (w - 40) / n;
        ctx.strokeStyle = css('--text'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(20 + dx / 2, top); ctx.lineTo(20 + dx * (n - 0.5), top); ctx.moveTo(20 + dx / 2, bot); ctx.lineTo(20 + dx * (n - 0.5), bot); ctx.stroke();
        ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--text');
        ctx.fillText('esterno', 50, top - 12); ctx.fillText('interno (Vm = ' + F.fmt(r.Vm, 1) + ' mV)', w / 2, bot + 30);
        var maxI = Math.max(0.5, Math.abs(r.IK), Math.abs(r.INa), Math.abs(r.ICl), Math.abs(r.Ip));
        br.forEach(function (b, i) {
          var x = 20 + dx * (i + 0.5), col = css(b[3]);
          ctx.strokeStyle = css('--text'); ctx.lineWidth = 2;
          if (b[0] === 'C') {
            ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, (top + bot) / 2 - 6); ctx.moveTo(x, (top + bot) / 2 + 6); ctx.lineTo(x, bot); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - 16, (top + bot) / 2 - 6); ctx.lineTo(x + 16, (top + bot) / 2 - 6); ctx.moveTo(x - 16, (top + bot) / 2 + 6); ctx.lineTo(x + 16, (top + bot) / 2 + 6); ctx.stroke();
            ctx.fillStyle = css('--muted'); ctx.fillText('Cm (doppio strato)', x, top + 18); return;
          }
          if (b[0] === 'pompa') {
            ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, (top + bot) / 2 - 16); ctx.moveTo(x, (top + bot) / 2 + 16); ctx.lineTo(x, bot); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, (top + bot) / 2, 16, 0, 6.283); ctx.stroke();
            ctx.fillStyle = col; ctx.fillText('pompa', x, top + 18);
          } else {
            // resistenza (canali)
            var y0 = top + 30, y1 = y0 + 50;
            ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, y0);
            for (var k = 0; k <= 6; k++) ctx.lineTo(x + (k % 2 ? 9 : -9) * (k === 0 || k === 6 ? 0 : 1), y0 + k * (y1 - y0) / 6);
            ctx.lineTo(x, y1 + 20); ctx.stroke();
            // batteria
            var yb = y1 + 30;
            ctx.beginPath(); ctx.moveTo(x - 14, yb); ctx.lineTo(x + 14, yb); ctx.stroke();
            ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 7, yb + 8); ctx.lineTo(x + 7, yb + 8); ctx.stroke(); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, yb + 8); ctx.lineTo(x, bot); ctx.stroke();
            ctx.fillStyle = col; ctx.fillText('g' + b[0], x + 30, y0 + 25);
            ctx.fillText('E = ' + F.fmt(b[1], 0), x + 34, yb + 6);
          }
          // freccia della corrente (positiva = uscente, verso l'alto)
          var len = Math.max(6, Math.abs(b[2]) / maxI * 60);
          if (Math.abs(b[2]) > 1e-3) {
            var ym = (top + bot) / 2 + (b[0] === 'pompa' ? 0 : 40), dir = b[2] > 0 ? -1 : 1;
            U.arrow(ctx, x - 26, ym - dir * len / 2, x - 26, ym + dir * len / 2, col, 3);
            ctx.fillStyle = col; ctx.font = '11px ' + css('--font'); ctx.fillText(F.fmt(b[2], 2), x - 26, ym + dir * len / 2 + dir * 12);
            ctx.font = '600 12px ' + css('--font');
          }
        });
        ctx.fillStyle = css('--faint'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left'; ctx.fillText('frecce: correnti in µA/cm² (in su = uscente)', 8, h - 8);
      });
      function upd() {
        var EK = F.nernst(st.Ko, 140, 1, 37), ENa = F.nernst(145, 12, 1, 37), ECl = -70, Ip = st.pump ? 0.35 : 0;
        var Vm = F.chordVm({ K: st.gK, Na: st.gNa, Cl: st.gCl }, { K: EK, Na: ENa, Cl: ECl }, Ip);
        var Vm0 = F.chordVm({ K: st.gK, Na: st.gNa, Cl: st.gCl }, { K: EK, Na: ENa, Cl: ECl }, 0);
        r = { Vm: Vm, EK: EK, ENa: ENa, ECl: ECl, IK: st.gK * (Vm - EK), INa: st.gNa * (Vm - ENa), ICl: st.gCl * (Vm - ECl), Ip: Ip };
        ro.set('vm', F.fmt(Vm, 1) + ' mV'); ro.set('pc', F.fmt(Vm - Vm0, 1) + ' mV');
        var sum = r.IK + r.INa + r.ICl + r.Ip; ro.set('sum', F.fmt(Math.abs(sum) < 1e-9 ? 0 : sum, 3) + ' µA/cm² (stato stazionario)');
        cv.redraw();
      }
      upd();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var ciBase = function () { sK.set(0.1); sNa.set(0.005); sCl.set(0.01); sKo.set(5); tP.set(true); };
      U.explainer(L, {
        watch: ro,
        base: ciBase,
        legend: [['--k', 'K⁺'], ['--na', 'Na⁺'], ['--cl', 'Cl⁻'], ['--c5', 'pompa']],
        narrate: function () {
          var f = F.fmt, EK = F.nernst(st.Ko, 140, 1, 37), ENa = F.nernst(145, 12, 1, 37), ECl = -70, Ip = st.pump ? 0.35 : 0, gt = st.gK + st.gNa + st.gCl;
          var Vm = F.chordVm({ K: st.gK, Na: st.gNa, Cl: st.gCl }, { K: EK, Na: ENa, Cl: ECl }, Ip), Vm0 = F.chordVm({ K: st.gK, Na: st.gNa, Cl: st.gCl }, { K: EK, Na: ENa, Cl: ECl }, 0);
          var IK = st.gK * (Vm - EK), INa = st.gNa * (Vm - ENa), ICl = st.gCl * (Vm - ECl);
          var s = `Ogni popolazione di canali è una <b>resistenza</b> (conduttanza g) in serie a una <b>batteria</b> (il suo potenziale di equilibrio E); il doppio strato è il <b>condensatore</b>, la pompa un <b>generatore di corrente</b>. A riposo Vm è costante, quindi la <b>somma delle correnti è zero</b>: il K⁺ esce (${f(IK, 2)} µA/cm²), il Na⁺ entra (${f(INa, 2)}), ${Math.abs(ICl) > 0.005 ? 'il Cl⁻ porta ' + f(ICl, 2) : 'il Cl⁻ contribuisce poco'}, e ${st.pump ? 'la pompa riporta fuori 3 Na⁺ per ogni 2 K⁺ (' + f(Ip, 2) + ')' : 'la pompa è spenta'}. `;
          s += `Vm = <b>${f(Vm, 1)} mV</b> è la media dei potenziali di equilibrio pesata dalle conduttanze: K⁺ ${f(st.gK / gt * 100, 0)}%, Na⁺ ${f(st.gNa / gt * 100, 0)}%, Cl⁻ ${f(st.gCl / gt * 100, 0)}%. `;
          if (st.gNa > st.gK) s += `Il Na⁺ ora ha la conduttanza maggiore e trascina Vm verso E<sub>Na</sub> (${f(ENa, 0)} mV): è la situazione del picco del potenziale d'azione.`;
          else s += `Vm è vicino a E<sub>K</sub> (${f(EK, 0)} mV) perché il K⁺ ha la conduttanza maggiore, ma il Na⁺ lo rende meno negativo.`;
          if (st.pump) s += ` La pompa contribuisce di ${f(Vm - Vm0, 1)} mV (iperpolarizzante).`;
          return s;
        },
        experiments: [
          { label: 'Riposo normale', run: function () { ciBase(); }, why: `Il K⁺ ha la conduttanza maggiore: Vm è vicino a E<sub>K</sub>, e le correnti dei vari ioni si bilanciano.` },
          { label: 'Il Na⁺ domina (come nel PdA)', run: function () { ciBase(); sNa.set(0.3); }, why: `Quando i canali Na⁺ si aprono, g<sub>Na</sub> diventa la maggiore e Vm si porta verso E<sub>Na</sub>: è il picco del potenziale d'azione.` },
          { label: 'K⁺ esterno alto (20 mM)', run: function () { ciBase(); sKo.set(20); }, why: `E<sub>K</sub> sale (meno negativo) e Vm lo segue: la cellula si depolarizza.` },
          { label: 'Pompa spenta', run: function () { ciBase(); tP.set(false); }, why: `Il contributo diretto della pompa è di soli pochi mV: Vm si sposta poco subito. Nel tempo, però, senza pompa i gradienti si dissiperebbero e il potenziale scomparirebbe.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
