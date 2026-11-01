/* Sezione 2 — La membrana cellulare (lezioni 4–5). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  /** Modello semplificato della fluidità di una miscela lipidica.
      Tm di miscela ideale tra un fosfolipide saturo (DPPC, Tm ≈ 41 °C) e uno insaturo (DOPC, Tm ≈ −17 °C);
      il colesterolo allarga la transizione e ordina la fase fluida (fase liquido-ordinata).
      D laterale tipici: fase fluida ≈ 5–10 µm²/s, fase gel ≈ 10⁻³ µm²/s. */
  F.membraneFluidity = function (T, unsat, chol) {
    var Tm = 41 * (1 - unsat) + (-17) * unsat;
    var width = 1.2 + 30 * chol;                      // il colesterolo "spalma" la transizione
    var gel = 1 / (1 + Math.exp((T - Tm) / width));
    var Dfl = 8 * Math.exp(-3000 * (1 / (T + 273.15) - 1 / 310.15)) * Math.max(0.25, 1 - 1.6 * chol);
    var Dgel = 0.002 * (1 + 60 * chol);               // il colesterolo fluidifica la fase gel
    var logD = gel * Math.log10(Dgel) + (1 - gel) * Math.log10(Dfl);
    var D = Math.pow(10, logD);
    var state = gel > 0.7 ? (chol > 0.25 ? 'liquido-ordinato (rigido)' : 'gel (rigido)') : (gel < 0.3 ? (chol > 0.25 ? 'liquido-ordinato (fluido)' : 'fluido (liquido-disordinato)') : 'in transizione di fase');
    return { Tm: Tm, gel: gel, D: D, state: state, order: 1 - (logD + 3) / 4 };
  };

  // ================================================================ Doppio strato 3D
  F.registerSim('bilayer', {
    title: 'Il doppio strato lipidico in 3D',
    section: 'membrana',
    short: 'Fosfolipidi, colesterolo e proteine: fluidità, temperatura di transizione, asimmetria dei due foglietti, diffusione laterale e flip-flop.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { T: P.T === undefined ? 37 : P.T, unsat: P.unsat === undefined ? 0.5 : P.unsat, chol: P.chol === undefined ? 0.3 : P.chol, prot: P.prot === undefined ? true : P.prot, asym: P.asym === undefined ? true : P.asym };
      var sT = U.slider({ label: 'Temperatura', min: -10, max: 60, step: 1, value: st.T, digits: 0, unit: '°C', onInput: function (v) { st.T = v; upd(); } });
      var sU = U.slider({ label: 'Acidi grassi insaturi (doppi legami cis)', min: 0, max: 1, step: 0.05, value: st.unsat, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.unsat = v; rebuildLipids(); upd(); } });
      var sC = U.slider({ label: 'Colesterolo', min: 0, max: 0.5, step: 0.05, value: st.chol, fmt: function (v) { return Math.round(v * 100) + '%'; }, onInput: function (v) { st.chol = v; rebuildLipids(); upd(); } });
      var tP = U.toggle({ label: 'Mostra le proteine di membrana', value: st.prot, onChange: function (v) { st.prot = v; protGroup.visible = v; labels.forEach(function (l) { l.visible = v; }); } });
      var tA = U.toggle({ label: 'Colora per tipo di fosfolipide (asimmetria)', value: st.asym, onChange: function (v) { st.asym = v; rebuildLipids(); } });
      L.controls.appendChild(sT.el); L.controls.appendChild(sU.el); L.controls.appendChild(sC.el); L.controls.appendChild(tP.el); L.controls.appendChild(tA.el);
      L.controls.appendChild(el('div', { class: 'legend-inline', html: '<span style="--sw:#4a7bd0">PC</span><span style="--sw:#2bb3a3">sfingomielina</span><span style="--sw:#9b6bd6">PE</span><span style="--sw:#e05a47">PS (−)</span><span style="--sw:#e8c547">colesterolo</span><span style="--sw:#7cc36b">glicolipidi</span>' }));
      L.controls.appendChild(U.params('Modello semplificato: Tm della miscela interpolata tra DPPC (41 °C, saturo) e DOPC (−17 °C, insaturo); il colesterolo allarga la transizione e porta la membrana nella fase "liquido-ordinata". D laterale: ~5–10 µm²/s in fase fluida, ~10⁻³ µm²/s in fase gel (valori tipici FRAP). Flip-flop spontaneo: tempi di ore–giorni.'));
      var ro = U.readouts([{ key: 'st', label: 'Stato della membrana', hl: true }, { key: 'tm', label: 'Tm della miscela' }, { key: 'd', label: 'Diffusione laterale D' }, { key: 'x', label: 'Percorso medio in 1 s' }]);
      var scn = F.scene3d(L.main, { height: function (w) { return Math.min(420, Math.max(300, w * 0.6)); }, camPos: [15, 8, 19] });
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Fluidità e temperatura', xlabel: 'temperatura (°C)', ylabel: 'D laterale (µm²/s)', ylog: true, height: 200, ylim: [5e-4, 30] });
      var THREE = G.THREE, N = 12, S = 1.0, half = N * S / 2, lipids = [], labels = [];
      var heads, segA, segB, cholM, sugarM, protGroup, M = THREE && new THREE.Matrix4(), Q = THREE && new THREE.Quaternion(), E = THREE && new THREE.Euler(), V = THREE && new THREE.Vector3(), SC = THREE && new THREE.Vector3(1, 1, 1);
      var colors = { PC: 0x4a7bd0, SM: 0x2bb3a3, PE: 0x9b6bd6, PS: 0xe05a47, CH: 0xe8c547, GL: 0x7cc36b, neutral: 0x6d8fc9 };
      if (scn) {
        var nTot = N * N * 2;
        heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 14, 10), F.mat(0xffffff), nTot);
        var tailGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.95, 6); tailGeo.translate(0, -0.475, 0);
        segA = new THREE.InstancedMesh(tailGeo, F.mat(0xd9d4c5), nTot * 2);
        segB = new THREE.InstancedMesh(tailGeo.clone(), F.mat(0xd9d4c5), nTot * 2);
        var cg = new THREE.BoxGeometry(0.34, 1.5, 0.18); cg.translate(0, -0.85, 0);
        cholM = new THREE.InstancedMesh(cg, F.mat(colors.CH), nTot);
        sugarM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 8, 6), F.mat(colors.GL), 60);
        [heads, segA, segB, cholM, sugarM].forEach(function (m) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scn.scene.add(m); });
        protGroup = new THREE.Group(); scn.scene.add(protGroup); buildProteins();
        // piani d'acqua indicativi
        var water = new THREE.Mesh(new THREE.PlaneGeometry(N * S + 2, N * S + 2), new THREE.MeshBasicMaterial({ color: 0x4aa3df, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
        water.rotation.x = -Math.PI / 2; water.position.y = 3.2; scn.scene.add(water);
        var w2 = water.clone(); w2.position.y = -3.2; scn.scene.add(w2);
        var lo = new THREE.Object3D(); lo.position.set(-half - 2.5, 3.6, -half); scn.scene.add(lo); scn.label(lo, 'esterno');
        var li = new THREE.Object3D(); li.position.set(-half - 2.5, -3.6, -half); scn.scene.add(li); scn.label(li, 'citosol');
      }
      function buildProteins() {
        var redM = F.mat(0xc0504d), grM = F.mat(0x8e6cc4), orM = F.mat(0xd98c3f), teal = F.mat(0x2e9e8f);
        var add = function (mesh, x, y, z, rx) { mesh.position.set(x, y, z); if (rx) mesh.rotation.x = rx; protGroup.add(mesh); return mesh; };
        // α-elica singola (es. glicoforina)
        var h1 = add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.2, 12), redM), -3.5, 0.6, -3.5);
        // 7 segmenti transmembrana (es. rodopsina, recettore accoppiato a G)
        var g7 = new THREE.Group();
        for (var k = 0; k < 7; k++) { var a = k / 7 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 5.0, 10), grM); c.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9); g7.add(c); }
        g7.position.set(3, 0, 3); protGroup.add(g7);
        // proteina periferica sul versante citosolico (es. spettrina/anchirina)
        var per = add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), orM), 2.8, -3.4, -2.5); per.scale.set(1.3, 0.7, 1);
        // proteina ancorata al GPI (versante esterno)
        var gpi = add(new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), teal), -3, 4.1, 3.2);
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), teal), -3, 2.9, 3.2);
        labels.push(scn.label(h1, 'α-elica singola'), scn.label(g7, '7 segmenti TM'), scn.label(per, 'periferica (estrinseca)'), scn.label(gpi, 'ancorata al GPI'));
      }
      function rebuildLipids() {
        if (!scn) return;
        var rng = F.rng(11), k = 0;
        lipids = [];
        for (var leaf = 0; leaf < 2; leaf++) for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
          var r = rng(), type;
          if (r < st.chol) type = 'CH';
          else if (leaf === 0) type = rng() < 0.35 ? 'SM' : (rng() < 0.08 ? 'GL' : 'PC');
          else type = rng() < 0.35 ? 'PS' : 'PE';
          lipids.push({
            leaf: leaf, x: -half + (i + 0.5) * S + (rng() - 0.5) * 0.2, z: -half + (j + 0.5) * S + (rng() - 0.5) * 0.2,
            type: type, unsat: rng() < st.unsat, wx: 0, wz: 0, k: k++
          });
        }
        var col = new THREE.Color();
        lipids.forEach(function (l, i) {
          var c = st.asym ? (colors[l.type] || colors.PC) : (l.type === 'CH' ? colors.CH : colors.neutral);
          col.setHex(c); heads.setColorAt(i, col);
        });
        heads.instanceColor.needsUpdate = true;
      }
      var flu = F.membraneFluidity(st.T, st.unsat, st.chol);
      function place(dt) {
        if (!scn || !lipids.length) return;
        var amp = Math.max(0, Math.min(1, 1 - flu.gel)) * (st.chol > 0.25 ? 0.6 : 1);
        var vis = 1.6 * F.clamp((Math.log10(flu.D) + 3) / 4, 0.01, 1), sig = Math.sqrt(2 * vis * dt);
        var nS = 0;
        lipids.forEach(function (l, i) {
          l.x += sig * gauss(); l.z += sig * gauss();
          if (l.x > half) l.x -= 2 * half; if (l.x < -half) l.x += 2 * half;
          if (l.z > half) l.z -= 2 * half; if (l.z < -half) l.z += 2 * half;
          l.wx += (gauss() * 0.5 * amp - l.wx) * Math.min(1, dt * 8); l.wz += (gauss() * 0.5 * amp - l.wz) * Math.min(1, dt * 8);
          var up = l.leaf === 0, yH = up ? 2.25 : -2.25, sgn = up ? 1 : -1;
          V.set(l.x, yH, l.z); Q.identity(); SC.set(1, 1, 1);
          if (l.type === 'CH') SC.set(0.55, 0.55, 0.55);
          M.compose(V, Q, SC); heads.setMatrixAt(i, M);
          var tilt = flu.gel > 0.5 ? 0.12 : 0;
          for (var t = 0; t < 2; t++) {
            var idx = i * 2 + t, ox = (t === 0 ? -0.17 : 0.17);
            if (l.type === 'CH') { M.makeScale(0, 0, 0); segA.setMatrixAt(idx, M); segB.setMatrixAt(idx, M); continue; }
            E.set(up ? l.wx + tilt : Math.PI + l.wx - tilt, 0, up ? l.wz : -l.wz);
            Q.setFromEuler(E); V.set(l.x + ox, yH - sgn * 0.25, l.z); SC.set(1, 1, 1);
            M.compose(V, Q, SC); segA.setMatrixAt(idx, M);
            // seconda metà della coda: piegata se insatura (doppio legame cis)
            var kink = (t === 1 && l.unsat) ? 0.55 : 0;
            var dir = new THREE.Vector3(0, -1, 0).applyQuaternion(Q);
            V.set(l.x + ox + dir.x * 0.95, yH - sgn * 0.25 + dir.y * 0.95, l.z + dir.z * 0.95);
            E.set(E.x + l.wx * 0.8, 0, E.z + (up ? kink : -kink) + l.wz * 0.8); Q.setFromEuler(E);
            M.compose(V, Q, SC); segB.setMatrixAt(idx, M);
          }
          if (l.type === 'CH') { V.set(l.x, yH, l.z); E.set(up ? 0 : Math.PI, 0, 0); Q.setFromEuler(E); SC.set(1, 1, 1); M.compose(V, Q, SC); }
          else M.makeScale(0, 0, 0);
          cholM.setMatrixAt(i, M);
          if (l.type === 'GL' && nS < 57) {
            for (var q = 0; q < 3; q++) { M.makeTranslation(l.x + q * 0.12, yH + 0.55 + q * 0.38, l.z); sugarM.setMatrixAt(nS++, M); }
          }
        });
        for (; nS < 60; nS++) { M.makeScale(0, 0, 0); sugarM.setMatrixAt(nS, M); }
        [heads, segA, segB, cholM, sugarM].forEach(function (m) { m.instanceMatrix.needsUpdate = true; });
      }
      var rg = F.rng(5); function gauss() { return rg.gauss(); }
      function upd() {
        flu = F.membraneFluidity(st.T, st.unsat, st.chol);
        ro.set('st', flu.state); ro.set('tm', F.fmt(flu.Tm, 0) + ' °C'); ro.set('d', F.fmt(flu.D, flu.D < 0.1 ? 3 : 1) + ' µm²/s');
        ro.set('x', F.fmt(Math.sqrt(4 * flu.D * 1), 2) + ' µm');
        var Ts = F.linspace(-10, 60, 141);
        plot.update({
          series: [
            { name: 'composizione attuale', x: Ts, y: Ts.map(function (T) { return F.membraneFluidity(T, st.unsat, st.chol).D; }), color: '--c1' },
            { name: 'stessa, senza colesterolo', x: Ts, y: Ts.map(function (T) { return F.membraneFluidity(T, st.unsat, 0).D; }), color: '--faint', dash: [5, 4] },
            { x: [st.T], y: [flu.D], type: 'points', color: '--na', r: 5 }
          ], vlines: [{ x: st.T, label: F.fmt(st.T, 0) + ' °C' }]
        });
      }
      rebuildLipids(); upd();
      if (scn) scn.onFrame(place);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { sT.set(37); sU.set(0.5); sC.set(0.3); },
        narrate: function () {
          var f = F.fmt, fl = F.membraneFluidity(st.T, st.unsat, st.chol);
          var s = `Guardi il doppio strato dall'alto: in alto il foglietto <b>esterno</b> (verso l'acqua extracellulare), in basso quello <b>citosolico</b>. Le teste tonde sono idrofile e guardano l'acqua, le code idrofobiche si nascondono al centro. `, a, b = '';
          if (fl.gel > 0.7) a = `A ${f(st.T, 0)} °C la miscela è sotto la sua temperatura di transizione (T<sub>m</sub> = ${f(fl.Tm, 0)} °C): le code sono ordinate e ferme, come in un <b>gel</b>. I lipidi quasi non si spostano lateralmente (D = ${f(fl.D, fl.D < 0.1 ? 3 : 1)} µm²/s) e le proteine restano bloccate: la membrana non funziona bene.`;
          else if (fl.gel < 0.3) a = `A ${f(st.T, 0)} °C, sopra T<sub>m</sub> (${f(fl.Tm, 0)} °C), la membrana è <b>fluida</b>: le code si agitano e i lipidi diffondono lateralmente (D = ${f(fl.D, 1)} µm²/s, circa ${f(Math.sqrt(4 * fl.D), 1)} µm in un secondo). Così lipidi e proteine possono muoversi, come richiede il modello a mosaico fluido.`;
          else a = `A ${f(st.T, 0)} °C si è <b>nella zona di transizione</b> (T<sub>m</sub> = ${f(fl.Tm, 0)} °C): parte della membrana è in fase gel e parte fluida, e la diffusione cambia molto anche per piccole variazioni di temperatura.`;
          if (st.chol >= 0.2) b += ` Il <b>colesterolo</b> (blocchetti gialli) si incastra tra le code: a caldo le irrigidisce, a freddo impedisce loro di impaccarsi in un gel. Attenua l'effetto della temperatura (nel grafico la curva piena è più piatta di quella tratteggiata, senza colesterolo).`;
          if (st.unsat >= 0.6) b += ` Molte code sono <b>insature</b>: i doppi legami <i>cis</i> piegano le catene (le code spezzate che vedi), impediscono l'impaccamento e abbassano T<sub>m</sub>.`;
          else if (st.unsat <= 0.2) b += ` Le code sono quasi tutte sature: dritte, si impaccano bene e la membrana gela facilmente (T<sub>m</sub> alta).`;
          return { kind: fl.gel > 0.7 ? 'warn' : '', html: s + a + b };
        },
        experiments: [
          { label: 'Membrana fisiologica', run: function () { sT.set(37); sU.set(0.5); sC.set(0.3); }, why: `A 37 °C, con un buon numero di insaturazioni e colesterolo, la membrana è fluida e stabile.` },
          { label: 'Fredda, code sature, senza colesterolo', run: function () { sT.set(5); sU.set(0.1); sC.set(0); }, why: `Le code dritte si impaccano e la membrana <b>gela</b>: la diffusione laterale crolla di migliaia di volte.` },
          { label: 'Stessa, con colesterolo', run: function () { sT.set(5); sU.set(0.1); sC.set(0.4); }, why: `Il colesterolo si incastra tra le code e le <b>disturba</b>: la diffusione resta molto più alta di prima, anche se la membrana è fredda.` },
          { label: 'Fredda, ma molte insaturazioni', run: function () { sT.set(5); sU.set(0.9); sC.set(0); }, why: `Le code piegate non si impaccano: la membrana resta fluida anche a 5 °C. È il motivo per cui gli organismi che vivono al freddo hanno più acidi grassi insaturi.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); if (scn) scn.dispose(); } };
    }
  });

  // ================================================================ Frye & Edidin
  F.registerSim('fryeedidin', {
    title: 'Esperimento di Frye ed Edidin (1970)',
    section: 'membrana',
    short: 'Fusione di una cellula umana e una di topo: le proteine di membrana marcate si mescolano per diffusione laterale.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { T: P.T === undefined ? 37 : P.T, inhib: false, playing: true, tmin: 0, speed: 2 };
      var sT = U.slider({ label: 'Temperatura', min: 5, max: 40, step: 1, value: st.T, digits: 0, unit: '°C', onInput: function (v) { st.T = v; upd(); } });
      var tI = U.toggle({ label: 'Inibitori metabolici (niente ATP)', value: false, onChange: function (v) { st.inhib = v; upd(); } });
      var sS = U.slider({ label: 'Velocità del filmato', min: 0.5, max: 8, step: 0.5, value: 2, digits: 1, unit: 'min/s', onInput: function (v) { st.speed = v; } });
      var bP = U.button('Pausa', function () { st.playing = !st.playing; bP.textContent = st.playing ? 'Pausa' : 'Riprendi'; });
      var bR = U.button('Nuova fusione', function () { reset(); }, 'primary');
      L.controls.appendChild(sT.el); L.controls.appendChild(tI.el); L.controls.appendChild(sS.el);
      L.controls.appendChild(el('div', { class: 'btn-row' }, [bR, bP]));
      L.controls.appendChild(el('div', { class: 'legend-inline', html: '<span style="--sw:#e05a47">proteine umane (rodamina)</span><span style="--sw:#3cb46e">proteine di topo (fluoresceina)</span>' }));
      L.controls.appendChild(U.params('Cellula sferica di raggio 7,5 µm. Coefficiente di diffusione delle proteine di membrana ≈ 0,03 µm²/s a 37 °C (ordine di grandezza misurato), dipendente dalla temperatura (Arrhenius) e con forte rallentamento sotto ~18 °C (transizione dei lipidi). Il mescolamento non richiede ATP: è diffusione passiva.'));
      var ro = U.readouts([{ key: 't', label: 'Tempo dalla fusione', hl: true }, { key: 'm', label: 'Mescolamento' }, { key: 'd', label: 'D proteine' }]);
      var scn = F.scene3d(L.main, { height: 320, camPos: [0, 6, 24] });
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: '% di cellule ibride "a mosaico" (indice di mescolamento)', xlabel: 'minuti dalla fusione', ylabel: 'mescolamento (%)', height: 170, xlim: [0, 60], ylim: [0, 100] });
      var THREE = G.THREE, R = 7.5, Np = 350, red = [], grn = [], hist = { t: [], m: [] }, rng = F.rng(21), D = 0.03;
      var ptsR, ptsG;
      if (scn) {
        var sph = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 40, 28), new THREE.MeshStandardMaterial({ color: 0x9aa7b8, transparent: true, opacity: 0.35, roughness: 0.9 }));
        scn.scene.add(sph);
        var mk = function (color) {
          var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Np * 3), 3));
          var p = new THREE.Points(g, new THREE.PointsMaterial({ color: color, size: 0.42, sizeAttenuation: true })); scn.scene.add(p); return p;
        };
        ptsR = mk(0xe05a47); ptsG = mk(0x3cb46e);
      }
      function randOnCap(sign) {
        var v; do { v = [rng.gauss(), rng.gauss(), rng.gauss()]; } while (v[1] * sign <= 0.05);
        var n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n * R, v[1] / n * R, v[2] / n * R];
      }
      function reset() { red = []; grn = []; for (var i = 0; i < Np; i++) { red.push(randOnCap(1)); grn.push(randOnCap(-1)); } st.tmin = 0; hist = { t: [0], m: [0] }; }
      function Dof(T) {
        var arr = 0.03 * Math.exp(-7000 * (1 / (T + 273.15) - 1 / 310.15));
        var gel = 1 / (1 + Math.exp((T - 18) / 1.5));
        return Math.pow(10, gel * Math.log10(2e-4) + (1 - gel) * Math.log10(arr));
      }
      function step(pts, dtmin) {
        var s = Math.sqrt(2 * D * dtmin * 60);
        pts.forEach(function (p) {
          p[0] += s * rng.gauss(); p[1] += s * rng.gauss(); p[2] += s * rng.gauss();
          var n = Math.hypot(p[0], p[1], p[2]); p[0] *= R / n; p[1] *= R / n; p[2] *= R / n;
        });
      }
      function mixing() { var s = 0; red.forEach(function (p) { s += p[1] / R; }); return Math.max(0, Math.min(100, (1 - (s / red.length) / 0.5) * 100)); }
      function upd() { D = Dof(st.T); ro.set('d', F.fmt(D, 4) + ' µm²/s'); }
      function frame(dt) {
        if (st.playing && st.tmin < 60) {
          var dtm = dt * st.speed, n = Math.ceil(dtm / 0.25);
          for (var k = 0; k < n; k++) { step(red, dtm / n); step(grn, dtm / n); }
          st.tmin += dtm; hist.t.push(st.tmin); hist.m.push(mixing());
          if (hist.t.length % 5 === 0) plot.update({ series: [{ x: hist.t, y: hist.m, color: '--c1' }] });
        }
        if (scn) {
          [[ptsR, red], [ptsG, grn]].forEach(function (pp) {
            var a = pp[0].geometry.attributes.position.array;
            pp[1].forEach(function (p, i) { a[3 * i] = p[0]; a[3 * i + 1] = p[1]; a[3 * i + 2] = p[2]; });
            pp[0].geometry.attributes.position.needsUpdate = true;
          });
        }
        ro.set('t', F.fmt(st.tmin, 0) + ' min'); ro.set('m', F.fmt(mixing(), 0) + '%');
      }
      reset(); upd();
      var loop = null;
      if (scn) scn.onFrame(frame); else loop = U.loop(L.main, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var feSet = function (T, inhib) { sT.set(T); tI.set(inhib); sS.set(4); reset(); };
      U.explainer(L, {
        poll: 500,
        legend: [['#e05a47', 'puntini rossi: proteine della cellula umana'], ['#3cb46e', 'puntini verdi: proteine della cellula di topo']],
        narrate: function () {
          var f = F.fmt, D = Dof(st.T), m = mixing();
          var s = `Una cellula umana e una di topo sono state fuse in un'unica cellula: all'inizio le loro proteine di membrana stanno in due metà separate. `;
          if (st.T <= 20) return { kind: 'warn', html: s + `A ${f(st.T, 0)} °C i lipidi si avvicinano alla fase gel: la diffusione laterale delle proteine è lentissima (D = ${f(D, 4)} µm²/s) e dopo ${f(st.tmin, 0)} min il mescolamento è solo del ${f(m, 0)}%. Nell'esperimento reale a bassa temperatura le due popolazioni restavano separate.` };
          return s + `Le proteine <b>diffondono lateralmente</b> nel doppio strato fluido (D = ${f(D, 3)} µm²/s) e si mescolano: dopo ${f(st.tmin, 0)} min il mescolamento è del ${f(m, 0)}%. ${st.inhib ? `Gli <b>inibitori metabolici</b> tolgono l'ATP, ma il mescolamento procede lo stesso: è diffusione passiva, non un trasporto che consuma energia.` : `Nell'esperimento reale a 37 °C il mescolamento era completo in circa 40 minuti.`}`;
        },
        experiments: [
          { label: '37 °C', run: function () { feSet(37, false); }, why: `Le proteine diffondono nel doppio strato fluido e le due «metà» si mescolano.` },
          { label: '15 °C', run: function () { feSet(15, false); }, why: `Con i lipidi quasi in fase gel le proteine si muovono pochissimo: dopo lo stesso tempo il mescolamento è molto minore. La fluidità della membrana dipende dalla temperatura.` },
          { label: 'Senza ATP a 37 °C', run: function () { feSet(37, true); }, why: `Il mescolamento avviene allo stesso modo: la diffusione laterale è <b>passiva</b>, non richiede energia metabolica.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ Forma dei lipidi e strutture
  F.registerSim('packing', {
    title: 'Forma dei lipidi: micelle o doppi strati?',
    section: 'membrana',
    short: 'Il parametro di impaccamento P = v/(a·l) decide se le molecole anfipatiche formano micelle, doppi strati o strutture invertite.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { a: 0.65, v: 1.0, l: 1.75 };
      var presets = {
        lyso: ['Detergente / lisofosfolipide (1 coda)', 0.85, 0.4, 1.5],
        pc: ['Fosfatidilcolina (PC, 2 code)', 0.65, 1.0, 1.75],
        pe: ['Fosfatidiletanolammina (PE, testa piccola)', 0.42, 1.0, 1.6]
      };
      var pSel = U.select({ label: 'Molecola', value: 'pc', options: Object.keys(presets).map(function (k) { return [k, presets[k][0]]; }), onChange: function (k) { sA.set(presets[k][1]); sV.set(presets[k][2]); sL.set(presets[k][3]); } });
      var sA = U.slider({ label: 'Area della testa polare a', min: 0.3, max: 1.0, step: 0.01, value: st.a, digits: 2, unit: 'nm²', onInput: function (v) { st.a = v; upd(); } });
      var sV = U.slider({ label: 'Volume delle code v', min: 0.3, max: 1.4, step: 0.01, value: st.v, digits: 2, unit: 'nm³', onInput: function (v) { st.v = v; upd(); } });
      var sL = U.slider({ label: 'Lunghezza delle code l', min: 1.2, max: 2.2, step: 0.01, value: st.l, digits: 2, unit: 'nm', onInput: function (v) { st.l = v; upd(); } });
      [pSel.el, sA.el, sV.el, sL.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Regola di Israelachvili: P &lt; 1/3 micelle sferiche; 1/3–1/2 micelle cilindriche; 1/2–1 doppi strati (vescicole, membrane); P &gt; 1 strutture invertite (esagonale H<sub>II</sub>). Dimensioni tipiche dei fosfolipidi.'));
      var ro = U.readouts([{ key: 'p', label: 'Parametro di impaccamento P', hl: true }, { key: 's', label: 'Struttura spontanea in acqua' }]);
      L.main.appendChild(ro.el);
      var holder = el('div'); L.main.appendChild(holder);
      var Pv = 1;
      var cv = U.canvas2d(holder, 260, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var head = css('--c1'), tail = css('--muted');
        // forma della molecola
        var cx = 90, top = 50, hl = 120, aw = 26 * Math.sqrt(st.a / 0.65);
        var bw = aw * Math.min(2.2, Math.max(0.15, Pv)); // larghezza in fondo alle code ∝ P
        ctx.fillStyle = tail; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(cx - aw, top + 22); ctx.lineTo(cx + aw, top + 22); ctx.lineTo(cx + bw, top + 22 + hl); ctx.lineTo(cx - bw, top + 22 + hl); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = head; ctx.beginPath(); ctx.arc(cx, top + 10, 16 * Math.sqrt(st.a / 0.65), 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = css('--text'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'center';
        ctx.fillText(Pv < 0.5 ? 'forma a cono' : (Pv <= 1 ? 'forma a cilindro' : 'cono invertito'), cx, h - 20);
        // struttura
        var sx = Math.max(240, w * 0.45) + (w - Math.max(240, w * 0.45)) / 2, sy = h / 2, n, i, ang, r;
        var mol = function (x, y, a, len, inv) {
          ctx.strokeStyle = tail; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
          ctx.fillStyle = head; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
        };
        if (Pv < 0.5) { // micella
          n = 22; r = 70;
          for (i = 0; i < n; i++) { ang = i / n * 2 * Math.PI; mol(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r, ang + Math.PI, 55); }
        } else if (Pv <= 1) { // doppio strato
          n = Math.floor((w - (sx - 150)) / 16);
          for (i = 0; i < 14; i++) { var x = sx - 110 + i * 16; mol(x, sy - 52, Math.PI / 2, 44); mol(x, sy + 52, -Math.PI / 2, 44); }
        } else { // micella invertita / esagonale
          n = 16; r = 40;
          for (i = 0; i < n; i++) { ang = i / n * 2 * Math.PI; mol(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r, ang, 50); }
          ctx.fillStyle = css('--c1'); ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(sx, sy, r - 8, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = css('--muted'); ctx.fillText('acqua', sx, 18);
      });
      function upd() {
        Pv = st.v / (st.a * st.l);
        ro.set('p', F.fmt(Pv, 2));
        ro.set('s', Pv < 1 / 3 ? 'micella sferica' : (Pv < 0.5 ? 'micella cilindrica' : (Pv <= 1 ? 'doppio strato (membrana, vescicola)' : 'struttura invertita (esagonale H<sub>II</sub>)')));
        cv.redraw();
      }
      upd();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      U.explainer(L, {
        watch: ro,
        base: function () { pSel.set('pc'); },
        narrate: function () {
          var f = F.fmt, P = st.v / (st.a * st.l);
          var s = `La molecola ha una testa polare di area <b>a</b> = ${f(st.a, 2)} nm², code di volume <b>v</b> = ${f(st.v, 2)} nm³ e lunghezza <b>l</b> = ${f(st.l, 2)} nm. Il parametro di impaccamento P = v/(a·l) = <b>${f(P, 2)}</b> descrive la sua forma. `;
          if (P < 1 / 3) return s + `P &lt; 1/3: la testa è molto larga rispetto alla coda, la molecola ha forma di <b>cono</b>. Per nascondere le code all'acqua serve una forte curvatura: si formano <b>micelle sferiche</b> (come i detergenti e i lisofosfolipidi, che hanno una sola coda).`;
          if (P < 0.5) return s + `1/3 &lt; P &lt; 1/2: forma a cono troncato, si formano <b>micelle cilindriche</b>.`;
          if (P <= 1) return { kind: 'ok', html: s + `½ &lt; P ≤ 1: testa e code hanno sezioni simili, la molecola è un <b>cilindro</b>. Si affiancano in due strati con le code nascoste al centro: <b>doppio strato</b>, la struttura delle membrane (fosfatidilcolina e sfingomielina).` };
          return s + `P &gt; 1: la testa è piccola rispetto alle code, un <b>cono rovesciato</b>. Queste molecole curvano la membrana in senso opposto e formano strutture invertite (fase esagonale H<sub>II</sub>); la fosfatidiletanolammina, con la testa piccola, ne è l'esempio.`;
        },
        experiments: [
          { label: 'Fosfatidilcolina (due code)', run: function () { pSel.set('pc'); }, why: `Testa e code hanno sezioni simili: forma cilindrica, <b>doppio strato</b>.` },
          { label: 'Detergente (una coda)', run: function () { pSel.set('lyso'); }, why: `Con una sola coda il volume delle code è piccolo rispetto alla testa: forma conica, <b>micelle</b>. Per questo i detergenti sciolgono le membrane.` },
          { label: 'Fosfatidiletanolammina', run: function () { pSel.set('pe'); }, why: `La testa piccola avvicina P a 1 e oltre: queste molecole tendono a curvare la membrana, utile nei processi di fusione e gemmazione.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
