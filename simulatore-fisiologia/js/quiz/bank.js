/* Archivio delle domande a crocette. Ogni voce: Q.add(lezione, argomento, domanda, [GIUSTA, errata, errata, errata], spiegazione, {p:1 se la prof ne ha parlato}) */
(function (G) {
  'use strict';
  var F = G.Fisio, Q = F.quiz, A = Q.add;
  A('10', 'Canali ionici', 'I canali Nav sono presenti solo ed esclusivamente nelle cellule eccitabili?', ['No: il tipo 2 si trova anche in tessuti non eccitabili', 'Sì, perché servono solo a generare il potenziale d\'azione', 'Sì, ma solo nei neuroni e non nei muscoli', 'No, perché sono presenti in tutte le cellule dell\'organismo'], 'Esistono due grandi tipi di Nav: il tipo 1 (isoforme 1.1–1.8) è delle cellule eccitabili, il tipo 2 è presente anche in tessuti non eccitabili.', { p: 1 });
  A('09', 'Membrana e trasporti', 'La tela fosfolipidica è impermeabile al glucosio? E la membrana plasmatica?', ['La tela sì; la membrana plasmatica no, perché contiene trasportatori specifici per il glucosio', 'Sì in entrambi i casi, perché il glucosio è una molecola polare', 'No in entrambi i casi, perché il glucosio è piccolo', 'La tela no; la membrana plasmatica sì'], 'Il doppio strato lipidico da solo non lascia passare molecole polari grandi come il glucosio, ma la membrana plasmatica contiene proteine (trasportatori) che lo fanno passare.', { p: 1 });
})(typeof globalThis !== 'undefined' ? globalThis : this);
