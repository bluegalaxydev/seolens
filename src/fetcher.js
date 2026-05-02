/**
 * Fetches a URL and returns HTML, headers, and timing info.
 * Uses native fetch (Node 18+).
 */
export async function fetchPage(url, { timeout = 15000, userAgent } = {}) {
  const ua = userAgent || 'Mozilla/5.0 (compatible; Seolens/0.1; +https://github.com/bluegalaxydev/seolens)';
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);

  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': ua, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
      redirect: 'follow',
    });
    const html = await res.text();
    const elapsed = Date.now() - start;

    return {
      url: res.url,
      finalUrl: res.url,
      requestedUrl: url,
      status: res.status,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      html,
      bytes: Buffer.byteLength(html, 'utf8'),
      elapsedMs: elapsed,
    };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Lightweight HEAD-style probe — just checks if a URL is reachable.
 * Falls back to GET if HEAD is rejected (some servers reject HEAD).
 */
export async function probe(url, { timeout = 8000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'follow' });
    }
    return { ok: res.ok, status: res.status, url: res.url };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  } finally {
    clearTimeout(t);
  }
}
