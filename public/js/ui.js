// Interface: menu, HUD, painel, celular (WhatsApp), diálogos e som.
import { MODES, SOON, XP, UNLOCK, SKILLS, ACH, ZT, TIERS, FINALS, BCAT, SRV_P, BLV } from './data.js';
import {
  S, A, SAVE, store, fmt, sum, clamp, R, loadMap, mapsLoaded, newGame, resume, startAt, owned, colorOf, oname, sk, rankName, can, unlockRank,
  skillPoints, pTroops, pq, defVal, incOf, pIncome, upkeep, maxActs, reach, recruitCost, bribeCost, visible, est, estDef, odds, atkPow, bOf,
  storage, stockTotal, comLevel, comLabel, priceOf, buyPrice, demandFor, demandZone, moodLabel, rivalsNear, riskOf, canStart, tierQ, contacts, contactById, answer, unread, buySkill, truceWith, endDay, saveGame, goal, checkEnd,
} from './engine.js';
import * as MAP from './map.js';
import * as E from './engine.js';
import * as ST from './stories.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mob = () => innerWidth <= 760;
S.hooks = { dayStart: ST.dayStart, dayEnd: ST.dayEnd, storyAnswer: ST.storyAnswer, win: ST.groupWin };
let tab = 'z', phone = { open: false, app: 'home', chat: null }, setup = { rank: 0, nick: '' }, batching = false, newMsgs = 0;

