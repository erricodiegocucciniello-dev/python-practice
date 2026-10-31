/* Modelli di sistema e di sinapsi. Dove un modello è semplificato a scopo didattico
   la funzione lo dichiara nel commento; le relazioni esatte (es. errore residuo del
   controllo proporzionale, volume urinario = carico osmotico/osmolarità) sono esatte. */
(function (G) {
  'use strict';
  var F = G.Fisio;

  // ---------------------------------------------------------------- Omeostasi: anello di controllo
  /** Sistema controllato del 1° ordine (costante di tempo tau) con controllore proporzionale.
      Errore a regime con retroazione negativa: e = d/(1+K) (risultato esatto). */
  F.feedbackLoop = function (o) {
    var K = o.K, tau = o.tau || 5, set = o.set === undefined ? 37 : o.set, dt = o.dt || 0.02, tmax = o.tmax || 60;
    var sign = o.type === 'pos' ? 1 : (o.type === 'open' ? 0 : -1), delay = o.delay || 0, nDel = Math.round(delay / dt);
    var y = set, a = 0, hist = [], out = { t: [], y: [], u: [], d: [], ys: [] }, every = Math.max(1, Math.round(0.1 / dt));
    for (var k = 0, t = 0; t <= tmax + 1e-9; k++, t += dt) {
      var d = o.disturbance(t);
      hist.push(y);
      var yDel = hist.length > nDel ? hist[hist.length - 1 - nDel] : set;
      var ys = yDel - a; // lettura del sensore (con eventuale adattamento)
      var u = sign * K * (ys - set) + (o.feedforward ? -o.feedforward * d : 0);
      u = Math.max(-1e3, Math.min(1e3, u));
      if (k % every === 0) { out.t.push(t); out.y.push(y); out.u.push(u); out.d.push(d); out.ys.push(ys + set - set); }
      y += dt * (-(y - set) + u + d) / tau;
      if (o.adaptTau) a += dt * ((yDel - set) - a) / o.adaptTau;
      if (!isFinite(y) || Math.abs(y - set) > 1e3) { y = set + Math.sign(y - set) * 1e3; }
    }
    return out;
  };

  /** Glicemia e insulina — modello compartimentale semplificato (didattico), derivato dal
      modello minimo di Bergman: dG/dt = R0 − (p1 + X)·G + Ra(t);  dX/dt = p2·(Si·I − X);
      dI/dt = β·S(G) − n·I, con secrezione sigmoidale S(G) = Smax·G⁶/(K⁶ + G⁶), K = 7 mmol/L.
      Calibrato su OGTT 75 g: normale picco ≈ 7,8 e 2 h ≈ 5,3 mmol/L (insulina ≈ 50 µU/mL);
      con sensibilità 0,25 e funzione β 0,4: digiuno ≈ 7,1 e 2 h ≈ 12 mmol/L (criteri di diabete).
      Unità: G mmol/L, I µU/mL, t min. Pasto: carico orale di glucosio (g). */
  F.glucoseModel = function (o) {
    o = o || {};
    var p1 = o.p1 || 0.01, p2 = o.p2 || 0.03, n = 0.14, Ib = 10, X0 = o.X0 || 0.012;
    var Si = X0 / Ib * (o.sensitivity === undefined ? 1 : o.sensitivity);
    var beta = o.beta === undefined ? 1 : o.beta, Kh = o.Kh || 7, hh = o.hill || 6;
    var Smax = n * Ib / (Math.pow(5, hh) / (Math.pow(5, hh) + Math.pow(Kh, hh)));
    var R0 = (p1 + X0) * 5;                      // produzione epatica + assorbimento basale
    var Vg = 13, kabs = o.kabs || 0.025, Dmmol = (o.mealGrams === undefined ? 75 : o.mealGrams) * 1000 / 180.16, fabs = 0.65;
    var S = function (G) { var g4 = Math.pow(Math.max(G, 0), hh); return Smax * g4 / (g4 + Math.pow(Kh, hh)); };
    var mealT = o.mealAt === undefined ? 30 : o.mealAt, injT = o.insulinAt, injU = o.insulinDose || 0;
    var f = function (t, s) {
      var tm = t - mealT, Ra = tm > 0 ? fabs * Dmmol * kabs * kabs * tm * Math.exp(-kabs * tm) / Vg : 0;
      var G = s[0], X = s[1], I = s[2];
      return [R0 - (p1 + X) * G + Ra, p2 * (Si * I - X), beta * S(G) - n * I];
    };
    // stato a digiuno: integra senza pasto fino all'equilibrio
    var y = [5, X0, Ib], dt = 0.1, tt;
    var f0 = function (t, s) { return f(-1e9, s); };
    for (tt = 0; tt < 3000; tt += 0.5) y = F.rk4(f0, 0, y, 0.5);
    var fasting = y.slice(), tmax = o.tmax || 240, out = { t: [], G: [], I: [], X: [], fasting: fasting };
    for (var t = 0, k = 0; t <= tmax + 1e-9; t += dt, k++) {
      if (injT !== undefined && Math.abs(t - injT) < dt / 2) y[2] += injU;
      if (k % 5 === 0) { out.t.push(t); out.G.push(y[0]); out.I.push(y[2]); out.X.push(y[1]); }
      y = F.rk4(f, t, y, dt);
      if (y[0] < 0.5) y[0] = 0.5;
    }
    return out;
  };

  /** Compartimenti idrici (uomo 60%, donna 50% del peso; LIC 2/3, LEC 1/3; plasma = 20% del LEC).
      Perturbazioni: aggiunta di acqua (L) e/o di NaCl (mmol, 2 osmoli per mole). Equilibrio osmotico esatto. */
  F.bodyWater = function (o) {
    var TBW = o.mass * (o.sex === 'F' ? 0.5 : 0.6), ICF = TBW * 2 / 3, ECF = TBW / 3, osm0 = o.osm0 || 290;
    var addW = o.addWater || 0, addOsm = 2 * (o.addNaClmmol || 0);
    var TBW2 = TBW + addW, totOsm = TBW * osm0 + addOsm, osm2 = totOsm / TBW2;
    var ICF2 = ICF * osm0 / osm2, ECF2 = TBW2 - ICF2;
    return {
      before: { TBW: TBW, ICF: ICF, ECF: ECF, plasma: ECF * 0.2, inter: ECF * 0.8, osm: osm0 },
      after: { TBW: TBW2, ICF: ICF2, ECF: ECF2, plasma: ECF2 * 0.2, inter: ECF2 * 0.8, osm: osm2 }
    };
  };

  // ---------------------------------------------------------------- Rene
  /** Pressione oncotica (Landis-Pappenheimer): π = 2,1C + 0,16C² + 0,009C³ (mmHg, C in g/dL). */
  F.oncotic = function (C) { return 2.1 * C + 0.16 * C * C + 0.009 * C * C * C; };

  /** Filtrazione glomerulare con forze di Starling lungo il capillare.
      Resistenze arteriolari (moltiplicatori di quelle basali), Kf moltiplicatore. */
  F.glomerulus = function (o) {
    o = o || {};
    var Pa = o.Pa || 100, Pv = 10, Hct = 0.45, C0 = o.Cprot || 7, PBS = o.PBS === undefined ? 15 : o.PBS;
    var Ra = (100 - 55) / 1100 * (o.Raff || 1), Re = (55 - 10) / (1100 - 125) * (o.Reff || 1), Kf = F.glomerulus.Kf0 * (o.Kf || 1);
    var N = 100, dropAlong = 1; // la pressione glomerulare cala di ~1 mmHg lungo il capillare
    var filtr = function (PGC, RPF) {
      var Q = RPF, gfr = 0, prof = { x: [], PGC: [], pi: [], NFP: [] };
      for (var i = 0; i < N; i++) {
        var x = (i + 0.5) / N, P = PGC - dropAlong * x, C = C0 * RPF / Q, pi = F.oncotic(C);
        var nfp = Math.max(0, P - PBS - pi), dq = Kf * nfp / N;
        prof.x.push(x); prof.PGC.push(P); prof.pi.push(pi); prof.NFP.push(P - PBS - pi);
        gfr += dq; Q -= dq;
        if (Q < 0.05 * RPF) break;
      }
      return { gfr: gfr, prof: prof, Qend: Q };
    };
    var solve = function (PGC) {
      var RBF = (Pa - PGC) / Ra, RPF = RBF * (1 - Hct), r = filtr(PGC, RPF);
      return { res: (RBF - r.gfr) - (PGC - Pv) / Re, RBF: RBF, RPF: RPF, r: r };
    };
    var PGC = F.bisect(function (P) { return solve(P).res; }, Pv + 0.01, Pa - 0.01, 1e-6);
    var s = solve(PGC);
    return {
      PGC: PGC, RBF: s.RBF, RPF: s.RPF, GFR: s.r.gfr, FF: s.r.gfr / s.RPF, profile: s.r.prof,
      PBS: PBS, pi0: F.oncotic(C0), piEnd: s.r.prof.pi[s.r.prof.pi.length - 1],
      equilibrium: s.r.prof.NFP[s.r.prof.NFP.length - 1] <= 0.05
    };
  };
  F.glomerulus.Kf0 = 1; // calibrato sotto
  (function calibrate() {
    var target = 125;
    var lo = 1, hi = 300;
    for (var i = 0; i < 60; i++) {
      F.glomerulus.Kf0 = 0.5 * (lo + hi);
      var g = F.glomerulus({}).GFR;
      if (g > target) hi = F.glomerulus.Kf0; else lo = F.glomerulus.Kf0;
    }
  })();

  /** ADH e osmolarità urinaria. Osmolarità plasmatica → ADH (soglia ~280 mOsm/kg, Robertson);
      ADH → osmolarità urinaria (50–1200 mOsm/L); volume urinario = carico osmotico / Uosm (esatto). */
  F.kidneyWater = function (o) {
    // ADH plasmatico ≈ 0,38 pg/mL per mOsm/kg sopra la soglia di 280 (Robertson);
    // osmolarità urinaria ≈ lineare con l'ADH fino al massimo (~1200 mOsm/L a ~4,6 pg/mL).
    var ADH = o.ADH !== undefined ? o.ADH : Math.max(0, 0.38 * (o.Posm - 280));
    var Umax = o.Umax || 1200, Umin = 50;
    var Uosm = Math.min(Umax, Umin + 250 * ADH);
    var load = o.osmLoad || 900; // mOsm/giorno
    var V = load / Uosm;          // L/giorno (esatto: volume = carico osmotico / osmolarità)
    var Posm = o.Posm || 287, Cosm = load / Posm;
    var medulla = 600 + 600 * Math.min(1, ADH / 4.6);
    return { ADH: ADH, Uosm: Uosm, V: V, Cosm: Cosm, CH2O: V - Cosm, medullaMax: medulla };
  };
  /** Bilancio idrico giornaliero tipico (Guyton & Hall), mL/giorno. */
  F.waterBalance = {
    intake: [['Bevande', 2100], ['Acqua metabolica', 200]],
    output: [['Perspiratio cutanea', 350], ['Respirazione', 350], ['Sudore', 100], ['Feci', 100], ['Urina', 1400]]
  };

  // ---------------------------------------------------------------- Cellula β del pancreas (didattico)
  /** Glucosio → ATP/ADP → chiusura K_ATP → depolarizzazione → canali Ca2+ → secrezione.
      sulfo = frazione di blocco dei K_ATP (sulfonilurea); diaz = apertura da diazossido (0..1). */
  F.betaCell = function (Glc, sulfo, diaz) {
    var c = Math.pow(Glc, 3) / (Math.pow(Glc, 3) + Math.pow(6, 3)); // frazione chiusa dall'ATP
    var gK = 5 * ((1 - c) * (1 - (sulfo || 0)) + (diaz || 0) * 0.8);
    var Vm = (gK * -80 + 1 * -20) / (gK + 1);
    var ca = 1 / (1 + Math.exp(-(Vm + 50) / 6));
    return { closed: c, gKATP: gK, Vm: Vm, caOpen: ca, secretion: ca * ca };
  };

  // ---------------------------------------------------------------- Sinapsi
  F.alphaFn = function (t, tau) { return t <= 0 ? 0 : (t / tau) * Math.exp(1 - t / tau); };
  F.nmdaBlock = function (V, Mg) { return 1 / (1 + (Mg / 3.57) * Math.exp(-0.062 * V)); };
  F.kirI = function (V, EK, g) { return (g || 1) * (V - EK) / (1 + Math.exp((V - EK - 10) / 10)); };

  /** Cellula passiva (R in MΩ, C in pF) con sinapsi a conduttanza (nS, funzione alfa).
      Ihold (pA) mantiene il potenziale di partenza. Restituisce V (mV) e corrente sinaptica (pA). */
  F.pspCell = function (o) {
    var gL = 1000 / (o.R || 100), C = o.C || 100, Vr = o.Vrest || -65, dt = 0.025, tmax = o.tmax || 80;
    var Vstart = o.Vhold === undefined ? Vr : o.Vhold, Ih = gL * (Vstart - Vr), V = Vstart;
    var syns = o.syns || [], out = { t: [], V: [], Isyn: [] };
    for (var t = 0, k = 0; t <= tmax + 1e-9; t += dt, k++) {
      var gs = 0, gsE = 0;
      for (var j = 0; j < syns.length; j++) {
        var s = syns[j], g = s.g * F.alphaFn(t - s.t0, s.tau || 2) * (s.nmda ? F.nmdaBlock(V, s.Mg === undefined ? 1 : s.Mg) : 1);
        gs += g; gsE += g * s.E;
      }
      var Is = gs * V - gsE; // pA (positivo = uscente)
      if (k % 2 === 0) { out.t.push(t); out.V.push(V); out.Isyn.push(-Is); }
      if (o.clamp) continue; // in voltage clamp V resta fissa
      V += dt * (-(gL * (V - Vr)) - Is + Ih) / C;
    }
    return out;
  };

  /** Due cellule accoppiate da una giunzione comunicante (gc, nS) — sinapsi elettrica.
      Coefficiente di accoppiamento a regime: k = gc/(gc + gL2). */
  F.gapPair = function (o) {
    var gL = 1000 / (o.R || 100), C = o.C || 100, gc = o.gc, dt = 0.02, tmax = o.tmax || 60;
    var V1 = -65, V2 = -65, out = { t: [], V1: [], V2: [] };
    for (var t = 0, k = 0; t <= tmax; t += dt, k++) {
      var I1 = o.inject === 2 ? 0 : o.I(t), I2 = o.inject === 2 ? o.I(t) : 0;
      var g = gc;
      if (o.rectify && (V1 - V2) * (o.inject === 2 ? -1 : 1) < 0) g = gc * 0.1;
      var Ig = g * (V1 - V2);
      if (k % 2 === 0) { out.t.push(t); out.V1.push(V1); out.V2.push(V2); }
      V1 += dt * (-gL * (V1 + 65) - Ig + I1) / C;
      V2 += dt * (-gL * (V2 + 65) + Ig + I2) / C;
    }
    out.kTheory = gc / (gc + gL);
    return out;
  };

  /** Sinapsi monoaminergica (modello di Wightman per la dopamina nello striato):
      d[DA]/dt = rilascio per impulso − Vmax[DA]/(Km(1+[I]/Ki) + [DA]) + efflusso. µM, s. */
  F.monoamine = function (o) {
    var Vmax = o.Vmax || 4, Km = o.Km || 0.2, rel = o.release || 0.1, f = o.freq || 20, dur = o.trainDur || 0.5;
    var t0 = 1, tmax = o.tmax || 6, dt = 0.001, DA = o.basal || 0.02;
    var Kapp = Km * (1 + (o.cocaine || 0) / 0.3 + (o.amph || 0) / 0.1);
    var VmaxEff = Vmax * (1 - (o.uptakeBlock || 0));
    var relEff = rel * (o.vesicleFactor === undefined ? 1 : o.vesicleFactor);
    var efflux = (o.amph || 0) * 0.6; // µM/s per µM di anfetamina (trasporto invertito)
    var basalRelease = Vmax * DA / (Km + DA);
    var out = { t: [], DA: [], pulses: [] }, nextP = t0, every = 10;
    for (var t = 0, k = 0; t <= tmax + 1e-9; t += dt, k++) {
      if (t >= nextP - 1e-9 && t < t0 + dur) { DA += relEff; out.pulses.push(t); nextP += 1 / f; }
      var up = VmaxEff * DA / (Kapp + DA);
      DA += dt * (basalRelease * (o.vesicleFactor === undefined ? 1 : o.vesicleFactor) + efflux - up);
      if (DA < 0) DA = 0;
      if (k % every === 0) { out.t.push(t); out.DA.push(DA); }
    }
    return out;
  };

  // ---------------------------------------------------------------- Meccanocettori cutanei
  /** Trasduzione: stimolo x(t) (µm) → potenziale di recettore → scarica (integra-e-scarica).
      SA1 (Merkel): posizione + velocità; SA2 (Ruffini): posizione (stiramento);
      RA (Meissner): velocità; PC (Pacini): la capsula è un filtro passa-alto (vibrazione).
      decaps = Pacini senza capsula (Loewenstein): risponde anche alla pressione statica. */
  /** Filtro biquadratico di Butterworth del 2° ordine (passa-basso o passa-alto).
      f0 in Hz, dt in ms. Restituisce una funzione che filtra un campione alla volta. */
  F.biquad = function (kind, f0, dt) {
    var w0 = 2 * Math.PI * (f0 / 1000) * dt, cs = Math.cos(w0), al = Math.sin(w0) / (2 * Math.SQRT1_2);
    var b0, b1, b2, a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    if (kind === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    else { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0, init = false;
    return function (x) {
      if (!init) { init = true; if (kind === 'lp') { x1 = x2 = y1 = y2 = x; } else { x1 = x2 = x; } }
      var y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return y;
    };
  };

  F.mechano = function (type, xfun, o) {
    o = o || {};
    var dt = 0.02, tmax = o.tmax || 1000, decaps = !!o.decapsulated;
    var out = { t: [], x: [], r: [], spikes: [] };
    var xPrev = xfun(0), xfPrev = null, v = 0, ref = 0, ad = 0;
    // filtri meccanici dei corpuscoli
    var lpSA1 = F.biquad('lp', 30, dt), lpSA2 = F.biquad('lp', 10, dt), lpRA = F.biquad('lp', 40, dt);
    var hpPC = F.biquad('hp', 150, dt), lpPC = F.biquad('lp', 400, dt), lpDec = F.biquad('lp', 30, dt);
    var every = Math.max(1, Math.round((o.sample || 0.2) / dt));
    // codificatore (zona di innesco della fibra afferente): costante di tempo, refrattarietà, adattamento
    var enc = { SA1: { tau: 10, ref: 2, adapt: 0.04 }, SA2: { tau: 15, ref: 2, adapt: 0.02 },
                RA: { tau: 4, ref: 1.5, adapt: 0.01 }, PC: { tau: 1.5, ref: 2.2, adapt: 0.002 } }[type];
    if (type === 'PC' && decaps) enc = { tau: 10, ref: 2, adapt: 0.03 };
    for (var t = 0, k = 0; t <= tmax + 1e-9; t += dt, k++) {
      var x = xfun(t), vel = (x - xPrev) / dt, r = 0, xf, vf; // µm, µm/ms
      if (type === 'SA1' || type === 'SA2' || (type === 'PC' && decaps)) {
        xf = type === 'SA1' ? lpSA1(x) : (type === 'SA2' ? lpSA2(x) : lpDec(x));
        vf = xfPrev === null ? 0 : (xf - xfPrev) / dt; xfPrev = xf;
        if (type === 'SA1') r = 0.05 * Math.max(0, xf) + 0.4 * Math.max(0, vf);
        else if (type === 'SA2') r = 0.04 * Math.max(0, xf) + 0.05 * Math.max(0, vf);
        else r = 0.05 * Math.max(0, xf) + 0.4 * Math.max(0, vf) + 8 * Math.abs(lpPC(hpPC(x))); // senza capsula: risposta anche statica
      } else if (type === 'RA') {
        r = 1.0 * Math.abs(lpRA(vel));                 // sensibile alla velocità
      } else if (type === 'PC') {
        r = 8 * Math.max(0, lpPC(hpPC(x)));          // capsula: passa-alto → vibrazione (rettificazione a semionda)
      }
      xPrev = x;
      // codificatore integra-e-scarica con adattamento lento
      var drive = Math.max(0, r - ad);
      if (ref > 0) { ref -= dt; v = 0; }
      else {
        v += dt * (-v + drive) / enc.tau;
        if (v >= 1) { out.spikes.push(t); v = 0; ref = enc.ref; ad += enc.adapt; }
      }
      ad -= dt * ad / 300;
      if (k % every === 0) { out.t.push(t); out.x.push(x); out.r.push(r); }
    }
    return out;
  };

  /** Discriminazione di due punti: profilo di attività di una popolazione di recettori
      (campi recettivi gaussiani di ampiezza w mm) con eventuale inibizione laterale. */
  F.twoPointProfile = function (d, w, inhib, spacing) {
    spacing = spacing || w / 4;
    var xs = [], act = [];
    for (var x = -3 * w - d; x <= 3 * w + d; x += spacing) xs.push(x);
    var raw = xs.map(function (c) {
      return Math.exp(-Math.pow(c + d / 2, 2) / (2 * w * w / 4)) + Math.exp(-Math.pow(c - d / 2, 2) / (2 * w * w / 4));
    });
    if (inhib) {
      act = raw.map(function (_, i) {
        var s = 0, n = 0;
        for (var j = 0; j < raw.length; j++) {
          var dd = (xs[j] - xs[i]) / w, wgt = Math.exp(-dd * dd / 2);
          s += wgt * raw[j]; n += wgt;
        }
        return Math.max(0, raw[i] - 0.9 * s / n);
      });
    } else act = raw;
    var mid = act[Math.floor(act.length / 2)], peak = Math.max.apply(null, act);
    return { x: xs, a: act, two: mid < 0.9 * peak && peak > 0, dip: peak > 0 ? 1 - mid / peak : 0 };
  };
  F.twoPointThreshold = function (w, inhib) {
    for (var d = 0.1; d < 200; d *= 1.03) if (F.twoPointProfile(d, w, inhib).two) return d;
    return NaN;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
