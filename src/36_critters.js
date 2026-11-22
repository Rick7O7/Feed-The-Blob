/* ---------- critters: small original pets that hatch from rare loot, live at a blob and earn passive coins ----------
   Earned in play only: there is no way to buy an egg or a critter with gems (gems also come from rewarded ads).
   G.crit[i] = list of critter ids at blob i (0 = player). Player critters stay through rebirth, rival critters reset.
   Hatch:   feeding rare loot fills the egg meter (gem 0.2, gold 0.12, star 2, cake 4; need 30 + 25 per owned critter, max 200); full meter hatches one critter.
   Income:  every critter adds a share of the base passive income (cpsBase), so it scales with level and stars.
   Steal:   a raid jackpot on a rival takes its best critter. A rival raid on you warns first, takes your weakest
            critter only on the raid's last hit, never the last one, and at most one every 5 minutes. */
var CTIER = [
  { id: 'common', name: 'Common', w: 64, inc: 0.4, col: '#9fd8a0' },
  { id: 'rare', name: 'Rare', w: 26, inc: 1, col: '#5aa9ff' },
  { id: 'epic', name: 'Epic', w: 8.5, inc: 2.5, col: '#c77dff' },
  { id: 'legendary', name: 'Legendary', w: 1.5, inc: 6, col: '#ffd23c' }
];
var CRITTERS = [
  { id: 'pip', name: 'Puddle Pip', tier: 0 }, { id: 'bean', name: 'Bean Bug', tier: 0 }, { id: 'sprout', name: 'Sproutling', tier: 0 },
  { id: 'fizz', name: 'Fizzlet', tier: 1 }, { id: 'mole', name: 'Moss Mole', tier: 1 }, { id: 'drop', name: 'Dewdrop', tier: 1 },
  { id: 'newt', name: 'Glow Newt', tier: 2 }, { id: 'owl', name: 'Puff Owl', tier: 2 },
  { id: 'comet', name: 'Comet Kit', tier: 3 }, { id: 'jelly', name: 'Star Jelly', tier: 3 }
];
var CRIT_CAP = 8, RIVAL_CAP = 5, EGG_PTS = { gem: 0.2, gold: 0.12, star: 2, cake: 4 };
function critById(id) { for (var i = 0; i < CRITTERS.length; i++) if (CRITTERS[i].id === id) return CRITTERS[i]; return null; }
function critTier(id) { var c = critById(id); return c ? c.tier : 0; }
function critName(id) { var c = critById(id); return c ? T(c.name) : id; }
function eggNeed() { return Math.min(200, 30 + 25 * G.crit[0].length); }
function critIncome() { var s = 0, l = G.crit[0]; for (var i = 0; i < l.length; i++) s += CTIER[critTier(l[i])].inc; return s; }      // multiplier on cpsBase
function critRoll(luck) {
  var l = luck || 1, w = [CTIER[0].w, CTIER[1].w * Math.sqrt(l), CTIER[2].w * Math.pow(l, 0.75), CTIER[3].w * l], tot = w[0] + w[1] + w[2] + w[3], r = rnd() * tot, t = 0;
  while (t < 3 && r >= w[t]) { r -= w[t]; t++; }
  var pool = CRITTERS.filter(function (c) { return c.tier === t; });
  return pick(pool).id;
}
function critBest(l) { var b = -1; for (var i = 0; i < l.length; i++) if (b < 0 || critTier(l[i]) > critTier(l[b])) b = i; return b; }
function critWorst(l) { var b = -1; for (var i = 0; i < l.length; i++) if (b < 0 || critTier(l[i]) < critTier(l[b])) b = i; return b; }
function critNew(sv) {      // called from newGame
  var c = sv.crit || [], i;
  G.crit = [(c[0] || []).filter(critById).slice(0, CRIT_CAP)];
  for (i = 1; i < 4; i++) {
    if (c[i]) G.crit.push(c[i].filter(critById).slice(0, RIVAL_CAP));
    else { var l = [critRoll(1)]; if (G.rb > 0) l.push(critRoll(1 + 0.25 * Math.min(G.rb, 8))); G.crit.push(l); }
  }
  G.egg = sv.egg || 0; G.critWarn = null; G.critLoss = -999; G.critT = rand(150, 240); G.lastRaider = -1; G.revenge = null;
}
// the player gets a critter: room left, or it replaces the weakest one if it is better, otherwise it turns into coins
function critGive(id, how) {
  var l = G.crit[0], b = G.blobs[0], t = critTier(id), w;
  G.album.crit[id] = 1;
  if (l.length >= CRIT_CAP) {
    w = critWorst(l);
    if (critTier(l[w]) >= t) { var c = Math.round(cpsBase() * CTIER[t].inc * 60); addCoins(c); say(b.x, b.y - b.r - 70, T('Home is full: +{0} coins', fmt(c)), '#ffd23c', 20); return false; }
    l.splice(w, 1);
  }
  l.push(id);
  say(b.x, b.y - b.r - 70, T(how, critName(id)), CTIER[t].col, 24);
  say(b.x, b.y - b.r - 44, T(CTIER[t].name), CTIER[t].col, 18);
  if (t >= 2) { G.flash = 0.3; Snd.fanfare(); } else Snd.gem();
  return true;
}
function critFeed(it) {      // eat() of the player blob
  var p = EGG_PTS[it.kind]; if (!p || it.fly) return;
  G.egg += p;
  if (G.egg >= eggNeed()) { G.egg = 0; G.stats.hatched++; critGive(critRoll(UPG.luck.eff(G.up.luck)), '{0} hatched!'); }
}
function critTick(dt) {      // rivals hatch slowly on their own, the warning runs out
  G.critT -= dt;
  if (G.critT <= 0) {
    G.critT = rand(150, 240); var i = 1 + Math.floor(rnd() * 3);
    if (G.crit[i].length < RIVAL_CAP) G.crit[i].push(critRoll(1 + 0.25 * Math.min(G.rb, 8)));
  }
  if (G.critWarn) { G.critWarn.t -= dt; var ra = G.actors[G.critWarn.id]; if (G.critWarn.t <= 0 || ra.ai.mode !== 'raid' || ra.ai.blob !== G.blobs[0]) G.critWarn = null; }
}
function critCanLose() { return G.crit[0].length >= 2 && G.t > 180 && G.t - G.critLoss > 300; }
function critRaidStart(a) {      // a rival starts a raid on the player's blob
  if (!critCanLose()) return;
  G.critWarn = { id: a.id, t: 25 };
  var P = G.actors[0]; say(P.x, P.y - 80, T('{0} is after your critters! Bonk them!', NAMES[a.id]), '#ff6b5b', 22);
}
function critRaidHit(a) {      // a rival hit the player's blob
  G.lastRaider = a.id;
  if (!G.critWarn || G.critWarn.id !== a.id || a.ai.raidHits < a.ai.raidMax || !critCanLose()) return;
  var l = G.crit[0], w = critWorst(l), id = l.splice(w, 1)[0], b = G.blobs[0];
  G.crit[a.id].push(id); if (G.crit[a.id].length > RIVAL_CAP) G.crit[a.id].splice(critWorst(G.crit[a.id]), 1);
  G.critWarn = null; G.critLoss = G.t; G.revenge = { id: a.id, c: id };
  say(b.x, b.y - b.r - 70, T('{0} took {1}! Raid them to get it back', NAMES[a.id], critName(id)), '#ff6b5b', 22);
}
function critJackpot(b) {      // the player hit a jackpot on rival blob b
  var l = G.crit[b.id]; if (!l.length) return;
  var k = -1, rev = G.revenge && G.revenge.id === b.id;
  if (rev) k = l.indexOf(G.revenge.c);
  if (k < 0) k = critBest(l);
  var id = l.splice(k, 1)[0];
  if (rev) { G.revenge = null; G.gems += 2; say(b.x, b.y - b.r - 100, 'REVENGE!  +2 gems', '#ff8fc7', 26); }
  G.stats.critStolen++;
  critGive(id, 'You stole {0}!');
}
// raid stake of rival i, for B's label above the rival blob: its best critter (or null) and the jackpot coins
function raidPrize(i) {
  var l = G.crit[i], k = critBest(l), king = G.leader === i ? 1.5 : 1;
  return { crit: k >= 0 ? l[k] : null, tier: k >= 0 ? critTier(l[k]) : -1, coins: Math.round((SCOIN[0] + SCOIN[1] + SCOIN[2]) * lootMul() * coinMul() * king), revenge: !!(G.revenge && G.revenge.id === i) || G.lastRaider === i };
}
// where each critter of blob i sits right now: a slow ring around the blob. B draws them from this list.
function critPos(i) {
  var b = G.blobs[i], l = G.crit[i], n = l.length, out = [], k;
  for (k = 0; k < n; k++) { var a = G.t * 0.25 + k * TAU / Math.max(n, 1) + i, rr = b.r + 34 + 6 * Math.sin(G.t * 1.3 + k); out.push({ id: l[k], tier: critTier(l[k]), x: b.x + Math.cos(a) * rr, y: b.y + Math.sin(a) * rr * 0.75, hop: Math.abs(Math.sin(G.t * 3 + k * 1.7)) }); }
  return out;
}
ALBUM.push({ id: 'crit', name: 'Critters', gems: 40, list: function () { return CRITTERS.map(function (c) { return c.id; }); }, has: function (k) { return !!G.album.crit[k]; } });
