/* Sezione 4b — Trasporti mediati e attivi (lezioni 10–12). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  // ================================================================ Trasporto mediato vs diffusione
  F.registerSim('carrier', {
    title: 'Trasporto mediato: saturazione, competizione, temperatura',
    section: 'canali',
    short: 'Cinetica di Michaelis-Menten di un trasportatore (GLUT) confrontata con la diffusione semplice (Fick).',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 'glut1', Fmax: 10, Km: 3, C: 5, I: 0, T: 37 };
      var types = { glut1: ['GLUT1 (eritrocita, ubiquitario)', 3], glut2: ['GLUT2 (fegato, cellule β, enterocita basolaterale)', 17], glut3: ['GLUT3 (neuroni)', 1.4], glut4: ['GLUT4 (muscolo, adipe; regolato dall\'insulina)', 5] };
      var tSel = U.select({ label: 'Trasportatore', value: st.type, options: Object.keys(types).map(function (k) { return [k, types[k][0]]; }), onChange: function (v) { st.type = v; sK.set(types[v][1]); } });
      var sK = U.slider({ label: 'K<sub>m</sub> (affinità inversa)', min: 0.5, max: 30, step: 0.1, value: types[st.type][1], digits: 1, unit: 'mM', onInput: function (v) { st.Km = v; upd(); } });
      var sF = U.slider({ label: 'F<sub>max</sub> (numero di trasportatori)', min: 1, max: 20, step: 0.5, value: 10, digits: 1, onInput: function (v) { st.Fmax = v; upd(); } });
      var sC = U.slider({ label: 'Glucosio esterno', min: 0, max: 40, step: 0.5, value: 5, digits: 1, unit: 'mM', onInput: function (v) { st.C = v; upd(); } });
      var sI = U.slider({ label: 'Inibitore competitivo (es. galattosio), [I]/Kᵢ', min: 0, max: 5, step: 0.1, value: 0, digits: 1, onInput: function (v) { st.I = v; upd(); } });
      var sT = U.slider({ label: 'Temperatura', min: 17, max: 47, step: 1, value: 37, digits: 0, unit: '°C', onInput: function (v) { st.T = v; upd(); } });
      [tSel.el, sK.el, sF.el, sC.el, sI.el, sT.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('$F = F_{max} C/(K_m(1 + [I]/K_i) + C)$. K<sub>m</sub> indicativi: GLUT1 ≈ 1–3 mM, GLUT2 ≈ 15–20 mM, GLUT3 ≈ 1,4 mM, GLUT4 ≈ 5 mM. La retta di confronto è una diffusione semplice con lo stesso flusso a bassa concentrazione. Q10: trasporto mediato ≈ 2,5; diffusione libera ≈ 1,3 (lezione 11: il Q10 del trasporto mediato è più alto).'));
      var ro = U.readouts([{ key: 'f', label: 'Flusso mediato', hl: true }, { key: 'd', label: 'Diffusione semplice (confronto)' }, { key: 's', label: 'Saturazione dei trasportatori' }, { key: 'k', label: 'K<sub>m</sub> apparente' }]);
      L.main.appendChild(ro.el);
      var plot = U.plot(L.main, { title: 'Flusso in funzione della concentrazione', xlabel: 'glucosio (mM)', ylabel: 'flusso (u.a.)', height: 250, xlim: [0, 40] });
      var anim = el('div'); L.main.appendChild(anim);
      var phase = 0, rate = 0;
      var cv = U.canvas2d(anim, 120, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = css('--surface-3'); ctx.fillRect(0, 40, w, 40);
        var n = 5;
        for (var k = 0; k < n; k++) {
          var cx = (k + 0.5) * w / n, ph = (phase + k * 0.37) % 1, out = ph < 0.5;
          ctx.fillStyle = css('--c4'); ctx.globalAlpha = 0.85;
          ctx.beginPath();
          if (out) { ctx.moveTo(cx - 22, 40); ctx.lineTo(cx - 8, 80); ctx.lineTo(cx + 8, 80); ctx.lineTo(cx + 22, 40); ctx.lineTo(cx + 12, 40); ctx.lineTo(cx + 4, 70); ctx.lineTo(cx - 4, 70); ctx.lineTo(cx - 12, 40); }
          else { ctx.moveTo(cx - 8, 40); ctx.lineTo(cx - 22, 80); ctx.lineTo(cx - 12, 80); ctx.lineTo(cx - 4, 50); ctx.lineTo(cx + 4, 50); ctx.lineTo(cx + 12, 80); ctx.lineTo(cx + 22, 80); ctx.lineTo(cx + 8, 40); }
          ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
          var sat = st.C / (st.Km * (1 + st.I) + st.C);
          if (((k * 7) % 10) / 10 < sat) { ctx.fillStyle = css('--c5'); ctx.beginPath(); ctx.arc(cx, out ? 58 : 62, 6, 0, 6.283); ctx.fill(); }
        }
        ctx.fillStyle = css('--muted'); ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
        ctx.fillText('esterno', 6, 22); ctx.fillText('citosol', 6, h - 10);
        ctx.textAlign = 'right'; ctx.fillText('modello "ping-pong": il trasportatore cambia conformazione', w - 6, h - 10);
      });
      function upd() {
        var q = F.q10factor(2.5, st.T, 37), qd = F.q10factor(1.3, st.T, 37), Kapp = st.Km * (1 + st.I);
        var Cs = F.linspace(0, 40, 161), Pd = st.Fmax / st.Km * 0.35;
        var f = q * F.michaelis(st.C, st.Fmax, st.Km, st.I, 1), d = qd * Pd * st.C;
        ro.set('f', F.fmt(f, 2)); ro.set('d', F.fmt(d, 2)); ro.set('s', F.fmt(st.C / (Kapp + st.C) * 100, 0) + '%'); ro.set('k', F.fmt(Kapp, 1) + ' mM');
        rate = f / 10;
        plot.update({ series: [
          { name: 'trasporto mediato', x: Cs, y: Cs.map(function (c) { return q * F.michaelis(c, st.Fmax, st.Km, st.I, 1); }), color: '--c4' },
          { name: 'diffusione semplice', x: Cs, y: Cs.map(function (c) { return qd * Pd * c; }), color: '--faint', dash: [5, 4] },
          { x: [st.C], y: [f], type: 'points', color: '--na', r: 6 }],
          hlines: [{ y: q * st.Fmax, label: 'Fmax', color: '--c4' }, { y: q * st.Fmax / 2, label: 'Fmax/2', color: '--muted' }],
          vlines: [{ x: Kapp, label: 'Km' + (st.I > 0 ? ' apparente' : ''), color: '--muted' }], ylim: [0, Math.max(q * st.Fmax * 1.6, 1)] });
      }
      upd();
      var loop = U.loop(anim, function (dt) { phase = (phase + dt * (0.15 + rate * 1.2)) % 1; cv.redraw(); });
      U.texify(L.controls);
      return { destroy: function () { loop.stop(); plot.dispose(); cv.dispose(); } };
    }
  });

  // ================================================================ Pompa Na+/K+ 3D + energetica
  F.registerSim('pompa', {
    title: 'La pompa Na⁺/K⁺-ATPasi: ciclo ed energetica',
    section: 'canali',
    short: 'Ciclo di Post-Albers (E1 ↔ E2, fosforilazione), stechiometria 3 Na⁺ : 2 K⁺ : 1 ATP, ouabaina, bilancio energetico e "limite di gradiente" delle pompe.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { playing: true, step: 0, tStep: 0, ouab: !!P.ouab, speed: 1, pump: P.pump || 'nak', NaI: 12, NaO: 145, KI: 140, KO: 4.5, Vm: -70 };
      var steps = [
        'E1: il sito di legame è aperto verso il citosol',
        '3 Na⁺ si legano dal lato citosolico (alta affinità per Na⁺ in E1)',
        'L\'ATP fosforila un aspartato (motivo DKTG): Na⁺ occlusi; esce ADP',
        'Cambio conformazionale E1P → E2P: il sito si apre all\'esterno e rilascia 3 Na⁺',
        '2 K⁺ si legano dall\'esterno (alta affinità per K⁺ in E2)',
        'Defosforilazione (esce Pᵢ): K⁺ occlusi',
        'Ritorno a E1: il sito si apre al citosol e rilascia 2 K⁺'
      ];
      var bP = U.button('Pausa', function () { st.playing = !st.playing; bP.textContent = st.playing ? 'Pausa' : 'Continua'; });
      var bS = U.button('Passo successivo', function () { st.playing = false; bP.textContent = 'Continua'; next(); });
      var tO = U.toggle({ label: 'Ouabaina / digitale (blocca in E2P dall\'esterno)', value: st.ouab, onChange: function (v) { st.ouab = v; } });
      L.controls.appendChild(el('div', { class: 'btn-row' }, [bP, bS])); L.controls.appendChild(tO.el);
      var pSel = U.select({ label: 'Bilancio energetico per la pompa', value: st.pump, options: [['nak', 'Na⁺/K⁺-ATPasi (3 Na⁺ fuori, 2 K⁺ dentro)'], ['pmca', 'PMCA (1 Ca²⁺ fuori)'], ['serca', 'SERCA (2 Ca²⁺ nel reticolo)'], ['hk1', 'H⁺/K⁺ gastrica, 1 H⁺ per ATP'], ['hk2', 'H⁺/K⁺ gastrica, 2 H⁺ per ATP']], onChange: function (v) { st.pump = v; energy(); } });
      var sNa = U.slider({ label: '[Na⁺] interno', min: 2, max: 60, step: 0.5, value: 12, digits: 1, unit: 'mM', onInput: function (v) { st.NaI = v; energy(); } });
      var sKo = U.slider({ label: '[K⁺] esterno', min: 1, max: 20, step: 0.1, value: 4.5, digits: 1, unit: 'mM', onInput: function (v) { st.KO = v; energy(); } });
      var sV = U.slider({ label: 'Potenziale di membrana', min: -120, max: 0, step: 1, value: -70, digits: 0, unit: 'mV', onInput: function (v) { st.Vm = v; energy(); } });
      var sLum = U.slider({ label: 'pH del lume gastrico', min: 1, max: 7, step: 0.1, value: 1, digits: 1, onInput: function (v) { st.pHl = v; energy(); } });
      st.pHl = 1;
      L.controls.appendChild(U.group('Bilancio energetico', [pSel.el, sNa.el, sKo.el, sV.el, sLum.el]));
      L.controls.appendChild(U.params('ΔG per spostare uno ione: $RT\\ln(C_{arrivo}/C_{partenza}) + zF\\Delta V$. ΔG dell\'ATP nella cellula ≈ −52 kJ/mol (ATP 2,25, ADP 0,25, Pᵢ 1,65 mM; Lehninger). Una pompa può lavorare solo se il ΔG richiesto per ciclo è minore di |ΔG<sub>ATP</sub>|: per questo le pompe sono "limitate dal gradiente". Ca²⁺ citosolico 100 nM, esterno 1,2 mM, nel reticolo ≈ 0,5 mM; pH citosolico 7,2.'));
      var status = U.status();
      var scn = F.scene3d(L.main, { height: 320, camPos: [0, 1.5, 11] });
      L.main.appendChild(status.el);
      var ro = U.readouts([{ key: 'req', label: 'Energia richiesta per ciclo', hl: true }, { key: 'atp', label: 'Energia da 1 ATP' }, { key: 'eff', label: 'Esito' }, { key: 'st', label: 'Stechiometria' }]);
      L.main.appendChild(ro.el);
      var THREE = G.THREE, body, gateIn, gateOut, phos, ouab, na = [], k = [], labP, labO;
      if (scn) {
        var mem = new THREE.Mesh(new THREE.BoxGeometry(12, 2.4, 5), new THREE.MeshStandardMaterial({ color: 0xd9c9a3, transparent: true, opacity: 0.2, depthWrite: false })); scn.scene.add(mem);
        body = new THREE.Group();
        var lob = F.mat(0x8e6cc4, { transparent: true, opacity: 0.8 });
        var l1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.4, 20), lob); l1.position.x = -1.25; body.add(l1);
        var l2 = l1.clone(); l2.position.x = 1.25; body.add(l2);
        var cyto = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 14), F.mat(0x7f5db8)); cyto.position.set(0, -2.6, 0); cyto.scale.set(1.4, 0.7, 1); body.add(cyto);
        scn.scene.add(body);
        gateOut = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), F.mat(0x2e3a59)); gateOut.position.y = 1.55; scn.scene.add(gateOut);
        gateIn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), F.mat(0x2e3a59)); gateIn.position.y = -1.55; scn.scene.add(gateIn);
        phos = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), F.mat(0xe8c547)); phos.position.set(0.6, -3.1, 0.9); scn.scene.add(phos);
        ouab = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.12, 40, 8), F.mat(0x23915a)); ouab.position.set(0, 2.2, 0); scn.scene.add(ouab);
        for (var i = 0; i < 3; i++) { var s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), F.mat(0xd9480f)); scn.scene.add(s); na.push(s); }
        for (i = 0; i < 2; i++) { var q = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), F.mat(0x3559c7)); scn.scene.add(q); k.push(q); }
        var labP = scn.label(phos, 'P (Asp)', true), labO = scn.label(ouab, 'ouabaina', true);
        var lo = new THREE.Object3D(); lo.position.set(-5, 2.3, 0); scn.scene.add(lo); scn.label(lo, 'esterno', true);
        var li = new THREE.Object3D(); li.position.set(-5, -2.3, 0); scn.scene.add(li); scn.label(li, 'citosol', true);
      }
      function next() {
        if (st.ouab && st.step === 3) { status.set('L\'ouabaina si lega alla forma E2P dal lato esterno: la pompa resta bloccata, i gradienti di Na⁺ e K⁺ si dissipano lentamente.', 'bad'); return; }
        st.step = (st.step + 1) % 7; st.tStep = 0;
      }
      var lerp = function (a, b, t) { return a + (b - a) * t; };
      function place(dt) {
        if (st.playing) { st.tStep += dt * st.speed; if (st.tStep > 1.6) next(); }
        var s = st.step, t = Math.min(1, st.tStep / 1.0);
        if (!(st.ouab && s === 3)) status.set('<b>Passo ' + (s + 1) + '/7.</b> ' + steps[s], '');
        if (!scn) return;
        // porte: E1 aperta dentro, E2 aperta fuori
        var inOpen = (s === 0 || s === 1 || s === 6) ? 1 : 0, outOpen = (s === 3 || s === 4) ? 1 : 0;
        gateIn.position.x = lerp(gateIn.position.x, inOpen ? 1.6 : 0, Math.min(1, dt * 5));
        gateOut.position.x = lerp(gateOut.position.x, outOpen ? 1.6 : 0, Math.min(1, dt * 5));
        phos.visible = s === 2 || s === 3 || s === 4;
        ouab.visible = st.ouab && (s === 3 || s === 4);
        if (labP) { labP.visible = phos.visible; labO.visible = ouab.visible; }
        // Na+: da sotto (citosol) → sito → fuori
        na.forEach(function (o, i) {
          var site = new THREE.Vector3(-0.35 + i * 0.35, 0.15 * (i % 2), 0), below = new THREE.Vector3(-1.5 + i * 1.5, -4, 1.5), above = new THREE.Vector3(-1.5 + i * 1.5, 3.8, 1.5);
          var p = s === 0 ? below : (s === 1 ? below.clone().lerp(site, t) : (s === 2 ? site : (s === 3 ? site.clone().lerp(above, t) : above)));
          o.position.copy(p); o.visible = !(s >= 4 && s <= 6) || s === 4 && t < 0.3;
        });
        k.forEach(function (o, i) {
          var site = new THREE.Vector3(-0.25 + i * 0.5, -0.1, 0), above = new THREE.Vector3(-1 + i * 2, 3.8, -1.2), below = new THREE.Vector3(-1 + i * 2, -4, -1.2);
          var p = s < 4 ? above : (s === 4 ? above.clone().lerp(site, t) : (s === 5 ? site : site.clone().lerp(below, t)));
          o.position.copy(p); o.visible = s >= 3;
        });
      }
      function energy() {
        var T = 37, RT = F.RTkJ(T), Fk = F.C.F / 1000, V = st.Vm / 1000, dGatp = F.dGATP(2.25, 0.25, 1.65, T), req, sto;
        sLum.el.style.display = st.pump.indexOf('hk') === 0 ? '' : 'none';
        [sNa.el, sKo.el].forEach(function (e) { e.style.display = st.pump === 'nak' ? '' : 'none'; });
        if (st.pump === 'nak') { req = 3 * F.dGion(st.NaI, st.NaO, 1, st.Vm, T, 'out') + 2 * F.dGion(st.KI, st.KO, 1, st.Vm, T, 'in'); sto = '3 Na⁺ : 2 K⁺ : 1 ATP (elettrogenica: +1 carica fuori)'; }
        else if (st.pump === 'pmca') { req = RT * Math.log(1.2 / 1e-4) - 2 * Fk * V; sto = '1 Ca²⁺ : 1 ATP'; }
        else if (st.pump === 'serca') { req = 2 * RT * Math.log(0.5 / 1e-4); sto = '2 Ca²⁺ : 1 ATP (membrana del reticolo, ΔV ≈ 0)'; }
        else { var n = st.pump === 'hk1' ? 1 : 2; req = n * RT * Math.LN10 * (7.2 - st.pHl); sto = n + ' H⁺ : ' + n + ' K⁺ : 1 ATP (elettroneutra)'; }
        ro.set('req', F.fmt(req, 1) + ' kJ/mol'); ro.set('atp', F.fmt(-dGatp, 1) + ' kJ/mol'); ro.set('st', sto);
        ro.set('eff', req < -dGatp ? '<span style="color:var(--ok)">possibile (rendimento ' + F.fmt(req / -dGatp * 100, 0) + '%)</span>' : '<span style="color:var(--bad)">impossibile: gradiente troppo grande</span>');
      }
      energy();
      var loop = null;
      if (scn) scn.onFrame(place); else loop = U.loop(L.main, place);
      U.texify(L.controls);
      return { destroy: function () { if (scn) scn.dispose(); if (loop) loop.stop(); } };
    }
  });

  // ================================================================ Enterocita: SGLT1
  F.registerSim('sglt', {
    title: 'Trasporto attivo secondario: assorbimento intestinale del glucosio',
    section: 'canali',
    short: 'SGLT1 apicale (2 Na⁺ : 1 glucosio), GLUT2 basolaterale e pompa Na⁺/K⁺: il gradiente di Na⁺ creato dalla pompa porta il glucosio contro gradiente.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { Gl: P.Gl === undefined ? 2 : P.Gl, ouab: false, phlor: false, phlo: false };
      var sG = U.slider({ label: 'Glucosio nel lume intestinale', min: 0.2, max: 20, step: 0.1, value: st.Gl, digits: 1, unit: 'mM', onInput: function (v) { st.Gl = v; run(); } });
      var tO = U.toggle({ label: 'Ouabaina sulla pompa (dal minuto 3)', value: false, onChange: function (v) { st.ouab = v; run(); } });
      var tP = U.toggle({ label: 'Florizina (blocca SGLT1)', value: false, onChange: function (v) { st.phlor = v; run(); } });
      var tF = U.toggle({ label: 'Floretina (blocca GLUT2)', value: false, onChange: function (v) { st.phlo = v; run(); } });
      [sG.el, tO.el, tP.el, tF.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Modello dinamico (didattico) dell\'enterocita: flusso SGLT1 termodinamicamente coerente, che si annulla quando $[Glc]_i/[Glc]_o = ([Na]_o/[Na]_i)^2 e^{-2FV_m/RT}$; GLUT2 = diffusione facilitata simmetrica (K<sub>m</sub> 17 mM); pompa con attivazione sigmoide dal Na⁺ interno; glucosio nel sangue 5 mM. Senza pompa i gradienti si dissipano e Vm si depolarizza.'));
      var ro = U.readouts([{ key: 'r', label: 'Accumulo massimo possibile [Glc]ᵢ/[Glc]ₒ', hl: true }, { key: 'gi', label: 'Glucosio nella cellula' }, { key: 'na', label: 'Na⁺ nella cellula' }, { key: 'j', label: 'Glucosio assorbito verso il sangue' }]);
      var holder = el('div'); L.main.appendChild(holder); L.main.appendChild(ro.el);
      var p1 = U.plot(L.main, { title: 'Concentrazioni nella cellula', xlabel: 'tempo (s)', ylabel: 'mM', height: 190 });
      var res = null;
      var cv = U.canvas2d(holder, 200, function (ctx, w, h) {
        var css = U.css; ctx.clearRect(0, 0, w, h);
        var x1 = w * 0.3, x2 = w * 0.7;
        ctx.fillStyle = css('--surface-3'); ctx.fillRect(x1, 20, x2 - x1, h - 40);
        ctx.strokeStyle = css('--muted'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, 20); ctx.lineTo(x1, h - 20); ctx.moveTo(x2, 20); ctx.lineTo(x2, h - 20); ctx.stroke();
        ctx.font = '600 12px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillStyle = css('--text');
        ctx.fillText('LUME', x1 / 2, 14); ctx.fillText('ENTEROCITA', (x1 + x2) / 2, 14); ctx.fillText('SANGUE', (x2 + w) / 2, 14);
        if (!res) return;
        var n = res.t.length - 1, Gi = res.Gi[n], NaI = res.NaI[n];
        ctx.font = '12px ' + css('--font'); ctx.fillStyle = css('--muted');
        ctx.fillText('Glc ' + F.fmt(st.Gl, 1) + ' mM · Na⁺ 145', x1 / 2, h - 6);
        ctx.fillText('Glc ' + F.fmt(Gi, 1) + ' mM · Na⁺ ' + F.fmt(NaI, 0), (x1 + x2) / 2, h - 6);
        ctx.fillText('Glc 5 mM · Na⁺ 145', (x2 + w) / 2, h - 6);
        var box = function (x, y, label, col, on) {
          ctx.fillStyle = on ? col : css('--faint'); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 16, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
          ctx.fillStyle = css('--text'); ctx.textAlign = x < w / 2 ? 'left' : 'right'; ctx.fillText(label, x + (x < w / 2 ? 22 : -22), y + 4); ctx.textAlign = 'center';
        };
        var js = res.Jsglt[n], jg = res.Jglut[n], jp = res.Jpump[n];
        box(x1, h * 0.38, 'SGLT1 (2 Na⁺ + Glc)', css('--c4'), !st.phlor);
        box(x2, h * 0.32, 'GLUT2', css('--c3'), !st.phlo);
        box(x2, h * 0.66, '3 Na⁺ / 2 K⁺ ATPasi', css('--na'), jp > 0.05);
        var sc = 14;
        if (Math.abs(js) > 0.02) U.arrow(ctx, x1 - 40 * Math.sign(js), h * 0.38 + 26, x1 + Math.sign(js) * Math.min(60, 20 + sc * Math.abs(js)), h * 0.38 + 26, css('--c4'), 3);
        if (Math.abs(jg) > 0.02) U.arrow(ctx, x2 - 40 * Math.sign(jg), h * 0.32 + 26, x2 + Math.sign(jg) * Math.min(60, 20 + sc * Math.abs(jg)), h * 0.32 + 26, css('--c3'), 3);
      });
      function run() {
        res = F.enterocyte({ Glumen: st.Gl, tmax: 600, ouabainAt: st.ouab ? 180 : undefined, sgltBlock: st.phlor, glutBlock: st.phlo });
        var n = res.t.length - 1;
        ro.set('r', F.fmt(F.sgltMaxRatio(145, 12, -60, 37), 0) + ' volte');
        ro.set('gi', F.fmt(res.Gi[n], 1) + ' mM' + (res.Gi[n] > st.Gl ? ' (più che nel lume!)' : ''));
        ro.set('na', F.fmt(res.NaI[n], 1) + ' mM');
        ro.set('j', F.fmt(Math.max(0, res.Jglut[n]), 2) + ' mM/s');
        p1.update({ series: [{ name: 'glucosio nella cellula', x: res.t, y: res.Gi, color: '--c3' }, { name: 'Na⁺ nella cellula', x: res.t, y: res.NaI, color: '--na' }],
          hlines: [{ y: st.Gl, label: 'glucosio nel lume', color: '--c4' }], vlines: st.ouab ? [{ x: 180, label: 'ouabaina' }] : [], ylim: [0, null] });
        cv.redraw();
      }
      run();
      U.texify(L.controls);
      return { destroy: function () { p1.dispose(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
