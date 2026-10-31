/* Modelli stocastici: singolo canale (catena di Markov, algoritmo di Gillespie)
   e rilascio quantale del neurotrasmettitore (del Castillo & Katz). */
(function (G) {
  'use strict';
  var F = G.Fisio;

  /** Canale a due stati C ⇌ O. alpha = velocità C→O (1/ms), beta = O→C (1/ms).
      Restituisce la traccia campionata (dtSample ms) e i tempi di permanenza.
      Corrente di canale aperto i = γ (V − Erev): γ in pS, V in mV → pA (×1e-3). */
  F.singleChannel = function (o) {
    var rng = F.rng(o.seed || 1), alpha = o.alpha, beta = o.beta, T = o.duration || 500, dts = o.dtSample || 0.1;
    var nCh = o.nChannels || 1, i1 = o.gamma * (o.V - o.Erev) * 1e-3, noise = o.noise === undefined ? 0.1 : o.noise;
    var nS = Math.floor(T / dts) + 1, state = new Float64Array(nS), cur = new Float64Array(nS), tt = new Float64Array(nS);
    var openDw = [], closedDw = [];
    for (var c = 0; c < nCh; c++) {
      var po = alpha / (alpha + beta);
      var s = rng() < po ? 1 : 0, t = 0;
      var tNext = rng.exp(s ? beta : alpha), tLast = 0;
      for (var k = 0; k < nS; k++) {
        var tk = k * dts;
        while (tNext <= tk) {
          if (c === 0 && tLast > 0) (s ? openDw : closedDw).push(tNext - tLast);
          tLast = tNext; s = 1 - s;
          tNext += rng.exp(s ? beta : alpha);
        }
        state[k] += s;
      }
    }
    for (k = 0; k < nS; k++) { tt[k] = k * dts; cur[k] = state[k] * i1 + noise * Math.abs(i1 || 1) * rng.gauss(); }
    return {
      t: tt, state: state, I: cur, iOpen: i1, openDwell: openDw, closedDwell: closedDw,
      Po: alpha / (alpha + beta), meanOpen: 1 / beta, meanClosed: 1 / alpha
    };
  };

  /** Probabilità di rilascio da [Ca]o e [Mg]o (forma di Dodge & Rahamimoff, 1967):
      p = pmax · (W/(1+W))^4 con W = [Ca]/K_Ca / (1 + [Mg]/K_Mg). */
  F.releaseProb = function (Ca, Mg, o) {
    o = o || {};
    var KCa = o.KCa || 1.0, KMg = o.KMg || 3.0, pmax = o.pmax === undefined ? 0.77 : o.pmax;
    var x = (Ca / KCa) / (1 + Ca / KCa + Mg / KMg);
    return pmax * Math.pow(x, 4);
  };

  /** Simula N potenziali di placca evocati. n siti, probabilità p, quanto q (mV) con CV.
      Correzione di Martin (1955) per la sommazione non lineare: V = Vlin / (1 + Vlin/Edrive). */
  F.quantalEPP = function (o) {
    var rng = F.rng(o.seed || 7), N = o.trials || 300, n = o.n || 2000, p = o.p, q = o.q || 0.4, cv = o.cv === undefined ? 0.2 : o.cv;
    var Ed = o.Edrive || 75, res = [], ks = [];
    for (var j = 0; j < N; j++) {
      var k = rng.binomial(n, p), v = 0;
      for (var i = 0; i < k; i++) v += Math.max(0, q * (1 + cv * rng.gauss()));
      if (o.nonlinear !== false) v = v / (1 + v / Ed);
      res.push(v); ks.push(k);
    }
    return { amp: res, k: ks, m: n * p };
  };

  /** Densità teorica dell'istogramma (Poisson con quanti gaussiani). */
  F.quantalPDF = function (x, m, q, sdq, sdNoise) {
    var s = 0, pk = Math.exp(-m);
    for (var k = 0; k < 60; k++) {
      if (k > 0) pk *= m / k;
      if (k === 0) continue; // i fallimenti sono mostrati a parte
      var sd = Math.sqrt(k * sdq * sdq + (sdNoise || 0.02) * (sdNoise || 0.02));
      s += pk * Math.exp(-0.5 * Math.pow((x - k * q) / sd, 2)) / (sd * Math.sqrt(2 * Math.PI));
    }
    return s;
  };

  /** Potenziali di placca in miniatura spontanei (processo di Poisson). */
  F.mepps = function (o) {
    var rng = F.rng(o.seed || 3), rate = o.rate || 1, T = o.duration || 10000, q = o.q || 0.4, cv = o.cv || 0.25;
    var dt = o.dt || 1, n = Math.floor(T / dt), V = new Float64Array(n), tau = o.tau || 3, tr = o.rise || 0.5;
    var events = [], t = rng.exp(rate / 1000);
    while (t < T) { events.push({ t: t, a: Math.max(0.05, q * (1 + cv * rng.gauss())) }); t += rng.exp(rate / 1000); }
    var tt = new Float64Array(n);
    // normalizzazione: picco della doppia esponenziale = 1
    var sPk = Math.log(tau / tr) * tau * tr / (tau - tr), norm = Math.exp(-sPk / tau) - Math.exp(-sPk / tr);
    for (var i = 0; i < n; i++) { tt[i] = i * dt; V[i] = 0.03 * rng.gauss(); }
    events.forEach(function (e) {
      var i0 = Math.ceil(e.t / dt);
      for (var i = i0; i < Math.min(n, i0 + Math.ceil(8 * tau / dt)); i++) {
        var s = i * dt - e.t;
        V[i] += e.a * (Math.exp(-s / tau) - Math.exp(-s / tr)) / norm;
      }
    });
    return { t: tt, V: V, events: events };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
