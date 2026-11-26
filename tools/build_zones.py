"""Gera as zonas fictícias do jogo a partir dos limites reais.

Rio: agrupa os 167 bairros (IPP/PCRJ) em ~32 zonas e dissolve os contornos
     usando a topologia do TopoJSON (arcos internos se cancelam).
Sicília: agrupa os 81 municípios da província de Palermo (ISTAT, CC-BY) em ~22
     zonas e dissolve cancelando segmentos compartilhados.

Os nomes das zonas são inventados, para o jogo não retratar lugares reais.
Saída: public/maps/rio.json e public/maps/palermo.json
"""
import json, math, os, random, heapq
from collections import defaultdict
from build_maps import ring_area, pt_in_ring, label_point, dp, Proj, DATA, OUT

R = random.Random(42)

NAMES_RIO = {
    'comunidade': ["Morro do Trovão", "Complexo da Pedra", "Morro do Farol", "Complexo do Canal", "Morro do Sabiá", "Favela do Trilho",
                   "Morro do Cruzeiro", "Complexo da Serra", "Morro dos Ventos", "Morro Azul", "Comunidade da Linha", "Morro da Caixa d'Água",
                   "Complexo do Urubu", "Morro do Gato Preto", "Morro da Antena", "Complexo do Brejo"],
    'suburbio': ["Vila Operária", "Jardim Esperança", "Parque Ferroviário", "Conjunto Aurora", "Vila Carmem", "Jardim Primavera",
                 "Bairro do Mercado", "Vila Nova Era", "Parque das Fábricas", "Estação Velha", "Vila Sossego", "Jardim Bela Vista",
                 "Conjunto Horizonte", "Vila do Viaduto", "Parque Alvorada", "Largo do Bonde", "Vila Paraíso", "Jardim do Lago"],
    'nobre': ["Orla Dourada", "Mirante Sul", "Enseada Azul", "Costa Verde", "Alto da Lagoa", "Praia do Sol", "Barra Nova", "Pedra Bonita"],
    'centro': ["Centro Velho", "Praça da Matriz", "Distrito Financeiro", "Arcos da Boemia"],
    'porto': ["Cais do Porto", "Ilha do Aeroporto", "Doca Sete", "Pátio dos Containers"],
    'periferia': ["Sertão Oeste", "Campo Largo", "Vale do Rio Grande", "Estrada Real", "Serra Verde", "Baixada da Mata", "Chácaras do Oeste", "Várzea Funda"],
}
NAMES_PA = {
    'capitale': ["La Capitale"],
    'citta': ["Borgo Rubino", "San Vito Nero", "Monte Corvo", "Villa Serena", "Santa Lucia del Vallo", "Castel Mirto", "Roccalta",
              "Terranova", "Piana d'Oro", "San Calogero", "Valverde", "Montenero"],
    'costa': ["Marina Grande", "Cala Azzurra", "Punta del Faro", "Baia dei Pescatori", "Lido Smeraldo", "Capo Bianco", "Porto Ulisse"],
    'campagna': ["Contrada dei Limoni", "Feudo Vecchio", "Valle del Grano", "Colle degli Ulivi", "Masseria Alta", "Piano delle Capre",
                 "Bosco Scuro", "Rocca Nera", "Valle dei Mandorli", "Poggio dei Venti", "Terre Bruciate"],
}

COMUNIDADES = {'Rocinha', 'Vidigal', 'Maré', 'Complexo do Alemão', 'Jacarezinho', 'Manguinhos', 'Cidade de Deus', 'Costa Barros', 'Acari',
               'Mangueira', 'Parque Colúmbia', 'Vigário Geral', 'Parada de Lucas', 'Senador Camará', 'Gardênia Azul', 'Barros Filho',
               'Lins de Vasconcelos'}
NOBRE = {'Barra da Tijuca', 'Recreio dos Bandeirantes', 'Joá', 'Itanhangá', 'São Conrado'}
PORTO = {'Caju', 'Galeão', 'Santo Cristo', 'Gamboa', 'Saúde', 'Cidade Universitária'}
PA_TOWNS = ['Bagheria', 'Monreale', 'Carini', 'Partinico', 'Termini Imerese', 'Cefalù', 'Corleone', 'Misilmeri', 'Caccamo',
            'Petralia Sottana', 'Lercara Friddi', 'Castelbuono']
