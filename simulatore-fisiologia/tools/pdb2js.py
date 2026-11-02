#!/usr/bin/env python3
"""Converte strutture del Protein Data Bank (RCSB, dati pubblici CC0) in piccoli file JavaScript per il simulatore.

Per tenere leggera la pagina si conserva solo lo scheletro (atomi Cα, coordinate in decimi di Å), la struttura
secondaria, gli ioni, le acque del poro e i ligandi importanti. La proteina viene ruotata con la normale alla
membrana lungo l'asse z (extracellulare in alto) e centrata sul doppio strato.

Uso:   python3 tools/pdb2js.py            (scarica i file in tools/pdb-cache/ se mancano e scrive js/pdb/*.js)
Richiede numpy. I file originali del PDB non vengono inclusi nel repository.
"""
import json, math, os, re, sys, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'pdb-cache')
OUT = os.path.join(HERE, '..', 'js', 'pdb')
THREE = {'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C', 'GLN': 'Q', 'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V'}


def fetch(pid):
    os.makedirs(CACHE, exist_ok=True)
    f = os.path.join(CACHE, pid + '.pdb')
    if not os.path.exists(f):
        urllib.request.urlretrieve('https://files.rcsb.org/download/%s.pdb' % pid, f)
    return f


def parse(pid):
    P = {'atoms': [], 'helix': [], 'sheet': [], 'biomt': {}, 'auth': '', 'ref': '', 'doi': '', 'title': '', 'res': None}
    cur = None; ops = {}
    for l in open(fetch(pid)):
        r = l[:6].strip()
        if r in ('ATOM', 'HETATM'):
            if l[16] not in ' A':
                continue
            P['atoms'].append({'rec': r, 'name': l[12:16].strip(), 'res': l[17:20].strip(), 'ch': l[21], 'num': int(l[22:26]),
                               'xyz': np.array([float(l[30:38]), float(l[38:46]), float(l[46:54])]), 'el': l[76:78].strip()})
        elif r == 'HELIX':
            P['helix'].append((l[19], int(l[21:25]), l[31], int(l[33:37])))
        elif r == 'SHEET':
            P['sheet'].append((l[21], int(l[22:26]), l[32], int(l[33:37])))
        elif r == 'TITLE':
            P['title'] += l[10:].strip() + ' '
        elif l.startswith('REMARK   2 RESOLUTION'):
            m = re.search(r'([\d.]+) ANGSTROMS', l); P['res'] = float(m.group(1)) if m else None
        elif l.startswith('JRNL        AUTH'):
            P['auth'] += l[19:].strip()
        elif l.startswith('JRNL        REF'):
            P['ref'] = l[19:].strip()
        elif l.startswith('JRNL        DOI'):
            P['doi'] = l[19:].strip()
        elif l.startswith('REMARK 350 BIOMOLECULE:'):
            cur = int(l.split(':')[1]); P['biomt'][cur] = {'chains': [], 'ops': {}}
        elif l.startswith('REMARK 350 APPLY THE FOLLOWING TO CHAINS:') and cur:
            P['biomt'][cur]['chains'] = [c.strip() for c in l.split(':')[1].replace('AND', ',').split(',') if c.strip()]
        elif l.startswith('REMARK 350   BIOMT') and cur:
            k = int(l[18]); n = int(l[20:23]); v = [float(x) for x in l[23:].split()]
            o = P['biomt'][cur]['ops'].setdefault(n, np.zeros((3, 4))); o[k - 1] = v
    return P


def citation(P):
    a = P['auth'].split(',')[0].strip() if P['auth'] else ''
    m = re.match(r'((?:[A-Z]\.)*)([A-Z\'-]+)$', a)
    first = (m.group(2).title() + ' ' + m.group(1)) if m else a
    ref = P['ref']; m = re.match(r'(.+?)\s+V\.\s+(\S+)\s+(\S+)\s+(\d{4})', ref)
    j = (m.group(1).strip().title() + ' ' + m.group(2) + ', ' + m.group(3) + ' (' + m.group(4) + ')') if m else ref.title()
    return (first.strip() + ' et al., ' + j).replace('Nature', 'Nature').replace('J. Mol. Biol.', 'J Mol Biol')


