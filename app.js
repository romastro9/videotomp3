/* VideoToMP3 — browser-only conversion. No uploads, cookies, analytics, or persistent storage. */

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const LARGE_FILE_SIZE = 250 * 1024 * 1024;
const CORE_PATH = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js";
const CIRCLE_LENGTH = 351.86;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const elements = {
  fileInput: $("#file-input"),
  heroFileInput: $("#hero-file-input"),
  dropZone: $("#drop-zone"),
  chooseButton: $("#choose-button"),
  uploadStage: $("#upload-stage"),
  fileStage: $("#file-stage"),
  progressStage: $("#progress-stage"),
  resultStage: $("#result-stage"),
  videoPreview: $("#video-preview"),
  fileName: $("#file-name"),
  fileDetails: $("#file-details"),
  outputName: $("#output-name"),
  removeFile: $("#remove-file"),
  qualityOptions: $$(".quality-option"),
  normalize: $("#normalize"),
  trimEnabled: $("#trim-enabled"),
  trimPanel: $("#trim-panel"),
  trimStart: $("#trim-start"),
  trimEnd: $("#trim-end"),
  convertButton: $("#convert-button"),
  convertButtonLabel: $("#convert-button-label"),
  progressValue: $("#progress-value"),
  progressNumber: $("#progress-number"),
  progressTitle: $("#progress-title"),
  progressDescription: $("#progress-description"),
  cancelButton: $("#cancel-button"),
  outputFileName: $("#output-file-name"),
  outputDetails: $("#output-details"),
  audioPlayer: $("#audio-player"),
  downloadButton: $("#download-button"),
  convertAnother: $("#convert-another"),
  alert: $("#alert"),
  alertText: $("#alert-text"),
  alertClose: $("#alert-close"),
  themeButton: $("#theme-button"),
  languageButton: $("#language-button"),
  mobileMenuButton: $("#mobile-menu-button"),
  mobileNav: $("#mobile-nav"),
  year: $("#year")
};

const state = {
  file: null,
  fileUrl: null,
  outputUrl: null,
  duration: 0,
  quality: 192,
  language: "en",
  ffmpeg: null,
  ffmpegLoaded: false,
  converting: false,
  cancelRequested: false
};

