/* Φ Field: accessible progressive enhancements. Native destination anchors remain the fallback. */
(() => {
  'use strict';
  const root = document.querySelector('.gateway');
  if (window.location.hostname.endsWith('.github.io')) document.documentElement.dataset.preview = 'true';
  const toggle = document.querySelector('.motion-toggle');
  const cards = [...document.querySelectorAll('.destiny[data-destination]')];
  const selectionLabel = document.querySelector('.intro__selection-text');
  const transition = document.querySelector('.portal-transition');
  const transitionName = transition?.querySelector('.portal-transition__name');
  const preferredReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const names = { live: 'PhiOS Live', xr: 'PhiOS XR', mobile: 'PhiOS Mobile' };
  const messages = { live: 'DESKTOP PORTAL SELECTED', xr: 'SPATIAL PORTAL SELECTED', mobile: 'TOUCH PORTAL SELECTED' };
  let saved = null;
  try { saved = localStorage.getItem('phi-field:motion'); } catch (_) { /* storage is optional */ }
  // System accessibility preferences override saved effects-on; users can turn effects off at any time.
  let motionEnabled = saved === 'off' ? false : !(preferredReducedMotion?.matches ?? false);
  let navigating = false;
  let navigationTimer = null;

  const renderMotion = () => {
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
    if (!toggle) return;
    toggle.disabled = Boolean(preferredReducedMotion?.matches);
    toggle.setAttribute('aria-pressed', String(motionEnabled));
    toggle.setAttribute('aria-label', preferredReducedMotion?.matches ? 'Background effects disabled by system reduced-motion preference' : motionEnabled ? 'Turn off background animation' : 'Turn on background animation');
    toggle.textContent = `WORLD EFFECTS: ${motionEnabled ? 'ON' : 'OFF'}`;
  };
  renderMotion();
  toggle?.addEventListener('click', () => {
    // Respect the system's reduced-motion preference.
    if (preferredReducedMotion?.matches) return;
    motionEnabled = !motionEnabled;
    saved = motionEnabled ? 'on' : 'off';
    try { localStorage.setItem('phi-field:motion', motionEnabled ? 'on' : 'off'); } catch (_) { /* okay */ }
    renderMotion();
  });
  preferredReducedMotion?.addEventListener?.('change', (event) => {
    if (event.matches) motionEnabled = false;
    else motionEnabled = saved === 'off' ? false : true;
    renderMotion();
  });

  const setSelected = (id) => {
    if (navigating || !root) return;
    if (id && !names[id]) return;
    root.dataset.portal = id || '';
    if (selectionLabel) selectionLabel.textContent = id ? messages[id] : 'THREE PORTALS READY';
  };
  cards.forEach(card => {
    const id = card.dataset.destination;
    card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') setSelected(id); });
    card.addEventListener('pointerleave', () => { if (!card.matches(':focus')) setSelected(''); });
    card.addEventListener('focus', () => setSelected(id));
    card.addEventListener('blur', () => setSelected(''));
  });

  // Arrow navigation is supplemental. Standard Tab and Enter stay native.
  const nav = document.querySelector('.destinies');
  nav?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const i = cards.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    let next = i;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = cards.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % cards.length;
    else next = (i + cards.length - 1) % cards.length;
    cards[next].focus();
  });

  const cancelTransition = () => {
    if (navigationTimer !== null) clearTimeout(navigationTimer);
    navigationTimer = null;
    navigating = false;
    if (transition) {
      transition.classList.remove('is-active');
      transition.hidden = true;
    }
    document.body.classList.remove('is-transiting');
  };
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && navigating) cancelTransition(); });
  window.addEventListener('pageshow', cancelTransition);

  cards.forEach(card => card.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (card.target && card.target !== '_self') return;
    const destination = card.dataset.destination;
    // Leave native anchor semantics intact for accessibility, low-motion, and browsers without transitions.
    // Headsets and touch devices use immediate native navigation; delayed top-level redirects can be blocked.
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    if (coarsePointer || (destination === 'xr' && navigator.xr) || !motionEnabled || preferredReducedMotion?.matches || !transition || !names[destination]) return;
    const url = card.href;
    if (!url.startsWith('https://')) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    root.dataset.portal = destination;
    transition.dataset.destination = destination;
    if (transitionName) transitionName.textContent = names[destination];
    transition.hidden = false;
    document.body.classList.add('is-transiting');
    requestAnimationFrame(() => transition.classList.add('is-active'));
    navigationTimer = window.setTimeout(() => window.location.assign(url), 620);
  }));
})();
