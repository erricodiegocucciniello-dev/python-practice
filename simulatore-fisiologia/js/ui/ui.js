/* Componenti dell'interfaccia: controlli, riquadri, formule, domande "Prevedi", quiz. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui = {};

  U.el = function (tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (children || []).forEach(function (c) { if (c !== null && c !== undefined) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };
  var el = U.el;

  /** Colore da variabile CSS (aggiornato col tema). */
  U.css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; };

  /** Formattazione con virgola decimale. */
  U.num = function (v, d) { return F.fmt(v, d); };

  /** Cursore. o: {label, min, max, step, value, unit, digits, log, onInput, fmt} */
  U.slider = function (o) {
    var out = el('output'), input = el('input', { type: 'range' });
    var log = !!o.log, lo = log ? Math.log10(o.min) : o.min, hi = log ? Math.log10(o.max) : o.max;
    input.min = lo; input.max = hi; input.step = log ? (hi - lo) / 400 : (o.step || (hi - lo) / 100);
    var toVal = function (s) { var x = parseFloat(s); return log ? Math.pow(10, x) : x; };
    var show = function (v) {
      out.textContent = o.fmt ? o.fmt(v) : (U.num(v, o.digits === undefined ? 1 : o.digits) + (o.unit ? ' ' + o.unit : ''));
    };
    var set = function (v, silent) {
      input.value = log ? Math.log10(v) : v; show(v);
      if (!silent && o.onInput) o.onInput(v);
    };
    input.addEventListener('input', function () { var v = toVal(input.value); if (!log && o.step) v = Math.round(v / o.step) * o.step; show(v); if (o.onInput) o.onInput(v); });
    var id = 'c' + Math.random().toString(36).slice(2, 9);
    input.id = id; input.setAttribute('aria-label', o.label);
    var wrap = el('div', { class: 'ctl' }, [el('div', { class: 'ctl-row' }, [el('label', { for: id, html: o.label }), out]), input]);
    set(o.value, true);
    return { el: wrap, get: function () { return toVal(input.value); }, set: set, input: input };
  };

  U.select = function (o) {
    var s = el('select');
    o.options.forEach(function (op) { var e = el('option', { value: op[0], text: op[1] }); s.appendChild(e); });
    s.value = o.value;
    s.addEventListener('change', function () { if (o.onChange) o.onChange(s.value); });
    var id = 'c' + Math.random().toString(36).slice(2, 9); s.id = id;
    var wrap = el('div', { class: 'ctl' }, [o.label ? el('div', { class: 'ctl-row' }, [el('label', { for: id, html: o.label })]) : null, s]);
    return { el: wrap, get: function () { return s.value; }, set: function (v) { s.value = v; if (o.onChange) o.onChange(v); } };
  };

  U.toggle = function (o) {
    var c = el('input', { type: 'checkbox' }); c.checked = !!o.value;
    c.addEventListener('change', function () { if (o.onChange) o.onChange(c.checked); });
    var wrap = el('label', { class: 'switch' }, [c, el('span', { html: o.label })]);
    return { el: wrap, get: function () { return c.checked; }, set: function (v) { c.checked = v; if (o.onChange) o.onChange(v); } };
  };

  /** Selettore a segmenti. o: {options:[[val,label]], value, onChange} */
  U.seg = function (o) {
    var w = el('div', { class: 'seg', role: 'group' }), cur = o.value, btns = [];
    o.options.forEach(function (op) {
      var b = el('button', { type: 'button', 'aria-pressed': String(op[0] === cur), html: op[1] });
      b.addEventListener('click', function () { set(op[0]); });
      btns.push([op[0], b]); w.appendChild(b);
    });
    var set = function (v, silent) {
      cur = v; btns.forEach(function (p) { p[1].setAttribute('aria-pressed', String(p[0] === v)); });
      if (!silent && o.onChange) o.onChange(v);
    };
    var wrap = o.label ? el('div', { class: 'ctl' }, [el('div', { class: 'ctl-row' }, [el('label', { html: o.label })]), w]) : w;
    return { el: wrap, get: function () { return cur; }, set: set };
  };

  U.button = function (label, onClick, cls) {
    return el('button', { type: 'button', class: 'btn ' + (cls || ''), html: label, onclick: onClick });
  };

  U.group = function (title, children) {
    return el('div', { class: 'ctl-group' }, [title ? el('div', { class: 'gtitle', text: title }) : null].concat(children));
  };
  U.advanced = function (children, label) {
    return el('details', { class: 'adv' }, [el('summary', { text: label || 'Parametri avanzati' }), el('div', null, children)]);
  };

  /** Pannello letture numeriche. items: [{key, label, hl}] → {el, set(key, text)} */
  U.readouts = function (items) {
    var w = el('div', { class: 'readouts' }), map = {};
    items.forEach(function (it) {
      var v = el('div', { class: 'rv', text: '—' });
      w.appendChild(el('div', { class: 'readout' + (it.hl ? ' hl' : '') }, [el('div', { class: 'rl', html: it.label }), v]));
      map[it.key] = v;
    });
    return {
      el: w,
      set: function (k, txt) { if (map[k]) map[k].innerHTML = txt; },
      /** Etichette e valori attuali (testo semplice): serve a mostrare "prima → dopo". */
      snapshot: function () {
        return Array.prototype.map.call(w.children, function (c) {
          var l = c.querySelector('.rl'), v = c.querySelector('.rv');
          return { label: l ? l.textContent.trim() : '', value: v ? v.textContent.trim() : '' };
        });
      }
    };
  };

  /** Struttura standard di un simulatore: colonna di controlli + area principale. */
  U.simLayout = function (host) {
    var controls = el('div', { class: 'sim-controls' }), main = el('div', { class: 'sim-main' });
    var root = el('div', { class: 'sim' }, [el('div', { class: 'sim-grid' }, [controls, main])]);
    host.appendChild(root);
    return { root: root, controls: controls, main: main };
  };

  U.note = function (kind, title, html) {
    return el('div', { class: 'note ' + kind }, [el('span', { class: 'ttl', text: title + ' ' }), el('span', { html: html })]);
  };
  U.status = function () {
    var s = el('div', { class: 'statusline' });
    return { el: s, set: function (html, kind) { s.innerHTML = html; s.className = 'statusline ' + (kind || ''); } };
  };

  /** Formula con KaTeX (se disponibile). */
  U.tex = function (src, display) {
    var e = el('span');
    if (G.katex) {
      try { G.katex.render(src, e, { displayMode: !!display, throwOnError: false, strict: false }); return e; } catch (err) { /* ripiego sotto */ }
    }
    e.textContent = src; e.className = 'mono';
    return e;
  };
  /** Sostituisce $...$ in una stringa HTML con formule KaTeX. */
  U.texify = function (node) {
    if (!G.katex) return node;
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null), texts = [], n;
    while ((n = walker.nextNode())) if (n.nodeValue.indexOf('$') >= 0) texts.push(n);
    texts.forEach(function (t) {
      var parts = t.nodeValue.split(/(\$[^$]+\$)/g);
      if (parts.length < 2) return;
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (p.length > 2 && p[0] === '$' && p[p.length - 1] === '$') frag.appendChild(U.tex(p.slice(1, -1), false));
        else if (p) frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag, t);
    });
    return node;
  };

  /** Domanda "Prevedi". q: {q, options:[...], answer: index, why} */
  U.predict = function (q) {
    var fb = el('div', { class: 'feedback', 'aria-live': 'polite' }), btns = [];
    var box = el('div', { class: 'predict' }, [el('div', { class: 'q', html: q.q })]);
    var row = el('div', { class: 'choices' });
    q.options.forEach(function (op, i) {
      var b = el('button', { type: 'button', class: 'choice', html: op });
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('right', 'wrong'); });
        var ok = i === q.answer;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) btns[q.answer].classList.add('right');
        fb.className = 'feedback ' + (ok ? 'ok' : 'no');
        fb.innerHTML = (ok ? 'Giusto.' : 'Non proprio.') + ' <span class="why">' + q.why + ' Ora verificalo nel simulatore qui sotto.</span>';
        U.texify(fb);
      });
      btns.push(b); row.appendChild(b);
    });
    box.appendChild(row); box.appendChild(fb);
    U.texify(box);
    return box;
  };

  /** Quiz finale: domande a scelta multipla con spiegazione. */
  U.quiz = function (items) {
    var w = el('div', { class: 'quiz' });
    items.forEach(function (it, n) {
      var fb = el('div', { class: 'feedback', 'aria-live': 'polite' }), btns = [];
      var row = el('div', { class: 'choices' });
      it.options.forEach(function (op, i) {
        var b = el('button', { type: 'button', class: 'choice', html: op });
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('right', 'wrong'); });
          var ok = i === it.answer;
          b.classList.add(ok ? 'right' : 'wrong'); if (!ok) btns[it.answer].classList.add('right');
          fb.className = 'feedback ' + (ok ? 'ok' : 'no');
          fb.innerHTML = (ok ? 'Corretto.' : 'Sbagliato.') + ' <span class="why">' + it.why + '</span>';
          U.texify(fb);
        });
        btns.push(b); row.appendChild(b);
      });
      w.appendChild(el('div', { class: 'qitem' }, [el('div', { class: 'qtext', html: (n + 1) + '. ' + it.q }), row, fb]));
    });
    U.texify(w);
    return w;
  };

  /** Ciclo di animazione che si ferma da solo quando l'elemento non è più nel documento
      o non è visibile. fn(dtSeconds) restituisce false per fermarsi. */
  U.loop = function (node, fn) {
    var last = performance.now(), running = true, visible = true, raf = 0;
    var io = ('IntersectionObserver' in G) ? new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && running && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }) : null;
    if (io) io.observe(node);
    function tick(now) {
      raf = 0;
      if (!running || !node.isConnected) { stop(); return; }
      if (!visible) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fn(dt) === false) { stop(); return; }
      raf = requestAnimationFrame(tick);
    }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (io) io.disconnect(); }
    raf = requestAnimationFrame(tick);
    return { stop: stop, restart: function () { if (!running) { running = true; last = performance.now(); if (io) io.observe(node); raf = requestAnimationFrame(tick); } } };
  };

  /** Esegue un calcolo pesante dopo che il browser ha disegnato (non blocca l'interfaccia). */
  U.defer = function (fn) { return setTimeout(fn, 16); };
  /** Limita la frequenza di ricalcolo durante il trascinamento dei cursori. */
  U.throttle = function (fn, ms) {
    var t = 0, pending = false;
    return function () {
      var now = Date.now();
      if (now - t > ms) { t = now; fn(); }
      else if (!pending) { pending = true; setTimeout(function () { pending = false; t = Date.now(); fn(); }, ms - (now - t)); }
    };
  };

  /** Canvas 2D ad alta risoluzione che segue la larghezza del contenitore. */
  U.canvas2d = function (host, height, draw) {
    var c = el('canvas', { class: 'canvas2d' }), ctx = c.getContext('2d'), w = 0, h = height;
    host.appendChild(c);
    var resize = function () {
      var dpr = Math.min(2, G.devicePixelRatio || 1); w = Math.max(200, host.clientWidth);
      var hh = typeof height === 'function' ? height(w) : height; h = hh;
      c.width = Math.round(w * dpr); c.height = Math.round(hh * dpr); c.style.height = hh + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (draw) draw(ctx, w, hh);
    };
    var ro = ('ResizeObserver' in G) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);
    resize();
    return { canvas: c, ctx: ctx, size: function () { return { w: w, h: h }; }, redraw: function () { if (draw) draw(ctx, w, h); }, dispose: function () { if (ro) ro.disconnect(); } };
  };

  /** Freccia per i disegni 2D. */
  U.arrow = function (ctx, x1, y1, x2, y2, color, width, head) {
    head = head || 8;
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
  };

  /** Nota sui parametri del modello (trasparenza scientifica). */
  U.params = function (html) {
    return el('details', { class: 'params' }, [el('summary', { text: 'Modello e parametri usati' }), el('div', { html: html, style: { marginTop: '6px' } })]);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
