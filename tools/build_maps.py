import json, math, sys
from collections import defaultdict

def ring_area(r):
    a = 0
    for i in range(len(r)):
        x1, y1 = r[i]; x2, y2 = r[(i + 1) % len(r)]
        a += x1 * y2 - x2 * y1
    return a / 2

def pt_in_ring(x, y, r):
    ins = False
    j = len(r) - 1
    for i in range(len(r)):
        xi, yi = r[i]; xj, yj = r[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            ins = not ins
        j = i
    return ins

def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)

def label_point(polys):
    # polys: list of rings lists (first = outer). pick largest outer
    big = max(polys, key=lambda p: abs(ring_area(p[0])))
    outer = big[0]
    xs = [p[0] for p in outer]; ys = [p[1] for p in outer]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    best, bd = None, -1
    def score(x, y):
        if not pt_in_ring(x, y, outer): return -1
        for h in big[1:]:
            if pt_in_ring(x, y, h): return -1
        d = min(seg_dist(x, y, outer[i], outer[(i + 1) % len(outer)]) for i in range(len(outer)))
        return d
    N = 24
    for i in range(N + 1):
        for j in range(N + 1):
            x = x0 + (x1 - x0) * i / N; y = y0 + (y1 - y0) * j / N
            s = score(x, y)
            if s > bd: bd, best = s, (x, y)
    # refine
    step = max(x1 - x0, y1 - y0) / N
    for _ in range(4):
        cx, cy = best
        for i in range(-3, 4):
            for j in range(-3, 4):
                x = cx + i * step / 3; y = cy + j * step / 3
                s = score(x, y)
                if s > bd: bd, best = s, (x, y)
        step /= 3
    if best is None:
        best = (sum(xs) / len(xs), sum(ys) / len(ys)); bd = 0
    return best, bd

def dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    md, mi = -1, 0
    for i in range(1, len(pts) - 1):
        d = seg_dist(pts[i][0], pts[i][1], a, b)
        if d > md: md, mi = d, i
    if md > tol:
        return dp(pts[:mi + 1], tol)[:-1] + dp(pts[mi:], tol)
    return [a, b]

def path(polys, prec=1):
    out = []
    for p in polys:
        for r in p:
            if len(r) < 3: continue
            out.append('M' + 'L'.join(f'{x:.{prec}f},{y:.{prec}f}' for x, y in r) + 'Z')
    return ''.join(out)

class Proj:
    def __init__(s, lon0, lon1, lat0, lat1, W):
        s.k = math.cos(math.radians((lat0 + lat1) / 2))
        s.lon0, s.lat1 = lon0, lat1
        s.sc = W / ((lon1 - lon0) * s.k)
        s.W = W; s.H = (lat1 - lat0) * s.sc
    def __call__(s, lon, lat):
        return ((lon - s.lon0) * s.k * s.sc, (s.lat1 - lat) * s.sc)

def components(n, adj):
    seen = [-1] * n; comps = []
    for i in range(n):
        if seen[i] >= 0: continue
        st = [i]; seen[i] = len(comps); c = [i]
        while st:
            u = st.pop()
            for v in adj[u]:
                if seen[v] < 0: seen[v] = len(comps); c.append(v); st.append(v)
        comps.append(c)
    return comps

def link_components(polys_list, adj, labels):
    links = []
    n = len(polys_list)
    while True:
        comps = components(n, adj)
        if len(comps) == 1: break
        comps.sort(key=len, reverse=True)
        main = set(comps[0]); small = comps[-1]
        best = None
        for i in small:
            for j in main:
                d = math.dist(labels[i], labels[j])
                if best is None or d < best[0]: best = (d, i, j)
        _, i, j = best
        adj[i].add(j); adj[j].add(i); links.append([i, j])
    return links

# ---------------- RIO ----------------
def build_rio():
    T = json.load(open('/home/claude/ludobegins/bairros-rj/public/data/places.json'))
    sx, sy = T['transform']['scale']; tx, ty = T['transform']['translate']
    arcs = []
    for a in T['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    def ring(idx):
        pts = []
        for k in idx:
            a = arcs[k] if k >= 0 else arcs[~k][::-1]
            pts.extend(a if not pts else a[1:])
        return pts
    def geom(g):
        if g['type'] == 'Polygon': return [[ring(r) for r in g['arcs']]]
        if g['type'] == 'MultiPolygon': return [[ring(r) for r in p] for p in g['arcs']]
        return []
    def arcset(g):
        s = set()
        for p in (g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]):
            for r in p:
                for k in r: s.add(k if k >= 0 else ~k)
        return s
    nb = T['objects']['neighborhoods']['geometries']
    mun = T['objects']['municipalities']['geometries']
    allpts = [p for g in nb for poly in geom(g) for r in poly for p in r]
    lon0 = min(p[0] for p in allpts); lon1 = max(p[0] for p in allpts)
    lat0 = min(p[1] for p in allpts); lat1 = max(p[1] for p in allpts)
    padx, pady = (lon1 - lon0) * .03, (lat1 - lat0) * .06
    P = Proj(lon0 - padx, lon1 + padx, lat0 - pady, lat1 + pady, 1600)
    proj = lambda polys: [[[P(*p) for p in r] for r in poly] for poly in polys]
    feats = []; owners = defaultdict(set)
    for i, g in enumerate(nb):
        pp = proj(geom(g))
        for k in arcset(g): owners[k].add(i)
        lab, rad = label_point(pp)
        area = sum(abs(ring_area(poly[0])) for poly in pp)
        feats.append({'n': g['properties']['name'], 'z': g['properties'].get('zone', ''), 'd': path(pp), 'l': [round(lab[0], 1), round(lab[1], 1)], 'r': round(rad, 1), 'a': round(area)})
    adj = [set() for _ in nb]
    for k, s in owners.items():
        s = list(s)
        for a in s:
            for b in s:
                if a != b: adj[a].add(b)
    links = link_components([f['d'] for f in feats], adj, [f['l'] for f in feats])
    bg = [path(proj(geom(g))) for g in mun]
    out = {'city': 'Rio de Janeiro', 'W': 1600, 'H': round(P.H), 'f': feats, 'adj': [sorted(a) for a in adj], 'links': links, 'bg': bg,
           'credit': 'Bairros: Instituto Pereira Passos, PCRJ · Municípios: IBGE'}
    return out

