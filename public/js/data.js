// Dados do jogo: tipos de zona, modos, cargos, habilidades, construções, mercadorias e conquistas.
// Tudo aqui é ficção. Nomes de zonas, grupos e personagens são inventados.

export const ZT = {
  comunidade: { label: 'Comunidade', slots: 6, com: 1.3, inc: 380, def: 1.35, gar: [7, 10], cap: 60, loy: 55 },
  suburbio:   { label: 'Subúrbio', slots: 5, com: 1.0, inc: 300, def: 1.0, gar: [4, 7], cap: 30, loy: 50 },
  nobre:      { label: 'Área nobre', slots: 5, com: 1.2, inc: 520, def: 1.1, gar: [5, 8], cap: 45, loy: 40 },
  centro:     { label: 'Centro', slots: 6, com: 1.5, inc: 560, def: 1.2, gar: [8, 11], cap: 40, loy: 45 },
  porto:      { label: 'Porto', slots: 5, com: 1.2, inc: 480, def: 1.1, gar: [6, 9], cap: 55, loy: 45 },
  periferia:  { label: 'Periferia', slots: 4, com: 0.75, inc: 260, def: 1.0, gar: [3, 6], cap: 25, loy: 55 },
  capitale:   { label: 'Capital', slots: 7, com: 1.8, inc: 1100, def: 1.5, gar: [16, 20], cap: 80, loy: 40 },
  citta:      { label: 'Cidade', slots: 5, com: 1.1, inc: 420, def: 1.2, gar: [7, 10], cap: 40, loy: 50 },
  costa:      { label: 'Litoral', slots: 5, com: 1.0, inc: 380, def: 1.05, gar: [5, 8], cap: 55, loy: 50 },
  campagna:   { label: 'Interior', slots: 4, com: 0.65, inc: 240, def: 1.0, gar: [3, 6], cap: 20, loy: 60 },
};

export const BCAT = { neg: 'Negócios', srv: 'Serviços para o morador', mor: 'Para o povo', def: 'Defesa', apo: 'Apoio' };
export const SRV_P = [['Barato', .6, 2], ['Justo', 1, .5], ['Caro', 1.5, -2]]; // preço do serviço: [rótulo, receita, lealdade por dia]
export const BLV = [1, 1.6, 2.2]; // força de cada nível
export const TIERS = [['Bem baixo', .7], ['Baixo', .85], ['Médio', 1], ['Alto', 1.2], ['Bem alto', 1.45]];
export const RIVAL_STR = [
  { lbl: 'forte', t: 18, nb: 2, q: 1.25, money: 3000 },
  { lbl: 'médio', t: 13, nb: 1, q: 1.1, money: 2000 },
  { lbl: 'fraco', t: 9, nb: 1, q: .95, money: 1200 },
];

