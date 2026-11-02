/* Acqua in fila singola in un canale stretto (acquaporina): dinamica browniana sovrasmorzata in un profilo di energia.
   NON è una dinamica molecolare "all-atom": ogni molecola d'acqua è un punto che si muove lungo l'asse del poro con
   diffusione D, spinto dal profilo di energia U(s) (due barriere: strozzatura ar/R e motivi NPA) e da una forza motrice F;
   le molecole non possono superarsi (fila singola) e si tengono a distanza dmin (≈ 2,8 Å, diametro dell'acqua).
   Agli estremi il canale pesca da due serbatoi di acqua: una molecola entra quando c'è posto.
   Unità: Å, ps, kT (energia e forze in kT e kT/Å). */
(function (G) {
  'use strict';
  var F = G.Fisio;

  function SingleFile(o) {
    this.len = o.len; this.sA = o.sA; this.sN = o.sN;
    this.Ba = o.Ba === undefined ? 2 : o.Ba; this.Bn = o.Bn === undefined ? 3 : o.Bn; this.sig = o.sig || 1.4;
    this.D = o.D || 0.4; this.dmin = o.dmin || 2.8; this.dt = o.dt || 0.02;
    this.rand = F.rng(o.seed || 1);
    this.z = []; this.tag = []; this.fwd = 0; this.bwd = 0; this.t = 0; this.k = 0;
    for (var s = this.dmin * 0.6; s < this.len - this.dmin * 0.3; s += this.dmin * 1.05) { this.z.push(s); this.tag.push(s < this.len / 2 ? -1 : 1); }
  }
  /** Profilo di energia (in kT) lungo il poro: barriera alla strozzatura ar/R (Ba) e ai motivi NPA (Bn). */
  SingleFile.prototype.U = function (s) {
    var a = (s - this.sA) / this.sig, n = (s - this.sN) / this.sig;
    return this.Ba * Math.exp(-a * a / 2) + this.Bn * Math.exp(-n * n / 2);
  };
  SingleFile.prototype.dU = function (s) {
    var a = (s - this.sA) / this.sig, n = (s - this.sN) / this.sig;
    return -this.Ba * a / this.sig * Math.exp(-a * a / 2) - this.Bn * n / this.sig * Math.exp(-n * n / 2);
  };
  SingleFile.prototype.gauss = function () {
    var u = 0; while (u === 0) u = this.rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * this.rand());
  };
  /** Un passo di dt ps con forza motrice 'force' (kT/Å, positiva = verso l'estremità extracellulare). */
  SingleFile.prototype.step = function (force) {
    var z = this.z, tag = this.tag, n = z.length, i, sw, D = this.D, dt = this.dt, sq = Math.sqrt(2 * D * dt), dmin = this.dmin, L = this.len;
    for (i = 0; i < n; i++) z[i] += D * (-this.dU(z[i]) + force) * dt + sq * this.gauss();
    // niente sorpassi: sovrapposizioni risolte in modo simmetrico (tutte le correzioni calcolate dallo stesso stato)
    for (sw = 0; sw < 4; sw++) {
      var c = new Array(n).fill(0);
      for (i = 0; i < n - 1; i++) { var g = z[i + 1] - z[i]; if (g < dmin) { var p = (dmin - g) / 2; c[i] -= p; c[i + 1] += p; } }
      for (i = 0; i < n; i++) z[i] += c[i] * 0.6;
    }
    // uscita dai due estremi: si conta un attraversamento se la molecola era entrata dall'estremo opposto
    while (z.length && z[0] < 0) { if (tag[0] === 1) this.bwd++; z.shift(); tag.shift(); }
    while (z.length && z[z.length - 1] > L) { if (tag[tag.length - 1] === -1) this.fwd++; z.pop(); tag.pop(); }
    // ingresso dai serbatoi quando c'è posto (si alterna l'estremo servito per primo: nessuna asimmetria)
    var self = this, near = function () { if (!z.length || z[0] > dmin) { z.unshift(0.01); tag.unshift(-1); } }, far = function () { if (!z.length || z[z.length - 1] < L - dmin) { z.push(L - 0.01); tag.push(1); } };
    if (this.k % 2) { near(); far(); } else { far(); near(); }
    this.k++; this.t += dt;
  };
  SingleFile.prototype.run = function (ps, force) { var n = Math.round(ps / this.dt); for (var i = 0; i < n; i++) this.step(force); };

  F.SingleFile = SingleFile;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof globalThis !== 'undefined' ? globalThis : this);