def ss_map(P):
    s = {}
    for kind, lst in ((1, P['helix']), (2, P['sheet'])):
        for c1, a, c2, b in lst:
            for n in range(a, b + 1):
                s[(c1, n)] = kind
    return s


def build(cfg, keep=None, align=None):
    """keep: insieme di (catena, numero ricondotto) da conservare; align: (X_riferimento, maschera_nucleo) per sovrapporre uno stato a un altro."""
    P = parse(cfg['pdb']); ss = ss_map(P); nmap = cfg.get('nmap', {})
    bm = P['biomt'][1] if 1 in P['biomt'] else {'ops': {1: np.hstack([np.eye(3), np.zeros((3, 1))])}}
    ops = [bm['ops'][k] for k in sorted(bm['ops'])] if cfg.get('assembly') else [np.hstack([np.eye(3), np.zeros((3, 1))])]
    chains = cfg['chains']
    # residui Cα per catena
    res = {}
    for a in P['atoms']:
        if a['rec'] == 'ATOM' and a['name'] == 'CA' and a['ch'] in chains:
            res.setdefault(a['ch'], []).append(a)
    for c in res:
        res[c].sort(key=lambda a: a['num'])
        if keep is not None:
            res[c] = [a for a in res[c] if (c, nmap[c].get(a['num']) if c in nmap else a['num']) in keep]
    units = []  # (label, chain, op)
    for oi, op in enumerate(ops):
        for c in chains:
            if c in res:
                units.append((c, oi, op))
    xyz, seq, sst, segs, owner, resid = [], [], [], [], [], []
    for ui, (c, oi, op) in enumerate(units):
        prev = None; start = len(xyz)
        for a in res[c]:
            p = op[:, :3] @ a['xyz'] + op[:, 3]
            if prev is not None and np.linalg.norm(p - prev) > 4.6:
                segs.append([start, len(xyz) - start, ui]); start = len(xyz)
            xyz.append(p); seq.append(THREE.get(a['res'], 'X')); sst.append(ss.get((c, a['num']), 0)); owner.append(ui); resid.append((c, oi, a['num']))
            prev = p
        segs.append([start, len(xyz) - start, ui])
    xyz = np.array(xyz); sst = np.array(sst); owner = np.array(owner)
    index = {(c, oi, n): i for i, (c, oi, n) in enumerate(resid)}
    seqs = ''.join(seq)

    def locate(motif, chain=None):
        """indici (nella prima copia) dei residui di un motivo di sequenza"""
        out = []
        for ui, (c, oi, op) in enumerate(units):
            if chain and c != chain: continue
            idx = [i for i in range(len(seqs)) if owner[i] == ui]
            s = ''.join(seqs[i] for i in idx)
            for m in re.finditer(motif, s):
                out.append([idx[m.start() + k] for k in range(len(motif))])
        return out

    # ----- orientamento: asse della membrana lungo z, extracellulare in alto, centro del doppio strato in 0
    half = float(cfg.get('half', 15.0)); mems = [[-half, half]]
    if align is not None:
        Xref, core = align
        sel = np.array(core)
        for it in range(8):  # sovrapposizione robusta: si scartano via via i residui che si muovono di più
            A0 = xyz[sel]; B0 = Xref[sel]; ca, cb = A0.mean(0), B0.mean(0)
            U, S, Vt = np.linalg.svd((A0 - ca).T @ (B0 - cb)); d = np.sign(np.linalg.det(Vt.T @ U.T))
            Rm = Vt.T @ np.diag([1, 1, d]) @ U.T
            dev = np.linalg.norm((Rm @ (xyz[core] - ca).T).T + cb - Xref[core], axis=1)
            sel = np.array(core)[dev <= np.percentile(dev, max(40, 100 - 8 * (it + 1)))]
        shift = Rm @ ca - cb; axis = np.array([0, 0, 1.0]); flip = False
    else:
        if cfg['orient'] == 'sym':
            C = np.cov((xyz - xyz.mean(0)).T); w, v = np.linalg.eigh(C)
            d = [abs(w[i] - np.mean([w[j] for j in range(3) if j != i])) for i in range(3)]
            axis = v[:, int(np.argmax(d))]
        else:
            M = np.zeros((3, 3)); minlen = cfg.get('hlen', 14)
            for ui in range(len(units)):
                idx = np.where(owner == ui)[0]
                for c1, a, c2, b in P['helix']:
                    if c1 != units[ui][0]: continue
                    sel = [i for i in idx if a <= resid[i][2] <= b]
                    if len(sel) >= minlen:
                        v = xyz[sel[-3:]].mean(0) - xyz[sel[:3]].mean(0); n = np.linalg.norm(v)
                        if n > 0: v = v / n; M += len(sel) * np.outer(v, v)
            w, v = np.linalg.eigh(M); axis = v[:, 2]
        z = axis / np.linalg.norm(axis); tmp = np.array([1, 0, 0]) if abs(z[0]) < 0.9 else np.array([0, 1, 0])
        x = np.cross(tmp, z); x /= np.linalg.norm(x); y = np.cross(z, x); Rm = np.array([x, y, z])
        xr = (Rm @ xyz.T).T
        tm_idx = []  # elica transmembrana = elica quasi parallela all'asse (≥ 14 residui)
        for ui in range(len(units)):
            idx = np.where(owner == ui)[0]
            for c1, a, c2, b in P['helix']:
                if c1 != units[ui][0]: continue
                sel = [i for i in idx if a <= resid[i][2] <= b]
                if len(sel) >= 14:
                    v = xr[sel[-3:]].mean(0) - xr[sel[:3]].mean(0)
                    if abs(v[2]) / np.linalg.norm(v) > 0.8: tm_idx += sel
        tm_idx = np.array(tm_idx) if tm_idx else np.arange(len(xr))
        zc = float(np.median(xr[tm_idx, 2]))
        g = Helper(xr, locate, index, seqs, zc)
        flip = ('up' in cfg) and not cfg['up'](g)
        if flip:
            Rm = np.diag([1, -1, -1]) @ Rm; xr = (Rm @ xyz.T).T; zc = -zc; tm_idx = tm_idx
        xy = xr[:, :2].mean(0) if cfg['orient'] == 'sym' else xr[tm_idx, :2].mean(0)
        if cfg.get('gap'):  # canale di giunzione: due doppi strati, uno per emicanale
            zt = xr[tm_idx, 2]; c1 = float(np.median(zt[zt > np.median(zt)])); c2 = float(np.median(zt[zt <= np.median(zt)]))
            zc = (c1 + c2) / 2; mems = [[c2 - zc - half, c2 - zc + half], [c1 - zc - half, c1 - zc + half]]
        shift = np.array([xy[0], xy[1], zc])
    T = lambda p: (Rm @ p) - shift
    X = (Rm @ xyz.T).T - shift

    # ----- ioni, acque, ligandi
    def op_for(c, oi):
        return ops[oi]
    ions = []; waters = []; ligs = []
    for oi, op in enumerate(ops):
        for a in P['atoms']:
            if a['rec'] != 'HETATM' or a['ch'] not in chains: continue
            if a['res'] in cfg.get('ions', []) and (cfg.get('ion_nums') is None or a['num'] in cfg['ion_nums']):
                p = T(op[:, :3] @ a['xyz'] + op[:, 3]); ions.append([a['res'], p])
    if cfg.get('water'):
        sel = cfg['water'](P, xyz, index, units)
        for oi, op in enumerate(ops):
            for p0 in sel:
                waters.append(T(op[:, :3] @ p0 + op[:, 3]))
    for lg in cfg.get('ligands', []):
        at = [a for a in P['atoms'] if a['rec'] == 'HETATM' and a['res'] == lg and a['ch'] in cfg.get('lig_chains', chains) and (not cfg.get('lig_first', True) or True)]
        if cfg.get('lig_first', True) and at:
            at = [a for a in at if a['num'] == at[0]['num']]
        pts = [T(a['xyz']) for a in at]; bonds = []
        for i in range(len(pts)):
            for j in range(i + 1, len(pts)):
                if np.linalg.norm(pts[i] - pts[j]) < 1.9: bonds.append([i, j])
        ligs.append({'n': lg, 'atoms': [[a['el'] or a['name'][0], *[int(round(c * 10)) for c in pts[i]]] for i, a in enumerate(at)], 'bonds': bonds})

    pore = cfg['pore'](X, index, waters, len(ops)) if cfg.get('pore') else None
    marks = []
    for m in cfg.get('marks', []):
        ids = []
        if 'motif' in m:
            for hit in locate(m['motif'], m.get('chain')):
                ids += [hit[k] for k in m['pick']]
        else:
            for (c, n) in m['res']:
                for oi in range(len(ops)):
                    if (c, oi, n) in index: ids.append(index[(c, oi, n)])
        if not ids: print('  ATTENZIONE: nessun residuo per', m.get('t')); continue
        marks.append({'i': ids, 't': m['t'], 'c': m.get('c', '#e8913a')})

    out = {'id': cfg['pdb'], 'name': cfg['name'], 'title': P['title'].strip().title(), 'res': P['res'], 'cite': citation(P), 'doi': P['doi'],
           'n': int(len(X)), 'xyz': [int(round(c * 10)) for row in X for c in row], 'ss': ''.join(str(int(s)) for s in sst), 'seq': seqs,
           'seg': segs, 'nch': len(units), 'mem': [[round(m, 1) for m in pair] for pair in mems], 'marks': marks,
           'ions': [[e, *[int(round(c * 10)) for c in p]] for e, p in ions], 'water': [[int(round(c * 10)) for c in p] for p in waters], 'lig': ligs}
    if pore: out['pore'] = pore
    print('%-8s %s: %d residui, %d catene, %d ioni, %d acque, ligandi %s, asse %s, flip %s' % (cfg['name'], cfg['pdb'], len(X), len(units), len(ions), len(waters), [l['n'] for l in ligs], np.round(axis, 2), flip))
    return out, dict(P=P, xyz=xyz, X=X, index=index, units=units, res=res, T=T, ops=ops, locate=locate, resid=resid, owner=owner)


