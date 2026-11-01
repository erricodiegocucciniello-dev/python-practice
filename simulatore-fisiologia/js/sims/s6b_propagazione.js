/* Sezione 6b — Propagazione del potenziale d'azione e proprietà di cavo (lezioni 20, 21, 26). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Propagazione 3D
  F.registerSim('propagazione', {
    title: 'Propagazione del potenziale d\'azione (amielinica e saltatoria)',
    section: 'elettro',
    short: 'Le correnti locali depolarizzano la membrana vicina; la refrattarietà impedisce il ritorno; la mielina fa "saltare" il PdA da un nodo di Ranvier all\'altro.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 'myel', d: P.d || 10, T: 18.5, demy: P.demy || 0, stim: P.stim || 'left', speed: 1, running: false, done: false };
      var tSel = U.seg({ label: 'Fibra', value: st.type, options: [['unmy', 'Amielinica'], ['myel', 'Mielinica']], onChange: function (v) { st.type = v; build(); } });
      var sD = U.slider({ label: 'Diametro dell\'assone', min: 1, max: 20, step: 0.5, value: st.d, digits: 1, unit: 'µm', onInput: function (v) { st.d = v; } });
      sD.input.addEventListener('change', function () { build(); });
      var sT = U.slider({ label: 'Temperatura', min: 6.3, max: 25, step: 0.1, value: st.T, digits: 1, unit: '°C', onInput: function (v) { st.T = v; } });
      sT.input.addEventListener('change', function () { build(); });
      var tDem = U.slider({ label: 'Demielinizzazione di 3 internodi (sclerosi multipla)', min: 0, max: 1, step: 0.05, value: st.demy, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.demy = v; } });
      tDem.input.addEventListener('change', function () { build(); });
      var stSel = U.seg({ label: 'Dove stimolare', value: st.stim, options: [['left', 'Estremità sinistra'], ['mid', 'Al centro'], ['both', 'Entrambe le estremità']], onChange: function (v) { st.stim = v; } });
      var bGo = U.button('Stimola', function () { start(); }, 'primary');
      var sSp = U.slider({ label: 'Velocità del filmato', min: 0.1, max: 2, step: 0.1, value: 1, digits: 1, unit: '×', onInput: function (v) { st.speed = v; } });
      [tSel.el, sD.el, sT.el, tDem.el, stSel.el, bGo, sSp.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Modello a compartimenti con canali di Hodgkin-Huxley (cinetica del calamaro, Q10 = 3). Amielinica: membrana eccitabile uniforme, R<sub>i</sub> = 35,4 Ω·cm (calamaro) — a 476 µm e 18,5 °C riproduce i ≈ 18,8 m/s calcolati da Hodgkin e Huxley. Mielinica: nodi di 1 µm con alta densità di canali, internodi = 100 × diametro esterno (rapporto g = 0,6), mielina che riduce capacità e conduttanza in proporzione al numero di lamelle; R<sub>i</sub> = 70 Ω·cm. Valori assoluti a 18,5 °C con cinetica del calamaro: nei mammiferi a 37 °C le fibre sono più veloci (≈ 6 m/s per µm di diametro esterno, regola di Hursh).'));
      var ro = U.readouts([{ key: 'v', label: 'Velocità di conduzione misurata', hl: true }, { key: 't', label: 'Tempo (ms)' }, { key: 'L', label: 'Lunghezza della fibra' }]);
      var scn = F.scene3d(L.main, { height: function (w) { return Math.round(Math.max(260, Math.min(380, w * 0.46))); }, camPos: [0, 1.7, 6.6], fov: 40, minDistance: 3, maxDistance: 20, hint: 'Trascina per ruotare · rotellina per lo zoom' });
      var ax3 = scn ? F.axon3d(scn) : null;
      L.main.appendChild(ro.el);
      var pX = U.plot(L.main, { title: 'Vm lungo la fibra (istantanea)', xlabel: 'posizione (mm)', ylabel: 'Vm (mV)', height: 190, ylim: [-90, 50] });
      var pT = U.plot(L.main, { title: 'Vm registrato da due elettrodi', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 180, ylim: [-90, 50] });
      var cable, rec = { t: [], a: [], b: [] }, e1, e2, cross = [null, null], vel = null;
      function build() {
        st.running = false; st.done = false;
        var nI = 16;
        if (st.type === 'unmy') {
          var v0 = 18.8 * Math.sqrt(st.d / 476) * Math.pow(3, (st.T - 18.5) / 20); // stima per scegliere la lunghezza
          var Lcm = Math.max(0.4, 0.3 * v0); // ≈ 3 ms di percorso, ≫ λ (elettrodi lontani dalle estremità)
          cable = F.Cable.unmyelinated({ d_um: st.d, length_cm: Lcm, n: 200, T: st.T });
        } else {
          cable = F.Cable.myelinated({ d_um: st.d, nInternodes: nI, T: st.T, segPerInternode: 8 });
          if (st.demy > 0) {
            // internodi 7-9: perdita di lamelle → capacità e conduttanza dell'internodo aumentano (fino a ×60)
            var fac = Math.pow(60, st.demy), k = -1;
            cable.kind.forEach(function (kd, i) {
              if (kd === 'node') k++;
              if (kd === 'myelin' && k >= 7 && k <= 9) { cable.cm[i] *= fac; cable.gL[i] *= fac; }
            });
          }
        }
        cable.reset(-65);
        var n = cable.n, xs = cable.x;
        e1 = Math.floor(n * 0.25); e2 = Math.floor(n * 0.75);
        if (st.type === 'myel') { var nodes = []; cable.kind.forEach(function (k2, i) { if (k2 === 'node') nodes.push(i); }); e1 = nodes[4]; e2 = nodes[12]; }
        ro.set('L', F.fmt(xs[n - 1] * 10, 1) + ' mm'); ro.set('v', '—'); ro.set('t', '0');
        rec = { t: [], a: [], b: [] }; cross = [null, null]; vel = null;
        if (ax3) ax3.build(cable, { type: st.type, d: st.d, demy: st.type === 'myel' ? st.demy : 0, e1: e1, e2: e2 });
        draw();
      }
      function start() {
        cable.reset(-65); rec = { t: [], a: [], b: [] }; cross = [null, null]; vel = null; st.running = true; st.done = false;
        var n = cable.n, amp = function (i) { return 2000 * cable.area[i] * (st.type === 'myel' ? 50 : 1); };
        st.stimIdx = st.stim === 'left' ? [0] : (st.stim === 'mid' ? [Math.floor(n / 2) - (cable.kind[Math.floor(n / 2)] === 'node' ? 0 : 0)] : [0, n - 1]);
        if (st.type === 'myel' && st.stim === 'mid') { var best = 0, mid = n / 2; cable.kind.forEach(function (k, i) { if (k === 'node' && Math.abs(i - mid) < Math.abs(best - mid)) best = i; }); st.stimIdx = [best]; }
        st.amp = st.stimIdx.map(amp);
      }
      function frame(dt) {
        if (st.running) {
          var modelPerSec = (st.type === 'myel' ? 0.4 : 1.6) * st.speed, tAdv = Math.min(dt, 0.05) * modelPerSec;
          var h = st.type === 'myel' ? 0.005 : 0.01, nS = Math.max(1, Math.round(tAdv / h));
          for (var s = 0; s < nS; s++) {
            st.stimIdx.forEach(function (i, j) { cable.Iext[i] = cable.t < 0.3 ? st.amp[j] : 0; });
            cable.step(h);
            if (cross[0] === null && cable.V[e1] > 0) cross[0] = cable.t;
            if (cross[1] === null && cable.V[e2] > 0) cross[1] = cable.t;
          }
          rec.t.push(cable.t); rec.a.push(cable.V[e1]); rec.b.push(cable.V[e2]);
          if (cross[0] !== null && cross[1] !== null && vel === null && st.stim === 'left') vel = (cable.x[e2] - cable.x[e1]) / (cross[1] - cross[0]) * 10;
          ro.set('t', F.fmt(cable.t, 2)); ro.set('v', vel ? F.fmt(vel, 2) + ' m/s' : (st.stim === 'left' ? 'in misura…' : 'stimola da sinistra per misurarla'));
          if (cable.t > (st.type === 'myel' ? 3 : 14)) {
            st.running = false; st.done = true;
            if (!vel && st.stim === 'left') ro.set('v', '<span style="color:var(--bad)">nessuna: il PdA non è arrivato al secondo elettrodo (conduzione bloccata)</span>');
          }
          draw();
        }
        if (ax3) ax3.update(dt);
      }
      function draw() {
        var xmm = Array.from(cable.x).map(function (x) { return x * 10; });
        var V = Array.from(cable.V);
        var ser = [{ x: xmm, y: V, color: '--c1' }];
        if (st.type === 'myel') {
          var nx = [], nv = [];
          cable.kind.forEach(function (k, i) { if (k === 'node') { nx.push(xmm[i]); nv.push(V[i]); } });
          ser.push({ x: nx, y: nv, type: 'points', color: '--na', r: 3.5 });
        }
        pX.update({ series: ser, vlines: [{ x: xmm[e1], label: 'el. 1', color: '--c1' }, { x: xmm[e2], label: 'el. 2', color: '--na' }] });
        pT.update({ series: [{ name: 'elettrodo 1', x: rec.t, y: rec.a, color: '--c1' }, { name: 'elettrodo 2', x: rec.t, y: rec.b, color: '--na' }], xlim: [0, st.type === 'myel' ? 3 : 14] });
      }
      build();
      var loop = null;
      if (scn) scn.onFrame(frame); else loop = U.loop(L.main, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var prGo = function (o) { tSel.set(o.type); sD.set(o.d || 10); tDem.set(o.demy || 0); stSel.set(o.stim || 'left'); build(); start(); };
      U.explainer(L, {
        poll: 500,
        legend: [['#d94a3d', 'rosso: membrana depolarizzata (PdA attivo)'], ['#7fa0c9', 'blu/grigio: membrana a riposo o refrattaria'], ['#f2efe6', 'bianco: guaina di mielina']],
        narrate: function () {
          var f = F.fmt, s;
          if (st.type === 'unmy') s = `Fibra <b>amielinica</b> (${f(st.d, 0)} µm). La zona attiva è depolarizzata: le <b>correnti locali</b> (elettrotoniche) scorrono dentro l'assone e depolarizzano la zona vicina fino alla soglia; lì si aprono i canali Na⁺ e il processo si ripete lungo tutta la fibra. Dietro il fronte la membrana è <b>refrattaria</b> (canali inattivati): per questo il PdA non torna indietro. La velocità cresce con la radice del diametro (v ∝ √d).`;
          else s = `Fibra <b>mielinica</b> (${f(st.d, 0)} µm). I manicotti bianchi di mielina isolano gli internodi: la corrente locale scorre nell'assone quasi senza disperdersi e depolarizza il nodo di Ranvier successivo. Solo nei <b>nodi</b> ci sono molti canali Na⁺ (i punti nel grafico), quindi il PdA «salta» di nodo in nodo: <b>conduzione saltatoria</b>, molto più veloce e meno costosa in ATP. Qui la velocità cresce in proporzione al diametro (v ∝ d).`;
          if (vel) s += ` Velocità misurata: <b>${f(vel, 1)} m/s</b>.`;
          if (st.type === 'myel' && st.demy > 0.05) s += ` Nei 3 internodi demielinizzati (rosa) la capacità aumenta e la corrente si <b>disperde</b>: ${st.demy < 0.5 ? 'il PdA rallenta' : 'il PdA rallenta molto e può bloccarsi se la corrente che arriva al nodo successivo non raggiunge la soglia'}. È ciò che accade nella sclerosi multipla.`;
          if (st.stim === 'both') s += ` Stimolando le due estremità, i due PdA si incontrano e si <b>annullano</b>, perché ciascuno trova davanti la membrana refrattaria lasciata dall'altro.`;
          else if (st.stim === 'mid') s += ` Stimolando al centro il PdA parte nei due versi: la propagazione è bidirezionale se si parte da un punto qualsiasi; nell'organismo è unidirezionale perché parte dal soma.`;
          if (st.done && !vel && st.stim === 'left') s += ` <b>Il PdA non è arrivato al secondo elettrodo: conduzione bloccata.</b> Gli internodi senza mielina disperdono troppa corrente e il nodo successivo non raggiunge la soglia.`;
          else if (!st.running && !st.done) s += ' Premi «Stimola».';
          return s;
        },
        experiments: [
          { label: 'Fibra mielinica (10 µm)', run: function () { prGo({ type: 'myel' }); }, why: `Il PdA salta da un nodo al successivo: guarda il grafico in alto, dove i punti si attivano uno dopo l'altro. Velocità dell'ordine di 40 m/s.` },
          { label: 'Fibra amielinica (10 µm)', run: function () { prGo({ type: 'unmy' }); }, why: `Il PdA si propaga in modo continuo, molto più lento (circa 3 m/s): confronta la velocità misurata con la prova precedente.` },
          { label: 'Mielinica sottile (2 µm)', run: function () { prGo({ type: 'myel', d: 2 }); }, why: `Nelle fibre mieliniche la velocità è proporzionale al diametro: una fibra 5 volte più sottile è circa 5 volte più lenta.` },
          { label: 'Demielinizzazione parziale (40%)', run: function () { prGo({ type: 'myel', demy: 0.4 }); }, why: `Nei tre internodi danneggiati la corrente si disperde: il PdA rallenta, ma arriva.` },
          { label: 'Demielinizzazione grave (100%)', run: function () { prGo({ type: 'myel', demy: 1 }); }, why: `La perdita di mielina è tale che la corrente non basta più a raggiungere la soglia al nodo successivo: il PdA si <b>blocca</b>. È il meccanismo dei sintomi della sclerosi multipla.` },
          { label: 'Stimolo da entrambe le estremità', run: function () { prGo({ type: 'unmy', stim: 'both' }); }, why: `I due PdA si annullano nel punto d'incontro: dietro ciascuno la membrana è refrattaria, quindi non c'è nulla da eccitare.` },
          { label: 'Stimolo al centro', run: function () { prGo({ type: 'unmy', stim: 'mid' }); }, why: `Il PdA parte nei due versi: la membrana è eccitabile in entrambe le direzioni; ciò che lo rende unidirezionale nel corpo è il punto d'origine.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { pX.dispose(); pT.dispose(); if (ax3) ax3.dispose(); if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ Cavo passivo: λ e τ
  F.registerSim('cavo', {
    title: 'Potenziali locali: proprietà di cavo (λ e τ)',
    section: 'elettro',
    short: 'Un potenziale locale si attenua con la distanza (costante di spazio λ) e si allunga nel tempo (costante di tempo τ): perché i potenziali postsinaptici sono locali e graduali.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { d: P.d || 2, Rm: P.Rm || 20000, Ri: P.Ri || 150 };
      var sD = U.slider({ label: 'Diametro del dendrite/assone', min: 0.5, max: 20, step: 0.5, value: st.d, digits: 1, unit: 'µm', onInput: function (v) { st.d = v; run(); } });
      var sRm = U.slider({ label: 'Resistenza specifica di membrana R<sub>m</sub>', min: 1000, max: 100000, value: st.Rm, log: true, fmt: function (v) { return F.fmt(v / 1000, 1) + ' kΩ·cm²'; }, onInput: function (v) { st.Rm = v; run(); } });
      var sRi = U.slider({ label: 'Resistività del citoplasma R<sub>i</sub>', min: 30, max: 400, step: 5, value: st.Ri, digits: 0, unit: 'Ω·cm', onInput: function (v) { st.Ri = v; run(); } });
      [sD.el, sRm.el, sRi.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Cavo passivo semi-infinito: $\\lambda = \\sqrt{\\frac{R_m d}{4 R_i}}$, $\\tau = R_m C_m$ (C<sub>m</sub> = 1 µF/cm²). A regime $V(x) = V_0 e^{-x/\\lambda}$. La risposta a un breve impulso è calcolata numericamente con un cavo a 120 compartimenti.'));
      var ro = U.readouts([{ key: 'l', label: 'Costante di spazio λ', hl: true }, { key: 't', label: 'Costante di tempo τ' }, { key: 'x', label: 'Ampiezza a 1 mm (regime)' }]);
      L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Decremento con la distanza (corrente costante in x = 0)', xlabel: 'distanza (µm)', ylabel: 'V / V₀', height: 210, ylim: [0, 1.02] });
      var p2 = U.plot(L.main, { title: 'Breve impulso di corrente: registrazioni a distanze crescenti', xlabel: 'tempo (ms)', ylabel: 'ΔV (mV)', height: 220 });
      function run() {
        var lam = Math.sqrt(st.Rm * st.d * 1e-4 / (4 * st.Ri)) * 1e4, tau = st.Rm * 1e-3; // µm, ms
        ro.set('l', F.fmt(lam, 0) + ' µm'); ro.set('t', F.fmt(tau, 1) + ' ms'); ro.set('x', F.fmt(Math.exp(-1000 / lam) * 100, 1) + '% di V₀');
        var Lmax = Math.max(500, 4 * lam), xs = F.linspace(0, Lmax, 200);
        p1.update({ series: [{ x: xs, y: xs.map(function (x) { return Math.exp(-x / lam); }), color: '--c1' }], vlines: [{ x: lam, label: 'λ (37%)', color: '--ok' }], hlines: [{ y: 1 / Math.E, color: '--ok' }], xlim: [0, Lmax] });
        var c = F.Cable.passive({ d_um: st.d, length_um: Math.min(4 * lam, 20000), n: 120, Ri: st.Ri, Rm: st.Rm });
        c.reset(-65, false);
        var picks = [0, 0.25, 0.5, 1].map(function (f) { return Math.min(c.n - 1, Math.round(f * lam / (c.x[1] - c.x[0]) / 1e4)); });
        var traces = picks.map(function () { return []; }), T = [], dt = Math.min(0.05, tau / 100), tmax = Math.min(5 * tau, 200);
        var amp = 2e-4 * Math.PI * st.d * 1e-4; // µA, impulso breve
        for (var t = 0; t <= tmax; t += dt) {
          c.Iext[0] = t < 1 ? amp * 1000 * (st.d / 2) : 0;
          c.step(dt); T.push(t);
          picks.forEach(function (i, k) { traces[k].push(c.V[i] + 65); });
        }
        var norm = Math.max.apply(null, traces[0]) || 1;
        var cols = ['--c1', '--c3', '--c5', '--na'];
        p2.update({ series: picks.map(function (i, k) { return { name: F.fmt(c.x[i] * 1e4, 0) + ' µm', x: T, y: traces[k].map(function (v) { return v / norm * 10; }), color: cols[k] }; }) });
      }
      run();
      U.texify(L.controls);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var cvBase = function () { sD.set(2); sRm.set(20000); sRi.set(150); };
      U.explainer(L, {
        watch: ro,
        base: cvBase,
        legend: [['--c1', 'in alto: ampiezza a regime lungo il cavo'], ['--ok', 'verde: λ (il potenziale è sceso al 37%)']],
        narrate: function () {
          var f = F.fmt, lam = Math.sqrt(st.Rm * st.d * 1e-4 / (4 * st.Ri)) * 1e4, tau = st.Rm * 1e-3;
          return `Un potenziale locale (come un PPSE) non si propaga in modo attivo: si <b>diffonde passivamente</b> lungo il dendrite, come l'acqua in un tubo bucato. La corrente può scorrere lungo l'asse (resistenza del citoplasma R<sub>i</sub>) o <b>disperdersi</b> attraverso la membrana (R<sub>m</sub>): più la membrana isola rispetto al citoplasma, più il segnale arriva lontano. L'attenuazione è esponenziale: V = V₀·e<sup>−x/λ</sup> con λ = <b>${f(lam, 0)} µm</b>: a una distanza λ il potenziale è sceso al 37%. In più il segnale si <b>allunga nel tempo</b> (τ = ${f(tau, 0)} ms): nel grafico in basso i punti più lontani rispondono più lentamente e in piccolo. Per questo i PPS sono locali e graduati.`;
        },
        experiments: [
          { label: 'Dendrite standard (2 µm)', run: function () { cvBase(); }, why: `λ ≈ 0,8 mm: un PPSE a 1 mm dal soma arriva con circa il 30% dell'ampiezza.` },
          { label: 'Dendrite sottile (0,5 µm)', run: function () { cvBase(); sD.set(0.5); }, why: `λ ∝ √d: un dendrite più sottile ha più resistenza assiale e il segnale si spegne più presto.` },
          { label: 'Dendrite spesso (10 µm)', run: function () { cvBase(); sD.set(10); }, why: `Con un diametro maggiore λ cresce (circa √5 volte) e il segnale arriva più lontano.` },
          { label: 'Membrana con perdite (R_m = 2 kΩ·cm²)', run: function () { cvBase(); sRm.set(2000); }, why: `Con più canali aperti la corrente si perde subito attraverso la membrana: λ e τ si riducono entrambe (τ = R<sub>m</sub>C<sub>m</sub>).` },
          { label: 'Citoplasma più resistivo', run: function () { cvBase(); sRi.set(300); }, why: `Con R<sub>i</sub> maggiore la corrente fatica a scorrere lungo l'asse: λ diminuisce.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { p1.dispose(); p2.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
