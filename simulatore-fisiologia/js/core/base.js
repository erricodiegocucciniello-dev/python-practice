/* Motore numerico — costanti fisiche e strumenti matematici di base.
   Tutti i file del motore funzionano sia nel browser sia in Node (test). */
(function (G) {
  'use strict';
  var F = G.Fisio = G.Fisio || {};

  // Costanti fisiche (CODATA 2018)
  F.C = {
    R: 8.314462618,      // J mol^-1 K^-1
    F: 96485.33212,      // C mol^-1
    K0: 273.15,          // 0 °C in kelvin
    Ratm: 0.082057366,   // L atm mol^-1 K^-1
    atm_mmHg: 760,
    rhoWater: 1000,      // kg/m^3
    g: 9.80665           // m/s^2
  };

  /** RT/F in millivolt alla temperatura in °C */
  F.RTF = function (Tc) { return F.C.R * (Tc + F.C.K0) / F.C.F * 1000; };
  /** RT in kJ/mol */
  F.RTkJ = function (Tc) { return F.C.R * (Tc + F.C.K0) / 1000; };

  F.clamp = function (x, a, b) { return x < a ? a : (x > b ? b : x); };
  F.lerp = function (a, b, t) { return a + (b - a) * t; };
  F.linspace = function (a, b, n) {
    var out = new Array(n);
    for (var i = 0; i < n; i++) out[i] = n === 1 ? a : a + (b - a) * i / (n - 1);
    return out;
  };
  F.logspace = function (a, b, n) { // esponenti in base 10
    return F.linspace(a, b, n).map(function (e) { return Math.pow(10, e); });
  };

  /** x/(exp(x/y)-1) con il limite corretto (= y) per x→0. Serve per le
      funzioni di velocità di tipo Hodgkin-Huxley. */
  F.vtrap = function (x, y) {
    var r = x / y;
    if (Math.abs(r) < 1e-6) return y * (1 - r / 2);
    return x / (Math.exp(r) - 1);
  };

  // Generatore pseudo-casuale con seme (riproducibile) — mulberry32
  F.rng = function (seed) {
    var a = (seed >>> 0) || 0x9e3779b9;
    var f = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var spare = null;
    f.gauss = function () { // Box-Muller
      if (spare !== null) { var s = spare; spare = null; return s; }
      var u = 0, v = 0;
      while (u === 0) u = f();
      v = f();
      var r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
    f.exp = function (rate) { var u = 0; while (u === 0) u = f(); return -Math.log(u) / rate; };
    f.poisson = function (lam) {
      if (lam < 30) {
        var L = Math.exp(-lam), k = 0, p = 1;
        do { k++; p *= f(); } while (p > L);
        return k - 1;
      }
      // approssimazione normale per medie grandi
      return Math.max(0, Math.round(lam + Math.sqrt(lam) * f.gauss()));
    };
    f.binomial = function (n, p) {
      if (n * p < 25 && n > 50) {
        // inversione esatta della binomiale (efficiente per n*p piccolo)
        var q = 1 - p, prob = Math.pow(q, n), cum = prob, u = f(), k = 0;
        while (u > cum && k < n) {
          prob *= (n - k) / (k + 1) * p / q; k++; cum += prob;
        }
        return k;
      }
      var c = 0;
      for (var i = 0; i < n; i++) if (f() < p) c++;
      return c;
    };
    return f;
  };

  /** Passo di Runge-Kutta del 4° ordine per sistemi y' = f(t, y). */
  F.rk4 = function (f, t, y, dt) {
    var n = y.length, i;
    var k1 = f(t, y);
    var y2 = new Array(n); for (i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i];
    var k2 = f(t + 0.5 * dt, y2);
    var y3 = new Array(n); for (i = 0; i < n; i++) y3[i] = y[i] + 0.5 * dt * k2[i];
    var k3 = f(t + 0.5 * dt, y3);
    var y4 = new Array(n); for (i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i];
    var k4 = f(t + dt, y4);
    var out = new Array(n);
    for (i = 0; i < n; i++) out[i] = y[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  };

  /** Integra y' = f(t,y) da t0 a t1; restituisce {t:[], y:[[...]]} campionati ogni 'every' passi. */
  F.integrate = function (f, y0, t0, t1, dt, every) {
    every = every || 1;
    var t = t0, y = y0.slice(), T = [t], Y = [y.slice()], k = 0;
    while (t < t1 - 1e-12) {
      var h = Math.min(dt, t1 - t);
      y = F.rk4(f, t, y, h); t += h; k++;
      if (k % every === 0) { T.push(t); Y.push(y.slice()); }
    }
    return { t: T, y: Y };
  };

  /** Risolve un sistema tridiagonale (algoritmo di Thomas).
      a: sotto-diagonale (a[0] ignorato), b: diagonale, c: sopra-diagonale (c[n-1] ignorato), d: termine noto. */
  F.thomas = function (a, b, c, d, out) {
    var n = b.length, cp = F._cpBuf && F._cpBuf.length >= n ? F._cpBuf : (F._cpBuf = new Float64Array(n * 2));
    var dp = F._dpBuf && F._dpBuf.length >= n ? F._dpBuf : (F._dpBuf = new Float64Array(n * 2));
    out = out || new Float64Array(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (var i = 1; i < n; i++) {
      var m = b[i] - a[i] * cp[i - 1];
      cp[i] = c[i] / m;
      dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
    }
    out[n - 1] = dp[n - 1];
    for (i = n - 2; i >= 0; i--) out[i] = dp[i] - cp[i] * out[i + 1];
    return out;
  };

  /** Ricerca per bisezione di una radice di f in [a,b]. */
  F.bisect = function (f, a, b, tol, maxIt) {
    tol = tol || 1e-9; maxIt = maxIt || 200;
    var fa = f(a), fb = f(b);
    if (fa * fb > 0) return NaN;
    for (var i = 0; i < maxIt; i++) {
      var m = 0.5 * (a + b), fm = f(m);
      if (Math.abs(fm) < tol || (b - a) / 2 < tol) return m;
      if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return 0.5 * (a + b);
  };

  /** Istogramma: restituisce {edges, counts, centers}. */
  F.histogram = function (data, lo, hi, nbins) {
    var counts = new Array(nbins).fill(0), w = (hi - lo) / nbins;
    for (var i = 0; i < data.length; i++) {
      var k = Math.floor((data[i] - lo) / w);
      if (k >= 0 && k < nbins) counts[k]++;
      else if (data[i] === hi) counts[nbins - 1]++;
    }
    var centers = counts.map(function (_, k) { return lo + (k + 0.5) * w; });
    return { counts: counts, centers: centers, width: w };
  };

  F.mean = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; };
  F.sd = function (a) {
    var m = F.mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / Math.max(1, a.length - 1));
  };

  /** Riduce una serie a ~n punti (per il disegno) mantenendo min/max di ogni gruppo. */
  F.decimate = function (x, y, n) {
    if (x.length <= n * 2) return { x: x, y: y };
    var step = Math.ceil(x.length / n), X = [], Y = [];
    for (var i = 0; i < x.length; i += step) {
      var j1 = Math.min(x.length, i + step), imin = i, imax = i;
      for (var j = i; j < j1; j++) { if (y[j] < y[imin]) imin = j; if (y[j] > y[imax]) imax = j; }
      var a = Math.min(imin, imax), b = Math.max(imin, imax);
      X.push(x[a]); Y.push(y[a]);
      if (b !== a) { X.push(x[b]); Y.push(y[b]); }
    }
    return { x: X, y: Y };
  };

  /** Formattazione numerica all'italiana (virgola decimale). */
  F.fmt = function (v, d) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    if (!isFinite(v)) return v > 0 ? '∞' : '−∞';
    d = (d === undefined) ? 2 : d;
    var s = Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0)
      ? v.toExponential(d).replace('e', '·10^').replace('^+', '^')
      : v.toFixed(d);
    s = s.replace('.', ',').replace('-', '−');
    if (s.indexOf('·10^') >= 0) {
      var parts = s.split('·10^');
      s = parts[0] + '·10' + F.sup(parts[1]);
    }
    return s;
  };
  F.sup = function (str) {
    var map = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '−': '⁻', '-': '⁻' };
    return String(str).split('').map(function (c) { return map[c] || c; }).join('');
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
