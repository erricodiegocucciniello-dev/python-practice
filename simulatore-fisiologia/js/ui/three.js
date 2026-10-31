/* Supporto per le scene 3D (three.js r147 + OrbitControls). */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui;

  F.webglOK = (function () {
    try {
      var c = document.createElement('canvas');
      return !!(G.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  })();

  /** Crea una scena 3D nel contenitore. o: {height, camPos:[x,y,z], target:[x,y,z], fov, zoom:bool}
      Restituisce {scene, camera, renderer, controls, onFrame(fn), labels, dispose}. */
  F.scene3d = function (host, o) {
    o = o || {};
    var wrap = U.el('div', { class: 'view3d' });
    host.appendChild(wrap);
    if (!F.webglOK || !G.THREE) {
      wrap.appendChild(U.el('div', { class: 'err3d', html: 'Il tuo browser non supporta la grafica 3D (WebGL). I grafici e i valori numerici qui sotto restano validi.' }));
      return null;
    }
    var THREE = G.THREE;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, G.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    wrap.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(o.fov || 40, 1, 0.1, 5000);
    var cp = o.camPos || [0, 4, 12]; camera.position.set(cp[0], cp[1], cp[2]);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    var tg = o.target || [0, 0, 0]; controls.target.set(tg[0], tg[1], tg[2]);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enableZoom = o.zoom !== false; controls.enablePan = false;
    if (o.minDistance) controls.minDistance = o.minDistance;
    if (o.maxDistance) controls.maxDistance = o.maxDistance;
    controls.update();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.85));
    var dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(5, 10, 7); scene.add(dl);
    var dl2 = new THREE.DirectionalLight(0xffffff, 0.25); dl2.position.set(-6, -3, -5); scene.add(dl2);
    wrap.appendChild(U.el('div', { class: 'hint3d', text: o.hint || 'Trascina per ruotare · rotellina/pizzico per lo zoom' }));
    var labels = [];
    var resize = function () {
      var w = Math.max(200, wrap.clientWidth), h = typeof o.height === 'function' ? o.height(w) : (o.height || 360);
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    var ro = ('ResizeObserver' in G) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(wrap);
    resize();
    var frameFns = [], v = new THREE.Vector3();
    var loop = U.loop(wrap, function (dt) {
      frameFns.forEach(function (f) { f(dt); });
      controls.update();
      renderer.render(scene, camera);
      var w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
      labels.forEach(function (L) {
        if (!L.obj) return;
        L.obj.getWorldPosition(v); v.project(camera);
        var vis = v.z < 1 && L.visible !== false;
        L.el.style.display = vis ? 'block' : 'none';
        L.el.style.left = ((v.x + 1) / 2 * w) + 'px'; L.el.style.top = ((1 - v.y) / 2 * h) + 'px';
      });
    });
    return {
      THREE: THREE, scene: scene, camera: camera, renderer: renderer, controls: controls, wrap: wrap,
      onFrame: function (fn) { frameFns.push(fn); },
      /** Etichetta HTML agganciata a un oggetto 3D. */
      label: function (obj, text, fixed) {
        var e = U.el('div', { class: 'label3d', html: text }); wrap.appendChild(e);
        var L = { obj: obj, el: e, fixed: !!fixed }; labels.push(L); return L;
      },
      /** Rimuove le etichette non fisse (quando si ricostruisce la scena). */
      clearLabels: function () {
        for (var i = labels.length - 1; i >= 0; i--) if (!labels[i].fixed) { labels[i].el.remove(); labels.splice(i, 1); }
      },
      dispose: function () {
        loop.stop(); if (ro) ro.disconnect();
        scene.traverse(function (ob) {
          if (ob.geometry) ob.geometry.dispose();
          if (ob.material) { (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(function (m) { m.dispose(); }); }
        });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      }
    };
  };

  /** Materiale standard opaco. */
  F.mat = function (color, opts) {
    var THREE = G.THREE;
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.55, metalness: 0.05 }, opts || {}));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
