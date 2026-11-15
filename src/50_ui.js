/* ---------- input, HUD, pop-ups, saving, main loop ---------- */
var rawTs = 0, FXDT = 0, JOY = null, KEYS = {}, MOUSE = { down: false, x: 0, y: 0, wx: 0, wy: 0 }, sprintDown = false, paused = false, hudT = 0, lastTs = 0, acc = 0, AWAY = 0, cdT = 0;
var SAVEKEY = 'feedblob.v2';
function $(id) { return document.getElementById(id); }
var ICON = {
  carry: '<svg viewBox="0 0 24 24"><path d="M7.5 8V6.5a4.5 4.5 0 0 1 9 0V8" fill="none" stroke="#3b2a20" stroke-width="2.4"/><rect x="4" y="8" width="16" height="13" rx="4" fill="#c98a5a" stroke="#3b2a20" stroke-width="2.4"/><rect x="8" y="13" width="8" height="5" rx="1.5" fill="#f3d9a4" stroke="#3b2a20" stroke-width="2"/></svg>',
  speed: '<svg viewBox="0 0 24 24"><path d="M3 15c0-3 2-5 5-5l3-5h4l-1 5h3c3 0 4 2 4 5v3H3z" fill="#5aa9ff" stroke="#3b2a20" stroke-width="2.3" stroke-linejoin="round"/><path d="M3 18h18" stroke="#fff" stroke-width="2"/></svg>',
  magnet: '<svg viewBox="0 0 24 24"><path d="M4.5 4v8a7.5 7.5 0 0 0 15 0V4h-5.5v8a2 2 0 0 1-4 0V4z" fill="#ff5b5b" stroke="#3b2a20" stroke-width="2.3" stroke-linejoin="round"/><path d="M4.5 8.5H10M14 8.5h5.5" stroke="#3b2a20" stroke-width="2.3"/><path d="M5.7 5.2h3.1v2.1H5.7zM15.2 5.2h3.1v2.1h-3.1z" fill="#fff"/></svg>',
  stomach: '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="13.5" r="7" fill="#ffc93c" stroke="#3b2a20" stroke-width="2.3"/><circle cx="15.5" cy="9.5" r="6" fill="#ffd95e" stroke="#3b2a20" stroke-width="2.3"/><path d="M15.5 6.8v5.4M12.8 9.5h5.4" stroke="#3b2a20" stroke-width="2.2" stroke-linecap="round"/></svg>',
  appetite: '<svg viewBox="0 0 24 24"><path d="M12 21c-5 0-8.5-3-8.5-7.5S7 5.5 12 5.5s8.5 3.5 8.5 8S17 21 12 21z" fill="#59d16a" stroke="#3b2a20" stroke-width="2.3"/><path d="M12 16.5V9.5M8.8 12.5 12 9.2l3.2 3.3" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  energy: '<svg viewBox="0 0 24 24"><path d="M13.5 2 4.5 14h6l-1.5 8 10-12.5h-6.5z" fill="#ffe14d" stroke="#3b2a20" stroke-width="2.3" stroke-linejoin="round"/></svg>',
  spikes: '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 4.6 4.9-1.5-1.5 4.9L22 12l-4.4 2 1.5 4.9-4.9-1.5L12 22l-2.2-4.6-4.9 1.5 1.5-4.9L2 12l4.4-2-1.5-4.9 4.9 1.5z" fill="#e8e8e8" stroke="#3b2a20" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.4" fill="#59d16a" stroke="#3b2a20" stroke-width="2"/></svg>',
  luck: '<svg viewBox="0 0 24 24"><path d="M12 21.5 2.8 10l4-6h10.4l4 6z" fill="#3fe0ff" stroke="#3b2a20" stroke-width="2.3" stroke-linejoin="round"/><path d="M3.5 10h17M8 4.5l4 5.5 4-5.5" fill="none" stroke="#fff" stroke-width="1.6"/></svg>',
  ad: '<svg class="adi" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3.5" fill="#fff" stroke="#3b2a20" stroke-width="2.3"/><path d="M10 9v6l5.2-3z" fill="#3b2a20"/></svg>',
  gem: '<i class="gemi"></i>', heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5C3 14 3.5 5.5 8.5 5.5c1.8 0 3 1 3.5 2.2.5-1.2 1.7-2.2 3.5-2.2 5 0 5.5 8.5-3.5 15z" stroke="#3b2a20" stroke-width="2.3" stroke-linejoin="round"/></svg>'
};
function save() {
  if (!G || G.auto) return;
  try {
    localStorage.setItem(SAVEKEY, JSON.stringify({ coins: G.coins, total: G.total, gems: G.gems, stars: G.stars, rb: G.rb, up: G.up, stats: G.stats, quest: G.quest, qbase: G.qbase,
      skins: G.skins, skin: G.skin, hats: G.hats, hat: G.hat, cd: G.cd, daily: G.daily, streak: G.streak, mass: G.blobs.map(function (b) { return Math.round(b.mass); }), lvl: G.blobs.map(function (b) { return b.level; }), ts: Date.now(), mute: Snd.muted, musicOff: Snd.musicOff }));
  } catch (e) { /* storage can be unavailable; the game runs without it */ }
}
function load() { try { return JSON.parse(localStorage.getItem(SAVEKEY) || 'null'); } catch (e) { return null; } }
function wipe() { try { localStorage.removeItem(SAVEKEY); } catch (e) { /* nothing to remove */ } }
function mmss(s) { return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2); }

