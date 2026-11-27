// Dinâmica da cidade: histórias com escolhas (vários dias), eventos grandes,
// objetivos da semana, confiança dos contatos e personalidade dos rivais.
import {
  S, R, RI, pick, sum, clamp, fmt, owned, can, msg, log, addXP, addRel, rel, rankName, oname, intelAt, pTroops, emit, addBuf, arrest, underdog, sk, addKarma, kGood, kBad,
} from './engine.js';
import { orderStart, orderEnd } from './orders.js';
import { newsDay } from './news.js';
import { ZT } from './data.js';

const zn = i => S.M.z[i].n;
const W = () => S.MD.words;
const mode = () => S.G.mode;
const boss = () => can('crew') ? 'braco' : 'chefe';
const chief = () => S.G.rank < 5 ? 'chefe' : 'braco';
const alive = () => S.G.f.map((f, k) => k).filter(k => S.G.f[k].alive);
const rivalName = k => S.G.f[k].name;
function frontZone() {
  const g = S.G, c = owned(0).filter(i => S.M.adj[i].some(j => g.d[j].o > 0));
  return c.length ? pick(c) : null;
}
function enemyOf(z) { const g = S.G, n = S.M.adj[z].filter(j => g.d[j].o > 0); return n.length ? g.d[pick(n)].o : null; }
const NAMES = ['Biel', 'Cabeça', 'Marcão', 'Tuca', 'Neném', 'Russo', 'Gordinho', 'Dentinho', 'Baixinho', 'Paulão'];
const NAMES_IT = ['Totò', 'Nino', 'Pippo', 'Saro', 'Turi', 'Ciccio', 'Mimmo', 'Enzo'];
const NAMES_PM = ['Cabo Souza', 'Soldado Reis', 'Cabo Vidal', 'Soldado Nunes', 'Cabo Prado', 'Soldado Melo'];
const pickNames = n => { const L = mode() === 'mafia' ? NAMES_IT : mode() === 'policia' ? NAMES_PM : NAMES; return [...L].sort(() => Math.random() - .5).slice(0, n); };
const T = obj => obj[mode()] || obj.default;

