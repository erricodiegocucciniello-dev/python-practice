/* Flussi e trasporti: diffusione (Fick), permeabilità, diffusione ristretta (Renkin),
   trasporto mediato (Michaelis-Menten), osmosi (van't Hoff, Kedem-Katchalsky),
   volume dell'eritrocita (Boyle-van't Hoff), cotrasporto Na+/glucosio (SGLT1). */
(function (G) {
  'use strict';
  var F = G.Fisio;

  // Coefficienti di diffusione in acqua (cm²/s, ~25 °C; valori di letteratura arrotondati)
  F.Dwater = {
    'O₂': 2.1e-5, 'K⁺': 1.96e-5, 'Na⁺': 1.33e-5, 'Cl⁻': 2.03e-5, 'Ca²⁺': 0.79e-5,
    'Glucosio': 6.7e-6, 'Acetilcolina': 8e-6, 'Albumina': 6.1e-7
  };

  /** Tempo medio per diffondere a distanza x (cm) in 1 dimensione: t = x²/(2D). */
  F.tDiff = function (x, D, dims) { return x * x / (2 * (dims || 1) * D); };

  /** Due compartimenti uguali (volume V cm³) separati da membrana di area A (cm²) e
      permeabilità P (cm/s): C2(t) = C0/2 (1 − e^{−t/τ}), τ = V/(2PA). */
  F.twoCompartment = function (C1_0, C2_0, P, A, V, t) {
    var tau = V / (2 * P * A), Ceq = (C1_0 + C2_0) / 2, e = Math.exp(-t / tau);
    return { C1: Ceq + (C1_0 - Ceq) * e, C2: Ceq + (C2_0 - Ceq) * e, tau: tau };
  };

  /** Coefficiente di permeabilità di membrana: P = β·Dm/Δx (cm/s). */
  F.permeability = function (beta, Dm, dx_cm) { return beta * Dm / dx_cm; };

  /** Fattore di impedimento di Renkin (1954) per la diffusione ristretta in un poro.
      λ = raggio della particella / raggio del poro. */
  F.renkin = function (lam) {
    if (lam >= 1) return 0;
    if (lam <= 0) return 1;
    return Math.pow(1 - lam, 2) * (1 - 2.104 * lam + 2.09 * Math.pow(lam, 3) - 0.95 * Math.pow(lam, 5));
  };

  /** Michaelis-Menten con inibitore competitivo: F = Fmax·C/(Km(1+I/Ki) + C). */
  F.michaelis = function (C, Fmax, Km, I, Ki) {
    var Kapp = Km * (1 + (I || 0) / (Ki || 1));
    return Fmax * C / (Kapp + C);
  };
  /** Fattore di temperatura Q10. */
  F.q10factor = function (Q10, T, Tref) { return Math.pow(Q10, (T - Tref) / 10); };

  /** Pressione osmotica di van't Hoff. osm in mOsm/L, T in °C. */
  F.vantHoff = function (osm, Tc, sigma) {
    var atm = (sigma === undefined ? 1 : sigma) * osm / 1000 * F.C.Ratm * (Tc + F.C.K0);
    var Pa = atm * 101325;
    return { atm: atm, mmHg: atm * 760, kPa: Pa / 1000, waterColumn_m: Pa / (F.C.rhoWater * F.C.g) };
  };

  // ---------------------------------------------------------------- Eritrocita umano
  var RBC = F.RBC = {
    V0: 90,          // fL, volume a 290 mOsm/kg
    b: 0.4,          // frazione di volume osmoticamente inattiva (emoglobina, ecc.)
    A: 135,          // µm², area della membrana (non estensibile oltre ~3-4%)
    osm0: 290
  };
  /** Volume massimo prima della lisi: sfera con la stessa area. */
  RBC.Vcrit = Math.pow(RBC.A, 1.5) / (6 * Math.sqrt(Math.PI)); // ≈ 147 fL
  /** Equazione di Boyle-van't Hoff: V = Vb + (V0 − Vb)·osm0/osm. */
  RBC.volumeStatic = function (osmEff) {
    var Vb = RBC.b * RBC.V0;
    return Vb + (RBC.V0 - Vb) * RBC.osm0 / osmEff;
  };
  /** Osmolarità efficace alla quale inizia la lisi. */
  RBC.lysisOsm = function () { var Vb = RBC.b * RBC.V0; return (RBC.V0 - Vb) * RBC.osm0 / (RBC.Vcrit - Vb); };

  /** Simulazione dinamica (Kedem-Katchalsky semplificato).
      o: {osmImpOut (mOsm/L impermeanti fuori), Cp (mM soluto permeante fuori), sigma, Ps (cm/s), Pf (cm/s), tmax (s)} */
  RBC.simulate = function (o) {
    var Vb = RBC.b * RBC.V0, Vw = RBC.V0 - Vb, nImp = Vw * RBC.osm0, nP = 0;
    var Pf = o.Pf === undefined ? 0.02 : o.Pf, Ps = o.Ps || 0, sig = o.sigma === undefined ? 1 : o.sigma;
    var kw = Pf * RBC.A * 1e-8 * 18 * 1e-6 * 1e12;   // fL/s per mOsm/L
    var ks = Ps * RBC.A * 1e-8 * 1e-6 * 1e18;        // fL·mM/s per mM
    var dt = o.dt || 0.002, tmax = o.tmax || 5, t = 0, out = { t: [], V: [], lysed: false, tLysis: null };
    var every = Math.max(1, Math.round((o.sample || 0.02) / dt));
    for (var k = 0; t <= tmax + 1e-9; k++) {
      var Cin = nP / Vw;
      var osmIn = nImp / Vw + sig * Cin, osmOut = o.osmImpOut + sig * o.Cp;
      var dVw = kw * (osmIn - osmOut);
      var dnP = ks * (o.Cp - Cin);
      if (k % every === 0) { out.t.push(t); out.V.push(Vb + Vw); }
      Vw = Math.max(1, Vw + dVw * dt); nP = Math.max(0, nP + dnP * dt); t += dt;
      if (!out.lysed && Vb + Vw >= RBC.Vcrit) { out.lysed = true; out.tLysis = t; }
    }
    out.Vfinal = Vb + Vw;
    return out;
  };

  // ---------------------------------------------------------------- Cotrasporto Na+/glucosio (enterocita)
  /** Massimo rapporto di accumulo all'equilibrio per SGLT1 (2 Na+ : 1 glucosio):
      [Glc]i/[Glc]o = ([Na]o/[Na]i)² · exp(−2FVm/RT). */
  F.sgltMaxRatio = function (NaO, NaI, VmmV, Tc) {
    return Math.pow(NaO / NaI, 2) * Math.exp(-2 * VmmV / F.RTF(Tc));
  };
  /** Modello dinamico dell'enterocita. Tempo in s, concentrazioni mM. */
  F.enterocyte = function (o) {
    var Tc = o.T || 37, RTF = F.RTF(Tc);
    var NaO = o.NaO || 145, NaI0 = o.NaI0 || 12, NaI = NaI0, Gi = o.Gi0 || 5, Go = o.Glumen, Gb = o.Gblood || 5, Vm0 = o.Vm || -60;
    var Js = (o.sgltBlock ? 0 : 1) * (o.Js || 4), Jg = (o.glutBlock ? 0 : 1) * (o.Jg || 40), Jp0 = o.Jp || 6.5, kL = o.kL || 0.01;
    var dt = o.dt || 0.01, tmax = o.tmax || 300, t = 0, out = { t: [], NaI: [], Gi: [], Jsglt: [], Jglut: [], Jpump: [], Vm: [] };
    var every = Math.round(1 / dt);
    for (var k = 0; t <= tmax + 1e-9; k++) {
      var ouab = (o.ouabainAt !== undefined && t >= o.ouabainAt) ? 1 : 0;
      // senza pompa i gradienti si dissipano e la membrana si depolarizza (Vm → 0)
      var Vm = Vm0 * F.clamp((NaO - NaI) / (NaO - NaI0), 0, 1);
      var D = 2 * (Math.log(NaO / NaI) - Vm / RTF), eD = Math.exp(-D);
      var Jsg = Js * (Go - Gi * eD) / (0.5 + Go + Gi * eD);
      var Jgl = Jg * (Gi - Gb) / (17 + Gi + Gb);
      var Jp = (1 - ouab) * Jp0 * Math.pow(NaI, 3) / (Math.pow(NaI, 3) + 1000);
      var Jl = kL * (NaO - NaI * Math.exp(Vm / RTF)); // ingresso passivo di Na+ secondo gradiente elettrochimico
      if (k % every === 0) { out.t.push(t); out.NaI.push(NaI); out.Gi.push(Gi); out.Jsglt.push(Jsg); out.Jglut.push(Jgl); out.Jpump.push(Jp); out.Vm.push(Vm); }
      NaI = Math.max(0.1, NaI + dt * (2 * Jsg + Jl - 3 * Jp));
      Gi = Math.max(0, Gi + dt * (Jsg - Jgl));
      t += dt;
    }
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
