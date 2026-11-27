# Gera o mapa da América do Sul para o modo Cartel.
# Fonte: Natural Earth (domínio público), estados e departamentos (admin 1).
# Cada país é dividido em algumas zonas contíguas (agrupando estados vizinhos); nomes fictícios.
import json, math, os, random
import shapely
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union, polylabel
from shapely.strtree import STRtree

R = random.Random(7)
HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, 'data')
OUT = os.path.join(HERE, '..', 'public', 'maps', 'sulamerica.json')

ZONES = {'Colombia': 9, 'Venezuela': 6, 'Ecuador': 4, 'Peru': 7, 'Bolivia': 4, 'Paraguay': 3, 'Uruguay': 2,
         'Argentina': 7, 'Chile': 5, 'Brazil': 11, 'Guyana': 1, 'Suriname': 1, 'France': 1}
METRO = {('Colombia', 'Antioquia'), ('Colombia', 'Bogota'), ('Colombia', 'Bogotá'), ('Colombia', 'Bogotá D.C.'), ('Colombia', 'Atlántico'), ('Peru', 'Lima'), ('Peru', 'Callao'),
         ('Venezuela', 'Distrito Capital'), ('Venezuela', 'Zulia'), ('Ecuador', 'Guayas'), ('Bolivia', 'La Paz'), ('Paraguay', 'Asunción'), ('Uruguay', 'Montevideo'),
         ('Argentina', 'Ciudad de Buenos Aires'), ('Chile', 'Región Metropolitana de Santiago'), ('Brazil', 'São Paulo'), ('Brazil', 'Rio de Janeiro'), ('Brazil', 'Pernambuco')}
NAMES = {
    'metropole': ['Ciudad Dorada', 'Distrito del Sol', 'Metrópole Cinza', 'Capital del Valle', 'Ciudad de los Reyes Perdidos', 'Gran Bahía',
                  'Nova Babilônia', 'Ciudad Esmeralda', 'Distrito Federal Sur', 'Capital del Altiplano', 'Puerto Mayor', 'Ciudad de la Furia',
                  'São Jorge Grande', 'Villa Imperial'],
    'selva': ['Selva del Jaguar', 'Rio das Sombras', 'Floresta Funda', 'Selva Negra del Norte', 'Valle de los Ríos', 'Mata dos Anacondas',
              'Selva del Cóndor Verde', 'Floresta do Garimpo', 'Pantanal Escondido', 'Rio Serpente', 'Selva de las Lluvias', 'Mata Virgem',
              'Igarapé Perdido', 'Selva del Puma', 'Bajo Amazonas', 'Cabeceras del Río'],
    'porto': ['Puerto Escondido', 'Costa del Pacífico Norte', 'Baía dos Contrabandistas', 'Puerto Neblina', 'Costa Brava del Sur', 'Porto Sereno',
              'Bahía del Tiburón', 'Litoral das Ondas', 'Puerto Ballena', 'Costa del Caribe', 'Cabo de las Tormentas', 'Porto das Gaivotas',
              'Bahía Esmeralda', 'Puerto Faro'],
    'interior': ['Sierra Dorada', 'Valle del Cóndor', 'Altiplano Gris', 'Pampa Seca', 'Sertão Vermelho', 'Meseta del Viento', 'Llanos del Toro',
                 'Cerrado Alto', 'Desierto de Sal', 'Quebrada Honda', 'Planalto das Pedras', 'Valle de la Luna Roja', 'Chaco Bravo',
                 'Serra do Ouro', 'Altos del Volcán', 'Campos do Gado', 'Patagonia Fría', 'Pampa del Indio', 'Sierra de los Contrabandistas',
                 'Valle Sagrado Sur', 'Puna Alta', 'Sertão das Veredas', 'Cordillera Blanca Sur', 'Mesa del Diablo'],
}


def load():
    D = json.load(open(os.path.join(DATA, 'ne_admin1.geojson')))
    clip = box(-82.5, -56.5, -33, 13.5)
    regs = []
    for f in D['features']:
        p = f['properties']; c = p.get('admin')
        if c not in ZONES: continue
        if c == 'France' and p.get('name') != 'Guyane française': continue
        g = shape(f['geometry']).buffer(0).intersection(clip)
        if g.is_empty: continue
        # descarta ilhas pequenas longe do continente (Galápagos, Fernando de Noronha...)
        if g.geom_type == 'MultiPolygon':
            parts = sorted(g.geoms, key=lambda x: -x.area)
            g = unary_union([q for q in parts if q.area > parts[0].area * .02 and q.distance(parts[0]) < 1.5])
        if p.get('name') == 'Galápagos': continue
        regs.append({'c': c, 'n': p['name'] or p.get('name_alt') or '?', 'g': g, 'ct': g.representative_point()})
    return regs


def adjacency(regs):
    gs = [r['g'] for r in regs]; tree = STRtree(gs); adj = [set() for _ in regs]
    for i, g in enumerate(gs):
        for j in tree.query(g.buffer(.05)):
            j = int(j)
            if j != i and g.buffer(.05).intersects(gs[j]): adj[i].add(j); adj[j].add(i)
    return adj


