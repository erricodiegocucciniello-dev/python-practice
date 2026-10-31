/* Registro dei simulatori e delle sezioni tematiche. */
(function (G) {
  'use strict';
  var F = G.Fisio;
  F.sims = {};
  /** Registra un simulatore. def: {title, section, short, mount(host, preset) → {destroy}} */
  F.registerSim = function (id, def) { def.id = id; F.sims[id] = def; };

  F.SECTIONS = [
    { id: 'omeostasi', title: 'Omeostasi ed energia', lessons: '1–3' },
    { id: 'membrana', title: 'La membrana cellulare', lessons: '4–5' },
    { id: 'flussi', title: 'Flussi, permeabilità e osmosi', lessons: '6–9' },
    { id: 'canali', title: 'Canali ionici e trasporti', lessons: '9–12' },
    { id: 'potenziale', title: 'Potenziale di membrana', lessons: '13–15' },
    { id: 'elettro', title: 'Banco di elettrofisiologia e potenziale d\'azione', lessons: '16–21, 28' },
    { id: 'sinapsi', title: 'Sinapsi e integrazione', lessons: '22–26' },
    { id: 'sensoriale', title: 'Sistema somatosensoriale', lessons: '29' },
    { id: 'rene', title: 'Bilancio idrico e rene', lessons: '30' }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);
