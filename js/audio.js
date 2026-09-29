/**
 * audio.js
 * Arquitetura simples de áudio. Tenta tocar um arquivo em assets/audio/<nome>.mp3;
 * se o arquivo não existir, sintetiza um bipe curto via Web Audio API como
 * placeholder, para que o jogo nunca fique mudo por falta de assets.
 *
 * Para adicionar sons reais no futuro, basta colocar os arquivos em
 * assets/audio/ com os nomes: hover.mp3, click.mp3, correct.mp3, incorrect.mp3,
 * event.mp3, move.mp3, victory.mp3
 */

const SOUND_FREQUENCIES = {
  hover: 320,
  click: 420,
  correct: 660,
  incorrect: 180,
  event: 520,
  move: 380,
  victory: 780,
};

const MUTE_KEY = 'fracoesEmOrbita_muted';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem(MUTE_KEY) === '1';
    this.cache = {};
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  play(name) {
    if (this.muted) return;

    if (!this.cache[name]) {
      const audio = new Audio(`assets/audio/${name}.mp3`);
      audio.volume = 0.5;
      this.cache[name] = audio;
    }
    const audioEl = this.cache[name];
    audioEl.currentTime = 0;
    const playPromise = audioEl.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => this._beep(name));
    }
  }

  _beep(name) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const freq = SOUND_FREQUENCIES[name] || 440;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.24);
  }
}

window.AudioManager = AudioManager;
