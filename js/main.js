/* ==========================================================================
JULIANA ZARH — main.js (Arquitetura Híbrida Segura + Degradação Graciosa)
========================================================================== */
'use strict';

const TIMINGS = { ROTATION_MS: 400, FADE_MS: 300, RIPPLE_MS: 600 };
let appData = null;

// Ícones SVG estáticos (inofensivos)
const ICONS = {
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>'
};

document.addEventListener('DOMContentLoaded', async () => {
  initModal();
  await loadSecureData();
});

async function loadSecureData() {
  const container = document.getElementById('cards-container');
  
  try {
    // Busca os dados do cofre.
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Acesso negado ou não autorizado');
    
    appData = await response.json();

    // =====================================================================
    // TÉCNICA DE DEGRADAÇÃO GRACIOSA (Graceful Degradation)
    // Tentamos aplicar a imagem. Se o WebView do Instagram não aguentar o 
    // peso do Base64, ele joga um erro aqui, mas NÃO trava a renderização.
    // =====================================================================
    try {
      if (appData.backgroundImage && appData.backgroundImage.startsWith('data:image')) {
        const bgElement = document.querySelector('.page-bg');
        if (bgElement) {
          bgElement.style.backgroundImage = `url('${appData.backgroundImage}')`;
        }
      }
    } catch (imgError) {
      console.warn('Aviso: A imagem de fundo falhou ao carregar (possível limite de memória do WebView). Mantendo fundo preto.', imgError);
      // O fundo preto definido no CSS continua, o código segue em frente.
    }

    // Renderiza os cards independentemente da imagem ter carregado ou falhado
    renderCards(container);

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (container) {
      // Se a API falhar totalmente (ex: bloqueio de bot), mostra erro
      container.innerHTML = '<div class="loading-spinner">Erro de conexão. Atualize a página.</div>';
    }
  }
}

function renderCards(container) {
  if (!container || !appData) return;
  container.innerHTML = ''; // Limpa o spinner

  appData.cards.forEach((card, index) => {
    const cardElement = document.createElement('a');
    cardElement.className = 'card-item';
    cardElement.href = '#';
    cardElement.setAttribute('role', 'button');
    cardElement.setAttribute('aria-label', `Acessar ${card.name}`);
    cardElement.style.setProperty('--card-index', index);

    const iconWrap = document.createElement('span');
    iconWrap.className = `card-icon card-icon--${card.id}`;
    iconWrap.setAttribute('aria-hidden', 'true');

    if (card.svg && ICONS[card.svg]) {
      iconWrap.innerHTML = ICONS[card.svg];
    } else if (card.iconSrc) {
      const img = document.createElement('img');
      img.src = card.iconSrc;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      iconWrap.appendChild(img);
    }

    const label = document.createElement('span');
    label.className = 'card-label';
    label.textContent = card.name;

    cardElement.appendChild(iconWrap);
    cardElement.appendChild(label);

    attachTapHandler(cardElement, (event) => {
      createRipple(event, cardElement);
      handleCardClick(card.path, card, cardElement);
    });

    container.appendChild(cardElement);
  });
}

function handleCardClick(path, card, cardElement) {
  if (cardElement && !prefersReducedMotion.matches) {
    cardElement.classList.add('card-pulse');
    cardElement.addEventListener('animationend', () => {
      cardElement.classList.remove('card-pulse');
    }, { once: true });
  }
  if (!path || path === '#') return;
  
  trackCardClick(card.name, card.id, path);
  
  if (card.requiresAgeCheck && typeof window.triggerAgeModal === 'function') {
    window.triggerAgeModal(path);
  } else {
    window.location.href = path;
  }
}

function trackCardClick(cardName, cardId, destinationPath) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'select_content', {
    content_type: 'card_link',
    content_id: cardId || cardName,
    card_name: cardName,
    destination_url: destinationPath || ''
  });
}

/* =============================================================
ÁUDIO & PREFERÊNCIAS DE MOVIMENTO
============================================================= */
let audioCtx = null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try { audioCtx = new Ctx(); } catch (_) { audioCtx = null; }
}

