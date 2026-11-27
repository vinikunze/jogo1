// Regras do jogo: estado, combate, economia, carreira, mensagens, IA e eventos.
import { ZT, XP, XP2, UNLOCK, SKILLS, MODES, ACH, TIERS, RIVAL_STR, FINALS, SRV_P, BLV } from './data.js';
import { TREES } from './tree.js';

export const S = { G: null, M: null, MD: null, sel: null, flash: null, on: {} };
const DATA_V = '4';
export const SAVE = 'ddc4.';

// ---------- utilitários ----------
export const R = (a, b) => a + Math.random() * (b - a);
export const RI = (a, b) => Math.floor(R(a, b + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const sum = a => a.reduce((x, y) => x + y, 0);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmt = n => (n < 0 ? '-' : '') + 'R$ ' + Math.abs(Math.round(n)).toLocaleString('pt-BR');
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
export const emit = (ev, ...a) => { const f = S.on[ev]; if (f) f(...a); };
export const modv = k => {
  const g = S.G; if (!g) return k === 'noAtk' ? 0 : 1;
  const c = g.cev; let v = c && c.until >= g.day && c.m[k] != null ? c.m[k] : (k === 'noAtk' ? 0 : 1);
  for (const b of g.buf || []) if (b.until >= g.day && b.m[k] != null) v = k === 'noAtk' ? Math.max(v, b.m[k]) : v * b.m[k];
  return v;
};
export function addBuf(m, days, name) { const g = S.G; g.buf = (g.buf || []).filter(b => b.until >= g.day); g.buf.push({ m, until: g.day + days - 1, name }); }
export const buffs = () => (S.G.buf || []).filter(b => b.until >= S.G.day && b.name);
export const finOn = () => !!(S.G.fin && S.G.fin.active);
export const FIN_AT = .4, FIN_HOLD = .3;
// ---------- primeiros passos ----------
export const TUT = [
  { k: 'phone', t: 'Abra o celular e responda uma mensagem' },
  { k: 'look', t: 'Toque numa zona rival no mapa para ver os detalhes' },
  { k: 'buy', t: 'Compre mercadoria no app Mercado do celular', need: 'market' },
  { k: 'dep', t: 'Mande gente da base para uma zona sua', need: 'crew' },
  { k: 'attack', t: 'Ataque uma zona com chance boa (contorno verde)', need: 'attack' },
  { k: 'build', t: 'Faça uma construção numa zona sua', need: 'build' },
  { k: 'end', t: 'Encerre o dia e leia o relatório' },
];
export const tutList = () => TUT.filter(s => !s.need || can(s.need));
export const tutShow = () => { const g = S.G; return g && g.phase === 'play' && g.tut && !g.tut.off && g.day <= 10; };
export function tut(k) {
  const g = S.G; if (!g || !g.tut || g.tut.off || g.tut.d[k]) return;
  const L = tutList(), s = L.find(x => x.k === k); if (!s) return;
  g.tut.d[k] = 1; addXP(20);
  if (L.every(x => g.tut.d[x.k])) { g.tut.off = 1; g.money += 1000; emit('toast', 'Primeiros passos completos', `Você pegou o jeito. Prêmio: ${fmt(1000)}.`, 'good'); emit('sfx', 'win'); }
  else emit('toast', 'Passo concluído', s.t + '. +20 de respeito.', 'good');
}
export const rel = id => (S.G.rel && S.G.rel[id] != null) ? S.G.rel[id] : 50;
export function addRel(id, d) { const g = S.G; g.rel = g.rel || {}; g.rel[id] = clamp(rel(id) + d, 0, 100); }
export const hasType = (...t) => owned(0).some(i => t.includes(S.M.type[i]));
export const PERS = { agressivo: 'Agressivo: ataca com pouca vantagem', cauteloso: 'Cauteloso: junta tropa e só ataca na certa', 'traiçoeiro': 'Traiçoeiro: pode quebrar trégua', negociador: 'Negociador: costuma propor paz' };

// ---------- mapas ----------
const MAPS = {};
export async function loadMap(id) {
  if (MAPS[id]) return MAPS[id];
  const r = await fetch('maps/' + id + '.json?v=' + DATA_V);
  if (!r.ok) throw new Error('mapa');
  const J = await r.json();
  J.id = id; J.N = J.z.length;
  J.type = J.z.map(z => z.t);
  J.mult = J.z.map(z => Math.min(1.5, 1 + .07 * (z.k - 1)));
  J.val = J.z.map((z, i) => Math.round(ZT[z.t].inc * J.mult[i]));
  J.dm = i => ZT[J.type[i]].def;
  MAPS[id] = J; return J;
}
export const mapsLoaded = () => MAPS;

// ---------- consultas ----------
const G = () => S.G, M = () => S.M, MD = () => S.MD;
export const owned = o => { const a = []; for (let i = 0; i < S.M.N; i++) if (S.G.d[i].o === o) a.push(i); return a; };
export const colorOf = o => o === 0 ? S.MD.color : o > 0 ? S.G.f[o - 1].color : '#6c6f78';
export const oname = o => o === 0 ? S.G.pname : o > 0 ? S.G.f[o - 1].name : 'Sem dono';
let fxc = { k: '', s: new Set() };
const treeFx = () => { const g = S.G, t = Object.keys(g.tree || {}), k = g.mode + t.join(','); if (fxc.k !== k) { const T = TREES[g.mode]; fxc = { k, s: new Set(t.flatMap(id => (T.nodes.find(n => n.id === id) || { fx: [] }).fx)) }; } return fxc.s; };
export const sk = id => !!(S.G.skills[id] || treeFx().has(id));
export const tree = () => TREES[S.G.mode];
export const karma = () => S.G.karma || 0;
export function addKarma(n) { const g = S.G; g.karma = clamp((g.karma || 0) + n, -100, 100); }
export const charOf = () => { const k = karma(), T = tree(); return k >= 30 ? [T.good, 'good'] : k <= -30 ? [T.bad, 'bad'] : ['Sem fama definida', 'neu']; };
export const kGood = () => karma() >= 30, kBad = () => karma() <= -30;
export const bCost = b => Math.round(b.cost * (sk('build') ? .8 : 1));
export function nodeState(n) {
  const g = S.G, have = !!(g.tree || {})[n.id], T = tree();
  if (have) return 'have';
  if (n.pair && (g.tree || {})[n.pair]) return 'blocked';
  const own = id => !!(g.tree || {})[id];
  const pre = n.t === 1 || T.nodes.some(x => x.b === n.b && x.t === n.t - 1 && own(x.id));
  if (!pre) return 'pre';
  if (g.rank < n.min) return 'rank';
  return skillPoints() >= n.cost ? 'can' : 'pts';
}
export function learn(id) {
  const g = S.G, n = tree().nodes.find(x => x.id === id); if (!n || nodeState(n) !== 'can') return false;
  g.tree = g.tree || {}; g.tree[id] = 1; if (n.al) addKarma(n.al);
  emit('toast', 'Habilidade aprendida', n.n + (n.al > 0 ? '. O povo vai lembrar disso.' : n.al < 0 ? '. Vão falar de você com medo.' : '.'), n.al < 0 ? 'bad' : 'good'); emit('sfx', 'cash'); saveGame(); return true;
}
export const rankName = r => r == null ? (S.MD.titles || S.MD.ranks)[S.G.ri ?? S.G.rank * 2] : S.MD.ranks[r];
export const rankIdx = () => S.G.ri ?? S.G.rank * 2;
export function lvlOf(xp = S.G.xp) { let n = 1, need = 100, acc = 0; while (xp >= acc + need) { acc += need; n++; need = 60 + 40 * n; } return { n, cur: xp - acc, need }; }
export const can = key => S.G.rank >= UNLOCK.findIndex(u => u.key === key);
export const unlockRank = key => UNLOCK.findIndex(u => u.key === key);
export const skillPoints = () => lvlOf().n + (S.G.bonusSP || 0) - Object.keys(S.G.skills).length - sum(Object.keys(S.G.tree || {}).map(id => (tree().nodes.find(n => n.id === id) || { cost: 1 }).cost));
export const pTroops = () => S.G.reserve + sum(owned(0).map(i => S.G.d[i].t));
export function pq() { const g = S.G, T = pTroops(); if (!T) return 1; const f = Math.min(g.rif, T), p = Math.min(g.pis, T - f); return (1.8 * f + 1.1 * p + .6 * (T - f - p)) / T; }
export const qOf = o => o === 0 ? pq() : o > 0 ? S.G.f[o - 1].q : .95;
export const bOf = i => (S.G.d[i].b || []).map(id => S.MD.builds.find(b => b.id === id)).filter(Boolean);
export const TEN = {
  dura: { name: 'Linha dura', desc: '+25% de defesa, -1 lealdade por dia', eff: { def: .25, loy: -1 } },
  social: { name: 'Do povo', desc: '+2 lealdade por dia', eff: { loy: 2 } },
  comerciante: { name: 'Comerciante', desc: '+35% de vendas na zona', eff: { dem: .35 } },
};
const TEN_NAMES = { faccao: ['Tico', 'Bolado', 'Juninho', 'Careca', 'Magrão', 'Pretinho', 'Branco', 'Nego Léo'], milicia: ['Cabo Lima', 'Sargento Rui', 'Tenente Alves', 'Cabo Dias', 'Soldado Tavares', 'Sargento Bento'], policia: ['Ten. Moura', 'Sgt. Ribeiro', 'Ten. Castro', 'Sgt. Farias', 'Ten. Paiva', 'Sgt. Teles'], mafia: ['Don Peppe', 'Capo Saro', 'Capo Nenè', 'Capo Lillo', 'Capo Gino', 'Capo Tano'] };
export const tenOf = i => (S.G.ten || {})[i];
export const maxTen = () => Math.max(0, S.G.rank - 2) + (sk('ten') ? 1 : 0);
export const tenCount = () => Object.keys(S.G.ten || {}).filter(i => S.G.d[i] && S.G.d[i].o === 0).length;
export const jailed = () => S.G.jail && S.G.jail.until >= S.G.day;
export const lvOf = (i, id) => ((S.G.d[i].lv || {})[id]) || 1;
export const slotsOf = i => ZT[S.M.type[i]].slots || 4;
export const srvP = (i, id) => ((S.G.d[i].sp || {})[id]) ?? 1;
export const upCost = (b, lv) => Math.round(b.cost * [0, 1.2, 1.8][lv] * (sk('build') ? .8 : 1));
const popOf = i => clamp(S.M.val[i] / 420, .6, 2);
export const srvInc = i => S.G.d[i].o !== 0 ? 0 : Math.round((sk('srv') ? 1.25 : 1) * (sk('srv2') ? 1.25 : 1) * sum(bOf(i).filter(b => b.eff.srv).map(b => b.eff.srv * BLV[lvOf(i, b.id) - 1] * SRV_P[srvP(i, b.id)][1] * popOf(i) * (.7 + .6 * S.G.d[i].l / 100))));
export const srvEst = (i, b, lv = 1, p = 1) => Math.round((sk('srv') ? 1.25 : 1) * (sk('srv2') ? 1.25 : 1) * b.eff.srv * BLV[lv - 1] * SRV_P[p][1] * popOf(i) * (.7 + .6 * S.G.d[i].l / 100));
const srvLoy = i => sum(bOf(i).filter(b => b.eff.srv).map(b => SRV_P[srvP(i, b.id)][2]));
export const allEff = k => sum(owned(0).map(i => beff(i, k)));
export const beff = (i, k) => sum(bOf(i).map(b => (b.eff[k] || 0) * BLV[lvOf(i, b.id) - 1])) + (S.G.d[i].o === 0 && tenOf(i) ? (TEN[tenOf(i).s].eff[k] || 0) : 0);
export function defVal(i) {
  const d = S.G.d[i];
  let v = Math.max(.5, d.t) * qOf(d.o) * S.M.dm(i) * (1 + beff(i, 'def'));
  if (d.o === 0) v *= (.75 + .5 * d.l / 100) * (sk('def') ? 1.2 : 1) * (finOn() && S.G.fin.opt === 'def' ? 1.25 : 1) * (underdog() ? 1.2 : 1) * (sk('def2') ? 1.15 : 1) * (sk('dread') ? 1.1 : 1) * (sk('lenda') ? 1.1 : 1) * (i === S.G.base ? 1.5 * (rel('braco') >= 80 ? 1.2 : 1) : 1);
  return v;
}
export function incOf(i, asOwner = 0) {
  const d = S.G.d[i], t = S.M.type[i];
  const tx = [.7, 1, 1.35][d.tx ?? 1];
  let v = S.M.val[i] * .85 * (S.MD.inc[t] || 1) * tx * (.6 + .8 * d.l / 100) * ((d.c || 0) >= S.G.day ? .5 : 1) + beff(i, 'inc');
  if (S.MD.budget) v *= .4;
  v *= (sk('tax') ? 1.25 : 1) * (sk('tax2') ? 1.2 : 1) * (sk('povo') ? 1.15 : 1) * (sk('magnata') ? 1.3 : 1) * (kBad() ? 1.1 : 1);
  return Math.round(v + srvInc(i));
}
export const pIncome = () => sum(owned(0).map(i => incOf(i))) + (S.MD.budget ? S.MD.budget + 150 * owned(0).length : 0);
export const adminCost = () => Math.max(0, owned(0).length - (S.BAL?.af ?? 10)) * (S.BAL?.ac ?? 25);
export const upkeep = () => Math.round((pTroops() * 8 + tenCount() * 120) * (sk('upk') ? .8 : 1)) + adminCost();
export const maxActs = () => Math.min(14, 5 + Math.floor(owned(0).length / 6) + (sk('act') ? 1 : 0) + (sk('act2') ? 1 : 0) + (sk('lenda') ? 2 : 0));
export const ATK_COST = 2;
export const atkCost = () => sk('blitz') ? 1 : ATK_COST;
export const truceWith = o => o > 0 && (S.G.f[o - 1].truce || 0) >= S.G.day;
export const reach = i => { const d = S.G.d[i]; return d.o !== 0 && !truceWith(d.o) && S.M.adj[i].some(j => S.G.d[j].o === 0); };
export const underdog = () => { const g = S.G, n = owned(0).length; return g.day >= 15 && n > 0 && n / S.M.N < .2; };
export const haggleChance = c => clamp(.3 + rel(c) / 250 + (sk('neg') ? .2 : 0) + (kGood() ? .05 : 0) + (sk('fair') ? .05 : 0), .1, .9);
export const recruitCost = () => Math.round((sk('rec') ? 450 : 600) * (1 + pTroops() / (S.BAL?.rs ?? 300)) * modv('rec') * (underdog() ? .6 : 1) * (1 - Math.min(.25, allEff('rec'))) * (owned(0).filter(i => S.M.type[i] === 'comunidade').length >= 2 ? .85 : 1));
export const bribeCost = () => Math.round((sk('bribe') ? .6 : 1) * (400 + 20 * S.G.heat) * (hasType('centro', 'capitale') ? .7 : 1) * (1.2 - rel('politico') / 100 * .4));
export const heatMul = () => (sk('heat') ? .7 : 1) * modv('heat');
export const pAtkMul = () => (sk('atk2') ? 1.1 : 1) * (sk('mentor') ? 1.1 : 1) * (sk('lenda') ? 1.1 : 1) * (sk('fear') ? 1.1 : 1) * (kBad() ? 1.08 : 1) * (underdog() ? 1.1 : 1) * (sk('atk') ? 1.15 : 1) * (S.G.perk && S.G.perk.vet ? 1.1 : 1) * (finOn() && S.G.fin.opt === 'atk' ? 1.2 : 1);
export const goal = 1;
export function intelAt(i) { return owned(0).some(j => (j === i || S.M.adj[j].includes(i)) && beff(j, 'intel') > 0); }
export const visible = i => S.G.d[i].o === 0 || sk('intel') || (S.G.seen[i] || 0) >= S.G.day || intelAt(i);
export function est(i) {
  const t = S.G.d[i].t, n = ((i * 7919 + S.G.day * 104729) % 97) / 97;
  return [Math.max(1, Math.floor(t * (.55 + .2 * n))), Math.ceil(t * (1.25 + .3 * n))];
}
export function estDef(i) { if (visible(i)) return defVal(i); const [a, b] = est(i), t = S.G.d[i].t; return defVal(i) * ((a + b) / 2) / Math.max(.5, t); }
export const odds = r => r > 1.5 ? ['Vitória quase certa', '#5fd48a'] : r > 1.15 ? ['Boa chance', '#b6e36b'] : r > .9 ? ['Equilibrado', '#f0cf5a'] : r > .6 ? ['Arriscado', '#ff9a52'] : ['Suicídio', '#ff5b4f'];
export const atkPow = n => n * pq() * pAtkMul();
export const storage = () => Math.round((300 + sum(owned(0).map(i => beff(i, 'stor')))) * (sk('stor') ? 1.5 : 1) * (sk('smuggle') ? 2 : 1));
export const comLevel = i => ZT[S.M.type[i]].com * S.M.mult[i];
export const comLabel = v => v >= 1.45 ? ['Forte', '#5fd48a'] : v >= 1 ? ['Médio', '#f0cf5a'] : ['Fraco', '#ff9a52'];
export const priceOf = (id, tier = S.G.pt[id]) => { const gd = S.MD.goods.find(x => x.id === id); return Math.round(gd.ref * TIERS[tier][1] * (sk('trade') ? 1.1 : 1) * (sk('gouge') ? 1.1 : 1)); };
export const buyPrice = id => Math.round(S.G.px.buy[id] * (sk('trade') ? .9 : 1) * (sk('smuggle') ? .85 : 1) * (hasType('porto', 'costa') ? .9 : 1) * (1 - (rel('fornecedor') - 50) / 50 * .12));
export function demandZone(i, gd, d = S.G.d[i]) {
  const g = S.G, comp = S.M.adj[i].some(j => g.d[j].o > 0) ? .8 : 1;
  return gd.dem * comLevel(i) * (gd.pref[S.M.type[i]] || 1) * (.7 + .6 * d.l / 100) * (1 + beff(i, 'dem')) * comp * ((g.mev && g.mev.z === i) ? g.mev.f : 1);
}
export const tierQ = t => Math.pow(TIERS[t][1], -2);
export function demandFor(id, tier = S.G.pt[id], withMood = true) {
  const gd = S.MD.goods.find(x => x.id === id), g = S.G;
  return sum(owned(0).map(i => demandZone(i, gd))) * tierQ(tier) * (withMood ? (g.mood[id] || 1) : 1);
}
export const moodLabel = m => m >= 1.2 ? ['Procura alta', '#5fd48a'] : m <= .85 ? ['Procura baixa', '#ff9a52'] : ['Procura normal', '#9c9aa0'];
export function rivalsNear(i) {
  const g = S.G, dist = { [i]: 0 }, q = [i], out = {};
  while (q.length) { const a = q.shift(); if (dist[a] >= 2) continue; for (const b of S.M.adj[a]) if (dist[b] == null) { dist[b] = dist[a] + 1; q.push(b); const o = g.d[b].o; if (o > 0 && (out[o] == null || dist[b] < out[o])) out[o] = dist[b]; } }
  return Object.entries(out).map(([o, dd]) => ({ o: +o, dist: dd, F: g.f[o - 1] }));
}
export function riskOf(i) {
  const w = { forte: 3, 'médio': 2, fraco: 1 };
  const v = sum(rivalsNear(i).map(r => w[r.F.str] / r.dist));
  return v >= 3 ? ['Alto', '#ff5b4f'] : v >= 1.5 ? ['Médio', '#f0cf5a'] : ['Baixo', '#5fd48a'];
}
export const reserved = id => Math.min(S.G.stock[id] || 0, (S.G.ord || []).filter(o => (o.st === 'active' || o.st === 'late') && o.good === id).reduce((a, o) => a + o.q, 0));
export const stockTotal = () => sum(Object.values(S.G.stock));
export const contacts = () => (S.G.rank >= 1 ? [GROUP()] : []).concat(S.MD.contacts.filter(c => S.G.rank >= c.min && S.G.rank <= c.max))
  .concat(S.G.rank >= 5 ? S.G.f.map((f, k) => ({ id: 'rival' + k, name: f.name, role: f.alive ? 'Rival' : 'Eliminado', rival: k })) : []);
export const groupName = () => ({ faccao: `Bonde ${S.G.pname.replace(/^Tropa do /, 'do ')}`, milicia: `Patrulha · ${S.G.pname}`, policia: `${S.G.pname} · Operacional`, mafia: `Famiglia · ${S.G.pname.replace(/^Famiglia /, '')}` }[S.G.mode] || S.G.pname);
const GROUP = () => ({ id: 'grupo', name: groupName(), role: 'Grupo', group: 1 });
export const contactById = id => id === 'grupo' ? GROUP() : S.MD.contacts.find(c => c.id === id) || (id.startsWith('rival') ? { id, name: S.G.f[+id.slice(5)].name, role: 'Rival', rival: +id.slice(5) } : { id, name: id, role: '' });
export const log = (t, c = '') => { const g = S.G; g.log.unshift({ d: g.day, t, c }); if (g.log.length > 80) g.log.length = 80; };
export const saveGame = () => { const g = S.G; if (g && !g.over && g.phase === 'play') store.set(SAVE + g.mode, g); };

// ---------- novo jogo ----------
export async function newGame(mode) {
  const MDx = MODES[mode], Mx = await loadMap(MDx.map);
  S.MD = MDx; S.M = Mx;
  S.G = {
    v: 4, map: MDx.map, mode, phase: 'setup', pname: MDx.player, nick: '', day: 1, money: 3500, reserve: 15, pis: 20, rif: 2, heat: 10, acts: 3, rank: 0, xp: 0,
    skills: {}, over: null, log: [], base: null, seen: {}, plans: [], msgs: [], stock: {}, cost: {}, pt: {}, mood: {}, px: { buy: {} }, hist: [], last: {}, zsale: {}, extra: 0, auto: true, mev: null, join: null,
    rel: {}, ach: {}, stats: { won: 0, lost: 0, sold: 0, built: 0, held: 0, aiWon: 0, missions: 0 }, lastFavor: 0, mid: 1,
    f: MDx.rivals.map(r => ({ name: r.name, color: r.color, pool: r.pool, money: 1500, q: 1.0, alive: true, truce: 0 })),
    d: Mx.z.map((z, i) => ({ o: -1, t: Math.round(RI(...ZT[z.t].gar) * 1.6 * Mx.mult[i]), b: [], l: ZT[z.t].loy, tx: 1 })),
  };
  MDx.goods.forEach(g => { S.G.stock[g.id] = 0; S.G.cost[g.id] = g.buy || 0; S.G.pt[g.id] = 2; S.G.mood[g.id] = 1; });
  newPrices(true);
  placeRivals();
  S.sel = null; S.flash = null;
}
function placeRivals() {
  const g = S.G, M_ = S.M, strs = [...RIVAL_STR].sort(() => Math.random() - .5), starts = [];
  g.f.forEach((F, k) => {
    const P = strs[k % strs.length]; Object.assign(F, { str: P.lbl, q: P.q, money: P.money, pers: pick(Object.keys(PERS)) });
    const okT = j => F.pool === 'any' || M_.type[j] === F.pool;
    let cand = [...Array(M_.N).keys()].filter(j => g.d[j].o === -1 && M_.type[j] !== 'capitale' && okT(j));
    if (!cand.length) cand = [...Array(M_.N).keys()].filter(j => g.d[j].o === -1 && M_.type[j] !== 'capitale');
    let best = cand[Math.floor(Math.random() * cand.length)], bd = -1;
    if (starts.length) for (const j of cand) { const d = Math.min(...starts.map(s => Math.hypot(M_.z[j].l[0] - M_.z[s].l[0], M_.z[j].l[1] - M_.z[s].l[1]))); if (d > bd) { bd = d; best = j; } }
    starts.push(best); g.d[best] = { o: k + 1, t: P.t, b: [], l: 50, tx: 1 };
    M_.adj[best].filter(j => g.d[j].o === -1 && M_.type[j] !== 'capitale').slice(0, P.nb).forEach(j => { g.d[j] = { o: k + 1, t: Math.round(P.t * .6), b: [], l: 50, tx: 1 }; });
  });
}
export const canStart = i => S.G.d[i].o === -1 && S.MD.startPool(S.M.type[i]);
export async function resume(mode) {
  const s = store.get(SAVE + mode); if (!s || s.v !== 4) return false;
  S.MD = MODES[mode]; S.M = await loadMap(s.map || (mode === 'mafia' ? 'palermo' : 'rio')); S.G = s;
  for (const [k, v] of Object.entries({ cost: {}, pt: {}, mood: {}, hist: [], last: {}, zsale: {}, extra: 0, auto: true, mev: null, stock: {}, px: { buy: {} } })) if (s[k] == null) s[k] = v;
  for (const gd of S.MD.goods) { if (s.stock[gd.id] == null) s.stock[gd.id] = 0; if (s.cost[gd.id] == null) s.cost[gd.id] = gd.buy || 0; if (s.pt[gd.id] == null) s.pt[gd.id] = 2; if (s.mood[gd.id] == null) s.mood[gd.id] = 1; if (gd.buy && !s.px.buy[gd.id]) s.px.buy[gd.id] = gd.buy; }
  s.f.forEach(F => { if (!F.str) F.str = 'médio'; if (!F.pers) F.pers = pick(Object.keys(PERS)); });
  if (!s.rel) s.rel = {}; if (s.ri == null) s.ri = s.rank * 2;
  if (s.tree) { const ids = new Set(TREES[mode].nodes.map(n => n.id)); for (const k of Object.keys(s.tree)) if (!ids.has(k)) delete s.tree[k]; }
  S.sel = null; S.flash = null; return true;
}
export function startAt(i, rank, nick) {
  const g = S.G, M_ = S.M;
  g.phase = 'play'; g.base = i; g.rank = rank; g.ri = rank * 2; g.xp = XP[rank]; g.nick = (nick || '').trim().slice(0, 18) || 'Novato';
  g.d[i] = { o: 0, t: 16, b: [], l: 70, tx: 1 };
  M_.adj[i].filter(j => g.d[j].o === -1 && M_.type[j] !== 'capitale').slice(0, 1).forEach(j => { g.d[j] = { o: 0, t: 9, b: [], l: 50, tx: 1 }; });
  for (const gd of S.MD.goods) { const q = Math.round(demandFor(gd.id, 2, false) * 2) || 20; g.stock[gd.id] = q; g.cost[gd.id] = gd.buy || 0; }
  g.cash0 = g.money; g.tut = { d: {}, off: 0 };
  g.acts = maxActs();
  log(`${g.nick} entrou para ${g.pname} como ${rankName()} em ${M_.z[i].n}.`, 'good');
  welcome();
  dailyMessages();
  saveGame();
}

// ---------- mensagens (WhatsApp) ----------
const W = () => S.MD.words;
const callMe = () => S.G.rank >= 2 ? (S.G.rank >= 5 ? S.MD.you : 'chefe') : S.G.nick;
export function msg(c, t, opts = [], extra = {}) {
  const g = S.G, m = { id: g.mid++, c, d: g.day, t, opts, st: opts.length ? 'open' : 'done', ...extra };
  g.msgs.push(m); if (g.msgs.length > 220) g.msgs.splice(0, g.msgs.length - 220);
  if (!extra.me) emit('message', m);
  return m;
}
const me = (c, t) => msg(c, t, [], { me: true });
export const unread = () => S.G.msgs.filter(m => !m.me && !m.read).length;
function welcome() {
  const g = S.G, z = S.M.z[g.base].n, mode = g.mode;
  if (g.rank < 5) {
    const T = {
      faccao: [`Fala, ${g.nick}. Tu agora é da ${g.pname}.`, `Teu posto é ${rankName()} lá na ${z}. Fica ligado no celular que eu passo as fitas por aqui.`],
      milicia: [`${g.nick}, seja bem-vindo à ${g.pname}.`, `Você começa como ${rankName()} em ${z}. As ordens chegam por aqui. Nada de áudio, só texto.`],
      policia: [`${g.nick}, apresente-se. Você foi lotado na ${g.pname}.`, `Função: ${rankName()}. Setor: ${z}. Ordens de serviço chegam por este canal.`],
      mafia: [`${g.nick}, la famiglia ti accoglie.`, `Por enquanto você é ${rankName()} em ${z}. Faça o que eu pedir e vai subir.`],
    }[mode];
    T.forEach(t => msg('chefe', t));
  }
  if (g.rank >= 2) msg('braco', `${callMe() === 'chefe' ? 'Chefe' : 'Fala'}, ${g.rank >= 5 ? 'agora é tudo seu' : 'tô contigo'}. Tô organizando ${W().team} aqui em ${z}. Qualquer coisa me chama.`);
}
const enemyNear = () => { const s = new Set(); owned(0).forEach(i => S.M.adj[i].forEach(j => { if (S.G.d[j].o !== 0) s.add(j); })); return [...s]; };
export function dailyMessages() {
  if (S.hooks && S.hooks.dayStart) S.hooks.dayStart();
  const g = S.G, M_ = S.M, mine = owned(0), near = enemyNear(), w = W();
  const zn = i => M_.z[i].n;
  const pool = [];
  if (g.rank <= 4 && near.length) {
    const z = pick(near);
    pool.push(() => msg('chefe', { faccao: `Preciso de olho em ${zn(z)}. Vai lá de leve e conta quantos tão na contenção.`, milicia: `Quero saber quantos homens tem em ${zn(z)}. Dá uma volta lá e me passa.`, policia: `Levantamento de inteligência em ${zn(z)}. Contagem de efetivo armado.`, mafia: `Vai até ${zn(z)} e me diz quantos rapazes eles têm.` }[g.mode],
      [{ l: 'Tô indo', k: 'vigiar', p: { z } }, { l: 'Hoje não dá', k: 'nada' }]));
  }
  if (g.rank <= 3 && mine.length) {
    const z = pick(mine), pay = RI(4, 9) * 100;
    pool.push(() => msg('chefe', { faccao: `Tem ${w.load} pra levar até ${zn(z)}. Paga ${fmt(pay)}. Cuidado com ${w.cops}.`, milicia: `Leva ${w.load} até ${zn(z)}. Rende ${fmt(pay)} pro caixa.`, policia: `Escolta de ${w.load} até o depósito em ${zn(z)}. Verba de ${fmt(pay)} liberada se der certo.`, mafia: `Leva ${w.load} até ${zn(z)}. A família paga ${fmt(pay)}.` }[g.mode],
      [{ l: 'Fechou', k: 'entrega', p: { z, pay } }, { l: 'Tô sem condição', k: 'nada' }]));
  }
  if (g.rank >= 1 && g.rank <= 3 && mine.length) {
    const z = pick(mine);
    pool.push(() => msg('chefe', g.mode === 'policia' ? `Blitz em ${zn(z)} hoje. Como vai conduzir?` : `Tá devendo ${w.money} em ${zn(z)}. Vai lá cobrar.`,
      [{ l: g.mode === 'policia' ? 'Blitz pesada' : 'Cobrar firme', k: 'cobranca', p: { z, firm: 1 } }, { l: g.mode === 'policia' ? 'Abordagem educada' : 'Cobrar na moral', k: 'cobranca', p: { z, firm: 0 } }]));
  }
  if (g.rank <= 1 && near.length && g.day > 1) {
    const z = pick(near);
    pool.push(() => msg('chefe', { faccao: `Amanhã a gente vai pra cima de ${zn(z)}. Tu vai junto?`, milicia: `Amanhã a patrulha toma ${zn(z)}. Conto com você?`, policia: `Operação em ${zn(z)} amanhã cedo. Você está escalado?`, mafia: `Domani prendiamo ${zn(z)}. Vem com a gente?` }[g.mode],
      [{ l: 'Tô dentro', k: 'ordem', p: { z } }, { l: 'Dessa vez não', k: 'nada' }]));
  }
  if (g.rank >= 1) {
    const n = RI(4, 8), cost = n * 45;
    pool.push(() => msg(g.rank >= 2 ? 'braco' : 'chefe', `${g.rank >= 2 ? 'Chefe, tem' : 'Tem'} ${n} ${g.mode === 'policia' ? 'agentes querendo transferência pra cá' : 'querendo entrar'}. Pra equipar sai ${fmt(cost)}.`,
      [{ l: 'Traz eles', k: 'recruta', p: { n, cost } }, { l: 'Agora não', k: 'nada' }]));
  }
  if (g.rank >= 3 && mine.length) {
    const z = pick(mine), cost = RI(3, 8) * 100;
    const pedido = pick({ faccao: ['faltou remédio pra uma senhora', 'a escola tá sem merenda', 'o campinho tá destruído'], milicia: ['a rua tá sem luz', 'a creche precisa de reforma', 'a van da escola quebrou'], policia: ['a praça precisa de iluminação', 'a escola pediu palestra e material', 'o posto de saúde tá sem segurança'], mafia: ['a festa do padroeiro precisa de verba', 'o telhado da igreja caiu', 'uma viúva não tem como pagar o aluguel'] }[g.mode]);
    pool.push(() => msg('morador', `${callMe() === 'chefe' ? 'Chefe' : 'Senhor'}, ${pedido} em ${zn(z)}. Dá pra ajudar com ${fmt(cost)}?`,
      [{ l: 'Ajudo', k: 'morador', p: { z, cost, yes: 1 } }, { l: 'Não dá', k: 'morador', p: { z, cost, yes: 0 } }]));
  }
  if (can('market')) {
    const gd = pick(S.MD.goods), q = RI(3, 8) * 10;
    if (gd.buy) {
      const price = Math.round(g.px.buy[gd.id] * R(.68, .82));
      pool.push(() => msg('fornecedor', `Tenho um lote de ${q} de ${gd.name.toLowerCase()} a ${fmt(price)} cada. Abaixo da tabela. Fecha?`, [{ l: `Fecho (${fmt(q * price)})`, k: 'lote', p: { g: gd.id, q, price } }, { l: `Faz por ${fmt(Math.round(price * .85))} cada?`, k: 'haggle', p: { kind: 'lote', g: gd.id, q, price, to: Math.round(price * .85) } }, { l: 'Passo', k: 'nada' }]));
    }
    const q2 = RI(2, 8) * 10, p2 = Math.round(gd.ref * R(1.2, 1.45));
    pool.push(() => msg('comprador', `Quero ${q2} de ${gd.name.toLowerCase()} a ${fmt(p2)} cada, hoje. Tem?`, [{ l: `Vendo (${fmt(q2 * p2)})`, k: 'oferta', p: { g: gd.id, q: q2, price: p2 } }, { l: `Só por ${fmt(Math.round(p2 * 1.15))} cada`, k: 'haggle', p: { kind: 'oferta', g: gd.id, q: q2, price: p2, to: Math.round(p2 * 1.15) } }, { l: 'Não tenho', k: 'nada' }]));
    if (g.heat > 45) { const cost = Math.round((2500 + g.heat * 25) * modv('pol')); pool.push(() => msg('politico', `Ando ouvindo seu nome por aí. Com ${fmt(cost)} eu seguro ${W().cops} por um tempo.`, [{ l: 'Pago', k: 'politico', p: { cost } }, { l: 'Não preciso', k: 'nada' }])); }
  }
  if (jailed()) pool.length = 0;
  const n = Math.min(pool.length, g.rank <= 1 ? 3 : 2 + (g.rank >= 4 ? 1 : 0));
  for (let k = 0; k < n; k++) { const ix = Math.floor(Math.random() * pool.length); pool.splice(ix, 1)[0](); }
  // avisos de ataque planejado
  for (const p of g.plans) {
    if (p.o === 0 || g.d[p.b].o !== 0) continue;
    const seen = sk('intel') || intelAt(p.b) || (g.double || 0) >= g.day || sk('spy') || Math.random() < .15 + rel('olheiro') / 100 * .45;
    if (!seen) continue;
    const F = g.f[p.o - 1];
    msg('olheiro', `Atenção: ${F.name} tá juntando uns ${Math.round(g.d[p.a].t * R(.8, 1.2))} perto de ${zn(p.b)}. Vão entrar amanhã.`,
      can('crew') ? [{ l: `Reforçar ${zn(p.b)} com ${Math.min(10, g.reserve)}`, k: 'aviso', p: { z: p.b } }, { l: 'Deixa quieto', k: 'nada' }] : [{ l: 'Avisar o chefe', k: 'aviso', p: { z: p.b } }, { l: 'Deixa quieto', k: 'nada' }]);
  }
}
export function answer(id, oi) {
  const g = S.G, m = g.msgs.find(x => x.id === id); if (!m || m.st !== 'open') return;
  const o = m.opts[oi]; m.st = 'done'; m.chosen = oi; me(m.c, o.l); tut('phone');
  g.msgs.forEach(x => { if (x.c === m.c) x.read = 1; });
  const RD = { vigiar: ['chefe', 3], entrega: ['chefe', 3], cobranca: ['chefe', 2], ordem: ['chefe', 4], recruta: [m.c, 2], lote: ['fornecedor', 4], oferta: ['comprador', 4], politico: ['politico', 6], aviso: ['olheiro', 3] };
  if (RD[o.k]) addRel(RD[o.k][0], RD[o.k][1]);
  if (o.k === 'nada' && (m.c === 'chefe' || m.c === 'olheiro')) addRel(m.c, -2);
  if (['vigiar', 'entrega', 'cobranca', 'ordem'].includes(o.k)) g.stats.missions = (g.stats.missions || 0) + 1;
  const r = o.k === 'story' ? (S.hooks && S.hooks.storyAnswer ? S.hooks.storyAnswer(m, o) : null) : o.k === 'ord' ? (S.hooks && S.hooks.orderAnswer ? S.hooks.orderAnswer(m, o) : null) : (MA[o.k] || MA.nada)(o.p || {}, m);
  if (r) msg(m.c, r).read = 1;
  checkRank(); checkAch(); saveGame(); emit('change');
}
const zname = i => S.M.z[i].n;
const MA = {
  nada: () => pick(['Beleza.', 'Tranquilo.', 'Fica pra próxima.', 'Ok.']),
  lawyer() { const g = S.G; if (!jailed()) return 'Você já está solto.'; if (g.money < 5000) return 'Sem os 5 mil não consigo.'; A.lawyer(); return `Feito. Você sai no fim do dia ${g.jail.until}.`; },
  surrender({ k, cost }) {
    const g = S.G, F = g.f[k]; if (!F || !F.alive) return 'Eles já saíram da cidade.';
    if (g.money < cost) return `Sem ${fmt(cost)} não tem acordo.`;
    g.money -= cost; const z = owned(k + 1);
    z.forEach(i => { const d = g.d[i]; d.o = 0; d.t = Math.max(3, Math.round(d.t / 2)); d.l = 35; d.c = g.day + 3; d.tx = 1; });
    F.alive = false; F.money = 0; addXP(150); g.stats.won += z.length; S.flash = z[0];
    log(`${F.name} entregou ${z.map(zname).join(', ')} e saiu da cidade.`, 'good'); emit('toast', 'Rival rendido', `${F.name} saiu da cidade.`, 'good');
    checkEnd(); return 'Fechado. Pegamos nossas coisas e sumimos. A área é sua.';
  },
  fin({ k, c }) {
    const g = S.G; if (!finOn()) return 'Isso já passou.';
    if (!k) return 'Então segura firme. Vai ser no braço.';
    if (g.money < c) return `Sem ${fmt(c)} no caixa não dá. Vai ter que ser no braço.`;
    g.money -= c; g.fin.opt = k;
    if (k === 'pol') { addBuf({ raid: .3 }, 7, 'Proteção na reta final'); g.heat = Math.max(0, g.heat - 25); return 'Feito. Ninguém de cima vai mexer com a gente essa semana.'; }
    if (k === 'atk') { if (can('crew')) g.reserve += 12; else g.d[g.base].t += 12; return 'Chegaram 12 de fora e a tropa toda bate mais forte até o fim do cerco.'; }
    return 'Todas as zonas reforçadas. A defesa aguenta 25% a mais até o fim do cerco.';
  },
  story_truce({ k }) { const g = S.G, F = g.f[k]; F.truce = g.day + 7; F.truceFrom = g.day; g.plans = g.plans.filter(p => !(p.o === k + 1 && g.d[p.b].o === 0)); return 'Fechado. 7 dias de paz.'; },
  vigiar({ z }) {
    const g = S.G;
    if (Math.random() < .12) { g.heat = Math.min(100, g.heat + 3 * heatMul()); addXP(5); return 'Quase te pegaram. Saiu fora a tempo, mas chamou atenção.'; }
    g.seen[z] = g.day + 5; g.money += 150; addXP(25);
    return `Valeu. Contou ${g.d[z].t} em ${zname(z)}. Agora a gente sabe o que tem lá. Toma ${fmt(150)}.`;
  },
  entrega({ z, pay }) {
    const g = S.G;
    if (Math.random() < .1 + g.heat / 400) { g.heat = Math.min(100, g.heat + 8 * heatMul()); g.money -= Math.round(pay / 2); addXP(8); return `Deu ruim. ${W().cops[0].toUpperCase() + W().cops.slice(1)} pararam no caminho e a gente perdeu ${fmt(pay / 2)}.`; }
    pay = Math.round(pay * (.8 + .4 * rel('chefe') / 100)); g.money += pay; addXP(30); return `Chegou certinho em ${zname(z)}. ${fmt(pay)} no caixa. É isso.`;
  },
  cobranca({ z, firm }) {
    const g = S.G, v = firm ? RI(6, 9) * 100 : RI(3, 5) * 100;
    g.money += v; g.d[z].l = clamp(g.d[z].l - (firm ? 10 : 2), 0, 100); addXP(25);
    return firm ? `Pagaram tudo, ${fmt(v)}. Mas o pessoal de ${zname(z)} ficou bolado.` : `Entrou ${fmt(v)}. Na moral, sem estresse com ninguém.`;
  },
  recruta({ n, cost }) {
    const g = S.G; if (g.money < cost) return 'Não tem caixa pra isso agora.';
    g.money -= cost; if (can('crew')) g.reserve += n; else g.d[g.base].t += n; addXP(15);
    return `Fechado. ${n} ${S.MD.unit} a mais.`;
  },
  morador({ z, cost, yes }) {
    const g = S.G, d = g.d[z]; if (!d || d.o !== 0) return 'Essa área não é mais nossa.';
    if (!yes) { d.l = clamp(d.l - 6, 0, 100); return 'Entendo. O pessoal vai ficar chateado.'; }
    if (g.money < cost) return 'Pelo visto o caixa tá apertado. Fica pra outra.';
    g.money -= cost; d.l = clamp(d.l + 15 * (sk('loy') ? 1.5 : 1), 0, 100); addXP(20);
    return `Deus te pague. Em ${zname(z)} todo mundo vai saber quem ajudou.`;
  },
  aviso({ z }) {
    const g = S.G; if (g.d[z].o !== 0) return 'Tarde demais.';
    if (can('crew')) { const n = Math.min(10, g.reserve); g.reserve -= n; g.d[z].t += n; addXP(10); return `${n} ${S.MD.unit} a caminho de ${zname(z)}.`; }
    g.d[z].t += 6; addXP(10); return `Boa. Vou mandar reforço pra ${zname(z)}.`;
  },
  ordem({ z }) { S.G.join = z; addXP(10); return `É nós. Amanhã cedo em ${zname(z)}.`; },
  haggle(p, m) {
    if (p.kind === 'oferta' && (S.G.stock[p.g] || 0) < p.q) return 'Primeiro arruma a mercadoria, depois a gente fala de preço.';
    if (p.kind === 'lote' && S.G.money < p.q * p.to) return 'Nem com desconto você tem esse dinheiro.';
    const ok = Math.random() < haggleChance(m.c);
    if (ok) { addRel(m.c, -1); const r = MA[p.kind]({ g: p.g, q: p.q, price: p.to }); return `Tá bom, fechado por ${fmt(p.to)} cada. ` + r; }
    addRel(m.c, -2);
    msg(m.c, pick(['Aí não dá. Meu preço é esse.', 'Nem pensar. Fica no que eu falei ou nada feito.', 'Tá querendo me quebrar? É o meu preço.']),
      [{ l: p.kind === 'lote' ? `Fecho no seu preço (${fmt(p.q * p.price)})` : `Vendo no seu preço (${fmt(p.q * p.price)})`, k: p.kind, p: { g: p.g, q: p.q, price: p.price } }, { l: 'Então deixa', k: 'nada' }]);
    return null;
  },
  oferta({ g: id, q, price }) {
    const g = S.G; if ((g.stock[id] || 0) < q) return 'Então quando tiver me chama.';
    g.stock[id] -= q; g.money += q * price; g.extra = (g.extra || 0) + q * price; g.xcost = (g.xcost || 0) + q * (g.cost[id] || 0); g.stats.sold += q; g.heat = Math.min(100, g.heat + q / 50 * heatMul()); addXP(15);
    return `Negócio fechado. ${fmt(q * price)} na mão.`;
  },
  lote({ g: id, q, price }) {
    const g = S.G; if (g.money < q * price) return 'Sem dinheiro não tem lote.';
    if (stockTotal() + q > storage()) return 'Você não tem onde guardar isso.';
    buyGood(id, q, price); addXP(10); return 'Entregue no esquema de sempre.';
  },
  politico({ cost }) {
    const g = S.G; if (g.money < cost) return 'Volte quando tiver o valor.';
    g.money -= cost; g.heat = Math.max(0, g.heat - 30); return 'Considere resolvido.';
  },
};

// ---------- carreira ----------
export function addXP(n) { const g = S.G, l0 = lvlOf(g.xp).n; g.xp = Math.max(0, g.xp + Math.round(n > 0 ? n * (sk('xp') ? 1.2 : 1) * (sk('mentor') ? 1.2 : 1) : n)); const l1 = lvlOf(g.xp).n; if (l1 > l0) emit('level', l1); }
export function checkRank() {
  const g = S.G;
  if (g.ri == null) g.ri = g.rank * 2;
  while (g.ri < 11 && g.xp >= XP2[g.ri + 1]) {
    g.ri++;
    const tier = Math.floor(g.ri / 2);
    if (tier <= g.rank) { const bonus = 250 * g.ri; g.money += bonus; log(`${g.nick} foi promovido a ${rankName()}.`, 'good'); emit('promo', rankName(), bonus); continue; }
    g.rank = tier;
    const u = UNLOCK[g.rank];
    if (g.rank < 5) msg('chefe', { faccao: `Tu tá subindo, ${g.nick}. A partir de hoje é ${rankName()}.`, milicia: `Promovido. Agora você é ${rankName()}.`, policia: `Promoção publicada no boletim: ${rankName()}. Parabéns.`, mafia: `Bravo, ${g.nick}. Da oggi sei ${rankName()}.` }[g.mode]);
    else msg('braco', { faccao: `Patrão, o Coroa rodou. A firma agora é tua.`, milicia: `Comandante, o Sargento Brito saiu de cena. A patrulha é sua.`, policia: `Comandante, sua nomeação saiu. O batalhão é seu.`, mafia: `Don ${g.nick}. A família agora é sua.` }[g.mode]);
    if (g.rank === 2) msg('braco', `Chefe, tô contigo. A rapaziada agora responde a você.`);
    log(`${g.nick} virou ${rankName()}. Liberado: ${u.label}.`, 'good');
    emit('rankup', g.rank, u);
  }
}
export function buySkill(id) {
  const s = SKILLS.find(x => x.id === id); if (!s || sk(id) || skillPoints() <= 0 || S.G.rank < s.min) return false;
  S.G.skills[id] = 1; emit('toast', 'Habilidade', s.name + ' liberada.', 'good'); saveGame(); return true;
}
export function checkAch() {
  const g = S.G, o = owned(0).length;
  const t = {
    first: g.stats.won >= 1, five: o >= 5, ten: o >= 10, r3: g.rank >= 3, r5: g.rank >= 5, rich: g.money >= 20000,
    builder: sum(owned(0).map(i => g.d[i].b.length)) >= 5, loyal: owned(0).some(i => g.d[i].l >= 90), survivor: !!g.stats.survived,
    killer: !!g.stats.killed, trader: g.stats.sold >= 300, defender: g.stats.held >= 5,
  };
  for (const a of ACH) if (t[a.id] && !g.ach[a.id]) { g.ach[a.id] = g.day; addXP(30); emit('ach', a); }
}

// ---------- combate ----------
export function fight(att, n, i, bonus = 1) {
  const g = S.G, d = g.d[i];
  const A = n * qOf(att) * bonus * (att === 0 ? pAtkMul() : 1) * R(.85, 1.15), D = defVal(i) * R(.85, 1.15);
  const mm = (sk('med') ? .75 : 1) * (sk('med2') ? .85 : 1), mA = att === 0 ? mm : 1, mD = d.o === 0 ? mm : 1;
  if (A > D) return { win: true, aLoss: Math.min(n - 1, Math.round(n * (D / A) * .6 * mA)), dLoss: d.t };
  return { win: false, aLoss: Math.round(n * R(.45, .75) * mA), dLoss: Math.min(d.t, Math.round(d.t * (A / D) * .55 * mD)) };
}
export function loseWeapons(c) { const g = S.G, T = pTroops() + c; if (!T || c <= 0) return; g.rif = Math.max(0, g.rif - Math.round(c * g.rif / T)); g.pis = Math.max(0, g.pis - Math.round(c * g.pis / T)); }
function conquer(i, o, surv) {
  const g = S.G, prev = g.d[i].o, d = g.d[i];
  d.o = o; d.t = surv; d.b = d.b.filter(() => Math.random() < .5); d.l = o === 0 ? (sk('fear') ? 45 : S.M.type[i] === 'comunidade' ? 30 : 38) : 50; d.tx = 1; d.c = S.G.day + 3;
  if (prev > 0 && g.f[prev - 1].alive && !owned(prev).length) { g.f[prev - 1].alive = false; if (o === 0) g.stats.killed = 1; log(`${g.f[prev - 1].name} foi varrido do mapa.`, o === 0 ? 'good' : ''); }
  if (o === 0 && S.MD.budget && prev > 0) { const q = RI(5, 14); g.stock.apreensao = (g.stock.apreensao || 0) + q; }
}

// ---------- ações do jogador ----------
function spend(cost, act) {
  const g = S.G;
  if (act && g.acts <= 0) { emit('toast', 'Sem ações', 'Encerre o dia para agir de novo.', 'bad'); return false; }
  if (g.money < cost) { emit('toast', 'Falta caixa', `Precisa de ${fmt(cost)}.`, 'bad'); return false; }
  g.money -= cost; if (act) g.acts--; return true;
}
export const A = {
  buy(k) {
    if (k === 'sol' ? !can('crew') : !can('attack')) return;
    const P = { sol: [recruitCost(), () => { const n = sk('crew') ? 12 : 10; S.G.reserve += n; return `+${n} ${S.MD.unit} na base`; }], pis: [600, () => { S.G.pis += 10; return '+10 pistolas no arsenal'; }], rif: [1800, () => { S.G.rif += 5; return '+5 fuzis no arsenal'; }] }[k];
    if (!P || !spend(P[0], false)) return; emit('sfx', 'cash'); emit('toast', 'Comprado', P[1](), 'good');
  },
  bribe() { const g = S.G; if (!can('market') || g.heat <= 0 || !spend(bribeCost(), true)) return; g.heat = Math.max(0, g.heat - 25); emit('sfx', 'cash'); emit('toast', S.MD.bribe, `${S.MD.heat} caiu para ${Math.round(g.heat)}.`, 'good'); },
  hire(s) {
    const g = S.G, i = S.sel, d = g.d[i]; if (!can('build') || d.o !== 0 || tenOf(i) || tenCount() >= maxTen() || !TEN[s] || !spend(1500, true)) return;
    g.ten = g.ten || {}; const used = Object.values(g.ten).map(t => t.n), n = (TEN_NAMES[g.mode].find(x => !used.includes(x)) || 'Tenente');
    g.ten[i] = { n, s }; addXP(10); emit('sfx', 'cash'); emit('toast', 'Tenente nomeado', `${n} cuida de ${zname(i)} agora.`, 'good'); log(`${n} virou tenente de ${zname(i)}.`, 'good');
  },
  fire() { const g = S.G; if (g.ten && g.ten[S.sel]) { log(`${g.ten[S.sel].n} foi dispensado.`); delete g.ten[S.sel]; emit('sfx', 'click'); } },
  lawyer() { const g = S.G; if (!jailed() || g.money < 5000) return; g.money -= 5000; g.jail.until = g.day + Math.ceil((g.jail.until - g.day) / 2); addRel('advogado', 5); emit('toast', 'Advogado', `Sai no dia ${g.jail.until + 1}.`, 'good'); },
  build(id) {
    if (jailed()) { emit('toast', 'Você está preso', 'Daqui de dentro não dá para construir.', 'bad'); return; }
    const g = S.G, i = S.sel, d = g.d[i], b = S.MD.builds.find(x => x.id === id);
    if (!can('build') || !b || d.o !== 0 || d.b.length >= slotsOf(i) || d.b.includes(id) || !spend(bCost(b), true)) return;
    d.b.push(id); d.lv = d.lv || {}; d.lv[id] = 1; g.stats.built++; addXP(10); tut('build'); emit('sfx', 'cash'); emit('toast', 'Construído', `${b.name} em ${zname(i)}.`, 'good'); log(`${b.name} construído em ${zname(i)}.`, 'good');
  },
  up(id) {
    if (jailed()) { emit('toast', 'Você está preso', 'Daqui de dentro não dá para construir.', 'bad'); return; }
    const g = S.G, i = S.sel, d = g.d[i], b = S.MD.builds.find(x => x.id === id), lv = lvOf(i, id);
    if (!can('build') || !b || d.o !== 0 || !d.b.includes(id) || lv >= 3 || !spend(upCost(b, lv), true)) return;
    d.lv = d.lv || {}; d.lv[id] = lv + 1; g.stats.built++; addXP(15); emit('sfx', 'cash'); emit('toast', 'Melhorado', `${b.name} agora é nível ${lv + 1}.`, 'good'); log(`${b.name} em ${zname(i)} foi para o nível ${lv + 1}.`, 'good');
  },
  srvp(v) { const [id, p] = String(v).split('|'), d = S.G.d[S.sel]; if (!can('build') || d.o !== 0 || !d.b.includes(id)) return; d.sp = d.sp || {}; d.sp[id] = clamp(+p, 0, 2); emit('sfx', 'click'); },
  tax(v) { const d = S.G.d[S.sel]; if (!can('build') || d.o !== 0) return; d.tx = +v; emit('sfx', 'click'); },
  dep(n) { const g = S.G, d = g.d[S.sel]; if (!can('crew') || d.o !== 0 || jailed()) return; n = n === 'all' ? g.reserve : Math.min(+n, g.reserve); if (n > 0) { g.reserve -= n; d.t += n; tut('dep'); emit('sfx', 'click'); } },
  wd(n) { const g = S.G, d = g.d[S.sel]; if (!can('crew') || d.o !== 0 || jailed()) return; n = n === 'all' ? d.t : Math.min(+n, d.t); if (n > 0) { d.t -= n; g.reserve += n; emit('sfx', 'click'); } },
  scout() { const g = S.G, i = S.sel; if (!can('crew') || g.d[i].o === 0 || jailed() || !spend(sk('scout') ? 0 : 200, true)) return; g.seen[i] = g.day + 4; addXP(5); emit('toast', 'Olheiro no local', `${zname(i)}: ${g.d[i].t} ${S.MD.unit} defendendo.`, 'good'); },
  attack(n) {
    const g = S.G, i = S.sel, d = g.d[i]; n = +n;
    if (!can('attack') || !n || n > g.reserve || !reach(i)) return;
    if (jailed()) { emit('toast', 'Você está preso', 'Quem comanda a rua agora é o seu braço direito.', 'bad'); return; }
    if (modv('noAtk')) { emit('toast', 'Ninguém se mexe', `${g.cev.name}: ataques suspensos até o dia ${g.cev.until}.`, 'bad'); return; }
    if (g.acts < atkCost()) { emit('toast', 'Sem ações', `Atacar gasta ${atkCost()} ações. Encerre o dia.`, 'bad'); return; }
    const prev = d.o, pn = oname(prev), from = S.M.adj[i].filter(j => g.d[j].o === 0).sort((a, b) => g.d[b].t - g.d[a].t)[0];
    g.reserve -= n; g.acts -= atkCost(); tut('attack');
    const r = fight(0, n, i);
    g.heat = Math.min(100, g.heat + (S.MD.budget ? Math.round((r.aLoss + r.dLoss) / 2) + 3 : (S.MD.heatAtk + (S.M.val[i] >= 500 ? 4 : 0)) * heatMul()));
    g.seen[i] = g.day + 2;
    emit('arrow', from, i); emit('sfx', 'shots');
    if (r.win) { conquer(i, 0, n - r.aLoss); g.stats.won++; if (sk('loot')) { const lt = Math.round(300 + S.M.val[i] * .4); g.money += lt; g.extra = (g.extra || 0) + lt; addKarma(-2); emit('toast', 'Saque', `+${fmt(lt)} em ${zname(i)}.`, 'good'); } if (S.hooks && S.hooks.win) S.hooks.win(i); S.flash = i; loseWeapons(r.aLoss); addXP(40); log(`Você tomou ${zname(i)} de ${pn}. Perdeu ${r.aLoss}.`, 'good'); emit('result', 'Vitória', `${zname(i)} é seu. Baixas: ${r.aLoss} ${S.MD.unit}.`, 'good'); }
    else { g.reserve += n - r.aLoss; d.t -= r.dLoss; g.stats.lost++; loseWeapons(r.aLoss); addXP(10); log(`Ataque em ${zname(i)} falhou. Perdeu ${r.aLoss}, derrubou ${r.dLoss}.`, 'bad'); emit('result', 'Recuou', `Perdeu ${r.aLoss} ${S.MD.unit} e derrubou ${r.dLoss}.`, 'bad'); }
    checkRank(); checkAch(); checkEnd();
  },
  price(id, t) { if (!can('market')) return; S.G.pt[id] = clamp(+t, 0, 4); emit('sfx', 'click'); },
  auto() { if (!can('market')) return; S.G.auto = !S.G.auto; emit('sfx', 'click'); },
  trade(op, id, q) {
    const g = S.G, gd = S.MD.goods.find(x => x.id === id); if (!can('market') || !gd) return;
    if (op === 'buy') {
      if (!gd.buy) return; const p = buyPrice(id); q = Math.min(+q, storage() - stockTotal());
      if (q <= 0) { emit('toast', 'Depósito cheio', 'Espere as vendas ou construa depósito.', 'bad'); return; }
      if (g.money < p * q) { emit('toast', 'Falta caixa', `Precisa de ${fmt(p * q)}.`, 'bad'); return; }
      buyGood(id, q, p); tut('buy'); emit('sfx', 'cash'); emit('toast', 'Compra feita', `${q} ${gd.unit} de ${gd.name.toLowerCase()} a ${fmt(p)} cada.`, 'good');
    }
    checkRank(); checkAch();
  },
  truce(k) {
    const g = S.G, F = g.f[k]; if (!can('boss') || !F.alive || truceWith(k + 1) || !spend(2500, true)) return;
    const ok = Math.random() < (owned(k + 1).length < owned(0).length ? .7 : .35);
    const c = 'rival' + k;
    me(c, `Proposta: trégua de 7 dias. ${fmt(2500)} na mesa pra selar.`);
    if (ok) { F.truce = g.day + 7; F.truceFrom = g.day; g.plans = g.plans.filter(p => !(p.o === k + 1 && g.d[p.b].o === 0)); msg(c, 'Fechado. 7 dias sem guerra. Não vacila.'); }
    else msg(c, 'Pegamos o dinheiro e a resposta é não.');
  },
  endDay,
};

// ---------- IA ----------
function planFor(o, rep) {
  const g = S.G, mine = owned(o), q = qOf(o), used = new Set();
  if (modv('noAtk')) return;
  const pers = o > 0 ? g.f[o - 1].pers : null;
  const fin = finOn() && o > 0;
  const big = o > 0 && owned(o).length / S.M.N >= .35;
  const t0 = Math.min(pers === 'agressivo' ? 3 : 2, 1 + Math.floor(g.day / 7) + (pers === 'agressivo' ? 1 : 0)) + (fin ? 1 : 0) + (g.day >= 40 ? 1 : 0);
  const tries = big ? Math.max(1, t0 - 1) : t0;
  const ratio = (pers === 'agressivo' ? 1.15 : pers === 'cauteloso' ? 1.6 : 1.3) ;
  if (o === 0 && g.join != null) {
    const b = g.join, a = S.M.adj[b].filter(j => g.d[j].o === 0).sort((x, y) => g.d[y].t - g.d[x].t)[0];
    if (a != null && g.d[b].o !== 0) { g.plans.push({ o, a, b, bonus: 1.15, join: 1 }); used.add(a); }
    g.join = null;
  }
  let lead = -1, lc = 0; g.f.forEach((f, j) => { const c = owned(j + 1).length; if (c > lc) { lc = c; lead = j + 1; } });
  if (lead === o || lc < S.M.N * .15) lead = -2;
  for (let t = 0; t < tries; t++) {
    let best = null, bs = 0;
    for (const a of mine) {
      if (used.has(a)) continue; const ta = g.d[a].t; if (ta < 3) continue;
      for (const b of S.M.adj[a]) {
        const db = g.d[b]; if (db.o === o) continue; if (fin && db.o > 0) continue; if (db.o === 0 && sk('shield') && (db.c || 0) >= g.day) continue;
        if ((o > 0 && db.o === 0 && truceWith(o)) || (o === 0 && truceWith(db.o))) continue;
        const def = defVal(b), att = (ta - 1) * q; if (att < def * (o > 0 && db.o === 0 ? ratio + .15 : ratio)) continue;
        const s = S.M.val[b] / (def + 1) * (fin && db.o === 0 ? 1.4 : 1) * (db.o === -1 ? 1.15 : 1) * (db.o === lead ? 1.4 : 1) * (o > 0 && db.o === 0 ? ((g.hate || 0) >= g.day ? 1.6 : .9) : 1) * (g.war && g.war.until >= g.day && o - 1 === g.war.a && db.o - 1 === g.war.b || g.war && g.war.until >= g.day && o - 1 === g.war.b && db.o - 1 === g.war.a ? 1.8 : 1);
        if (s > bs) { bs = s; best = [a, b]; }
      }
    }
    if (!best) break; used.add(best[0]); g.plans.push({ o, a: best[0], b: best[1], bonus: 1 });
  }
}
function aiEconomy(o) {
  const g = S.G, mine = owned(o); if (!mine.length) { if (o > 0) g.f[o - 1].alive = false; return; }
  if (o > 0) {
    const F = g.f[o - 1], T = sum(mine.map(i => g.d[i].t));
    F.money += sum(mine.map(i => S.M.val[i])) * (S.BAL?.ri ?? .5) / (1 + mine.length / 14) * (mine.length / S.M.N >= .35 ? .8 : 1) + 200 - 7 * T + (finOn() ? 350 : 0);
    if (F.money > 3000 && F.q < 1.6 && Math.random() < .35) { F.money -= 2500; F.q = Math.min(1.6, F.q + .1); }
    const buy = Math.floor(Math.max(0, F.money - 500) / 60 * (F.pers === 'cauteloso' ? .4 : .3));
    if (buy > 0) { F.money -= buy * 60; distribute(o, buy); }
  } else {
    if (g.money > 3200 && g.pis < pTroops()) { g.money -= 600; g.pis += 10; }
    const buy = Math.floor(Math.max(0, g.money - 2500) / 50 * .4);
    if (buy > 0) { g.money -= buy * 50; distribute(0, buy); }
  }
}
function distribute(o, n) {
  const g = S.G, mine = owned(o);
  const threat = i => sum(S.M.adj[i].filter(j => g.d[j].o !== o).map(j => g.d[j].t * qOf(g.d[j].o))) - g.d[i].t * qOf(o);
  let b = mine.filter(i => S.M.adj[i].some(j => g.d[j].o !== o)).sort((a, c) => threat(c) - threat(a)).slice(0, 3);
  if (!b.length) b = mine; for (let x = 0; x < n; x++) g.d[b[x % b.length]].t++;
}
function runPlans(rep) {
  const g = S.G, plans = g.plans; g.plans = [];
  if (modv('noAtk')) return;
  for (const p of plans.sort(() => Math.random() - .5)) {
    const da = g.d[p.a], db = g.d[p.b];
    if (da.o !== p.o || db.o === p.o || da.t < 3) continue;
    if (p.o > 0 && !g.f[p.o - 1].alive) continue;
    if ((p.o > 0 && db.o === 0 && truceWith(p.o)) || (p.o === 0 && truceWith(db.o))) continue;
    const n = da.t - 1, prev = db.o; da.t = 1;
    const r = fight(p.o, n, p.b, p.bonus * (p.o > 0 && prev === 0 && (g.leak || 0) >= g.day ? 1.2 : 1));
    const nm = zname(p.b);
    if (r.win) {
      conquer(p.b, p.o, n - r.aLoss);
      if (p.o === 0) { g.stats.aiWon++; g.stats.won++; addXP(p.join ? 40 : 12); S.flash = p.b; log(`${g.pname} tomou ${nm}.`, 'good'); rep.push(['good', `A firma tomou ${nm}${p.join ? ' com você na linha de frente' : ''}`, `-${r.aLoss}`]); if (p.join) msg('chefe', `Mandou bem hoje em ${nm}. Tô de olho em você.`); }
      else if (prev === 0) { S.flash = p.b; loseWeapons(r.dLoss); log(`${g.f[p.o - 1].name} tomou ${nm} de você.`, 'bad'); rep.push(['bad', `${g.f[p.o - 1].name} tomou ${nm}`, `-${r.dLoss}`]); }
      else if (prev > 0 && Math.random() < .4) log(`${g.f[p.o - 1].name} tomou ${nm} de ${g.f[prev - 1].name}.`);
    } else {
      da.t += n - r.aLoss; db.t -= r.dLoss;
      if (p.o === 0) { rep.push(['bad', `A firma falhou em ${nm}`, `-${r.aLoss}`]); if (p.join) addXP(10); }
      else if (prev === 0) { g.stats.held++; loseWeapons(r.dLoss); addXP(10); log(`Você segurou ${nm} contra ${g.f[p.o - 1].name}.`, 'good'); rep.push(['good', `Segurou ${nm} contra ${g.f[p.o - 1].name}`, `-${r.dLoss}`]); }
    }
  }
}

// ---------- dia ----------
export function newPrices(first) {
  const g = S.G;
  for (const gd of S.MD.goods) {
    if (gd.buy) { const prev = g.px.buy[gd.id] || gd.buy; g.px.buy[gd.id] = Math.round(clamp(prev * R(.86, 1.16), gd.buy * .65, gd.buy * 1.55)); }
    g.mood[gd.id] = first ? 1 : +clamp((g.mood[gd.id] || 1) * .4 + R(.6, 1.45) * .6, .55, 1.6).toFixed(2);
  }
  g.mev = null;
  if (first || g.phase !== 'play') return;
  const mine = owned(0);
  if (mine.length && Math.random() < .35) {
    const z = pick(mine), up = Math.random() < .6, f = up ? R(1.6, 2.2) : R(.15, .4);
    g.mev = { z, f: +f.toFixed(2), up };
    const T = up ? { faccao: `vai ter baile em ${zname(z)} hoje. Vai bombar de gente.`, milicia: `tem feira grande em ${zname(z)} hoje. Movimento dobrado.`, policia: `leilão especial hoje com compradores de fora em ${zname(z)}.`, mafia: `festa do padroeiro em ${zname(z)} hoje. A cidade toda na rua.` }
      : { faccao: `${W().cops} tão rondando ${zname(z)}. As bancas vão vender pouco hoje.`, milicia: `fiscalização em ${zname(z)}. Os pontos vão ficar parados.`, policia: `o leilão de ${zname(z)} foi suspenso pela justiça hoje.`, mafia: `os Carabinieri fecharam o porto de ${zname(z)} por hoje.` };
    const who = can('crew') ? 'braco' : 'olheiro';
    msg(who, `${can('attack') ? 'Chefe, ' : ''}${T[g.mode]}`[0].toUpperCase() + `${can('attack') ? 'Chefe, ' : ''}${T[g.mode]}`.slice(1));
  }
}
function autoBuy(force) {
  const g = S.G; if (!force && can('market') && !g.auto) return;
  for (const gd of S.MD.goods) {
    if (!gd.buy) continue;
    const p = buyPrice(gd.id), target = Math.round(demandFor(gd.id, g.pt[gd.id], false) * 1.4), need = Math.min(target - g.stock[gd.id], storage() - stockTotal());
    if (need <= 0 || p > gd.buy * 1.12) continue;
    const q = Math.min(need, Math.floor(Math.max(0, g.money - 1500) / p));
    if (q > 0) buyGood(gd.id, q, p);
  }
}
function buyGood(id, q, p) {
  const g = S.G, s = g.stock[id];
  g.cost[id] = Math.round(((g.cost[id] || p) * s + p * q) / (s + q)); g.stock[id] = s + q; g.money -= p * q; g.buys = (g.buys || 0) + p * q;
}
function sales(rep) {
  const g = S.G; let ven = 0, cmv = 0, lost = 0; g.zsale = {}; g.last = {};
  const mine = owned(0);
  for (const gd of S.MD.goods) {
    const tq = tierQ(g.pt[gd.id]), mood = (g.mood[gd.id] || 1) * modv('dem');
    const per = mine.map(i => demandZone(i, gd) * tq * mood * R(.8, 1.2)), dem = Math.round(sum(per));
    const sold = Math.max(0, Math.min(g.stock[gd.id] - reserved(gd.id), dem)), price = priceOf(gd.id), rev = sold * price, cost = sold * (g.cost[gd.id] || 0);
    g.stock[gd.id] -= sold; ven += rev; cmv += cost; lost += Math.max(0, dem - sold) * price;
    const tot = sum(per) || 1; mine.forEach((i, k) => { g.zsale[i] = (g.zsale[i] || 0) + Math.round(rev * per[k] / tot); });
    g.last[gd.id] = { dem, sold, rev, cost, price };
    if (!S.MD.budget) g.heat = Math.min(100, g.heat + sold / 70 * heatMul());
    g.stats.sold += sold;
  }
  g.money += ven;
  return { ven, cmv, lost };
}
function loyaltyTick(rep) {
  const g = S.G, aloy = allEff('aloy') + (sk('aloy') ? 1 : 0) + (sk('povo') ? 2 : 0) + (kGood() ? .5 : 0) - (sk('tax') ? .5 : 0) - (sk('tax2') ? .5 : 0) - (sk('gouge') ? .3 : 0) - (kBad() ? .3 : 0);
  for (const i of owned(0)) {
    const d = g.d[i];
    let dl = (50 - d.l) * .04 + (beff(i, 'loy') + aloy) * (sk('loy') ? 1.5 : 1) + srvLoy(i) + [2, 0, -3][d.tx ?? 1] - (g.heat > 70 ? 1 : 0) + (rel('morador') >= 70 ? 1 : rel('morador') <= 25 ? -1 : 0);
    d.l = clamp(d.l + dl, 0, 100); if (sk('loy2') && d.o === 0) d.l = Math.max(d.l, 40);
    if (d.l < 20 && Math.random() < .25) {
      if (Math.random() < .35 && i !== g.base) { g.d[i] = { o: -1, t: RI(5, 8), b: [], l: 50, tx: 1 }; S.flash = i; log(`Os moradores de ${zname(i)} se revoltaram e expulsaram a sua tropa.`, 'bad'); rep.push(['bad', `Revolta em ${zname(i)}`, 'zona perdida']); }
      else { const l = Math.ceil(d.t * .25); d.t -= l; loseWeapons(l); log(`Alguém de ${zname(i)} entregou a sua tropa.`, 'bad'); rep.push(['bad', `Denúncia em ${zname(i)}`, `-${l}`]); }
    }
  }
}
function events(rep) {
  const g = S.G, mine = owned(0);
  if (Math.random() < g.heat / 150 * modv('raid') * (1 - Math.min(.45, allEff('raid'))) * (sk('raid') ? .75 : 1) * (sk('ghost') ? .5 : 1) * (kGood() ? .8 : 1) * (g.arrego && g.arrego.until >= g.day ? .4 : 1) * ((g.cops || 0) >= g.day ? 1.5 : 1) && mine.length) {
    const i = mine.reduce((a, b) => g.d[b].t > g.d[a].t ? b : a), l = Math.round(g.d[i].t * R(.3, .55)), m = Math.max(0, Math.round(g.money * .1));
    g.d[i].t -= l; g.money -= m; g.heat = Math.max(0, g.heat - 10); loseWeapons(l); g.d[i].l = clamp(g.d[i].l - 5, 0, 100);
    let lost = 0; for (const gd of S.MD.goods) { if (gd.buy) { const s = Math.round(g.stock[gd.id] * .4); g.stock[gd.id] -= s; lost += s; } }
    emit('sfx', 'siren');
    log(`${S.MD.raid} em ${zname(i)}: ${l} ${S.MD.unit} perdidos e ${fmt(m)} apreendidos.`, 'bad');
    if (g.heat > 70 && Math.random() < .2) arrest(rep, 3); rep.push(['bad', `${S.MD.raid} em ${zname(i)}`, `-${l} · -${fmt(m)}${lost ? ` · -${lost} un.` : ''}`]);
  }
  if (g.heat >= 100 && mine.length) {
    const i = mine.filter(j => j !== g.base).sort((a, b) => incOf(b) - incOf(a))[0];
    if (i != null) { g.d[i] = { o: -1, t: RI(6, 10), b: [], l: 50, tx: 1 }; S.flash = i; log(`${S.MD.big}: você perdeu ${zname(i)}.`, 'bad'); rep.push(['bad', S.MD.big, `perdeu ${zname(i)}`]); }
    g.money = Math.round(g.money * .7); g.heat = 55; g.stats.survived = 1;
    if (Math.random() < .5) arrest(rep, 4);
  }
  if (Math.random() < .4) {
    const e = Math.random();
    if (e < .3) { const v = RI(6, 18) * 100, t = pick(S.MD.luck); g.money += v; log(`${t}: +${fmt(v)}.`, 'good'); rep.push(['good', t, '+' + fmt(v)]); }
    else if (e < .5) { const v = RI(4, 8); if (can('crew')) g.reserve += v; else g.d[g.base].t += v; log(`${S.MD.join}: +${v} ${S.MD.unit}.`, 'good'); rep.push(['good', S.MD.join, `+${v}`]); }
    else if (e < .7) { const c = mine.filter(i => g.d[i].t >= 4 && g.d[i].l < 60); if (c.length) { const i = pick(c), l = Math.round(g.d[i].t * R(.2, .35)); g.d[i].t -= l; loseWeapons(l); log(`${S.MD.traitor} ${zname(i)}: -${l} ${S.MD.unit}.`, 'bad'); rep.push(['bad', `${S.MD.traitor} ${zname(i)}`, `-${l}`]); } }
    else if (e < .85) { g.heat = Math.min(100, g.heat + 10); log(`Reportagem na TV sobre ${g.pname}: ${S.MD.heat.toLowerCase()} +10.`, 'bad'); rep.push(['bad', 'Reportagem na TV', '+10 de ' + S.MD.heat.toLowerCase()]); }
    else { const al = g.f.map((f, k) => k).filter(k => g.f[k].alive); if (al.length > 1) { const a = al[0], b = al[1], c = owned(a + 1); if (c.length) { const i = pick(c); g.d[i].t = Math.max(1, g.d[i].t - RI(2, 5)); log(`Confronto entre ${g.f[a].name} e ${g.f[b].name} em ${zname(i)}.`); } } }
  }
}
export function arrest(rep, base) {
  const g = S.G; if (jailed() || g.day < 4) return;
  if (sk('jail') && Math.random() < .5) return;
  const days = sk('jail') ? Math.ceil((base + RI(0, 2)) / 2) : base + RI(0, 2); g.jail = { from: g.day, until: g.day + days };
  const pol = S.MD.budget;
  log(pol ? `${g.nick} foi afastado pela corregedoria por ${days} dias.` : `${g.nick} foi preso. Fica ${days} dias lá dentro.`, 'bad');
  rep && rep.push(['bad', pol ? 'Você foi afastado do comando' : 'Você foi preso', `${days} dias`]);
  msg('advogado', pol ? `Te afastaram por ${days} dias enquanto investigam. Com ${fmt(5000)} eu acelero e corto pela metade.` : `Te pegaram. São ${days} dias lá dentro. Com ${fmt(5000)} eu corto pela metade.`, [{ l: `Pagar ${fmt(5000)}`, k: 'lawyer' }, { l: 'Esperar', k: 'nada' }]);
  if (g.rank >= 2) msg('braco', pol ? 'Comandante, seguro as pontas até o senhor voltar.' : 'Chefe, fica tranquilo. Eu seguro a rua até você sair.');
  emit('jail', days);
}
export function endDay() {
  const g = S.G, rep = [], inc = pIncome(), up = upkeep(), m0 = g.cash0 ?? g.money;
  const sv = sales(rep);
  g.money += inc - up;
  const luc = sv.ven + (g.extra || 0) - sv.cmv - (g.xcost || 0) + inc - up;
  const H = { d: g.day, ven: sv.ven + (g.extra || 0), cmv: sv.cmv + (g.xcost || 0), arr: inc, sal: up, luc, lost: Math.round(sv.lost), buys: g.buys || 0 };
  g.extra = 0; g.xcost = 0; g.buys = 0; tut('end'); if (H.ven > 0) addXP(Math.min(40, Math.round(H.ven / 200)));
  rep.push(['good', `Vendas ${S.MD.shopIn}`, '+' + fmt(H.ven)], ['bad', 'Custo da mercadoria vendida', '-' + fmt(H.cmv)], ['good', S.MD.budget ? 'Orçamento e arrecadação' : 'Arrecadação das zonas', '+' + fmt(inc)], ['bad', 'Salários', '-' + fmt(up)]);
  if (H.buys > 0) rep.push(['info', 'Compras para o estoque (sai do caixa, não é prejuízo)', '-' + fmt(H.buys)]);
  if (H.lost > 200) rep.push(['bad', 'Vendas perdidas por falta de mercadoria', fmt(H.lost)]);
  if (g.money < 0 && !sk('iron')) { let lost = Math.ceil(g.reserve * .15); g.reserve -= lost; for (const i of owned(0)) { const l = Math.ceil(g.d[i].t * .15); g.d[i].t -= l; lost += l; } loseWeapons(lost); log(`Caixa no vermelho: ${lost} ${S.MD.unit} abandonaram você.`, 'bad'); rep.push(['bad', 'Caixa no vermelho: deserção', `-${lost}`]); }
  loyaltyTick(rep);
  runPlans(rep);
  const auto0 = !can('attack') || jailed();
  g.f.forEach((F, k) => { if (F.alive) aiEconomy(k + 1); });
  if (!can('crew')) aiEconomy(0);
  g.f.forEach((F, k) => { if (F.alive) planFor(k + 1); });
  if (auto0) planFor(0);
  if (g.day % 3 === 0) for (let i = 0; i < S.M.N; i++) if (g.d[i].o === -1 && g.d[i].t < 14) g.d[i].t += 1;
  g.heat = clamp(g.heat - 5 + sum(owned(0).map(i => beff(i, 'heat'))), 0, 100);
  events(rep);
  H.caixa = g.money; g.hist.push(H); if (g.hist.length > 120) g.hist.shift(); g.lastPL = H;
  newPrices(); autoBuy(!can('market')); g.cash0 = g.money;
  if (S.hooks && S.hooks.dayEnd) S.hooks.dayEnd(rep);
  for (const m of g.msgs) if (m.st === 'open') { m.st = 'expired'; }
  g.day++; g.acts = maxActs(); addXP(5);
  if (g.jail && g.jail.until === g.day - 1) { msg(g.rank >= 2 ? 'braco' : 'chefe', S.MD.budget ? 'Comandante, a corregedoria arquivou. O senhor está de volta.' : 'Bem-vindo de volta. A rua sentiu sua falta.'); log(`${g.nick} está de volta.`, 'good'); g.jail = null; }
  if (g.jail) addXP(10);
  checkRank(); checkAch(); checkEnd();
  if (g.over) return rep;
  dailyMessages();
  saveGame();
  return rep;
}
export function checkEnd() {
  const g = S.G, mine = owned(0).length, share = mine / S.M.N;
  const top = g.f.map((f, k) => [k, owned(k + 1).length]).sort((a, b) => b[1] - a[1])[0];
  if (g.over) return;
  const F = FINALS[g.mode];
  if (!mine) { g.over = 'lose'; g.why = `${g.pname} perdeu a última zona no dia ${g.day}.`; }
  else if (mine >= S.M.N) { g.over = 'win'; g.ending = F.title; g.why = `${g.pname} dominou 100% de ${S.MD.city} em ${g.day} dias. Não sobrou ninguém.`; }
  else if (finOn() && g.day > g.fin.until) {
    if (share >= FIN_HOLD && g.d[g.base].o === 0) {
      g.fin = { active: 0, done: g.day };
      g.f.forEach((f, k) => { if (!f.alive) return; f.money = Math.round(f.money / 2); owned(k + 1).forEach(i => { g.d[i].t = Math.max(1, Math.round(g.d[i].t * .8)); }); });
      g.money += 5000; addXP(300); g.stats.survived = 1;
      log(`${F.name}: você venceu. A aliança rival desmoronou.`, 'good');
      msg(finFrom(), F.win + ` Prêmio: ${fmt(5000)}.`);
      emit('chapter', F);
    }
    else { g.fin = { active: 0, cool: g.day + 10, failed: (g.fin.failed || 0) + 1 }; g.f.forEach((f, k) => { if (f.alive) owned(k + 1).forEach(i => { g.d[i].t = Math.max(1, Math.round(g.d[i].t * .8)); }); }); log(`${F.name}: a aliança rival quebrou o seu cerco. A história segue.`, 'bad'); msg(finFrom(), 'Não deu dessa vez. A aliança deles se desfez, mas a gente perdeu terreno. Reorganiza e tenta de novo.'); }
  }
  else if (top[1] / S.M.N >= .65) { g.over = 'lose'; g.why = `${g.f[top[0]].name} dominou ${Math.round(top[1] / S.M.N * 100)}% do mapa no dia ${g.day}.`; }
  else if (!finOn() && !(g.fin && g.fin.done) && share >= FIN_AT && g.day >= 12 && (!(g.fin && g.fin.cool > g.day) || share >= .5) && g.f.filter(f => f.alive).length) startFinal();
  if (g.over) {
    store.del(SAVE + g.mode);
    g.score = Math.max(0, Math.round(owned(0).length * 120 + g.money / 50 + Object.keys(g.ach).length * 80 + g.rank * 150 + (g.over === 'win' ? 2000 - g.day * 15 : 0)));
    const recs = store.get('ddc.records') || [];
    recs.push({ mode: g.mode, nick: g.nick, score: g.score, win: g.over === 'win', day: g.day, rank: rankName(), at: Date.now(), end: g.over === 'win' ? g.ending : null });
    recs.sort((a, b) => b.score - a.score); store.set('ddc.records', recs.slice(0, 20));
    emit('over', g.over);
  }
}
const finFrom = () => { const f = FINALS[S.G.mode].from; return contacts().some(c => c.id === f) ? f : S.G.rank >= 5 ? 'braco' : 'chefe'; };
function startFinal() {
  const g = S.G, F = FINALS[g.mode], from = finFrom();
  g.fin = { active: 1, from: g.day, until: g.day + 5, opt: null, failed: (g.fin && g.fin.failed) || 0 };
  g.f.forEach((f, k) => { if (!f.alive) return; f.truce = 0; f.money += 1500; f.q = Math.min(1.6, f.q + .05); const z = owned(k + 1); if (z.length) distribute(k + 1, 2 + Math.floor(g.day / 6) + Math.ceil(z.length / 3)); });
  log(`${F.name}: os rivais se uniram contra ${g.pname}. Segure ${Math.round(FIN_HOLD * 100)}% do mapa e a sua base até o dia ${g.fin.until}.`, 'bad');
  msg(from, F.start, [...F.opts.map(([k, l, c]) => ({ l: `${l} (${fmt(c)})`, k: 'fin', p: { k, c } })), { l: 'Seguir como está', k: 'fin', p: { k: null, c: 0 } }]);
  emit('final', g.fin);
}
