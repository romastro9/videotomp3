/* VideoToMP3 v3 — reliable same-origin FFmpeg WebAssembly conversion.
   Media stays in browser memory and is never uploaded. */

(() => {
  'use strict';

  const originalButton = document.getElementById('convert-button');
  if (!originalButton || typeof elements === 'undefined' || typeof state === 'undefined') return;

  const replacementButton = originalButton.cloneNode(true);
  originalButton.replaceWith(replacementButton);
  elements.convertButton = replacementButton;
  elements.convertButtonLabel = replacementButton.querySelector('#convert-button-label');

  let ffmpegInstance = null;
  let loadPromise = null;
  let activeInput = null;
  let activeOutput = null;

  const ENGINE_BASE = new URL('vendor/ffmpeg-core/', document.baseURI).href;
  const CLASS_WORKER_URL = new URL('vendor/ffmpeg/__CLASS_WORKER__', document.baseURI).href;

  function reportError(prefix, error) {
    const detail = error instanceof Error ? error.message : String(error || 'Unknown error');
    console.error(prefix, error);
    return detail;
  }

  function updateProgress({ progress }) {
    if (!state.converting || !Number.isFinite(progress)) return;
    const percentage = 8 + Math.round(Math.max(0, Math.min(1, progress)) * 86);
    setProgress(Math.min(94, percentage), message('converting'), message('extracting'));
  }

  async function getFfmpeg() {
    if (ffmpegInstance?.loaded) return ffmpegInstance;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      if (!window.FFmpegWASM || typeof window.FFmpegWASM.FFmpeg !== 'function') {
        throw new Error('FFmpeg application script did not load.');
      }

      const instance = new window.FFmpegWASM.FFmpeg();
      instance.on('progress', updateProgress);
      instance.on('log', ({ message: logMessage }) => {
        if (logMessage) console.debug('[ffmpeg]', logMessage);
      });

      await instance.load({
        classWorkerURL: CLASS_WORKER_URL,
        coreURL: `${ENGINE_BASE}ffmpeg-core.js`,
        wasmURL: `${ENGINE_BASE}ffmpeg-core.wasm`
      });

      ffmpegInstance = instance;
      state.ffmpeg = instance;
      state.ffmpegLoaded = true;
      return instance;
    })();

    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  async function safeDelete(ffmpeg, path) {
    if (!ffmpeg || !path) return;
    try {
      await ffmpeg.deleteFile(path);
    } catch {
      // File may not exist after cancellation or a failed command.
    }
  }

  async function convertWithFfmpeg() {
    hideAlert();
    if (state.converting) return;
    if (!state.file) {
      showAlert(message('missingFile'));
      return;
    }

    let trim;
    try {
      trim = validateTrim();
    } catch (error) {
      showAlert(error.message === 'invalid-trim' ? message('invalidTrim') : message('invalidTrimRange'));
      return;
    }

    const outputBase = cleanBaseName(elements.outputName.value || state.file.name);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeInput = `input-${stamp}.mp4`;
    activeOutput = `output-${stamp}.mp3`;

    state.converting = true;
    state.cancelRequested = false;
    clearOutput();
    showStage(elements.progressStage);
    setProgress(2, message('loadingEngine'), message('loadingEngineCopy'));

    let ffmpeg = null;
    try {
      ffmpeg = await getFfmpeg();
      if (state.cancelRequested) throw new Error('cancelled');

      setProgress(6, message('converting'), message('extracting'));
      const inputBytes = new Uint8Array(await state.file.arrayBuffer());
      await ffmpeg.writeFile(activeInput, inputBytes);
      if (state.cancelRequested) throw new Error('cancelled');

      const args = [];
      if (trim.start > 0) args.push('-ss', String(trim.start));
      args.push('-i', activeInput);
      if (trim.duration !== null) args.push('-t', String(trim.duration));
      args.push('-vn', '-map', '0:a:0', '-c:a', 'libmp3lame', '-b:a', `${state.quality}k`);
      if (elements.normalize.checked) {
        args.push('-af', 'loudnorm=I=-16:LRA=11:TP=-1.5');
      }
      args.push('-id3v2_version', '3', activeOutput);

      const exitCode = await ffmpeg.exec(args);
      if (state.cancelRequested) throw new Error('cancelled');
      if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}.`);

      setProgress(97, message('preparing'), message('cleaning'));
      const outputBytes = await ffmpeg.readFile(activeOutput);
      if (!(outputBytes instanceof Uint8Array) || outputBytes.byteLength === 0) {
        throw new Error('The generated MP3 file is empty.');
      }

      const blob = new Blob([outputBytes.buffer], { type: 'audio/mpeg' });
      state.outputUrl = URL.createObjectURL(blob);
      elements.outputFileName.textContent = `${outputBase}.mp3`;
      elements.outputDetails.textContent = `${state.quality} kbps • ${formatBytes(blob.size)}`;
      elements.audioPlayer.src = state.outputUrl;
      elements.downloadButton.href = state.outputUrl;
      elements.downloadButton.download = `${outputBase}.mp3`;

      await safeDelete(ffmpeg, activeInput);
      await safeDelete(ffmpeg, activeOutput);
      activeInput = null;
      activeOutput = null;

      setProgress(100);
      showStage(elements.resultStage);
    } catch (error) {
      const detail = reportError('FFmpeg MP3 conversion failed:', error);
      const cancelled = state.cancelRequested || detail.toLowerCase().includes('cancel');

      await safeDelete(ffmpeg, activeInput);
      await safeDelete(ffmpeg, activeOutput);
      activeInput = null;
      activeOutput = null;

      showStage(state.file ? elements.fileStage : elements.uploadStage);
      if (cancelled) {
        showAlert(message('cancelled'));
      } else if (detail.includes('script did not load') || detail.includes('Worker') || detail.includes('fetch')) {
        showAlert(`${message('engineError')} (${detail})`);
      } else {
        showAlert(`${message('conversionError')} (${detail})`);
      }
    } finally {
      state.converting = false;
      state.cancelRequested = false;
    }
  }

  function cancelFfmpegConversion() {
    if (!state.converting) return;
    state.cancelRequested = true;

    if (ffmpegInstance) {
      try {
        ffmpegInstance.terminate();
      } catch {
        // Ignore termination errors.
      }
    }

    ffmpegInstance = null;
    loadPromise = null;
    state.ffmpeg = null;
    state.ffmpegLoaded = false;
  }

  replacementButton.addEventListener('click', convertWithFfmpeg);

  if (elements.cancelButton) {
    const newCancelButton = elements.cancelButton.cloneNode(true);
    elements.cancelButton.replaceWith(newCancelButton);
    elements.cancelButton = newCancelButton;
    newCancelButton.addEventListener('click', cancelFfmpegConversion);
  }
})();