const translations = {
  en: {
    navConverter: "Converter",
    navFeatures: "Features",
    navPrivacy: "Privacy",
    navFaq: "FAQ",
    heroEyebrow: "Private audio conversion",
    heroTitle1: "Convert MP4 to MP3.",
    heroTitle2: "Simple. Fast. Private.",
    heroCopy: "Extract high-quality audio directly on your device. No upload, no account, and no stored media.",
    chooseMp4: "Choose MP4 file",
    learnMore: "Learn more",
    trustBrowser: "Runs in your browser",
    trustNoUpload: "No video upload",
    trustNoAccount: "No account required",
    converterKicker: "MP4 → MP3",
    converterTitle: "Turn video into audio.",
    privateBadge: "Private processing",
    dropTitle: "Drop your MP4 video here",
    dropCopy: "or choose a file from your device",
    chooseFile: "Choose MP4 file",
    maxSize: "MP4 only • Maximum 500 MB",
    removeFile: "Remove selected file",
    audioQuality: "Audio quality",
    qualitySmall: "Small",
    qualityRecommended: "Recommended",
    qualityHigh: "High",
    qualityBest: "Best",
    outputFileName: "Output file name",
    normalizeTitle: "Normalize volume",
    normalizeCopy: "Balance quiet and loud audio",
    trimAudio: "Trim audio",
    start: "Start",
    end: "End",
    convert: "Convert to MP3",
    loadingEngine: "Loading conversion engine",
    loadingEngineCopy: "The first conversion downloads the private browser engine. Your video is not uploaded.",
    converting: "Converting your video",
    extracting: "Extracting and encoding high-quality MP3 audio…",
    cancel: "Cancel conversion",
    ready: "Your MP3 is ready",
    readyCopy: "Preview your audio, then download it directly to your device.",
    download: "Download MP3",
    convertAnother: "Convert another file",
    resultPrivacy: "The temporary media was processed only in browser memory.",
    featureKicker: "Made for privacy",
    featureTitle: "Everything you need. Nothing you don’t.",
    featureCopy: "A focused converter with a premium interface and no server-side media storage.",
    privateTitle: "Private by design",
    privateCopy: "Your video stays on your device and is processed inside this browser tab.",
    qualityTitle: "High-quality audio",
    qualityCopy: "Export MP3 at 128, 192, 256, or 320 kbps with optional loudness normalization.",
    fastTitle: "Simple workflow",
    fastCopy: "Upload, choose your settings, convert, preview, and download in one clean experience.",
    howKicker: "How it works",
    howTitle: "Three steps. That’s it.",
    stepUpload: "Upload",
    stepUploadCopy: "Choose or drag an MP4 video from your device.",
    stepConvert: "Convert",
    stepConvertCopy: "Select quality, rename, trim, and normalize if needed.",
    stepDownload: "Download",
    stepDownloadCopy: "Preview the finished MP3 and save it immediately.",
    privacyKicker: "No stored data",
    privacyTitle: "Your files stay yours.",
    privacyCopy: "This static website has no database, user accounts, analytics, cookies, upload API, or conversion history.",
    privacyPoint1: "No media uploaded to a server",
    privacyPoint2: "No account or personal profile",
    privacyPoint3: "No cookies or analytics",
    privacyPoint4: "Temporary memory cleared when reset",
    faqKicker: "FAQ",
    faqTitle: "Good to know.",
    faq1q: "Are my files uploaded?",
    faq1a: "No. FFmpeg WebAssembly processes the selected MP4 inside your browser. The media file is not sent to this website’s server.",
    faq2q: "Is any data stored?",
    faq2a: "No media, names, settings, history, or personal information are stored. Refreshing or closing the tab clears the session.",
    faq3q: "Which quality should I choose?",
    faq3a: "192 kbps is recommended for most audio. Choose 320 kbps when quality matters most, or 128 kbps for a smaller file.",
    faq4q: "Why can large files be slow?",
    faq4a: "Conversion uses your device’s memory and processor. Large videos generally work faster on a desktop computer with enough free memory.",
    ctaTitle: "Ready to extract your audio?",
    ctaCopy: "Choose an MP4 and create an MP3 without sending the video anywhere.",
    footerPrivacy: "No storage. No tracking. Browser-only conversion.",
    invalidType: "Please choose a valid MP4 video.",
    tooLarge: "This video is larger than 500 MB. Choose a smaller MP4 file.",
    largeWarning: "Large file selected. Conversion may use significant memory and take longer on this device.",
    metadataError: "The browser could not read this video. Please try another MP4 file.",
    missingFile: "Please select an MP4 file first.",
    invalidTrim: "Enter trim times as MM:SS or HH:MM:SS.",
    invalidTrimRange: "The trim end must be after the start and inside the video duration.",
    engineError: "The conversion engine could not load. Check your internet connection and try again.",
    conversionError: "Conversion failed. The video may not contain an audio track or this browser may not have enough memory.",
    cancelled: "Conversion cancelled.",
    preparing: "Preparing download",
    cleaning: "Cleaning temporary memory"
  },
  km: {
    navConverter: "កម្មវិធីបម្លែង",
    navFeatures: "មុខងារ",
    navPrivacy: "ឯកជនភាព",
    navFaq: "សំណួរ",
    heroEyebrow: "បម្លែងសំឡេងដោយឯកជន",
    heroTitle1: "បម្លែង MP4 ទៅ MP3។",
    heroTitle2: "សាមញ្ញ។ លឿន។ ឯកជន។",
    heroCopy: "ទាញសំឡេងគុណភាពខ្ពស់នៅលើឧបករណ៍របស់អ្នក។ មិនអាប់ឡូត មិនបាច់មានគណនី និងមិនរក្សាទុកឯកសារ។",
    chooseMp4: "ជ្រើសរើសឯកសារ MP4",
    learnMore: "ស្វែងយល់បន្ថែម",
    trustBrowser: "ដំណើរការក្នុង Browser",
    trustNoUpload: "មិនអាប់ឡូតវីដេអូ",
    trustNoAccount: "មិនត្រូវការគណនី",
    converterKicker: "MP4 → MP3",
    converterTitle: "បម្លែងវីដេអូទៅជាសំឡេង។",
    privateBadge: "ដំណើរការឯកជន",
    dropTitle: "អូសឯកសារ MP4 ដាក់ទីនេះ",
    dropCopy: "ឬជ្រើសរើសឯកសារពីឧបករណ៍របស់អ្នក",
    chooseFile: "ជ្រើសរើសឯកសារ MP4",
    maxSize: "MP4 ប៉ុណ្ណោះ • អតិបរមា 500 MB",
    removeFile: "លុបឯកសារដែលបានជ្រើស",
    audioQuality: "គុណភាពសំឡេង",
    qualitySmall: "តូច",
    qualityRecommended: "ណែនាំ",
    qualityHigh: "ខ្ពស់",
    qualityBest: "ល្អបំផុត",
    outputFileName: "ឈ្មោះឯកសារ MP3",
    normalizeTitle: "សម្រួលកម្រិតសំឡេង",
    normalizeCopy: "ធ្វើឱ្យសំឡេងស្មើគ្នា",
    trimAudio: "កាត់សំឡេង",
    start: "ចាប់ផ្តើម",
    end: "បញ្ចប់",
    convert: "បម្លែងទៅ MP3",
    loadingEngine: "កំពុងបើកម៉ាស៊ីនបម្លែង",
    loadingEngineCopy: "ការបម្លែងលើកដំបូងត្រូវទាញយកម៉ាស៊ីន Browser។ វីដេអូរបស់អ្នកមិនត្រូវបានអាប់ឡូតទេ។",
    converting: "កំពុងបម្លែងវីដេអូ",
    extracting: "កំពុងទាញ និងបម្លែងសំឡេង MP3 គុណភាពខ្ពស់…",
    cancel: "បោះបង់ការបម្លែង",
    ready: "ឯកសារ MP3 រួចរាល់",
    readyCopy: "ស្តាប់សាកល្បង រួចទាញយកទៅឧបករណ៍របស់អ្នក។",
    download: "ទាញយក MP3",
    convertAnother: "បម្លែងឯកសារផ្សេងទៀត",
    resultPrivacy: "ឯកសារបណ្ដោះអាសន្នត្រូវបានដំណើរការតែក្នុងអង្គចងចាំ Browser។",
    featureKicker: "បង្កើតសម្រាប់ឯកជនភាព",
    featureTitle: "មានតែអ្វីដែលអ្នកត្រូវការ។",
    featureCopy: "កម្មវិធីបម្លែងដែលងាយប្រើ និងមិនរក្សាទុកវីដេអូលើ Server។",
    privateTitle: "ឯកជនតាំងពីដើម",
    privateCopy: "វីដេអូរបស់អ្នកនៅលើឧបករណ៍ និងដំណើរការក្នុងផ្ទាំង Browser នេះ។",
    qualityTitle: "សំឡេងគុណភាពខ្ពស់",
    qualityCopy: "នាំចេញ MP3 128, 192, 256 ឬ 320 kbps និងអាចសម្រួលកម្រិតសំឡេង។",
    fastTitle: "ដំណើរការងាយស្រួល",
    fastCopy: "អាប់ឡូត ជ្រើសរើស បម្លែង ស្តាប់ និងទាញយកនៅក្នុងទីតាំងតែមួយ។",
    howKicker: "របៀបប្រើ",
    howTitle: "ត្រឹមតែបីជំហាន។",
    stepUpload: "អាប់ឡូត",
    stepUploadCopy: "ជ្រើសរើស ឬអូសវីដេអូ MP4 ពីឧបករណ៍។",
    stepConvert: "បម្លែង",
    stepConvertCopy: "ជ្រើសគុណភាព ប្ដូរឈ្មោះ កាត់ និងសម្រួលសំឡេង។",
    stepDownload: "ទាញយក",
    stepDownloadCopy: "ស្តាប់ឯកសារ MP3 រួចទាញយកភ្លាមៗ។",
    privacyKicker: "មិនរក្សាទុកទិន្នន័យ",
    privacyTitle: "ឯកសាររបស់អ្នកនៅតែជារបស់អ្នក។",
    privacyCopy: "វេបសាយនេះមិនមាន Database គណនី Analytics Cookies Upload API ឬប្រវត្តិបម្លែងទេ។",
    privacyPoint1: "មិនអាប់ឡូតឯកសារទៅ Server",
    privacyPoint2: "មិនមានគណនី ឬព័ត៌មានផ្ទាល់ខ្លួន",
    privacyPoint3: "មិនមាន Cookies ឬ Analytics",
    privacyPoint4: "សម្អាតអង្គចងចាំបណ្ដោះអាសន្នពេល Reset",
    faqKicker: "សំណួរញឹកញាប់",
    faqTitle: "ព័ត៌មានគួរដឹង។",
    faq1q: "តើឯកសាររបស់ខ្ញុំត្រូវបានអាប់ឡូតទេ?",
    faq1a: "ទេ។ FFmpeg WebAssembly ដំណើរការ MP4 នៅក្នុង Browser របស់អ្នក។ ឯកសារមិនត្រូវបានផ្ញើទៅ Server ទេ។",
    faq2q: "តើមានរក្សាទុកទិន្នន័យទេ?",
    faq2a: "មិនរក្សាទុកឯកសារ ឈ្មោះ ការកំណត់ ប្រវត្តិ ឬព័ត៌មានផ្ទាល់ខ្លួនទេ។ បិទ ឬ Refresh ផ្ទាំង ដើម្បីសម្អាត Session។",
    faq3q: "តើគួរជ្រើសគុណភាពមួយណា?",
    faq3a: "192 kbps សមស្របសម្រាប់ការប្រើប្រាស់ទូទៅ។ 320 kbps សម្រាប់គុណភាពល្អបំផុត និង 128 kbps សម្រាប់ឯកសារតូច។",
    faq4q: "ហេតុអ្វីឯកសារធំបម្លែងយឺត?",
    faq4a: "ការបម្លែងប្រើអង្គចងចាំ និង CPU របស់ឧបករណ៍។ វីដេអូធំដំណើរការល្អជាងលើកុំព្យូទ័រ។",
    ctaTitle: "ត្រៀមទាញសំឡេងហើយឬនៅ?",
    ctaCopy: "ជ្រើស MP4 និងបង្កើត MP3 ដោយមិនផ្ញើវីដេអូទៅកន្លែងផ្សេង។",
    footerPrivacy: "មិនរក្សាទុក។ មិនតាមដាន។ បម្លែងក្នុង Browser។",
    invalidType: "សូមជ្រើសរើសវីដេអូ MP4 ត្រឹមត្រូវ។",
    tooLarge: "វីដេអូនេះធំជាង 500 MB។ សូមជ្រើសរើសឯកសារតូចជាងនេះ។",
    largeWarning: "បានជ្រើសឯកសារធំ។ ការបម្លែងអាចប្រើអង្គចងចាំច្រើន និងចំណាយពេលយូរ។",
    metadataError: "Browser មិនអាចអានវីដេអូនេះបានទេ។ សូមសាកល្បង MP4 ផ្សេង។",
    missingFile: "សូមជ្រើសរើសឯកសារ MP4 ជាមុន។",
    invalidTrim: "សូមបញ្ចូលពេលវេលាជា MM:SS ឬ HH:MM:SS។",
    invalidTrimRange: "ពេលបញ្ចប់ត្រូវនៅក្រោយពេលចាប់ផ្តើម និងក្នុងរយៈពេលវីដេអូ។",
    engineError: "មិនអាចបើកម៉ាស៊ីនបម្លែងបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយសាកល្បងម្ដងទៀត។",
    conversionError: "ការបម្លែងបរាជ័យ។ វីដេអូអាចគ្មានសំឡេង ឬឧបករណ៍មិនមានអង្គចងចាំគ្រប់គ្រាន់។",
    cancelled: "បានបោះបង់ការបម្លែង។",
    preparing: "កំពុងរៀបចំទាញយក",
    cleaning: "កំពុងសម្អាតអង្គចងចាំបណ្ដោះអាសន្ន"
  }
};

