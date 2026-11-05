// functions/r/[slug].js
export async function onRequest(context) {
  const { request, params } = context;
  const cookie = request.headers.get('cookie') || '';
  const ua = (request.headers.get('user-agent') || '').toLowerCase();

  // 1. Detecta se é o WebView do Instagram
  const isInstagramWebView = /instagram/i.test(ua);

  // 2. Verificação de Humanidade (Bypass para o Instagram)
  if (!isInstagramWebView && !/cf_clearance=/.test(cookie)) {
    return new Response('Not Found', { status: 404 });
  }

  // 3. Defesa em profundidade: Bloqueia bots reais
  if (/bot|crawler|spider|headless|facebookexternalhit|meta-externalagent/i.test(ua)) {
    return new Response('Not Found', { status: 404 });
  }

  // 4. O MAPA SECRETO: As URLs reais existem apenas aqui no servidor
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

  // 5. Redirecionamento 302 (O navegador do Insta vai abrir o link agora)
  return Response.redirect(target, 302);
}
