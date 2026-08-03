/* Reliable browser-side MP4 audio extraction and MP3 encoding fallback.
   Uses Web Audio for decoding and lamejs for MP3 encoding. No upload or storage. */

(() => {
  'use strict';

  const originalButton = document.getElementById('convert-button');
  if (!originalButton || typeof elements === 'undefined' || typeof state === 'undefined') return;

  const replacementButton = originalButton.cloneNode(true);
  originalButton.replaceWith(replacementButton);
  elements.convertButton = replacementButton;
  elements.convertButtonLabel = replacementButton.querySelector('#convert-button-label');

  function floatChunkToInt16(channel, start, end, scale) {
    const output = new Int16Array(end - start);
    for (let sourceIndex = start, targetIndex = 0; sourceIndex < end; sourceIndex += 1, targetIndex += 1) {
      const value = Math.max(-1, Math.min(1, channel[sourceIndex] * scale));
      output[targetIndex] = value < 0 ? Math.round(value * 32768) : Math.round(value * 32767);
    }
    return output;
  }

  function findPeak(left, right, start, end) {
    let peak = 0;
    for (let index = start; index < end; index += 1) {
      const leftValue = Math.abs(left[index] || 0);
      const rightValue = Math.abs(right[index] || 0);
      if (leftValue > peak) peak = leftValue;
      if (rightValue > peak) peak = rightValue;
    }
    return peak;
  }

  async function convertWithBrowserEncoder() {
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

    if (!window.lamejs || typeof window.lamejs.Mp3Encoder !== 'function') {
      showAlert(message('engineError'));
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showAlert(message('engineError'));
      return;
    }

    const outputBase = cleanBaseName(elements.outputName.value || state.file.name);
    let audioContext = null;

    state.converting = true;
    state.cancelRequested = false;
    clearOutput();
    showStage(elements.progressStage);
    setProgress(2, message('loadingEngine'), message('loadingEngineCopy'));

    try {
      audioContext = new AudioContextClass();
      const inputBytes = await state.file.arrayBuffer();
      if (state.cancelRequested) throw new Error('cancelled');

      setProgress(12, message('converting'), message('extracting'));
      const audioBuffer = await audioContext.decodeAudioData(inputBytes.slice(0));
      if (state.cancelRequested) throw new Error('cancelled');
      if (!audioBuffer.numberOfChannels || !audioBuffer.length) throw new Error('no-audio');

      const sampleRate = audioBuffer.sampleRate;
      const channelCount = Math.min(2, audioBuffer.numberOfChannels);
      const left = audioBuffer.getChannelData(0);
      const right = channelCount === 2 ? audioBuffer.getChannelData(1) : left;

      const startSample = Math.max(0, Math.floor(trim.start * sampleRate));
      const requestedEnd = trim.duration === null
        ? audioBuffer.length
        : Math.floor((trim.start + trim.duration) * sampleRate);
      const endSample = Math.min(audioBuffer.length, requestedEnd);
      if (endSample <= startSample) throw new Error('invalid-range');

      let scale = 1;
      if (elements.normalize.checked) {
        setProgress(18, message('converting'), message('extracting'));
        const peak = findPeak(left, right, startSample, endSample);
        if (peak > 0) scale = Math.min(8, 0.95 / peak);
      }

      const encoder = new window.lamejs.Mp3Encoder(channelCount, sampleRate, state.quality);
      const mp3Parts = [];
      const blockSize = 1152;
      const totalSamples = endSample - startSample;

      for (let offset = 0; offset < totalSamples; offset += blockSize) {
        if (state.cancelRequested) throw new Error('cancelled');

        const chunkStart = startSample + offset;
        const chunkEnd = Math.min(chunkStart + blockSize, endSample);
        const leftChunk = floatChunkToInt16(left, chunkStart, chunkEnd, scale);
        const rightChunk = channelCount === 2
          ? floatChunkToInt16(right, chunkStart, chunkEnd, scale)
          : null;

        const encoded = channelCount === 2
          ? encoder.encodeBuffer(leftChunk, rightChunk)
          : encoder.encodeBuffer(leftChunk);

        if (encoded.length) mp3Parts.push(new Uint8Array(encoded));

        if (offset % (blockSize * 24) === 0) {
          const progress = 20 + Math.round((offset / totalSamples) * 73);
          setProgress(Math.min(93, progress), message('converting'), message('extracting'));
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      const finalBytes = encoder.flush();
      if (finalBytes.length) mp3Parts.push(new Uint8Array(finalBytes));
      if (state.cancelRequested) throw new Error('cancelled');

      setProgress(97, message('preparing'), message('cleaning'));
      const blob = new Blob(mp3Parts, { type: 'audio/mpeg' });
      if (!blob.size) throw new Error('empty-output');

      state.outputUrl = URL.createObjectURL(blob);
      elements.outputFileName.textContent = `${outputBase}.mp3`;
      elements.outputDetails.textContent = `${state.quality} kbps • ${formatBytes(blob.size)}`;
      elements.audioPlayer.src = state.outputUrl;
      elements.downloadButton.href = state.outputUrl;
      elements.downloadButton.download = `${outputBase}.mp3`;

      setProgress(100);
      showStage(elements.resultStage);
    } catch (error) {
      const cancelled = state.cancelRequested || error.message === 'cancelled';
      showStage(state.file ? elements.fileStage : elements.uploadStage);
      showAlert(cancelled ? message('cancelled') : message('conversionError'));
      console.error('Browser MP3 conversion failed:', error);
    } finally {
      if (audioContext && typeof audioContext.close === 'function') {
        try { await audioContext.close(); } catch { /* Ignore close errors. */ }
      }
      state.converting = false;
      state.cancelRequested = false;
    }
  }

  replacementButton.addEventListener('click', convertWithBrowserEncoder);
})();
