/* Elettrochimica di membrana: Nernst, Goldman-Hodgkin-Katz, equazione delle
   conduttanze (circuito equivalente), equilibrio di Gibbs-Donnan, energetica. */
(function (G) {
  'use strict';
  var F = G.Fisio;

  /** Potenziale di equilibrio di Nernst (mV). co = concentrazione esterna, ci = interna. */
  F.nernst = function (co, ci, z, Tc) {
    if (!(co > 0) || !(ci > 0)) return NaN;
    return F.RTF(Tc) / z * Math.log(co / ci);
  };

  /** Fattore "58 mV" (2,303 RT/F) alla temperatura data. */
  F.nernstSlope = function (Tc) { return F.RTF(Tc) * Math.LN10; };

  /** Equazione di Goldman-Hodgkin-Katz per Vm (mV).
      P: {K, Na, Cl} permeabilità relative; o, i: concentrazioni {K, Na, Cl}. */
  F.ghk = function (P, o, i, Tc) {
    var num = P.K * o.K + P.Na * o.Na + P.Cl * i.Cl;
    var den = P.K * i.K + P.Na * i.Na + P.Cl * o.Cl;
    if (!(num > 0) || !(den > 0)) return NaN;
    return F.RTF(Tc) * Math.log(num / den);
  };

  /** Equazione di corrente GHK: densità di corrente (unità arbitrarie proporzionali a P·z²F²V/RT·...).
      Restituisce la corrente uscente positiva per uno ione di valenza z. V in mV. */
  F.ghkCurrent = function (P, z, co, ci, V, Tc) {
    var u = z * V / F.RTF(Tc);               // zFV/RT adimensionale
    if (Math.abs(u) < 1e-6) return P * z * (ci - co) * (1 - u / 2) * 1; // limite (proporzionale)
    return P * z * u * (ci - co * Math.exp(-u)) / (1 - Math.exp(-u));
  };

  /** Equazione delle conduttanze (stato stazionario del circuito equivalente):
      Vm = Σ g_i E_i / Σ g_i  (+ contributo della pompa elettrogenica Ip/Σg). */
  F.chordVm = function (gs, Es, Ipump) {
    var sg = 0, sgE = 0;
    for (var k in gs) { sg += gs[k]; sgE += gs[k] * Es[k]; }
    if (!(sg > 0)) return NaN;
    return (sgE - (Ipump || 0)) / sg; // Ipump uscente positivo → iperpolarizza
  };

  /** Equilibrio di Gibbs-Donnan con volumi uguali (soluzione esatta).
      Lato 1 (esterno): KCl a mM. Lato 2 (interno): KCl b mM + proteinato di K (P mM, valenza −zp).
      All'equilibrio passa x mM di KCl dal lato 1 al lato 2 (x può essere negativo).
      Restituisce concentrazioni finali, Vm (lato 2 rispetto a lato 1), differenza osmotica. */
  F.donnan = function (a, b, P, zp, Tc) {
    var Q = zp * P; // cariche negative fisse (mEq/L)
    var x = (a * a - b * b - Q * b) / (2 * a + 2 * b + Q);
    var K1 = a - x, Cl1 = a - x, K2 = b + x + Q, Cl2 = b + x;
    var V = F.RTF(Tc) * Math.log(K1 / K2); // = (RT/F) ln(K1/K2): negativo dal lato delle proteine
    var osm1 = K1 + Cl1, osm2 = K2 + Cl2 + P;
    var dOsm = osm2 - osm1; // mOsm/L
    var piAtm = dOsm / 1000 * F.C.Ratm * (Tc + F.C.K0);
    return {
      x: x, K1: K1, Cl1: Cl1, K2: K2, Cl2: Cl2, V: V,
      ratioK: K2 / K1, ratioCl: Cl1 / Cl2,
      osm1: osm1, osm2: osm2, dOsm: dOsm, piAtm: piAtm, pi_mmHg: piAtm * 760,
      productCheck: [K1 * Cl1, K2 * Cl2]
    };
  };

  /** Moli di carica (monovalente) da separare per caricare la membrana a V (mV).
      Cm in µF/cm², area in cm². Restituisce moli. */
  F.molesForV = function (V, Cm, area) {
    var Q = Cm * 1e-6 * area * Math.abs(V) * 1e-3; // coulomb
    return Q / F.C.F;
  };

  /** Forza elettrochimica (driving force) in mV: Vm − Eion. */
  F.drivingForce = function (Vm, E) { return Vm - E; };

  /** Variazione di energia libera (kJ/mol) per portare 1 mol di ione con valenza z
      dal lato 'da' al lato 'a'. Vm = Vin − Vout (mV). dir: 'in' (fuori→dentro) o 'out'. */
  F.dGion = function (cin, cout, z, VmmV, Tc, dir) {
    var RT = F.RTkJ(Tc), Fk = F.C.F / 1000, V = VmmV / 1000;
    if (dir === 'out') return RT * Math.log(cout / cin) - z * Fk * V;
    return RT * Math.log(cin / cout) + z * Fk * V;
  };

  /** ΔG dell'idrolisi di ATP nelle condizioni date (concentrazioni in mM). */
  F.dGATP = function (ATP, ADP, Pi, Tc, dG0) {
    dG0 = dG0 === undefined ? -30.5 : dG0;
    return dG0 + F.RTkJ(Tc) * Math.log((ADP / 1000) * (Pi / 1000) / (ATP / 1000));
  };

  /** ΔG di una reazione: ΔG°' + RT ln Q. */
  F.dGreaction = function (dG0, Q, Tc) { return dG0 + F.RTkJ(Tc) * Math.log(Q); };
  /** Costante di equilibrio da ΔG°'. */
  F.Keq = function (dG0, Tc) { return Math.exp(-dG0 / F.RTkJ(Tc)); };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
