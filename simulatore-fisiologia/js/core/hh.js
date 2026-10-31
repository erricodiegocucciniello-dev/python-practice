/* Modelli di membrana eccitabile.
   - Hodgkin & Huxley (1952), assone gigante di calamaro, convenzione moderna (riposo ≈ −65 mV).
   - Connor & Stevens (1977) con corrente K_A (come in Dayan & Abbott, Theoretical Neuroscience, 2001).
   - Adattamento: corrente Ca2+ ad alta soglia + K(Ca) di tipo AHP (Wang, J Neurophysiol 1998). */
(function (G) {
  'use strict';
  var F = G.Fisio;
  var vt = F.vtrap;

  // ---------------------------------------------------------------- Hodgkin-Huxley
  var HH = F.HH = {};
  HH.defaults = function () {
    return { gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387, Cm: 1, T: 6.3 };
  };
  /** Fattore di temperatura con Q10 = 3 (riferimento 6,3 °C, come nel lavoro originale). */
  HH.phi = function (T) { return Math.pow(3, (T - 6.3) / 10); };

  HH.rates = function (V, phi) {
    return {
      am: phi * 0.1 * vt(-(V + 40), 10),
      bm: phi * 4 * Math.exp(-(V + 65) / 18),
      ah: phi * 0.07 * Math.exp(-(V + 65) / 20),
      bh: phi * 1 / (1 + Math.exp(-(V + 35) / 10)),
      an: phi * 0.01 * vt(-(V + 55), 10),
      bn: phi * 0.125 * Math.exp(-(V + 65) / 80)
    };
  };
  HH.inf = function (V) {
    var r = HH.rates(V, 1);
    return {
      m: r.am / (r.am + r.bm), h: r.ah / (r.ah + r.bh), n: r.an / (r.an + r.bn),
      tm: 1 / (r.am + r.bm), th: 1 / (r.ah + r.bh), tn: 1 / (r.an + r.bn)
    };
  };
  HH.currents = function (p, V, m, h, n) {
    var gNa = p.gNa * m * m * m * h, gK = p.gK * n * n * n * n;
    return {
      gNa: gNa, gK: gK,
      INa: gNa * (V - p.ENa), IK: gK * (V - p.EK), IL: p.gL * (V - p.EL)
    };
  };
  /** Stato di riposo (V, m, h, n) trovato integrando senza stimolo fino a regime. */
  HH.rest = function (p) {
    p = p || HH.defaults();
    var V = -65, s = HH.inf(V), y = [V, s.m, s.h, s.n], phi = HH.phi(p.T);
    var f = HH.deriv(p, phi, function () { return 0; });
    for (var k = 0; k < 20000; k++) y = F.rk4(f, 0, y, 0.01); // 200 ms
    return y;
  };
  HH.deriv = function (p, phi, Ifun) {
    return function (t, y) {
      var V = y[0], m = y[1], h = y[2], n = y[3], r = HH.rates(V, phi);
      var c = HH.currents(p, V, m, h, n);
      return [
        (Ifun(t) - c.INa - c.IK - c.IL) / p.Cm,
        r.am * (1 - m) - r.bm * m,
        r.ah * (1 - h) - r.bh * h,
        r.an * (1 - n) - r.bn * n
      ];
    };
  };

  /** Simulazione in current clamp. opts: {p, tmax, dt, I(t) µA/cm², y0, every}.
      Restituisce serie temporali e tempi dei potenziali d'azione. */
  HH.simulate = function (opts) {
    var p = opts.p || HH.defaults();
    var phi = HH.phi(p.T);
    var dt = opts.dt || Math.min(0.01, 0.02 / phi);
    var every = opts.every || Math.max(1, Math.round(0.02 / dt));
    var I = opts.I || function () { return 0; };
    var y = (opts.y0 || HH.rest(p)).slice();
    var f = HH.deriv(p, phi, I);
    var out = { t: [], V: [], m: [], h: [], n: [], INa: [], IK: [], IL: [], gNa: [], gK: [], I: [], spikes: [] };
    var t = 0, k = 0, above = y[0] > 0, tmax = opts.tmax || 50;
    var rec = function () {
      var c = HH.currents(p, y[0], y[1], y[2], y[3]);
      out.t.push(t); out.V.push(y[0]); out.m.push(y[1]); out.h.push(y[2]); out.n.push(y[3]);
      out.INa.push(c.INa); out.IK.push(c.IK); out.IL.push(c.IL); out.gNa.push(c.gNa); out.gK.push(c.gK); out.I.push(I(t));
    };
    rec();
    while (t < tmax - 1e-9) {
      y = F.rk4(f, t, y, dt); t += dt; k++;
      if (!above && y[0] > 0) { out.spikes.push(t); above = true; }
      else if (above && y[0] < -20) above = false;
      if (k % every === 0) rec();
    }
    out.yEnd = y;
    return out;
  };

  /** Voltage clamp: Vcmd(t) imposto con costante di tempo del clamp tauC (ms, resistenza in serie).
      blockNa (TTX) e blockK (TEA) sono frazioni di blocco 0..1. Restituisce correnti in µA/cm². */
  HH.vclamp = function (opts) {
    var p = opts.p || HH.defaults(), phi = HH.phi(p.T);
    var dt = opts.dt || 0.005, tauC = opts.tauC || 0.02, tmax = opts.tmax || 20;
    var gNa = p.gNa * (1 - (opts.blockNa || 0)), gK = p.gK * (1 - (opts.blockK || 0));
    var Vh = opts.Vcmd(0), s = HH.inf(Vh);
    var V = Vh, m = s.m, h = s.h, n = s.n, t = 0, k = 0, every = opts.every || 4;
    var out = { t: [], Vcmd: [], V: [], I: [], INa: [], IK: [], IL: [], IC: [], m: [], h: [], n: [] };
    var gate = function (x, a, b) { var inf = a / (a + b), tau = 1 / (a + b); return inf + (x - inf) * Math.exp(-dt / tau); };
    while (t <= tmax + 1e-9) {
      var Vc = opts.Vcmd(t);
      var dV = (Vc - V) * (1 - Math.exp(-dt / tauC));
      var IC = p.Cm * dV / dt;
      var Vn = V + dV;
      var r = HH.rates(Vn, phi);
      m = gate(m, r.am, r.bm); h = gate(h, r.ah, r.bh); n = gate(n, r.an, r.bn);
      V = Vn;
      var INa = gNa * m * m * m * h * (V - p.ENa), IK = gK * n * n * n * n * (V - p.EK), IL = p.gL * (V - p.EL);
      if (k % every === 0) {
        out.t.push(t); out.Vcmd.push(Vc); out.V.push(V); out.I.push(IC + INa + IK + IL);
        out.INa.push(INa); out.IK.push(IK); out.IL.push(IL); out.IC.push(IC);
        out.m.push(m); out.h.push(h); out.n.push(n);
      }
      t += dt; k++;
    }
    return out;
  };

  /** Determina se uno stimolo (durata dur ms, ampiezza amp µA/cm²) applicato al tempo t0
      a partire dallo stato y0 genera un potenziale d'azione. */
  HH.firesAP = function (p, y0, t0, amp, dur, extraI) {
    // Criterio: il potenziale d'azione è la depolarizzazione rigenerativa dovuta al Na+.
    // Confronto la risposta completa con quella di controllo senza conduttanza al Na+
    // (stesso stimolo): c'è un PdA se il picco supera 0 mV e supera il controllo di ≥ 20 mV.
    var phi = HH.phi(p.T), dt = Math.min(0.01, 0.02 / phi), win = 8 / Math.max(1, phi / 2);
    var I = function (t) { return (t >= t0 && t < t0 + dur ? amp : 0) + (extraI ? extraI(t) : 0); };
    var run = function (pp) {
      var f = HH.deriv(pp, phi, I), y = y0.slice(), t = 0, peak = -999;
      while (t < t0 + dur + win) {
        y = F.rk4(f, t, y, dt); t += dt;
        if (t >= t0 && y[0] > peak) peak = y[0];
      }
      return peak;
    };
    var full = run(p);
    if (full < 0) return false;
    var ctrl = run(Object.assign({}, p, { gNa: 0 }));
    return full - ctrl >= 20;
  };

  /** Soglia (µA/cm²) di uno stimolo breve, per bisezione. Restituisce Infinity se > Imax. */
  HH.threshold = function (p, y0, t0, dur, Imax, extraI) {
    Imax = Imax || 100;
    if (!HH.firesAP(p, y0, t0, Imax, dur, extraI)) return Infinity;
    var lo = 0, hi = Imax;
    for (var i = 0; i < 18; i++) {
      var mid = 0.5 * (lo + hi);
      if (HH.firesAP(p, y0, t0, mid, dur, extraI)) hi = mid; else lo = mid;
      if (hi - lo < 0.02 * hi) break;
    }
    return hi;
  };

  // ---------------------------------------------------------------- Connor-Stevens (+ adattamento)
  var CS = F.CS = {};
  CS.defaults = function () {
    // Conduttanze in mS/cm² (Dayan & Abbott: mS/mm² ×100), Cm 1 µF/cm².
    return {
      gNa: 120, gK: 20, gA: 47.7, gL: 0.3, ENa: 55, EK: -72, EA: -75, EL: -17, Cm: 1,
      // corrente Ca2+ ad alta soglia e K(Ca) (Wang 1998)
      gCa: 0, ECa: 120, gAHP: 0, KD: 30, alphaCa: 0.002, tauCa: 80
    };
  };
  CS.rates = function (V) {
    var aInf = Math.pow(0.0761 * Math.exp(0.0314 * (V + 94.22)) / (1 + Math.exp(0.0346 * (V + 1.17))), 1 / 3);
    var bInf = Math.pow(1 / (1 + Math.exp(0.0688 * (V + 53.3))), 4);
    return {
      am: 0.38 * vt(-(V + 29.7), 10), bm: 15.2 * Math.exp(-0.0556 * (V + 54.7)),
      ah: 0.266 * Math.exp(-0.05 * (V + 48)), bh: 3.8 / (1 + Math.exp(-0.1 * (V + 18))),
      an: 0.02 * vt(-(V + 45.7), 10), bn: 0.25 * Math.exp(-0.0125 * (V + 55.7)),
      aInf: aInf, ta: 0.3632 + 1.158 / (1 + Math.exp(0.0497 * (V + 55.96))),
      bInf: bInf, tb: 1.24 + 2.678 / (1 + Math.exp(0.0624 * (V + 50)))
    };
  };
  CS.mCaInf = function (V) { return 1 / (1 + Math.exp(-(V + 20) / 9)); };
  CS.currents = function (p, y) {
    var V = y[0], m = y[1], h = y[2], n = y[3], a = y[4], b = y[5], Ca = y[6];
    var mc = CS.mCaInf(V);
    return {
      INa: p.gNa * m * m * m * h * (V - p.ENa),
      IK: p.gK * n * n * n * n * (V - p.EK),
      IA: p.gA * a * a * a * b * (V - p.EA),
      IL: p.gL * (V - p.EL),
      ICa: p.gCa * mc * mc * (V - p.ECa),
      IAHP: p.gAHP * Ca / (Ca + p.KD) * (V - p.EK)
    };
  };
  CS.deriv = function (p, Ifun) {
    return function (t, y) {
      var r = CS.rates(y[0]), c = CS.currents(p, y);
      return [
        (Ifun(t) - c.INa - c.IK - c.IA - c.IL - c.ICa - c.IAHP) / p.Cm,
        r.am * (1 - y[1]) - r.bm * y[1],
        r.ah * (1 - y[2]) - r.bh * y[2],
        r.an * (1 - y[3]) - r.bn * y[3],
        (r.aInf - y[4]) / r.ta,
        (r.bInf - y[5]) / r.tb,
        -p.alphaCa * c.ICa - y[6] / p.tauCa
      ];
    };
  };
  CS.rest = function (p) {
    var V = -68, r = CS.rates(V);
    var y = [V, r.am / (r.am + r.bm), r.ah / (r.ah + r.bh), r.an / (r.an + r.bn), r.aInf, r.bInf, 0];
    var f = CS.deriv(p, function () { return 0; });
    for (var k = 0; k < 30000; k++) y = F.rk4(f, 0, y, 0.01);
    return y;
  };
  /** Calcola EL in modo che il potenziale di riposo resti Vr (utile quando si rimuove I_A
      per confrontare il modello con e senza corrente A a parità di riposo). */
  CS.adjustEL = function (p, Vr) {
    var r = CS.rates(Vr);
    var y = [Vr, r.am / (r.am + r.bm), r.ah / (r.ah + r.bh), r.an / (r.an + r.bn), r.aInf, r.bInf, 0];
    var c = CS.currents(Object.assign({}, p, { gL: 0 }), y);
    var Iother = c.INa + c.IK + c.IA + c.ICa + c.IAHP;
    // gL (Vr − EL) = −Iother  →  EL = Vr + Iother/gL
    return Vr + Iother / p.gL;
  };
  CS.simulate = function (opts) {
    var p = opts.p || CS.defaults(), dt = opts.dt || 0.01, every = opts.every || 5;
    var I = opts.I || function () { return 0; };
    var y = (opts.y0 || CS.rest(p)).slice(), f = CS.deriv(p, I);
    var out = { t: [], V: [], IA: [], Ca: [], a: [], b: [], I: [], spikes: [] };
    var t = 0, k = 0, above = y[0] > 0, tmax = opts.tmax || 500;
    while (t < tmax - 1e-9) {
      y = F.rk4(f, t, y, dt); t += dt; k++;
      if (!above && y[0] > 0) { out.spikes.push(t); above = true; }
      else if (above && y[0] < -30) above = false;
      if (k % every === 0) {
        var c = CS.currents(p, y);
        out.t.push(t); out.V.push(y[0]); out.IA.push(c.IA); out.Ca.push(y[6]);
        out.a.push(y[4]); out.b.push(y[5]); out.I.push(I(t));
      }
    }
    out.yEnd = y;
    return out;
  };

  /** Curva frequenza-corrente (f-I): frequenza a regime (Hz) per una serie di correnti costanti. */
  F.fICurve = function (model, p, Ilist, tmax, tskip) {
    tmax = tmax || 1000; tskip = tskip || 200;
    var M = model === 'HH' ? HH : CS, y0 = M.rest(p);
    return Ilist.map(function (I) {
      var r = M.simulate({ p: p, tmax: tmax, I: function () { return I; }, y0: y0, every: 1000 });
      var sp = r.spikes.filter(function (s) { return s > tskip; });
      if (sp.length < 2) return 0;
      return 1000 * (sp.length - 1) / (sp[sp.length - 1] - sp[0]);
    });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
