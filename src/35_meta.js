/* ---------- quests: a guided chain first, endless tasks afterwards ---------- */
var QCHAIN = [
  { text: 'Grab loot and bring it to your blob', stat: 'fed', need: 6, coin: 10 },
  { text: 'Buy an upgrade', stat: 'bought', need: 1, coin: 15 },
  { text: 'Lunge into a rival: tap RUN or press Space', stat: 'bonks', need: 1, coin: 40, gems: 3 },
  { text: 'Evolve your blob to level 3', level: 3, gems: 5 },
  { text: 'Raid a rival blob: lunge into it to steal goo', stat: 'raids', need: 1, coin: 120, gems: 5 },
  { text: 'Pop a Boss Blob: lunge into it', stat: 'bosses', need: 1, gems: 8 },
  { text: 'Evolve your blob to level 5', level: 5, gems: 10 },
  { text: 'Feed 30 crystals to your blob', stat: 'crystals', need: 30, gems: 10 },
  { text: 'Raid rival blobs 10 times', stat: 'raids', need: 10, gems: 15 },
  { text: 'Evolve your blob to level 8', level: 8, gems: 20 },
  { text: 'Rebirth for the first time', stat: 'rebirths', need: 1, gems: 30 }
];
var QLOOP = [['fed', 150, 75, 'Feed %n more loot'], ['bonks', 10, 4, 'Bonk rivals %n more times'], ['raids', 8, 3, 'Raid rival blobs %n more times'], ['jackpots', 2, 1, 'Hit %n raid jackpots: 3 hits in a row'], ['bosses', 2, 1, 'Pop %n more Boss Blobs'], ['crystals', 40, 20, 'Feed %n more crystals']];
function curQuest() {
  var q = QCHAIN[G.quest];
  if (q) return { text: q.text, cur: q.level ? G.blobs[0].level : G.stats[q.stat], need: q.level || q.need, coin: q.coin || 0, gems: q.gems || 0 };
  var k = G.quest - QCHAIN.length, ty = QLOOP[k % QLOOP.length], round = Math.floor(k / QLOOP.length);
  if (!G.qbase || G.qbase.k !== k || G.qbase.ty !== ty[0]) G.qbase = { k: k, ty: ty[0], start: G.stats[ty[0]], need: ty[0] === 'bosses' ? Math.min(6, ty[1] + ty[2] * round) : ty[1] + ty[2] * round };
  return { text: T(ty[3]).replace('%n', G.qbase.need), cur: G.stats[ty[0]] - G.qbase.start, need: G.qbase.need, coin: Math.round(150 * lootMul() * UPG.stomach.eff(G.up.stomach) * starMul()), gems: 8 + 2 * Math.min(round, 10) };
}
function updQuest() {
  var q = curQuest(); if (q.cur < q.need) return;
  if (q.coin) addCoins(q.coin); if (q.gems) { G.gems += q.gems; Snd.gem(); }
  G.quest++; Snd.quest(); G.questPop = 2.6; G.questDone = q;
}

/* ---------- ads: one small layer, so the game itself never talks to an ad network directly ----------
   mode 'test'       placeholder ads, for trying the flows without a portal
   mode 'none'       no ads at all (portal trial phase): every ad button disappears, the gem prices stay
   mode 'crazygames' real ads through the CrazyGames SDK */