def kmeans(pts, k, it=30):
    cs = [pts[R.randrange(len(pts))]]
    while len(cs) < k:
        d = [min(math.dist(p, c) for c in cs) ** 2 for p in pts]; s = sum(d); x = R.random() * s
        for p, w in zip(pts, d):
            x -= w
            if x <= 0: cs.append(p); break
        else: cs.append(pts[-1])
    for _ in range(it):
        gr = [[] for _ in cs]
        for p in pts: gr[min(range(len(cs)), key=lambda q: math.dist(p, cs[q]))].append(p)
        cs = [(sum(p[0] for p in g) / len(g), sum(p[1] for p in g) / len(g)) if g else cs[q] for q, g in enumerate(gr)]
    return cs


def cluster(regs, adj):
    zone_of = [-1] * len(regs); nz = 0
    for c, k in ZONES.items():
        idx = [i for i, r in enumerate(regs) if r['c'] == c]
        if not idx: continue
        k = min(k, len(idx))
        pts = [(regs[i]['ct'].x, regs[i]['ct'].y) for i in idx]
        cs = kmeans(pts, k)
        seeds = []
        for cc in cs:
            best = min((i for i in idx if i not in seeds), key=lambda i: math.dist((regs[i]['ct'].x, regs[i]['ct'].y), cc))
            seeds.append(best)
        # cresce por distância no grafo (Dijkstra multi-origem) dentro do país
        import heapq
        dist = {i: 1e18 for i in idx}; pq = []
        for z, s in enumerate(seeds): dist[s] = 0; zone_of[s] = nz + z; heapq.heappush(pq, (0, s, nz + z))
        while pq:
            d0, i, z = heapq.heappop(pq)
            if d0 > dist[i]: continue
            for j in adj[i]:
                if regs[j]['c'] != c: continue
                nd = d0 + math.dist((regs[i]['ct'].x, regs[i]['ct'].y), (regs[j]['ct'].x, regs[j]['ct'].y))
                if nd < dist[j]: dist[j] = nd; zone_of[j] = z; heapq.heappush(pq, (nd, j, z))
        for i in idx:  # região sem vizinho no país (ilha): vai para a zona mais próxima
            if zone_of[i] < 0: zone_of[i] = nz + min(range(k), key=lambda z: regs[seeds[z]]['ct'].distance(regs[i]['ct']))
        nz += k
    return zone_of, nz


def main():
    regs = load(); adj = adjacency(regs)
    keep = [i for i in range(len(regs)) if adj[i]]
    print('ilhas descartadas', [regs[i]['n'] for i in range(len(regs)) if not adj[i]])
    regs = [regs[i] for i in keep]; adj = adjacency(regs)
    print('sem nome', [r['c'] for r in regs if r['n'] == '?'])
    zone_of, nz = cluster(regs, adj)
    members = [[i for i in range(len(regs)) if zone_of[i] == z] for z in range(nz)]
    geoms = [unary_union([regs[i]['g'] for i in m]).buffer(0) for m in members]
    geoms = list(shapely.coverage_simplify(geoms, .045))
    zadj = [set() for _ in range(nz)]
    for i, a in enumerate(adj):
        for j in a:
            if zone_of[i] != zone_of[j]: zadj[zone_of[i]].add(zone_of[j])
    land = unary_union(geoms)
    coast = land.boundary
    types = []
    for z, m in enumerate(members):
        names = {regs[i]['n'] for i in m}; g = geoms[z]; ct = g.representative_point()
        if {(regs[i]['c'], regs[i]['n']) for i in m} & METRO: t = 'metropole'
        elif -16 < ct.y < 5 and -76 < ct.x < -48: t = 'selva'
        elif g.boundary.intersection(coast.buffer(.02)).length > g.boundary.length * .18: t = 'porto'
        else: t = 'interior'
        types.append(t)
    pools = {k: list(v) for k, v in NAMES.items()}
    for v in pools.values(): R.shuffle(v)
    out = []
    for z in range(nz):
        g = geoms[z]
        polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
        polys = [p for p in polys if p.area > g.area * .01]
        big = max(polys, key=lambda p: p.area)
        lab = polylabel(big, .05)
        t = types[z]
        name = pools[t].pop() if pools[t] else f'Zona {z + 1}'
        gj = [[[[round(x, 3), round(y, 3)] for x, y in p.exterior.coords]] + [[[round(x, 3), round(y, 3)] for x, y in h.coords] for h in p.interiors] for p in polys]
        out.append({'n': name, 't': t, 'g': gj, 'l': [round(lab.x, 3), round(lab.y, 3)], 'a': round(g.area * 1000), 'k': min(6, len(members[z])),
                    'pais': regs[members[z][0]]['c']})
    b = land.bounds
    J = {'city': 'América do Sul', 'bounds': [round(v, 3) for v in b], 'credit': 'Contornos: Natural Earth (domínio público). Zonas e nomes fictícios.',
         'z': out, 'adj': [sorted(a) for a in zadj], 'links': []}
    json.dump(J, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    from collections import Counter
    print(nz, 'zonas', Counter(types), os.path.getsize(OUT) // 1024, 'KB', 'isoladas', [z for z in range(nz) if not zadj[z]])


if __name__ == '__main__':
    main()
