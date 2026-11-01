/* Il neurone (lezione 21): potenziali locali (graduati, decrementali, sommabili) e potenziale d'azione
   (tutto-o-nulla, senza decremento). Modello a compartimenti: dendrite passivo → soma → segmento iniziale
   → assone mielinico con nodi di Ranvier. Il calcolo è fatto per intero a ogni cambio di controllo e poi
   "riprodotto": si può scorrere il tempo con il cursore. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  var SITES = [
    { id: 'E1', d: 600, kind: 'E', name: 'E1 · eccitatoria sul dendrite lontano (600 µm)' },
    { id: 'E2', d: 300, kind: 'E', name: 'E2 · eccitatoria sul dendrite intermedio (300 µm)' },
    { id: 'E3', d: 100, kind: 'E', name: 'E3 · eccitatoria sul dendrite vicino (100 µm)' },
    { id: 'I', d: 0, kind: 'I', name: 'I · inibitoria sul soma' }
  ];
  var ELEC = [
    { key: 'R1', name: 'R1 · dendrite a 600 µm', color: '--c1', at: function (c) { return c.dendIndexAt(600); } },
    { key: 'R2', name: 'R2 · dendrite a 100 µm', color: '--c3', at: function (c) { return c.dendIndexAt(100); } },
    { key: 'R3', name: 'R3 · soma', color: '--c4', at: function (c) { return c.somaIndex; } },
    { key: 'R4', name: 'R4 · segmento iniziale', color: '--c5', at: function (c) { return c.aisIndex + 3; } },
    { key: 'R5', name: 'R5 · nodo di Ranvier 5', color: '--c2', at: function (c) { return c.nodeIdx[4]; } }
  ];
  var THRESH = -57; // soglia di innesco al segmento iniziale (misurata nel modello: sotto −58 mV non parte, sopra rigenera)

  /** Colore del potenziale: blu (iperpolarizzato) → grigio-azzurro (riposo) → arancio → rosso (PdA). */
  var STOPS = [[-85, 52, 102, 190], [-65, 142, 162, 192], [-52, 236, 192, 92], [-25, 240, 128, 56], [5, 222, 60, 42], [35, 255, 38, 28]];
  function vcol(V, a) {
    var i = 0, r, g, b;
    if (V <= STOPS[0][0]) { r = STOPS[0][1]; g = STOPS[0][2]; b = STOPS[0][3]; }
    else if (V >= STOPS[STOPS.length - 1][0]) { var q = STOPS[STOPS.length - 1]; r = q[1]; g = q[2]; b = q[3]; }
    else {
      while (V > STOPS[i + 1][0]) i++;
      var A = STOPS[i], B = STOPS[i + 1], t = (V - A[0]) / (B[0] - A[0]);
      r = A[1] + (B[1] - A[1]) * t; g = A[2] + (B[2] - A[2]) * t; b = A[3] + (B[3] - A[3]) * t;
    }
    return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + (a === undefined ? 1 : a) + ')';
  }

  F.registerSim('neurone', {
    title: 'Il neurone: potenziali locali e potenziale d\'azione',
    section: 'elettro',
    short: 'Sinapsi sul dendrite → potenziali locali che si attenuano e si sommano → soglia al segmento iniziale → potenziale d\'azione tutto-o-nulla che corre senza decremento lungo l\'assone mielinico.',
    mount: function (host, P) {
      var L = U.simLayout(host);
      var st = {
        on: { E1: false, E2: false, E3: false, I: false }, N: P.N || 6, np: P.np || 1, freq: P.freq || 200,
        dd: P.dd || 1, Rm: P.Rm || 20, speed: 1, pos: 0, playing: false
      };
      (P.sites || ['E1', 'E2', 'E3']).forEach(function (s) { st.on[s] = true; });
      var cable = null, run = null, DT = 0.01, EVERY = 2, MSPS = 5; // ms di modello per secondo di riproduzione

      // ---------------------------------------------------------------- controlli
      var tg = {};
      SITES.forEach(function (s) {
        tg[s.id] = U.toggle({ label: s.name, value: st.on[s.id], onChange: function (v) { st.on[s.id] = v; simulate(); } });
      });
      var sN = U.slider({ label: 'Sinapsi attive in ogni sito (0,2 nS ciascuna)', min: 1, max: 40, step: 1, value: st.N, digits: 0, onInput: function (v) { st.N = v; simulate(); } });
      var sNp = U.slider({ label: 'Numero di impulsi presinaptici', min: 1, max: 8, step: 1, value: st.np, digits: 0, onInput: function (v) { st.np = v; simulate(); } });
      var sF = U.slider({ label: 'Frequenza degli impulsi', min: 20, max: 600, step: 10, value: st.freq, digits: 0, unit: 'Hz', onInput: function (v) { st.freq = v; simulate(); } });
      var sDd = U.slider({ label: 'Diametro del dendrite', min: 0.5, max: 4, step: 0.1, value: st.dd, digits: 1, unit: 'µm', onInput: function (v) { st.dd = v; simulate(true); } });
      var sRm = U.slider({ label: 'Resistenza specifica di membrana R<sub>m</sub>', min: 5, max: 40, step: 1, value: st.Rm, digits: 0, unit: 'kΩ·cm²', onInput: function (v) { st.Rm = v; simulate(true); } });
      var sSp = U.slider({ label: 'Velocità della riproduzione (rallentata da sola durante il PdA)', min: 0.2, max: 3, step: 0.1, value: 1, digits: 1, unit: '×', onInput: function (v) { st.speed = v; } });
      L.controls.appendChild(U.group('Sinapsi da attivare (clic sulle sinapsi nel disegno)', SITES.map(function (s) { return tg[s.id].el; })));
      L.controls.appendChild(U.group('Intensità e tempi', [sN.el, sNp.el, sF.el]));
      L.controls.appendChild(U.group('Proprietà passive del dendrite', [sDd.el, sRm.el]));
      L.controls.appendChild(U.group('Riproduzione', [sSp.el]));
      L.controls.appendChild(U.params('Modello a compartimenti (115 compartimenti, 18,5 °C, cinetica di Hodgkin-Huxley con Q10 = 3). <b>Dendrite</b>: cilindro passivo equivalente (Rall) di 700 µm, R<sub>i</sub> = 100 Ω·cm, C<sub>m</sub> = 1 µF/cm², τ = R<sub>m</sub>C<sub>m</sub> = 20 ms con i valori iniziali; la costante di spazio è $\\lambda = \\sqrt{R_m d / 4R_i}$ (vale quella indicata nella lettura qui sotto). <b>Soma</b> di 25 µm con pochi canali Na⁺/K⁺. <b>Segmento iniziale</b> (6 compartimenti da 5 µm) con densità di canali Na⁺ 12 volte maggiore (K⁺ ×2): è il punto con la soglia più bassa (≈ −57 mV per un breve PPSE), quindi vi nasce il PdA. <b>Assone</b> di 2 µm mielinizzato: internodi di 333 µm (100 × diametro esterno, rapporto g = 0,6), mielina con 42 lamelle, nodi di 1 µm con densità di canali ×10. <b>Sinapsi</b>: conduttanza a funzione alfa (picco a 0,5 ms; 1 ms per l\'inibitoria), E<sub>rev</sub> = 0 mV (eccitatoria) e −80 mV (inibitoria); ogni «sito» rappresenta un gruppo di N sinapsi vicine (N × 0,2 nS; l\'inibitoria ha una conduttanza tripla). Il disegno è <b>schematico e non in scala</b>.'));
      U.texify(L.controls);

      var ro = U.readouts([
        { key: 'loc', label: 'Potenziale locale nel punto d\'ingresso (sinapsi più lontana)', hl: true },
        { key: 'soma', label: 'Potenziale al soma (min → max)' },
        { key: 'ap', label: 'Potenziale d\'azione' },
        { key: 'nod', label: 'Picco ai nodi 1 … 5' },
        { key: 'v', label: 'Velocità di conduzione (nodo 1 → 5)' },
        { key: 'lam', label: 'Costante di spazio λ del dendrite' }
      ]);

      // ---------------------------------------------------------------- calcolo
      function buildCable() { cable = F.Cable.neuron({ dendDiam_um: st.dd, Rm: st.Rm * 1000 }); }
      function events() {
        var ev = [], per = 1000 / st.freq, t0 = 1.5;
        SITES.forEach(function (s) {
          if (!st.on[s.id]) return;
          var idx = s.kind === 'I' ? cable.somaIndex : cable.dendIndexAt(s.d);
          for (var k = 0; k < st.np; k++) ev.push(s.kind === 'E' ? { i: idx, t0: t0 + k * per, g: st.N * 0.2e-6, E: 0, tp: 0.5, site: s.id } : { i: idx, t0: t0 + k * per, g: st.N * 0.6e-6, E: -80, tp: 1.0, site: s.id });
        });
        return ev;
      }
      /** Calcola tutto l'evento e lo conserva (un'istantanea ogni 0,05 ms). */
      function simulate(rebuild, keepPos) {
        if (rebuild || !cable) buildCable();
        var ev = events(), per = 1000 / st.freq;
        var tEnd = Math.min(90, Math.max(10, 1.5 + (st.np - 1) * per + 9));
        cable.reset(-65);
        var n = cable.n, frames = [new Float32Array(cable.V)], ts = [0], step = 0;
        while (cable.t < tEnd - 1e-9) {
          cable.applySyn(ev); cable.step(DT); step++;
          if (step % EVERY === 0) { frames.push(new Float32Array(cable.V)); ts.push(cable.t); }
        }
        run = { ev: ev, frames: frames, t: ts, tEnd: ts[ts.length - 1], n: n };
        analyse();
        if (!keepPos) { st.pos = run.frames.length - 1; st.playing = false; }
        syncUI();
        draw(true);
      }
      function analyse() {
        var c = cable, fr = run.frames, n = run.n, mx = new Float64Array(n).fill(-1e9), mn = new Float64Array(n).fill(1e9), k, i;
        for (k = 0; k < fr.length; k++) for (i = 0; i < n; i++) { var v = fr[k][i]; if (v > mx[i]) mx[i] = v; if (v < mn[i]) mn[i] = v; }
        run.mx = mx; run.mn = mn;
        var ni = c.nodeIdx;
        function cross(idx) { // primo passaggio per 0 mV, con interpolazione lineare
          for (var q = 1; q < fr.length; q++) if (fr[q - 1][idx] < 0 && fr[q][idx] >= 0) return run.t[q - 1] + (0 - fr[q - 1][idx]) / (fr[q][idx] - fr[q - 1][idx]) * (run.t[q] - run.t[q - 1]);
          return null;
        }
        var nAP = 0, q2;
        for (q2 = 1; q2 < fr.length; q2++) if (fr[q2 - 1][ni[0]] < 0 && fr[q2][ni[0]] >= 0) nAP++;
        run.nAP = nAP; run.fired = nAP > 0;
        var t1 = cross(ni[0]), t5 = cross(ni[4]);
        run.vel = (t1 !== null && t5 !== null && t5 > t1) ? (c.x[ni[4]] - c.x[ni[0]]) / (t5 - t1) * 10 : null;
        // potenziale locale: massimo al sito d'ingresso più lontano, prima che il PdA arrivi al soma (poi c'è solo il ritorno passivo)
        var cut = fr.length, ai = c.aisIndex + 3;
        for (k = 0; k < fr.length; k++) if (fr[k][ai] > -20) { cut = k; break; }
        var far = -1; SITES.forEach(function (s0) { if (s0.kind === 'E' && st.on[s0.id]) far = Math.max(far, s0.d); });
        var dmax = -1e9;
        if (far > 0) { var fi = c.dendIndexAt(far); for (k = 0; k < cut; k++) dmax = Math.max(dmax, fr[k][fi]); run.farD = far; }
        run.dmax = dmax;
        run.nodeMax = ni.map(function (j) { return mx[j]; });
        var a = F.fmt, lam = c.lambda_um;
        ro.set('loc', far > 0 ? '+' + a(dmax + 65, 0) + ' mV a ' + far + ' µm dal soma' : '—');
        ro.set('soma', a(mn[c.somaIndex], 0) + ' → ' + a(mx[c.somaIndex], 0) + ' mV');
        ro.set('ap', run.fired ? '<span style="color:var(--bad)"><b>' + nAP + (nAP === 1 ? ' generato' : ' generati') + '</b></span>' : (anyOn() ? 'nessuno (sottosoglia)' : '—'));
        ro.set('nod', run.fired ? '+' + a(Math.min.apply(null, run.nodeMax), 0) + ' … +' + a(Math.max.apply(null, run.nodeMax), 0) + ' mV' : '—');
        ro.set('v', run.fired && run.vel ? a(run.vel, 1) + ' m/s' : '—');
        ro.set('lam', a(lam, 0) + ' µm');
      }
      function anyOn() { return SITES.some(function (s) { return st.on[s.id]; }); }

      // ---------------------------------------------------------------- stato corrente (interpolato)
      var Vcur = new Float64Array(115);
      function currentV() {
        var f = run.frames, p = st.pos, i0 = Math.floor(p), i1 = Math.min(f.length - 1, i0 + 1), u = p - i0;
        if (Vcur.length !== run.n) Vcur = new Float64Array(run.n);
        for (var i = 0; i < run.n; i++) Vcur[i] = f[i0][i] + (f[i1][i] - f[i0][i]) * u;
        return Vcur;
      }
      function tNow() { var p = st.pos, i0 = Math.floor(p), i1 = Math.min(run.t.length - 1, i0 + 1); return run.t[i0] + (run.t[i1] - run.t[i0]) * (p - i0); }

      // ---------------------------------------------------------------- disegno del neurone
      var hit = [], flow = [0, 0, 0, 0, 0], dots = 0, view = { cur: -1 };
      function geo(w, h) {
        var g = {}, s = Math.max(0.55, Math.min(1.15, w / 720));
        g.s = s; g.cy = Math.round(h * 0.5);
        g.rx = Math.max(18, Math.min(36, w * 0.047)); g.ry = g.rx * 0.88; g.sx = w * 0.295;
        g.dx1 = g.sx - g.rx * 0.8; g.dx0 = Math.max(10, w * 0.035);
        g.Ld = cable.dendLen * 1e4;
        g.dendP = function (dist) { var u = dist / g.Ld; return { x: g.dx1 - u * (g.dx1 - g.dx0), y: g.cy - 15 * s * u * Math.sin(u * 4.2) }; };
        g.dendW = function (dist) { var u = dist / g.Ld; return (12 * (1 - u) + 4.2 * u) * s; };
        g.ax0 = g.sx + g.rx * 0.95; g.hl = w * 0.045; g.al = w * 0.045; g.a1 = g.ax0 + g.hl + g.al;
        g.tw = w * 0.075; g.nN = cable.nodeIdx.length;
        g.gw = 9 * s; g.axEnd = w * 0.955;
        g.Lint = (g.axEnd - g.tw - g.a1) / g.nN;
        g.nodeX = function (k) { return g.a1 + (k + 1) * g.Lint - g.gw / 2; }; // centro del nodo k (0-based)
        g.sheathH = 10.5 * s; g.axW = 3.6 * s;
        return g;
      }
      /** x del compartimento i nell'assone (per i colori dei tratti). */
      function axonX(g, i) {
        var c = cable, seg = 6;
        if (i >= c.aisIndex && i < c.aisIndex + 6) return g.ax0 + g.hl + (i - c.aisIndex + 0.5) / 6 * g.al;
        for (var k = 0; k < g.nN; k++) {
          var nd = c.nodeIdx[k];
          if (i === nd) return g.nodeX(k);
          if (i >= nd - seg && i < nd) { var x0 = (k === 0 ? g.a1 : g.nodeX(k - 1) + g.gw / 2), x1 = g.nodeX(k) - g.gw / 2; return x0 + (i - (nd - seg) + 0.5) / seg * (x1 - x0); }
        }
        return g.axEnd;
      }
      function blob(ctx, cx, cy, rx, ry, rot) {
        var K = 28, pts = [];
        for (var i = 0; i < K; i++) {
          var a = i / K * 6.2832, r = 1 + 0.07 * Math.sin(3 * a + 1) + 0.045 * Math.sin(5 * a + 2) + 0.03 * Math.sin(2 * a);
          pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
        }
        ctx.beginPath();
        for (i = 0; i < K; i++) {
          var p0 = pts[i], p1 = pts[(i + 1) % K], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
          if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
        }
        ctx.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
        ctx.closePath();
      }
      function text(ctx, str, x, y, align, col, size, bold) {
        ctx.font = (bold ? '600 ' : '') + size + 'px ' + U.css('--font'); ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.fillText(str, x, y);
      }
      function drawFigure(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        if (!run || !cable) return;
        var g = geo(w, h), s = g.s, c = cable, V = currentV(), t = tNow(), css = U.css;
        var muted = css('--muted'), txt = css('--text'), dark = (G.matchMedia && G.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light') || document.documentElement.getAttribute('data-theme') === 'dark';
        var outline = dark ? 'rgba(220,225,235,0.40)' : 'rgba(40,50,70,0.50)';
        var cy = g.cy, i, k, ybot = Math.min(h - 28 * s, cy + 96 * s);
        hit = [];

        // ---- ramoscelli dendritici (decorativi: colore del punto da cui nascono)
        function twig(dist, dir, len, ang) {
          var p = g.dendP(dist), v = V[c.dendIndexAt(dist)], x1 = p.x + Math.cos(ang) * len * s, y1 = p.y + dir * Math.abs(Math.sin(ang)) * len * s;
          ctx.lineCap = 'round';
          [[0, 1], [0.55, -0.6], [0.55, 0.6]].forEach(function (b, bi) {
            ctx.strokeStyle = outline; ctx.lineWidth = (bi ? 2.4 : 3.8) * s + 1.6;
            var ex = bi ? x1 + Math.cos(ang + b[1] * 0.8) * len * 0.45 * s : x1, ey = bi ? y1 + dir * Math.abs(Math.sin(ang + b[1] * 0.8)) * len * 0.45 * s : y1;
            ctx.beginPath(); ctx.moveTo(bi ? x1 : p.x, bi ? y1 : p.y); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.strokeStyle = vcol(v); ctx.lineWidth = (bi ? 2.4 : 3.8) * s;
            ctx.beginPath(); ctx.moveTo(bi ? x1 : p.x, bi ? y1 : p.y); ctx.lineTo(ex, ey); ctx.stroke();
          });
        }
        twig(200, -1, 34, 2.45); twig(450, -1, 30, 2.3); twig(155, 1, 36, 2.55); twig(400, 1, 32, 2.2); twig(520, 1, 28, 2.45); twig(660, -1, 24, 2.8);
        // dendriti basali brevi sul soma
        [[-0.62, 2.6], [0.62, 2.6]].forEach(function (b) {
          var x0 = g.sx - g.rx * 0.65, y0 = cy + b[0] * g.ry * 1.2, dv = V[c.dendIndexAt(8)];
          ctx.lineCap = 'round'; ctx.strokeStyle = outline; ctx.lineWidth = 5.2 * s + 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 40 * s, y0 + Math.sign(b[0]) * 22 * s); ctx.stroke();
          ctx.strokeStyle = vcol(dv); ctx.lineWidth = 5.2 * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 40 * s, y0 + Math.sign(b[0]) * 22 * s); ctx.stroke();
        });
        // ---- dendrite principale (un tratto per compartimento)
        var nD = c.nDend, dx = g.Ld / nD, du;
        ctx.lineCap = 'round';
        for (i = 0; i < nD; i++) {
          var d0 = (nD - i - 1) * dx, d1 = (nD - i) * dx, pa = g.dendP(d0), pb = g.dendP(d1), wd = g.dendW((d0 + d1) / 2);
          ctx.strokeStyle = outline; ctx.lineWidth = wd + 1.8; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        for (i = 0; i < nD; i++) {
          d0 = (nD - i - 1) * dx; d1 = (nD - i) * dx; pa = g.dendP(d0); pb = g.dendP(d1); wd = g.dendW((d0 + d1) / 2);
          ctx.strokeStyle = vcol(V[i]); ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }

        // ---- cono d'emergenza + segmento iniziale
        var Vs = V[c.somaIndex], Va = V[c.aisIndex];
        var hx0 = g.sx + g.rx * 0.7, hx1 = g.ax0 + g.hl;
        ctx.beginPath(); ctx.moveTo(hx0, cy - g.ry * 0.5); ctx.quadraticCurveTo(g.ax0 + 2, cy - 4 * s, hx1, cy - 2.6 * s);
        ctx.lineTo(hx1, cy + 2.6 * s); ctx.quadraticCurveTo(g.ax0 + 2, cy + 4 * s, hx0, cy + g.ry * 0.5); ctx.closePath();
        var gr = ctx.createLinearGradient(hx0, 0, hx1, 0); gr.addColorStop(0, vcol(Vs)); gr.addColorStop(1, vcol(Va));
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1.2; ctx.stroke();
        for (i = 0; i < 6; i++) {
          var xa = g.ax0 + g.hl + i / 6 * g.al, xb = g.ax0 + g.hl + (i + 1) / 6 * g.al;
          ctx.fillStyle = vcol(V[c.aisIndex + i]); ctx.fillRect(xa - 0.5, cy - 3.2 * s, xb - xa + 1, 6.4 * s);
        }
        ctx.strokeStyle = outline; ctx.lineWidth = 1.2; ctx.strokeRect(g.ax0 + g.hl, cy - 3.2 * s, g.al, 6.4 * s);
        // canali Na+ (puntini) sul segmento iniziale
        ctx.fillStyle = css('--na');
        for (i = 0; i < 9; i++) { var xx = g.ax0 + g.hl + (i + 0.5) / 9 * g.al; ctx.beginPath(); ctx.arc(xx, cy - 5.4 * s, 1.5 * s, 0, 6.283); ctx.arc(xx, cy + 5.4 * s, 1.5 * s, 0, 6.283); ctx.fill(); }

        // ---- assone: nucleo colorato + guaine + nodi
        var axL = g.a1, axR = g.nodeX(g.nN - 1);
        for (k = 0; k < g.nN; k++) {
          var nd = c.nodeIdx[k], xs0 = (k === 0 ? g.a1 : g.nodeX(k - 1) + g.gw / 2), xs1 = g.nodeX(k) - g.gw / 2, seg = 6;
          // tratto assonico dell'internodo (colorato per compartimento)
          for (i = 0; i < seg; i++) {
            var ua = xs0 + i / seg * (xs1 - xs0), ub = xs0 + (i + 1) / seg * (xs1 - xs0);
            ctx.fillStyle = vcol(V[nd - seg + i]); ctx.fillRect(ua - 0.5, cy - g.axW / 2, ub - ua + 1, g.axW);
          }
          // nodo (scoperto)
          ctx.fillStyle = vcol(V[nd]); ctx.fillRect(xs1 - 0.5, cy - g.axW / 2 - 0.5, g.gw + 1, g.axW + 1);
          // guaina di mielina: due bande ai lati dell'assone con estremità arrotondate (anse paranodali)
          var sh = g.sheathH, y1 = cy - g.axW / 2 - 1, y2 = cy + g.axW / 2 + 1;
          [[y1 - sh, y1, -1], [y2, y2 + sh, 1]].forEach(function (bd) {
            var ya = bd[0], yb = bd[1], r = 3.2 * s;
            ctx.beginPath();
            if (bd[2] < 0) { ctx.moveTo(xs0 + 1, yb); ctx.lineTo(xs0 + 3.5 * s, ya + r); ctx.quadraticCurveTo(xs0 + 4.5 * s, ya, xs0 + 8 * s, ya); ctx.lineTo(xs1 - 8 * s, ya); ctx.quadraticCurveTo(xs1 - 4.5 * s, ya, xs1 - 3.5 * s, ya + r); ctx.lineTo(xs1 - 1, yb); }
            else { ctx.moveTo(xs0 + 1, ya); ctx.lineTo(xs0 + 3.5 * s, yb - r); ctx.quadraticCurveTo(xs0 + 4.5 * s, yb, xs0 + 8 * s, yb); ctx.lineTo(xs1 - 8 * s, yb); ctx.quadraticCurveTo(xs1 - 4.5 * s, yb, xs1 - 3.5 * s, yb - r); ctx.lineTo(xs1 - 1, ya); }
            ctx.closePath();
            ctx.fillStyle = dark ? 'rgba(232,224,196,0.82)' : 'rgba(247,240,214,0.96)'; ctx.fill();
            ctx.strokeStyle = dark ? 'rgba(120,110,80,0.9)' : 'rgba(150,134,84,0.9)'; ctx.lineWidth = 1; ctx.stroke();
            // lamelle (tratteggio sottile)
            ctx.strokeStyle = dark ? 'rgba(120,110,80,0.55)' : 'rgba(170,150,90,0.5)'; ctx.lineWidth = 0.7;
            for (var q = 1; q < 3; q++) { var yy = ya + (yb - ya) * q / 3; ctx.beginPath(); ctx.moveTo(xs0 + 9 * s, yy); ctx.lineTo(xs1 - 9 * s, yy); ctx.stroke(); }
          });
          // nucleo della cellula di Schwann (sporge sopra la guaina)
          ctx.fillStyle = dark ? 'rgba(160,120,200,0.95)' : 'rgba(120,80,170,0.85)';
          ctx.beginPath(); ctx.ellipse((xs0 + xs1) / 2, y1 - sh - 1.2 * s, 9 * s, 3.4 * s, 0, 0, 6.283); ctx.fill();
          // canali Na+ al nodo
          ctx.fillStyle = css('--na');
          for (var q2 = 0; q2 < 3; q2++) { ctx.beginPath(); ctx.arc(xs1 + g.gw * (q2 + 0.5) / 3, y1 - 0.5, 1.5 * s, 0, 6.283); ctx.arc(xs1 + g.gw * (q2 + 0.5) / 3, y2 + 0.5, 1.5 * s, 0, 6.283); ctx.fill(); }
          // alone di attività al nodo
          var vn = V[nd];
          if (vn > -30) {
            var al = Math.min(1, (vn + 30) / 50), cx = g.nodeX(k) + g.gw / 2 - g.gw / 2 + g.gw / 2 - g.gw / 2 + g.gw / 2; cx = xs1 + g.gw / 2;
            var rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15 * s); rg.addColorStop(0, 'rgba(255,60,30,' + 0.75 * al + ')'); rg.addColorStop(1, 'rgba(255,60,30,0)');
            ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, 15 * s, 0, 6.283); ctx.fill();
          }
        }
        // ---- correnti locali: frecce nell'assone e arco di ritorno all'esterno
        for (k = 0; k < g.nN; k++) {
          nd = c.nodeIdx[k]; var m = nd - 3, Iax = c.gax[m] * (V[m] - V[m + 1]), mag = Math.min(1, Math.abs(Iax) / 3e-4);
          if (mag < 0.06) continue;
          xs0 = (k === 0 ? g.a1 : g.nodeX(k - 1) + g.gw / 2); xs1 = g.nodeX(k) - g.gw / 2;
          var dir = Iax > 0 ? 1 : -1, ph = flow[k] % 1, spacing = 14 * s;
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.6 * mag) + ')'; ctx.lineWidth = 1.5 * s;
          for (var xp = xs0 + 8 * s; xp < xs1 - 8 * s; xp += spacing) {
            var cxp = xp + (dir > 0 ? ph : 1 - ph) * spacing; if (cxp < xs0 + 6 * s || cxp > xs1 - 6 * s) continue;
            ctx.beginPath(); ctx.moveTo(cxp - dir * 2.5 * s, cy - 2.2 * s); ctx.lineTo(cxp + dir * 1.5 * s, cy); ctx.lineTo(cxp - dir * 2.5 * s, cy + 2.2 * s); ctx.stroke();
          }
          // arco di ritorno (extracellulare), sopra la guaina e il nucleo di Schwann
          var ya0 = cy - g.axW / 2 - g.sheathH - 7 * s, yTop = ya0 - 17 * s - 6 * s * mag;
          ctx.strokeStyle = 'rgba(224,70,50,' + (0.25 + 0.65 * mag) + ')'; ctx.lineWidth = 1.4 * s; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -dir * flow[k] * 7 * s * -1;
          ctx.beginPath(); ctx.moveTo(xs0 + 2 * s, cy - g.axW / 2 - 1); ctx.bezierCurveTo(xs0 - 4 * s, yTop, xs1 + 4 * s, yTop, xs1 - 2 * s, cy - g.axW / 2 - 1); ctx.stroke(); ctx.setLineDash([]);
          // punta della freccia di ritorno (verso il nodo che sta cedendo corrente)
          var hx = dir > 0 ? xs0 + 2 * s : xs1 - 2 * s, hy = cy - g.axW / 2 - 1;
          ctx.fillStyle = 'rgba(224,70,50,' + (0.35 + 0.6 * mag) + ')'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + (dir > 0 ? -3 : 3) * s - 2.2 * s * 0, hy - 7 * s); ctx.lineTo(hx + (dir > 0 ? 3.2 : -3.2) * s, hy - 6 * s); ctx.closePath();
          ctx.fill();
        }
        // ---- terminale e bottoni sinaptici
        var xt0 = g.nodeX(g.nN - 1) + g.gw, vt = V[c.nodeIdx[g.nN - 1]], tx = g.axEnd;
        ctx.strokeStyle = vcol(vt); ctx.lineWidth = g.axW; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xt0, cy); ctx.lineTo(tx - g.tw * 0.45, cy); ctx.stroke();
        [[-1, -26], [0, 0], [1, 26]].forEach(function (b, bi) {
          var ey = cy + b[1] * s, ex = tx - 5 * s;
          ctx.strokeStyle = vcol(vt); ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.moveTo(tx - g.tw * 0.45, cy); ctx.quadraticCurveTo(tx - g.tw * 0.2, ey, ex - 6 * s, ey); ctx.stroke();
          ctx.fillStyle = vcol(vt); ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ex, ey, 7.5 * s, 6 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
          // vescicole
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (var v2 = 0; v2 < 3; v2++) { ctx.beginPath(); ctx.arc(ex - 2.5 * s + v2 * 2.8 * s, ey + (v2 % 2 ? 1.2 : -1.2) * s, 1.1 * s, 0, 6.283); ctx.fill(); }
        });

        // ---- soma
        blob(ctx, g.sx, cy, g.rx, g.ry);
        var sg = ctx.createRadialGradient(g.sx - g.rx * 0.25, cy - g.ry * 0.3, g.rx * 0.1, g.sx, cy, g.rx * 1.1); sg.addColorStop(0, vcol(Vs, 0.80)); sg.addColorStop(1, vcol(Vs));
        ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = dark ? 'rgba(20,20,30,0.30)' : 'rgba(255,255,255,0.42)'; ctx.strokeStyle = outline; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(g.sx - g.rx * 0.1, cy + g.ry * 0.02, g.rx * 0.46, g.ry * 0.46, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(70,40,110,0.75)'; ctx.beginPath(); ctx.arc(g.sx - g.rx * 0.02, cy - g.ry * 0.05, g.rx * 0.13, 0, 6.283); ctx.fill();
        ctx.fillStyle = dark ? 'rgba(240,240,250,0.45)' : 'rgba(60,60,80,0.40)';
        [[-0.62, -0.5], [0.45, 0.55], [-0.5, 0.6], [0.6, -0.4], [0.1, 0.82]].forEach(function (q) { ctx.beginPath(); ctx.arc(g.sx + q[0] * g.rx, cy + q[1] * g.ry, 1.3 * s, 0, 6.283); ctx.fill(); });

        // ---- sinapsi
        function bouton(x, y, ang, id, kind) {
          var on = st.on[id], fl = 0, T0 = null;
          run.ev.forEach(function (e) { if (e.site === id) { var dt = t - e.t0; if (dt >= -0.1 && dt < 3) { fl = Math.max(fl, 1 - dt / 3); } T0 = e.t0; } });
          var len = 28 * s, bx = x + Math.cos(ang) * 11 * s, by = y + Math.sin(ang) * 11 * s;
          var ox = x + Math.cos(ang) * (11 * s + len), oy = y + Math.sin(ang) * (11 * s + len);
          ctx.strokeStyle = dark ? 'rgba(200,205,215,0.55)' : 'rgba(90,95,110,0.60)'; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ox, oy); ctx.stroke();
          var base = kind === 'E' ? [58, 166, 117] : [138, 92, 194];
          ctx.fillStyle = 'rgba(' + base.join(',') + ',' + (on ? 1 : 0.45) + ')';
          ctx.strokeStyle = on ? (dark ? '#fff' : '#111') : outline; ctx.lineWidth = on ? 2 : 1;
          ctx.beginPath(); ctx.ellipse(bx, by, 8.5 * s, 6.5 * s, ang + Math.PI / 2, 0, 6.283); ctx.fill(); ctx.stroke();
          if (fl > 0) {
            ctx.fillStyle = 'rgba(255,230,120,' + 0.9 * fl + ')'; ctx.beginPath(); ctx.arc(bx, by, 11 * s * (1.2 - fl * 0.4), 0, 6.283); ctx.fill();
            ctx.fillStyle = 'rgba(' + base.join(',') + ',1)'; ctx.beginPath(); ctx.ellipse(bx, by, 8.5 * s, 6.5 * s, ang + Math.PI / 2, 0, 6.283); ctx.fill();
            for (var q = 0; q < 4; q++) { var f2 = (1 - fl) * 0.9 + q * 0.07; ctx.fillStyle = 'rgba(255,255,255,' + fl + ')'; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * (9 - 14 * Math.min(1, f2)) * s + (q - 1.5) * 2.2 * s, y + Math.sin(ang) * (9 - 14 * Math.min(1, f2)) * s, 1.3 * s, 0, 6.283); ctx.fill(); }
          }
          text(ctx, id, ox + (Math.cos(ang) < 0 ? -2 : 2) * s, oy - 4 * s, 'center', on ? txt : muted, Math.round(11 * Math.max(0.9, s)), true);
          hit.push({ id: id, x: bx, y: by, r: 15 * s });
        }
        SITES.forEach(function (sit) {
          if (sit.kind === 'I') bouton(g.sx - g.rx * 0.45, cy - g.ry * 0.92, -2.2, 'I', 'I');
          else { var p = g.dendP(sit.d); bouton(p.x, p.y - g.dendW(sit.d) / 2, -Math.PI / 2 - 0.05, sit.id, 'E'); }
        });

        // ---- elettrodi di registrazione (dal basso)
        function elec(e, x, ytop) {
          var col = css(e.color), yb = ybot;
          ctx.strokeStyle = col; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 6 * s, yb); ctx.lineTo(x, ytop + 1); ctx.stroke();
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, ytop, 2.6 * s, 0, 6.283); ctx.fill();
          ctx.beginPath(); ctx.arc(x - 6 * s, yb + 5 * s, 7 * s, 0, 6.283); ctx.fill();
          text(ctx, e.key, x - 6 * s, yb + 8.5 * s, 'center', '#fff', Math.round(9.5 * Math.max(0.9, s)), true);
        }
        var p1 = g.dendP(600), p2 = g.dendP(100);
        elec(ELEC[0], p1.x, p1.y + g.dendW(600) / 2);
        elec(ELEC[1], p2.x, p2.y + g.dendW(100) / 2);
        elec(ELEC[2], g.sx + g.rx * 0.2, cy + g.ry * 0.92);
        elec(ELEC[3], g.ax0 + g.hl + g.al * 0.5, cy + 5.5 * s);
        elec(ELEC[4], g.nodeX(4) + g.gw / 2, cy + g.axW / 2 + 1);

        // ---- etichette
        var fs = Math.round(11 * Math.max(0.9, s)), wide = w >= 620;
        text(ctx, 'Dendrite', g.dx0 + (g.dx1 - g.dx0) * 0.5, cy - 78 * s, 'center', muted, fs);
        text(ctx, 'Soma', g.sx - g.rx * 0.7, cy + g.ry + 17 * s, 'center', muted, fs);
        text(ctx, 'Segmento iniziale', g.ax0 + g.hl + g.al / 2, cy - 47 * s, 'center', muted, fs); text(ctx, '(innesco del PdA)', g.ax0 + g.hl + g.al / 2, cy - 35 * s, 'center', muted, fs);
        text(ctx, wide ? 'Assone mielinico — guaina della cellula di Schwann' : 'Assone mielinico', (g.nodeX(0) + g.nodeX(3)) / 2, cy - 62 * s, 'center', muted, fs);
        text(ctx, 'nodo di Ranvier', g.nodeX(3) + g.gw / 2, cy + 36 * s, 'center', muted, fs);
        ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.nodeX(3) + g.gw / 2, cy + 28 * s); ctx.lineTo(g.nodeX(3) + g.gw / 2, cy + 8 * s); ctx.stroke();
        text(ctx, 'Terminali', w - 8, cy + 48 * s, 'right', muted, fs);
        text(ctx, 't = ' + F.fmt(t, 2) + ' ms', w - 8, 16, 'right', txt, 12, true);
        // scala di colore
        var bw = Math.min(120, w * 0.2), bx0 = w - bw - 10, by0 = h - 22;
        var cg = ctx.createLinearGradient(bx0, 0, bx0 + bw, 0);
        for (i = 0; i <= 12; i++) cg.addColorStop(i / 12, vcol(-85 + 120 * i / 12));
        ctx.fillStyle = cg; ctx.fillRect(bx0, by0, bw, 7);
        text(ctx, '−85', bx0, by0 + 18, 'left', muted, 9.5); text(ctx, 'Vm (mV)', bx0 + bw / 2, by0 + 18, 'center', muted, 9.5); text(ctx, '+35', bx0 + bw, by0 + 18, 'right', muted, 9.5);
        text(ctx, 'schema non in scala', 8, h - 6, 'left', muted, 10);
      }

      var cv = U.canvas2d(L.main, function (w) { return Math.round(Math.max(270, Math.min(320, w * 0.42))); }, function (ctx, w, h) { drawFigure(ctx, w, h); });
      cv.canvas.style.cursor = 'default';
      function evPos(e) { var r = cv.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      cv.canvas.addEventListener('click', function (e) {
        var p = evPos(e);
        for (var i = 0; i < hit.length; i++) if (Math.hypot(p.x - hit[i].x, p.y - hit[i].y) < hit[i].r) { tg[hit[i].id].set(!st.on[hit[i].id]); return; }
      });
      cv.canvas.addEventListener('mousemove', function (e) {
        var p = evPos(e), on = hit.some(function (h2) { return Math.hypot(p.x - h2.x, p.y - h2.y) < h2.r; });
        cv.canvas.style.cursor = on ? 'pointer' : 'default';
      });

      // ---------------------------------------------------------------- barra di riproduzione
      var bPlay = U.button('▶ Riproduci l\'evento', function () { play(); }, 'primary');
      var sTime = U.slider({ label: 'Istante', min: 0, max: 10, step: 0.05, value: 0, digits: 2, unit: 'ms', onInput: function (v) { st.playing = false; st.pos = Math.min(run.frames.length - 1, v / (EVERY * DT)); draw(true); } });
      var bar = el('div', { class: 'row', style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', margin: '8px 0' } }, [bPlay, el('div', { style: { flex: '1 1 220px', minWidth: '200px' } }, [sTime.el])]);
      L.main.appendChild(bar);
      L.main.appendChild(ro.el);
      function play() { st.pos = 0; st.playing = true; draw(true); }
      function syncUI() {
        sTime.input.max = run.tEnd; sTime.input.step = EVERY * DT;
      }

      // ---------------------------------------------------------------- grafici
      var pT = U.plot(L.main, { title: 'Potenziale di membrana nei cinque punti di registrazione', xlabel: 'tempo (ms)', ylabel: 'Vm (mV)', height: 230, ylim: [-90, 45] });
      var pE = U.plot(L.main, { title: 'Ampiezza massima raggiunta lungo il neurone: il potenziale locale si attenua, il PdA no', xlabel: 'distanza dal soma (µm):  ← dendrite  |  assone →', ylabel: 'Vm massimo (mV)', height: 230, ylim: [-90, 45], legend: false });
      function drawPlots() {
        var k = Math.floor(st.pos), c = cable, fr = run.frames, i;
        var t = run.t.slice(0, k + 1);
        var series = ELEC.map(function (e) {
          var idx = e.at(c), y = new Array(k + 1);
          for (i = 0; i <= k; i++) y[i] = fr[i][idx];
          return { name: e.name, x: t, y: y, color: e.color, width: 2 };
        });
        pT.update({ series: series, xlim: [0, run.tEnd], hlines: [{ y: THRESH, color: '--bad', label: 'soglia ≈ −57 mV', include: false }, { y: -65, color: '--muted', label: 'riposo', include: false }], vlines: [{ x: tNow(), color: '--muted', dash: true }] });
        // profilo dei massimi (fino all'istante corrente)
        var mx = new Float64Array(run.n).fill(-1e9);
        for (i = 0; i <= k; i++) for (var j = 0; j < run.n; j++) if (fr[i][j] > mx[j]) mx[j] = fr[i][j];
        var xs = [], ys = [], nx = [], ny = [];
        for (j = 0; j < run.n; j++) {
          var kd = c.kind[j];
          if (kd === 'dend' || kd === 'soma' || kd === 'ais' || kd === 'node') { xs.push(c.x[j] * 1e4); ys.push(mx[j]); }
          if (kd === 'node' && c.nodeIdx.indexOf(j) >= 0) { nx.push(c.x[j] * 1e4); ny.push(mx[j]); }
        }
        // i nodi nascosti oltre il quinto non si disegnano
        var xlast = c.x[c.nodeIdx[4]] * 1e4 + 30;
        var keep = xs.map(function (x) { return x <= xlast; });
        xs = xs.filter(function (_, q) { return keep[q]; }); ys = ys.filter(function (_, q) { return keep[q]; });
        pE.update({
          series: [{ x: xs, y: ys, color: '--c1', width: 2.2 }, { x: nx, y: ny, type: 'points', color: '--na', r: 4 }],
          xlim: [-c.dendLen * 1e4 - 30, xlast + 30],
          hlines: [{ y: THRESH, color: '--bad', label: 'soglia', include: false }, { y: -65, color: '--muted', include: false }],
          vlines: ELEC.map(function (e) { return { x: c.x[e.at(c)] * 1e4, label: e.key, color: e.color }; })
        });
      }

      // ---------------------------------------------------------------- ciclo
      var dirty = true, lastT = 0;
      function draw(force) { dirty = dirty || force; }
      function frame(dt) {
        if (!run) return;
        if (st.playing) {
          // rallentatore automatico mentre il PdA percorre l'assone: altrimenti i nodi si accenderebbero in 0,3 ms (impercettibili)
          var V0 = currentV(), act = false, c0 = cable;
          act = V0[c0.aisIndex + 3] > -25 && V0[c0.nodeIdx[4]] < -10; // dall'innesco all'arrivo al quinto nodo
          var adv = dt * (act ? MSPS / 20 : MSPS) * st.speed / (EVERY * DT);
          st.pos = Math.min(run.frames.length - 1, st.pos + adv);
          if (st.pos >= run.frames.length - 1) st.playing = false;
          dirty = true;
        }
        // frecce delle correnti locali: fase che avanza con il verso e l'intensità
        if (st.playing || dirty) {
          var V = currentV(), c = cable, seg = 6;
          for (var k = 0; k < 5; k++) { var m = c.nodeIdx[k] - 3, I = c.gax[m] * (V[m] - V[m + 1]); flow[k] += (st.playing ? dt : 0.016) * Math.sign(I) * Math.min(1, Math.abs(I) / 3e-4) * 3.2; if (flow[k] < 0) flow[k] += 1000; }
        }
        if (dirty) {
          dirty = false;
          sTime.set(tNow(), true);
          cv.redraw(); drawPlots();
        }
      }
      var loop = U.loop(L.main, frame);
      simulate(true); play();

      /*EXPLAIN-START*/
      // ---- Spiegazione guidata: cosa sta succedendo + prove ----
      var base = function () {
        SITES.forEach(function (s) { st.on[s.id] = false; tg[s.id].el.querySelector('input').checked = false; });
        st.N = 6; sN.set(6, true); st.np = 1; sNp.set(1, true); st.freq = 200; sF.set(200, true); st.dd = 1; sDd.set(1, true); st.Rm = 20; sRm.set(20, true);
      };
      var go = function (o) {
        base();
        if (o.N) { st.N = o.N; sN.set(o.N, true); }
        if (o.np) { st.np = o.np; sNp.set(o.np, true); }
        if (o.freq) { st.freq = o.freq; sF.set(o.freq, true); }
        if (o.dd) { st.dd = o.dd; sDd.set(o.dd, true); }
        if (o.Rm) { st.Rm = o.Rm; sRm.set(o.Rm, true); }
        SITES.forEach(function (s) { var v = (o.sites || []).indexOf(s.id) >= 0; st.on[s.id] = v; tg[s.id].el.querySelector('input').checked = v; });
        simulate(true); play();
      };
      U.explainer(L, {
        watch: ro,
        base: function () { base(); simulate(true); },
        legend: [['#8ea2c0', 'grigio-azzurro: membrana a riposo (−65 mV)'], ['#ecc05c', 'giallo-arancio: depolarizzazione sottosoglia (potenziale locale)'], ['#de3c2a', 'rosso: potenziale d\'azione'], ['#3466be', 'blu: iperpolarizzazione'], ['#f7f0d6', 'guaina di mielina (internodi)']],
        narrate: function () {
          if (!run) return '';
          var f = F.fmt, sel = SITES.filter(function (s) { return st.on[s.id]; }), lam = cable.lambda_um, s;
          if (!sel.length) return `Scegli quali sinapsi attivare (le caselle a sinistra o un clic sul disegno) e premi «Riproduci». Il neurone è a riposo (−65 mV) e i cinque elettrodi registrano un tracciato piatto.`;
          var exc = sel.filter(function (q) { return q.kind === 'E'; }), inh = sel.some(function (q) { return q.kind === 'I'; });
          var soma = run.mx[cable.somaIndex], somaMin = run.mn[cable.somaIndex];
          s = '';
          if (exc.length) {
            s += `Ogni sinapsi eccitatoria apre canali che depolarizzano il dendrite nel punto d'ingresso: è un <b>potenziale postsinaptico locale</b> (PPSE), <b>graduato</b> (dipende da quante sinapsi sono attive: ${st.N}) e <b>decrementale</b>. Nel dendrite passivo si spegne con la distanza secondo V = V<sub>0</sub>·e<sup>−x/λ</sup> con λ = ${f(lam, 0)} µm: nel disegno il colore arancio è più intenso vicino alla sinapsi e sbiadisce allontanandosi; nel grafico in basso la curva scende con la distanza. `;
            if (exc.length > 1) s += `Con più gruppi di sinapsi eccitatorie i potenziali si <b>sommano nello spazio</b>. `;
            if (st.np > 1) s += `${st.np} impulsi ravvicinati si <b>sommano nel tempo</b>: il secondo arriva quando il primo non è ancora spento. `;
          }
          if (inh) s += `La sinapsi inibitoria (IPSP) iperpolarizza il soma (blu) e <b>sottrae</b> depolarizzazione alla somma. `;
          if (run.fired) {
            s += `La somma al <b>segmento iniziale</b> ha raggiunto la soglia (≈ −57 mV in questo modello): lì, dove i canali Na⁺ sono più densi, nasce il <b>potenziale d'azione</b>. È <b>tutto-o-nulla</b> e viaggia <b>senza decremento</b>: ai nodi 1…5 il picco è lo stesso (≈ +${f(Math.min.apply(null, run.nodeMax), 0)} mV), mentre i potenziali locali nel dendrite si erano attenuati. Il dendrite è passivo (senza canali voltaggio-dipendenti) e non conduce il PdA: quello che si vede tornare nel dendrite si spegne subito, come un potenziale locale. L'assone mielinico invece lo conduce, «saltando» da nodo a nodo (le frecce rosse sono le correnti locali). Velocità ≈ ${run.vel ? f(run.vel, 1) : '—'} m/s.`;
            if (run.nAP > 1) s += ` Hai ottenuto <b>${run.nAP} potenziali d'azione</b>: ciascuno ha la stessa ampiezza (non si sommano) e sono separati dal periodo refrattario.`;
          } else if (exc.length) {
            s += `Al soma il picco è ${f(soma, 0)} mV: la soglia (≈ −57 mV) <b>non è raggiunta</b>, quindi non nasce nessun PdA. Il potenziale locale si è estinto a breve distanza, senza arrivare all'assone.`;
          } else if (inh) {
            s += `Nessuna eccitazione: il soma scende fino a ${f(somaMin, 0)} mV e non c'è alcun PdA.`;
          }
          return s;
        },
        experiments: [
          { label: 'Una sinapsi lontana (E1)', run: function () { go({ sites: ['E1'], N: 25 }); }, why: `Con 25 sinapsi attive il potenziale locale raggiunge circa 26 mV sopra il riposo nel punto d'ingresso (600 µm dal soma), ma al soma ne arrivano appena 5: <b>si attenua con la distanza</b> (λ ≈ 0,7 mm). La soglia non viene raggiunta e il PdA non nasce.` },
          { label: 'Una sinapsi vicina (E3)', run: function () { go({ sites: ['E3'], N: 6 }); }, why: `Un gruppo di sinapsi a 100 µm dal soma produce un potenziale locale <b>sottosoglia</b>: graduato, senza PdA. Più sinapsi o più impulsi lo farebbero crescere (provalo con il cursore).` },
          { label: 'Sommazione spaziale (E1+E2+E3)', run: function () { go({ sites: ['E1', 'E2', 'E3'], N: 6 }); }, why: `Ognuno dei tre gruppi, da solo, non porta alla soglia (prova a disattivarne due). Insieme i potenziali locali si <b>sommano nello spazio</b> al soma e al segmento iniziale: la soglia viene superata e parte il PdA.` },
          { label: 'Sommazione temporale (5 impulsi a 400 Hz)', run: function () { go({ sites: ['E3'], N: 5, np: 5, freq: 400 }); }, why: `Un solo impulso non basta. Cinque impulsi a 400 Hz (uno ogni 2,5 ms) arrivano quando il precedente non si è ancora spento (la costante di tempo della membrana è ~20 ms): i potenziali si <b>sommano nel tempo</b> fino a superare la soglia.` },
          { label: 'Inibizione sul soma (E1+E2+E3 + I)', run: function () { go({ sites: ['E1', 'E2', 'E3', 'I'], N: 10 }); }, why: `Con le sole tre sinapsi eccitatorie (N = 10) il neurone scarica; con l'inibizione sul soma lo stesso ingresso resta sottosoglia: l'IPSP iperpolarizza e <b>sottrae</b> depolarizzazione. Il neurone integra segnali di segno opposto.` },
          { label: 'Il PdA non si attenua', run: function () { go({ sites: ['E3'], N: 20 }); }, why: `Guarda il profilo in basso: la curva scende nel dendrite (potenziale locale) e poi, superata la soglia, il PdA ha <b>la stessa ampiezza in ogni nodo</b> (≈ +30 mV). Con 40 sinapsi invece di 20 il picco ai nodi non cambia: tutto-o-nulla.` },
          { label: 'Dendrite sottile (0,5 µm)', run: function () { go({ sites: ['E1'], N: 25, dd: 0.5 }); }, why: `λ ∝ √d: dimezzando il diametro λ passa da circa 700 a 500 µm. Nel punto d'ingresso il potenziale è più ampio (la resistenza locale è maggiore), ma al soma ne arriva ancora meno: l'attenuazione è più forte.` },
          { label: 'Periodo refrattario (5 impulsi a 500 Hz)', run: function () { go({ sites: ['E3'], N: 20, np: 5, freq: 500 }); }, why: `Cinque impulsi a 500 Hz (uno ogni 2 ms) producono solo <b>2 potenziali d'azione</b>: subito dopo un PdA i canali Na⁺ sono inattivati (<b>refrattarietà</b>) e il neurone non può rispondere a ogni impulso. I PdA non si sommano.` }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { loop.stop(); pT.dispose(); pE.dispose(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
