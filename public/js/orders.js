// Pedidos com prazo: clientes encomendam carga (ou o chefe cobra dinheiro) até um dia certo.
// Você aceita, negocia prazo, corre atrás do estoque e entrega. Atrasar tem consequência.
import { S, R, RI, pick, clamp, fmt, can, msg, log, addRel, rel, addXP, emit, priceOf, buyPrice, storage, stockTotal, owned, saveGame, addKarma } from './engine.js';

const mode = () => S.G.mode;
const T = o => o[mode()] || o.default;
const goodOf = id => S.MD.goods.find(x => x.id === id);
const left = o => o.due - S.G.day;
const nm = c => (S.MD.contacts.find(x => x.id === c) || { name: c }).name;
export const orders = () => (S.G.ord || []).filter(o => o.st === 'active' || o.st === 'late');

function buyerFor() {
  if (mode() === 'policia') return can('market') ? 'politico' : 'chefe';
  return can('market') ? pick(['comprador', 'comprador', 'chefe']) : 'chefe';
}

function newOrder() {
  const g = S.G, c = buyerFor(), id = g.oid = (g.oid || 0) + 1;
  if (!can('market') || (c === 'chefe' && Math.random() < .35)) {
    // meta em dinheiro do chefe: serve para quem ainda não controla o mercado
    const q = Math.round((1500 + g.rank * 900 + g.day * 40) * R(.8, 1.3) / 100) * 100, due = g.day + RI(3, 5);
    const o = { id, d0: g.day, c: 'chefe', cash: 1, q, due, st: 'offer', rw: Math.round(q * .25 / 50) * 50 };
    g.ord.push(o);
    msg('chefe', T({
      policia: `O comando precisa fechar as contas. Preciso de ${fmt(q)} da sua unidade até o dia ${due}. Entregando no prazo, você ganha ${fmt(o.rw)} de verba extra e meu apoio.`,
      mafia: `La famiglia ha bisogno. Quero ${fmt(q)} na minha mesa até o dia ${due}. Cumpre a palavra e te devolvo ${fmt(o.rw)} e o meu respeito.`,
      default: `A firma tá precisando. Junta ${fmt(q)} pro caixa até o dia ${due}. Entregou no prazo, volta ${fmt(o.rw)} pra você e fica bem visto.`,
    }), [{ l: 'Pode contar comigo', k: 'ord', p: { a: 'ok', id } }, { l: 'Não consigo agora', k: 'ord', p: { a: 'no', id } }]);
    return;
  }
  const gds = S.MD.goods, gd = pick(gds), st = storage();
  const q = mode() === 'policia' ? Math.round(R(15, 40) / 5) * 5 + (S.G.stock.apreensao || 0) : Math.max(10, Math.round(st * R(.12, .32) / 5) * 5), unit = Math.round(priceOf(gd.id, 2) * R(1.25, 1.6)), due = g.day + RI(3, 5);
  const o = { id, d0: g.day, c, good: gd.id, q, unit, due, st: 'offer', ext: 0 };
  g.ord.push(o);
  const what = `${q} ${gd.unit} de ${gd.name.toLowerCase()}`;
  const txt = T({
    faccao: pick([`Tenho cliente grande da Zona Sul. Preciso de ${what} até o dia ${due}. Pago ${fmt(unit)} cada, bem acima da banca.`, `Vai ter evento grande no fim de semana. Me arruma ${what} até o dia ${due}? Pago ${fmt(unit)} cada.`, `Uns parceiros de São Paulo querem ${what}. Prazo: dia ${due}. ${fmt(unit)} a unidade.`]),
    milicia: pick([`Uma construtora quer ${what} para o canteiro até o dia ${due}. Pagam ${fmt(unit)} cada.`, `Condomínio novo fechou com a gente: ${what} até o dia ${due}, a ${fmt(unit)} cada.`, `Tenho um comerciante grande querendo ${what} até o dia ${due}. ${fmt(unit)} cada.`]),
    policia: pick([`A Secretaria quer ${q} lotes de material apreendido no leilão oficial até o dia ${due}. Pagam ${fmt(unit)} por lote.`, `Leilão especial da Receita: ${q} lotes até o dia ${due}, a ${fmt(unit)} cada. É bom para a imagem da unidade.`]),
    mafia: pick([`Un cliente di Napoli quer ${what} até o dia ${due}. Paga ${fmt(unit)} cada.`, `Tem um navio saindo para Marselha. Precisam de ${what} até o dia ${due}, a ${fmt(unit)} cada.`, `Os amigos de Nova York querem ${what}. Prazo: dia ${due}. ${fmt(unit)} cada.`]),
  });
  msg(c, txt, [
    { l: 'Fechado, entrego no prazo', k: 'ord', p: { a: 'ok', id } },
    { l: `Fechado, mas quero 30% adiantado`, k: 'ord', p: { a: 'adv', id } },
    { l: `Só consigo até o dia ${due + 2} (15% a menos)`, k: 'ord', p: { a: 'more', id } },
    { l: 'Não vai dar', k: 'ord', p: { a: 'no', id } },
  ]);
}

