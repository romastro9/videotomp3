/* VideoToMP3 V4 — private multi-file audio conversion queue.
   Uses same-origin FFmpeg WebAssembly. Files remain in browser memory. */

(() => {
  'use strict';

  const card = document.querySelector('.converter-card');
  if (!card || !window.FFmpegWASM || typeof window.FFmpegWASM.FFmpeg !== 'function') return;

  const INPUT_EXTENSIONS = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'];
  const MAX_FILES = 25;
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  const ENGINE_BASE = new URL('vendor/ffmpeg-core/', document.baseURI).href;
  const CLASS_WORKER_URL = new URL('vendor/ffmpeg/__CLASS_WORKER__', document.baseURI).href;

  const FORMAT_CONFIG = {
    mp3:  { label: 'MP3', extension: 'mp3', mime: 'audio/mpeg', lossless: false },
    wav:  { label: 'WAV', extension: 'wav', mime: 'audio/wav', lossless: true },
    m4a:  { label: 'M4A', extension: 'm4a', mime: 'audio/mp4', lossless: false },
    aac:  { label: 'AAC', extension: 'aac', mime: 'audio/aac', lossless: false },
    ogg:  { label: 'OGG', extension: 'ogg', mime: 'audio/ogg', lossless: false },
    flac: { label: 'FLAC', extension: 'flac', mime: 'audio/flac', lossless: true }
  };

  const queue = [];
  let ffmpeg = null;
  let enginePromise = null;
  let processing = false;
  let cancelRequested = false;
  let activeItemId = null;

  card.innerHTML = `
    <div class="batch-converter" aria-live="polite">
      <div class="batch-header">
        <div>
          <p class="section-kicker">Private batch converter</p>
          <h2>Convert multiple videos to audio.</h2>
          <p class="batch-subtitle">MP4, MOV, MKV, AVI, WebM and M4V. Processed one by one in your browser.</p>
        </div>
        <span class="private-badge">No uploads</span>
      </div>

      <section class="batch-settings" aria-label="Conversion settings">
        <div class="batch-field">
          <label for="batch-format">Output format</label>
          <select id="batch-format">
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="m4a">M4A</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG</option>
            <option value="flac">FLAC</option>
          </select>
        </div>

        <div class="batch-field">
          <label for="batch-sample-rate">Sample rate</label>
          <select id="batch-sample-rate">
            <option value="22050">22.05 kHz</option>
            <option value="44100" selected>44.1 kHz</option>
            <option value="48000">48 kHz</option>
          </select>
        </div>

        <div class="batch-field">
          <label for="batch-channels">Channels</label>
          <select id="batch-channels">
            <option value="2" selected>Stereo</option>
            <option value="1">Mono</option>
          </select>
        </div>

        <div class="batch-field rate-mode-field">
          <label>Bitrate mode</label>
          <div class="batch-segmented" role="group" aria-label="Bitrate mode">
            <button class="rate-mode active" type="button" data-mode="cbr">CBR</button>
            <button class="rate-mode" type="button" data-mode="vbr">VBR</button>
          </div>
        </div>

        <div class="batch-field bitrate-field batch-wide">
          <div class="bitrate-label-row">
            <label for="batch-bitrate">Bitrate</label>
            <strong id="bitrate-value">192 kbps</strong>
          </div>
          <input id="batch-bitrate" type="range" min="64" max="320" step="32" value="192">
          <div class="range-labels"><span>64</span><span>128</span><span>192</span><span>256</span><span>320 kbps</span></div>
        </div>

        <div class="batch-estimate batch-wide">
          <div>
            <span>Estimated total output</span>
            <strong id="batch-estimate-value">—</strong>
          </div>
          <small id="batch-estimate-note">Add files to calculate an estimate.</small>
        </div>
      </section>

      <section id="batch-dropzone" class="batch-dropzone" tabindex="0" role="button" aria-label="Choose video files">
        <div class="batch-drop-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>
        </div>
        <h3>Drop video files here</h3>
        <p>or select up to ${MAX_FILES} files</p>
        <button id="batch-add-files" class="button button-primary" type="button">Choose videos</button>
        <small>MP4 · MOV · MKV · AVI · WebM · M4V · Maximum 500 MB each</small>
        <input id="batch-file-input" class="hidden" type="file" multiple accept=".mp4,.mov,.mkv,.avi,.webm,.m4v,video/*">
      </section>

      <section class="queue-panel">
        <div class="queue-toolbar">
          <div>
            <p class="section-kicker">Conversion queue</p>
            <h3><span id="queue-count">0</span> files</h3>
          </div>
          <div class="queue-toolbar-actions">
            <button id="clear-finished" class="button button-secondary" type="button">Clear finished</button>
            <button id="convert-all" class="button button-primary" type="button" disabled>Convert all</button>
          </div>
        </div>

        <div id="queue-empty" class="queue-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          <p>Your selected files will appear here.</p>
        </div>

        <div id="queue-list" class="queue-list"></div>

        <div id="queue-progress" class="queue-progress hidden">
          <div class="queue-progress-copy">
            <span id="queue-progress-label">Preparing conversion…</span>
            <strong id="queue-progress-percent">0%</strong>
          </div>
          <div class="queue-progress-track"><span id="queue-progress-bar"></span></div>
          <button id="cancel-batch" class="button button-danger-subtle" type="button">Cancel current file</button>
        </div>
      </section>

      <div id="batch-alert" class="batch-alert hidden" role="alert"></div>
    </div>`;

  const ui = {
    format: document.getElementById('batch-format'),
    sampleRate: document.getElementById('batch-sample-rate'),
    channels: document.getElementById('batch-channels'),
    bitrate: document.getElementById('batch-bitrate'),
    bitrateValue: document.getElementById('bitrate-value'),
    bitrateField: card.querySelector('.bitrate-field'),
    rateModeField: card.querySelector('.rate-mode-field'),
    rateButtons: [...card.querySelectorAll('.rate-mode')],
    estimateValue: document.getElementById('batch-estimate-value'),
    estimateNote: document.getElementById('batch-estimate-note'),
    dropzone: document.getElementById('batch-dropzone'),
    addFiles: document.getElementById('batch-add-files'),
    input: document.getElementById('batch-file-input'),
    queueList: document.getElementById('queue-list'),
    queueEmpty: document.getElementById('queue-empty'),
    queueCount: document.getElementById('queue-count'),
    convertAll: document.getElementById('convert-all'),
    clearFinished: document.getElementById('clear-finished'),
    progress: document.getElementById('queue-progress'),
    progressLabel: document.getElementById('queue-progress-label'),
    progressPercent: document.getElementById('queue-progress-percent'),
    progressBar: document.getElementById('queue-progress-bar'),
    cancel: document.getElementById('cancel-batch'),
    alert: document.getElementById('batch-alert')
  };

  const settings = {
    format: 'mp3',
    sampleRate: 44100,
    channels: 2,
    bitrate: 192,
    rateMode: 'cbr'
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** index);
    return `${value.toFixed(index === 0 || value >= 100 ? 0 : 1)} ${units[index]}`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return 'Duration unavailable';
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function baseName(fileName) {
    return String(fileName)
      .replace(/\.[^.]+$/, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .trim()
      .slice(0, 120) || 'converted-audio';
  }

  function fileExtension(fileName) {
    return String(fileName).split('.').pop().toLowerCase();
  }

  function showAlert(message) {
    ui.alert.textContent = message;
    ui.alert.classList.remove('hidden');
  }

  function hideAlert() {
    ui.alert.classList.add('hidden');
    ui.alert.textContent = '';
  }

  function readDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const media = document.createElement('video');
      const timer = setTimeout(() => finish(0), 7000);
      let finished = false;

      function finish(duration) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        media.removeAttribute('src');
        media.load();
        resolve(Number.isFinite(duration) ? duration : 0);
      }

      media.preload = 'metadata';
      media.src = url;
      media.onloadedmetadata = () => finish(media.duration);
      media.onerror = () => finish(0);
    });
  }

  function estimateItemBytes(item) {
    if (!item.duration) return null;
    const seconds = item.duration;
    const channels = settings.channels;
    const sampleRate = settings.sampleRate;

    if (settings.format === 'wav') {
      return seconds * sampleRate * channels * 2;
    }
    if (settings.format === 'flac') {
      return seconds * sampleRate * channels * 2 * 0.55;
    }

    const modeFactor = settings.rateMode === 'vbr' ? 0.84 : 1;
    return seconds * settings.bitrate * 1000 / 8 * modeFactor;
  }

  function updateEstimate() {
    const estimates = queue.map(estimateItemBytes).filter(Number.isFinite);
    if (!queue.length) {
      ui.estimateValue.textContent = '—';
      ui.estimateNote.textContent = 'Add files to calculate an estimate.';
      return;
    }
    if (!estimates.length) {
      ui.estimateValue.textContent = 'After conversion';
      ui.estimateNote.textContent = 'Some video containers do not reveal duration to the browser.';
      return;
    }
    const total = estimates.reduce((sum, value) => sum + value, 0);
    ui.estimateValue.textContent = `≈ ${formatBytes(total)}`;
    ui.estimateNote.textContent = estimates.length === queue.length
      ? 'Estimate based on duration and selected audio settings.'
      : `Estimated for ${estimates.length} of ${queue.length} files with readable duration.`;
  }

  function statusLabel(item) {
    if (item.status === 'pending') return 'Ready';
    if (item.status === 'loading') return 'Loading engine';
    if (item.status === 'converting') return `Converting ${Math.round(item.progress)}%`;
    if (item.status === 'done') return 'Complete';
    if (item.status === 'error') return 'Failed';
    if (item.status === 'cancelled') return 'Cancelled';
    return item.status;
  }

  function renderQueue() {
    ui.queueCount.textContent = String(queue.length);
    ui.queueEmpty.classList.toggle('hidden', queue.length > 0);
    ui.convertAll.disabled = processing || !queue.some((item) => ['pending', 'error', 'cancelled'].includes(item.status));
    ui.clearFinished.disabled = processing || !queue.some((item) => ['done', 'error', 'cancelled'].includes(item.status));

    ui.queueList.innerHTML = queue.map((item, index) => {
      const estimate = estimateItemBytes(item);
      const resultInfo = item.status === 'done'
        ? `${FORMAT_CONFIG[item.outputFormat].label} · ${formatBytes(item.outputSize)}`
        : estimate
          ? `Estimated ${formatBytes(estimate)}`
          : formatDuration(item.duration);

      const action = item.status === 'done'
        ? `<a class="queue-action download" href="${item.outputUrl}" download="${escapeHtml(item.outputName)}">Download</a>`
        : `<button class="queue-action remove" type="button" data-remove="${item.id}" ${processing ? 'disabled' : ''}>Remove</button>`;

      return `
        <article class="queue-item status-${item.status}">
          <div class="queue-number">${index + 1}</div>
          <div class="queue-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m10 13 5 3-5 3Z"/></svg>
          </div>
          <div class="queue-file-copy">
            <strong title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong>
            <span>${formatBytes(item.file.size)} · ${resultInfo}</span>
            <div class="item-progress"><span style="width:${Math.max(0, Math.min(100, item.progress))}%"></span></div>
            ${item.error ? `<small class="queue-error">${escapeHtml(item.error)}</small>` : ''}
          </div>
          <div class="queue-status"><span>${statusLabel(item)}</span>${action}</div>
        </article>`;
    }).join('');

    card.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => removeItem(button.dataset.remove));
    });
    updateEstimate();
  }

  async function addFiles(fileList) {
    hideAlert();
    const incoming = [...fileList];
    if (!incoming.length) return;
    const availableSlots = Math.max(0, MAX_FILES - queue.length);
    if (!availableSlots) {
      showAlert(`The queue supports up to ${MAX_FILES} files.`);
      return;
    }

    for (const file of incoming.slice(0, availableSlots)) {
      const extension = fileExtension(file.name);
      if (!INPUT_EXTENSIONS.includes(extension)) {
        showAlert(`${file.name} is not a supported video format.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        showAlert(`${file.name} is larger than 500 MB.`);
        continue;
      }
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        duration: 0,
        status: 'pending',
        progress: 0,
        outputUrl: null,
        outputName: '',
        outputSize: 0,
        outputFormat: settings.format,
        error: ''
      };
      queue.push(item);
      renderQueue();
      item.duration = await readDuration(file);
      renderQueue();
    }

    if (incoming.length > availableSlots) {
      showAlert(`Only the first ${availableSlots} files were added. Maximum queue size is ${MAX_FILES}.`);
    }
  }

  function removeItem(id) {
    const index = queue.findIndex((item) => item.id === id);
    if (index === -1) return;
    if (queue[index].outputUrl) URL.revokeObjectURL(queue[index].outputUrl);
    queue.splice(index, 1);
    renderQueue();
  }

  function updateFormatControls() {
    const config = FORMAT_CONFIG[settings.format];
    const disabled = config.lossless;
    ui.bitrate.disabled = disabled;
    ui.rateButtons.forEach((button) => { button.disabled = disabled; });
    ui.bitrateField.classList.toggle('setting-disabled', disabled);
    ui.rateModeField.classList.toggle('setting-disabled', disabled);
    ui.bitrateValue.textContent = disabled ? 'Lossless' : `${settings.bitrate} kbps`;
    updateEstimate();
  }

  function outputArgs(outputFile) {
    const args = ['-vn', '-map', '0:a:0', '-ar', String(settings.sampleRate), '-ac', String(settings.channels)];
    const bitrate = `${settings.bitrate}k`;

    switch (settings.format) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame');
        args.push(settings.rateMode === 'cbr' ? '-b:a' : '-q:a', settings.rateMode === 'cbr' ? bitrate : vbrQuality('mp3'));
        args.push('-id3v2_version', '3');
        break;
      case 'wav':
        args.push('-c:a', 'pcm_s16le');
        break;
      case 'm4a':
        args.push('-c:a', 'aac');
        args.push(settings.rateMode === 'cbr' ? '-b:a' : '-q:a', settings.rateMode === 'cbr' ? bitrate : vbrQuality('aac'));
        break;
      case 'aac':
        args.push('-c:a', 'aac', '-f', 'adts');
        args.push(settings.rateMode === 'cbr' ? '-b:a' : '-q:a', settings.rateMode === 'cbr' ? bitrate : vbrQuality('aac'));
        break;
      case 'ogg':
        args.push('-c:a', 'libvorbis');
        args.push(settings.rateMode === 'cbr' ? '-b:a' : '-q:a', settings.rateMode === 'cbr' ? bitrate : vbrQuality('ogg'));
        break;
      case 'flac':
        args.push('-c:a', 'flac', '-compression_level', '5');
        break;
      default:
        throw new Error('Unsupported output format.');
    }

    args.push(outputFile);
    return args;
  }

  function vbrQuality(format) {
    const ratio = (settings.bitrate - 64) / (320 - 64);
    if (format === 'mp3') return String(Math.round(9 - ratio * 9));
    if (format === 'ogg') return String(Math.round(2 + ratio * 8));
    return String((1 + ratio * 4).toFixed(1));
  }

  function updateOverallProgress(currentItem, currentIndex) {
    const total = queue.length || 1;
    const completed = queue.filter((item) => item.status === 'done').length;
    const currentFraction = currentItem ? currentItem.progress / 100 : 0;
    const overall = Math.min(100, Math.round(((completed + currentFraction) / total) * 100));
    ui.progressPercent.textContent = `${overall}%`;
    ui.progressBar.style.width = `${overall}%`;
    ui.progressLabel.textContent = currentItem
      ? `File ${currentIndex + 1} of ${total}: ${currentItem.file.name}`
      : 'Preparing conversion…';
  }

  async function getEngine() {
    if (ffmpeg?.loaded) return ffmpeg;
    if (enginePromise) return enginePromise;

    enginePromise = (async () => {
      const instance = new window.FFmpegWASM.FFmpeg();
      instance.on('progress', ({ progress }) => {
        const item = queue.find((entry) => entry.id === activeItemId);
        if (!item || !Number.isFinite(progress)) return;
        item.progress = Math.max(2, Math.min(96, progress * 96));
        const index = queue.findIndex((entry) => entry.id === item.id);
        updateOverallProgress(item, index);
        renderQueue();
      });
      await instance.load({
        classWorkerURL: CLASS_WORKER_URL,
        coreURL: `${ENGINE_BASE}ffmpeg-core.js`,
        wasmURL: `${ENGINE_BASE}ffmpeg-core.wasm`
      });
      ffmpeg = instance;
      return instance;
    })();

    try {
      return await enginePromise;
    } finally {
      enginePromise = null;
    }
  }

  async function safeDelete(path) {
    if (!ffmpeg || !path) return;
    try { await ffmpeg.deleteFile(path); } catch { /* File may not exist. */ }
  }

  async function convertItem(item, index) {
    item.status = 'loading';
    item.progress = 1;
    item.error = '';
    activeItemId = item.id;
    renderQueue();
    updateOverallProgress(item, index);

    const engine = await getEngine();
    if (cancelRequested) throw new Error('cancelled');

    const inputExtension = fileExtension(item.file.name);
    const outputConfig = FORMAT_CONFIG[settings.format];
    const inputPath = `input-${item.id}.${inputExtension}`;
    const outputPath = `output-${item.id}.${outputConfig.extension}`;

    try {
      item.status = 'converting';
      item.outputFormat = settings.format;
      item.progress = 3;
      renderQueue();

      await engine.writeFile(inputPath, new Uint8Array(await item.file.arrayBuffer()));
      if (cancelRequested) throw new Error('cancelled');

      const exitCode = await engine.exec(['-i', inputPath, ...outputArgs(outputPath)]);
      if (cancelRequested) throw new Error('cancelled');
      if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}.`);

      const data = await engine.readFile(outputPath);
      if (!(data instanceof Uint8Array) || !data.byteLength) throw new Error('The output file is empty.');

      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      const blob = new Blob([data.buffer], { type: outputConfig.mime });
      item.outputUrl = URL.createObjectURL(blob);
      item.outputSize = blob.size;
      item.outputName = `${baseName(item.file.name)}.${outputConfig.extension}`;
      item.status = 'done';
      item.progress = 100;
      item.error = '';
    } finally {
      await safeDelete(inputPath);
      await safeDelete(outputPath);
      activeItemId = null;
      renderQueue();
      updateOverallProgress(item, index);
    }
  }

  async function convertAll() {
    if (processing || !queue.length) return;
    hideAlert();
    processing = true;
    cancelRequested = false;
    ui.progress.classList.remove('hidden');
    ui.convertAll.disabled = true;
    renderQueue();

    const targets = queue.filter((item) => ['pending', 'error', 'cancelled'].includes(item.status));
    for (const item of targets) {
      if (cancelRequested) break;
      const index = queue.findIndex((entry) => entry.id === item.id);
      try {
        await convertItem(item, index);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        if (detail.toLowerCase().includes('cancel')) {
          item.status = 'cancelled';
          item.error = 'Conversion cancelled.';
          item.progress = 0;
          break;
        }
        item.status = 'error';
        item.error = detail || 'Conversion failed.';
        item.progress = 0;
        renderQueue();
      }
    }

    processing = false;
    activeItemId = null;
    ui.progress.classList.add('hidden');
    renderQueue();
  }

  function cancelCurrent() {
    if (!processing) return;
    cancelRequested = true;
    if (ffmpeg) {
      try { ffmpeg.terminate(); } catch { /* Ignore termination errors. */ }
    }
    ffmpeg = null;
    enginePromise = null;
  }

  function clearFinished() {
    if (processing) return;
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (['done', 'error', 'cancelled'].includes(queue[index].status)) {
        if (queue[index].outputUrl) URL.revokeObjectURL(queue[index].outputUrl);
        queue.splice(index, 1);
      }
    }
    renderQueue();
  }

  ui.addFiles.addEventListener('click', (event) => {
    event.stopPropagation();
    ui.input.click();
  });
  ui.dropzone.addEventListener('click', () => ui.input.click());
  ui.dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      ui.input.click();
    }
  });
  ui.input.addEventListener('change', async () => {
    await addFiles(ui.input.files);
    ui.input.value = '';
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    ui.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      ui.dropzone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    ui.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      ui.dropzone.classList.remove('dragging');
    });
  });
  ui.dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

  ui.format.addEventListener('change', () => {
    settings.format = ui.format.value;
    updateFormatControls();
    renderQueue();
  });
  ui.sampleRate.addEventListener('change', () => {
    settings.sampleRate = Number(ui.sampleRate.value);
    updateEstimate();
  });
  ui.channels.addEventListener('change', () => {
    settings.channels = Number(ui.channels.value);
    updateEstimate();
  });
  ui.bitrate.addEventListener('input', () => {
    settings.bitrate = Number(ui.bitrate.value);
    ui.bitrateValue.textContent = `${settings.bitrate} kbps`;
    updateEstimate();
  });
  ui.rateButtons.forEach((button) => {
    button.addEventListener('click', () => {
      settings.rateMode = button.dataset.mode;
      ui.rateButtons.forEach((option) => option.classList.toggle('active', option === button));
      updateEstimate();
    });
  });
  ui.convertAll.addEventListener('click', convertAll);
  ui.cancel.addEventListener('click', cancelCurrent);
  ui.clearFinished.addEventListener('click', clearFinished);

  const heroInput = document.getElementById('hero-file-input');
  if (heroInput) {
    heroInput.multiple = true;
    heroInput.accept = '.mp4,.mov,.mkv,.avi,.webm,.m4v,video/*';
    heroInput.addEventListener('change', async () => {
      await addFiles(heroInput.files);
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      heroInput.value = '';
    });
  }

  window.addEventListener('beforeunload', () => {
    queue.forEach((item) => { if (item.outputUrl) URL.revokeObjectURL(item.outputUrl); });
    if (ffmpeg) {
      try { ffmpeg.terminate(); } catch { /* Ignore unload errors. */ }
    }
  });

  updateFormatControls();
  renderQueue();
})();