/* ---------- HUD ---------- */
function buildHud() {
  var h = '';
  UKEYS.forEach(function (k, i) { h += '<button class="up pill" data-act="buy:' + k + '"><span class="ic">' + ICON[k] + '</span><span class="nm">' + UPG[k].name + '</span><span class="lv" id="lv-' + k + '"></span><span class="ct"><i class="coin s"></i><b id="ct-' + k + '"></b></span><kbd>' + (i + 1) + '</kbd></button>'; });
  $('shop').innerHTML = h;
  var s = $('sprint');
  s.addEventListener('pointerdown', function (e) { e.preventDefault(); sprintDown = true; IN.lunge = true; try { s.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { s.addEventListener(n, function () { sprintDown = false; }); });
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!(e.target.closest && e.target.closest('#setpop')) && (!el || el.dataset.act !== 'setpop')) $('setpop').classList.add('gone');
    if (!el || el.disabled) return;
    var p = el.dataset.act.split(':'); Snd.init();
    if (/^collect/.test(p[0])) { flyFrom = el.getBoundingClientRect(); flyFromT = performance.now(); }      // coins from a pop-up fly out of the button that was pressed
    if (p[0] === 'buy') { if (G.started && !G.modal) { buy(p[1]); hud(); } }
    else if (p[0] === 'mute') toggleSound('sfx');
    else if (p[0] === 'music') toggleSound('music');
    else if (p[0] === 'setpop') $('setpop').classList.toggle('gone');
    else if (p[0] === 'daily') claimDaily();
    else if (p[0] === 'play') startGame();
    else if (p[0] === 'fresh') { wipe(); newGame(null); AWAY = 0; cam.x = HOMES[0].x; cam.y = HOMES[0].y; startGame(); }
    else if (ACT[p[0]]) ACT[p[0]](p[1]);
  });
  soundUi();
}
function toggleSound(which) {
  if (which === 'music') Snd.musicOff = !Snd.musicOff; else Snd.muted = !Snd.muted;
  Snd.setMute(); soundUi(); save();
  uiToast((which === 'music' ? 'Music ' + (Snd.musicOff ? 'off' : 'on') : 'Sounds ' + (Snd.muted ? 'off' : 'on')));
}
function soundUi() {
  $('mute').classList.toggle('off', Snd.muted && Snd.musicOff); $('mute').classList.toggle('half', Snd.muted !== Snd.musicOff);
  $('tgmus').classList.toggle('on', !Snd.musicOff); $('tgsfx').classList.toggle('on', !Snd.muted);
}
function startGame() {
  if (G.started) return;
  Snd.init(); Snd.setMute(); G.started = true; $('start').classList.add('gone'); document.body.classList.remove('prestart'); lastTs = 0;
  if (AWAY > 0) { G.pend.push({ type: 'away', reward: AWAY }); AWAY = 0; }
  sdkPlay(true); hud();
}
function bindInput() {
  window.addEventListener('keydown', function (e) {
    if (/^(Space|Arrow)/.test(e.code)) e.preventDefault();
    if (!G.started) { if (e.code === 'Enter' || e.code === 'Space') startGame(); return; }
    if (G.modal) { if (e.code === 'Escape' && (G.modal.type === 'shop' || G.modal.type === 'rebirth')) closeModal(); return; }
    if (!KEYS[e.code] && (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight')) IN.lunge = true;
    KEYS[e.code] = true;
    var d = /^Digit([1-8])$/.exec(e.code); if (d && !e.repeat) { buy(UKEYS[+d[1] - 1]); hud(); }
    if (e.code === 'KeyM' && !e.repeat) toggleSound('sfx');
    if (e.code === 'KeyN' && !e.repeat) toggleSound('music');
    if (e.code === 'KeyB' && !e.repeat) ACT.shop('skins');
  });
  window.addEventListener('keyup', function (e) { KEYS[e.code] = false; });
  window.addEventListener('blur', function () { KEYS = {}; JOY = null; MOUSE.down = false; sprintDown = false; });
  cv.addEventListener('pointerdown', function (e) {
    if (!G.started || G.modal) return;
    e.preventDefault();
    if (e.pointerType === 'mouse') {
      if (e.button === 2) { sprintDown = true; IN.lunge = true; }
      else { MOUSE.down = true; MOUSE.x = e.clientX; MOUSE.y = e.clientY; }
      try { cv.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
      return;
    }
    if (!TOUCH) { TOUCH = true; document.body.classList.add('touch'); }
    if (!JOY) { JOY = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ } }
  });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') { MOUSE.x = e.clientX; MOUSE.y = e.clientY; return; }
    if (!JOY || e.pointerId !== JOY.id) return;
    var dx = e.clientX - JOY.ox, dy = e.clientY - JOY.oy, d = hyp(dx, dy), R = 56;
    if (d > R) { JOY.ox += dx / d * (d - R); JOY.oy += dy / d * (d - R); dx = dx / d * R; dy = dy / d * R; }
    JOY.dx = dx; JOY.dy = dy;
  });
  function up(e) {
    if (e.pointerType === 'mouse') { if (e.button === 2) sprintDown = false; else MOUSE.down = false; return; }
    if (JOY && e.pointerId === JOY.id) JOY = null;
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { paused = true; save(); KEYS = {}; JOY = null; MOUSE.down = false; if (Snd.ctx) Snd.ctx.suspend(); }
    else { paused = false; lastTs = 0; if (Snd.ctx && G.started) Snd.ctx.resume(); }
  });
  window.addEventListener('pagehide', save);
}
function readInput() {
  var x = 0, y = 0, P = G.actors[0];
  if (KEYS.KeyA || KEYS.ArrowLeft) x -= 1; if (KEYS.KeyD || KEYS.ArrowRight) x += 1;
  if (KEYS.KeyW || KEYS.ArrowUp) y -= 1; if (KEYS.KeyS || KEYS.ArrowDown) y += 1;
  if (MOUSE.down) {         // hold the left mouse button: the collector walks to the pointer
    var z = SC * (1 - 0.05 * ZB); MOUSE.wx = cam.x + (MOUSE.x - VW / 2) / z; MOUSE.wy = cam.y + (MOUSE.y - VH / 2) / z;
    if (!x && !y) { var mx = MOUSE.wx - P.x, my = MOUSE.wy - P.y, md = hyp(mx, my); if (md > 12) { var f = Math.min(1, md / 70) / md; x = mx * f; y = my * f; } }
  }
  if (JOY) { var jx = JOY.dx / 56, jy = JOY.dy / 56, jl = hyp(jx, jy); if (jl > 0.16) { var g = Math.min(1, (jl - 0.16) / 0.6) / jl; x = jx * g; y = jy * g; } }
  IN.x = x; IN.y = y; IN.sprint = !!(KEYS.ShiftLeft || KEYS.ShiftRight || KEYS.Space || sprintDown);
}
function hud() {
  var P = G.actors[0], b = G.blobs[0], i, k, h;
  $('shopbtn').classList.toggle('gift', G.daily !== today());
  var c = cpsNow(); $('cps').textContent = '+' + (c < 10 ? c.toFixed(1) : fmt(c)) + '/s';
  $('lvlname').textContent = 'Lv ' + b.level + ' ' + lvName(b.level) + (G.stars ? '  ★' + G.stars : '');
  var lo = LVT[b.level - 1], hi = LVT[b.level]; $('lvlfill').style.width = clamp((b.mass - lo) / (hi - lo) * 100, 0, 100) + '%';
  for (i = 0; i < UKEYS.length; i++) {
    k = UKEYS[i]; var n = G.up[k], max = n >= UPG[k].max, ct = cost(k), el = document.querySelector('.up[data-act="buy:' + k + '"]');
    $('lv-' + k).textContent = max ? 'MAX' : 'Lv ' + n; $('ct-' + k).textContent = max ? '' : fmt(ct);
    el.classList.toggle('can', !max && G.coins >= ct); el.classList.toggle('max', max);
  }
  var cap = capOf(P); $('carrytxt').textContent = P.used + '/' + cap; $('carry').classList.toggle('full', P.used >= cap);
  var ord = G.blobs.slice().sort(function (p, q) { return q.mass - p.mass; }); h = '';
  for (i = 0; i < 4; i++) h += '<span class="' + (ord[i].id ? '' : 'me') + '"><i style="background:' + COLORS[ord[i].id] + '"></i>' + (i === 0 ? '♛ ' : '') + fmt(ord[i].mass) + '</span>';
  $('rank').innerHTML = h;
  h = ''; for (i = 0; i < 3; i++) h += '<span class="hp' + (i < G.hp ? ' on' : '') + '">' + ICON.heart + '</span>'; $('hearts').innerHTML = h;
  var fv = $('fever'); if (G.fever >= 1 || G.leader === 0) { fv.classList.remove('gone'); $('fevertxt').textContent = (G.leader === 0 ? '♛ ' : '') + 'x' + (feverMul() * (G.leader === 0 ? 1.25 : 1)).toFixed(1); fv.classList.toggle('hot', G.fever > 60); } else fv.classList.add('gone');
  h = ''; if (G.boost.x2 > 0) h += '<span class="chip">2x ' + mmss(G.boost.x2) + '</span>'; if (P.starT > 0) h += '<span class="chip">Magnet ' + mmss(P.starT) + '</span>'; if (b.shield > 0) h += '<span class="chip">Shield ' + mmss(b.shield) + '</span>';
  $('chips').innerHTML = h;
  $('rebirthbtn').classList.toggle('gone', !canRebirth());
  var q = curQuest(), qe = $('quest');
  if (G.questPop > 0) { qe.className = 'pill done'; $('qtxt').textContent = 'Done: ' + G.questDone.text; $('qnum').innerHTML = (G.questDone.coin ? '+' + fmt(G.questDone.coin) + ' ' : '') + (G.questDone.gems ? '+' + G.questDone.gems + ' ' + ICON.gem : ''); }
  else { qe.className = 'pill'; $('qtxt').textContent = q.text; $('qnum').innerHTML = Math.min(q.cur, q.need) + '/' + q.need + (q.gems ? ' &nbsp;' + q.gems + ' ' + ICON.gem : ''); }
  var e = G.event, ev = $('ev');
  if (e && e.on) { ev.className = 'pill'; ev.style.background = EV[e.type].col; $('evtxt').textContent = EV[e.type].title; $('evfill').style.width = clamp((1 - e.t / EV[e.type].dur) * 100, 0, 100) + '%'; }
  else ev.className = 'pill gone';
  var bn = $('banner');
  if (G.banner) { if (bn.dataset.t !== G.banner.title) { bn.dataset.t = G.banner.title; $('bicon').innerHTML = EVICON[evKey(G.banner.title)]; $('bt').textContent = G.banner.title; $('bs').textContent = G.banner.sub; $('bt').style.color = G.banner.col; $('bbar').style.background = G.banner.col; bn.className = ''; void bn.offsetWidth; bn.className = 'show'; } }
  else if (bn.className) { bn.className = ''; bn.dataset.t = ''; }
  $('sprintfill').style.height = (P.stam / stamMax(P) * 100) + '%'; $('sprint').classList.toggle('tired', P.tired > 0 || P.stam < 22);
  if (G.t > 45 && !$('keys').classList.contains('gone')) $('keys').classList.add('gone');
}

