/* ---------- chaos events: one every 30 to 45 seconds for the whole arena ---------- */
var EV = {
  gold: { title: 'GOLD RUSH', sub: 'Golden loot and meteors!', dur: 14, col: '#ffc93c',
    start: function (e) { e.data.next = 0.4; },
    upd: function (e, dt) { e.data.next -= dt; if (e.data.next <= 0) { e.data.next = rand(1.1, 2); var P = G.actors[0]; G.meteors.push({ x: clamp(P.x + rand(-520, 520), 160, W - 160), y: clamp(P.y + rand(-380, 380), 160, H - 160), t: 1.3, max: 1.3 }); } } },
  boss: { title: 'BOSS BLOB', sub: 'Lunge into it to pop it!', dur: 28, col: '#b65cff',
    start: function () {
      var hp = Math.min(9, 3 + Math.floor(G.blobs[0].level / 2));
      G.boss = { x: W / 2, y: -150, vx: 0, vy: 0, r: 88, hp: hp, max: hp, stun: 0, hitCd: 0, wob: 0, last: null, dead: false, eaten: 0 };
    },
    upd: function (e, dt) { if (updBoss(dt)) e.done = true; },
    end: function () { var b = G.boss; if (b && !b.dead) { say(b.x, b.y - b.r, 'BURP!', '#e0b3ff', 30); for (var i = 0; i < 20; i++) part(b.x, b.y, rand(-200, 200), rand(-260, 60), rand(0.4, 0.8), '#b65cff', rand(5, 9), 300); } G.boss = null; } },
  frenzy: { title: 'SPEED FRENZY', sub: 'Endless energy, coins x1.5!', dur: 12, col: '#ff5b8a' },
  lowgrav: { title: 'LOW GRAVITY', sub: 'Carry twice as much!', dur: 15, col: '#6ce0ff',
    start: function () { G.grav = 170; }, end: function () { G.grav = 900; } },
  tornado: { title: 'LOOT TORNADO', sub: 'Everything swirls to one spot!', dur: 11, col: '#8cf58a',
    start: function (e) { e.data.x = rand(W * 0.35, W * 0.65); e.data.y = rand(H * 0.35, H * 0.65); } }
};
function nextEventType() {
  G.evCount++;
  if (G.evForce) { var f = G.evForce; G.evForce = null; return f; }
  if (G.evCount === 1) return 'gold';
  if (G.evCount === 2) return 'boss';
  if (!G.evBag.length) G.evBag = ['gold', 'boss', 'frenzy', 'lowgrav', 'tornado'].sort(function () { return rnd() - 0.5; });
  return G.evBag.pop();
}
function updEvents(dt) {
  var e = G.event, i, k;
  if (!e) { if (G.t >= G.nextEvent) { var ty = nextEventType(); G.event = { type: ty, t: 0, pre: 2.4, on: false, done: false, data: {} }; G.banner = { title: EV[ty].title, sub: EV[ty].sub, col: EV[ty].col, t: 4.2 }; Snd.siren(); } }
  else if (!e.on) { e.pre -= dt; if (e.pre <= 0) { e.on = true; if (EV[e.type].start) EV[e.type].start(e); G.shake = 6; } }
  else {
    e.t += dt; if (EV[e.type].upd) EV[e.type].upd(e, dt);
    if (e.t >= EV[e.type].dur || e.done) { if (EV[e.type].end) EV[e.type].end(e); G.event = null; G.nextEvent = G.t + rand(26, 40); }
  }
  for (i = G.meteors.length - 1; i >= 0; i--) {
    var m = G.meteors[i]; m.t -= dt;
    if (m.t <= 0) {
      G.meteors.splice(i, 1); shock(m.x, m.y, 200, 620); burst(m.x, m.y, 11, 'gold', 300);
      for (k = 0; k < 4; k++) { var a = G.actors[k]; if (hyp(a.x - m.x, a.y - m.y) < 120 && (a.bot || G.stats.time > 150)) hurt(a, 1, m.x, m.y); }   // newcomers get a grace period
      if (onScreen(m.x, m.y)) { Snd.boom(); G.shake = 12; for (k = 0; k < 26; k++) part(m.x, m.y, rand(-380, 380), rand(-380, 120), rand(0.4, 0.9), pick(['#ffc93c', '#ff9f2e', '#fff3b0']), rand(4, 9), 500); }
    }
  }
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
}
function updBoss(dt) {
  var b = G.boss, i, k; if (!b) return true;
  if (b.stun > 0) b.stun -= dt; if (b.hitCd > 0) b.hitCd -= dt; b.wob += dt;
  var tgt = null, best = 0.5;
  for (i = 0; i < 4; i++) { var a = G.actors[i], sc = a.used + (i ? 0 : 1.5) - hyp(a.x - b.x, a.y - b.y) / 900; if (a.used > 0 && sc > best) { best = sc; tgt = a; } }
  var tx = W / 2, ty = H / 2;
  if (tgt) { tx = tgt.x; ty = tgt.y; } else { var it = null, bd = 1e9; for (i = 0; i < G.items.length; i += 3) { var q = G.items[i]; if (q.state === 1) { var dq = hyp(q.x - b.x, q.y - b.y); if (dq < bd) { bd = dq; it = q; } } } if (it) { tx = it.x; ty = it.y; } }
  var dx = tx - b.x, dy = ty - b.y, d = hyp(dx, dy) + 0.01, sp = b.stun > 0 ? 0 : Math.min(170, 112 + 6 * Math.min(G.blobs[0].level, 10)), t = 1 - Math.exp(-2.5 * dt);
  b.vx = lerp(b.vx, dx / d * sp, t); b.vy = lerp(b.vy, dy / d * sp, t); b.x += b.vx * dt; b.y += b.vy * dt;
  for (i = G.items.length - 1; i >= 0; i--) { var g = G.items[i]; if (g.state === 1 && hyp(g.x - b.x, g.y - b.y) < b.r + 4) { G.items.splice(i, 1); b.eaten++; b.r = Math.min(132, b.r + 0.18); if (onScreen(b.x, b.y) && rnd() < 0.3) splat(g.x, g.y, '#b65cff', 2); } }
  for (i = 0; i < 4; i++) {
    var c = G.actors[i], ex = c.x - b.x, ey = c.y - b.y, ed = hyp(ex, ey) + 0.01;
    if (ed > b.r + c.r) continue;
    c.x = b.x + ex / ed * (b.r + c.r + 1); c.y = b.y + ey / ed * (b.r + c.r + 1);
    if (c.atk > 0 && b.hitCd <= 0) {
      b.hp--; b.stun = 0.7; b.hitCd = 0.4; b.last = c; c.vx = ex / ed * 540; c.vy = ey / ed * 540; c.lunge = 0; c.atk = 0; c.stun = 0.15;
      if (onScreen(b.x, b.y)) { Snd.hit(); G.shake = 11; say(b.x, b.y - b.r - 20, 'POW!', '#ffffff', 30); for (k = 0; k < 14; k++) part(c.x, c.y, rand(-260, 260), rand(-260, 80), rand(0.3, 0.6), '#e0b3ff', rand(4, 8), 400); }
      if (b.hp <= 0) {
        b.dead = true; var lvl = Math.min(G.blobs[0].level, 12);
        burst(b.x, b.y, 40 + 5 * lvl + Math.min(40, b.eaten), function () { return rnd() < 0.3 ? 'gem' : rnd() < 0.5 ? 'gold' : rollKind(); }, 520);
        shock(b.x, b.y, 300, 500); Snd.boom(); G.shake = 16; G.flash = 0.5;
        for (k = 0; k < 50; k++) part(b.x, b.y, rand(-460, 460), rand(-460, 200), rand(0.5, 1.2), pick(['#b65cff', '#e0b3ff', '#fff']), rand(5, 11), 500);
        if (b.last && !b.last.bot) { var bonus = Math.round(60 * lootMul() * coinMul()); addCoins(bonus); G.gems += 3; G.stats.bosses++; Snd.gem(); say(b.x, b.y - b.r - 50, 'BOSS POPPED! +' + fmt(bonus) + ' and 3 gems', '#ffd23c', 28); }
        else say(b.x, b.y - b.r - 50, NAMES[b.last ? b.last.id : 1] + ' popped the boss!', '#ffffff', 24);
        return true;
      }
    } else if (c.atk <= 0 && (c.bot ? c.immune <= 0 : c.inv <= 0)) {
      if (c.used > 0) { var n = c.carry.length; for (var z = 0; z < n; z++) { var lost = c.carry.pop(), ix = G.items.indexOf(lost); if (ix >= 0) G.items.splice(ix, 1); } c.used = 0; b.eaten += n; b.r = Math.min(132, b.r + n * 0.4); if (!c.bot) say(c.x, c.y - 66, 'Loot eaten!', '#ff6b5b', 20); }
      if (c.bot) { c.vx = ex / ed * 480; c.vy = ey / ed * 480; c.stun = 0.55; c.immune = 2.4; } else hurt(c, 1, b.x, b.y);
    }
  }
  return false;
}

/* ---------- one simulation step ---------- */
function step(dt) {
  if (G.modal) return;
  G.t += dt; G.stats.time += dt;
  updMap(dt); updActors(dt); pickups(dt); updCarry(dt); updItems(dt); updBlobs(dt); updEvents(dt); updFx(dt); updQuest();
  if (G.questPop > 0) G.questPop -= dt;
  if (G.calm > 0) G.calm -= dt;
  if (G.pend.length && (G.calm <= 0 || G.pend[0].type === 'ko')) nextModal();
}
