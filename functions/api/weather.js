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
    // 1. 先读缓存
    const cached = await env.NAV_AUTH.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 请求 uapis.cn 天气接口
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

    // 3. 解析原始数据
    const rawData = await response.json();

    // 4. 转换为前端期望的格式
    const formatted = {
      code: 200,
      data: {
        city: rawData.province && rawData.city 
          ? `${rawData.province} ${rawData.city}` 
          : (rawData.city || city),
        temp: rawData.temperature ? `${rawData.temperature}°C` : '--',
        weather: rawData.weather || '--',
        wind: rawData.wind_direction ? `${rawData.wind_direction} ` : '',
        windLevel: rawData.wind_power || ''
      }
    };

    const resultJson = JSON.stringify(formatted);

    // 5. 写入缓存
    await env.NAV_AUTH.put(cacheKey, resultJson, { expirationTtl: CACHE_TTL });

    // 6. 返回
    return new Response(resultJson, {
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
