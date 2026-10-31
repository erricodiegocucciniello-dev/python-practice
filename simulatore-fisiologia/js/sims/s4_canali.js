/* Sezione 4 — Canali ionici (lezioni 9, 10, 25). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Canale ionico 3D
  F.registerSim('canale3d', {
    title: 'Canali ionici in 3D: selettività e gating',
    section: 'canali',
    short: 'Canale Na⁺ voltaggio-dipendente (S4, porta di attivazione, porta di inattivazione), canale K⁺ (palla e catena), K2P, Kir, recettore nicotinico, acquaporina.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 'nav', V: -65, lig: false, curare: false, hg: false, ball: true, lido: false, drive: null, dGrad: 1, Mg: 1 };
      var types = [['nav', 'Na⁺ voltaggio-dipendente (Nav)'], ['kv', 'K⁺ voltaggio-dipendente (Kv)'], ['k2p', 'K⁺ di fuga (K2P, senza porta)'], ['kir', 'K⁺ rettificatore entrante (Kir)'], ['nachr', 'Recettore nicotinico (nAChR)'], ['aqp', 'Acquaporina (AQP1)']];
      var tSel = U.select({ label: 'Canale', value: st.type, options: types, onChange: function (v) { st.type = v; build(); } });
      L.controls.appendChild(tSel.el);
      var dyn = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }); L.controls.appendChild(dyn);
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }]);
      var scn = F.scene3d(L.main, { height: function (w) { return Math.min(400, Math.max(300, w * 0.55)); }, camPos: [0, 2.2, 9.5] });
      L.main.appendChild(ro.el);
      var plotHost = el('div'); L.main.appendChild(plotHost);
      var plot = U.plot(plotHost, { title: '', xlabel: 'tempo (ms)', ylabel: '', height: 170 });
      var labs = function (a, b, c) { var n = ro.el.querySelectorAll('.rl'); n[0].innerHTML = a; n[1].innerHTML = b; n[2].innerHTML = c; };
      var THREE = G.THREE, grp = null, parts = {}, ions = [], gate = { m: 0, h: 1, n: 0, B: 0, open: 0, act: 0, inact: 0, block: 0 };
      var hist = { t: [], a: [], b: [], c: [] }, tsim = 0, sV;
      if (scn) {
        var mem = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0xd9c9a3, transparent: true, opacity: 0.18, depthWrite: false }));
        scn.scene.add(mem);
        var o1 = new THREE.Object3D(); o1.position.set(-5.2, 2.6, 0); scn.scene.add(o1); scn.label(o1, 'esterno', true);
        var o2 = new THREE.Object3D(); o2.position.set(-5.2, -2.6, 0); scn.scene.add(o2); scn.label(o2, 'citosol', true);
      }
      // --------------------------------------------------- costruzione della geometria per tipo
      function clearGroup() { scn.clearLabels(); if (grp) { scn.scene.remove(grp); grp.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); } grp = new THREE.Group(); scn.scene.add(grp); parts = {}; ions = []; }
      function cyl(r, h, color, opts) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), F.mat(color, opts)); }
      function buildGeom() {
        if (!scn) return;
        clearGroup();
        var t = st.type, nSub = t === 'nachr' ? 5 : (t === 'k2p' ? 2 : 4), R = t === 'nachr' ? 1.45 : 1.35;
        var cols = t === 'nav' ? [0x4a7bd0, 0x5b8be0, 0x3e6dc0, 0x6a9ae8] : (t === 'nachr' ? [0xc0504d, 0x4a7bd0, 0xc0504d, 0x2bb3a3, 0xe0a63a] : [0x8e6cc4, 0x9b7bd2, 0x7f5db8, 0xa98ad9]);
        parts.sub = []; parts.s4 = []; parts.s6 = [];
        if (t === 'aqp') {
          parts.pores = [];
          for (var q = 0; q < 4; q++) {
            var a = q / 4 * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a) * 1.6, cz = Math.sin(a) * 1.6;
            var body = cyl(1.0, 3.2, 0x3e9ad6, { transparent: true, opacity: 0.55 }); body.position.set(cx, 0, cz); grp.add(body);
            var pore = cyl(0.12, 3.4, 0xffffff, { transparent: true, opacity: 0.4 }); pore.position.set(cx, 0, cz); grp.add(pore);
            parts.pores.push([cx, cz]);
          }
          var lbl = new THREE.Object3D(); lbl.position.set(0, 2.4, 0); grp.add(lbl);
          parts.lbl = scn.label(lbl, 'tetramero: ogni subunità ha il suo poro');
          return;
        }
        for (var k = 0; k < nSub; k++) {
          var ang = k / nSub * Math.PI * 2, x = Math.cos(ang) * R, z = Math.sin(ang) * R;
          var s = cyl(0.62, 3.0, cols[k % cols.length], { transparent: true, opacity: 0.85 }); s.position.set(x, 0, z); grp.add(s); parts.sub.push(s);
          if (t === 'nav' || t === 'kv') {
            var s4 = cyl(0.2, 1.6, 0xd9480f); s4.position.set(Math.cos(ang) * (R + 0.85), 0, Math.sin(ang) * (R + 0.85)); grp.add(s4); parts.s4.push(s4);
            var plus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); plus.position.y = 0.5; s4.add(plus);
          }
          if (t !== 'k2p') {
            var s6 = cyl(0.17, 1.3, 0x2e3a59); s6.geometry.translate(0, -0.65, 0);
            s6.position.set(Math.cos(ang) * 0.75, -1.1, Math.sin(ang) * 0.75); s6.userData.ang = ang; grp.add(s6); parts.s6.push(s6);
          }
        }
        if (t === 'nav') {
          // porta di inattivazione: ansa III-IV ("botola") con il motivo IFM
          var cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), F.mat(0xe8c547)); grp.add(cap); parts.lid = cap;
          var lgeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
          var lline = new THREE.Line(lgeo, new THREE.LineBasicMaterial({ color: 0xb8860b })); grp.add(lline); parts.lidLine = lline;
          scn.label(cap, 'porta h (ansa III-IV)');
          scn.label(parts.s4[0], 'S4 (+)');
        }
        if (t === 'kv' && st.ball) {
          var ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), F.mat(0xe8c547)); grp.add(ball); parts.ball = ball;
          var chainGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
          var chain = new THREE.Line(chainGeo, new THREE.LineBasicMaterial({ color: 0xb8860b })); grp.add(chain); parts.chain = chain;
          scn.label(ball, 'palla (N-terminale)');
        }
        if (t === 'kir') { var mg = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), F.mat(0x2bb3a3)); grp.add(mg); parts.mg = mg; scn.label(mg, 'Mg²⁺ / poliammine'); }
        if (t === 'nachr') {
          parts.ach = [];
          [0, 2].forEach(function (k) {
            var a = (k + 0.5) / 5 * Math.PI * 2, s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), F.mat(0x7cc36b));
            s.position.set(Math.cos(a) * 2.1, 1.6, Math.sin(a) * 2.1); grp.add(s); parts.ach.push(s);
          });
          scn.label(parts.ach[0], 'sito per ACh (α)');
        }
        // filtro di selettività
        var filt = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 24), new THREE.MeshBasicMaterial({ color: 0x23915a }));
        filt.rotation.x = Math.PI / 2; filt.position.y = 1.0; grp.add(filt);
        scn.label(filt, 'filtro di selettività');
      }
      function ionColor() { return st.type === 'nav' ? 0xd9480f : (st.type === 'nachr' ? 0xb05cc4 : (st.type === 'aqp' ? 0x4aa3df : 0x3559c7)); }
      // --------------------------------------------------- controlli per tipo
      function build() {
        dyn.innerHTML = ''; hist = { t: [], a: [], b: [], c: [] }; tsim = 0; st.drive = null;
        var t = st.type;
        if (t === 'nav' || t === 'kv' || t === 'kir' || t === 'k2p') {
          sV = U.slider({ label: 'Potenziale di membrana', min: -100, max: 50, step: 1, value: st.V, digits: 0, unit: 'mV', onInput: function (v) { st.V = v; st.drive = null; } });
          dyn.appendChild(sV.el);
          dyn.appendChild(el('div', { class: 'btn-row' }, [
            U.button('Gradino a −10 mV', function () { st.drive = null; sV.set(-10); }),
            U.button('Torna a −65 mV', function () { st.drive = null; sV.set(-65); }),
            t === 'nav' || t === 'kv' ? U.button('Potenziale d\'azione', function () { runAP(); }, 'primary') : null
          ]));
        }
        if (t === 'nav') {
          dyn.appendChild(U.toggle({ label: 'Anestetico locale (lidocaina): blocco uso-dipendente', value: st.lido, onChange: function (v) { st.lido = v; gate.B = 0; } }).el);
          dyn.appendChild(el('div', { class: 'btn-row' }, [U.button('Treno di 10 PdA (20 Hz)', function () { runTrain(); })]));
        }
        if (t === 'kv') dyn.appendChild(U.toggle({ label: 'Inattivazione di tipo N ("palla e catena", Shaker)', value: st.ball, onChange: function (v) { st.ball = v; buildGeom(); } }).el);
        if (t === 'kir') dyn.appendChild(U.slider({ label: '[K⁺] esterno', min: 1, max: 40, step: 0.5, value: 5, digits: 1, unit: 'mM', onInput: function (v) { st.Ko = v; } }).el);
        if (t === 'nachr') {
          dyn.appendChild(U.toggle({ label: 'Acetilcolina presente (2 molecole)', value: st.lig, onChange: function (v) { st.lig = v; } }).el);
          dyn.appendChild(U.toggle({ label: 'd-tubocurarina (curaro)', value: st.curare, onChange: function (v) { st.curare = v; } }).el);
        }
        if (t === 'aqp') {
          dyn.appendChild(U.slider({ label: 'Gradiente osmotico (dentro − fuori)', min: -1, max: 1, step: 0.05, value: 1, digits: 2, onInput: function (v) { st.dGrad = v; } }).el);
          dyn.appendChild(U.toggle({ label: 'HgCl₂ (blocca AQP1, Cys189)', value: st.hg, onChange: function (v) { st.hg = v; } }).el);
        }
        dyn.appendChild(U.params({
          nav: 'Probabilità delle porte dal modello di Hodgkin-Huxley (m: attivazione, h: inattivazione), rallentate di 300× per renderle visibili. P(aperto) = m³h. Lidocaina: modello del recettore "custodito" (si lega al canale aperto o inattivato, si stacca lentamente a riposo; τ ≈ 300 ms).',
          kv: 'Attivazione n dal modello HH (P = n⁴), rallentata di 300×. Inattivazione di tipo N: la palla N-terminale entra solo a canale <b>aperto</b> (modello a palla e catena di Armstrong-Bezanilla/Aldrich).',
          k2p: 'Canale sempre aperto (nessuna porta): la corrente dipende solo dalla forza elettrochimica (V − EK).',
          kir: 'Nessun sensore S4: la rettificazione è un blocco della conduzione da Mg²⁺ e poliammine dal lato interno, che dipende da V − EK: $I = g(V - E_K)/(1 + e^{(V - E_K - 10)/10})$.',
          nachr: 'Pentamero α₂βεδ (adulto): 2 siti per l\'ACh sulle subunità α; servono entrambe le molecole perché il canale si apra. Canale cationico (Erev ≈ 0 mV). Il curaro compete con l\'ACh.',
          aqp: 'AQP1: tetramero, 4 pori indipendenti; l\'acqua passa in fila singola (circa 3·10⁹ molecole/s per poro); il flusso segue il gradiente osmotico. Hg²⁺ blocca il poro legando la Cys189.'
        }[t]));
        U.texify(dyn);
        if (t === 'nav') { labs('P(aperto) = m³h', 'Attivazione m', 'Inattivazione (1 − h)'); plot.update({ series: [] }); plot.o.ylabel = 'probabilità'; }
        if (t === 'kv') { labs('P(aperto)', 'Attivazione n⁴', 'Palla legata'); plot.o.ylabel = 'probabilità'; }
        if (t === 'k2p') { labs('Corrente K⁺', 'EK', 'Forza elettrochimica V − EK'); plot.o.ylabel = 'corrente (u.a.)'; }
        if (t === 'kir') { labs('Corrente K⁺', 'EK', 'Frazione bloccata da Mg²⁺'); plot.o.ylabel = 'corrente (u.a.)'; }
        if (t === 'nachr') { labs('Stato', 'Siti occupati', 'Ioni che passano'); plot.o.ylabel = 'P(aperto)'; }
        if (t === 'aqp') { labs('Flusso d\'acqua', 'Direzione', 'Stato'); plot.o.ylabel = 'flusso (u.a.)'; }
        plotHost.style.display = (t === 'nav' || t === 'kv') ? '' : 'none';
        var s = F.HH.inf(st.V); gate.m = s.m; gate.h = s.h; gate.n = s.n; gate.B = 0;
        buildGeom();
      }
      function runAP() {
        var r = F.HH.simulate({ tmax: 12, I: function (t) { return t >= 1 && t < 2 ? 15 : 0; }, every: 1 });
        st.drive = { t: r.t, V: r.V, i: 0, t0: tsim };
      }
      function runTrain() {
        var r = F.HH.simulate({ tmax: 500, I: function (t) { var k = Math.floor(t / 50); return (k < 10 && t - k * 50 >= 1 && t - k * 50 < 2) ? 15 : 0; }, every: 1 });
        st.drive = { t: r.t, V: r.V, i: 0, t0: tsim, train: true, peaks: [] };
        hist = { t: [], a: [], b: [], c: [] };
      }
      // --------------------------------------------------- dinamica
      var slow = 300; // 1 ms di modello = 0,3 s reali
      function frame(dt) {
        var dtm = dt * 1000 / slow * (st.drive && st.drive.train ? 8 : 1);
        tsim += dtm;
        if (st.drive) {
          var d = st.drive, te = tsim - d.t0;
          while (d.i < d.t.length - 1 && d.t[d.i] < te) d.i++;
          st.V = d.V[d.i]; if (sV) sV.set(st.V, true);
          if (d.i >= d.t.length - 1) { st.drive = null; }
        }
        var V = st.V, t = st.type, phi = 1, r = F.HH.rates(V, phi), sub = 10, h = dtm / sub;
        for (var k = 0; k < sub; k++) {
          gate.m += h * (r.am * (1 - gate.m) - r.bm * gate.m);
          gate.h += h * (r.ah * (1 - gate.h) - r.bh * gate.h);
          gate.n += h * (r.an * (1 - gate.n) - r.bn * gate.n);
          if (t === 'nav' && st.lido) { var O = gate.m * gate.m * gate.m * gate.h, I = 1 - gate.h; gate.B += h * (0.08 * (O + I) * (1 - gate.B) - (1 / 300) * gate.B * gate.h); }
          if (t === 'kv' && st.ball) { var On = Math.pow(gate.n, 4); gate.ball = (gate.ball || 0) + h * (0.3 * On * (1 - (gate.ball || 0)) - (V < -50 ? 0.08 : 0.004) * (gate.ball || 0)); }
        }
        var EK = F.nernst(st.Ko || 5, 140, 1, 37);
        if (t === 'nav') { gate.act = gate.m; gate.inact = 1 - gate.h; gate.open = gate.m * gate.m * gate.m * gate.h * (1 - gate.B); }
        else if (t === 'kv') { gate.act = gate.n; gate.open = Math.pow(gate.n, 4) * (st.ball ? 1 - (gate.ball || 0) : 1); }
        else if (t === 'k2p') { gate.open = 1; }
        else if (t === 'kir') { var blk = 1 - 1 / (1 + Math.exp((V - EK - 10) / 10)); gate.block = blk; gate.open = 1 - blk; }
        else if (t === 'nachr') { var occ = st.lig && !st.curare ? 1 : 0; gate.occ = occ; gate.open += (occ - gate.open) * Math.min(1, dt * 6); }
        else if (t === 'aqp') { gate.open = st.hg ? 0.05 : 1; }
        // registrazione
        if ((t === 'nav' || t === 'kv') && (st.drive || hist.t.length < 2 || Math.abs(hist.t[hist.t.length - 1] - tsim) > 0.05)) {
          hist.t.push(tsim); hist.a.push(gate.open); hist.b.push(t === 'nav' ? gate.m : Math.pow(gate.n, 4)); hist.c.push(t === 'nav' ? 1 - gate.h : (gate.ball || 0));
          while (hist.t.length > 600) { hist.t.shift(); hist.a.shift(); hist.b.shift(); hist.c.shift(); }
          if (hist.t.length % 3 === 0) plot.update({ series: [
            { name: 'P(aperto)', x: hist.t, y: hist.a, color: '--c1' },
            { name: t === 'nav' ? 'm (attivazione)' : 'n⁴', x: hist.t, y: hist.b, color: '--na', dash: [5, 3] },
            { name: t === 'nav' ? '1 − h (inattivazione)' : 'palla legata', x: hist.t, y: hist.c, color: '--c5', dash: [2, 3] }], ylim: [0, 1.02], legendRight: true });
        }
        // letture
        if (t === 'nav') { ro.set('a', F.fmt(gate.open, 3)); ro.set('b', F.fmt(gate.m, 2)); ro.set('c', F.fmt(1 - gate.h, 2) + (st.lido ? ' · bloccati ' + F.fmt(gate.B * 100, 0) + '%' : '')); }
        if (t === 'kv') { ro.set('a', F.fmt(gate.open, 3)); ro.set('b', F.fmt(Math.pow(gate.n, 4), 3)); ro.set('c', st.ball ? F.fmt(gate.ball || 0, 2) : '—'); }
        if (t === 'k2p') { ro.set('a', F.fmt((V - EK) / 50, 2) + (V > EK ? ' (uscente)' : ' (entrante)')); ro.set('b', F.fmt(EK, 1) + ' mV'); ro.set('c', F.fmt(V - EK, 0) + ' mV'); }
        if (t === 'kir') { ro.set('a', F.fmt(F.kirI(V, EK, 1) / 50, 2) + (V > EK ? ' (uscente)' : ' (entrante)')); ro.set('b', F.fmt(EK, 1) + ' mV'); ro.set('c', F.fmt(gate.block * 100, 0) + '%'); }
        if (t === 'nachr') { ro.set('a', gate.open > 0.5 ? 'aperto' : 'chiuso'); ro.set('b', st.curare ? 'occupati dal curaro' : (st.lig ? '2 su 2 (ACh)' : '0 su 2')); ro.set('c', gate.open > 0.5 ? 'Na⁺ entra, K⁺ esce (netto: entrante)' : '—'); }
        if (t === 'aqp') { ro.set('a', F.fmt(st.dGrad * gate.open, 2)); ro.set('b', st.dGrad > 0 ? 'verso l\'interno' : (st.dGrad < 0 ? 'verso l\'esterno' : 'nessun flusso netto')); ro.set('c', st.hg ? 'bloccata da Hg²⁺' : 'aperta'); }
        if (!scn || !grp) return;
        // animazione della geometria
        var act = t === 'nav' ? gate.m : (t === 'kv' ? gate.n : 0);
        parts.s4.forEach(function (s, i) { s.position.y = -0.7 + 1.4 * act; s.rotation.y = act * 1.05; });
        var openGeom = t === 'nav' ? Math.pow(gate.m, 3) : (t === 'kv' ? Math.pow(gate.n, 4) : (t === 'nachr' ? gate.open : 1));
        parts.s6.forEach(function (s) { var a = s.userData.ang, tilt = 0.75 - 0.75 * openGeom; s.rotation.set(0, 0, 0); s.rotateOnWorldAxis(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), -tilt); });
        if (parts.lid) { // la "botola" chiude l'imboccatura interna del poro quando h → 0
          var ci = 1 - gate.h, lp = new THREE.Vector3(2.2 * (1 - ci), -3.1 + 1.2 * ci, 0.8 * (1 - ci));
          parts.lid.position.copy(lp);
          var la = parts.lidLine.geometry.attributes.position; la.setXYZ(0, 1.5, -1.6, 0); la.setXYZ(1, lp.x, lp.y, lp.z); la.needsUpdate = true;
        }
        if (parts.ball) {
          var b = gate.ball || 0, bp = new THREE.Vector3(2.6 * (1 - b), -2.6 + 0.9 * b, 1.2 * (1 - b));
          parts.ball.position.copy(bp);
          var pa = parts.chain.geometry.attributes.position; pa.setXYZ(0, 1.4, -1.5, 0); pa.setXYZ(1, bp.x, bp.y, bp.z); pa.needsUpdate = true;
        }
        if (parts.mg) { var bl = gate.block || 0; parts.mg.position.set(0, -2.6 + 1.6 * bl, 0); }
        if (parts.ach) parts.ach.forEach(function (s) { s.visible = st.lig && !st.curare; s.material.color.setHex(0x7cc36b); });
        // ioni nel poro
        var flowDir, rate;
        if (t === 'aqp') { flowDir = st.dGrad > 0 ? -1 : 1; rate = Math.abs(st.dGrad) * gate.open * 14; }
        else {
          var E = t === 'nav' ? 50 : (t === 'nachr' ? 0 : EK);
          flowDir = V > E ? 1 : -1; rate = gate.open * Math.min(1, Math.abs(V - E) / 60) * 10;
          if (t === 'nachr') { flowDir = V > 0 ? 1 : -1; }
        }
        spawn(rate, flowDir, dt);
      }
      var ionGeo = null, ionMat = null, acc = 0;
      function spawn(rate, dir, dt) {
        if (!ionGeo) { ionGeo = new THREE.SphereGeometry(0.16, 10, 8); }
        ionMat = ionMat || new THREE.MeshStandardMaterial({ color: ionColor() });
        ionMat.color.setHex(ionColor());
        acc += rate * dt;
        while (acc >= 1 && ions.length < 60) {
          acc -= 1;
          var m = new THREE.Mesh(ionGeo, ionMat), px = 0, pz = 0;
          if (st.type === 'aqp') { var pp = parts.pores[Math.floor(Math.random() * 4)]; px = pp[0]; pz = pp[1]; }
          m.position.set(px + (Math.random() - 0.5) * 0.1, dir > 0 ? -2.8 : 2.8, pz + (Math.random() - 0.5) * 0.1);
          m.userData.v = dir * (st.type === 'aqp' ? 3 : 4); grp.add(m); ions.push(m);
        }
        if (acc > 1) acc = 1;
        for (var i = ions.length - 1; i >= 0; i--) {
          var o = ions[i]; o.position.y += o.userData.v * dt;
          if (Math.abs(o.position.y) > 3.2) { grp.remove(o); ions.splice(i, 1); }
        }
      }
      build();
      var loop = null;
      if (scn) scn.onFrame(frame); else loop = U.loop(L.main, frame);
      return { destroy: function () { plot.dispose(); if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ Curve corrente-voltaggio
  F.registerSim('iv', {
    title: 'Relazioni corrente-voltaggio (I-V) dei canali',
    section: 'canali',
    short: 'Canale ohmico, rettificazione da concentrazioni asimmetriche (GHK), rettificatore ritardato (Kv), rettificatore entrante (Kir), NMDA con blocco del Mg²⁺.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 'kir', Ko: 5, Mg: 1, E: -80 };
      var tSel = U.select({ label: 'Tipo di canale', value: st.type, options: [['ohm', 'Ohmico (canale di fuga ideale)'], ['ghk', 'K⁺ con concentrazioni asimmetriche (GHK)'], ['kv', 'K⁺ rettificatore ritardato (Kv, HH)'], ['kir', 'K⁺ rettificatore entrante (Kir)'], ['nmda', 'Recettore NMDA (blocco del Mg²⁺)'], ['ach', 'Recettore nicotinico (cationico, Erev ≈ 0)']], onChange: function (v) { st.type = v; upd(); } });
      var sK = U.slider({ label: '[K⁺] esterno', min: 1, max: 140, value: 5, log: true, fmt: function (v) { return F.fmt(v, 1) + ' mM'; }, onInput: function (v) { st.Ko = v; upd(); } });
      var sMg = U.slider({ label: '[Mg²⁺] esterno', min: 0, max: 5, step: 0.1, value: 1, digits: 1, unit: 'mM', onInput: function (v) { st.Mg = v; upd(); } });
      [tSel.el, sK.el, sMg.el].forEach(function (e) { L.controls.appendChild(e); });
      var note = el('div', { class: 'small' }); L.controls.appendChild(note);
      var ro = U.readouts([{ key: 'e', label: 'Potenziale di inversione', hl: true }, { key: 'r', label: 'Comportamento' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Corrente in funzione del potenziale (uscente > 0)', xlabel: 'potenziale di membrana (mV)', ylabel: 'corrente (u.a.)', height: 280, xlim: [-120, 60] });
      function upd() {
        var Vs = F.linspace(-120, 60, 181), EK = F.nernst(st.Ko, 140, 1, 37), I, E, desc;
        sK.el.style.display = (st.type === 'nmda' || st.type === 'ach') ? 'none' : '';
        sMg.el.style.display = st.type === 'nmda' ? '' : 'none';
        if (st.type === 'ohm') { E = EK; I = Vs.map(function (V) { return (V - E) / 40; }); desc = 'lineare: g costante'; }
        else if (st.type === 'ghk') { E = EK; I = Vs.map(function (V) { return F.ghkCurrent(1, 1, st.Ko, 140, V, 37) / 60; }); desc = 'rettificazione "di Goldman" dovuta solo alle concentrazioni diverse'; }
        else if (st.type === 'kv') { E = EK; I = Vs.map(function (V) { var n = F.HH.inf(V).n; return Math.pow(n, 4) * (V - E) / 40; }); desc = 'rettificatore uscente: si apre con la depolarizzazione'; }
        else if (st.type === 'kir') { E = EK; I = Vs.map(function (V) { return F.kirI(V, E, 1) / 40; }); desc = 'rettificatore entrante: passa bene la corrente entrante, poco quella uscente'; }
        else if (st.type === 'nmda') { E = 0; I = Vs.map(function (V) { return F.nmdaBlock(V, st.Mg) * V / 40; }); desc = st.Mg > 0 ? 'regione a pendenza negativa: il Mg²⁺ blocca il poro a potenziali negativi' : 'senza Mg²⁺: lineare'; }
        else { E = 0; I = Vs.map(function (V) { return V / 40; }); desc = 'lineare, Erev ≈ 0 mV (Na⁺ e K⁺ passano entrambi)'; }
        note.innerHTML = { kir: 'Prova ad aumentare il K⁺ esterno: la curva si sposta con E<sub>K</sub>, segno che il blocco dipende da V − E<sub>K</sub>.', ghk: 'Con K⁺ uguale dentro e fuori (140 mM) la curva diventa lineare.', nmda: 'Il canale NMDA conduce solo se c\'è glutammato <b>e</b> la membrana è depolarizzata: un "rivelatore di coincidenza".', kv: 'Il canale è chiuso a riposo e si apre sopra ~−50 mV.', ohm: 'I = g (V − E): legge di Ohm generalizzata (lezione 15).', ach: 'Il potenziale di inversione vicino a 0 mV è tipico dei canali cationici non selettivi.' }[st.type];
        ro.set('e', F.fmt(E, 1) + ' mV'); ro.set('r', desc);
        plot.update({ series: [{ x: Vs, y: I, color: '--c1' }], vlines: [{ x: E, label: 'E = ' + F.fmt(E, 0) + ' mV', color: '--ok' }], hlines: [] });
      }
      upd();
      return { destroy: function () { plot.dispose(); } };
    }
  });

  // ================================================================ Cellula β del pancreas
  F.registerSim('cellulabeta', {
    title: 'Cellula β del pancreas: canali K-ATP e Ca²⁺',
    section: 'canali',
    short: 'Glucosio → ATP/ADP → chiusura dei canali K-ATP → depolarizzazione → apertura dei canali Ca²⁺ → secrezione di insulina. Sulfoniluree e diazossido.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { G: P.G === undefined ? 5 : P.G, su: 0, dz: 0 };
      var sG = U.slider({ label: 'Glucosio nel sangue', min: 0, max: 20, step: 0.5, value: st.G, digits: 1, unit: 'mmol/L', onInput: function (v) { st.G = v; upd(); } });
      var tSU = U.toggle({ label: 'Sulfonilurea (glibenclamide): chiude i K-ATP', value: false, onChange: function (v) { st.su = v ? 0.85 : 0; upd(); } });
      var tDZ = U.toggle({ label: 'Diazossido: apre i K-ATP', value: false, onChange: function (v) { st.dz = v ? 1 : 0; upd(); } });
      [sG.el, tSU.el, tDZ.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Modello didattico a stato stazionario: frazione di K-ATP chiusi = G³/(G³ + 6³); Vm dall\'equazione delle conduttanze tra K-ATP (E<sub>K</sub> = −80 mV) e una conduttanza depolarizzante di fondo (−20 mV); apertura dei canali Ca²⁺ sigmoide (metà a −50 mV); secrezione ∝ (Ca²⁺)². Riproduce la soglia di secrezione intorno a 6–8 mmol/L.'));
      var ro = U.readouts([{ key: 'k', label: 'K-ATP chiusi' }, { key: 'v', label: 'Vm della cellula β', hl: true }, { key: 'c', label: 'Canali Ca²⁺ aperti' }, { key: 's', label: 'Secrezione di insulina' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var res = null;
      var cv = U.canvas2d(holder, 150, function (ctx, w, h) {
        if (!res) return;
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var steps = [['Glucosio', st.G / 20], ['ATP/ADP', res.closed], ['K-ATP chiusi', 1 - res.gKATP / 5], ['Depolarizz.', (res.Vm + 80) / 60], ['Ca²⁺ entra', res.caOpen], ['Insulina', res.secretion]];
        var bw = (w - 20) / steps.length;
        ctx.font = '600 ' + (bw < 90 ? 10 : 12) + 'px ' + css('--font'); ctx.textAlign = 'center';
        steps.forEach(function (s, i) {
          var x = 10 + i * bw, v = F.clamp(s[1], 0, 1);
          ctx.fillStyle = css('--surface-3'); ctx.fillRect(x + 6, 30, bw - 12, 70);
          ctx.fillStyle = css('--c1'); ctx.globalAlpha = 0.25 + 0.75 * v; ctx.fillRect(x + 6, 30 + 70 * (1 - v), bw - 12, 70 * v); ctx.globalAlpha = 1;
          ctx.fillStyle = css('--text'); ctx.fillText(s[0], x + bw / 2, 20);
          if (i < steps.length - 1) U.arrow(ctx, x + bw - 6, 65, x + bw + 6, 65, css('--muted'), 1.5, 6);
        });
        ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font'); ctx.fillText('catena causale (altezza = intensità)', w / 2, h - 18);
      });
      var plot = U.plot(L.main, { title: 'Secrezione in funzione del glucosio', xlabel: 'glucosio (mmol/L)', ylabel: 'secrezione (rel.)', height: 190, xlim: [0, 20], ylim: [0, 1.05] });
      function upd() {
        res = F.betaCell(st.G, st.su, st.dz);
        ro.set('k', F.fmt(res.closed * 100, 0) + '%'); ro.set('v', F.fmt(res.Vm, 1) + ' mV'); ro.set('c', F.fmt(res.caOpen * 100, 0) + '%'); ro.set('s', F.fmt(res.secretion * 100, 0) + '% del massimo');
        var Gs = F.linspace(0, 20, 81);
        plot.update({ series: [{ name: 'controllo', x: Gs, y: Gs.map(function (g) { return F.betaCell(g, 0, 0).secretion; }), color: '--faint', dash: [5, 4] },
          { name: 'condizione attuale', x: Gs, y: Gs.map(function (g) { return F.betaCell(g, st.su, st.dz).secretion; }), color: '--c1' },
          { x: [st.G], y: [res.secretion], type: 'points', color: '--na', r: 6 }], vlines: [{ x: 5, label: 'glicemia normale' }] });
        cv.redraw();
      }
      upd();
      return { destroy: function () { plot.dispose(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