var Ads = { mode: window.FB_ADS || 'test', busy: false, sdk: null, lastMid: 0 };
function adsOn() { return Ads.mode !== 'none'; }
function cdLeft(key) { return Math.max(0, Math.ceil(((G.cd[key] || 0) - Date.now()) / 1000)); }
function setCd(key, sec) { G.cd[key] = Date.now() + sec * 1000; }
function rewarded(key, cdSec, onReward) {
  if (Ads.busy || !adsOn() || cdLeft(key) > 0) return;
  Ads.busy = true; uiAd(true);
  var over = false, started = false, timer = null;
  var done = function (ok) {
    if (over) return; over = true; clearTimeout(timer); Ads.busy = false; Snd.setMute(Snd.muted); uiAd(false);
    if (ok) { G.stats.ads++; if (cdSec) setCd(key, cdSec); onReward(); save(); } else uiToast('No ad available right now. Try again later.');
    uiModal(); hud();
  };
  if (Ads.mode === 'crazygames' && Ads.sdk) {
    timer = setTimeout(function () { if (!started) done(false); }, 12000);
    try { Ads.sdk.ad.requestAd('rewarded', { adStarted: function () { started = true; Snd.setMute(true); }, adFinished: function () { done(true); }, adError: function () { done(false); } }); } catch (e) { done(false); }
  } else if (Ads.mode === 'test') uiTestAd('Rewarded video', done);
  else done(false);
}
function midgame() {       // a break ad at a natural pause; the portal decides how often one really shows
  if (!adsOn() || Ads.busy || G.auto) return;
  var end = function () { Ads.busy = false; Snd.setMute(Snd.muted); uiAd(false); lastTs = 0; };
  if (Ads.mode === 'crazygames' && Ads.sdk) {
    try { Ads.sdk.ad.requestAd('midgame', { adStarted: function () { Ads.busy = true; uiAd(true); Snd.setMute(true); }, adFinished: end, adError: end }); } catch (e) { end(); }
  } else if (Ads.mode === 'test' && Date.now() - Ads.lastMid > 180000) { Ads.lastMid = Date.now(); Ads.busy = true; uiAd(true); uiTestAd('Break ad', end); }
}
function sdkPlay(on) { if (!Ads.sdk) return; try { if (on) Ads.sdk.game.gameplayStart(); else Ads.sdk.game.gameplayStop(); } catch (e) { /* the game runs the same without this signal */ } }

