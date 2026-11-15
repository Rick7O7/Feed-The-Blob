/* Feed the Blob: admin and debug menu.  FBADMIN-CANARY (the build fails if this line shows up in a built page in clear)

   This file never ships in clear text. The build encrypts it with a key derived from the admin passphrase,
   and the builds for portals leave it out completely.

   How it is put together:
     1. COMMANDS  one list (CMD). Every function of the menu is one add({...}) entry.
     2. EXEC      the single place that runs a command. Menu buttons and the command line both go through it.
     3. HOOKS     the few game functions the switches (god mode, speed ...) wrap. Lock puts the originals back.
     4. PANEL     the menu is drawn from the list, so a new entry shows up without touching the panel code.

   To add a function later: one more add({ id, group, label, args, get, run }) in section 1. */
(function () {
  'use strict';
  if (window.FBAdmin) return;
  var S = { god: false, stam: false, freeze: false, noads: false, clicktp: false, info: false, speed: 1, acc: 0 };
  var CMD = [], BY = {}, LOG = [], panel = null, infoBox = null, timer = null, shown = false, fps = 0, frames = 0, fpsT = 0, raf = 0;
  var O = { hurt: window.hurt, raidHit: window.raidHit, step: window.step, rewarded: window.rewarded, midgame: window.midgame };

  /* ---------- helpers ---------- */
  function me() { return G.actors[0]; }
  function fit(b) { b.level = 1; while (b.mass >= LVT[b.level]) b.level++; }
  function setLevel(n) {
    var b = G.blobs[0], old = b.mass, m = LVT[n - 1] + (LVT[n] - LVT[n - 1]) * 0.02, share = [0, 0.8, 0.6, 0.7];
    b.mass = m; b.level = n; G.rate = 0;
    for (var i = 1; i < 4; i++) { var r = G.blobs[i]; r.mass = old > 1 ? r.mass * m / old : m * share[i]; fit(r); }   // rivals keep their distance to the player
  }
  function tpTo(x, y) { var P = me(); P.x = clamp(x, EDGE + P.r, W - EDGE - P.r); P.y = clamp(y, EDGE + P.r, H - EDGE - P.r); P.vx = P.vy = 0; P.lunge = 0; P.atk = 0; }
  function place(name) {
    var b;
    if (name === 'home') return [HOMES[0].x + 130, HOMES[0].y - 40];
    if (name === 'center') return [W / 2, H / 2];
    if (name === 'boss') return G.boss ? [G.boss.x - G.boss.r - 90, G.boss.y] : null;
    b = G.blobs[+name.slice(-1)]; return [b.x + (b.x > W / 2 ? -1 : 1) * (b.r + 90), b.y];
  }
  function stopEvent() {
    var e = G.event; if (e && e.on && EV[e.type].end) { try { EV[e.type].end(e); } catch (x) { /* the reset below covers it */ } }
    G.event = null; G.boss = null; G.grav = 900; G.meteors.length = 0; G.banner = null; G.nextEvent = G.t + 40;
  }

  /* ---------- 1. COMMANDS ---------- */
  function add(c) { if (BY[c.id]) CMD.splice(CMD.indexOf(BY[c.id]), 1); CMD.push(c); BY[c.id] = c; if (panel) build(); }
  function num(n, min, max, def) { return { n: n, t: 'num', min: min, max: max, def: def }; }
  function pick(n, opts) { return { n: n, t: 'pick', opts: opts }; }
  function flag(key, id, group, label) { add({ id: id, group: group, label: label, args: [{ n: 'on', t: 'bool' }], get: function () { return [S[key]]; }, run: function (on) { S[key] = on; return label + (on ? ' on' : ' off'); } }); }

  // player values
  add({ id: 'hp', group: 'Player', label: 'Hearts', args: [num('hearts', 1, 3)], get: function () { return [G.hp]; }, run: function (v) { G.hp = Math.round(v); return 'Hearts ' + G.hp; } });
  add({ id: 'coins', group: 'Player', label: 'Coins', args: [num('amount', 0, 1e15)], get: function () { return [Math.floor(G.coins)]; }, run: function (v) { if (v > G.coins) G.total += v - G.coins; G.coins = v; return 'Coins ' + fmt(v); } });
  add({ id: 'gems', group: 'Player', label: 'Gems', args: [num('amount', 0, 1e9)], get: function () { return [G.gems]; }, run: function (v) { G.gems = Math.round(v); return 'Gems ' + G.gems; } });
  add({ id: 'level', group: 'Player', label: 'Blob level', args: [num('level', 1, 80)], get: function () { return [G.blobs[0].level]; }, run: function (v) { setLevel(Math.round(v)); return 'Blob level ' + G.blobs[0].level; } });
  add({ id: 'stars', group: 'Player', label: 'Rebirth stars', args: [num('stars', 0, 9999)], get: function () { return [G.stars]; }, run: function (v) { G.stars = Math.round(v); return 'Stars ' + G.stars; } });
  add({ id: 'fever', group: 'Player', label: 'Fever', args: [num('percent', 0, 100)], get: function () { return [Math.round(G.fever)]; }, run: function (v) { G.fever = v; G.feverT = 8; return 'Fever ' + v; } });
  add({ id: 'upg', group: 'Player', label: 'Upgrade', args: [pick('upgrade', UKEYS), num('level', 0, 999, 5)], run: function (k, v) { G.up[k] = Math.min(Math.round(v), UPG[k].max); return UPG[k].name + ' level ' + G.up[k]; } });
  add({ id: 'allupg', group: 'Player', label: 'All upgrades', args: [num('level', 0, 60, 10)], run: function (v) { UKEYS.forEach(function (k) { G.up[k] = Math.min(Math.round(v), UPG[k].max); }); return 'All upgrades at level ' + Math.round(v) + ' (or their maximum)'; } });
  add({ id: 'unlock', group: 'Player', label: 'Unlock all skins and hats', run: function () { G.skins = SKINS.map(function (s) { return s.id; }); G.hats = HATS.map(function (s) { return s.id; }); return 'All skins and hats unlocked'; } });

  // spawning
  add({ id: 'spawn', group: 'Spawn', label: 'Loot', args: [pick('kind', ['gold', 'gem', 'star', 'heart', 'apple', 'donut', 'pizza', 'fish', 'can', 'boot']), num('count', 1, 300, 20)], run: function (kind, n) {
    var P = me(); n = Math.round(n);
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, d = 50 + Math.random() * 160; G.items.push(mkItem(kind, clamp(P.x + Math.cos(a) * d, EDGE + 12, W - EDGE - 12), clamp(P.y + Math.sin(a) * d, EDGE + 12, H - EDGE - 12), 220 + Math.random() * 260)); }
    return n + ' x ' + kind + ' around you';
  } });
  add({ id: 'event', group: 'Spawn', label: 'Start event', args: [pick('event', ['boss', 'gold', 'frenzy', 'lowgrav', 'tornado'])], run: function (ty) { stopEvent(); G.nextEvent = G.t; G.evForce = ty; return EV[ty].title + ' starts'; } });
  add({ id: 'stopevent', group: 'Spawn', label: 'Stop event', run: function () { stopEvent(); return 'Event stopped'; } });

  // teleporting
  add({ id: 'tp', group: 'Teleport', label: 'Go to', args: [pick('place', ['home', 'rival1', 'rival2', 'rival3', 'center', 'boss'])], run: function (name) { var p = place(name); if (!p) return 'No boss on the map'; tpTo(p[0], p[1]); return 'Teleported to ' + name; } });
  flag('clicktp', 'clicktp', 'Teleport', 'Click on the map teleports');

  // game states
  flag('god', 'god', 'Game state', 'Invulnerable (you and your blob)');
  flag('stam', 'stam', 'Game state', 'Endless energy');
  flag('freeze', 'freeze', 'Game state', 'Freeze rivals');
  flag('noads', 'noads', 'Game state', 'Skip ads (reward at once)');
  add({ id: 'speed', group: 'Game state', label: 'Game speed', args: [pick('factor', ['0', '0.25', '0.5', '1', '2', '4', '8'])], get: function () { return [String(S.speed)]; }, run: function (v) { S.speed = +v; S.acc = 0; return S.speed ? 'Speed x' + S.speed : 'Paused'; } });

  // rivals
  add({ id: 'rival', group: 'Rivals', label: 'Rival size', args: [pick('rival', ['1', '2', '3']), num('% of you', 0, 1000, 120)], run: function (i, pct) { var b = G.blobs[+i]; b.mass = G.blobs[0].mass * pct / 100; fit(b); return NAMES[+i] + ' at ' + pct + '% of your blob'; } });
  add({ id: 'raidme', group: 'Rivals', label: 'Send raider to you', args: [pick('rival', ['1', '2', '3'])], run: function (i) { var R = G.actors[+i]; R.stun = 0; R.ai.mode = 'raid'; R.ai.blob = G.blobs[0]; R.ai.raidT = 14; R.ai.raidHits = 0; R.ai.raidMax = 3; G.lastRaid = G.t; return NAMES[+i] + ' is on the way to your blob'; } });
  add({ id: 'calm', group: 'Rivals', label: 'Clear spikes and hit counters', run: function () { G.blobs.forEach(function (b) { b.shield = 0; b.hits = 0; b.hitT = 0; b.rage = 0; }); return 'All blobs can be raided again'; } });

  // game flow
  add({ id: 'levelup', group: 'Flow', label: 'Show level-up pop-up', run: function () { var b = G.blobs[0]; G.calm = 0; G.pend.push({ type: 'levelup', level: b.level, reward: Math.round(14 * lootMul() * b.level * UPG.stomach.eff(G.up.stomach) * starMul()) }); return 'Pop-up queued'; } });
  add({ id: 'ko', group: 'Flow', label: 'Knock out now', run: function () { var P = me(); G.hp = 1; P.inv = 0; O.hurt(P, 1, P.x - 1, P.y); return 'Knocked out'; } });
  add({ id: 'quest', group: 'Flow', label: 'Complete current quest', run: function () { var q = curQuest(); if (q.coin) addCoins(q.coin); if (q.gems) G.gems += q.gems; G.quest++; G.questPop = 2.6; G.questDone = q; return 'Done: ' + q.text; } });
  add({ id: 'rebirth', group: 'Flow', label: 'Rebirth now', sure: true, run: function () { doRebirth(1); return 'Rebirth ' + G.rb + ', stars ' + G.stars; } });
  add({ id: 'save', group: 'Flow', label: 'Save now', run: function () { save(); return 'Saved'; } });
  add({ id: 'reset', group: 'Flow', label: 'Delete save and restart', sure: true, run: function () { wipe(); newGame(null); G.started = true; cam.x = HOMES[0].x; cam.y = HOMES[0].y; save(); return 'Fresh game'; } });

  // admin
  flag('info', 'info', 'Admin', 'Debug overlay');
  add({ id: 'lock', group: 'Admin', label: 'Lock and forget this device', sure: true, run: function () { setTimeout(lock, 0); return 'Locked'; } });

  /* ---------- 2. EXEC: every command runs through here ---------- */
  function parse(spec, raw, cur) {
    if (spec.t === 'num') { var v = parseFloat(String(raw).replace(',', '.')); if (raw === undefined || raw === '' || isNaN(v)) return undefined; return clamp(v, spec.min, spec.max); }
    if (spec.t === 'pick') { var s = String(raw === undefined ? '' : raw).toLowerCase(); for (var i = 0; i < spec.opts.length; i++) if (String(spec.opts[i]).toLowerCase() === s) return spec.opts[i]; return undefined; }
    if (raw === undefined || raw === '' || raw === 'toggle') return !cur;
    if (/^(on|1|true|yes)$/i.test(raw)) return true;
    if (/^(off|0|false|no)$/i.test(raw)) return false;
    return undefined;
  }
  function usage(c) { return c.id + (c.args || []).map(function (a) { return ' <' + (a.t === 'pick' ? a.opts.join('|') : a.t === 'bool' ? 'on|off' : a.n) + '>'; }).join(''); }
  function exec(id, raw) {
    var c = BY[id], a = [], sp, i, v, msg;
    if (!window.FBAdmin) return;                       // locked in the meantime
    if (id === 'help') { CMD.forEach(function (k) { say2(usage(k) + '   ' + k.label); }); return; }
    if (!c) { say2('Unknown command "' + id + '". Type help.'); return; }
    sp = c.args || []; raw = raw || [];
    var cur = c.get ? c.get() : [];
    for (i = 0; i < sp.length; i++) { v = parse(sp[i], raw[i], cur[i]); if (v === undefined) { say2('Usage: ' + usage(c)); return; } a.push(v); }
    try { msg = c.run.apply(null, a); } catch (e) { msg = 'Error: ' + e.message; }
    say2(msg || c.label);
    try { hud(); if (G.modal) uiModal(); } catch (e) { /* the next frame redraws */ }
    refresh();
    return msg;
  }
  function say2(line) { LOG.push(line); if (LOG.length > 60) LOG.shift(); if (panel) { var l = panel.querySelector('.fbA-log'); l.textContent = LOG.slice(-40).join('\n'); l.scrollTop = l.scrollHeight; } }

  /* ---------- 3. HOOKS: what the switches change in the running game ---------- */
  function before() {
    var P = me(), i, a;
    if (S.stam) { P.stam = stamMax(P); P.tired = 0; }
    if (S.freeze) for (i = 1; i < 4; i++) { a = G.actors[i]; a.stun = Math.max(a.stun, 0.2); a.vx = a.vy = 0; }
  }
  window.hurt = function (a, n, sx, sy) { if (S.god && a.id === 0) return; O.hurt(a, n, sx, sy); };
  window.raidHit = function (a, b) {
    if (S.god && b.id === 0) { if (b.hitCd > 0) return; var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01; a.vx = dx / d * 500; a.vy = dy / d * 500; a.lunge = 0; a.atk = 0; b.hitCd = 0.3; return; }
    O.raidHit(a, b);
  };
  window.step = function (dt) {
    if (S.speed === 1) { before(); O.step(dt); return; }
    S.acc += S.speed; var n = 0;
    while (S.acc >= 1 && n < 16) { S.acc -= 1; n++; before(); O.step(dt); }
  };
  window.rewarded = function (key, cd, fn) { if (S.noads) { fn(); save(); uiModal(); hud(); return; } O.rewarded(key, cd, fn); };
  window.midgame = function () { if (S.noads) return; O.midgame(); };
  function onMap(e) {
    if (!S.clicktp || !G.started || G.modal) return;
    var z = SC * (1 - 0.05 * ZB); tpTo(cam.x + (e.clientX - VW / 2) / z, cam.y + (e.clientY - VH / 2) / z);
    e.preventDefault(); e.stopImmediatePropagation();
  }
  cv.addEventListener('pointerdown', onMap, true);

  /* ---------- 4. PANEL: drawn from the command list ---------- */
  var CSS = '#fbA{position:fixed;top:8px;right:8px;bottom:8px;width:336px;z-index:9997;display:none;flex-direction:column;background:#fffaf0;border:3px solid #3b2a20;border-radius:14px;color:#3b2a20;font:13px/1.25 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 6px 0 rgba(59,42,32,.25);overflow:hidden;pointer-events:auto;user-select:none;-webkit-user-select:none}' +
    '#fbA.on{display:flex}#fbA *{box-sizing:border-box}' +
    '.fbA-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#3b2a20;color:#fff}.fbA-head b{font-size:15px;flex:1}.fbA-head span{opacity:.7;font-size:12px}' +
    '.fbA-head button{font:inherit;font-weight:700;width:28px;height:28px;border:0;border-radius:8px;background:#fff;color:#3b2a20;cursor:pointer}' +
    '.fbA-body{flex:1;overflow-y:auto;padding:2px 0 8px;overscroll-behavior:contain;touch-action:pan-y}' +
    '.fbA-g{padding:9px 10px 3px;font-weight:700;font-size:11px;letter-spacing:.04em;opacity:.6}' +
    '.fbA-row{display:flex;align-items:center;gap:6px;padding:3px 10px;min-height:32px}.fbA-row label{flex:1;min-width:0}' +
    '.fbA-row input,.fbA-row select,.fbA-cl input{font:inherit;height:28px;padding:0 6px;border:2px solid #3b2a20;border-radius:8px;background:#fff;color:#3b2a20;min-width:0}' +
    '.fbA-row input{width:78px}.fbA-row select{max-width:98px}' +
    '.fbA-row button,.fbA-cl button{font:inherit;font-weight:700;height:28px;padding:0 10px;border:2px solid #3b2a20;border-radius:8px;background:#ffe14d;color:#3b2a20;cursor:pointer;white-space:nowrap}' +
    '.fbA-row button.wide{flex:1;background:#fff;text-align:left}.fbA-row button.sw{min-width:52px;background:#fff}.fbA-row button.sw.on{background:#8cf58a}.fbA-row button.ask{background:#ff8f7a}' +
    '.fbA-log{height:92px;overflow-y:auto;margin:0;padding:6px 10px;background:#f1e7d3;border-top:2px solid #3b2a20;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;user-select:text;-webkit-user-select:text}' +
    '.fbA-cl{display:flex;gap:6px;padding:8px 10px;border-top:2px solid #3b2a20;background:#fffaf0}.fbA-cl input{flex:1;font-family:ui-monospace,Menlo,Consolas,monospace}' +
    '#fbA-info{position:fixed;left:8px;top:112px;z-index:9996;padding:6px 8px;border-radius:8px;background:rgba(30,20,15,.78);color:#d8ffd0;font:11px/1.4 ui-monospace,Menlo,Consolas,monospace;white-space:pre;pointer-events:none;display:none}#fbA-info.on{display:block}' +
    '@media (max-width:720px){#fbA{left:6px;right:6px;top:auto;bottom:6px;width:auto;height:58vh}#fbA-info{top:136px;font-size:10px;line-height:1.3}}' +
    '@media (pointer:coarse){.fbA-row input,.fbA-row select,.fbA-cl input{font-size:16px;height:34px}.fbA-row button,.fbA-cl button{height:34px}.fbA-row{min-height:40px}}';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function build() {
    var h = '', group = '', body = panel.querySelector('.fbA-body');
    CMD.forEach(function (c) {
      if (c.group !== group) { group = c.group; h += '<div class="fbA-g">' + esc(group.toUpperCase()) + '</div>'; }
      var args = c.args || [], onlyFlag = args.length === 1 && args[0].t === 'bool';
      h += '<div class="fbA-row" data-id="' + c.id + '">';
      if (!args.length) h += '<button class="wide" data-go title="' + c.id + '">' + esc(c.label) + '</button>';
      else {
        h += '<label title="' + esc(usage(c)) + '">' + esc(c.label) + '</label>';
        args.forEach(function (a) {
          if (a.t === 'num') h += '<input type="number" inputmode="decimal" data-arg min="' + a.min + '" max="' + a.max + '" value="' + (a.def === undefined ? '' : a.def) + '" aria-label="' + esc(a.n) + '">';
          else if (a.t === 'pick') h += '<select data-arg aria-label="' + esc(a.n) + '">' + a.opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
        });
        h += onlyFlag ? '<button class="sw" data-go>OFF</button>' : '<button data-go>' + (c.get ? 'Set' : 'Go') + '</button>';
      }
      h += '</div>';
    });
    body.innerHTML = h; refresh();
  }
  function rowArgs(row, c) {
    var raw = [], els = row.querySelectorAll('[data-arg]'), k = 0;
    (c.args || []).forEach(function (a) { if (a.t === 'bool') raw.push(undefined); else raw.push(els[k++].value); });
    return raw;
  }
  function refresh() {
    if (!panel || !shown) return;
    Array.prototype.forEach.call(panel.querySelectorAll('.fbA-row'), function (row) {
      var c = BY[row.getAttribute('data-id')]; if (!c || !c.get) return;
      var cur = c.get(), els = row.querySelectorAll('[data-arg]'), k = 0;
      (c.args || []).forEach(function (a, i) {
        if (a.t === 'bool') { var b = row.querySelector('.sw'); b.textContent = cur[i] ? 'ON' : 'OFF'; b.classList.toggle('on', !!cur[i]); return; }
        var el = els[k++]; if (document.activeElement !== el && !el.dataset.dirty) el.value = cur[i];
      });
    });
  }
  function tick() {
    refresh();
    if (!S.info) { infoBox.classList.remove('on'); return; }
    var b = G.blobs[0], P = me(), e = G.event, lo = LVT[b.level - 1], hi = LVT[b.level];
    infoBox.classList.add('on');
    infoBox.textContent = 'fps ' + fps + '   speed x' + S.speed + (S.god ? '   GOD' : '') + '\n' +
      't ' + G.t.toFixed(1) + '   play ' + Math.round(G.stats.time) + ' s\n' +
      'pos ' + Math.round(P.x) + ', ' + Math.round(P.y) + '   carry ' + P.used + '/' + capOf(P) + '\n' +
      'lvl ' + b.level + '  ' + ((b.mass - lo) / (hi - lo) * 100).toFixed(1) + '%   mass ' + fmt(b.mass) + '\n' +
      'feed ' + fmt(G.rate) + '/s   loot x' + lootMul().toFixed(1) + '\n' +
      'rivals ' + [1, 2, 3].map(function (i) { return (G.blobs[i].mass / Math.max(1, b.mass)).toFixed(2); }).join(' ') + '   leader ' + G.leader + '\n' +
      'items ' + G.items.length + '   parts ' + G.parts.length + '\n' +
      'event ' + (e ? e.type + (e.on ? ' ' + e.t.toFixed(0) + ' s' : ' soon') : 'in ' + Math.max(0, G.nextEvent - G.t).toFixed(0) + ' s') + '\n' +
      'quest ' + G.quest + '   rebirths ' + G.rb + '   stars ' + G.stars;
  }
  function loop(ts) { raf = requestAnimationFrame(loop); frames++; if (ts - fpsT >= 1000) { fps = Math.round(frames * 1000 / (ts - fpsT)); frames = 0; fpsT = ts; } }
  function make() {
    var st = document.createElement('style'); st.id = 'fbA-css'; st.textContent = CSS; document.head.appendChild(st);
    panel = document.createElement('div'); panel.id = 'fbA';
    panel.innerHTML = '<div class="fbA-head"><b>Admin</b><span>' + (window.matchMedia && matchMedia('(pointer:coarse)').matches ? 'tap the level 5x to reopen' : 'F2 opens and closes') + '</span><button data-close aria-label="Close">×</button></div><div class="fbA-body"></div><pre class="fbA-log"></pre>' +
      '<form class="fbA-cl"><input autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="coins 5000  ·  help" aria-label="Command"><button type="submit">Run</button></form>';
    infoBox = document.createElement('div'); infoBox.id = 'fbA-info';
    document.body.appendChild(panel); document.body.appendChild(infoBox);
    // nothing typed or clicked in the menu may reach the game underneath
    ['keydown', 'keyup', 'keypress', 'pointerdown', 'mousedown', 'touchstart', 'wheel', 'contextmenu'].forEach(function (ev) {
      panel.addEventListener(ev, function (e) { if (ev === 'keydown' && e.code === 'Escape') toggle(false); e.stopPropagation(); });
    });
    panel.addEventListener('input', function (e) { if (e.target.dataset && e.target.hasAttribute('data-arg')) e.target.dataset.dirty = '1'; });
    panel.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) return toggle(false);
      if (!e.target.hasAttribute('data-go')) return;
      var row = e.target.closest('.fbA-row'), c = BY[row.getAttribute('data-id')], btn = e.target;
      if (c.sure && !btn.classList.contains('ask')) { btn.dataset.txt = btn.textContent; btn.textContent = 'Sure? Click again'; btn.classList.add('ask'); setTimeout(function () { btn.textContent = btn.dataset.txt; btn.classList.remove('ask'); }, 3000); return; }
      exec(c.id, rowArgs(row, c));
      Array.prototype.forEach.call(row.querySelectorAll('[data-arg]'), function (el) { delete el.dataset.dirty; });
    });
    panel.addEventListener('keydown', function (e) { if (e.code === 'Enter' && e.target.hasAttribute('data-arg')) { e.preventDefault(); e.target.closest('.fbA-row').querySelector('[data-go]').click(); } });
    panel.querySelector('.fbA-cl').addEventListener('submit', function (e) {
      e.preventDefault(); var inp = e.target.querySelector('input'), parts = inp.value.trim().split(/\s+/); if (!parts[0]) return;
      say2('> ' + inp.value.trim()); exec(parts[0].toLowerCase(), parts.slice(1)); inp.value = '';
    });
    build(); say2('Admin menu ready. ' + CMD.length + ' commands, type help for the list.');
    timer = setInterval(tick, 300); raf = requestAnimationFrame(loop);
  }
  function toggle(on) {
    if (!panel) make();
    shown = on === undefined ? !shown : !!on; panel.classList.toggle('on', shown);
    if (shown) refresh(); else if (document.activeElement && panel.contains(document.activeElement)) document.activeElement.blur();
  }
  function lock() {
    var api = window.FBAdmin;
    window.hurt = O.hurt; window.raidHit = O.raidHit; window.step = O.step; window.rewarded = O.rewarded; window.midgame = O.midgame;
    cv.removeEventListener('pointerdown', onMap, true); clearInterval(timer); cancelAnimationFrame(raf);
    if (panel) panel.remove(); if (infoBox) infoBox.remove(); var st = document.getElementById('fbA-css'); if (st) st.remove();
    panel = infoBox = null; shown = false; window.FBAdmin = null;
    if (api && api.onLock) api.onLock();
  }

  window.FBAdmin = { toggle: toggle, isOpen: function () { return shown; }, exec: exec, add: add, state: S, lock: lock, onLock: null };
})();
