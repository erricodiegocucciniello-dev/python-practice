/* Modello a compartimenti di un cavo (assone, dendrite, neurone "palla e bastoncino").
   Ogni compartimento: capacità, canali (passivi o Hodgkin-Huxley), accoppiamento assiale.
   Integrazione: gate con Eulero esponenziale; voltaggio con Eulero implicito (sistema
   tridiagonale) → stabile anche con compartimenti molto piccoli (nodi di Ranvier).
   Unità: area cm², cm µF/cm², g mS/cm², gax mS, correnti µA, V mV, t ms. */
(function (G) {
  'use strict';
  var F = G.Fisio, HH = F.HH;

  function Cable(cfg) {
    var n = this.n = cfg.n;
    this.area = Float64Array.from(cfg.area);
    this.cm = Float64Array.from(cfg.cm);
    this.gax = Float64Array.from(cfg.gax);          // n-1 conduttanze assiali
    this.isHH = Uint8Array.from(cfg.isHH);
    this.gNa = Float64Array.from(cfg.gNa); this.gK = Float64Array.from(cfg.gK);
    this.gL = Float64Array.from(cfg.gL); this.EL = Float64Array.from(cfg.EL);
    this.ENa = cfg.ENa === undefined ? 50 : cfg.ENa;
    this.EK = cfg.EK === undefined ? -77 : cfg.EK;
    this.T = cfg.T === undefined ? 6.3 : cfg.T;
    this.x = Float64Array.from(cfg.x || F.linspace(0, n - 1, n)); // posizione (cm)
    this.kind = cfg.kind || [];
    this.V = new Float64Array(n); this.m = new Float64Array(n); this.h = new Float64Array(n); this.nn = new Float64Array(n);
    this._a = new Float64Array(n); this._b = new Float64Array(n); this._c = new Float64Array(n); this._d = new Float64Array(n);
    this.Iext = new Float64Array(n); this.gSyn = new Float64Array(n); this.ESyn = new Float64Array(n);
    this.t = 0;
    this.reset(cfg.V0 === undefined ? -65 : cfg.V0);
  }
  Cable.prototype.reset = function (V0, settle) {
    var s = HH.inf(V0);
    for (var i = 0; i < this.n; i++) { this.V[i] = V0; this.m[i] = s.m; this.h[i] = s.h; this.nn[i] = s.n; }
    this.Iext.fill(0); this.gSyn.fill(0); this.ESyn.fill(0);
    this.t = 0;
    if (settle !== false) { for (var k = 0; k < 2000; k++) this.step(0.025); this.t = 0; }
  };
  /** Un passo di integrazione. Usa this.Iext (µA, positivo = depolarizzante) e this.gSyn/this.ESyn. */
  Cable.prototype.step = function (dt) {
    var n = this.n, phi = HH.phi(this.T), V = this.V, a = this._a, b = this._b, c = this._c, d = this._d;
    for (var i = 0; i < n; i++) {
      var Gt = this.gL[i], S = this.gL[i] * this.EL[i];
      if (this.isHH[i]) {
        var r = HH.rates(V[i], phi);
        var tm = 1 / (r.am + r.bm), th = 1 / (r.ah + r.bh), tn = 1 / (r.an + r.bn);
        this.m[i] = r.am * tm + (this.m[i] - r.am * tm) * Math.exp(-dt / tm);
        this.h[i] = r.ah * th + (this.h[i] - r.ah * th) * Math.exp(-dt / th);
        this.nn[i] = r.an * tn + (this.nn[i] - r.an * tn) * Math.exp(-dt / tn);
        var m = this.m[i], gna = this.gNa[i] * m * m * m * this.h[i], q = this.nn[i], gk = this.gK[i] * q * q * q * q;
        Gt += gna + gk; S += gna * this.ENa + gk * this.EK;
      }
      var A = this.area[i], C = this.cm[i] * A / dt;
      var gs = this.gSyn[i];
      b[i] = C + Gt * A + gs;
      d[i] = C * V[i] + S * A + gs * this.ESyn[i] + this.Iext[i];
      a[i] = 0; c[i] = 0;
    }
    for (i = 0; i < n - 1; i++) {
      var g = this.gax[i];
      b[i] += g; b[i + 1] += g; c[i] = -g; a[i + 1] = -g;
    }
    F.thomas(a, b, c, d, V);
    this.t += dt;
  };

  /** Assone amielinico (calamaro di default: d = 476 µm, Ri = 35,4 Ω·cm). */
  Cable.unmyelinated = function (o) {
    var d = (o.d_um || 476) * 1e-4, L = o.length_cm || 5, n = o.n || 200, Ri = o.Ri || 35.4;
    var dx = L / n, area = Math.PI * d * dx, gax = 1000 * Math.PI * d * d / (4 * Ri * dx);
    var p = HH.defaults();
    var arr = function (v) { return new Array(n).fill(v); };
    return new Cable({
      n: n, area: arr(area), cm: arr(1), gax: new Array(n - 1).fill(gax), isHH: arr(1),
      gNa: arr(p.gNa), gK: arr(p.gK), gL: arr(p.gL), EL: arr(p.EL), T: o.T === undefined ? 18.5 : o.T,
      x: F.linspace(dx / 2, L - dx / 2, n), kind: arr('ax')
    });
  };

  /** Assone mielinico: nodi di Ranvier (1 µm, canali HH ×nodeScale) e internodi passivi
      con mielina (capacità e conduttanza ridotte di un fattore myelinFactor).
      Internodo = 100 × diametro esterno (diametro esterno = d/0,6). */
  Cable.myelinated = function (o) {
    var d = (o.d_um || 10) * 1e-4, Ri = o.Ri || 70, nI = o.nInternodes || 20, seg = o.segPerInternode || 8;
    var Lint = (o.internode_um || 100 * (o.d_um || 10) / 0.6) * 1e-4, Lnode = 1e-4;
    // Spessore della mielina = (D − d)/2 con rapporto g = d/D = 0,6; periodo lamellare ≈ 16 nm.
    // Ogni lamella contiene 2 membrane in serie → Cm e g della mielina divisi per 2·N lamelle.
    var nLam = (o.d_um || 10) * (1 / 0.6 - 1) / 2 / 0.016;
    var scale = o.nodeScale || 10, mf = o.myelinFactor || 2 * nLam;
    var p = HH.defaults();
    var area = [], cm = [], gax = [], isHH = [], gNa = [], gK = [], gL = [], EL = [], x = [], kind = [], len = [];
    var pos = 0;
    var add = function (L, node, k) {
      len.push(L);
      area.push(Math.PI * d * L);
      cm.push(node ? 1 : 1 / mf); isHH.push(node ? 1 : 0);
      gNa.push(node ? p.gNa * scale : 0); gK.push(node ? p.gK * scale : 0);
      gL.push(node ? p.gL * scale : p.gL / mf); EL.push(node ? p.EL : -65);
      x.push(pos + L / 2); pos += L; kind.push(k);
    };
    for (var k = 0; k <= nI; k++) {
      add(Lnode, true, 'node');
      if (k < nI) for (var s = 0; s < seg; s++) add(Lint / seg, false, 'myelin');
    }
    // il passivo della mielina deve stare al riposo: EL = riposo HH (−65) con correnti attive nulle
    for (var i = 0; i < len.length - 1; i++) {
      var dist = (len[i] + len[i + 1]) / 2;
      gax.push(1000 * Math.PI * d * d / (4 * Ri * dist));
    }
    return new Cable({
      n: area.length, area: area, cm: cm, gax: gax, isHH: isHH, gNa: gNa, gK: gK, gL: gL, EL: EL,
      T: o.T === undefined ? 18.5 : o.T, x: x, kind: kind
    });
  };

  /** Neurone "palla e bastoncino": dendrite passivo (nD compartimenti), soma e segmento
      iniziale dell'assone eccitabili (HH). Il dendrite è a sinistra (indici 0..nD-1),
      il soma all'indice nD, poi l'assone. */
  Cable.ballStick = function (o) {
    o = o || {};
    var nD = o.nDend || 40, Ld = (o.dendLen_um || 800) * 1e-4, dd = (o.dendDiam_um || 2) * 1e-4;
    var Ri = o.Ri || 150, Rm = o.Rm || 20000; // Ω·cm, Ω·cm²
    var somaD = (o.somaDiam_um || 20) * 1e-4, nA = o.nAxon || 20, La = (o.axonLen_um || 400) * 1e-4, da = (o.axonDiam_um || 1) * 1e-4;
    var p = HH.defaults(), gpas = 1000 / Rm; // mS/cm²
    var area = [], cm = [], isHH = [], gNa = [], gK = [], gL = [], EL = [], x = [], kind = [], gax = [];
    var dxd = Ld / nD, dxa = La / nA;
    for (var i = 0; i < nD; i++) {
      area.push(Math.PI * dd * dxd); cm.push(1); isHH.push(0); gNa.push(0); gK.push(0); gL.push(gpas); EL.push(-65);
      x.push(-(Ld - (i + 0.5) * dxd)); kind.push('dend');
    }
    // soma (sfera equivalente)
    area.push(Math.PI * somaD * somaD); cm.push(1); isHH.push(1);
    gNa.push(p.gNa * (o.somaNa === undefined ? 0.35 : o.somaNa)); gK.push(p.gK * 0.35); gL.push(gpas);
    EL.push(-65); x.push(0); kind.push('soma');
    for (i = 0; i < nA; i++) {
      area.push(Math.PI * da * dxa); cm.push(1); isHH.push(1);
      var ais = i < 4; // segmento iniziale: alta densità di canali Na+
      gNa.push(p.gNa * (ais ? 3 : 1)); gK.push(p.gK * (ais ? 1.5 : 1)); gL.push(p.gL); EL.push(p.EL);
      x.push(somaD / 2 + (i + 0.5) * dxa); kind.push(ais ? 'ais' : 'axon');
    }
    for (i = 0; i < nD - 1; i++) gax.push(1000 * Math.PI * dd * dd / (4 * Ri * dxd));
    gax.push(1000 * Math.PI * dd * dd / (4 * Ri * dxd / 2)); // dendrite → soma
    gax.push(1000 * Math.PI * da * da / (4 * Ri * dxa / 2)); // soma → assone
    for (i = 0; i < nA - 1; i++) gax.push(1000 * Math.PI * da * da / (4 * Ri * dxa));
    var c = new Cable({ n: area.length, area: area, cm: cm, gax: gax, isHH: isHH, gNa: gNa, gK: gK, gL: gL, EL: EL, T: o.T === undefined ? 6.3 : o.T, x: x, kind: kind });
    c.somaIndex = nD; c.nDend = nD; c.dendLen = Ld;
    c.lambda_um = Math.sqrt((Rm * dd) / (4 * Ri)) * 1e4;
    c.tau_ms = Rm * 1e-6 * 1000; // Rm·Cm con Cm = 1 µF/cm²
    return c;
  };

  /** Neurone completo "a catena": dendrite passivo (cilindro equivalente di Rall) → soma →
      segmento iniziale dell'assone (SIA: molti canali Na+, zona di innesco) → assone mielinico
      (internodi passivi con mielina + nodi di Ranvier eccitabili) → terminale amielinico.
      Indici: 0..nDend−1 dendrite (0 = estremità distale), poi soma, SIA, internodi/nodi, terminale.
      Il riposo (−65 mV) è reso uniforme regolando EL di ogni compartimento eccitabile. */
  Cable.neuron = function (o) {
    o = o || {};
    var nD = o.nDend || 70, Ld = (o.dendLen_um || 700) * 1e-4, dd = (o.dendDiam_um || 1) * 1e-4;
    var Ri = o.Ri || 100, Rm = o.Rm || 20000, da = (o.axonDiam_um || 2) * 1e-4, nN = o.nNodes || 5, seg = o.segPerInternode || 6;
    var somaD = (o.somaDiam_um || 25) * 1e-4, nAis = 6, Lais = 5e-4, Lnode = 1e-4, nTerm = 3, Lterm = 10e-4;
    var Lint = (o.internode_um || 100 * (da * 1e4) / 0.6) * 1e-4;
    var p = HH.defaults(), gpas = 1000 / Rm, scale = o.nodeScale || 10;
    var nLam = (da * 1e4) * (1 / 0.6 - 1) / 2 / 0.016, mf = o.myelinFactor || 2 * nLam;
    var C = { area: [], cm: [], isHH: [], gNa: [], gK: [], gL: [], EL: [], x: [], kind: [], len: [], dia: [] };
    var pos = 0;
    function add(kind, L, dia, hh, fNa, fK, passive) {
      var area = kind === 'soma' ? Math.PI * dia * dia : Math.PI * dia * L;
      C.area.push(area); C.len.push(L); C.dia.push(dia); C.kind.push(kind); C.isHH.push(hh ? 1 : 0);
      C.cm.push(kind === 'myelin' ? 1 / mf : 1);
      C.gNa.push(hh ? p.gNa * fNa : 0); C.gK.push(hh ? p.gK * fK : 0);
      C.gL.push(passive !== undefined ? passive : (hh ? p.gL : gpas)); C.EL.push(-65);
      C.x.push(pos + (kind === 'soma' ? 0 : L / 2)); pos += (kind === 'soma' ? 0 : L);
    }
    pos = -Ld; for (var i = 0; i < nD; i++) add('dend', Ld / nD, dd, false, 0, 0);
    pos = 0; add('soma', 0, somaD, true, o.somaNa === undefined ? 0.3 : o.somaNa, 0.3, gpas);
    pos = somaD / 2; var aisIdx = C.kind.length;
    for (i = 0; i < nAis; i++) add('ais', Lais, da, true, o.aisNa || 12, o.aisK || 2, p.gL);
    var nodeIdx = [];
    // tre nodi in più oltre l'ultimo mostrato: l'estremità chiusa del modello altera l'ampiezza
    // dei nodi che la precedono, quindi i nodi "visibili" (nodeIdx) stanno prima.
    for (var k = 0; k < nN + 3; k++) {
      for (var s = 0; s < seg; s++) add('myelin', Lint / seg, da, false, 0, 0, p.gL / mf);
      if (k < nN) nodeIdx.push(C.kind.length);
      add('node', Lnode, da, true, scale, scale, p.gL * scale);
    }
    var termIdx = C.kind.length;
    for (i = 0; i < nTerm; i++) add('term', Lterm, da, true, 1, 1, p.gL);
    var n = C.area.length, gax = [], somaI = nD;
    for (i = 0; i < n - 1; i++) {
      var Ai = C.dia[i], Aj = C.dia[i + 1];
      // resistenza assiale in serie: metà del compartimento i + metà del compartimento j (il soma conta zero)
      var ri = (C.kind[i] === 'soma' ? 0 : C.len[i] / 2) * 4 * Ri / (Math.PI * Ai * Ai);
      var rj = (C.kind[i + 1] === 'soma' ? 0 : C.len[i + 1] / 2) * 4 * Ri / (Math.PI * Aj * Aj);
      if (C.kind[i] === 'soma') ri = (C.len[i + 1] / 2) * 4 * Ri / (Math.PI * Aj * Aj) * 0; // soma isopotenziale
      gax.push(1000 / (ri + rj));
    }
    // riposo uniforme: EL tale che la corrente netta sia zero a −65 mV
    var s0 = HH.inf(-65), Vr = -65;
    for (i = 0; i < n; i++) if (C.isHH[i]) {
      var gna = C.gNa[i] * s0.m * s0.m * s0.m * s0.h, gk = C.gK[i] * Math.pow(s0.n, 4);
      C.EL[i] = Vr + (gna * (Vr - 50) + gk * (Vr - (-77))) / C.gL[i];
    }
    var c = new Cable({ n: n, area: C.area, cm: C.cm, gax: gax, isHH: C.isHH, gNa: C.gNa, gK: C.gK, gL: C.gL, EL: C.EL, T: o.T === undefined ? 18.5 : o.T, x: C.x, kind: C.kind });
    c.nDend = nD; c.dendLen = Ld; c.dendDx = Ld / nD; c.somaIndex = somaI; c.aisIndex = aisIdx; c.nodeIdx = nodeIdx; c.termIdx = termIdx;
    c.lambda_um = Math.sqrt((Rm * dd) / (4 * Ri)) * 1e4; c.tau_ms = Rm * 1e-3;
    /** indice del compartimento dendritico a distanza dist_um dal soma */
    c.dendIndexAt = function (dist_um) { return Math.max(0, Math.min(nD - 1, Math.round(nD - dist_um * 1e-4 / (Ld / nD) - 0.5))); };
    return c;
  };

  /** Funzione alfa per la conduttanza sinaptica: g(t) = gmax · (t/tp) · exp(1 − t/tp). */
  Cable.alpha = function (t, tp) { return t <= 0 ? 0 : (t / tp) * Math.exp(1 - t / tp); };
  /** Applica un insieme di sinapsi al tempo corrente: syn = [{i, t0, g (mS), E (mV), tp (ms)}]. */
  Cable.prototype.applySyn = function (syn) {
    var gs = this.gSyn, ge = this._ge || (this._ge = new Float64Array(this.n)), i;
    gs.fill(0); ge.fill(0);
    for (var k = 0; k < syn.length; k++) {
      var s = syn[k], g = s.g * Cable.alpha(this.t - s.t0, s.tp || 0.5);
      if (g > 0) { gs[s.i] += g; ge[s.i] += g * s.E; }
    }
    for (i = 0; i < this.n; i++) this.ESyn[i] = gs[i] > 0 ? ge[i] / gs[i] : 0;
  };

  /** Cavo passivo (dendrite o fibra senza canali) per lo studio di λ e τ. */
  Cable.passive = function (o) {
    var d = (o.d_um || 2) * 1e-4, L = (o.length_um || 2000) * 1e-4, n = o.n || 100, Ri = o.Ri || 150, Rm = o.Rm || 20000;
    var dx = L / n, arr = function (v) { return new Array(n).fill(v); };
    var c = new Cable({
      n: n, area: arr(Math.PI * d * dx), cm: arr(o.cm || 1), gax: new Array(n - 1).fill(1000 * Math.PI * d * d / (4 * Ri * dx)),
      isHH: arr(0), gNa: arr(0), gK: arr(0), gL: arr(1000 / Rm), EL: arr(-65), x: F.linspace(dx / 2, L - dx / 2, n), kind: arr('pas')
    });
    c.lambda_um = Math.sqrt((Rm * d) / (4 * Ri)) * 1e4;
    c.tau_ms = Rm * (o.cm || 1) * 1e-3;
    return c;
  };

  /** Misura la velocità di conduzione (m/s): tempi di attraversamento di 0 mV
      in due punti (indici i1 < i2). Stimola il compartimento 'stim'. */
  Cable.measureVelocity = function (cable, opts) {
    opts = opts || {};
    var dt = opts.dt || 0.005, tmax = opts.tmax || 15, stim = opts.stim || 0, amp = opts.amp, dur = opts.dur || 0.3;
    var i1 = opts.i1, i2 = opts.i2, t1 = null, t2 = null;
    if (amp === undefined) amp = 200 * cable.area[stim] * 1000 / 1000 * 10; // µA, generoso
    cable.reset(-65);
    while (cable.t < tmax) {
      cable.Iext[stim] = cable.t < dur ? amp : 0;
      cable.step(dt);
      if (t1 === null && cable.V[i1] > 0) t1 = cable.t;
      if (t2 === null && cable.V[i2] > 0) { t2 = cable.t; break; }
    }
    if (t1 === null || t2 === null) return { v: NaN, t1: t1, t2: t2 };
    var dist = cable.x[i2] - cable.x[i1]; // cm
    return { v: dist / (t2 - t1) * 10, t1: t1, t2: t2 }; // cm/ms → m/s (×10)
  };

  F.Cable = Cable;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
