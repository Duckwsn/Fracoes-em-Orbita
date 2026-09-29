/**
 * board.js
 * Constrói e anima o tabuleiro circular (SVG) com os 12 setores da órbita.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const BOARD_SIZE = 620;
const CENTER = BOARD_SIZE / 2;
const OUTER_R = 270;
const INNER_R = 175;
const ROCKET_R = (OUTER_R + INNER_R) / 2;
const LABEL_R = OUTER_R - 28;

const SECTOR_ZONE = (n) => (n <= 4 ? 'facil' : n <= 8 ? 'medio' : 'dificil');
const EVENT_SET = new Set([3, 6, 9]);

function polar(r, angleRad) {
  return { x: CENTER + r * Math.sin(angleRad), y: CENTER - r * Math.cos(angleRad) };
}

function sectorCenterAngle(n) {
  return ((n % 12) / 12) * 2 * Math.PI;
}

function sectorSpanAngles(n) {
  return {
    start: (((n - 0.5) % 12 + 12) % 12 / 12) * 2 * Math.PI,
    end: (((n + 0.5) % 12) / 12) * 2 * Math.PI,
  };
}

function wedgePath(n, r1, r2) {
  let { start, end } = sectorSpanAngles(n);
  if (end <= start) end += 2 * Math.PI;
  const p1 = polar(r1, start);
  const p2 = polar(r2, start);
  const p3 = polar(r2, end);
  const p4 = polar(r1, end);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} A ${r2} ${r2} 0 0 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} A ${r1} ${r1} 0 0 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

function makeEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

class BoardRenderer {
  constructor(container) {
    this.container = container;
    this.rocketEls = {};
    this._build();
  }

  _build() {
    this.container.innerHTML = '';
    const svg = makeEl('svg', {
      viewBox: `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`,
      class: 'orbit-svg',
      role: 'img',
      'aria-label': 'Tabuleiro da órbita com 12 setores',
    });

    // definições visuais do planeta e brilho
    const defs = makeEl('defs');
    const grad = makeEl('radialGradient', { id: 'planetGradient', cx: '34%', cy: '28%', r: '72%' });
    [['0%','#6d91a7'],['52%','#294e67'],['100%','#10263b']].forEach(([offset,color]) => grad.appendChild(makeEl('stop',{offset,'stop-color':color})));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // fundo de estrelas discretas
    const starsGroup = makeEl('g', { class: 'stars-layer' });
    for (let i = 0; i < 46; i++) {
      const x = Math.random() * BOARD_SIZE;
      const y = Math.random() * BOARD_SIZE;
      const rr = Math.random() * 1.4 + 0.3;
      const star = makeEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: rr.toFixed(2), class: 'bg-star' });
      star.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
      starsGroup.appendChild(star);
    }
    svg.appendChild(starsGroup);

    // órbita externa decorativa
    svg.appendChild(makeEl('circle', { cx: CENTER, cy: CENTER, r: OUTER_R + 14, class: 'orbit-ring-outer' }));

    // setores
    const sectorsGroup = makeEl('g', { class: 'sectors' });
    for (let n = 1; n <= 12; n++) {
      const zone = SECTOR_ZONE(n);
      const isEvent = EVENT_SET.has(n);
      const path = makeEl('path', {
        d: wedgePath(n, INNER_R, OUTER_R),
        class: `sector sector-${zone}${isEvent ? ' sector-event' : ''}`,
        'data-sector': n,
      });
      sectorsGroup.appendChild(path);

      const labelPos = polar(LABEL_R, sectorCenterAngle(n));
      const label = makeEl('text', {
        x: labelPos.x.toFixed(1),
        y: labelPos.y.toFixed(1),
        class: 'sector-label',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
      label.textContent = `${n}/12`;
      sectorsGroup.appendChild(label);

      if (isEvent) {
        const iconPos = polar((INNER_R + OUTER_R) / 2 - 34, sectorCenterAngle(n));
        const icon = makeEl('text', {
          x: iconPos.x.toFixed(1),
          y: iconPos.y.toFixed(1),
          class: 'sector-event-icon',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
        });
        icon.textContent = '✦';
        sectorsGroup.appendChild(icon);
      }
    }
    svg.appendChild(sectorsGroup);

    // planeta central
    const planetGroup = makeEl('g', { class: 'center-planet' });
    planetGroup.appendChild(makeEl('circle', { cx: CENTER, cy: CENTER, r: INNER_R - 18, class: 'planet-body' }));
    [[-48,-34,24], [42,-52,15], [56,34,29], [-35,52,17], [4,7,12]].forEach(([dx,dy,r]) => planetGroup.appendChild(makeEl('circle',{cx:CENTER+dx,cy:CENTER+dy,r,class:'planet-crater'})));
    planetGroup.appendChild(makeEl('ellipse',{cx:CENTER-30,cy:CENTER-46,rx:70,ry:38,class:'planet-shine'}));
    planetGroup.appendChild(makeEl('circle', { cx: CENTER, cy: CENTER, r: INNER_R - 18, class: 'planet-glow' }));
    const coreText = makeEl('text',{x:CENTER,y:CENTER-3,class:'planet-core-title','text-anchor':'middle'}); coreText.textContent='12/12'; planetGroup.appendChild(coreText);
    const coreSub = makeEl('text',{x:CENTER,y:CENTER+25,class:'planet-core-sub','text-anchor':'middle'}); coreSub.textContent='1 ÓRBITA'; planetGroup.appendChild(coreSub);
    svg.appendChild(planetGroup);

    // camada de foguetes (por cima de tudo)
    const rocketsGroup = makeEl('g', { class: 'rockets' });
    svg.appendChild(rocketsGroup);
    this.rocketsGroup = rocketsGroup;

    // base de lançamento
    const baseGroup = makeEl('g', { class: 'launch-base' });
    const basePos = polar(OUTER_R + 60, sectorCenterAngle(0.15));
    baseGroup.appendChild(makeEl('rect', {
      x: basePos.x - 46, y: basePos.y - 20, width: 92, height: 40, rx: 8, class: 'launch-base-rect',
    }));
    const baseLabel = makeEl('text', {
      x: basePos.x, y: basePos.y, class: 'launch-base-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
    });
    baseLabel.textContent = 'BASE';
    baseGroup.appendChild(baseLabel);
    svg.appendChild(baseGroup);
    this.basePos = basePos;

    this.svg = svg;
    this.container.appendChild(svg);
  }

  _positionForPlayers(position, players) {
    // players: lista de jogadores ordenados que estão neste setor (para distribuir)
    const count = players.length;
    const basePoint = position === 0 ? this.basePos : polar(ROCKET_R, sectorCenterAngle(position));
    return players.map((p, idx) => {
      if (position === 0) {
        const offsetX = (idx - (count - 1) / 2) * 26;
        return { x: basePoint.x + offsetX, y: basePoint.y + 34 };
      }
      const angle = sectorCenterAngle(position);
      const spread = 16;
      const offsetAngle = (idx - (count - 1) / 2) * (spread / ROCKET_R);
      const pt = polar(ROCKET_R, angle + offsetAngle);
      return pt;
    });
  }

  /** Desenha (ou redesenha instantaneamente) todos os foguetes conforme o estado atual. */
  renderRockets(players, colorMap) {
    this.rocketsGroup.innerHTML = '';
    this.rocketEls = {};
    const byPosition = {};
    players.forEach((p) => {
      byPosition[p.position] = byPosition[p.position] || [];
      byPosition[p.position].push(p);
    });
    Object.entries(byPosition).forEach(([pos, group]) => {
      const points = this._positionForPlayers(Number(pos), group);
      group.forEach((p, idx) => {
        const el = this._createRocketEl(p, colorMap[p.colorId]);
        el.setAttribute('transform', `translate(${points[idx].x.toFixed(1)}, ${points[idx].y.toFixed(1)})`);
        this.rocketsGroup.appendChild(el);
        this.rocketEls[p.id] = el;
      });
    });
  }

  _createRocketEl(player, hex) {
    const g = makeEl('g', { class: 'rocket', 'data-player': player.id });
    g.appendChild(makeEl('circle', { r: 13, class: 'rocket-halo', fill: hex }));
    const path = makeEl('path', {
      d: 'M0,-12 C5,-4 6,4 3,10 L-3,10 C-6,4 -5,-4 0,-12 Z',
      fill: hex,
      class: 'rocket-body',
      stroke: '#0a0f1c',
      'stroke-width': 1.2,
    });
    g.appendChild(path);
    return g;
  }

  /**
   * Anima um foguete percorrendo setor a setor de `from` até `to`.
   * Chama onStepComplete(sector) a cada setor percorrido e onDone() ao final.
   */
  animateMove(playerId, from, to, hex, onStepComplete, onDone) {
    const el = this.rocketEls[playerId];
    if (!el) {
      if (onDone) onDone();
      return;
    }
    el.classList.add('rocket-moving');
    const steps = [];
    for (let s = from + 1; s <= to; s++) steps.push(s);
    if (steps.length === 0) {
      el.classList.remove('rocket-moving');
      if (onDone) onDone();
      return;
    }

    let i = 0;
    const stepDuration = 420;

    const moveNext = () => {
      if (i >= steps.length) {
        el.classList.remove('rocket-moving');
        if (onDone) onDone();
        return;
      }
      const sector = steps[i];
      const point = sector === 0 ? this.basePos : polar(ROCKET_R, sectorCenterAngle(sector));
      el.style.transition = `transform ${stepDuration}ms ease-in-out`;
      el.setAttribute('transform', `translate(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
      i += 1;
      setTimeout(() => {
        if (onStepComplete) onStepComplete(sector);
        moveNext();
      }, stepDuration);
    };
    moveNext();
  }

  /** Animação de decolagem final ao vencer. */
  animateLaunch(playerId, onDone) {
    const el = this.rocketEls[playerId];
    if (!el) {
      if (onDone) onDone();
      return;
    }
    el.classList.add('rocket-launch');
    setTimeout(() => {
      if (onDone) onDone();
    }, 1200);
  }

  highlightSector(n, on) {
    const path = this.svg.querySelector(`path.sector[data-sector="${n}"]`);
    if (path) path.classList.toggle('sector-active', on);
  }

  clearHighlights() {
    this.svg.querySelectorAll('.sector-active').forEach((el) => el.classList.remove('sector-active'));
  }
}

window.BoardRenderer = BoardRenderer;
window.BOARD_GEOMETRY = { polar, sectorCenterAngle, CENTER, ROCKET_R };
