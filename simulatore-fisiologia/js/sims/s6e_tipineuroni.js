/* I tipi di neuroni (lezione 21): afferenti (bipolari e a T), efferenti (Golgi tipo I: motoneuroni α, piramidali),
   interneuroni (Golgi tipo II). Schemi qualitativi fedeli alla slide; i puntini mostrano il verso del segnale. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  var TYPES = {
    t: { name: 'Afferente «a T» (pseudounipolare)', golgi: '', path: 'afferente',
      text: 'Neurone <b>afferente</b>: il soma sta <b>fuori dal sistema nervoso centrale</b> (nei gangli sensitivi). Ha <b>solo due prolungamenti</b> che si <b>fondono in un tratto</b>, a forma di «T»: questo <b>velocizza la conduzione</b>. È il neurone delle vie sensoriali dei nervi spinali (sensibilità di tronco, arti e visceri). Il PdA corre dal recettore al midollo <b>senza passare dal soma</b>.' },
    bi: { name: 'Afferente bipolare', golgi: '', path: 'afferente',
      text: 'Neurone <b>afferente</b> bipolare: il soma sta fuori dal SNC e ha <b>solo due prolungamenti</b>, uno verso la periferia (recettore) e uno verso il centro. Si trova nelle <b>vie nervose sensitive</b>, nei <b>nervi cranici</b> e come neurone primario della <b>via acustico-vestibolare</b>.' },
    mn: { name: 'Motoneurone α (efferente, Golgi tipo I)', golgi: 'tipo I', path: 'efferente',
      text: 'Neurone <b>efferente</b> di <b>tipo I</b> secondo Golgi (<b>neurite lungo</b>), detto anche <b>proiettivo</b>. Il suo neurite forma le <b>fibre nervose motorie</b> e arriva alla fibra muscolare scheletrica. I dendriti ricevono le sinapsi, il soma integra, il neurite conduce il PdA.' },
    pyr: { name: 'Neurone piramidale (efferente, Golgi tipo I)', golgi: 'tipo I', path: 'efferente',
      text: 'Neurone <b>efferente</b> di <b>tipo I</b>: il soma sta nella <b>corteccia somato-motoria</b>; i neuriti formano i <b>fasci piramidali</b> che prendono contatto con i <b>motoneuroni spinali</b>.' },
    inter: { name: 'Interneurone (internunciale, Golgi tipo II)', golgi: 'tipo II', path: 'interneurone',
      text: 'Neurone di <b>tipo II</b> secondo Golgi: <b>neurite breve e ramificato</b>. Gli <b>interneuroni</b> (internunciali) sono circa il <b>99%</b> dei neuroni dell\'asse cerebro-spinale dei Vertebrati. Stabiliscono <b>connessioni multiple</b>: è la base delle <b>funzioni associative</b> (memoria, apprendimento, funzioni psichiche).' }
  };

  F.registerSim('tipineuroni', {
    title: 'I tipi di neuroni: afferenti, efferenti e interneuroni',
    section: 'elettro',
    short: 'Neuroni afferenti (bipolari e a T), efferenti di tipo I (motoneuroni α, piramidali) e interneuroni di tipo II (≈ 99%): forma, funzione e verso del segnale.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { type: P.type || 't', flow: true };
      var sel = U.seg({ label: 'Tipo di neurone', value: st.type, options: [['t', 'Afferente a T'], ['bi', 'Afferente bipolare'], ['mn', 'Motoneurone α'], ['pyr', 'Piramidale'], ['inter', 'Interneurone']], onChange: function (v) { st.type = v; redraw(); } });
      var tFlow = U.toggle({ label: 'Mostra il verso del segnale', value: true, onChange: function (v) { st.flow = v; } });
      L.controls.appendChild(sel.el); L.controls.appendChild(tFlow.el);
      L.controls.appendChild(U.params('Disegni schematici e non in scala. Classificazione secondo la slide: <b>funzionale</b> (afferenti, efferenti, interneuroni) e <b>di Golgi</b> (tipo I: neurite lungo; tipo II: neurite breve e ramificato). Schema base di comunicazione: recettore → neurone → effettore.'));
      var info = el('div', { class: 'box', style: { marginTop: '10px' } });
      var tm = 0;
      var BL = '#4f86d0', PU = '#8e6cc4', OR = '#e8913a', MY = '#f3ecd0';

      function line(ctx, pts, w, col, outlineCol) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        [[w + 2.4, outlineCol], [w, col]].forEach(function (p) { ctx.strokeStyle = p[1]; ctx.lineWidth = p[0]; ctx.beginPath(); pts.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](q[0], q[1]); }); ctx.stroke(); });
      }
      function soma(ctx, x, y, r, outline) {
        ctx.beginPath(); for (var i = 0; i <= 36; i++) { var a = i / 36 * 6.2832, k = 1 + 0.06 * Math.sin(3 * a + 1) + 0.04 * Math.sin(5 * a); ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r * k, y + Math.sin(a) * r * k); } ctx.closePath();
        ctx.fillStyle = PU; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - r * 0.1, y, r * 0.42, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(70,40,110,0.8)'; ctx.beginPath(); ctx.arc(x, y - r * 0.04, r * 0.12, 0, 6.283); ctx.fill();
      }
      function myelin(ctx, x0, x1, y, outline, n) {
        var L2 = (x1 - x0) / n;
        for (var i = 0; i < n; i++) { var a = x0 + i * L2 + 3, b = x0 + (i + 1) * L2 - 3; ctx.fillStyle = MY; ctx.strokeStyle = 'rgba(150,134,84,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(a, y - 7, b - a, 14, 5) : ctx.rect(a, y - 7, b - a, 14); ctx.fill(); ctx.stroke(); }
      }
      function label(ctx, t, x, y, align, col, size) { ctx.font = (size || 12) + 'px ' + U.css('--font'); ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.fillText(t, x, y); }
      function box(ctx, x, y, w, h, fill, stroke) { ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
      function dots(ctx, path, t, col) {
        // puntini che percorrono un percorso poligonale; path = [[x,y],...]
        var len = 0, seg = [], i; for (i = 0; i < path.length - 1; i++) { var d = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); seg.push(d); len += d; }
        for (var k = 0; k < 4; k++) {
          var u = ((t * 0.18 + k / 4) % 1) * len, acc = 0;
          for (i = 0; i < seg.length; i++) { if (u <= acc + seg[i]) { var f = (u - acc) / seg[i]; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f, 4.2, 0, 6.283); ctx.fill(); break; } acc += seg[i]; }
        }
      }

      function drawType(ctx, w, h, t) {
        ctx.clearRect(0, 0, w, h);
        var css = U.css, muted = css('--muted'), txt = css('--text');
        var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (document.documentElement.getAttribute('data-theme') !== 'light' && G.matchMedia && G.matchMedia('(prefers-color-scheme: dark)').matches);
        var ol = dark ? 'rgba(220,225,235,0.45)' : 'rgba(40,50,70,0.55)', gray = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', stroke = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', fl = [], s = Math.max(0.72, Math.min(1.1, w / 700));
        var cy = h * 0.5;
        if (st.type === 't') {
          var tx = w * 0.58, ty = cy + 30 * s;
          box(ctx, w * 0.84, 20, w * 0.14, h - 40, gray, stroke); label(ctx, 'midollo spinale (SNC)', w * 0.91, 36, 'center', muted, 11);
          line(ctx, [[w * 0.12, ty], [tx, ty], [w * 0.86, ty]], 5 * s, OR, ol);
          line(ctx, [[tx, ty], [tx, cy - 62 * s]], 5 * s, OR, ol); soma(ctx, tx, cy - 82 * s, 24 * s, ol);
          myelin(ctx, w * 0.18, w * 0.54, ty, ol, 4); myelin(ctx, w * 0.62, w * 0.8, ty, ol, 2);
          // recettore (corpuscolo)
          ctx.fillStyle = 'rgba(214,120,100,0.65)'; ctx.strokeStyle = ol; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(w * 0.09, ty, 22 * s, 15 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
          label(ctx, 'recettore', w * 0.09, ty + 34 * s, 'center', muted, 11); label(ctx, 'prolungamento periferico', w * 0.3, ty + 34 * s, 'center', muted, 11); label(ctx, 'prolungamento centrale', w * 0.72, ty + 34 * s, 'center', muted, 11);
          label(ctx, 'soma (ganglio sensitivo, fuori dal SNC)', tx + 36 * s, cy - 84 * s, 'left', muted, 11); label(ctx, 'i due prolungamenti si fondono: «T»', tx + 8, cy - 26 * s, 'left', muted, 11);
          fl = [[w * 0.12, ty], [tx, ty], [w * 0.86, ty]];
        } else if (st.type === 'bi') {
          var sx = w * 0.5;
          box(ctx, w * 0.86, 20, w * 0.12, h - 40, gray, stroke); label(ctx, 'SNC', w * 0.92, 36, 'center', muted, 11);
          line(ctx, [[w * 0.12, cy], [sx - 28 * s, cy]], 5 * s, OR, ol); myelin(ctx, w * 0.16, sx - 38 * s, cy, ol, 3); line(ctx, [[sx + 28 * s, cy], [w * 0.88, cy]], 5 * s, OR, ol);
          myelin(ctx, sx + 40 * s, w * 0.84, cy, ol, 3); soma(ctx, sx, cy, 28 * s, ol);
          ctx.fillStyle = 'rgba(214,120,100,0.65)'; ctx.strokeStyle = ol; ctx.beginPath(); ctx.ellipse(w * 0.09, cy, 22 * s, 15 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
          label(ctx, 'recettore (organo di senso)', w * 0.09, cy + 36 * s, 'center', muted, 11); label(ctx, 'prolungamento periferico', w * 0.3, cy - 14 * s, 'center', muted, 11); label(ctx, 'soma', sx, cy + 46 * s, 'center', muted, 11); label(ctx, 'prolungamento centrale', w * 0.7, cy - 18 * s, 'center', muted, 11);
          fl = [[w * 0.12, cy], [sx, cy], [w * 0.88, cy]];
        } else if (st.type === 'mn') {
          var mx = w * 0.17;
          [[-0.9, -0.6], [-0.2, -1], [0.7, -0.9], [-1, 0.2], [-0.5, 0.95], [0.6, 0.95]].forEach(function (d, i) {
            var x1 = mx + d[0] * 62 * s, y1 = cy + d[1] * 62 * s; line(ctx, [[mx, cy], [mx + d[0] * 30 * s, cy + d[1] * 30 * s], [x1, y1]], 4.5 * s, BL, ol);
            line(ctx, [[x1, y1], [x1 + d[0] * 18 * s - d[1] * 10 * s, y1 + d[1] * 18 * s + d[0] * 10 * s]], 2.4 * s, BL, ol); line(ctx, [[x1, y1], [x1 + d[0] * 18 * s + d[1] * 10 * s, y1 + d[1] * 18 * s - d[0] * 10 * s]], 2.4 * s, BL, ol);
          });
          line(ctx, [[mx + 26 * s, cy], [w * 0.8, cy]], 4 * s, OR, ol); myelin(ctx, mx + 64 * s, w * 0.78, cy, ol, 6); soma(ctx, mx, cy, 30 * s, ol);
          // fibra muscolare
          box(ctx, w * 0.8, cy - 24 * s, w * 0.18, 48 * s, 'rgba(224,120,108,0.4)', stroke); for (var q = 1; q < 6; q++) { ctx.strokeStyle = stroke; ctx.beginPath(); ctx.moveTo(w * 0.8 + q * w * 0.03, cy - 24 * s); ctx.lineTo(w * 0.8 + q * w * 0.03, cy + 24 * s); ctx.stroke(); }
          label(ctx, 'fibra muscolare scheletrica', w * 0.89, cy + 42 * s, 'center', muted, 11); label(ctx, 'dendriti', mx, cy - 86 * s, 'center', muted, 11); label(ctx, 'soma (nel corno ventrale)', mx, cy + 100 * s, 'center', muted, 11); label(ctx, 'neurite lungo → fibre nervose motorie', w * 0.46, cy - 18 * s, 'center', muted, 11);
          fl = [[mx - 40 * s, cy - 50 * s], [mx, cy], [w * 0.8, cy]];
        } else if (st.type === 'pyr') {
          var px = w * 0.2, py = h * 0.36;
          // dendrite apicale e basali
          line(ctx, [[px, py - 14 * s], [px, h * 0.08]], 6 * s, BL, ol); [[-26, -22], [26, -34], [0, -14]].forEach(function (b) { line(ctx, [[px, h * 0.09], [px + b[0] * s, h * 0.09 + b[1] * s]], 3 * s, BL, ol); });
          [[-1, 0.35], [-0.45, 0.8], [0.45, 0.8], [1, 0.35]].forEach(function (d) { line(ctx, [[px, py + 8 * s], [px + d[0] * 48 * s, py + d[1] * 48 * s]], 4 * s, BL, ol); });
          ctx.beginPath(); ctx.moveTo(px, py - 30 * s); ctx.lineTo(px + 26 * s, py + 18 * s); ctx.lineTo(px - 26 * s, py + 18 * s); ctx.closePath(); ctx.fillStyle = PU; ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(px, py, 7 * s, 0, 6.283); ctx.fill(); ctx.stroke();
          box(ctx, w * 0.6, h * 0.08, w * 0.38, 26, gray, stroke); label(ctx, 'corteccia somato-motoria', w * 0.79, h * 0.08 + 17, 'center', muted, 11);
          var ap = [[px, py + 22 * s], [px, h * 0.82], [w * 0.8, h * 0.82]];
          line(ctx, ap, 4 * s, OR, ol); myelin(ctx, px + 20, w * 0.74, h * 0.82, ol, 5);
          ctx.fillStyle = 'rgba(142,108,196,0.7)'; ctx.strokeStyle = ol; ctx.beginPath(); ctx.arc(w * 0.88, h * 0.82, 20 * s, 0, 6.283); ctx.fill(); ctx.stroke();
          [[0.5, -1], [0.1, -1.2], [0.9, -0.8]].forEach(function (d) { line(ctx, [[w * 0.88, h * 0.82 - 16 * s], [w * 0.88 + (d[0] - 0.5) * 50 * s, h * 0.82 - 36 * s]], 2.4 * s, BL, ol); });
          line(ctx, [[w * 0.8, h * 0.82], [w * 0.8 + 12, h * 0.82 - 16 * s]], 3 * s, OR, ol);
          label(ctx, 'dendrite apicale', px + 12, h * 0.07, 'left', muted, 11); label(ctx, 'soma piramidale', px + 36 * s, py + 4, 'left', muted, 11); label(ctx, 'neurite → fasci piramidali', w * 0.4, h * 0.82 - 16, 'center', muted, 11);
          label(ctx, 'motoneurone spinale', w * 0.88, h * 0.82 - 50 * s, 'center', muted, 11);
          fl = [[px - 40 * s, py + 40 * s], [px, py], [px, h * 0.82], [w * 0.8, h * 0.82]];
        } else {
          var ix = w * 0.4;
          [[-1, -0.7], [-0.3, -1], [0.6, -0.9], [-1, 0.4], [-0.6, 0.95], [0.5, 0.9]].forEach(function (d) { line(ctx, [[ix, cy], [ix + d[0] * 56 * s, cy + d[1] * 56 * s]], 3.6 * s, BL, ol); });
          soma(ctx, ix, cy, 26 * s, ol);
          // neurite breve e ramificato che contatta altri neuroni
          var br = [[ix + 24 * s, cy], [ix + 84 * s, cy - 10 * s]]; line(ctx, br, 4 * s, OR, ol);
          [[1, -1.2], [1.4, 0.2], [1, 1.1], [0.2, -0.9], [0.5, 1.2]].forEach(function (d, i) {
            var bx = ix + 84 * s, by = cy - 10 * s, x1 = bx + d[0] * 64 * s, y1 = by + d[1] * 40 * s; line(ctx, [[bx, by], [x1, y1]], 2.8 * s, OR, ol);
            ctx.fillStyle = OR; ctx.beginPath(); ctx.arc(x1, y1, 4.5 * s, 0, 6.283); ctx.fill();
            ctx.fillStyle = 'rgba(142,108,196,0.45)'; ctx.strokeStyle = ol; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x1 + 20 * s, y1, 14 * s, 0, 6.283); ctx.fill(); ctx.stroke();
          });
          label(ctx, 'dendriti', ix - 70 * s, cy - 70 * s, 'center', muted, 11); label(ctx, 'soma', ix, cy + 44 * s, 'center', muted, 11); label(ctx, 'neurite breve e ramificato', ix + 150 * s, cy - 70 * s, 'center', muted, 11);
          label(ctx, 'altri neuroni (connessioni multiple)', ix + 160 * s, cy + 100 * s, 'center', muted, 11);
          fl = [[ix - 56 * s, cy - 40 * s], [ix, cy], [ix + 84 * s, cy - 10 * s], [ix + 150 * s, cy + 30 * s]];
        }
        if (st.flow && fl.length) dots(ctx, fl, t, css('--bad'));
        label(ctx, st.type === 't' || st.type === 'bi' ? 'recettore → prolungamento periferico → prolungamento centrale → SNC' : 'dendriti → soma → neurite → terminali', 10, h - 10, 'left', muted, 11);
        label(ctx, TYPES[st.type].golgi ? 'Golgi: ' + TYPES[st.type].golgi : '', w - 10, h - 10, 'right', txt, 12);
      }
      var cv = U.canvas2d(L.main, function (w) { return Math.round(Math.max(250, Math.min(330, w * 0.4))); }, function (ctx, w, h) { drawType(ctx, w, h, tm); });
      L.main.appendChild(info);
      function redraw() { info.innerHTML = '<b>' + TYPES[st.type].name + '</b><br>' + TYPES[st.type].text; cv.redraw(); }
      var loop = U.loop(L.main, function (dt) { tm += dt; cv.redraw(); });
      redraw();

      /*EXPLAIN-START*/
      U.explainer(L, {
        legend: [[BL, 'dendriti (ricevono i segnali)'], [PU, 'soma (integra, rifornisce di proteine)'], [OR, 'neurite/assone (conduce il PdA)'], ['#f3ecd0', 'guaina di mielina'], ['#d94a3d', 'puntini rossi: verso del segnale']],
        narrate: function () {
          return TYPES[st.type].text + ' <i>Classificazione di Golgi:</i> tipo I = neurite lungo, tipo II = neurite breve e ramificato. Schema base di comunicazione: <b>recettore → neurone → effettore</b>.';
        },
        experiments: [
          { label: 'Afferente a T', run: function () { sel.set('t'); }, why: 'Il PdA va dal recettore al midollo lungo i due prolungamenti fusi: il soma è fuori dalla via di conduzione, il che velocizza la trasmissione.' },
          { label: 'Afferente bipolare', run: function () { sel.set('bi'); }, why: 'Il soma sta sulla via di conduzione, tra i due prolungamenti. È il neurone primario di alcune vie sensoriali (acustico-vestibolare).' },
          { label: 'Motoneurone α', run: function () { sel.set('mn'); }, why: 'Neurone efferente di tipo I: il neurite lungo forma le fibre nervose motorie e termina sulla fibra muscolare.' },
          { label: 'Piramidale', run: function () { sel.set('pyr'); }, why: 'Efferente di tipo I della corteccia somato-motoria: i suoi neuriti formano i fasci piramidali che contattano i motoneuroni spinali.' },
          { label: 'Interneurone', run: function () { sel.set('inter'); }, why: 'Tipo II: neurite breve e ramificato, connessioni multiple. Sono circa il 99% dei neuroni dell\'asse cerebro-spinale.' }
        ]
      });
      /*EXPLAIN-END*/
      return { destroy: function () { loop.stop(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