class Helper:
    """funzioni di aiuto per le configurazioni: quota z media di un gruppo di residui"""
    def __init__(self, xr, locate, index, seqs, zc=0.0):
        self.xr = xr; self._locate = locate; self.index = index; self.seqs = seqs; self.zc = zc
    def all(self): return list(range(len(self.xr)))
    def z(self, ids): return float(np.mean([self.xr[i, 2] for i in ids]))
    def first(self, motif, k=None):
        hit = self._locate(motif)[0]
        return [hit[j] for j in (k if k is not None else range(len(hit)))]
    def num(self, chain, n, oi=0): return self.index[(chain, oi, n)]
    def last(self, chain, oi=0):
        return max(i for (c, o, n), i in self.index.items() if c == chain and o == oi)
    def firstres(self, chain, oi=0):
        return min(i for (c, o, n), i in self.index.items() if c == chain and o == oi)


def write(name, obj):
    os.makedirs(OUT, exist_ok=True)
    js = "/* %s (PDB %s) — dati ridotti da tools/pdb2js.py; coordinate in decimi di Å. Fonte: RCSB Protein Data Bank (dati pubblici). */\nFisio.pdb = Fisio.pdb || {};\nFisio.pdb[%s] = %s;\n" % (obj['title'] if 'title' in obj else name, obj['id'], json.dumps(name), json.dumps(obj, separators=(',', ':'), ensure_ascii=False))
    p = os.path.join(OUT, name + '.js'); open(p, 'w').write(js)
    print('  →', os.path.relpath(p), '%.1f KB' % (len(js) / 1024))


