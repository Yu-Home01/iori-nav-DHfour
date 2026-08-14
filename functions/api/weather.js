const CACHE_TTL = 1800; // 30分钟缓存

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const city = url.searchParams.get('city')?.trim();

  if (!city) {
    return new Response(JSON.stringify({ code: 400, message: 'Missing city' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `weather:${city}`;

  try {
    const cached = await env.NAV_AUTH.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = `https://uapis.cn/api/weather?city=${encodeURIComponent(city)}`;
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'iori-nav/1.0' },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ code: 502, message: 'Weather API error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.text();
    await env.NAV_AUTH.put(cacheKey, data, { expirationTtl: CACHE_TTL });

    return new Response(data, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Weather error:', e);
    return new Response(JSON.stringify({ code: 500, message: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
