(() => {
  'use strict';

  const root = document.documentElement;
  const button = document.getElementById('theme-button');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  root.dataset.theme = prefersDark ? 'dark' : 'light';

  function updateButton() {
    if (!button) return;
    const dark = root.dataset.theme === 'dark';
    button.textContent = dark ? '☾' : '☼';
    button.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark mode');
  }

  button?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateButton();
  });

  updateButton();
})();