PA_COSTA = {'Isola delle Femmine', 'Capaci', 'Cinisi', 'Terrasini', 'Trappeto', 'Balestrate', 'Ficarazzi', 'Santa Flavia', 'Casteldaccia',
            'Altavilla Milicia', 'Trabia', 'Campofelice di Roccella', 'Lascari', 'Pollina'}


def cluster(n, adj, area, xy, seeds, grow_ok, group, targets_extra):
    """Crescimento a partir de sementes, equilibrando área.
    seeds: lista de listas de índices (cada uma vira uma zona já com esses membros).
    grow_ok(z, i): se a zona z pode absorver i.
    """
    zone = [-1] * n
    zs = []
    for s in seeds:
        z = len(zs); zs.append(list(s))
        for i in s: zone[i] = z
    za = [sum(area[i] for i in s) for s in zs]
    changed = True
    while changed:
        changed = False
        order = sorted(range(len(zs)), key=lambda z: za[z])
        for z in order:
            cand = set()
            for i in zs[z]:
                for j in adj[i]:
                    if zone[j] < 0 and grow_ok(z, j): cand.add(j)
            if not cand: continue
            j = min(cand, key=lambda j: area[j])
            zone[j] = z; zs[z].append(j); za[z] += area[j]; changed = True
            break
    # sobras: junta ao vizinho de menor área (qualquer grupo), senão cria zona nova
    while any(z < 0 for z in zone):
        moved = False
        for i in range(n):
            if zone[i] >= 0: continue
            nb = [zone[j] for j in adj[i] if zone[j] >= 0 and targets_extra(zone[j], i)]
            if nb:
                z = min(nb, key=lambda z: za[z]); zone[i] = z; zs[z].append(i); za[z] += area[i]; moved = True
        if not moved:
            i = next(i for i in range(n) if zone[i] < 0)
            z = len(zs); zs.append([i]); za.append(area[i]); zone[i] = z
    return zone, zs


def chain(directed):
    """directed: lista de listas de pontos (cada uma é um trecho com início e fim). Encadeia em anéis."""
    starts = defaultdict(list)
    for k, seg in enumerate(directed): starts[seg[0]].append(k)
    used = [False] * len(directed)
    rings = []
    for k in range(len(directed)):
        if used[k]: continue
        used[k] = True
        ring = list(directed[k])
        guard = 0
        while ring[-1] != ring[0] and guard < 100000:
            guard += 1
            nxt = [j for j in starts[ring[-1]] if not used[j]]
            if not nxt: break
            j = nxt[0]; used[j] = True
            ring.extend(directed[j][1:])
        if ring[-1] == ring[0] and len(ring) >= 4: rings.append(ring)
    return rings


