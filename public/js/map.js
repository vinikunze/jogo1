// Mapa: MapLibre com ruas reais (OpenFreeMap) e as zonas do jogo por cima.
import { S, owned, colorOf, reach, visible, atkPow, estDef, odds, incOf, clamp } from './engine.js';

const STYLE = 'https://tiles.openfreemap.org/styles/dark';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const FALLBACK = { version: 8, glyphs: GLYPHS, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0b141c' } }] };
const EMPTY = { type: 'FeatureCollection', features: [] };
let map = null, ready = false, mapId = null, onSelect = () => {}, onReadyCb = () => {};
export let view = 'dom';
export const isReady = () => ready;

const geoOf = J => ({ type: 'FeatureCollection', features: J.z.map((z, i) => ({ type: 'Feature', id: i, properties: { i }, geometry: { type: 'MultiPolygon', coordinates: z.g } })) });
const linesOf = J => ({ type: 'FeatureCollection', features: J.links.map(([a, b]) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [J.z[a].l, J.z[b].l] } })) });

export function pad() {
  const mob = innerWidth <= 760, top = (document.querySelector('#hud')?.offsetHeight || 70) + 52, pan = document.querySelector('#panel');
  return mob ? { top: top + 6, right: 16, bottom: (pan?.offsetHeight || 0) + 16, left: 16 } : { top: top + 6, right: (pan?.offsetWidth || 0) + 40, bottom: 20, left: 70 };
}
export function initMap(select, done) {
  onSelect = select; onReadyCb = done;
  const M = S.M;
  if (map && mapId === M.id) { map.resize(); if (ready) onReadyCb(); return; }
  if (map) { map.remove(); map = null; }
  ready = false; mapId = M.id;
  map = new maplibregl.Map({ container: 'map', style: STYLE, bounds: M.bounds, fitBoundsOptions: { padding: pad() }, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, maxZoom: 16, minZoom: 7, renderWorldCopies: false });
  map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation();
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: M.credit }), 'bottom-left');
  let fell = false; const fallback = () => { if (!ready && !fell) { fell = true; map.setStyle(FALLBACK); } };
  map.on('error', () => { if (!map.isStyleLoaded()) fallback(); });
  setTimeout(fallback, 9000);
  map.on('styleimagemissing', e => makeBadge(e.id));
  map.on('style.load', () => { styleTweak(); addLayers(); ready = true; onReadyCb(); });
  map.on('click', 'zf', e => { const f = e.features && e.features[0]; if (f) onSelect(f.id); });
  map.on('mouseenter', 'zf', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'zf', () => map.getCanvas().style.cursor = '');
}
function styleTweak() {
  for (const l of map.getStyle().layers) if (/oneway|^place_|boundary|aeroway|ice_shelf|glacier|water_name/.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none');
  const set = (id, p, v) => { try { if (map.getLayer(id)) map.setPaintProperty(id, p, v); } catch (e) {} };
  set('background', 'background-color', '#0b0d11'); set('water', 'fill-color', '#0a1923');
}
function addLayers() {
  const M = S.M;
  map.addSource('zones', { type: 'geojson', data: geoOf(M) });
  map.addSource('pts', { type: 'geojson', data: EMPTY });
  map.addSource('ptn', { type: 'geojson', data: EMPTY });
  map.addSource('links', { type: 'geojson', data: linesOf(M) });
  map.addSource('fx', { type: 'geojson', data: EMPTY });
  const before = ['building', 'road_area_pier', 'highway_path', 'highway_minor'].find(id => map.getLayer(id));
  map.addLayer({ id: 'zf', type: 'fill', source: 'zones', paint: { 'fill-color': ['coalesce', ['feature-state', 'c'], '#101216'], 'fill-opacity': ['coalesce', ['feature-state', 'a'], .3] } }, before);
  map.addLayer({ id: 'zl', type: 'line', source: 'zones', paint: { 'line-color': 'rgba(247,220,142,.38)', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, .8, 14, 2] } });
  map.addLayer({ id: 'zfr', type: 'line', source: 'zones', filter: ['in', ['id'], ['literal', []]], layout: { 'line-join': 'round' }, paint: { 'line-color': ['coalesce', ['feature-state', 'fc'], '#f8e09a'], 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 14, 4], 'line-dasharray': [2, 1.2] } });
  map.addLayer({ id: 'zsel', type: 'line', source: 'zones', filter: ['==', ['id'], -1], paint: { 'line-color': '#ffffff', 'line-width': 3.5 } });
  map.addLayer({ id: 'links', type: 'line', source: 'links', paint: { 'line-color': 'rgba(247,220,142,.6)', 'line-width': 1.6, 'line-dasharray': [2, 2] } });
  map.addLayer({ id: 'fx', type: 'line', source: 'fx', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#f8e09a', 'line-width': 5, 'line-opacity': .95 } });
  map.addLayer({ id: 'names', type: 'symbol', source: 'ptn', layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 13, 14, 16, 17], 'text-anchor': 'top', 'text-offset': [0, 1.7], 'text-max-width': 9, 'symbol-sort-key': ['get', 'ka'], 'text-transform': 'uppercase', 'text-letter-spacing': .04 }, paint: { 'text-color': 'rgba(241,236,226,.92)', 'text-halo-color': 'rgba(5,7,10,.95)', 'text-halo-width': 1.8 } });
  map.addLayer({ id: 'badges', type: 'symbol', source: 'pts', filter: ['!=', ['get', 'ic'], ''], layout: { 'icon-image': ['get', 'ic'], 'symbol-sort-key': ['get', 'k'], 'icon-padding': 0, 'icon-ignore-placement': true, 'icon-allow-overlap': true } });
}
function makeBadge(id) {
  if (!id.startsWith('bd|') || map.hasImage(id)) return;
  const [, col, nb, base, s, txt, tc] = id.split('|'), r = 2, Sz = 40 * r, cv = document.createElement('canvas'); cv.width = Sz; cv.height = Sz;
  const x = cv.getContext('2d'), c = Sz / 2;
  if (s === '1') { x.beginPath(); x.arc(c, c, 17 * r, 0, 7); x.fillStyle = 'rgba(255,255,255,.3)'; x.fill(); }
  x.beginPath(); x.arc(c, c, 13 * r, 0, 7); x.fillStyle = '#0a0b0e'; x.fill(); x.lineWidth = 3 * r; x.strokeStyle = col; x.stroke();
  x.fillStyle = '#f8e09a';
  for (let k = 0; k < +nb; k++) { x.beginPath(); x.arc(c - 6 * r + k * 6 * r, c + 15.5 * r, 2.2 * r, 0, 7); x.fill(); }
  if (base === '1') { x.beginPath(); x.moveTo(c - 7 * r, c - 14 * r); x.lineTo(c, c - 19.5 * r); x.lineTo(c + 7 * r, c - 14 * r); x.closePath(); x.fill(); }
  x.fillStyle = tc || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${(txt.length > 2 ? 12 : 14) * r}px 'Barlow Condensed',Barlow,Arial,sans-serif`; x.fillText(txt, c, c + .5 * r);
  map.addImage(id, { width: Sz, height: Sz, data: x.getImageData(0, 0, Sz, Sz).data }, { pixelRatio: r });
}
export function setView(v) { view = v; paint(); }
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, '0')).join(''); };
export function zoneStyle(i) {
  const g = S.G, d = g.d[i], o = d.o;
  if (g.phase === 'setup') { const ok = S.MD.startPool(S.M.type[i]); return { c: ok ? '#d9a943' : '#000000', a: ok ? .5 : .5, fr: ok ? '#f8e09a' : null }; }
  const rc = reach(i);
  const oc = rc ? odds(atkPow(Math.max(1, g.reserve)) / estDef(i))[1] : null;
  if (view === 'atk') {
    if (o === 0) return { c: colorOf(0), a: .28, fr: null };
    if (rc) return { c: oc, a: .55, fr: oc };
    return { c: '#000000', a: .62, fr: null };
  }
  if (view === 'loy') {
    if (o === 0) return { c: d.l < 50 ? mix('#ff5b4f', '#f0cf5a', d.l / 50) : mix('#f0cf5a', '#5fd48a', (d.l - 50) / 50), a: .65, fr: null };
    return { c: '#000000', a: .55, fr: null };
  }
  if (view === 'inc') {
    if (o === 0) { const t = clamp(incOf(i) / 900, 0, 1); return { c: mix('#4a3a17', '#f8e09a', t), a: .7, fr: null }; }
    return { c: '#000000', a: .55, fr: rc ? '#8a8f9c' : null };
  }
  return { c: o === -1 ? '#101216' : colorOf(o), a: o === -1 ? .32 : o === 0 ? .6 : .48, fr: rc ? oc : null };
}
export function paint() {
  if (!ready || !S.G) return;
  const g = S.G, M = S.M, front = [];
  for (let i = 0; i < M.N; i++) {
    const st = zoneStyle(i);
    map.setFeatureState({ source: 'zones', id: i }, { c: st.c, a: st.a, fc: st.fr || '#f8e09a' });
    if (st.fr) front.push(i);
  }
  map.setFilter('zfr', ['in', ['id'], ['literal', front]]);
  map.setFilter('zsel', ['==', ['id'], S.sel == null ? -1 : S.sel]);
  if (S.flash != null && g.d[S.flash]) {
    const i = S.flash, base = zoneStyle(i).a; let n = 0;
    const t = setInterval(() => { if (!ready || ++n > 5) { clearInterval(t); if (ready) map.setFeatureState({ source: 'zones', id: i }, { a: base }); return; } map.setFeatureState({ source: 'zones', id: i }, { a: n % 2 ? .95 : base }); }, 180);
    S.flash = null;
  }
  overlay();
}
function overlay() {
  const g = S.G, M = S.M, setup = g.phase === 'setup';
  const fc = {
    type: 'FeatureCollection', features: M.z.map((z, i) => {
      const d = g.d[i], p = { n: z.n, ka: (setup && S.MD.startPool(M.type[i]) ? -1e9 : 0) - z.a, ic: '', k: 0 };
      if (!setup) {
        const vis = visible(i), txt = vis ? String(d.t) : '?';
        p.ic = `bd|${colorOf(d.o)}|${d.o === 0 ? d.b.length : 0}|${i === g.base ? 1 : 0}|${i === S.sel ? 1 : 0}|${txt}|${d.o === 0 ? '#ffffff' : '#e9e4da'}`;
        p.k = (i === S.sel ? -1e9 : 0) + (d.o === 0 ? -1e8 : 0) - z.a;
      }
      return { type: 'Feature', properties: p, geometry: { type: 'Point', coordinates: z.l } };
    }),
  };
  map.getSource('pts').setData(fc); map.getSource('ptn').setData(fc);
}
export function arrow(a, b) {
  if (a == null || !ready) return; const A = S.M.z[a].l, B = S.M.z[b].l, t0 = performance.now(), src = map.getSource('fx');
  const step = t => { const k = Math.min(1, (t - t0) / 450), p = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]; src.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [A, p] } }); if (k < 1) requestAnimationFrame(step); else setTimeout(() => src.setData(EMPTY), 700); };
  requestAnimationFrame(step);
}
export function fitAll() { if (map) map.fitBounds(S.M.bounds, { padding: pad(), duration: 0 }); }
export function focusOn(i, zoomIn) { if (!map) return; const z = zoomIn ? Math.max(map.getZoom(), S.M.id === 'rio' ? 10.6 : 9.1) : map.getZoom(); map.easeTo({ center: S.M.z[i].l, zoom: z, padding: pad(), duration: 650 }); }
export function zoom(d) { if (!map) return; d > 0 ? map.zoomIn() : map.zoomOut(); }
export function resize() { if (map) map.resize(); }
