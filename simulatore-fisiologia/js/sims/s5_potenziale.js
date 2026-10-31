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
      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
