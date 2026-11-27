// Simulador sem interface: roda o jogo no Node com um bot, para testar equilíbrio.
import fs from 'fs';
const ROOT = new URL('../../public/', import.meta.url).pathname;
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
globalThis.fetch = async u => { const p = ROOT + String(u).split('?')[0]; return { ok: true, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) }; };
const E = await import(ROOT + 'js/engine.js');
const ST = await import(ROOT + 'js/stories.js');
const OR = await import(ROOT + 'js/orders.js');
const { S, A } = E;
S.hooks = { dayStart: ST.dayStart, dayEnd: ST.dayEnd, storyAnswer: ST.storyAnswer, win: ST.groupWin, orderAnswer: OR.orderAnswer };
S.on = {};
if (process.env.BAL) S.BAL = JSON.parse(process.env.BAL);
const [mode = 'faccao', start = '2', days = '90', smart = '1'] = process.argv.slice(2);
await E.newGame(mode);
let base = null; for (let i = 0; i < S.M.N; i++) if (E.canStart(i)) { base = i; break; }
E.startAt(base, +start, 'Bot');
const G = S.G, M = S.M, traj = [];
const answer = m => {
  if (smart !== '1') return Math.floor(Math.random() * m.opts.length);
  // bot "esperto": aceita pedidos só quando tem estoque, recusa o resto; em geral escolhe a 1ª opção
  const o = m.opts;
  if (o.some(x => x.k === 'ord')) { const id = o[0].p && o[0].p.id, od = (G.ord || []).find(x => x.id === id); if (od && !od.cash && (G.stock[od.good] || 0) < od.q * .6) return o.length - 1; return 0; }
  return 0;
};
for (let d = 0; d < +days && !G.over; d++) {
  for (const m of G.msgs.filter(m => m.st === 'open')) E.answer(m.id, answer(m));
  for (let k = 0; k < 4; k++) { const c = E.tree().nodes.filter(n => E.nodeState(n) === 'can'); if (!c.length) break; E.learn(c[Math.floor(Math.random() * c.length)].id); }
  if (E.can('market') && G.heat > 55 && G.money > E.bribeCost() + 500 && G.acts > 0) A.bribe();
  if (E.can('crew')) for (const i of E.owned(0)) { const inner = M.adj[i].every(j => G.d[j].o === 0); if (inner && G.d[i].t > 3) { S.sel = i; A.wd(G.d[i].t - 3); } }
  if (E.can('crew')) { let n = 0; while (G.money > 900 && E.pIncome() - E.upkeep() > -100 && n++ < 30) A.buy('sol'); }
  if (E.can('build')) { const ord = ['srv', 'neg', 'mor', 'def', 'apo']; for (const i of E.owned(0)) { const dd = G.d[i]; dd.tx = dd.l < 35 ? 0 : dd.l > 70 ? 2 : 1;
    if (G.acts > 0 && dd.b.length < E.slotsOf(i) && G.money > 3500) { const c = S.MD.builds.filter(b => !dd.b.includes(b.id)).sort((x, y) => ord.indexOf(x.cat) - ord.indexOf(y.cat)); const b = dd.l < 40 ? c.find(b => b.cat === 'mor') || c[0] : c[0]; if (b) { S.sel = i; A.build(b.id); } }
    if (G.acts > 0 && G.money > 9000) { const b = dd.b.find(id => E.lvOf(i, id) < 3); if (b) { S.sel = i; A.up(b); } } } }
  if (E.can('attack')) { if (G.pis < G.reserve + 20 && G.money > 1500) A.buy('pis'); if (G.money > 5000) A.buy('rif');
    let guard = 0; while (G.acts >= E.atkCost() && !E.jailed() && !E.modv('noAtk') && guard++ < 20) { let best = null, bs = 0; for (let i = 0; i < M.N; i++) { if (!E.reach(i)) continue; const need = Math.ceil(E.estDef(i) * 1.5 / (E.pq() * E.pAtkMul())); if (need <= G.reserve * .6) { const s = M.val[i] / need; if (s > bs) { bs = s; best = [i, need]; } } } if (!best) break; S.sel = best[0]; A.attack(best[1]); if (G.over) break; } }
  if (E.can('build') && E.tenCount() < E.maxTen() && G.money > 3000 && G.acts > 0) { const z = E.owned(0).find(i => !E.tenOf(i)); if (z != null) { S.sel = z; A.hire(['dura', 'social', 'comerciante'][E.tenCount() % 3]); } }
  if (E.can('market')) for (const gd of S.MD.goods) A.price(gd.id, G.stock[gd.id] < E.demandFor(gd.id, 2) ? 3 : 2);
  if (E.can('crew')) { const border = E.owned(0).filter(i => M.adj[i].some(j => G.d[j].o !== 0)); const thr = i => M.adj[i].filter(j => G.d[j].o > 0).reduce((a, j) => a + G.d[j].t, 0); border.sort((a, b) => thr(b) - thr(a)); for (const i of border) { const need = Math.max(0, Math.ceil(thr(i) * .7) - G.d[i].t); if (need > 0 && G.reserve > 0) { S.sel = i; A.dep(Math.min(need, G.reserve)); } } }
  S.sel = null; E.endDay ? E.endDay() : A.endDay();
  if (G.day % 5 === 0 || G.over) traj.push(`${G.day}:${E.owned(0).length}`);
}
const riv = G.f.map((f, k) => E.owned(k + 1).length).join('/');
console.log(mode, 'start', start, G.over || 'none', 'dia', G.day, 'zonas', E.owned(0).length + '/' + M.N, 'rivais', riv, 'caixa', Math.round(G.money), 'nv', E.lvlOf().n, 'cargo', E.rankName(), '|', traj.join(' '));
