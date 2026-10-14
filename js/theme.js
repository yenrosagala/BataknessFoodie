(function () {
  var KEY = 'batak-theme';
  var root = document.documentElement;

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
  }

  function sync() {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  }

  root.setAttribute('data-theme', stored() || systemTheme());

  // Delegated so it still works when the header is injected after load.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#theme-toggle');
    if (!btn) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    save(next);
    sync();
  });
  document.addEventListener('DOMContentLoaded', sync);
})();