/* ---------- pop-ups ---------- */
function btn(act, label, opt) { return '<button class="btn' + (opt && opt.cls ? ' ' + opt.cls : '') + '" data-act="' + act + '"' + (opt && opt.off ? ' disabled' : '') + '>' + label + '</button>'; }
function adBtn(act, label, key) {       // a rewarded-ad button always shows the video icon; with a running cooldown it shows the time instead
  if (!adsOn()) return '';
  var cd = key ? cdLeft(key) : 0;
  return '<button class="btn" data-act="' + act + '"' + (cd ? ' disabled' : '') + '>' + ICON.ad + ' <span' + (key ? ' data-cd="' + key + '" data-label="' + label + '"' : '') + '>' + (cd ? 'Ad again in ' + mmss(cd) : label) + '</span></button>';
}
function drawPreview(cnv, fn) { var old = cx; cx = cnv.getContext('2d'); cx.setTransform(2, 0, 0, 2, 0, 0); cx.clearRect(0, 0, 80, 80); cx.lineJoin = 'round'; cx.lineCap = 'round'; fn(); cx = old; }
function uiModal() {
  var m = G.modal, box = $('modal'), h = '', i;
  if (!m) { box.classList.add('gone'); return; }
  box.classList.remove('gone');
  if (m.type === 'levelup' || m.type === 'away') {
    h = m.type === 'away' ? '<h2>WELCOME BACK</h2><p>Your blob kept snacking while you were away.</p>' : '<h2>LEVEL ' + m.level + '!</h2><p>Your blob evolved into <b>' + lvName(m.level) + '</b>. Loot is now worth 50% more. +2 ' + ICON.gem + '</p>';
    h += '<div class="reward"><i class="coin"></i> ' + fmt(m.reward) + '</div><div class="btns">' + adBtn('collectAd', 'Collect x3') + btn('collect', 'Collect') + btn('collectGem', 'Collect x3 for 5 ' + ICON.gem, { off: G.gems < 5 }) + '</div>';
  } else if (m.type === 'ko') {
    h = '<h2>KNOCKED OUT</h2><p>Respawning at home drops everything you carry and resets your fever bonus.</p><div class="btns">' + (m.offer ? adBtn('reviveAd', 'Revive right here') : '') + btn('respawn', 'Respawn at home') + btn('reviveGem', 'Revive right here for 15 ' + ICON.gem, { off: G.gems < 15 }) + '</div>';
    if (!m.offer && adsOn()) h += '<p class="note">Ad revive is back in ' + mmss(cdLeft('revive')) + '.</p>';
  } else if (m.type === 'rebirth') {
    var st = rebirthGain(), st2 = Math.ceil(st * 1.5);
    h = '<h2>REBIRTH</h2><p>Start again in a new world with tougher rivals. Coins, upgrades and blob size reset. You keep gems, skins and stars.</p><div class="reward">★ +' + st + ' stars = +' + st * 20 + '% coins and growth, forever</div><div class="btns">' +
      adBtn('rebirthAd', 'Rebirth with ' + st2 + ' stars') + btn('rebirth', 'Rebirth with ' + st + ' stars') + btn('rebirthGem', 'Rebirth with ' + st2 + ' stars for 20 ' + ICON.gem, { off: G.gems < 20 }) + btn('close', 'Not yet') + '</div>';
  } else if (m.type === 'shop') {
    var tabs = [['skins', 'Skins'], ['hats', 'Hats'], ['boosts', 'Boosts'], ['gems', 'Gems']];
    h = '<div class="mhead"><span class="gemcount">' + ICON.gem + ' <b>' + fmt(SHOW.g + 0.001) + '</b></span><div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (m.tab === t[0] ? ' on' : '') + (t[0] === 'gems' && G.daily !== today() ? ' gift' : '') + '" data-act="tab:' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><button class="x" data-act="close" aria-label="Close">X</button></div><div class="mbody">';
    if (m.tab === 'skins' || m.tab === 'hats') {
      var list = m.tab === 'skins' ? SKINS : HATS, own = m.tab === 'skins' ? G.skins : G.hats, cur = m.tab === 'skins' ? G.skin : G.hat, act = m.tab === 'skins' ? 'skin' : 'hat';
      h += '<div class="grid">';
      for (i = 0; i < list.length; i++) { var s = list[i], has = own.indexOf(s.id) >= 0; h += '<div class="card' + (cur === s.id ? ' on' : '') + '"><canvas width="160" height="160" data-pv="' + act + ':' + s.id + '"></canvas><b>' + s.name + '</b>' + (cur === s.id ? '<span class="tag">Equipped</span>' : has ? btn(act + ':' + s.id, 'Equip') : btn(act + ':' + s.id, s.price + ' ' + ICON.gem, { off: G.gems < s.price })) + '</div>'; }
      h += '</div>';
    } else if (m.tab === 'boosts') {
      for (i = 0; i < BOOSTS.length; i++) { var bo = BOOSTS[i]; h += '<div class="rowi"><div><b>' + bo.name + '</b><span>' + bo.hint + '</span></div><div class="rbtn">' + adBtn('boostAd:' + bo.id, 'Free', 'b_' + bo.id) + btn('boostGem:' + bo.id, bo.gems + ' ' + ICON.gem, { off: G.gems < bo.gems }) + '</div></div>'; }
    } else {
      h += streakRow();
      if (adsOn()) h += '<div class="rowi"><div><b>Free gems</b><span>15 gems per video</span></div><div class="rbtn">' + adBtn('gemAd', 'Watch', 'gems') + '</div></div>';
      h += '<div class="rowi"><div><b>Earn gems by playing</b><span>Quests, boss blobs, level-ups and every rebirth pay gems.</span></div></div>';
      h += '<div class="rowi"><div><b>Buy gems</b><span>Purchases are switched off in this version. A portal has to enable them first.</span></div></div>';
    }
    h += '</div>';
  }
  if (m.type === 'levelup' || m.type === 'rebirth') h = '<div class="rays"></div>' + h;
  $('mcard').innerHTML = h; $('mcard').className = 'pill ' + m.type;
  Array.prototype.forEach.call(document.querySelectorAll('canvas[data-pv]'), function (cnv) {
    var p = cnv.dataset.pv.split(':');
    drawPreview(cnv, function () {
      if (p[0] === 'skin') drawBlobBody(40, 42, 27, findIn(SKINS, p[1]), 0, 1, 0, 1, 0, 1, 3, 0);
      else { cx.save(); cx.translate(40, 50); cx.scale(1.25, 1.25); cx.beginPath(); cx.arc(0, 0, 17, 0, TAU); cx.fillStyle = COLORS[0]; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke(); for (var s = -1; s <= 1; s += 2) { cx.beginPath(); cx.arc(s * 6.2, -2, 5, 0, TAU); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 1.6; cx.stroke(); cx.beginPath(); cx.arc(s * 6.2, -1, 2.4, 0, TAU); cx.fillStyle = INK; cx.fill(); } drawHat(p[1], 17); cx.restore(); }
    });
  });
}
function tickCooldowns() {
  Array.prototype.forEach.call(document.querySelectorAll('[data-cd]'), function (el) {
    var cd = cdLeft(el.dataset.cd), b = el.closest('button'); el.textContent = cd ? 'Ad again in ' + mmss(cd) : el.dataset.label; if (b) b.disabled = cd > 0;
  });
}
var toastT = null;
function uiToast(msg) { var t = $('toast'); t.textContent = msg; t.classList.remove('gone'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('gone'); }, 2400); }
function uiAd(on) { $('adov').classList.toggle('gone', !on); if (on) { $('adtitle').textContent = 'Loading ad'; $('adsub').textContent = ''; } }
function uiTestAd(kind, done) {      // stands in for a real video while the game is not on a portal
  var left = 3; $('adtitle').textContent = 'TEST AD'; $('adsub').textContent = kind + '. On a portal a real ad plays here. ' + left;
  var iv = setInterval(function () { left--; $('adsub').textContent = kind + '. On a portal a real ad plays here. ' + Math.max(0, left); if (left <= 0) { clearInterval(iv); done(true); } }, 1000);
}