// ---------------- histórias ----------------
// ---------------- histórias em cadeia ----------------
const cset = (id, v) => { const g = S.G; g.chain = g.chain || {}; g.chain[id] = v; g.chainDay = g.day; };
const cget = id => (S.G.chain || {})[id];
const cneed = (who, r, prev) => () => { const p = prev && prev.replace('!', ''); return rel(who) >= r && (!p || (cget(p) && !(prev.endsWith('!') && cget(p) === 'nao'))) && S.G.day - (S.G.chainDay || 0) >= 4; };
const reveal = (k, days) => owned(k + 1).forEach(i => { S.G.seen[i] = S.G.day + days; });
const allLoy = n => owned(0).forEach(i => { S.G.d[i].l = clamp(S.G.d[i].l + n, 0, 100); });
const strongest = () => { const a = alive().filter(k => owned(k + 1).length); return a.length ? a.sort((x, y) => owned(y + 1).length - owned(x + 1).length)[0] : null; };
const freeBuild = id => { const g = S.G, z = owned(0).find(i => g.d[i].b.length < ZT[S.M.type[i]].slots && !g.d[i].b.includes(id)); if (z == null) return null; g.d[z].b.push(id); g.d[z].lv = g.d[z].lv || {}; g.d[z].lv[id] = 1; return z; };
function betray(g, d) { const z = g.d[d.z]; if (z.o === 0 && d.z !== g.base && g.f[d.r].alive) { z.o = d.r + 1; z.t = Math.max(3, Math.round(z.t * .7)); z.l = 50; z.b = z.b.filter(() => Math.random() < .5); log(`Traição: ${zn(d.z)} passou para ${rivalName(d.r)}.`, 'bad'); S.flash = d.z; } }
const pay = (g, v) => { if (g.money < v) return false; g.money -= v; return true; };
const CH = (id, modes, who, r, prev, min, steps, init) => ({ id, modes, min, weight: 9, once: 1, need: cneed(who, r, prev), init: init || (d => { d.r = strongest(); d.z = owned(0).length ? pick(owned(0)) : null; return true; }), steps });
const ok = (say, k, v) => ({ say, end: 1, _c: [k, v] });
function chainStories() {
  const R1 = d => d.r != null ? rivalName(d.r) : 'os rivais';
  return [
    // ===== FACÇÃO: Fofão, o olheiro =====
    CH('fofao1', ['faccao'], 'olheiro', 45, null, 0, {
      a: { from: () => 'olheiro', text: () => 'Chefe, tem um carro prata rodando a base faz três noites. Mesmo horário, vidro fechado. Tô cabreiro.',
        opts: d => [
          { l: 'Segue o carro e me conta', fx: () => ({ say: 'Deixa comigo. Amanhã te falo.', next: 'b', delay: 1 }) },
          { l: 'Pega o motorista', fx(g) { g.heat = Math.min(100, g.heat + 8); addKarma(-4); addXP(40); if (d.r != null) reveal(d.r, 3); cset('fofao1', 'pega'); return { say: `Pegamos. Era cria de ${R1(d)}, contando a nossa tropa. Agora a gente sabe onde eles tão por uns dias.`, end: 1 }; } },
          { l: 'Deixa quieto', fx() { cset('fofao1', 'nada'); return { say: 'Tá bom, mas fico de olho.', end: 1 }; } },
        ] },
      b: { from: () => 'olheiro', text: d => `Era olheiro de ${R1(d)}. Tão contando a nossa tropa e anotando os horários.`,
        opts: d => [{ l: 'Bom trabalho, Fofão', fx(g) { if (d.r != null) reveal(d.r, 6); addXP(60); addRel('olheiro', 6); cset('fofao1', 'segue'); return { say: 'Anotei tudo deles também. Por uns dias você vê a tropa deles no mapa.', end: 1 }; } }] },
    }),
    CH('fofao2', ['faccao'], 'olheiro', 58, 'fofao1', 0, {
      a: { from: () => 'olheiro', text: () => 'Chefe, posso falar uma parada? Minha mãe quer que eu saia do morro pra estudar. Tem um curso técnico no Centro. Eu não queria deixar a firma na mão...',
        opts: () => [
          { l: `Eu pago o curso (${fmt(1500)})`, fx(g) { if (!pay(g, 1500)) return { say: 'Tá sem caixa? Relaxa, eu espero.', next: 'a', delay: 1 }; addKarma(10); addRel('olheiro', 15); cset('fofao2', 'curso'); return { say: 'Sério? Nunca vou esquecer isso, chefe. Continuo de olho pra você, de onde eu tiver.', end: 1 }; } },
          { l: 'Você fica. Preciso de você aqui', fx() { addKarma(-6); addRel('olheiro', -10); cset('fofao2', 'fica'); return { say: 'Entendi. Tô aqui então.', end: 1 }; } },
          { l: 'Pode ir, mas sem ajuda', fx() { addKarma(2); addRel('olheiro', -3); cset('fofao2', 'livre'); return { say: 'Valeu por liberar, chefe.', end: 1 }; } },
        ] },
    }),
    CH('fofao3', ['faccao'], 'olheiro', 50, 'fofao2', 0, {
      a: { from: () => 'olheiro', text: d => ({ curso: `Chefe, tô estagiando na prefeitura. Vi uma ordem no sistema: operação grande em ${zn(S.G.base)} nos próximos dias. Ninguém sabe que eu vi.`, fica: 'Chefe... me pegaram ontem na contenção. Tô na delegacia. Se não vier advogado, vão me apertar até eu falar.', livre: `Chefe, tô de motoboy agora. Mas vi um movimento estranho de ${R1(d)} perto das nossas áreas. Achei que você devia saber.` })[cget('fofao2')],
        opts: d => cget('fofao2') === 'curso' ? [
          { l: 'Espalha a tropa e esvazia a base', fx(g) { addBuf({ raid: 0 }, 5, 'Avisado pelo Fofão'); addXP(100); cset('fofao3', 'ok'); return { say: 'Quando eles chegarem, não vai ter nada lá. Fica tranquilo por uns dias.', end: 1 }; } },
        ] : cget('fofao2') === 'fica' ? [
          { l: `Manda o advogado (${fmt(2500)})`, fx(g) { if (!pay(g, 2500)) { g.heat = Math.min(100, g.heat + 20); cset('fofao3', 'falou'); return { say: 'Sem advogado... desculpa, chefe. Tive que falar alguma coisa.', end: 1 }; } addRel('olheiro', 20); addKarma(4); cset('fofao3', 'solto'); return { say: 'Tô na rua. Fechei a boca, como sempre.', end: 1 }; } },
          { l: 'Se vira, Fofão', fx(g) { g.heat = Math.min(100, g.heat + 25); addKarma(-8); addRel('olheiro', -30); cset('fofao3', 'falou'); return { say: '...', end: 1 }; } },
        ] : [
          { l: 'Valeu, Fofão. Se cuida', fx(g) { if (d.r != null) reveal(d.r, 6); addKarma(3); addXP(50); cset('fofao3', 'ok'); return { say: 'Tamo junto. Você vê eles no mapa por uns dias.', end: 1 }; } },
        ] },
    }),
    // ===== FACÇÃO: Dona Cida =====
    CH('cida1', ['faccao'], 'morador', 45, null, 3, {
      a: { from: () => 'morador', text: () => `Meu filho, o Wesley, tá devendo ${fmt(1200)} pra uns caras de fora da comunidade. Ameaçaram ele na porta de casa. Não sei mais a quem recorrer.`,
        opts: () => [
          { l: `Pagar a dívida (${fmt(1200)})`, fx(g) { if (!pay(g, 1200)) return { say: 'Sem caixa agora...', end: 1 }; addKarma(8); addRel('morador', 15); cset('cida1', 'pagou'); return { say: 'Deus te pague. A comunidade inteira vai saber.', end: 1 }; } },
          { l: 'Manda os caras virem falar comigo', fx(g) { addKarma(-2); g.heat = Math.min(100, g.heat + 5); addRel('morador', 8); addXP(40); cset('cida1', 'recado'); return { say: 'Os caras sumiram da área. Obrigada, mas fiquei com medo.', end: 1 }; } },
          { l: 'Não é problema meu', fx() { addKarma(-4); addRel('morador', -12); cset('cida1', 'nao'); return { say: 'Entendi.', end: 1 }; } },
        ] },
    }),
    CH('cida2', ['faccao'], 'morador', 55, 'cida1', 3, {
      a: { from: () => 'morador', text: () => `A creche da comunidade tá caindo aos pedaços. Com ${fmt(2500)} a gente reforma. O povo vai saber quem ajudou.`,
        opts: () => [
          { l: `Reformar a creche (${fmt(2500)})`, fx(g) { if (!pay(g, 2500)) return { say: 'Quando der, a gente conversa.', end: 1 }; const z = freeBuild('creche'); if (z != null) g.d[z].l = clamp(g.d[z].l + 10, 0, 100); addKarma(12); addXP(80); cset('cida2', 'creche'); return { say: z != null ? `Creche reformada em ${zn(z)}. As mães tão chorando de alegria.` : 'Reformada! O povo agradece.', end: 1 }; } },
          { l: `Reformar, com o nome da firma na fachada (${fmt(2500)})`, fx(g) { if (!pay(g, 2500)) return { say: 'Quando der, a gente conversa.', end: 1 }; freeBuild('creche'); addKarma(3); addXP(120); g.heat = Math.min(100, g.heat + 5); cset('cida2', 'nome'); return { say: 'Tá lá o nome, bem grande. Todo mundo vê.', end: 1 }; } },
          { l: 'Agora não dá', fx() { addRel('morador', -5); cset('cida2', 'nao'); return { say: 'Tudo bem. A gente se vira.', end: 1 }; } },
        ] },
    }),
    CH('cida3', ['faccao'], 'morador', 50, 'cida2', 3, {
      a: { from: () => 'morador', text: () => kBad() ? 'Vou ser sincera: o povo tá com medo de você. Ninguém fala, mas tão indo embora. Se continuar assim, não sobra comunidade.' : 'O povo quer fazer uma festa na quadra em sua homenagem. Churrasco, pagode e o morro inteiro lá.',
        opts: () => kBad() ? [
          { l: `Mudar o jeito: ajudar quem ficou (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) return { say: 'Palavra sem ajuda não muda nada.', end: 1 }; addKarma(25); allLoy(6); cset('cida3', 'mudou'); return { say: 'É um começo. O povo vai ver.', end: 1 }; } },
          { l: 'Medo também é respeito', fx() { addKarma(-5); allLoy(-5); addXP(60); cset('cida3', 'medo'); return { say: 'Que Deus tenha piedade de nós.', end: 1 }; } },
        ] : [
          { l: 'Vou lá', fx() { allLoy(8); addXP(120); addKarma(5); cset('cida3', 'festa'); return { say: 'Foi a maior festa que esse morro já viu. Todo mundo do seu lado.', end: 1 }; } },
          { l: 'Agradeço, mas prefiro ficar na minha', fx() { allLoy(4); cset('cida3', 'discreto'); return { say: 'Humilde. O povo gosta disso também.', end: 1 }; } },
        ] },
    }),
    // ===== MILÍCIA: Tonhão =====
    CH('tonhao1', ['milicia'], 'olheiro', 45, null, 0, {
      a: { from: () => 'olheiro', text: () => 'O Lessa da patrulha tá desviando botijão e vendendo por fora. Tenho foto e tudo.',
        opts: () => [
          { l: 'Expulsa o Lessa', fx() { addKarma(4); addRel('olheiro', 8); addXP(40); cset('tonhao1', 'expulsa'); return { say: 'Expulso. A patrulha entendeu o recado.', end: 1 }; } },
          { l: 'Desconta do salário dele', fx(g) { g.money += 600; cset('tonhao1', 'desconta'); return { say: `Descontado: ${fmt(600)} de volta pro caixa.`, end: 1 }; } },
          { l: 'Deixa ele. Eu fico com uma parte', fx(g) { g.money += 1200; addKarma(-6); cset('tonhao1', 'parte'); return { say: `Combinado. ${fmt(1200)} por fora.`, end: 1 }; } },
        ] },
    }),
    CH('tonhao2', ['milicia'], 'olheiro', 55, 'tonhao1', 0, {
      a: { from: () => 'olheiro', text: d => `Quero abrir um ponto de van meu em ${d.z != null ? zn(d.z) : 'uma das nossas áreas'}. Preciso de ${fmt(2000)} de sociedade e te passo metade do lucro.`,
        opts: () => [
          { l: `Entrar de sócio (${fmt(2000)})`, fx(g) { if (!pay(g, 2000)) return { say: 'Sem caixa, fica pra depois.', end: 1 }; g.rent = (g.rent || 0) + 180; addXP(50); cset('tonhao2', 'socio'); return { say: `Fechado. Vai render uns ${fmt(180)} por dia pra você.`, end: 1 }; } },
          { l: 'Pode abrir. Não cobro nada', fx() { addKarma(6); addRel('olheiro', 15); cset('tonhao2', 'livre'); return { say: 'Você é diferente dos outros. Não esqueço.', end: 1 }; } },
          { l: 'Van aqui é só da firma', fx() { addRel('olheiro', -8); cset('tonhao2', 'nao'); return { say: 'Tá certo. Entendi.', end: 1 }; } },
        ] },
    }),
    CH('tonhao3', ['milicia'], 'olheiro', 55, 'tonhao2', 0, {
      a: { from: () => 'olheiro', text: () => 'A Federal tá montando operação contra a gente. Delegado novo, Dr. Saulo. Dizem que ele aceita conversa.',
        opts: () => [
          { l: `Comprar o delegado (${fmt(4000)})`, fx(g) { if (!pay(g, 4000)) return { say: 'Sem os 4 mil, ele não senta pra conversar.', end: 1 }; addKarma(-8); addBuf({ raid: .3 }, 14, 'Delegado comprado'); cset('tonhao3', 'comprou'); return { say: 'Feito. Duas semanas de sossego.', end: 1 }; } },
          { l: 'Fechar os pontos por uns dias', fx(g) { addBuf({ dem: .5 }, 5, 'Pontos fechados'); g.heat = Math.max(0, g.heat - 30); cset('tonhao3', 'fechou'); return { say: 'Pontos fechados. Quando eles chegarem, não vão achar nada.', end: 1 }; } },
          { l: 'Pagar pra ver', fx(g) { g.heat = Math.min(100, g.heat + 20); cset('tonhao3', 'ver'); return { say: 'Então se prepara.', end: 1 }; } },
        ] },
    }),
    // ===== MILÍCIA: Dona Cida =====
    CH('mcida1', ['milicia'], 'morador', 45, null, 3, {
      a: { from: () => 'morador', text: () => 'Vai ter eleição na associação. O pessoal quer votar livre, sem ninguém de vocês na chapa.',
        opts: () => [
          { l: 'Eleição livre', fx() { addKarma(10); allLoy(5); addRel('morador', 10); cset('mcida1', 'livre'); return { say: 'O povo vai lembrar disso.', end: 1 }; } },
          { l: 'O nosso candidato ganha de qualquer jeito', fx() { addKarma(-10); addXP(60); addRel('morador', -10); addBuf({ raid: .8 }, 10, 'Associação na mão'); cset('mcida1', 'nosso'); return { say: 'Como você quiser.', end: 1 }; } },
        ] },
    }),
    CH('mcida2', ['milicia'], 'morador', 50, 'mcida1', 3, {
      a: { from: () => 'morador', text: () => 'Um prédio do loteamento rachou depois da chuva. Tem 12 famílias com medo de dormir lá dentro.',
        opts: () => [
          { l: `Pagar aluguel para as famílias (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) return { say: 'Sem esse dinheiro, as famílias ficam lá.', end: 1 }; addKarma(15); allLoy(4); cset('mcida2', 'ajudou'); return { say: 'As famílias estão seguras. Obrigada.', end: 1 }; } },
          { l: 'Manda o engenheiro dizer que tá tudo bem', fx(g) { addKarma(-12); g.heat = Math.min(100, g.heat + 10); cset('mcida2', 'mentiu'); return { say: 'Se cair, a culpa é de vocês.', end: 1 }; } },
          { l: 'Demolir e vender os lotes de novo', fx(g) { g.money += 2500; addKarma(-15); allLoy(-4); cset('mcida2', 'vendeu'); return { say: `${fmt(2500)} no caixa. E 12 famílias na rua.`, end: 1 }; } },
        ] },
    }),
    CH('mcida3', ['milicia'], 'morador', 40, 'mcida2', 3, {
      a: { from: () => 'morador', text: () => kBad() ? 'Gravaram um vídeo denunciando a taxa e o prédio. Tá rodando em todo grupo de WhatsApp da cidade.' : 'Os moradores fizeram um abaixo-assinado pedindo que a patrulha continue. Até o padre assinou.',
        opts: () => kBad() ? [
          { l: `Pagar um jornalista para abafar (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) { g.heat = Math.min(100, g.heat + 20); return { say: 'Sem dinheiro, o vídeo correu solto.', end: 1 }; } g.heat = Math.max(0, g.heat - 20); cset('mcida3', 'abafou'); return { say: 'Saiu do ar. Por enquanto.', end: 1 }; } },
          { l: 'Descobre quem gravou', fx(g) { addKarma(-10); g.heat = Math.min(100, g.heat + 10); allLoy(-5); cset('mcida3', 'cacou'); return { say: 'Achamos. Mas agora o bairro inteiro tem medo.', end: 1 }; } },
        ] : [
          { l: 'Agradecer pessoalmente na associação', fx() { allLoy(8); addBuf({ raid: .6 }, 10, 'Apoio dos moradores'); addXP(120); cset('mcida3', 'apoio'); return { say: 'O bairro tá com você.', end: 1 }; } },
        ] },
    }),
    // ===== POLÍCIA: Informante X =====
    CH('infx1', ['policia'], 'olheiro', 45, null, 0, {
      a: { from: () => 'olheiro', text: d => `Comandante, sei onde o chefe de ${R1(d)} dorme e onde eles guardam o material. Em troca quero sair da cidade com proteção.`,
        opts: d => [
          { l: `Fechado, você terá proteção (${fmt(1500)})`, fx(g) { if (!pay(g, 1500)) return { say: 'Sem garantia, sem informação.', end: 1 }; addKarma(4); if (d.r != null) reveal(d.r, 6); addXP(80); cset('infx1', 'protege'); return { say: 'Mandei tudo. Você vê a tropa deles no mapa por uns dias.', end: 1 }; } },
          { l: `Pago a informação e acabou (${fmt(800)})`, fx(g) { if (!pay(g, 800)) return { say: 'Sem dinheiro, sem conversa.', end: 1 }; addKarma(-3); if (d.r != null) reveal(d.r, 4); cset('infx1', 'pagou'); return { say: 'Tá aí. Boa sorte.', end: 1 }; } },
          { l: 'Não negocio com bandido', fx() { addRel('olheiro', -10); cset('infx1', 'nao'); return { say: 'Problema seu.', end: 1 }; } },
        ] },
    }),
    CH('infx2', ['policia'], 'olheiro', 40, 'infx1!', 0, {
      a: { from: () => 'olheiro', text: () => 'Comandante, descobriram que fui eu. Tão atrás de mim. Preciso entrar no programa de proteção hoje.',
        opts: () => [
          { l: `Colocar no programa (${fmt(2000)})`, fx(g) { if (!pay(g, 2000)) { addRel('olheiro', -20); cset('infx2', 'largou'); return { say: 'Sem verba... então é cada um por si.', end: 1 }; } addKarma(8); addRel('olheiro', 15); cset('infx2', 'protegido'); return { say: 'Tô seguro. Não vou esquecer.', end: 1 }; } },
          { l: 'Não é mais problema meu', fx() { addKarma(-10); addRel('olheiro', -30); cset('infx2', 'largou'); return { say: '...', end: 1 }; } },
        ] },
    }),
    CH('infx3', ['policia'], 'chefe', 0, 'infx2', 0, {
      a: { from: () => cget('infx2') === 'protegido' ? 'olheiro' : (can('crew') ? 'braco' : 'chefe'), text: d => cget('infx2') === 'protegido' ? `Do lugar seguro onde estou: a cúpula de ${R1(d)} vai se reunir amanhã. Todos no mesmo lugar.` : 'Comandante, o Informante X foi encontrado morto. A comunidade culpa a polícia.',
        opts: d => cget('infx2') === 'protegido' ? [
          { l: 'Montar a operação', fx(g) { if (d.r != null) owned(d.r + 1).forEach(i => { g.d[i].t = Math.max(1, Math.round(g.d[i].t * .6)); }); addXP(150); g.heat = Math.max(0, g.heat - 10); cset('infx3', 'cupula'); return { say: `Cúpula presa. ${R1(d)} perdeu 40% da tropa em todas as áreas.`, end: 1 }; } },
        ] : [
          { l: 'Assumir a responsabilidade', fx(g) { addKarma(6); allLoy(-3); g.heat = Math.min(100, g.heat + 10); cset('infx3', 'assumiu'); return { say: 'A imprensa caiu em cima, mas a comunidade respeitou.', end: 1 }; } },
          { l: 'Negar tudo', fx(g) { addKarma(-6); allLoy(-6); g.heat = Math.min(100, g.heat + 15); cset('infx3', 'negou'); return { say: 'Ninguém acreditou.', end: 1 }; } },
        ] },
    }),
    // ===== POLÍCIA: Dona Cida =====
    CH('pcida1', ['policia'], 'morador', 45, null, 3, {
      a: { from: () => 'morador', text: () => 'Comandante, os comerciantes reclamam que o soldado Paulo, da sua equipe, anda cobrando "taxa" deles.',
        opts: () => [
          { l: 'Afastar e mandar para a corregedoria', fx() { addKarma(10); addRel('braco', -5); allLoy(3); cset('pcida1', 'afastou'); return { say: 'Obrigada. Os comerciantes vão confiar mais na polícia.', end: 1 }; } },
          { l: 'Dar uma bronca e deixar', fx() { addKarma(-3); cset('pcida1', 'bronca'); return { say: 'Espero que pare.', end: 1 }; } },
          { l: 'Ele divide comigo', fx(g) { g.money += 800; addKarma(-12); cset('pcida1', 'divide'); return { say: 'Então é assim...', end: 1 }; } },
        ] },
    }),
    CH('pcida2', ['policia'], 'morador', 50, 'pcida1', 3, {
      a: { from: () => 'morador', text: () => `A quadra da comunidade pode virar um projeto de esporte. Falta ${fmt(2000)} em material.`,
        opts: () => [
          { l: `Bancar o material (${fmt(2000)})`, fx(g) { if (!pay(g, 2000)) return { say: 'Quando der.', end: 1 }; addKarma(8); g.d[g.base].l = clamp(g.d[g.base].l + 8, 0, 100); freeBuild('esporte'); cset('pcida2', 'bancou'); return { say: 'Projeto de pé! As crianças adoraram.', end: 1 }; } },
          { l: `Bancar e chamar a imprensa (${fmt(2000)})`, fx(g) { if (!pay(g, 2000)) return { say: 'Quando der.', end: 1 }; addKarma(3); addXP(80); g.heat = Math.max(0, g.heat - 10); freeBuild('esporte'); cset('pcida2', 'midia'); return { say: 'Saiu no jornal. Boa imagem para a unidade.', end: 1 }; } },
        ] },
    }),
    CH('pcida3', ['policia'], 'morador', 40, 'pcida2', 3, {
      a: { from: () => kBad() ? 'advogado' : 'morador', text: () => kBad() ? 'A corregedoria abriu investigação pelas denúncias da associação. Querem ouvir o senhor.' : 'A comunidade fez uma faixa: "Obrigado, polícia". A TV quer entrevistar o senhor.',
        opts: () => kBad() ? [
          { l: `Contratar defesa (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) { arrest(null, 3); return { say: 'Sem defesa, o senhor foi afastado.', end: 1 }; } cset('pcida3', 'defesa'); return { say: 'Arquivado. Por enquanto.', end: 1 }; } },
          { l: 'Me apresento e assumo', fx() { addKarma(10); arrest(null, 3); cset('pcida3', 'assumiu'); return { say: 'Afastado por uns dias. Mas de cabeça erguida.', end: 1 }; } },
        ] : [
          { l: 'Dar a entrevista', fx(g) { g.heat = Math.max(0, g.heat - 25); addXP(120); allLoy(6); cset('pcida3', 'tv'); return { say: 'Virou exemplo no jornal da noite.', end: 1 }; } },
        ] },
    }),
    // ===== MÁFIA: Peppino =====
    CH('pepp1', ['mafia'], 'olheiro', 45, null, 0, {
      a: { from: () => 'olheiro', text: () => 'Don, um jornalista do Giornale está fotografando o restaurante todo dia.',
        opts: () => [
          { l: 'Convidar para jantar e conversar', fx(g) { addKarma(3); g.heat = Math.max(0, g.heat - 5); cset('pepp1', 'jantar'); return { say: 'Jantou, bebeu e escreveu sobre a comida. Bravo.', end: 1 }; } },
          { l: 'Mandar quebrar a câmera', fx(g) { addKarma(-6); g.heat = Math.min(100, g.heat + 8); cset('pepp1', 'camera'); return { say: 'Câmera quebrada. Ele entendeu.', end: 1 }; } },
          { l: 'Ignorar', fx(g) { g.heat = Math.min(100, g.heat + 5); cset('pepp1', 'nada'); return { say: 'Come vuole.', end: 1 }; } },
        ] },
    }),
    CH('pepp2', ['mafia'], 'olheiro', 55, 'pepp1', 0, {
      a: { from: () => 'olheiro', text: d => `Don... me apaixonei pela filha de um homem de ${R1(d)}. Ela também gosta de mim. Quero casar.`,
        opts: d => [
          { l: 'Benedico. Que seja uma ponte', fx(g) { if (d.r != null) g.f[d.r].truce = g.day + 12; addKarma(8); addRel('olheiro', 15); cset('pepp2', 'bencao'); return { say: `Grazie, Don! ${R1(d)} aceitou uma trégua de 12 dias pelo casamento.`, end: 1 }; } },
          { l: 'Mai! Esquece essa moça', fx() { addRel('olheiro', -15); cset('pepp2', 'proibiu'); return { say: 'Sì, Don...', end: 1 }; } },
          { l: 'Casa, e me conta tudo da família dela', fx(g) { if (d.r != null) reveal(d.r, 10); addKarma(-6); cset('pepp2', 'espiao'); return { say: 'Farei o que o senhor mandar.', end: 1 }; } },
        ] },
    }),
    CH('pepp3', ['mafia'], 'olheiro', 0, 'pepp2', 0, {
      a: { from: () => 'olheiro', text: d => ({ bencao: `O casamento foi lindo, Don. O pai dela diz que ${R1(d)} quer conversar sobre dividir Palermo.`, proibiu: `Don, perdão. Fugi com ela. ${R1(d)} acha que foi ordem sua.`, espiao: `Don, descobri onde ${R1(d)} guarda o dinheiro.` })[cget('pepp2')],
        opts: d => cget('pepp2') === 'bencao' ? [
          { l: 'Aceitar a parceria', fx(g) { if (d.r != null) g.f[d.r].truce = g.day + 20; g.rent = (g.rent || 0) + 300; addKarma(6); cset('pepp3', 'parceria'); return { say: `Parceria fechada: 20 dias de paz e ${fmt(300)} por dia em negócios juntos.`, end: 1 }; } },
          { l: 'Usar a festa para atacar', fx(g) { if (d.r != null) { owned(d.r + 1).forEach(i => { g.d[i].t = Math.max(1, Math.round(g.d[i].t * .7)); }); g.f[d.r].truce = 0; } addKarma(-20); addRel('olheiro', -30); cset('pepp3', 'traiu'); return { say: 'Eles perderam 30% da tropa. E Peppino nunca mais olhou nos seus olhos.', end: 1 }; } },
        ] : cget('pepp2') === 'proibiu' ? [
          { l: 'Mandar um presente ao pai dela', fx(g) { if (!pay(g, 1500)) { if (d.r != null) g.f[d.r].money += 2000; return { say: 'Sem presente, eles estão se armando.', end: 1 }; } addKarma(4); cset('pepp3', 'presente'); return { say: 'O presente acalmou os ânimos.', end: 1 }; } },
          { l: 'Que venham', fx(g) { if (d.r != null) { g.f[d.r].money += 2500; g.f[d.r].truce = 0; } cset('pepp3', 'guerra'); return { say: 'Eles estão se armando.', end: 1 }; } },
        ] : [
          { l: 'Buscar o dinheiro', fx(g) { g.money += 3500; g.extra = (g.extra || 0) + 3500; addKarma(-5); cset('pepp3', 'cofre'); return { say: `${fmt(3500)} da família deles, agora nossos.`, end: 1 }; } },
        ] },
    }),
    // ===== MÁFIA: Padre Ignazio =====
    CH('padre1', ['mafia'], 'morador', 45, null, 3, {
      a: { from: () => 'morador', text: () => 'Don, as irmãs da padaria do convento não conseguem pagar o pizzo. Peço caridade, em nome de Deus.',
        opts: () => [
          { l: 'Perdoar as irmãs', fx() { addKarma(8); addRel('morador', 12); cset('padre1', 'perdoou'); return { say: 'Que Deus abençoe a sua casa.', end: 1 }; } },
          { l: 'Todos pagam, padre', fx(g) { g.money += 500; addKarma(-8); addRel('morador', -10); cset('padre1', 'cobrou'); return { say: 'Rezarei por você.', end: 1 }; } },
        ] },
    }),
    CH('padre2', ['mafia'], 'morador', 50, 'padre1', 3, {
      a: { from: () => 'morador', text: () => `Festa de Santa Rosalia: a família que carrega o andor ganha o respeito de Palermo. São ${fmt(3000)} em doações.`,
        opts: () => [
          { l: `Carregar o andor (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) return { say: 'Fica para o ano que vem.', end: 1 }; allLoy(6); addKarma(6); addXP(80); cset('padre2', 'andor'); return { say: 'Palermo inteira viu a sua família na procissão.', end: 1 }; } },
          { l: `Doar em silêncio (${fmt(3000)})`, fx(g) { if (!pay(g, 3000)) return { say: 'Fica para o ano que vem.', end: 1 }; allLoy(4); addKarma(10); cset('padre2', 'silencio'); return { say: 'Deus vê o que os homens não veem.', end: 1 }; } },
        ] },
    }),
    CH('padre3', ['mafia'], 'morador', 40, 'padre2', 3, {
      a: { from: () => 'morador', text: () => kBad() ? 'Don, não posso mais calar. Na missa de domingo vou falar contra a violência da sua família.' : 'Na missa de domingo, falei da generosidade da sua família. A cidade inteira ouviu.',
        opts: () => kBad() ? [
          { l: 'Respeito a sua palavra, padre', fx(g) { addKarma(15); g.heat = Math.min(100, g.heat + 5); cset('padre3', 'respeitou'); return { say: 'Talvez ainda haja esperança para você.', end: 1 }; } },
          { l: 'Salvo, vá conversar com o padre', fx(g) { addKarma(-15); addRel('morador', -40); g.heat = Math.min(100, g.heat + 20); cset('padre3', 'ameacou'); return { say: 'O padre foi transferido para longe. Palermo inteira comentou.', end: 1 }; } },
        ] : [
          { l: 'Grazie, padre', fx(g) { allLoy(8); g.heat = Math.max(0, g.heat - 15); cset('padre3', 'missa'); return { say: 'Que a paz esteja com a sua família.', end: 1 }; } },
        ] },
    }),
  ];
}

const STORIES = [
  {
    id: 'x9', min: 0, weight: 3,
    init(d) { const k = alive(); if (!k.length) return false; d.r = pick(k); d.sus = pickNames(2); d.guilty = RI(0, 1); return true; },
    steps: {
      a: {
        from: () => boss(),
        text: d => T({
          faccao: `Toda vez que a gente se mexe, ${rivalName(d.r)} já sabe antes. Tem X9 entre nós.`,
          milicia: `Alguém tá passando as nossas rotas para ${rivalName(d.r)}. Tem informante aqui dentro.`,
          policia: `As operações estão vazando. Alguém da equipe passa informação para ${rivalName(d.r)}.`,
          mafia: `C'è una talpa. ${rivalName(d.r)} sabe de tudo que a família planeja.`,
        }),
        opts: d => [
          { l: `Investigar (${fmt(500)})`, fx(g) { if (g.money < 500) return { say: 'Sem dinheiro não dá pra investigar.', end: 1 }; g.money -= 500; return { say: 'Vou ficar de olho. Amanhã te passo os nomes.', next: 'b', delay: 1 }; } },
          { l: 'Deixa pra lá', fx(g) { g.leak = g.day + 4; return { say: 'Depois não reclama quando eles chegarem sabendo de tudo.', end: 1 }; } },
        ],
        timeout(g) { g.leak = g.day + 4; },
      },
      b: {
        from: () => 'olheiro',
        text: d => `Fiquei na cola. Desconfio do ${d.sus[0]} ou do ${d.sus[1]}. Os dois andam com dinheiro que não é daqui.`,
        opts: d => [
          { l: `É o ${d.sus[0]}`, fx: g => guess(g, d, 0) },
          { l: `É o ${d.sus[1]}`, fx: g => guess(g, d, 1) },
          { l: `Armar uma armadilha (${fmt(800)})`, fx(g) { if (g.money < 800) return { say: 'Sem caixa pra armadilha. Escolhe um.', next: 'b', delay: 0 }; g.money -= 800; return { say: 'Vou soltar uma informação falsa pra cada um. Amanhã a gente sabe.', next: 'c2', delay: 1 }; } },
        ],
        timeout(g) { g.leak = g.day + 3; },
      },
      c2: {
        from: () => 'olheiro',
        text: d => `A informação falsa que eu dei pro ${d.sus[d.guilty]} chegou em ${rivalName(d.r)}. É ele.`,
        opts: () => [{ l: 'Resolver isso', fx: () => ({ next: 'c', delay: 0 }) }],
      },
      c: {
        from: () => chief(),
        text: d => `E agora, o que a gente faz com o ${d.sus[d.guilty]}?`,
        opts: d => [
          { l: 'Expulsar da cidade', fx(g) { addRel('braco', 5); addXP(50); return { say: `O ${d.sus[d.guilty]} pegou as coisas e sumiu. Ninguém vai sentir falta.`, end: 1 }; } },
          { l: 'Usar como agente duplo', fx(g) { g.double = g.day + 7; addXP(70); return { say: `Agora ele passa para ${rivalName(d.r)} o que a gente quiser. E conta pra gente tudo que eles planejam.`, end: 1 }; } },
          mode() === 'policia'
            ? { l: 'Entregar à corregedoria', fx(g) { g.heat = Math.max(0, g.heat - 15); addRel('chefe', 8); addXP(50); return { say: 'Afastado e investigado. A imprensa gostou.', end: 1 }; } }
            : { l: `Entregar pr${mode() === 'mafia' ? 'os' : 'os'} ${W().cops}`, fx(g) { g.heat = Math.max(0, g.heat - 10); addRel('chefe', -6); addXP(30); return { say: 'Resolveu, mas teve gente que não gostou de ver você entregando alguém.', end: 1 }; } },
        ],
      },
    },
  },
  {
    id: 'festa', min: 0, max: 4, weight: 2,
    init(d) { d.z = frontZone(); return true; },
    steps: {
      a: {
        from: () => 'chefe',
        text: () => T({
          faccao: 'Sábado é o aniversário de 15 anos da minha filha. Quero tudo do bom. Tu organiza pra mim?',
          milicia: 'Meu filho vai casar. Preciso de alguém de confiança cuidando da festa e da segurança.',
          policia: 'Vai ter a cerimônia de troca de comando. Preciso de alguém cuidando da organização e da segurança.',
          mafia: 'Mia figlia si sposa. Voglio una festa che la Sicilia non dimentica. Conto com você.',
        }),
        opts: () => [
          { l: `Deixa comigo, faço tudo (${fmt(2500)})`, fx(g) { if (g.money < 2500) return { say: 'Pelo visto o caixa não aguenta. Ajuda com o que der então.', next: 'a', delay: 0 }; g.money -= 2500; addRel('chefe', 15); addXP(60); return { say: 'É disso que eu gosto. Não vou esquecer.', next: 'b', delay: 1 }; } },
          { l: `Ajudo com o que der (${fmt(1000)})`, fx(g) { if (g.money < 1000) return { say: 'Nem isso? Tá bom.', end: 1 }; g.money -= 1000; addRel('chefe', 5); addXP(25); return { say: 'Valeu. Já ajuda.', next: 'b', delay: 1 }; } },
          { l: 'Não vou poder', fx() { addRel('chefe', -10); return { say: 'Anotado.', end: 1 }; } },
        ],
        timeout() { addRel('chefe', -8); },
      },
      b: {
        skip: d => d.z == null || S.G.d[d.z].o !== 0 || enemyOf(d.z) == null,
        from: () => 'olheiro',
        text: d => { d.e = enemyOf(d.z); return `No meio da festa: ${oname(d.e)} tá juntando gente perto de ${zn(d.z)}. Vão aproveitar que geral tá aqui.`; },
        opts: d => [
          { l: `Sair da festa e reforçar ${zn(d.z)}`, fx(g) { const n = can('crew') ? Math.min(12, g.reserve) : 8; if (can('crew')) g.reserve -= n; g.d[d.z].t += n; addRel('chefe', -3); addXP(20); return { say: `${n} ${S.MD.unit} a caminho de ${zn(d.z)}. A festa segue sem você.`, end: 1 }; } },
          { l: 'Ficar na festa', fx(g) { const a = S.M.adj[d.z].filter(j => g.d[j].o === d.e).sort((x, y) => g.d[y].t - g.d[x].t)[0]; if (a != null) g.plans.push({ o: d.e, a, b: d.z, bonus: 1.15 }); addRel('chefe', 6); return { say: 'O chefe adorou te ver lá. Tomara que a turma segure.', end: 1 }; } },
        ],
      },
    },
  },
  {
    id: 'arrego', min: 2, weight: 2, modes: ['faccao', 'milicia', 'mafia'],
    init: () => true,
    steps: {
      a: {
        from: () => 'advogado',
        text: () => T({
          faccao: `Um ${W().cops === 'os homens' ? 'policial' : 'agente'} me procurou. Quer ${fmt(1500)} por semana pra não incomodar as bancas.`,
          milicia: `Um delegado mandou recado: ${fmt(1500)} por semana e a investigação anda devagar.`,
          mafia: `Un maresciallo dei Carabinieri vuole ${fmt(1500)} a settimana. Em troca, faz vista grossa.`,
        }),
        opts: () => [
          { l: `Pagar ${fmt(1500)} por semana`, fx(g) { g.arrego = { from: g.day, until: g.day + 21 }; return { say: 'Combinado. Toda semana sai do caixa.', end: 1 }; } },
          { l: 'Recusar', fx(g) { g.cops = g.day + 7; return { say: 'Ele não gostou. Se prepara que vai ter mais operação essa semana.', end: 1 }; } },
          { l: `Gravar a conversa e expor (${fmt(800)})`, fx(g) { if (g.money < 800) return { say: 'Sem dinheiro pra montar isso.', end: 1 }; g.money -= 800; if (Math.random() < .5) { g.heat = Math.max(0, g.heat - 25); addXP(80); return { say: 'A gravação vazou na TV. Ele foi afastado e a pressão caiu.', end: 1 }; } g.heat = Math.min(100, g.heat + 20); g.cops = g.day + 7; return { say: 'Ele desconfiou e não falou nada comprometedor. Agora tá com raiva.', end: 1 }; } },
        ],
        timeout(g) { g.cops = g.day + 5; },
      },
    },
  },
  {
    id: 'corrupto', min: 1, weight: 2, modes: ['policia'],
    init(d) { const k = alive(); if (!k.length) return false; d.r = pick(k); d.n = pickNames(1)[0]; return true; },
    steps: {
      a: {
        from: () => boss(),
        text: d => `O ${d.n} recebe de ${rivalName(d.r)}. Me ofereceu uma parte pra eu ficar quieto.`,
        opts: d => [
          { l: 'Denunciar à corregedoria', fx(g) { g.heat = Math.max(0, g.heat - 15); addRel('chefe', 10); addXP(50); const z = owned(0)[0]; if (z != null) g.d[z].t = Math.max(1, g.d[z].t - 3); return { say: `${d.n} afastado. A imprensa elogiou a equipe.`, end: 1 }; } },
          { l: 'Fingir que aceita e investigar', fx() { return { say: 'Vou jogar o jogo dele e anotar tudo.', next: 'b', delay: 2 }; } },
          { l: 'Ignorar', fx(g) { g.leak = g.day + 5; return { say: 'Entendido.', end: 1 }; } },
        ],
      },
      b: {
        from: () => 'olheiro',
        text: d => `Seguindo o ${d.n}, achei onde ${rivalName(d.r)} guarda as coisas e quando eles se mexem.`,
        opts: d => [{ l: 'Usar a informação', fx(g) { g.double = g.day + 7; g.stock.apreensao = (g.stock.apreensao || 0) + 25; addXP(90); return { say: 'Apreensão feita e a rota deles mapeada pra semana toda.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'guerra', min: 3, weight: 2,
    init(d) { const k = alive(); if (k.length < 2) return false; const s = [...k].sort(() => Math.random() - .5); d.a = s[0]; d.b = s[1]; return true; },
    steps: {
      a: {
        from: () => 'olheiro',
        text: d => mode() === 'policia'
          ? `${rivalName(d.a)} e ${rivalName(d.b)} entraram em guerra. Um informante dos dois lados oferece entregar o outro.`
          : `${rivalName(d.a)} e ${rivalName(d.b)} entraram em guerra. Os dois querem comprar arma da gente.`,
        opts: d => mode() === 'policia' ? [
          { l: `Ajudar a enfraquecer ${rivalName(d.a)}`, fx(g) { g.war = { a: d.a, b: d.b, until: g.day + 5, w: d.a }; addXP(40); return { say: 'Feito. Eles vão se matar de briga e a gente colhe depois.', end: 1 }; } },
          { l: 'Deixar eles se desgastarem', fx(g) { g.war = { a: d.a, b: d.b, until: g.day + 5 }; return { say: 'Melhor assim. Vamos ficar de olho.', end: 1 }; } },
        ] : [
          { l: `Vender para ${rivalName(d.a)} (${fmt(2500)})`, fx(g) { g.money += 2500; g.war = { a: d.a, b: d.b, until: g.day + 5, w: d.a }; addXP(40); return { say: 'Arma entregue. Agora é com eles.', end: 1 }; } },
          { l: `Vender para os dois (${fmt(4500)})`, fx(g) { g.money += 4500; g.war = { a: d.a, b: d.b, until: g.day + 5 }; addXP(40); if (Math.random() < .35) { g.hate = g.day + 6; return { say: 'Descobriram que você vendeu para os dois. Agora os dois querem a sua cabeça.', end: 1 }; } return { say: 'Ninguém desconfiou. Dinheiro no bolso e eles se enfraquecendo.', end: 1 }; } },
          { l: 'Ficar fora', fx(g) { g.war = { a: d.a, b: d.b, until: g.day + 5 }; return { say: 'Melhor. Deixa eles brigarem.', end: 1 }; } },
        ],
        timeout(g, d) { g.war = { a: d.a, b: d.b, until: g.day + 5 }; },
      },
    },
  },
  {
    id: 'jornalista', min: 1, weight: 2,
    init: () => true,
    steps: {
      a: {
        from: () => can('build') ? 'advogado' : 'chefe',
        text: () => `Tem um jornalista fazendo uma matéria grande sobre ${S.G.pname}. Vai sair essa semana.`,
        opts: () => [
          { l: `Pagar pra ele esquecer (${fmt(2000)})`, fx(g) { if (g.money < 2000) return { say: 'Não tem caixa pra isso.', next: 'a', delay: 0 }; g.money -= 2000; if (Math.random() < .6) { g.heat = Math.max(0, g.heat - 10); return { say: 'Matéria engavetada.', end: 1 }; } g.heat = Math.min(100, g.heat + 15); return { say: 'Ele publicou a tentativa de suborno. Pegou mal.', end: 1 }; } },
          { l: mode() === 'policia' ? 'Dar entrevista mostrando resultados' : 'Mostrar o que a gente faz pelo povo', fx(g) { const social = owned(0).some(i => (g.d[i].b || []).some(b => /social|esporte|chiesa|associacao|baile|saude/.test(b))); if (social || mode() === 'policia') { g.heat = Math.max(0, g.heat - 15); owned(0).forEach(i => { g.d[i].l = clamp(g.d[i].l + 5, 0, 100); }); addXP(50); return { say: 'A matéria saiu falando bem do trabalho com a comunidade.', end: 1 }; } g.heat = Math.min(100, g.heat + 5); return { say: 'Não tinha muito o que mostrar. Saiu meio morna.', end: 1 }; } },
          { l: 'Ignorar', fx(g) { g.heat = Math.min(100, g.heat + 12); return { say: 'Saiu a matéria. Não foi bonita.', end: 1 }; } },
        ],
        timeout(g) { g.heat = Math.min(100, g.heat + 12); },
      },
    },
  },
  {
    id: 'carga', min: 2, weight: 2, modes: ['faccao', 'milicia', 'mafia'],
    init: () => true,
    steps: {
      a: {
        from: () => can('market') ? 'fornecedor' : 'chefe',
        text: () => T({
          faccao: `Tem uma carga grande chegando. Investe ${fmt(5000)} e volta o triplo em 3 dias. Mas o caminho tá quente.`,
          milicia: `Lote grande de botijão e equipamento de sinal. Investe ${fmt(5000)}, volta o triplo em 3 dias. Estrada tá com fiscalização.`,
          mafia: `Un carico grosso arriva al porto. ${fmt(5000)} adesso, il triplo in tre giorni. Ma i Carabinieri sono in giro.`,
        }),
        opts: () => [
          { l: `Investir e mandar escolta de 10`, fx(g, d) { if (g.money < 5000) return { say: 'Sem os 5 mil não tem conversa.', end: 1 }; const n = can('crew') ? Math.min(10, g.reserve) : 0; if (can('crew') && n < 10) return { say: 'Você não tem 10 livres pra escolta. Vai sem?', next: 'a', delay: 0 }; g.money -= 5000; if (can('crew')) g.reserve -= n; d.esc = n; d.risk = .2; return { say: 'Escolta na estrada. Em 3 dias a gente vê.', next: 'b', delay: 3 }; } },
          { l: 'Investir sem escolta', fx(g, d) { if (g.money < 5000) return { say: 'Sem os 5 mil não tem conversa.', end: 1 }; g.money -= 5000; d.esc = 0; d.risk = .45; return { say: 'Vai na fé então. Em 3 dias a gente vê.', next: 'b', delay: 3 }; } },
          { l: 'Passar', fx: () => ({ say: 'Outro pega.', end: 1 }) },
        ],
      },
      b: {
        from: () => can('market') ? 'fornecedor' : 'chefe',
        text: d => { d.ok = Math.random() > d.risk; return d.ok ? 'A carga chegou inteira. Tá na mão.' : `Deu ruim. ${W().cops[0].toUpperCase() + W().cops.slice(1)} pegaram a carga no caminho.`; },
        opts: d => [{ l: d.ok ? 'Receber o dinheiro' : 'Contar o prejuízo', fx(g) { if (d.ok) { const v = RI(130, 160) * 100; g.money += v; g.reserve += d.esc; addXP(100); log(`A carga grande rendeu ${fmt(v)}.`, 'good'); return { say: `${fmt(v)} no caixa. A escolta voltou inteira.`, end: 1 }; } g.heat = Math.min(100, g.heat + 15); g.reserve += Math.floor(d.esc / 2); log('A carga grande foi apreendida.', 'bad'); return { say: d.esc ? `Metade da escolta voltou. ${fmt(5000)} perdidos.` : `${fmt(5000)} perdidos.`, end: 1 }; } }],
      },
    },
  },
  {
    id: 'apreensao', min: 1, weight: 2, modes: ['policia'],
    init(d) { const k = alive(); if (!k.length) return false; d.r = pick(k); return true; },
    steps: {
      a: {
        from: () => 'olheiro',
        text: d => `Denúncia: ${rivalName(d.r)} vai passar uma carga grande daqui a 2 dias.`,
        opts: () => [
          { l: `Montar operação (${fmt(1500)})`, fx(g, d) { if (g.money < 1500) return { say: 'Sem verba pra operação.', end: 1 }; g.money -= 1500; return { say: 'Equipe de prontidão.', next: 'b', delay: 2 }; } },
          { l: 'Ignorar', fx: () => ({ say: 'Ok.', end: 1 }) },
        ],
      },
      b: {
        from: () => 'olheiro',
        text: d => { d.ok = Math.random() < .7; return d.ok ? 'A carga passou bem onde a gente esperava. Pegamos tudo.' : 'Eles mudaram a rota na última hora. Voltamos de mão vazia.'; },
        opts: d => [{ l: 'Ok', fx(g) { if (d.ok) { g.stock.apreensao = (g.stock.apreensao || 0) + 40; g.heat = Math.max(0, g.heat - 10); const F = g.f[d.r]; owned(d.r + 1).slice(0, 2).forEach(i => { g.d[i].t = Math.max(1, g.d[i].t - 3); }); F.money = Math.max(0, F.money - 2000); addXP(90); return { say: '40 lotes para o leilão e o rival sentiu o golpe.', end: 1 }; } g.heat = Math.min(100, g.heat + 8); return { say: 'Faz parte.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'enchente', min: 3, weight: 2,
    init(d) { const m = owned(0); if (!m.length) return false; d.z = pick(m); return true; },
    steps: {
      a: {
        from: () => 'morador',
        text: d => `A chuva destruiu casas em ${zn(d.z)}. Tem família dormindo na rua.`,
        opts: d => [
          { l: `Ajudar todo mundo (${fmt(3000)})`, fx(g) { if (g.money < 3000) return { say: 'Sei que tá difícil. Qualquer ajuda serve.', next: 'a', delay: 0 }; g.money -= 3000; g.d[d.z].l = clamp(g.d[d.z].l + 30, 0, 100); owned(0).forEach(i => { if (i !== d.z) g.d[i].l = clamp(g.d[i].l + 5, 0, 100); }); addRel('morador', 15); addXP(60); return { say: `O povo de ${zn(d.z)} não vai esquecer isso nunca.`, end: 1 }; } },
          { l: `Ajudar o básico (${fmt(1000)})`, fx(g) { if (g.money < 1000) return { say: 'Entendo.', end: 1 }; g.money -= 1000; g.d[d.z].l = clamp(g.d[d.z].l + 10, 0, 100); addRel('morador', 5); addXP(20); return { say: 'Obrigada. Já ajuda muito.', end: 1 }; } },
          { l: 'Não é problema nosso', fx(g) { g.d[d.z].l = clamp(g.d[d.z].l - 20, 0, 100); addRel('morador', -15); return { say: 'Vou lembrar disso.', end: 1 }; } },
        ],
        timeout(g, d) { g.d[d.z].l = clamp(g.d[d.z].l - 12, 0, 100); addRel('morador', -8); },
      },
    },
  },
  {
    id: 'veterano', min: 2, weight: 1, once: 1,
    init(d) { d.n = T({ faccao: 'Tio Sombra', milicia: 'Sargento Ferro', policia: 'Major Raio', mafia: 'Zio Turi' }); return !S.G.perk?.vet; },
    steps: {
      a: {
        from: () => boss(),
        text: d => T({
          faccao: `O ${d.n} saiu e quer trabalhar com a gente. Lenda da antiga. Cobra caro, mas vale por dez.`,
          milicia: `O ${d.n}, ex-instrutor de tiro, quer entrar na patrulha. Caro, mas sabe o que faz.`,
          policia: `O ${d.n}, instrutor das operações especiais, aceitou vir pra equipe se a verba sair.`,
          mafia: `${d.n} vuole lavorare per la famiglia. Um homem de respeito na Sicília inteira.`,
        }),
        opts: d => [
          { l: `Contratar (${fmt(4000)})`, fx(g) { if (g.money < 4000) return { say: 'Volta quando tiver o dinheiro.', end: 1 }; g.money -= 4000; g.perk = { ...(g.perk || {}), vet: 1 }; g.reserve += 5; addXP(40); log(`${d.n} entrou para ${g.pname}: +10% de força em todo ataque.`, 'good'); return { say: `${d.n} chegou com mais 5 de confiança. A tropa toda bate mais forte agora.`, end: 1 }; } },
          { l: 'Não precisa', fx: () => ({ say: 'Outro grupo vai pegar ele.', end: 1 }) },
        ],
      },
    },
  },
  {
    id: 'promessa', min: 0, max: 1, weight: 2,
    init: () => true,
    steps: {
      a: {
        from: () => 'chefe',
        text: () => `${S.G.nick}, tô reparando em você. Faz tudo que eu pedir essa semana e eu te dou uma moral.`,
        opts: () => [
          { l: 'Pode contar comigo', fx(g, d) { d.start = g.stats.missions || 0; addRel('chefe', 4); return { say: 'Vamos ver.', next: 'b', delay: 4 }; } },
          { l: 'Vou fazer meu corre', fx() { addRel('chefe', -4); return { say: 'Tá bom.', end: 1 }; } },
        ],
      },
      b: {
        from: () => 'chefe',
        text: (d) => { d.ok = (S.G.stats.missions || 0) - d.start >= 3; return d.ok ? 'Cumpriu o que falou. Toma aqui o que eu prometi.' : 'Esperava mais de você essa semana.'; },
        opts: d => [{ l: 'Valeu', fx(g) { if (d.ok) { g.money += 2000; addXP(120); addRel('chefe', 10); return { say: `${fmt(2000)} e o meu respeito.`, end: 1 }; } addRel('chefe', -5); return { say: 'Próxima vez.', end: 1 }; } }],
      },
    },
  },
  // ---------- exclusivas de cada modo ----------
  {
    id: 'baile', min: 1, weight: 3, modes: ['faccao'],
    init(d) { const m = owned(0).filter(i => S.M.type[i] === 'comunidade'); const c = m.length ? m : owned(0); if (!c.length) return false; d.z = pick(c); return true; },
    steps: {
      a: {
        from: () => can('build') ? 'morador' : 'chefe',
        text: d => `A rapaziada quer fazer um baile grande em ${zn(d.z)} no sábado. Se bancar, vem gente da cidade toda.`,
        opts: d => [
          { l: `Bancar o baile completo (${fmt(2000)})`, fx(g) { if (g.money < 2000) return { say: 'Sem caixa pro baile grande. Faz o pequeno então.', next: 'a', delay: 0 }; g.money -= 2000; addKarma(3); addBuf({ dem: 1.8 }, 2, 'Baile lotado'); g.d[d.z].l = clamp(g.d[d.z].l + 12, 0, 100); g.heat = Math.min(100, g.heat + 10); addXP(60); return { say: `Baile marcado. Pelos próximos 2 dias as bancas vão vender quase o dobro, e ${zn(d.z)} vai lembrar de você.`, end: 1 }; } },
          { l: `Baile de rua, simples (${fmt(600)})`, fx(g) { if (g.money < 600) return { say: 'Nem isso? Fica pra próxima.', end: 1 }; g.money -= 600; addBuf({ dem: 1.3 }, 2, 'Baile de rua'); g.d[d.z].l = clamp(g.d[d.z].l + 5, 0, 100); addXP(25); return { say: 'Paredão na rua e o povo feliz. Vendas um pouco acima por 2 dias.', end: 1 }; } },
          { l: 'Sem baile essa semana', fx(g) { g.d[d.z].l = clamp(g.d[d.z].l - 8, 0, 100); return { say: 'A rapaziada ficou chateada.', end: 1 }; } },
        ],
        timeout(g, d) { g.d[d.z].l = clamp(g.d[d.z].l - 5, 0, 100); },
      },
    },
  },
  {
    id: 'fuga', min: 2, weight: 2, modes: ['faccao'],
    init(d) { d.n = pickNames(1)[0]; return true; },
    steps: {
      a: {
        from: () => 'braco',
        text: d => `O ${d.n} mandou recado lá de dentro. Com ${fmt(3000)} pros contatos certos ele sai e volta pra rua com a gente. Ele é dos bons.`,
        opts: d => [
          { l: `Mandar o dinheiro (${fmt(3000)})`, fx(g) { if (g.money < 3000) return { say: 'Sem os 3 mil não rola.', end: 1 }; g.money -= 3000; return { say: 'Dinheiro enviado. Agora é esperar.', next: 'b', delay: 1 }; } },
          { l: 'Agora não dá', fx() { addRel('braco', -6); return { say: 'Ele vai entender. Ou não.', end: 1 }; } },
        ],
        timeout() { addRel('braco', -4); },
      },
      b: {
        from: () => 'braco',
        text: d => { d.ok = Math.random() < .65; return d.ok ? `O ${d.n} tá na rua! Chegou com mais uns amigos que saíram junto.` : `Deu errado. Pegaram o ${d.n} na saída e o caso foi parar na TV.`; },
        opts: d => [{ l: d.ok ? 'Bem-vindo de volta' : 'Que azar', fx(g) { if (d.ok) { const n = RI(6, 9); if (can('crew')) g.reserve += n; else g.d[g.base].t += n; addRel('braco', 10); addXP(80); log(`${d.n} voltou para ${g.pname} com mais ${n}.`, 'good'); return { say: `+${n} na tropa, gente experiente.`, end: 1 }; } g.heat = Math.min(100, g.heat + 15); return { say: 'Os 3 mil foram embora e a pressão subiu.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'desertor', min: 2, weight: 2, modes: ['faccao', 'milicia'],
    init(d) { const k = alive().filter(k => owned(k + 1).length); if (!k.length) return false; d.r = pick(k); d.n = pickNames(1)[0]; d.trap = Math.random() < .25; return true; },
    steps: {
      a: {
        from: () => 'olheiro',
        text: d => `O ${d.n}, que é homem de confiança de ${rivalName(d.r)}, quer mudar de lado. Diz que traz gente e conta tudo que eles planejam.`,
        opts: d => [
          { l: 'Aceitar ele e o grupo', fx(g) { if (d.trap) { const z = g.base, l = Math.min(g.d[z].t - 1, RI(4, 7)); g.d[z].t -= l; g.heat = Math.min(100, g.heat + 5); log(`${d.n} era armação de ${rivalName(d.r)}.`, 'bad'); return { say: `Era armação. O ${d.n} abriu a porta pra ${rivalName(d.r)} e a base perdeu ${l}.`, end: 1 }; } const n = RI(5, 8); if (can('crew')) g.reserve += n; else g.d[g.base].t += n; g.double = g.day + 5; owned(d.r + 1).slice(0, 2).forEach(i => { g.seen[i] = g.day + 5; }); addXP(60); return { say: `Chegou com ${n} e abriu o jogo: agora a gente vê a tropa deles e sabe quando vão atacar, por 5 dias.`, end: 1 }; } },
          { l: `Pagar pra ele ficar lá e passar informação (${fmt(1500)})`, fx(g) { if (g.money < 1500) return { say: 'Sem caixa pra isso.', end: 1 }; g.money -= 1500; g.double = g.day + 8; owned(d.r + 1).forEach(i => { g.seen[i] = g.day + 8; }); addXP(50); return { say: `Agora a gente tem um homem dentro de ${rivalName(d.r)} por 8 dias.`, end: 1 }; } },
          { l: 'Não confio', fx: () => ({ say: 'Melhor prevenir.', end: 1 }) },
        ],
      },
    },
  },
  {
    id: 'comerciante', min: 1, weight: 3, modes: ['milicia', 'mafia'],
    init(d) { const m = owned(0); if (!m.length) return false; d.z = pick(m); d.n = mode() === 'mafia' ? pick(['Signor Caruso', 'la signora Russo', 'Signor Vitale', 'il fornaio Lombardo']) : pick(['Seu Juarez da padaria', 'Dona Rosa do mercadinho', 'o Português do açougue', 'Seu Nilton da farmácia']); return true; },
    steps: {
      a: {
        from: () => can('crew') ? 'braco' : 'chefe',
        text: d => mode() === 'mafia' ? `${d.n}, em ${zn(d.z)}, não paga mais o pizzo e ainda falou que vai procurar os Carabinieri.` : `${d.n}, em ${zn(d.z)}, disse que não paga mais a taxa de segurança. Os outros estão olhando pra ver no que dá.`,
        opts: d => [
          { l: 'Dar um recado firme', fx(g) { const v = RI(12, 20) * 100; g.money += v; addKarma(-6); g.d[d.z].l = clamp(g.d[d.z].l - 10, 0, 100); g.heat = Math.min(100, g.heat + 8); addXP(30); return { say: `Recado dado. Ele pagou o atrasado e o resto da rua entendeu: +${fmt(v)}. Mas o clima ficou pesado.`, end: 1 }; } },
          { l: 'Perdoar este mês', fx(g) { g.d[d.z].l = clamp(g.d[d.z].l + 6, 0, 100); addKarma(6); addRel('morador', 6); addRel('chefe', -4); return { say: 'Ele agradeceu. Tem gente achando que você amoleceu.', end: 1 }; } },
          { l: mode() === 'mafia' ? `Comprar a loja dele (${fmt(3000)})` : `Virar sócio do negócio (${fmt(3000)})`, fx(g) { if (g.money < 3000) return { say: 'Sem caixa pra isso.', end: 1 }; g.money -= 3000; g.rent = (g.rent || 0) + 220; g.d[d.z].l = clamp(g.d[d.z].l + 4, 0, 100); addXP(50); log(`Negócio próprio em ${zn(d.z)}: +${fmt(220)} por dia.`, 'good'); return { say: `Agora o negócio é nosso. Rende ${fmt(220)} por dia, todo dia.`, end: 1 }; } },
        ],
        timeout(g, d) { g.d[d.z].l = clamp(g.d[d.z].l - 4, 0, 100); g.money -= 400; },
      },
    },
  },
  {
    id: 'vereador', min: 3, weight: 2, modes: ['milicia'],
    init: () => true,
    steps: {
      a: {
        from: () => can('market') ? 'politico' : 'advogado',
        text: () => 'Ano de eleição. Tenho um candidato a vereador que precisa dos votos das nossas áreas. Em troca ele segura investigação contra a gente.',
        opts: () => [
          { l: `Apoiar o candidato (${fmt(2500)})`, fx(g) { if (g.money < 2500) return { say: 'Sem caixa pra campanha.', end: 1 }; g.money -= 2500; addBuf({ raid: .6 }, 14, 'Vereador aliado'); g.heat = Math.max(0, g.heat - 15); addXP(60); return { say: 'Fechado. Pelos próximos 14 dias as operações contra a gente vão ser bem menos frequentes.', end: 1 }; } },
          { l: `Lançar candidato próprio (${fmt(6000)})`, fx(g) { if (g.money < 6000) return { say: 'Campanha própria precisa de 6 mil.', end: 1 }; g.money -= 6000; return { say: 'Campanha na rua. Em 3 dias sai o resultado.', next: 'b', delay: 3 }; } },
          { l: 'Política não é com a gente', fx: () => ({ say: 'Depois não reclama.', end: 1 }) },
        ],
      },
      b: {
        from: () => can('market') ? 'politico' : 'advogado',
        text: d => { d.ok = Math.random() < .55 + owned(0).length / S.M.N; return d.ok ? 'Eleito! Agora a gente tem cadeira na Câmara.' : 'Perdeu por pouco. E a imprensa descobriu de onde vinha o dinheiro da campanha.'; },
        opts: d => [{ l: 'Ok', fx(g) { if (d.ok) { addBuf({ raid: .5, pol: .7 }, 30, 'Vereador da casa'); addXP(150); return { say: 'Por 30 dias: menos operações e acertos mais baratos.', end: 1 }; } g.heat = Math.min(100, g.heat + 15); return { say: 'Prejuízo e pressão subindo.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'refem', min: 1, weight: 2, modes: ['policia'],
    init(d) { const m = owned(0); if (!m.length) return false; d.z = pick(m); return true; },
    steps: {
      a: {
        from: () => 'chefe',
        text: d => `Assalto com reféns num mercado em ${zn(d.z)}. A imprensa já está toda lá. Qual é a ordem?`,
        opts: d => [
          { l: 'Negociar com calma', fx() { addKarma(4); return { say: 'Negociador a caminho. Amanhã cedo a gente sabe.', next: 'b', delay: 1 }; } },
          { l: 'Invadir com o grupo tático', fx(g) { if (Math.random() < .55) { g.heat = Math.max(0, g.heat - 20); addRel('chefe', 6); addXP(120); return { say: 'Entrada perfeita. Reféns salvos e o vídeo rodou o país.', end: 1 }; } g.heat = Math.min(100, g.heat + 25); addRel('chefe', -10); return { say: 'A invasão deu errado e a mídia caiu em cima. Ninguém se feriu gravemente, mas a imagem foi pro chão.', end: 1 }; } },
        ],
        timeout(g) { g.heat = Math.min(100, g.heat + 15); },
      },
      b: {
        from: () => 'chefe',
        text: d => { d.ok = Math.random() < .8; return d.ok ? 'Os assaltantes se renderam de madrugada. Todos os reféns saíram bem.' : 'A negociação demorou demais e a imprensa chamou de fraqueza.'; },
        opts: d => [{ l: 'Ok', fx(g) { if (d.ok) { g.heat = Math.max(0, g.heat - 15); g.d[d.z].l = clamp(g.d[d.z].l + 10, 0, 100); addXP(90); return { say: 'Elogio público do governador.', end: 1 }; } g.heat = Math.min(100, g.heat + 10); return { say: 'Faz parte.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'secretario', min: 2, weight: 2, modes: ['policia'],
    init(d) { const g = S.G, t = owned(0).flatMap(i => S.M.adj[i]).filter(j => g.d[j].o > 0); if (!t.length) return false; d.z = pick(t); return true; },
    steps: {
      a: {
        from: () => can('market') ? 'politico' : 'chefe',
        text: d => `O governo quer uma resposta. Ocupe ${zn(d.z)} em até 5 dias e eu libero verba extra para a sua unidade.`,
        opts: () => [
          { l: 'Missão aceita', fx(g, d) { d.until = g.day + 5; return { say: 'Conto com você. Em 5 dias eu cobro.', next: 'b', delay: 5 }; } },
          { l: 'Não temos efetivo para isso', fx() { addRel('chefe', -4); return { say: 'Entendido. Vou procurar outra unidade.', end: 1 }; } },
        ],
      },
      b: {
        from: () => can('market') ? 'politico' : 'chefe',
        text: d => { d.ok = S.G.d[d.z].o === 0; return d.ok ? `${zn(d.z)} ocupada dentro do prazo. A verba está liberada.` : `O prazo para ${zn(d.z)} acabou e nada. O governador não gostou.`; },
        opts: d => [{ l: 'Ok', fx(g) { if (d.ok) { g.money += 5000; g.bonusSP = (g.bonusSP || 0) + 1; addXP(150); return { say: `${fmt(5000)} de verba e 1 ponto de habilidade.`, end: 1 }; } addRel('chefe', -10); g.heat = Math.min(100, g.heat + 10); return { say: 'Fica pra próxima. Mas ficou anotado.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'pentito', min: 2, weight: 2, modes: ['mafia'],
    init(d) { d.n = pickNames(1)[0]; return true; },
    steps: {
      a: {
        from: () => 'advogado',
        text: d => `Pegaram o ${d.n}. O promotor está oferecendo proteção se ele falar sobre a família. Ele ainda não decidiu.`,
        opts: d => [
          { l: `Pagar a defesa e cuidar da família dele (${fmt(4000)})`, fx(g) { if (g.money < 4000) return { say: 'Sem esse dinheiro ele vai acabar falando.', next: 'a', delay: 0 }; g.money -= 4000; addRel('braco', 10); addXP(70); return { say: 'Ele mandou dizer que a família vem primeiro. Não vai abrir a boca.', end: 1 }; } },
          { l: `Tirar ele do país (${fmt(2000)})`, fx(g) { if (g.money < 2000) return { say: 'Nem isso tem no caixa.', end: 1 }; g.money -= 2000; if (Math.random() < .7) { addXP(50); return { say: 'Ele está num navio para a América. Problema resolvido.', end: 1 }; } g.heat = Math.min(100, g.heat + 25); return { say: 'Pegaram ele no porto. Agora a polícia sabe que a gente tentou.', end: 1 }; } },
          { l: 'Ele não sabe de nada', fx() { return { say: 'Espero que você esteja certo.', next: 'b', delay: 2 }; } },
        ],
        timeout(g) { if (Math.random() < .4) g.heat = Math.min(100, g.heat + 20); },
      },
      b: {
        from: () => 'advogado',
        text: d => { d.talk = Math.random() < .55; return d.talk ? `O ${d.n} falou. Os jornais estão chamando de o novo pentito.` : `O ${d.n} ficou quieto. Honra até o fim.`; },
        opts: d => [{ l: 'Ok', fx(g) { if (d.talk) { g.heat = Math.min(100, g.heat + 30); arrest(null, 3); return { say: 'A pressão explodiu.', end: 1 }; } addXP(40); return { say: 'Sorte nossa.', end: 1 }; } }],
      },
    },
  },
  {
    id: 'appalto', min: 3, weight: 2, modes: ['mafia'],
    init: () => true,
    steps: {
      a: {
        from: () => can('market') ? 'politico' : 'advogado',
        text: () => `Vai sair a licitação da nova estrada. Com ${fmt(5000)} para o assessor certo, a obra é da família e rende todo mês.`,
        opts: () => [
          { l: `Pagar o assessor (${fmt(5000)})`, fx(g) { if (g.money < 5000) return { say: 'Sem os 5 mil a obra vai pra outro.', end: 1 }; g.money -= 5000; if (Math.random() < .7) { g.rent = (g.rent || 0) + 450; addXP(120); log(`A obra pública rende ${fmt(450)} por dia.`, 'good'); return { say: `A obra é nossa. ${fmt(450)} por dia entrando, limpinho.`, end: 1 }; } g.heat = Math.min(100, g.heat + 15); return { say: 'A Guardia di Finanza estava de olho no assessor. Dinheiro perdido e pressão subindo.', end: 1 }; } },
          { l: 'Entrar na licitação sem pagar ninguém', fx(g) { if (Math.random() < .25) { g.rent = (g.rent || 0) + 300; addXP(80); return { say: `Ganhamos no preço. ${fmt(300)} por dia.`, end: 1 }; } return { say: 'Perdemos para uma empresa com amigos melhores.', end: 1 }; } },
          { l: 'Passar', fx: () => ({ say: 'Outro pega.', end: 1 }) },
        ],
      },
    },
  },
  // ---------- fama: traição quando o chefe é temido, voluntários quando é querido ----------
  {
    id: 'traidor', min: 2, weight: 5, need: () => kBad() && !sk('loyalc') && owned(0).length >= 3,
    init(d) { const g = S.G, z = owned(0).filter(i => i !== g.base).sort((a, b) => g.d[a].l - g.d[b].l)[0]; if (z == null) return false; const r = S.M.adj[z].map(j => g.d[j].o).filter(o => o > 0 && g.f[o - 1].alive); d.z = z; d.r = r.length ? r[0] - 1 : strongest(); return d.r != null; },
    steps: {
      a: {
        from: () => 'olheiro',
        text: d => T({ policia: `Comandante, tem policial da equipe de ${zn(d.z)} passando informação para ${rivalName(d.r)}. Vi o carro deles lá duas vezes.`, mafia: `Don, c'è un traditore em ${zn(d.z)}. Alguém da família está conversando com ${rivalName(d.r)}.`, default: `Chefe, tem gente nossa em ${zn(d.z)} de papo com ${rivalName(d.r)}. Vi o carro deles lá duas vezes. O povo tem medo de você e alguém viu nisso uma chance.` }),
        opts: d => [
          { l: `Investigar e cortar o mal pela raiz (${fmt(1000)})`, fx(g) { if (!pay(g, 1000)) return { say: 'Sem dinheiro pra investigar.', next: 'b', delay: 1 }; if (Math.random() < .7) { g.d[d.z].l = clamp(g.d[d.z].l + 5, 0, 100); addXP(60); return { say: 'Achamos o traidor a tempo. A área continua nossa.', end: 1 }; } return { say: 'Chegamos tarde...', next: 'b', delay: 0 }; } },
          { l: 'Mandar mais gente pra lá', fx(g) { const n = Math.min(g.reserve, 6); g.reserve -= n; g.d[d.z].t += n; if (Math.random() < .55) return { say: `Mandei ${n}. Com mais olhos lá, o traidor não teve coragem.`, end: 1 }; return { say: `Mandei ${n}, mas o estrago já tava feito.`, next: 'b', delay: 1 }; } },
          { l: 'É fofoca. Deixa', fx: () => ({ say: 'Você que sabe.', next: 'b', delay: 1 }) },
        ],
        timeout(g, d) { betray(g, d); },
      },
      b: {
        from: () => 'olheiro',
        text: d => { betray(S.G, d); return `${zn(d.z)} virou a casaca e entregou a área para ${rivalName(d.r)}.`; },
        opts: () => [{ l: 'Isso não fica assim', fx: () => ({ say: 'Anota o nome de todo mundo.', end: 1 }) }],
        timeout() {},
      },
    },
  },
  {
    id: 'voluntarios', min: 3, weight: 4, need: () => kGood() && owned(0).length >= 1,
    init(d) { d.z = pick(owned(0)); return true; },
    steps: {
      a: {
        from: () => 'morador',
        text: d => T({ policia: `Comandante, jovens de ${zn(d.z)} querem ajudar a polícia: vigiar a rua, avisar movimento estranho. Dizem que confiam no senhor.`, mafia: `Don, os rapazes de ${zn(d.z)} querem servir a família. Dizem que o senhor é um homem justo.`, default: `Os jovens de ${zn(d.z)} querem entrar pra firma. Dizem que você é diferente, que cuida do povo.` }),
        opts: d => [
          { l: 'Aceitar e treinar', fx(g) { const n = RI(5, 8); g.d[d.z].t += n; g.d[d.z].l = clamp(g.d[d.z].l + 5, 0, 100); addXP(40); return { say: `+${n} em ${zn(d.z)}, sem custo. O povo tá do seu lado.`, end: 1 }; } },
          { l: 'Melhor eles estudarem', fx(g) { addKarma(4); allLoy(3); return { say: 'As mães agradeceram. A lealdade subiu em todas as áreas.', end: 1 }; } },
        ],
      },
    },
  },
  // ---------- histórias em cadeia (avançam com a confiança no contato) ----------
  ...chainStories(),
];

function guess(g, d, i) {
  if (i === d.guilty) { addRel('braco', 8); addXP(40); return { say: `Era ele mesmo. O ${d.sus[i]} confessou.`, next: 'c', delay: 0 }; }
  const n = can('crew') ? Math.min(6, g.reserve) : 0; if (can('crew')) g.reserve -= n; else { const z = owned(0)[0]; if (z != null) g.d[z].t = Math.max(1, g.d[z].t - 4); }
  addRel('braco', -10); g.leak = g.day + 3;
  return { say: `Não era ele. O ${d.sus[i]} era leal e foi embora magoado, levando uns amigos. E o vazamento continua.`, end: 1 };
}

function sendStep() {
  const g = S.G, st = g.story; if (!st) return;
  const def = STORIES.find(s => s.id === st.id), step = def && def.steps[st.step];
  if (!step) { g.story = null; return; }
  if (step.skip && step.skip(st.data)) { endStory(); return; }
  const opts = step.opts(st.data).map((o, i) => ({ l: o.l, k: 'story', p: { i } }));
  const m = msg(step.from(st.data), step.text(st.data), opts, { story: st.id });
  st.mid = m.id;
}
function endStory() { const g = S.G; if (g.story) { g.played = [...(g.played || []), g.story.id]; } g.story = null; g.lastStory = g.day; }
export function storyAnswer(m, o) {
  const g = S.G, st = g.story; if (!st || st.mid !== m.id) return 'Isso já passou.';
  const def = STORIES.find(s => s.id === st.id), step = def.steps[st.step], opt = step.opts(st.data)[o.p.i];
  const r = opt.fx(g, st.data) || {};
  if (step.from(st.data) === 'chefe' || step.from(st.data) === 'braco') g.stats.missions = (g.stats.missions || 0) + 1;
  st.mid = null;
  if (r.end) endStory();
  else if (r.next) { st.step = r.next; st.due = g.day + (r.delay || 0); if (!r.delay) setTimeout(() => { if (S.G === g && g.story === st && !st.mid) { sendStep(); emit('change'); } }, 600); }
  return r.say || null;
}

// ---------------- eventos da cidade ----------------
const CEV = [
  { id: 'eleicao', days: 5, m: { pol: 2, raid: 1.4 }, name: { default: 'Eleições', mafia: 'Elezioni' }, text: { default: 'Época de eleição: político cobra o dobro e a polícia quer mostrar serviço.', policia: 'Época de eleição: o governo quer resultado e a mídia está em cima.' } },
  { id: 'carnaval', days: 4, m: { dem: 1.6, raid: .5, heat: .6 }, name: { default: 'Carnaval', mafia: 'Festa di Santa Rosalia' }, text: { default: 'A cidade está em festa. Vendas em alta e a polícia distraída.', policia: 'A cidade está em festa. A tropa está espalhada nos blocos.' } },
  { id: 'intervencao', days: 4, m: { noAtk: 1, raid: 1.6 }, name: { default: 'Intervenção federal', mafia: 'Operazione nazionale' }, text: { default: 'Tropas federais na rua. Ninguém consegue atacar ninguém por uns dias, e as operações aumentam.', policia: 'Força Nacional assumiu as operações. A sua tropa fica parada por uns dias.' } },
  { id: 'crise', days: 6, m: { dem: .7, rec: .7 }, name: { default: 'Crise econômica', mafia: 'Crisi economica' }, text: { default: 'Desemprego subiu. O povo compra menos, mas sobra gente querendo trabalhar.' } },
  { id: 'copa', days: 3, m: { dem: 1.3, heat: .5 }, name: { default: 'Copa do Mundo', mafia: 'Finale dei Mondiali' }, text: { default: 'Todo mundo de olho na TV. Vende mais e ninguém repara em nada.' } },
];
function cityEvent() {
  const g = S.G;
  if (g.cev && g.cev.until >= g.day) return;
  if (g.cev && g.cev.until < g.day) { log(`Acabou: ${g.cev.name}.`); g.cev = null; g.lastCev = g.day; }
  if (g.day < 5 || g.day - (g.lastCev || 0) < 5 || Math.random() > .16) return;
  const e = pick(CEV);
  g.cev = { id: e.id, name: T(e.name), text: T(e.text), until: g.day + e.days - 1, m: e.m };
  log(`${g.cev.name}: ${g.cev.text}`, 'good');
  msg('olheiro', `${g.cev.name}! ${g.cev.text} Dura ${e.days} dias.`);
  emit('cityEvent', g.cev);
}

// ---------------- objetivos da semana ----------------
const OBJ = [
  { id: 'conquer', min: 2, make: g => ({ n: 2, text: 'Tomar 2 zonas', base: g.stats.won }), prog: (g, o) => [g.stats.won - o.base, o.n] },
  { id: 'cash', min: 0, make: g => { const x = Math.max(5000, Math.round(g.money * 1.5 / 500) * 500); return { n: x, text: `Fechar a semana com ${fmt(x)} em caixa` }; }, prog: (g, o) => [g.money, o.n], money: 1 },
  { id: 'heat', min: 0, make: () => ({ n: 35, text: 'Terminar a semana com a pressão abaixo de 35' }), prog: (g, o) => [g.heat <= o.n ? 1 : 0, 1], atEnd: 1 },
  { id: 'sales', min: 0, make: g => { const h = g.hist.slice(-3), avg = h.length ? sum(h.map(x => x.ven)) / h.length : 800; const x = Math.max(2000, Math.round(avg * 5.5 / 500) * 500); return { n: x, text: `Vender ${fmt(x)} ${S.MD.shopIn} em 7 dias`, base: g.hist.length }; }, prog: (g, o) => [sum(g.hist.slice(o.base).map(x => x.ven)), o.n], money: 1 },
  { id: 'build', min: 3, make: g => ({ n: 2, text: 'Fazer 2 construções', base: g.stats.built }), prog: (g, o) => [g.stats.built - o.base, o.n] },
  { id: 'missions', min: 0, max: 2, make: g => ({ n: 4, text: 'Cumprir 4 missões do chefe', base: g.stats.missions || 0 }), prog: (g, o) => [(g.stats.missions || 0) - o.base, o.n] },
  { id: 'hold', min: 0, make: g => ({ n: owned(0).length, text: `Não perder nenhuma das suas ${owned(0).length} zonas`, base: owned(0).length }), prog: (g, o) => [owned(0).length >= o.n ? 1 : 0, 1], atEnd: 1 },
];
const REWARDS = [
  { t: '1 ponto de habilidade', f: g => { g.bonusSP = (g.bonusSP || 0) + 1; } },
  { t: `${'R$ 3.000'}`, f: g => { g.money += 3000; } },
  { t: '10 fuzis', f: g => { g.rif += 10; } },
  { t: '200 de respeito', f: () => addXP(200) },
];
export const objProgress = () => { const g = S.G, o = g.obj; if (!o) return null; const def = OBJ.find(x => x.id === o.id); const [a, b] = def.prog(g, o); return { ...o, a, b, pct: clamp(a / b, 0, 1) }; };
function objTick(end, rep) {
  const g = S.G;
  if (end) {
    const o = g.obj; if (!o) return;
    const def = OBJ.find(x => x.id === o.id), [a, b] = def.prog(g, o), done = a >= b;
    if (done && (!def.atEnd || g.day >= o.until)) { const r = REWARDS[o.r]; r.f(g); log(`Objetivo cumprido: ${o.text}. Prêmio: ${r.t}.`, 'good'); rep && rep.push(['good', `Objetivo cumprido: ${o.text}`, r.t]); msg(chief(), `Objetivo cumprido. Toma aqui: ${r.t}.`); emit('toast', 'Objetivo cumprido', r.t, 'good'); g.obj = null; g.lastObj = g.day; return; }
    if (g.day >= o.until) { log(`Objetivo perdido: ${o.text}.`, 'bad'); rep && rep.push(['bad', `Objetivo não cumprido: ${o.text}`, '']); g.obj = null; g.lastObj = g.day; }
    return;
  }
  if (g.obj || g.day < 2 || g.day - (g.lastObj || 0) < 2) return;
  const c = OBJ.filter(o => g.rank >= o.min && (o.max == null || g.rank <= o.max));
  const def = pick(c), o = def.make(g); o.id = def.id; o.until = g.day + 6; o.r = RI(0, REWARDS.length - 1);
  g.obj = o;
  msg(chief(), `Meta da semana: ${o.text} até o dia ${o.until}. Se fizer, ganha ${REWARDS[o.r].t}.`);
}

// ---------------- relações e rivais ----------------
function relationTick(rep) {
  const g = S.G;
  if (underdog() && !g.ud) { g.ud = 1; msg(boss(), T({ policia: 'Comandante, estamos cercados, mas o efetivo fechou com a gente. Enquanto a unidade for pequena, reforço sai mais barato e cada base resiste mais.', mafia: 'Siamo pochi, ma fedeli. Enquanto a família for pequena, todo mundo luta dobrado: recrutar sai mais barato e as nossas casas aguentam mais.', default: 'A gente tá encurralado, mas a rapaziada fechou com nós. Enquanto a gente for pequeno, recrutar sai mais barato e as nossas áreas aguentam mais.' })); log('Resistência: pequeno e encurralado, você recruta mais barato e defende melhor.', 'good'); }
  if (!underdog() && g.ud && owned(0).length / S.M.N >= .25) g.ud = 0;
  if (sk('clean')) g.heat = Math.max(0, g.heat - 2);
  if (sk('laundry')) { g.heat = Math.max(0, g.heat - 1); }
  { const v = (sk('rentz') ? 40 : 0) * owned(0).length + (sk('laundry') ? 20 : 0) * owned(0).length; if (v) { g.money += v; g.extra = (g.extra || 0) + v; rep && rep.push(['good', 'Pequenos negócios e lavagem', '+' + fmt(v)]); } }
  if (sk('kick')) { const v = 70 * owned(0).length; g.money += v; g.extra = (g.extra || 0) + v; g.heat = Math.min(100, g.heat + 1); addKarma(-.5); rep && rep.push(['good', mode() === 'policia' ? 'Arrego das áreas' : 'Grilagem e esquemas', '+' + fmt(v)]); }
  if (g.rent) { g.money += g.rent; g.extra = (g.extra || 0) + g.rent; rep && rep.push(['good', mode() === 'policia' ? 'Convênios' : 'Negócios próprios', '+' + fmt(g.rent)]); }
  if (g.rank >= 2 && rel('braco') <= 20 && Math.random() < .2) { const v = Math.round(g.money * .12); g.money -= v; addRel('braco', 5); log(`Sumiram ${fmt(v)} do caixa. O braço direito anda estranho.`, 'bad'); rep && rep.push(['bad', 'Dinheiro sumido do caixa', '-' + fmt(v)]); }
  if (g.rank < 5 && rel('chefe') >= 85 && Math.random() < .15) { const v = RI(8, 15) * 100; g.money += v; msg('chefe', `Tá fazendo bonito. Toma ${fmt(v)} de agrado.`); }
  if (g.rank < 5 && rel('chefe') <= 15 && Math.random() < .25) { g.xp = Math.max(0, g.xp - 80); msg('chefe', 'Tô de olho em você. Do jeito que tá, não sobe mais aqui dentro.'); addRel('chefe', 5); }
  // rivais traiçoeiros quebram trégua
  g.f.forEach((F, k) => {
    if (!F.alive) return;
    if (F.pers === 'traiçoeiro' && F.truce >= g.day && F.truceFrom && g.day - F.truceFrom >= 3 && Math.random() < .25) { F.truce = 0; msg('rival' + k, 'Trégua? Que trégua?'); log(`${F.name} quebrou a trégua.`, 'bad'); }
    if (F.pers === 'negociador' && can('boss') && !(F.truce >= g.day) && Math.random() < .08) { msg('rival' + k, 'Guerra não dá lucro pra ninguém. Topa 7 dias de paz, sem custo?', [{ l: 'Aceito', k: 'story_truce', p: { k } }, { l: 'Não', k: 'nada' }]); }
  });
  // rival quase sem território oferece rendição
  if (owned(0).length / S.M.N >= .5) g.f.forEach((F, k) => {
    const z = owned(k + 1); if (!F.alive || !z.length || z.length > 2 || Math.random() > .18 || (F.surr || 0) > g.day) return;
    F.surr = g.day + 4; const cost = Math.round((1200 * z.length + g.day * 40) / 100) * 100;
    const who = S.G.rank >= 5 ? 'rival' + k : boss(), pre = S.G.rank >= 5 ? '' : `Recado de ${F.name}: `;
    msg(who, pre + T({ policia: `Aqui é o ${F.name}. A gente sabe que acabou. Entregamos ${z.map(zn).join(' e ')} sem resistência se vocês garantirem a saída da nossa gente. Custa ${fmt(cost)} em transporte e acordo.`, mafia: `Basta. ${F.name} lascia la città. Entregamos ${z.map(zn).join(' e ')} por ${fmt(cost)} e ninguém mais derrama sangue.`, default: `Aqui é ${F.name}. Não tem mais como segurar. Entregamos ${z.map(zn).join(' e ')} e saímos da cidade por ${fmt(cost)}.` }),
      [{ l: `Aceitar (${fmt(cost)})`, k: 'surrender', p: { k, cost } }, { l: 'Vou tomar na força', k: 'nada' }]);
  });
  // guerra entre rivais
  if (g.war && g.war.until >= g.day) { for (const k of [g.war.a, g.war.b]) { if (!g.f[k].alive) continue; const loss = k === g.war.w ? 1 : RI(2, 4); owned(k + 1).slice(0, 3).forEach(i => { g.d[i].t = Math.max(1, g.d[i].t - loss); }); } }
  // arrego semanal
  if (g.arrego && g.arrego.until >= g.day && (g.day - g.arrego.from) % 7 === 0 && g.day !== g.arrego.from) {
    if (g.money >= 1500) { g.money -= 1500; rep && rep.push(['bad', 'Pagamento combinado da semana', '-' + fmt(1500)]); }
    else { g.arrego = null; g.cops = g.day + 7; msg('advogado', 'Faltou o pagamento da semana. O acordo acabou e eles estão com raiva.'); }
  }
}

// ---------------- grupo da firma (conversa da equipe) ----------------
const GT = {
  faccao: {
    win: ['Tomamo {z}! Agora é nosso.', 'O bonde passou em {z}, não sobrou ninguém deles lá.', '{z} é da {p} agora. Respeita.', 'Contenção montada em {z}. Tá tudo nosso.'],
    lost: ['Perdemo {z}... os cara entraram pesado.', 'Tem que retomar {z} urgente.', 'Vacilaram na contenção de {z}.', 'Geral recuou de {z}. Tô bolado.'],
    raid: ['O caveirão subiu aqui, sujou tudo.', 'Operação em {z}, geral entocado.', 'Os homens levaram a carga de {z}.', 'Helicóptero rodando em cima de {z} desde cedo.'],
    good: ['Movimento forte hoje nas bancas.', 'Dia bom, caixa cheio.', 'Hoje rendeu, chefe.', 'As bancas venderam tudo antes da meia-noite.'],
    bad: ['Dia fraco, movimento parado.', 'Tá faltando mercadoria nas bancas.', 'Ninguém subiu pra comprar hoje.'],
    idle: ['Bom dia rapaziada, contenção no lugar.', 'Plantão da noite foi tranquilo.', 'Alguém viu o {n}? Sumiu desde ontem.', 'Hoje tem baile?', 'Fica esperto que tem viatura rodando lá embaixo.', 'Chegou mais munição, tá no lugar de sempre.', 'Dona Cida mandou bolo pra rapaziada da contenção.', 'Moto do {n} quebrou de novo kkkk'],
    jail: ['Pegaram o patrão. Ninguém fala nada.', 'Segura a onda que ele volta.'],
  },
  milicia: {
    win: ['Área de {z} sob controle. O comércio já foi avisado da taxa.', 'Patrulha assumiu {z}. Sem alteração.', '{z} agora é nossa. Gás e sinal só com a gente.'],
    lost: ['Perdemos {z}. Precisamos reforçar a divisa.', 'Recuamos de {z}. Isso não fica assim.'],
    raid: ['Ministério Público bateu em {z}. Ninguém abre a boca.', 'Operação em {z}, recolheram botijão e equipamento.', 'Tem viatura federal parada na entrada de {z}.'],
    good: ['Arrecadação do dia fechou bonito.', 'Gás e sinal pagos em dia por todo mundo.', 'Van rodou lotada o dia inteiro.'],
    bad: ['Teve comerciante enrolando pra pagar.', 'Dia fraco na arrecadação.', 'Caiu o sinal da central, morador reclamando.'],
    idle: ['Bom dia, senhores. Ronda das 6h feita, sem alteração.', 'Van das 7h saiu lotada.', 'Morador reclamando do preço do gás de novo.', 'Câmera da entrada 2 tá com defeito.', 'Reunião hoje às 20h na associação.', 'O {n} tá de folga, quem cobre a portaria?'],
    jail: ['Levaram o comandante. Advogado já tá no caso.', 'Ninguém comenta nada por telefone.'],
  },
  policia: {
    win: ['Área {z} ocupada. Sem baixas civis.', 'Equipe estabeleceu base em {z}. QAP.', '{z} pacificada. Bom trabalho, equipe.', 'Apreensão grande em {z}, material a caminho do pátio.'],
    lost: ['Perdemos o controle de {z}. Solicito reforço.', 'Equipe recuou de {z}. Todos bem.'],
    raid: ['Emboscada em {z}. Equipe recuou, sem feridos graves.', 'Atacaram a viatura em {z}. Todo mundo bem.', 'Corregedoria na unidade hoje. Papelada em dia, pessoal.'],
    good: ['Leilão rendeu bem hoje.', 'Verba caiu, viaturas abastecidas.', 'Comunidade elogiou a ronda escolar.'],
    bad: ['Viatura 3 baixada de novo.', 'Sem verba para hora extra essa semana.', 'Imprensa na porta do batalhão desde cedo.'],
    idle: ['Bom dia, equipe. Briefing às 6h.', 'QSL, rendição do turno feita.', 'Café do batalhão acabou de novo.', 'Alguém troca a escala de sábado comigo?', 'Rádio da viatura 2 chiando, mandem pra manutenção.', '{n}, tua viatura tá sem combustível.'],
    jail: ['Comandante afastado. Seguimos a doutrina.', 'Aguardando a corregedoria. Ninguém fala com a imprensa.'],
  },
  mafia: {
    win: ['{z} adesso è nostra.', 'Os negócios de {z} já pagam para a família.', 'Don, {z} è sistemata.'],
    lost: ['Perdemos {z}. Vergogna.', '{z} caiu. Alguém falou demais.'],
    raid: ['Carabinieri em {z}. Silêncio, ninguém sabe de nada.', 'A Finanza levou os livros de {z}.'],
    good: ['Bella giornata, o cassino lotou.', 'O porto rendeu bem hoje.', 'Todas as lojas pagaram sem reclamar.'],
    bad: ['Giornata storta. Pouco movimento.', 'O navio atrasou de novo.'],
    idle: ['Buongiorno a tutti.', 'O padre agradeceu a doação de domingo.', 'Quem busca o Don no aeroporto?', 'O café do bar do {n} é o melhor de Palermo.', 'Tranquilo no porto esta noite.', 'Domingo tem almoço na casa da Nonna. Ninguém falta.'],
    jail: ['Levaram o Don. Omertà, ragazzi.', 'O advogado já está cuidando de tudo.'],
  },
};
const GK = {
  good: { faccao: ['O povo da {z} mandou agradecer pela ajuda.', 'Criançada da {z} jogando bola na quadra nova.'], milicia: ['Morador da {z} trouxe café pra patrulha.', 'Associação de {z} elogiou o preço do gás.'], policia: ['Comunidade de {z} aplaudiu a equipe na ronda.', 'Diretora da escola de {z} mandou carta de agradecimento.'], mafia: ['Il prete de {z} rezou pela família na missa.', 'As senhoras de {z} mandaram cannoli para os rapazes.'] },
  bad: { faccao: ['Morador da {z} nem olha mais na cara da gente. Tão com medo.', 'Fecharam o comércio cedo em {z}. Clima pesado.'], milicia: ['Família de {z} se mudou de madrugada. Medo da taxa.', 'Morador de {z} gravou a patrulha. Cuidado.'], policia: ['Corregedoria perguntando sobre o dinheiro de {z}.', 'Morador de {z} filmou a abordagem. Vai dar problema.'], mafia: ['Em {z} ninguém fala mais com a gente na rua.', 'O padre de {z} recusou a doação.'] },
};
function gsay(kind, z) {
  const g = S.G; if (g.rank < 1) return;
  if (kind === 'idle' && (kGood() || kBad()) && Math.random() < .4) { kind = kGood() ? 'good_k' : 'bad_k'; const L = GK[kGood() ? 'good' : 'bad'][mode()]; const zz = owned(0).length ? pick(owned(0)) : null; msg('grupo', pick(L).replace('{z}', zz != null ? zn(zz) : 'lá'), [], { who: pickNames(1)[0], quiet: 1 }); return; }
  const L = (GT[mode()] || GT.faccao)[kind]; if (!L) return;
  g.gl = g.gl || []; const fresh = L.filter(x => !g.gl.includes(x)), line = pick(fresh.length ? fresh : L); g.gl = [line, ...g.gl].slice(0, 8);
  const who = pickNames(2), t = line.replace('{z}', z != null ? zn(z) : '').replace('{p}', g.pname).replace('{n}', who[1]);
  msg('grupo', t, [], { who: who[0], quiet: 1 });
}
function groupTick(rep) {
  const g = S.G; if (g.rank < 1) return;
  const won = rep.filter(r => r[0] === 'good' && /tomou|tomamos|A firma tomou/.test(r[1])), lost = rep.filter(r => r[0] === 'bad' && / tomou /.test(r[1])), raid = rep.find(r => r[0] === 'bad' && r[1].startsWith(S.MD.raid));
  const zOf = r => { const i = S.M.z.findIndex(z => r[1].includes(z.n)); return i >= 0 ? i : null; };
  if (lost.length) gsay('lost', zOf(lost[0]));
  else if (won.length) gsay('win', zOf(won[0]));
  if (raid) gsay('raid', zOf(raid));
  const h = g.lastPL; if (h && Math.random() < .5) gsay(h.luc > (g.hist.length > 4 ? sum(g.hist.slice(-5).map(x => x.luc)) / 5 * 1.15 : 1e9) ? 'good' : h.luc < 0 ? 'bad' : 'idle');
}
export const groupWin = z => { if (S.G.rank >= 1 && Math.random() < .7) gsay('win', z); };

// ---------------- ganchos ----------------
export function dayStart() {
  const g = S.G;
  orderStart();
  if (g.rank >= 1 && Math.random() < .6) gsay(g.jail && g.jail.until >= g.day ? 'jail' : 'idle');
  cityEvent();
  objTick(false);
  if (g.story && !g.story.mid && g.story.due <= g.day) sendStep();
  else if (!g.story && g.day >= 3 && g.day - (g.lastStory || 0) >= 2 && Math.random() < .55) {
    const c = STORIES.filter(s => g.rank >= s.min && (s.max == null || g.rank <= s.max) && (!s.modes || s.modes.includes(g.mode)) && !(g.played || []).slice(-4).includes(s.id) && !(s.once && (g.played || []).includes(s.id)) && (!s.need || s.need()));
    const tot = sum(c.map(s => s.weight)); let r = Math.random() * tot, s = c[0];
    for (const x of c) { r -= x.weight; if (r <= 0) { s = x; break; } }
    const data = {};
    if (s && s.init(data)) { g.story = { id: s.id, step: 'a', due: g.day, data, mid: null }; sendStep(); }
  }
}
export function dayEnd(rep) {
  const g = S.G;
  if (g.story && g.story.mid) {
    const m = g.msgs.find(x => x.id === g.story.mid);
    if (m && m.st === 'open') { const def = STORIES.find(s => s.id === g.story.id), step = def.steps[g.story.step]; if (step.timeout) step.timeout(g, g.story.data); endStory(); }
  }
  relationTick(rep);
  objTick(true, rep);
  orderEnd(rep);
  groupTick(rep);
  newsDay(rep);
}
// usado nos testes automáticos
export function forceStory(id) { const s = STORIES.find(x => x.id === id), d = {}; if (!s || !s.init(d)) return false; S.G.story = { id, step: 'a', due: S.G.day, data: d, mid: null }; sendStep(); return true; }
export const storyIds = m => STORIES.filter(s => !s.modes || s.modes.includes(m)).map(s => s.id);
