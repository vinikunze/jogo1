// Dados do jogo: tipos de zona, modos, cargos, habilidades, construções, mercadorias e conquistas.
// Tudo aqui é ficção. Nomes de zonas, grupos e personagens são inventados.

export const ZT = {
  comunidade: { label: 'Comunidade', com: 1.3, inc: 380, def: 1.35, gar: [7, 10], cap: 60, loy: 55 },
  suburbio:   { label: 'Subúrbio', com: 1.0, inc: 300, def: 1.0, gar: [4, 7], cap: 30, loy: 50 },
  nobre:      { label: 'Área nobre', com: 1.2, inc: 520, def: 1.1, gar: [5, 8], cap: 45, loy: 40 },
  centro:     { label: 'Centro', com: 1.5, inc: 560, def: 1.2, gar: [8, 11], cap: 40, loy: 45 },
  porto:      { label: 'Porto', com: 1.2, inc: 480, def: 1.1, gar: [6, 9], cap: 55, loy: 45 },
  periferia:  { label: 'Periferia', com: 0.75, inc: 260, def: 1.0, gar: [3, 6], cap: 25, loy: 55 },
  capitale:   { label: 'Capital', com: 1.8, inc: 1100, def: 1.5, gar: [16, 20], cap: 80, loy: 40 },
  citta:      { label: 'Cidade', com: 1.1, inc: 420, def: 1.2, gar: [7, 10], cap: 40, loy: 50 },
  costa:      { label: 'Litoral', com: 1.0, inc: 380, def: 1.05, gar: [5, 8], cap: 55, loy: 50 },
  campagna:   { label: 'Interior', com: 0.65, inc: 240, def: 1.0, gar: [3, 6], cap: 20, loy: 60 },
};

export const TIERS = [['Bem baixo', .7], ['Baixo', .85], ['Médio', 1], ['Alto', 1.2], ['Bem alto', 1.45]];
export const RIVAL_STR = [
  { lbl: 'forte', t: 18, nb: 2, q: 1.25, money: 3000 },
  { lbl: 'médio', t: 13, nb: 1, q: 1.1, money: 2000 },
  { lbl: 'fraco', t: 9, nb: 1, q: .95, money: 1200 },
];

export const XP = [0, 150, 450, 1000, 1800, 3000];

export const UNLOCK = [
  { key: 'zap', label: 'Celular e missões do chefe' },
  { key: 'crew', label: 'Montar equipe: recrutar e mover tropa' },
  { key: 'attack', label: 'Comandar ataques e comprar armas' },
  { key: 'build', label: 'Construir nas zonas e definir a taxa' },
  { key: 'market', label: 'Mercado, fornecedores, compradores e acertos' },
  { key: 'boss', label: 'Diplomacia com rivais e controle total' },
];

export const SKILLS = [
  { id: 'loy', name: 'Carisma', desc: 'A lealdade dos moradores sobe 50% mais rápido.', min: 0 },
  { id: 'heat', name: 'Discrição', desc: '30% menos pressão em cada ação.', min: 0 },
  { id: 'def', name: 'Muralha', desc: '+20% de defesa em todas as suas zonas.', min: 1 },
  { id: 'rec', name: 'Recrutador', desc: 'Recrutar custa 25% menos.', min: 1 },
  { id: 'intel', name: 'Olho vivo', desc: 'Vê a tropa de todas as zonas e recebe todo aviso de ataque.', min: 1 },
  { id: 'atk', name: 'Linha de frente', desc: '+15% de força nos ataques.', min: 2 },
  { id: 'med', name: 'Socorro rápido', desc: '25% menos baixas nos confrontos.', min: 2 },
  { id: 'act', name: 'Estrategista', desc: '+1 ação por dia.', min: 3 },
  { id: 'trade', name: 'Negociador', desc: 'Compra 10% mais barato e vende 15% mais caro.', min: 4 },
];

const C = (id, name, role, min, max = 9) => ({ id, name, role, min, max });

