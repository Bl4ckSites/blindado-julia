// functions/r/[slug].js
export async function onRequest(context) {
  const { request, params } = context;

  // 1. Verificação de Humanidade: Exige o cookie cf_clearance
  const cookie = request.headers.get('cookie') || '';
  if (!/cf_clearance=/.test(cookie)) {
    return new Response('Not Found', { status: 404 });
  }

  // 2. Defesa em profundidade
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (/bot|crawler|spider|headless|facebookexternalhit|meta-externalagent|whatsapp/i.test(ua)) {
    return new Response('Not Found', { status: 404 });
  }

  // 3. O MAPA SECRETO: As URLs reais existem apenas nesta função, no servidor.
  const destinations = {
    'privacy':    'https://privacy.com.br/profile/julianazar',
    'exclusivos': 'https://linkpriv.app/julia.nazr',
    'vip':        'https://t.me/julianazrbot',
    'free':       'https://t.me/julia_nazr'
  };

  const target = destinations[params.slug];
  
  if (!target) {
    return new Response('Not Found', { status: 404 });
  }

  // 4. Redirecionamento 302 para o destino final
  return Response.redirect(target, 302);
}