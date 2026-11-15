/* ---------- admin gate (test build only; portal builds do not contain this file) ----------
   The admin menu is NOT in this file. It is stored below in encrypted form, and only the admin passphrase
   turns it back into code. There is no "is admin" switch to flip: without the passphrase there is nothing to run.
   Open or close: F2 on a keyboard, five quick taps on the level label on a touch screen, or the address ending in #admin. */
(function () {
  var PAY = /*__ADMIN_PAYLOAD__*/null;        // { s: salt, i: iv, c: ciphertext, n: rounds }, all base64
  if (!PAY) return;
  var STORE = 'feedblob.admin', busy = false, box = null, taps = [];

  function bytes(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function text(u) { var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function saved() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }
  function forget() { try { localStorage.removeItem(STORE); } catch (e) { /* nothing stored */ } }

  // passphrase -> key (slow on purpose, so guessing is expensive)
  function derive(pass) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytes(PAY.s), iterations: PAY.n, hash: 'SHA-256' }, k, 256); })
      .then(function (bits) { return new Uint8Array(bits); });
  }
  // key -> source of the menu; a wrong key fails here, it never yields half-working code
  function decrypt(raw) {
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
      .then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(PAY.i) }, k, bytes(PAY.c)); })
      .then(function (buf) { return new TextDecoder().decode(buf); });
  }
  // pages differ in what they allow, so try the three ways a script can be started
  function run(code) {
    return new Promise(function (done) {
      var el;
      try { el = document.createElement('script'); el.textContent = code; document.head.appendChild(el); el.remove(); } catch (e) { /* next way */ }
      if (window.FBAdmin) return done(true);
      try { (new Function(code))(); } catch (e) { /* next way */ }
      if (window.FBAdmin) return done(true);
      try {
        var url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); el = document.createElement('script');
        el.onload = function () { URL.revokeObjectURL(url); done(!!window.FBAdmin); }; el.onerror = function () { done(false); };
        el.src = url; document.head.appendChild(el);
      } catch (e) { done(false); }
    });
  }
  // result: 'ok', 'wrong' (passphrase or key does not fit) or 'blocked' (right key, but the page refuses to start the menu)
  function unlock(raw, remember) {
    return decrypt(raw).then(function (code) {
      return run(code).then(function (ok) {
        if (!ok) return 'blocked';
        window.FBAdmin.onLock = forget;
        if (remember) try { localStorage.setItem(STORE, text(raw)); } catch (e) { /* works without remembering */ }
        return 'ok';
      });
    }, function () { return 'wrong'; });
  }

  function toggle() {
    if (window.FBAdmin) return window.FBAdmin.toggle();
    if (busy) return;
    if (box) return closeBox();
    if (!window.crypto || !crypto.subtle) return ask('This page cannot unlock the menu (no secure connection).');
    var key = saved();
    if (!key) return ask('');
    busy = true;
    unlock(bytes(key), false).then(function (r) { busy = false; if (r === 'ok') window.FBAdmin.toggle(); else { if (r === 'wrong') forget(); ask(r === 'blocked' ? 'This page does not allow loading the menu.' : ''); } });
  }

  function closeBox() { if (box) { box.remove(); box = null; } }
  function ask(msg) {
    closeBox();
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(30,20,15,.55);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    box.innerHTML = '<form style="background:#fff8ea;border:3px solid #3b2a20;border-radius:16px;padding:18px;width:min(320px,88vw);display:flex;flex-direction:column;gap:10px;color:#3b2a20">' +
      '<b style="font-size:18px">Admin</b>' +
      '<input type="password" autocomplete="off" placeholder="Passphrase" style="font:inherit;font-size:16px;padding:9px 10px;border:2px solid #3b2a20;border-radius:10px;background:#fff">' +
      '<label style="font-size:13px;display:flex;gap:7px;align-items:center"><input type="checkbox" checked> Remember on this device</label>' +
      '<div data-err style="font-size:13px;color:#c0392b;min-height:17px"></div>' +
      '<div style="display:flex;gap:8px"><button type="submit" style="flex:1;font:inherit;font-weight:700;padding:9px;border:2px solid #3b2a20;border-radius:10px;background:#8cf58a;cursor:pointer">Unlock</button>' +
      '<button type="button" data-x style="font:inherit;font-weight:700;padding:9px 14px;border:2px solid #3b2a20;border-radius:10px;background:#fff;cursor:pointer">Cancel</button></div></form>';
    var form = box.firstChild, inp = form.querySelector('input[type=password]'), err = form.querySelector('[data-err]'), btn = form.querySelector('button[type=submit]');
    err.textContent = msg || '';
    ['keydown', 'keyup', 'keypress', 'pointerdown', 'mousedown', 'touchstart'].forEach(function (ev) { box.addEventListener(ev, function (e) { if (ev === 'keydown' && e.code === 'Escape') closeBox(); e.stopPropagation(); }); });
    form.querySelector('[data-x]').addEventListener('click', closeBox);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || !inp.value) return;
      if (!window.crypto || !crypto.subtle) { err.textContent = 'This page cannot unlock the menu (no secure connection).'; return; }
      busy = true; btn.textContent = 'Checking…'; err.textContent = '';
      var remember = form.querySelector('input[type=checkbox]').checked;
      derive(inp.value).then(function (raw) { return unlock(raw, remember); }, function () { return 'wrong'; }).then(function (r) {
        busy = false; btn.textContent = 'Unlock';
        if (r === 'ok') { closeBox(); window.FBAdmin.toggle(); }
        else { err.textContent = r === 'blocked' ? 'Right passphrase, but this page does not allow loading the menu.' : 'Wrong passphrase.'; inp.value = ''; inp.focus(); }
      });
    });
    document.body.appendChild(box); inp.focus();
  }

  window.addEventListener('keydown', function (e) { if (e.code === 'F2') { e.preventDefault(); e.stopPropagation(); toggle(); } }, true);
  document.addEventListener('pointerdown', function (e) {
    var el = document.getElementById('lvl'); if (!el || box || (window.FBAdmin && window.FBAdmin.isOpen())) return;
    var r = el.getBoundingClientRect(), now = Date.now();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { taps.length = 0; return; }
    taps.push(now); while (taps.length && now - taps[0] > 2500) taps.shift();
    if (taps.length >= 5) { taps.length = 0; toggle(); }
  }, true);
  if (location.hash === '#admin') setTimeout(toggle, 400);
  window.addEventListener('hashchange', function () { if (location.hash === '#admin' && !(window.FBAdmin && window.FBAdmin.isOpen()) && !box) toggle(); });
})();
