/**
 * ui.js
 * Controla todas as telas e modais: tela inicial, configuração de partida,
 * como jogar, tabuleiro, modal de missão/pergunta/resultado/evento/vitória.
 */

// ---------- Helpers de ilustração (sem números sobre a imagem) ----------

function visualBarHTML(total, filled) {
  let cells = '';
  for (let i = 0; i < total; i++) cells += `<div class="visual-cell ${i < filled ? 'filled' : ''}"></div>`;
  return `<div class="visual-bar">${cells}</div>`;
}
function visualStarsHTML(total, filled) {
  let cells = '';
  for (let i = 0; i < total; i++) cells += `<span class="visual-star ${i < filled ? 'filled' : ''}">★</span>`;
  return `<div class="visual-stars">${cells}</div>`;
}
function visualTanksHTML(total, filled) {
  let cells = '';
  for (let i = 0; i < total; i++) {
    cells += `<div class="visual-tank ${i < filled ? 'filled' : ''}"><div class="tank-fill"></div></div>`;
  }
  return `<div class="visual-tanks">${cells}</div>`;
}
function visualMoonsHTML(data) {
  let html = '<div class="visual-moons">';
  data.options.forEach((n) => {
    html += `<div class="visual-moon-wrap">${visualBarHTML(data.total, n)}</div>`;
  });
  html += '</div>';
  return html;
}
function visualCompareHTML(data) {
  return `<div class="visual-compare">
    <div class="visual-compare-col">${visualBarHTML(data.left.total, data.left.filled)}</div>
    <div class="visual-compare-col">${visualBarHTML(data.right.total, data.right.filled)}</div>
  </div>`;
}
function renderVisual(question) {
  if (!question.visualType) return '';
  switch (question.visualType) {
    case 'bar': return visualBarHTML(question.visualData.total, question.visualData.filled);
    case 'stars': return visualStarsHTML(question.visualData.total, question.visualData.filled);
    case 'tanks': return visualTanksHTML(question.visualData.total, question.visualData.filled);
    case 'moons': return visualMoonsHTML(question.visualData);
    case 'compare-bars': return visualCompareHTML(question.visualData);
    default: return '';
  }
}

const ZONE_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const MISSION_LABEL = { normal: 'Missão Normal', avancada: 'Missão Avançada', critica: 'Missão Crítica' };
const MISSION_REWARD_LABEL = { normal: '+1/12', avancada: '+2/12', critica: '+3/12' };

class UIController {
  constructor() {
    this.engine = new GameEngine();
    this.audio = new AudioManager();
    this.board = null;
    this.setupConfig = { numPlayers: 2, players: [] };
    this.root = document.getElementById('app-root');
    this.modalRoot = document.getElementById('modal-root');
    this._bindGlobalSound();
  }

