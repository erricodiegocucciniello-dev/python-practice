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
- **Per argomento**: i 40 simulatori raggruppati in 9 sezioni. Ogni simulatore indica in quali lezioni compare.

| Sezione | Lezioni | Simulatori |
|---|---|---|
| Omeostasi ed energia | 1–3 | feedback, glicemia/insulina, compartimenti idrici, energia libera e ATP |
| Membrana | 4–5 | doppio strato 3D, Frye-Edidin 3D, forma dei lipidi |
| Flussi e osmosi | 6–9 | diffusione (Fick), t ∝ x², permeabilità e Renkin, eritrocita 3D, osmometro |
| Canali e trasporti | 9–12 | canali 3D (Nav, Kv, K2P, Kir, nAChR, AQP1), curve I-V, cellula β, carrier, pompa Na⁺/K⁺ 3D, SGLT1 |
| Potenziale di membrana | 13–15 | Nernst dal vivo, Donnan, Goldman-Hodgkin-Katz, circuito equivalente |
| Elettrofisiologia e PdA | 16–21, 28 | current clamp, voltage clamp, patch clamp, Hodgkin-Huxley, treni di impulsi (Connor-Stevens), propagazione 3D, cavo |
| Sinapsi | 22–26 | elettrica/chimica, sinapsi 3D, PPS e inversione, farmaci monoaminergici, placca motrice, integrazione |
| Somatosensoriale | 29 | meccanocettori, discriminazione di due punti |
| Rene | 30 | glomerulo (Starling), nefrone e ADH, bilancio idrico |

## Capire cosa sta succedendo

Ogni simulatore ha in alto un riquadro di spiegazione (`js/ui/explain.js`):

- **Cosa sta succedendo**: un testo che si riscrive da solo a ogni movimento dei comandi, con i numeri del momento e la causa di ciò che si vede (per esempio: «la corrente è sottosoglia, la membrana torna al riposo senza potenziale d'azione»). Nei simulatori 3D che animano una sequenza c'è invece una barra di stato che descrive ogni fase.
- **Prova**: bottoni che impostano da soli una situazione tipica (un farmaco, una malattia, un caso limite) e mostrano una tabella **Partenza → Dopo** con ciò che cambia, più il perché.
- **Legenda dei colori** quando il grafico ne usa molti. Nel potenziale d'azione le fasi sono numerate sul grafico (① salita, ② picco, ③ discesa, ④ iperpolarizzazione).

I testi sono scritti a mano a partire dalle slide e dai valori calcolati dal modello; la parte numerica viene sempre dal simulatore, mai scritta a mano.

## Modelli e validazione

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
node tests/browser.test.js            # apre tutte le pagine in Chromium (richiede Playwright), clicca ogni «Prova»
```

## Struttura dei file

```
index.html                 pagina unica (apribile con doppio clic)
css/style.css              stile, tema chiaro/scuro
js/core/                   motore numerico (funziona anche in Node per i test)
js/ui/                     componenti, grafici, scene 3D, riquadro di spiegazione (explain.js)
js/sims/                   i 40 simulatori
js/lessons.js              contenuti delle 31 lezioni
vendor/                    three.js r147 (MIT), KaTeX 0.16.9 (MIT)
tests/                     test del motore e del browser
```
