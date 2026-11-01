/* Domande calcolate dal motore: i numeri cambiano a ogni prova e la risposta giusta viene dai modelli del sito
   (o da formule elementari), quindi è sempre esatta. Ogni generatore restituisce {q, o:[GIUSTA, errata, errata, errata], w}.
   Servono per allenare il comportamento delle formule (come cambia una grandezza se ne cambia un\'altra), non i calcoli lunghi. */
(function (G) {
  'use strict';
  var F = G.Fisio, Q = F.quiz;

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function num(v, d) { return F.fmt(v, d === undefined ? 0 : d); }
  /** Costruisce 4 opzioni uniche: la giusta per prima, poi le errate prese dai candidati. */
  function opts(correct, wrongs, filler) {
    var out = [correct], seen = {}; seen[String(correct).toLowerCase()] = 1;
    wrongs.concat(filler || []).forEach(function (w) {
      var k = String(w).toLowerCase();
      if (out.length < 4 && !seen[k]) { out.push(w); seen[k] = 1; }
    });
    return out;
  }

  // ------------------------------------------------------------ 06 — tempo di diffusione
  Q.addGen('fick-tempo', '06', 'Tempo di diffusione', function (rng) {
    var k = pick(rng, [2, 3, 4, 5, 10]), more = rng() < 0.7;
    var f = more ? k * k : 1 / (k * k);
    var fmt = function (x) { var y = x >= 1 ? x : 1 / x; return (x >= 1 ? '×' : '÷') + num(y, y % 1 ? 1 : 0); };
    var q = more ? 'Se la distanza da percorrere per diffusione diventa ' + k + ' volte maggiore, il tempo di diffusione cambia di un fattore…'
      : 'Se la distanza da percorrere per diffusione diventa ' + k + ' volte minore, il tempo di diffusione cambia di un fattore…';
    var wrong = more ? [k, Math.sqrt(k), 1 / k] : [1 / k, 1 / Math.sqrt(k), k];
    var o = opts(fmt(f), wrong.map(function (x) { return fmt(x); }), [fmt(2), fmt(3), fmt(0.5)]);
    if (o.length < 4) o = opts(fmt(f), [], [fmt(k), fmt(1 / k), fmt(k + 1), fmt(2 * k)]);
    return { q: q, o: o, w: 'Seconda legge di Fick: il tempo di diffusione è proporzionale al quadrato della distanza (t ∝ x²). Per questo la diffusione è rapidissima su scala cellulare e lentissima su scala macroscopica.' };
  });

  // ------------------------------------------------------------ 06 — flusso diffusivo
  Q.addGen('fick-flusso', '06', 'Prima legge di Fick', function (rng) {
    var k = pick(rng, [2, 3, 4, 5]), up = rng() < 0.5;
    var q = 'In una diffusione semplice, F = K·ΔC. Se ΔC ' + (up ? 'aumenta di ' + k + ' volte' : 'diventa ' + k + ' volte più piccola') + ' (K costante), il flusso…';
    var right = up ? 'aumenta di ' + k + ' volte' : 'diminuisce di ' + k + ' volte';
    var wrong = up ? ['aumenta di ' + (k * k) + ' volte', 'aumenta di ' + num(Math.sqrt(k), 1) + ' volte', 'resta invariato, perché è già al massimo']
      : ['diminuisce di ' + (k * k) + ' volte', 'diminuisce di ' + num(Math.sqrt(k), 1) + ' volte', 'resta invariato, perché K è costante'];
    return { q: q, o: opts(right, wrong), w: 'Nella diffusione semplice il flusso è direttamente proporzionale alla forza spingente (equazione di Teorell): non satura. In un trasporto mediato da carrier, invece, il flusso satura.' };
  });

  // ------------------------------------------------------------ 07 — osmolarità
  Q.addGen('osmolarita', '07', 'Osmolarità', function (rng) {
    var sol = pick(rng, [['NaCl', 2], ['KCl', 2], ['CaCl₂', 3], ['MgCl₂', 3], ['glucosio', 1], ['saccarosio', 1], ['urea', 1]]);
    var c = pick(rng, [50, 100, 150, 200, 300]);
    var right = num(c * sol[1]) + ' mOsm';
    var o = opts(right, [num(c) + ' mOsm', num(c * 2) + ' mOsm', num(c * 3) + ' mOsm', num(c / 2) + ' mOsm', num(c * 4) + ' mOsm']);
    return { q: 'Una soluzione ideale ' + c + ' mM di ' + sol[0] + ' ha un\'osmolarità di circa…', o: o, w: 'La pressione osmotica dipende dal numero di particelle: ' + sol[0] + (sol[1] > 1 ? ' si dissocia in ' + sol[1] + ' particelle (soluzione ideale)' : ' non si dissocia (1 particella)') + ', quindi ' + c + ' × ' + sol[1] + ' = ' + num(c * sol[1]) + ' mOsm.' };
  });

  // ------------------------------------------------------------ 08 — eritrocita
  Q.addGen('eritrocita-tonicita', '08', 'Eritrocita e tonicità', function (rng) {
    var osm = pick(rng, [150, 200, 250, 300, 350, 450, 600]), kind = osm < 300 ? 0 : osm > 300 ? 1 : 2;
    var txt = ['si gonfia, e se la soluzione è molto diluita può emolizzare', 'si raggrinzisce, perché perde acqua', 'resta praticamente invariato, con flusso netto di acqua nullo'];
    var wrong = txt.filter(function (_, i) { return i !== kind; }).concat(['riceve soluto per diffusione e poi si gonfia']);
    return { q: 'Un eritrocita (citoplasma circa 300 mOsm) è immerso in una soluzione di ' + osm + ' mOsm con soluti impermeabili. L\'eritrocita…', o: opts(txt[kind], wrong), w: 'L\'acqua si sposta passivamente dalla soluzione a pressione osmotica più bassa a quella a pressione più alta. ' + (kind === 0 ? 'Fuori è più diluito: l\'acqua entra.' : kind === 1 ? 'Fuori è più concentrato: l\'acqua esce.' : 'Le osmolarità sono uguali: i flussi unidirezionali si equivalgono.') };
  });

  // ------------------------------------------------------------ 11 — Michaelis-Menten
  Q.addGen('mm-frazione', '11', 'Cinetica di Michaelis-Menten', function (rng) {
    var km = pick(rng, [2, 5, 10, 20]), m = pick(rng, [1, 3, 1, 0.5, 9]);
    var c = km * m, frac = c / (km + c);
    var show = function (x) { var table = { 0.5: '1/2', 0.75: '3/4', 0.9: '9/10', 0.25: '1/4', 0.333: '1/3', 0.667: '2/3' }; var key = Math.round(x * 1000) / 1000; return table[key] || num(100 * x) + '%'; };
    var label = function (x) { return 'circa ' + (Math.abs(x - 0.5) < 1e-9 ? 'metà' : Math.abs(x - 0.75) < 1e-9 ? 'i 3/4' : Math.abs(x - 0.9) < 1e-9 ? 'il 90%' : Math.abs(x - 0.25) < 1e-9 ? 'un quarto' : Math.abs(x - 0.1) < 1e-9 ? 'il 10%' : num(100 * x) + '%') + ' del flusso massimo'; };
    var right = label(frac);
    var cand = [0.5, 0.75, 0.9, 0.25, 0.1].filter(function (x) { return Math.abs(x - frac) > 1e-9; }).map(label);
    return { q: 'Un trasportatore con Km = ' + km + ' mM è esposto a una concentrazione di substrato di ' + num(c, c % 1 ? 1 : 0) + ' mM. Il flusso è…', o: opts(right, cand), w: 'F = F_max·C/(K_m + C). Con C = K_m il flusso è metà del massimo; con C molto più grande di K_m tende al massimo (saturazione). Qui F/F_max = ' + num(frac, 2) + '.' };
  });

  Q.addGen('km-affinita', '11', 'Km e affinità', function (rng) {
    var a = pick(rng, ['GLUT1', 'GLUT2', 'GLUT3', 'trasportatore A']), b = pick(rng, ['GLUT4', 'GLUT5', 'trasportatore B']);
    var ka = pick(rng, [1, 2, 5, 10, 20]), kb = pick(rng, [1, 3, 8, 15, 30]);
    if (ka === kb) kb += 1;
    var best = ka < kb ? a : b;
    return { q: 'Il trasportatore «' + a + '» ha Km = ' + ka + ' mM per il glucosio e il trasportatore «' + b + '» ha Km = ' + kb + ' mM. Quale ha l\'affinità maggiore?', o: opts(best + ', perché ha la Km più bassa', [(best === a ? b : a) + ', perché ha la Km più alta', 'hanno la stessa affinità, la Km misura la velocità massima', 'dipende solo dalla velocità massima, non dalla Km']), w: 'La Km è la concentrazione di substrato a cui il flusso è metà del massimo: una Km più bassa significa che basta meno substrato per raggiungere metà della velocità massima, cioè un\'affinità maggiore.' };
  });

  // ------------------------------------------------------------ 12 — pompa Na+/K+
  Q.addGen('pompa-stechiometria', '12', 'Pompa Na⁺/K⁺', function (rng) {
    var n = pick(rng, [2, 3, 4, 5, 10]);
    var right = (3 * n) + ' Na⁺ fuori, ' + (2 * n) + ' K⁺ dentro, carica netta di ' + n + ' cariche positive verso l\'esterno';
    var wrong = [(2 * n) + ' Na⁺ fuori, ' + (3 * n) + ' K⁺ dentro, carica netta di ' + n + ' cariche positive verso l\'interno',
      (3 * n) + ' Na⁺ dentro, ' + (2 * n) + ' K⁺ fuori, carica netta di ' + n + ' cariche positive verso l\'interno',
      (3 * n) + ' Na⁺ fuori, ' + (3 * n) + ' K⁺ dentro, nessuna carica netta spostata'];
    return { q: 'La pompa Na⁺/K⁺ compie ' + n + ' cicli, ognuno con idrolisi di una molecola di ATP. Quanto trasporta, e con quale effetto sulla carica?', o: opts(right, wrong), w: 'Per ogni ATP la pompa sposta 3 Na⁺ fuori e 2 K⁺ dentro: è elettrogenica, perché esce una carica positiva in più per ciclo. Il contributo al potenziale di riposo è di qualche mV.' };
  });

  // ------------------------------------------------------------ 13 — Nernst
  Q.addGen('nernst-direzione', '13', 'Nernst', function (rng) {
    var ion = pick(rng, [['K⁺', 1, 5, 140, 'esterna', 'interna'], ['Na⁺', 1, 145, 12, 'esterna', 'interna'], ['Cl⁻', -1, 110, 8, 'esterna', 'interna']]);
    var z = ion[1], co = ion[2], ci = ion[3], side = pick(rng, ['esterna', 'interna']), factor = pick(rng, [2, 3, 5]), up = rng() < 0.5;
    var co2 = co, ci2 = ci;
    if (side === 'esterna') co2 = up ? co * factor : co / factor; else ci2 = up ? ci * factor : ci / factor;
    var e1 = F.nernst(co, ci, z, 37), e2 = F.nernst(co2, ci2, z, 37), d = e2 - e1;
    var right = d > 0.5 ? 'diventa più positivo' : d < -0.5 ? 'diventa più negativo' : 'non cambia';
    var texts = ['diventa più positivo', 'diventa più negativo', 'non cambia'];
    var o = opts(right, texts.filter(function (t) { return t !== right; }).concat(['cambia segno senza variare in valore assoluto']));
    return { q: 'Per lo ione ' + ion[0] + ', la concentrazione ' + side + ' ' + (up ? 'aumenta' : 'diminuisce') + ' di ' + factor + ' volte (l\'altra non cambia). Il potenziale di equilibrio dello ione…', o: o, w: 'E = (RT/zF)·ln([ione]ₒ/[ione]ᵢ). ' + (z > 0 ? 'Per un catione E sale quando cresce il rapporto fuori/dentro.' : 'Per un anione z = −1: E sale quando cala il rapporto fuori/dentro.') + ' Vale da ' + num(e1, 0) + ' a ' + num(e2, 0) + ' mV.' };
  });

  Q.addGen('nernst-valore', '13', 'Nernst', function (rng) {
    var ko = pick(rng, [2.5, 4, 5, 10, 20, 40]), ki = 140;
    var e = F.nernst(ko, ki, 1, 37), r = Math.round(e);
    var wrong = [-r, Math.round(e / 2), Math.round(e * 1.5), r + 25, r - 25];
    var o = opts(num(r) + ' mV', wrong.map(function (x) { return num(x) + ' mV'; }));
    return { q: 'A 37 °C, con [K⁺] esterna = ' + num(ko, ko % 1 ? 1 : 0) + ' mM e interna = 140 mM, il potenziale di equilibrio del K⁺ è circa…', o: o, w: 'E_K = 61,5·log₁₀([K]ₒ/[K]ᵢ) mV a 37 °C = 61,5·log₁₀(' + num(ko, ko % 1 ? 1 : 0) + '/140) ≈ ' + num(e, 0) + ' mV (negativo perché il K⁺ è più concentrato dentro).' };
  });

  // ------------------------------------------------------------ 15 — Ohm ionico e Goldman
  Q.addGen('corrente-ionica', '15', 'Forza elettrochimica', function (rng) {
    var ion = pick(rng, [['K⁺', -90], ['Na⁺', 60], ['Cl⁻', -70], ['Ca²⁺', 120]]), vm = pick(rng, [-80, -70, -65, -60, -40, -20, 0, 10, 30]);
    var d = vm - ion[1];
    if (Math.abs(d) < 5) vm += 25, d = vm - ion[1];
    // convenzione: corrente uscente positiva; per un catione V−E > 0 → flusso netto uscente, per un anione è il contrario
    var cat = ion[0] !== 'Cl⁻', outward = cat ? d > 0 : d < 0;
    var right = outward ? 'uscente dalla cellula' : 'entrante nella cellula';
    var o = opts(right, [outward ? 'entrante nella cellula' : 'uscente dalla cellula', 'nullo, perché la cellula è a riposo', 'nullo, perché i canali sono sempre chiusi']);
    return { q: 'Una cellula è a V_m = ' + num(vm) + ' mV; il potenziale di equilibrio dello ione ' + ion[0] + ' è ' + (ion[1] > 0 ? '+' : '') + num(ion[1]) + ' mV. Attraverso i canali aperti, il flusso netto di ' + ion[0] + ' è…', o: o, w: 'La forza elettrochimica è V_m − E_ion = ' + num(d) + ' mV. ' + (cat ? 'Per un catione il flusso netto segue il segno di V_m − E: se positivo esce, se negativo entra.' : 'Per un anione il flusso netto di carica ha il segno opposto: con V_m − E negativo l\'anione esce (corrente di carica entrante).') };
  });

  Q.addGen('goldman-direzione', '15', 'Goldman', function (rng) {
    var ion = pick(rng, [['K⁺', 'E_K ≈ −90 mV'], ['Na⁺', 'E_Na ≈ +60 mV'], ['Cl⁻', 'E_Cl ≈ −70 mV']]), up = rng() < 0.5;
    var right = up ? 'si sposta verso ' + ion[1].split(' ')[0] : 'si allontana da ' + ion[1].split(' ')[0];
    var q = 'Nella cellula a riposo (V_m ≈ −65 mV) la permeabilità a ' + ion[0] + ' ' + (up ? 'aumenta' : 'diminuisce') + ' molto, le altre restano uguali. Il potenziale di membrana…';
    var others = ['K⁺', 'Na⁺', 'Cl⁻'].filter(function (x) { return x !== ion[0]; });
    var o = opts(right, [up ? 'si allontana da ' + ion[1].split(' ')[0] : 'si sposta verso ' + ion[1].split(' ')[0], 'non cambia, perché dipende solo dalla pompa', 'si porta a zero in ogni caso']);
    return { q: q, o: o, w: 'Il potenziale è una media dei potenziali di equilibrio pesata dalle permeabilità (Goldman) o dalle conduttanze: se aumenta il peso di uno ione, V_m si avvicina al suo potenziale di equilibrio (' + ion[1] + '); se cala, se ne allontana.' };
  });

  // ------------------------------------------------------------ 16 — costante di tempo
  Q.addGen('costante-tempo', '16', 'Costante di tempo', function (rng) {
    var r = pick(rng, [50, 100, 200, 500]), c = pick(rng, [20, 50, 100, 200]);
    var tau = r * c * 1e6 * 1e-12 * 1e3; // ms
    var fmt = function (x) { return num(x, x < 10 && x % 1 ? 1 : 0) + ' ms'; };
    var o = opts(fmt(tau), [fmt(tau * 10), fmt(tau / 10), fmt(tau * 1000), fmt(r + c)]);
    return { q: 'Una membrana ha una resistenza di ' + r + ' MΩ e una capacità di ' + c + ' pF. La costante di tempo τ = R·C vale…', o: o, w: tauText(r, c, tau) };
  });
  function tauText(r, c, tau) { return 'τ = R·C = ' + r + '·10⁶ Ω × ' + c + '·10⁻¹² F = ' + num(tau, tau < 10 && tau % 1 ? 1 : 0) + ' ms: attenzione alle unità. A τ la risposta raggiunge il 63% del valore finale.'; }

  // ------------------------------------------------------------ 18 — Q10
  Q.addGen('q10', '18', 'Temperatura', function (rng) {
    var dT = pick(rng, [10, 20]), q10 = 3, f = Math.pow(q10, dT / 10);
    var o = opts('×' + num(f), ['×' + num(f * 3), '×' + num(dT / 10 + 1), '×6'], ['×2', '×30', '×4']);
    return { q: 'I processi di gating di un canale hanno Q₁₀ = 3. Se la temperatura sale di ' + dT + ' °C, la velocità del gating cambia di circa un fattore…', o: o, w: 'Q₁₀ = 3 significa che ogni 10 °C la velocità si moltiplica per 3: per ' + dT + ' °C si ha ' + (dT === 10 ? '3' : '3² = 9') + '. Per questo il PdA è più breve e la refrattarietà più corta a temperature più alte.' };
  });

  // ------------------------------------------------------------ 21 — costante di spazio
  Q.addGen('lambda-diametro', '21', 'Costante di spazio', function (rng) {
    var k = pick(rng, [4, 9, 16]), up = rng() < 0.5, r = Math.sqrt(k);
    var right = up ? '×' + num(r) : '÷' + num(r);
    var q = 'In un dendrite passivo (R_m e R_i invariate), il diametro diventa ' + k + ' volte ' + (up ? 'maggiore' : 'minore') + '. La costante di spazio λ = √(R_m·d/4R_i) cambia di un fattore…';
    var o = opts(right, [up ? '×' + num(k) : '÷' + num(k), up ? '÷' + num(r) : '×' + num(r), up ? '×' + num(k * k) : '÷' + num(k * k)]);
    return { q: q, o: o, w: 'λ è proporzionale alla radice quadrata del diametro: per un diametro ' + k + ' volte ' + (up ? 'maggiore' : 'minore') + ' λ ' + (up ? 'aumenta' : 'diminuisce') + ' di √' + k + ' = ' + num(r) + '. Un dendrite più sottile ha più resistenza assiale e il segnale si spegne prima.' };
  });

  // ------------------------------------------------------------ 25 — Poisson
  Q.addGen('poisson-fallimenti', '25', 'Rilascio quantale', function (rng) {
    var m = pick(rng, [1, 2, 3]), p0 = Math.exp(-m) * 100;
    var fmt = function (x) { return 'circa il ' + num(x) + '%'; };
    var o = opts(fmt(p0), [fmt(100 - p0), fmt(50), fmt(m * 10), fmt(p0 / 2), fmt(5)]);
    return { q: 'Alla placca, con un contenuto quantico medio m = ' + m + ' (statistica di Poisson), la frazione di stimoli senza alcuna risposta (fallimenti) è…', o: o, w: 'P(0) = e^(−m) = e^(−' + m + ') ≈ ' + num(p0, 1) + '%. È anche per questo che m si può stimare dai fallimenti: m = ln(N/N₀).' };
  });

  // ------------------------------------------------------------ 30 — rene
  Q.addGen('starling-pressione', '30', 'Filtrazione glomerulare', function (rng) {
    var pgc = ri(rng, 50, 60), pbs = pick(rng, [10, 15, 20]), pi = pick(rng, [20, 25, 30]);
    var net = pgc - pbs - pi;
    var o = opts(num(net) + ' mmHg', [num(pgc - pbs + pi) + ' mmHg', num(pgc + pbs - pi) + ' mmHg', num(pgc - pbs) + ' mmHg', num(pgc - pi + pbs) + ' mmHg'], [num(net + 10) + ' mmHg', num(net + 20) + ' mmHg', num(Math.max(1, net - 8)) + ' mmHg']);
    return { q: 'In un punto del capillare glomerulare: pressione idrostatica P_GC = ' + pgc + ' mmHg, pressione nella capsula di Bowman P_BS = ' + pbs + ' mmHg, pressione oncotica π_GC = ' + pi + ' mmHg. La pressione netta di filtrazione è…', o: o, w: 'P_netta = P_GC − P_BS − π_GC = ' + pgc + ' − ' + pbs + ' − ' + pi + ' = ' + num(net) + ' mmHg. Lungo il capillare π_GC aumenta (le proteine si concentrano) e la pressione netta cala.' };
  });

  Q.addGen('volume-urinario', '30', 'Bilancio idrico', function (rng) {
    var load = pick(rng, [600, 900, 1200]), u = pick(rng, [300, 600, 1200]);
    var v = load / u;
    var fmt = function (x) { return num(x, x % 1 ? 2 : 0) + ' L/giorno'; };
    var o = opts(fmt(v), [fmt(u / load), fmt(v * 2), fmt(v / 2), fmt(v * 4)], [fmt(v + 1), fmt(v + 2)]);
    return { q: 'Un adulto deve eliminare un carico osmotico di ' + load + ' mOsm al giorno e il rene produce un\'urina di ' + u + ' mOsm/L. Il volume urinario è…', o: o, w: 'V = carico osmotico / osmolarità urinaria = ' + load + ' / ' + u + ' = ' + num(v, 2) + ' L/giorno. Con l\'urina massimamente concentrata (circa 1200 mOsm/L) il volume è il minimo obbligato.' };
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