export function orderAnswer(m, o) {
  const g = S.G, p = o.p || {}, od = (g.ord || []).find(x => x.id === p.id);
  if (!od) return 'Deixa pra lá.';
  if (p.a === 'no') { od.st = 'gone'; addRel(od.c, -2); return pick(['Beleza, procuro outro.', 'Tranquilo. Fica pra próxima.', 'Que pena. Vou atrás de outro.']); }
  if (od.st === 'offer') {
    if (p.a === 'more') { od.due += 2; od.unit = Math.round(od.unit * .85); }
    if (p.a === 'adv') { if (rel(od.c) < 35) { od.st = 'active'; return 'Adiantado? Ainda não te conheço tão bem assim. Mas fechado sem adiantamento.'; } od.adv = Math.round(od.q * od.unit * .3); g.money += od.adv; g.extra = (g.extra || 0) + od.adv; }
    od.st = 'active';
    if (od.cash) return `Fechado. Até o dia ${od.due}. Não me deixa na mão.`;
    return (od.adv ? `Mandei ${fmt(od.adv)} de adiantamento. ` : '') + `Combinado: ${od.q} até o dia ${od.due}. Se atrasar, a gente vai ter problema.`;
  }
  if (p.a === 'ext' && od.st === 'active' && !od.ext) { od.ext = 1; od.due += 2; if (!od.cash) od.unit = Math.round(od.unit * .9); addRel(od.c, -6); return `Mais 2 dias, até o dia ${od.due}. ${od.cash ? 'É a última vez.' : 'Mas vou pagar 10% a menos.'}`; }
  if (p.a === 'sure') return pick(['Confio em você.', 'É assim que eu gosto.', 'Combinado então.']);
  if (p.a === 'late1' && od.st === 'late') { od.st = 'active'; od.due = g.day + 1; od.last = 1; if (!od.cash) od.unit = Math.round(od.unit * .75); addRel(od.c, -10); return `Até amanhã, então. ${od.cash ? 'Sem desculpa dessa vez.' : 'E com 25% de desconto pelo atraso.'}`; }
  if (p.a === 'cancel' && od.st === 'late') return fail(od, true);
  return 'Ok.';
}

function fail(od, told) {
  const g = S.G; od.st = 'fail'; addRel(od.c, told ? -15 : -22); g.stats.ordFail = (g.stats.ordFail || 0) + 1;
  let t = told ? 'Palavra quebrada. Vou lembrar disso.' : od.last ? 'Prometeu de novo e não cumpriu. Acabou o negócio com você por um tempo.' : 'Sumiu e não entregou. Vou lembrar disso.';
  if (od.adv) { const back = Math.round(od.adv * 1.5); g.money -= back; t += ` E vou descontar o adiantamento com juros: ${fmt(back)}.`; }
  if (od.cash || od.c === 'chefe') { addXP(-60); t += od.cash ? ' Perdeu pontos comigo.' : ''; }
  if ((mode() === 'faccao' || mode() === 'mafia') && !od.cash && Math.random() < .5) {
    const b = g.d[g.base], lost = Math.min(Math.max(0, b.t - 3), RI(2, 4));
    if (lost > 0) { b.t -= lost; t += mode() === 'mafia' ? ` Mandei uns amigos lembrarem você do acordo. ${lost} dos seus não voltaram para casa.` : ` Mandei cobrar: ${lost} dos seus tão fora de combate.`; log(`${nm(od.c)} cobrou o pedido não entregue: -${lost} na base.`, 'bad'); }
  }
  if (mode() === 'policia' || mode() === 'milicia') { g.heat = Math.min(100, g.heat + 10); }
  g.ordBan = g.day + 6;
  return t;
}

