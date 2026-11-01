/* Scena 3D di una fibra nervosa (assone amielinico o mielinico) pilotata da un modello a compartimenti.
   Tutto ciò che si muove deriva dallo stato del modello (F.Cable):
   - colore del nucleo dell'assone = potenziale di membrana (blu riposo → rosso PdA);
   - puntini gialli dentro l'assone = corrente assiale (la corrente locale), verso e intensità dal modello;
   - puntini rossi fuori = corrente di ritorno nel liquido extracellulare (verso opposto);
   - puntini arancio che entrano = Na⁺ (attivazione m³h), puntini azzurri che escono = K⁺ (n⁴);
   - mielina: manicotti translucidi con le anse paranodali che si assottigliano verso i nodi; cellule di Schwann (nuclei viola).
   Uso: var a = F.axon3d(scn); a.build(cable, {type, d, demy, e1, e2}); a.update(dt); a.dispose(). */
(function (G) {
  'use strict';
  var F = G.Fisio;

  function vColor(V, out) {
    var t = F.clamp((V + 80) / 120, 0, 1), r, g, b;
    if (t < 0.4) { var u = t / 0.4; r = 0.2 + 0.55 * u; g = 0.35 + 0.4 * u; b = 0.85 - 0.1 * u; }
    else { var v = (t - 0.4) / 0.6; r = 0.75 + 0.25 * v; g = 0.75 - 0.55 * v; b = 0.75 - 0.6 * v; }
    out.setRGB(r, g, b); return out;
  }

  F.axon3d = function (scn) {
    var THREE = G.THREE, S = scn.scene, objs = [], cable = null, cfg = null, X = null, nr = 20, core = null, colArr = null, tmp = new THREE.Color();
    var pools = [], nodeInst = null, nodeSites = [], R = 0.2, Rc = 0.12, total = 9, ref = { in: 1e-9, na: 0.12, k: 0.12 };
    var elec = [], dotTex = null;

    function dot() {
      if (dotTex) return dotTex;
      var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
      var g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); dotTex = new THREE.CanvasTexture(c); return dotTex;
    }
    function add(o) { S.add(o); objs.push(o); return o; }
    function clear() {
      objs.forEach(function (o) { S.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); }); } });
      objs = []; pools = []; core = null; nodeInst = null; elec = []; scn.clearLabels();
    }

    /** Tubo a profilo variabile con un colore per anello. */
    function tube(xs, rad) {
      var n = xs.length, pos = new Float32Array(n * nr * 3), col = new Float32Array(n * nr * 3), idx = [], i, j;
      for (i = 0; i < n; i++) for (j = 0; j < nr; j++) { var a = j / nr * 6.2832; pos.set([xs[i], rad[i] * Math.cos(a), rad[i] * Math.sin(a)], (i * nr + j) * 3); }
      for (i = 0; i < n - 1; i++) for (j = 0; j < nr; j++) {
        var a0 = i * nr + j, b0 = i * nr + (j + 1) % nr, c0 = (i + 1) * nr + j, d0 = (i + 1) * nr + (j + 1) % nr;
        idx.push(a0, b0, c0, b0, d0, c0);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    }

    function pool(n, color, size) {
      var g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3).fill(0);
      for (var i = 0; i < n; i++) pos[i * 3 + 1] = 1e4;
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var m = new THREE.PointsMaterial({ color: color, size: size, map: dot(), transparent: true, depthWrite: false, sizeAttenuation: true, alphaTest: 0.03 });
      var pts = new THREE.Points(g, m); pts.frustumCulled = false; add(pts);
      return { n: n, pos: pos, vel: new Float32Array(n * 3), life: new Float32Array(n), g: g };
    }

    function build(c, o) {
      clear(); cable = c; cfg = o;
      var n = c.n, myel = o.type === 'myel', i;
      Rc = 0.085 + 0.0095 * o.d; // raggio del nucleo dell'assone (non in scala: d = 1…20 µm)
      R = myel ? Rc * 2.1 : Rc * 1.25;
      // posizioni 3D dei compartimenti
      X = new Float64Array(n);
      var nodes = [];
      if (myel) {
        var nInt = 0; c.kind.forEach(function (k) { if (k === 'node') nInt++; }); nInt -= 1;
        var gap = 0.09, Lint = (total - (nInt + 1) * gap) / nInt, pos = 0, seg = 0, cnt = 1;
        for (i = 0; i < n; i++) {
          if (c.kind[i] === 'node') {
            X[i] = pos + gap / 2; pos += gap; nodes.push(i); seg = 0;
            cnt = 0; for (var q = i + 1; q < n && c.kind[q] === 'myelin'; q++) cnt++;
          } else { X[i] = pos + (seg + 0.5) / cnt * Lint; seg++; if (seg === cnt) pos += Lint; }
        }
      } else {
        var xl = c.x[n - 1] + (c.x[1] - c.x[0]) / 2;
        for (i = 0; i < n; i++) X[i] = c.x[i] / xl * total;
      }
      for (i = 0; i < n; i++) X[i] -= total / 2;
      // nucleo colorato (con anelli di chiusura alle estremità)
      var xs = [X[0] - 0.015], rad = [0.02];
      for (i = 0; i < n; i++) { xs.push(X[i]); rad.push(Rc); }
      xs.push(X[n - 1] + 0.015); rad.push(0.02);
      var geo = tube(xs, rad);
      core = add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.0, emissive: 0x2a2a2a, side: THREE.DoubleSide })));
      colArr = geo.attributes.color.array;
      // guaine di mielina (una per internodo) e cellule di Schwann
      var sheathMeshes = [];
      if (myel) {
        var kk = -1, k;
        for (i = 0; i < n; i++) {
          if (c.kind[i] === 'node') { kk++; continue; }
          if (i > 0 && c.kind[i - 1] !== 'node') continue;
          var j2 = i; while (j2 < n && c.kind[j2] === 'myelin') j2++;
          var x0 = X[i - 1] + 0.045, x1 = X[j2] - 0.045, L = x1 - x0, demyHere = o.demy > 0.05 && kk >= 7 && kk <= 9;
          var Rin = Rc * 1.05, Rout = demyHere ? Rc * (2.1 - 1.0 * o.demy) : R, pts = [];
          for (k = 0; k <= 24; k++) {
            var t = k / 24, s = Math.min(1, Math.min(t, 1 - t) / 0.11);
            pts.push(new THREE.Vector2(Rin + (Rout - Rin) * Math.sin(s * Math.PI / 2), t * L));
          }
          var sh = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({
            color: demyHere ? 0xe3b3b0 : 0xf0e6c4, roughness: 0.55, metalness: 0, transparent: true, opacity: demyHere ? 0.4 : 0.55, side: THREE.DoubleSide, depthWrite: false
          }));
          sh.rotation.z = -Math.PI / 2; sh.position.x = x0; add(sh); sheathMeshes.push(sh);
          if (!demyHere) {
            // nucleo della cellula di Schwann
            var ang = 0.8 + kk * 2.1, nuc = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x7a4fb0, roughness: 0.6 }));
            nuc.scale.set(L * 0.17, 0.045, 0.09); nuc.position.set(x0 + L * 0.5, (Rout + 0.012) * Math.cos(ang), (Rout + 0.012) * Math.sin(ang)); nuc.rotation.x = ang; add(nuc);
          }
        }
      } else {
        // membrana: guscio quasi trasparente
        var mem = new THREE.Mesh(new THREE.CylinderGeometry(R, R, total, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xbcd0e8, transparent: true, opacity: 0.22, roughness: 0.3, side: THREE.DoubleSide, depthWrite: false }));
        mem.rotation.z = Math.PI / 2; add(mem);
      }
      // canali Na+: anelli di sferette ai nodi (mielinica) o sparsi su tutta la membrana (amielinica)
      nodeSites = [];
      var per = 10, spheres = [];
      if (myel) nodes.forEach(function (ni) { for (var a = 0; a < per; a++) spheres.push([ni, X[ni] + (a % 2 ? 0.012 : -0.012), a / per * 6.2832]); });
      else for (i = 0; i < 140; i++) { var ci = Math.floor(Math.random() * n); spheres.push([ci, X[ci], Math.random() * 6.2832]); }
      nodeInst = new THREE.InstancedMesh(new THREE.SphereGeometry(myel ? 0.028 : 0.022, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.4 }), spheres.length);
      var m4 = new THREE.Matrix4();
      spheres.forEach(function (sp, q) {
        var rr = (myel ? Rc : R) + 0.012; m4.makeTranslation(sp[1], rr * Math.cos(sp[2]), rr * Math.sin(sp[2])); nodeInst.setMatrixAt(q, m4); nodeInst.setColorAt(q, tmp.set(0xc2410c)); nodeSites.push(sp[0]);
      });
      add(nodeInst);
      // particelle
      pools = { inn: pool(130, 0xffd21f, 0.12), out: pool(110, 0xff3b30, 0.11), na: pool(90, 0xff7a00, 0.13), k: pool(90, 0x1e90ff, 0.13) };
      // elettrodi
      [o.e1, o.e2].forEach(function (ei, j) {
        var pin = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.7, 10), F.mat(j ? 0xd9480f : 0x2459a8));
        pin.position.set(X[ei], R + 0.55, 0); pin.rotation.z = Math.PI; add(pin); elec.push(pin);
        var lb = scn.label(pin, j ? 'el. 2' : 'el. 1'); lb.el.style.color = j ? '#d9480f' : '#2459a8';
      });
      // etichette
      function anchor(x, y) { var a = new THREE.Object3D(); a.position.set(x, y, 0); S.add(a); objs.push(a); return a; }
      if (myel) {
        scn.label(anchor((X[nodes[3]] + X[nodes[4]]) / 2, -R - 0.28), 'guaina di mielina (cellula di Schwann)');
        scn.label(anchor(X[nodes[11]], -R - 0.28), 'nodo di Ranvier (canali Na⁺)');
        scn.label(anchor(X[nodes[1]] + 0.1, R + 0.22), 'nucleo di Schwann');
      } else {
        scn.label(anchor(-1.2, -R - 0.25), 'membrana eccitabile con canali Na⁺ ovunque');
        scn.label(anchor(2.4, -R - 0.25), 'assoplasma (corrente locale)');
      }
      update(0.016, true);
    }

    function pick(w, tot) { var r = Math.random() * tot, a = 0; for (var i = 0; i < w.length; i++) { a += w[i]; if (a >= r) return i; } return w.length - 1; }

    function update(dt, force) {
      if (!cable || !core) return;
      var c = cable, n = c.n, V = c.V, i, j;
      // colore del nucleo (per anello)
      for (i = 0; i < n + 2; i++) {
        var ci = Math.min(n - 1, Math.max(0, i - 1)); vColor(V[ci], tmp).convertSRGBToLinear();
        for (j = 0; j < nr; j++) { var o3 = (i * nr + j) * 3; colArr[o3] = tmp.r; colArr[o3 + 1] = tmp.g; colArr[o3 + 2] = tmp.b; }
      }
      core.geometry.attributes.color.needsUpdate = true;
      // canali Na+: si accendono con m³h
      var q, nodeAct = 0;
      for (q = 0; q < nodeSites.length; q++) {
        var s = nodeSites[q], act = Math.min(1, c.m[s] * c.m[s] * c.m[s] * c.h[s] / 0.25);
        tmp.setRGB(0.76 + 0.24 * act, 0.25 + 0.65 * act, 0.05 + 0.2 * act); nodeInst.setColorAt(q, tmp);
        if (act > nodeAct) nodeAct = act;
      }
      nodeInst.instanceColor.needsUpdate = true;
      // pesi di emissione
      var wIn = new Float64Array(n - 1), wNa = new Float64Array(n), wK = new Float64Array(n), tIn = 0, tNa = 0, tK = 0, mIn = 0, mNa = 0, mK = 0;
      for (i = 0; i < n - 1; i++) { wIn[i] = Math.abs(c.gax[i] * (V[i] - V[i + 1])); tIn += wIn[i]; if (wIn[i] > mIn) mIn = wIn[i]; }
      for (i = 0; i < n; i++) if (c.isHH[i]) {
        wNa[i] = Math.max(0, c.m[i] * c.m[i] * c.m[i] * c.h[i] - 3e-4); tNa += wNa[i]; if (wNa[i] > mNa) mNa = wNa[i];
        wK[i] = Math.max(0, Math.pow(c.nn[i], 4) - 0.014); tK += wK[i]; if (wK[i] > mK) mK = wK[i];
      }
      ref.in = Math.max(ref.in * 0.9995, mIn, c.gax[Math.floor(n / 2)] * 15);
      ref.na = Math.max(ref.na * 0.9995, mNa, 0.05); ref.k = Math.max(ref.k * 0.9995, mK, 0.05);
      var aIn = Math.min(1, mIn / ref.in), aNa = Math.min(1, mNa / ref.na), aK = Math.min(1, mK / ref.k);
      function move(p, step) {
        for (var k = 0; k < p.n; k++) {
          if (p.life[k] <= 0) continue;
          p.life[k] -= step; var o3 = k * 3;
          if (p.life[k] <= 0) { p.pos[o3 + 1] = 1e4; continue; }
          p.pos[o3] += p.vel[o3] * step; p.pos[o3 + 1] += p.vel[o3 + 1] * step; p.pos[o3 + 2] += p.vel[o3 + 2] * step;
        }
        p.g.attributes.position.needsUpdate = true;
      }
      var step = force ? 0 : dt;
      move(pools.inn, step); move(pools.out, step); move(pools.na, step); move(pools.k, step);
      if (force) return;
      function spawnProb(a) { return Math.min(1, dt * 14 * a); }
      var k, p, o4, ang, rr, sgn, sp, site, pr;
      // corrente assiale (dentro: verso della corrente; fuori: ritorno)
      if (aIn > 0.04 && tIn > 0) {
        pr = spawnProb(aIn);
        for (k = 0; k < pools.inn.n; k++) if (pools.inn.life[k] <= 0 && Math.random() < pr) {
          site = pick(wIn, tIn); sgn = (c.gax[site] * (V[site] - V[site + 1])) > 0 ? 1 : -1; sp = 1.5 * (0.35 + 0.65 * Math.min(1, wIn[site] / ref.in));
          p = pools.inn; o4 = k * 3; ang = Math.random() * 6.2832; rr = Math.sqrt(Math.random()) * Rc * 0.75;
          p.pos[o4] = X[site] + Math.random() * (X[site + 1] - X[site]); p.pos[o4 + 1] = rr * Math.cos(ang); p.pos[o4 + 2] = rr * Math.sin(ang);
          p.vel[o4] = sgn * sp; p.vel[o4 + 1] = 0; p.vel[o4 + 2] = 0; p.life[k] = 0.3 + Math.random() * 0.15;
        }
        for (k = 0; k < pools.out.n; k++) if (pools.out.life[k] <= 0 && Math.random() < pr) {
          site = pick(wIn, tIn); sgn = (c.gax[site] * (V[site] - V[site + 1])) > 0 ? -1 : 1; sp = 1.2 * (0.35 + 0.65 * Math.min(1, wIn[site] / ref.in));
          p = pools.out; o4 = k * 3; ang = Math.random() * 6.2832; rr = R + 0.07 + Math.random() * 0.12;
          p.pos[o4] = X[site] + Math.random() * (X[site + 1] - X[site]); p.pos[o4 + 1] = rr * Math.cos(ang); p.pos[o4 + 2] = rr * Math.sin(ang);
          p.vel[o4] = sgn * sp; p.vel[o4 + 1] = 0; p.vel[o4 + 2] = 0; p.life[k] = 0.3 + Math.random() * 0.15;
        }
      }
      // Na+ che entra
      if (aNa > 0.05 && tNa > 0) {
        pr = spawnProb(aNa);
        for (k = 0; k < pools.na.n; k++) if (pools.na.life[k] <= 0 && Math.random() < pr) {
          site = pick(wNa, tNa); p = pools.na; o4 = k * 3; ang = Math.random() * 6.2832; rr = (cfg.type === 'myel' ? Rc : R) + 0.42;
          p.pos[o4] = X[site] + (Math.random() - 0.5) * 0.05; p.pos[o4 + 1] = rr * Math.cos(ang); p.pos[o4 + 2] = rr * Math.sin(ang);
          p.vel[o4] = 0; p.vel[o4 + 1] = -1.45 * Math.cos(ang); p.vel[o4 + 2] = -1.45 * Math.sin(ang); p.life[k] = 0.3;
        }
      }
      // K+ che esce
      if (aK > 0.05 && tK > 0) {
        pr = spawnProb(aK);
        for (k = 0; k < pools.k.n; k++) if (pools.k.life[k] <= 0 && Math.random() < pr) {
          site = pick(wK, tK); p = pools.k; o4 = k * 3; ang = Math.random() * 6.2832; rr = Rc * 0.5;
          p.pos[o4] = X[site] + (Math.random() - 0.5) * 0.05; p.pos[o4 + 1] = rr * Math.cos(ang); p.pos[o4 + 2] = rr * Math.sin(ang);
          p.vel[o4] = 0; p.vel[o4 + 1] = 1.4 * Math.cos(ang); p.vel[o4 + 2] = 1.4 * Math.sin(ang); p.life[k] = 0.33;
        }
      }
    }

    // adatta la distanza della camera alla larghezza disponibile (schermi stretti)
    var lastAsp = 0;
    function fit() {
      var a = scn.camera.aspect; if (!a || Math.abs(a - lastAsp) < 0.01) return; lastAsp = a;
      var d = Math.max(5.2, Math.min(18, 5.0 / (Math.tan(20 * Math.PI / 180) * a)));
      var dir = scn.camera.position.clone().sub(scn.controls.target).normalize(); scn.camera.position.copy(scn.controls.target).add(dir.multiplyScalar(d));
    }
    return { build: build, update: function (dt) { fit(); update(dt); }, dispose: clear };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
