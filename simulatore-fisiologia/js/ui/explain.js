/* Spiegazioni guidate per i simulatori.
   - "Cosa sta succedendo": un testo che si riscrive da solo quando cambi un controllo e dice,
     con i numeri attuali, che cosa accade e perché.
   - "Prova": pulsanti che impostano i controlli su una situazione istruttiva e mostrano
     una tabella "prima → dopo" con la spiegazione di cosa è cambiato.
   - Legenda dei colori, dove i grafici hanno più curve. */
(function (G) {
  'use strict';
  var F = G.Fisio, U = F.ui, el = U.el;

  function plain(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  /** L: layout del simulatore (U.simLayout). o:
      narrate()      → stringa HTML oppure {html, kind: 'ok'|'bad'|'warn'}; chiamata a ogni cambio di stato
      legend         → [[colore o --variabile, 'testo'], …]
      experiments    → [{label, run(), why: stringa HTML o funzione che la restituisce}]
      base           → funzione che riporta il simulatore alla situazione di partenza: la tabella confronta con quella
      watch          → oggetto di U.readouts: le letture che cambiano compaiono in tabella
      poll           → ms; per i simulatori animati, rilegge lo stato a intervalli */
  U.explainer = function (L, o) {
    var box = el('div', { class: 'explain' });
    var title = el('div', { class: 'ex-title', text: o.narrate ? 'Cosa sta succedendo' : 'Per capire meglio' });
    box.appendChild(title);
    var live = null;
    if (o.narrate) { live = el('div', { class: 'ex-live', 'aria-live': 'polite' }); box.appendChild(live); }

    if (o.legend && o.legend.length) {
      var lg = el('div', { class: 'ex-legend' });
      o.legend.forEach(function (it) {
        var sw = el('span', { class: 'ex-sw' });
        sw.style.background = it[0].indexOf('--') === 0 ? 'var(' + it[0] + ')' : it[0];
        lg.appendChild(el('span', { class: 'ex-lg' }, [sw, it[1]]));
      });
      box.appendChild(lg);
    }

    var result = el('div', { class: 'ex-result', hidden: true });
    var btns = [];
    if (o.experiments && o.experiments.length) {
      var row = el('div', { class: 'ex-try' }, [el('span', { class: 'lbl', text: 'Prova:' })]);
      o.experiments.forEach(function (ex) {
        var b = el('button', { type: 'button', class: 'ex-btn', 'aria-pressed': 'false', html: ex.label });
        b.addEventListener('click', function () { runExp(ex, b); });
        btns.push(b); row.appendChild(b);
      });
      box.appendChild(row); box.appendChild(result);
    }
    L.main.insertBefore(box, L.main.firstChild);

    var last = '';
    function refresh() {
      if (!live || !box.isConnected) return;
      var r;
      try { r = o.narrate(); } catch (e) { console.error('Spiegazione (testo): ' + e.message); return; }
      if (r === null || r === undefined) return;
      var html = typeof r === 'string' ? r : r.html, kind = typeof r === 'string' ? '' : (r.kind || '');
      var key = kind + '|' + html;
      if (key === last) return;
      last = key;
      live.innerHTML = html;
      box.className = 'explain' + (kind ? ' ' + kind : '');
    }

    function runExp(ex, btn) {
      var before = null;
      var bs = ex.base || o.base;
      if (bs) { try { bs(); } catch (e) { console.error('Spiegazione (partenza): ' + e.message); } }
      if (o.watch) before = o.watch.snapshot();
      try { ex.run(); } catch (e) { console.error('Spiegazione (prova "' + plain(ex.label) + '"): ' + e.message); return; }
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      setTimeout(function () {
        var after = o.watch ? o.watch.snapshot() : null, rows = [];
        if (before && after) {
          for (var i = 0; i < Math.min(before.length, after.length); i++) {
            if (before[i].label === after[i].label && before[i].value !== after[i].value && after[i].label) rows.push([after[i].label, before[i].value, after[i].value]);
          }
        }
        result.innerHTML = '';
        result.appendChild(el('div', { class: 'ex-rt', text: plain(ex.label) }));
        if (rows.length) {
          var tb = el('table', { class: 'ex-diff' }, [el('tr', null, [el('th', { text: 'Cosa cambia' }), el('th', { text: (ex.base || o.base) ? 'Partenza' : 'Prima' }), el('th', { text: 'Dopo' })])]);
          rows.slice(0, 6).forEach(function (r) {
            tb.appendChild(el('tr', null, [el('td', { text: r[0] }), el('td', { class: 'n', text: r[1] }), el('td', { class: 'n new', text: r[2] })]));
          });
          result.appendChild(el('div', { class: 'ex-scroll' }, [tb]));
        }
        var why = '';
        try { why = typeof ex.why === 'function' ? ex.why() : ex.why; } catch (e) { console.error('Spiegazione (perché "' + plain(ex.label) + '"): ' + e.message); }
        if (why) result.appendChild(el('div', { class: 'ex-why', html: why }));
        result.hidden = false;
        refresh();
      }, 90);
    }

    // il testo segue i controlli: gli ascoltatori del simulatore girano per primi, poi questo
    var tmr = 0, sched = function () { clearTimeout(tmr); tmr = setTimeout(refresh, 40); };
    ['input', 'change', 'click'].forEach(function (t) { L.root.addEventListener(t, sched); });
    if (o.poll) {
      var iv = setInterval(function () { if (!box.isConnected) { clearInterval(iv); return; } refresh(); }, o.poll);
    }
    refresh();
    return { el: box, refresh: refresh };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
