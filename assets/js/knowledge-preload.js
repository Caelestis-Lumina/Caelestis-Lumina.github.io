/* Warm the HTTP cache after reading is ready; do not import modules or create a canvas. */
(() => {
  if (window.parent !== window || document.documentElement.hasAttribute('data-view-redirect')) return;
  const connection = navigator.connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  // Phones warm the small entry components; models/fonts wait for an explicit visit.
  const mobile = matchMedia('(max-width: 767px), (pointer: coarse) and (max-width: 1024px)').matches;
  const meta = document.querySelector('meta[name="knowledge-preload"]');
  if (!meta) return;
  const controller = new AbortController();
  window.addEventListener('pagehide', () => controller.abort(), {once: true});
  const options = {cache: 'force-cache', credentials: 'same-origin', signal: controller.signal, priority: 'low'};
  const warm = async () => {
    if (document.hidden || navigator.onLine === false) return;
    try {
      const response = await fetch(meta.content, options);
      if (!response.ok) return;
      const urls = await response.json();
      for (const path of urls) {
        if (controller.signal.aborted || document.hidden) break;
        const url = new URL(path, location.href);
        if (url.origin !== location.origin) continue;
        if (mobile && !/\.(js|css)$/.test(url.pathname)) continue;
        const asset = await fetch(url, options);
        if (asset.ok) await asset.arrayBuffer();
      }
    } catch { /* A failed warm-up never interrupts classic reading or navigation. */ }
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, {timeout: 6000});
    else setTimeout(warm, 3000);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, {once: true});
})();
