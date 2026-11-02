# Simulatore di Fisiologia Generale

Simulatori interattivi per il corso di **Fisiologia Generale** (Scienze Biologiche, prof.ssa E. Silvestri), organizzati lezione per lezione: dalla membrana al potenziale d'azione, dalle sinapsi al rene.

## Come si apre

Fai doppio clic su **`index.html`**: il sito si apre nel browser (Chrome, Firefox, Edge, Safari) e funziona **anche senza internet**, perché tutte le librerie sono incluse nella cartella `vendor/`.

Per averlo online (anche dal telefono) puoi pubblicare la cartella con GitHub Pages.

## Come è organizzato

- **Per lezione** (menu a sinistra): 31 schede, una per ogni file del corso (01–30, con 24, 24-bis e 24-ter). Ogni scheda contiene:
  - il concetto in una frase, i concetti chiave e le formule;
  - i simulatori **già impostati** sul concetto della lezione, ciascuno preceduto da una domanda "Prevedi prima di provare";
  - le note **Attenzione** dove una slide contiene un errore, con il valore corretto;
  - un quiz di verifica con spiegazioni e i collegamenti alle lezioni correlate.
- **Per argomento**: i 44 simulatori raggruppati in 9 sezioni. Ogni simulatore indica in quali lezioni compare.

| Sezione | Lezioni | Simulatori |
|---|---|---|
| Omeostasi ed energia | 1–3 | feedback, glicemia/insulina, compartimenti idrici, energia libera e ATP |
| Membrana | 4–5 | doppio strato 3D, Frye-Edidin 3D, forma dei lipidi |
| Flussi e osmosi | 6–9 | diffusione (Fick), t ∝ x², permeabilità e Renkin, eritrocita 3D, osmometro |
| Canali e trasporti | 9–12 | canali 3D (Nav, Kv, K2P, Kir, nAChR, AQP1), curve I-V, cellula β, carrier, pompa Na⁺/K⁺ 3D, SGLT1 |
| Potenziale di membrana | 13–15 | Nernst dal vivo, Donnan, Goldman-Hodgkin-Katz, circuito equivalente |
| Elettrofisiologia e PdA | 16–21, 28 | current clamp, voltage clamp, patch clamp, Hodgkin-Huxley, treni di impulsi (Connor-Stevens), propagazione 3D, cavo, flusso assonico (chinesina e dineina) |
| Sinapsi | 22–26 | elettrica/chimica, sinapsi 3D, PPS e inversione, farmaci monoaminergici, placca motrice, integrazione |
| Somatosensoriale | 29 | meccanocettori, discriminazione di due punti |
| Rene | 30 | glomerulo (Starling), nefrone e ADH, bilancio idrico |

## Prova d'esame (intercorsi a crocette)

Dal menu, **Prova d'esame**. Domande a risposta multipla con **una sola risposta giusta**, 1 punto l'una, nessuna penalità, come nell'esame. Ci sono tre prove: **Primo intercorso**, **Secondo intercorso** e **Prova completa**. Ognuna ha due modi:

- **Simulazione**: pesca a caso, una domanda per lezione a turno (così nessun argomento resta fuori), con una leggera preferenza per le domande mai viste.
- **Sui miei errori** (si attiva dopo la prima simulazione): circa 60% di domande sbagliate di recente o spesso (con più peso alle lezioni dove sbagli di più), 25% nuove, 15% di ripasso.

Durante la prova: timer, pallini per saltare tra le domande, «segna per rivedere», tasti rapidi (A–E o 1–5 per rispondere, ← → per scorrere, F per segnare). Se chiudi la pagina la prova si può riprendere; se il tempo scade si consegna da sola. A fine prova: punteggio, correzione domanda per domanda con la spiegazione e il collegamento alla lezione, «rifai solo le sbagliate».

**Valori predefiniti** (modificabili in «Impostazioni delle prove», si salvano da soli): 15 domande e 30 minuti per ogni intercorso, 30 domande e 45 minuti per la prova completa; primo intercorso = slide 01–14, secondo = 15–30. Sono una stima: cambiali quando conosci quelli veri.

**Storico**: tentativi, andamento, argomenti dal più debole, domande sbagliate più spesso. Si salva nel browser di quel computer; con **Esporta / Importa** lo si può copiare o spostare (i tentativi già presenti non vengono duplicati).

