// functions/api/data.js
export async function onRequest(context) {
  const { request } = context;

  // 1. Verificação de Humanidade: Exige o cookie cf_clearance do Cloudflare
  const cookie = request.headers.get('cookie') || '';
  if (!/cf_clearance=/.test(cookie)) {
    return new Response('Not Found', { status: 404 });
  }

  // 2. Defesa em profundidade: Bloqueia User-Agents conhecidos de bot (mesmo que tenham o cookie por algum milagre)
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (/bot|crawler|spider|headless|facebookexternalhit|meta-externalagent|whatsapp/i.test(ua)) {
    return new Response('Not Found', { status: 404 });
  }

  // 3. Dados Seguros: Note que usamos "path", NÃO "url". A URL real não existe aqui.
  // A imagem Base64 também só é entregue se o cf_clearance for válido.
  const secureData = {
    
    cards: [
      { id: 'privacy',    name: 'Privacy',       iconSrc: 'icons/privacy.png',    path: '/r/privacy',    requiresAgeCheck: true },
      { id: 'exclusivos', name: 'Exclusivos',    iconSrc: 'icons/exclusivos.png', path: '/r/exclusivos', requiresAgeCheck: true },
      { id: 'vip',        name: 'Telegram VIP',  svg: 'telegram',                 path: '/r/vip',        requiresAgeCheck: true },
      { id: 'free',       name: 'Telegram Free', svg: 'telegram',                 path: '/r/free',       requiresAgeCheck: true }
    ]
  };

  return new Response(JSON.stringify(secureData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