function t(key) {
  return translations[state.language][key] || translations.en[key] || key;
}

function applyTranslations() {
  $$('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (translations[state.language][key]) node.textContent = translations[state.language][key];
  });
  $$('[data-i18n-aria]').forEach((node) => {
    const key = node.dataset.i18nAria;
    if (translations[state.language][key]) node.setAttribute('aria-label', translations[state.language][key]);
  });
  document.documentElement.lang = state.language === 'km' ? 'km' : 'en';
  elements.languageButton.textContent = state.language === 'en' ? 'KH' : 'EN';
  updateConvertButton();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 || value >= 100 ? 0 : 1)} ${units[index]}`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseTime(value) {
  const parts = String(value).trim().split(':').map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 2 && parts[1] < 60) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts[1] < 60 && parts[2] < 60) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function cleanBaseName(name) {
  const withoutExtension = String(name).replace(/\.mp4$/i, '');
  return withoutExtension
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'converted-audio';
}

function showAlert(message) {
  elements.alertText.textContent = message;
  elements.alert.classList.remove('hidden');
}

function hideAlert() {
  elements.alert.classList.add('hidden');
}

function showStage(stage) {
  [elements.uploadStage, elements.fileStage, elements.progressStage, elements.resultStage].forEach((item) => item.classList.add('hidden'));
  stage.classList.remove('hidden');
}

function setProgress(percent, title = t('converting'), description = t('extracting')) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  elements.progressNumber.textContent = `${safe}%`;
  elements.progressValue.style.strokeDashoffset = String(CIRCLE_LENGTH * (1 - safe / 100));
  elements.progressTitle.textContent = title;
  elements.progressDescription.textContent = description;
}

function updateConvertButton() {
  elements.convertButtonLabel.textContent = t('convert');
}

function cleanupObjectUrl(key) {
  if (state[key]) {
    URL.revokeObjectURL(state[key]);
    state[key] = null;
  }
}

function clearOutput() {
  cleanupObjectUrl('outputUrl');
  elements.audioPlayer.pause();
  elements.audioPlayer.removeAttribute('src');
  elements.audioPlayer.load();
  elements.downloadButton.removeAttribute('href');
}

function clearInput() {
  cleanupObjectUrl('fileUrl');
  state.file = null;
  state.duration = 0;
  elements.fileInput.value = '';
  elements.heroFileInput.value = '';
  elements.videoPreview.pause();
  elements.videoPreview.removeAttribute('src');
  elements.videoPreview.load();
}

function resetConverter({ keepAlert = false } = {}) {
  if (state.converting) return;
  clearOutput();
  clearInput();
  if (!keepAlert) hideAlert();
  elements.outputName.value = '';
  elements.trimStart.value = '00:00';
  elements.trimEnd.value = '00:00';
  elements.trimEnabled.checked = false;
  elements.trimPanel.classList.add('disabled');
  elements.normalize.checked = false;
  state.quality = 192;
  elements.qualityOptions.forEach((button) => button.classList.toggle('active', Number(button.dataset.quality) === state.quality));
  showStage(elements.uploadStage);
}

function readVideoMetadata(file, objectUrl) {
  return new Promise((resolve, reject) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.src = objectUrl;
    probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => reject(new Error('metadata'));
  });
}

async function selectFile(file) {
  hideAlert();
  if (!file) return;
  const isMp4 = file.type === 'video/mp4' || /\.mp4$/i.test(file.name);
  if (!isMp4) {
    showAlert(t('invalidType'));
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showAlert(t('tooLarge'));
    return;
  }

  clearOutput();
  clearInput();
  state.file = file;
  state.fileUrl = URL.createObjectURL(file);

  try {
    state.duration = await readVideoMetadata(file, state.fileUrl);
  } catch {
    clearInput();
    showAlert(t('metadataError'));
    return;
  }

  elements.videoPreview.src = state.fileUrl;
  elements.videoPreview.muted = true;
  elements.fileName.textContent = file.name;
  elements.fileDetails.textContent = `${formatBytes(file.size)} • ${formatTime(state.duration)}`;
  elements.outputName.value = cleanBaseName(file.name);
  elements.trimStart.value = '00:00';
  elements.trimEnd.value = formatTime(state.duration);
  showStage(elements.fileStage);

  if (file.size >= LARGE_FILE_SIZE) showAlert(t('largeWarning'));
  elements.fileStage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validateTrim() {
  if (!elements.trimEnabled.checked) return { start: 0, duration: null };
  const start = parseTime(elements.trimStart.value);
  const end = parseTime(elements.trimEnd.value);
  if (start === null || end === null) throw new Error('invalid-trim');
  if (end <= start || start >= state.duration || end > state.duration + 1) throw new Error('invalid-range');
  return { start, duration: end - start };
}

function updateProgressFromRatio({ ratio }) {
  if (!state.converting || !Number.isFinite(ratio)) return;
  const percent = Math.min(96, Math.max(5, ratio * 96));
  setProgress(percent);
}

async function getFFmpeg() {
  if (state.ffmpeg && state.ffmpegLoaded) return state.ffmpeg;
  if (!window.FFmpeg || typeof window.FFmpeg.createFFmpeg !== 'function') throw new Error('engine-script');

  const { createFFmpeg } = window.FFmpeg;
  state.ffmpeg = createFFmpeg({
    log: false,
    corePath: CORE_PATH,
    progress: updateProgressFromRatio
  });

  if (typeof state.ffmpeg.setProgress === 'function') state.ffmpeg.setProgress(updateProgressFromRatio);
  await state.ffmpeg.load();
  state.ffmpegLoaded = true;
  return state.ffmpeg;
}

async function removeVirtualFile(ffmpeg, path) {
  try {
    ffmpeg.FS('unlink', path);
  } catch {
    // File may not exist after a cancelled or failed conversion.
  }
}

async function convertFile() {
  hideAlert();
  if (!state.file || state.converting) {
    if (!state.file) showAlert(t('missingFile'));
    return;
  }

  let trim;
  try {
    trim = validateTrim();
  } catch (error) {
    showAlert(error.message === 'invalid-trim' ? t('invalidTrim') : t('invalidTrimRange'));
    return;
  }

  const outputBase = cleanBaseName(elements.outputName.value || state.file.name);
  const virtualInput = `input-${Date.now()}.mp4`;
  const virtualOutput = `output-${Date.now()}.mp3`;

  state.converting = true;
  state.cancelRequested = false;
  clearOutput();
  showStage(elements.progressStage);
  setProgress(1, t('loadingEngine'), t('loadingEngineCopy'));

  try {
    const ffmpeg = await getFFmpeg();
    if (state.cancelRequested) throw new Error('cancelled');

    const { fetchFile } = window.FFmpeg;
    ffmpeg.FS('writeFile', virtualInput, await fetchFile(state.file));

    const args = [];
    if (trim.start > 0) args.push('-ss', String(trim.start));
    args.push('-i', virtualInput);
    if (trim.duration !== null) args.push('-t', String(trim.duration));
    args.push('-vn', '-map', '0:a:0', '-codec:a', 'libmp3lame', '-b:a', `${state.quality}k`);
    if (elements.normalize.checked) args.push('-af', 'loudnorm=I=-16:LRA=11:TP=-1.5');
    args.push('-id3v2_version', '3', virtualOutput);

    setProgress(5, t('converting'), t('extracting'));
    await ffmpeg.run(...args);
    if (state.cancelRequested) throw new Error('cancelled');

    setProgress(98, t('preparing'), t('cleaning'));
    const data = ffmpeg.FS('readFile', virtualOutput);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    state.outputUrl = URL.createObjectURL(blob);

    elements.outputFileName.textContent = `${outputBase}.mp3`;
    elements.outputDetails.textContent = `${state.quality} kbps • ${formatBytes(blob.size)}`;
    elements.audioPlayer.src = state.outputUrl;
    elements.downloadButton.href = state.outputUrl;
    elements.downloadButton.download = `${outputBase}.mp3`;
    setProgress(100);

    await removeVirtualFile(ffmpeg, virtualInput);
    await removeVirtualFile(ffmpeg, virtualOutput);
    showStage(elements.resultStage);
  } catch (error) {
    const cancelled = state.cancelRequested || error.message === 'cancelled';
    if (state.ffmpeg && state.ffmpegLoaded) {
      await removeVirtualFile(state.ffmpeg, virtualInput);
      await removeVirtualFile(state.ffmpeg, virtualOutput);
    }
    showStage(state.file ? elements.fileStage : elements.uploadStage);
    showAlert(cancelled ? t('cancelled') : (String(error.message).includes('engine') ? t('engineError') : t('conversionError')));
  } finally {
    state.converting = false;
    state.cancelRequested = false;
  }
}

function cancelConversion() {
  if (!state.converting) return;
  state.cancelRequested = true;
  try {
    if (state.ffmpeg && state.ffmpegLoaded && typeof state.ffmpeg.exit === 'function') state.ffmpeg.exit();
  } catch {
    // The worker may already be stopped.
  }
  state.ffmpeg = null;
  state.ffmpegLoaded = false;
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  elements.themeButton.setAttribute('aria-label', isDark ? 'Use dark mode' : 'Use light mode');
}

function toggleLanguage() {
  state.language = state.language === 'en' ? 'km' : 'en';
  applyTranslations();
}

function openFilePicker() {
  elements.fileInput.click();
}

function bindEvents() {
  elements.chooseButton.addEventListener('click', (event) => {
    event.stopPropagation();
    openFilePicker();
  });
  elements.dropZone.addEventListener('click', openFilePicker);
  elements.fileInput.addEventListener('change', () => selectFile(elements.fileInput.files[0]));
  elements.heroFileInput.addEventListener('change', () => selectFile(elements.heroFileInput.files[0]));

  ['dragenter', 'dragover'].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove('dragging');
    });
  });
  elements.dropZone.addEventListener('drop', (event) => selectFile(event.dataTransfer.files[0]));
  elements.dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  });

  elements.qualityOptions.forEach((button) => {
    button.addEventListener('click', () => {
      state.quality = Number(button.dataset.quality);
      elements.qualityOptions.forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  elements.trimEnabled.addEventListener('change', () => {
    elements.trimPanel.classList.toggle('disabled', !elements.trimEnabled.checked);
  });
  elements.removeFile.addEventListener('click', () => resetConverter());
  elements.convertButton.addEventListener('click', convertFile);
  elements.cancelButton.addEventListener('click', cancelConversion);
  elements.convertAnother.addEventListener('click', () => resetConverter());
  elements.alertClose.addEventListener('click', hideAlert);
  elements.themeButton.addEventListener('click', toggleTheme);
  elements.languageButton.addEventListener('click', toggleLanguage);

  elements.mobileMenuButton.addEventListener('click', () => {
    const open = elements.mobileNav.classList.toggle('open');
    elements.mobileMenuButton.setAttribute('aria-expanded', String(open));
  });
  $$("a", elements.mobileNav).forEach((link) => link.addEventListener('click', () => {
    elements.mobileNav.classList.remove('open');
    elements.mobileMenuButton.setAttribute('aria-expanded', 'false');
  }));

  window.addEventListener('beforeunload', () => {
    clearOutput();
    clearInput();
    try {
      if (state.ffmpeg && state.ffmpegLoaded && typeof state.ffmpeg.exit === 'function') state.ffmpeg.exit();
    } catch {
      // Ignore cleanup errors during page unload.
    }
  });
}

function initRevealAnimation() {
  const revealItems = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

function init() {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
  elements.year.textContent = new Date().getFullYear();
  bindEvents();
  applyTranslations();
  initRevealAnimation();
  resetConverter();
}

init();
