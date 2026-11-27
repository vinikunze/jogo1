// Árvore de habilidades grande, no estilo RPG: 5 ramos, 8 níveis cada.
// Nos níveis 3 e 6 de cada ramo você escolhe um de dois caminhos (bom ou mau caráter) e fecha o outro.
// fx: efeitos aplicados no engine; al: quanto mexe na fama (+ bom, - mau).
// Os nomes mudam por modo: [facção, milícia, polícia, máfia, cartel].

const COST = [0, 1, 1, 2, 2, 2, 3, 3, 4];
const MIN = [0, 0, 0, 1, 1, 2, 3, 4, 5];

// [ramo, nível, fx, fama, par(letra) , descrição, nomes]
const SLOTS = [
  // ===== Ramo 0: povo =====
  [0, 1, ['loy'], 3, '', 'A lealdade dos moradores sobe 50% mais rápido.', ['Cria do morro', 'Presidente da associação', 'Polícia de proximidade', 'Padrinho do bairro', 'Filho da região']],
  [0, 2, ['srv'], 0, '', 'Serviços cobrados do morador rendem 25% mais.', ['Serviço na veia', 'Gás na porta', 'Ronda paga pelos comércios', 'Proteção dos comércios', 'Pedágio da estrada']],
  [0, 3, ['aloy'], 15, 'g', 'Todo dia +1 de lealdade em todas as suas zonas.', ['Mão estendida', 'Preço justo', 'Pacificação', 'Protettore', 'La mano amiga']],
  [0, 3, ['tax'], -15, 'b', 'Arrecadação +25%, mas a lealdade cai um pouco todo dia.', ['Toque de recolher', 'Taxa obrigatória', 'Pedágio nas áreas', 'Pizzo dobrado', 'Impuesto de guerra']],
  [0, 4, ['rec'], 0, '', 'Recrutar custa 25% menos.', ['Escola da firma', 'Escolinha de futebol', 'Cursos de formação', 'Giovani della famiglia', 'Escola de muchachos']],
  [0, 5, ['srv2'], 0, '', 'Serviços cobrados rendem mais 25% em cima.', ['Gatonet na laje', 'Central de serviços', 'Convênios com o comércio', 'Racket dei servizi', 'Rede de serviços']],
  [0, 6, ['loy2'], 15, 'g', 'A lealdade das suas zonas nunca cai abaixo de 40.', ['Coração da comunidade', 'Bairro fechado com vocês', 'Polícia do povo', 'Il santo protettore', 'Corazón de la región']],
  [0, 6, ['tax2'], -15, 'b', 'Arrecadação +20% em cima, mas a lealdade cai mais rápido.', ['Lei do morro', 'Cobrança porta a porta', 'Arrego geral', 'Il tributo', 'Ley del cartel']],
  [0, 7, ['xp'], 0, '', 'Ganha 20% mais respeito em tudo.', ['Nome na boca do povo', 'Liderança comunitária', 'Comando reconhecido', 'Rispetto', 'Nome nos corridos']],
  [0, 8, ['povo'], 5, '', 'Capstone: +2 de lealdade por dia em todas as zonas e arrecadação +15%.', ['Dono da comunidade', 'Prefeito informal', 'Herói da cidade', 'Padrino di Palermo', 'Santo padroeiro do povo']],
  // ===== Ramo 1: guerra =====
  [1, 1, ['atk'], 0, '', '+15% de força nos ataques.', ['Linha de frente', 'Ex-policiais', 'Operações especiais', 'Picciotti', 'Sicários']],
  [1, 2, ['med'], 0, '', '25% menos baixas nos confrontos.', ['Socorro rápido', 'Treinamento tático', 'Atendimento tático', 'Medico di famiglia', 'Médico do cartel']],
  [1, 3, ['def'], 12, 'g', '+20% de defesa em todas as zonas.', ['Disciplina do bonde', 'Segurança de verdade', 'Regras de engajamento', "Codice d'onore", 'Código da fronteira']],
  [1, 3, ['fear'], -15, 'b', '+10% de ataque e as áreas tomadas já começam obedecendo.', ['Terror', 'Expulsão de moradores', 'Pé na porta', 'Il Terrore', 'Terror en la sierra']],
  [1, 4, ['atk2'], 0, '', 'Mais 10% de força nos ataques.', ['Bonde pesado', 'Patrulha armada', 'Grupamento tático', 'Lupara', 'Armamento pesado']],
  [1, 5, ['act'], 0, '', '+1 ação por dia.', ['Bonde imparável', 'Rede de rádio', 'Ocupação permanente', 'Commissione', 'Comboios']],
  [1, 6, ['shield'], 12, 'g', 'Zona recém-tomada não pode ser atacada nos 3 primeiros dias.', ['Contenção na entrada', 'Divisa fechada', 'Base de ocupação', 'Fortezza', 'Rota segura']],
  [1, 6, ['loot'], -15, 'b', 'Cada zona tomada rende um saque em dinheiro.', ['Saque', 'Despejo', 'Desvio de apreensões', 'Bottino', 'Botín']],
  [1, 7, ['med2'], 0, '', 'Mais 15% de baixas a menos.', ['Médico do morro', 'Enfermaria própria', 'Hospital de campanha', 'Clinica privata', 'Hospital clandestino']],
  [1, 8, ['blitz'], 0, '', 'Capstone: atacar custa só 1 ação.', ['Guerra relâmpago', 'Tomada relâmpago', 'Operação relâmpago', 'Blitz siciliano', 'Guerra relâmpago']],
  // ===== Ramo 2: inteligência =====
  [2, 1, ['intel'], 0, '', 'Vê a tropa de todas as zonas e recebe todo aviso de ataque.', ['Olho vivo', 'Câmeras e informantes', 'Serviço reservado', 'Orecchie ovunque', 'Halcones']],
  [2, 2, ['heat'], 0, '', '30% menos pressão em cada ação.', ['Discrição', 'Laranjas', 'Comunicação social', 'Omertà', 'Discrição']],
  [2, 3, ['build'], 10, 'g', 'Construções 20% mais baratas.', ['Dinheiro limpo', 'Empresa registrada', 'Licitação limpa', 'Imprese pulite', 'Fazendas limpas']],
  [2, 3, ['bribe', 'raid'], -12, 'b', 'Acertos 40% mais baratos e 25% menos operações.', ['Arrego na polícia', 'Delegado amigo', 'Vista grossa', 'Giudice comprato', 'General comprado']],
  [2, 4, ['scout'], 0, '', 'Mandar olheiro não custa dinheiro.', ['Fogueteiros', 'Motoboys informantes', 'Drones', 'Picciotti in giro', 'Drones na fronteira']],
  [2, 5, ['jail'], 0, '', 'Prisão pela metade do tempo e mais rara.', ['Advogado de plantão', 'Habeas corpus', 'Corregedoria amiga', 'Avvocati', 'Advogados em Miami']],
  [2, 6, ['clean'], 12, 'g', 'A pressão cai 2 a mais por dia.', ['Perfil baixo', 'Fachada legal', 'Transparência', 'Basso profilo', 'Perfil baixo']],
  [2, 6, ['kick'], -15, 'b', '+R$ 70 por zona todo dia, mas a pressão sobe 1 por dia.', ['Esquema na pista', 'Grilagem', 'Arrego das bocas', 'Estorsione', 'Narcopropina']],
  [2, 7, ['spy'], 0, '', 'Você sempre sabe quando e onde os rivais vão atacar.', ['X9 dentro dos rivais', 'Infiltrados', 'Escuta autorizada', 'Talpa', 'Infiltrados na DEA']],
  [2, 8, ['ghost'], 0, '', 'Capstone: metade das operações contra você.', ['Fantasma', 'Intocável', 'Blindagem política', 'Invisibile', 'Fantasma do continente']],
  // ===== Ramo 3: negócios =====
  [3, 1, ['trade'], 0, '', 'Compra 10% mais barato e vende 15% mais caro.', ['Atacadista', 'Distribuidor', 'Leilão organizado', 'Mercante', 'Atacadista']],
  [3, 2, ['stor'], 0, '', 'Depósito +50%.', ['Depósito escondido', 'Galpão', 'Pátio ampliado', 'Magazzino', 'Galpões escondidos']],
  [3, 3, ['fair'], 10, 'g', 'Pedidos pagam 10% mais e os compradores confiam mais em você.', ['Palavra de homem', 'Nome limpo na praça', 'Leilão justo', 'Parola data', 'Palavra de patrão']],
  [3, 3, ['gouge'], -10, 'b', 'Vendas 10% mais caras, mas a lealdade cai um pouco todo dia.', ['Preço de guerra', 'Preço de monopólio', 'Taxa de leilão', 'Prezzo del Don', 'Preço de monopólio']],
  [3, 4, ['ordx'], 0, '', 'Mais pedidos com prazo chegam, com 1 dia a mais para entregar.', ['Freguesia fiel', 'Carteira de clientes', 'Convênios', 'Clienti fidati', 'Clientes do norte']],
  [3, 5, ['rentz'], 0, '', '+R$ 40 por zona todo dia em pequenos negócios.', ['Comércio da quebrada', 'Pontos de serviço', 'Parcerias locais', 'Botteghe', 'Negócios de fachada']],
  [3, 6, ['laundry'], 8, 'g', 'Lavagem: -1 de pressão por dia e +R$ 20 por zona.', ['Lavanderia de dinheiro', 'Empresas de fachada', 'Prestação de contas', 'Lavanderia', 'Lavanderia de dólares']],
  [3, 6, ['smuggle'], -10, 'b', 'Depósito dobrado e compra 15% mais barata.', ['Rota do contrabando', 'Carga roubada', 'Apreensão desviada', 'Contrabbando', 'Rota marítima']],
  [3, 7, ['neg'], 0, '', 'Suas contrapropostas são aceitas com mais frequência.', ['Lábia', 'Negociador', 'Mediação', 'Diplomazia', 'Negociador']],
  [3, 8, ['magnata'], 0, '', 'Capstone: negócios e arrecadação rendem 30% mais.', ['Magnata do morro', 'Império da Zona Oeste', 'Gestão modelo', 'Re degli affari', 'Rei das rotas']],
  // ===== Ramo 4: comando =====
  [4, 1, ['crew'], 0, '', 'Cada recrutamento traz 2 a mais.', ['Bonde crescendo', 'Recrutamento', 'Efetivo extra', 'Nuovi picciotti', 'Leva de recrutas']],
  [4, 2, ['upk'], 0, '', 'Salários 20% menores.', ['Folha enxuta', 'Corte de custos', 'Escala otimizada', 'Paga giusta', 'Folha enxuta']],
  [4, 3, ['loyalc'], 10, 'g', 'Ninguém da equipe trai você, e o braço direito confia mais.', ['Sangue no olho', 'Irmandade', 'Espírito de corpo', 'Fratellanza', 'Hermandad']],
  [4, 3, ['iron'], -10, 'b', 'Ninguém deserta quando o caixa fica no vermelho. Por medo.', ['Mão de ferro', 'Disciplina militar', 'Regime duro', 'Pugno di ferro', 'Mão de ferro']],
  [4, 4, ['ten'], 0, '', '+1 vaga de tenente.', ['Gerentes de confiança', 'Chefes de área', 'Oficiais', 'Capidecina', 'Lugartenientes']],
  [4, 5, ['act2'], 0, '', '+1 ação por dia.', ['Agenda cheia', 'Comando ágil', 'Estado-maior', 'Consiglio', 'Comando ágil']],
  [4, 6, ['mentor'], 10, 'g', 'Respeito +20% e a equipe ganha experiência: +10% de força.', ['Formador de cria', 'Escola de liderança', 'Academia', 'Maestro', 'Escola de sicários']],
  [4, 6, ['dread'], -10, 'b', 'Seu nome assusta: +10% de defesa em todas as zonas.', ['Nome temido', 'Fama de cruel', 'Tropa temida', 'Nome che fa paura', 'Nome que dá medo']],
  [4, 7, ['def2'], 0, '', '+15% de defesa em todas as zonas.', ['Fortaleza', 'Quartel', 'Batalhão', 'Roccaforte', 'Fortaleza na selva']],
  [4, 8, ['lenda'], 0, '', 'Capstone: +2 ações por dia, +10% de ataque e de defesa.', ['Lenda do Rio', 'Lenda da milícia', 'Lenda da corporação', 'Leggenda', 'Leyenda']],
];