# ----------------------------------------------------------------------------------------------- configurazioni
def water_aqp1(P, xyz, index, units):
    """acque del poro: entro 3,6 Å da atomi dei residui che rivestono il canale (NPA, ar/R, carbonili del centro)."""
    seqs = {a['num']: a for a in P['atoms'] if a['rec'] == 'ATOM' and a['name'] == 'CA' and a['ch'] == 'A'}
    lining = {58, 78, 79, 182, 191, 194, 195, 197, 190, 192, 193, 59, 57}
    hot = [a['xyz'] for a in P['atoms'] if a['rec'] == 'ATOM' and a['ch'] == 'A' and a['num'] in lining and a['name'] in ('O', 'ND2', 'NE2', 'NE', 'NH1', 'NH2', 'SG', 'CZ', 'N')]
    c = np.mean([seqs[78]['xyz'], seqs[194]['xyz']], axis=0)
    out = []
    for a in P['atoms']:
        if a['res'] == 'HOH' and a['ch'] == 'A':
            if min(np.linalg.norm(a['xyz'] - h) for h in hot) < 3.4 and np.linalg.norm(a['xyz'] - c) < 15:
                out.append(a['xyz'])
    return out


def pore_aqp1(X, index, waters, nops):
    """Percorso del poro di ogni subunità: poligonale che passa per le acque cristallografiche del canale (estesa di 4 Å alle due estremità).
    Restituisce, per subunità, i punti (decimi di Å), la lunghezza d'arco della strozzatura ar/R e dei motivi NPA, con ar/R dal lato extracellulare."""
    nper = len(waters) // nops; out = []
    for oi in range(nops):
        W = np.array(waters[oi * nper:(oi + 1) * nper])
        c = W.mean(0); u, s_, vt = np.linalg.svd(W - c); d = vt[0]
        lat = np.linalg.norm((W - c) - np.outer((W - c) @ d, d), axis=1)
        Wk = W[lat < 4.5] if (lat < 4.5).sum() >= 4 else W  # si scartano le acque fuori dall'asse del canale
        c = Wk.mean(0); u, s_, vt = np.linalg.svd(Wk - c); d = vt[0]
        t = (Wk - c) @ d; tt = np.linspace(t.min() - 4, t.max() + 4, 12)
        # centro del poro: curva quadratica nel parametro t (liscia, segue la leggera curvatura del canale)
        P = np.array([np.polyval(np.polyfit(t, Wk[:, k], 2), tt) for k in range(3)]).T
        arc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
        def arc_of(q):  # parametro d'arco del punto della poligonale più vicino a q
            best = (1e9, 0)
            for i in range(len(P) - 1):
                t = np.clip(np.dot(q - P[i], P[i + 1] - P[i]) / np.dot(P[i + 1] - P[i], P[i + 1] - P[i]), 0, 1)
                dist = np.linalg.norm(P[i] + t * (P[i + 1] - P[i]) - q)
                if dist < best[0]: best = (dist, arc[i] + t * np.linalg.norm(P[i + 1] - P[i]))
            return best[1]
        npa = arc_of(np.mean([X[index[('A', oi, 78)]], X[index[('A', oi, 194)]]], axis=0))
        arr = arc_of(np.mean([X[index[('A', oi, n)]] for n in (58, 182, 191, 197)], axis=0))
        if arr < npa:  # si orienta il percorso dal citoplasma all'extracellulare
            P = P[::-1]; arc = arc[-1] - arc[::-1]; npa = arc[-1] - npa; arr = arc[-1] - arr
        out.append({'pts': [[int(round(c * 10)) for c in p] for p in P], 'len': round(float(arc[-1]), 2), 'npa': round(float(npa), 2), 'arr': round(float(arr), 2)})
    return out