# ---------------- PALERMO ----------------
def build_palermo():
    D = json.load(open('/home/claude/geo/limits_P_82_municipalities.geojson'))
    feats_raw = [f for f in D['features'] if f['properties']['name'] != 'Ustica']
    def polys_of(g):
        return g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    allpts = [p for f in feats_raw for poly in polys_of(f['geometry']) for r in poly for p in r]
    lon0 = min(p[0] for p in allpts); lon1 = max(p[0] for p in allpts)
    lat0 = min(p[1] for p in allpts); lat1 = max(p[1] for p in allpts)
    padx, pady = (lon1 - lon0) * .04, (lat1 - lat0) * .06
    P = Proj(lon0 - padx, lon1 + padx, lat0 - pady, lat1 + pady, 1600)
    key = lambda p: (round(p[0], 6), round(p[1], 6))
    owners = defaultdict(set)
    for i, f in enumerate(feats_raw):
        for poly in polys_of(f['geometry']):
            for r in poly:
                for p in r: owners[key(p)].add(i)
    tol = 1.2
    def simp_ring(r):
        r = r[:-1] if r[0] == r[-1] else r
        n = len(r)
        sets = [frozenset(owners[key(p)]) for p in r]
        fixed = [i for i in range(n) if sets[i] != sets[i - 1] or sets[i] != sets[(i + 1) % n] or len(sets[i]) >= 3]
        pr = [P(*p) for p in r]
        if len(fixed) < 2:
            fixed = [0, n // 3, 2 * n // 3]
        out = []
        for a in range(len(fixed)):
            i, j = fixed[a], fixed[(a + 1) % len(fixed)]
            chain = pr[i:j + 1] if j > i else pr[i:] + pr[:j + 1]
            ki, kj = key(r[i]), key(r[j])
            if ki > kj:
                s = dp(chain[::-1], tol)[::-1]
            else:
                s = dp(chain, tol)
            out.extend(s[:-1])
        return out
    feats = []; adj = [set() for _ in feats_raw]
    for k, s in owners.items():
        if len(s) > 1:
            for a in s:
                for b in s:
                    if a != b: adj[a].add(b)
    # require at least 2 shared vertices to count as adjacency
    cnt = defaultdict(int)
    for k, s in owners.items():
        s = sorted(s)
        for a in s:
            for b in s:
                if a < b: cnt[(a, b)] += 1
    adj = [set() for _ in feats_raw]
    for (a, b), c in cnt.items():
        if c >= 2: adj[a].add(b); adj[b].add(a)
    for i, f in enumerate(feats_raw):
        pp = [[simp_ring(r) for r in poly] for poly in polys_of(f['geometry'])]
        pp = [[r for r in poly if len(r) >= 3] for poly in pp]
        pp = [poly for poly in pp if poly]
        lab, rad = label_point(pp)
        area = sum(abs(ring_area(poly[0])) for poly in pp)
        feats.append({'n': f['properties']['name'], 'z': '', 'd': path(pp), 'l': [round(lab[0], 1), round(lab[1], 1)], 'r': round(rad, 1), 'a': round(area)})
    links = link_components(None if False else [0] * len(feats), adj, [f['l'] for f in feats])
    # background: other Sicilian provinces
    PR = json.load(open('/home/claude/geo/limits_IT_provinces.geojson'))
    bg = []
    for f in PR['features']:
        pr = f['properties']
        if str(pr.get('reg_istat_code')) not in ('19',) or pr.get('prov_istat_code_num') == 82: continue
        polys = polys_of(f['geometry'])
        pp = []
        for poly in polys:
            rr = []
            for r in poly:
                q = dp([P(*p) for p in r], 2.0)
                if len(q) >= 3: rr.append(q)
            if rr: pp.append(rr)
        bg.append(path(pp, 0))
    out = {'city': 'Palermo', 'W': 1600, 'H': round(P.H), 'f': feats, 'adj': [sorted(a) for a in adj], 'links': links, 'bg': bg,
           'credit': 'Limites: ISTAT (CC-BY), via openpolis'}
    return out

if __name__ == '__main__':
    import os
    os.makedirs('/home/claude/dono-da-cidade/maps', exist_ok=True)
    for name, fn in [('rio', build_rio), ('palermo', build_palermo)]:
        o = fn()
        s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
        open(f'/home/claude/dono-da-cidade/maps/{name}.json', 'w').write(s)
        deg = [len(a) for a in o['adj']]
        print(name, len(o['f']), 'H', o['H'], 'size', len(s) // 1024, 'KB', 'links', o['links'], 'min deg', min(deg), 'isolated', [o['f'][i]['n'] for i, d in enumerate(deg) if d == 0])
