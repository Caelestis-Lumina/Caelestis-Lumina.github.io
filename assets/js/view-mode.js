/* Shared by both Hugo surfaces; the WebGL bundle is never loaded by classic pages. */
(() => {
  if (window.parent !== window) return;
  const base = new URL(document.querySelector('meta[name="knowledge-base"]').content, location.href);
  const classic = new URL('classic/', base);
  const surface = document.querySelector('meta[name="knowledge-surface"]').content;
  const canonical = new URL(document.querySelector('meta[name="knowledge-canonical-base"]').content);
  const key = 'cl-knowledge:view';
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  const sceneURL = path => {
    const url = new URL(base);
    if (path && path !== base.pathname && path !== classic.pathname)
      url.hash = new URLSearchParams({page: path, view: 'page'}).toString();
    else try { url.hash = sessionStorage.getItem('cl-knowledge:last-scene') || ''; } catch {}
    return url.href;
  };
  if (surface === '3d' && !location.hash && preference === 'classic') {
    location.replace(classic.href);
    return;
  }
  if (surface === 'classic' && preference === '3d') {
    location.replace(sceneURL(location.pathname + location.search + location.hash));
    return;
  }
  const normalizeLink = link => {
    const url = new URL(link.href);
    if (url.origin === canonical.origin && url.pathname.startsWith(canonical.pathname)) {
      url.protocol = base.protocol;
      url.host = base.host;
      link.href = url.href;
    }
    if (surface === 'classic' && url.origin === base.origin && url.pathname === base.pathname && !link.hasAttribute('data-view-mode'))
      link.href = classic.href;
  };
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('a[href]').forEach(normalizeLink));
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-view-mode]');
    if (target) {
      event.preventDefault();
      const mode = target.dataset.viewMode;
      try { localStorage.setItem(key, mode); } catch {}
      if (mode === surface) return;
      if (surface === '3d') try { sessionStorage.setItem('cl-knowledge:last-scene', location.hash); } catch {}
      location.assign(mode === '3d' ? sceneURL(location.pathname + location.search + location.hash) : target.href || classic.href);
      return;
    }
    // The classic logo and breadcrumbs keep returning to the classic homepage.
    const link = event.target.closest('a[href]');
    if (link) normalizeLink(link);
  });
})();