/* ---------- event banner icons ---------- */
var EVICON = {
  gold: '<svg viewBox="0 0 48 48"><circle cx="30" cy="16" r="9" fill="#ff9f2e" stroke="#3b2a20" stroke-width="3"/><path d="M24 22 13 33" stroke="#ffd23c" stroke-width="5" stroke-linecap="round"/><ellipse cx="17" cy="38" rx="12" ry="5" fill="#e09a12" stroke="#3b2a20" stroke-width="3"/><ellipse cx="17" cy="33" rx="12" ry="5" fill="#ffc93c" stroke="#3b2a20" stroke-width="3"/><ellipse cx="17" cy="28" rx="12" ry="5" fill="#ffd95e" stroke="#3b2a20" stroke-width="3"/></svg>',
  boss: '<svg viewBox="0 0 48 48"><path d="M6 40c-2-14 6-30 18-30s20 16 18 30z" fill="#b65cff" stroke="#3b2a20" stroke-width="3" stroke-linejoin="round"/><path d="M13 20l8 4M35 20l-8 4" stroke="#3b2a20" stroke-width="3.4" stroke-linecap="round"/><circle cx="18" cy="27" r="3.5" fill="#fff" stroke="#3b2a20" stroke-width="2"/><circle cx="30" cy="27" r="3.5" fill="#fff" stroke="#3b2a20" stroke-width="2"/><path d="M15 35h18l-3 4-3-3-3 3-3-3-3 3z" fill="#fff" stroke="#3b2a20" stroke-width="2" stroke-linejoin="round"/></svg>',
  frenzy: '<svg viewBox="0 0 48 48"><path d="M27 3 9 27h12l-3 18 21-26H26z" fill="#ff5b8a" stroke="#3b2a20" stroke-width="3" stroke-linejoin="round"/><path d="M4 14h7M2 22h6M38 33h7M40 41h6" stroke="#3b2a20" stroke-width="3" stroke-linecap="round"/></svg>',
  lowgrav: '<svg viewBox="0 0 48 48"><circle cx="24" cy="30" r="11" fill="#6ce0ff" stroke="#3b2a20" stroke-width="3"/><circle cx="20" cy="27" r="3" fill="#fff"/><path d="M10 12l5-6 5 6M28 10l5-6 5 6" fill="none" stroke="#3b2a20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6v10M33 4v10" stroke="#3b2a20" stroke-width="3" stroke-linecap="round"/></svg>',
  tornado: '<svg viewBox="0 0 48 48"><path d="M5 8h38M9 17h30M14 26h20M18 34h12M22 42h5" stroke="#3b2a20" stroke-width="7" stroke-linecap="round"/><path d="M5 8h38M9 17h30M14 26h20M18 34h12M22 42h5" stroke="#8cf58a" stroke-width="3.4" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 48 48"><path d="M24 3l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 18l14-2z" fill="#fff36b" stroke="#3b2a20" stroke-width="3" stroke-linejoin="round"/></svg>'
};
function evKey(title) { for (var k in EV) if (EV[k].title === title) return k; return 'star'; }

