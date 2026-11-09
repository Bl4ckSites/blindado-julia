/* ==========================================================================
   RAIANE LEIT — main.js (MODO DE DIAGNÓSTICO VISUAL EXTREMO)
   ========================================================================== */
'use strict';

// Variável global para facilitar a escrita na tela
let debugContainer = null;

function debugLog(message, isError = false) {
    console.log(isError ? `[ERRO] ${message}` : `[DEBUG] ${message}`);
    
    if (!debugContainer) {
        debugContainer = document.getElementById('cards-container');
    }
    
    if (debugContainer) {
        const p = document.createElement('div');
        p.style.color = isError ? '#ff4444' : '#44ff44';
        p.style.fontSize = '12px';
        p.style.textAlign = 'center';
        p.style.fontFamily = 'monospace';
        p.style.margin = '5px 0';
        p.style.padding = '5px';
        p.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        p.textContent = message;
        debugContainer.appendChild(p);
    }
}

// Tratamento de erros global (se o script quebrar antes do DOMContentLoaded)
window.addEventListener('error', function(e) {
    debugLog(`Erro fatal de JS: ${e.message}`, true);
});

const SOCIALS = {
    instagram: 'https://www.instagram.com/rai.moraesht',
    telegram:  'https://t.me/Rayane_leite',
    x:         'https://x.com/raiane_leit',
    facebook:  'https://www.facebook.com/share/18UeksBW8A'
};

const TIMINGS = { ROTATION_MS: 400, FADE_MS: 300, RIPPLE_MS: 600 };

const ICONS = {
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>'
};

/* -------------------------------------------------------------
   CARREGAMENTO DO COFRE COM DIAGNÓSTICO
   ------------------------------------------------------------- */
async function loadVault() {
    debugLog("1. Iniciando conexão com a API...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        debugLog("TIMEOUT: A API demorou mais de 15s e foi abortada.", true);
        controller.abort();
    }, 15000);

    try {
        debugLog("2. Disparando fetch('/api/data')...");
        
        const response = await fetch('/api/data', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        debugLog(`3. Servidor respondeu com Status: ${response.status}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} (Bloqueio)`);
        }

        debugLog("4. Lendo JSON da resposta...");
        const textData = await response.text(); // Lê como texto primeiro para debugar erros de HTML
        
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            debugLog("ERRO: O servidor não retornou um JSON válido. Provavelmente retornou HTML (Bloqueio Cloudflare).", true);
            throw new Error("JSON Inválido");
        }

        debugLog("5. JSON lido com sucesso. Aplicando imagem...");
        
        try {
            applyBackgroundSafe(data.backgroundImage);
            debugLog("6. Imagem aplicada (ou ignorada por segurança).");
        } catch (bgErr) {
            debugLog("Aviso: Falha ao aplicar imagem, seguindo para os botões...", true);
        }

        debugLog("7. Limpando tela e renderizando botões...");
        clearContainer();
        renderCards(data.cards);
        debugLog("✅ SUCESSO! Site carregado.");

    } catch (err) {
        clearTimeout(timeoutId);
        
        let errorDetails = err.message;
        if (err.name === 'AbortError') errorDetails = "Timeout de 15s atingido";
        
        debugLog(`❌ FALHA CRÍTICA: ${errorDetails}`, true);
        
        // Se der erro, mostra o botão de recarregar no final
        renderFallback();
    }
}

/* -------------------------------------------------------------
   FALLBACK
   ------------------------------------------------------------- */
function renderFallback() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.setAttribute('aria-busy', 'false');
    
    const btn = document.createElement('div');
    btn.className = 'card-item';
    btn.style.cursor = 'pointer';
    btn.style.textAlign = 'center';
    btn.innerHTML = '<span class="card-label">Recarregue a página</span>';
    btn.onclick = () => window.location.reload();
    container.appendChild(btn);
}

function applyBackgroundSafe(base64) {
    if (!base64 || typeof base64 !== 'string') return;
    const bg = document.querySelector('.page-bg');
    if (bg) bg.style.backgroundImage = 'url("' + base64 + '")';
}

function clearContainer() {
    const container = document.getElementById('cards-container');
    if (container) { container.innerHTML = ''; container.setAttribute('aria-busy', 'false'); }
}

function renderCards(cards) {
    const container = document.getElementById('cards-container');
    if (!container) return;

    cards.forEach((card, index) => {
        const el = document.createElement('a');
        el.className = 'card-item';
        el.href = card.path;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Acessar ' + (card.title || card.name));
        el.style.setProperty('--card-index', index);

        const iconWrap = document.createElement('span');
        iconWrap.className = 'card-icon card-icon--' + card.id;
        iconWrap.setAttribute('aria-hidden', 'true');

        if (card.svg && ICONS[card.svg]) {
            iconWrap.innerHTML = ICONS[card.svg];
        } else if (card.iconSrc) {
            const img = document.createElement('img');
            img.src = card.iconSrc; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
            iconWrap.appendChild(img);
        }

        const label = document.createElement('span');
        label.className = 'card-label';
        label.textContent = card.title || card.name;

        el.appendChild(iconWrap);
        el.appendChild(label);

        attachTapHandler(el, (event) => {
            createRipple(event, el);
            handleCardClick(card, el);
        });

        container.appendChild(el);
    });
}

