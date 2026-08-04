/* VideoToMP3 V10 bilingual interface — English / Khmer.
   Uses the URL language parameter only; no persistent storage. */

(() => {
  'use strict';

  const TEXT = new Map([
    ['Private batch audio conversion', 'ការបម្លែងសំឡេងជាបាច់ដោយឯកជន'],
    ['Convert video to audio.', 'បម្លែងវីដេអូទៅជាសំឡេង។'],
    ['Simple. Fast. Private.', 'ងាយស្រួល។ លឿន។ ឯកជន។'],
    ['Batch convert MP4, MOV, MKV, AVI, WebM and M4V directly in your browser. No uploads and no stored files.', 'បម្លែងវីដេអូ MP4, MOV, MKV, AVI, WebM និង M4V ជាបាច់ដោយផ្ទាល់ក្នុងកម្មវិធីរុករក។ មិនផ្ទុកឡើង និងមិនរក្សាទុកឯកសារ។'],
    ['Preparing VideoToMP3 V10…', 'កំពុងរៀបចំ VideoToMP3 V10…'],
    ['The page may reload once to enable the secure browser conversion engine.', 'ទំព័រអាចផ្ទុកឡើងវិញម្តង ដើម្បីបើកម៉ាស៊ីនបម្លែងដែលមានសុវត្ថិភាពក្នុងកម្មវិធីរុករក។'],
    ['The private browser converter is preparing.', 'កម្មវិធីបម្លែងឯកជនក្នុងកម្មវិធីរុករកកំពុងរៀបចំ។'],
    ['VideoToMP3 V10 · Browser memory only', 'VideoToMP3 V10 · ដំណើរការតែក្នុងអង្គចងចាំកម្មវិធីរុករក'],
    ['Browser memory only', 'ដំណើរការតែក្នុងអង្គចងចាំកម្មវិធីរុករក'],
    ['Private batch converter', 'កម្មវិធីបម្លែងជាបាច់ឯកជន'],
    ['Convert multiple videos to audio.', 'បម្លែងវីដេអូច្រើនទៅជាសំឡេង។'],
    ['MP4, MOV, MKV, AVI, WebM and M4V. Processed one by one in your browser.', 'គាំទ្រ MP4, MOV, MKV, AVI, WebM និង M4V។ ដំណើរការម្តងមួយឯកសារក្នុងកម្មវិធីរុករក។'],
    ['No uploads', 'មិនផ្ទុកឡើង'],
    ['Output format', 'ទម្រង់ឯកសារចេញ'],
    ['Sample rate', 'អត្រាសំណាក'],
    ['Channels', 'ឆានែល'],
    ['Stereo', 'ស្តេរ៉េអូ'],
    ['Mono', 'ម៉ូណូ'],
    ['Bitrate mode', 'របៀបអត្រាប៊ីត'],
    ['Bitrate', 'អត្រាប៊ីត'],
    ['Estimated total output', 'ទំហំឯកសារចេញសរុបប៉ាន់ស្មាន'],
    ['Add files to calculate an estimate.', 'បន្ថែមឯកសារ ដើម្បីគណនាទំហំប៉ាន់ស្មាន។'],
    ['After conversion', 'បន្ទាប់ពីបម្លែង'],
    ['Some video containers do not reveal duration to the browser.', 'ទម្រង់វីដេអូខ្លះមិនបង្ហាញរយៈពេលដល់កម្មវិធីរុករកទេ។'],
    ['Estimate based on duration and selected audio settings.', 'ការប៉ាន់ស្មានផ្អែកលើរយៈពេល និងការកំណត់សំឡេងដែលបានជ្រើស។'],
    ['Drop video files here', 'ទម្លាក់ឯកសារវីដេអូនៅទីនេះ'],
    ['Choose videos', 'ជ្រើសរើសវីដេអូ'],
    ['MP4 · MOV · MKV · AVI · WebM · M4V · Maximum 500 MB each', 'MP4 · MOV · MKV · AVI · WebM · M4V · អតិបរមា 500 MB ក្នុងមួយឯកសារ'],
    ['Conversion queue', 'ជួររង់ចាំបម្លែង'],
    ['files', 'ឯកសារ'],
    ['file', 'ឯកសារ'],
    ['Clear finished', 'សម្អាតឯកសាររួចរាល់'],
    ['Convert all', 'បម្លែងទាំងអស់'],
    ['Your selected files will appear here.', 'ឯកសារដែលបានជ្រើសនឹងបង្ហាញនៅទីនេះ។'],
    ['Preparing conversion…', 'កំពុងរៀបចំបម្លែង…'],
    ['Cancel current file', 'បោះបង់ឯកសារបច្ចុប្បន្ន'],
    ['Duration unavailable', 'មិនអាចរករយៈពេលបាន'],
    ['Ready', 'រួចរាល់'],
    ['Loading engine', 'កំពុងផ្ទុកម៉ាស៊ីនបម្លែង'],
    ['Complete', 'បានបញ្ចប់'],
    ['Failed', 'បរាជ័យ'],
    ['Cancelled', 'បានបោះបង់'],
    ['Estimated', 'ប៉ាន់ស្មាន'],
    ['Download', 'ទាញយក'],
    ['Remove', 'លុបចេញ'],
    ['Lossless', 'គ្មានការបាត់បង់គុណភាព'],
    ['Conversion cancelled.', 'បានបោះបង់ការបម្លែង។'],
    ['Unsupported output format.', 'មិនគាំទ្រទម្រង់ឯកសារចេញនេះទេ។'],
    ['The output file is empty.', 'ឯកសារចេញទទេ។'],
    ['Preparing secure browser mode…', 'កំពុងរៀបចំរបៀបកម្មវិធីរុករកដែលមានសុវត្ថិភាព…'],
    ['The page will reload once automatically before conversion starts.', 'ទំព័រនឹងផ្ទុកឡើងវិញម្តងដោយស្វ័យប្រវត្តិ មុនចាប់ផ្ដើមបម្លែង។'],
    ['Loading VideoToMP3 V10…', 'កំពុងផ្ទុក VideoToMP3 V10…'],
    ['Starting the isolated browser conversion engine.', 'កំពុងចាប់ផ្ដើមម៉ាស៊ីនបម្លែងក្នុងកម្មវិធីរុករកដែលបានការពារ។'],
    ['Converter could not start', 'មិនអាចចាប់ផ្ដើមកម្មវិធីបម្លែងបាន'],
    ['The classic browser converter is preparing.', 'កម្មវិធីបម្លែងក្នុងកម្មវិធីរុករកកំពុងរៀបចំ។']
  ]);

  const ATTRIBUTES = new Map([
    ['Main navigation', 'ម៉ឺនុយមេ'],
    ['VideoToMP3 home', 'ទំព័រដើម VideoToMP3'],
    ['Toggle dark mode', 'ប្ដូររបៀបងងឹត'],
    ['Conversion settings', 'ការកំណត់ការបម្លែង'],
    ['Bitrate mode', 'របៀបអត្រាប៊ីត'],
    ['Choose video files', 'ជ្រើសរើសឯកសារវីដេអូ']
  ]);

  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  let applying = false;

  const params = new URL(location.href).searchParams;
  let language = params.get('lang') === 'km' ? 'km' : 'en';

  function translatePhrase(value) {
    if (TEXT.has(value)) return TEXT.get(value);

    let match = value.match(/^or select up to (\d+) files$/);
    if (match) return `ឬជ្រើសរើសបានរហូតដល់ ${match[1]} ឯកសារ`;

    match = value.match(/^Converting (\d+)%$/);
    if (match) return `កំពុងបម្លែង ${match[1]}%`;

    match = value.match(/^Estimated (.+)$/);
    if (match) return `ប៉ាន់ស្មាន ${match[1]}`;

    match = value.match(/^Estimated for (\d+) of (\d+) files with readable duration\.$/);
    if (match) return `បានប៉ាន់ស្មាន ${match[1]} ក្នុងចំណោម ${match[2]} ឯកសារដែលអាចអានរយៈពេលបាន។`;

    match = value.match(/^File (\d+) of (\d+): (.+)$/);
    if (match) return `ឯកសារ ${match[1]} ក្នុងចំណោម ${match[2]}៖ ${match[3]}`;

    match = value.match(/^The queue supports up to (\d+) files\.$/);
    if (match) return `ជួររង់ចាំគាំទ្ររហូតដល់ ${match[1]} ឯកសារ។`;

    match = value.match(/^Only the first (\d+) files were added\. Maximum queue size is (\d+)\.$/);
    if (match) return `បានបន្ថែមតែ ${match[1]} ឯកសារដំបូង។ ជួររង់ចាំអតិបរមា ${match[2]} ឯកសារ។`;

    match = value.match(/^(.+) is not a supported video format\.$/);
    if (match) return `${match[1]} មិនមែនជាទម្រង់វីដេអូដែលគាំទ្រទេ។`;

    match = value.match(/^(.+) is larger than 500 MB\.$/);
    if (match) return `${match[1]} មានទំហំលើស 500 MB។`;

    match = value.match(/^FFmpeg exited with code (.+)\.$/);
    if (match) return `FFmpeg បានបញ្ចប់ដោយលេខកូដ ${match[1]}។`;

    return value;
  }

  function translateText(value) {
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const core = value.slice(leading.length, value.length - trailing.length);
    if (!core) return value;
    return `${leading}${translatePhrase(core)}${trailing}`;
  }

  function processTextNode(node) {
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || '');
    const original = textOriginals.get(node);
    const nextValue = language === 'km' ? translateText(original) : original;
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  }

  function processAttributes(element) {
    if (!(element instanceof Element)) return;
    if (element.id === 'language-button') return;

    if (!attributeOriginals.has(element)) attributeOriginals.set(element, new Map());
    const saved = attributeOriginals.get(element);

    for (const name of ['aria-label', 'title', 'placeholder']) {
      if (!element.hasAttribute(name)) continue;
      if (!saved.has(name)) saved.set(name, element.getAttribute(name));
      const original = saved.get(name);
      const nextValue = language === 'km' ? (ATTRIBUTES.get(original) || translatePhrase(original)) : original;
      if (element.getAttribute(name) !== nextValue) element.setAttribute(name, nextValue);
    }
  }

  function processTree(root) {
    applying = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        processTextNode(root);
        return;
      }

      if (!(root instanceof Element || root instanceof Document)) return;
      if (root instanceof Element) processAttributes(root);

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.parentElement?.id !== 'language-button' && !['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName || '')) {
            processTextNode(node);
          }
        } else {
          processAttributes(node);
        }
        node = walker.nextNode();
      }
    } finally {
      applying = false;
    }
  }

  function updateButton() {
    const button = document.getElementById('language-button');
    if (!button) return;
    button.textContent = language === 'km' ? 'EN' : 'ខ្មែរ';
    button.setAttribute('aria-label', language === 'km' ? 'Switch to English' : 'ប្ដូរទៅភាសាខ្មែរ');
    button.setAttribute('title', language === 'km' ? 'English' : 'ភាសាខ្មែរ');
  }

  function applyLanguage(nextLanguage) {
    language = nextLanguage === 'km' ? 'km' : 'en';
    document.documentElement.lang = language === 'km' ? 'km' : 'en';

    const url = new URL(location.href);
    if (language === 'km') url.searchParams.set('lang', 'km');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);

    processTree(document);
    updateButton();
    document.dispatchEvent(new CustomEvent('videotomp3:languagechange', { detail: { language } }));
  }

  function initialize() {
    const style = document.createElement('style');
    style.textContent = `
      .language-switch {
        min-width: 66px;
        height: 38px;
        padding: 0 14px;
        border: 1px solid rgba(128, 128, 128, .24);
        border-radius: 999px;
        background: rgba(128, 128, 128, .08);
        color: inherit;
        font: inherit;
        font-weight: 900;
        cursor: pointer;
        transition: transform .2s ease, background .2s ease;
      }
      .language-switch:hover { transform: translateY(-1px); background: rgba(128, 128, 128, .14); }
      .language-switch:focus-visible { outline: 3px solid rgba(0, 122, 255, .28); outline-offset: 2px; }
    `;
    document.head.appendChild(style);

    const button = document.getElementById('language-button');
    button?.addEventListener('click', () => applyLanguage(language === 'km' ? 'en' : 'km'));

    const observer = new MutationObserver((records) => {
      if (applying) return;
      for (const record of records) {
        if (record.type === 'characterData') processTextNode(record.target);
        for (const node of record.addedNodes) processTree(node);
      }
      updateButton();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    applyLanguage(language);
  }

  window.VideoToMP3I18n = {
    get language() { return language; },
    setLanguage: applyLanguage,
    translate: (value) => language === 'km' ? translatePhrase(value) : value
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
