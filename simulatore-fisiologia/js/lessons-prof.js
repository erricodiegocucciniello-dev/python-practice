/* Ciò che la prof sottolinea a lezione (dalle trascrizioni delle prime 17 lezioni in aula), per ogni scheda.
   Le slide restano il riferimento: qui ci sono gli accenti, i trabocchetti e le formulazioni preferite.
   Le trascrizioni non sono pubblicate: i punti sono riscritti con parole nostre. */
(function (G) {
  'use strict';
  var F = G.Fisio;
  var P = {
    '01': [
      'La vita è uno <b>stato stazionario di non-equilibrio</b>. L\'equilibrio con l\'ambiente è la morte: gradienti azzerati, potenziale di membrana a 0 mV, entropia massima.',
      '<b>Linguaggio rigoroso</b>: omeotermi/eterotermi (non «sangue caldo/freddo»); si scambia <i>calore</i>, non «temperatura»; «stabilità», non «fissità». Un parametro omeostatico oscilla attorno al set-point entro un intervallo fisiologico.',
      '<b>Circuito di controllo</b>: sensore → comparatore (errore = valore ideale − valore reale) → effettore. Esempi: brivido (termocettori, ipotalamo, muscolo scheletrico), termostato, asse tiroideo, sete e ADH.',
      '<b>Feedback positivo</b>: l\'esempio della prof è il <b>parto</b> (stiramento della cervice → ossitocina → contrazioni → più stiramento), che si interrompe quando il feto è espulso. Confronto negativo/positivo: si oppone / amplifica; stabilità / evento che si completa; prevalente / raro.',
      '<b>«Recettore» ha due significati</b>: la proteina con un sito di legame per un ligando, oppure la cellula sensoriale. Confonderli è un errore frequente agli esami.',
      'Ligandi <b>idrofili</b> (insulina) → recettori di membrana; ligandi <b>lipofili</b> (ormoni tiroidei) → recettori intracellulari. T4 è il pro-ormone, T3 l\'ormone attivo (3 iodi, dalla deiodinazione).',
      '<b>Sudorazione</b>: a raffreddare è l\'evaporazione (calore latente), non il sudore liquido; con umidità alta il gradiente di tensione di vapore si annulla e il sudore non serve.'
    ],
    '02': [
      'Trasformazioni reali: mai rendimento del 100%, una quota è dispersa come calore. Nel muscolo solo circa il 20–25% dell\'energia dell\'ATP diventa lavoro; nel <b>brivido</b> quasi tutto diventa calore perché non c\'è movimento utile.',
      '<b>Trasduzione</b> = conversione di una forma di energia in un\'altra attraverso il metabolismo: gli organismi sono «motori biologici».',
      'I viventi <b>non violano il secondo principio</b>: mantengono ordine spendendo energia e aumentando l\'entropia dell\'ambiente. In forma rigorosa ΔG = ΔH − TΔS; in aula ΔU = ΔG + TΔS (TΔS = energia vincolata al disordine).',
      'Immagini della prof: la cameretta, il castello di carte, il ghepardo, il motore dell\'auto, la bottiglia fredda che si scalda da sola (un mammifero nel freddo tenderebbe all\'equilibrio, cioè alla morte).'
    ],
    '03': [
      'Regola dell\'accoppiamento: |ΔG esoergonica| deve superare |ΔG endoergonica| (metafora del sasso portato in cima da chi ha più forza del suo peso).',
      '<b>«Mister XP»</b>: XP cede il fosfato ad A (A–P più energetico), poi A–P reagisce spontaneamente con B e libera Pi. Esempio: la biosintesi del glicogeno usa monomeri di glucosio fosforilati.',
      'L\'idrolisi dell\'ATP libera energia perché i prodotti (ADP + Pi) sono più stabili, con cariche stabilizzate per risonanza; la sintesi di ATP è «in salita» e viene dal catabolismo (o dalla luce).',
      'La respirazione cellulare non ha fiamma perché l\'ossidazione del glucosio è frazionata in tappe e l\'energia è catturata in ATP (il «magazzino molecolare»); il resto è calore metabolico.'
    ],
    '04': [
      'Fosfolipide <b>anfipatico</b> (Jekyll e Hyde): geometria conica → micelle, cilindrica → doppio strato. L\'assemblaggio è spontaneo (minore energia libera).',
      'Il <b>colesterolo è il «jolly»</b>: impedisce sia l\'eccessivo impacchettamento sia l\'eccessiva fluidità. I poichilotermi, al freddo, aumentano gli acidi grassi insaturi con doppi legami cis.',
      '<b>Asimmetria</b>: glucidi solo sul foglietto esterno (glicocalice); fosfatidilserina (carica netta negativa) nel foglietto interno. È una polarità «primordiale» sulla quale si innesta il potenziale di membrana.',
      'La membrana plasmatica è parte di un <b>sistema di membrane</b> (reticolo, Golgi, mitocondri); le MAMs sono siti di contatto reticolo-mitocondri per lo scambio di Ca²⁺. Il doppio binario si vede solo al TEM.'
    ],
    '05': [
      'Proteine <b>integrali</b> (detergenti forti) e <b>periferiche</b> (detergenti blandi); domini transmembrana ad α-elica di amminoacidi apolari, anse idrofile. Più passi = più idrofobicità.',
      'Due recettori da conoscere: <b>insulina</b> (tirosin-chinasico, singolo passo, dimerizzazione e autofosforilazione) e <b>glucagone</b> (7 eliche, proteina G, adenilato ciclasi, cAMP, PKA; Gs stimola, Gi inibisce).',
      '<b>Carrier</b> (accesso alternato, «schiaccianoci») e <b>canali</b> («traforo»): oggi si sa che nei canali lo ione interagisce con le pareti (il «vecchio dogma» negava l\'interazione).',
      'Subunità dei canali: 4 (voltaggio-dipendenti), 5 (recettori-canale), 6 connessine (connessone; due connessoni = giunzione comunicante). Rapporto lipidi/proteine: mielina (isolante) contro membrana mitocondriale interna (la più ricca di proteine).',
      'Tecniche: <b>SDS-PAGE</b> (denatura, separa per peso molecolare) e <b>BN-PAGE</b> (nativa, per i complessi di membrana). Ancore lipidiche reversibili (miristico, palmitico, prenili, GPI); Frye-Edidin e zattere lipidiche.'
    ],
    '06': [
      '<b>Teorell</b>: F = K·X con X = −dμ/dx. La legge di Ohm è un caso particolare (corrente = flusso, conduttanza = K, ΔV = forza spingente). Tre flussi: massa (ΔP), diffusione (ΔC), elettroforesi (ΔV).',
      '«<b>I flussi stanno nel test</b>»: la prof dice che la domanda sulla diffusione nel primo test «c\'è sicuramente». Sapere il grafico C(t): C₁ e C₂ tendono asintoticamente a C_f, ΔC → 0 (equilibrio dinamico, flussi uguali e opposti).',
      '<b>t ∝ x²</b>: veloce a scala subcellulare, lentissima su scale macroscopiche; per questo servono flusso di massa e circolazione. K_m contiene viscosità e geometria (trombo = K_m ridotto).',
      'Elettrodiffusione: con z = 0 resta Fick, con ΔC = 0 resta la migrazione in campo elettrico; i cationi vanno al catodo, gli anioni all\'anodo.'
    ],
    '07': [
      '<b>Trabocchetto</b>: «la tela fosfolipidica è impermeabile al glucosio?» Vero. «La membrana plasmatica è impermeabile al glucosio?» Falso (ci sono i carrier). La tela è il doppio strato puro, la membrana biologica è tela + proteine.',
      'P = F/ΔC riassume particella, membrana e ambiente. Per le sostanze lipofile non dipende dalle dimensioni ma da β (P ∝ β·D_m); per gli ioni dipende dal diametro (setaccio, limite di circa 8 Å).',
      '<b>Osmosi</b> = flusso passivo di acqua (non esiste trasporto attivo primario di sola acqua). Da bassa a alta pressione osmotica. Δπ è necessaria ma non sufficiente: serve una membrana permeabile all\'acqua.',
      'π = RTC è colligativa: conta il numero di particelle osmoticamente attive. 150 mM NaCl = 300 mOsm (soluzione fisiologica). Coefficiente di riflessione σ: 1 = impermeabile, massimo effetto; 0 = nessun effetto. «Sono i soluti che muovono l\'acqua.»'
    ],
    '08': [
      'Eritrocita: isosmotica (300 mOsm) flusso netto nullo; iperosmotica → raggrinzimento; iposmotica → rigonfiamento, lisi e «ghost». Isosmotico non significa isotonico (urea).',
      'Regolazione del volume: ambiente ipotonico → <b>RVD</b> (la cellula espelle sali, l\'acqua segue); ipertonico → <b>RVI</b> (importa sali, l\'acqua segue). L\'idrolisi del glicogeno in glucosio aumenta la pressione osmotica interna.',
      'Controllo dell\'idratazione: osmocettori ipotalamici che si raggrinziscono → ADH dalla neuroipofisi → inserzione di acquaporine nel rene → poca urina concentrata.'
    ],
    '09': [
      '«<b>Ground zero</b>»: un canale ionico è una <b>proteina integrale di membrana</b> con un poro idrofilo che lascia passare ioni inorganici. Molti studenti sbagliano proprio questa definizione.',
      'Le due proprietà: <b>selettività</b> (grezza per carica; fine per specie, con il filtro di taglia legata a raggio e guscio di idratazione) e <b>gating</b> (voltaggio-, chemio-, meccano-dipendente). Aperto = pervio, chiuso = impervio.',
      '<b>Cooperatività</b> nella cellula β: glucosio → ATP → chiusura K_ATP → depolarizzazione → apertura Ca²⁺ voltaggio-dipendenti → insulina.',
      '<b>Acquaporine</b>: tetrameri con 4 pori (motivo NPA), fino a 100 volte più rapide della diffusione attraverso i lipidi, sempre passive e bidirezionali. AQP2 apicale regolata da ADH (cAMP, esocitosi di vescicole), AQP3 basolaterale. Esperimento di Agre con gli oociti di Xenopus. Diabete insipido: urine abbondanti senza glucosio.'
    ],
    '10': [
      'Due domande che la prof vuole saper risolvere: <b>perché le membrane sono polarizzate</b> e <b>come nasce un potenziale di membrana</b> (comparirà «a caratteri cubitali» in una slide). Il potenziale è un segno di vitalità: viene generato e mantenuto.',
      '<b>Conduttanza basale</b> = somma delle conduttanze dei canali di leakage. I flussi passivi sono bilanciati da flussi attivi («ciclo futile»): serve a generare il potenziale, mantenere le correnti e limitare i gradienti che le pompe costruirebbero.',
      'Leakage da ricordare: <b>ENaC</b> (Na⁺, amiloride, insensibili alla TTX), <b>K2P</b> (i più numerosi: a riposo prevale g_K), canali cationici, <b>ClC</b> (13 eliche), <b>CFTR</b> (fibrosi cistica, Phe508; regolato da ATP e fosforilazione).',
      '<b>Nav</b>: sensibili alla TTX; tipo 1 nelle cellule eccitabili, <b>tipo 2 anche nei tessuti non eccitabili</b> («bellissima domanda del test»). «Voltaggio-dipendente» = lo stato aperto/chiuso dipende dal voltaggio. Serve una <b>soglia</b> (argomento d\'esame); il passaggio chiuso → aperto si chiama <b>attivazione</b>.',
      'Due porte (attivazione rapida, inattivazione lenta): <b>chiuso ≠ inattivo</b>, entrambi impervi ma configurazioni diverse. Il Nav «magari lo dovete disegnare, ma lo dovete riconoscere»: 4 domini × 6 eliche, S4 sensore, filtro tra S5 e S6.'
    ],
    '11': [
      '<b>Diffusione semplice</b> (lineare con ΔC) contro <b>facilitata</b> (satura): la prof dice che la distinzione va conosciuta per l\'esame. La saturazione deriva da numero finito di trasportatori e velocità finita.',
      '<b>Km</b>: concentrazione a cui il flusso è metà del massimo, si legge sull\'asse X; più bassa = affinità maggiore. «Concetto importante», ripreso nelle lezioni successive.',
      '<b>GLUT</b>: GLUT1 (globuli rossi, capillari del SNC), GLUT2 (fegato, β, intestino, rene; Km alta), GLUT3 (neuroni; Km molto più bassa), GLUT4 (muscolo e adipe; insulina, vescicole), GLUT5 (anche fruttosio). Direzione data dal gradiente. Dodici eliche, glicosilate.',
      'Carrier <b>passivo</b>: stessa affinità per tutto il ciclo («flip-flop» o «ping-pong»), facilitatore. Carrier <b>attivo</b>: fosforilazione (energizzazione) con cambio di conformazione e di affinità, costruisce gradienti.',
      'Nell\'epitelio assorbente le glucosio-permeasi sono basolaterali: serve un altro trasporto per l\'ingresso apicale (lo schema si completa con i trasporti secondari).'
    ],
    '12': [
      '<b>Primario</b> = usa direttamente l\'ATP (pompa = carrier + enzima ATPasico). <b>Secondario</b> = dipende da un primario e sfrutta il gradiente che crea. Non confondere il movimento <i>passivo</i> dello ione motore con il carattere <i>attivo</i> del trasporto secondario.',
      '<b>Pompa Na⁺/K⁺</b>: 3 Na⁺ fuori, 2 K⁺ dentro; elettrogenica; costruisce il potenziale e i gradienti; «se si ferma, la cellula muore». I gradienti sono <b>accumulatori di energia</b>.',
      'Se il metabolismo si blocca (anossia, cianuro) si fermano sia i trasporti primari sia, di conseguenza, quelli secondari.'
    ],
    '13': [
      'Il potenziale nasce da <b>distribuzione ionica ineguale + permeabilità selettiva</b>. Nernst: dipende dal <b>rapporto</b> tra le concentrazioni e dalla temperatura, non dal numero di canali né dai valori assoluti.',
      'Bastano quantità minime di ioni: le concentrazioni restano invariate e l\'eccesso di carica sta in strati sottilissimi vicino alla membrana.',
      'Attenzione al fattore: 61,5 mV per decade a 37 °C (la slide scrive 58 mV con 293 K, che sono 20 °C).'
    ]
  };
  (F.LESSONS || []).forEach(function (L) { if (P[L.id]) L.prof = P[L.id]; });
})(typeof globalThis !== 'undefined' ? globalThis : this);
