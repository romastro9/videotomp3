(() => {
  'use strict';

  const RELEASE = '5';
  const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';
  const card = document.querySelector('.converter-card');

  function fail(message) {
    if (card) {
      card.innerHTML = `<div class="alert" role="alert">${String(message)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')}</div>`;
    }
  }

  async function start() {
    if (!card) return;
    if (!window.FFmpegWASM || typeof window.FFmpegWASM.FFmpeg !== 'function') {
      throw new Error('FFmpeg browser API failed to load. Please refresh the page.');
    }

    const response = await fetch(`converter-v4.js?v=${RELEASE}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load converter code (HTTP ${response.status}).`);
    let source = await response.text();

    const constantsPattern = /  const ENGINE_BASE = new URL\('vendor\/ffmpeg-core\/', document\.baseURI\)\.href;\s*  const CLASS_WORKER_URL = new URL\('vendor\/ffmpeg\/__CLASS_WORKER__', document\.baseURI\)\.href;/;
    const constantsReplacement = `  const CLASS_WORKER_URL = new URL('vendor/ffmpeg/ffmpeg-worker.js?v=${RELEASE}', document.baseURI).href;
  const CORE_BASE_URL = '${CORE_BASE}';
  const ENGINE_BLOB_URLS = [];

  async function fetchAsBlobURL(url, mimeType) {
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!response.ok) throw new Error(\`Unable to load conversion engine (HTTP \${response.status}).\`);
    const blobURL = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: mimeType }));
    ENGINE_BLOB_URLS.push(blobURL);
    return blobURL;
  }`;

    const loadPattern = /      await instance\.load\(\{\s*classWorkerURL: CLASS_WORKER_URL,\s*coreURL: `\$\{ENGINE_BASE\}ffmpeg-core\.js`,\s*wasmURL: `\$\{ENGINE_BASE\}ffmpeg-core\.wasm`\s*\}\);/;
    const loadReplacement = `      const [coreURL, wasmURL] = await Promise.all([
        fetchAsBlobURL(\`\${CORE_BASE_URL}ffmpeg-core.js\`, 'text/javascript'),
        fetchAsBlobURL(\`\${CORE_BASE_URL}ffmpeg-core.wasm\`, 'application/wasm')
      ]);
      await instance.load({
        classWorkerURL: CLASS_WORKER_URL,
        coreURL,
        wasmURL
      });`;

    if (!constantsPattern.test(source)) throw new Error('V5 engine constants patch did not match.');
    source = source.replace(constantsPattern, constantsReplacement);
    if (!loadPattern.test(source)) throw new Error('V5 engine loader patch did not match.');
    source = source.replace(loadPattern, loadReplacement);

    if (source.includes('vendor/ffmpeg-core/')) {
      throw new Error('Old local FFmpeg core path is still present.');
    }

    const scriptURL = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const script = document.createElement('script');
    script.src = scriptURL;
    script.onload = () => URL.revokeObjectURL(scriptURL);
    script.onerror = () => {
      URL.revokeObjectURL(scriptURL);
      fail('The V5 converter script could not start.');
    };
    document.head.appendChild(script);
  }

  const themeButton = document.getElementById('theme-button');
  themeButton?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    themeButton.textContent = dark ? '☼' : '☾';
  });

  start().catch((error) => fail(error instanceof Error ? error.message : String(error)));
})();
