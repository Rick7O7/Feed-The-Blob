/* ---------- input, HUD, pop-ups, saving, main loop ---------- */
var JOY = null, KEYS = {}, MOUSE = { down: false, x: 0, y: 0, wx: 0, wy: 0 }, sprintDown = false, paused = false, hudT = 0, lastTs = 0, acc = 0, AWAY = 0, cdT = 0;
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
      skins: G.skins, skin: G.skin, hats: G.hats, hat: G.hat, cd: G.cd, daily: G.daily, mass: G.blobs.map(function (b) { return Math.round(b.mass); }), lvl: G.blobs.map(function (b) { return b.level; }), ts: Date.now(), mute: Snd.muted }));
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
    var el = e.target.closest ? e.target.closest('[data-act]') : null; if (!el || el.disabled) return;
    var p = el.dataset.act.split(':'); Snd.init();
    if (p[0] === 'buy') { if (G.started && !G.modal) { buy(p[1]); hud(); } }
    else if (p[0] === 'mute') { Snd.muted = !Snd.muted; Snd.setMute(Snd.muted); $('mute').classList.toggle('off', Snd.muted); save(); }
    else if (p[0] === 'play') startGame();
    else if (p[0] === 'fresh') { wipe(); newGame(null); AWAY = 0; cam.x = HOMES[0].x; cam.y = HOMES[0].y; startGame(); }
    else if (ACT[p[0]]) ACT[p[0]](p[1]);
  });
  $('mute').classList.toggle('off', Snd.muted);
}
function startGame() {
  if (G.started) return;
  Snd.init(); Snd.setMute(Snd.muted); G.started = true; $('start').classList.add('gone'); lastTs = 0;
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
    if (e.code === 'KeyM' && !e.repeat) { Snd.muted = !Snd.muted; Snd.setMute(Snd.muted); $('mute').classList.toggle('off', Snd.muted); }
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
  document.addEventListener('visibilitychange', function () { if (document.hidden) { paused = true; save(); KEYS = {}; JOY = null; MOUSE.down = false; } else { paused = false; lastTs = 0; } });
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
  $('coins').textContent = fmt(G.coins); $('gems').textContent = fmt(G.gems);
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
  if (G.banner) { if (bn.dataset.t !== G.banner.title) { bn.dataset.t = G.banner.title; $('bt').textContent = G.banner.title; $('bs').textContent = G.banner.sub; $('bt').style.color = G.banner.col; bn.className = ''; void bn.offsetWidth; bn.className = 'show'; } }
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
    h = '<div class="mhead"><b class="gemcount">' + ICON.gem + ' ' + fmt(G.gems) + '</b><div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (m.tab === t[0] ? ' on' : '') + '" data-act="tab:' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><button class="x" data-act="close" aria-label="Close">X</button></div><div class="mbody">';
    if (m.tab === 'skins' || m.tab === 'hats') {
      var list = m.tab === 'skins' ? SKINS : HATS, own = m.tab === 'skins' ? G.skins : G.hats, cur = m.tab === 'skins' ? G.skin : G.hat, act = m.tab === 'skins' ? 'skin' : 'hat';
      h += '<div class="grid">';
      for (i = 0; i < list.length; i++) { var s = list[i], has = own.indexOf(s.id) >= 0; h += '<div class="card' + (cur === s.id ? ' on' : '') + '"><canvas width="160" height="160" data-pv="' + act + ':' + s.id + '"></canvas><b>' + s.name + '</b>' + (cur === s.id ? '<span class="tag">Equipped</span>' : has ? btn(act + ':' + s.id, 'Equip') : btn(act + ':' + s.id, s.price + ' ' + ICON.gem, { off: G.gems < s.price })) + '</div>'; }
      h += '</div>';
    } else if (m.tab === 'boosts') {
      for (i = 0; i < BOOSTS.length; i++) { var bo = BOOSTS[i]; h += '<div class="rowi"><div><b>' + bo.name + '</b><span>' + bo.hint + '</span></div><div class="rbtn">' + adBtn('boostAd:' + bo.id, 'Free', 'b_' + bo.id) + btn('boostGem:' + bo.id, bo.gems + ' ' + ICON.gem, { off: G.gems < bo.gems }) + '</div></div>'; }
    } else {
      h += '<div class="rowi"><div><b>Daily gift</b><span>20 gems, once a day</span></div><div class="rbtn">' + btn('daily', G.daily === today() ? 'Come back tomorrow' : 'Claim', { off: G.daily === today() }) + '</div></div>';
      if (adsOn()) h += '<div class="rowi"><div><b>Free gems</b><span>15 gems per video</span></div><div class="rbtn">' + adBtn('gemAd', 'Watch', 'gems') + '</div></div>';
      h += '<div class="rowi"><div><b>Earn gems by playing</b><span>Quests, boss blobs, level-ups and every rebirth pay gems.</span></div></div>';
      h += '<div class="rowi"><div><b>Buy gems</b><span>Purchases are switched off in this version. A portal has to enable them first.</span></div></div>';
    }
    h += '</div>';
  }
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

/* ---------- main loop ---------- */
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0; lastTs = ts;
  if (G.started && !paused && !Ads.busy && !G.modal) {
    readInput(); if (G.hitStop > 0) G.hitStop -= dt; else acc += dt; var n = 0;
    while (acc >= 1 / 60 && n < 6 && !G.modal) { step(1 / 60); acc -= 1 / 60; n++; }
    if (n === 6 || G.modal) acc = 0;
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; hud(); }
    G.saveT += dt; if (G.saveT > 5) { G.saveT = 0; save(); }
  }
  if (G.modal) { cdT -= dt; if (cdT <= 0) { cdT = 1; tickCooldowns(); } }
  render();
}
function init() {
  cv = $('c'); cx = cv.getContext('2d'); buildSprites();
  try { if (window.matchMedia('(pointer:coarse)').matches) { TOUCH = true; document.body.classList.add('touch'); } } catch (e) { /* no media queries: keyboard layout stays */ }
  var sv = load(); newGame(sv); Snd.muted = !!(sv && sv.mute);
  resize(); window.addEventListener('resize', resize); buildHud(); bindInput();
  if (sv && sv.total > 0) {
    $('play').textContent = 'CONTINUE'; $('fresh').classList.remove('gone');
    var away = Math.min(7200, (Date.now() - (sv.ts || Date.now())) / 1000);
    if (away > 120) AWAY = Math.round(cpsNow() * away * 0.35);
  }
  if (Ads.mode === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) {
    try { window.CrazyGames.SDK.init().then(function () { Ads.sdk = window.CrazyGames.SDK; }).catch(function () { Ads.mode = 'none'; }); } catch (e) { Ads.mode = 'none'; }
  } else if (Ads.mode === 'crazygames') Ads.mode = 'none';
  hud(); requestAnimationFrame(frame);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