export const XP = [0, 150, 450, 1000, 1800, 3000];
// 12 cargos: os pares (0, 2, 4...) liberam recursos novos; os ímpares são promoções intermediárias
export const XP2 = [0, 80, 150, 300, 450, 700, 1000, 1500, 2200, 3400, 5000, 8000];

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
    name: 'Facção', map: 'rio2', city: 'Rio de Janeiro', color: '#e5484d', player: 'Tropa do Trilho',
    blurb: 'Comece como olheiro ou já como dono da boca. Domine as comunidades, depois o asfalto, depois a cidade.',
    feats: ['53 zonas, 5 rivais', '12 cargos, de olheiro a chefão', 'Baile e contenção', 'Mercado de carga'],
    ranks: ['Olheiro', 'Vapor', 'Soldado', 'Gerente', 'Dono da Boca', 'Patrão'],
    titles: ['Olheiro', 'Fogueteiro', 'Vapor', 'Avião', 'Soldado', 'Contenção', 'Gerente', 'Gerente geral', 'Dono da Boca', 'Frente do complexo', 'Patrão', 'Chefão do Rio'],
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
    ], shop: 'bancas', shopIn: 'nas bancas',
    builds: [
      // cat: neg = negócio, srv = serviço cobrado do morador (você escolhe o preço), mor = para o morador, def = defesa, apo = apoio
      { id: 'boca', cat: 'neg', name: 'Ponto de venda', desc: '+70% de vendas na zona', cost: 1200, eff: { dem: .7 } },
      { id: 'lavajato', cat: 'neg', name: 'Lava-jato de fachada', desc: '+R$ 180 por dia e lava o dinheiro (-1 de pressão)', cost: 1600, eff: { inc: 180, heat: -1 } },
      { id: 'adega', cat: 'neg', name: 'Adega e tabacaria', desc: '+R$ 130 por dia e +100 de depósito', cost: 1300, eff: { inc: 130, stor: 100 } },
      { id: 'mototaxi', cat: 'srv', name: 'Ponto de mototáxi', desc: 'Corrida cobrada do morador', cost: 1100, eff: { srv: 150 } },
      { id: 'gatonet', cat: 'srv', name: 'Gatonet', desc: 'TV e internet cobradas por mês', cost: 1400, eff: { srv: 190 } },
      { id: 'baile', cat: 'srv', name: 'Baile da comunidade', desc: 'Entrada e bar do baile', cost: 1800, eff: { srv: 160, loy: 2 } },
      { id: 'cesta', cat: 'mor', name: 'Cesta básica', desc: '+4 lealdade por dia, R$ 60 por dia de custo', cost: 900, eff: { loy: 4, inc: -60 } },
      { id: 'social', cat: 'mor', name: 'Projeto social', desc: '+5 lealdade por dia', cost: 2200, eff: { loy: 5 } },
      { id: 'creche', cat: 'mor', name: 'Creche comunitária', desc: '+3 lealdade e recrutar fica 5% mais barato', cost: 1700, eff: { loy: 3, rec: .05 } },
      { id: 'contencao', cat: 'def', name: 'Contenção', desc: '+35% de defesa', cost: 1500, eff: { def: .35 } },
      { id: 'barricada', cat: 'def', name: 'Barricadas', desc: '+20% de defesa e a polícia entra menos', cost: 1000, eff: { def: .2, raid: .1 } },
      { id: 'olheiros', cat: 'apo', name: 'Rede de olheiros', desc: 'Vê os vizinhos, avisa ataque, +10% de defesa', cost: 900, eff: { intel: 1, def: .1 } },
      { id: 'radio', cat: 'apo', name: 'Rádio comunitária', desc: '+1 lealdade em todas as suas zonas', cost: 2400, eff: { aloy: 1 } },
    ],
    rivals: [{ name: 'Bonde da Serra', color: '#3b82f6', pool: 'comunidade' }, { name: 'Tropa do Cais', color: '#a855f7', pool: 'comunidade' }, { name: 'Milícia do Asfalto', color: '#22a06b', pool: 'periferia' }, { name: 'Comando do Morro Alto', color: '#eab308', pool: 'comunidade' }, { name: 'Liga da Zona Norte', color: '#06b6d4', pool: 'suburbio' }],
  },
  milicia: {
    name: 'Milícia', map: 'rio2', city: 'Rio de Janeiro', color: '#22a06b', player: 'Patrulha Cidadã',
    blurb: 'Gás, van, sinal de TV e taxa de segurança. Comece como informante ou como chefe de área.',
    feats: ['Forte na periferia', 'Taxas e serviços', 'Investigação', 'Carreira até comandante'],
    ranks: ['Informante', 'Segurança', 'Cobrador', 'Sargento da patrulha', 'Chefe de área', 'Comandante'],
    titles: ['Informante', 'Vigia', 'Segurança', 'Motorista de van', 'Cobrador', 'Cobrador-chefe', 'Sargento da patrulha', 'Subtenente', 'Chefe de área', 'Chefe regional', 'Comandante', 'Comandante-geral'],
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
    ], shop: 'pontos de serviço', shopIn: 'nos pontos de serviço',
    builds: [
      { id: 'loteamento', cat: 'neg', name: 'Loteamento', desc: '+R$ 380 por dia, +1 de pressão', cost: 2600, eff: { inc: 380, heat: 1 } },
      { id: 'net', cat: 'neg', name: 'Central de serviços', desc: '+60% de vendas e +R$ 80 por dia', cost: 1300, eff: { dem: .6, inc: 80 } },
      { id: 'deposito', cat: 'neg', name: 'Depósito de botijão', desc: '+150 de depósito e +R$ 60 por dia', cost: 1100, eff: { stor: 150, inc: 60 } },
      { id: 'gas', cat: 'srv', name: 'Central de gás', desc: 'Botijão vendido só por vocês', cost: 1600, eff: { srv: 240 } },
      { id: 'van', cat: 'srv', name: 'Ponto de van', desc: 'Passagem cobrada do morador', cost: 1400, eff: { srv: 170 } },
      { id: 'agua', cat: 'srv', name: 'Carro-pipa', desc: 'Água vendida quando falta na rua', cost: 1200, eff: { srv: 150 } },
      { id: 'taxa', cat: 'srv', name: 'Taxa de segurança', desc: 'Cobrada de cada comércio da área', cost: 900, eff: { srv: 220, loy: -1 } },
      { id: 'associacao', cat: 'mor', name: 'Associação de moradores', desc: '+5 lealdade, avisa ataque', cost: 2000, eff: { loy: 5, intel: 1 } },
      { id: 'escolinha', cat: 'mor', name: 'Escolinha de futebol', desc: '+3 lealdade e recrutar fica 5% mais barato', cost: 1500, eff: { loy: 3, rec: .05 } },
      { id: 'festa', cat: 'mor', name: 'Festa junina da área', desc: '+4 lealdade por dia', cost: 1700, eff: { loy: 4 } },
      { id: 'patrulha', cat: 'def', name: 'Patrulha armada', desc: '+35% de defesa', cost: 1500, eff: { def: .35 } },
      { id: 'cancela', cat: 'def', name: 'Cancelas nas entradas', desc: '+20% de defesa e a polícia entra menos', cost: 1000, eff: { def: .2, raid: .1 } },
      { id: 'cameras', cat: 'apo', name: 'Câmeras nas ruas', desc: 'Vê os vizinhos, avisa ataque, +10% de defesa', cost: 1100, eff: { intel: 1, def: .1 } },
    ],
    rivals: [{ name: 'Tropa do Trilho', color: '#e5484d', pool: 'comunidade' }, { name: 'Bonde da Serra', color: '#3b82f6', pool: 'comunidade' }, { name: 'Patrulha Oeste', color: '#e07b39', pool: 'periferia' }, { name: 'Comando do Morro Alto', color: '#eab308', pool: 'comunidade' }, { name: 'Liga da Baixada', color: '#a855f7', pool: 'periferia' }],
  },
  policia: {
    name: 'Polícia', map: 'rio2', city: 'Rio de Janeiro', color: '#3b82f6', player: 'Força-Tarefa', budget: 1200,
    blurb: 'Comece como recruta ou já no comando do batalhão. Retome a cidade sem perder o apoio da população.',
    feats: ['Carreira de recruta a comandante', 'Orçamento diário', 'Pressão da mídia', 'Apreensões'],
    ranks: ['Recruta', 'Soldado', 'Sargento', 'Tenente', 'Capitão', 'Comandante'],
    titles: ['Recruta', 'Soldado', 'Cabo', 'Terceiro-sargento', 'Sargento', 'Subtenente', 'Tenente', 'Primeiro-tenente', 'Capitão', 'Major', 'Comandante', 'Coronel comandante'],
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
    ], shop: 'leilões', shopIn: 'nos leilões',
    builds: [
      { id: 'convenio', cat: 'neg', name: 'Convênio com a prefeitura', desc: '+R$ 220 por dia de verba', cost: 2000, eff: { inc: 220 } },
      { id: 'patio', cat: 'neg', name: 'Pátio de apreensões', desc: '+150 de depósito e +40% no leilão', cost: 1400, eff: { stor: 150, dem: .4 } },
      { id: 'saude', cat: 'mor', name: 'Posto de saúde parceiro', desc: '+3 lealdade e +R$ 100 por dia', cost: 1500, eff: { loy: 3, inc: 100 } },
      { id: 'esporte', cat: 'mor', name: 'Projeto esportivo', desc: '+5 lealdade por dia', cost: 1800, eff: { loy: 5 } },
      { id: 'escola', cat: 'mor', name: 'Ronda escolar', desc: '+3 lealdade e menos pressão da mídia (-1)', cost: 1300, eff: { loy: 3, heat: -1 } },
      { id: 'cursos', cat: 'mor', name: 'Cursos profissionalizantes', desc: '+4 lealdade e reforço fica 5% mais barato', cost: 2000, eff: { loy: 4, rec: .05 } },
      { id: 'feira', cat: 'mor', name: 'Feira cultural', desc: '+2 lealdade e +R$ 80 por dia', cost: 1100, eff: { loy: 2, inc: 80 } },
      { id: 'base', cat: 'def', name: 'Base comunitária', desc: '+30% de defesa, +3 lealdade', cost: 2000, eff: { def: .3, loy: 3 } },
      { id: 'blindado', cat: 'def', name: 'Garagem de blindados', desc: '+45% de defesa', cost: 2500, eff: { def: .45 } },
      { id: 'cameras', cat: 'apo', name: 'Câmeras e inteligência', desc: 'Vê os vizinhos, avisa ataque, +10% de defesa', cost: 1200, eff: { intel: 1, def: .1 } },
      { id: 'drone', cat: 'apo', name: 'Central de drones', desc: 'Vê os vizinhos e +15% de defesa', cost: 2200, eff: { intel: 1, def: .15 } },
      { id: 'radio', cat: 'apo', name: 'Rádio e redes da unidade', desc: '+1 lealdade em todas as suas áreas', cost: 2400, eff: { aloy: 1 } },
    ],
    rivals: [{ name: 'Tropa do Trilho', color: '#e5484d', pool: 'comunidade' }, { name: 'Bonde da Serra', color: '#a855f7', pool: 'comunidade' }, { name: 'Milícia do Asfalto', color: '#22a06b', pool: 'periferia' }, { name: 'Comando do Morro Alto', color: '#eab308', pool: 'comunidade' }, { name: 'Patrulha Oeste', color: '#e07b39', pool: 'periferia' }],
  },
  mafia: {
    name: 'Máfia', map: 'sicilia', city: 'Sicília', color: '#c2185b', player: 'Famiglia Rubino',
    blurb: 'Comece como associado ou já como capo. Cidade por cidade até a Capital, com a Antimáfia na cola.',
    feats: ['Sicília inteira, 50 zonas', '12 cargos, até Capo dei capi', 'Cassinos e contrabando', 'Famílias rivais'],
    ranks: ['Associado', 'Picciotto', 'Soldato', 'Capodecina', 'Consigliere', 'Don'],
    titles: ['Associato', 'Galoppino', 'Picciotto', 'Giovane d\'onore', 'Soldato', 'Uomo d\'onore', 'Capodecina', 'Sottocapo', 'Consigliere', 'Capomandamento', 'Don', 'Capo dei capi'],
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
    ], shop: 'negócios', shopIn: 'nos negócios',
    builds: [
      { id: 'cassino', cat: 'neg', name: 'Cassino clandestino', desc: '+R$ 320 por dia, +1 de pressão', cost: 2200, eff: { inc: 320, heat: 1 } },
      { id: 'ristorante', cat: 'neg', name: 'Restaurante de fachada', desc: '+R$ 140 por dia, -1 de pressão', cost: 1400, eff: { inc: 140, heat: -1 } },
      { id: 'lavanderia', cat: 'neg', name: 'Lavanderia', desc: '+R$ 200 por dia e lava o dinheiro (-1 de pressão)', cost: 1800, eff: { inc: 200, heat: -1 } },
      { id: 'cantiere', cat: 'neg', name: 'Construtora', desc: '+R$ 360 por dia, +1 de pressão', cost: 2600, eff: { inc: 360, heat: 1 } },
      { id: 'armazem', cat: 'neg', name: 'Armazém do porto', desc: '+200 de depósito e +40% de vendas', cost: 1600, eff: { stor: 200, dem: .4 } },
      { id: 'pizzo', cat: 'srv', name: 'Pizzo dos comércios', desc: 'Proteção cobrada de cada loja', cost: 900, eff: { srv: 230, loy: -1 } },
      { id: 'usura', cat: 'srv', name: 'Agiotagem', desc: 'Empréstimo com juros para quem precisa', cost: 1300, eff: { srv: 190 } },
      { id: 'chiesa', cat: 'mor', name: 'Doação à paróquia', desc: '+5 lealdade por dia', cost: 1800, eff: { loy: 5 } },
      { id: 'santo', cat: 'mor', name: 'Festa do santo padroeiro', desc: '+4 lealdade por dia', cost: 1600, eff: { loy: 4 } },
      { id: 'lavoro', cat: 'mor', name: 'Empregos na obra', desc: '+3 lealdade e recrutar fica 5% mais barato', cost: 1500, eff: { loy: 3, rec: .05 } },
      { id: 'guardie', cat: 'def', name: 'Guarda-costas', desc: '+35% de defesa, avisa ataque', cost: 1500, eff: { def: .35, intel: 1 } },
      { id: 'omerta', cat: 'apo', name: 'Pacto de silêncio', desc: 'A polícia entra menos e -1 de pressão', cost: 2000, eff: { raid: .15, heat: -1 } },
    ],
    rivals: [{ name: 'Famiglia Varone', color: '#2f80ed', pool: 'citta' }, { name: 'Famiglia Lo Cascio', color: '#1fa38a', pool: 'citta' }, { name: 'Famiglia Randazzo', color: '#e07b39', pool: 'campagna' }, { name: 'Famiglia Catalano', color: '#eab308', pool: 'citta' }, { name: 'Clan dei Pastori', color: '#8b5cf6', pool: 'campagna' }],
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

