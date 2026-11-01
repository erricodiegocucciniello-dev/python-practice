/* Schemi animati per i simulatori delle sinapsi (lezioni 22–26).
   Ogni funzione crea un canvas, restituisce {set(stato), restart(), dispose()}; il disegno si anima da solo
   e usa i numeri calcolati dal simulatore (potenziali, conduttanze, [DA], probabilità di rilascio…).
   Sono schemi qualitativi e non in scala (le sinapsi vere misurano nanometri). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui;
  var figs = F.figs = {};

  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  var STOPS = [[-85, 52, 102, 190], [-65, 142, 162, 192], [-52, 236, 192, 92], [-25, 240, 128, 56], [5, 222, 60, 42], [35, 255, 38, 28]];
  function vcol(V, a) {
    var i = 0, r, g, b;
    if (V <= STOPS[0][0]) { r = STOPS[0][1]; g = STOPS[0][2]; b = STOPS[0][3]; }
    else if (V >= STOPS[STOPS.length - 1][0]) { var q = STOPS[STOPS.length - 1]; r = q[1]; g = q[2]; b = q[3]; }
    else { while (V > STOPS[i + 1][0]) i++; var A = STOPS[i], B = STOPS[i + 1], t = (V - A[0]) / (B[0] - A[0]); r = A[1] + (B[1] - A[1]) * t; g = A[2] + (B[2] - A[2]) * t; b = A[3] + (B[3] - A[3]) * t; }
    return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + (a === undefined ? 1 : a) + ')';
  }
  figs.vcol = vcol;
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || (t !== 'light' && G.matchMedia && G.matchMedia('(prefers-color-scheme: dark)').matches); }
  function text(ctx, str, x, y, align, col, size, bold) { ctx.font = (bold ? '600 ' : '') + size + 'px ' + U.css('--font'); ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.fillText(str, x, y); }
  function at(tArr, vArr, t) { if (!tArr || !tArr.length) return 0; var n = tArr.length, k = clamp(Math.round(t / tArr[n - 1] * (n - 1)), 0, n - 1); return vArr[k]; }
  function dotAt(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }

  function make(host, height, draw) {
    var tm = 0, S = {}, cv = U.canvas2d(host, height, function (ctx, w, h) { draw(ctx, w, h, tm, S); });
    var loop = U.loop(host, function (dt) { tm += dt; cv.redraw(); });
    return { el: cv.canvas, state: S, set: function (o) { for (var k in o) S[k] = o[k]; }, restart: function () { tm = 0; }, dispose: function () { loop.stop(); cv.dispose(); } };
  }
  /** Fase di un ciclo: restituisce {u: 0..1 durante la riproduzione, on}; il ciclo dura 'period' s, 'play' è la frazione attiva. */
  function phase(tm, period, play) { var p = (tm % period) / period; return { u: clamp(p / play, 0, 1), on: p < play }; }

  // ================================================================ Sinapsi elettrica vs chimica
  figs.synapse = function (host) {
    return make(host, function (w) { return Math.round(clamp(w * 0.36, 210, 270)); }, function (ctx, w, h, tm, S) {
      ctx.clearRect(0, 0, w, h);
      if (!S.V1) return;
      var css = U.css, muted = css('--muted'), txt = css('--text'), dark = isDark(), cx = w / 2, cy = h / 2, s = clamp(w / 700, 0.7, 1.1);
      var chem = S.type === 'ch', gh = (chem ? 30 : 12) * s, ph = phase(tm, 6, 0.75), tt = ph.u * S.tmax;
      var V1 = at(S.t1, S.V1, tt), V2 = at(S.t2, S.V2, tt), outline = dark ? 'rgba(220,225,235,0.45)' : 'rgba(40,50,70,0.55)';
      // cellule
      function cell(x0, x1, V, facing, label) {
        ctx.beginPath();
        var r = 34 * s, y0 = 22, y1 = h - 22;
        if (facing > 0) { ctx.moveTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0 + r, y1); ctx.quadraticCurveTo(x0, y1, x0, y1 - r); }
        else { ctx.moveTo(x1, y0 + r); ctx.quadraticCurveTo(x1, y0, x1 - r, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1 - r, y1); ctx.quadraticCurveTo(x1, y1, x1, y1 - r); }
        ctx.closePath(); ctx.fillStyle = vcol(V, 0.88); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 2; ctx.stroke();
        var nx = facing > 0 ? x0 + 60 * s : x1 - 60 * s;
        ctx.fillStyle = dark ? 'rgba(20,20,30,0.25)' : 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(nx, cy + 38 * s, 22 * s, 18 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        text(ctx, label, facing > 0 ? x0 + 16 : x1 - 16, 42, facing > 0 ? 'left' : 'right', txt, 13, true);
        text(ctx, 'Vm = ' + F.fmt(V, 1) + ' mV', facing > 0 ? x0 + 16 : x1 - 16, 60, facing > 0 ? 'left' : 'right', txt, 12);
      }
      var xa = cx - gh, xb = cx + gh;
      if (!chem) {
        cell(8, xa, V1, 1, 'Cellula 1'); cell(xb, w - 8, V2, -1, 'Cellula 2');
        // elettrodo che inietta corrente
        var inj = tt > 5 && tt < 45, from = S.from, ex = from === 1 ? 8 + 80 * s : w - 8 - 80 * s, side = from === 1 ? 1 : -1;
        ctx.strokeStyle = muted; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex - 28 * s * side, 6); ctx.lineTo(ex, cy - 40 * s); ctx.stroke();
        ctx.fillStyle = inj ? css('--bad') : muted; ctx.beginPath(); ctx.arc(ex, cy - 40 * s, 3.5, 0, 6.283); ctx.fill();
        text(ctx, inj ? 'corrente iniettata' : 'elettrodo (a riposo)', ex - 28 * s * side + (side > 0 ? 6 : -6), 16, side > 0 ? 'left' : 'right', inj ? css('--bad') : muted, 11);
        // connessoni
        var n = 3, ys = [cy - 56 * s, cy, cy + 56 * s], open = clamp(S.gc / 12, 0.08, 1), dV = V1 - V2, dir = dV >= 0 ? 1 : -1;
        var eff = S.rect ? (dir > 0 ? 1 : 0.1) : 1, flow = clamp(Math.abs(dV) / 8, 0, 1) * clamp(S.gc / 10, 0, 1) * eff;
        ctx.strokeStyle = outline; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(xa, 22); ctx.lineTo(xa, h - 22); ctx.moveTo(xb, 22); ctx.lineTo(xb, h - 22); ctx.stroke();
        ctx.fillStyle = dark ? 'rgba(30,30,40,0.55)' : 'rgba(255,255,255,0.65)'; ctx.fillRect(xa, 22, xb - xa, h - 44);
        ys.forEach(function (y, i) {
          var pw = 16 * open * s + 3, hw = 17 * s, hh2 = 44 * s;
          // due emicanali (ciascuno di 6 connessine) e il poro centrale
          [[xa - hw + 1, hw + 2], [xb - 2, hw + 2]].forEach(function (b) {
            ctx.fillStyle = dark ? '#9aa4b8' : '#6b7a99'; rr(ctx, b[0], y - hh2 / 2, b[1], hh2, 3); ctx.fill();
            ctx.fillStyle = vcol(i === 1 ? (V1 + V2) / 2 : (V1 + V2) / 2, 0.9); ctx.fillRect(b[0] + 2, y - pw / 2, b[1] - 4, pw);
          });
          ctx.fillStyle = vcol((V1 + V2) / 2, 0.95); ctx.fillRect(xa, y - pw / 2, xb - xa, pw);
          // cariche che attraversano (frecce)
          for (var k = 0; k < 5; k++) {
            if (flow < 0.03) break;
            var u = ((tm * (0.6 + 1.6 * flow) + k / 4 + i * 0.17) % 1), x = dir > 0 ? xa - hw - 8 + u * (xb - xa + 2 * hw + 16) : xb + hw + 8 - u * (xb - xa + 2 * hw + 16);
            dotAt(ctx, x, y, 3.4 * s, css('--ok'));
          }
        });
        if (S.rect) {
          ctx.fillStyle = css('--warn'); ctx.beginPath(); ctx.moveTo(cx - 6, cy + 74 * s); ctx.lineTo(cx + 6, cy + 80 * s); ctx.lineTo(cx - 6, cy + 86 * s); ctx.closePath(); ctx.fill();
          ctx.fillRect(cx + 6, cy + 73 * s, 2.5, 14 * s); text(ctx, 'rettificante: passa soprattutto 1 → 2', cx, cy + 102 * s, 'center', css('--warn'), 11);
        }
        text(ctx, 'giunzione comunicante: connessoni (emicanali di 6 connessine) e cariche che passano', cx, h - 10, 'center', muted, 11); text(ctx, 'citoplasma', 24, h - 30, 'left', muted, 11); text(ctx, 'citoplasma', w - 24, h - 30, 'right', muted, 11);
        text(ctx, 'fessura 2–4 nm', cx, 14, 'center', muted, 11);
      } else {
        // chimica: presinaptica a sinistra (terminale), recettori a destra
        cell(8, xa, V1, 1, 'Cellula 1 (presinaptica)'); cell(xb, w - 8, V2, -1, 'Cellula 2 (postsinaptica)');
        ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(xa, 22); ctx.lineTo(xa, h - 22); ctx.moveTo(xb, 22); ctx.lineTo(xb, h - 22); ctx.stroke();
        var tRel = S.t0, g = S.from === 1 ? clamp(F.Cable.alpha(tt - tRel, S.tau || 1.5), 0, 1) * 1 : 0, relU = (tt - tRel) / 3;
        var Echem = S.E, fused = S.from === 1 && tt > tRel - 0.2;
        // canali del Ca2+ sulla membrana presinaptica e vescicole
        var ys2 = [cy - 62 * s, cy - 20 * s, cy + 22 * s, cy + 64 * s];
        ys2.forEach(function (y, i) {
          ctx.fillStyle = css('--ca'); ctx.fillRect(xa - 6, y - 6, 6, 12);
          var fusing = fused && relU > 0 && relU < 0.4, vx = xa - 26 * s, vy = y;
          ctx.fillStyle = fusing ? 'rgba(58,166,117,0.35)' : 'rgba(58,166,117,0.9)'; ctx.strokeStyle = outline; ctx.lineWidth = 1.2;
          ctx.setLineDash(fusing ? [3, 3] : []); ctx.beginPath(); ctx.arc(fusing ? xa - 12 * s : vx, vy, 11 * s, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        });
        if (fused && relU > 0 && relU < 3) {
          // trasmettitore che attraversa la fessura
          ys2.forEach(function (y, i) {
            for (var k = 0; k < 5; k++) {
              var u = clamp(relU * 0.8 - hash(i * 7 + k) * 0.3, 0, 1); if (u <= 0) continue;
              var x = xa + 3 + u * (xb - xa - 8), yy = y + (hash(i * 3 + k * 5) - 0.5) * 24 * s * u;
              dotAt(ctx, x, yy, 3.2 * s, 'rgba(58,166,117,1)');
            }
          });
        }
        // recettori postsinaptici (si aprono con g)
        ys2.forEach(function (y, i) {
          ctx.fillStyle = g > 0.05 ? (Echem === 0 ? 'rgba(160,90,220,1)' : 'rgba(40,160,160,1)') : 'rgba(150,120,190,0.8)';
          ctx.fillRect(xb, y - 13 * s, 12 * s, 9 * s); ctx.fillRect(xb, y + 4 * s, 12 * s, 9 * s);
          if (g > 0.05) { // ioni nel poro
            var ion = Echem === 0 ? '#f08a28' : '#1fb7a8';
            for (var k = 0; k < 3; k++) { var u = (tm * 1.6 + k / 3 + i * 0.2) % 1; dotAt(ctx, xb + 14 * s + u * 26 * s, y + (k - 1) * 3, 2.3 * s, ion); }
          }
        });
        text(ctx, 'vescicole con trasmettitore · canali Ca²⁺ (arancio)', xa - 6, h - 10, 'right', muted, 11); text(ctx, 'recettori-canale', xb + 8, h - 10, 'left', muted, 11);
        text(ctx, 'fessura sinaptica 20–40 nm', cx, 14, 'center', muted, 11);
        if (S.from === 1 && g > 0.05) text(ctx, Echem === 0 ? 'Na⁺ entra: depolarizza' : 'Cl⁻ entra: iperpolarizza', xb + 8, cy - 78 * s, 'left', Echem === 0 ? '#c6620a' : '#0e8a80', 11, true);
      }
      // barra del tempo
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; ctx.fillRect(w * 0.3, h - 6, w * 0.4, 3);
      ctx.fillStyle = css('--accent'); ctx.fillRect(w * 0.3, h - 6, w * 0.4 * ph.u, 3);
      text(ctx, 't = ' + F.fmt(tt, 1) + ' ms', w - 10, 16, 'right', txt, 12, true);
    });
  };

  // ================================================================ Potenziale postsinaptico: canale e forza motrice
  figs.channel = function (host) {
    return make(host, function (w) { return Math.round(clamp(w * 0.34, 230, 280)); }, function (ctx, w, h, tm, S) {
      ctx.clearRect(0, 0, w, h);
      if (S.E === undefined) return;
      var css = U.css, muted = css('--muted'), txt = css('--text'), dark = isDark(), s = clamp(w / 700, 0.75, 1.0), cx = w * 0.3, my = h * 0.5;
      var ph = phase(tm, 4.5, 0.8), tt = ph.u * S.tmax, g = clamp(F.Cable.alpha(tt - 10, S.tau || 3), 0, 1.2) * 1;
      var Vm = S.Vh, E = S.E, df = E - Vm, cation = S.ion !== 'cl', up = (cation ? df > 0 : df < 0); // up = ioni verso l'interno
      // membrana (doppio strato) con canale
      var mw = w * 0.52, x0 = cx - mw / 2, thick = 22 * s;
      for (var side = 0; side < 2; side++) {
        var y = my + (side ? 1 : -1) * thick / 2;
        for (var x = x0; x < x0 + mw; x += 9 * s) {
          if (Math.abs(x - cx) < 24 * s) continue;
          ctx.fillStyle = dark ? '#b9a98a' : '#d7c49a'; ctx.beginPath(); ctx.arc(x, y + (side ? 1 : -1) * 4 * s, 3.6 * s, 0, 6.283); ctx.fill();
          ctx.strokeStyle = dark ? '#8c7f66' : '#a8946a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + (side ? 1 : -1) * 6 * s); ctx.lineTo(x, y + (side ? 1 : -1) * 13 * s); ctx.stroke();
        }
      }
      // recettore-canale: 4 subunità con poro; si apre quando g > soglia
      var open = clamp(g, 0, 1), pw = 4 * s + 14 * s * open, ry = my, rh = 62 * s;
      ctx.fillStyle = 'rgba(150,100,205,0.95)'; rr(ctx, cx - 26 * s, ry - rh / 2, 26 * s - pw / 2, rh, 5); ctx.fill(); rr(ctx, cx + pw / 2, ry - rh / 2, 26 * s - pw / 2, rh, 5); ctx.fill();
      // lato extracellulare: trasmettitore legato
      ctx.fillStyle = 'rgba(58,166,117,1)'; if (g > 0.02) { dotAt(ctx, cx - 26 * s, ry - rh / 2 - 6, 4 * s, '#3aa675'); dotAt(ctx, cx + 26 * s, ry - rh / 2 - 6, 4 * s, '#3aa675'); }
      for (var q = 0; q < 6; q++) { var u2 = (tm * 0.35 + hash(q) * 3) % 3; if (tt > 8 && tt < 40 && g < 0.9) dotAt(ctx, cx - 60 * s + hash(q + 9) * 120 * s, my - rh / 2 - 8 - ((u2 < 1 ? u2 : 1) * 0) - hash(q + 4) * 24 * s, 2.5 * s, 'rgba(58,166,117,0.9)'); }
      // ioni che attraversano
      var ionCol = S.ion === 'cl' ? '#1fb7a8' : (S.ion === 'k' ? '#3b6fd4' : '#f08a28');
      var n = Math.round(10 * clamp(g, 0, 1) * clamp(Math.abs(df) / 60, 0.08, 1.2));
      for (var k = 0; k < n; k++) {
        var u = (tm * 1.4 + k / Math.max(1, n) + hash(k) * 0.3) % 1, yy = up ? (my - 70 * s + u * 140 * s) : (my + 70 * s - u * 140 * s);
        dotAt(ctx, cx + (hash(k + 5) - 0.5) * pw * 0.8, yy, 3 * s, ionCol);
      }
      text(ctx, 'esterno (fessura sinaptica)', x0 + 4, my - 84 * s, 'left', muted, 11); text(ctx, 'citoplasma', x0 + 4, my + 78 * s, 'left', muted, 11);
      text(ctx, S.ionLabel || '', cx, h - 8, 'center', ionCol === '#f08a28' ? '#c6620a' : (ionCol === '#3b6fd4' ? '#2a55b8' : '#0e8a80'), 12, true);
      // scala dei potenziali: Vm, E_rev e forza motrice
      var bx = w * 0.62, bw = w * 0.34, by = my - 26, lo = -100, hi = 40, X = function (v) { return bx + (v - lo) / (hi - lo) * bw; };
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'; rr(ctx, bx, by, bw, 12, 6); ctx.fill();
      ctx.strokeStyle = muted; ctx.lineWidth = 1; [-100, -60, -20, 20].forEach(function (v) { ctx.beginPath(); ctx.moveTo(X(v), by + 12); ctx.lineTo(X(v), by + 17); ctx.stroke(); text(ctx, String(v), X(v), by + 29, 'center', muted, 10); });
      ctx.strokeStyle = css('--warn'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(X(Vm), by + 6); ctx.lineTo(X(Vm + (E - Vm) * clamp(g, 0, 1)), by + 6); ctx.stroke();
      dotAt(ctx, X(E), by + 6, 6, css('--ok')); dotAt(ctx, X(Vm), by + 6, 6, css('--c1'));
      text(ctx, 'Vm = ' + F.fmt(Vm, 0) + ' mV', bx, by - 22, 'left', css('--c1'), 12, true);
      text(ctx, 'E rev = ' + F.fmt(E, 0) + ' mV', bx + bw, by - 22, 'right', css('--ok'), 12, true);
      text(ctx, Math.abs(df) < 3 ? 'forza motrice ≈ 0: nessun flusso netto' : 'Vm tende verso E rev (' + (df > 0 ? 'depolarizza' : 'iperpolarizza') + ')', bx + bw / 2, by + 52, 'center', txt, 12);
      text(ctx, 't = ' + F.fmt(tt, 0) + ' ms', w - 10, 16, 'right', txt, 12, true);
    });
  };

  // ================================================================ Sinapsi dopaminergica
  figs.dopamine = function (host) {
    return make(host, function (w) { return Math.round(clamp(w * 0.4, 250, 320)); }, function (ctx, w, h, tm, S) {
      ctx.clearRect(0, 0, w, h);
      if (!S.t) return;
      var css = U.css, muted = css('--muted'), txt = css('--text'), dark = isDark(), s = clamp(w / 700, 0.72, 1.1);
      var period = 7, ph = phase(tm, period, 0.86), tt = ph.u * S.tmax, DA = at(S.t, S.DA, tt), D = S.drug || 'none';
      var outline = dark ? 'rgba(220,225,235,0.45)' : 'rgba(40,50,70,0.55)';
      var ty = h * 0.12, cyl = h * 0.5, bot = h * 0.64; // terminale in alto, fessura al centro, post in basso
      var pk = S.peak || 1, norm = clamp(DA / pk, 0, 1);
      // terminale presinaptico
      var faded = D === 'park' || D === 'ldopa' ? 0.45 : 1;
      ctx.fillStyle = dark ? 'rgba(160,110,200,' + 0.30 * faded + ')' : 'rgba(176,132,214,' + 0.35 * faded + ')'; ctx.strokeStyle = outline; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.1, cyl); ctx.quadraticCurveTo(w * 0.1, ty, w * 0.25, ty); ctx.lineTo(w * 0.75, ty); ctx.quadraticCurveTo(w * 0.9, ty, w * 0.9, cyl); ctx.closePath(); ctx.fill(); ctx.stroke();
      text(ctx, 'terminale dopaminergico' + (D === 'park' || D === 'ldopa' ? ' (−80% dei neuroni)' : ''), w * 0.5, ty + 16, 'center', txt, 12, true);
      // sintesi
      text(ctx, 'tirosina → L-DOPA → DA' + (D === 'ldopa' ? '  (+ L-DOPA somministrata)' : ''), w * 0.5, ty + 33, 'center', D === 'ldopa' ? css('--ok') : muted, 11, D === 'ldopa');
      // vescicole (VMAT) e MAO
      var empty = D === 'res', nV = 6, vy = ty + 62 * s, vr = 11 * s;
      var firing = S.events || [], burst = {};
      firing.forEach(function (te) { var dtm = tt - te; if (dtm >= 0 && dtm < 0.18) burst[Math.floor(hash(te * 13.7) * nV)] = dtm / 0.18; });
      for (var i = 0; i < nV; i++) {
        var vx = w * 0.2 + i * (w * 0.6) / (nV - 1), bu = burst[i];
        ctx.fillStyle = empty ? 'rgba(200,200,210,0.35)' : 'rgba(250,170,60,0.55)'; ctx.strokeStyle = outline; ctx.lineWidth = 1.2;
        ctx.setLineDash(bu !== undefined ? [3, 3] : []); ctx.beginPath(); ctx.arc(vx, vy, vr * (1 + 0.25 * (bu || 0)), 0, 6.283); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        if (!empty && bu === undefined) for (var k = 0; k < 4; k++) dotAt(ctx, vx + (hash(i * 5 + k) - 0.5) * vr * 1.1, vy + (hash(i * 3 + k) - 0.5) * vr * 1.1, 1.6 * s, '#e87d0d');
        if (bu !== undefined && !empty) for (k = 0; k < 6; k++) dotAt(ctx, vx + (hash(i + k * 3) - 0.5) * 30 * s * bu, vy + vr + bu * (cyl - vy - vr + 18 * s) * (0.5 + 0.5 * hash(k + i)), 2.2 * s, '#e87d0d');
        ctx.fillStyle = D === 'res' ? css('--bad') : '#8e44ad'; ctx.fillRect(vx - 2, vy + vr - 3, 4, 6);
      }
      text(ctx, 'vescicole con VMAT' + (D === 'res' ? ' bloccato' : ''), w * 0.5, vy + vr + 16, 'center', D === 'res' ? css('--bad') : muted, 11);
      // MAO (mitocondrio)
      var mx = w * 0.17, my = ty + 108 * s;
      ctx.fillStyle = 'rgba(120,150,110,0.45)'; ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(mx, my, 26 * s, 12 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
      text(ctx, 'MAO' + (D === 'maoi' ? ' ✕' : ''), mx, my + 4, 'center', D === 'maoi' ? css('--bad') : txt, 11, true);
      text(ctx, D === 'maoi' ? 'inibite: DA non degradata' : 'degrada la DA libera', mx, my + 26 * s, 'center', D === 'maoi' ? css('--bad') : muted, 10);
      // DAT sulla membrana del terminale
      var dats = [w * 0.34, w * 0.5, w * 0.66], rev = D === 'amph', blocked = D === 'coc';
      dats.forEach(function (x, i) {
        ctx.fillStyle = blocked ? 'rgba(200,60,50,0.9)' : '#2a8c6d'; rr(ctx, x - 9 * s, cyl - 12 * s, 18 * s, 14 * s, 3); ctx.fill();
        text(ctx, blocked ? '✕' : 'DAT', x, cyl - 1, 'center', '#fff', 9, true);
        if (!blocked) {
          var amp = (rev ? -1 : 1) * norm; // ricaptazione verso l'alto; con anfetamina il trasporto si inverte
          for (var k = 0; k < 2; k++) { var u = (tm * 0.9 + k / 2 + i * 0.3) % 1, y = rev ? cyl + 2 + u * 40 * s : cyl + 40 * s - u * 40 * s; if (norm > 0.04 || rev) dotAt(ctx, x, y, 2.4 * s, '#e87d0d'); }
        }
      });
      var caps = { coc: ['cocaina: DAT bloccato → la DA non viene ricaptata e resta nella fessura', 'bad'], amph: ['anfetamina: DAT inverte il trasporto e la DA esce dal terminale', 'warn'], res: ['reserpina: VMAT bloccato → vescicole vuote, poca DA rilasciata', 'bad'], maoi: ['inibitori delle MAO: la DA non viene degradata → vescicole più cariche', 'warn'], park: ['Parkinson: pochi neuroni dopaminergici → poca DA rilasciata', 'bad'], ldopa: ['L-DOPA: più precursore → più DA sintetizzata nei neuroni rimasti', 'ok'] };
      if (caps[D]) text(ctx, caps[D][0], w * 0.5, h - 34, 'center', css('--' + caps[D][1]), 12, true);
      // fessura sinaptica con puntini di dopamina in numero proporzionale alla [DA]
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)'; ctx.fillRect(w * 0.1, cyl, w * 0.8, bot - cyl);
      var nd = Math.round(norm * 46);
      for (var q = 0; q < nd; q++) {
        var px = w * 0.12 + hash(q * 3.1 + Math.floor(tm * 2)) * w * 0.76, py = cyl + 6 + hash(q * 7.7 + Math.floor(tm * 2)) * (bot - cyl - 12);
        dotAt(ctx, px, py, 2.6 * s, '#e87d0d');
      }
      // neurone postsinaptico con recettori D1/D2
      ctx.fillStyle = vcol(-65 + norm * 12, 0.5); ctx.strokeStyle = outline; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.06, bot); ctx.lineTo(w * 0.94, bot); ctx.lineTo(w * 0.94, h - 10); ctx.lineTo(w * 0.06, h - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      [0.25, 0.42, 0.58, 0.75].forEach(function (f, i) {
        ctx.fillStyle = 'rgba(150,100,205,0.95)'; rr(ctx, w * f - 7 * s, bot - 8 * s, 14 * s, 14 * s, 3); ctx.fill();
        text(ctx, i % 2 ? 'D2' : 'D1', w * f, bot + 22 * s, 'center', muted, 10);
      });
      text(ctx, 'neurone postsinaptico (recettori D1/D2, accoppiati a proteine G)', w * 0.5, h - 14, 'center', txt, 11);
      // indicatore della concentrazione
      text(ctx, '[DA] = ' + F.fmt(DA, 2) + ' µM   ·   t = ' + F.fmt(tt, 1) + ' s', w - 10, 16, 'right', txt, 12, true);
      // scarica: lampi sul terminale
      var near = false; firing.forEach(function (te) { if (tt >= te && tt < te + 0.08) near = true; });
      if (near) { ctx.fillStyle = 'rgba(255,230,120,0.5)'; ctx.fillRect(w * 0.1, ty, w * 0.8, 6); }
    });
  };

  // ================================================================ Giunzione neuromuscolare
  figs.nmj = function (host) {
    return make(host, function (w) { return Math.round(clamp(w * 0.42, 260, 330)); }, function (ctx, w, h, tm, S) {
      ctx.clearRect(0, 0, w, h);
      if (S.p === undefined) return;
      var css = U.css, muted = css('--muted'), txt = css('--text'), dark = isDark(), s = clamp(w / 700, 0.72, 1.1);
      var outline = dark ? 'rgba(220,225,235,0.45)' : 'rgba(40,50,70,0.55)';
      var period = 4.2, ph = phase(tm, period, 0.9), u = ph.u; // 0..1 durante il ciclo
      var ty = h * 0.1, cyl = h * 0.4, bot = h * 0.52, fold = h * 0.82;
      var cycle = Math.floor(tm / period);
      // terminale
      var pre = u > 0.03 && u < 0.12; // PdA presinaptico
      ctx.fillStyle = pre ? 'rgba(255,214,90,0.55)' : (dark ? 'rgba(160,110,200,0.28)' : 'rgba(176,132,214,0.30)'); ctx.strokeStyle = outline; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.08, cyl); ctx.quadraticCurveTo(w * 0.08, ty, w * 0.2, ty); ctx.lineTo(w * 0.8, ty); ctx.quadraticCurveTo(w * 0.92, ty, w * 0.92, cyl); ctx.closePath(); ctx.fill(); ctx.stroke();
      text(ctx, 'terminale del motoneurone', w * 0.5, ty + 16, 'center', txt, 12, true);
      var zones = [0.25, 0.5, 0.75], nV = 3, rec = S.rec === undefined ? 1 : S.rec, p = S.p;
      // vescicole (sinaptiche) agli zone attive: rilascio con probabilità p
      var released = [];
      zones.forEach(function (zx, zi) {
        for (var k = 0; k < nV; k++) {
          var id = zi * nV + k, fuse = hash(id * 9.1 + cycle * 3.7) < p && u > 0.12;
          var vx = w * zx + (k - 1) * 17 * s, vy = cyl - 18 * s - (k % 2) * 4;
          if (fuse && u > 0.14 && u < 0.5) { if (u > 0.16) released.push([vx, cyl, id]); continue; }
          ctx.fillStyle = 'rgba(58,166,117,0.75)'; ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(vx, vy, 7 * s, 0, 6.283); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = css('--ca'); ctx.fillRect(w * zx - 18 * s, cyl - 5, 6, 8); ctx.fillRect(w * zx + 12 * s, cyl - 5, 6, 8);
      });
      text(ctx, 'zone attive: vescicole di ACh (verdi) e canali Ca²⁺ (arancio)', w * 0.5, ty + 33, 'center', muted, 11);
      // fessura con lamina basale e acetilcolinesterasi
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)'; ctx.fillRect(w * 0.08, cyl, w * 0.84, bot - cyl);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * 0.08, (cyl + bot) / 2); ctx.lineTo(w * 0.92, (cyl + bot) / 2); ctx.stroke(); ctx.setLineDash([]);
      var neo = S.neo;
      for (var a = 0; a < 14; a++) { var ax = w * 0.1 + a * (w * 0.8) / 13; ctx.fillStyle = neo ? 'rgba(200,60,50,0.9)' : '#2a8c6d'; ctx.fillRect(ax, (cyl + bot) / 2 - 3, 5 * s, 6 * s); }
      text(ctx, 'AChE' + (neo ? ' (inibita)' : ''), w * 0.08 + 2, (cyl + bot) / 2 + 20 * s, 'left', neo ? css('--bad') : '#2a8c6d', 10, true);
      // muscolo con pieghe giunzionali
      ctx.fillStyle = dark ? 'rgba(200,100,90,0.30)' : 'rgba(224,120,108,0.32)'; ctx.strokeStyle = outline; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * 0.04, bot); var fx = [0.16, 0.34, 0.5, 0.66, 0.84];
      fx.forEach(function (f) { var x = w * f; ctx.lineTo(x - 22 * s, bot); ctx.lineTo(x - 22 * s, bot); ctx.lineTo(x - 11 * s, bot); ctx.lineTo(x - 7 * s, fold - 6); ctx.lineTo(x + 7 * s, fold - 6); ctx.lineTo(x + 11 * s, bot); });
      ctx.lineTo(w * 0.96, bot); ctx.lineTo(w * 0.96, h - 6); ctx.lineTo(w * 0.04, h - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      text(ctx, 'fibra muscolare scheletrica (pieghe giunzionali)', w * 0.5, h - 12, 'center', txt, 11);
      // ACh nella fessura
      var tAChE = neo ? 1.8 : 0.45, nAChdots = 0, drawn = [];
      released.forEach(function (rv) {
        for (var k = 0; k < 6; k++) {
          var t0 = 0.16, d = clamp((u - t0) / 0.22, 0, 1), life = clamp(1 - (u - 0.3) / (tAChE * 0.45), 0, 1);
          if (u > 0.3 && life <= 0) continue;
          var x = rv[0] + (hash(rv[2] * 5 + k) - 0.5) * 60 * s * d, y = cyl + 4 + d * (bot - cyl - 8) * (0.4 + 0.6 * hash(rv[2] + k * 7));
          dotAt(ctx, x, y, 2.6 * s, 'rgba(58,166,117,' + life + ')');
        }
      });
      // recettori nicotinici sulle creste (cur = frazione bloccata dal curaro; mg = miastenia → meno recettori)
      var nR = fx.length * 2, blockedFrac = S.cur || 0, fewer = S.mg ? 0.4 : 1, nAct = 0;
      fx.forEach(function (f, fi) {
        [-1, 1].forEach(function (sd, si) {
          var idn = fi * 2 + si, x = w * f + sd * 15 * s, y = bot + 2;
          if (hash(idn * 3.3) > fewer) return; // recettore perso (anticorpi)
          var bl = hash(idn * 1.7 + 0.4) < blockedFrac;
          var hasACh = released.length > 0 && u > 0.2 && u < (neo ? 0.85 : 0.55) && !bl;
          ctx.fillStyle = bl ? 'rgba(200,60,50,0.9)' : (hasACh ? 'rgba(170,90,230,1)' : 'rgba(140,110,185,0.85)');
          ctx.fillRect(x - 5 * s, y - 4, 10 * s, 8 * s);
          if (hasACh && rec > 0.02) {
            for (var k = 0; k < 2; k++) { var uu = (tm * 1.6 + k / 2 + fi * 0.2) % 1; dotAt(ctx, x, y + 6 + uu * 24 * s, 2.3 * s, '#f08a28'); }
            nAct++;
          }
        });
      });
      text(ctx, S.cur > 0.04 ? 'curaro (rosso) occupa i recettori' : (S.mg ? 'miastenia: meno recettori' : 'recettori nicotinici (nAChR, viola) sulle creste delle pieghe'), w * 0.5, h - 30, 'center', S.cur > 0.04 ? css('--bad') : muted, 11);
      text(ctx, 'p(rilascio) = ' + F.fmt(p * 100, 0) + '%  ·  ' + (nAct > 0 ? 'Na⁺ entra: potenziale di placca' : 'nessun potenziale di placca'), w - 10, 16, 'right', txt, 11, true);
      if (pre) text(ctx, 'PdA', w * 0.1, ty + 14, 'left', css('--warn'), 12, true);
    });
  };
  // ================================================================ Neurone schematico per l'integrazione sinaptica
  /** Disegna dendrite (colorato con il massimo potenziale raggiunto in ogni compartimento), soma, segmento iniziale e assone.
      o: {nDend, mx (Float/Array per compartimento), somaIndex, syn: [{um, label, kind:'E'|'I', on, pre}], Ld (µm)} */
  figs.miniNeuron = function (ctx, w, h, o) {
    ctx.clearRect(0, 0, w, h);
    if (!o || !o.mx) return;
    var css = U.css, muted = css('--muted'), txt = css('--text'), dark = isDark(), s = clamp(w / 700, 0.75, 1.1);
    var outline = dark ? 'rgba(220,225,235,0.45)' : 'rgba(40,50,70,0.55)', cy = h * 0.56, nD = o.nDend, Ld = o.Ld;
    var rx = 24 * s, sx = w * 0.5, dx1 = sx - rx * 0.85, dx0 = 24, mx = o.mx;
    function P(um) { var u = um / Ld; return { x: dx1 - u * (dx1 - dx0), y: cy - 14 * s * u * Math.sin(u * 3.6) }; }
    function Wd(um) { var u = um / Ld; return (11 * (1 - u) + 4.5 * u) * s; }
    ctx.lineCap = 'round';
    // ramoscelli (decorativi, colorati come il punto da cui nascono)
    [[130, -1, 30, 2.4], [260, 1, 32, 2.5], [400, -1, 30, 2.3], [530, 1, 28, 2.45], [650, -1, 24, 2.7]].forEach(function (b) {
      var p0 = P(b[0]), v = mx[Math.max(0, Math.min(nD - 1, nD - 1 - Math.round(b[0] / Ld * nD)))], x1 = p0.x + Math.cos(b[3]) * b[2] * s, y1 = p0.y + b[1] * Math.abs(Math.sin(b[3])) * b[2] * s;
      ctx.strokeStyle = outline; ctx.lineWidth = 4.4 * s; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = vcol(v); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(x1, y1); ctx.stroke();
    });
    var i, a, b;
    for (i = 0; i < nD; i++) { a = P((nD - i - 1) * Ld / nD); b = P((nD - i) * Ld / nD); ctx.strokeStyle = outline; ctx.lineWidth = Wd((nD - i - 0.5) * Ld / nD) + 1.8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    for (i = 0; i < nD; i++) { a = P((nD - i - 1) * Ld / nD); b = P((nD - i) * Ld / nD); ctx.strokeStyle = vcol(mx[i]); ctx.lineWidth = Wd((nD - i - 0.5) * Ld / nD); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    // assone: segmento iniziale (4 compartimenti) e assone
    var si = o.somaIndex, n = mx.length, ax0 = sx + rx * 0.9, axE = w - 24, nA = n - si - 1;
    for (i = 0; i < nA; i++) { var xa = ax0 + i / nA * (axE - ax0), xb = ax0 + (i + 1) / nA * (axE - ax0), ais = i < 4; ctx.fillStyle = vcol(mx[si + 1 + i]); ctx.fillRect(xa - 0.5, cy - (ais ? 4.5 : 3) * s, xb - xa + 1, (ais ? 9 : 6) * s); }
    ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.strokeRect(ax0, cy - 4.5 * s, 4 / nA * (axE - ax0), 9 * s);
    ctx.fillStyle = css('--na'); for (i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(ax0 + (i + 0.5) / 6 * 4 / nA * (axE - ax0), cy - 7.5 * s, 1.5 * s, 0, 6.283); ctx.arc(ax0 + (i + 0.5) / 6 * 4 / nA * (axE - ax0), cy + 7.5 * s, 1.5 * s, 0, 6.283); ctx.fill(); }
    // soma
    ctx.beginPath(); for (i = 0; i <= 40; i++) { var an = i / 40 * 6.2832, r = 1 + 0.06 * Math.sin(3 * an + 1) + 0.04 * Math.sin(5 * an); ctx[i ? 'lineTo' : 'moveTo'](sx + Math.cos(an) * rx * r, cy + Math.sin(an) * rx * 0.88 * r); } ctx.closePath();
    ctx.fillStyle = vcol(mx[si]); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = dark ? 'rgba(20,20,30,0.3)' : 'rgba(255,255,255,0.42)'; ctx.beginPath(); ctx.ellipse(sx - 3, cy, rx * 0.45, rx * 0.4, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(70,40,110,0.75)'; ctx.beginPath(); ctx.arc(sx, cy - 1, rx * 0.12, 0, 6.283); ctx.fill();
    // sinapsi
    (o.syn || []).forEach(function (sy) {
      if (!sy.on) return;
      var pos = sy.um === 0 && sy.kind === 'I' ? { x: sx - rx * 0.4, y: cy - rx * 0.85 } : P(sy.um), wd = sy.um === 0 ? 0 : Wd(sy.um);
      var by = pos.y - wd / 2 - 10 * s, col = sy.kind === 'E' ? 'rgba(58,166,117,0.95)' : 'rgba(150,80,190,0.95)';
      ctx.strokeStyle = dark ? 'rgba(200,205,215,0.55)' : 'rgba(90,95,110,0.6)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(pos.x, by - 6 * s); ctx.lineTo(pos.x - 3 * s, by - 30 * s); ctx.stroke();
      ctx.fillStyle = col; ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(pos.x, by, 9 * s, 6.5 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
      text(ctx, sy.label, pos.x - 3 * s, by - 34 * s, 'center', txt, 12, true);
      if (sy.pre) { // inibizione presinaptica: terminale inibitorio che contatta il bottone di A
        ctx.fillStyle = 'rgba(150,80,190,0.95)'; ctx.beginPath(); ctx.ellipse(pos.x + 22 * s, by - 14 * s, 7 * s, 5.5 * s, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        text(ctx, 'inibizione presinaptica', pos.x + 34 * s, by - 30 * s, 'left', css('--c4'), 10.5, true);
      }
    });
    // elettrodo sul soma
    ctx.strokeStyle = css('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + 26 * s, h - 8); ctx.lineTo(sx + 4, cy + rx * 0.82); ctx.stroke(); dotAt(ctx, sx + 4, cy + rx * 0.82, 3, css('--c1'));
    text(ctx, 'elettrodo', sx + 30 * s, h - 12, 'left', css('--c1'), 11);
    text(ctx, 'dendrite (cilindro passivo)', (dx0 + dx1) / 2, h - 12, 'center', muted, 11);
    text(ctx, 'soma', sx - rx * 0.6, cy + rx + 14 * s, 'center', muted, 11);
    text(ctx, 'segmento iniziale → assone', ax0 + (axE - ax0) * 0.42, cy + 30 * s, 'center', muted, 11);
    text(ctx, 'colori: massimo potenziale raggiunto', w - 8, 14, 'right', muted, 10.5);
    var bw = 100, bx0 = w - bw - 8, cg = ctx.createLinearGradient(bx0, 0, bx0 + bw, 0); for (i = 0; i <= 10; i++) cg.addColorStop(i / 10, vcol(-85 + 120 * i / 10)); ctx.fillStyle = cg; ctx.fillRect(bx0, 20, bw, 6);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
