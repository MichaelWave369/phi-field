/* Φ Field Rung 3: optional scene depth and controller navigation.
   Decorative motion never blocks native links. No XR-session interception. */
(() => {
  'use strict';
  const root = document.querySelector('.gateway');
  const cards = [...document.querySelectorAll('a.destiny[data-destination]')];
  if (!root || cards.length !== 3) return;
  const html = document.documentElement;
  const hint = document.querySelector('[data-control-hint]');
  const coarse = window.matchMedia('(pointer: coarse)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const memory = navigator.deviceMemory;
  const dataSaver = navigator.connection && navigator.connection.saveData;
  const lite = coarse.matches || dataSaver || (typeof memory === 'number' && memory <= 4);
  html.dataset.quality = lite ? 'lite' : 'full';

  const updateHint = (controller = false) => {
    if (!hint) return;
    if (controller) hint.textContent = 'CONTROLLER: D-PAD TO SELECT · A TO ENTER · BACK TO CANCEL';
    else if (coarse.matches) hint.textContent = 'TAP A PORTAL TO ENTER · LINKS OPEN DIRECTLY';
    else hint.textContent = 'TAB OR ARROWS TO SELECT · ENTER TO LAUNCH · ESC TO CANCEL';
  };
  updateHint();
  coarse.addEventListener?.('change', () => updateHint());

  let scheduled = false, x = 0, y = 0;
  const moveWorld = () => {
    scheduled = false;
    if (document.hidden || !fine.matches || lite || reduced.matches || html.dataset.motion === 'off') return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((x - rect.left) / rect.width - .5) * 2));
    const ny = Math.max(-1, Math.min(1, ((y - rect.top) / rect.height - .5) * 2));
    root.style.setProperty('--field-shift-x', (nx * -9).toFixed(1) + 'px');
    root.style.setProperty('--field-shift-y', (ny * -6).toFixed(1) + 'px');
    root.style.setProperty('--field-pointer-x', ((nx + 1) * 50).toFixed(1) + '%');
    root.style.setProperty('--field-pointer-y', ((ny + 1) * 50).toFixed(1) + '%');
  };
  root.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || lite || !fine.matches || reduced.matches) return;
    x = event.clientX; y = event.clientY;
    if (!scheduled) { scheduled = true; requestAnimationFrame(moveWorld); }
  }, {passive:true});
  root.addEventListener('pointerleave', () => {
    root.style.removeProperty('--field-shift-x');
    root.style.removeProperty('--field-shift-y');
    root.style.removeProperty('--field-pointer-x');
    root.style.removeProperty('--field-pointer-y');
  });

  // Coarse pointers highlight a portal on touch, but never delay its native anchor.
  cards.forEach(card => card.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') root.dataset.portal = card.dataset.destination;
  }, {passive:true}));

  // Optional standard Gamepad API controls, for desktop controllers outside WebXR.
  // Never commandeer XR input or activate a link on the first observed button state.
  if (!navigator.getGamepads || navigator.xr) return;
  let frame = 0, active = false, lastDirection = false, lastConfirm = false;
  let index = -1;
  const stop = () => { active = false; if (frame) cancelAnimationFrame(frame); frame = 0; };
  const read = () => {
    if (!active) return;
    if (document.hidden) { frame = requestAnimationFrame(read); return; }
    const pads = [...(navigator.getGamepads() || [])];
    const pad = pads.find(p => p && p.connected && p.mapping === 'standard');
    if (!pad) { stop(); updateHint(); return; }
    const b = n => Boolean(pad.buttons[n] && pad.buttons[n].pressed);
    const axis = pad.axes[0] || 0;
    const direction = b(15) || b(13) || axis > .72 ? 1 :
                      b(14) || b(12) || axis < -.72 ? -1 : 0;
    const confirming = b(0);
    if (direction && !lastDirection && !document.body.classList.contains('is-transiting')) {
      index = index < 0 ? 0 : (index + direction + cards.length) % cards.length;
      cards[index].focus({preventScroll: false});
    }
    if (confirming && !lastConfirm && index >= 0 && !document.body.classList.contains('is-transiting')) {
      cards[index].click();
    }
    lastDirection = Boolean(direction);
    lastConfirm = confirming;
    frame = requestAnimationFrame(read);
  };
  const start = () => {
    if (active) return;
    const pad = [...(navigator.getGamepads() || [])].find(p => p && p.connected && p.mapping === 'standard');
    if (!pad) return;
    lastDirection = true; lastConfirm = true; // wait for release before acting
    active = true; updateHint(true); frame = requestAnimationFrame(read);
  };
  window.addEventListener('gamepadconnected', start);
  window.addEventListener('gamepaddisconnected', () => {
    const stillConnected = [...(navigator.getGamepads() || [])].some(p => p && p.connected && p.mapping === 'standard');
    if (!stillConnected) { stop(); updateHint(); }
  });
  window.addEventListener('pageshow', start);
  start();
})();