/* ---------- pop-ups that pause the game ---------- */
function nextModal() {
  var m = G.pend.shift(); if (!m) return;
  if (G.auto) { if (m.type === 'levelup') addCoins(m.reward); else if (m.type === 'ko') respawnHome(); return; }
  if (m.type === 'ko') m.offer = adsOn() && cdLeft('revive') === 0;
  openModal(m);
}
function openModal(m) { G.modal = m; JOY = null; KEYS = {}; MOUSE.down = false; sprintDown = false; save(); uiModal(); sdkPlay(false); }
function closeModal() { G.modal = null; uiModal(); lastTs = 0; hud(); if (G.pend.length) nextModal(); else sdkPlay(true); }
function spend(n) { if (G.gems < n) { Snd.nope(); uiToast('Not enough gems'); return false; } G.gems -= n; Snd.buy(); return true; }
function today() { return Math.floor(Date.now() / 86400000); }
// Daily streak: each day in a row pays more, day 7 is the jackpot, then the cycle repeats. Missing a day starts again at day 1.
var DAILY = [20, 25, 30, 40, 50, 60, 100];
function dailyDay() { return G.daily === today() ? G.streak : G.daily === today() - 1 ? G.streak + 1 : 1; }   // streak day of the next (or today's) claim
function dailyNext() { return DAILY[(dailyDay() - 1) % 7]; }
function rebirthGain() { return 3 + Math.max(0, G.blobs[0].level - rbLevel()); }
function canRebirth() { return G.blobs[0].level >= rbLevel(); }
function doRebirth(mult) {
  var st = Math.ceil(rebirthGain() * mult), keep = { gems: G.gems + 20, stars: G.stars + st, rb: G.rb + 1, stats: G.stats, quest: G.quest, qbase: G.qbase, skins: G.skins, skin: G.skin, hats: G.hats, hat: G.hat, cd: G.cd, daily: G.daily, streak: G.streak, total: G.total };
  keep.stats.rebirths++;
  newGame(keep); G.started = true; cam.x = HOMES[0].x; cam.y = HOMES[0].y; G.flash = 0.8; Snd.level();
  G.banner = { title: T('REBIRTH {0}', G.rb), sub: T('+{0} stars. Everything grows {1}% now. Welcome to {2}!', st, Math.round(starMul() * 100), T(THEMES[G.rb % THEMES.length].name)), col: '#fff36b', t: 4.2 };
  save(); uiModal(); hud();
}
var BOOSTS = [
  { id: 'x2', name: 'Double coins', hint: '2 minutes', gems: 10, cd: 150, run: function () { G.boost.x2 = Math.min(600, Math.max(0, G.boost.x2) + 120); } },
  { id: 'magnet', name: 'Mega magnet', hint: '60 seconds', gems: 6, cd: 120, run: function () { var P = G.actors[0]; P.starT = Math.max(P.starT, 0) + 60; } },
  { id: 'gold', name: 'Gold Rush', hint: 'starts right now', gems: 12, cd: 180, can: function () { return !G.event; }, run: function () { G.evForce = 'gold'; G.nextEvent = G.t; } },
  { id: 'shield', name: 'Blob shield', hint: '60 seconds, full hearts', gems: 8, cd: 150, run: function () { var b = G.blobs[0]; b.shield = Math.max(b.shield, 0) + 60; G.hp = 3; } }
];
function boostById(id) { for (var i = 0; i < BOOSTS.length; i++) if (BOOSTS[i].id === id) return BOOSTS[i]; return null; }
function findIn(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }
var ACT = {
  collect: function () { var lvl = G.modal.type === 'levelup'; addCoins(G.modal.reward); closeModal(); if (lvl) midgame(); },
  collectAd: function () { var m = G.modal; rewarded('bonus', 0, function () { addCoins(m.reward * 3); Snd.coin(); closeModal(); }); },
  collectGem: function () { var m = G.modal; if (spend(5)) { addCoins(m.reward * 3); closeModal(); } },
  reviveAd: function () { rewarded('revive', 240, function () { reviveHere(); closeModal(); }); },
  reviveGem: function () { if (spend(15)) { reviveHere(); closeModal(); } },
  respawn: function () { var offered = G.modal.offer; respawnHome(); closeModal(); if (!offered) midgame(); },
  shop: function (tab) { if (!G.started || G.modal) return; openModal({ type: 'shop', tab: tab || 'skins' }); },
  tab: function (t) { G.modal.tab = t; uiModal(); },
  close: function () { closeModal(); },
  boostAd: function (id) { var b = boostById(id); if (b.can && !b.can()) return uiToast('Wait until the current event is over'); rewarded('b_' + id, b.cd, function () { b.run(); uiToast(T('{0} is active', T(b.name))); }); },
  boostGem: function (id) { var b = boostById(id); if (b.can && !b.can()) return uiToast('Wait until the current event is over'); if (spend(b.gems)) { b.run(); uiToast(T('{0} is active', T(b.name))); uiModal(); hud(); } },
  gemAd: function () { rewarded('gems', 180, function () { G.gems += 15; Snd.gem(); uiToast('+15 gems'); }); },
  daily: function () {
    if (G.daily === today()) return;
    var n = dailyNext(), day = dailyDay(); G.streak = day; G.daily = today(); G.gems += n; Snd.gem();
    uiToast(T('+{0} gems. Day {1} in a row', n, day) + (day % 7 === 0 ? T(', streak jackpot!') : T('. Come back tomorrow for {0}.', DAILY[day % 7]))); save(); uiModal(); hud();
  },
  skin: function (id) {
    var s = findIn(SKINS, id);
    if (G.skins.indexOf(id) < 0) { if (!spend(s.price)) return; G.skins.push(id); }
    G.skin = id; save(); uiModal(); hud();
  },
  hat: function (id) {
    var h = findIn(HATS, id);
    if (G.hats.indexOf(id) < 0) { if (!spend(h.price)) return; G.hats.push(id); }
    G.hat = id; save(); uiModal(); hud();
  },
  rebirthOpen: function () { if (canRebirth() && !G.modal) openModal({ type: 'rebirth' }); },
  rebirth: function () { doRebirth(1); midgame(); },
  rebirthAd: function () { rewarded('rebirth', 0, function () { doRebirth(1.5); }); },
  rebirthGem: function () { if (spend(20)) doRebirth(1.5); }
};