export const MODES = {
  faccao: {
    name: 'Facção', map: 'rio', city: 'Rio de Janeiro', color: '#e5484d', player: 'Tropa do Trilho',
    blurb: 'Comece como olheiro ou já como dono da boca. Domine as comunidades, depois o asfalto, depois a cidade.',
    feats: ['32 zonas', 'Carreira de olheiro a patrão', 'Baile e contenção', 'Mercado de carga'],
    ranks: ['Olheiro', 'Vapor', 'Soldado', 'Gerente', 'Dono da Boca', 'Patrão'],
    starts: [[0, 'Do zero', 'Olheiro. Só tem o celular e as ordens do chefe.'], [2, 'Linha de frente', 'Soldado. Já comanda a tropa no confronto.'], [4, 'Dono da boca', 'Manda na área, compra, vende e constrói.']],
    startPool: t => t === 'comunidade', startTxt: 'Escolha a comunidade onde a sua história começa.',
    inc: { comunidade: 1.5 }, unit: 'soldados', u1: 'soldado', heat: 'Calor da polícia', heatAtk: 8,
    bribe: 'Pagar o arrego', raid: 'Operação policial', big: 'Ocupação policial', attackVerb: 'Invadir', you: 'patrão',
    recruit: ['Bonde novo', '10 soldados chegando na base'],
    luck: ['A carga chegou inteira', 'O baile bateu recorde', 'Um fornecedor liberou fiado'],
    join: 'Moleques da área pediram para entrar', traitor: 'Tinha X9 na contenção de',
    words: { load: 'a carga', cops: 'os homens', money: 'o arrego', hood: 'a quebrada', team: 'a rapaziada' },
    contacts: [C('chefe', 'Coroa', 'Seu chefe', 0, 4), C('braco', 'Menor Grilo', 'Braço direito', 2), C('olheiro', 'Fofão', 'Olheiro', 0), C('morador', 'Dona Cida', 'Associação de moradores', 3),
      C('advogado', 'Dr. Valter', 'Advogado', 3), C('fornecedor', 'Paraguaio', 'Fornecedor', 4), C('comprador', 'Doutor Lima', 'Comprador', 4), C('politico', 'Vereador Peixoto', 'Político', 4)],
    goods: [
      { id: 'comum', name: 'Carga comum', unit: 'un.', buy: 30, ref: 70, dem: 1.2, pref: { comunidade: 1.4, suburbio: 1.1, periferia: 1, nobre: .6, centro: 1, porto: .9 } },
      { id: 'premium', name: 'Carga premium', unit: 'un.', buy: 95, ref: 200, dem: 0.33, pref: { nobre: 2.2, centro: 1.6, comunidade: .5, suburbio: .7, periferia: .4, porto: .9 } },
      { id: 'eletro', name: 'Eletrônicos desviados', unit: 'un.', buy: 60, ref: 125, dem: 0.53, pref: { suburbio: 1.4, centro: 1.3, periferia: 1.1, comunidade: 1, nobre: .6, porto: 1.1 } },
    ], shop: 'bancas',
    builds: [
      { id: 'baile', name: 'Baile da comunidade', desc: '+3 lealdade e +R$ 120 por dia', cost: 1800, eff: { loy: 3, inc: 120 } },
      { id: 'contencao', name: 'Contenção', desc: '+35% de defesa', cost: 1500, eff: { def: .35 } },
      { id: 'boca', name: 'Ponto de venda', desc: '+70% de vendas na zona', cost: 1200, eff: { dem: .7 } },
      { id: 'social', name: 'Projeto social', desc: '+5 lealdade por dia', cost: 2200, eff: { loy: 5 } },
      { id: 'olheiros', name: 'Rede de olheiros', desc: 'Vê a tropa dos vizinhos, avisa ataque, +10% defesa', cost: 900, eff: { intel: 1, def: .1 } },
    ],
    rivals: [{ name: 'Bonde da Serra', color: '#3b82f6', pool: 'comunidade' }, { name: 'Tropa do Cais', color: '#a855f7', pool: 'comunidade' }, { name: 'Milícia do Asfalto', color: '#22a06b', pool: 'periferia' }],
  },
  milicia: {
    name: 'Milícia', map: 'rio', city: 'Rio de Janeiro', color: '#22a06b', player: 'Patrulha Cidadã',
    blurb: 'Gás, van, sinal de TV e taxa de segurança. Comece como informante ou como chefe de área.',
    feats: ['Forte na periferia', 'Taxas e serviços', 'Investigação', 'Carreira até comandante'],
    ranks: ['Informante', 'Segurança', 'Cobrador', 'Sargento da patrulha', 'Chefe de área', 'Comandante'],
    starts: [[0, 'Do zero', 'Informante. Leva recado e vigia a área.'], [2, 'Cobrador', 'Já comanda a patrulha na rua.'], [4, 'Chefe de área', 'Controla serviços, taxas e contatos.']],
    startPool: t => t === 'periferia' || t === 'suburbio', startTxt: 'Escolha a área da periferia ou do subúrbio onde a patrulha começa.',
    inc: { periferia: 1.6, suburbio: 1.4 }, unit: 'homens', u1: 'homem', heat: 'Investigação', heatAtk: 6,
    bribe: 'Acerto com político', raid: 'Operação do Ministério Público', big: 'Força-tarefa federal', attackVerb: 'Tomar a área', you: 'comandante',
    recruit: ['Contratar homens', '10 ex-seguranças para a patrulha'],
    luck: ['A taxa do gás rendeu acima do esperado', 'Contrato de van renovado', 'Loteamento irregular vendeu tudo'],
    join: 'Ex-seguranças querem entrar no grupo', traitor: 'Racha interno em',
    words: { load: 'os botijões', cops: 'a investigação', money: 'o acerto', hood: 'a área', team: 'a patrulha' },
    contacts: [C('chefe', 'Sargento Brito', 'Seu chefe', 0, 4), C('braco', 'Cabo Moura', 'Braço direito', 2), C('olheiro', 'Tonhão', 'Informante', 0), C('morador', 'Dona Cida', 'Associação de moradores', 3),
      C('advogado', 'Dr. Valter', 'Advogado', 3), C('fornecedor', 'Distribuidora Rocha', 'Fornecedor', 4), C('comprador', 'Seu Arlindo', 'Comerciante', 4), C('politico', 'Vereador Peixoto', 'Político', 4)],
    goods: [
      { id: 'gas', name: 'Botijões de gás', unit: 'bot.', buy: 55, ref: 100, dem: 0.9, pref: { periferia: 1.4, suburbio: 1.2, comunidade: 1.1, nobre: .3, centro: .5, porto: .6 } },
      { id: 'tv', name: 'Assinaturas de gatonet', unit: 'ass.', buy: 18, ref: 50, dem: 1.35, pref: { suburbio: 1.3, periferia: 1.2, comunidade: 1.2, nobre: .5, centro: .6, porto: .7 } },
      { id: 'agua', name: 'Galões de água', unit: 'gal.', buy: 6, ref: 16, dem: 3.3, pref: { periferia: 1.3, suburbio: 1.1, comunidade: 1.1, nobre: .6, centro: .7, porto: .8 } },
    ], shop: 'pontos de serviço',
    builds: [
      { id: 'gas', name: 'Central de gás', desc: '+R$ 260 por dia, -1 lealdade', cost: 1600, eff: { inc: 260, loy: -1 } },
      { id: 'net', name: 'Central de serviços', desc: '+60% de vendas e +R$ 80 por dia', cost: 1300, eff: { dem: .6, inc: 80 } },
      { id: 'van', name: 'Ponto de van', desc: '+R$ 160 por dia, +1 lealdade', cost: 1400, eff: { inc: 160, loy: 1 } },
      { id: 'patrulha', name: 'Patrulha armada', desc: '+35% de defesa', cost: 1500, eff: { def: .35 } },
      { id: 'associacao', name: 'Associação de moradores', desc: '+5 lealdade, avisa ataque', cost: 2000, eff: { loy: 5, intel: 1 } },
    ],
    rivals: [{ name: 'Tropa do Trilho', color: '#e5484d', pool: 'comunidade' }, { name: 'Bonde da Serra', color: '#3b82f6', pool: 'comunidade' }, { name: 'Patrulha Oeste', color: '#e07b39', pool: 'periferia' }],
  },
  policia: {
    name: 'Polícia', map: 'rio', city: 'Rio de Janeiro', color: '#3b82f6', player: 'Força-Tarefa', budget: 1200,
    blurb: 'Comece como recruta ou já no comando do batalhão. Retome a cidade sem perder o apoio da população.',
    feats: ['Carreira de recruta a comandante', 'Orçamento diário', 'Pressão da mídia', 'Apreensões'],
    ranks: ['Recruta', 'Soldado', 'Sargento', 'Tenente', 'Capitão', 'Comandante'],
    starts: [[0, 'Recruta', 'Acabou de sair da academia. Cumpre ordens.'], [2, 'Sargento', 'Já lidera a equipe nas operações.'], [4, 'Capitão', 'Comanda o batalhão, as bases e o orçamento.']],
    startPool: t => t === 'centro' || t === 'nobre' || t === 'suburbio', startTxt: 'Escolha o batalhão de onde as operações saem.',
    inc: {}, unit: 'agentes', u1: 'agente', heat: 'Pressão da mídia', heatAtk: 0,
    bribe: 'Coletiva de imprensa', raid: 'Emboscada', big: 'Comando afastado pela mídia', attackVerb: 'Fazer operação', you: 'comandante',
    recruit: ['Convocar agentes', '10 agentes saídos da academia'],
    luck: ['Verba extra liberada pelo governo', 'Convênio federal aprovado', 'Doação de equipamentos chegou'],
    join: 'Uma turma nova saiu da academia', traitor: 'Agentes corrompidos desertaram em',
    words: { load: 'o material apreendido', cops: 'a corregedoria', money: 'a verba', hood: 'o setor', team: 'a equipe' },
    contacts: [C('chefe', 'Coronel Andrade', 'Seu comandante', 0, 4), C('braco', 'Sargento Lopes', 'Braço direito', 2), C('olheiro', 'Informante X', 'Informante', 0), C('morador', 'Dona Cida', 'Associação de moradores', 3),
      C('advogado', 'Assessoria jurídica', 'Jurídico', 3), C('comprador', 'Leiloeiro Ramos', 'Leilão de apreensões', 4), C('politico', 'Secretário Paiva', 'Secretaria de Segurança', 4)],
    goods: [
      { id: 'apreensao', name: 'Material apreendido (leilão)', unit: 'lotes', buy: null, ref: 60, dem: 0.75, pref: {} },
    ], shop: 'leilões',
    builds: [
      { id: 'base', name: 'Base comunitária', desc: '+30% de defesa, +3 lealdade', cost: 2000, eff: { def: .3, loy: 3 } },
      { id: 'cameras', name: 'Câmeras e inteligência', desc: 'Vê a tropa dos vizinhos, avisa ataque, +10% defesa', cost: 1200, eff: { intel: 1, def: .1 } },
      { id: 'esporte', name: 'Projeto esportivo', desc: '+5 lealdade por dia', cost: 1800, eff: { loy: 5 } },
      { id: 'saude', name: 'Posto de saúde parceiro', desc: '+3 lealdade e +R$ 100 por dia', cost: 1500, eff: { loy: 3, inc: 100 } },
      { id: 'blindado', name: 'Garagem de blindados', desc: '+45% de defesa', cost: 2500, eff: { def: .45 } },
    ],
    rivals: [{ name: 'Tropa do Trilho', color: '#e5484d', pool: 'comunidade' }, { name: 'Bonde da Serra', color: '#a855f7', pool: 'comunidade' }, { name: 'Milícia do Asfalto', color: '#22a06b', pool: 'periferia' }],
  },
  mafia: {
    name: 'Máfia', map: 'palermo', city: 'Sicília', color: '#c2185b', player: 'Famiglia Rubino',
    blurb: 'Comece como associado ou já como capo. Cidade por cidade até a Capital, com a Antimáfia na cola.',
    feats: ['22 zonas', 'Carreira até Don', 'Cassinos e contrabando', 'Famílias rivais'],
    ranks: ['Associado', 'Picciotto', 'Soldato', 'Capodecina', 'Consigliere', 'Don'],
    starts: [[0, 'Associado', 'Ainda não fez o juramento. Faz favores.'], [2, 'Soldato', 'Homem feito, comanda o grupo na rua.'], [4, 'Consigliere', 'Cuida dos negócios, contatos e da política.']],
    startPool: t => t === 'citta' || t === 'campagna', startTxt: 'Escolha a cidade natal da família.',
    inc: { capitale: 1.2, costa: 1.3 }, unit: 'picciotti', u1: 'picciotto', heat: 'Antimáfia', heatAtk: 7,
    bribe: 'Comprar um juiz', raid: 'Blitz dos Carabinieri', big: 'Maxiprocesso contra a família', attackVerb: 'Tomar a cidade', you: 'Don',
    recruit: ['Chamar picciotti', '10 rapazes jurando lealdade'],
    luck: ['Um navio de contrabando atracou', 'As obras públicas pagaram a parte da família', 'Dívida antiga foi quitada'],
    join: 'Primos do interior chegaram para trabalhar', traitor: 'Um pentito abriu a boca em',
    words: { load: 'o contrabando', cops: 'os Carabinieri', money: 'o envelope', hood: 'a cidade', team: 'os rapazes' },
    contacts: [C('chefe', 'Don Rubino', 'O chefe da família', 0, 4), C('braco', 'Salvo', 'Braço direito', 2), C('olheiro', 'Peppino', 'Olhos na rua', 0), C('morador', 'Padre Ignazio', 'Paróquia', 3),
      C('advogado', 'Avvocato Ferri', 'Advogado', 3), C('fornecedor', 'Il Marinaio', 'Contrabandista', 4), C('comprador', 'Signor Greco', 'Comprador', 4), C('politico', 'Assessore Lo Monte', 'Político', 4)],
    goods: [
      { id: 'cigarros', name: 'Cigarros de contrabando', unit: 'pct.', buy: 20, ref: 48, dem: 1.5, pref: { citta: 1.2, costa: 1.1, capitale: 1.4, campagna: .8 } },
      { id: 'vinho', name: 'Vinho sem selo', unit: 'cx.', buy: 40, ref: 88, dem: 0.75, pref: { capitale: 1.5, costa: 1.3, citta: 1.1, campagna: .7 } },
      { id: 'porto', name: 'Mercadoria do porto', unit: 'cx.', buy: 85, ref: 170, dem: 0.36, pref: { costa: 1.8, capitale: 1.6, citta: 1, campagna: .5 } },
    ], shop: 'negócios',
    builds: [
      { id: 'cassino', name: 'Cassino clandestino', desc: '+R$ 320 por dia, +1 de pressão', cost: 2200, eff: { inc: 320, heat: 1 } },
      { id: 'ristorante', name: 'Restaurante de fachada', desc: '+R$ 140 por dia, -1 de pressão', cost: 1400, eff: { inc: 140, heat: -1 } },
      { id: 'armazem', name: 'Armazém do porto', desc: '+200 de depósito e +40% de vendas', cost: 1600, eff: { stor: 200, dem: .4 } },
      { id: 'chiesa', name: 'Doação à paróquia', desc: '+5 lealdade por dia', cost: 1800, eff: { loy: 5 } },
      { id: 'guardie', name: 'Guarda-costas', desc: '+35% de defesa, avisa ataque', cost: 1500, eff: { def: .35, intel: 1 } },
    ],
    rivals: [{ name: 'Famiglia Varone', color: '#2f80ed', pool: 'citta' }, { name: 'Famiglia Lo Cascio', color: '#1fa38a', pool: 'citta' }, { name: 'Famiglia Randazzo', color: '#e07b39', pool: 'campagna' }],
  },
};