export function deliver(id) {
  const g = S.G, od = (g.ord || []).find(x => x.id === id); if (!od || (od.st !== 'active' && od.st !== 'late')) return;
  if (od.cash) {
    if (g.money < od.q) { emit('toast', 'Sem dinheiro', `Faltam ${fmt(od.q - g.money)} para fechar.`, 'bad'); return; }
    g.money -= od.q; g.money += od.rw; od.st = 'done'; addRel('chefe', 12); addXP(120); g.stats.orders = (g.stats.orders || 0) + 1;
    msg('chefe', T({ policia: `Recebido. Unidade exemplar. Liberei ${fmt(od.rw)} de verba extra.`, mafia: `Bravo. Quem cumpre a palavra sobe na família. Tome ${fmt(od.rw)}.`, default: `Chegou certinho. É disso que a firma precisa. Toma ${fmt(od.rw)} pra você.` })).read = 1;
    emit('sfx', 'cash'); emit('toast', 'Meta entregue', `+120 de respeito e ${fmt(od.rw)} de volta.`, 'good'); saveGame(); emit('change'); return;
  }
  const have = g.stock[od.good] || 0; if (have < od.q) { emit('toast', 'Falta carga', `Você tem ${have} de ${od.q}.`, 'bad'); return; }
  const early = left(od) >= 2 && !od.ext, val = Math.round(od.q * od.unit * (early ? 1.1 : 1)), got = val - (od.adv || 0);
  g.stock[od.good] -= od.q; g.money += got; g.extra = (g.extra || 0) + got; g.xcost = (g.xcost || 0) + od.q * (g.cost[od.good] || 0);
  od.st = 'done'; addRel(od.c, early ? 12 : 8); addXP(50 + Math.round(od.q / 4)); g.stats.orders = (g.stats.orders || 0) + 1;
  msg(od.c, (early ? `Antes do prazo! Coloquei 10% a mais. ` : '') + pick(['Mercadoria boa, entrega certa. Vamos fazer mais negócio.', 'Chegou tudo. Pode contar comigo pros próximos.', 'Perfeito. Já tô pensando no próximo pedido.'])).read = 1;
  emit('sfx', 'cash'); emit('toast', 'Pedido entregue', `+${fmt(got)}${early ? ' com bônus de pontualidade' : ''}.`, 'good'); saveGame(); emit('change');
}

// correr atrás: compra a parte que falta de um contato de fora, 40% mais caro, chega no dia seguinte
export const rushCost = od => { const miss = Math.max(0, od.q - (S.G.stock[od.good] || 0) - incoming(od.good)); return [miss, Math.round(miss * buyPrice(od.good) * 1.4)]; };
export const incoming = id => (S.G.inc || []).filter(x => x.id === id).reduce((a, x) => a + x.q, 0);
export function rush(id) {
  const g = S.G, od = (g.ord || []).find(x => x.id === id); if (!od || od.cash || !goodOf(od.good).buy) return;
  const [miss, cost] = rushCost(od);
  if (!miss) return; if (g.acts < 1) { emit('toast', 'Sem ações', 'Correr atrás da carga gasta 1 ação.', 'bad'); return; }
  if (g.money < cost) { emit('toast', 'Sem dinheiro', `Precisa de ${fmt(cost)}.`, 'bad'); return; }
  if (stockTotal() + incoming(od.good) + miss > storage() + 40) { emit('toast', 'Depósito cheio', 'Não cabe essa carga.', 'bad'); return; }
  g.money -= cost; g.acts -= 1; g.buys = (g.buys || 0) + cost;
  const late = Math.random() < .2;
  g.inc = g.inc || []; g.inc.push({ id: od.good, q: miss, day: g.day + (late ? 2 : 1), c: Math.round(cost / miss), late });
  emit('sfx', 'cash'); emit('toast', 'Correndo atrás', `${miss} ${goodOf(od.good).unit} a caminho. Chega amanhã cedo.`, 'good'); saveGame(); emit('change');
}