### Le domande

- `js/quiz/bank-*.js`: l'archivio incluso (circa 330 domande su tutte le lezioni), scritto dalle slide e, per le prime lezioni, tenendo conto di ciò che la prof sottolinea a lezione. Ogni domanda ha la lezione di provenienza, una spiegazione e, se c'è un legame con le trascrizioni, un segno: «trattata a lezione» (l'argomento è stato spiegato) oppure «indicata dalla prof per l'esame» (la prof ha detto esplicitamente che è d'esame, un errore frequente o un trabocchetto: sono poche, una decina).
- `js/quiz/gen.js`: 17 tipi di domande **calcolate dal motore** (Nernst, Michaelis-Menten, Fick, osmolarità, τ, λ, Poisson, Starling…): i numeri cambiano a ogni prova e la risposta giusta viene dai modelli del sito, quindi è sempre esatta.
- Le opzioni vengono rimescolate a ogni prova.

### Aggiungere domande senza Claude Code

1. Nella pagina **Prova d'esame**, in fondo, apri «Aggiungere nuove domande».
2. Premi «Copia le istruzioni» e incollale in un assistente (ChatGPT, Gemini…) insieme al testo di una lezione (slide o appunti).
3. L'assistente risponde con una lista JSON: incollala nella casella, premi **Controlla** (segnala le domande con errori di formato) e poi **Salva**.

Le domande aggiunte vengono salvate nel browser (non nel sito), compaiono nelle prove della lezione indicata e sono incluse in Esporta/Importa. Formato di una domanda (la **prima** opzione è sempre quella giusta; il sito le rimescola):

```json
[{ "l": "13", "t": "Nernst", "q": "Testo della domanda?", "o": ["giusta", "errata", "errata", "errata"], "w": "Perché la prima è giusta." }]
```

Per modificare o correggere le domande incluse nel sito basta aprire il file `js/quiz/bank-….js` corrispondente (dalla pagina GitHub del repository con l'icona della matita) e cambiare il testo: ogni domanda è una riga `A('lezione', 'argomento', 'domanda', ['giusta', 'errata', 'errata', 'errata'], 'spiegazione')`. Alla fine del salvataggio (commit) il sito pubblicato si aggiorna da solo in uno o due minuti. Dopo una modifica conviene eseguire `node --test tests/quiz.test.js`, che controlla formato, duplicati e che la risposta giusta non sia riconoscibile dalla lunghezza.

## Capire cosa sta succedendo

Ogni simulatore ha in alto un riquadro di spiegazione (`js/ui/explain.js`):

- **Cosa sta succedendo**: un testo che si riscrive da solo a ogni movimento dei comandi, con i numeri del momento e la causa di ciò che si vede (per esempio: «la corrente è sottosoglia, la membrana torna al riposo senza potenziale d'azione»). Nei simulatori 3D che animano una sequenza c'è invece una barra di stato che descrive ogni fase.
- **Prova**: bottoni che impostano da soli una situazione tipica (un farmaco, una malattia, un caso limite) e mostrano una tabella **Partenza → Dopo** con ciò che cambia, più il perché.
- **Legenda dei colori** quando il grafico ne usa molti. Nel potenziale d'azione le fasi sono numerate sul grafico (① salita, ② picco, ③ discesa, ④ iperpolarizzazione).

I testi sono scritti a mano a partire dalle slide e dai valori calcolati dal modello; la parte numerica viene sempre dal simulatore, mai scritta a mano.

## Modelli e validazione

## Strutture reali dal Protein Data Bank

Il simulatore **Strutture reali dal Protein Data Bank** mostra le coordinate sperimentali di otto proteine: acquaporina 1 (PDB 1J4N), canale del K⁺ KcsA (1BL8), canale del Na⁺ NavAb (3RVY), recettore nicotinico dell'acetilcolina (2BG9), connessina 26 (2ZW3), GLUT1 (4PYP), Na⁺/K⁺-ATPasi nei due stati E1 (3WGU) ed E2 (2ZXE) e rodopsina (1U19). Per tenere leggera la pagina i file sono ridotti allo scheletro (atomi Cα) più ioni, acque del poro e ligandi importanti (circa 130 kB in tutto) e si caricano solo quando si apre il simulatore. La conversione si rifà con `python3 tools/pdb2js.py` (scarica i file da RCSB; serve numpy). I dati del PDB sono pubblici; ogni struttura riporta la citazione dell'articolo originale. Le posizioni intermedie del cursore E1 ↔ E2 della pompa sono un'interpolazione lineare tra due strutture sperimentali, non un filmato.

**Acqua nel poro dell'acquaporina (modello).** Per l'AQP1 il simulatore anima le molecole d'acqua che attraversano i quattro pori. *Non è una dinamica molecolare atomistica* (che richiederebbe decine di migliaia di atomi e giorni di calcolo): è un modello a fila singola (`js/core/singlefile.js`), cioè dinamica browniana sovrasmorzata di punti lungo l'asse del poro, ricavato dalle acque cristallografiche della struttura 1J4N, con due barriere di energia (ar/R e NPA), diffusione fissata e impossibilità di sorpasso. Le barriere e la diffusione sono scelte per riprodurre l'ordine di grandezza degli attraversamenti (circa 1 per ns e per direzione, per canale), non sono calcolate; il modello è verificato nei test (equilibrio, assenza di sorpassi, flusso netto con la forza). La forza motrice osmotica fisiologica (300 mOsm) è circa 0,0002 kT/Å: il cursore usa valori molto più grandi per vedere un flusso netto in pochi ns, come nelle simulazioni vere.

I simulatori calcolano in tempo reale le equazioni della fisiologia: Nernst, Goldman-Hodgkin-Katz, Gibbs-Donnan, Hodgkin-Huxley (1952), Connor-Stevens (1977), cavo a compartimenti (amielinico e mielinico), catena di Markov per il canale singolo, rilascio quantale di Poisson/binomiale, Fick, Renkin, van't Hoff, Kedem-Katchalsky, Michaelis-Menten, Starling con Landis-Pappenheimer, ecc. Ogni simulatore ha una sezione "Modello e parametri usati" che dichiara le ipotesi e indica dove un modello è semplificato a scopo didattico.

Il motore è verificato da test automatici che confrontano i risultati con valori di letteratura e delle slide, per esempio:

- GHK −92 mV, E<sub>K</sub> −102 mV, E<sub>Na</sub> +63 mV (esempio della lezione 15);
- 10⁻¹³ mol di cariche per caricare a −70 mV 1 cm di assone gigante (lezione 13);
- Hodgkin-Huxley: riposo −65 mV, picco ≈ +40 mV, 68 Hz con 10 µA/cm², tutto-o-nulla, refrattarietà;
- velocità di conduzione del calamaro ≈ 18,5 m/s (HH 1952: 18,8); amielinica ∝ √d, mielinica ∝ d;
- emolisi dell'eritrocita sotto ~140 mOsm (NaCl ≈ 0,45%);
- rilascio quantale: m ≈ 2,3 in basso Ca²⁺ e frazione di fallimenti = e<sup>−m</sup>;
- GFR 125 mL/min con frazione di filtrazione ≈ 20%, risposta bifasica all'arteriola efferente;
- OGTT normale (2 h < 7,8 mmol/L) e diabetico (digiuno ≥ 7, 2 h ≥ 11,1).

### Eseguire i test

```bash
node --test tests/core.test.js        # 25 test numerici del motore
node --test tests/quiz.test.js        # archivio di domande, selezione, punteggio, storico, generatori
node tests/browser.test.js            # apre tutte le pagine in Chromium (richiede Playwright), clicca ogni «Prova»
```

## Struttura dei file

```
index.html                 pagina unica (apribile con doppio clic)
css/style.css              stile, tema chiaro/scuro
js/core/                   motore numerico (funziona anche in Node per i test)
js/ui/                     componenti, grafici, scene 3D, riquadro di spiegazione (explain.js)
js/sims/                   i 44 simulatori
js/pdb/                    strutture reali ridotte dal Protein Data Bank (caricate solo quando servono)
tools/pdb2js.py            converte i file del PDB in js/pdb/*.js (non serve per usare il sito)
js/lessons.js              contenuti delle 31 lezioni
js/lessons-prof.js         riquadri «Detto a lezione» (ciò che la prof sottolinea, lezioni 1–13)
js/quiz/                   prove d'esame: motore, pagina, archivio di domande, domande calcolate
vendor/                    three.js r147 (MIT), KaTeX 0.16.9 (MIT)
tests/                     test del motore e del browser
```