export const SOON = [
  { name: 'Cartel', city: 'Sinaloa, México', color: '#e07b39', blurb: 'Rotas, plantações e a fronteira.' },
  { name: 'Yakuza', city: 'Tóquio, Japão', color: '#a855f7', blurb: 'Clãs, cassinos e o porto.' },
];

export const ACH = [
  { id: 'first', name: 'Primeira conquista', desc: 'Tome a sua primeira zona.' },
  { id: 'five', name: 'Cinco zonas', desc: 'Domine 5 zonas ao mesmo tempo.' },
  { id: 'ten', name: 'Dez zonas', desc: 'Domine 10 zonas ao mesmo tempo.' },
  { id: 'r3', name: 'Respeito', desc: 'Chegue ao quarto cargo.' },
  { id: 'r5', name: 'No topo', desc: 'Chegue ao cargo mais alto.' },
  { id: 'rich', name: 'Caixa forte', desc: 'Junte R$ 20.000 em caixa.' },
  { id: 'builder', name: 'Construtor', desc: 'Tenha 5 construções.' },
  { id: 'loyal', name: 'Amado pelo povo', desc: 'Leve uma zona a 90 de lealdade.' },
  { id: 'survivor', name: 'Sobrevivente', desc: 'Aguente uma operação grande.' },
  { id: 'killer', name: 'Fim da linha', desc: 'Elimine um rival.' },
  { id: 'trader', name: 'Comerciante', desc: 'Venda 300 unidades no mercado.' },
  { id: 'defender', name: 'Muralha', desc: 'Segure 5 ataques.' },
];