// ---------- som ----------
let AC = null, sound = store.get('ddc.sound') !== false;
const ac = () => (AC = AC || new (window.AudioContext || window.webkitAudioContext)());
function tone(type, freq, dur, vol = .12, slide) { if (!sound) return; try { const C = ac(), o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = freq; if (slide) o.frequency.exponentialRampToValueAtTime(slide, C.currentTime + dur); g.gain.setValueAtTime(vol, C.currentTime); g.gain.exponentialRampToValueAtTime(.001, C.currentTime + dur); o.connect(g).connect(C.destination); o.start(); o.stop(C.currentTime + dur); } catch (e) {} }
function noise(dur, vol, delay) { if (!sound) return; try { const C = ac(), b = C.createBuffer(1, Math.floor(C.sampleRate * dur), C.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const s = C.createBufferSource(), g = C.createGain(), f = C.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; s.buffer = b; g.gain.value = vol; s.connect(f).connect(g).connect(C.destination); s.start(C.currentTime + delay); } catch (e) {} }
const sfx = {
  click: () => tone('triangle', 520, .06, .05), cash: () => { tone('square', 988, .08, .05); setTimeout(() => tone('square', 1319, .18, .05), 80); },
  shots: () => { for (let k = 0; k < 5; k++) noise(.12, .22, k * .09 + Math.random() * .04); }, win: () => { tone('triangle', 523, .15, .1); setTimeout(() => tone('triangle', 784, .3, .1), 130); },
  lose: () => tone('sawtooth', 300, .4, .07, 120), siren: () => { tone('sine', 700, .5, .06, 1100); setTimeout(() => tone('sine', 1100, .5, .06, 700), 480); },
  ping: () => { tone('sine', 880, .09, .08); setTimeout(() => tone('sine', 1320, .14, .07), 90); },
};

// ---------- ícones ----------
const I = {
  emb: '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#d9a943" stroke-width="7"/><path d="M28 82V62h8v-8h6v28h4V44h10v-8h4v8h10v38h4V56h8v10h8v16z" fill="#e8c46a"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 5l-7 7 7 7"/></svg>',
  sol: '<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5" fill="#f8e09a"/><path d="M6 28c1-7 5-11 10-11s9 4 10 11z" fill="#d9a943"/></svg>',
  pis: '<svg viewBox="0 0 32 32"><path d="M4 10h20l2 3h2v4H14l-2 9H6l2-9H4z" fill="#d9a943"/><rect x="14" y="17" width="5" height="3" fill="#f8e09a"/></svg>',
  rif: '<svg viewBox="0 0 32 32"><path d="M2 13h20l2-2h6v4h-4l-2 2H14l-3 9H7l2-9H2z" fill="#d9a943"/><rect x="13" y="17" width="3" height="5" fill="#f8e09a"/></svg>',
  zap: '<svg viewBox="0 0 32 32"><path d="M16 4a12 12 0 00-10.4 18L4 28l6.2-1.6A12 12 0 1016 4z" fill="#fff"/><path d="M12 10.5c.4-.9 1-.9 1.4-.9h.9c.3 0 .6.1.8.6l1 2.6c.1.3 0 .6-.2.9l-.7.9c-.2.2-.2.5 0 .8.9 1.5 2.1 2.6 3.6 3.4.3.1.6.1.8-.1l.9-1c.2-.3.6-.4.9-.2l2.4 1.2c.4.2.5.5.4.9-.2 1.3-1.4 2.4-2.8 2.4-4.3-.2-8.6-4.5-8.8-8.8 0-.8.2-1.6.4-1.9z" fill="#25d366"/></svg>',
  con: '<svg viewBox="0 0 32 32"><circle cx="16" cy="12" r="5.5" fill="#fff"/><path d="M6 27c1-6 5-9.5 10-9.5S25 21 26 27z" fill="#fff"/></svg>',
  mkt: '<svg viewBox="0 0 32 32"><path d="M5 12l3-6h16l3 6z" fill="#fff"/><rect x="7" y="13" width="18" height="13" rx="2" fill="#fff" opacity=".85"/><rect x="13" y="17" width="6" height="9" fill="#1d1406"/></svg>',
  car: '<svg viewBox="0 0 32 32"><path d="M16 4l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.8L16 22l-7 3.7 1.3-7.8-5.7-5.6 7.9-1.1z" fill="#fff"/></svg>',
  nws: '<svg viewBox="0 0 32 32"><rect x="5" y="6" width="22" height="20" rx="3" fill="#fff"/><path d="M9 11h14M9 15h14M9 19h9" stroke="#1d1406" stroke-width="2"/></svg>',
  fin: '<svg viewBox="0 0 32 32"><path d="M5 26h22" stroke="#fff" stroke-width="2.4"/><rect x="7" y="16" width="4" height="8" fill="#fff"/><rect x="14" y="11" width="4" height="13" fill="#fff"/><rect x="21" y="6" width="4" height="18" fill="#fff"/></svg>',
  map: '<svg viewBox="0 0 32 32"><path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" fill="#fff"/><path d="M12 5v19M20 8v19" stroke="#1d1406" stroke-width="1.6"/></svg>',
};
const lockBox = (key, what) => `<div class="lock">${I.lock}<span>${what || UNLOCK[unlockRank(key)].label}: libera no cargo <b>${esc(S.MD.ranks[unlockRank(key)])}</b>.</span></div>`;
const avColor = id => ['#00a884', '#d6a645', '#7f66ff', '#e5484d', '#3b82f6', '#e07b39', '#1fa38a', '#c2185b'][[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 8];
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ---------- feedback ----------
let rt; function result(t, p, c) { const e = $('#res'); e.innerHTML = `<h3 style="color:${c === 'good' ? 'var(--g1)' : 'var(--bad)'}">${esc(t)}</h3><p>${esc(p)}</p>`; e.style.top = mob() ? '8px' : (($('#hud')?.offsetHeight || 70) + 60) + 'px'; e.classList.add('on'); clearTimeout(rt); rt = setTimeout(() => e.classList.remove('on'), 2600); }
const dq = [];
function dialog(h) { dq.push(h); if ($('#dlg').classList.contains('hide')) nextDlg(); }
function nextDlg() { const h = dq.shift(); if (!h) { $('#dlg').classList.add('hide'); return; } $('#dlgBox').innerHTML = h; $('#dlg').classList.remove('hide'); }
const closeDlg = () => nextDlg();

S.on = {
  toast: (t, p, c) => result(t, p, c), result: (t, p, c) => { result(t, p, c); setTimeout(c === 'good' ? sfx.win : sfx.lose, 450); },
  sfx: k => sfx[k] && sfx[k](), arrow: (a, b) => MAP.arrow(a, b), change: () => refresh(),
  message: m => {
    if (phone.open && phone.app === 'chat' && phone.chat === m.c) { m.read = 1; return; }
    newMsgs++;
    if (!batching && !m.quiet) { const c = contactById(m.c); result('Nova mensagem', `${c.name}: ${m.t.slice(0, 70)}${m.t.length > 70 ? '…' : ''}`, 'good'); sfx.ping(); }
  },
  rankup: (r, u) => dialog(`<h2 style="color:var(--g1)">Promovido: ${esc(S.MD.ranks[r])}</h2><p class="note">Você subiu de cargo e ganhou 1 ponto de habilidade.</p><ul class="rep"><li><span>Liberado</span><b style="color:var(--ok)">${esc(u.label)}</b></li></ul><div class="row"><button class="ghost btn" data-g="close">Fechar</button><button class="gold btn" data-g="career">Ver carreira</button></div>`),
  ach: a => { result('Conquista', `${a.name}: ${a.desc}`, 'good'); sfx.win(); },
  jail: days => dialog(`<h2 style="color:var(--bad)">${S.MD.budget ? 'Afastado do comando' : 'Você foi preso'}</h2><p class="note">${S.MD.budget ? 'A corregedoria te afastou' : 'A operação te pegou'} por ${days} dias. Enquanto isso o seu braço direito comanda os ataques. Pelo celular você ainda fala com todo mundo, compra e vende. O advogado pode cortar o tempo pela metade.</p><button class="gold btn" data-g="close">Entendi</button>`),
  cityEvent: c => dialog(`<h2 style="color:var(--g1)">${esc(c.name)}</h2><p class="note">${esc(c.text)}</p><p class="note">Vale até o dia ${c.until}.</p><button class="gold btn" data-g="close">Entendi</button>`),
  final: f => { const F = FINALS[S.G.mode]; sfx.lose(); dialog(`<h2 style="color:var(--bad)">${esc(F.name)}</h2><p class="note">Os rivais se uniram contra ${esc(S.G.pname)}. Até o fim do dia ${f.until} eles vão atacar juntos e com mais força.</p><ul class="rep"><li><span>Para vencer</span><b>Segurar ${Math.round(E.FIN_HOLD * 100)}% e a sua base</b></li><li><span>Depois</span><b>Tomar a cidade inteira</b></li></ul><p class="note">Tem uma escolha esperando no celular.</p><div class="row"><button class="ghost btn" data-g="close">Fechar</button><button class="gold btn" data-g="zapnow">Abrir celular</button></div>`); },
  chapter: F => { sfx.win(); dialog(`<small class="note" style="letter-spacing:.14em;text-transform:uppercase">Capítulo vencido</small><h2 style="color:var(--g1)">${esc(F.name)}</h2><p class="note" style="color:var(--ink)">${esc(F.win)}</p><ul class="rep"><li><span>Prêmio</span><b style="color:var(--ok)">${fmt(5000)} e 300 de respeito</b></li><li><span>Rivais</span><b>perderam 20% da tropa</b></li><li><span>Próximo objetivo</span><b>100% de ${esc(S.MD.city)}</b></li></ul><button class="gold btn" data-g="close">Seguir</button>`); },
  over: k => {
    const win = k === 'win'; win ? sfx.win() : sfx.lose(); const F = FINALS[S.G.mode];
    dialog(`${win ? `<small class="note" style="letter-spacing:.14em;text-transform:uppercase">Final</small>` : ''}<h2 style="color:${win ? 'var(--g1)' : 'var(--bad)'}">${win ? esc(F.title) : 'Fim da linha'}</h2>${win ? `<p class="note" style="color:var(--ink)">${esc(F.epi)}</p>` : ''}<p class="note">${esc(S.G.why)}</p>
      <ul class="rep"><li><span>Cargo final</span><b>${esc(rankName())}</b></li><li><span>Zonas tomadas</span><b>${S.G.stats.won}</b></li><li><span>Conquistas</span><b>${Object.keys(S.G.ach).length} de ${ACH.length}</b></li><li><span>Pontuação</span><b style="color:var(--g1)">${S.G.score || 0}</b></li></ul>
      <button class="gold btn" data-g="menu">Voltar ao menu</button>`);
  },
};

// ---------- HUD ----------
function renderHUD() {
  const g = S.G, ph = g.phase === 'setup', net = pIncome() - upkeep(), share = Math.round(owned(0).length / S.M.N * 100), hc = g.heat > 70 ? 'var(--bad)' : g.heat > 40 ? '#ffa36b' : 'var(--ok)';
  const nx = g.rank < 5 ? XP[g.rank + 1] : null, pct = nx ? clamp((g.xp - XP[g.rank]) / (nx - XP[g.rank]) * 100, 0, 100) : 100, ur = unread();
  const hud = $('#hud'); hud.style.setProperty('--pc', S.MD.color);
  hud.innerHTML = `<div class="brand">${I.emb}<div><b>${esc(g.pname)}</b><small>${ph ? `${S.MD.name} · ${esc(S.MD.city)}` : `${esc(g.nick)} · ${esc(rankName())} <span class="xp" title="${g.xp} de experiência"><i style="width:${pct}%"></i></span>`}</small></div></div>
  <div class="stats">${ph ? '' : `<div class="stat"><small>Dia</small><strong>${g.day}</strong></div>
  <div class="stat" data-app-open="fin" style="cursor:pointer" title="Abrir finanças"><small>Caixa${g.lastPL ? ' · lucro ontem' : ''}</small><strong>${fmt(g.money)} ${g.lastPL ? `<em style="color:${g.lastPL.luc >= 0 ? 'var(--ok)' : 'var(--bad)'}">${g.lastPL.luc >= 0 ? '▲ +' : '▼ '}${fmt(g.lastPL.luc)}</em>` : `<em style="color:${net >= 0 ? 'var(--ok)' : 'var(--bad)'}">${net >= 0 ? '+' : ''}${fmt(net)}</em>`}</strong></div>
  <div class="stat"><small>Tropa · base</small><strong>${pTroops()} · ${g.reserve}</strong></div>
  <div class="stat"><small>Fuzis · pistolas</small><strong>${g.rif} · ${g.pis}</strong></div>
  <div class="stat"><small>${S.MD.heat}</small><div class="bar"><i style="width:${g.heat}%;background:${hc}"></i></div></div>
  ${(() => { const fd = g.fin && g.fin.done, tg = fd ? 100 : Math.round(E.FIN_AT * 100); return `<div class="stat" title="${fd ? 'Domine a cidade inteira para vencer' : 'Ao chegar em ' + tg + '% começa a reta final'}"><small>Domínio ${share}% · meta ${tg}%</small><div class="bar"><i style="width:${Math.min(100, share / tg * 100)}%;background:var(--gold)"></i></div></div>`; })()}
  ${E.jailed() ? `<div class="stat"><small>${S.MD.budget ? 'Afastado' : 'Preso'}</small><strong style="color:var(--bad)">até o dia ${g.jail.until}</strong></div>` : ''}
  ${E.finOn() ? `<div class="stat"><small>${esc(FINALS[g.mode].name)}</small><strong style="color:var(--bad)">até o dia ${g.fin.until}</strong></div>` : ''}
  ${g.cev && g.cev.until >= g.day ? `<div class="stat"><small>Evento</small><strong style="color:var(--g1)">${esc(g.cev.name)} · ${g.cev.until - g.day + 1}d</strong></div>` : ''}
  <div class="stat"><small>Ações</small><div class="dots">${Array.from({ length: maxActs() }, (_, k) => `<i class="${k < g.acts ? 'on' : ''}"></i>`).join('')}</div></div>`}</div>
  ${ph ? '' : `<button class="hbtn phone ${ur ? 'pulse' : ''}" data-g="phone" aria-label="Celular">${I.phone}${ur ? `<span class="badge">${ur}</span>` : ''}</button>`}
  <button class="hbtn ghost snd" data-g="sound" aria-label="Som">${sound ? I.on : I.off}</button><button class="hbtn ghost" data-g="menu" aria-label="Menu">${I.menu}</button>`;
  const top = hud.offsetHeight;
  if (!mob()) $('#panel').style.top = (top + 10) + 'px';
  $('#views').style.top = (top + 10) + 'px'; $('#legend2').style.top = (top + 58) + 'px';
}
const VIEWS = [['dom', 'Domínio'], ['atk', 'Ataque'], ['loy', 'Lealdade'], ['inc', 'Renda']];
function renderViews() {
  const g = S.G, ph = g.phase === 'setup';
  $('#views').classList.toggle('hide', ph); $('#legend2').classList.toggle('hide', ph && false);
  $('#views').innerHTML = VIEWS.map(([k, l]) => `<button data-view="${k}" class="${MAP.view === k ? 'on' : ''}">${l}</button>`).join('');
  const L = {
    dom: [[S.MD.color, 'Você'], ...g.f.filter(f => f.alive).map(f => [f.color, f.name]), ['#2a2d35', 'Sem dono'], ['#5fd48a', 'Contorno: chance de ataque']],
    atk: [['#5fd48a', 'Quase certa'], ['#b6e36b', 'Boa'], ['#f0cf5a', 'Equilibrada'], ['#ff9a52', 'Arriscada'], ['#ff5b4f', 'Suicídio'], ['#000', 'Fora de alcance']],
    loy: [['#ff5b4f', 'Revolta'], ['#f0cf5a', 'Neutra'], ['#5fd48a', 'Leal']],
    inc: [['#4a3a17', 'Rende pouco'], ['#f8e09a', 'Rende muito']],
  }[MAP.view];
  $('#legend2').innerHTML = ph ? `<span><i style="background:#d9a943"></i>Dourado: pode ser a sua base</span>` : L.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('') + (MAP.view === 'atk' ? `<span>com ${g.reserve} ${S.MD.unit} da base</span>` : '');
}

// ---------- painel ----------
function targets() {
  const out = []; for (let i = 0; i < S.M.N; i++) if (reach(i)) out.push([i, atkPow(Math.max(1, S.G.reserve)) / estDef(i)]);
  return out.sort((a, b) => b[1] - a[1]).slice(0, 6);
}
function careerCard() {
  const g = S.G, nx = g.rank < 5 ? XP[g.rank + 1] : null, pct = nx ? clamp((g.xp - XP[g.rank]) / (nx - XP[g.rank]) * 100, 0, 100) : 100, sp = skillPoints();
  return `<div class="career"><small class="note">Seu cargo</small><br><b>${esc(rankName())}</b><div class="meter"><i style="width:${pct}%;background:var(--gold)"></i></div>
    <p class="note" style="margin:6px 0 0">${nx ? `${g.xp} de ${nx} de respeito. Próximo: <strong style="color:var(--ink)">${esc(S.MD.ranks[g.rank + 1])}</strong>, libera ${esc(UNLOCK[g.rank + 1].label.toLowerCase())}.` : 'Você está no topo.'}${sp > 0 ? ` <strong style="color:var(--g1)">${sp} ponto${sp > 1 ? 's' : ''} de habilidade para usar.</strong>` : ''}</p></div>`;
}
function baseInfo(i) {
  const [cl, cc] = comLabel(comLevel(i)), [rl, rc] = riskOf(i), near = rivalsNear(i);
  const tax = Math.round(S.M.val[i] * .85 * (S.MD.inc[S.M.type[i]] || 1) * (S.MD.budget ? .4 : 1));
  const g0 = S.MD.goods[0], sale = Math.round(demandZone(i, g0, { l: 70 }) * (g0.ref - (g0.buy || 0)));
  const str = { forte: '#ff5b4f', 'médio': '#f0cf5a', fraco: '#5fd48a' };
  return `<div class="kv"><div><small>Comércio</small><strong style="color:${cc}">${cl}</strong></div><div><small>Risco</small><strong style="color:${rc}">${rl}</strong></div><div><small>Renda/dia</small><strong>${fmt(tax + sale)}</strong></div></div>
    <ul class="rep" style="margin:0 0 12px"><li><span>Arrecadação estimada</span><b>${fmt(tax)}</b></li><li><span>Lucro de ${esc(g0.name.toLowerCase())} ${S.MD.shopIn}</span><b>~${fmt(sale)}</b></li>
    ${near.length ? near.map(r => `<li><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${r.F.color};margin-right:6px"></i>${esc(r.F.name)} ${r.dist === 1 ? 'é vizinho' : 'está a 2 zonas'}</span><b style="color:${str[r.F.str]}">${r.F.str}</b></li>`).join('') : '<li><span>Nenhum rival por perto</span><b style="color:var(--ok)">tranquilo</b></li>'}</ul>`;
}
function jailCard() {
  if (!E.jailed()) return '';
  const g = S.G;
  return `<div class="career" style="background:rgba(255,91,79,.08);border-color:rgba(255,91,79,.35)"><small class="note">${S.MD.budget ? 'Afastado' : 'Preso'} até o dia ${g.jail.until}</small><br><strong style="font-size:17px">Seu braço direito comanda os ataques. Você segue no celular.</strong>
    <button class="ghost btn act" data-a="lawyer" style="margin:10px 0 0" ${g.money >= 5000 ? '' : 'disabled'}><span>Pagar o advogado<small>Corta o tempo pela metade</small></span><em>${fmt(5000)}</em></button></div>`;
}
let bcat = 'neg';
function buildBox(i) {
  const g = S.G, d = g.d[i], sl = E.slotsOf(i), built = bOf(i), cb = can('build'), sv = E.srvInc(i);
  let h = `<h4>Construções ${d.b.length}/${sl}${sv ? ` · serviços rendem ${fmt(sv)}/dia` : ''}</h4>`;
  h += built.map(b => {
    const lv = E.lvOf(i, b.id), p = E.srvP(i, b.id), up = lv < 3 ? E.upCost(b, lv) : 0;
    return `<div class="bcard"><div class="bh"><b>${esc(b.name)}</b><span class="chip lv">Nível ${lv}</span></div>
      <small>${b.cat === 'srv' ? `Rende ${fmt(E.srvEst(i, b, lv, p))} por dia ${['e o povo gosta', 'a preço justo', 'mas o povo reclama'][p]}` : esc(b.desc) + (lv > 1 ? ` · efeito ×${BLV[lv - 1].toFixed(1).replace('.', ',')}` : '')}</small>
      ${b.cat === 'srv' && cb ? `<div class="seg mini">${SRV_P.map(([l, , ly], k) => `<button data-a="srvp" data-n="${b.id}|${k}" class="${p === k ? 'on' : ''}">${l}<small>${ly > 0 ? '+' : ''}${String(ly).replace('.', ',')} lealdade</small></button>`).join('')}</div>` : ''}
      ${cb && lv < 3 ? `<button class="ghost btn act sm" data-a="up" data-n="${b.id}" ${g.acts && g.money >= up ? '' : 'disabled'}><span>Melhorar para nível ${lv + 1}</span><em>${fmt(up)} · 1 ação</em></button>` : ''}</div>`;
  }).join('');
  if (d.b.length < sl) h += `<div class="slot empty">${sl - d.b.length} espaço${sl - d.b.length > 1 ? 's' : ''} livre${sl - d.b.length > 1 ? 's' : ''} nesta zona</div>`;
  if (!cb || d.b.length >= sl) return h;
  const av = S.MD.builds.filter(b => !d.b.includes(b.id)), cats = Object.keys(BCAT).filter(c => av.some(b => b.cat === c));
  if (!cats.includes(bcat)) bcat = cats[0];
  h += `<h4>Construir aqui</h4><div class="seg cats">${cats.map(c => `<button data-bcat="${c}" class="${bcat === c ? 'on' : ''}">${esc(BCAT[c].replace('Serviços para o morador', 'Serviços'))}</button>`).join('')}</div>`;
  if (bcat === 'srv') h += `<p class="note" style="margin:0 0 8px">Serviços são cobrados do morador. Você escolhe o preço: barato agrada, caro rende mais e irrita.</p>`;
  h += av.filter(b => b.cat === bcat).map(b => `<button class="ghost btn act" data-a="build" data-n="${b.id}" ${g.acts && g.money >= b.cost ? '' : 'disabled'}><span>${esc(b.name)}<small>${b.cat === 'srv' ? `${esc(b.desc)}. Aqui rende cerca de ${fmt(E.srvEst(i, b))}/dia` : esc(b.desc)}</small></span><em>${fmt(b.cost)} · 1 ação</em></button>`).join('');
  return h;
}
function tutCard() {
  if (!E.tutShow()) return '';
  const g = S.G, L = E.tutList(), done = L.filter(x => g.tut.d[x.k]).length;
  return `<div class="career tut"><div style="display:flex;justify-content:space-between;align-items:center"><small class="note">Primeiros passos · ${done} de ${L.length}</small><button class="link" data-a="tutoff">pular</button></div>
    <ul class="steps">${L.map(x => `<li class="${g.tut.d[x.k] ? 'ok' : ''}"><i></i>${esc(x.t)}</li>`).join('')}</ul><p class="note" style="margin:6px 0 0">Cada passo vale 20 de respeito. Completou tudo, ganha ${fmt(1000)}.</p></div>`;
}
function finCard() {
  if (!E.finOn()) return '';
  const g = S.G, F = FINALS[g.mode], share = owned(0).length / S.M.N, left = g.fin.until - g.day + 1, ok = share >= E.FIN_HOLD && g.d[g.base].o === 0;
  return `<div class="career fin"><small class="note">${esc(F.name)} · ${left > 1 ? `faltam ${left} dias` : 'último dia'}</small><br><strong style="font-size:17px">Segure ${Math.round(E.FIN_HOLD * 100)}% do mapa e a sua base até o fim do dia ${g.fin.until}</strong>
    <div class="meter"><i style="width:${Math.round(clamp(share / E.FIN_AT, 0, 1) * 100)}%;background:${ok ? 'var(--ok)' : 'var(--bad)'}"></i></div>
    <p class="note" style="margin:6px 0 0">Você tem ${Math.round(share * 100)}% agora. ${ok ? 'Por enquanto está segurando.' : '<strong style="color:var(--bad)">Abaixo do mínimo: retome zonas.</strong>'} Os rivais estão unidos e atacam mais. Vencendo o cerco, a aliança desmorona e fica o caminho para tomar a cidade inteira.</p></div>`;
}
function buffList() { const b = E.buffs(); return b.length ? `<div class="buffs">${b.map(x => `<span class="chip">${esc(x.name)} · até o dia ${x.until}</span>`).join('')}</div>` : ''; }
function objCard() {
  const o = ST.objProgress(); if (!o) return '';
  const left = o.until - S.G.day;
  return `<div class="career" style="background:rgba(95,212,138,.07);border-color:rgba(95,212,138,.3)"><small class="note">Meta da semana · ${left > 0 ? `faltam ${left} dia${left > 1 ? 's' : ''}` : 'último dia'}</small><br><strong style="font-size:17px">${esc(o.text)}</strong>
    <div class="meter"><i style="width:${Math.round(o.pct * 100)}%;background:var(--ok)"></i></div><p class="note" style="margin:6px 0 0">${o.money ? `${fmt(o.a)} de ${fmt(o.b)}` : `${o.a} de ${o.b}`}</p></div>`;
}
function relBar(id) { const v = Math.round(E.rel(id)), c = v >= 70 ? 'var(--ok)' : v <= 30 ? 'var(--bad)' : '#f0cf5a'; return `<span style="display:inline-flex;align-items:center;gap:6px;color:#8696a0;font-size:12px">confiança <span class="xp" style="width:44px"><i style="width:${v}%;background:${c}"></i></span> ${v}</span>`; }
const ZBONUS = { porto: 'Ter porto deixa a mercadoria do fornecedor 10% mais barata.', costa: 'Ter litoral deixa a mercadoria do fornecedor 10% mais barata.', centro: 'Ter o centro deixa os acertos 30% mais baratos.', capitale: 'Ter a Capital deixa os acertos 30% mais baratos.', comunidade: 'Com 2 comunidades, recrutar fica 15% mais barato.' };
function tabSetup() {
  const i = S.sel, ok = i != null && canStart(i);
  const sug = [...Array(S.M.N).keys()].filter(canStart).sort((a, b) => comLevel(b) - comLevel(a)).slice(0, 8);
  const str = { forte: '#ff5b4f', 'médio': '#f0cf5a', fraco: '#5fd48a' };
  return `<h2>Comece sua história</h2><p class="sub">${esc(S.MD.startTxt)} As zonas em dourado podem ser a sua base. Compare o comércio e os rivais por perto.</p>
  ${ok ? `<div class="atk"><h2 style="font-size:26px">${esc(S.M.z[i].n)}</h2><p class="sub">${ZT[S.M.type[i]].label}</p>${baseInfo(i)}
    <h4 style="margin-top:4px">Como você começa</h4><div class="choice">${S.MD.starts.map(([r, t, d]) => `<button class="ghost ${setup.rank === r ? 'on' : ''}" data-rank="${r}"><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join('')}</div>
    <div class="field"><label for="nick">Seu apelido (é assim que vão te chamar no celular)</label><input id="nick" maxlength="18" value="${esc(setup.nick)}" placeholder="Ex.: Vini"></div>
    <button class="gold btn act" data-a="start"><span>Começar aqui</span><em>dia 1</em></button></div>`
    : `<p class="note">${i != null ? esc(S.M.z[i].n) + ' não pode ser base neste modo. ' : ''}Toque numa zona dourada ou escolha abaixo.</p>`}
  <h4>Opções de base</h4><div class="tgt">${sug.map(j => { const [cl, cc] = comLabel(comLevel(j)), [rl, rc] = riskOf(j); return `<button class="ghost" data-sel="${j}"><b>${esc(S.M.z[j].n)}</b><span><span style="color:${cc}">Comércio ${cl.toLowerCase()}</span> · <span style="color:${rc}">risco ${rl.toLowerCase()}</span></span></button>`; }).join('')}</div>
  <h4>Rivais na cidade</h4><div class="legend">${S.G.f.map((f, k) => `<div><i style="background:${f.color}"></i><span style="margin:0;color:var(--ink)">${esc(f.name)}<br><small class="note">${esc(E.PERS[f.pers] || '')}</small></span><span style="color:${str[f.str]}">${f.str}</span></div>`).join('')}</div>`;
}
function tabZone() {
  const g = S.G;
  if (g.phase === 'setup') return tabSetup();
  if (S.sel == null) {
    const t = targets(), ur = unread();
    return finCard() + jailCard() + tutCard() + careerCard() + objCard() + (ur ? `<button class="gold btn act" data-g="phone"><span>${ur} mensage${ur > 1 ? 'ns' : 'm'} no celular</span><em>abrir</em></button>` : '') +
      (can('attack') ? `<h4>Alvos ao seu alcance</h4><div class="tgt">${t.length ? t.map(([i, r]) => { const [o, c] = odds(r); return `<button class="ghost" data-sel="${i}"><b>${esc(S.M.z[i].n)}</b><span style="color:${c}">${visible(i) ? o : o + '?'}</span></button>`; }).join('') : '<p class="note">Nenhum alvo por enquanto.</p>'}</div>`
        : `<h4>Sua missão</h4><p class="note">Como ${esc(rankName())}, quem decide os ataques é o chefe. Cumpra as missões do celular para ganhar respeito e subir de cargo. Toque numa zona para ver detalhes.</p>${lockBox('attack')}`);
  }
  const i = S.sel, d = g.d[i], mine = d.o === 0, c = colorOf(d.o), vis = visible(i), [lo, hi] = est(i);
  let h = `<h2>${esc(S.M.z[i].n)}</h2><p class="sub"><span>${ZT[S.M.type[i]].label}</span><span class="own"><i style="background:${c}"></i>${esc(oname(d.o))}</span>${i === g.base ? '<span class="chip">Sua base</span>' : ''}${mine && E.tenOf(i) ? `<span class="chip">Tenente ${esc(E.tenOf(i).n)}</span>` : ''}${truceWith(d.o) ? `<span class="chip">Trégua até o dia ${g.f[d.o - 1].truce}</span>` : ''}</p>`;
  if (mine) {
    const lc = d.l < 30 ? 'var(--bad)' : d.l < 60 ? '#f0cf5a' : 'var(--ok)';
    h += `<div class="kv"><div><small>Tropa</small><strong>${d.t}</strong></div><div><small>Lealdade</small><strong style="color:${lc}">${Math.round(d.l)}</strong><div class="meter"><i style="width:${d.l}%;background:${lc}"></i></div></div><div><small>Rende/dia</small><strong>${fmt(incOf(i))}</strong></div></div>`;
    { const [cl, cc] = comLabel(comLevel(i)); h += `<p class="note" style="margin-top:-6px">Comércio <b style="color:${cc}">${cl.toLowerCase()}</b>${g.zsale[i] != null ? ` · vendeu ontem <b style="color:var(--ink)">${fmt(g.zsale[i])}</b> ${S.MD.shopIn}` : ''}.</p>`; }
    if (d.l < 25) h += `<p class="note" style="color:var(--bad)">Lealdade baixa: risco de denúncia e de revolta. Baixe a taxa ou construa algo para o povo.</p>`;
    h += `<h4>Mover tropa · sem ação</h4>` + (can('crew') ? `<div class="row"><button class="ghost btn" data-a="dep" data-n="5" ${g.reserve ? '' : 'disabled'}>Mandar 5</button><button class="ghost btn" data-a="dep" data-n="all" ${g.reserve ? '' : 'disabled'}>Mandar todos (${g.reserve})</button></div><div class="row"><button class="ghost btn" data-a="wd" data-n="5" ${d.t ? '' : 'disabled'}>Recolher 5</button><button class="ghost btn" data-a="wd" data-n="all" ${d.t ? '' : 'disabled'}>Recolher todos</button></div>` : lockBox('crew'));
    h += buildBox(i);
    if (!can('build')) h += lockBox('build');
    const tn = E.tenOf(i);
    h += `<h4>Tenente da zona</h4>`;
    if (!can('build')) h += lockBox('build', 'Nomear tenentes');
    else if (tn) h += `<div class="slot"><i></i><span><b>${esc(tn.n)}</b> · ${esc(E.TEN[tn.s].name)}: ${esc(E.TEN[tn.s].desc)}. Salário R$ 120/dia.</span></div><div class="row"><button class="ghost btn" data-a="fire">Dispensar</button></div>`;
    else if (E.tenCount() >= E.maxTen()) h += `<p class="note">Você já tem ${E.tenCount()} de ${E.maxTen()} tenentes. ${g.rank < 5 ? `Subir de cargo libera mais.` : ''}</p>`;
    else h += Object.entries(E.TEN).map(([k, t]) => `<button class="ghost btn act" data-a="hire" data-n="${k}" ${g.acts && g.money >= 1500 ? '' : 'disabled'}><span>${esc(t.name)}<small>${esc(t.desc)} · R$ 120/dia</small></span><em>${fmt(1500)} · 1 ação</em></button>`).join('');
    h += `<h4>Taxa cobrada</h4>` + (can('build') ? `<div class="seg">${[['0', 'Baixa'], ['1', 'Normal'], ['2', 'Alta']].map(([v, l]) => `<button data-a="tax" data-n="${v}" class="${String(d.tx ?? 1) === v ? 'on' : ''}">${l}</button>`).join('')}</div><p class="note">Baixa: renda -30% e lealdade sobe. Alta: renda +35% e lealdade cai.</p>` : lockBox('build', 'Definir a taxa'));
    return h;
  }
  h += `<div class="kv"><div><small>Tropa</small><strong>${vis ? d.t : `${lo}-${hi}?`}</strong></div><div><small>Defesa</small><strong>${Math.round(ZT[S.M.type[i]].def * 100)}%</strong></div><div><small>Rende/dia</small><strong>${fmt(S.M.val[i] * (S.MD.inc[S.M.type[i]] || 1) * (S.MD.budget ? .4 : 1))}</strong></div></div>`;
  { const [cl, cc] = comLabel(comLevel(i)); h += `<p class="note" style="margin-top:-6px">Comércio <b style="color:${cc}">${cl.toLowerCase()}</b>. Se for sua, aumenta as vendas ${S.MD.shopIn}.${ZBONUS[S.M.type[i]] ? ' ' + ZBONUS[S.M.type[i]] : ''}</p>`; }
  if (!vis) h += `<p class="note">Sem informação exata da tropa. Mande um olheiro ou cumpra uma missão de vigiar.</p>`;
  if (!reach(i)) return h + `<p class="note">${truceWith(d.o) ? 'Você está em trégua com esse grupo.' : 'Fora de alcance. Domine uma zona vizinha primeiro.'}</p>`;
  if (!vis) h += can('crew') ? `<button class="ghost btn act" data-a="scout" ${g.acts && g.money >= 200 ? '' : 'disabled'}><span>Mandar olheiro<small>Mostra a tropa exata por 4 dias</small></span><em>${fmt(200)} · 1 ação</em></button>` : '';
  if (!can('attack')) return h + lockBox('attack');
  if (!g.reserve) return h + `<p class="note">Não há tropa livre na base. Compre um bonde no Comando ou recolha tropa de uma zona sua.</p>`;
  const need = Math.min(g.reserve, Math.max(1, Math.ceil(estDef(i) * 1.35 / (pq() * (sk('atk') ? 1.15 : 1)))));
  h += `<div class="atk"><div class="vs"><div><b id="amtv">${need}</b><small>seus ${S.MD.unit}</small></div><span>X</span><div><b>${vis ? d.t : '?'}</b><small>defendendo</small></div></div>
    <input type="range" id="amt" min="1" max="${g.reserve}" value="${need}" aria-label="Quantidade">
    <p class="sub" style="margin:2px 0 12px">Chance: <span class="odds" id="odds"></span>${vis ? '' : ' <span class="note">(estimativa)</span>'}</p>
    <button class="gold btn act" data-a="attack" ${g.acts >= 2 ? '' : 'disabled'}><span>${esc(S.MD.attackVerb)}</span><em>2 ações</em></button></div>`;
  return h;
}
function tabCmd() {
  const g = S.G, inc = pIncome(), up = upkeep();
  let h = finCard() + jailCard() + tutCard() + careerCard() + objCard() + buffList() + `<button class="ghost btn act" data-g="career"><span>Carreira e habilidades</span><em>abrir no celular</em></button>`;
  h += `<h4>Loja · sem ação</h4>`;
  h += can('crew') ? `<div class="shop"><button class="ghost" data-a="buy" data-n="sol">${I.sol}<span><b>${esc(S.MD.recruit[0])}</b><small>${esc(S.MD.recruit[1])}</small></span><em>${fmt(recruitCost())}</em></button>` +
    (can('attack') ? `<button class="ghost" data-a="buy" data-n="pis">${I.pis}<span><b>10 pistolas</b><small>Cada ${S.MD.u1} armado bate mais forte</small></span><em>${fmt(600)}</em></button><button class="ghost" data-a="buy" data-n="rif">${I.rif}<span><b>5 fuzis</b><small>O que mais pesa no confronto</small></span><em>${fmt(1800)}</em></button></div><p class="note">Poder da tropa: <b style="color:var(--g1)">x${pq().toFixed(2)}</b>. Sem arma 0,6, pistola 1,1, fuzil 1,8.</p>` : `</div>${lockBox('attack', 'Comprar armas')}`) : lockBox('crew');
  h += `<h4>Pressão: ${S.MD.heat.toLowerCase()} em ${Math.round(g.heat)}</h4>` + (can('market') ? `<button class="ghost btn act" data-a="bribe" ${g.heat <= 0 || !g.acts ? 'disabled' : ''}><span>${esc(S.MD.bribe)}</span><em>${fmt(bribeCost())} · 1 ação</em></button>` : lockBox('market', 'Fazer acertos'));
  h += `<h4>Finanças do dia</h4><ul class="rep" style="margin-top:0"><li><span>Entra</span><b style="color:var(--ok)">+${fmt(inc)}</b></li><li><span>Salários (${pTroops()} × R$ 8)</span><b style="color:var(--bad)">-${fmt(up)}</b></li><li><span>Saldo</span><b>${fmt(inc - up)}</b></li></ul>`;
  h += `<h4>Quem manda</h4><div class="legend"><div><i style="background:${S.MD.color}"></i><b>${esc(g.pname)}</b><span>${owned(0).length} zonas · x${pq().toFixed(2)}</span></div>
   ${g.f.map((f, k) => `<div class="${f.alive ? '' : 'dead'}"><i style="background:${f.color}"></i><span style="margin:0;color:var(--ink)">${esc(f.name)}<br><small class="note">${esc((f.pers || '') + (truceWith(k + 1) ? ' · em trégua' : ''))}</small></span><span>${owned(k + 1).length} zonas · x${f.q.toFixed(2)}</span></div>`).join('')}
   <div><i style="background:#1a1c21;border:1px solid #6c6f78"></i>Sem dono<span>${owned(-1).length}</span></div></div>`;
  return h;
}
function renderPanel() {
  const g = S.G, play = g.phase === 'play';
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#tabs').classList.toggle('hide', !play);
  const body = $('#pbody'), key = tab + '|' + S.sel + '|' + g.phase, st = body.dataset.key === key ? body.scrollTop : 0;
  body.innerHTML = play && tab === 'c' ? tabCmd() : tabZone();
  body.scrollTop = st; body.dataset.key = key;
  $('#pfoot').innerHTML = play ? `<button class="gold btn" data-a="endDay">Encerrar dia ${g.day}</button>` : '';
  $('#pfoot').classList.toggle('hide', !play);
  updOdds();
}
function updOdds() { const r = $('#amt'); if (!r || S.sel == null) return; $('#amtv').textContent = r.value; const [t, c] = odds(atkPow(+r.value) / estDef(S.sel)), o = $('#odds'); o.textContent = t; o.style.color = c; }

// ---------- gráfico de lucro ----------
function plChart(H, W = 320, Hh = 130) {
  if (!H.length) return '';
  const mx = Math.max(1, ...H.map(x => Math.abs(x.luc))), n = H.length, bw = W / n, z = Hh / 2;
  const cx = H.map(x => x.caixa), cmin = Math.min(...cx), cmax = Math.max(...cx), cy = v => Hh - 8 - (cmax === cmin ? .5 : (v - cmin) / (cmax - cmin)) * (Hh - 16);
  const bars = H.map((x, k) => { const hgt = Math.max(2, Math.abs(x.luc) / mx * (z - 6)); return `<rect x="${(k * bw + bw * .18).toFixed(1)}" y="${(x.luc >= 0 ? z - hgt : z).toFixed(1)}" width="${(bw * .64).toFixed(1)}" height="${hgt.toFixed(1)}" rx="2" fill="${x.luc >= 0 ? '#5fd48a' : '#ff5b4f'}"/>`; }).join('');
  const line = H.map((x, k) => `${k ? 'L' : 'M'}${(k * bw + bw / 2).toFixed(1)},${cy(x.caixa).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${Hh + 16}" style="width:100%;height:auto;display:block;background:#111b21;border:1px solid #233138;border-radius:12px;padding:6px" role="img" aria-label="Lucro por dia">
    <line x1="0" y1="${z}" x2="${W}" y2="${z}" stroke="rgba(255,255,255,.15)"/>${bars}<path d="${line}" fill="none" stroke="#f7dc8e" stroke-width="2"/>
    ${H.map((x, k) => (n <= 8 || k % 2 === n % 2 || k === n - 1) ? `<text x="${(k * bw + bw / 2).toFixed(1)}" y="${Hh + 12}" fill="#8696a0" font-size="10" text-anchor="middle" font-family="Barlow,sans-serif">${x.d}</text>` : '').join('')}</svg>
    <p class="note" style="margin:6px 0 0"><span style="color:#5fd48a">■</span> lucro <span style="color:#ff5b4f">■</span> prejuízo <span style="color:#f7dc8e">━</span> caixa</p>`;
}

// ---------- celular ----------
function threads() {
  const by = {}; for (const m of S.G.msgs) (by[m.c] = by[m.c] || []).push(m);
  return Object.entries(by).sort((a, b) => b[1][b[1].length - 1].id - a[1][a[1].length - 1].id);
}
function renderPhone() {
  const el = $('#phone'); el.classList.toggle('hide', !phone.open); if (!phone.open) return;
  const g = S.G, scr = $('#scr'), ur = unread(), sp = skillPoints();
  const sbar = `<div class="sbar"><span>Dia ${g.day}</span><span class="notch"></span><span>21:40 · 87%</span></div>`;
  let h = '';
  if (phone.app === 'home') {
    const app = (k, ic, bg, label, locked, badge) => `<button class="app ${locked ? 'locked' : ''}" data-app="${k}"><span class="ic" style="background:${bg}">${ic}</span>${label}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
    h = `<div class="home"><div class="clock">21:40</div><div class="date">Dia ${g.day} · ${esc(g.nick)}, ${esc(rankName())}</div><div class="apps">
      ${app('zap', I.zap, '#25d366', 'WhatsApp', false, ur)}${app('con', I.con, '#3b82f6', 'Contatos')}${app('mkt', I.mkt, '#d6a645', 'Mercado')}${app('fin', I.fin, '#0f9d58', 'Finanças')}
      ${app('car', I.car, '#a855f7', 'Carreira', false, sp > 0 ? sp : 0)}${app('nws', I.nws, '#e5484d', 'Notícias')}${app('map', I.map, '#1fa38a', 'Mapa')}</div>
      <div class="dock"><button data-g="phone" aria-label="Fechar celular"></button></div></div>`;
  } else if (phone.app === 'zap') {
    const th = threads();
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>WhatsApp</b><small>${ur ? ur + ' não lidas' : 'Conversas'}</small></div></div>
      <div class="abody clist">${th.length ? th.map(([c, ms]) => { const k = contactById(c), last = ms[ms.length - 1], n = ms.filter(m => !m.me && !m.read).length; return `<button data-chat="${esc(c)}"><span class="av" style="background:${avColor(c)}">${esc(initials(k.name))}</span><span class="mid"><b>${esc(k.name)}</b><span>${last.me ? 'Você: ' : ''}${esc(last.t)}</span></span><span class="rt">Dia ${last.d}${n ? `<i>${n}</i>` : ''}</span></button>`; }).join('') : '<p class="app-pad">Nenhuma conversa ainda.</p>'}</div>`;
  } else if (phone.app === 'chat') {
    const c = phone.chat, k = contactById(c), ms = g.msgs.filter(m => m.c === c); ms.forEach(m => { if (!m.me) m.read = 1; });
    let lastDay = 0, body = '';
    for (const m of ms) {
      if (m.d !== lastDay) { body += `<span class="day">Dia ${m.d}</span>`; lastDay = m.d; }
      body += `<div class="bub ${m.me ? 'out' : 'in'}">${m.who ? `<b class="who" style="color:${avColor(m.who)}">${esc(m.who)}</b>` : ''}${esc(m.t)}<time>${m.me ? '21:4' + (m.id % 10) : '21:3' + (m.id % 10)}</time></div>`;
      if (m.st === 'open') body += `<div class="opts">${m.opts.map((o, oi) => `<button data-a="ans" data-m="${m.id}" data-n="${oi}">${esc(o.l)}</button>`).join('')}</div>`;
      else if (m.st === 'expired') body += `<span class="exp">Sem resposta. A oportunidade passou.</span>`;
    }
    const riv = k.rival != null ? g.f[k.rival] : null;
    if (riv && riv.alive && can('boss')) body += `<div class="opts">${truceWith(k.rival + 1) ? `<span class="exp">Trégua até o dia ${riv.truce}.</span>` : `<button data-a="truce" data-n="${k.rival}" ${g.acts && g.money >= 2500 ? '' : 'disabled'}>Propor trégua de 7 dias (${fmt(2500)} · 1 ação)</button>`}</div>`;
    h = `<div class="ahead"><button class="back" data-app="zap" aria-label="Voltar">${I.back}</button><span class="av" style="background:${avColor(c)}">${esc(initials(k.name))}</span><div><b>${esc(k.name)}</b><small>${esc(k.role || 'online')}</small>${k.rival == null && S.MD.contacts.some(x => x.id === c) ? '<br>' + relBar(c) : ''}</div></div>
      <div class="abody chat" id="chatBody">${body || '<span class="day">Sem mensagens</span>'}</div>`;
  } else if (phone.app === 'con') {
    const av = contacts(), locked = S.MD.contacts.filter(c => g.rank < c.min);
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>Contatos</b><small>${av.length} liberados</small></div></div>
      <div class="abody clist">${av.map(c => `<button data-chat="${esc(c.id)}"><span class="av" style="background:${avColor(c.id)}">${esc(initials(c.name))}</span><span class="mid"><b>${esc(c.name)}</b><span>${esc(c.role)}${c.rival != null ? ' · ' + esc(S.G.f[c.rival].pers || '') : ''}</span>${c.rival == null ? relBar(c.id) : ''}</span></button>`).join('')}
      ${locked.map(c => `<button disabled><span class="av" style="background:#333">${I.lock}</span><span class="mid"><b>${esc(c.role)}</b><span>Libera no cargo ${esc(S.MD.ranks[c.min])}</span></span></button>`).join('')}
      ${g.rank < 5 ? `<button disabled><span class="av" style="background:#333">${I.lock}</span><span class="mid"><b>Chefes rivais</b><span>Libera no cargo ${esc(S.MD.ranks[5])}</span></span></button>` : ''}</div>`;
  } else if (phone.app === 'mkt') {
    const cm = can('market');
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>Mercado</b><small>Depósito ${stockTotal()} de ${storage()} · ${S.MD.shop}</small></div></div><div class="abody app-pad">`;
    h += cm ? `<button class="ghost btn act" data-a="auto" style="margin-bottom:12px"><span>Compra automática<small>Repõe o estoque quando o fornecedor está barato</small></span><em style="color:${g.auto ? 'var(--ok)' : 'var(--mu)'}">${g.auto ? 'ligada' : 'desligada'}</em></button>`
      : lockBox('market', 'Definir preço e comprar do fornecedor') + `<p class="note" style="margin-top:0">Por enquanto a firma vende a preço médio e compra no automático. Você acompanha os números.</p>`;
    h += S.MD.goods.map(gd => {
      const t = g.pt[gd.id], mood = g.mood[gd.id] || 1, [ml, mc] = moodLabel(mood), bp = gd.buy ? buyPrice(gd.id) : null, cost = g.cost[gd.id] || 0;
      const est = Math.round(demandFor(gd.id, t)), price = priceOf(gd.id), sold = Math.min(est, g.stock[gd.id]), estP = sold * (price - cost);
      const L = g.last[gd.id], tr = bp ? (bp > gd.buy * 1.05 ? '<span style="color:#ff9a52">▲ caro</span>' : bp < gd.buy * .95 ? '<span style="color:#5fd48a">▼ barato</span>' : 'normal') : '';
      return `<div class="good"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(gd.name)}</b><span class="chip" style="color:${mc}">${ml}</span></div>
        <div class="px">${bp ? `<span>Fornecedor <strong>${fmt(bp)}</strong> ${tr}</span>` : '<span>Chega pelas apreensões</span>'}<span>Seu custo <strong>${fmt(cost)}</strong></span><span>Estoque <strong>${g.stock[gd.id]}</strong> ${gd.unit}</span></div>
        <div class="seg tiers">${TIERS.map(([l], k) => `<button data-a="price" data-n="${gd.id}|${k}" class="${t === k ? 'on' : ''}" ${cm ? '' : 'disabled'}>${l}<small>${fmt(priceOf(gd.id, k))}</small></button>`).join('')}</div>
        <p class="note" style="margin:4px 0 8px">Vende por <b style="color:var(--ink)">${fmt(price)}</b>. Procura hoje: ~${est} ${gd.unit}${est > g.stock[gd.id] ? ` <span style="color:#ff9a52">(falta estoque)</span>` : ''} · Lucro estimado: <b style="color:${estP >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmt(estP)}</b>.</p>
        ${L ? `<p class="note" style="margin:0 0 8px">Ontem: vendeu ${L.sold} de ${L.dem} procurados · ${fmt(L.rev)} · lucro <b style="color:${L.rev - L.cost >= 0 ? 'var(--ok)' : 'var(--bad)'}">${fmt(L.rev - L.cost)}</b></p>` : ''}
        ${bp && cm ? `<div class="row"><button class="ghost" data-a="trade" data-n="buy|${gd.id}|10">+10 · ${fmt(bp * 10)}</button><button class="ghost" data-a="trade" data-n="buy|${gd.id}|50">+50 · ${fmt(bp * 50)}</button><button class="ghost" data-a="trade" data-n="buy|${gd.id}|100">+100</button></div>` : ''}</div>`;
    }).join('') + `<p class="note">Preço baixo vende mais e chama mais atenção. Preço alto lucra mais por unidade, mas vende menos. A procura muda todo dia, e zonas com rival do lado vendem 20% menos.</p></div>`;
  } else if (phone.app === 'fin') {
    const H = g.hist, L = H[H.length - 1], P = H[H.length - 2], last7 = H.slice(-7), avg = last7.length ? sum(last7.map(x => x.luc)) / last7.length : 0, best = H.length ? H.reduce((a, b) => b.luc > a.luc ? b : a) : null;
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>Finanças</b><small>Caixa ${fmt(g.money)}</small></div></div><div class="abody app-pad">`;
    if (!L) h += `<p class="note">Encerre o primeiro dia para ver o resultado. Aqui aparece o lucro e o prejuízo de cada dia.</p>`;
    else {
      const dv = P ? L.luc - P.luc : 0;
      h += `<div class="good"><small class="note">Resultado do dia ${L.d}</small><div style="font-family:var(--disp);font-size:40px;line-height:1.1;color:${L.luc >= 0 ? 'var(--ok)' : 'var(--bad)'}">${L.luc >= 0 ? '+' : ''}${fmt(L.luc)}</div>
        <p class="note" style="margin:2px 0 0">${P ? `${dv >= 0 ? '▲' : '▼'} ${fmt(Math.abs(dv))} em relação ao dia anterior · ` : ''}média de 7 dias ${fmt(avg)}${best ? ` · melhor dia: ${best.d} (${fmt(best.luc)})` : ''}</p></div>
        <h3>Lucro por dia</h3>${plChart(H.slice(-14))}
        <h3>Dia ${L.d} em detalhe</h3><ul class="rep" style="margin-top:0"><li><span>Vendas ${S.MD.shopIn}</span><b style="color:var(--ok)">+${fmt(L.ven)}</b></li><li><span>Custo da mercadoria</span><b style="color:var(--bad)">-${fmt(L.cmv)}</b></li><li><span>Arrecadação</span><b style="color:var(--ok)">+${fmt(L.arr)}</b></li><li><span>Salários</span><b style="color:var(--bad)">-${fmt(L.sal)}</b></li><li><span>Lucro</span><b>${fmt(L.luc)}</b></li><li><span>Comprou de estoque</span><b>${fmt(L.buys)}</b></li>${L.lost > 0 ? `<li><span>Deixou de vender (faltou mercadoria)</span><b style="color:#ff9a52">${fmt(L.lost)}</b></li>` : ''}</ul>
        <h3>Últimos dias</h3><ul class="rep" style="margin-top:0">${H.slice(-7).reverse().map(x => `<li><span>Dia ${x.d} · caixa ${fmt(x.caixa)}</span><b style="color:${x.luc >= 0 ? 'var(--ok)' : 'var(--bad)'}">${x.luc >= 0 ? '+' : ''}${fmt(x.luc)}</b></li>`).join('')}</ul>`;
    }
    h += '</div>';
  } else if (phone.app === 'car') {
    const nx = g.rank < 5 ? XP[g.rank + 1] : null;
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>Carreira</b><small>${g.xp} de respeito${nx ? ` · próximo cargo em ${nx}` : ''}</small></div></div><div class="abody app-pad">
      <h3>Cargos</h3>${S.MD.ranks.map((r, k) => `<div class="rank ${k < g.rank ? 'done' : k === g.rank ? 'cur' : ''}"><span class="n">${k + 1}</span><span><b>${esc(r)}</b><small>${esc(UNLOCK[k].label)} · ${XP[k]} de respeito</small></span></div>`).join('')}
      <h3>Habilidades · ${skillPoints()} ponto${skillPoints() === 1 ? '' : 's'}</h3>${SKILLS.map(s => { const have = sk(s.id), lockR = g.rank < s.min; return `<div class="skill ${have ? 'have' : ''}"><span><b>${esc(s.name)}</b><small>${esc(s.desc)}${lockR ? ` Libera em ${esc(S.MD.ranks[s.min])}.` : ''}</small></span>${have ? '<span class="chip">Ativa</span>' : `<button class="gold" data-a="skill" data-n="${s.id}" ${skillPoints() > 0 && !lockR ? '' : 'disabled'}>Pegar</button>`}</div>`; }).join('')}
      <h3>Conquistas · ${Object.keys(g.ach).length}/${ACH.length}</h3><div class="achs">${ACH.map(a => `<div class="ach ${g.ach[a.id] ? 'on' : ''}"><b>${esc(a.name)}</b>${esc(a.desc)}</div>`).join('')}</div></div>`;
  } else if (phone.app === 'nws') {
    h = `<div class="ahead"><button class="back" data-app="home" aria-label="Voltar">${I.back}</button><div><b>Notícias</b><small>Plantão da cidade</small></div></div>
      <div class="abody app-pad"><ul class="news">${g.log.slice(0, 50).map(l => `<li class="${l.c}"><b>Dia ${l.d}</b> · ${esc(l.t)}</li>`).join('')}</ul></div>`;
  }
  scr.innerHTML = sbar + h;
  const cb = $('#chatBody'); if (cb) cb.scrollTop = cb.scrollHeight;
}
function openPhone(app = 'home', chat = null) { phone = { open: true, app, chat }; sfx.click(); refresh(); }

// ---------- geral ----------
function refresh() {
  if (!S.G || $('#game').classList.contains('hide')) return;
  renderPhone(); renderHUD(); renderViews(); renderPanel(); MAP.paint();
}
function select(i) { S.sel = i; if (S.G && S.G.phase === 'play' && S.G.d[i].o !== 0) E.tut('look'); tab = 'z'; sfx.click(); $('#panel').classList.remove('min'); refresh(); }
function enterGame() {
  $('#menu').classList.add('hide'); $('#game').classList.remove('hide'); dq.length = 0; $('#dlg').classList.add('hide');
  phone.open = false; tab = 'z'; $('#panel').classList.remove('min');
  renderHUD(); renderViews(); renderPanel();
  requestAnimationFrame(() => MAP.initMap(select, () => { MAP.paint(); if (S.G.phase === 'play' && S.G.base != null) MAP.focusOn(S.sel ?? S.G.base, true); else MAP.fitAll(); }));
}
function toMenu() { saveGame(); dq.length = 0; $('#dlg').classList.add('hide'); $('#game').classList.add('hide'); $('#menu').classList.remove('hide'); renderMenu(); scrollTo(0, 0); }
function doEndDay() {
  newMsgs = 0; batching = true; const before = S.G.rank; const rep = endDay(); batching = false;
  if (S.G.over) { refresh(); return; }
  const n = unread();
  const L = S.G.lastPL, P = S.G.hist[S.G.hist.length - 2], dv = P ? L.luc - P.luc : 0;
  dq.unshift(`<h2>Relatório do dia ${S.G.day - 1}</h2>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:6px 0 4px"><div><small class="note">${L.luc >= 0 ? 'Lucro do dia' : 'Prejuízo do dia'}</small><div style="font-family:var(--disp);font-size:44px;line-height:1;color:${L.luc >= 0 ? 'var(--ok)' : 'var(--bad)'}">${L.luc >= 0 ? '+' : ''}${fmt(L.luc)}</div></div>
    ${P ? `<span class="chip" style="color:${dv >= 0 ? 'var(--ok)' : 'var(--bad)'}">${dv >= 0 ? '▲' : '▼'} ${fmt(Math.abs(dv))} vs ontem</span>` : ''}</div>
    ${S.G.hist.length > 1 ? plChart(S.G.hist.slice(-10), 320, 90) : ''}
    <p class="note">Caixa agora: <b style="color:var(--ink)">${fmt(S.G.money)}</b> · ${S.G.acts} ações para o dia ${S.G.day}</p>
    <ul class="rep">${rep.map(([c, t, v]) => `<li><span>${esc(t)}</span><b style="color:${c === 'good' ? 'var(--ok)' : 'var(--bad)'}">${esc(v)}</b></li>`).join('')}</ul>
    ${n ? `<div class="row"><button class="ghost btn" data-g="close">Ver o mapa</button><button class="gold btn" data-g="zapnow">${n} mensage${n > 1 ? 'ns' : 'm'} no celular</button></div>` : `<button class="gold btn" data-g="close">Começar dia ${S.G.day}</button>`}`);
  if ($('#dlg').classList.contains('hide')) nextDlg();
  if (n) sfx.ping();
  refresh();
}
function renderMenu() {
  $('#cards').innerHTML = Object.entries(MODES).map(([k, m]) => {
    const s = store.get(SAVE + k);
    return `<article class="card" style="--mc:${m.color}"><div class="top"><span class="chip">${esc(m.city)}</span>${s ? `<span class="chip">Dia ${s.day} · ${esc(m.ranks[s.rank])}</span>` : ''}</div>
    <h2>${m.name}</h2><p>${esc(m.blurb)}</p><div class="ladder">${m.ranks.map((r, i) => `<b>${esc(r)}</b>${i < 5 ? '<span>›</span>' : ''}`).join('')}</div>
    <div class="feats">${m.feats.map(f => `<span class="chip">${esc(f)}</span>`).join('')}</div>
    <div class="row">${s ? `<button class="gold btn" data-cont="${k}">Continuar · dia ${s.day}</button><button class="ghost btn" data-new="${k}">Nova partida</button>` : `<button class="gold btn" data-new="${k}">Jogar</button>`}</div></article>`;
  }).join('') + SOON.map(m => `<article class="card soon" style="--mc:${m.color}"><div class="top"><span class="chip">Em breve</span><span class="chip">${esc(m.city)}</span></div><h2>${m.name}</h2><p>${esc(m.blurb)}</p></article>`).join('');
  const saves = Object.keys(MODES).map(k => [k, store.get(SAVE + k)]).filter(x => x[1]);
  $('#conts').innerHTML = saves.map(([k, s]) => `<button class="gold btn" data-cont="${k}">Continuar ${MODES[k].name}<small>dia ${s.day}</small></button>`).join('') + `<button class="ghost btn" data-g="new">Nova partida<small>escolha o modo</small></button>`;
  $('#sndBtn').textContent = 'Som: ' + (sound ? 'ligado' : 'desligado');
  const recs = store.get('ddc.records') || [];
  $('#recs').innerHTML = recs.length ? `<h4 style="margin:6px 0 8px">Seus recordes</h4><ul class="rep" style="margin:0;text-align:left">${recs.slice(0, 5).map(r => `<li><span>${esc(MODES[r.mode]?.name || r.mode)} · ${esc(r.nick)} · ${r.win ? (r.end ? esc(r.end) : 'venceu') : 'caiu'} no dia ${r.day}</span><b style="color:var(--g1)">${r.score}</b></li>`).join('')}</ul>` : '';
  const J = mapsLoaded().rio;
  if (J) {
    const [a, b, c, d] = J.bounds, k = Math.cos((b + d) / 2 * Math.PI / 180), W = 1600, sc = W / ((c - a) * k), H = Math.round((d - b) * sc), pal = ['#e5484d', '#3b82f6', '#22a06b', '#a855f7'];
    const P = gm => gm.map(poly => poly.map(r => 'M' + r.map(([x, y]) => ((x - a) * k * sc).toFixed(1) + ',' + ((d - y) * sc).toFixed(1)).join('L') + 'Z').join('')).join('');
    $('#menuMap').setAttribute('viewBox', `0 0 ${W} ${H}`);
    $('#menuMap').innerHTML = `<rect x="-3000" y="-3000" width="8000" height="8000" fill="#05090d"/>${J.z.map((z, i) => `<path d="${P(z.g)}" fill="${(i * 7) % 5 < 2 ? pal[i % 4] : '#15171b'}" fill-opacity=".42" stroke="rgba(247,220,142,.35)" stroke-width="1"/>`).join('')}`;
  }
}
const HOW = `<h2>Como jogar</h2><ul class="rep txt">
 <li>Escolha a base e como você começa: do zero, no meio ou já no comando.</li>
 <li>Atacar gasta 2 ações. Zona recém-tomada rende metade por 3 dias, até a tropa se firmar.</li>
 <li>O celular é o centro do jogo. O chefe passa missões, os olheiros avisam de ataque, moradores pedem ajuda e contatos oferecem negócio. Cada resposta tem consequência.</li>
 <li>Cumprir missões e conquistar zonas dá respeito. Com respeito você sobe de cargo e libera novas funções: equipe, ataques, construções, mercado e diplomacia.</li>
 <li>Na visão Ataque do mapa, verde é alvo fácil e vermelho é suicídio. O que está apagado está fora de alcance.</li>
 <li>Lealdade alta faz o povo defender a zona. Lealdade baixa gera denúncia e revolta. Construções e taxa baixa ajudam.</li>
 <li>Os rivais planejam ataques um dia antes. Com olheiros ou câmeras, você é avisado e pode reforçar.</li>
 <li>O objetivo é dominar a cidade inteira, zona por zona.</li><li>Ao chegar em 40% do mapa (a partir do dia 12) vem a reta final: os rivais se unem contra você. Segure 35% e a sua base até o fim do cerco para quebrar a aliança. Rival quase sem território pode propor se render.</li><li>Cada zona tem espaços para construir. Negócios dão lucro, serviços são cobrados do morador com o preço que você escolher, e tudo pode subir até o nível 3.</li><li>Se um rival chegar a 65% do mapa, você perde.</li></ul><button class="gold btn" data-g="close">Entendi</button>`;

// ---------- eventos ----------
document.addEventListener('click', async e => {
  const t = e.target.closest('button,[data-g],[data-app-open]'); if (!t) return;
  const D = t.dataset;
  if (D.g) {
    const v = D.g;
    if (v === 'menu') return toMenu();
    if (v === 'close') return closeDlg();
    if (v === 'how') return dialog(HOW);
    if (v === 'new') return $('#cards').scrollIntoView({ behavior: 'smooth' });
    if (v === 'sound') { sound = !sound; store.set('ddc.sound', sound); $('#sndBtn').textContent = 'Som: ' + (sound ? 'ligado' : 'desligado'); if (S.G && !$('#game').classList.contains('hide')) renderHUD(); return; }
    if (v === 'phone') { phone.open = !phone.open; phone.app = 'home'; sfx.click(); return refresh(); }
    if (v === 'career') { closeDlg(); return openPhone('car'); }
    if (v === 'zapnow') { closeDlg(); return openPhone('zap'); }
  }
  if (t.closest('[data-app-open]') || D.appOpen) { return openPhone(t.closest('[data-app-open]')?.dataset.appOpen || D.appOpen); }
  if (D.app) { if (D.app === 'map') { phone.open = false; return refresh(); } if (D.app === 'mkt' && !can('market')) { phone.app = 'mkt'; return refresh(); } phone.app = D.app; sfx.click(); return refresh(); }
  if (D.chat) { phone.app = 'chat'; phone.chat = D.chat; sfx.click(); return refresh(); }
  if (D.new) { const k = D.new, s = store.get(SAVE + k); if (s) return dialog(`<h2>Começar de novo?</h2><p class="note">A partida de ${MODES[k].name} no dia ${s.day} será apagada.</p><div class="row"><button class="ghost btn" data-g="close">Cancelar</button><button class="gold btn" data-confirm="${k}">Começar nova</button></div>`); await newGame(k); setup = { rank: 0, nick: setup.nick }; return enterGame(); }
  if (D.confirm) { store.del(SAVE + D.confirm); closeDlg(); await newGame(D.confirm); setup = { rank: 0, nick: setup.nick }; return enterGame(); }
  if (D.cont) { if (await resume(D.cont)) enterGame(); return; }
  if (D.tab) { const p = $('#panel'); if (mob() && D.tab === tab && !p.classList.contains('min')) p.classList.add('min'); else { p.classList.remove('min'); tab = D.tab; } sfx.click(); return renderPanel(); }
  if (D.bcat) { bcat = D.bcat; sfx.click(); return renderPanel(); }
  if (D.view) { MAP.setView(D.view); sfx.click(); return renderViews(); }
  if (D.sel) { S.sel = +D.sel; if (S.G.phase === 'play' && S.G.d[S.sel].o !== 0) E.tut('look'); MAP.focusOn(S.sel, true); tab = 'z'; return refresh(); }
  if (D.z) { if (D.z === 'home') { if (S.G.base != null) MAP.focusOn(S.G.base, true); else MAP.fitAll(); } else MAP.zoom(D.z === 'in' ? 1 : -1); return; }
  if (D.rank != null && D.rank !== undefined && t.closest('.choice')) { setup.rank = +D.rank; setup.nick = $('#nick')?.value || setup.nick; sfx.click(); return renderPanel(); }
  if (!D.a || t.disabled || !S.G || S.G.over) return;
  const a = D.a;
  if (a === 'start') { if (S.sel == null || !canStart(S.sel)) return; setup.nick = $('#nick')?.value || ''; batching = true; startAt(S.sel, setup.rank, setup.nick); batching = false; sfx.win(); MAP.focusOn(S.sel, true); refresh(); setTimeout(() => { if (unread()) { result('Celular', 'Você tem mensagens novas. Toque no celular dourado.', 'good'); sfx.ping(); } }, 900); return; }
  if (a === 'endDay') return doEndDay();
  if (a === 'tutoff') { S.G.tut.off = 1; saveGame(); return refresh(); }
  if (a === 'ans') { answer(+D.m, +D.n); sfx.click(); return refresh(); }
  if (a === 'skill') { buySkill(D.n); return refresh(); }
  if (a === 'price') { const [id, t] = D.n.split('|'); A.price(id, t); saveGame(); return refresh(); }
  if (a === 'auto') { A.auto(); saveGame(); return refresh(); }
  if (a === 'trade') { const [op, id, q] = D.n.split('|'); A.trade(op, id, q); saveGame(); return refresh(); }
  if (a === 'attack') { A.attack(+($('#amt')?.value || 0)); saveGame(); return refresh(); }
  if (a === 'truce') { A.truce(+D.n); saveGame(); return refresh(); }
  if (A[a]) { A[a](D.n); saveGame(); refresh(); }
});
document.addEventListener('input', e => { if (e.target.id === 'amt') updOdds(); if (e.target.id === 'nick') setup.nick = e.target.value; });
addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#dlg').classList.contains('hide')) closeDlg(); else if (phone.open) { phone.open = false; refresh(); } } });
addEventListener('resize', () => { if (S.G && !$('#game').classList.contains('hide')) { renderHUD(); MAP.resize(); } });

(async () => {
  try { await loadMap('rio'); } catch (e) {}
  $('#loading').remove(); $('#menu').classList.remove('hide'); renderMenu();
})();
window.__DDC = { S, A, MAP, E, ST, endDay: doEndDay, refresh };