const BR = {
  faccao: { br: ['Comunidade', 'Guerra', 'Esquema', 'Negócio', 'Comando'], good: 'Cria da comunidade', bad: 'Tirano do morro' },
  milicia: { br: ['Associação', 'Patrulha', 'Laranjas', 'Monopólio', 'Hierarquia'], good: 'Protetor do bairro', bad: 'Extorsionário' },
  policia: { br: ['Comunidade', 'Tática', 'Inteligência', 'Gestão', 'Comando'], good: 'Policial exemplar', bad: 'Banda podre' },
  mafia: { br: ['Famiglia', 'Soldati', 'Omertà', 'Affari', 'Cupola'], good: "Uomo d'onore", bad: 'Il Tiranno' },
  cartel: { br: ['Pueblo', 'Sicários', 'Inteligência', 'Rotas', 'Cúpula'], good: 'Patrón del pueblo', bad: 'El Carnicero' },
};
const MI = { faccao: 0, milicia: 1, policia: 2, mafia: 3, cartel: 4 };

function build(mode) {
  const nodes = SLOTS.map(([b, t, fx, al, pk, d, names]) => ({ id: `n${b}${t}${pk}`, b, t, fx, al, n: names[MI[mode]], d, cost: COST[t], min: MIN[t], pk }));
  nodes.forEach(n => { if (n.pk) n.pair = nodes.find(x => x.b === n.b && x.t === n.t && x.pk && x.pk !== n.pk).id; });
  return { ...BR[mode], nodes, tiers: 8 };
}
export const TREES = Object.fromEntries(Object.keys(BR).map(m => [m, build(m)]));
