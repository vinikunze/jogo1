// Rádio e jornal de cada modo: manchetes do dia a partir do que aconteceu no mapa.
import { S, pick } from './engine.js';

export const MAST = {
  faccao: { name: 'Rádio Comunidade FM', sub: '98,7 · a voz do morro', app: 'Rádio', kind: 'radio' },
  milicia: { name: 'Rádio da Associação', sub: 'informes da Zona Oeste', app: 'Rádio', kind: 'radio' },
  policia: { name: 'COPOM · Rede rádio', sub: 'ocorrências e imprensa', app: 'COPOM', kind: 'copom' },
  cartel: { name: 'Radio Frontera', sub: 'noticias del continente', app: 'Radio', kind: 'radio' },
  mafia: { name: 'Giornale di Sicilia', sub: 'cronaca di Palermo', app: 'Giornale', kind: 'paper' },
};
const H = {
  cartel: {
    pwin: ['Rota em {z} mudou de dono. Caminhoneiros pagam pedágio novo desde hoje.', 'Tiroteio de madrugada em {z}: o {p} assumiu a região.', 'Moradores de {z} dizem que agora quem manda é outro patrão.'],
    rwin: ['Guerra de cartéis em {z}: {r} assumiu a rota.', 'Pistas clandestinas em {z} trocaram de mãos.'],
    plost: ['{z} escapou das mãos do {p}. A rota está fechada.'],
    raid: ['Operação conjunta com a DEA em {z}: laboratório destruído.', 'Helicópteros do exército sobrevoam {z} desde cedo.'],
    fill: ['Chuva forte fecha a estrada da serra.', 'Seleção vence o clássico do continente.', 'Preço do ouro bate recorde.', 'Festa do padroeiro reúne o povoado.', 'Fronteira com fila de caminhões há três dias.', 'Rio sobe dois metros na época das chuvas.'],
  },
  faccao: {
    pwin: ['Atenção, comunidade: {z} agora está sob nova administração. Comércio funcionando normal.', 'Fogos na madrugada em {z}. Moradores contam que o comando mudou.', '{z} amanheceu com a bandeira da {p}. Rádio pede calma.'],
    rwin: ['Confronto em {z}: {r} assumiu a área. Evitem circular à noite.', 'Moradores de {z} acordaram com tiroteio. A área mudou de mãos.'],
    plost: ['{z} perdeu a paz: invasão durante a noite. A rádio pede calma aos moradores.'],
    raid: ['Operação policial em {z} deixou escolas fechadas hoje.', 'Caveirão em {z}: o comércio baixou as portas cedo.'],
    fill: ['Baile do fim de semana confirmado na quadra.', 'Campanha do agasalho na associação: doe o que puder.', 'Calor de 40 graus: tem água gelada na barraca da Tia Neide.', 'Futebol de várzea: final no domingo às 9h.', 'Falta d\'água de novo na parte alta.', 'Mototáxi agora aceita Pix.', 'Pastor Josué convida para o culto de sábado.'],
  },
  milicia: {
    pwin: ['Informe da associação: {z} agora conta com a segurança da {p}.', 'Nova taxa de segurança começa a valer em {z} na segunda.'],
    rwin: ['Mudança de comando em {z}: {r} assumiu os pontos de gás e van.'],
    plost: ['Moradores de {z} relatam troca de patrulha durante a noite.'],
    raid: ['Ministério Público faz operação em {z}. A associação diz que tudo é legal.', 'Federais em {z}: centrais de gás lacradas.'],
    fill: ['Botijão a preço de sempre na central. Evite comprar de fora.', 'Van extra no horário de pico a partir de segunda.', 'Reunião da associação quinta às 20h.', 'Obra da praça vai atrasar mais um mês.', 'Sinal da TV volta ao normal depois da chuva.', 'Bingo beneficente no sábado, prêmio é uma moto.'],
  },
  policia: {
    pwin: ['QAP: {p} estabeleceu base em {z}. Área sob controle.', 'Imprensa: polícia ocupa {z} e anuncia projeto social.', 'Material apreendido em {z} segue para o pátio.'],
    rwin: ['COPOM informa: confronto entre grupos em {z}. {r} assumiu a área.', 'Ocorrência em {z}: troca de tiros entre grupos rivais.'],
    plost: ['QRU: equipe recuou de {z} após ataque. Solicitado apoio.'],
    raid: ['Viatura atacada em {z}. Sem feridos graves.', 'Emboscada em {z}: equipe responde e recua.'],
    fill: ['Trânsito lento na Avenida Brasil.', 'Previsão: calor forte e pancadas no fim da tarde.', 'Secretaria anuncia novo concurso para soldado.', 'Imprensa questiona gastos com blindados.', 'Clássico no Maracanã reforça o policiamento no domingo.', 'Ronda escolar volta na segunda.'],
  },
  mafia: {
    pwin: ['Palermo, nuovi equilibri a {z}: negozi chiusi per un giorno.', 'Silenzio a {z}. I commercianti sanno già a chi pagare.'],
    rwin: ['Guerra di mafia a {z}: {r} prende il controllo.', 'Agguato a {z}: la {r} avanza.'],
    plost: ['{z}: la {p} perde terreno.'],
    raid: ['Blitz dei Carabinieri a {z}: sequestrati documenti e contanti.', 'Guardia di Finanza a {z}: ristoranti sotto controllo.'],
    fill: ['Scirocco su Palermo: 38 gradi.', 'Festa di Santa Rosalia: processione domenica.', 'Il Palermo vince in casa 2 a 1.', 'Porto di Palermo: sciopero dei portuali.', 'Arancine o arancini? La polemica continua.', 'Turisti in aumento a Cefalù.'],
  },
};
export function newsDay(rep) {
  const g = S.G, m = g.mode, L = H[m] || H.faccao, out = [];
  const zOf = t => { const z = S.M.z.find(z => t.includes(z.n)); return z ? z.n : 'uma área'; };
  const rOf = t => { const f = g.f.find(f => t.includes(f.name)); return f ? f.name : 'um grupo rival'; };
  const fill = (s, t) => s.replace('{z}', zOf(t)).replace('{r}', rOf(t)).replace('{p}', g.pname);
  for (const l of g.log.filter(l => l.d === g.day)) {
    if (out.length >= 3) break;
    if (!/ tomou /.test(l.t) && !/^Você tomou/.test(l.t)) continue;
    const mine = l.t.startsWith('Você tomou') || l.t.startsWith(g.pname + ' tomou');
    const lost = !mine && /de você|de .*sua/.test(l.t);
    out.push({ k: mine ? 'good' : lost ? 'bad' : '', t: fill(pick(mine ? L.pwin : lost ? L.plost : L.rwin), l.t) });
  }
  const raid = rep.find(r => r[0] === 'bad' && r[1].startsWith(S.MD.raid));
  if (raid && out.length < 4) out.push({ k: 'bad', t: fill(pick(L.raid), raid[1]) });
  if (g.cev && g.cev.until >= g.day && g.cev.from === undefined) { g.cev.from = g.day; out.unshift({ k: 'ev', t: `${g.cev.name}: ${g.cev.text}` }); }
  out.push({ k: '', t: pick(L.fill.filter(x => !(g.news || []).slice(0, 6).some(n => n.t === x))) || pick(L.fill) });
  g.news = [...out.map(o => ({ d: g.day, ...o })), ...(g.news || [])].slice(0, 60);
}
