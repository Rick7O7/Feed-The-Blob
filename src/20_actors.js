/* ---------- actors: the player and three rival collectors ---------- */
function capOf(a) { var c = a.bot ? 5 + Math.min(G.blobs[a.id].level, 12) + Math.floor(G.up.carry * 0.7 * a.skill) : UPG.carry.eff(G.up.carry); return evOn('lowgrav') ? c * 2 : c; }
function pickR(a) { return a.bot ? 34 : UPG.magnet.eff(G.up.magnet); }
function speedOf(a) {
  var s = a.bot ? 188 * a.skill * (1 + 0.03 * G.up.speed) : 215 * UPG.speed.eff(G.up.speed);
  if (evOn('frenzy')) s *= 1.45; else if (evOn('lowgrav')) s *= 1.12;
  if (a.sprint) s *= 1.5;
  if (a.boostT > 0) s *= 1.6;
  if (a.slowed) s *= 0.58;
  return s;
}
function goTo(a, x, y) {
  var dx = x - a.x, dy = y - a.y, d = hyp(dx, dy); a.via = -1;
  if (a.bot && d > 900 && a.tp <= 0) {       // rivals take a portal when it saves a long walk
    var ps = G.map.portals, best = d - 300, bi = -1;
    for (var i = 0; i < ps.length; i++) { var o = ps[ps[i].to], alt = hyp(ps[i].x - a.x, ps[i].y - a.y) + hyp(x - o.x, y - o.y); if (alt < best) { best = alt; bi = i; } }
    if (bi >= 0) { var px = ps[bi].x - a.x, py = ps[bi].y - a.y, pd = hyp(px, py) || 1; a.via = bi; a.ix = px / pd; a.iy = py / pd; return d; }
  }
  if (d < 4) { a.ix = a.iy = 0; return d; } a.ix = dx / d; a.iy = dy / d; return d;
}
function bestItem(a) {
  var best = null, bs = 1e9, boss = G.boss, lm = lootMul();
  for (var i = 0; i < G.items.length; i++) {
    var it = G.items[i]; if (it.state !== 1 || it.noPick > 0 || it.kind === 'heart') continue;
    if (boss && hyp(it.x - boss.x, it.y - boss.y) < boss.r + 140) continue;
    var s = hyp(it.x - a.x, it.y - a.y) - it.c / lm * 22 - (it.kind === 'gold' ? 60 : it.kind === 'goo' ? 110 : 0) + rnd() * 70;
    if (s < bs) { bs = s; best = it; }
  }
  return best;
}
function botThink(a, dt) {
  var ai = a.ai, b = G.blobs[a.id], boss = G.boss, cap = capOf(a), i, d;
  ai.think -= dt; ai.huntCd -= dt; ai.raidCd -= dt; a.wantSprint = false;
  if (boss && !boss.dead) {
    var bd = hyp(a.x - boss.x, a.y - boss.y);
    if (a.used > 0 && bd < boss.r + 170) { goTo(a, a.x * 2 - boss.x, a.y * 2 - boss.y); a.wantSprint = a.stam > 25; return; }
    if (a.used === 0 && a.aggro > 0.4 && a.stam > 40 && bd < 420 && boss.hitCd <= 0) { goTo(a, boss.x, boss.y); a.wantSprint = true; if (bd < boss.r + 110) a.wantLunge = true; return; }
  }
  if (ai.mode === 'defend') {
    var rv = ai.victim; ai.defT -= dt;
    if (!rv || ai.defT <= 0 || hyp(rv.x - b.x, rv.y - b.y) > b.r + 520) ai.mode = 'seek';
    else { d = goTo(a, rv.x + rv.vx * 0.15, rv.y + rv.vy * 0.15); a.wantSprint = a.stam > 30; if (d < 130 && rv.immune <= 0 && rv.inv <= 0) a.wantLunge = true; return; }
  }
  if (ai.mode === 'hunt') {
    var v = ai.victim; ai.hunt -= dt;
    if (!v || v.used === 0 || v.immune > 0 || v.inv > 0 || ai.hunt <= 0) ai.mode = 'seek';
    else { d = goTo(a, v.x + v.vx * 0.2, v.y + v.vy * 0.2); a.wantSprint = a.stam > 30; if (d < 125) a.wantLunge = true; return; }
  }
  if (ai.mode === 'raid') {
    var tb = ai.blob; ai.raidT -= dt;
    if (!tb || ai.raidT <= 0 || tb.shield > 0 || ai.raidHits >= ai.raidMax) { ai.mode = 'seek'; ai.think = 0; }
    else { d = goTo(a, tb.x, tb.y); a.wantSprint = d > tb.r + 280 && a.stam > 55; if (d < tb.r * 0.72 + 125) a.wantLunge = true; return; }
  }
  if (a.used >= cap) ai.mode = 'home';
  if (ai.mode === 'home') {
    if (a.used === 0) ai.mode = 'seek';
    else { d = goTo(a, b.x, b.y); if (d < b.r + 18) a.ix = a.iy = 0; return; }
  }
  if (ai.think <= 0 || !ai.tgt || ai.tgt.state !== 1) {
    ai.think = rand(0.35, 0.75) / a.skill; ai.tgt = bestItem(a);
    if (a.aggro && ai.huntCd <= 0 && a.stam > 60) {
      var vic = null, most = 2;
      for (i = 0; i < 4; i++) { var o = G.actors[i]; if (o !== a && o.immune <= 0 && o.inv <= 0 && o.used > most && hyp(o.x - a.x, o.y - a.y) < 330) { most = o.used; vic = o; } }
      if (vic && rnd() < a.aggro * (G.t < 50 ? 0.25 : 1)) { ai.mode = 'hunt'; ai.victim = vic; ai.hunt = 2.1; ai.huntCd = rand(9, 16); return; }
    }
    if (a.bot && G.t > 80 && ai.raidCd <= 0 && a.used <= 2 && a.stam > 60) {
      ai.raidCd = rand(8, 14);
      if (rnd() < a.aggro) {
        var cand = null, cm = 0;
        for (i = 0; i < 4; i++) {
          var ob = G.blobs[i]; if (i === a.id || ob.shield > 0 || ob.mass < 30 * lootMul()) continue;
          if (i === 0 && G.t - G.lastRaid < 50) continue;
          var w = ob.mass * (i === G.leader ? 1.6 : 1) * rand(0.6, 1.4); if (w > cm) { cm = w; cand = ob; }
        }
        if (cand) { ai.mode = 'raid'; ai.blob = cand; ai.raidT = 22; ai.raidHits = 0; ai.raidMax = cand.id === 0 ? 2 : a.aggro > 0.6 ? 3 : 2; ai.raidCd = rand(34, 56) / a.skill; if (cand.id === 0) G.lastRaid = G.t; return; }
      }
    }
  }
  if (ai.tgt) { d = goTo(a, ai.tgt.x, ai.tgt.y); if (a.used >= cap * 0.6 && d > 430) ai.mode = 'home'; }
  else if (a.used > 0) ai.mode = 'home';
  else goTo(a, W / 2, H / 2);
}
function autoPilot(P, dt) {      // only used by the test harness to measure pacing
  P.aggro = 0.5; botThink(P, dt); G.autoT = (G.autoT || 0) - dt;
  if (G.hunter && G.boss && !G.boss.dead) { var bd = goTo(P, G.boss.x, G.boss.y); P.wantSprint = P.stam > 40; if (bd < G.boss.r + 110) P.wantLunge = true; }
  if (G.raider && G.t > 60) {
    var tb = null, td = 1e9, run = null;
    for (var i = 1; i < 4; i++) {
      var ob = G.blobs[i], dd = hyp(P.x - ob.x, P.y - ob.y);
      if (ob.rage > 0) { if (dd < ob.r + BLAST + 60) run = ob; continue; }
      if (ob.shield > 0 || ob.mass < 30 * lootMul()) continue;
      if (dd < td) { td = dd; tb = ob; }
    }
    if (run) { goTo(P, P.x * 2 - run.x, P.y * 2 - run.y); P.wantSprint = true; }
    else if (tb && td < G.raider && (P.stam > 45 || tb.hits > 0)) { goTo(P, tb.x, tb.y); P.wantSprint = td > tb.r + 300 && P.stam > 60; if (td < tb.r * 0.72 + 125 && P.stam >= 22) P.wantLunge = true; }
  }
  if (G.autoT <= 0) { G.autoT = 1; var best = null; UKEYS.forEach(function (k) { if (G.up[k] < UPG[k].max && cost(k) <= G.coins && (!best || cost(k) < cost(best))) best = k; }); if (best) buy(best); }
}
function updActors(dt) {
  var i, a, P = G.actors[0];
  if (G.auto) autoPilot(P, dt);
  else { var l = hyp(IN.x, IN.y); P.ix = l > 1 ? IN.x / l : IN.x; P.iy = l > 1 ? IN.y / l : IN.y; P.wantSprint = IN.sprint; if (IN.lunge) { P.wantLunge = true; IN.lunge = false; } }
  for (i = 1; i < 4; i++) botThink(G.actors[i], dt);
  var lowg = evOn('lowgrav'), inf = evOn('frenzy');
  for (i = 0; i < 4; i++) {
    a = G.actors[i];
    if (a.stun > 0) a.stun -= dt; if (a.immune > 0) a.immune -= dt; if (a.inv > 0) a.inv -= dt; if (a.tired > 0) a.tired -= dt;
    if (a.starT > 0) a.starT -= dt; if (a.lungeCd > 0) a.lungeCd -= dt; if (a.atk > 0) a.atk -= dt;
    if (a.comboT > 0) { a.comboT -= dt; if (a.comboT <= 0 && a.gain > 0) { var hb = G.blobs[0]; say(hb.x, hb.y - hb.r - 14, '+' + fmt(a.gain), '#ffd23c', clamp(18 + a.combo * 0.6, 18, 34)); a.gain = 0; } }
    var il = hyp(a.ix, a.iy), moving = il > 0.15, smax = stamMax(a);
    if (a.wantLunge) {
      a.wantLunge = false;
      if (a.lungeCd <= 0 && a.stun <= 0 && a.tired <= 0 && (a.stam >= 22 || inf)) {
        var lx = moving ? a.ix : a.fx, ly = moving ? a.iy : a.fy, ll = hyp(lx, ly) || 1; lx /= ll; ly /= ll;
        a.vx = lx * 660; a.vy = ly * 660; a.lunge = 0.22; a.atk = 0.34; a.lungeCd = 0.45; a.fx = lx; a.fy = ly;
        if (!inf) { a.stam -= 22; a.stamCd = 0.5; }
        if (!a.bot) Snd.whoosh();
        if (onScreen(a.x, a.y)) for (var p = 0; p < 6; p++) part(a.x, a.y + 8, -lx * rand(60, 200) + rand(-40, 40), -ly * rand(60, 200) + rand(-40, 40), rand(0.2, 0.4), 'rgba(255,255,255,.85)', rand(3, 6), 0);
      } else if (!a.bot && a.stam < 22 && a.lungeCd <= 0) Snd.tired();
    }
    if (a.lunge > 0) {
      a.lunge -= dt; var fr = Math.exp(-2.4 * dt); a.vx *= fr; a.vy *= fr; a.sprint = false;
      if (moving) { a.vx += a.ix / il * 520 * dt; a.vy += a.iy / il * 520 * dt; }
    } else {
      a.sprint = !!a.wantSprint && moving && a.tired <= 0 && a.stun <= 0 && (a.stam > 0 || inf);
      if (a.sprint && !inf) { a.stam -= 26 * dt; a.stamCd = 0.45; if (a.stam <= 0) { a.stam = 0; a.tired = 1.1; a.sprint = false; if (!a.bot) Snd.tired(); } }
      else if (a.stamCd > 0) a.stamCd -= dt; else a.stam = Math.min(smax, a.stam + 30 * dt);
      var sp = speedOf(a) * Math.min(1, il), k = lowg ? 3.2 : moving ? 16 : 22; if (a.stun > 0) { sp = 0; k = 3; }
      var t = 1 - Math.exp(-k * dt), ux = moving ? a.ix / il : 0, uy = moving ? a.iy / il : 0;
      a.vx = lerp(a.vx, ux * sp, t); a.vy = lerp(a.vy, uy * sp, t);
    }
    a.x += a.vx * dt; a.y += a.vy * dt; a.step += hyp(a.vx, a.vy) * dt;
    if (moving && a.lunge <= 0) { var ft = 1 - Math.exp(-14 * dt); a.fx = lerp(a.fx, a.ix / il, ft); a.fy = lerp(a.fy, a.iy / il, ft); }
    a.x = clamp(a.x, EDGE + a.r, W - EDGE - a.r); a.y = clamp(a.y, EDGE + a.r, H - EDGE - a.r);
    mapTouch(a, dt, il);
    for (var j = 0; j < 4; j++) {
      var b = G.blobs[j], dx = a.x - b.x, dy = a.y - b.y, d = hyp(dx, dy) + 0.01, lim = b.r * 0.72 + a.r;
      if (j !== a.id && a.atk > 0 && d < lim + 8) raidHit(a, b);
      if (d < lim) { a.x = b.x + dx / d * lim; a.y = b.y + dy / d * lim; }
    }
    if ((a.sprint || a.lunge > 0) && rnd() < dt * 30 && onScreen(a.x, a.y)) dust(a.x - a.fx * 12, a.y + 12, 1);
  }
  // collisions between actors: whoever is lunging makes the other one drop loot
  for (i = 0; i < 4; i++) for (var m = i + 1; m < 4; m++) {
    var A = G.actors[i], B = G.actors[m], ex = B.x - A.x, ey = B.y - A.y, ed = hyp(ex, ey) + 0.01, min = A.r + B.r;
    if (ed >= min) continue;
    var push = (min - ed) / 2; A.x -= ex / ed * push; A.y -= ey / ed * push; B.x += ex / ed * push; B.y += ey / ed * push;
    var sa = A.atk > 0, sb = B.atk > 0;
    if (sa && !sb) bonk(A, B, 1); else if (sb && !sa) bonk(B, A, 1); else if (sa && sb) { bonk(A, B, 0.5); bonk(B, A, 0.5); }
  }
}
function bonk(att, vic, frac) {
  if (vic.immune > 0 || vic.inv > 0) return;
  var n = Math.ceil(vic.carry.length * (vic.bot ? 1 : 0.5) * frac), dx = vic.x - att.x, dy = vic.y - att.y, d = hyp(dx, dy) + 0.01;
  vic.immune = 2.6; vic.stun = 0.5; vic.vx += dx / d * 420; vic.vy += dy / d * 420; att.vx = -dx / d * 150; att.vy = -dy / d * 150; att.lunge = 0; att.atk = 0;
  if (n > 0) dropFrom(vic, n);
  if (!att.bot && vic.bot && vic.ai.mode === 'raid' && vic.ai.blob === G.blobs[0]) {     // chased a raider off the own blob
    var c = Math.round(12 * lootMul() * coinMul()); addCoins(c); G.stats.defended++; vic.ai.mode = 'seek'; vic.ai.raidCd = rand(40, 60);
    say(vic.x, vic.y - 66, 'DEFENDED!  +' + fmt(c), '#8cf58a', 24);
  }
  if (!onScreen(vic.x, vic.y)) return;
  Snd.bump(); for (var i = 0; i < 8; i++) part(vic.x, vic.y, rand(-200, 200), rand(-220, 40), rand(0.25, 0.5), '#fff', rand(3, 6), 300);
  if (!att.bot) { G.shake = 7; if (n > 0) { G.stats.bonks++; say(vic.x, vic.y - 40, 'BONK!', '#ffffff', 26); } }
  else if (!vic.bot) { G.shake = 9; G.fever = Math.max(0, G.fever - 10); say(vic.x, vic.y - 40, n > 0 ? 'OUCH!' : 'HEY!', '#ff6b5b', 24); }
}
/* ---------- raids: lunging into a rival blob knocks goo out of it ---------- */
var RSEC = [3, 5, 10], RMIN = [0.005, 0.008, 0.017], RMAX = [0.025, 0.04, 0.08], RLOSS = [0.03, 0.04, 0.07], SCOIN = [12, 18, 45], RAGE = 1.1, BLAST = 130, SPIKES = 20;
function raidHit(a, b) {
  if (b.hitCd > 0) return;
  var dx = a.x - b.x, dy = a.y - b.y, d = hyp(dx, dy) + 0.01, vis = onScreen(b.x, b.y), i;
  a.vx = dx / d * 500; a.vy = dy / d * 500; a.lunge = 0; a.atk = 0; b.hitCd = 0.3;
  if (b.shield > 0) {
    if (vis) { Snd.spike(); say(a.x, a.y - 40, 'SPIKES!', '#ff6b5b', 22); }
    hurt(a, 1, b.x, b.y); return;
  }
  if (b.rage > 0) return;                    // about to blow: nothing left to get, just bounce off
  b.hits++; b.hitT = 15; b.wobV += 6; b.sad = 1.5;      // the hit counter stays for a while: come back and finish the combo
  if (a.id === 0) stealHit(a, b, b.hits);
  else {
    var loss = b.mass * 0.035 * (b.id === 0 ? UPG.spikes.eff(G.up.spikes) : 1);
    if (loss >= 0.5) { b.mass -= loss; gooBurst(b, loss, a.x, a.y); }
    a.ai.raidHits++; if (vis) Snd.bump();
  }
  if (b.id === 0) {
    G.alarm = 4.5; G.stats.raided++; Snd.alarm();
    if (G.up.spikes > 0) { a.stun = 0.5 + 0.08 * G.up.spikes; dropFrom(a, a.carry.length); }
  } else { var own = G.actors[b.id]; own.ai.mode = 'defend'; own.ai.victim = a; own.ai.defT = 6; }
  if (vis) for (i = 0; i < 10; i++) part(a.x, a.y, rand(-240, 240), rand(-260, 60), rand(0.3, 0.6), COLORS[b.id], rand(4, 8), 400);
  if (b.hits >= 3) { b.rage = RAGE; b.hitT = 0; }
}
// one hit of the player on a rival blob: goo flies home on its own, coins come at once, the third hit in a row pays out big
function stealHit(a, b, n) {
  var king = G.leader === b.id ? 1.5 : 1, me = G.blobs[0], span = LVT[me.level] - LVT[me.level - 1], k = n - 1;
  var amt = clamp(G.rate * RSEC[k], span * RMIN[k], span * RMAX[k]) * king, coins = Math.round(SCOIN[k] * lootMul() * coinMul() * king);
  b.mass -= b.mass * RLOSS[k] * king; b.r *= 1 - 0.04 * n;
  gooFly(b, amt, 4 + 2 * n, a.x, a.y); addCoins(coins);
  G.stats.raids++; G.stats.stolen += amt; G.fever = Math.min(100, G.fever + 6); G.feverT = 5;
  G.shake = 7 + 3 * n; G.hitStop = 0.03 + 0.03 * n; Snd.steal(n);
  say(b.x, b.y - b.r - 18, n >= 3 ? 'JACKPOT!' : n === 2 ? 'STEAL x2!' : 'STEAL!', n >= 3 ? '#ffd23c' : '#ffffff', 22 + 6 * n);
  var ty = a.y - 50 - 14 * k;
  say(a.x - 7, ty, '+' + fmt(amt) + ' goo', '#8cf58a', 21, 'right'); say(a.x + 7, ty, '+' + fmt(coins) + ' coins', '#ffd23c', 21, 'left');
  G.calm = 2.5;
  if (king > 1 && n === 1) say(b.x, b.y - b.r - 52, 'KINGSLAYER x1.5', '#ffd23c', 20);
  if (n >= 3) {
    G.stats.jackpots++; G.flash = 0.22;
    spray(b, Math.atan2(a.y - b.y, a.x - b.x), 9, function () { return rnd() < 0.35 ? 'gem' : 'gold'; });
    if (G.t - G.raidGem > 90) { G.raidGem = G.t; G.gems++; Snd.gem(); say(a.x, ty - 30, '+1 gem', '#d9a8ff', 21); }
  }
}
function enrage(b) {
  b.hits = 0; b.hitT = 0; b.rage = 0; b.shield = Math.max(b.shield, SPIKES); b.flash = 1; shock(b.x, b.y, b.r + BLAST + 50, 760, G.actors[b.id]);
  for (var i = 0; i < 4; i++) { var a = G.actors[i]; if (i !== b.id && hyp(a.x - b.x, a.y - b.y) < b.r + BLAST) hurt(a, 1, b.x, b.y); }
  if (onScreen(b.x, b.y)) { Snd.boom(); G.shake = 12; say(b.x, b.y - b.r - 30, b.id ? NAMES[b.id] + ' is furious!' : 'SPIKES OUT!', '#ffffff', 24); }
}
function hurt(a, n, sx, sy) {
  var dx = a.x - sx, dy = a.y - sy, d = hyp(dx, dy) + 0.01;
  if (a.bot) { a.stun = Math.max(a.stun, 0.9); a.vx = dx / d * 420; a.vy = dy / d * 420; dropFrom(a, a.carry.length); return; }
  if (a.inv > 0 || G.hp <= 0) return;
  G.hp -= n; a.inv = 1.6; a.stun = 0.25; a.vx = dx / d * 460; a.vy = dy / d * 460; G.shake = 11; G.fever = Math.max(0, G.fever - 15); Snd.hurt();
  say(a.x, a.y - 44, 'OUCH!', '#ff6b5b', 26);
  for (var i = 0; i < 10; i++) part(a.x, a.y, rand(-220, 220), rand(-240, 40), rand(0.3, 0.6), '#ff4d6d', rand(3, 7), 300);
  if (G.hp <= 0) { G.hp = 0; G.stats.kos++; Snd.ko(); G.pend.unshift({ type: 'ko' }); }
}
function respawnHome() {
  var P = G.actors[0], h = HOMES[0]; dropFrom(P, P.carry.length);
  P.x = h.x + 130; P.y = h.y - 40; P.vx = P.vy = 0; P.stun = 0; P.inv = 2.5; P.stam = stamMax(P); G.hp = 3; G.fever = 0;
}
function reviveHere() {
  var P = G.actors[0]; G.hp = 3; P.inv = 3; P.stun = 0; P.stam = stamMax(P); G.stats.revives++; shock(P.x, P.y, 240, 650, P); G.flash = 0.4;
  say(P.x, P.y - 50, 'REVIVED!', '#8cf58a', 28);
}
function pickups(dt) {
  for (var i = 0; i < 4; i++) {
    var a = G.actors[i]; if (a.stun > 0) continue;
    var cap = capOf(a), full = a.used >= cap, pr = pickR(a), mag = a.bot || full ? 0 : pr * 2.3 * (a.starT > 0 ? 3 : 1);
    for (var j = G.items.length - 1; j >= 0; j--) {
      var it = G.items[j];
      if (it.noPick > 0 || !(it.state === 1 || (it.state === 0 && it.z < 28 && it.vz <= 0))) continue;
      var dx = a.x - it.x, dy = a.y - it.y, d2 = dx * dx + dy * dy, k = KIND[it.kind], rr = pr + k.r;
      if (d2 < rr * rr) {
        if (it.kind === 'heart') { if (!a.bot && G.hp < 3) { G.hp++; Snd.heal(); say(a.x, a.y - 44, '+1 HEART', '#ff4d6d', 22); G.items.splice(j, 1); } continue; }
        if (full || a.used + k.slots > cap) continue;
        it.state = 2; it.owner = a; it.z = 0; it.pop = 1; it.vx = it.vy = it.vz = 0; a.carry.push(it); a.used += k.slots; full = a.used >= cap;
        if (!a.bot) { Snd.pop(a.carry.length); if (full) say(a.x, a.y - 44, 'FULL!', '#ff6b5b', 20); }
      } else if (mag && it.state === 1 && it.kind !== 'heart' && d2 < mag * mag) { var d = Math.sqrt(d2); it.vx += dx / d * 1100 * dt; it.vy += dy / d * 1100 * dt; it.pull = 0.4; }
    }
  }
}
function updCarry(dt) {
  for (var i = 0; i < 4; i++) {
    var a = G.actors[i], px = a.x - a.fx * 13, py = a.y - a.fy * 13, n = a.carry.length, gap = Math.max(7, 15 - n * 0.22);
    for (var j = 0; j < n; j++) {
      var it = a.carry[j], dx = px - it.x, dy = py - it.y, d = hyp(dx, dy), g = j ? gap : 5;
      if (d > 260) { it.x = px; it.y = py; } else if (d > g) { var mv = (d - g) / d; it.x += dx * mv; it.y += dy * mv; }
      px = it.x; py = it.y;
    }
    var b = G.blobs[a.id], home = hyp(a.x - b.x, a.y - b.y) < b.r + 46;
    if (n && home) {
      a.feedT -= dt;
      while (a.feedT <= 0 && a.carry.length) {
        a.feedT += 0.055; var f = a.carry.pop(); a.used -= KIND[f.kind].slots;
        f.state = 3; f.owner = b; f.sx = f.x; f.sy = f.y; f.ft = 0; f.fd = rand(0.2, 0.3); b.mouthT = 0.4;
      }
    } else a.feedT = 0;
    if (i === 0) {       // standing on the own pad heals one heart every few seconds
      if (home && G.hp < 3) { G.healT += dt; if (G.healT >= 4) { G.healT = 0; G.hp++; Snd.heal(); say(a.x, a.y - 44, '+1 HEART', '#ff4d6d', 22); } } else if (!home) G.healT = 0;
    }
  }
}
function buy(key) {
  var u = UPG[key];
  if (G.up[key] >= u.max) return false;
  var c = cost(key); if (G.coins < c) { Snd.nope(); return false; }
  G.coins -= c; G.up[key]++; G.stats.bought++; Snd.buy();
  var P = G.actors[0]; say(P.x, P.y - 50, u.name + ' ' + G.up[key], '#8cf58a', 20);
  return true;
}