/* ---------- daily streak: a 7-day row, the claim sends gems flying into the counter ---------- */
function streakRow() {
  var got = G.daily === today(), cur = got ? G.streak : dailyDay(), pos = (cur - 1) % 7 + 1, h = '', j;
  for (j = 1; j <= 7; j++) {
    var done = got ? j <= pos : j < pos, here = j === pos;
    h += '<div class="day' + (done ? ' done' : '') + (here ? (got ? ' today' : ' next') : '') + (j === 7 ? ' d7' : '') + '"><small>Day ' + j + '</small><i class="gemi"></i><b>' + DAILY[j - 1] + '</b>' + (done ? '<em>✓</em>' : '') + '</div>';
  }
  var sub = got ? 'Day ' + G.streak + ' in a row. Come back tomorrow for ' + DAILY[G.streak % 7] + ' gems.' : cur > 1 ? 'Day ' + cur + ' in a row. Miss a day and the streak starts again.' : 'Come back every day: day 7 pays 100 gems.';
  return '<div class="streak"><div class="sh"><b>Daily gift</b><span>' + sub + '</span></div><div class="days">' + h + '</div>' +
    btn('daily', got ? 'Come back tomorrow' : 'Claim ' + dailyNext() + ' ' + ICON.gem, { off: got, cls: got ? '' : 'claim' }) + '</div>';
}
function claimDaily() {
  if (G.daily === today()) return;
  var cell = document.querySelector('.day.next'), r = cell ? cell.getBoundingClientRect() : null, n = dailyNext();
  ACT.daily(); SHOW.lock = true; setTimeout(function () { SHOW.lock = false; }, 2500);   // safety: the counter never stays frozen
  var st = document.querySelector('.day.today'); if (st) st.classList.add('stamp');
  if (r) flyBurst(r, 'gem', Math.min(14, 4 + Math.round(n / 10)), function () { SHOW.lock = false; });
  if (n >= 100) Snd.fanfare();
}

