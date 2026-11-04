/* ==========================================================================
JULIANA ZARH — main.js (Versão Blindada)
========================================================================== */
'use strict';

/* =============================================================
DADOS SEGUROS (Codificados em Base64)
⚠️ COLE SUA STRING BASE64 ABAIXO, DENTRO DAS ASPAS, APÓS A BARRA
============================================================= */
const BG_DATA_URL = "data:image/jpeg;base64,COLE_AQUI_SUA_STRING_BASE64_SEM_QUEBRAS_DE_LINHA";

const SECURE_CARDS = [
  { id: 'privacy', name: 'Privacy', iconSrc: 'icons/privacy.png', urlB64: 'aHR0cHM6Ly9wcml2YWN5LmNvbS5ici9wcm9maWxlL2p1bGlhbmF6YXI=', requiresAgeCheck: true },
  { id: 'exclusivos', name: 'Exclusivos', iconSrc: 'icons/exclusivos.png', urlB64: 'aHR0cHM6Ly9saW5rcHJpdi5hcHAvanVsaWEubmF6cg==', requiresAgeCheck: true },
  { id: 'vip', name: 'Telegram VIP', svg: 'telegram', urlB64: 'aHR0cHM6Ly90Lm1lL2p1bGlhbmF6cmJvdA==', requiresAgeCheck: true },
  { id: 'free', name: 'Telegram Free', svg: 'telegram', urlB64: 'aHR0cHM6Ly90Lm1lL2p1bGlhX25henI=', requiresAgeCheck: true }
];

const TIMINGS = { ROTATION_MS: 400, FADE_MS: 300, RIPPLE_MS: 600 };

const ICONS = {
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.21 6.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>'
};

/* =============================================================
INICIALIZAÇÃO SEGURA
============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initSecureApp();
  initModal();
});

function initSecureApp() {
  // 1. Bloqueio básico de automação no cliente
  if (navigator.webdriver === true) {
    document.getElementById('cards-container').innerHTML = '<div class="loading-spinner">Erro de ambiente.</div>';
    return;
  }

  // 2. Injeta a imagem de fundo de forma segura (nunca aparece no HTML estático)
  const bgElement = document.querySelector('.page-bg');
  if (bgElement && BG_DATA_URL.includes('COLE_AQUI') === false) {
    bgElement.style.backgroundImage = `url('${BG_DATA_URL}')`;
  }

  // 3. Decodifica e renderiza os cards
  renderCardsSecurely();
}

function renderCardsSecurely() {
  const container = document.getElementById('cards-container');
  if (!container) return;
  
  container.innerHTML = ''; // Limpa o spinner

  SECURE_CARDS.forEach((card, index) => {
    // Decodifica a URL em memória (atob é nativo e seguro para Base64)
    const realUrl = atob(card.urlB64);
    
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
      handleCardClick(realUrl, card, cardElement);
    });

    container.appendChild(cardElement);
  });
}

/* =============================================================
LÓGICA DE CLIQUE E TRACKING
============================================================= */
function handleCardClick(url, card, cardElement) {
  if (cardElement && !prefersReducedMotion.matches) {
    cardElement.classList.add('card-pulse');
    cardElement.addEventListener('animationend', () => {
      cardElement.classList.remove('card-pulse');
    }, { once: true });
  }
  if (url === '#' || !url) return;
  
  trackCardClick(card.name, card.id, url);
  
  if (card.requiresAgeCheck && typeof window.triggerAgeModal === 'function') {
    window.triggerAgeModal(url);
  } else {
    window.location.href = url;
  }
}

function trackCardClick(cardName, cardId, destinationUrl) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'select_content', {
    content_type: 'card_link',
    content_id: cardId || cardName,
    card_name: cardName,
    destination_url: destinationUrl || ''
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
    const url = selectedDestination;
    closeModal();
    setTimeout(() => { window.location.href = url; }, TIMINGS.FADE_MS + 50);
  };

  if (closeBtn) attachTapHandler(closeBtn, closeBtnHandler);
  if (cancelBtn) attachTapHandler(cancelBtn, (e) => { createRipple(e, cancelBtn); closeModal(); });
  if (confirmBtn) attachTapHandler(confirmBtn, (e) => { createRipple(e, confirmBtn); confirmAndGo(); });

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  window.triggerAgeModal = (url) => { selectedDestination = url; openModal(); };
}
