(function (G) { 'use strict'; var F = G.Fisio;
F.LESSONS = [
 { id: '01', num: '01', title: 'Introduzione: omeostasi', card: 'prova', src: '01.ppt', oneliner: 'Prova $E=mc^2$', points: ['a', 'b $x^2$'], formulas: [{ label: 'Errore', tex: 'e = \\frac{d}{1+K}' }],
   sims: [{ id: 'feedback', preset: {}, predict: { q: 'Domanda?', options: ['a', 'b'], answer: 0, why: 'perché' }, observe: 'osserva' }, { id: 'glicemia' }, { id: 'compartimenti' }],
   quiz: [{ q: 'Q1', options: ['x', 'y'], answer: 1, why: 'w' }], related: ['02'] },
 { id: '02', num: '02', title: 'Energia', oneliner: 'x', points: ['p'], sims: [{ id: 'energia' }, { id: 'energia', preset: { mode: 'glucosio' } }] }
]; })(globalThis);
