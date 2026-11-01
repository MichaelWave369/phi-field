/* Optional ambience. The destination links are native anchors and work without JavaScript. */
(() => {
  const button = document.querySelector('.motion-toggle');
  if (!button) return;
  const preferredReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let saved = null;
  try { saved = localStorage.getItem('phi-field:motion'); } catch (_) { /* private browsing */ }
  let on = saved === 'on' ? true : saved === 'off' ? false : !preferredReducedMotion;
  function render() {
    document.documentElement.dataset.motion = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Turn off background animation' : 'Turn on background animation');
    button.textContent = `WORLD EFFECTS: ${on ? 'ON' : 'OFF'}`;
  }
  render();
  button.addEventListener('click', () => {
    on = !on;
    try { localStorage.setItem('phi-field:motion', on ? 'on' : 'off'); } catch (_) { /* optional */ }
    render();
  });
})();