/* ---------- flying coins and gems: DOM icons above everything, so they also cross pop-ups ---------- */
var FLY = 0, FLYMAX = 26, flyFrom = null, flyFromT = 0, SHOW = { c: 0, g: 0, lock: false, lc: '', lg: '' }, WATCH = null;
function flyTarget(kind) {
  if (kind === 'gem') { var gc = G.modal && document.querySelector('.gemcount .gemi'); return gc || $('gembox').querySelector('.gemi'); }
  return $('coinbox').querySelector('.coin');
}
function flyOne(x, y, kind, delay, done) {
  if (FLY >= (LOWFX ? 8 : FLYMAX)) { if (done) done(); return; }
  var tg = flyTarget(kind); if (!tg) { if (done) done(); return; }
  var tr = tg.getBoundingClientRect(), tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
  if (!tr.width) { if (done) done(); return; }
  var el = document.createElement('i'); el.className = 'fl ' + (kind === 'gem' ? 'gemi' : 'coin'); el.style.left = x + 'px'; el.style.top = y + 'px';
  $('fly').appendChild(el); FLY++;
  var dx = tx - x, dy = ty - y, mx = dx * 0.35 + (Math.random() - 0.5) * 140, my = dy * 0.35 - 40 - Math.random() * 70, rot = kind === 'gem' ? 45 : 0;
  var a = el.animate([
    { transform: 'translate(-50%,-50%) translate(0,0) scale(.4) rotate(' + rot + 'deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) translate(' + mx + 'px,' + my + 'px) scale(1.15) rotate(' + rot + 'deg)', opacity: 1, offset: 0.35 },
    { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(.75) rotate(' + rot + 'deg)', opacity: 1 }
  ], { duration: 620 + Math.random() * 180, delay: delay || 0, easing: 'cubic-bezier(.45,0,.75,1)', fill: 'both' });
  a.onfinish = function () {
    el.remove(); FLY--;
    var box = kind === 'gem' ? (G.modal && document.querySelector('.gemcount')) || $('gembox') : $('coinbox');
    box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); Snd.tick(FLY);
    if (done) done();
  };
}
function flyBurst(r, kind, n, done) {
  if (LOWFX) n = Math.ceil(n / 2);
  var left = n, cb = function () { if (--left === 0 && done) done(); };
  for (var i = 0; i < n; i++) flyOne(r.left + r.width / 2 + (Math.random() - 0.5) * r.width * 0.6, r.top + r.height / 2 + (Math.random() - 0.5) * r.height * 0.4, kind, i * 45, cb);
}
// watches the game state once per frame and turns changes into effects: coin/gem flights, raid impacts, the level-up moment
function watchFx(dt) {
  var b0 = G.blobs[0], P = G.actors[0], i;
  if (!WATCH || G.auto) { WATCH = { c: G.coins, g: G.gems, lvl: b0.level, hits: G.blobs.map(function (b) { return b.hits; }), pc: 0, pg: 0, t: 0, rb: G.rb }; return; }
  var w = WATCH; w.t -= dt;
  if (G.rb !== w.rb || b0.level < w.lvl) { w.rb = G.rb; w.lvl = b0.level; }
  if (b0.level > w.lvl) {        // one moment at a time, and only for a real single step (admin or test jumps stay quiet)
    if (b0.level === w.lvl + 1) { FX = FX.filter(function (f) { return f.type !== 'lvl'; }); fxAdd({ type: 'lvl', dur: 1.9, level: b0.level, name: lvName(b0.level) }); }
    w.lvl = b0.level;
  }
  for (i = 1; i < 4; i++) { var b = G.blobs[i]; if (b.hits > w.hits[i]) { var dx = P.x - b.x, dy = P.y - b.y, d = hyp(dx, dy) + 0.01; fxAdd({ type: 'hit', dur: b.hits >= 3 ? 0.7 : 0.45, x: b.x, y: b.y, r: b.r, n: b.hits, hx: dx / d * b.r * 0.85, hy: dy / d * b.r * 0.85, hr: 38, rot: Math.random() }); } w.hits[i] = b.hits; }
  if (G.coins > w.c) w.pc += G.coins - w.c; w.c = G.coins;
  if (G.gems > w.g) w.pg += G.gems - w.g; w.g = G.gems;
  if (w.t > 0 || !G.started || (!w.pc && !w.pg)) return;
  w.t = 0.12;
  var src;
  if (flyFrom && performance.now() - flyFromT < 6000) { src = flyFrom; flyFrom = null; flyBurst(src, 'coin', 8); if (w.pg) flyBurst(src, 'gem', Math.min(6, w.pg)); w.pc = w.pg = 0; return; }
  if (G.questPop > 2.3 && !$('quest').classList.contains('gone')) src = $('quest').getBoundingClientRect();
  else { var at = b0.mouthT > 0 && onScreen(b0.x, b0.y) ? w2s(b0.x, b0.y - b0.r * 0.3) : w2s(P.x, P.y - 20); src = { left: at.x - 20, top: at.y - 20, width: 40, height: 40 }; }
  if (w.pc) { var big = w.pc / Math.max(1, cpsNow()); flyBurst(src, 'coin', clamp(Math.round(Math.log(1 + big) * 1.3), 1, 7)); }
  if (w.pg) flyBurst(src, 'gem', Math.min(6, w.pg));
  w.pc = w.pg = 0;
}
// HUD numbers count up smoothly instead of jumping; spending snaps down at once
function hudAnim(dt) {
  if (!G) return;
  var k = Math.min(1, dt * 7);
  if (G.coins < SHOW.c || G.coins - SHOW.c < 1) SHOW.c = G.coins; else SHOW.c += (G.coins - SHOW.c) * k;
  if (!SHOW.lock) { if (G.gems < SHOW.g || G.gems - SHOW.g < 0.5) SHOW.g = G.gems; else SHOW.g += (G.gems - SHOW.g) * k * 0.8; }
  var c = fmt(SHOW.c), g = fmt(SHOW.g + 0.001);
  if (c !== SHOW.lc) { SHOW.lc = c; $('coins').textContent = c; }
  if (g !== SHOW.lg) { SHOW.lg = g; $('gems').textContent = g; var gc = G.modal && document.querySelector('.gemcount b'); if (gc) gc.textContent = g; }
}