def to_polys(rings):
    """Separa anéis em polígonos (externo + buracos) por contenção."""
    rings = sorted(rings, key=lambda r: -abs(ring_area(r)))
    polys = []
    for r in rings:
        p = r[len(r) // 2]
        host = None
        for poly in polys:
            if pt_in_ring(p[0], p[1], poly[0]) and not any(pt_in_ring(p[0], p[1], h) for h in poly[1:]):
                host = poly
        if host is not None and abs(ring_area(r)) < abs(ring_area(host[0])):
            host.append(r)
        else:
            polys.append([r])
    return polys


def finish(feats, zones_members, zone_of, adj_b, links_b, P, names_by_type, types, credit, city, bounds):
    nz = len(zones_members)
    zadj = [set() for _ in range(nz)]
    for i, a in enumerate(adj_b):
        for j in a:
            if zone_of[i] != zone_of[j]: zadj[zone_of[i]].add(zone_of[j])
    links = []
    for a, b in links_b:
        za, zb = zone_of[a], zone_of[b]
        if za != zb and zb not in zadj[za]:
            zadj[za].add(zb); zadj[zb].add(za); links.append([za, zb])
    pools = {k: list(v) for k, v in names_by_type.items()}
    for v in pools.values(): R.shuffle(v)
    out = []
    for z in range(nz):
        polys = feats[z]
        lab, _ = label_point(polys)
        area = sum(abs(ring_area(p[0])) - sum(abs(ring_area(h)) for h in p[1:]) for p in polys)
        t = types[z]
        name = pools[t].pop() if pools[t] else f"Zona {z + 1}"
        g = [[[list(P.inv(x, y)) for x, y in r] for r in p] for p in polys]
        out.append({'n': name, 't': t, 'g': g, 'l': list(P.inv(*lab)), 'a': round(area), 'k': len(zones_members[z])})
    # centro do link em coordenadas geográficas
    return {'city': city, 'bounds': bounds, 'credit': credit, 'z': out, 'adj': [sorted(a) for a in zadj], 'links': links}


def build_rio():
    T = json.load(open(os.path.join(DATA, 'places.json')))
    sx, sy = T['transform']['scale']; tx, ty = T['transform']['translate']
    arcs_q = []
    for a in T['arcs']:
        x = y = 0; pts = []
        for dx, dy in a:
            x += dx; y += dy; pts.append((x, y))
        arcs_q.append(pts)
    deq = lambda p: (p[0] * sx + tx, p[1] * sy + ty)
    nb = T['objects']['neighborhoods']['geometries']
    n = len(nb)
    def poly_arcs(g):
        return g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    owners = defaultdict(set)
    for i, g in enumerate(nb):
        for p in poly_arcs(g):
            for r in p:
                for k in r: owners[k if k >= 0 else ~k].add(i)
    adj = [set() for _ in range(n)]
    for k, s in owners.items():
        for a in s:
            for b in s:
                if a != b: adj[a].add(b)
    nb_arcs = {k if k >= 0 else ~k for g in nb for p in poly_arcs(g) for r in p for k in r}
    allq = [deq(p) for k in nb_arcs for p in arcs_q[k]]
    lon0 = min(p[0] for p in allq); lon1 = max(p[0] for p in allq); lat0 = min(p[1] for p in allq); lat1 = max(p[1] for p in allq)
    P = Proj(lon0, lon1, lat0, lat1, 1600)
    def ring_pts(r):
        pts = []
        for k in r:
            a = arcs_q[k] if k >= 0 else arcs_q[~k][::-1]
            pts.extend(a if not pts else a[1:])
        return pts
    area = []; xy = []
    for g in nb:
        polys = [[[P(*deq(p)) for p in ring_pts(r)] for r in p] for p in poly_arcs(g)]
        area.append(sum(abs(ring_area(p[0])) for p in polys))
        lab, _ = label_point(polys); xy.append(lab)
    name = [g['properties']['name'] for g in nb]
    ap = [g['properties'].get('zone', '') for g in nb]
    # links entre ilhas (mesma lógica do build_maps)
    links_b = [[32, 2], [21, 55], [20, 93]]
    adj_g = [set(a) for a in adj]
    for a, b in links_b: adj_g[a].add(b); adj_g[b].add(a)
    # complexos de comunidades (comunidades vizinhas viram uma zona só)
    com = [i for i in range(n) if name[i] in COMUNIDADES]
    parent = {i: i for i in com}
    def f(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i in com:
        for j in adj[i]:
            if j in parent: parent[f(i)] = f(j)
    groups = defaultdict(list)
    for i in com: groups[f(i)].append(i)
    seeds = list(groups.values())
    is_com_zone = [True] * len(seeds)
    seed_ap = [ap[s[0]] for s in seeds]
    targets = {'centro': 3, 'sul': 5, 'sudoeste': 4, 'norte': 13, 'oeste': 6}
    forced = {'centro': ['Centro', 'São Cristóvão', 'Rio Comprido']}
    for A, nm in forced.items():
        for x in nm:
            seeds.append([name.index(x)]); is_com_zone.append(False); seed_ap.append(A)
    for A, tgt in targets.items():
        if A in forced: continue
        have = sum(1 for a in seed_ap if a == A)
        cand = [i for i in range(n) if ap[i] == A and name[i] not in COMUNIDADES]
        need = max(1, tgt - have)
        chosen = []
        for _ in range(need):
            best = None; bd = -1
            for i in cand:
                if i in chosen: continue
                ref = [xy[j] for s in seeds for j in s if ap[j] == A] + [xy[c] for c in chosen]
                d = min((math.dist(xy[i], r) for r in ref), default=1e9) * (1 + area[i] / 4e4)
                if d > bd: bd, best = d, i
            chosen.append(best)
        for c in chosen:
            seeds.append([c]); is_com_zone.append(False); seed_ap.append(A)
    def grow_ok(z, j):
        return (not is_com_zone[z]) and ap[j] == seed_ap[z] and name[j] not in COMUNIDADES
    def extra_ok(z, j):
        return not is_com_zone[z] or name[j] in COMUNIDADES
    zone_of, members = cluster(n, adj_g, area, xy, seeds, grow_ok, None, extra_ok)
    za = [sum(area[i] for i in m) for m in members]
    med = sorted(za)[len(za) // 2]
    for z in range(len(members)):
        if members[z] and za[z] < med * .12:
            nbz = {zone_of[j] for i in members[z] for j in adj_g[i] if zone_of[j] != z}
            if nbz:
                t = min(nbz, key=lambda q: za[q])
                for i in members[z]: zone_of[i] = t
                members[t] += members[z]; za[t] += za[z]; members[z] = []
    keep = [z for z in range(len(members)) if members[z]]
    remap = {z: k for k, z in enumerate(keep)}
    members = [members[z] for z in keep]
    is_com_zone = [is_com_zone[z] if z < len(is_com_zone) else False for z in keep]
    seed_ap = [seed_ap[z] if z < len(seed_ap) else ap[members[k][0]] for k, z in enumerate(keep)]
    zone_of = [remap[z] for z in zone_of]
    nz = len(members)
    # dissolve
    feats = []; types = []
    for z in range(nz):
        cnt = defaultdict(int); refs = []
        for i in members[z]:
            for p in poly_arcs(nb[i]):
                for r in p:
                    for k in r:
                        cnt[k if k >= 0 else ~k] += 1; refs.append(k)
        directed = []
        for k in refs:
            if cnt[k if k >= 0 else ~k] == 1:
                directed.append(arcs_q[k] if k >= 0 else arcs_q[~k][::-1])
        rings = chain(directed)
        rings = [[P(*deq(p)) for p in r] for r in rings]
        feats.append(to_polys(rings))
        mem = [name[i] for i in members[z]]
        zap = seed_ap[z]
        if is_com_zone[z]: t = 'comunidade'
        elif 'Centro' in mem: t = 'centro'
        elif any(m in PORTO for m in mem): t = 'porto'
        elif zap == 'centro': t = 'centro'
        elif zap == 'sul' or any(m in NOBRE for m in mem): t = 'nobre'
        elif zap == 'oeste': t = 'periferia'
        else: t = 'suburbio'
        types.append(t)
    bounds = [round(lon0, 4), round(lat0, 4), round(lon1, 4), round(lat1, 4)]
    return finish(feats, members, zone_of, adj, links_b, P, NAMES_RIO, types,
                  'Contornos: Instituto Pereira Passos/PCRJ e IBGE. Zonas e nomes fictícios.', 'Rio de Janeiro', bounds), members, name


def build_palermo():
    D = json.load(open(os.path.join(DATA, 'limits_P_82_municipalities.geojson')))
    fr = [f for f in D['features'] if f['properties']['name'] != 'Ustica']
    n = len(fr)
    name = [f['properties']['name'] for f in fr]
    polys_of = lambda g: g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    key = lambda p: (round(p[0], 6), round(p[1], 6))
    allp = [p for f in fr for poly in polys_of(f['geometry']) for r in poly for p in r]
    lon0 = min(p[0] for p in allp); lon1 = max(p[0] for p in allp); lat0 = min(p[1] for p in allp); lat1 = max(p[1] for p in allp)
    P = Proj(lon0, lon1, lat0, lat1, 1600)
    # anéis normalizados: externo anti-horário, buraco horário
    norm = []
    for f in fr:
        ps = []
        for poly in polys_of(f['geometry']):
            rr = []
            for ri, r in enumerate(poly):
                r = [key(p) for p in r]
                if r[0] != r[-1]: r.append(r[0])
                a = ring_area(r)
                if (ri == 0 and a < 0) or (ri > 0 and a > 0): r = r[::-1]
                rr.append(r)
            ps.append(rr)
        norm.append(ps)
    seg_owner = defaultdict(set)
    for i, ps in enumerate(norm):
        for poly in ps:
            for r in poly:
                for a, b in zip(r, r[1:]): seg_owner[frozenset((a, b))].add(i)
    cnt = defaultdict(int)
    for s, o in seg_owner.items():
        if len(o) > 1:
            o = sorted(o)
            for a in o:
                for b in o:
                    if a < b: cnt[(a, b)] += 1
    adj = [set() for _ in range(n)]
    for (a, b), c in cnt.items():
        if c >= 1: adj[a].add(b); adj[b].add(a)
    area = []; xy = []
    for ps in norm:
        pp = [[[P(*p) for p in r] for r in poly] for poly in ps]
        area.append(sum(abs(ring_area(p[0])) for p in pp))
        lab, _ = label_point(pp); xy.append(lab)
    pal = name.index('Palermo')
    seeds = [[pal]] + [[name.index(t)] for t in PA_TOWNS]
    kind = ['capitale'] + ['citta'] * len(PA_TOWNS)
    target = 22
    while len(seeds) < target:
        used = {i for s in seeds for i in s}
        best = max((i for i in range(n) if i not in used), key=lambda i: min(math.dist(xy[i], xy[s[0]]) for s in seeds))
        seeds.append([best]); kind.append('x')
    grow_ok = lambda z, j: kind[z] != 'capitale' and j != pal
    extra_ok = lambda z, j: kind[z] != 'capitale'
    zone_of, members = cluster(n, adj, area, xy, seeds, grow_ok, None, extra_ok)
    nz = len(members)
    # dissolve por cancelamento de segmentos
    zrings = []
    for z in range(nz):
        sc = defaultdict(int)
        for i in members[z]:
            for poly in norm[i]:
                for r in poly:
                    for a, b in zip(r, r[1:]): sc[frozenset((a, b))] += 1
        directed = []
        for i in members[z]:
            for poly in norm[i]:
                for r in poly:
                    for a, b in zip(r, r[1:]):
                        if a != b and sc[frozenset((a, b))] == 1: directed.append([a, b])
        zrings.append(chain(directed))
    # simplificação preservando fronteiras compartilhadas entre zonas
    vown = defaultdict(set)
    for z, rings in enumerate(zrings):
        for r in rings:
            for p in r: vown[p].add(z)
    def simp(r, tol=1.1):
        r = r[:-1]
        m = len(r)
        sets = [frozenset(vown[p]) for p in r]
        fixed = [i for i in range(m) if sets[i] != sets[i - 1] or sets[i] != sets[(i + 1) % m] or len(sets[i]) >= 3]
        pr = [P(*p) for p in r]
        if len(fixed) < 2: fixed = [0, m // 3, 2 * m // 3]
        out = []
        for a in range(len(fixed)):
            i, j = fixed[a], fixed[(a + 1) % len(fixed)]
            ch = pr[i:j + 1] if j > i else pr[i:] + pr[:j + 1]
            s = dp(ch[::-1], tol)[::-1] if r[i] > r[j] else dp(ch, tol)
            out.extend(s[:-1])
        out.append(out[0])
        return out
    feats = []; types = []
    for z in range(nz):
        rings = [simp(r) for r in zrings[z]]
        rings = [r for r in rings if len(r) >= 4]
        feats.append(to_polys(rings))
        mem = [name[i] for i in members[z]]
        if kind[z] == 'capitale': t = 'capitale'
        elif kind[z] == 'citta': t = 'citta'
        elif any(m in PA_COSTA for m in mem): t = 'costa'
        else: t = 'campagna'
        types.append(t)
    bounds = [round(lon0, 4), round(lat0, 4), round(lon1, 4), round(lat1, 4)]
    return finish(feats, members, zone_of, adj, [], P, NAMES_PA, types,
                  'Contornos: ISTAT (CC-BY) via openpolis. Zonas e nomes fictícios.', 'Palermo, Sicília', bounds), members, name


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for nm, fn in [('rio', build_rio), ('palermo', build_palermo)]:
        o, members, bn = fn()
        s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
        open(os.path.join(OUT, f'{nm}.json'), 'w').write(s)
        from collections import Counter
        deg = [len(a) for a in o['adj']]
        print(nm, len(o['z']), 'zonas', len(s) // 1024, 'KB', Counter(z['t'] for z in o['z']), 'grau min', min(deg), 'links', o['links'])
        for z, m in zip(o['z'], members):
            print('   ', z['t'][:5], z['n'], '<-', ', '.join(bn[i] for i in m)[:110], '| aneis', sum(len(p) for p in z['g']))