  _bindGlobalSound() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('button, .clickable')) this.audio.play('click');
    });
  }

  init() {
    if (this.engine.hasSavedGame()) {
      this.showResumePrompt();
    } else {
      this.showStartScreen();
    }
  }

  // ---------------- Tela inicial ----------------

  showStartScreen() {
    this.modalRoot.innerHTML = '';
    this.root.innerHTML = `
      <section class="screen screen-start">
        <div class="stars-bg"></div>
        <div class="start-orbit-art" aria-hidden="true"><span class="start-planet"></span><span class="start-orbit-line"></span><span class="start-rocket">🚀</span></div>
        <div class="start-content">
          <p class="eyebrow">JOGO EDUCATIVO · 2–4 EXPLORADORES</p>
          <h1 class="game-title">FRAÇÕES<br>EM ÓRBITA</h1>
          <p class="tagline">Complete a órbita dominando as frações.</p>
          <div class="start-features"><span>60 missões</span><span>12 eventos</span><span>3 níveis</span></div>
          <div class="start-buttons">
            <button class="btn btn-primary btn-large" id="btn-play">JOGAR LOCAL</button>
            <button class="btn btn-ghost btn-large" id="btn-multiplayer">🌐 MULTIPLAYER</button>
            <button class="btn btn-ghost" id="btn-how-to-play">COMO JOGAR</button>
          </div>
        </div>
      </section>`;
    document.getElementById('btn-play').addEventListener('click', () => this.showSetupScreen());
    document.getElementById('btn-multiplayer').addEventListener('click', () => window.MultiplayerMode.open(this));
    document.getElementById('btn-how-to-play').addEventListener('click', () => this.showHowToPlay(() => this.showStartScreen()));
  }

  showResumePrompt() {
    this.root.innerHTML = `
      <section class="screen screen-start">
        <div class="stars-bg"></div>
        <div class="start-content">
          <p class="eyebrow">Missão em andamento</p>
          <h1 class="game-title" style="font-size: clamp(2rem, 6vw, 3.2rem);">Existe uma missão em andamento.</h1>
          <div class="start-buttons">
            <button class="btn btn-primary btn-large" id="btn-continue">CONTINUAR</button>
            <button class="btn btn-ghost" id="btn-new">COMEÇAR NOVA PARTIDA</button>
          </div>
        </div>
      </section>`;
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.engine.loadGame();
      this.showGameScreen();
    });
    document.getElementById('btn-new').addEventListener('click', () => {
      this.engine.clearSave();
      this.showStartScreen();
    });
  }

  // ---------------- Como jogar ----------------

  showHowToPlay(onClose) {
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-how-to-play">
          <button class="modal-close" id="how-to-close" aria-label="Fechar">✕</button>
          <h2>Como Jogar</h2>
          <div class="how-to-grid">
            <div class="how-to-card">
              <h3>🎯 Objetivo</h3>
              <p>Complete uma órbita inteira: 12/12. Responda perguntas sobre frações para avançar setor a setor.</p>
            </div>
            <div class="how-to-card">
              <h3>🔄 Turnos</h3>
              <p>Cada jogador, na sua vez, escolhe um tipo de missão e responde a uma pergunta baseada na região em que está.</p>
            </div>
            <div class="how-to-card">
              <h3 class="zone-facil-text">🟢 Fácil (1–4)</h3>
              <p>Setores iniciais da órbita, com perguntas introdutórias sobre frações.</p>
            </div>
            <div class="how-to-card">
              <h3 class="zone-medio-text">🟡 Médio (5–8)</h3>
              <p>Perguntas de equivalência, comparação e operações simples.</p>
            </div>
            <div class="how-to-card">
              <h3 class="zone-dificil-text">🔴 Difícil (9–12)</h3>
              <p>Operações com denominadores diferentes e comparações mais complexas.</p>
            </div>
            <div class="how-to-card">
              <h3>🚀 Normal (+1/12)</h3>
              <p>Pergunta com 4 alternativas (A, B, C, D).</p>
            </div>
            <div class="how-to-card">
              <h3>⚡ Avançada (+2/12)</h3>
              <p>Pergunta sem alternativas — você digita a resposta.</p>
            </div>
            <div class="how-to-card">
              <h3>💫 Crítica (+3/12)</h3>
              <p>Disponível na região Difícil. Responda e explique seu raciocínio antes de confirmar.</p>
            </div>
            <div class="how-to-card">
              <h3 class="zone-evento-text">✦ Eventos (3, 6, 9)</h3>
              <p>Terminar exatamente nesses setores sorteia uma carta de evento. Guarde até 2; ative 1 por missão.</p>
            </div>
            <div class="how-to-card">
              <h3>🏁 Vitória</h3>
              <p>Chegue exatamente a 12/12. Ultrapassar não é permitido — o excesso é perdido e você aguarda a próxima vez.</p>
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById('how-to-close').addEventListener('click', () => {
      this.modalRoot.innerHTML = '';
      if (onClose) onClose();
    });
  }

  // ---------------- Configuração da partida ----------------

  showSetupScreen() {
    this.modalRoot.innerHTML = '';
    this.setupConfig = { numPlayers: 2, players: [] };
    this._renderSetupCount();
  }

  _renderSetupCount() {
    this.root.innerHTML = `
      <section class="screen screen-setup">
        <div class="stars-bg"></div>
        <div class="setup-content">
          <h2>Quantos exploradores?</h2>
          <div class="player-count-options">
            ${[2, 3, 4].map((n) => `<button class="btn btn-option" data-count="${n}">${n} jogadores</button>`).join('')}
          </div>
          <button class="btn btn-ghost" id="btn-back-start">Voltar</button>
        </div>
      </section>`;
    this.root.querySelectorAll('[data-count]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setupConfig.numPlayers = Number(btn.dataset.count);
        this.setupConfig.players = Array.from({ length: this.setupConfig.numPlayers }, (_, i) => ({
          name: '',
          colorId: window.PLAYER_COLORS[i].id,
        }));
        this._renderSetupPlayers();
      });
    });
    document.getElementById('btn-back-start').addEventListener('click', () => this.showStartScreen());
  }

  _renderSetupPlayers() {
    const takenColors = () => this.setupConfig.players.map((p) => p.colorId);
    this.root.innerHTML = `
      <section class="screen screen-setup">
        <div class="stars-bg"></div>
        <div class="setup-content setup-players">
          <h2>Identifique sua tripulação</h2>
          <div class="player-forms">
            ${this.setupConfig.players
              .map(
                (p, idx) => `
              <div class="player-form" data-idx="${idx}">
                <label>Jogador ${idx + 1}</label>
                <input type="text" maxlength="16" class="player-name-input" data-idx="${idx}" placeholder="Nome" value="${p.name}">
                <div class="color-options" data-idx="${idx}">
                  ${window.PLAYER_COLORS.map(
                    (c) => `<button type="button" class="color-swatch ${p.colorId === c.id ? 'selected' : ''}" style="--swatch-color:${c.hex}" data-idx="${idx}" data-color="${c.id}" aria-label="${c.label}"></button>`
                  ).join('')}
                </div>
              </div>`
              )
              .join('')}
          </div>
          <button class="btn btn-primary btn-large" id="btn-start-mission">INICIAR MISSÃO</button>
          <button class="btn btn-ghost" id="btn-back-count">Voltar</button>
        </div>
      </section>`;

    this.root.querySelectorAll('.player-name-input').forEach((input) => {
      input.addEventListener('input', () => {
        this.setupConfig.players[Number(input.dataset.idx)].name = input.value.trim();
      });
    });

    this.root.querySelectorAll('.color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        const idx = Number(swatch.dataset.idx);
        const colorId = swatch.dataset.color;
        if (takenColors().includes(colorId) && this.setupConfig.players[idx].colorId !== colorId) return;
        this.setupConfig.players[idx].colorId = colorId;
        this._renderSetupPlayers();
      });
    });

    document.getElementById('btn-start-mission').addEventListener('click', () => {
      const players = this.setupConfig.players.map((p, idx) => ({
        name: p.name && p.name.trim() ? p.name.trim() : `Jogador ${idx + 1}`,
        colorId: p.colorId,
      }));
      this.engine.newGame(players);
      this.showGameScreen();
    });
    document.getElementById('btn-back-count').addEventListener('click', () => this._renderSetupCount());
  }

  // ---------------- Tela principal do jogo ----------------

  colorMap() {
    const map = {};
    window.PLAYER_COLORS.forEach((c) => (map[c.id] = c.hex));
    return map;
  }

  showGameScreen() {
    // Fecha qualquer modal da tela anterior (inclusive o modal de vitória).
    this.modalRoot.innerHTML = '';
    this.root.innerHTML = `
      <section class="screen screen-game">
        <div class="game-shell"><header class="game-topbar"><div><span class="game-mark">◉</span><b>FRAÇÕES EM ÓRBITA</b></div><div class="round-chip">RODADA <span id="round-number">${this.engine.state.round || 1}</span></div></header><div class="game-layout">
          <div class="board-column">
            <div id="board-container" class="board-container"></div>
            <div class="turn-banner" id="turn-banner"></div>
          </div>
          <aside class="side-panel">
            <div class="side-section-title">TRIPULAÇÃO</div><div class="players-panel" id="players-panel"></div>
            <div class="orbit-legend"><span class="legend-easy">● Fácil</span><span class="legend-medium">● Médio</span><span class="legend-hard">● Difícil</span><span class="legend-event">✦ Evento</span></div>
            <div class="side-actions">
              <button class="btn btn-ghost btn-small" id="btn-audio-toggle"></button>
              <button class="btn btn-ghost btn-small" id="btn-restart">REINICIAR PARTIDA</button>
              <button class="btn btn-ghost btn-small" id="btn-open-how-to">COMO JOGAR</button>
            </div>
          </aside>
        </div></div>
      </section>`;

    this.board = new BoardRenderer(document.getElementById('board-container'));
    this.board.renderRockets(this.engine.state.players, this.colorMap());
    this._renderPlayersPanel();
    this._updateAudioButton();

    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      this.audio.toggleMute();
      this._updateAudioButton();
    });
    document.getElementById('btn-restart').addEventListener('click', () => this._confirmRestart());
    document.getElementById('btn-open-how-to').addEventListener('click', () => this.showHowToPlay());

    if (this.engine.state.gameStatus === 'victory') {
      this._showVictory(this.engine.state.winner);
    } else {
      this._startTurnFlow();
    }
  }

  _updateAudioButton() {
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) btn.textContent = this.audio.isMuted() ? '🔇 SOM' : '🔊 SOM';
  }

  _confirmRestart() {
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-confirm">
          <h2>Reiniciar partida?</h2>
          <p>Todo o progresso atual será perdido.</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" id="cancel-restart">Cancelar</button>
            <button class="btn btn-danger" id="confirm-restart">Reiniciar</button>
          </div>
        </div>
      </div>`;
    document.getElementById('cancel-restart').addEventListener('click', () => (this.modalRoot.innerHTML = ''));
    document.getElementById('confirm-restart').addEventListener('click', () => {
      this.modalRoot.innerHTML = '';
      this.showSetupScreen();
    });
  }

  _renderPlayersPanel() {
    const panel = document.getElementById('players-panel');
    if (!panel) return;
    const colors = this.colorMap();
    const currentId = this.engine.currentPlayer().id;
    panel.innerHTML = this.engine.state.players
      .map((p) => {
        const isCurrent = p.id === currentId;
        return `
        <div class="player-card ${isCurrent ? 'player-card-active' : ''}">
          <div class="player-card-rocket" style="--player-color:${colors[p.colorId]}">🚀</div>
          <div class="player-card-info">
            <div class="player-card-row"><div class="player-card-name">${this._escape(p.name)}</div><div class="player-card-position">${p.position}/12</div></div>
            <div class="player-progress"><i style="width:${(p.position / 12) * 100}%;background:${colors[p.colorId]}"></i></div>
            <div class="player-card-meta"><span>${'🎴'.repeat(p.eventCards.length)}${p.eventCards.length === 0 ? 'sem eventos' : ''}</span><span>✓ ${p.stats ? p.stats.correct : 0}/${p.stats ? p.stats.answered : 0}</span>${p.stats && p.stats.streak >= 2 ? `<span>🔥 ${p.stats.streak}</span>` : ''}</div>
          </div>
        </div>`;
      })
      .join('');
  }

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------- Fluxo de turno ----------------

  _startTurnFlow() {
    const player = this.engine.currentPlayer();
    const turn = this.engine.beginTurn();
    this._renderPlayersPanel();
    const roundEl = document.getElementById('round-number'); if (roundEl) roundEl.textContent = this.engine.state.round || 1;
    document.getElementById('turn-banner').innerHTML = `
      <span class="turn-label">VEZ DE</span>
      <span class="turn-name">${this._escape(player.name)}</span>
      <span class="turn-zone zone-${turn.region}">${ZONE_LABEL[turn.region]}</span><span class="turn-position">${player.position}/12</span>
      <button class="btn btn-primary btn-small" id="btn-open-mission">ESCOLHER MISSÃO</button>`;
    document.getElementById('btn-open-mission').addEventListener('click', () => this._openMissionModal());

    if (turn.forcedNormalOnly) {
      this._toastObstacle('☄️ Chuva de Meteoros: nesta rodada, apenas a Missão Normal está disponível.');
    }
    if (turn.capMaxOne) {
      this._toastObstacle('⚠️ Falha nos Propulsores: o avanço máximo desta missão é +1/12.');
    }

    // A missão só começa quando o jogador clicar em "ESCOLHER MISSÃO",
    // deixando o tabuleiro visível antes da próxima pergunta.
  }

  _toastObstacle(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-obstacle';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
  }

  _openMissionModal() {
    const player = this.engine.currentPlayer();
    const turn = this.engine.state.turn;
    const zoneLabel = ZONE_LABEL[turn.region];

    const cardsHTML = player.eventCards.length
      ? player.eventCards
          .map((ec) => {
            const def = this.engine.getEventById(ec.id);
            const active = turn.activeBeneficialEventId === ec.id;
            return `<button class="event-card-btn ${active ? 'event-card-active' : ''}" data-event-id="${ec.id}">
              <span class="event-icon">${def.icon}</span>
              <span class="event-name">${def.name}</span>
            </button>`;
          })
          .join('')
      : '<p class="no-cards-msg">Nenhuma carta de evento guardada.</p>';

    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-mission">
          <button class="modal-close" id="mission-close" aria-label="Ver tabuleiro">✕</button>
          <p class="mission-region">Região atual: <strong class="zone-${turn.region}-text">${zoneLabel}</strong></p>
          <h2>Escolha sua missão</h2>
          <div class="mission-options">
            ${turn.availableMissionTypes
              .map(
                (mt) => `
              <button class="mission-option-btn mission-${mt}" data-mission="${mt}">
                <span class="mission-name">${MISSION_LABEL[mt]}</span>
                <span class="mission-reward">${turn.capMaxOne || turn.rewardCap ? '+1/12' : MISSION_REWARD_LABEL[mt]}</span>
              </button>`
              )
              .join('')}
          </div>
          <div class="event-cards-section">
            <h3>Cartas de Evento (ative no máx. 1)</h3>
            <div class="event-cards-row">${cardsHTML}</div>
          </div>
        </div>
      </div>`;

    document.getElementById('mission-close').addEventListener('click', () => {
      this.modalRoot.innerHTML = '';
    });

    this.modalRoot.querySelectorAll('.event-card-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.eventId;
        if (turn.activeBeneficialEventId === eventId) {
          turn.activeBeneficialEventId = null;
        } else {
          this.engine.activateEventCard(eventId);
        }
        this._openMissionModal();
      });
    });

    this.modalRoot.querySelectorAll('.mission-option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const missionType = btn.dataset.mission;
        this.engine.chooseMission(missionType);
        if (this.engine.state.turn.phase === 'choose-question') {
          this._openChooseQuestionModal();
        } else {
          this._openQuestionModal();
        }
      });
    });
  }

  _openChooseQuestionModal() {
    const turn = this.engine.state.turn;
    const questions = turn.questionChoices.map((id) => this.engine.getQuestionById(id));
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-choose-question">
          <h2>Escolha sua pergunta</h2>
          <div class="question-choice-list">
            ${questions
              .map(
                (q, idx) => `
              <button class="question-choice-btn" data-id="${q.id}">
                <span class="question-choice-index">${idx + 1}</span>
                <span class="question-choice-text">${this._escape(q.question)}</span>
              </button>`
              )
              .join('')}
          </div>
        </div>
      </div>`;
    this.modalRoot.querySelectorAll('.question-choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.engine.pickQuestionChoice(Number(btn.dataset.id));
        this._openQuestionModal();
      });
    });
  }

  _openQuestionModal() {
    const turn = this.engine.state.turn;
    const question = this.engine.getQuestionById(turn.questionId);
    const activeEvent = turn.activeBeneficialEventId ? this.engine.getEventById(turn.activeBeneficialEventId) : null;
    const canWormhole = activeEvent && activeEvent.effectKey === 'wormhole' && !turn.wormholeUsed;
    const canReveal = activeEvent && activeEvent.effectKey === 'mission_specialist';
    const hasTimer = activeEvent && activeEvent.effectKey === 'scientific_analysis';

    const isNormal = turn.missionType === 'normal';
    const isCritical = turn.missionType === 'critica';
    const visualHTML = renderVisual(question);
    const promptText = isNormal ? question.question : question.advancedQuestion;

    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-question">
          <div class="question-header">
            <span class="badge badge-${question.difficulty}">${ZONE_LABEL[question.difficulty]}</span>
            <span class="badge badge-mission">${MISSION_LABEL[turn.missionType]}</span>
          </div>
          <p class="question-text">${this._escape(promptText)}</p>
          ${visualHTML ? `<div class="question-visual">${visualHTML}</div>` : ''}
          <div id="question-hint" class="question-hint hidden"></div>
          <div id="question-timer" class="question-timer ${hasTimer ? '' : 'hidden'}"></div>
          <div id="question-body"></div>
          <div class="question-tools">
            ${canWormhole ? '<button class="btn btn-ghost btn-small" id="btn-wormhole">🌀 Trocar pergunta</button>' : ''}
            ${canReveal ? '<button class="btn btn-ghost btn-small" id="btn-reveal-hint">🔬 Revelar dica</button>' : ''}
          </div>
        </div>
      </div>`;

    const body = document.getElementById('question-body');
    if (isNormal) {
      const options = this.engine.getDisplayOptions();
      body.innerHTML = `<div class="options-grid">
        ${options
          .map((opt, idx) =>
            opt === null
              ? ''
              : `<button class="option-btn" data-idx="${idx}"><span class="option-letter">${'ABCD'[idx]}</span><span>${this._escape(opt)}</span></button>`
          )
          .join('')}
      </div>`;
      body.querySelectorAll('.option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          body.querySelectorAll('.option-btn').forEach((b) => (b.disabled = true));
          this._resolveNormal(Number(btn.dataset.idx));
        });
      });
    } else if (isCritical) {
      body.innerHTML = `
        <div class="free-answer-form">
          <label for="critical-answer-input">Sua resposta</label>
          <input type="text" id="critical-answer-input" placeholder="ex: 1/2" autocomplete="off">
          <label for="critical-reasoning-input">Explique seu raciocínio</label>
          <textarea id="critical-reasoning-input" rows="3" placeholder="Como você chegou a essa resposta?"></textarea>
          <button class="btn btn-primary" id="btn-submit-critical">CONFIRMAR RESPOSTA</button>
        </div>`;
      document.getElementById('btn-submit-critical').addEventListener('click', () => {
        const answer = document.getElementById('critical-answer-input').value;
        const reasoning = document.getElementById('critical-reasoning-input').value;
        if (!answer.trim()) return;
        this._resolveCritical(answer, reasoning);
      });
    } else {
      body.innerHTML = `
        <div class="free-answer-form">
          <label for="advanced-answer-input">Sua resposta</label>
          <input type="text" id="advanced-answer-input" placeholder="ex: 1/2" autocomplete="off">
          <button class="btn btn-primary" id="btn-submit-advanced">CONFIRMAR RESPOSTA</button>
        </div>`;
      document.getElementById('btn-submit-advanced').addEventListener('click', () => {
        const answer = document.getElementById('advanced-answer-input').value;
        if (!answer.trim()) return;
        this._resolveAdvanced(answer);
      });
    }

    if (canWormhole) {
      document.getElementById('btn-wormhole').addEventListener('click', () => {
        this.engine.useWormhole();
        this._openQuestionModal();
      });
    }
    if (canReveal) {
      document.getElementById('btn-reveal-hint').addEventListener('click', (e) => {
        const hintEl = document.getElementById('question-hint');
        hintEl.textContent = `💡 ${question.hint}`;
        hintEl.classList.remove('hidden');
        e.target.disabled = true;
      });
    }
    if (hasTimer) this._runTimer(30);
  }

  _runTimer(seconds) {
    const el = document.getElementById('question-timer');
    if (!el) return;
    let remaining = seconds;
    el.textContent = `🧮 Tempo para calcular: ${remaining}s`;
    const interval = setInterval(() => {
      remaining -= 1;
      if (!document.body.contains(el)) {
        clearInterval(interval);
        return;
      }
      if (remaining <= 0) {
        el.textContent = '🧮 Tempo esgotado — responda quando estiver pronto.';
        clearInterval(interval);
        return;
      }
      el.textContent = `🧮 Tempo para calcular: ${remaining}s`;
    }, 1000);
  }

  _resolveNormal(idx) {
    const result = this.engine.submitNormalAnswer(idx);
    this._handleAnswerResult(result);
  }
  _resolveAdvanced(text) {
    const result = this.engine.submitAdvancedAnswer(text);
    this._handleAnswerResult(result);
  }
  _resolveCritical(text, reasoning) {
    const result = this.engine.submitCriticalAnswer(text, reasoning);
    this._handleAnswerResult(result, true);
  }

  _handleAnswerResult(result, isCritical) {
    if (result.canRetry) {
      this.audio.play('incorrect');
      this._openRetryModal();
      return;
    }
    this.audio.play(result.correct ? 'correct' : 'incorrect');
    if (isCritical) {
      this._openCriticalReasoningReveal();
    } else {
      this._openResultModal();
    }
  }

  _openRetryModal() {
    const question = this.engine.getQuestionById(this.engine.state.turn.questionId);
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-result modal-retry">
          <h2>AINDA NÃO</h2>
          <p>O Escudo Orbital foi ativado! Você tem uma nova chance de responder a mesma pergunta.</p>
          <button class="btn btn-primary" id="btn-retry-continue">TENTAR NOVAMENTE</button>
        </div>
      </div>`;
    document.getElementById('btn-retry-continue').addEventListener('click', () => this._openQuestionModal());
  }

  _openCriticalReasoningReveal() {
    const turn = this.engine.state.turn;
    const question = this.engine.getQuestionById(turn.questionId);
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-reasoning">
          <h2>Resolução da Missão</h2>
          <p class="reasoning-explanation">${this._escape(question.explanation)}</p>
          <div class="reasoning-compare">
            <div>
              <h4>Seu raciocínio</h4>
              <p class="reasoning-user">${this._escape(turn.pendingCriticalReasoning || '(nenhum raciocínio escrito)')}</p>
            </div>
          </div>
          <button class="btn btn-primary" id="btn-ack-reasoning">JÁ COMPAREI MEU RACIOCÍNIO</button>
        </div>
      </div>`;
    document.getElementById('btn-ack-reasoning').addEventListener('click', () => {
      this.engine.acknowledgeCriticalReasoning();
      this._openResultModal();
    });
  }

  _openResultModal() {
    const turn = this.engine.state.turn;
    const result = turn.lastResult;
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-result ${result.correct ? 'modal-result-correct' : 'modal-result-wrong'}">
          <h2>${result.correct ? 'ACERTOU!' : 'AINDA NÃO'}</h2>
          <p class="result-answer"><strong>Resposta:</strong> ${this._escape(result.answerDisplay)}</p>
          <p class="result-explanation">${this._escape(result.explanation)}</p>
          ${result.correct ? `<p class="result-reward">Avanço: +${result.reward}/12</p>` : ''}
          <button class="btn btn-primary" id="btn-continue-result">CONTINUAR</button>
        </div>
      </div>`;
    document.getElementById('btn-continue-result').addEventListener('click', () => this._afterResult());
  }

  _afterResult() {
    this.modalRoot.innerHTML = '';
    const result = this.engine.state.turn.lastResult;
    if (!result || result.reward === 0) {
      this._endTurnAndAdvance();
      return;
    }
    const player = this.engine.currentPlayer();
    const from = player.position;
    const move = this.engine.applyMovement();

    if (!move.applied) {
      this._showOverCapacityMessage(() => this._endTurnAndAdvance());
      return;
    }

    const hex = this.colorMap()[player.colorId];
    this.board.animateMove(player.id, from, move.newPosition, hex, () => {
      this.audio.play('move');
      this._renderPlayersPanel();
    }, () => {
      if (move.triggeredEvent) {
        this._openEventRevealModal(move.triggeredEvent, () => this._afterMovementDone(move));
      } else {
        this._afterMovementDone(move);
      }
    });
  }

  _afterMovementDone(move) {
    if (move.victory) {
      const player = this.engine.currentPlayer();
      this.board.animateLaunch(player.id, () => this._showVictory(player.id));
      return;
    }
    this._endTurnAndAdvance();
  }

  _showOverCapacityMessage(onClose) {
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-result">
          <h2>Combustível excedente!</h2>
          <p>Para completar a órbita, você precisa chegar exatamente a 12/12. Você permanece na posição atual.</p>
          <button class="btn btn-primary" id="btn-overcap-continue">CONTINUAR</button>
        </div>
      </div>`;
    document.getElementById('btn-overcap-continue').addEventListener('click', () => {
      this.modalRoot.innerHTML = '';
      onClose();
    });
  }

  _openEventRevealModal(triggered, onClose) {
    const { event, stored, obstacle, discardedFull } = triggered;
    let statusMsg = '';
    if (obstacle) statusMsg = 'Este obstáculo afetará sua próxima missão automaticamente.';
    else if (stored) statusMsg = 'A carta foi guardada em sua mão.';
    else if (discardedFull) statusMsg = 'Sua mão já tem 2 cartas — esta carta foi descartada.';

    this.audio.play('event');
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-event-reveal">
          <p class="event-reveal-eyebrow">Setor de Evento</p>
          <div class="event-reveal-icon">${event.icon}</div>
          <h2>${this._escape(event.name)}</h2>
          <p class="event-reveal-desc">${this._escape(event.description)}</p>
          <p class="event-reveal-status">${statusMsg}</p>
          <button class="btn btn-primary" id="btn-event-continue">CONTINUAR</button>
        </div>
      </div>`;
    document.getElementById('btn-event-continue').addEventListener('click', () => {
      this.modalRoot.innerHTML = '';
      onClose();
    });
  }

  _endTurnAndAdvance() {
    this.engine.endTurn();
    this._renderPlayersPanel();
    this._startTurnFlow();
  }

  // ---------------- Vitória ----------------

  _showVictory(playerId) {
    const player = this.engine.state.players.find((p) => p.id === playerId);
    this.audio.play('victory');
    this.modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-victory">
          <div class="victory-rocket">🚀</div>
          <p class="victory-eyebrow">ÓRBITA COMPLETA!</p>
          <h2>${this._escape(player.name)} completou 12/12 da órbita.</h2>
          <p class="victory-sub">12/12 = 1 inteiro.</p>
          <div class="victory-stats"><span>Missões: <b>${player.stats ? player.stats.answered : 0}</b></span><span>Acertos: <b>${player.stats ? player.stats.correct : 0}</b></span><span>Melhor sequência: <b>${player.stats ? player.stats.bestStreak : 0}</b></span></div>
          <div class="modal-actions">
            <button class="btn btn-primary" id="btn-play-again">JOGAR NOVAMENTE</button>
            <button class="btn btn-ghost" id="btn-new-match">NOVA PARTIDA</button>
          </div>
        </div>
      </div>`;
    document.getElementById('btn-play-again').addEventListener('click', () => {
      const players = this.engine.state.players.map((p) => ({ name: p.name, colorId: p.colorId }));
      this.engine.restart(players);
      this.showGameScreen();
    });
    document.getElementById('btn-new-match').addEventListener('click', () => {
      this.engine.clearSave();
      this.showSetupScreen();
    });
  }
}

window.UIController = UIController;
