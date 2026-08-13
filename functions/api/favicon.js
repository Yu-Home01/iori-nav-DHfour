export async function onRequestGet(context) {
  const { env } = context;
  
  // 从 KV 读取图片
  const imageData = await env.NAV_AUTH.get('favicon_image');
  if (!imageData) {
    return new Response('Not found', { status: 404 });
  }
  
  // 解析 base64 数据
  if (imageData.startsWith('data:')) {
    const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];      // 如 image/png
      const base64Data = match[2];    // base64 字符串
      
      // base64 转二进制
      const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      return new Response(binary, {
        headers: { 
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }
  }
  
  return new Response('Invalid image', { status: 400 });
}
