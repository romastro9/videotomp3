(() => {
  'use strict';

  if (!window.FFmpeg || typeof window.FFmpeg.createFFmpeg !== 'function') {
    throw new Error('Legacy FFmpeg browser API failed to load.');
  }

  const CORE_PATH = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js';

  class LegacyFFmpegAdapter {
    constructor() {
      this.instance = null;
      this.loaded = false;
      this.listeners = {
        progress: [],
        log: []
      };
    }

    on(event, callback) {
      if (!this.listeners[event] || typeof callback !== 'function') return;
      this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter((item) => item !== callback);
    }

    emit(event, payload) {
      for (const callback of this.listeners[event] || []) {
        try {
          callback(payload);
        } catch {
          // Listener errors must not interrupt conversion.
        }
      }
    }

    async load() {
      if (this.loaded && this.instance) return false;

      this.instance = window.FFmpeg.createFFmpeg({
        corePath: CORE_PATH,
        log: false,
        progress: ({ ratio, time }) => {
          this.emit('progress', {
            progress: Number.isFinite(ratio) ? ratio : 0,
            time: Number.isFinite(time) ? time : 0
          });
        },
        logger: ({ type, message }) => {
          this.emit('log', { type, message });
        }
      });

      try {
        await this.instance.load();
      } catch (error) {
        this.instance = null;
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Unable to load the classic FFmpeg engine: ${detail}`);
      }

      this.loaded = true;
      return true;
    }

    async writeFile(path, data) {
      this.assertLoaded();
      this.instance.FS('writeFile', path, data);
      return true;
    }

    async exec(args) {
      this.assertLoaded();
      await this.instance.run(...args);
      return 0;
    }

    async readFile(path) {
      this.assertLoaded();
      return this.instance.FS('readFile', path);
    }

    async deleteFile(path) {
      this.assertLoaded();
      this.instance.FS('unlink', path);
      return true;
    }

    terminate() {
      if (this.instance) {
        try {
          this.instance.exit();
        } catch {
          // The worker may already be stopped.
        }
      }
      this.instance = null;
      this.loaded = false;
    }

    assertLoaded() {
      if (!this.loaded || !this.instance) {
        throw new Error('FFmpeg engine is not loaded.');
      }
    }
  }

  window.FFmpegWASM = {
    FFmpeg: LegacyFFmpegAdapter
  };
})();
