/* Strutture reali dal Protein Data Bank (RCSB, dati pubblici): acquaporina 1, KcsA, NavAb, recettore nicotinico,
   connessina 26, GLUT1, Na⁺/K⁺-ATPasi (due stati) e rodopsina. I file sono ridotti allo scheletro Cα con
   tools/pdb2js.py e vengono caricati solo quando serve (js/pdb/*.js), per tenere leggera la pagina. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  /** Carica js/pdb/<nome>.js solo la prima volta (un <script> iniettato funziona anche aprendo index.html dal disco). */
  F.loadPdb = function (name, cb) {
    if (F.pdb && F.pdb[name]) { cb(F.pdb[name]); return; }
    var s = document.createElement('script'); s.src = 'js/pdb/' + name + '.js';
    s.onload = function () { cb(F.pdb && F.pdb[name]); };
    s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  };

  var LIST = [
    ['aqp1', 'Acquaporina 1 (AQP1): il canale dell\'acqua'],
    ['kcsa', 'KcsA: canale del K⁺ e filtro di selettività'],
    ['navab', 'NavAb: canale del Na⁺ voltaggio-dipendente'],
    ['nachr', 'Recettore nicotinico dell\'acetilcolina'],
    ['cx26', 'Connessina 26: canale di giunzione (sinapsi elettrica)'],
    ['glut1', 'GLUT1: trasportatore del glucosio'],
    ['nka', 'Na⁺/K⁺-ATPasi: stati E1 ed E2'],
    ['rodopsina', 'Rodopsina: recettore a 7 eliche con retinale']
  ];

  var INFO = {
    aqp1: {
      lead: 'Quattro subunità identiche (colori diversi) attorno a un asse centrale: ognuna è un canale dell\'acqua indipendente.',
      pts: [
        'Ogni subunità ha 6 eliche transmembrana e due brevi mezze eliche che si incontrano a metà membrana con i motivi <b>NPA</b> (verde): è la forma a <b>clessidra</b>.',
        'Nel poro, largo circa 3 Å, le molecole d\'acqua (puntini rossi, visibili nella struttura cristallina) passano <b>in fila indiana</b>.',
        'La strozzatura <b>ar/R</b> (arancio: residui aromatici e un\'arginina) fa da filtro: lascia passare l\'acqua e non i soluti più grandi; la carica positiva dell\'arginina respinge i protoni e i cationi.',
        'Il mercurio (Hg²⁺) blocca AQP1 legandosi a una cisteina vicino alla strozzatura: è il blocco che si prova nel simulatore dell\'eritrocita.'
      ],
      look: 'Attiva «Sezione» per vedere dentro un poro e «Acque, ioni e ligandi» per vedere la fila di molecole d\'acqua.'
    },
    kcsa: {
      lead: 'Quattro subunità (colori diversi) disposte come un cono attorno al poro; il lato extracellulare è in alto.',
      pts: [
        'Il <b>filtro di selettività</b> è la sequenza <b>TVGYG</b> (arancio): gli ossigeni carbonilici dello scheletro delimitano siti in fila dove sta uno ione K⁺ deidratato (sfere viola).',
        'Gli ossigeni del filtro prendono il posto dell\'acqua di idratazione del K⁺: il costo di deidratazione è compensato. Il Na⁺ è più piccolo e non si adatta alla stessa geometria: la selettività K⁺/Na⁺ è dell\'ordine di 10 000 a 1.',
        'Sotto il filtro c\'è una cavità piena d\'acqua; in questa struttura le eliche si incrociano verso il citoplasma e il <b>cancello è chiuso</b>.'
      ],
      look: 'Prova «Sezione» e guarda gli ioni K⁺ in fila nel filtro.'
    },
    navab: {
      lead: 'Canale del Na⁺ voltaggio-dipendente di un batterio: 4 subunità identiche (nei canali Nav umani sono quattro domini di un\'unica catena).',
      pts: [
        'Ogni subunità ha 6 eliche: S1–S4 formano il <b>sensore di voltaggio</b>, S5–S6 formano il <b>poro</b> (al centro).',
        'S4 contiene arginine cariche positive (verde): si muovono quando cambia il campo elettrico e aprono la porta di attivazione.',
        'Il filtro <b>TLESWSM</b> (arancio) ha un glutammato con carica negativa: è alla base della selettività per il Na⁺.'
      ],
      look: 'Confronta con KcsA: stesso schema del poro, ma qui ogni subunità ha anche il sensore di voltaggio.'
    },
    nachr: {
      lead: 'Cinque subunità (α, α, β, γ, δ) disposte come i petali di un fiore attorno al canale centrale; il grande dominio extracellulare sta in alto.',
      pts: [
        'È un <b>canale cationico</b> aperto dal legame dell\'acetilcolina: i siti di legame sono nel dominio extracellulare, all\'interfaccia fra una subunità α e quella vicina.',
        'Il poro è rivestito dalle eliche M2 delle cinque subunità. Aprendosi, lascia passare Na⁺ (verso l\'interno) e K⁺ (verso l\'esterno): prevale la depolarizzazione, cioè il potenziale di placca.',
        'È il recettore bersaglio del curaro (che occupa i siti dell\'ACh) e della miastenia grave (anticorpi contro i recettori).'
      ],
      look: 'Struttura a bassa risoluzione (4 Å): si vedono le catene e le eliche, non i dettagli atomici.'
    },
    cx26: {
      lead: 'Dodici connessine: due emicanali (connessoni) di sei, ciascuno nella membrana di una cellula, agganciati nello spazio extracellulare.',
      pts: [
        'Ogni connessina ha 4 eliche transmembrana; sei connessine formano un <b>emicanale</b>.',
        'Due emicanali di cellule vicine si legano tramite le anse extracellulari e formano il <b>canale di giunzione</b> (giunzione comunicante), che collega direttamente i due citoplasmi.',
        'Il poro centrale è largo e lascia passare ioni e piccole molecole: la trasmissione è immediata e bidirezionale.'
      ],
      look: 'Si vedono le due membrane (strisce) con la fessura che le separa. Attiva «Sezione» per guardare il poro centrale.'
    },
    glut1: {
      lead: 'Trasportatore del glucosio dell\'uomo, in forma aperta verso il citoplasma (<i>inward-open</i>).',
      pts: [
        '12 eliche transmembrana divise in due metà (N e C) che racchiudono il sito di legame del glucosio.',
        'Funziona per <b>accesso alternato</b>: il sito si apre prima da un lato e poi dall\'altro della membrana (modello «ping-pong»). Non è un canale con un poro sempre aperto.',
        'È un esempio di <b>diffusione facilitata</b>: nessuna energia, il flusso segue il gradiente (e satura, cinetica di Michaelis-Menten).'
      ],
      look: 'Guarda l\'apertura verso il basso (citoplasma): dall\'altra parte il sito è chiuso.'
    },
    nka: {
      lead: 'Subunità α in due stati reali: E1 con 3 Na⁺ (sfere oro) ed E2 con 2 K⁺ (sfere viola). Il cursore passa da uno all\'altro.',
      pts: [
        'Il grande dominio citoplasmatico (in basso) porta il sito dell\'<b>ATP</b> e l\'<b>Asp369</b> che viene fosforilato (arancio).',
        'In E1 (3WGU) i 3 Na⁺ sono nel sito di trasporto a metà membrana; nel sito dell\'ATP ci sono ADP e un analogo del fosfato (AlF₄⁻). In E2 (2ZXE) al loro posto ci sono 2 K⁺ e un analogo del fosfato (MgF₄²⁻).',
        'Passando da E1 a E2 i domini citoplasmatici si riorganizzano e le eliche transmembrana si spostano: il sito di legame si apre verso l\'esterno e poi verso il citosol.',
        '<b>Attenzione:</b> sono due strutture sperimentali; le posizioni intermedie del cursore sono un\'interpolazione lineare, non un filmato sperimentale. Le subunità β e γ non sono mostrate.'
      ],
      look: 'Sposta il cursore o premi «Anima il ciclo»; gli ioni mostrati sono quelli dello stato più vicino.'
    },
    rodopsina: {
      lead: 'Recettore a sette eliche transmembrana (come i recettori accoppiati a proteine G); il lato extracellulare è in alto.',
      pts: [
        'Il <b>retinale</b> (bastoncini) è legato alla Lys296 (verde) con un legame di base di Schiff; il Glu113 (arancio) fa da controione.',
        'La luce converte il retinale da <b>11-cis</b> a <b>tutto-trans</b>: il cambio di forma attiva il recettore, che attiva la proteina G (transducina).',
        'Lo stesso schema a 7 eliche si trova in molti recettori dei neurotrasmettitori che agiscono tramite proteine G (per esempio i recettori D1/D2 della dopamina).'
      ],
      look: 'Attiva «Acque, ioni e ligandi» per vedere il retinale nella tasca fra le eliche.'
    }
  };

  var PAL = ['#4f86d0', '#e8913a', '#3fa87f', '#c75b9b', '#8e6cc4', '#d9b53a', '#4bb3c9', '#d9534f', '#7a8b99', '#9a6b3f', '#6bbf59', '#c46a3c'];
  var ELCOL = { K: '#7b4fc4', NA: '#e0a82e', MG: '#3ba55d', C: '#a8b0b8', O: '#e0453a', N: '#3b6fd4', P: '#e8913a', S: '#d9c83a', F: '#7ac943', AL: '#9aa0a8', HOH: '#e0453a' };

  F.registerSim('strutture', {
    title: 'Strutture reali dal Protein Data Bank',
    section: 'canali',
    short: 'Acquaporina, canali del K⁺ e del Na⁺, recettore nicotinico, connessina, GLUT1, pompa Na⁺/K⁺ e rodopsina: le coordinate sperimentali, con il filtro di selettività, gli ioni e le molecole d\'acqua.',
    mount: function (host, P) {
      var L = U.simLayout(host), THREE = G.THREE;
      var st = { prot: P.prot || 'aqp1', rep: 'tube', col: 'chain', mem: true, marks: true, extras: true, section: false, spin: false, t: 0, play: false, data: null, token: 0 };
      var pSel = U.select({ label: 'Proteina', value: st.prot, options: LIST, onChange: function (v) { load(v); } });
      var rSel = U.seg({ label: 'Rappresentazione', value: st.rep, options: [['tube', 'Nastri'], ['ca', 'Scheletro Cα']], onChange: function (v) { st.rep = v; rebuild(); } });
      var cSel = U.seg({ label: 'Colore', value: st.col, options: [['chain', 'Per catena'], ['rainbow', 'N → C'], ['ss', 'Struttura']], onChange: function (v) { st.col = v; rebuild(); } });
      var tMem = U.toggle({ label: 'Doppio strato lipidico (fascia)', value: st.mem, onChange: function (v) { st.mem = v; vis(); } });
      var tMk = U.toggle({ label: 'Residui chiave (con etichetta)', value: st.marks, onChange: function (v) { st.marks = v; vis(); } });
      var tEx = U.toggle({ label: 'Acque, ioni e ligandi', value: st.extras, onChange: function (v) { st.extras = v; vis(); } });
      var tSec = U.toggle({ label: 'Sezione (taglia a metà)', value: st.section, onChange: function (v) { st.section = v; clip(); } });
      var tSpin = U.toggle({ label: 'Rotazione lenta', value: st.spin, onChange: function (v) { st.spin = v; if (scn) scn.controls.autoRotate = v; } });
      var sT = U.slider({ label: 'Stato: E1 (3 Na⁺) ↔ E2 (2 K⁺)', min: 0, max: 1, step: 0.01, value: 0, fmt: function (v) { return v < 0.02 ? 'E1' : (v > 0.98 ? 'E2' : Math.round(v * 100) + '% verso E2'); }, onInput: function (v) { st.t = v; st.play = false; bPlay.textContent = 'Anima il ciclo'; morph(); } });
      var bPlay = U.button('Anima il ciclo', function () { st.play = !st.play; bPlay.textContent = st.play ? 'Ferma' : 'Anima il ciclo'; });
      var pumpBox = el('div', { class: 'ctl' }, [sT.el, bPlay]);
      L.controls.appendChild(pSel.el); L.controls.appendChild(U.group('Aspetto', [rSel.el, cSel.el]));
      L.controls.appendChild(U.group('Mostra', [tMem.el, tMk.el, tEx.el, tSec.el, tSpin.el])); L.controls.appendChild(pumpBox);
      L.controls.appendChild(U.params('Coordinate sperimentali del <b>Protein Data Bank</b> (RCSB, dati pubblici), ridotte allo scheletro (atomi Cα) con <code>tools/pdb2js.py</code> per tenere leggera la pagina; ioni, acque del poro e ligandi importanti sono conservati. Le strutture sono state orientate con la membrana in orizzontale e il lato extracellulare in alto; lo spessore della fascia (≈ 30 Å) è una stima. Nastri: spessore diverso per eliche, foglietti e anse (struttura secondaria dalle annotazioni del file). Sono modelli di cristalli: le proteine reali si muovono continuamente.'));

      var info = el('div', { class: 'box', style: { marginTop: '10px' } });
      var scn = F.scene3d(L.main, { height: function (w) { return Math.round(Math.max(320, Math.min(520, w * 0.72))); }, camPos: [0, 40, 160], fov: 40, minDistance: 20, maxDistance: 600, hint: 'Trascina per ruotare · rotellina per lo zoom' });
      var status = el('div', { class: 'statusline' }); L.main.appendChild(status); L.main.appendChild(info);
      var root = null, plane = null, objs = [], tubes = [], tubeSetup = null, markObjs = [], extraObjs = [], memObjs = [], loading = false;
      if (scn && THREE) { scn.renderer.localClippingEnabled = true; plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0); }

      // ------------------------------------------------------------- caricamento
      function load(name) {
        st.prot = name; var tk = ++st.token; status.textContent = 'Caricamento della struttura…';
        F.loadPdb(name, function (d) {
          if (tk !== st.token) return;
          if (!d) { status.textContent = 'Struttura non disponibile.'; return; }
          st.data = d; st.t = 0; st.play = false; sT.set(0, true); bPlay.textContent = 'Anima il ciclo';
          pumpBox.style.display = name === 'nka' ? '' : 'none';
          rebuild(true); describe();
        });
      }
      function describe() {
        var d = st.data, I = INFO[st.prot]; if (!d || !I) return;
        var res = d.res ? ' · risoluzione ' + F.fmt(d.res, 1) + ' Å' : '';
        var ids = 'PDB <b>' + d.id + '</b>' + (d.id2 ? ' e <b>' + d.id2 + '</b>' : '') + res;
        status.innerHTML = ids + ' · ' + d.n + ' residui' + (d.nch > 1 ? ' in ' + d.nch + ' catene' : '');
        var cite = d.cite + (d.doi ? ' · doi:' + d.doi : '') + (d.cite2 ? ' | ' + d.cite2 + (d.doi2 ? ' · doi:' + d.doi2 : '') : '');
        info.innerHTML = '<b>' + (LIST.filter(function (x) { return x[0] === st.prot; })[0] || [0, ''])[1] + '</b><br>' + I.lead + '<ul style="margin:6px 0 4px 18px">' + I.pts.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' + (I.look ? '<div class="small" style="margin-top:4px"><i>' + I.look + '</i></div>' : '') + '<div class="small muted" style="margin-top:6px">Fonte: ' + cite + '. Dati del Protein Data Bank (RCSB).</div>';
      }

      // ------------------------------------------------------------- geometria
      function colorFor(d, i) {
        var u = 0, k; // catena di appartenenza e posizione nella catena
        for (k = 0; k < d.seg.length; k++) if (i >= d.seg[k][0] && i < d.seg[k][0] + d.seg[k][1]) { u = d.seg[k][2]; break; }
        var c = new THREE.Color();
        if (st.col === 'chain') c.set(PAL[u % PAL.length]);
        else if (st.col === 'ss') c.set(d.ss[i] === '1' ? '#d9534f' : (d.ss[i] === '2' ? '#f0ad4e' : '#9aa5b1'));
        else {
          var first = 1e9, last = 0; d.seg.forEach(function (sg) { if (sg[2] === u) { first = Math.min(first, sg[0]); last = Math.max(last, sg[0] + sg[1] - 1); } });
          c.setHSL((1 - (i - first) / Math.max(1, last - first)) * 0.7, 0.75, 0.52);
        }
        return c.convertSRGBToLinear();
      }
      function pos(d, i, t) { var a = d.xyz, o = 3 * i; if (t > 0 && d.xyz2) { var b = d.xyz2; return [(a[o] + (b[o] - a[o]) * t) / 10, (a[o + 1] + (b[o + 1] - a[o + 1]) * t) / 10, (a[o + 2] + (b[o + 2] - a[o + 2]) * t) / 10]; } return [a[o] / 10, a[o + 1] / 10, a[o + 2] / 10]; }
      function radiusFor(d, i) { return d.ss[i] === '1' ? 1.15 : (d.ss[i] === '2' ? 0.85 : 0.42); }

      /** Tubo con raggio e colore variabili lungo la catena (trasporto parallelo del riferimento locale). */
      function buildTube(d, s0, len, t) {
        var pts = [], rad = [], col = [], i;
        for (i = 0; i < len; i++) { var p = pos(d, s0 + i, t); pts.push(new THREE.Vector3(p[0], p[1], p[2])); rad.push(radiusFor(d, s0 + i)); col.push(colorFor(d, s0 + i)); }
        if (len < 2) return null;
        var per = 3, n = (len - 1) * per + 1, nr = 8, curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), P = curve.getPoints(n - 1), T = [], N = [], j, k;
        for (j = 0; j < n; j++) { var a = P[Math.max(0, j - 1)], b = P[Math.min(n - 1, j + 1)]; T.push(b.clone().sub(a).normalize()); }
        var n0 = new THREE.Vector3(1, 0, 0); if (Math.abs(T[0].x) > 0.9) n0.set(0, 1, 0); n0.cross(T[0]).normalize(); N.push(n0);
        for (j = 1; j < n; j++) { var q = new THREE.Quaternion().setFromUnitVectors(T[j - 1], T[j]); N.push(N[j - 1].clone().applyQuaternion(q).normalize()); }
        var posA = new Float32Array(n * nr * 3), colA = new Float32Array(n * nr * 3), idx = [];
        for (j = 0; j < n; j++) {
          var f = j / per, i0 = Math.min(len - 1, Math.floor(f)), i1 = Math.min(len - 1, i0 + 1), u = f - i0, r = rad[i0] + (rad[i1] - rad[i0]) * u;
          var cr = col[i0].r + (col[i1].r - col[i0].r) * u, cg = col[i0].g + (col[i1].g - col[i0].g) * u, cb = col[i0].b + (col[i1].b - col[i0].b) * u;
          var B = T[j].clone().cross(N[j]);
          if (j === 0 || j === n - 1) r *= 0.6;
          for (k = 0; k < nr; k++) {
            var an = k / nr * 6.2832, c = Math.cos(an), s = Math.sin(an), o = (j * nr + k) * 3;
            posA[o] = P[j].x + r * (c * N[j].x + s * B.x); posA[o + 1] = P[j].y + r * (c * N[j].y + s * B.y); posA[o + 2] = P[j].z + r * (c * N[j].z + s * B.z);
            colA[o] = cr; colA[o + 1] = cg; colA[o + 2] = cb;
          }
          if (j < n - 1) for (k = 0; k < nr; k++) { var a0 = j * nr + k, b0 = j * nr + (k + 1) % nr, c0 = (j + 1) * nr + k, d0 = (j + 1) * nr + (k + 1) % nr; idx.push(a0, c0, b0, b0, c0, d0); }
        }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(posA, 3)); g.setAttribute('color', new THREE.BufferAttribute(colA, 3)); g.setIndex(idx); g.computeVertexNormals();
        return g;
      }
      function buildLine(d, s0, len, t) {
        var pa = new Float32Array(len * 3), ca = new Float32Array(len * 3);
        for (var i = 0; i < len; i++) { var p = pos(d, s0 + i, t), c = colorFor(d, s0 + i); pa.set(p, i * 3); ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pa, 3)); g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); return g;
      }
      function mat(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide }, o || {})); } // DoubleSide: con la sezione si vede l'interno delle sfere tagliate
      function sphere(p, r, color) { var m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color)); m.position.set(p[0], p[1], p[2]); return m; }

      function clearAll() {
        if (root) { scn.scene.remove(root); root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
        scn.clearLabels(); tubes = []; markObjs = []; extraObjs = []; memObjs = [];
      }
      function rebuild(reset) {
        if (!scn || !st.data) return;
        var d = st.data; clearAll(); root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scn.scene.add(root);
        // fasce della membrana
        var R = 0, i; for (i = 0; i < d.n; i++) R = Math.max(R, Math.hypot(d.xyz[3 * i], d.xyz[3 * i + 1]) / 10);
        var W = 2 * R + 40;
        d.mem.forEach(function (m) {
          var slab = new THREE.Mesh(new THREE.BoxGeometry(W, W, m[1] - m[0]), new THREE.MeshStandardMaterial({ color: 0xd9c9a3, transparent: true, opacity: 0.2, depthWrite: false, roughness: 0.9 }));
          slab.position.z = (m[0] + m[1]) / 2; slab.userData.keep = true; root.add(slab); memObjs.push(slab);
        });
        // catena/e
        d.seg.forEach(function (s) {
          var o;
          if (st.rep === 'tube') { var g = buildTube(d, s[0], s[1], st.t); if (!g) return; o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide })); }
          else { var gl = buildLine(d, s[0], s[1], st.t); o = new THREE.Line(gl, new THREE.LineBasicMaterial({ vertexColors: true })); }
          o.userData.seg = s; root.add(o); tubes.push(o);
        });
        // residui chiave
        d.marks.forEach(function (m, mi) {
          m.i.forEach(function (ri, k) { var sp = sphere(pos(d, ri, st.t), 2.0, m.c); sp.userData.ri = ri; root.add(sp); markObjs.push(sp); if (k === 0) { var lb = scn.label(sp, m.t); lb.el.classList.add('pdb-label'); markObjs[markObjs.length - 1].userData.lab = lb; } });
        });
        // ioni, acque, ligandi
        function addExtras(ions, lig, key) {
          ions.forEach(function (io) { var sp = sphere([io[1] / 10, io[2] / 10, io[3] / 10], io[0] === 'K' ? 2.7 : (io[0] === 'MG' ? 1.9 : 2.5), ELCOL[io[0]] || '#888'); sp.userData.state = key; sp.material.depthTest = false; sp.renderOrder = 6; root.add(sp); extraObjs.push(sp); });
          lig.forEach(function (lg) {
            var at = lg.atoms.map(function (a) { return new THREE.Vector3(a[1] / 10, a[2] / 10, a[3] / 10); });
            lg.atoms.forEach(function (a, ai) { var sp = sphere([at[ai].x, at[ai].y, at[ai].z], a[0] === 'AL' || a[0] === 'MG' || a[0] === 'F' ? 0.9 : 0.55, ELCOL[a[0]] || '#a8b0b8'); sp.userData.state = key; root.add(sp); extraObjs.push(sp); });
            lg.bonds.forEach(function (b) {
              var a = at[b[0]], c = at[b[1]], len = a.distanceTo(c), cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, len, 8), mat('#b7bec6'));
              cyl.position.copy(a).add(c).multiplyScalar(0.5); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize()); cyl.userData.state = key; root.add(cyl); extraObjs.push(cyl);
            });
          });
        }
        addExtras(d.ions, d.lig, 0);
        if (d.ions2) addExtras(d.ions2, d.lig2 || [], 1);
        d.water.forEach(function (w) { var sp = sphere([w[0] / 10, w[1] / 10, w[2] / 10], 0.85, ELCOL.HOH); sp.userData.state = -1; root.add(sp); extraObjs.push(sp); });
        vis(); clip();
        if (reset) {
          var cx = 0, cy = 0, cz = 0; for (i = 0; i < d.n; i++) { cx += d.xyz[3 * i]; cy += d.xyz[3 * i + 1]; cz += d.xyz[3 * i + 2]; } cx /= 10 * d.n; cy /= 10 * d.n; cz /= 10 * d.n;
          var Rb = 0; for (i = 0; i < d.n; i++) Rb = Math.max(Rb, Math.hypot(d.xyz[3 * i] / 10 - cx, d.xyz[3 * i + 1] / 10 - cy, d.xyz[3 * i + 2] / 10 - cz));
          var tgt = new THREE.Vector3(cx, cz, -cy), dist = Rb * 3.0;
          scn.controls.target.copy(tgt); scn.camera.position.set(tgt.x + dist * 0.55, tgt.y + dist * 0.25, tgt.z + dist * 0.8); scn.controls.minDistance = Rb * 0.6; scn.controls.maxDistance = Rb * 8; scn.controls.update();
        }
      }
      function vis() {
        memObjs.forEach(function (m) { m.visible = st.mem; });
        markObjs.forEach(function (m) { m.visible = st.marks; if (m.userData.lab) m.userData.lab.visible = st.marks; });
        var near = st.t > 0.5 ? 1 : 0;
        extraObjs.forEach(function (o) { var s = o.userData.state; o.visible = st.extras && (s === -1 || s === near); });
      }
      function clip() {
        if (!root) return;
        root.traverse(function (o) {
          if (o.material && !o.userData.keep) { o.material.clippingPlanes = st.section ? [plane] : []; o.material.clipShadows = false; o.material.needsUpdate = true; }
        });
        if (st.section && st.spin) { st.spin = false; tSpin.set(false); if (scn) scn.controls.autoRotate = false; }
      }
      /** Interpolazione tra le due strutture (solo per la pompa): si ricostruiscono i nastri e si spostano i residui chiave. */
      function morph() {
        if (!st.data || !st.data.xyz2) return;
        var d = st.data;
        tubes.forEach(function (o) {
          var s = o.userData.seg, g = st.rep === 'tube' ? buildTube(d, s[0], s[1], st.t) : buildLine(d, s[0], s[1], st.t);
          if (g) { o.geometry.dispose(); o.geometry = g; }
        });
        markObjs.forEach(function (m) { var p = pos(d, m.userData.ri, st.t); m.position.set(p[0], p[1], p[2]); });
        vis();
      }

      // ------------------------------------------------------------- ciclo di animazione
      if (scn) scn.onFrame(function (dt) {
        if (st.play && st.data && st.data.xyz2) {
          st.dir = st.dir || 1; st.t += st.dir * dt * 0.18;
          if (st.t >= 1) { st.t = 1; st.dir = -1; } else if (st.t <= 0) { st.t = 0; st.dir = 1; }
          sT.set(st.t, true); morph();
        }
      });
      pumpBox.style.display = st.prot === 'nka' ? '' : 'none';
      load(st.prot);

      /*EXPLAIN-START*/
      var go = function (o) {
        pSel.set(o.prot); if (o.rep) rSel.set(o.rep); if (o.col) cSel.set(o.col);
        st.marks = true; tMk.set(true, true); st.extras = true; tEx.set(true, true); st.mem = true; tMem.set(true, true);
        st.section = !!o.section; tSec.set(!!o.section, true); st.spin = false; tSpin.set(false, true); if (scn) scn.controls.autoRotate = false;
        if (o.t !== undefined) { st.t = o.t; sT.set(o.t, true); }
        // pSel.set richiama load() che azzera lo stato: la sezione si applica dopo il caricamento
        setTimeout(function () { st.section = !!o.section; tSec.set(!!o.section, true); if (o.t !== undefined) { st.t = o.t; sT.set(o.t, true); morph(); } clip(); }, 350);
      };
      U.explainer(L, {
        legend: [['#d9480f', 'arancio: filtro / strozzatura / sito attivo'], ['#2e9e5b', 'verde: residui funzionali (NPA, S4, Lys296)'], ['#e0453a', 'rosso: molecole d\'acqua e ossigeno'], ['#7b4fc4', 'viola: K⁺'], ['#e0a82e', 'oro: Na⁺']],
        narrate: function () {
          var I = INFO[st.prot]; if (!I) return 'Caricamento…';
          return I.lead + ' ' + (I.look || '') + ' Trascina per ruotare, rotellina per lo zoom; <b>«Sezione»</b> taglia la proteina a metà per vedere il poro.';
        },
        experiments: [
          { label: 'Acquaporina: la fila di acqua', run: function () { go({ prot: 'aqp1', section: true, rep: 'tube', col: 'chain' }); }, why: 'La sezione mostra un poro: le molecole d\'acqua (rosse) stanno in <b>fila indiana</b> fra la strozzatura ar/R (arancio) e i due motivi NPA (verdi) a metà membrana.' },
          { label: 'KcsA: gli ioni nel filtro', run: function () { go({ prot: 'kcsa', section: true }); }, why: 'Gli ioni K⁺ deidratati (viola) occupano il filtro TVGYG (arancio): gli ossigeni dello scheletro prendono il posto delle molecole d\'acqua di idratazione.' },
          { label: 'NavAb: sensore e poro', run: function () { go({ prot: 'navab', col: 'rainbow' }); }, why: 'Ogni subunità ha un sensore di voltaggio periferico (S4 con le arginine, verde) e contribuisce al poro centrale con il filtro (arancio). Il colore blu → rosso segue la catena dall\'estremità N alla C.' },
          { label: 'Recettore dell\'ACh: 5 subunità', run: function () { go({ prot: 'nachr', col: 'chain' }); }, why: 'Cinque catene attorno al poro: il grande dominio extracellulare (in alto) porta i siti per l\'ACh, il dominio transmembrana forma il canale.' },
          { label: 'Connessina: due emicanali', run: function () { go({ prot: 'cx26', col: 'chain', section: true }); }, why: 'Due emicanali di sei connessine, uno per cellula, agganciati nella fessura extracellulare: il poro centrale collega i due citoplasmi (sinapsi elettrica).' },
          { label: 'GLUT1: aperto verso il citosol', run: function () { go({ prot: 'glut1', col: 'rainbow' }); }, why: 'Un trasportatore non ha un poro sempre aperto: in questa struttura il sito è accessibile dal citoplasma (in basso) e chiuso verso l\'esterno; poi cambia conformazione (accesso alternato).' },
          { label: 'Pompa Na⁺/K⁺: stato E1', run: function () { go({ prot: 'nka', col: 'rainbow', t: 0, section: true }); }, why: 'Stato E1 con 3 Na⁺ (oro) nel sito di trasporto e ADP + analogo del fosfato nel sito dell\'ATP, sul grande dominio citoplasmatico (in basso).' },
          { label: 'Pompa Na⁺/K⁺: stato E2', run: function () { go({ prot: 'nka', col: 'rainbow', t: 1, section: true }); }, why: 'Stato E2 con 2 K⁺ (viola): i domini citoplasmatici si sono riorganizzati e le eliche transmembrana si sono spostate. Le posizioni intermedie del cursore sono una interpolazione, non una misura.' },
          { label: 'Rodopsina: il retinale', run: function () { go({ prot: 'rodopsina', col: 'ss', section: true }); }, why: 'Sette eliche (rosse) racchiudono il retinale, legato alla Lys296: è il recettore a 7 eliche che la luce attiva.' }
        ]
      });
      /*EXPLAIN-END*/

      return { destroy: function () { st.token++; if (scn) scn.dispose(); } };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