// Reta final de cada modo: ao chegar em 40% do mapa os rivais se unem contra você.
// Segure 35% e a sua base até o fim do cerco para quebrar a aliança. A vitória final é dominar a cidade inteira.
export const FINALS = {
  faccao: {
    name: 'A guerra pelo Rio', from: 'braco',
    start: 'Chefe, deu ruim. Os outros comandos fecharam aliança contra a gente e o governo prometeu ocupar as nossas comunidades. Se a gente segurar essa semana, o Rio é nosso.',
    opts: [['def', 'Fechar todas as entradas', 4000], ['pol', 'Acertar com quem manda na cidade', 5000], ['atk', 'Chamar os aliados de outros morros', 3000]],
    win: 'A aliança desmoronou. Os outros comandos estão fracos e divididos. Agora é tomar o resto do Rio, morro por morro.', title: 'Dono do Rio', epi: 'Os outros comandos recuaram e ninguém mais sobe o morro sem a sua palavra. Do baile às bancas, o Rio inteiro sabe o nome de quem manda.',
  },
  milicia: {
    name: 'A CPI da milícia', from: 'advogado',
    start: 'Abriram uma CPI com o nosso nome e os grupos rivais se juntaram para tomar a Zona Oeste enquanto a gente se defende. É agora ou nunca.',
    opts: [['def', 'Dobrar a patrulha nas divisas', 4000], ['pol', 'Comprar votos na CPI', 5000], ['atk', 'Chamar os ex-policiais de fora', 3000]],
    win: 'A CPI acabou sem nada contra a gente e os rivais racharam. Agora é engolir o que sobrou da cidade, rua por rua.', title: 'Patrão da Zona Oeste', epi: 'A CPI terminou em pizza e os rivais foram engolidos um a um. Gás, sinal, transporte e voto: tudo passa por você.',
  },
  policia: {
    name: 'A operação final', from: 'chefe',
    start: 'As facções fizeram um pacto contra a nossa ocupação. O governador quer resultado em uma semana. Segura as áreas e a pacificação vira modelo para o país.',
    opts: [['def', 'Instalar bases fixas em todas as áreas', 4000], ['pol', 'Pedir apoio da Força Nacional', 5000], ['atk', 'Montar uma força tarefa de elite', 3000]],
    win: 'O pacto das facções caiu. Agora é ocupar as áreas que faltam, uma por uma, até não sobrar nenhuma.', title: 'Comandante-Geral', epi: 'O pacto das facções ruiu e as áreas seguem ocupadas. Você virou Comandante-Geral e o seu modelo de policiamento vai ser copiado pelo Brasil.',
  },
  mafia: {
    name: 'Il Maxiprocesso', from: 'advogado',
    start: 'O Estado abriu o maior processo da história contra as famílias e as outras famílias se uniram contra nós. Se a gente atravessar essa semana, a Sicília é nossa.',
    opts: [['def', 'Fechar a família, ninguém fala', 4000], ['pol', 'Comprar um juiz em Roma', 5000], ['atk', 'Trazer os primos de Nova York', 3000]],
    win: 'O Maxiprocesso não pegou ninguém e as outras famílias estão divididas. Agora é tomar o resto da Sicília.', title: 'Capo dei capi', epi: 'O processo acabou sem ninguém da família condenado e as outras famílias beijaram o seu anel. De Palermo ao porto, nada acontece sem a sua bênção.',
  },
};
