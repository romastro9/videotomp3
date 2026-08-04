/* VideoToMP3 V9 secure engine bootstrap.
   Registers the isolation service worker, reloads once, then loads FFmpeg. */

(() => {
  'use strict';

  const RELEASE = '9';
  const RELOAD_KEY = 'videotomp3-coi-reloads';
  const cardSelector = '.converter-card';

  function showStatus(title, message, isError = false) {
    const render = () => {
      const card = document.querySelector(cardSelector);
      if (!card) return;
      card.innerHTML = `
        <div class="status-stage${isError ? ' alert' : ''}" aria-live="polite">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>`;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render, { once: true });
    } else {
      render();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadScript(src, crossOrigin = false) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      if (crossOrigin) script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function startConverter() {
    sessionStorage.removeItem(RELOAD_KEY);
    showStatus('Loading VideoToMP3 V9…', 'Starting the isolated browser conversion engine.');

    await loadScript(
      'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js',
      true
    );
    await loadScript(`ffmpeg-legacy-adapter.js?v=${RELEASE}`);
    await loadScript(`theme-v6.js?v=${RELEASE}`);
    await loadScript(`converter-v9.js?v=${RELEASE}`);
  }

  async function enableIsolation() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support the secure worker required by the converter.');
    }

    showStatus(
      'Preparing secure browser mode…',
      'The page will reload once automatically before conversion starts.'
    );

    const registration = await navigator.serviceWorker.register(
      `coi-serviceworker.js?v=${RELEASE}`,
      { scope: './', updateViaCache: 'none' }
    );

    await registration.update();
    await navigator.serviceWorker.ready;

    const reloads = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
    if (reloads >= 3) {
      throw new Error('Secure browser mode could not start. Close this tab, reopen the website, and try again.');
    }

    sessionStorage.setItem(RELOAD_KEY, String(reloads + 1));

    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 1200);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      });
    }

    location.reload();
  }

  async function boot() {
    if (window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
      await startConverter();
      return;
    }

    await enableIsolation();
  }

  boot().catch((error) => {
    const detail = error instanceof Error ? error.message : String(error);
    showStatus('Converter could not start', detail, true);
  });
})();
