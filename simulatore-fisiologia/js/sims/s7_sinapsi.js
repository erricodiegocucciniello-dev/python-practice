/* Sezione 7 — Sinapsi (lezioni 22–24). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Sinapsi elettrica vs chimica
  F.registerSim('elettricachimica', {
    title: 'Sinapsi elettrica e sinapsi chimica a confronto',
    section: 'sinapsi',
    short: 'Giunzioni comunicanti: trasmissione immediata, bidirezionale, attenuata. Sinapsi chimica: ritardo sinaptico, unidirezionale, il segnale può essere amplificato o invertito.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 'el', gc: 5, rect: false, from: 1, chemE: 0, chemG: 6 };
      var tSel = U.seg({ label: 'Tipo di sinapsi', value: st.type, options: [['el', 'Elettrica (gap junction)'], ['ch', 'Chimica']], onChange: function (v) { st.type = v; vis(); run(); } });
      var fSel = U.seg({ label: 'Stimolo applicato alla cellula', value: 1, options: [[1, 'Cellula 1'], [2, 'Cellula 2']], onChange: function (v) { st.from = +v; run(); } });
      var sGc = U.slider({ label: 'Conduttanza della giunzione (connessoni)', min: 0, max: 30, step: 0.5, value: st.gc, digits: 1, unit: 'nS', onInput: function (v) { st.gc = v; run(); } });
      var tR = U.toggle({ label: 'Giunzione rettificante (passa in un solo verso)', value: false, onChange: function (v) { st.rect = v; run(); } });
      var sCE = U.seg({ label: 'Recettore postsinaptico', value: 0, options: [[0, 'Eccitatorio (E = 0 mV)'], [-75, 'Inibitorio (E = −75 mV)']], onChange: function (v) { st.chemE = +v; run(); } });
      var sCG = U.slider({ label: 'Efficacia sinaptica (conduttanza)', min: 0, max: 30, step: 0.5, value: st.chemG, digits: 1, unit: 'nS', onInput: function (v) { st.chemG = v; run(); } });
      [tSel.el, fSel.el, sGc.el, tR.el, sCE.el, sCG.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Due cellule passive (100 MΩ, 100 pF). Elettrica: corrente di giunzione $g_c(V_1 - V_2)$; coefficiente di accoppiamento a regime $k = g_c/(g_c + g_L)$. Chimica: il potenziale d\'azione presinaptico (Hodgkin-Huxley, 18,5 °C) dopo un ritardo sinaptico di 0,5 ms (ingresso di Ca²⁺, esocitosi, diffusione) attiva una conduttanza postsinaptica (funzione alfa, τ = 1,5 ms).'));
      U.texify(L.controls);
      var fig = F.figs.synapse(L.main);
      var ro = U.readouts([{ key: 'a', label: '', hl: true }, { key: 'b', label: '' }, { key: 'c', label: '' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Potenziale delle due cellule', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 260 });
      var labs = function (a, b, c) { var n = ro.el.querySelectorAll('.rl'); n[0].innerHTML = a; n[1].innerHTML = b; n[2].innerHTML = c; };
      function vis() {
        [sGc.el, tR.el].forEach(function (e) { e.style.display = st.type === 'el' ? '' : 'none'; });
        [sCE.el, sCG.el].forEach(function (e) { e.style.display = st.type === 'ch' ? '' : 'none'; });
      }
      function run() {
        if (st.type === 'el') {
          var r = F.gapPair({ gc: st.gc, rectify: st.rect, inject: st.from, I: function (t) { return t > 5 && t < 45 ? 150 : 0; }, tmax: 60 });
          plot.update({ series: [{ name: 'cellula 1', x: r.t, y: r.V1, color: '--c1' }, { name: 'cellula 2', x: r.t, y: r.V2, color: '--na' }], ylim: [-70, -40] });
          fig.set({ type: 'el', t1: r.t, V1: r.V1, t2: r.t, V2: r.V2, tmax: 60, gc: st.gc, rect: st.rect, from: st.from }); fig.restart();
          var i = Math.floor(r.t.length * 0.7), dv1 = r.V1[i] + 65, dv2 = r.V2[i] + 65;
          labs('Coefficiente di accoppiamento', 'Ritardo', 'Direzione');
          ro.set('a', F.fmt(st.from === 1 ? dv2 / dv1 : dv1 / dv2, 2));
          ro.set('b', 'nessuno (&lt; 0,1 ms)'); ro.set('c', st.rect ? 'solo da 1 a 2 (rettificante)' : 'bidirezionale');
        } else {
          var hh = F.HH.simulate({ p: Object.assign(F.HH.defaults(), { T: 18.5 }), tmax: 40, I: function (t) { return st.from === 1 && t >= 5 && t < 5.5 ? 40 : 0; }, every: 1 });
          var tPk = null; for (var k = 1; k < hh.V.length - 1; k++) if (hh.V[k] > 0 && hh.V[k] > hh.V[k - 1] && hh.V[k] >= hh.V[k + 1]) { tPk = hh.t[k]; break; }
          var syns = tPk !== null ? [{ g: st.chemG, E: st.chemE, t0: tPk + 0.5, tau: 1.5 }] : [];
          var post = F.pspCell({ syns: syns, tmax: 40, Vrest: -65 });
          if (st.from === 2) post = F.pspCell({ syns: [], tmax: 40 });
          var inj2 = st.from === 2 ? F.gapPair({ gc: 0, inject: 2, I: function (t) { return t > 5 && t < 25 ? 150 : 0; }, tmax: 40 }) : null;
          plot.update({ series: [{ name: 'presinaptica (cellula 1)', x: hh.t, y: hh.V, color: '--c1' }, { name: 'postsinaptica (cellula 2)', x: inj2 ? inj2.t : post.t, y: inj2 ? inj2.V2 : post.V, color: '--na' }], ylim: [-85, 50], vlines: tPk !== null ? [{ x: tPk, label: 'picco presinaptico' }, { x: tPk + 0.5, label: 'risposta', dy: 14 }] : [] });
          fig.set({ type: 'ch', t1: hh.t, V1: hh.V, t2: inj2 ? inj2.t : post.t, V2: inj2 ? inj2.V2 : post.V, tmax: 40, t0: tPk !== null && st.from === 1 ? tPk + 0.5 : -1e9, from: st.from, E: st.chemE, tau: 1.5 }); fig.restart();
          var amp = Math.max.apply(null, post.V) + 65, amin = Math.min.apply(null, post.V) + 65;
          labs('Potenziale postsinaptico', 'Ritardo sinaptico', 'Direzione');
          ro.set('a', st.from === 2 ? 'la cellula 1 non risponde' : (st.chemE === 0 ? 'PPSE +' + F.fmt(amp, 1) + ' mV' : 'PPSI ' + F.fmt(amin, 1) + ' mV'));
          ro.set('b', '≈ 0,5 ms'); ro.set('c', 'solo pre → post');
        }
      }
      vis(); run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var ecBase = function () { tSel.set('el'); fSel.set(1); sGc.set(5); tR.set(false); sCE.set(0); sCG.set(6); };
      U.explainer(L, {
        watch: ro,
        base: ecBase,
        legend: [['--c1', 'cellula 1 (presinaptica o stimolata)'], ['--na', 'cellula 2 (postsinaptica)']],
        narrate: function () {
          var f = F.fmt, sn = ro.snapshot();
          if (st.type === 'el') return `Le due cellule sono unite da <b>giunzioni comunicanti</b> (connessoni): canali che collegano direttamente i due citoplasmi. Inietto corrente nella cellula ${st.from}: una parte passa attraverso la giunzione (g<sub>c</sub> = ${f(st.gc, 1)} nS) e depolarizza anche l'altra cellula. Il rapporto tra le due risposte è il <b>coefficiente di accoppiamento</b>, k = ${sn[0].value}. Non c'è nessun trasmettitore e nessun ritardo misurabile: passa la corrente stessa. ${st.rect ? `La giunzione è <b>rettificante</b>: conduce bene in un verso e poco nell'altro.` : `La trasmissione è <b>bidirezionale</b>.`} Il segnale arriva sempre <b>attenuato</b> (k &lt; 1) e con lo stesso segno.${st.gc < 1 ? ' Con la giunzione quasi chiusa le due cellule sono praticamente isolate.' : ''}`;
          if (st.from === 2) return `Sinapsi <b>chimica</b>: stimolo la cellula 2, ma la cellula 1 non risponde. La trasmissione chimica è <b>unidirezionale</b>: il trasmettitore è liberato solo dal terminale presinaptico e agisce solo sui recettori postsinaptici.`;
          return `Sinapsi <b>chimica</b>: il PdA presinaptico (blu) apre i canali Ca²⁺ e fa liberare il trasmettitore. Dopo un <b>ritardo sinaptico</b> di circa 0,5 ms il trasmettitore attiva i recettori postsinaptici, il cui potenziale di inversione è ${st.chemE === 0 ? '0 mV (eccitatori)' : '−75 mV (inibitori)'}. Risposta postsinaptica: ${sn[0].value}. ${st.chemE === 0 ? 'È un PPSE: depolarizza la cellula verso la soglia.' : 'È un PPSI: iperpolarizza la cellula e la allontana dalla soglia.'} Un PdA di 100 mV produce una risposta di pochi mV, che può essere resa più grande o più piccola cambiando l'efficacia della sinapsi: la sinapsi chimica può <b>amplificare, attenuare o invertire</b> il segnale.`;
        },
        experiments: [
          { label: 'Sinapsi elettrica', run: function () { ecBase(); }, why: `Corrente che passa direttamente da una cellula all'altra: la risposta della cellula 2 è una copia più piccola e più lenta di quella della cellula 1.` },
          { label: 'Giunzione forte (20 nS)', run: function () { ecBase(); sGc.set(20); }, why: `Più connessoni aperti = più corrente passa: il coefficiente di accoppiamento si avvicina a 1 e le due cellule si comportano quasi come una sola.` },
          { label: 'Giunzione quasi chiusa (0,5 nS)', run: function () { ecBase(); sGc.set(0.5); }, why: `Con pochissima corrente trasferita la cellula 2 quasi non risponde: la chiusura delle giunzioni (acidificazione, Ca²⁺) isola le cellule danneggiate.` },
          { label: 'Rettificante: stimolo dalla cellula 1', run: function () { ecBase(); tR.set(true); }, why: `Nella giunzione rettificante la corrente passa bene da 1 a 2: l'accoppiamento è quello normale.` },
          { label: 'Rettificante: stimolo dalla cellula 2', run: function () { ecBase(); tR.set(true); fSel.set(2); }, why: `Nel verso opposto (da 2 a 1) la giunzione conduce solo il 10%: la cellula 1 quasi non risponde. Le sinapsi elettriche non sono sempre simmetriche.` },
          { label: 'Chimica eccitatoria', run: function () { ecBase(); tSel.set('ch'); }, why: `Si vede il <b>ritardo sinaptico</b> tra il picco presinaptico e l'inizio della risposta, e la risposta è una depolarizzazione lenta.` },
          { label: 'Chimica inibitoria', base: function () { ecBase(); tSel.set('ch'); }, run: function () { ecBase(); tSel.set('ch'); sCE.set(-75); }, why: `Lo stesso PdA presinaptico produce un'iperpolarizzazione: il segno dipende dal recettore (potenziale di inversione), non dal PdA.` },
          { label: 'Chimica: stimolo dalla cellula 2', base: function () { ecBase(); tSel.set('ch'); }, run: function () { ecBase(); tSel.set('ch'); fSel.set(2); }, why: `La cellula 1 non risponde: la sinapsi chimica è <b>unidirezionale</b>, a differenza di quella elettrica.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { fig.dispose(); plot.dispose(); } };
    }
  });

  // ================================================================ Sinapsi chimica 3D
  F.registerSim('sinapsi3d', {
    title: 'La sinapsi chimica in 3D: dal Ca²⁺ al recettore',
    section: 'sinapsi',
    short: 'Arrivo del PdA, canali Ca²⁺ voltaggio-dipendenti, esocitosi (SNARE e sinaptotagmina), diffusione del trasmettitore nella fessura, legame ai recettori, inattivazione e riciclo.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { nt: P.nt || 'ach', blockCa: false, botox: false, neo: false, lowCa: false, phase: -1, t: 0, slow: 1 };
      var nts = { ach: ['Acetilcolina (inattivata dall\'AChE)', 0x7cc36b], glu: ['Glutammato (ricaptazione da EAAT)', 0xe8a33c], gaba: ['GABA (ricaptazione da GAT)', 0x4aa3df] };
      var nSel = U.select({ label: 'Neurotrasmettitore', value: st.nt, options: Object.keys(nts).map(function (k) { return [k, nts[k][0]]; }), onChange: function (v) { st.nt = v; reset(); } });
      var bGo = U.button('Invia un potenziale d\'azione', function () { fire(); }, 'primary');
      var tCa = U.toggle({ label: 'Blocca i canali Ca²⁺ (ω-conotossina / Cd²⁺)', value: false, onChange: function (v) { st.blockCa = v; } });
      var tLo = U.toggle({ label: 'Ca²⁺ extracellulare basso', value: false, onChange: function (v) { st.lowCa = v; } });
      var tBx = U.toggle({ label: 'Tossina botulinica (taglia SNAP-25)', value: false, onChange: function (v) { st.botox = v; } });
      var tNe = U.toggle({ label: 'Neostigmina (inibisce l\'AChE)', value: false, onChange: function (v) { st.neo = v; } });
      [nSel.el, bGo, tCa.el, tLo.el, tBx.el, tNe.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Tempi reali (mostrati nel riquadro): ingresso di Ca²⁺ ≈ 0,2 ms dopo l\'arrivo del PdA; esocitosi entro ~0,1–0,3 ms; diffusione nella fessura (50 nm alla placca) ≈ 1–2 µs ($t = x^2/2D$); ritardo sinaptico totale ≈ 0,5 ms. L\'animazione è rallentata in modo diverso per ogni fase. Esocitosi: la chiusura (zippering) del complesso SNARE (sinaptobrevina, sintassina, SNAP-25) fornisce l\'energia per la fusione; la sinaptotagmina è il sensore del Ca²⁺; NSF e α-SNAP smontano gli SNARE <i>dopo</i> la fusione, per riciclarli. La tossina botulinica A/E taglia SNAP-25; la tetanica e la botulinica B taglia la sinaptobrevina.'));
      U.texify(L.controls);
      var status = U.status();
      var scn = F.scene3d(L.main, { height: function (w) { return Math.min(420, Math.max(320, w * 0.6)); }, camPos: [0, 0.2, 9], target: [0, 0.4, 0] });
      L.main.appendChild(status.el);
      var ro = U.readouts([{ key: 'v', label: 'Vescicole liberate', hl: true }, { key: 'r', label: 'Recettori attivati' }, { key: 'tt', label: 'Tempo reale dall\'arrivo del PdA' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Risposta postsinaptica', xlabel: 'tempo reale (ms)', ylabel: 'ΔVm (mV)', height: 160, xlim: [0, 12] });
      var THREE = G.THREE, term, ves = [], caCh = [], rec = [], nt = [], ca = [], transp = [], ache = [], fused = 0, tReal = 0, trace = { t: [], v: [] };
      var cleftY = -0.4, cleftH = 1.0; // fessura (scala non reale: in realtà 20–50 nm)
      if (scn) {
        term = new THREE.Mesh(new THREE.SphereGeometry(3.2, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe9d8a6, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
        term.position.y = cleftY + cleftH / 2; scn.scene.add(term); // cupola del bottone sopra la fessura
        var termBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.12, 40), new THREE.MeshStandardMaterial({ color: 0xd9c9a3, transparent: true, opacity: 0.6 }));
        termBase.position.y = cleftY + cleftH / 2; scn.scene.add(termBase);
        var post = new THREE.Mesh(new THREE.BoxGeometry(9, 0.3, 5), new THREE.MeshStandardMaterial({ color: 0xc9b6e0, transparent: true, opacity: 0.7 }));
        post.position.y = cleftY - cleftH / 2 - 0.15; scn.scene.add(post);
        var axon = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3, 20), new THREE.MeshStandardMaterial({ color: 0xe9d8a6, transparent: true, opacity: 0.5 })); axon.position.y = 4.3; scn.scene.add(axon);
        for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.35, 10), F.mat(0xb8860b)); c.position.set(Math.cos(a) * 1.9, cleftY + cleftH / 2, Math.sin(a) * 1.2); scn.scene.add(c); caCh.push(c); }
        for (i = 0; i < 14; i++) { var r = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.4, 10), F.mat(0x8e6cc4)); r.position.set(-2.4 + (i % 7) * 0.8, cleftY - cleftH / 2 + 0.05, -0.8 + Math.floor(i / 7) * 1.6); scn.scene.add(r); rec.push(r); }
        for (i = 0; i < 3; i++) { var tr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), F.mat(0x2e9e8f)); tr.position.set(-2.7 + i * 2.7, cleftY + cleftH / 2 - 0.05, 1.9); scn.scene.add(tr); transp.push(tr); }
        for (i = 0; i < 4; i++) { var ae = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 12), F.mat(0xd9480f)); ae.position.set(-2.2 + i * 1.5, cleftY - 0.05, -1.7); ae.rotation.x = Math.PI / 2; scn.scene.add(ae); ache.push(ae); }
        var lab = function (obj, txt) { scn.label(obj, txt, true); };
        var anc = function (x, y, z) { var o = new THREE.Object3D(); o.position.set(x, y, z); scn.scene.add(o); return o; };
        lab(anc(-3.9, 0.55, 1.3), 'canale Ca²⁺ (tipo N, P/Q)'); lab(anc(0.3, -1.45, 2.4), 'recettori postsinaptici'); lab(axon, 'terminale presinaptico');
        st.labT = scn.label(transp[2], 'trasportatore', true); st.labA = scn.label(ache[0], 'AChE', true);
        st.labTr = transp; st.labAe = ache;
      }
      function reset() {
        if (!scn) return;
        ves.forEach(function (v) { scn.scene.remove(v); }); nt.forEach(function (m) { scn.scene.remove(m); }); ca.forEach(function (m) { scn.scene.remove(m); });
        ves = []; nt = []; ca = []; fused = 0; st.phase = -1; tReal = 0; trace = { t: [], v: [] };
        var col = nts[st.nt][1];
        for (var i = 0; i < 18; i++) {
          var dock = i < 6, v = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.85 }));
          if (dock) v.position.set(-2 + i * 0.8, cleftY + cleftH / 2 + 0.38, (i % 2) * 0.5 - 0.25);
          else v.position.set((Math.random() - 0.5) * 3.6, 1.2 + Math.random() * 1.6, (Math.random() - 0.5) * 2.4);
          v.userData = { dock: dock, home: v.position.clone() }; scn.scene.add(v); ves.push(v);
        }
        transp.forEach(function (t) { t.visible = st.nt !== 'ach'; }); ache.forEach(function (t) { t.visible = st.nt === 'ach'; });
        if (st.labT) { st.labT.visible = st.nt !== 'ach'; st.labA.visible = st.nt === 'ach'; }
        rec.forEach(function (r) { r.material.color.setHex(0x8e6cc4); });
        plot.update({ series: [] });
        status.set('Pronto. Premi "Invia un potenziale d\'azione".', '');
      }
      function fire() { if (!scn) return; reset(); st.phase = 0; st.t = 0; tReal = 0; }
      var NT = null;
      function frame(dt) {
        if (!scn || st.phase < 0) return;
        st.t += dt;
        var T = st.t, col = nts[st.nt][1];
        // fase 0: arriva il PdA (0 → 0,2 ms reali)
        if (st.phase === 0) {
          tReal = Math.min(0.2, T / 1.2 * 0.2);
          term.material.color.setHex(T % 0.3 < 0.15 ? 0xffb38a : 0xe9d8a6);
          status.set('<b>1.</b> Il potenziale d\'azione invade il terminale e lo depolarizza.', '');
          if (T > 1.2) { st.phase = 1; st.t = 0; term.material.color.setHex(0xe9d8a6); }
        } else if (st.phase === 1) {
          tReal = 0.2 + Math.min(0.15, T / 1.2 * 0.15);
          if (st.blockCa) { status.set('<b>2.</b> I canali Ca²⁺ sono bloccati: niente ingresso di Ca²⁺, <b>niente rilascio</b>.', 'bad'); if (T > 1.5) st.phase = -1; return; }
          status.set('<b>2.</b> I canali Ca²⁺ voltaggio-dipendenti si aprono: il Ca²⁺ entra (≈100 nM → ≈10–100 µM vicino ai canali).', '');
          caCh.forEach(function (c) { c.material.color.setHex(0xffd84a); });
          if (ca.length < (st.lowCa ? 6 : 24) && Math.random() < 0.6) {
            var c0 = caCh[Math.floor(Math.random() * caCh.length)], m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), F.mat(0xffd84a));
            m.position.copy(c0.position); m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6); scn.scene.add(m); ca.push(m);
          }
          if (T > 1.4) { st.phase = 2; st.t = 0; caCh.forEach(function (c) { c.material.color.setHex(0xb8860b); }); }
        } else if (st.phase === 2) {
          tReal = 0.35 + Math.min(0.15, T / 1.6 * 0.15);
          if (st.botox) { status.set('<b>3.</b> La tossina botulinica ha tagliato SNAP-25: il complesso SNARE non si chiude, <b>le vescicole non si fondono</b>.', 'bad'); if (T > 1.6) st.phase = -1; return; }
          status.set('<b>3.</b> Il Ca²⁺ si lega alla sinaptotagmina: il complesso SNARE si chiude e le vescicole ancorate si fondono (esocitosi).', '');
          var nFuse = st.lowCa ? 1 : 4;
          ves.forEach(function (v, i) {
            if (!v.userData.dock || i >= nFuse) return;
            v.position.y = v.userData.home.y - Math.min(1, T / 1.2) * 0.45;
            v.scale.setScalar(Math.max(0.05, 1 - Math.max(0, T - 0.8) / 0.8));
          });
          if (T > 1.6) {
            st.phase = 3; st.t = 0; fused = nFuse;
            ves.forEach(function (v, i) { if (v.userData.dock && i < nFuse) { v.visible = false; for (var k = 0; k < 12; k++) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), F.mat(col)); m.position.set(v.userData.home.x + (Math.random() - 0.5) * 0.3, cleftY + cleftH / 2 - 0.05, v.userData.home.z + (Math.random() - 0.5) * 0.3); m.userData = { bound: false, life: 0 }; scn.scene.add(m); nt.push(m); } } });
          }
        } else if (st.phase === 3) {
          tReal = 0.5 + T / 3 * 0.002;
          status.set('<b>4.</b> Le molecole di trasmettitore diffondono nella fessura (≈1–2 µs) e si legano ai recettori, che si aprono.', '');
          if (T > 2.5) { st.phase = 4; st.t = 0; }
        } else if (st.phase === 4) {
          tReal = 0.5 + Math.min(11.5, T / 6 * 11.5);
          status.set(st.nt === 'ach' ? (st.neo ? '<b>5.</b> Con la neostigmina l\'AChE è inibita: l\'ACh resta nella fessura e la risposta si prolunga.' : '<b>5.</b> L\'acetilcolinesterasi idrolizza l\'ACh in colina + acetato in meno di 1 ms; la colina viene ricaptata.') : '<b>5.</b> Il trasmettitore viene rimosso per ricaptazione (trasportatori Na⁺-dipendenti) e diffusione.', '');
          if (T > 6) { st.phase = 5; st.t = 0; }
        } else if (st.phase === 5) {
          status.set('<b>6.</b> Le membrane delle vescicole vengono recuperate per endocitosi e le vescicole ricaricate (pompa H⁺ + antiporto).', 'ok');
          ves.forEach(function (v) { if (!v.visible) { v.visible = true; v.scale.setScalar(Math.min(1, st.t)); v.position.copy(v.userData.home); } });
          if (T > 2) st.phase = -1;
        }
        // ioni Ca2+
        ca.forEach(function (m) { m.position.addScaledVector(m.userData.v, dt); m.userData.v.multiplyScalar(0.97); });
        if (st.phase >= 3) ca.forEach(function (m) { m.visible = false; });
        // trasmettitore: moto browniano nella fessura, legame, rimozione
        var nBound = 0, decay = st.nt === 'ach' ? (st.neo ? 0.08 : 1.2) : 0.5;
        for (var i = nt.length - 1; i >= 0; i--) {
          var m = nt[i], u = m.userData;
          if (st.phase >= 4 && Math.random() < decay * dt) { scn.scene.remove(m); nt.splice(i, 1); continue; }
          if (!u.bound) {
            m.position.x += (Math.random() - 0.5) * 0.25; m.position.z += (Math.random() - 0.5) * 0.25; m.position.y += (Math.random() - 0.62) * 0.08;
            m.position.y = F.clamp(m.position.y, cleftY - cleftH / 2 + 0.1, cleftY + cleftH / 2 - 0.08);
            m.position.x = F.clamp(m.position.x, -4, 4); m.position.z = F.clamp(m.position.z, -2.3, 2.3);
            rec.forEach(function (r) { if (!u.bound && Math.abs(r.position.x - m.position.x) < 0.25 && Math.abs(r.position.z - m.position.z) < 0.25 && m.position.y < cleftY - 0.05) { u.bound = r; m.position.set(r.position.x, r.position.y + 0.25, r.position.z); } });
          } else nBound++;
          if (u.bound && Math.random() < 0.6 * dt) u.bound = false;
        }
        var active = 0;
        rec.forEach(function (r) { var b = nt.some(function (m) { return m.userData.bound === r; }); r.material.color.setHex(b ? 0x23c45a : 0x8e6cc4); if (b) active++; });
        ro.set('v', fused); ro.set('r', active + ' / ' + rec.length);
        ro.set('tt', tReal < 1 ? F.fmt(tReal * 1000, 0) + ' µs' : F.fmt(tReal, 2) + ' ms');
        if (st.phase >= 3) {
          // PPSE proporzionale ai recettori attivi, filtrato dalla membrana (τ ≈ 5 ms in tempo reale)
          var last = trace.v.length ? trace.v[trace.v.length - 1] : 0, dtr = trace.t.length ? Math.max(0, tReal - trace.t[trace.t.length - 1]) : 0;
          var target = active * (st.nt === 'gaba' ? -0.6 : 1.2);
          trace.t.push(tReal); trace.v.push(last + (target - last) * Math.min(1, dtr / 2));
          if (trace.t.length % 4 === 0) plot.update({ series: [{ x: trace.t, y: trace.v, color: st.nt === 'gaba' ? '--k' : '--na' }], ylim: [-6, 12] });
        }
      }
      reset();
      var loop = null;
      if (scn) scn.onFrame(frame); else loop = U.loop(L.main, frame);
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var syBase = function () { tCa.set(false); tLo.set(false); tBx.set(false); tNe.set(false); nSel.set('ach'); };
      U.explainer(L, {
        legend: [['#7cc36b', 'pallini colorati: trasmettitore (verde ACh, arancio glutammato, azzurro GABA)'], ['#ffd84a', 'pallini gialli: ioni Ca²⁺'], ['#8e6cc4', 'viola: recettori postsinaptici (verdi quando sono attivi)']],
        experiments: [
          { label: 'Sinapsi normale', run: function () { syBase(); fire(); }, why: `La barra di stato sotto la scena descrive ogni fase: PdA → ingresso di Ca²⁺ → fusione delle vescicole (SNARE e sinaptotagmina) → diffusione del trasmettitore (pochi µs) → recettori attivati → PPSE nel grafico → rimozione del trasmettitore.` },
          { label: 'Canali Ca²⁺ bloccati', run: function () { syBase(); tCa.set(true); fire(); }, why: `Senza ingresso di Ca²⁺ le vescicole non si fondono e non c'è rilascio: il Ca²⁺ è il segnale che collega l'evento elettrico a quello chimico.` },
          { label: 'Poco Ca²⁺ fuori', run: function () { syBase(); tLo.set(true); fire(); }, why: `Con meno Ca²⁺ si fonde una sola vescicola invece di quattro: la risposta postsinaptica è più piccola. È la base dell'esperimento sui quanti (lezione 25).` },
          { label: 'Tossina botulinica', run: function () { syBase(); tBx.set(true); fire(); }, why: `La tossina taglia SNAP-25: il complesso SNARE non può chiudersi, le vescicole non si fondono e la placca non trasmette (paralisi flaccida).` },
          { label: 'Neostigmina', run: function () { syBase(); tNe.set(true); fire(); }, why: `Con l'acetilcolinesterasi inibita l'ACh resta nella fessura più a lungo: i recettori restano attivi e la risposta è più prolungata.` },
          { label: 'Glutammato', run: function () { syBase(); nSel.set('glu'); fire(); }, why: `Il glutammato non ha un enzima di degradazione nella fessura: viene ricaptato dai trasportatori EAAT, nel terminale e nella glia.` },
          { label: 'GABA (inibitorio)', run: function () { syBase(); nSel.set('gaba'); fire(); }, why: `Il GABA attiva canali per il Cl⁻: la risposta è un'iperpolarizzazione (PPSI), non una depolarizzazione.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { plot.dispose(); if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ PPS e potenziale di inversione
  F.registerSim('pps', {
    title: 'Potenziali postsinaptici e potenziale di inversione',
    section: 'sinapsi',
    short: 'PPSE e PPSI dipendono dal recettore (dal suo potenziale di inversione), non dal trasmettitore: variando il potenziale della cellula la risposta si annulla e si inverte.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { rec: P.rec || 'ampa', Vh: P.Vh === undefined ? -60 : P.Vh, g: 3, Cli: 7, Mg: 1, fam: !!P.fam };
      var recs = {
        ampa: ['AMPA / nAChR (cationico)', 2], gabaa: ['GABA-A (Cl⁻)', 6], gly: ['Glicina (Cl⁻)', 5], gabab: ['GABA-B → canali GIRK (K⁺), lento', 40], nmda: ['NMDA (cationico, blocco Mg²⁺)', 30]
      };
      var rSel = U.select({ label: 'Recettore postsinaptico', value: st.rec, options: Object.keys(recs).map(function (k) { return [k, recs[k][0]]; }), onChange: function (v) { st.rec = v; run(); } });
      var sV = U.slider({ label: 'Potenziale della cellula prima dello stimolo', min: -100, max: 40, step: 1, value: st.Vh, digits: 0, unit: 'mV', onInput: function (v) { st.Vh = v; run(); } });
      var sG = U.slider({ label: 'Conduttanza sinaptica', min: 0.5, max: 10, step: 0.5, value: st.g, digits: 1, unit: 'nS', onInput: function (v) { st.g = v; run(); } });
      var sCl = U.slider({ label: '[Cl⁻] interno', min: 3, max: 40, step: 1, value: st.Cli, digits: 0, unit: 'mM', onInput: function (v) { st.Cli = v; run(); } });
      var tF = U.toggle({ label: 'Registra a −60, −20 e +10 mV (come nella figura della lezione)', value: st.fam, onChange: function (v) { st.fam = v; run(); } });
      [rSel.el, sV.el, sG.el, sCl.el, tF.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Cellula passiva (100 MΩ, 100 pF, riposo −65 mV) mantenuta al potenziale scelto con un\'iniezione di corrente costante; conduttanza sinaptica a funzione alfa. E<sub>rev</sub>: cationici ≈ 0 mV; Cl⁻ da Nernst (Cl⁻ esterno 120 mM, 37 °C); GABA-B/GIRK = E<sub>K</sub> (−90 mV). Nei neuroni immaturi il Cl⁻ interno è alto (NKCC1) e il GABA <i>depolarizza</i>.'));
      var fig = F.figs.channel(L.main);
      var ro = U.readouts([{ key: 'e', label: 'Potenziale di inversione', hl: true }, { key: 'a', label: 'Risposta' }, { key: 'k', label: 'Tipo' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Potenziale postsinaptico', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 240 });
      var piv = U.plot(L.main, { title: 'Ampiezza del PPS in funzione del potenziale', xlabel: 'potenziale di partenza (mV)', ylabel: 'ampiezza (mV)', height: 200, xlim: [-100, 40] });
      function Erev() {
        if (st.rec === 'ampa' || st.rec === 'nmda') return 0;
        if (st.rec === 'gabab') return -90;
        return F.nernst(120, st.Cli, -1, 37);
      }
      function trace(Vh) {
        var tau = recs[st.rec][1];
        return F.pspCell({ Vhold: Vh, syns: [{ g: st.g, E: Erev(), t0: 10, tau: tau, nmda: st.rec === 'nmda', Mg: st.Mg }], tmax: st.rec === 'gabab' || st.rec === 'nmda' ? 250 : 80 });
      }
      function amp(r, Vh) { var mx = Math.max.apply(null, r.V) - Vh, mn = Math.min.apply(null, r.V) - Vh; return Math.abs(mx) > Math.abs(mn) ? mx : mn; }
      function run() {
        sCl.el.style.display = (st.rec === 'gabaa' || st.rec === 'gly') ? '' : 'none';
        var E = Erev(), Vs = st.fam ? [-60, -20, 10] : [st.Vh], cols = ['--c1', '--c3', '--na'], ser = [];
        Vs.forEach(function (V, k) { var r = trace(V); ser.push({ name: st.fam ? 'partenza ' + V + ' mV' : null, x: r.t, y: r.V, color: cols[k] }); });
        plot.update({ series: ser, hlines: [{ y: E, label: 'E rev = ' + F.fmt(E, 0) + ' mV', color: '--ok' }, { y: -65, label: 'riposo', color: '--muted', align: 'left' }] });
        var hs = F.linspace(-100, 40, 29), as = hs.map(function (V) { return amp(trace(V), V); });
        piv.update({ series: [{ x: hs, y: as, color: '--c1' }, { x: [st.Vh], y: [amp(trace(st.Vh), st.Vh)], type: 'points', color: '--na', r: 6 }], vlines: [{ x: E, label: 'E rev', color: '--ok' }], hlines: [] });
        var a = amp(trace(st.Vh), st.Vh);
        fig.set({ E: E, Vh: st.Vh, tmax: (st.rec === 'gabab' || st.rec === 'nmda') ? 250 : 80, tau: recs[st.rec][1], ion: (st.rec === 'gabaa' || st.rec === 'gly') ? 'cl' : (st.rec === 'gabab' ? 'k' : 'cat'), ionLabel: (st.rec === 'gabaa' || st.rec === 'gly') ? 'canale per il Cl⁻' : (st.rec === 'gabab' ? 'canale GIRK: K⁺' : (st.rec === 'nmda' ? 'canale cationico (Na⁺, Ca²⁺; blocco Mg²⁺)' : 'canale cationico (Na⁺ ↓, K⁺ ↑)')) });
        ro.set('e', F.fmt(E, 1) + ' mV'); ro.set('a', (a >= 0 ? '+' : '') + F.fmt(a, 2) + ' mV');
        var excit = E > -50;
        ro.set('k', Math.abs(E + 65) < 4 ? 'inibizione "di shunt" (E ≈ riposo): nessuna variazione visibile, ma la cellula diventa meno eccitabile' : (excit ? 'eccitatorio: porta la cellula verso la soglia (≈ −50 mV)' : 'inibitorio: allontana dalla soglia'));
      }
      run();
      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var ppBase = function () { rSel.set('ampa'); sV.set(-60); sG.set(3); sCl.set(7); tF.set(false); };
      U.explainer(L, {
        watch: ro,
        base: ppBase,
        legend: [['--ok', 'verde: potenziale di inversione del recettore'], ['--muted', 'grigio: potenziale di riposo']],
        narrate: function () {
          var f = F.fmt, E = Erev(), sn = ro.snapshot();
          var rname = { ampa: 'AMPA / nicotinico (canale cationico)', gabaa: 'GABA-A (canale per il Cl⁻)', gly: 'della glicina (canale per il Cl⁻)', gabab: 'GABA-B (apre canali K⁺ tramite proteine G)', nmda: 'NMDA (canale cationico bloccato dal Mg²⁺)' }[st.rec];
          var s = `Il recettore ${rname} lascia passare ioni che spingono il potenziale della cellula verso il suo <b>potenziale di inversione</b>, E<sub>rev</sub> = <b>${f(E, 0)} mV</b>. `;
          if (Math.abs(st.Vh - E) < 2) s += `La cellula è già a ${f(st.Vh, 0)} mV, cioè a E<sub>rev</sub>: non c'è forza motrice e quindi <b>nessuna risposta</b>. `;
          else s += `La cellula parte da ${f(st.Vh, 0)} mV: all'apertura il potenziale si sposta <b>verso ${f(E, 0)} mV</b> (risposta ${sn[1].value}). ${st.Vh > E ? 'Poiché la cellula è <b>sopra</b> E<sub>rev</sub> la corrente è uscente e la risposta è <b>invertita</b>. ' : 'Se la cellula fosse sopra E<sub>rev</sub> la risposta sarebbe invertita. '}`;
          if (E > -50) s += `Poiché E<sub>rev</sub> è sopra la soglia di scarica (circa −50 mV) la sinapsi è <b>eccitatoria</b>. `;
          else if (Math.abs(E + 65) < 4) s += `Poiché E<sub>rev</sub> è vicino al potenziale di riposo la risposta è quasi invisibile, ma la conduttanza aggiunta «cortocircuita» i PPSE: <b>inibizione di shunt</b>. `;
          else s += `Poiché E<sub>rev</sub> è sotto la soglia la sinapsi è <b>inibitoria</b>. `;
          if ((st.rec === 'gabaa' || st.rec === 'gly') && E > -55) s += `Con Cl⁻ interno alto (${f(st.Cli, 0)} mM) E<sub>Cl</sub> è meno negativo e il GABA può <b>depolarizzare</b>, come nei neuroni immaturi. `;
          if (st.rec === 'nmda' && st.Vh < -40) s += `A questo potenziale il Mg²⁺ occlude in parte il poro: la risposta è piccola e cresce se la cellula è già depolarizzata. `;
          s += `Conta il recettore, non il trasmettitore: lo stesso trasmettitore può eccitare o inibire.`;
          if (st.fam) s += ` Le tre tracce (partenza a −60, −20 e +10 mV) mostrano l'inversione del segno.`;
          return s;
        },
        experiments: [
          { label: 'Eccitatorio (AMPA) a −60 mV', run: function () { ppBase(); }, why: `E<sub>rev</sub> ≈ 0 mV: il canale cationico depolarizza la cellula verso 0 mV (un PPSE).` },
          { label: 'Inversione: −60, −20, +10 mV', run: function () { ppBase(); tF.set(true); }, why: `A −60 mV il PPS è depolarizzante, a −20 mV è più piccolo, a +10 mV (sopra E<sub>rev</sub>) è <b>invertito</b>: l'esperimento classico della lezione.` },
          { label: 'GABA-A inibitorio', run: function () { ppBase(); rSel.set('gabaa'); sV.set(-50); }, why: `Il Cl⁻ spinge Vm verso E<sub>Cl</sub> ≈ −76 mV: iperpolarizzazione (PPSI) che allontana dalla soglia.` },
          { label: 'GABA depolarizzante (Cl⁻ interno 30 mM)', run: function () { ppBase(); rSel.set('gabaa'); sCl.set(30); sV.set(-65); }, why: `Con Cl⁻ interno alto E<sub>Cl</sub> si sposta verso −37 mV: sopra il potenziale di riposo, quindi il GABA <b>depolarizza</b> (neuroni immaturi, per via di NKCC1).` },
          { label: 'Inibizione di shunt', run: function () { ppBase(); rSel.set('gabaa'); sCl.set(10); sV.set(-65); }, why: `E<sub>Cl</sub> è quasi uguale al riposo: nessuna variazione visibile di Vm, ma la conduttanza al Cl⁻ aumenta e riduce l'effetto degli ingressi eccitatori.` },
          { label: 'GABA-B (K⁺, lento)', run: function () { ppBase(); rSel.set('gabab'); sV.set(-60); }, why: `Il recettore metabotropo apre canali K⁺ tramite proteine G: risposta molto più lenta (decine di ms) e iperpolarizzante.` },
          { label: 'NMDA', run: function () { ppBase(); rSel.set('nmda'); sV.set(-60); }, why: `A −60 mV il Mg²⁺ occlude il poro e la risposta è piccola; se la cellula è già depolarizzata il blocco si toglie e la risposta cresce.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { fig.dispose(); plot.dispose(); piv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