CONFIGS = [
    dict(name='aqp1', pdb='1J4N', chains=['A'], assembly=True, orient='sym', water=water_aqp1, pore=pore_aqp1, half=15,
         up=lambda g: g.z([g.num('A', n) for n in (58, 182, 191, 197)]) > g.z([g.num('A', 78), g.num('A', 194)]),
         marks=[dict(res=[('A', 78), ('A', 194)], t='NPA', c='#2e9e5b'), dict(res=[('A', 58), ('A', 182), ('A', 191), ('A', 197)], t='ar/R', c='#d9480f')]),
    dict(name='kcsa', pdb='1BL8', chains=['A', 'B', 'C', 'D'], assembly=False, orient='sym', ions=['K'], half=15,
         up=lambda g: g.z(g.first('TVGYG')) > g.z([g.last('A')]),
         marks=[dict(motif='TVGYG', chain='A', pick=range(5), t='filtro TVGYG', c='#d9480f')]),
]


CONFIGS += [
    dict(name='navab', pdb='3RVY', chains=['A', 'B'], assembly=True, orient='sym', half=15,
         up=lambda g: g.z(g.first('TLESWSM')) > g.z([g.last('A')]),
         marks=[dict(motif='TLESWSM', pick=range(7), t='filtro di selettività (TLESWSM)', c='#d9480f'),
                dict(motif='ILRVLRVLRLFRLV', pick=[2, 5, 8, 11], t='S4: arginine del sensore di voltaggio', c='#2e9e5b')]),
    dict(name='rodopsina', pdb='1U19', chains=['A'], assembly=False, orient='helix', hlen=14, ligands=['RET'], lig_chains=['A'], half=15,
         up=lambda g: g.z([g.firstres('A')]) > g.z([g.last('A')]),
         marks=[dict(res=[('A', 296)], t='Lys296 (legame con il retinale)', c='#2e9e5b'), dict(res=[('A', 113)], t='Glu113 (controione)', c='#d9480f')]),
    dict(name='nachr', pdb='2BG9', chains=['A', 'B', 'C', 'D', 'E'], assembly=True, orient='sym', half=15,
         up=lambda g: g.z(g.all()) > g.zc),
    dict(name='cx26', pdb='2ZW3', chains=['A', 'B', 'C', 'D', 'E', 'F'], assembly=True, orient='sym', gap=True, half=15),
    dict(name='glut1', pdb='4PYP', chains=['A'], assembly=False, orient='helix', hlen=14, half=15,
         up=lambda g: g.z([g.firstres('A')]) < g.z(g.all())),
]

