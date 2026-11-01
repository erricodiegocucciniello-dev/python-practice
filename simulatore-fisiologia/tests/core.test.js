/* Test di validazione del motore numerico.
   Esecuzione:  node --test tests/
   Ogni test confronta il modello con un valore di riferimento (letteratura o slide del corso). */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const dir = path.join(__dirname, '..', 'js', 'core');
['base', 'electro', 'hh', 'cable', 'stoch', 'transport', 'systems'].forEach(f => require(path.join(dir, f + '.js')));
const F = globalThis.Fisio;

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} non è entro ±${tol} da ${b}`);
const between = (a, lo, hi, msg) => assert.ok(a >= lo && a <= hi, `${msg}: ${a} non è in [${lo}, ${hi}]`);

test('Nernst e fattore 58 mV (lezione 13)', () => {
  near(F.nernstSlope(20), 58.2, 0.1, '2,303 RT/F a 20 °C');
  near(F.nernstSlope(37), 61.5, 0.1, '2,303 RT/F a 37 °C');
  near(F.nernst(2.5, 140, 1, 20), -101.7, 0.5, 'EK esempio lezione 15 (slide: −102)');
  near(F.nernst(120, 10, 1, 20), 62.8, 0.5, 'ENa esempio lezione 15 (slide: +63)');
  near(F.nernst(1.2, 1e-4, 2, 37), 125.6, 1, 'ECa con 1,2 mM fuori e 100 nM dentro');
});

test('Goldman-Hodgkin-Katz (lezione 15: −92 mV)', () => {
  const v = F.ghk({ K: 1, Na: 0.01, Cl: 0 }, { K: 2.5, Na: 120, Cl: 0 }, { K: 140, Na: 10, Cl: 0 }, 20);
  near(v, -92, 0.5, 'Vm');
  // permeabilità solo al K+ → coincide con EK
  near(F.ghk({ K: 1, Na: 0, Cl: 0 }, { K: 5, Na: 145, Cl: 110 }, { K: 140, Na: 12, Cl: 10 }, 37), F.nernst(5, 140, 1, 37), 1e-9, 'GHK→Nernst');
});

test('Equazione delle conduttanze: Vm è la media pesata', () => {
  near(F.chordVm({ K: 10, Na: 1 }, { K: -90, Na: 60 }), (-900 + 60) / 11, 1e-9, 'chord');
});

test('Cariche separate per −70 mV (lezione 13: ~10⁻¹³ mol per cm di assone gigante)', () => {
  const mol = F.molesForV(-70, 1, Math.PI * 0.05 * 1); // diametro 0,5 mm, 1 cm
  between(mol, 0.8e-13, 1.5e-13, 'moli');
});

test('Gibbs-Donnan: prodotto [K][Cl] uguale ai due lati, lato proteine negativo', () => {
  const d = F.donnan(100, 100, 50, 1, 20);
  near(d.productCheck[0], d.productCheck[1], 1e-6, 'prodotto');
  assert.ok(d.V < 0, 'potenziale negativo dal lato delle proteine');
  assert.ok(d.osm2 > d.osm1, 'eccesso osmotico dal lato delle proteine');
  near(d.K2 - d.Cl2, 50, 1e-9, 'elettroneutralità lato 2');
});

test('Energetica: ATP nell\'eritrocita (Lehninger ≈ −52 kJ/mol) e pompa Na/K', () => {
  near(F.dGATP(2.25, 0.25, 1.65, 25), -51.8, 0.5, 'ΔG ATP a 25 °C');
  const dg = 3 * F.dGion(12, 145, 1, -70, 37, 'out') + 2 * F.dGion(140, 4.5, 1, -70, 37, 'in');
  between(dg, 40, 46, 'ΔG per ciclo della pompa (kJ/mol)');
  assert.ok(dg < -F.dGATP(2.25, 0.25, 1.65, 37), 'l\'ATP basta per un ciclo');
});

test('Pressione osmotica: 1 Osm = 22,4 atm solo a 0 °C (lezione 7)', () => {
  near(F.vantHoff(1000, 0).atm, 22.4, 0.05, '0 °C');
  near(F.vantHoff(1000, 37).atm, 25.4, 0.1, '37 °C');
  between(F.vantHoff(300, 37).waterColumn_m, 75, 82, 'colonna d\'acqua per 300 mOsm');
});

test('Eritrocita: lisi sotto ~140 mOsm (≈ NaCl 0,45%), urea isosmotica → lisi', () => {
  between(F.RBC.Vcrit, 145, 150, 'volume critico (sfera)');
  between(F.RBC.lysisOsm(), 135, 150, 'osmolarità di lisi');
  assert.strictEqual(F.RBC.simulate({ osmImpOut: 300, Cp: 0, sigma: 1, tmax: 3 }).lysed, false, 'isotonica: nessuna lisi');
  assert.strictEqual(F.RBC.simulate({ osmImpOut: 0, Cp: 300, sigma: 1, Ps: 1e-4, tmax: 20 }).lysed, true, 'urea: lisi');
  near(F.RBC.volumeStatic(290), 90, 1e-9, 'volume a 290');
});

test('Seconda legge di Fick: tempi di diffusione (lezioni 6 e 23)', () => {
  between(F.tDiff(50e-7, 8e-6) * 1e6, 1, 3, 'fessura sinaptica (µs)');
  between(F.tDiff(1, 6.7e-6) / 3600, 15, 25, 'glucosio su 1 cm (ore)');
  const r = F.twoCompartment(10, 0, 1e-4, 1, 1, 0);
  near(r.tau, 1 / (2 * 1e-4), 1e-9, 'τ = V/(2PA)');
});

test('Diffusione ristretta (Renkin): nulla quando la particella eguaglia il poro', () => {
  near(F.renkin(0), 1, 1e-12, 'λ=0');
  assert.strictEqual(F.renkin(1), 0);
  assert.ok(F.renkin(0.5) < 0.06 && F.renkin(0.5) > 0.03, 'λ=0,5');
});

test('Michaelis-Menten: F = Fmax/2 a C = Km; competitivo raddoppia Km con I = Ki', () => {
  near(F.michaelis(2, 10, 2), 5, 1e-12, 'metà');
  near(F.michaelis(4, 10, 2, 1, 1), 5, 1e-12, 'competitivo');
});

test('SGLT1 2Na⁺:1 glucosio può concentrare >10⁴ volte', () => {
  between(F.sgltMaxRatio(145, 12, -60, 37), 1e4, 2e4, 'rapporto');
  const e = F.enterocyte({ Glumen: 2, tmax: 300 });
  assert.ok(e.Gi[e.Gi.length - 1] > 2, 'glucosio cellulare > lume (contro gradiente)');
  const o = F.enterocyte({ Glumen: 2, tmax: 900, ouabainAt: 200 });
  assert.ok(o.Jglut[o.Jglut.length - 1] < 0.1, 'con ouabaina l\'assorbimento si ferma');
});

test('Hodgkin-Huxley: riposo, picco, frequenza (HH 1952)', () => {
  const p = F.HH.defaults();
  const y = F.HH.rest(p);
  near(y[0], -65, 0.2, 'riposo');
  const r = F.HH.simulate({ p, tmax: 30, I: t => (t >= 5 && t < 6 ? 10 : 0) });
  between(Math.max(...r.V), 30, 50, 'picco del PdA');
  assert.strictEqual(r.spikes.length, 1, 'un PdA');
  const sub = F.HH.simulate({ p, tmax: 30, I: t => (t >= 5 && t < 6 ? 0.5 : 0) });
  assert.strictEqual(sub.spikes.length, 0, 'sottosoglia');
  const f = F.fICurve('HH', p, [10], 600, 100)[0];
  between(f, 63, 73, 'frequenza a 10 µA/cm² (≈68 Hz)');
});

test('Hodgkin-Huxley: tutto-o-nulla, refrattarietà e temperatura', () => {
  const p = F.HH.defaults(), y = F.HH.rest(p);
  const th = F.HH.threshold(p, y, 5, 1, 100);
  between(th, 5, 9, 'soglia per impulso di 1 ms (µA/cm²)');
  const big = F.HH.simulate({ p, tmax: 30, I: t => (t >= 5 && t < 6 ? 3 * th : 0) });
  const small = F.HH.simulate({ p, tmax: 30, I: t => (t >= 5 && t < 6 ? 1.2 * th : 0) });
  near(Math.max(...big.V), Math.max(...small.V), 6, 'ampiezza indipendente dallo stimolo');
  const cond = t => (t >= 0 && t < 0.5 ? 40 : 0);
  assert.strictEqual(F.HH.threshold(p, y, 4, 0.5, 100, cond), Infinity, 'refrattario assoluto a 4 ms (6,3 °C)');
  const rel = F.HH.threshold(p, y, 12, 0.5, 100, cond), base = F.HH.threshold(p, y, 5, 0.5, 100);
  assert.ok(isFinite(rel) && rel > 1.3 * base, 'refrattario relativo a 12 ms: soglia aumentata');
  const p2 = Object.assign({}, p, { T: 18.5 });
  assert.ok(isFinite(F.HH.threshold(p2, F.HH.rest(p2), 4, 0.5, 100, cond)), 'a 18,5 °C a 4 ms è già eccitabile');
});

test('Voltage clamp: corrente Na⁺ precoce entrante, K⁺ tardiva uscente, TTX/TEA', () => {
  const step = t => (t < 1 ? -65 : -10);
  const v = F.HH.vclamp({ Vcmd: step, tmax: 12 });
  const iNaMin = Math.min(...v.INa), iKend = v.IK[v.IK.length - 1];
  assert.ok(iNaMin < -500, 'INa entrante (µA/cm²)');
  assert.ok(iKend > 300, 'IK uscente');
  const ttx = F.HH.vclamp({ Vcmd: step, tmax: 12, blockNa: 1 });
  near(Math.min(...ttx.INa), 0, 1e-9, 'TTX');
  const tea = F.HH.vclamp({ Vcmd: step, tmax: 12, blockK: 1 });
  near(Math.max(...tea.IK), 0, 1e-9, 'TEA');
  // inversione della corrente Na+ a ENa
  const atENa = F.HH.vclamp({ Vcmd: t => (t < 1 ? -65 : 50), tmax: 5 });
  const settled = atENa.INa.filter((_, i) => atENa.t[i] > 1.5); // dopo l'assestamento del clamp (τ = 20 µs)
  near(Math.max(...settled.map(Math.abs)), 0, 1e-3, 'INa nulla a ENa');
});

test('Propagazione: calamaro ≈ 18,8 m/s; amielinica ∝ √d; mielinica ∝ d e più veloce', () => {
  const sq = F.Cable.unmyelinated({ d_um: 476, length_cm: 6, n: 240, T: 18.5 });
  between(F.Cable.measureVelocity(sq, { i1: 60, i2: 180, amp: 50, dur: 0.3, dt: 0.01, tmax: 20 }).v, 17, 21, 'calamaro');
  const u1 = F.Cable.unmyelinated({ d_um: 1, length_cm: 0.5, n: 200, T: 18.5 });
  const u4 = F.Cable.unmyelinated({ d_um: 4, length_cm: 0.5, n: 200, T: 18.5 });
  const v1 = F.Cable.measureVelocity(u1, { i1: 50, i2: 150, amp: 1000 * u1.area[0], dur: 0.3, dt: 0.01, tmax: 30 }).v;
  const v4 = F.Cable.measureVelocity(u4, { i1: 50, i2: 150, amp: 1000 * u4.area[0], dur: 0.3, dt: 0.01, tmax: 30 }).v;
  near(v4 / v1, 2, 0.15, 'rapporto √4');
  const vm = d => {
    const c = F.Cable.myelinated({ d_um: d, nInternodes: 20, T: 18.5 });
    const nodes = []; c.kind.forEach((k, i) => { if (k === 'node') nodes.push(i); });
    return F.Cable.measureVelocity(c, { stim: 0, i1: nodes[5], i2: nodes[15], amp: 5e-3 * d, dur: 0.2, dt: 0.005, tmax: 20 }).v;
  };
  const m2 = vm(2), m8 = vm(8);
  near(m8 / m2, 4, 0.5, 'mielinica ∝ d');
  assert.ok(m2 > 4 * v1, 'mielinica molto più veloce');
});

test('Connor-Stevens: con I_A la scarica parte da bassa frequenza (lezione 28)', () => {
  const q = F.CS.defaults();
  const fA = F.fICurve('CS', q, [8.5, 9, 10], 1500, 300);
  assert.ok(fA[0] > 0 && fA[0] < 20, 'frequenza minima bassa con I_A: ' + fA[0]);
  const q0 = Object.assign({}, q, { gA: 0 });
  q0.EL = F.CS.adjustEL(q0, F.CS.rest(q)[0]);
  const f0 = F.fICurve('CS', q0, [6, 8], 1500, 300).filter(x => x > 0);
  assert.ok(f0.length && f0[0] > 50, 'senza I_A la scarica parte già ad alta frequenza');
});

test('Rilascio quantale: m ≈ 2,3 in basso Ca²⁺ (Boyd & Martin) e ≈ 200 in Ringer normale', () => {
  between(2000 * F.releaseProb(0.8, 6.8), 2, 2.7, 'basso Ca');
  between(2000 * F.releaseProb(2, 1), 150, 250, 'normale');
  const q = F.quantalEPP({ p: F.releaseProb(0.8, 6.8), trials: 2000, nonlinear: false, q: 0.4 });
  const fail = q.k.filter(k => k === 0).length / 2000;
  near(fail, Math.exp(-q.m), 0.04, 'frazione di fallimenti = e^{−m}');
});

test('Canale singolo: tempo medio di apertura = 1/β, Po = α/(α+β)', () => {
  const r = F.singleChannel({ alpha: 0.05, beta: 0.2, gamma: 20, V: -80, Erev: 0, duration: 40000, seed: 11 });
  near(F.mean(r.openDwell), 5, 0.5, 'apertura media (ms)');
  near(F.mean(Array.from(r.state)), 0.2, 0.03, 'Po');
  near(r.iOpen, -1.6, 1e-9, 'i = γ(V−E)');
});

test('Sinapsi: accoppiamento elettrico e blocco del Mg²⁺ (NMDA)', () => {
  const g = F.gapPair({ gc: 5, I: t => (t > 5 && t < 45 ? 100 : 0), tmax: 60 });
  const k = (g.V2[Math.floor(g.V2.length * 0.7)] + 65) / (g.V1[Math.floor(g.V1.length * 0.7)] + 65);
  near(k, g.kTheory, 0.02, 'coefficiente di accoppiamento');
  // giunzione rettificante: passa bene da 1 a 2, poco da 2 a 1
  const kk = r => (Math.max(...r.V2) + 65) / (Math.max(...r.V1) + 65);
  const f12 = F.gapPair({ gc: 5, rectify: true, inject: 1, I: t => (t > 5 && t < 45 ? 100 : 0), tmax: 60 });
  const f21 = F.gapPair({ gc: 5, rectify: true, inject: 2, I: t => (t > 5 && t < 45 ? 100 : 0), tmax: 60 });
  assert.ok(kk(f12) > 3 * (Math.max(...f21.V1) + 65) / (Math.max(...f21.V2) + 65), 'rettificazione: 1→2 molto meglio di 2→1');
  assert.ok(F.nmdaBlock(-80, 1) < 0.1 && F.nmdaBlock(0, 1) > 0.7, 'blocco voltaggio-dipendente');
  const ps = F.pspCell({ syns: [{ g: 2, E: 0, t0: 10, tau: 2 }] });
  between(Math.max(...ps.V) + 65, 1, 10, 'PPSE < 10 mV');
  const inv = F.pspCell({ Vhold: 20, syns: [{ g: 2, E: 0, t0: 10, tau: 2 }] });
  assert.ok(Math.min(...inv.V) < 20, 'sopra Erev il PPSE si inverte');
});

test('Omeostasi: errore residuo = disturbo/(1+K)', () => {
  const r = F.feedbackLoop({ K: 9, tau: 5, set: 37, tmax: 80, disturbance: t => (t > 10 ? 2 : 0) });
  near(r.y[r.y.length - 1] - 37, 0.2, 0.01, 'errore');
});

test('Glicemia: OGTT normale e diabetico', () => {
  const at = (g, t) => g.G[g.t.findIndex(x => x >= t)];
  const n = F.glucoseModel({});
  between(Math.max(...n.G), 7, 8.5, 'picco normale');
  assert.ok(at(n, 150) < 7.8, '2 h normale < 7,8');
  const d = F.glucoseModel({ sensitivity: 0.25, beta: 0.4 });
  assert.ok(d.fasting[0] >= 7, 'digiuno diabetico ≥ 7');
  assert.ok(at(d, 150) >= 11.1, '2 h diabetico ≥ 11,1');
});

test('Compartimenti idrici (lezione 1: 28 / 11,2 / 2,8 L)', () => {
  const b = F.bodyWater({ mass: 70, sex: 'M' }).before;
  near(b.ICF, 28, 1e-9, 'LIC'); near(b.inter, 11.2, 1e-9, 'interstizio'); near(b.plasma, 2.8, 1e-9, 'plasma');
  const s = F.bodyWater({ mass: 70, sex: 'M', addNaClmmol: 150, addWater: 1 }).after; // 1 L di fisiologica (≈ isotonica)
  near(s.ICF, 28, 0.6, 'la fisiologica resta nel LEC');
});

test('Rene: GFR 125 mL/min, FF ≈ 0,2, risposta bifasica all\'arteriola efferente', () => {
  const g = F.glomerulus({});
  near(g.GFR, 125, 0.5, 'GFR');
  between(g.FF, 0.17, 0.23, 'frazione di filtrazione');
  near(g.pi0, 25.6, 0.2, 'pressione oncotica (Landis-Pappenheimer, 7 g/dL)');
  const e15 = F.glomerulus({ Reff: 1.5 }).GFR, e4 = F.glomerulus({ Reff: 4 }).GFR;
  assert.ok(e15 > 125 && e4 < e15, 'efferente: prima ↑ poi ↓');
  assert.ok(F.glomerulus({ Raff: 1.5 }).GFR < 125, 'afferente costretta: ↓ GFR');
  const k = F.kidneyWater({ ADH: 10 });
  near(k.V, 900 / 1200, 1e-9, 'volume urinario minimo = carico/Umax');
});

test('Meccanocettori: Meissner ~40 Hz, Pacini ~250 Hz e più sensibile', () => {
  const thr = (type, fHz) => {
    let lo = 0.001, hi = 300;
    const fires = A => F.mechano(type, t => A * (1 - Math.cos(2 * Math.PI * fHz * t / 1000)) / 2, { tmax: Math.max(300, 6000 / fHz) }).spikes.length >= 3;
    if (!fires(hi)) return Infinity;
    for (let i = 0; i < 24; i++) { const m = Math.sqrt(lo * hi); if (fires(m)) hi = m; else lo = m; }
    return hi;
  };
  const ra = [10, 40, 150].map(f => thr('RA', f));
  assert.ok(ra[1] < ra[0] && ra[1] < ra[2], 'RA: minimo vicino a 40 Hz');
  const pc = [40, 250].map(f => thr('PC', f));
  assert.ok(pc[1] < pc[0] && pc[1] < ra[1] / 10, 'PC: minimo ad alta frequenza, molto sensibile');
  const ramp = t => (t > 100 && t < 600 ? Math.min(1, (t - 100) / 20) * 50 : 0);
  const sa = F.mechano('SA1', ramp, { tmax: 800 }).spikes.filter(s => s > 300 && s < 590).length;
  const pcH = F.mechano('PC', ramp, { tmax: 800 }).spikes.filter(s => s > 300 && s < 590).length;
  const dec = F.mechano('PC', ramp, { tmax: 800, decapsulated: true }).spikes.filter(s => s > 300 && s < 590).length;
  assert.ok(sa > 5 && pcH === 0 && dec > 5, 'SA lento, PC rapido, PC senza capsula lento (Loewenstein)');
});