function playClickSound() {
  if (prefersReducedMotion.matches) return;
  initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

/* =============================================================
RIPPLE & TAP HELPER
============================================================= */
function createRipple(event, element) {
  if (prefersReducedMotion.matches) return;
  if (!element || element.querySelector('.ripple')) return;
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const cx = (event && typeof event.clientX === 'number') ? event.clientX : rect.left + rect.width / 2;
  const cy = (event && typeof event.clientY === 'number') ? event.clientY : rect.top + rect.height / 2;
  const x = cx - rect.left - size / 2;
  const y = cy - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  element.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

const TAP_MAX_DISTANCE = 10;
const TAP_MAX_DURATION = 500;

function attachTapHandler(element, handler) {
  let startX = 0, startY = 0, startTime = 0;
  let isTap = false;
  let lastHandled = 0;
  const run = (event) => {
    const now = Date.now();
    if (now - lastHandled < 400) return;
    lastHandled = now;
    playClickSound();
    handler(event);
  };
  element.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX; startY = t.clientY; startTime = Date.now(); isTap = true;
  }, { passive: true });
  element.addEventListener('touchmove', (e) => {
    if (!isTap) return;
    const t = e.changedTouches[0];
    if (Math.abs(t.clientX - startX) > TAP_MAX_DISTANCE || Math.abs(t.clientY - startY) > TAP_MAX_DISTANCE) isTap = false;
  }, { passive: true });
  element.addEventListener('touchend', (e) => {
    if (!isTap) return;
    if (Date.now() - startTime > TAP_MAX_DURATION) return;
    const t = e.changedTouches[0];
    if (Math.abs(t.clientX - startX) > TAP_MAX_DISTANCE || Math.abs(t.clientY - startY) > TAP_MAX_DISTANCE) return;
    e.preventDefault();
    run({ clientX: t.clientX, clientY: t.clientY, currentTarget: element, target: e.target });
  }, { passive: false });
  element.addEventListener('click', (e) => {
    e.preventDefault();
    run({ clientX: e.clientX, clientY: e.clientY, currentTarget: element, target: e.target });
  });
}

/* =============================================================
MODAL +18
============================================================= */
function initModal() {
  const modal = document.getElementById('age-modal');
  const closeBtn = document.getElementById('modal-close');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  if (!modal) return;

  let selectedDestination = null;
  let previouslyFocusedElement = null;
  let closeTimer = null;

  function calculateScrollbarWidth() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.setProperty('--scrollbar-compensation', scrollbarWidth + 'px');
  }

  const openModal = () => {
    clearTimeout(closeTimer);
    previouslyFocusedElement = document.activeElement;
    calculateScrollbarWidth();
    if (closeBtn) closeBtn.classList.remove('is-closing');
    modal.classList.remove('is-closing');
    modal.classList.remove('active');
    modal.hidden = false;
    document.body.classList.add('modal-active');
    void modal.offsetHeight;
    modal.classList.add('active');
    if (confirmBtn) confirmBtn.focus();
  };

  const closeModal = () => {
    if (modal.hidden || modal.classList.contains('is-closing')) return;
    modal.classList.add('is-closing');
    modal.classList.remove('active');
    document.body.classList.remove('modal-active');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('is-closing');
      if (closeBtn) closeBtn.classList.remove('is-closing');
      if (previouslyFocusedElement && previouslyFocusedElement.focus) previouslyFocusedElement.focus();
    }, TIMINGS.FADE_MS);
    selectedDestination = null;
  };

  const closeBtnHandler = () => {
    if (closeBtn.classList.contains('is-closing')) return;
    closeBtn.classList.add('is-closing');
    setTimeout(() => { closeModal(); }, TIMINGS.ROTATION_MS);
  };

  const confirmAndGo = () => {
    if (!selectedDestination) { closeModal(); return; }
    const path = selectedDestination;
    closeModal();
    setTimeout(() => { window.location.href = path; }, TIMINGS.FADE_MS + 50);
  };

  if (closeBtn) attachTapHandler(closeBtn, closeBtnHandler);
  if (cancelBtn) attachTapHandler(cancelBtn, (e) => { createRipple(e, cancelBtn); closeModal(); });
  if (confirmBtn) attachTapHandler(confirmBtn, (e) => { createRipple(e, confirmBtn); confirmAndGo(); });

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  window.triggerAgeModal = (path) => { selectedDestination = path; openModal(); };
}