PUMP1 = dict(name='nka', pdb='3WGU', chains=['A'], assembly=False, orient='helix', hlen=18, half=15,
             ions=['NA', 'MG'], ion_nums=[2001, 2003, 2005, 2006, 2007], ligands=['ADP', 'ALF'], lig_chains=['A'],
             up=lambda g: g.z([g.num('A', 369)]) < g.zc,
             marks=[dict(res=[('A', 369)], t='Asp369 (fosforilazione)', c='#d9480f')])
PUMP2 = dict(name='nka', pdb='2ZXE', chains=['A'], assembly=False, orient='helix', ions=['K', 'MG'], ion_nums=[2002, 2003, 2004], ligands=['MF4'], lig_chains=['A'])


def seq_of(P, ch):
    return {a['num']: THREE.get(a['res'], 'X') for a in P['atoms'] if a['rec'] == 'ATOM' and a['name'] == 'CA' and a['ch'] == ch}


def build_pump():
    """Na+/K+-ATPasi (subunità α) in due stati reali: E1·3Na+ (3WGU) ed E2·2K+·Pi (2ZXE), stessa lista di residui per poter interpolare."""
    import difflib
    P1, P2 = parse(PUMP1['pdb']), parse(PUMP2['pdb']); keep = set(); nmap = {}
    for ch in PUMP1['chains']:
        s1, s2 = seq_of(P1, ch), seq_of(P2, ch)
        k1, k2 = sorted(s1), sorted(s2); a1 = ''.join(s1[n] for n in k1); a2 = ''.join(s2[n] for n in k2)
        mm = difflib.SequenceMatcher(None, a1, a2, autojunk=False).get_matching_blocks(); nmap[ch] = {}; cnt = 0
        for blk in mm:
            for t in range(blk.size):
                nmap[ch][k2[blk.b + t]] = k1[blk.a + t]; keep.add((ch, k1[blk.a + t])); cnt += 1
        print('  catena %s: %d residui corrispondenti su %d (E1) e %d (E2)' % (ch, cnt, len(s1), len(s2)))
    PUMP2['nmap'] = nmap
    out1, st1 = build(PUMP1, keep=keep)
    X1 = st1['X']; core = np.array([i for i in range(len(X1)) if abs(X1[i, 2]) <= 16])
    out2, st2 = build(PUMP2, keep=keep, align=(X1, core))
    assert out1['n'] == out2['n'], (out1['n'], out2['n'])
    d = np.linalg.norm(st2['X'] - X1, axis=1); print('  spostamento Cα E1→E2: mediana %.1f Å, massimo %.1f Å' % (np.median(d), d.max()))
    print('  ioni E1:', [(i[0], [round(c / 10, 1) for c in i[1:]]) for i in out1['ions']], '\n  ioni E2:', [(i[0], [round(c / 10, 1) for c in i[1:]]) for i in out2['ions']])
    out1.update({'xyz2': out2['xyz'], 'ions2': out2['ions'], 'lig2': out2['lig'], 'id2': out2['id'], 'cite2': out2['cite'], 'doi2': out2['doi'], 'res2': out2['res'], 'title2': out2['title']})
    return out1


def main(only=None):
    for cfg in CONFIGS:
        if only and cfg['name'] not in only: continue
        out, _ = build(cfg); write(cfg['name'], out)
    if not only or 'nka' in only:
        write('nka', build_pump())


if __name__ == '__main__':
    main(sys.argv[1:])
