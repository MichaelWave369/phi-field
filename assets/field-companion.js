/* Φ Field Companion v1: local-only, user-controlled display and navigation preferences.
 * Not an authentication token, PhiOperator Passport, capability, or cross-origin sync.
 * Zero network calls. Never silently transfer data to destination websites. */
(() => {
  'use strict';
  const dialog = document.getElementById('field-companion');
  const openButton = document.querySelector('.field-open');
  const closeButton = document.querySelector('.field-companion__close');
  const aliasInput = document.getElementById('field-alias');
  const status = document.querySelector('.field-companion__status');
  const storageStatus = document.querySelector('.field-companion__storage');
  const greeting = document.querySelector('.field-greeting');
  const pinnedNav = document.querySelector('.field-companion__pinned');
  const lastLink = document.querySelector('.field-companion__resume');
  const fileInput = document.getElementById('field-import-file');
  if (!dialog || !openButton || !closeButton || !aliasInput || !fileInput) return;

  const KEY = 'phi-field:companion:v1';
  const FORMAT = 'phi-field-companion';
  const MAX_FILE_BYTES = 16 * 1024;
  const ROUTES = Object.freeze({
    live: Object.freeze({name:'PhiOS Live', url:'./os/'}),
    xr: Object.freeze({name:'PhiOS XR', url:'https://michaelwave369.github.io/PhiOS-XR/'}),
    mobile: Object.freeze({name:'PhiOS Mobile', url:'https://michaelwave369.github.io/PhiOS-Mobile/'})
  });
  const KEYS = Object.keys(ROUTES);
  const hasExactKeys = (obj, keys) =>
    !!obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.keys(obj).every(key => keys.includes(key)) &&
    keys.every(key => Object.prototype.hasOwnProperty.call(obj, key));
  const fresh = () => ({ alias:'', pinned:[], last:null });
  const cleanLabel = value => String(value).trim().slice(0,32);
  const allowedAlias = value => typeof value === 'string' &&
    value.length <= 32 && !/[\u0000-\u001f\u007f<>]/.test(value);
  const validate = data => {
    if (!hasExactKeys(data, ['format','version','profile','appearance']) ||
        data.format !== FORMAT || data.version !== 1 ||
        !hasExactKeys(data.profile, ['alias','pinned','last']) ||
        !hasExactKeys(data.appearance, ['effects']) ||
        !allowedAlias(data.profile.alias) ||
        !Array.isArray(data.profile.pinned) ||
        data.profile.pinned.length > KEYS.length ||
        data.profile.pinned.some(id => !KEYS.includes(id)) ||
        new Set(data.profile.pinned).size !== data.profile.pinned.length ||
        (data.profile.last !== null && !KEYS.includes(data.profile.last)) ||
        !['on','off'].includes(data.appearance.effects)) {
      throw new Error('Not a valid Field Companion v1 preferences file');
    }
    return {
      profile: {alias:data.profile.alias, pinned:[...data.profile.pinned], last:data.profile.last},
      effects:data.appearance.effects
    };
  };
  const currentEffects = () => {
    const motion = document.documentElement.dataset.motion;
    return motion === 'off' ? 'off' : 'on';
  };
  const packet = () => ({
    format:FORMAT, version:1,
    profile:{alias:state.alias, pinned:[...state.pinned], last:state.last},
    appearance:{effects:currentEffects()}
  });
  let state = fresh();
  let storageAvailable = true;
  let startupNote = '';
  let lastFocused = null;
  try {
    const data = localStorage.getItem(KEY);
    if (data) {
      try {
        if (data.length > MAX_FILE_BYTES) throw Error('oversized');
        state = validate(JSON.parse(data)).profile;
      } catch (_) { startupNote = 'An invalid saved Companion profile was ignored.'; }
    }
  } catch (_) { storageAvailable = false; }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(packet())); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
  };
  const message = text => { if (status) status.textContent = text; };
  const render = () => {
    aliasInput.value = state.alias;
    if (greeting) greeting.textContent = state.alias ? 'WELCOME, ' + state.alias : 'LOCAL GUEST · NO ACCOUNT';
    if (lastLink) {
      lastLink.hidden = state.last === null;
      if (state.last) {
        lastLink.href = ROUTES[state.last].url;
        lastLink.dataset.fieldRoute = state.last;
        lastLink.textContent = 'CONTINUE TO ' + ROUTES[state.last].name.toUpperCase() + ' ↗';
      }
    }
    document.querySelectorAll('[data-field-pin]').forEach(button => {
      const id = button.dataset.fieldPin;
      const pinned = state.pinned.includes(id);
      button.setAttribute('aria-pressed', String(pinned));
      button.textContent = (pinned ? '★ UNPIN ' : '☆ PIN ') + ROUTES[id].name.toUpperCase();
    });
    if (pinnedNav) {
      pinnedNav.replaceChildren();
      if (!state.pinned.length) {
        const text = document.createElement('span');
        text.textContent = 'No shortcuts pinned yet.';
        pinnedNav.append(text);
      } else state.pinned.forEach(id => {
        const anchor = document.createElement('a');
        anchor.href = ROUTES[id].url;
        anchor.dataset.fieldRoute = id;
        anchor.textContent = ROUTES[id].name + ' ↗';
        pinnedNav.append(anchor);
      });
    }
    if (storageStatus) storageStatus.textContent = storageAvailable ?
      'Saved in this browser only. Export JSON to transfer to another browser.' :
      'Session-only mode: browser storage is unavailable. Export JSON to keep a copy.';
  };
  const close = () => {
    dialog.hidden = true;
    document.body.classList.remove('field-companion-open');
    openButton.setAttribute('aria-expanded','false');
    (lastFocused && lastFocused.isConnected ? lastFocused : openButton).focus();
  };
  const open = () => {
    lastFocused = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add('field-companion-open');
    openButton.setAttribute('aria-expanded','true');
    closeButton.focus();
  };
  openButton.hidden = false;
  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.querySelector('.field-companion__backdrop')?.addEventListener('click', close);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const nodes = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="file"]),a[href]')]
      .filter(el => !el.hidden && el.getClientRects().length);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  dialog.querySelector('.field-companion__save')?.addEventListener('click', () => {
    const raw = aliasInput.value.trim();
    if (!allowedAlias(raw)) { message('Use up to 32 visible characters for the display label.'); return; }
    state.alias = cleanLabel(raw);
    persist(); render(); message(storageAvailable ? 'Display label saved locally.' : 'Label updated for this session only.');
  });
  dialog.querySelectorAll('[data-field-pin]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.fieldPin;
    state.pinned = state.pinned.includes(id) ? state.pinned.filter(item => item !== id) :
      [...state.pinned, id];
    persist(); render(); message('Shortcuts updated. They do not unlock features.');
  }));
  const rememberRoute = event => {
    const anchor = event.target.closest('a[data-field-route],a.destiny[data-destination]');
    const id = anchor && (anchor.dataset.fieldRoute || anchor.dataset.destination);
    if (!id || !ROUTES[id] || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    state.last = id;
    persist();
    if (lastLink) render();
  };
  document.addEventListener('click', rememberRoute, true);

  dialog.querySelector('.field-companion__export')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(packet(), null, 2) + '\n'], {type:'application/json'});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href; link.download = 'phi-field-companion-v1.json';
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 10000);
    message('Preferences exported as readable JSON. Keep the file somewhere you control.');
  });
  dialog.querySelector('.field-companion__import')?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { message('Import rejected: file exceeds 16 KB.'); return; }
    let imported;
    try {
      const contents = await file.text();
      if (contents.length > MAX_FILE_BYTES) throw Error('oversized');
      imported = validate(JSON.parse(contents));
    } catch (_) { message('Import rejected: expected a valid Field Companion v1 JSON file.'); return; }
    if (!window.confirm('Replace only this gateway’s local Field Companion preferences? No other apps or permissions will be changed.')) {
      message('Import canceled.'); return;
    }
    state = imported.profile;
    try { localStorage.setItem('phi-field:motion', imported.effects); } catch (_) { storageAvailable = false; }
    window.dispatchEvent(new CustomEvent('phi-field:appearance-imported', {detail:{effects:imported.effects}}));
    persist(); render();
    message(storageAvailable ? 'Field Companion preferences imported to this browser.' :
      'Preferences imported for this session. Export a copy before leaving.');
  });
  dialog.querySelector('.field-companion__reset')?.addEventListener('click', () => {
    if (!window.confirm('Clear only this gateway’s Field Companion display label, pins and last destination?')) return;
    state = fresh();
    try { localStorage.removeItem(KEY); storageAvailable = true; } catch (_) { storageAvailable = false; }
    render(); message('Companion profile cleared. Other application data is untouched.');
  });
  render();
  if (startupNote) message(startupNote);
})();