function handleCardClick(card, cardElement) {
    if (cardElement && !prefersReducedMotion.matches) {
        cardElement.classList.add('card-pulse');
        cardElement.addEventListener('animationend', () => cardElement.classList.remove('card-pulse'), { once: true });
    }
    const path = card.path;
    if (!path) return;
    if (card.requiresAgeCheck && typeof window.triggerAgeModal === 'function') {
        window.triggerAgeModal(path);
    } else {
        window.location.href = path;
    }
}

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
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.09, now + 0.005); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.1);
}

function createRipple(event, element) {
    if (prefersReducedMotion.matches || !element || element.querySelector('.ripple')) return;
    const rect = element.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
    const cx = (event && typeof event.clientX === 'number') ? event.clientX : rect.left + rect.width / 2;
    const cy = (event && typeof event.clientY === 'number') ? event.clientY : rect.top + rect.height / 2;
    const ripple = document.createElement('span'); ripple.className = 'ripple';
    ripple.style.width = size + 'px'; ripple.style.height = size + 'px'; ripple.style.left = (cx - rect.left - size / 2) + 'px'; ripple.style.top = (cy - rect.top - size / 2) + 'px';
    element.appendChild(ripple); ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

const TAP_MAX_DISTANCE = 10; const TAP_MAX_DURATION = 500;
function attachTapHandler(element, handler) {
    let startX = 0, startY = 0, startTime = 0, isTap = false, lastHandled = 0;
    const run = (event) => { const now = Date.now(); if (now - lastHandled < 400) return; lastHandled = now; playClickSound(); handler(event); };
    element.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; startX = t.clientX; startY = t.clientY; startTime = Date.now(); isTap = true; }, { passive: true });
    element.addEventListener('touchmove', (e) => { if (!isTap) return; const t = e.changedTouches[0]; if (Math.abs(t.clientX - startX) > TAP_MAX_DISTANCE || Math.abs(t.clientY - startY) > TAP_MAX_DISTANCE) isTap = false; }, { passive: true });
    element.addEventListener('touchend', (e) => { if (!isTap || Date.now() - startTime > TAP_MAX_DURATION) return; const t = e.changedTouches[0]; if (Math.abs(t.clientX - startX) > TAP_MAX_DISTANCE || Math.abs(t.clientY - startY) > TAP_MAX_DISTANCE) return; e.preventDefault(); run({ clientX: t.clientX, clientY: t.clientY, currentTarget: element, target: e.target }); }, { passive: false });
    element.addEventListener('click', (e) => { e.preventDefault(); run({ clientX: e.clientX, clientY: e.clientY, currentTarget: element, target: e.target }); });
}

document.addEventListener('DOMContentLoaded', () => { 
    initSocialLinks(); 
    initModal(); 
    
    // Transforma o container em um console visível
    const container = document.getElementById('cards-container');
    if (container) {
        container.innerHTML = ''; // Limpa o spinner
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'flex-start';
        container.style.padding = '10px';
        container.style.background = 'rgba(0,0,0,0.8)';
        container.style.borderRadius = '10px';
        container.style.minHeight = '200px';
    }
    
    loadVault(); 
});

function initSocialLinks() { document.querySelectorAll('.social-link[data-social]').forEach(link => { const platform = link.getAttribute('data-social'); if (SOCIALS[platform]) link.href = SOCIALS[platform]; }); }

function initModal() {
    const modal = document.getElementById('age-modal'); const closeBtn = document.getElementById('modal-close'); const confirmBtn = document.getElementById('modal-confirm'); const cancelBtn = document.getElementById('modal-cancel');
    if (!modal) return;
    let selectedDestination = null; let previouslyFocusedElement = null; let closeTimer = null;
    function calculateScrollbarWidth() { const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth; document.body.style.setProperty('--scrollbar-compensation', scrollbarWidth + 'px'); }
    const openModal = () => { clearTimeout(closeTimer); previouslyFocusedElement = document.activeElement; calculateScrollbarWidth(); if (closeBtn) closeBtn.classList.remove('is-closing'); modal.classList.remove('is-closing', 'active'); modal.hidden = false; document.body.classList.add('modal-active'); void modal.offsetHeight; modal.classList.add('active'); if (confirmBtn) confirmBtn.focus(); };
    const closeModal = () => { if (modal.hidden || modal.classList.contains('is-closing')) return; modal.classList.add('is-closing'); modal.classList.remove('active'); document.body.classList.remove('modal-active'); clearTimeout(closeTimer); closeTimer = setTimeout(() => { modal.hidden = true; modal.classList.remove('is-closing'); if (closeBtn) closeBtn.classList.remove('is-closing'); if (previouslyFocusedElement && previouslyFocusedElement.focus) previouslyFocusedElement.focus(); }, TIMINGS.FADE_MS); selectedDestination = null; };
    const closeBtnHandler = () => { if (closeBtn.classList.contains('is-closing')) return; closeBtn.classList.add('is-closing'); setTimeout(() => closeModal(), TIMINGS.ROTATION_MS); };
    const confirmAndGo = () => { if (!selectedDestination) { closeModal(); return; } const url = selectedDestination; closeModal(); setTimeout(() => { window.location.href = url; }, TIMINGS.FADE_MS + 50); };
    if (closeBtn) attachTapHandler(closeBtn, closeBtnHandler);
    if (cancelBtn) attachTapHandler(cancelBtn, (e) => { createRipple(e, cancelBtn); closeModal(); });
    if (confirmBtn) attachTapHandler(confirmBtn, (e) => { createRipple(e, confirmBtn); confirmAndGo(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
    window.triggerAgeModal = (url) => { selectedDestination = url; openModal(); };
}
