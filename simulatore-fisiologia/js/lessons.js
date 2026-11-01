/* Contenuti delle 31 lezioni del corso di Fisiologia Generale (prof.ssa E. Silvestri).
   Ogni lezione: concetto in una frase, punti chiave, formule, simulatori con preset,
   domanda "Prevedi", cosa osservare, note sugli errori delle slide, quiz. */
(function (G) {
  'use strict';
  var F = G.Fisio;
  F.LESSONS = [
    // ------------------------------------------------------------------ 01
    {
      id: '01', num: '01', title: 'Introduzione: omeostasi e sistemi di controllo',
      src: '01_Fisiologia_Introduzione_Silvestri.ppt',
      card: 'Milieu intérieur, omeostasi, feedback negativo e positivo, compartimenti idrici.',
      oneliner: "L'organismo mantiene stabile il proprio ambiente interno grazie a sistemi di controllo a <b>retroazione negativa</b>: un sensore misura la variabile, un comparatore la confronta con il valore ideale e un effettore corregge l'errore.",
      points: [
        "Claude Bernard: <i>la fixité du milieu intérieur est la condition de la vie libre</i>. Walter Cannon (1929) conia il termine <b>omeostasi</b>: stato <b>stazionario</b>, non di equilibrio.",
        "Anello di controllo: sistema controllato (grandezza K), sensore, comparatore (valore ideale), segnale di errore E, effettore.",
        "La retroazione <b>negativa</b> riduce l'errore ma non lo annulla del tutto: con guadagno K l'errore residuo è disturbo/(1+K). La retroazione <b>positiva</b> amplifica (es. ciclo di Hodgkin, lezione 19).",
        "Controllo a preazione (feedforward): l'effettore agisce prima che la variabile cambi. Fatica e assuefazione: il sensore si adatta e la correzione si riduce.",
        "Esempi: glicemia e insulina (4–5 mmol/L), asse ipotalamo-ipofisi-tiroide con feedback lungo, corto e ultracorto, K⁺ extracellulare.",
        "Acqua corporea: 60% del peso nell'uomo, 50% nella donna; 2/3 intracellulare (28 L), 1/3 extracellulare: interstizio 11,2 L e plasma 2,8 L (70 kg)."
      ],
      formulas: [
        { label: 'Errore residuo con controllo proporzionale', tex: 'e_{\\infty} = \\frac{d}{1+K}' },
        { label: 'Acqua corporea totale (uomo)', tex: 'ACT \\approx 0{,}6 \\times \\text{peso} \\;=\\; \\underbrace{\\tfrac{2}{3}}_{LIC} + \\underbrace{\\tfrac{1}{3}}_{LEC}' }
      ],
      sims: [
        { id: 'feedback', preset: { type: 'neg', K: 9 },
          predict: { q: "Con un guadagno K = 9 e un disturbo di −2 °C, di quanto si allontanerà la temperatura dal valore ideale a regime?", options: ["0 °C: la correzione è perfetta", "−0,2 °C", "−2 °C", "Oscilla senza fermarsi"], answer: 1, why: "Il controllo proporzionale lascia un errore residuo pari a disturbo/(1+K) = −2/10 = −0,2 °C." },
          observe: "porta K a 0 (nessuna correzione) e poi a 30; prova la retroazione <b>positiva</b>: la variabile si allontana sempre di più. Nei parametri avanzati aggiungi un ritardo del sensore e osserva le oscillazioni." },
        { id: 'glicemia', preset: { cond: 'normale' },
          predict: { q: "Dopo 75 g di glucosio un soggetto sano a 2 ore avrà una glicemia…", options: ["ancora sopra 11 mmol/L", "tornata vicino al valore di partenza (< 7,8)", "sotto 2 mmol/L"], answer: 1, why: "L'insulina, secreta in proporzione all'aumento della glicemia, riporta il glucosio vicino al valore di riferimento: è una retroazione negativa." },
          observe: "confronta il soggetto sano con il diabete di tipo 2 e di tipo 1: cosa manca nell'anello di controllo in ciascun caso?" },
        { id: 'compartimenti', preset: {},
          predict: { q: "Se si infonde 1 L di soluzione fisiologica (NaCl 0,9%, isotonica), dove va l'acqua?", options: ["Si distribuisce in tutti i compartimenti", "Resta nel liquido extracellulare", "Entra soprattutto nelle cellule"], answer: 1, why: "La soluzione è isotonica e il Na⁺ resta fuori dalle cellule: l'osmolarità non cambia e non c'è spostamento di acqua verso il LIC." },
          observe: "confronta 1 L di acqua pura, 1 L di fisiologica e 1 L di salina al 3%." }
      ],
      info: ["La slide indica 60 000 miliardi (6·10¹³) di cellule nel corpo umano: le stime più recenti (Bianconi et al., 2013) sono di circa 3,7·10¹³. L'ordine di grandezza è lo stesso."],
      quiz: [
        { q: "In un sistema a retroazione negativa, aumentare il guadagno dell'anello…", options: ["aumenta l'errore residuo", "riduce l'errore residuo ma può rendere il sistema oscillante se c'è ritardo", "non cambia nulla"], answer: 1, why: "Errore = d/(1+K): più K è grande, più l'errore è piccolo; con un ritardo nel sensore però un guadagno alto produce oscillazioni." },
        { q: "Quale è un esempio di retroazione positiva?", options: ["Insulina e glicemia", "Apertura dei canali Na⁺ durante la fase ascendente del potenziale d'azione", "Ormoni tiroidei e TSH"], answer: 1, why: "La depolarizzazione apre canali Na⁺ che depolarizzano ulteriormente: è il ciclo di Hodgkin." },
        { q: "Nell'uomo di 70 kg il plasma contiene circa…", options: ["28 L", "11,2 L", "2,8 L"], answer: 2, why: "LEC = 14 L, di cui circa il 20% è plasma (2,8 L) e l'80% liquido interstiziale (11,2 L)." }
      ],
      related: ['02', '08', '30']
    },
    // ------------------------------------------------------------------ 02
    {
      id: '02', num: '02', title: 'Energia e attività vitale: termodinamica',
      src: '02_Lezione.ppt',
      card: 'Sistemi aperti, chiusi, isolati; I e II principio; energia libera ed entropia.',
      oneliner: "Gli organismi sono <b>sistemi aperti</b> che mantengono un alto grado di ordine consumando <b>energia libera</b> e aumentando l'entropia dell'universo: non violano il II principio.",
      points: [
        "Sistemi aperti (scambiano energia e materia), chiusi (solo energia), isolati (né energia né materia: l'universo).",
        "I principio: l'energia non si crea né si distrugge, si trasforma: $\\Delta U = Q - L$.",
        "II principio: nelle trasformazioni spontanee di un sistema isolato l'entropia (disordine) aumenta; ogni trasformazione disperde parte dell'energia come calore.",
        "Energia libera di Gibbs: la parte dell'energia che può compiere lavoro a T e P costanti. Reazioni <b>esoergoniche</b> ($\\Delta G < 0$, spontanee) ed <b>endoergoniche</b> ($\\Delta G > 0$).",
        "Gli esseri viventi creano ordine localmente (entropia che diminuisce nell'organismo) a spese di un aumento maggiore dell'entropia dell'ambiente (calore, CO₂, H₂O)."
      ],
      formulas: [
        { label: 'I principio', tex: '\\Delta U = Q - L' },
        { label: 'Energia libera (T e P costanti)', tex: '\\Delta G = \\Delta H - T\\Delta S' },
        { label: 'ΔG nelle condizioni reali', tex: '\\Delta G = \\Delta G^{\\circ\\prime} + RT\\ln Q' }
      ],
      sims: [
        { id: 'energia', preset: { mode: 'singola', couple: false, dG0: -20 },
          predict: { q: "Una reazione ha ΔG°′ = −20 kJ/mol. Se i prodotti sono un milione di volte più concentrati dei reagenti, procede ancora verso i prodotti?", options: ["Sì, sempre: ΔG°′ è negativo", "No: con Q = 10⁶ il ΔG diventa positivo", "Dipende solo dalla temperatura"], answer: 1, why: "A 37 °C RT ln(10⁶) ≈ +35,6 kJ/mol: ΔG = −20 + 35,6 = +15,6 kJ/mol. La direzione dipende da ΔG, non solo da ΔG°′." },
          observe: "sposta il rapporto Q: trova il valore per cui ΔG = 0 (equilibrio). Coincide con la costante di equilibrio K mostrata nei riquadri." },
        { id: 'energia', title: 'Nessuna trasformazione è efficiente al 100%', preset: { mode: 'glucosio' },
          observe: "anche nella cellula meno del 60% dell'energia del glucosio viene conservata nell'ATP; il resto diventa calore, come richiede il II principio." }
      ],
      info: ["La slide usa le relazioni semplificate $U - Q = G$ e $U = TS + G$. La forma rigorosa è $G = H - TS$, quindi a T e P costanti $\\Delta G = \\Delta H - T\\Delta S$. Nei sistemi biologici, a pressione costante e con volumi quasi invariati, $\\Delta H \\approx \\Delta U$: il concetto della slide è corretto."],
      quiz: [
        { q: "Un organismo vivente, dal punto di vista termodinamico, è…", options: ["un sistema isolato", "un sistema chiuso", "un sistema aperto"], answer: 2, why: "Scambia continuamente materia (nutrienti, O₂, CO₂, acqua) ed energia (calore, lavoro) con l'ambiente." },
        { q: "Una reazione con ΔG > 0 nelle condizioni cellulari…", options: ["non può mai avvenire", "può avvenire se accoppiata a una reazione con ΔG più negativo", "avviene spontaneamente ma lentamente"], answer: 1, why: "È il principio dell'accoppiamento energetico (lezione 3): la somma dei ΔG deve essere negativa." }
      ],
      related: ['03', '01']
    },
    // ------------------------------------------------------------------ 03
    {
      id: '03', num: '03', title: 'Energia e reazioni chimiche: ATP e nutrienti',
      src: '03_Lezione.ppt',
      card: 'Reazioni accoppiate, intermedi ad alta energia, ciclo ATP/ADP, ossidazione del glucosio.',
      oneliner: "Le reazioni endoergoniche avvengono solo se <b>accoppiate</b> a reazioni esoergoniche: l'ATP è la \"moneta\" che trasferisce l'energia del catabolismo al lavoro cellulare.",
      points: [
        "Reazioni accoppiate: l'energia libera della reazione esoergonica deve diminuire più di quanto aumenti quella della endoergonica (somma dei ΔG < 0).",
        "Intermedi ad alta energia: X-P trasferisce il fosfato al reagente (fosforilazione), che diventa più reattivo.",
        "Idrolisi dell'ATP: $\\Delta G^{\\circ\\prime} = -30{,}5$ kJ/mol (−7,3 kcal/mol); nella cellula, con ATP alto e ADP basso, circa −50/−55 kJ/mol.",
        "L'ATP alimenta il lavoro meccanico (proteine motrici), di trasporto (pompe) e chimico (biosintesi). Il catabolismo rigenera ATP da ADP + Pᵢ.",
        "Ossidazione del glucosio: $C_6H_{12}O_6 + 6\\,O_2 \\to 6\\,CO_2 + 6\\,H_2O$, $\\Delta G^{\\circ\\prime} \\approx -2870$ kJ/mol (−686 kcal/mol).",
        "Nutrienti: glucidi (→ monosaccaridi), lipidi (→ acidi grassi e glicerolo), protidi (→ aminoacidi); digestione, assorbimento, trasporto, metabolismo."
      ],
      formulas: [
        { label: 'Accoppiamento: glucosio + ATP', tex: '\\underbrace{+13{,}8}_{Glc+P_i\\to G6P} + \\underbrace{(-30{,}5)}_{ATP\\to ADP+P_i} = -16{,}7\\ \\text{kJ/mol}' },
        { label: 'ΔG dell\'ATP nella cellula', tex: '\\Delta G = -30{,}5 + RT\\ln\\frac{[ADP][P_i]}{[ATP]}' }
      ],
      sims: [
        { id: 'energia', preset: { mode: 'singola', couple: false, dG0: 13.8 },
          predict: { q: "Glucosio + Pᵢ → glucosio-6-fosfato ha ΔG°′ = +13,8 kJ/mol. Accoppiandola all'idrolisi di un ATP nella cellula…", options: ["resta endoergonica", "diventa esoergonica", "si inverte"], answer: 1, why: "13,8 − 30,5 = −16,7 kJ/mol in condizioni standard; nella cellula, dove l'ATP vale circa −52 kJ/mol, ancora di più." },
          observe: "attiva \"Accoppia con l'idrolisi di ATP\" e guarda il diagramma dell'energia libera; poi riduci [ATP] e aumenta [ADP]: cosa succede al ΔG dell'ATP?" },
        { id: 'energia', title: 'Resa energetica dell\'ossidazione del glucosio', preset: { mode: 'glucosio' },
          observe: "confronta la resa calcolata con il ΔG standard dell'ATP e con quello reale nella cellula." }
      ],
      quiz: [
        { q: "Perché il ΔG dell'ATP nella cellula è più negativo di −30,5 kJ/mol?", options: ["Perché la temperatura è 37 °C", "Perché il rapporto [ATP]/[ADP][Pᵢ] è molto più alto che in condizioni standard", "Perché l'ATP è legato al Mg²⁺"], answer: 1, why: "Il termine RT ln([ADP][Pᵢ]/[ATP]) è molto negativo quando l'ATP è abbondante rispetto ai prodotti." },
        { q: "Quale tipo di lavoro NON è alimentato direttamente dall'ATP?", options: ["Contrazione (motori proteici)", "Pompe ioniche", "Diffusione semplice dell'O₂"], answer: 2, why: "La diffusione semplice è passiva: segue il gradiente di concentrazione senza consumo di energia." }
      ],
      related: ['02', '12']
    },
    // ------------------------------------------------------------------ 04
    {
      id: '04', num: '04', title: 'La membrana plasmatica: lipidi e mosaico fluido',
      src: '04_La_Membrana_Cellulare_Silvestri.pdf',
      card: 'Fosfolipidi anfipatici, doppio strato, colesterolo, fluidità, asimmetria, lipid raft.',
      oneliner: "La membrana è un <b>doppio strato fosfolipidico fluido</b> in cui sono immerse le proteine (Singer e Nicolson, 1972): la sua fluidità dipende da temperatura, saturazione delle code e colesterolo.",
      points: [
        "I lipidi di membrana sono <b>anfipatici</b>: in acqua formano spontaneamente micelle (molecole a cono) o doppi strati (molecole a cilindro).",
        "Fosfolipidi principali: fosfatidilcolina (PC) e fosfatidiletanolammina (PE), poi fosfatidilserina (PS) e sfingomielina (SM); colesterolo; glicolipidi.",
        "I doppi legami <i>cis</i> piegano le code, impediscono l'impaccamento e aumentano la fluidità; code lunghe e sature la riducono.",
        "Il <b>colesterolo</b> rende la membrana meno fluida ad alta temperatura e impedisce la gelificazione a bassa temperatura (tampone di fluidità); riduce la permeabilità.",
        "<b>Asimmetria</b>: PC, SM e glicolipidi nel foglietto esterno; PE e PS (carica negativa) in quello interno.",
        "Movimenti: diffusione laterale rapida (µm al secondo), rotazione e flessione; il flip-flop tra i foglietti è lentissimo (ore–giorni) senza flippasi.",
        "Lipid raft: microdomini ricchi di sfingolipidi e colesterolo, più spessi, che concentrano alcune proteine."
      ],
      formulas: [
        { label: 'Parametro di impaccamento', tex: 'P = \\frac{v}{a\\,l} \\quad (P<\\tfrac13\\ \\text{micella},\\ \\tfrac12<P\\le1\\ \\text{doppio strato})' },
        { label: 'Distanza percorsa per diffusione laterale', tex: '\\langle r^2 \\rangle = 4Dt' }
      ],
      sims: [
        { id: 'bilayer', preset: { T: 37, unsat: 0.5, chol: 0.3 },
          predict: { q: "Abbassando la temperatura a 0 °C, una membrana senza colesterolo e con code quasi tutte sature diventa…", options: ["più fluida", "rigida (fase gel)", "uguale"], answer: 1, why: "Le code sature si impaccano ordinatamente sotto la temperatura di transizione: la membrana passa allo stato di gel e la diffusione laterale crolla." },
          observe: "porta il colesterolo a 0 e poi a 40%: con il colesterolo la curva della fluidità diventa più graduale (effetto tampone). Ruota la vista per vedere l'asimmetria dei due foglietti." },
        { id: 'packing', preset: {},
          predict: { q: "Un lisofosfolipide (una sola coda) in acqua forma…", options: ["un doppio strato", "micelle", "nessuna struttura"], answer: 1, why: "Con una sola coda la molecola è a cono (testa grande, coda sottile): P < 1/3, si formano micelle." },
          observe: "passa da PC a lisofosfolipide e a PE e guarda come cambia la struttura spontanea." }
      ],
      quiz: [
        { q: "Quale modifica aumenta la fluidità della membrana?", options: ["Più acidi grassi saturi", "Più doppi legami cis nelle code", "Code più lunghe"], answer: 1, why: "I doppi legami cis piegano le catene e ostacolano l'impaccamento." },
        { q: "Il flip-flop spontaneo di un fosfolipide è lento perché…", options: ["la testa polare deve attraversare il cuore idrofobico", "le code sono troppo lunghe", "la membrana è rigida"], answer: 0, why: "Portare la testa polare attraverso lo strato idrofobico ha un costo energetico molto alto." },
        { q: "La fosfatidilserina si trova soprattutto…", options: ["nel foglietto esterno", "nel foglietto citosolico", "in entrambi in uguale misura"], answer: 1, why: "La PS (carica negativa) è nel foglietto interno: la sua comparsa all'esterno è un segnale di apoptosi." }
      ],
      related: ['05', '07']
    },
    // ------------------------------------------------------------------ 05
    {
      id: '05', num: '05', title: 'La membrana: proteine e glicocalice',
      src: '05_La_Membrana_Cellulare_Silvestri.ppt',
      card: 'Proteine intrinseche ed estrinseche, ancore lipidiche, glicocalice, Frye ed Edidin.',
      oneliner: "Le proteine di membrana (canali, trasportatori, recettori, enzimi) sono <b>intrinseche</b> (attraversano il doppio strato) o <b>estrinseche</b> (ancorate o legate in superficie) e si muovono lateralmente nel mosaico fluido.",
      points: [
        "La composizione varia: mielina 18% proteine e 79% lipidi; membrana mitocondriale interna 76% proteine.",
        "Proteine transmembrana: a singola α-elica (glicoforina), a 7 segmenti (rodopsina, recettori accoppiati a proteine G), organizzate in subunità (canali voltaggio-dipendenti, recettori-canale, connessine).",
        "Proteine periferiche: ancorate da acidi grassi (miristico, palmitico), gruppi prenilici o GPI; l'ancoraggio reversibile regola vie di segnalazione.",
        "Glicocalice (glicoproteine e glicolipidi): protezione, riconoscimento e antigeni (CD, MHC I e II), adesione (integrine, caderine).",
        "Esperimento di Frye ed Edidin (1970): dopo la fusione di una cellula umana e di una di topo le proteine marcate si mescolano in circa 40 minuti a 37 °C, non a 15 °C.",
        "Citoscheletro dell'eritrocita: spettrina legata a glicoforina (banda 4.1) e banda 3 (anchirina); difetti di anchirina o spettrina → eritrociti fragili (sferocitosi)."
      ],
      formulas: [],
      practical: "Il mescolamento non richiede ATP: avviene anche con inibitori metabolici. Dipende invece dalla temperatura, perché dipende dalla fluidità dei lipidi.",
      sims: [
        { id: 'fryeedidin', preset: { T: 37 },
          predict: { q: "Ripetendo l'esperimento a 15 °C, dopo 40 minuti le proteine saranno…", options: ["mescolate come a 37 °C", "ancora quasi separate", "tutte nella metà umana"], answer: 1, why: "A bassa temperatura i lipidi sono meno fluidi e la diffusione laterale delle proteine rallenta moltissimo." },
          observe: "lancia una fusione a 37 °C, poi una a 15 °C; prova anche gli inibitori metabolici: il mescolamento non cambia, perché è diffusione passiva." },
        { id: 'bilayer', title: 'Le proteine nel mosaico fluido', preset: { prot: true, T: 37 },
          observe: "riconosci la proteina a singola α-elica, quella a 7 segmenti transmembrana, la proteina periferica sul versante citosolico e quella ancorata al GPI sul versante esterno." }
      ],
      quiz: [
        { q: "Una proteina ancorata al GPI si trova…", options: ["sul versante citosolico", "sul versante extracellulare", "attraversa la membrana 7 volte"], answer: 1, why: "Il glicosil-fosfatidil-inositolo ancora le proteine al foglietto esterno." },
        { q: "L'esperimento di Frye ed Edidin dimostra che…", options: ["le proteine di membrana diffondono lateralmente", "le proteine attraversano la membrana", "il mescolamento richiede ATP"], answer: 0, why: "È la prova classica della fluidità del mosaico." }
      ],
      related: ['04', '09']
    },
    // ------------------------------------------------------------------ 06
    {
      id: '06', num: '06', title: 'Flussi: flusso di massa, diffusione, elettroforesi',
      src: '06_Flussi_Silvestri.ppt',
      card: 'Teorell, leggi di Fick, t ∝ x², migrazione in campo elettrico, Nernst-Planck.',
      oneliner: "Ogni flusso è proporzionale alla sua <b>forza spingente</b> (Teorell): una differenza di pressione (flusso di massa), di concentrazione (diffusione) o di potenziale elettrico (elettroforesi).",
      points: [
        "Equazione di Teorell: $F = K\\cdot X$, con $X = -dW/dx$ (energia dissipata per unità di distanza). Ne derivano la legge di Ohm e la prima legge di Fick.",
        "Flusso di massa: $F_m = k_m(P_1 - P_2)$, con $k_m$ che dipende da viscosità e geometria.",
        "Prima legge di Fick: $F_d = k_d(C_1 - C_2)$. Tra due compartimenti la concentrazione si avvicina all'equilibrio in modo <b>esponenziale</b>.",
        "Seconda legge di Fick: il tempo di diffusione cresce con il <b>quadrato</b> della distanza. Rapidissima su scala cellulare, lentissima su scala macroscopica.",
        "Migrazione in campo elettrico: $F_e = z k_e (V_a - V_c)$ è la legge di Ohm per le soluzioni.",
        "Elettrodiffusione (Nernst-Planck): sugli ioni agiscono insieme gradiente chimico ed elettrico. All'equilibrio ΔG = 0, da cui deriva l'equazione di Nernst."
      ],
      formulas: [
        { label: 'Energetica della diffusione di un soluto', tex: '\\Delta G = RT\\ln\\frac{C_2}{C_1}' },
        { label: 'Per uno ione', tex: '\\Delta G = RT\\ln\\frac{C_2}{C_1} + zF(V_2 - V_1)' },
        { label: 'Tempo di diffusione (1 dimensione)', tex: 't = \\frac{x^2}{2D}' }
      ],
      sims: [
        { id: 'diffusione', preset: { pores: 4 },
          predict: { q: "Raddoppiando il numero di pori nella membrana, il tempo per arrivare all'equilibrio…", options: ["raddoppia", "si dimezza", "non cambia"], answer: 1, why: "La costante di tempo è τ = V/(2PA): raddoppiare l'area dei pori (la permeabilità) dimezza τ." },
          observe: "anche all'equilibrio le particelle continuano ad attraversare la membrana nei due sensi: è il <b>flusso netto</b> ad annullarsi." },
        { id: 'tdiff', preset: { mol: 'Glucosio', x: 10 },
          predict: { q: "Se il glucosio impiega ~75 ms per diffondere di 10 µm, quanto impiega per 1 cm?", options: ["~75 s", "~2 ore", "~20 ore"], answer: 2, why: "Il tempo cresce con x²: la distanza aumenta di 1000 volte, il tempo di un milione di volte (75 ms × 10⁶ ≈ 21 ore)." },
          observe: "per questo gli organismi grandi hanno bisogno della circolazione (flusso di massa) per i tragitti lunghi." },
        { id: 'nernstlive', preset: { ion: 'K' },
          observe: "l'elettrodiffusione in azione: la forza chimica spinge K⁺ fuori, la forza elettrica che si crea lo trattiene. Approfondisci nella lezione 13." }
      ],
      quiz: [
        { q: "Quale forza spingente agisce nel flusso di massa?", options: ["Differenza di concentrazione", "Differenza di pressione idrostatica", "Differenza di potenziale elettrico"], answer: 1, why: "Nel flusso di massa soluto e solvente si muovono insieme spinti da ΔP." },
        { q: "Se z = 0, l'equazione di Nernst-Planck si riduce a…", options: ["la legge di Ohm", "la prima legge di Fick", "l'equazione di van't Hoff"], answer: 1, why: "Senza carica il termine elettrico scompare e resta solo quello diffusivo." }
      ],
      related: ['07', '13', '23']
    },
    // ------------------------------------------------------------------ 07
    {
      id: '07', num: '07', title: 'Permeabilità delle membrane e osmosi',
      src: '07__premesse_teoriche_ai_trasporti.ppt',
      card: 'Coefficiente di permeabilità, coefficiente olio/acqua, vie di permeazione, osmosi, van\'t Hoff.',
      oneliner: "La facilità con cui una sostanza attraversa la membrana è riassunta dal <b>coefficiente di permeabilità</b> $P = \\beta D_m/\\Delta x$: per la via lipidica conta soprattutto la liposolubilità (β).",
      points: [
        "Nella membrana la legge di Fick diventa $F = P(C_1 - C_2)$; P comprende tutti i fattori (particella, temperatura, membrana, spessore) e si misura come $F/(C_1-C_2)$.",
        "Via lipidica: la molecola deve entrare nel doppio strato (coefficiente di ripartizione olio/acqua β) e attraversarlo (coefficiente di diffusione nella membrana $D_m$).",
        "Vie di permeazione: (A) liposolubili attraverso i lipidi; (B) ioni e acqua piccoli attraverso i canali; (C) molecole polari tramite trasporto mediato; (D) le altre non passano.",
        "Gli ioni: la permeabilità cala con il diametro ed è nulla sopra ~8 Å (\"ipotesi del setaccio\", oggi superata ma che anticipò i canali).",
        "<b>Osmosi</b>: passaggio dell'acqua dalla soluzione meno concentrata a quella più concentrata attraverso una membrana semipermeabile. La pressione osmotica è la pressione che la annulla.",
        "Osmolarità = numero di particelle: 150 mM di glucosio = 150 mOsm; 150 mM di NaCl ≈ 300 mOsm.",
        "Coefficiente di riflessione σ: 1 per un soluto che non passa, 0 per un soluto che passa come l'acqua. $\\pi_{reale} = \\sigma\\,\\pi_{teorica}$."
      ],
      formulas: [
        { label: 'Permeabilità della via lipidica', tex: 'P = \\frac{\\beta\\, D_m}{\\Delta x}' },
        { label: 'Equazione di van\'t Hoff', tex: '\\pi = \\sigma R T C_{osm}' },
        { label: 'Flusso osmotico di acqua', tex: 'F_{H_2O} = K_{osm}\\,(\\sigma\\,\\pi - \\Delta p)' }
      ],
      sims: [
        { id: 'permeabilita', preset: { mode: 'lipidi' },
          predict: { q: "Due molecole di dimensioni simili ma con β diverso di 1000 volte: la loro permeabilità…", options: ["è simile, perché hanno le stesse dimensioni", "differisce di circa 1000 volte", "differisce di circa 30 volte"], answer: 1, why: "P è proporzionale a β: per la via lipidica la liposolubilità conta più delle dimensioni." },
          observe: "nel grafico gli ioni hanno permeabilità di 10⁻¹¹–10⁻¹² cm/s attraverso il solo doppio strato: per questo servono i canali." },
        { id: 'osmometro', preset: { c: 150, n: 2 },
          predict: { q: "La pressione osmotica di una soluzione 300 mOsm a 37 °C equivale a una colonna d'acqua di circa…", options: ["30 cm", "8 m", "80 m"], answer: 2, why: "π = RTC = 0,0821 × 310 × 0,3 ≈ 7,6 atm, cioè circa 79 m d'acqua." },
          observe: "porta σ a 0: il soluto passa liberamente e non esercita alcun effetto osmotico." },
        { id: 'eritrocita', preset: { sol: 'hypo' },
          observe: "metti il globulo rosso in acqua distillata, in NaCl 0,45% e in NaCl 1,8%. Quale soluzione lo fa scoppiare (emolisi)?" }
      ],
      warn: ["La slide afferma che \"una soluzione 1 Osm esercita una pressione osmotica di 22,4 atmosfere\". È vero solo a <b>0 °C</b> (273 K). Alla temperatura corporea (310 K): π = 0,0821 × 310 × 1 = <b>25,4 atm</b>. Nel simulatore π è calcolata con la temperatura impostata."],
      quiz: [
        { q: "Una soluzione 300 mM di urea è isosmotica con il citoplasma. Un eritrocita immerso in essa…", options: ["resta normale", "si raggrinzisce", "si gonfia ed emolizza"], answer: 2, why: "L'urea attraversa la membrana (σ ≈ 0): entra nella cellula seguita dall'acqua. Isosmotica non significa isotonica." },
        { q: "150 mM di CaCl₂ corrispondono a circa…", options: ["150 mOsm", "300 mOsm", "450 mOsm"], answer: 2, why: "CaCl₂ si dissocia in 3 particelle: 3 × 150 = 450 mOsm (soluzione ideale)." }
      ],
      related: ['06', '08', '09']
    },
    // ------------------------------------------------------------------ 08
    {
      id: '08', num: '08', title: 'Osmosi e regolazione del volume cellulare',
      src: '08__premesse_teoriche_ai_trasporti.ppt',
      card: 'Tonicità, coefficiente di riflessione, eritrociti in soluzioni diverse, regolazione del volume.',
      oneliner: "Il volume di una cellula segue l'<b>osmolarità efficace</b> (tonicità) del mezzo: solo i soluti che non attraversano la membrana spostano acqua in modo duraturo.",
      points: [
        "Riprende la lezione 7: permeabilità degli ioni e dell'acqua, osmosi, osmolarità, van't Hoff, coefficiente di riflessione.",
        "Soluzioni isotoniche, ipotoniche e ipertoniche: la cellula si comporta da osmometro (relazione di Boyle-van't Hoff), con una frazione di volume osmoticamente inattiva.",
        "L'eritrocita si gonfia fino a diventare una sfera; la membrana non si distende oltre il 3–4%, quindi a ~140–150 mOsm (NaCl ≈ 0,45%) inizia l'emolisi.",
        "Isosmotica ≠ isotonica: in urea 300 mM (permeante) la cellula si gonfia ed emolizza.",
        "Regolazione del volume: segnali di membrana e del citoscheletro e variazioni del Ca²⁺; espulsione di soluti (K⁺, Cl⁻) dopo il rigonfiamento, accumulo (Na⁺, K⁺, Cl⁻) dopo il raggrinzimento.",
        "Regolazione osmotica degli organismi: invertebrati marini osmoconformi e organismi d'acqua dolce, marini e terrestri osmoregolatori."
      ],
      formulas: [
        { label: 'Volume cellulare (Boyle-van\'t Hoff)', tex: 'V = V_b + (V_0 - V_b)\\,\\frac{osm_0}{osm}' },
        { label: 'Volume critico dell\'eritrocita (sfera con area A)', tex: 'V_{crit} = \\frac{A^{3/2}}{6\\sqrt{\\pi}} \\approx 147\\ \\text{fL}' }
      ],
      sims: [
        { id: 'eritrocita', preset: { sol: 'urea' },
          predict: { q: "In urea 300 mM, isosmotica, l'eritrocita…", options: ["non cambia volume", "si gonfia lentamente e va in emolisi", "si raggrinzisce"], answer: 1, why: "L'urea entra secondo gradiente (σ ≈ 0) e l'acqua la segue: la soluzione è isosmotica ma ipotonica per la cellula." },
          observe: "confronta urea (permeante rapido), glicerolo (permeante lento) e saccarosio (non permeante). Poi blocca le acquaporine: cambia la velocità, non il volume finale." },
        { id: 'compartimenti', title: 'Osmosi tra i compartimenti del corpo', preset: { water: 1 },
          observe: "l'acqua pura si distribuisce in tutti i compartimenti in proporzione al loro volume; il sale ipertonico sottrae acqua alle cellule." }
      ],
      warn: ["Come nella lezione 7: \"1 Osm = 22,4 atm\" vale solo a 0 °C; a 37 °C sono 25,4 atm."],
      quiz: [
        { q: "Le acquaporine cambiano…", options: ["il volume finale di equilibrio della cellula", "la velocità con cui la cellula raggiunge l'equilibrio", "l'osmolarità della soluzione"], answer: 1, why: "Aumentano la permeabilità all'acqua: l'equilibrio è lo stesso, ma si raggiunge molto più in fretta." },
        { q: "In NaCl 1,8% l'eritrocita…", options: ["si raggrinzisce (crenatura)", "si gonfia", "resta uguale"], answer: 0, why: "La soluzione è ipertonica (~580 mOsm): l'acqua esce dalla cellula." }
      ],
      related: ['07', '09', '01']
    },
    // ------------------------------------------------------------------ 09
    {
      id: '09', num: '09', title: 'Trasporti passivi, canali ionici e acquaporine',
      src: '09_Trasporti_-_Canali_ionici_introduzione_Silvestri.ppt',
      card: 'Carrier e canali, diffusione libera e ristretta, selettività e gating, acquaporine, cellula β.',
      oneliner: "I <b>canali</b> sono pori acquosi con un <b>filtro di selettività</b> e una <b>porta</b> (gating) controllata da voltaggio, ligandi o stiramento; le <b>acquaporine</b> sono canali per la sola acqua.",
      points: [
        "Due classi di proteine di trasporto: carrier (legano il soluto e cambiano conformazione) e canali (poro acquoso).",
        "Diffusione libera nei pori (canale ≫ particella: vale Fick) e diffusione ristretta (canale appena più grande della particella: fila singola, non vale Fick).",
        "Nel canale aperto passano circa 10⁶ ioni/s: la corrente di canale singolo è dell'ordine dei pA (patch clamp, lezione 17).",
        "Gating: canali di fuga (sempre aperti, potenziale di riposo), meccanosensibili, voltaggio-dipendenti (PdA), operati da ligandi diretti (nicotinico) o indiretti (secondi messaggeri).",
        "Cellula β del pancreas: glucosio → ATP → chiusura dei canali K-ATP → depolarizzazione → apertura dei canali Ca²⁺ → secrezione di insulina. Le sulfoniluree chiudono i K-ATP.",
        "Acquaporine (Agre, Nobel 2003): tetrameri, ogni subunità ha il suo poro (motivi NPA); AQP1 nel globulo rosso e nel tubulo prossimale (inibita da Hg²⁺), AQP2 nel dotto collettore (regolata dall'ADH), AQP4 nel cervello, AQP5 nelle ghiandole."
      ],
      formulas: [
        { label: 'Impedimento sterico (Renkin)', tex: 'H(\\lambda) = (1-\\lambda)^2\\left(1 - 2{,}104\\lambda + 2{,}09\\lambda^3 - 0{,}95\\lambda^5\\right)' }
      ],
      sims: [
        { id: 'permeabilita', title: 'Diffusione ristretta nei pori', preset: { mode: 'pori' },
          predict: { q: "In un poro di raggio 4 Å (diametro 8 Å), il glucosio (raggio ~3,6 Å) passa…", options: ["quasi liberamente", "pochissimo (< 1%)", "per niente"], answer: 1, why: "λ = 3,6/4 = 0,9: le interazioni con le pareti riducono la permeabilità a meno dell'1%." },
          observe: "allarga il poro e osserva quando ciascuna molecola comincia a passare." },
        { id: 'canale3d', preset: { type: 'aqp' },
          observe: "l'acqua passa in fila singola in ciascuno dei quattro pori; inverti il gradiente osmotico e aggiungi Hg²⁺." },
        { id: 'cellulabeta', preset: { G: 5 },
          predict: { q: "Una sulfonilurea (glibenclamide) a glicemia normale…", options: ["blocca la secrezione di insulina", "stimola la secrezione di insulina", "non ha effetto"], answer: 1, why: "Chiude i canali K-ATP indipendentemente dal glucosio: la cellula si depolarizza e libera insulina (ma con rischio di ipoglicemia)." },
          observe: "segui la catena causale da sinistra a destra al variare della glicemia." }
      ],
      quiz: [
        { q: "In una cellula β, la chiusura dei canali K-ATP provoca…", options: ["iperpolarizzazione", "depolarizzazione e apertura dei canali Ca²⁺", "riduzione dell'insulina"], answer: 1, why: "Meno corrente uscente di K⁺ → la membrana si depolarizza → si aprono i canali Ca²⁺ voltaggio-dipendenti." },
        { q: "AQP2 è regolata da…", options: ["insulina", "ADH (vasopressina)", "aldosterone"], answer: 1, why: "L'ADH fa inserire AQP2 nella membrana apicale del dotto collettore: si riassorbe acqua (lezione 30)." }
      ],
      related: ['10', '07', '30']
    },
    // ------------------------------------------------------------------ 10
    {
      id: '10', num: '10', title: 'Canali ionici: di fuga e voltaggio-dipendenti',
      src: '10_Canali_ionici_Silvestri.ppt',
      card: 'Canali di leakage, struttura dei Nav (S4, porte), inattivazione, canali K⁺ (Kv, Kir, K-ATP).',
      oneliner: "I canali voltaggio-dipendenti hanno 4 domini con 6 segmenti: il segmento <b>S4</b> carico positivamente sente il voltaggio e apre la porta di attivazione (S6); una <b>porta di inattivazione</b> chiude il canale durante una depolarizzazione prolungata.",
      points: [
        "Canali di fuga (senza porta): ENaC (Na⁺, sensibili all'amiloride), K2P (2 subunità con 2 regioni P), canali cationici, CLC (Cl⁻; mutazioni di CLC-1 → miotonia). CFTR: il suo difetto causa la fibrosi cistica (ΔF508).",
        "Le conduttanze di fuga diverse per Na⁺, K⁺ e Cl⁻ generano il potenziale di riposo; le pompe mantengono i gradienti, le fughe li limitano (equilibrio stazionario).",
        "Modello standard di un canale voltaggio-dipendente: 4 domini/subunità, filtro di selettività (regioni P tra S5 e S6), porte di attivazione all'imboccatura citoplasmatica (S6), sensori S4, porta di inattivazione.",
        "Sensore S4: elica scorrevole (si sposta verso l'esterno di ~2 Å per passo ruotando di ~60°) o \"paddle\" di MacKinnon. Correnti di gating: 8–12 cariche per canale.",
        "Inattivazione di tipo N (palla e catena, canali K⁺): il canale prima si apre e poi si inattiva. Nei Nav la porta h è l'ansa III-IV (\"botola\"). Tipo C: restringimento del filtro.",
        "Anestetici locali: blocco <b>uso-dipendente</b> (entrano dal lato interno a canale aperto e restano intrappolati).",
        "Canali K⁺: Kv (rettificatore ritardato), KA (inattivazione rapida), K(Ca), hERG; Kir (rettificazione entrante per blocco da Mg²⁺ e poliammine), GIRK (attivati da proteine G), K-ATP."
      ],
      formulas: [
        { label: 'Probabilità di apertura del canale Na⁺ (modello HH)', tex: 'P_{aperto} = m^3 h' },
        { label: 'Corrente attraverso Kir', tex: 'I = g\\,\\frac{V - E_K}{1 + e^{(V-E_K-10)/10}}' }
      ],
      sims: [
        { id: 'canale3d', preset: { type: 'nav' },
          predict: { q: "Se la membrana viene portata a −10 mV e mantenuta lì, il canale Na⁺…", options: ["si apre e resta aperto", "si apre e poi si chiude per inattivazione", "non si apre"], answer: 1, why: "Le porte m si aprono in fretta, la porta h si chiude più lentamente: il canale passa da chiuso → aperto → inattivato." },
          observe: "usa il gradino a −10 mV e poi torna a −65 mV. Attiva la lidocaina e lancia il treno di 10 PdA: il blocco aumenta a ogni impulso (uso-dipendenza)." },
        { id: 'iv', preset: { type: 'kir' },
          predict: { q: "Aumentando il K⁺ esterno, la curva corrente-voltaggio del Kir…", options: ["resta ferma", "si sposta verso destra seguendo E_K", "si inverte"], answer: 1, why: "Il blocco da Mg²⁺ e poliammine dipende da V − E<sub>K</sub>: l'intera curva segue il potenziale di equilibrio del K⁺." },
          observe: "confronta Kv (rettificatore uscente) e Kir (rettificatore entrante)." },
        { id: 'canale3d', title: 'Il canale K⁺: palla e catena', preset: { type: 'kv' },
          observe: "la palla entra solo quando il canale è aperto: il modello presuppone che il canale prima si apra e poi si inattivi." }
      ],
      warn: ["Sul canale GIRK del pacemaker cardiaco la slide dice che l'acetilcolina agisce sui recettori muscarinici \"e poi l'adenilato ciclasi tramite Gs\". Il recettore cardiaco è <b>M2</b>, accoppiato a una proteina <b>Gi/o</b>: le subunità <b>βγ</b> aprono direttamente il GIRK, mentre la subunità αi <b>inibisce</b> l'adenilato ciclasi (meno AMPc, meno corrente funny I<sub>f</sub>). Il concetto dei \"due meccanismi sinergici\" è corretto, ma la proteina G è Gi, non Gs."],
      quiz: [
        { q: "Quale struttura funziona da sensore del voltaggio?", options: ["Il segmento S6", "Il segmento S4 con cariche positive", "Il filtro di selettività"], answer: 1, why: "S4 ha una carica positiva ogni tre residui (Arg o Lys) e si sposta con il campo elettrico." },
        { q: "La rettificazione dei canali Kir è dovuta a…", options: ["un sensore S4 invertito", "un blocco della conduzione da Mg²⁺ e poliammine dal lato interno", "inattivazione di tipo N"], answer: 1, why: "I Kir non hanno S4: la loro voltaggio-dipendenza nasce dal blocco del poro." },
        { q: "La fibrosi cistica più comune è dovuta a…", options: ["mutazione di CLC-1", "delezione della Phe508 di CFTR", "mutazione di ENaC"], answer: 1, why: "ΔF508 è nel dominio NBD1 di CFTR (circa il 70% dei casi)." }
      ],
      related: ['09', '19', '17']
    },
    // ------------------------------------------------------------------ 11
    {
      id: '11', num: '11', title: 'Trasporti mediati: cinetica dei carrier',
      src: '11_Trasporti_mediati_e_attivi_Silvestri.ppt',
      card: 'Specificità, saturazione, competizione, Q10; Michaelis-Menten; diffusione facilitata del glucosio.',
      oneliner: "I trasportatori si comportano come enzimi: il flusso <b>satura</b> quando sono tutti occupati e segue la cinetica di <b>Michaelis-Menten</b>, a differenza della diffusione semplice che cresce linearmente.",
      points: [
        "Caratteristiche: specificità (anche tra isomeri ottici), saturazione (F<sub>max</sub>), competizione tra substrati simili, elevata dipendenza dalla temperatura (Q10 alto).",
        "La saturazione deriva da un numero finito di trasportatori, ciascuno con una velocità finita.",
        "Uniporto, cotrasporto (simporto e antiporto). Modello storico del carrier mobile (valido per gli ionofori); per le proteine integrali modello flip-flop (\"ping-pong\").",
        "Trasporto passivo: affinità uguale sui due lati. Trasporto attivo: l'affinità cambia tra un lato e l'altro.",
        "Diffusione facilitata del glucosio (GLUT): $F = F_{max}/(1 + K_m/[g]_e)$; K<sub>m</sub> = concentrazione a cui F = F<sub>max</sub>/2, inversamente correlata all'affinità. Bloccata dalla floretina."
      ],
      formulas: [
        { label: 'Michaelis-Menten', tex: 'F = \\frac{F_{max}\\,C}{K_m + C}' },
        { label: 'Con inibitore competitivo', tex: 'F = \\frac{F_{max}\\,C}{K_m(1 + [I]/K_i) + C}' }
      ],
      sims: [
        { id: 'carrier', preset: { type: 'glut1' },
          predict: { q: "Con il glucosio a una concentrazione pari a K_m, il flusso è…", options: ["massimo", "metà del massimo", "proporzionale alla concentrazione come nella diffusione"], answer: 1, why: "Per definizione K<sub>m</sub> è la concentrazione che dà F = F<sub>max</sub>/2." },
          observe: "aggiungi un inibitore competitivo: F<sub>max</sub> non cambia, K<sub>m</sub> apparente aumenta. Confronta GLUT1 e GLUT2 (K<sub>m</sub> 17 mM, adatto al fegato e alla cellula β)." }
      ],
      quiz: [
        { q: "Un inibitore competitivo…", options: ["riduce F<sub>max</sub>", "aumenta il K<sub>m</sub> apparente senza cambiare F<sub>max</sub>", "rende il flusso lineare"], answer: 1, why: "Ad alte concentrazioni il substrato vince la competizione e si raggiunge ancora F<sub>max</sub>." },
        { q: "Un Q10 elevato del trasporto mediato indica che…", options: ["è una semplice diffusione", "c'è una vera interazione chimica (legame) col trasportatore", "dipende dall'ATP"], answer: 1, why: "Q10 alti sono tipici delle reazioni chimiche e dei cambi conformazionali." }
      ],
      related: ['12', '09']
    },
    // ------------------------------------------------------------------ 12
    {
      id: '12', num: '12', title: 'Trasporti attivi primari e secondari',
      src: '12_Trasporti_attivi_Silvestri.ppt',
      card: 'Na⁺/K⁺-ATPasi, pompe del Ca²⁺, H⁺/K⁺ gastrica, cotrasporto Na⁺/glucosio.',
      oneliner: "Le <b>pompe</b> usano l'ATP per spostare ioni contro gradiente (trasporto attivo primario); i <b>trasporti attivi secondari</b> usano il gradiente di Na⁺ creato dalla pompa per portare altre molecole contro gradiente.",
      points: [
        "Na⁺/K⁺-ATPasi: 3 Na⁺ fuori, 2 K⁺ dentro per ogni ATP (elettrogenica); tetramero α₂β₂; intermedio fosforilato su un aspartato (P-ATPasi); un ciclo in ~10 ms; fino al 40% dell'energia della cellula.",
        "Regolazione: Na⁺ interno, fosforilazione (adrenalina), ormoni tiroidei, insulina, aldosterone. Ouabaina e glicosidi cardiaci (digitale) la inibiscono → più Ca²⁺ nel cuore → più forza.",
        "Pompe del Ca²⁺: PMCA (membrana plasmatica, calmodulina) e SERCA (reticolo; fosfolambano, tapsigargina); Ca²⁺ citosolico ~100 nM, circa 10⁴ volte meno che fuori.",
        "H⁺/K⁺-ATPasi delle cellule parietali gastriche: elettroneutra, porta il pH del succo gastrico fino a ~1 (gradiente di oltre un milione di volte).",
        "Trasporti attivi secondari Na⁺-dipendenti: SGLT (2 Na⁺ : 1 glucosio, bloccato dalla florizina), Na⁺/aminoacidi, Na⁺/H⁺, Na⁺/Ca²⁺. Il glucosio esce dall'enterocita verso il sangue tramite GLUT2.",
        "Se il metabolismo si ferma (anossia, cianuro, freddo) si fermano sia i trasporti primari sia, di conseguenza, quelli secondari."
      ],
      formulas: [
        { label: 'Energia per un ciclo della pompa Na⁺/K⁺', tex: '\\Delta G = 3\\left[RT\\ln\\tfrac{[Na]_o}{[Na]_i} - FV_m\\right] + 2\\left[RT\\ln\\tfrac{[K]_i}{[K]_o} + FV_m\\right]' },
        { label: 'Accumulo massimo con SGLT1', tex: '\\frac{[Glc]_i}{[Glc]_o} = \\left(\\frac{[Na]_o}{[Na]_i}\\right)^2 e^{-2FV_m/RT}' }
      ],
      sims: [
        { id: 'pompa', preset: {},
          predict: { q: "Quanta energia serve per un ciclo della pompa Na⁺/K⁺ (3 Na⁺ fuori, 2 K⁺ dentro, Vm = −70 mV)?", options: ["circa 5 kJ/mol", "circa 44 kJ/mol", "circa 150 kJ/mol"], answer: 1, why: "Spostare 3 Na⁺ costa ~3 × 13 kJ, i 2 K⁺ ~2 × 2 kJ: circa 44 kJ, meno dei ~52 kJ forniti da un ATP nella cellula." },
          observe: "segui i 7 passi del ciclo; attiva l'ouabaina. Nel bilancio energetico confronta la H⁺/K⁺ gastrica con 1 o con 2 H⁺ per ATP a pH 1: perché a pH molto acido la pompa può spostare un solo H⁺?" },
        { id: 'sglt', preset: { Gl: 2 },
          predict: { q: "Nell'enterocita, con 2 mM di glucosio nel lume, il glucosio dentro la cellula può essere più concentrato che nel lume?", options: ["No, mai", "Sì, grazie al gradiente di Na⁺ (trasporto attivo secondario)", "Sì, grazie a GLUT2"], answer: 1, why: "SGLT1 accoppia l'ingresso di 2 Na⁺ (secondo gradiente) all'ingresso di glucosio (contro gradiente)." },
          observe: "attiva l'ouabaina: il gradiente di Na⁺ si dissipa e l'assorbimento del glucosio si ferma, anche se la pompa non tocca mai il glucosio." }
      ],
      quiz: [
        { q: "La pompa Na⁺/K⁺ è elettrogenica perché…", options: ["consuma ATP", "sposta 3 cariche fuori e 2 dentro (una carica netta per ciclo)", "è inibita dall'ouabaina"], answer: 1, why: "Il trasporto netto di una carica positiva verso l'esterno contribuisce di qualche mV al potenziale di riposo." },
        { q: "La florizina blocca…", options: ["GLUT2", "SGLT1", "la pompa Na⁺/K⁺"], answer: 1, why: "La florizina blocca il cotrasporto Na⁺/glucosio; la floretina blocca i GLUT." },
        { q: "La digitale aumenta la forza di contrazione del cuore perché…", options: ["attiva la pompa Na⁺/K⁺", "inibisce la pompa: più Na⁺ dentro, lo scambiatore Na⁺/Ca²⁺ espelle meno Ca²⁺", "apre i canali Ca²⁺"], answer: 1, why: "Con meno gradiente di Na⁺ lo scambiatore NCX lavora meno e il Ca²⁺ intracellulare aumenta." }
      ],
      related: ['11', '15', '03']
    },
    // ------------------------------------------------------------------ 13
    {
      id: '13', num: '13', title: 'Il potenziale di membrana e l\'equazione di Nernst',
      src: '13_Potenziale_di_Membrana._Nernst._Silvestri.ppt',
      card: 'Microelettrodi, potenziale di equilibrio, equazione di Nernst, forza elettrochimica.',
      oneliner: "Se la membrana è permeabile a un solo ione, il flusso di poche cariche crea un potenziale che bilancia esattamente il gradiente chimico: il <b>potenziale di equilibrio di Nernst</b>.",
      points: [
        "Il potenziale si misura con un microelettrodo di vetro riempito di KCl 3 M e due elettrodi Ag/AgCl.",
        "Nasce da distribuzione ineguale degli ioni + permeabilità selettiva. All'equilibrio il lavoro chimico e quello elettrico si bilanciano: $W_c = -W_e$.",
        "Il potenziale di equilibrio è stabile, <b>non dipende dalla permeabilità</b> (che cambia solo il tempo per raggiungerlo) e dipende dal <b>rapporto</b> delle concentrazioni, non dai valori assoluti.",
        "Bastano pochissimi ioni: ~10⁻¹³ mol per cm di assone gigante per −70 mV, quindi le concentrazioni restano praticamente quelle iniziali.",
        "L'eccesso di carica è confinato in due sottilissimi strati a ridosso della membrana: l'elettroneutralità macroscopica è rispettata.",
        "Forza elettrochimica: $V_m - E_{ion}$. Il suo segno indica la direzione del flusso netto, il suo valore l'intensità."
      ],
      formulas: [
        { label: 'Equazione di Nernst', tex: 'E_i = \\frac{RT}{z_iF}\\ln\\frac{[i]_o}{[i]_i}' },
        { label: 'A 20 °C, ione monovalente', tex: 'E_i \\approx 58\\ \\text{mV}\\,\\log_{10}\\frac{[i]_o}{[i]_i}\\qquad(61{,}5\\ \\text{mV a 37 °C})' },
        { label: 'Cariche necessarie', tex: 'n = \\frac{C_m\\,A\\,|V|}{F}' }
      ],
      sims: [
        { id: 'nernstlive', preset: { ion: 'K' },
          predict: { q: "Aprendo i canali K⁺, quale frazione degli ioni K⁺ interni deve uscire per portare la membrana a E_K?", options: ["circa la metà", "circa l'1%", "una frazione infinitesima (~10⁻⁵)"], answer: 2, why: "La capacità della membrana è piccola: bastano pochi ioni per caricarla. Le concentrazioni restano praticamente invariate." },
          observe: "cambia il \"numero di canali aperti\": cambia la <b>velocità</b>, non il potenziale finale. Guarda le due frecce: forza chimica e forza elettrica si eguagliano." },
        { id: 'nernstlive', title: 'E se il canale è selettivo per il Na⁺?', preset: { ion: 'Na' },
          predict: { q: "Con [Na⁺] 12 mM dentro e 145 mM fuori, il potenziale di equilibrio del Na⁺ è…", options: ["negativo", "positivo, circa +66 mV a 37 °C", "zero"], answer: 1, why: "Il Na⁺ entra e porta cariche positive all'interno: E<sub>Na</sub> = 61,5 × log(145/12) ≈ +66 mV." },
          observe: "con il Cl⁻ (valenza −1) il segno si inverte rispetto al gradiente." }
      ],
      warn: ["Nella slide del fattore \"58 mV\" è scritto \"T = 293 K, 18 °C\". 293 K corrispondono a <b>20 °C</b> (18 °C = 291 K). Il fattore 2,303·RT/F vale 58,2 mV a 20 °C, 57,8 mV a 18 °C e <b>61,5 mV a 37 °C</b>: per le cellule dei mammiferi va usato 61,5."],
      quiz: [
        { q: "Raddoppiando il numero di canali K⁺ aperti, E_K…", options: ["raddoppia", "non cambia", "si dimezza"], answer: 1, why: "E<sub>K</sub> dipende solo dalle concentrazioni e dalla temperatura." },
        { q: "Se Vm = −70 mV ed E_K = −90 mV, il flusso netto di K⁺ è…", options: ["entrante", "uscente", "nullo"], answer: 1, why: "Vm − E<sub>K</sub> = +20 mV: la forza elettrochimica spinge il K⁺ fuori dalla cellula." },
        { q: "A 37 °C, un rapporto di concentrazione 10:1 per un catione monovalente dà…", options: ["58 mV", "61,5 mV", "120 mV"], answer: 1, why: "2,303 RT/F a 310 K = 61,5 mV per decade." }
      ],
      related: ['14', '15', '06']
    },
    // ------------------------------------------------------------------ 14
    {
      id: '14', num: '14', title: 'L\'equilibrio di Gibbs-Donnan',
      src: '14_Potenziale_di_Membrana._Donnan_Silvestri.ppt',
      card: 'Anioni proteici non diffusibili, regola del prodotto, potenziale di Donnan, effetto osmotico.',
      oneliner: "Quando da un lato della membrana c'è uno ione che <b>non può passare</b> (le proteine), gli ioni diffusibili si distribuiscono in modo ineguale: nasce un potenziale e un <b>eccesso osmotico</b> dal lato delle proteine.",
      points: [
        "Le membrane sono impermeabili alle proteine, che nel citoplasma sono anioni (Pr⁻) bilanciati soprattutto da K⁺: la cellula è un sistema \"Donnan-simile\".",
        "All'equilibrio K⁺ e Cl⁻ sono entrambi all'equilibrio elettrochimico: $V_m = E_K = E_{Cl}$.",
        "Regola di Gibbs-Donnan: $[K]_1[Cl]_1 = [K]_2[Cl]_2$. Dal lato delle proteine i cationi sono più concentrati e gli anioni meno.",
        "La concentrazione totale degli ioni diffusibili è maggiore dal lato delle proteine: c'è uno squilibrio osmotico che richiama acqua.",
        "A differenza dell'equilibrio di Nernst, nel processo possono spostarsi quantità significative di ioni (passano cationi e anioni insieme).",
        "Nella cellula vera l'eccesso osmotico è compensato dalla pompa Na⁺/K⁺ (\"impermeabilizzazione funzionale\" al Na⁺): senza pompa la cellula si gonfia."
      ],
      formulas: [
        { label: 'Regola di Donnan', tex: '\\frac{[K^+]_1}{[K^+]_2} = \\frac{[Cl^-]_2}{[Cl^-]_1} \\;\\Rightarrow\\; [K^+]_1[Cl^-]_1 = [K^+]_2[Cl^-]_2' },
        { label: 'Potenziale di Donnan', tex: 'V = \\frac{RT}{F}\\ln\\frac{[K^+]_1}{[K^+]_2}' }
      ],
      sims: [
        { id: 'donnan', preset: { P: 50 },
          predict: { q: "Con le proteine nel lato 2, la concentrazione totale di ioni diffusibili sarà…", options: ["uguale nei due lati", "maggiore nel lato con le proteine", "maggiore nel lato senza proteine"], answer: 1, why: "[K]₂ + [Cl]₂ > [K]₁ + [Cl]₁: è un'immediata conseguenza della regola del prodotto. Ne deriva uno squilibrio osmotico." },
          observe: "aumenta la concentrazione o la carica della proteina: crescono il potenziale e l'eccesso osmotico. Con proteina zero tutto torna simmetrico." }
      ],
      quiz: [
        { q: "All'equilibrio di Donnan, il prodotto [K⁺][Cl⁻]…", options: ["è maggiore dal lato delle proteine", "è uguale nei due lati", "è zero"], answer: 1, why: "È la condizione che deriva da E<sub>K</sub> = E<sub>Cl</sub>." },
        { q: "Il potenziale di Donnan è negativo…", options: ["dal lato delle proteine (anioni fissi)", "dal lato senza proteine", "in entrambi i lati"], answer: 0, why: "Le cariche negative fisse attirano cationi, ma il lato resta negativo rispetto all'altro." }
      ],
      related: ['13', '15', '08']
    },
    // ------------------------------------------------------------------ 15
    {
      id: '15', num: '15', title: 'Potenziale di diffusione, Goldman e circuito equivalente',
      src: '15_Potenziali_di_diffusione_Goldman_circuiti_equivalente.ppt',
      card: 'Equazione GHK, legge di Ohm generalizzata, circuito RC, ruolo della pompa.',
      oneliner: "Il potenziale di riposo è un <b>potenziale di diffusione</b>: una media dei potenziali di equilibrio di K⁺, Na⁺ e Cl⁻, pesata dalle loro permeabilità (Goldman) o conduttanze (circuito equivalente).",
      points: [
        "Potenziale di equilibrio: flussi netti nulli, indipendente dalla permeabilità. Potenziale di diffusione: equilibrio <b>elettrico</b> (flussi di carica uguali e opposti) ma non chimico, dipende dalle permeabilità; senza pompe decadrebbe.",
        "Equazione di Goldman-Hodgkin-Katz (campo costante, membrana omogenea): esempio della lezione con P<sub>Na</sub>/P<sub>K</sub> = 0,01 → −92 mV (E<sub>K</sub> = −102, E<sub>Na</sub> = +63 mV).",
        "Le cellule gliali, permeabili quasi solo al K⁺, hanno Vm ≈ E<sub>K</sub>. I neuroni sono un po' permeabili anche al Na⁺: Vm meno negativo di E<sub>K</sub>.",
        "Legge di Ohm generalizzata: $I_i = g_i(V_m - E_i)$. La conduttanza dipende dai canali <b>e</b> dalle concentrazioni; la permeabilità solo dai canali.",
        "Circuito equivalente: canali = resistenze, gradienti = batterie, doppio strato = condensatore ($C_m \\approx 1\\ \\mu F/cm^2$), pompa = generatore di corrente (contribuisce di 3–4 mV).",
        "Il Cl⁻ nei neuroni si distribuisce spesso passivamente (E<sub>Cl</sub> ≈ Vm); in alcuni neuroni il cotrasporto K⁺/Cl⁻ (KCC2) lo mantiene basso."
      ],
      formulas: [
        { label: 'Goldman-Hodgkin-Katz', tex: 'V_m = \\frac{RT}{F}\\ln\\frac{P_K[K]_o + P_{Na}[Na]_o + P_{Cl}[Cl]_i}{P_K[K]_i + P_{Na}[Na]_i + P_{Cl}[Cl]_o}' },
        { label: 'Equazione delle conduttanze', tex: 'V_m = \\frac{g_K E_K + g_{Na}E_{Na} + g_{Cl}E_{Cl}}{g_K + g_{Na} + g_{Cl}}' },
        { label: 'Capacità della membrana', tex: 'C = \\frac{\\varepsilon A}{d},\\qquad C_m = \\frac{\\varepsilon}{d} \\approx 1\\ \\mu F/cm^2' }
      ],
      sims: [
        { id: 'ghk', preset: { cell: 'rana' },
          predict: { q: "Aumentando molto il K⁺ esterno, Vm…", options: ["si allontana da E_K", "si avvicina a E_K e segue la retta di Nernst", "diventa positivo per qualunque valore"], answer: 1, why: "Quando [K]<sub>o</sub> è alto il termine del K⁺ domina l'equazione: la membrana \"si comporta come se fosse permeabile solo al K⁺\"." },
          observe: "a [K]<sub>o</sub> bassi la curva di Goldman si stacca dalla retta di Nernst per colpa della piccola permeabilità al Na⁺. Premi \"Picco del PdA\": con P<sub>Na</sub>/P<sub>K</sub> = 20, Vm si avvicina a E<sub>Na</sub>." },
        { id: 'circuito', preset: {},
          predict: { q: "Spegnendo la pompa elettrogenica, il potenziale di riposo…", options: ["si depolarizza di qualche mV, subito", "va a 0 mV subito", "non cambia"], answer: 0, why: "Il contributo diretto della corrente di pompa è di pochi mV (−3 mV qui). Nel tempo, però, senza pompa i gradienti si dissipano." },
          observe: "allo stato stazionario la somma delle correnti è zero: la piccola corrente entrante di Na⁺ è bilanciata da quella uscente di K⁺ (e dalla pompa)." }
      ],
      warn: ["Nella slide sulla capacità è scritto \"per le membrane cellulari dove <b>A</b> = 25 Å si ha C<sub>m</sub> = 1 µF/cm²\". 25 Å è lo <b>spessore d</b> del dielettrico (il cuore idrofobico del doppio strato), non l'area A: C<sub>m</sub> = ε/d."],
      quiz: [
        { q: "Il potenziale di diffusione differisce da quello di equilibrio perché…", options: ["dipende dalle permeabilità e i flussi dei singoli ioni non sono nulli", "è sempre positivo", "non dipende dalle concentrazioni"], answer: 0, why: "C'è equilibrio elettrico (corrente netta nulla) ma non chimico: Na⁺ entra e K⁺ esce continuamente." },
        { q: "Una membrana molto permeabile al K⁺ ma senza K⁺ in soluzione ha conduttanza al K⁺…", options: ["alta", "nulla", "uguale alla permeabilità"], answer: 1, why: "Senza portatori di carica non può esserci corrente: la conduttanza dipende anche dalle concentrazioni." },
        { q: "Nel circuito equivalente, il doppio strato lipidico è…", options: ["una batteria", "un condensatore", "una resistenza"], answer: 1, why: "Separa le cariche dei due lati: si comporta da condensatore." }
      ],
      related: ['13', '14', '16']
    },
    // ------------------------------------------------------------------ 16
    {
      id: '16', num: '16', title: 'Proprietà passive: current clamp',
      src: '16_Studio_delle_propriet__passive_-_current_clamp.ppt',
      card: 'Iniezione di corrente, risposte elettrotoniche, costante di tempo τ = RC.',
      oneliner: "Iniettando un gradino di corrente, il potenziale non salta ma sale in modo <b>esponenziale</b> con costante di tempo $\\tau = R_m C_m$: la membrana si comporta come un circuito RC.",
      points: [
        "Le proprietà passive (resistenza di membrana, capacità, resistenza assiale) decidono forma e ampiezza dei potenziali sinaptici e la velocità di conduzione.",
        "Current clamp: si inietta una corrente nota con un elettrodo e si registra il potenziale con un altro.",
        "Corrente positiva (elettrodo interno positivo) → depolarizzazione; negativa → iperpolarizzazione. Piccoli gradini danno risposte elettrotoniche proporzionali alla corrente; gradini grandi possono scatenare il PdA.",
        "All'accensione la corrente carica prima il condensatore, poi passa nella resistenza: $V(t) = V_0 + (V_f - V_0)(1 - e^{-t/\\tau})$. Allo spegnimento: decadimento esponenziale.",
        "τ è il tempo per raggiungere il 63% della variazione finale; $R = \\Delta V/I$ a regime; da τ e R si ricava C.",
        "Se la membrana ha canali voltaggio-dipendenti, la conduttanza dipende da V e dal tempo: il current clamp non basta più a studiarla e serve il voltage clamp."
      ],
      formulas: [
        { label: 'Risposta al gradino', tex: 'V(t) = V_0 + I R\\left(1 - e^{-t/\\tau}\\right),\\qquad \\tau = R C' },
        { label: 'Resistenza di ingresso', tex: 'R = \\frac{V_f - V_0}{I}' }
      ],
      sims: [
        { id: 'currentclamp', preset: { R: 100, C: 100, I: 0.1 },
          predict: { q: "Raddoppiando la capacità della membrana (cellula più grande, stessa R), la risposta allo stesso gradino…", options: ["diventa più ampia", "raggiunge lo stesso valore finale ma più lentamente", "diventa più veloce"], answer: 1, why: "Il valore finale è I·R (non dipende da C); τ = RC raddoppia." },
          observe: "attiva la famiglia di gradini: le risposte iper- e depolarizzanti sono simmetriche finché la membrana è passiva." },
        { id: 'currentclamp', title: 'Quando la membrana è eccitabile', preset: { exc: true, I: 0.4, C: 100 },
          observe: "con i canali di Hodgkin-Huxley un gradino abbastanza grande genera potenziali d'azione: la membrana non è più un semplice RC." }
      ],
      quiz: [
        { q: "La costante di tempo τ corrisponde al tempo per raggiungere…", options: ["il 50% della risposta finale", "il 63% della risposta finale", "il 100%"], answer: 1, why: "1 − e⁻¹ ≈ 0,63." },
        { q: "Con R = 200 MΩ e C = 50 pF, τ vale…", options: ["1 ms", "10 ms", "100 ms"], answer: 1, why: "200·10⁶ Ω × 50·10⁻¹² F = 10⁻² s = 10 ms." }
      ],
      related: ['15', '17', '21']
    },
    // ------------------------------------------------------------------ 17
    {
      id: '17', num: '17', title: 'Voltage clamp e patch clamp',
      src: '17_Studio_delle_propriet__passive-_voltage_clamp.ppt',
      card: 'Blocco del voltaggio, correnti ioniche, potenziale di inversione, correnti di canale singolo.',
      oneliner: "Nel <b>voltage clamp</b> un circuito di retroazione mantiene il potenziale al valore scelto e misura la corrente che serve: è la corrente ionica che attraversa i canali. Il <b>patch clamp</b> arriva al singolo canale.",
      points: [
        "Due elettrodi: uno misura Vm, l'altro inietta corrente; un amplificatore confronta Vm con il valore desiderato e corregge (retroazione negativa, lezione 1).",
        "Con il potenziale fermo la corrente capacitiva si annulla subito: si separano I<sub>C</sub> e I<sub>ionica</sub> e si studiano le variazioni di g nel tempo.",
        "Canali attivati dalla depolarizzazione senza inattivazione (K⁺) e con inattivazione (Na⁺). In ogni istante $g(t) = I(t)/(V_{clamp} - E_i)$.",
        "Il potenziale a cui la corrente si annulla e cambia segno è il <b>potenziale di inversione</b>: identifica lo ione che porta la corrente.",
        "Patch clamp (Neher e Sakmann, Nobel 1991): micropipetta con sigillo > 1 GΩ; configurazioni cell-attached, whole-cell, inside-out, outside-out.",
        "Correnti di canale singolo (~pA): ampiezza media dall'istogramma, I-V a canale aperto lineare $i = \\gamma(V - E)$, numero di stati, tempi di permanenza, velocità di transizione."
      ],
      formulas: [
        { label: 'Conduttanza dalla corrente di clamp', tex: 'g(t) = \\frac{I(t)}{V_{clamp} - E_i}' },
        { label: 'Corrente di canale singolo', tex: 'i = \\gamma\\,(V - E_{rev})' },
        { label: 'Canale a due stati', tex: 'C \\underset{\\beta}{\\overset{\\alpha}{\\rightleftharpoons}} O,\\quad P_o = \\frac{\\alpha}{\\alpha+\\beta},\\quad \\bar t_{aperto} = \\frac{1}{\\beta}' }
      ],
      sims: [
        { id: 'voltageclamp', preset: { mode: 'step', V: 0 },
          predict: { q: "Bloccando la membrana a +50 mV (= E_Na), la corrente di Na⁺ sarà…", options: ["entrante e molto grande", "nulla", "uscente"], answer: 1, why: "I canali si aprono, ma la forza elettrochimica V − E<sub>Na</sub> è zero: nessuna corrente netta. È il potenziale di inversione." },
          observe: "porta il gradino a +50 e poi a +70 mV: la corrente di Na⁺ si annulla e poi diventa uscente. Prova TTX e TEA." },
        { id: 'patchclamp', preset: { g: 20, V: -60, E: 0 },
          predict: { q: "Lasciando invariata α e dimezzando β (velocità di chiusura), le aperture diventano…", options: ["più frequenti ma brevi", "più lunghe (e P(aperto) aumenta)", "uguali"], answer: 1, why: "Il tempo medio di apertura è 1/β: dimezzando β le aperture durano il doppio." },
          observe: "l'istogramma delle ampiezze ha due picchi: chiuso (0 pA) e aperto (i). Con 3 o 50 canali compaiono livelli multipli e la somma assomiglia alla corrente macroscopica." }
      ],
      quiz: [
        { q: "Nel voltage clamp, la corrente iniettata dall'amplificatore è…", options: ["uguale e opposta alla corrente ionica di membrana", "sempre zero", "uguale alla corrente capacitiva per tutta la durata"], answer: 0, why: "Per mantenere V costante l'amplificatore compensa istante per istante la corrente che attraversa i canali." },
        { q: "Un canale con γ = 20 pS a V − E = −80 mV porta una corrente di…", options: ["−0,16 pA", "−1,6 pA", "−16 pA"], answer: 1, why: "20·10⁻¹² S × 80·10⁻³ V = 1,6·10⁻¹² A." }
      ],
      related: ['16', '19', '24bis']
    },
    // ------------------------------------------------------------------ 18
    {
      id: '18', num: '18', title: 'Il potenziale d\'azione: caratteri generali',
      src: '18_Il_potenziale_d_azione.ppt',
      card: 'Soglia, legge del tutto-o-nulla, codifica in frequenza, refrattarietà assoluta e relativa.',
      oneliner: "Il potenziale d'azione nasce quando la depolarizzazione raggiunge la <b>soglia</b>; obbedisce alla legge del <b>tutto o nulla</b> ed è seguito da un periodo <b>refrattario</b>.",
      points: [
        "Soglia: nella maggior parte delle cellule eccitabili circa 15 mV di depolarizzazione rispetto al riposo.",
        "Stimoli sottosoglia: risposta locale graduata. Sopra soglia l'ampiezza del PdA non cresce aumentando lo stimolo: tutto o nulla.",
        "L'intensità dello stimolo sopra soglia è codificata nella <b>frequenza</b> dei PdA (lezione 28).",
        "Refrattario assoluto: nessuno stimolo, di qualsiasi intensità, evoca un secondo PdA (soglia infinita); dipende dalla durata del PdA.",
        "Refrattario relativo: serve uno stimolo più intenso; la soglia torna gradualmente al valore di riposo e il PdA evocato è più piccolo."
      ],
      formulas: [],
      practical: "Nel modello di Hodgkin-Huxley a 6,3 °C (la temperatura degli esperimenti sul calamaro) i periodi refrattari durano più a lungo che nei mammiferi: alza la temperatura per vederli accorciare.",
      sims: [
        { id: 'hhlab', preset: { mode: 'single', allornone: true, I1: 8 },
          predict: { q: "Raddoppiando l'intensità di uno stimolo già sopra soglia, il picco del PdA…", options: ["raddoppia", "resta praticamente uguale", "si dimezza"], answer: 1, why: "Legge del tutto-o-nulla: una volta superata la soglia il PdA è generato dal feedback positivo del Na⁺, non dallo stimolo." },
          observe: "con \"Trova la soglia\" individui la soglia per quella durata; accorcia lo stimolo: la soglia aumenta (servono più cariche in meno tempo)." },
        { id: 'hhlab', title: 'Refrattarietà: due stimoli ravvicinati', preset: { mode: 'pair', gap: 6, I2: 30 },
          predict: { q: "Un secondo stimolo, più del doppio della soglia normale, arriva 6 ms dopo il primo (a 6,3 °C). Genera un PdA?", options: ["Sì, identico al primo", "No: la membrana è ancora refrattaria", "Sì, più grande"], answer: 1, why: "A 6,3 °C dopo 6 ms i canali Na⁺ sono ancora in gran parte inattivati: periodo refrattario." },
          observe: "allunga l'intervallo e trova il punto in cui ricompare il PdA (più piccolo: refrattario relativo). Poi premi \"Calcola la curva di refrattarietà\"." }
      ],
      info: ["La slide indica un periodo refrattario di \"circa 10 ms\". È un valore indicativo che comprende anche il refrattario relativo. Nei neuroni dei mammiferi a 37 °C il refrattario <b>assoluto</b> dura circa 1–2 ms e il relativo alcuni ms; nel calamaro a basse temperature tutto è più lento."],
      quiz: [
        { q: "Durante il periodo refrattario assoluto…", options: ["serve uno stimolo più intenso", "nessuno stimolo può evocare un PdA", "si genera un PdA più grande"], answer: 1, why: "I canali Na⁺ sono inattivati: la soglia è infinita." },
        { q: "L'intensità di uno stimolo sopra soglia è codificata da…", options: ["l'ampiezza del PdA", "la frequenza dei PdA", "la durata del singolo PdA"], answer: 1, why: "Il PdA è tutto-o-nulla: l'informazione sull'intensità sta nella frequenza." }
      ],
      related: ['19', '20', '28']
    },
    // ------------------------------------------------------------------ 19
    {
      id: '19', num: '19', title: 'Basi ioniche del potenziale d\'azione (Hodgkin e Huxley)',
      src: '19_Il_potenziale_d_azione_-_basi_ioniche.ppt',
      card: 'Voltage clamp sull\'assone gigante, TTX e TEA, gNa e gK, ciclo di Hodgkin.',
      oneliner: "Il PdA nasce da una rapida <b>attivazione della conduttanza al Na⁺</b> (feedback positivo, ciclo di Hodgkin), seguita dalla sua <b>inattivazione</b> e da un'attivazione più lenta della <b>conduttanza al K⁺</b>.",
      points: [
        "Tre elementi: gradienti mantenuti dalle pompe (energia potenziale), forza elettrochimica, canali selettivi voltaggio-dipendenti. Lo stimolo fa solo da \"detonatore\".",
        "Hodgkin e Huxley usarono il voltage clamp sull'assone gigante di calamaro (~0,5–1 mm di diametro).",
        "Con la TTX resta una corrente tardiva uscente (K⁺); con il TEA resta una corrente precoce entrante (Na⁺) che si annulla in ~2 ms.",
        "Tre processi: attivazione di g<sub>Na</sub>, attivazione di g<sub>K</sub>, inattivazione di g<sub>Na</sub>. Le conduttanze dipendono dal voltaggio e dal tempo.",
        "Ciclo di Hodgkin: depolarizzazione → apertura dei canali Na⁺ → ingresso di Na⁺ → più depolarizzazione (feedback positivo). Il K⁺ chiude il ciclo con un feedback negativo, ma in ritardo.",
        "Il canale Na⁺ ha due porte che rispondono in modo opposto alla depolarizzazione: m (si apre) e h (si chiude)."
      ],
      formulas: [
        { label: 'Correnti ioniche', tex: 'I_{Na} = g_{Na}(V_m - E_{Na}),\\qquad I_K = g_K(V_m - E_K)' },
        { label: 'Modello di Hodgkin-Huxley', tex: 'C_m\\frac{dV}{dt} = I - \\bar g_{Na}m^3h(V - E_{Na}) - \\bar g_K n^4 (V - E_K) - g_L(V - E_L)' }
      ],
      sims: [
        { id: 'voltageclamp', preset: { mode: 'cond', V: 0 },
          predict: { q: "Applicando la TTX, nella corrente registrata resta…", options: ["la corrente precoce entrante", "la corrente tardiva uscente", "nessuna corrente"], answer: 1, why: "La TTX blocca i canali Na⁺: rimane la corrente di K⁺, tardiva e uscente." },
          observe: "nel protocollo \"Un gradino\" attiva TTX e poi TEA. In \"Conduttanze\": g<sub>Na</sub> sale e si inattiva, g<sub>K</sub> sale lentamente e resta." },
        { id: 'hhlab', title: 'Le porte m, h, n durante il PdA', preset: { mode: 'single', show: 'gates', I1: 10 },
          observe: "m sale per prima (fase ascendente), h scende (inattivazione), n sale con ritardo (ripolarizzazione) e torna giù lentamente: è il postpotenziale iperpolarizzante." },
        { id: 'canale3d', preset: { type: 'nav' },
          observe: "premi \"Potenziale d'azione\": le porte si muovono seguendo le equazioni di Hodgkin-Huxley (rallentate)." }
      ],
      quiz: [
        { q: "Il feedback positivo del ciclo di Hodgkin riguarda…", options: ["la conduttanza al K⁺", "la conduttanza al Na⁺", "la pompa Na⁺/K⁺"], answer: 1, why: "Più depolarizzazione → più canali Na⁺ aperti → più depolarizzazione." },
        { q: "Se l'attivazione dei canali K⁺ fosse veloce quanto quella dei Na⁺…", options: ["il PdA sarebbe più grande", "le due correnti si annullerebbero e il PdA non partirebbe", "non cambierebbe nulla"], answer: 1, why: "Come dice la slide: se i due eventi fossero simultanei e della stessa entità si eliderebbero." }
      ],
      related: ['17', '18', '20']
    },
    // ------------------------------------------------------------------ 20
    {
      id: '20', num: '20', title: 'Refrattarietà e propagazione del potenziale d\'azione',
      src: '20_Il_potenziale_d_azione_-_propagazione.ppt',
      card: 'Fasi del PdA, recupero dall\'inattivazione, correnti locali, conduzione saltatoria.',
      oneliner: "La refrattarietà nasce dall'<b>inattivazione</b> dei canali Na⁺ e dall'attivazione persistente dei canali K⁺; le <b>correnti locali</b> propagano il PdA, che non torna indietro perché la membrana appena attivata è refrattaria.",
      points: [
        "Fasi: depolarizzazione e overshoot (apertura dei Na⁺), ripolarizzazione (inattivazione dei Na⁺ + attivazione dei K⁺), postpotenziale iperpolarizzante (chiusura lenta dei K⁺).",
        "I canali Na⁺ restano inattivati per alcuni ms; il recupero richiede la ripolarizzazione e tempo (protocollo a due impulsi).",
        "Refrattario assoluto: durante la fase ascendente (attivazione già massima) e la ripolarizzazione (inattivazione). Relativo: Na⁺ ancora in parte inattivati, K⁺ ancora aperti.",
        "Propagazione: la zona attiva è positiva all'interno; correnti elettrotoniche depolarizzano le zone vicine fino alla soglia.",
        "Il PdA non inverte la marcia: le correnti retrograde trovano membrana refrattaria. Due PdA che si scontrano si annullano.",
        "La guaina mielinica aumenta la velocità: il PdA si rigenera solo nei nodi di Ranvier (conduzione saltatoria)."
      ],
      formulas: [
        { label: 'Velocità di conduzione', tex: 'v_{amielinica} \\propto \\sqrt{d},\\qquad v_{mielinica} \\propto d' }
      ],
      sims: [
        { id: 'voltageclamp', title: 'Recupero dall\'inattivazione: due impulsi', preset: { mode: 'pp' },
          predict: { q: "Se il secondo impulso arriva 2 ms dopo la fine del primo, la corrente di Na⁺ sarà…", options: ["uguale alla prima", "molto più piccola", "più grande"], answer: 1, why: "Molti canali sono ancora inattivati: escono dall'inattivazione solo lentamente, con la membrana ripolarizzata." },
          observe: "la curva di recupero cresce con l'intervallo: è la base della refrattarietà." },
        { id: 'propagazione', title: 'Fibra amielinica', preset: { type: 'unmy', d: 10 },
          predict: { q: "Stimolando una fibra contemporaneamente alle due estremità, cosa succede quando i due PdA si incontrano?", options: ["si sommano e diventano più grandi", "si annullano", "si attraversano e proseguono"], answer: 1, why: "Ciascuno trova davanti a sé la membrana refrattaria lasciata dall'altro." },
          observe: "scegli \"Entrambe le estremità\" e stimola; poi stimola al centro: il PdA parte nei due sensi." },
        { id: 'propagazione', title: 'Fibra mielinica: conduzione saltatoria', preset: { type: 'myel', d: 10 },
          observe: "nel grafico di Vm lungo la fibra i punti rossi (nodi) si attivano uno dopo l'altro. Confronta la velocità con l'amielinica dello stesso diametro e aumenta la demielinizzazione: prima rallenta, poi si blocca." }
      ],
      quiz: [
        { q: "Il PdA si propaga in un solo senso perché…", options: ["le correnti locali vanno in una sola direzione", "dietro di sé lascia membrana refrattaria", "i canali Na⁺ sono solo in avanti"], answer: 1, why: "Le correnti locali vanno in entrambe le direzioni, ma all'indietro la membrana è refrattaria." },
        { q: "Nella fibra mielinica il PdA si rigenera…", options: ["lungo tutta la fibra", "solo nei nodi di Ranvier", "solo nel soma"], answer: 1, why: "La mielina riduce la capacità e aumenta la resistenza degli internodi: i canali Na⁺ sono concentrati nei nodi." }
      ],
      related: ['19', '21', '18']
    },
    // ------------------------------------------------------------------ 21
    {
      id: '21', num: '21', title: 'Comunicazione elettrica e chimica; i neuroni',
      src: '21_La_comunicazione_elettrica_e_chimica_segnali_elettrici_I_neur.ppt',
      card: 'Potenziali locali e propagati, tipi di neuroni, flusso assonico, glia.',
      oneliner: "I <b>potenziali locali</b> (di recettore e postsinaptici) sono graduati e si attenuano con la distanza; i <b>potenziali propagati</b> (PdA) hanno ampiezza costante e viaggiano senza decremento.",
      points: [
        "Comunicazione elettrica: veloce, poca informazione (segno ±), richiede contatto. Chimica: selettiva, tante molecole (molta informazione), più lenta.",
        "Segnali autocrini, paracrini, ormonali; neurotrasmettitori, neuroormoni, neuromodulatori.",
        "Potenziali propagati: solo nelle membrane eccitabili; transitori, rapidissimi, ampiezza invariabile, non sommabili, refrattari.",
        "Potenziali locali: graduati, sommabili (nello spazio e nel tempo), senza refrattarietà, si estinguono a breve distanza (costante di spazio λ); possono depolarizzare o iperpolarizzare.",
        "Neuroni afferenti (bipolari e a T), efferenti (Golgi tipo I, assone lungo: motoneuroni, piramidali), interneuroni (tipo II, circa il 99%).",
        "Flusso assonico: rapido (anterogrado con chinesina, retrogrado con dineina: fattori neurotrofici, virus, tossine) e lento (citoscheletro, proteine solubili). Glia: astrociti, oligodendrociti, cellule di Schwann, microglia."
      ],
      formulas: [
        { label: 'Decremento del potenziale locale', tex: 'V(x) = V_0\\,e^{-x/\\lambda},\\qquad \\lambda = \\sqrt{\\frac{R_m\\,d}{4R_i}}' }
      ],
      sims: [
        { id: 'cavo', preset: { d: 2 },
          predict: { q: "Raddoppiando il diametro di un dendrite, la costante di spazio λ…", options: ["raddoppia", "aumenta di circa 1,4 volte (√2)", "si dimezza"], answer: 1, why: "λ ∝ √d: il potenziale locale arriva un po' più lontano." },
          observe: "a λ (37%) il potenziale si è già ridotto di due terzi; nelle registrazioni a distanza il PPS è più piccolo e più lento." },
        { id: 'propagazione', title: 'Il PdA invece non si attenua', preset: { type: 'unmy', d: 10 },
          observe: "confronta i due elettrodi: il PdA arriva al secondo con la stessa ampiezza." }
      ],
      warn: ["La slide attribuisce alla <b>dineina</b> il flusso assonico lento, che è anterogrado. La dineina è il motore <b>retrogrado</b> (verso il soma). Il trasporto anterogrado, sia rapido sia lento (\"stop and go\"), avviene soprattutto grazie alla <b>chinesina</b>."],
      quiz: [
        { q: "Quale caratteristica appartiene ai potenziali locali?", options: ["Tutto-o-nulla", "Sommabilità", "Refrattarietà"], answer: 1, why: "I potenziali locali si sommano nello spazio e nel tempo." },
        { q: "Il trasporto retrogrado dei fattori neurotrofici verso il soma usa…", options: ["la chinesina", "la dineina", "la miosina"], answer: 1, why: "La dineina cammina verso l'estremità \"meno\" dei microtubuli, cioè verso il soma." }
      ],
      related: ['20', '26', '22']
    },
    // ------------------------------------------------------------------ 22
    {
      id: '22', num: '22', title: 'Le sinapsi: elettriche e chimiche',
      src: '22_Le_sinapsi.ppt',
      card: 'Tipi di sinapsi, giunzioni comunicanti, connessoni, confronto tra trasmissione elettrica e chimica.',
      oneliner: "Nella sinapsi <b>elettrica</b> la corrente passa direttamente attraverso le giunzioni comunicanti; nella sinapsi <b>chimica</b> il segnale è tradotto in un messaggero chimico e ritradotto in segnale elettrico.",
      points: [
        "Una sinapsi è la giunzione tra due elementi eccitabili che consente il passaggio di informazione: cito-neurale (recettore → neurone), interneuronica, neuromuscolare.",
        "Esempio della retina: coni e bastoncelli → cellule bipolari e orizzontali → cellule gangliari → nervo ottico.",
        "Sinapsi elettrica: giunzioni comunicanti formate da connessoni (6 connessine per emicanale); fessura di ~3,5 nm; trasmissione immediata, spesso bidirezionale, segnale attenuato.",
        "Sinapsi chimica: fessura di 20–50 nm, ritardo sinaptico (~0,5 ms), unidirezionale; il segnale può essere amplificato, invertito (inibizione), modulato.",
        "La sinapsi è un punto di elaborazione dell'informazione: ~10¹¹ neuroni × ~10³ sinapsi = ~10¹⁴ sinapsi, formate in gran parte nei primi 2 anni di vita."
      ],
      formulas: [
        { label: 'Coefficiente di accoppiamento elettrico', tex: 'k = \\frac{\\Delta V_2}{\\Delta V_1} = \\frac{g_c}{g_c + g_{L,2}}' }
      ],
      sims: [
        { id: 'elettricachimica', preset: { type: 'el' },
          predict: { q: "In una sinapsi elettrica non rettificante, stimolando la cellula 2…", options: ["la cellula 1 non risponde", "anche la cellula 1 si depolarizza (bidirezionale)", "la cellula 1 si iperpolarizza"], answer: 1, why: "Le giunzioni comunicanti conducono in entrambi i sensi." },
          observe: "aumenta la conduttanza della giunzione: il coefficiente di accoppiamento cresce verso 1. Attiva la rettificazione e stimola la cellula 2." },
        { id: 'elettricachimica', title: 'La sinapsi chimica', preset: { type: 'ch' },
          observe: "misura il ritardo tra il picco presinaptico e l'inizio della risposta; poi stimola la cellula 2: la cellula 1 non ne sa nulla. Cambia il recettore in inibitorio: lo stesso PdA produce un'iperpolarizzazione." }
      ],
      quiz: [
        { q: "Un vantaggio della sinapsi chimica rispetto a quella elettrica è…", options: ["la velocità", "la possibilità di amplificare o invertire il segnale", "la bidirezionalità"], answer: 1, why: "Il trasmettitore può aprire canali con diversi potenziali di inversione e in numero molto grande." },
        { q: "La fessura di una sinapsi elettrica misura circa…", options: ["3,5 nm", "50 nm", "1 µm"], answer: 0, why: "Le membrane sono molto ravvicinate per permettere ai connessoni di unirsi." }
      ],
      related: ['23', '21', '24']
    },
    // ------------------------------------------------------------------ 23
    {
      id: '23', num: '23', title: 'Le sinapsi chimiche: rilascio del trasmettitore',
      src: '23_Le_sinapsi_chimiche.ppt',
      card: 'Fasi della trasmissione, vescicole, canali Ca²⁺, SNARE, riciclo, recettori ionotropi e metabotropi.',
      oneliner: "Il PdA apre i canali Ca²⁺ del terminale; il Ca²⁺ fa fondere le vescicole con la membrana (<b>esocitosi</b>) grazie al complesso <b>SNARE</b>; il trasmettitore diffonde in pochi µs e si lega ai recettori.",
      points: [
        "Fasi: caricamento delle vescicole (biosintesi o ricaptazione), esocitosi, legame ai recettori, inattivazione (enzimi, diffusione, ricaptazione).",
        "Caricamento: la pompa H⁺ ATP-dipendente acidifica la vescicola; un antiporto H⁺/trasmettitore la riempie (1000–10 000 molecole).",
        "Diffusione nella fessura (50 nm): pochi µs ($t = x^2/2D$, lezione 6).",
        "Fusione in meno di 1 ms: canali Ca²⁺ di tipo N e P/Q; fasi di docking, priming, emifusione e fusione.",
        "SNARE: sinaptobrevina/VAMP (vescicola), sintassina e SNAP-25 (membrana). Dopo la fusione NSF e α-SNAP (con idrolisi di ATP) smontano il complesso per riciclarlo. Le vescicole vengono recuperate per endocitosi.",
        "Recettori: ionotropi (canali regolati dal ligando, rapidi) e metabotropi (accoppiati a proteine G, lenti)."
      ],
      formulas: [
        { label: 'Tempo di diffusione nella fessura', tex: 't = \\frac{(50\\ \\text{nm})^2}{2\\cdot 8\\cdot10^{-6}\\ \\text{cm}^2/\\text{s}} \\approx 1{,}6\\ \\mu s' }
      ],
      sims: [
        { id: 'sinapsi3d', preset: { nt: 'ach' },
          predict: { q: "Se si bloccano i canali Ca²⁺ del terminale, l'arrivo del PdA…", options: ["libera comunque il trasmettitore", "non provoca il rilascio", "libera più trasmettitore"], answer: 1, why: "L'esocitosi è innescata dal Ca²⁺: senza il suo ingresso le vescicole non si fondono." },
          observe: "segui le 6 fasi con i tempi reali; prova la tossina botulinica e la neostigmina." },
        { id: 'tdiff', title: 'Quanto è veloce la diffusione nella fessura?', preset: { mol: 'Acetilcolina', x: 0.05 },
          observe: "50 nm in circa 1–2 µs: la diffusione non è il passo lento della trasmissione sinaptica (lo sono l'ingresso del Ca²⁺ e l'esocitosi)." }
      ],
      warn: ["La figura sul ciclo SNARE (Figura 1) riporta il modello del 1993, secondo cui NSF smonterebbe il complesso SNARE <b>prima</b> della fusione, permettendola. Oggi si sa che è la <b>chiusura (zippering)</b> del complesso SNARE a fornire l'energia per la fusione; <b>NSF e α-SNAP smontano gli SNARE dopo la fusione</b>, per riciclarli. Inoltre nelle slide manca la <b>sinaptotagmina</b>, il sensore del Ca²⁺ che innesca la fusione rapida."],
      quiz: [
        { q: "Il sensore del Ca²⁺ per l'esocitosi rapida è…", options: ["la sintassina", "la sinaptotagmina", "NSF"], answer: 1, why: "La sinaptotagmina lega il Ca²⁺ e innesca la fusione mediata dagli SNARE." },
        { q: "La tossina tetanica e la botulinica di tipo B tagliano…", options: ["SNAP-25", "la sinaptobrevina (VAMP)", "il recettore nicotinico"], answer: 1, why: "Senza sinaptobrevina il complesso SNARE non si forma e il rilascio si blocca." }
      ],
      related: ['22', '24', '25']
    },
    // ------------------------------------------------------------------ 24
    {
      id: '24', num: '24', title: 'Il potenziale postsinaptico',
      src: '24_Il_potenziale_postsinaptico.ppt',
      card: 'Recettori ionotropi e metabotropi, PPSE e PPSI, potenziale di inversione.',
      oneliner: "Che un trasmettitore ecciti o inibisca dipende dal <b>recettore</b>, cioè dal <b>potenziale di inversione</b> della corrente che apre: sopra la soglia di scarica eccita, sotto inibisce.",
      points: [
        "Recettori ionotropi: risposta rapida (ms). Metabotropi: cascata di proteina G ed enzimi, risposta lenta e duratura.",
        "Sinapsi eccitatorie: canali per Na⁺ o canali cationici poco selettivi (anche Ca²⁺) → depolarizzazione (PPSE). Inibitorie: canali per Cl⁻ o K⁺ → iperpolarizzazione o stabilizzazione (PPSI).",
        "Caratteristiche del PPS: ampiezza minore del PdA (< 10 mV), durata maggiore (> 10 ms), segno + o −, locale, graduato, sommabile.",
        "Ampiezza e durata dipendono dalla quantità di trasmettitore liberato e dall'estensione della membrana su cui agisce.",
        "Potenziale di inversione (E<sub>rev</sub>): il potenziale al quale il PPS si annulla e cambia segno (figura con registrazioni a −60, −20 e +10 mV).",
        "Se E<sub>rev</sub> coincide con il potenziale di riposo (es. Cl⁻) il PPS è invisibile ma la conduttanza aumentata \"cortocircuita\" i PPSE: inibizione di shunt."
      ],
      formulas: [
        { label: 'Corrente sinaptica', tex: 'I_{syn} = g_{syn}(t)\\,(V_m - E_{rev})' }
      ],
      sims: [
        { id: 'pps', preset: { rec: 'ampa', fam: true },
          predict: { q: "Un recettore cationico con E_rev = 0 mV: registrando a +10 mV, il PPS sarà…", options: ["depolarizzante", "nullo", "iperpolarizzante"], answer: 2, why: "Sopra E<sub>rev</sub> la forza elettrochimica cambia segno: la corrente diventa uscente e il PPS si inverte." },
          observe: "il grafico in basso mostra l'ampiezza del PPS in funzione del potenziale di partenza: incrocia lo zero proprio a E<sub>rev</sub>." },
        { id: 'pps', title: 'GABA-A: inibizione e cloruro interno', preset: { rec: 'gabaa', Vh: -60 },
          predict: { q: "In un neurone immaturo il Cl⁻ interno è alto (~30 mM). L'apertura dei recettori GABA-A…", options: ["iperpolarizza", "depolarizza", "non ha effetto"], answer: 1, why: "Con Cl⁻ interno alto E<sub>Cl</sub> è meno negativo del riposo: il Cl⁻ esce e la membrana si depolarizza (ruolo di NKCC1 e KCC2)." },
          observe: "porta il Cl⁻ interno da 7 a 30 mM e guarda come si sposta E<sub>rev</sub>." }
      ],
      quiz: [
        { q: "Il segno di un PPS dipende da…", options: ["il tipo di trasmettitore", "il potenziale di inversione del recettore rispetto al potenziale di membrana", "la quantità di trasmettitore"], answer: 1, why: "Lo stesso trasmettitore (es. ACh) può eccitare o inibire secondo il recettore." },
        { q: "L'inibizione di shunt…", options: ["iperpolarizza fortemente", "riduce l'effetto dei PPSE aumentando la conduttanza, senza cambiare molto Vm", "depolarizza"], answer: 1, why: "La conduttanza aggiunta con E ≈ riposo \"disperde\" la corrente eccitatoria." }
      ],
      related: ['24bis', '26', '23']
    },
    // ------------------------------------------------------------------ 24-bis
    {
      id: '24bis', num: '24-bis', title: 'I neurotrasmettitori (1): acetilcolina e aminoacidi',
      src: '24_bis_I_neurotrasmettitori_1.ppt',
      card: 'Piccole molecole e neuropeptidi, ACh, glutammato (AMPA, NMDA), GABA, glicina.',
      oneliner: "I trasmettitori a basso peso molecolare (ACh, glutammato, GABA, glicina, amine) sono sintetizzati nel terminale e riciclati; i <b>neuropeptidi</b> sono sintetizzati nel soma e trasportati lungo l'assone.",
      points: [
        "Ciclo dell'ACh: colina + acetil-CoA (ChAT) → caricamento vescicolare (vAChT) → rilascio → idrolisi da parte dell'AChE → ricaptazione della colina (CHT).",
        "Recettori colinergici: nicotinici (ionotropi, cationici) e muscarinici (metabotropi, 7 eliche). Agonisti e antagonisti: nicotina, muscarina, curaro, atropina.",
        "Glutammato: principale eccitatorio; ciclo glutammato-glutammina con la glia (EAAT, glutammina sintetasi). Recettori AMPA, kainato, NMDA (permeabili al Ca²⁺, bloccati dal Mg²⁺) e metabotropi.",
        "GABA (da glutammato tramite GAD) e glicina: principali inibitori; GABA-A è un canale per il Cl⁻ potenziato da benzodiazepine, barbiturici e neurosteroidi.",
        "Il recettore NMDA è un rivelatore di coincidenza: conduce solo con glutammato <b>e</b> membrana depolarizzata.",
        "Recettori adrenergici α e β: attraverso le proteine G regolano PLC (IP₃, DAG, Ca²⁺) o adenilato ciclasi (AMPc, PKA)."
      ],
      formulas: [
        { label: 'Blocco del Mg²⁺ sul recettore NMDA (Jahr e Stevens)', tex: 'B(V) = \\frac{1}{1 + \\frac{[Mg^{2+}]_o}{3{,}57}\\,e^{-0{,}062\\,V}}' }
      ],
      sims: [
        { id: 'iv', preset: { type: 'nmda' },
          predict: { q: "A −80 mV, con Mg²⁺ fisiologico (1 mM), il recettore NMDA legato al glutammato conduce…", options: ["molto", "pochissimo", "solo Cl⁻"], answer: 1, why: "Il Mg²⁺ occlude il poro a potenziali negativi; la depolarizzazione lo espelle." },
          observe: "porta il Mg²⁺ a zero: la curva diventa lineare." },
        { id: 'sinapsi3d', title: 'Sinapsi glutammatergica', preset: { nt: 'glu' },
          observe: "il glutammato non viene degradato nella fessura: viene ricaptato da trasportatori (EAAT) nel terminale e nella glia." },
        { id: 'patchclamp', title: 'GABA-A al patch clamp: benzodiazepine e barbiturici', preset: { g: 27, E: -70, V: -20, a: 0.05, b: 0.33 },
          predict: { q: "Le benzodiazepine aumentano la corrente GABA-A soprattutto…", options: ["aumentando la frequenza delle aperture", "aumentando la durata delle aperture", "aumentando la conduttanza del canale"], answer: 0, why: "È la differenza classica con i barbiturici, che invece allungano le aperture." },
          observe: "usa i pulsanti degli esempi e confronta P(aperto), aperture al secondo e durata media." }
      ],
      warn: ["La Figura 4.27 (azione inibitoria del recettore muscarinico sul canale K⁺ atriale) dice che il canale si apre per azione della \"subunità α della proteina G stimolatoria\". Il recettore è M2, accoppiato a <b>Gi/o</b>, e il canale GIRK è aperto direttamente dalle subunità <b>βγ</b>. È lo stesso errore segnalato nella lezione 10."],
      quiz: [
        { q: "L'acetilcolina nella fessura viene inattivata principalmente…", options: ["per ricaptazione dell'ACh intera", "per idrolisi da parte dell'acetilcolinesterasi", "per diffusione"], answer: 1, why: "L'AChE la scinde in colina e acetato; si ricapta la colina." },
        { q: "Il GABA è sintetizzato a partire da…", options: ["glutammato (GAD)", "tirosina", "triptofano"], answer: 0, why: "La glutammato decarbossilasi (GAD) converte il glutammato in GABA." }
      ],
      related: ['24', '24ter', '25']
    },
    // ------------------------------------------------------------------ 24-ter
    {
      id: '24ter', num: '24-ter', title: 'I neurotrasmettitori (2): amine, peptidi e altri',
      src: '24_tris__I_neurotransmettitori_2.ppt',
      card: 'Catecolamine, serotonina, istamina, neuropeptidi, oppioidi, purine, endocannabinoidi.',
      oneliner: "Le <b>amine biogene</b> (dopamina, noradrenalina, adrenalina, serotonina, istamina) nascono da pochi nuclei del tronco encefalico e dell'ipotalamo, agiscono soprattutto su recettori metabotropi e modulano vaste aree del cervello.",
      points: [
        "Catecolamine: tirosina → L-DOPA (tirosina idrossilasi, passaggio limitante) → dopamina → noradrenalina (dentro le vescicole) → adrenalina. Caricamento con VMAT; ricaptazione con NET e DAT; degradazione con MAO e COMT.",
        "Noradrenalina: locus coeruleus (attenzione, sonno-veglia); fibre postgangliari simpatiche. Recettori α₁, α₂, β₁, β₂ (e β₃), tutti metabotropi.",
        "Dopamina: sostanza nera → striato (movimento; Parkinson), nucleo arcuato. Recettori D1-like (Gs) e D2-like (Gi/Go).",
        "Serotonina (5-HT): nuclei del rafe, dal triptofano; SERT; recettori 5-HT1–7, solo 5-HT3 ionotropo.",
        "Istamina: nucleo tubero-mammillare, veglia (gli antistaminici danno sonnolenza).",
        "Neuropeptidi: sintetizzati come pre-pro-peptidi nel soma, senza ricaptazione, inattivati da peptidasi; sostanza P (dolore) e peptidi oppioidi (encefaline, endorfine, dinorfine). Purine (ATP, adenosina) ed endocannabinoidi (CB1, CB2)."
      ],
      formulas: [
        { label: 'Ricaptazione (Michaelis-Menten) con un inibitore competitivo', tex: '\\frac{d[DA]}{dt} = \\text{rilascio} - \\frac{V_{max}[DA]}{K_m(1 + [I]/K_i) + [DA]}' }
      ],
      sims: [
        { id: 'monoamine', preset: { drug: 'coc' },
          predict: { q: "La cocaina, che blocca il trasportatore DAT, rispetto al controllo…", options: ["riduce il picco di dopamina", "aumenta il picco e soprattutto rallenta la rimozione", "non cambia nulla"], answer: 1, why: "Con la ricaptazione bloccata la dopamina resta più a lungo nella fessura e si accumula." },
          observe: "confronta cocaina e anfetamina: l'anfetamina fa uscire dopamina anche senza scarica (trasporto invertito). Poi prova reserpina, Parkinson e Parkinson + L-DOPA." }
      ],
      warn: [
        "<b>Parkinson</b>: la slide indica come terapia \"somministrazione di dopamina, poi di L-DOPA\". La dopamina <b>non attraversa la barriera ematoencefalica</b> e non è una terapia per il Parkinson: si somministra la <b>L-DOPA</b> (di solito con carbidopa, che ne impedisce la conversione periferica).",
        "<b>Endocannabinoidi</b>: i due principali sono l'<b>anandamide</b> e il <b>2-arachidonoilglicerolo (2-AG)</b>. La PEA (palmitoiletanolammide) non è un vero agonista dei recettori CB1 e CB2.",
        "<b>Anfetamine</b>: la slide le accomuna alla cocaina come bloccanti di NET e DAT. La cocaina li blocca; le anfetamine sono invece <b>substrati</b> che entrano nel terminale, svuotano le vescicole tramite VMAT e fanno funzionare i trasportatori <b>al contrario</b> (efflusso di dopamina)."
      ],
      quiz: [
        { q: "La tappa limitante della sintesi delle catecolamine è catalizzata da…", options: ["DOPA decarbossilasi", "tirosina idrossilasi", "MAO"], answer: 1, why: "La tirosina idrossilasi, che richiede biopterina e Fe²⁺ ed è regolata per fosforilazione." },
        { q: "Quale recettore della serotonina è un canale ionico?", options: ["5-HT1", "5-HT2", "5-HT3"], answer: 2, why: "È l'unico ionotropo; tutti gli altri sono accoppiati a proteine G." }
      ],
      related: ['24bis', '24', '26']
    },
    // ------------------------------------------------------------------ 25
    {
      id: '25', num: '25', title: 'La giunzione neuromuscolare',
      src: '25_La_giunzione_neuromuscolare.ppt',
      card: 'Fatt e Katz, potenziali in miniatura, rilascio quantale, recettore nicotinico, curaro, miastenia.',
      oneliner: "Alla placca motrice l'ACh è liberata in <b>quanti</b> (vescicole): un potenziale di placca è la somma di 100–200 quanti, abbastanza da superare sempre la soglia della fibra muscolare (fattore di sicurezza).",
      points: [
        "Fatt e Katz: con il curaro il potenziale di placca diventa sottosoglia e si vede che è locale (si attenua allontanandosi dalla placca).",
        "Potenziali di placca in miniatura spontanei (~0,5 mV, circa 1 al secondo): ognuno è il rilascio di una vescicola (5000–7000 molecole di ACh).",
        "In basso Ca²⁺ e alto Mg²⁺ le risposte evocate fluttuano a multipli interi del quanto (statistica di Poisson; del Castillo e Katz). Un PdA libera 100–200 vescicole alla placca, molte meno nel SNC.",
        "Recettore nicotinico muscolare: pentamero α₂βγδ (fetale) o α₂βεδ (adulto), 4 segmenti per subunità, M2 forma il poro; 2 siti per l'ACh sulle α (cooperatività); canale cationico non selettivo.",
        "Densità altissima sulle creste delle pieghe giunzionali (10 000–15 000/µm²); i canali Na⁺ voltaggio-dipendenti stanno sul fondo delle pieghe.",
        "Bloccanti: d-tubocurarina (curaro), α-bungarotossina. Patologie: alterato rilascio, alterata interazione con i recettori (miastenia grave), alterata rimozione (anticolinesterasici)."
      ],
      formulas: [
        { label: 'Statistica di Poisson del rilascio', tex: 'P(k) = \\frac{m^k e^{-m}}{k!},\\qquad m = \\ln\\frac{N}{N_0}' },
        { label: 'Fattore di sicurezza', tex: 'FS = \\frac{\\text{ampiezza del potenziale di placca}}{V_{soglia} - V_{riposo}}' }
      ],
      sims: [
        { id: 'placca', preset: { mode: 'quanti', Ca: 0.8, Mg: 6.8 },
          predict: { q: "In basso Ca²⁺ / alto Mg²⁺ l'istogramma delle ampiezze evocate mostra…", options: ["una sola campana", "picchi a multipli interi di ~0,4 mV e molti fallimenti", "valori casuali senza struttura"], answer: 1, why: "Il rilascio è quantale: 0, 1, 2, 3… vescicole, con probabilità di Poisson." },
          observe: "confronta m calcolato con il metodo dei fallimenti e con il rapporto tra le medie. Passa al Ringer normale: m ≈ 200." },
        { id: 'placca', title: 'Fattore di sicurezza, curaro, miastenia', preset: { mode: 'sic' },
          predict: { q: "Nella miastenia grave (circa −60% di recettori disponibili), con stimolazione ripetitiva a 3 Hz…", options: ["la trasmissione è normale", "le risposte calano e alcune non raggiungono la soglia (affaticabilità)", "aumentano"], answer: 1, why: "Con il fattore di sicurezza ridotto basta il normale calo del rilascio durante il treno per scendere sotto soglia." },
          observe: "aggiungi la neostigmina: l'ACh resta più a lungo e la trasmissione migliora (è la terapia sintomatica)." },
        { id: 'placca', title: 'Fatt e Katz: il potenziale di placca è locale', preset: { mode: 'dist' } },
        { id: 'canale3d', title: 'Il recettore nicotinico', preset: { type: 'nachr' },
          observe: "il canale si apre solo con due molecole di ACh legate; il curaro occupa i siti e lo impedisce." }
      ],
      warn: [
        "<b>Sito di legame dell'ACh</b>: la slide attribuisce ai residui di Tyr e Trp una \"carica parziale positiva\". I residui aromatici legano l'ammonio quaternario (positivo) dell'ACh con un'<b>interazione catione-π</b>, cioè con la faccia dell'anello <b>ricca di elettroni</b>.",
        "<b>Diametro del poro</b>: il testo dà un diametro critico di 9–10 Å, mentre la Figura 4.13 della stessa lezione indica circa 0,6 nm. Il valore sperimentale (Dwyer, Adams e Hille, 1980) è circa <b>6,5 Å</b>."
      ],
      quiz: [
        { q: "Un potenziale di placca in miniatura corrisponde a…", options: ["l'apertura di un singolo canale", "il contenuto di una vescicola", "un potenziale d'azione"], answer: 1, why: "Migliaia di molecole di ACh aprono circa un migliaio di canali." },
        { q: "La neostigmina migliora la miastenia perché…", options: ["aumenta i recettori", "inibisce l'AChE, prolungando l'azione dell'ACh", "aumenta il Ca²⁺"], answer: 1, why: "Più tempo di permanenza dell'ACh = più recettori attivati." }
      ],
      related: ['24bis', '23', '26']
    },
    // ------------------------------------------------------------------ 26
    {
      id: '26', num: '26', title: 'Integrazione sinaptica',
      src: '26_integrazione_sinaptica.ppt',
      card: 'PPS locali e graduati, sommazione spaziale e temporale, inibizione pre- e postsinaptica.',
      oneliner: "Il neurone <b>somma</b> nello spazio e nel tempo i potenziali postsinaptici che arrivano al <b>segmento iniziale dell'assone</b>: se si supera la soglia nasce il PdA.",
      points: [
        "Il PPS è locale (si attenua lungo il dendrite) e graduato (cresce con la quantità di trasmettitore).",
        "Il soma ha pochi canali Na⁺ voltaggio-dipendenti (soglia alta); il segmento iniziale ne ha moltissimi (soglia bassa): lì nasce il PdA.",
        "Sommazione spaziale: più terminali che liberano trasmettitore insieme. Sommazione temporale: un terminale che libera a ondate ravvicinate (dipende da τ).",
        "Inibizione postsinaptica: un PPSI riduce l'effetto di tutti i PPSE sul neurone.",
        "Inibizione presinaptica (sinapsi asso-assonica): riduce il rilascio di uno specifico terminale, senza toccare gli altri ingressi.",
        "Regolazione presinaptica: autorecettori ed eterorecettori (es. recettori nicotinici e rilascio di dopamina)."
      ],
      formulas: [
        { label: 'Costanti del dendrite', tex: '\\lambda = \\sqrt{\\frac{R_m d}{4R_i}},\\qquad \\tau = R_m C_m' }
      ],
      sims: [
        { id: 'integrazione', preset: { e1: 100, onE2: false },
          predict: { q: "Una sola sinapsi eccitatoria vicino al soma basta a scatenare il PdA?", options: ["Sì, sempre", "No: il PPSE è di pochi mV; servono più sinapsi o impulsi ripetuti", "Solo se è lontana dal soma"], answer: 1, why: "Un singolo PPSE è sottosoglia: la scarica nasce dalla sommazione." },
          observe: "attiva la sinapsi B (sommazione spaziale), poi allontanala dal soma; aumenta il ritardo di B; aggiungi l'inibizione C, iperpolarizzante o di shunt." },
        { id: 'integrazione', title: 'Sommazione temporale e inibizione presinaptica', preset: { e1: 100, onE2: false, rep: 3 },
          observe: "riduci l'intervallo tra gli impulsi di A: più sono ravvicinati, più si sommano. Attiva l'inibizione presinaptica su A." }
      ],
      quiz: [
        { q: "La sommazione temporale è favorita da…", options: ["una costante di tempo τ lunga", "una costante di tempo τ breve", "una λ piccola"], answer: 0, why: "Con τ lunga ciascun PPS dura di più e si sovrappone al successivo." },
        { q: "L'inibizione presinaptica riduce…", options: ["tutti gli ingressi eccitatori del neurone", "solo l'ingresso del terminale su cui agisce", "il potenziale di riposo"], answer: 1, why: "Agisce sul terminale presinaptico riducendone il rilascio." }
      ],
      related: ['24', '21', '28']
    },
    // ------------------------------------------------------------------ 28
    {
      id: '28', num: '28', title: 'Treni di impulsi: codifica e adattamento',
      src: '28_treni_di_impulsi.ppt',
      card: 'Codifica in frequenza, canale KA, canali Ca²⁺, scarica tonica e fasica, adattamento.',
      oneliner: "Uno stimolo duraturo produce un <b>treno</b> di PdA la cui frequenza codifica l'intensità; il canale <b>K<sub>A</sub></b> permette frequenze basse e graduali, i canali K(Ca) producono <b>adattamento</b>.",
      points: [
        "Con correnti crescenti (15, 20, 30, 45 nA nelle slide) aumenta il numero di PdA in 1,2 s: codifica in frequenza.",
        "Il canale K<sub>A</sub> è selettivo per il K⁺ come il Kv, ma si attiva a potenziali più negativi e si inattiva tanto più rapidamente quanto più forte è la depolarizzazione.",
        "La sua attivazione precoce frena lo spike; la sua inattivazione lascia prevalere lo stimolo: risultato, intervalli lunghi e frequenze basse e regolabili.",
        "I canali Ca²⁺ voltaggio-dipendenti aumentano l'eccitabilità (aiutano a raggiungere la soglia).",
        "Scarica tonica: frequenza proporzionale all'intensità. Scarica fasica: frequenza proporzionale alla variazione di intensità (adattamento).",
        "L'adattamento nasce dall'interazione di Kv, KA, K(Ca) e canali Ca²⁺: il Ca²⁺ che entra con ogni PdA attiva una corrente di K⁺ che rallenta la scarica."
      ],
      formulas: [
        { label: 'Corrente A (Connor-Stevens)', tex: 'I_A = \\bar g_A\\,a^3 b\\,(V - E_A)' }
      ],
      sims: [
        { id: 'treni', preset: { I: 10, A: true },
          predict: { q: "Togliendo i canali K_A, vicino alla soglia la frequenza minima di scarica…", options: ["resta bassa", "salta subito a valori alti (~100 Hz)", "diventa zero per qualsiasi stimolo"], answer: 1, why: "Senza K<sub>A</sub> il neurone o tace o scarica già ad alta frequenza: perde la capacità di codificare finemente." },
          observe: "confronta le curve f-I con e senza K<sub>A</sub>; poi attiva Ca²⁺ + K(Ca): l'intervallo tra i PdA si allunga durante lo stimolo (scarica fasica)." },
        { id: 'hhlab', title: 'Il modello di Hodgkin-Huxley con corrente continua', preset: { mode: 'dc', Idc: 10 },
          observe: "il modello del calamaro (senza K<sub>A</sub>) parte già da ~55 Hz: calcola la curva f-I e confrontala con quella di Connor-Stevens." }
      ],
      quiz: [
        { q: "Il canale K_A si distingue dal Kv perché…", options: ["è selettivo per il Na⁺", "si attiva a potenziali più negativi e si inattiva", "non dipende dal voltaggio"], answer: 1, why: "Sono le due proprietà che permettono la codifica a bassa frequenza." },
        { q: "Una scarica fasica codifica soprattutto…", options: ["l'intensità costante", "le variazioni di intensità", "la durata del riposo"], answer: 1, why: "La frequenza cala durante lo stimolo costante (adattamento) e risponde ai cambiamenti." }
      ],
      related: ['18', '29', '26']
    },
    // ------------------------------------------------------------------ 29
    {
      id: '29', num: '29', title: 'Il sistema somatosensoriale: il tatto',
      src: '29_Percezione_tattilei_e_sistema_somatosensoriale.ppt',
      card: 'Meccanocettori (Merkel, Meissner, Pacini, Ruffini), adattamento, acuità tattile, propriocezione.',
      oneliner: "Quattro tipi di <b>meccanocettori</b> scompongono lo stimolo tattile: quelli ad <b>adattamento lento</b> (Merkel, Ruffini) segnalano la pressione mantenuta, quelli ad <b>adattamento rapido</b> (Meissner, Pacini) le variazioni e le vibrazioni.",
      points: [
        "Sensibilità tattile: tatto superficiale, pressione, prurito, solletico, vibrazione, stiramento, flessione dei peli.",
        "Epidermide: terminazioni libere; dischi di Merkel (lenti, campi recettivi piccoli, ~25% dell'innervazione della mano: forma e superficie).",
        "Derma superficiale: corpuscoli di Meissner (rapidi, campi piccoli, cute glabra).",
        "Derma profondo: corpuscoli di Pacini (lamelle concentriche, adattamento molto rapido, vibrazioni ad alta frequenza, ruvidità) e di Ruffini (lenti, pressione e stiramento).",
        "La capsula del Pacini funziona da filtro: tolta la capsula (Loewenstein) il recettore risponde anche alla pressione mantenuta.",
        "Acuità tattile: maggiore con più recettori per unità di superficie, campi recettivi piccoli e sovrapposti, inibizione laterale, conduzione rapida. Propriocezione: fusi neuromuscolari e organi tendinei del Golgi."
      ],
      formulas: [],
      practical: "Il potenziale di recettore è graduato e locale (come i PPS, lezione 21); la zona di innesco della fibra afferente lo traduce in una frequenza di PdA (lezione 28).",
      sims: [
        { id: 'meccanocettori', preset: { stim: 'press', A: 50 },
          predict: { q: "Durante una pressione mantenuta per mezzo secondo, il corpuscolo di Pacini…", options: ["scarica per tutto il tempo", "scarica solo all'inizio e alla fine", "non scarica mai"], answer: 1, why: "È ad adattamento molto rapido: segnala le variazioni dello stimolo, non lo stimolo costante." },
          observe: "attiva \"Pacini senza capsula\": diventa un recettore ad adattamento lento, come nell'esperimento di Loewenstein." },
        { id: 'meccanocettori', title: 'Vibrazione: chi risponde a quale frequenza?', preset: { stim: 'vib', A: 2, f: 250 },
          predict: { q: "Una vibrazione di 2 µm a 250 Hz attiva soprattutto…", options: ["il disco di Merkel", "il corpuscolo di Meissner", "il corpuscolo di Pacini"], answer: 2, why: "Il Pacini è il più sensibile alle alte frequenze (200–300 Hz) con soglie sotto il micrometro." },
          observe: "porta la frequenza a 10 Hz con un'ampiezza di circa 40 µm: scaricano Meissner e Merkel (flutter) e il Pacini resta silente. Poi torna a 250 Hz con 1 µm: scarica solo il Pacini. Calcola le curve di soglia per vedere il minimo di ogni recettore." },
        { id: 'duepunti', preset: { reg: 'dito', d: 3 },
          observe: "confronta il polpastrello con il dorso; togli l'inibizione laterale: la soglia di discriminazione aumenta." }
      ],
      quiz: [
        { q: "Quale recettore è ad adattamento lento con campi recettivi piccoli?", options: ["Pacini", "Merkel", "Meissner"], answer: 1, why: "SA I: forma e bordi degli oggetti." },
        { q: "La soglia di discriminazione di due punti è più bassa…", options: ["sul dorso", "sul polpastrello", "sul polpaccio"], answer: 1, why: "Il polpastrello ha alta densità di recettori e campi recettivi piccoli (~2–3 mm)." }
      ],
      related: ['28', '21', '26']
    },
    // ------------------------------------------------------------------ 30
    {
      id: '30', num: '30', title: 'Bilancio idrico e funzioni renali',
      src: '30_bilancio_idrico_e_funzioni_renali.pptx',
      card: 'Nefrone, filtrazione glomerulare (Starling), riassorbimento e secrezione, ADH e concentrazione delle urine.',
      oneliner: "Il rene <b>filtra</b> il plasma nel glomerulo (forze di Starling), poi <b>riassorbe</b> e <b>secerne</b> lungo il tubulo; regolando l'acqua con l'ADH produce urine da ~100 a ~1200–1500 mOsm/L e mantiene l'osmolarità plasmatica a ~300 mOsm/L.",
      points: [
        "Funzioni: eliminazione dei cataboliti, controllo di volume, composizione e osmolarità del LEC, pressione arteriosa (renina), eritropoiesi (eritropoietina), equilibrio acido-base, mineralizzazione ossea (calcitriolo).",
        "Circa un milione di nefroni per rene: corpuscolo renale (glomerulo + capsula di Bowman) e sistema tubulare (prossimale, ansa di Henle, distale, dotto collettore).",
        "Barriera di filtrazione: endotelio fenestrato, lamina basale, podociti; cariche negative che trattengono le proteine.",
        "Pressione netta di filtrazione = P<sub>GC</sub> − P<sub>BS</sub> − π<sub>GC</sub>; la pressione oncotica sale lungo il capillare perché le proteine si concentrano.",
        "Apparato iuxtaglomerulare: cellule granulari (renina) dell'arteriola afferente e macula densa.",
        "Bilancio idrico: entrate ≈ uscite (~2,3 L/giorno). Il volume urinario dipende dal carico osmotico e dalla capacità di concentrazione: volume = carico / osmolarità urinaria."
      ],
      formulas: [
        { label: 'Filtrazione glomerulare (Starling)', tex: 'GFR = K_f\\,\\big(P_{GC} - P_{BS} - \\pi_{GC}\\big)' },
        { label: 'Volume urinario', tex: 'V = \\frac{\\text{carico osmotico}}{U_{osm}},\\qquad C_{H_2O} = V - C_{osm}' }
      ],
      sims: [
        { id: 'glomerulo', preset: {},
          predict: { q: "Costringendo l'arteriola efferente (es. angiotensina II), la GFR…", options: ["diminuisce subito", "aumenta (per una costrizione moderata) mentre il flusso plasmatico diminuisce", "non cambia"], answer: 1, why: "La pressione nel glomerulo sale; con costrizioni molto forti però il flusso cala tanto che la pressione oncotica limita la filtrazione (risposta bifasica)." },
          observe: "confronta la costrizione dell'afferente e quella dell'efferente; prova l'ipoproteinemia e l'ostruzione urinaria." },
        { id: 'nefrone', preset: { Posm: 287 },
          predict: { q: "Senza ADH (diabete insipido centrale), con un carico osmotico di 900 mOsm/giorno, il volume urinario è circa…", options: ["1,5 L/giorno", "5 L/giorno", "18 L/giorno"], answer: 2, why: "Senza ADH l'urina resta diluita (~50 mOsm/L): 900/50 = 18 L/giorno." },
          observe: "segui l'osmolarità lungo il nefrone: il tratto ascendente spesso diluisce sempre a ~100 mOsm/L; è il dotto collettore, con l'ADH e le AQP2, a decidere la concentrazione finale." },
        { id: 'bilancio', preset: {},
          observe: "aumenta la sudorazione senza bere di più: l'urina necessaria diminuisce e deve essere più concentrata, fino al limite di ~1200 mOsm/L." }
      ],
      info: ["La slide indica una pressione idrostatica glomerulare di 45–50 mmHg; altri testi (Guyton) riportano circa 60 mmHg. Il simulatore usa 55 mmHg, valore intermedio con cui si ottengono i dati di riferimento (GFR 125 mL/min, frazione di filtrazione ~20%). Con 7 g/dL di proteine la pressione oncotica iniziale è ~25 mmHg (Landis-Pappenheimer); la slide indica 20 mmHg."],
      quiz: [
        { q: "Lungo il capillare glomerulare la pressione oncotica…", options: ["diminuisce", "aumenta, perché si filtra acqua e le proteine si concentrano", "resta costante"], answer: 1, why: "Circa il 20% del plasma viene filtrato: le proteine restano e la loro concentrazione sale." },
        { q: "L'ADH agisce…", options: ["sul tubulo prossimale", "sul dotto collettore inserendo AQP2", "sul glomerulo"], answer: 1, why: "Recettori V2 → AMPc → inserimento di AQP2 nella membrana apicale." },
        { q: "Il segmento che diluisce sempre il liquido tubulare è…", options: ["il tubulo prossimale", "il tratto ascendente spesso dell'ansa di Henle", "il dotto collettore"], answer: 1, why: "Riassorbe NaCl (NKCC2) ma è impermeabile all'acqua." }
      ],
      related: ['01', '09', '08']
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);
