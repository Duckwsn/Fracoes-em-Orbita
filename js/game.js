/**
 * game.js
 * Estado central da partida (GameState) e todas as regras do jogo.
 * Não manipula o DOM diretamente — apenas dispara eventos via
 * window.dispatchEvent(new CustomEvent(...)) que ui.js e board.js escutam.
 */

const SAVE_KEY = 'fracoesEmOrbita_save_v1';

const PLAYER_COLORS = [
  { id: 'azul', label: 'Azul', hex: '#4da3ff' },
  { id: 'vermelho', label: 'Vermelho', hex: '#ff6b6b' },
  { id: 'verde', label: 'Verde', hex: '#6fd08c' },
  { id: 'amarelo', label: 'Amarelo', hex: '#f2c94c' },
];

const MISSION_REWARDS = { normal: 1, avancada: 2, critica: 3 };
const EVENT_SECTORS = [3, 6, 9];

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeckState(ids) {
  return { order: shuffle(ids), pointer: 0, discardCount: 0 };
}

function getSectorRegion(position) {
  if (position <= 4) return 'facil';
  if (position <= 8) return 'medio';
  return 'dificil';
}

function isEventSector(position) {
  return EVENT_SECTORS.includes(position);
}

function regionBelow(region) {
  if (region === 'dificil') return 'medio';
  if (region === 'medio') return 'facil';
  return 'facil';
}

/** GameEngine encapsula o GameState e expõe métodos de transição. */
class GameEngine {
  constructor() {
    this.state = null;
  }

  // ---------- Criação e persistência ----------