/* ---------- main loop ---------- */
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0, rdt = rawTs ? Math.min(0.1, (ts - rawTs) / 1000) : 0; lastTs = ts; rawTs = ts;
  if (G.started && !paused && !Ads.busy && !G.modal) {
    readInput(); if (G.hitStop > 0) G.hitStop -= dt; else acc += dt; var n = 0;
    while (acc >= 1 / 60 && n < 6 && !G.modal) { step(1 / 60); acc -= 1 / 60; n++; }
    if (n === 6 || G.modal) acc = 0;
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; hud(); }
    G.saveT += dt; if (G.saveT > 5) { G.saveT = 0; save(); }
  }
  if (G.modal) { cdT -= dt; if (cdT <= 0) { cdT = 1; tickCooldowns(); } }
  if (rdt > 0) { FRAMEMS += (rdt * 1000 - FRAMEMS) * 0.03; LOWFX = LOWFX ? FRAMEMS > 21 : FRAMEMS > 25; }
  FXDT = paused || Ads.busy ? 0 : rdt; watchFx(rdt); hudAnim(rdt);
  if (!G.started) drawHero($('hero'), ts);
  render();
}
function init() {
  cv = $('c'); cx = cv.getContext('2d'); buildSprites(); document.body.classList.add('prestart');
  try { if (window.matchMedia('(pointer:coarse)').matches) { TOUCH = true; document.body.classList.add('touch'); } } catch (e) { /* no media queries: keyboard layout stays */ }
  var sv = load(); newGame(sv); Snd.muted = !!(sv && sv.mute); Snd.musicOff = !!(sv && sv.musicOff); SHOW.c = G.coins; SHOW.g = G.gems;
  resize(); window.addEventListener('resize', resize); buildHud(); bindInput();
  if (sv && sv.total > 0) {
    $('play').innerHTML = '<span class="tri"></span>CONTINUE'; $('fresh').classList.remove('gone');
    var away = Math.min(7200, (Date.now() - (sv.ts || Date.now())) / 1000);
    if (away > 120) AWAY = Math.round(cpsNow() * away * 0.35);
  }
  if (Ads.mode === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) {
    try { window.CrazyGames.SDK.init().then(function () { Ads.sdk = window.CrazyGames.SDK; }).catch(function () { Ads.mode = 'none'; }); } catch (e) { Ads.mode = 'none'; }
  } else if (Ads.mode === 'crazygames') Ads.mode = 'none';
  hud(); requestAnimationFrame(frame);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
