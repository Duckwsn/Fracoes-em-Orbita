/**
 * events.js
 * As 12 Cartas de Evento. São sorteadas quando um jogador termina
 * EXATAMENTE em um setor de evento (3, 6 ou 9).
 *
 * type: 'beneficio' -> vai para a mão do jogador (máx. 2), pode ser
 *       ativada voluntariamente (no máx. 1 por missão).
 * type: 'obstaculo'  -> aplica-se automaticamente na próxima missão do
 *       jogador, sem precisar ser guardada. Obstáculos têm prioridade
 *       sobre benefícios (regra da seção 16 do briefing).
 *
 * effectKey é usado por game.js para aplicar o efeito nas regras.
 */

const EVENTS = [
  {
    id: 'E01', name: 'Escudo Orbital', type: 'beneficio', effectKey: 'retry_on_fail',
    description: 'Depois de errar uma missão, permite tentar a mesma pergunta novamente. Se acertar na segunda tentativa, ganha +1/12.',
    icon: '🛡️',
  },
  {
    id: 'E02', name: 'Estação Espacial', type: 'beneficio', effectKey: 'draw_two_choose_one',
    description: 'Na próxima missão, você recebe duas perguntas da dificuldade correspondente e escolhe qual responder.',
    icon: '🛰️',
  },
  {
    id: 'E03', name: 'Radar Espacial', type: 'beneficio', effectKey: 'draw_three_choose_one',
    description: 'Permite observar três perguntas e escolher uma para responder.',
    icon: '📡',
  },
  {
    id: 'E04', name: 'Ajuda da Tripulação', type: 'beneficio', effectKey: 'eliminate_two_options',
    description: 'Em uma Missão Normal, elimina duas alternativas incorretas.',
    icon: '🧑‍🚀',
  },
  {
    id: 'E05', name: 'Assistência Gravitacional', type: 'beneficio', effectKey: 'gravity_assist',
    description: 'Missão Normal passa a valer +2/12 e Missão Avançada passa a valer +3/12. Não funciona em Missão Crítica.',
    icon: '🌌',
  },
  {
    id: 'E06', name: 'Chuva de Meteoros', type: 'obstaculo', effectKey: 'meteor_shower',
    description: 'Na próxima rodada deste jogador, apenas a Missão Normal estará disponível.',
    icon: '☄️',
  },
  {
    id: 'E07', name: 'Falha nos Propulsores', type: 'obstaculo', effectKey: 'thruster_failure',
    description: 'Na próxima missão acertada deste jogador, o avanço máximo será de +1/12.',
    icon: '⚠️',
  },
  {
    id: 'E08', name: 'Buraco de Minhoca', type: 'beneficio', effectKey: 'wormhole',
    description: 'Depois de receber uma pergunta e antes de responder, permite trocá-la por outra da mesma dificuldade.',
    icon: '🌀',
  },
  {
    id: 'E09', name: 'Especialista da Missão', type: 'beneficio', effectKey: 'mission_specialist',
    description: 'Permite revelar a dica da pergunta antes de responder.',
    icon: '🔬',
  },
  {
    id: 'E10', name: 'Análise Científica', type: 'beneficio', effectKey: 'scientific_analysis',
    description: 'Permite usar 30 segundos extras de cálculo, com um cronômetro visual antes de responder.',
    icon: '🧮',
  },
  {
    id: 'E11', name: 'Tecnologia Alienígena', type: 'beneficio', effectKey: 'alien_technology',
    description: 'Permite escolher uma pergunta um nível de dificuldade abaixo do atual. Recompensa máxima: +1/12.',
    icon: '👽',
  },
  {
    id: 'E12', name: 'Supernova', type: 'beneficio', effectKey: 'supernova',
    description: 'Permite realizar uma Missão Crítica fora da região difícil. Acerto: +3/12. Erro: 0.',
    icon: '💥',
  },
];

window.EVENTS = EVENTS;
