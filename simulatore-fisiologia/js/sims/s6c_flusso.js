/* Flusso assonico (lezione 21): proteine motrici sui microtubuli. Modello qualitativo: fedele alla slide, senza velocità reali. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  F.registerSim('flussoassonico', {
    title: 'Flusso assonico: le proteine motrici sui microtubuli',
    section: 'elettro',
    short: 'Il soma rifornisce di proteine tutto il neurone: chinesina e dineina camminano sui microtubuli (flusso rapido, anterogrado e retrogrado); il flusso lento trasporta elementi del citoscheletro. Schema qualitativo: la velocità di riproduzione serve solo a vedere.',
    mount: function (host, P) {
      var L = U.simLayout(host), st = { fa: P.fa !== false, fr: P.fr !== false, sl: !!P.sl, tox: !!P.tox, speed: 1 };
      var tFA = U.toggle({ label: 'Flusso rapido anterogrado (vescicole e organelli)', value: st.fa, onChange: function (v) { st.fa = v; } });
      var tFR = U.toggle({ label: 'Flusso rapido retrogrado (fattori neurotrofici)', value: st.fr, onChange: function (v) { st.fr = v; } });
      var tTox = U.toggle({ label: 'Virus e tossine neurotossiche nel flusso retrogrado', value: st.tox, onChange: function (v) { st.tox = v; } });
      var tSL = U.toggle({ label: 'Flusso lento (citoscheletro e proteine solubili, come l\'actina)', value: st.sl, onChange: function (v) { st.sl = v; } });
      var sSp = U.slider({ label: 'Velocità di riproduzione (il flusso lento resta molto più lento del rapido)', min: 0.2, max: 3, step: 0.1, value: 1, digits: 1, unit: '×', onInput: function (v) { st.speed = v; } });
      [tFA.el, tFR.el, tTox.el, tSL.el, sSp.el].forEach(function (e) { L.controls.appendChild(e); });
      L.controls.appendChild(U.params('Schema qualitativo del flusso assonico secondo la slide: <b>flusso rapido</b> (anterogrado e retrogrado) di vescicole e organelli, mediato da proteine motrici come <b>chinesina</b> e <b>dineina</b> che camminano sui microtubuli; la componente retrograda porta al nucleo i fattori neurotrofici assunti per endocitosi dalle terminazioni (ruolo cruciale nella rigenerazione delle fibre) e muove anche virus e tossine neurotossiche. <b>Flusso lento</b>: materiale non delimitato da membrane, soprattutto elementi del citoscheletro associati a proteine solubili come l\'actina, probabilmente solo anterogrado, con una proteina motrice come la dineina. Nei testi di biologia cellulare la chinesina cammina verso l\'estremità + dei microtubuli (periferia) e la dineina verso l\'estremità − (soma): non è scritto nella slide. Le velocità non sono quelle reali.'));
      var host2 = el('div'); L.main.appendChild(host2);

      // cariche: posizioni normalizzate lungo l'assone (0 = soma, 1 = terminale)
      function make(n, off) { var a = []; for (var i = 0; i < n; i++) a.push((i + off) / n); return a; }
      var cargo = { va: make(7, 0.2), vr: make(5, 0.6), tox: make(3, 0.1), sl: make(12, 0.4) };
      var phase = 0;

      var cv = U.canvas2d(host2, 250, function (ctx, w, h) {
        var css = U.css, x0 = 120, x1 = w - 90, cy = 120, th = 66;
        ctx.clearRect(0, 0, w, h);
        // soma e terminale
        ctx.fillStyle = css('--surface-3'); ctx.strokeStyle = css('--border'); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(62, cy, 50, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css('--c4'); ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(54, cy - 6, 17, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = css('--text'); ctx.font = '11px ' + css('--font'); ctx.textAlign = 'center';
        ctx.fillText('nucleo', 54, cy - 3); ctx.fillText('soma', 62, cy + 40);
                // assone
        ctx.fillStyle = css('--surface-2'); ctx.strokeStyle = css('--border');
        ctx.beginPath(); ctx.rect(x0 - 20, cy - th / 2, x1 - x0 + 30, th); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w - 56, cy, 40, 40, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css('--muted'); ctx.textAlign = 'right'; ctx.fillText('terminazione assonica', w - 8, cy + 62);
        ctx.textAlign = 'left'; ctx.fillText('assone', x0 + 4, cy - th / 2 - 8);
        // microtubuli (rotaie)
        var yu = cy - 12, yd = cy + 12;
        ctx.strokeStyle = css('--faint'); ctx.lineWidth = 3; ctx.lineCap = 'round';
        [yu, yd].forEach(function (y) { ctx.beginPath(); ctx.moveTo(x0 - 14, y); ctx.lineTo(x1 + 10, y); ctx.stroke(); });
        ctx.lineWidth = 1; ctx.fillStyle = css('--faint'); ctx.textAlign = 'left'; ctx.fillText('microtubuli (rotaie)', x0 - 14, cy + th / 2 + 14);
        function X(f) { return x0 + (x1 - x0) * f; }
        function walker(x, y, col, dir, label, first) {
          var leg = Math.sin(phase * 6 + x * 0.2) * 4;
          ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x - 3 + leg * dir, y + (y < cy ? 10 : -10)); ctx.moveTo(x, y); ctx.lineTo(x + 3 - leg * dir, y + (y < cy ? 10 : -10)); ctx.stroke();
          if (first && label) { ctx.fillStyle = col; ctx.font = '600 11px ' + css('--font'); ctx.textAlign = 'center'; ctx.fillText(label, x, y + (y < cy ? -14 : 24)); ctx.font = '11px ' + css('--font'); }
        }
        // flusso lento: segmenti di citoscheletro e puntini di actina
        if (st.sl) cargo.sl.forEach(function (f, i) {
          var x = X(f); ctx.strokeStyle = css('--ca'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, cy - 3 + (i % 3) * 3 - 3); ctx.lineTo(x + 12, cy - 3 + (i % 3) * 3 - 3); ctx.stroke();
          ctx.fillStyle = css('--muted'); ctx.beginPath(); ctx.arc(x + 4, cy + 2 + (i % 2) * 6, 2.5, 0, 6.283); ctx.fill();
        });
        if (st.sl) { ctx.fillStyle = css('--ca'); ctx.textAlign = 'right'; ctx.fillText('giallo: citoscheletro e actina (lento)', x1 + 10, cy - th / 2 - 4); }
        if (st.fa) cargo.va.forEach(function (f, i) { var x = X(f); walker(x, yu, css('--c1'), 1, 'chinesina', i === 0); ctx.fillStyle = css('--c1'); ctx.beginPath(); ctx.arc(x, yu - 11, 7, 0, 6.283); ctx.fill(); });
        if (st.fr) cargo.vr.forEach(function (f, i) { var x = X(f); walker(x, yd, css('--c3'), -1, 'dineina', i === 0); ctx.fillStyle = css('--c3'); ctx.beginPath(); ctx.arc(x, yd + 11, 6, 0, 6.283); ctx.fill(); });
        if (st.tox) cargo.tox.forEach(function (f) { var x = X(f); walker(x, yd, css('--bad'), -1, '', false); ctx.fillStyle = css('--bad'); ctx.fillRect(x - 5, yd + 6, 10, 10); });
        // frecce di direzione
        ctx.lineWidth = 1.5;
        if (st.fa) U.arrow(ctx, x0 + 10, cy - th / 2 - 22, x0 + 90, cy - th / 2 - 22, css('--c1'), 2, 9);
        if (st.fr) U.arrow(ctx, x1 - 10, cy + th / 2 + 16, x1 - 90, cy + th / 2 + 16, css('--c3'), 2, 9);
        ctx.font = '11px ' + css('--font'); ctx.textAlign = 'left';
        if (st.fa) { ctx.fillStyle = css('--c1'); ctx.fillText('anterogrado: dal soma alla periferia', x0 + 96, cy - th / 2 - 18); }
        if (st.fr) { ctx.fillStyle = css('--c3'); ctx.textAlign = 'right'; ctx.fillText('retrogrado: dalla periferia al soma', x1 - 96, cy + th / 2 + 20); }
      });
      var loop = U.loop(host2, function (dt) {
        var v = 0.16 * st.speed; phase += dt * st.speed;
        function adv(arr, d, speed) { for (var i = 0; i < arr.length; i++) { arr[i] += d * speed * dt; if (arr[i] > 1) arr[i] -= 1; if (arr[i] < 0) arr[i] += 1; } }
        adv(cargo.va, 1, v); adv(cargo.vr, -1, v); adv(cargo.tox, -1, v); adv(cargo.sl, 1, v / 30);
        cv.redraw();
      });

      /*EXPLAIN-START*/
      U.explainer(L, {
        legend: [['--c1', 'blu: vescicole e organelli (rapido, anterogrado)'], ['--c3', 'verde: fattori neurotrofici (rapido, retrogrado)'], ['--bad', 'rosso: virus e tossine neurotossiche'], ['--ca', 'giallo: citoscheletro e actina (lento)']],
        narrate: function () {
          var s = `Il <b>soma</b> contiene nucleo, mitocondri e un sistema ribosomale sviluppato; i dendriti e il neurite sono ricchi solo di microtubuli e neurofilamenti. Perciò il soma rifornisce di proteine tutto il neurone con un intenso trasporto di materiale verso la periferia: il <b>flusso assonico</b>. `;
          if (!st.fa && !st.fr && !st.sl && !st.tox) return s + `Ora nessun flusso è acceso: accendine uno per vedere cosa trasporta.`;
          if (st.fa || st.fr) s += `Il <b>flusso rapido</b> convoglia vescicole e organelli ed è mediato da proteine motrici come la <b>chinesina</b> e la <b>dineina</b>, che «camminano» sui microtubuli del citoscheletro. `;
          if (st.fa && !st.fr) s += `Qui vedi solo la componente <b>anterograda</b> (dal soma alla periferia). Per convenzione nei testi di biologia cellulare è il verso della chinesina. `;
          if (st.fr) s += `La componente <b>retrograda</b> riporta al nucleo i <b>fattori neurotrofici</b> assunti per endocitosi dalle terminazioni assoniche e ha un ruolo cruciale nella rigenerazione delle fibre. Per convenzione nei testi è il verso della dineina. `;
          if (st.tox) s += `Questo flusso retrogrado trasporta anche <b>virus e tossine neurotossiche</b>: è la via con cui possono raggiungere il corpo del neurone a partire dalle terminazioni. `;
          if (st.sl) s += `Il <b>flusso lento</b> trasporta materiale non delimitato da membrane, soprattutto elementi del citoscheletro associati a proteine solubili come l\'actina; è probabilmente solo anterogrado e la slide indica il coinvolgimento di una proteina motrice come la <b>dineina</b>. È molto più lento del rapido: qui è rallentato di circa 30 volte, solo per renderlo visibile.`;
          return s;
        },
        experiments: [
          { label: 'Flusso rapido nei due versi', run: function () { tFA.set(true); tFR.set(true); tTox.set(false); tSL.set(false); }, why: `Vescicole e organelli vanno verso la periferia; i fattori neurotrofici tornano al soma. I motori camminano sui microtubuli, che fanno da rotaie.` },
          { label: 'Solo anterogrado rapido', run: function () { tFA.set(true); tFR.set(false); tTox.set(false); tSL.set(false); }, why: `Rifornisce la periferia: il soma è l\'unico a contenere nucleo e ribosomi, quindi proteine e organelli devono essere spediti verso l\'assone e la terminazione.` },
          { label: 'Solo retrogrado: fattori neurotrofici', run: function () { tFA.set(false); tFR.set(true); tTox.set(false); tSL.set(false); }, why: `Le terminazioni assumono fattori neurotrofici per endocitosi e il flusso retrogrado rapido li porta al nucleo: è un trasporto cruciale per la rigenerazione delle fibre.` },
          { label: 'Virus e tossine tornano al soma', run: function () { tFA.set(false); tFR.set(true); tTox.set(true); tSL.set(false); }, why: `Il flusso retrogrado muove anche virus e tossine neurotossiche: partono dalle terminazioni e possono raggiungere il corpo cellulare.` },
          { label: 'Flusso lento', run: function () { tFA.set(false); tFR.set(false); tTox.set(false); tSL.set(true); }, why: `Trasporta materiale non delimitato da membrane (elementi del citoscheletro con proteine solubili come l\'actina), probabilmente solo anterogrado: è il flusso che rinnova la «struttura» dell\'assone.` },
          { label: 'Tutto insieme', run: function () { tFA.set(true); tFR.set(true); tTox.set(true); tSL.set(true); }, why: `Nel neurone reale i flussi coesistono: due trasporti rapidi (anterogrado e retrogrado) e uno lento, probabilmente solo anterogrado.` }
        ]
      });
      /*EXPLAIN-END*/
      return { destroy: function () { loop.stop(); cv.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
