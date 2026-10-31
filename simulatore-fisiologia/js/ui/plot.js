/* Grafici su canvas: linee, punti, barre, assi lineari o logaritmici, lettura al passaggio del mouse. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui;

  function niceStep(range, n) {
    var raw = range / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function ticks(lo, hi, n) {
    if (!(hi > lo)) return [lo];
    var s = niceStep(hi - lo, n), out = [], start = Math.ceil(lo / s - 1e-9) * s;
    for (var v = start; v <= hi + s * 1e-6; v += s) out.push(Math.abs(v) < s * 1e-9 ? 0 : v);
    return out;
  }
  function fmtTick(v, step) {
    var d = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step) - 1e-9));
    if (Math.abs(v) >= 1e5 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) return F.fmt(v, 0);
    return v.toFixed(d).replace('.', ',').replace('-', '−');
  }
  function fmtLog(v) {
    var e = Math.round(Math.log10(v));
    if (e >= -2 && e <= 4) return String(v >= 1 ? Math.round(v) : v.toFixed(-e)).replace('.', ',');
    return '10' + F.sup(String(e));
  }

  /** Crea un grafico. o: {title, xlabel, ylabel, height, xlim, ylim, xlog, ylog, legend, xfmt, yfmt} */
  function Plot(host, o) {
    this.o = o || {};
    this.host = host;
    var wrap = U.el('div', { class: 'plot' });
    if (this.o.title) wrap.appendChild(U.el('div', { class: 'ptitle', html: this.o.title }));
    this.canvas = U.el('canvas');
    this.tip = U.el('div', { class: 'tip' });
    wrap.appendChild(this.canvas); wrap.appendChild(this.tip);
    host.appendChild(wrap);
    this.wrap = wrap;
    this.ctx = this.canvas.getContext('2d');
    this.series = []; this.hlines = []; this.vlines = []; this.spans = []; this.texts = [];
    var self = this;
    this.ro = ('ResizeObserver' in G) ? new ResizeObserver(function () { self.draw(); }) : null;
    if (this.ro) this.ro.observe(wrap);
    var move = function (ev) {
      var r = self.canvas.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev;
      self.hover = { x: p.clientX - r.left, y: p.clientY - r.top }; self.draw();
    };
    this.canvas.addEventListener('mousemove', move);
    this.canvas.addEventListener('touchmove', move, { passive: true });
    this.canvas.addEventListener('mouseleave', function () { self.hover = null; self.tip.style.display = 'none'; self.draw(); });
    G.addEventListener('fisio-theme', function () { self.draw(); });
  }

  /** Aggiorna i contenuti. d: {series, hlines, vlines, spans, texts, xlim, ylim} */
  Plot.prototype.update = function (d) {
    if (d.series) this.series = d.series;
    if (d.hlines) this.hlines = d.hlines;
    if (d.vlines) this.vlines = d.vlines;
    if (d.spans) this.spans = d.spans;
    if (d.texts) this.texts = d.texts;
    if (d.xlim !== undefined) this.o.xlim = d.xlim;
    if (d.ylim !== undefined) this.o.ylim = d.ylim;
    if (d.xlabel) this.o.xlabel = d.xlabel;
    if (d.ylabel) this.o.ylabel = d.ylabel;
    this.draw();
  };

  Plot.prototype.range = function (axis) {
    var lim = axis === 'x' ? this.o.xlim : this.o.ylim, log = axis === 'x' ? this.o.xlog : this.o.ylog;
    var lo = Infinity, hi = -Infinity;
    if (!lim || lim[0] === null || lim[1] === null || lim[0] === undefined) {
      this.series.forEach(function (s) {
        var a = axis === 'x' ? s.x : s.y;
        if (!a) return;
        for (var i = 0; i < a.length; i++) { var v = a[i]; if (isFinite(v) && (!log || v > 0)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
        if (s.type === 'bars' && axis === 'y') { lo = Math.min(lo, 0); }
      });
      if (axis === 'y') {
        this.hlines.forEach(function (h) { if (h.include !== false && isFinite(h.y)) { lo = Math.min(lo, h.y); hi = Math.max(hi, h.y); } });
      }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      if (lo === hi) { lo -= 1; hi += 1; }
      if (!log) { var pad = (hi - lo) * 0.06; if (!(lim && lim[0] !== null && lim[0] !== undefined)) lo -= pad; if (!(lim && lim[1] !== null && lim[1] !== undefined)) hi += pad; }
    }
    if (lim) { if (lim[0] !== null && lim[0] !== undefined) lo = lim[0]; if (lim[1] !== null && lim[1] !== undefined) hi = lim[1]; }
    return [lo, hi];
  };

  Plot.prototype.draw = function () {
    var c = this.canvas, ctx = this.ctx, o = this.o;
    var W = Math.max(200, this.wrap.clientWidth), H = typeof o.height === 'function' ? o.height(W) : (o.height || 220);
    var dpr = Math.min(2, G.devicePixelRatio || 1);
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    c.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var css = U.css, txt = css('--text'), muted = css('--muted'), grid = css('--grid'), axis = css('--axis');
    var ml = o.ylabel ? 58 : 44, mr = o.mr || 12, mt = 10, mb = o.xlabel ? 42 : 24;
    var pw = W - ml - mr, ph = H - mt - mb;
    var xr = this.range('x'), yr = this.range('y');
    var xlog = !!o.xlog, ylog = !!o.ylog;
    var tx = function (v) { return xlog ? ml + (Math.log10(v) - Math.log10(xr[0])) / (Math.log10(xr[1]) - Math.log10(xr[0])) * pw : ml + (v - xr[0]) / (xr[1] - xr[0]) * pw; };
    var ty = function (v) { return ylog ? mt + ph - (Math.log10(v) - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0])) * ph : mt + ph - (v - yr[0]) / (yr[1] - yr[0]) * ph; };
    this._tx = tx; this._ty = ty; this._ml = ml; this._pw = pw; this._mt = mt; this._ph = ph; this._xr = xr; this._yr = yr;
    ctx.font = '12px ' + css('--font'); ctx.textBaseline = 'middle';

    // aree evidenziate
    this.spans.forEach(function (s) {
      var a = tx(Math.max(s.x0, xr[0])), b = tx(Math.min(s.x1, xr[1]));
      if (b <= a) return;
      ctx.fillStyle = s.color || 'rgba(127,127,127,0.12)'; ctx.globalAlpha = s.alpha || 0.14;
      ctx.fillRect(a, mt, b - a, ph); ctx.globalAlpha = 1;
      if (s.label) { ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText(s.label, (a + b) / 2, mt + 10); }
    });

    // griglia e tacche
    ctx.lineWidth = 1; ctx.strokeStyle = grid; ctx.fillStyle = muted;
    var xt, yt, xs, ys;
    var logTicks = function (r, maxN) {
      var e0 = Math.ceil(Math.log10(r[0]) - 1e-9), e1 = Math.floor(Math.log10(r[1]) + 1e-9), st = Math.max(1, Math.ceil((e1 - e0 + 1) / Math.max(2, maxN))), out = [];
      for (var e = e0; e <= e1; e += st) out.push(Math.pow(10, e));
      return out;
    };
    if (xlog) { xt = logTicks(xr, Math.floor(pw / 55)); }
    else { xs = niceStep(xr[1] - xr[0], Math.max(3, Math.floor(pw / 80))); xt = ticks(xr[0], xr[1], Math.max(3, Math.floor(pw / 80))); }
    if (ylog) { yt = logTicks(yr, Math.floor(ph / 24)); }
    else { ys = niceStep(yr[1] - yr[0], Math.max(3, Math.floor(ph / 45))); yt = ticks(yr[0], yr[1], Math.max(3, Math.floor(ph / 45))); }
    ctx.textAlign = 'center';
    xt.forEach(function (v) {
      var X = Math.round(tx(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(X, mt); ctx.lineTo(X, mt + ph); ctx.stroke();
      ctx.fillText(o.xfmt ? o.xfmt(v) : (xlog ? fmtLog(v) : fmtTick(v, xs)), X, mt + ph + 12);
    });
    ctx.textAlign = 'right';
    yt.forEach(function (v) {
      var Y = Math.round(ty(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(ml, Y); ctx.lineTo(ml + pw, Y); ctx.stroke();
      ctx.fillText(o.yfmt ? o.yfmt(v) : (ylog ? fmtLog(v) : fmtTick(v, ys)), ml - 6, Y);
    });
    // zero
    if (!ylog && yr[0] < 0 && yr[1] > 0) { ctx.strokeStyle = axis; ctx.beginPath(); ctx.moveTo(ml, Math.round(ty(0)) + 0.5); ctx.lineTo(ml + pw, Math.round(ty(0)) + 0.5); ctx.stroke(); }
    ctx.strokeStyle = axis; ctx.strokeRect(ml + 0.5, mt + 0.5, pw, ph);
    // etichette assi
    ctx.fillStyle = muted; ctx.textAlign = 'center';
    if (o.xlabel) ctx.fillText(o.xlabel, ml + pw / 2, H - 10);
    if (o.ylabel) { ctx.save(); ctx.translate(13, mt + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylabel, 0, 0); ctx.restore(); }

    // linee di riferimento
    ctx.save(); ctx.beginPath(); ctx.rect(ml, mt, pw, ph); ctx.clip();
    var refLine = function (isH, l) {
      var col = l.color ? (l.color.indexOf('--') === 0 ? css(l.color) : l.color) : muted;
      ctx.strokeStyle = col; ctx.lineWidth = l.width || 1.2; ctx.setLineDash(l.dash === false ? [] : [5, 4]);
      ctx.beginPath();
      if (isH) { var Y = ty(l.y); ctx.moveTo(ml, Y); ctx.lineTo(ml + pw, Y); }
      else { var X = tx(l.x); ctx.moveTo(X, mt); ctx.lineTo(X, mt + ph); }
      ctx.stroke(); ctx.setLineDash([]);
      if (l.label) {
        ctx.fillStyle = col; ctx.font = '11px ' + css('--font');
        if (isH) { ctx.textAlign = l.align || 'right'; ctx.fillText(l.label, l.align === 'left' ? ml + 4 : ml + pw - 4, ty(l.y) - 8); }
        else { ctx.textAlign = 'left'; ctx.fillText(l.label, tx(l.x) + 4, mt + 10 + (l.dy || 0)); }
        ctx.font = '12px ' + css('--font');
      }
    };
    this.hlines.forEach(function (l) { if (isFinite(l.y)) refLine(true, l); });
    this.vlines.forEach(function (l) { if (isFinite(l.x)) refLine(false, l); });

    // serie
    this.series.forEach(function (s) {
      var col = s.color ? (s.color.indexOf('--') === 0 ? css(s.color) : s.color) : txt;
      var x = s.x, y = s.y;
      if (!x || !y) return;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
      if (s.type === 'bars') {
        var bw = s.barWidth ? Math.abs(tx(x[0] + s.barWidth) - tx(x[0])) : pw / x.length * 0.85;
        ctx.globalAlpha = s.alpha || 0.75;
        for (var i = 0; i < x.length; i++) {
          if (!isFinite(y[i])) continue;
          var X = tx(x[i]), Y0 = ty(ylog ? yr[0] : Math.max(0, yr[0])), Y1 = ty(y[i]);
          ctx.fillRect(X - bw / 2, Math.min(Y0, Y1), bw, Math.abs(Y1 - Y0));
        }
        ctx.globalAlpha = 1;
      } else if (s.type === 'points') {
        for (i = 0; i < x.length; i++) {
          if (!isFinite(x[i]) || !isFinite(y[i])) continue;
          ctx.beginPath(); ctx.arc(tx(x[i]), ty(y[i]), s.r || 3.5, 0, 2 * Math.PI); ctx.fill();
        }
      } else {
        ctx.beginPath(); var pen = false;
        for (i = 0; i < x.length; i++) {
          if (!isFinite(x[i]) || !isFinite(y[i]) || (xlog && x[i] <= 0) || (ylog && y[i] <= 0)) { pen = false; continue; }
          var px = tx(x[i]), py = ty(y[i]);
          if (s.type === 'step' && pen) { ctx.lineTo(px, ty(y[i - 1])); }
          if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
        }
        if (s.fill) {
          ctx.stroke();
          ctx.lineTo(tx(x[x.length - 1]), ty(Math.max(yr[0], 0))); ctx.lineTo(tx(x[0]), ty(Math.max(yr[0], 0))); ctx.closePath();
          ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1;
        } else ctx.stroke();
      }
      ctx.setLineDash([]);
    });
    // testi
    this.texts.forEach(function (t) {
      ctx.fillStyle = t.color ? (t.color.indexOf('--') === 0 ? css(t.color) : t.color) : txt;
      ctx.textAlign = t.align || 'left'; ctx.font = (t.bold ? '600 ' : '') + '12px ' + css('--font');
      ctx.fillText(t.text, tx(t.x), ty(t.y));
    });
    ctx.restore();

    // legenda
    var named = this.series.filter(function (s) { return s.name; });
    if (o.legend !== false && named.length) {
      ctx.font = '12px ' + css('--font'); ctx.textAlign = 'left';
      var lx = ml + 8, ly = mt + 12, maxW = 0;
      named.forEach(function (s) { maxW = Math.max(maxW, ctx.measureText(s.name).width); });
      var boxW = maxW + 30;
      if (o.legend === 'right' || o.legendRight) lx = ml + pw - boxW - 4;
      ctx.fillStyle = css('--surface'); ctx.globalAlpha = 0.85; ctx.fillRect(lx - 4, ly - 9, boxW, named.length * 16 + 2); ctx.globalAlpha = 1;
      named.forEach(function (s, k) {
        var col = s.color ? (s.color.indexOf('--') === 0 ? css(s.color) : s.color) : txt;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash(s.dash || []);
        if (s.type === 'points' || s.type === 'bars') { ctx.fillRect(lx, ly + k * 16 - 4, 14, 8); }
        else { ctx.beginPath(); ctx.moveTo(lx, ly + k * 16); ctx.lineTo(lx + 16, ly + k * 16); ctx.stroke(); }
        ctx.setLineDash([]); ctx.fillStyle = txt; ctx.fillText(s.name, lx + 22, ly + k * 16);
      });
    }

    // lettura al passaggio del mouse
    if (this.hover && this.hover.x >= ml && this.hover.x <= ml + pw && this.series.length && o.hover !== false) {
      var hx = this.hover.x, xv = xlog ? Math.pow(10, Math.log10(xr[0]) + (hx - ml) / pw * (Math.log10(xr[1]) - Math.log10(xr[0]))) : xr[0] + (hx - ml) / pw * (xr[1] - xr[0]);
      ctx.strokeStyle = muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, mt); ctx.lineTo(hx, mt + ph); ctx.stroke(); ctx.setLineDash([]);
      var lines = [(o.xname || o.xlabel || 'x') + ': ' + F.fmt(xv, Math.abs(xv) < 10 ? 2 : 1)];
      this.series.forEach(function (s) {
        if (!s.x || !s.x.length || s.type === 'bars' || s.noHover) return;
        var lo = 0, hi = s.x.length - 1;
        if (s.x[0] > s.x[hi]) return;
        while (hi - lo > 1) { var m = (lo + hi) >> 1; if (s.x[m] < xv) lo = m; else hi = m; }
        var j = Math.abs(s.x[lo] - xv) < Math.abs(s.x[hi] - xv) ? lo : hi, yv = s.y[j];
        if (!isFinite(yv)) return;
        if (s.type === 'points' && Math.abs(tx(s.x[j]) - hx) > 12) return;
        var col = s.color ? (s.color.indexOf('--') === 0 ? css(s.color) : s.color) : txt;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx(s.x[j]), ty(yv), 3.5, 0, 2 * Math.PI); ctx.fill();
        lines.push('<span style="color:' + col + '">■</span> ' + (s.name || o.ylabel || 'y') + ': ' + F.fmt(yv, Math.abs(yv) < 10 ? 2 : 1));
      });
      this.tip.innerHTML = lines.join('<br>'); this.tip.style.display = 'block';
      var tw = this.tip.offsetWidth;
      this.tip.style.left = Math.min(W - tw - 4, hx + 12) + 'px';
      this.tip.style.top = (mt + 8 + (o.title ? 18 : 0)) + 'px';
      if (hx + 12 + tw > W) this.tip.style.left = Math.max(0, hx - tw - 12) + 'px';
    }
  };
  Plot.prototype.dispose = function () { if (this.ro) this.ro.disconnect(); };

  F.Plot = Plot;
  U.plot = function (host, o) { return new Plot(host, o); };
})(typeof globalThis !== 'undefined' ? globalThis : this);
