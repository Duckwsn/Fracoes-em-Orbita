/**
 * app.js
 * Ponto de entrada: inicializa o controlador de UI quando o DOM estiver pronto.
 */
document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIController();
  ui.init();
  window.__fracoesEmOrbita = ui; // referência útil para depuração manual no console
});

// Em deploy HTTPS/localhost, mantém o jogo disponível offline como PWA.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
