export async function onRequest(context) {
  const { request, next } = context;
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const asn = request.cf?.asn;

  // Lista de assinaturas de bots da Meta e WhatsApp
  const isMetaBotUA = /facebookexternalhit|meta-externalagent|meta-externalfetcher|meta-webindexer|whatsapp/i.test(ua);

  // A MÁGICA: Bloqueia APENAS se vier da ASN da Meta (32934) E for um User-Agent de bot.
  // Isso garante que usuários reais do WhatsApp (que usam UA de navegador normal e ASN de operadora) passem livremente.
  if (asn === 32934 && isMetaBotUA) {
    // Retorna um HTML mínimo e seguro. O bot acha que o site é só isso e vai embora.
    return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta property="og:type" content="website">
    <meta property="og:title" content="Julia Nazar">
    <meta property="og:description" content="Meus links oficiais ✨">
    <meta property="og:image" content="/og-safe.jpg">
    <meta property="og:url" content="https://julianazarh.com/">
</head>
<body></body>
</html>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Se for um humano ou outro bot inofensivo, deixa passar para o site real
  return next();
}