export function orderStart() {
  const g = S.G; g.ord = g.ord || [];
  // carga que estava a caminho
  for (const x of (g.inc || []).filter(x => x.day <= g.day)) {
    const st = g.stock[x.id] || 0; g.cost[x.id] = Math.round(((g.cost[x.id] || 0) * st + x.c * x.q) / (st + x.q)); g.stock[x.id] = st + x.q;
    msg(can('market') && S.MD.contacts.some(c => c.id === 'fornecedor') ? 'fornecedor' : 'braco', x.late ? `Desculpa o atraso, deu problema na estrada. Chegaram ${x.q} ${goodOf(x.id).unit}.` : `Chegou: ${x.q} ${goodOf(x.id).unit} no depósito.`, [], { quiet: 1 });
  }
  g.inc = (g.inc || []).filter(x => x.day > g.day);
  lateMsgs();
  // avisos de prazo
  for (const od of orders()) if (od.st === 'active' && left(od) === 1 && !od.warned) {
    od.warned = 1; const ok = od.cash ? g.money >= od.q : (g.stock[od.good] || 0) >= od.q;
    msg(od.c, od.cash ? `Amanhã é o dia. Os ${fmt(od.q)} tão separados?` : `Amanhã é o dia. Tá com os ${od.q} ${goodOf(od.good).unit} aí?`,
      [{ l: ok ? 'Tá garantido' : 'Tá garantido (ainda vou correr atrás)', k: 'ord', p: { a: 'sure', id: od.id } }].concat(od.ext ? [] : [{ l: 'Preciso de mais 2 dias', k: 'ord', p: { a: 'ext', id: od.id } }]));
  }
  // pedido novo
  const act = orders().length, ban = (g.ordBan || 0) > g.day;
  if (!ban && g.rank >= 1 && act < 2 && !(g.ord || []).some(o => o.st === 'offer' && o.due > g.day) && Math.random() < (act ? .14 : .3)) newOrder();
  g.ord = g.ord.filter(o => o.st === 'active' || o.st === 'late' || o.st === 'offer' || o.due >= g.day - 6);
}

export function orderEnd(rep) {
  const g = S.G;
  for (const od of g.ord || []) {
    if (od.st === 'offer') { od.st = 'gone'; continue; }
    if (od.st === 'late') { rep.push(['bad', `Pedido de ${nm(od.c)} não entregue`, 'cancelado']); msg(od.c, fail(od, false)); continue; }
    if (od.st === 'active' && g.day >= od.due) {
      if (od.last) { rep.push(['bad', `Pedido de ${nm(od.c)} não entregue`, 'cancelado']); msg(od.c, fail(od, false)); continue; }
      od.st = 'late'; od.lm = 1; addRel(od.c, -6); rep.push(['bad', `Pedido de ${nm(od.c)} atrasado`, `dia ${od.due}`]);
    }
  }
}
function lateMsgs() {
  const g = S.G;
  for (const od of g.ord || []) {
    if (od.st === 'late' && od.lm) {
      od.lm = 0;
      msg(od.c, od.cash ? `Era hoje e o dinheiro não veio. Me explica.` : pick([`Era hoje. Cadê os ${od.q}? Meu cliente tá me cobrando.`, `Passou o prazo e nada. Tô esperando.`, `Combinado era hoje. Vou ter que ouvir do meu cliente por sua causa.`]),
        [{ l: od.cash ? 'Amanhã sem falta' : 'Entrego amanhã (25% de desconto)', k: 'ord', p: { a: 'late1', id: od.id } }, { l: 'Não vai dar, desculpa', k: 'ord', p: { a: 'cancel', id: od.id } }]);
    }
  }
}