  newGame(playerConfigs) {
    const questionsByDifficulty = {
      facil: window.QUESTIONS.filter((q) => q.difficulty === 'facil').map((q) => q.id),
      medio: window.QUESTIONS.filter((q) => q.difficulty === 'medio').map((q) => q.id),
      dificil: window.QUESTIONS.filter((q) => q.difficulty === 'dificil').map((q) => q.id),
    };

    this.state = {
      players: playerConfigs.map((cfg, idx) => ({
        id: `p${idx + 1}`,
        name: cfg.name,
        colorId: cfg.colorId,
        position: 0,
        eventCards: [],
        pendingObstacle: null,
        usedEventThisMission: false,
        stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0 },
      })),
      currentPlayerIndex: 0,
      decks: {
        facil: buildDeckState(questionsByDifficulty.facil),
        medio: buildDeckState(questionsByDifficulty.medio),
        dificil: buildDeckState(questionsByDifficulty.dificil),
      },
      usedQuestionIds: { facil: [], medio: [], dificil: [] },
      eventDeck: buildDeckState(window.EVENTS.map((e) => e.id)),
      discardedEventIds: [],
      turn: this._emptyTurn(),
      gameStatus: 'playing',
      winner: null,
      round: 1,
      log: [],
    };
    this.save();
    return this.state;
  }

  _emptyTurn() {
    return {
      phase: 'choose-mission', // choose-mission | choose-question | question | result | event-reveal
      availableMissionTypes: ['normal'],
      forcedNormalOnly: false,
      capMaxOne: false,
      missionType: null,
      questionId: null,
      questionChoices: null, // para draw_two/draw_three/alien_technology
      activeBeneficialEventId: null,
      pendingCriticalReasoning: null,
      wormholeUsed: false,
      retryAvailable: false,
      retryUsed: false,
      lastResult: null, // { correct, reward, questionId }
      timerActive: false,
    };
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {
      /* localStorage indisponível — segue sem persistência */
    }
  }

  hasSavedGame() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      this.state = JSON.parse(raw);
      // Migração leve de saves anteriores.
      this.state.round = this.state.round || 1;
      this.state.log = this.state.log || [];
      (this.state.players || []).forEach((p) => {
        p.stats = p.stats || { answered: 0, correct: 0, streak: 0, bestStreak: 0 };
      });
      return this.state;
    } catch (e) {
      return null;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // ---------- Utilitários de baralho ----------

  _drawFromDeck(deckState, allIds) {
    if (deckState.pointer >= deckState.order.length) {
      deckState.order = shuffle(allIds);
      deckState.pointer = 0;
    }
    const id = deckState.order[deckState.pointer];
    deckState.pointer += 1;
    return id;
  }

  drawQuestionId(difficulty) {
    const allIds = window.QUESTIONS.filter((q) => q.difficulty === difficulty).map((q) => q.id);
    return this._drawFromDeck(this.state.decks[difficulty], allIds);
  }

  drawEventId() {
    const allIds = window.EVENTS.map((e) => e.id);
    return this._drawFromDeck(this.state.eventDeck, allIds);
  }

  getQuestionById(id) {
    return window.QUESTIONS.find((q) => q.id === id);
  }

  getEventById(id) {
    return window.EVENTS.find((e) => e.id === id);
  }

  // ---------- Turno ----------

  currentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  beginTurn() {
    const player = this.currentPlayer();
    const turn = this._emptyTurn();
    const region = getSectorRegion(player.position);

    let availableMissionTypes = ['normal', 'avancada'];
    if (region === 'dificil') availableMissionTypes.push('critica');

    // Obstáculo pendente tem prioridade
    if (player.pendingObstacle && player.pendingObstacle.effectKey === 'meteor_shower') {
      availableMissionTypes = ['normal'];
      turn.forcedNormalOnly = true;
    }
    if (player.pendingObstacle && player.pendingObstacle.effectKey === 'thruster_failure') {
      turn.capMaxOne = true;
    }

    turn.availableMissionTypes = availableMissionTypes;
    turn.region = region;
    this.state.turn = turn;
    this.save();
    return turn;
  }

  /** Ativa uma carta de evento benéfica guardada na mão do jogador (no máx. 1 por missão). */
  activateEventCard(eventId) {
    const player = this.currentPlayer();
    const turn = this.state.turn;
    if (turn.activeBeneficialEventId) return false; // só 1 por missão
    const idx = player.eventCards.findIndex((e) => e.id === eventId);
    if (idx === -1) return false;
    turn.activeBeneficialEventId = eventId;

    const event = this.getEventById(eventId);
    if (event.effectKey === 'supernova') {
      turn.availableMissionTypes = Array.from(new Set([...turn.availableMissionTypes, 'critica']));
      turn.supernovaActive = true;
    }
    this.save();
    return true;
  }

  /** Escolhe o tipo de missão e sorteia a pergunta correspondente. */
  chooseMission(missionType) {
    const turn = this.state.turn;
    turn.missionType = missionType;
    let region = turn.region;

    const activeEvent = turn.activeBeneficialEventId ? this.getEventById(turn.activeBeneficialEventId) : null;

    if (activeEvent && activeEvent.effectKey === 'alien_technology') {
      region = regionBelow(region);
      turn.rewardCap = 1;
    }

    if (activeEvent && (activeEvent.effectKey === 'draw_two_choose_one' || activeEvent.effectKey === 'draw_three_choose_one')) {
      const count = activeEvent.effectKey === 'draw_two_choose_one' ? 2 : 3;
      const ids = [];
      const seen = new Set();
      while (ids.length < count) {
        const id = this.drawQuestionId(region);
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
      turn.questionChoices = ids;
      turn.phase = 'choose-question';
      this.save();
      return turn;
    }

    const id = this.drawQuestionId(region);
    turn.questionId = id;
    turn.phase = 'question';
    turn.retryAvailable = player_has_shield(this.currentPlayer(), turn);
    this.save();
    return turn;
  }

  /** Usada quando o jogador escolhe entre múltiplas perguntas (Estação Espacial / Radar Espacial). */
  pickQuestionChoice(questionId) {
    const turn = this.state.turn;
    turn.questionId = questionId;
    turn.questionChoices = null;
    turn.phase = 'question';
    this.save();
    return turn;
  }

  /** Buraco de Minhoca: troca a pergunta atual por outra da mesma dificuldade. */
  useWormhole() {
    const turn = this.state.turn;
    const activeEvent = turn.activeBeneficialEventId ? this.getEventById(turn.activeBeneficialEventId) : null;
    if (!activeEvent || activeEvent.effectKey !== 'wormhole' || turn.wormholeUsed) return false;
    const currentQ = this.getQuestionById(turn.questionId);
    turn.questionId = this.drawQuestionId(currentQ.difficulty);
    turn.wormholeUsed = true;
    this.save();
    return true;
  }

  /** Retorna as alternativas a exibir, aplicando "Ajuda da Tripulação" se ativa. */
  getDisplayOptions() {
    const turn = this.state.turn;
    const q = this.getQuestionById(turn.questionId);
    if (!q.options) return null;
    const activeEvent = turn.activeBeneficialEventId ? this.getEventById(turn.activeBeneficialEventId) : null;
    if (activeEvent && activeEvent.effectKey === 'eliminate_two_options' && turn.missionType === 'normal') {
      const correctIdx = q.correctOptionIndex;
      const wrongIndices = q.options.map((_, i) => i).filter((i) => i !== correctIdx);
      const keepWrong = shuffle(wrongIndices)[0];
      const keepIndices = shuffle([correctIdx, keepWrong]);
      return q.options.map((opt, i) => (keepIndices.includes(i) ? opt : null));
    }
    return q.options;
  }

  /** Resolve uma resposta de Missão Normal (índice da alternativa escolhida). */
  submitNormalAnswer(selectedIndex) {
    const turn = this.state.turn;
    const q = this.getQuestionById(turn.questionId);
    const correct = selectedIndex === q.correctOptionIndex;
    return this._resolveAnswer(correct, q);
  }

  /** Resolve uma resposta de Missão Avançada (texto livre). */
  submitAdvancedAnswer(rawInput) {
    const turn = this.state.turn;
    const q = this.getQuestionById(turn.questionId);
    const correct = this._checkFreeAnswer(rawInput, q);
    return this._resolveAnswer(correct, q);
  }

  /** Registra a etapa de raciocínio de uma Missão Crítica (não avaliado semanticamente). */
  submitCriticalAnswer(rawInput, reasoningText) {
    const turn = this.state.turn;
    const q = this.getQuestionById(turn.questionId);
    const correct = this._checkFreeAnswer(rawInput, q);
    turn.pendingCriticalReasoning = reasoningText || '';
    return this._resolveAnswer(correct, q);
  }

  _checkFreeAnswer(rawInput, q) {
    if (q.answerType === 'fraction') {
      return window.FractionsUtil.checkFractionAnswer(rawInput, q.answer, !!q.requireSimplified);
    }
    if (q.answerType === 'text') {
      return window.FractionsUtil.checkTextAnswer(rawInput, q.acceptedAnswers || [q.answer]);
    }
    if (q.answerType === 'ordering') {
      const parts = String(rawInput)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length !== q.orderAnswer.length) return false;
      return parts.every((p, i) => {
        const f = window.FractionsUtil.parseFraction(p);
        const expected = window.FractionsUtil.parseFraction(q.orderAnswer[i]);
        return f && window.FractionsUtil.fractionsEqual(f, expected);
      });
    }
    return false;
  }

  _resolveAnswer(correct, question) {
    const turn = this.state.turn;
    const player = this.currentPlayer();

    // Escudo Orbital: permite uma segunda tentativa se errar
    if (!correct && turn.retryAvailable && !turn.retryUsed) {
      turn.retryUsed = true;
      turn.phase = 'retry-offered';
      this.save();
      return { correct: false, canRetry: true };
    }

    let reward = 0;
    if (correct) {
      reward = MISSION_REWARDS[turn.missionType];
      const activeEvent = turn.activeBeneficialEventId ? this.getEventById(turn.activeBeneficialEventId) : null;
      if (activeEvent && activeEvent.effectKey === 'gravity_assist') {
        if (turn.missionType === 'normal') reward = 2;
        if (turn.missionType === 'avancada') reward = 3;
      }
      if (turn.retryUsed) reward = Math.min(reward, 1); // Escudo Orbital: acerto na 2ª tentativa vale +1/12
      if (turn.rewardCap) reward = Math.min(reward, turn.rewardCap);
      if (turn.capMaxOne) reward = Math.min(reward, 1); // Falha nos Propulsores
    }

    player.stats = player.stats || { answered: 0, correct: 0, streak: 0, bestStreak: 0 };
    player.stats.answered += 1;
    if (correct) {
      player.stats.correct += 1;
      player.stats.streak += 1;
      player.stats.bestStreak = Math.max(player.stats.bestStreak, player.stats.streak);
    } else {
      player.stats.streak = 0;
    }

    turn.lastResult = {
      correct,
      reward,
      questionId: question.id,
      explanation: question.explanation,
      answerDisplay: window.FractionsUtil && question.answerType === 'fraction' ? question.answer : question.answer,
    };
    turn.phase = 'result';

    // Consome carta ativa e obstáculos pendentes
    if (turn.activeBeneficialEventId) {
      player.eventCards = player.eventCards.filter((e) => e.id !== turn.activeBeneficialEventId);
      this.state.discardedEventIds.push(turn.activeBeneficialEventId);
    }
    if (player.pendingObstacle && (turn.forcedNormalOnly || turn.capMaxOne)) {
      this.state.discardedEventIds.push(player.pendingObstacle.id);
      player.pendingObstacle = null;
    }

    this.save();
    return { correct, canRetry: false, reward };
  }

  /** Confirma que o jogador comparou seu raciocínio (Missão Crítica) antes de seguir para o movimento. */
  acknowledgeCriticalReasoning() {
    this.state.turn.reasoningAcknowledged = true;
    this.save();
  }

  // ---------- Movimento ----------

  /** Aplica o avanço do foguete. Retorna { applied, overCapacity, newPosition, sectorsPassed }. */
  applyMovement() {
    const player = this.currentPlayer();
    const reward = this.state.turn.lastResult ? this.state.turn.lastResult.reward : 0;
    const from = player.position;
    const to = from + reward;

    if (to > 12) {
      return { applied: false, overCapacity: true, newPosition: from, sectorsPassed: [] };
    }

    const sectorsPassed = [];
    for (let s = from + 1; s <= to; s++) sectorsPassed.push(s);
    player.position = to;

    let triggeredEvent = null;
    if (to !== from && isEventSector(to)) {
      triggeredEvent = this._triggerEventDraw(player);
    }

    let victory = false;
    if (to === 12) {
      this.state.gameStatus = 'victory';
      this.state.winner = player.id;
      victory = true;
    }

    this.save();
    return { applied: true, overCapacity: false, newPosition: to, sectorsPassed, triggeredEvent, victory };
  }

  _triggerEventDraw(player) {
    const id = this.drawEventId();
    const event = this.getEventById(id);
    if (event.type === 'obstaculo') {
      player.pendingObstacle = { id: event.id, effectKey: event.effectKey };
      return { event, stored: false, obstacle: true };
    }
    if (player.eventCards.length >= 2) {
      this.state.discardedEventIds.push(event.id);
      return { event, stored: false, obstacle: false, discardedFull: true };
    }
    player.eventCards.push({ id: event.id });
    return { event, stored: true, obstacle: false };
  }

  endTurn() {
    if (this.state.gameStatus === 'victory') return;
    const n = this.state.players.length;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % n;
    if (this.state.currentPlayerIndex === 0) this.state.round = (this.state.round || 1) + 1;
    this.state.turn = this._emptyTurn();
    this.save();
  }

  restart(playerConfigs) {
    this.clearSave();
    return this.newGame(playerConfigs);
  }
}

function player_has_shield(player, turn) {
  const activeEvent = turn.activeBeneficialEventId ? player.eventCards.find((e) => e.id === turn.activeBeneficialEventId) : null;
  if (!activeEvent) return false;
  const eventDef = window.EVENTS.find((e) => e.id === activeEvent.id);
  return !!eventDef && eventDef.effectKey === 'retry_on_fail';
}

window.GameEngine = GameEngine;
window.PLAYER_COLORS = PLAYER_COLORS;
window.MISSION_REWARDS = MISSION_REWARDS;
window.getSectorRegion = getSectorRegion;
window.isEventSector = isEventSector;
