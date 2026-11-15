/* ---------- world data ---------- */
var W = 3600, H = 2400, EDGE = 60;
var HOMES = [{ x: 560, y: 1860 }, { x: 3040, y: 1860 }, { x: 560, y: 540 }, { x: 3040, y: 540 }];
var COLORS = ['#59d16a', '#ff8a4c', '#5aa9ff', '#c77dff'], BHUE = [128, 22, 212, 275];
var LEAGUES = [['Grumbo', 'Mossy', 'Bubbla'], ['Sir Slurp', 'Dr. Ooze', 'Lady Gloop'], ['Mega Muck', 'Count Slime', 'Jelly Khan'], ['Lord Blobula', 'Queen Goo', 'The Glob']];
var NAMES = ['You', 'Grumbo', 'Mossy', 'Bubbla'];
var THEMES = [
  { name: 'Meadow', floor: '#f5ead4', grid: 'rgba(160,125,80,.16)', edge: '#9c7748', out: '#bfa77f',
    patch: 'rgba(125,195,95,.2)', lane: 'rgba(255,255,255,.34)', tuft: '#74b854', dots: ['#ff8fc7', '#ffd23c', '#ffffff'], rock: '#b3aaa0', slow: 'rgba(150,105,65,.5)', slowEdge: 'rgba(110,72,40,.6)', slowName: 'MUD' },
  { name: 'Lagoon', floor: '#f7e9b8', grid: 'rgba(190,150,70,.2)', edge: '#2f9d95', out: '#7fd0c8',
    patch: 'rgba(80,200,205,.2)', lane: 'rgba(255,255,255,.36)', tuft: '#3fb79b', dots: ['#ff9f7a', '#ffffff', '#ff6b8a'], rock: '#d6b58a', slow: 'rgba(70,175,225,.5)', slowEdge: 'rgba(40,130,190,.65)', slowName: 'DEEP WATER' },
  { name: 'Glacier', floor: '#eef4fa', grid: 'rgba(120,150,190,.22)', edge: '#6f8fb5', out: '#b9cde3',
    patch: 'rgba(140,195,255,.24)', lane: 'rgba(255,255,255,.6)', tuft: '#9fc3ea', dots: ['#ffffff', '#bfe0ff', '#8fc4ff'], rock: '#a9bdd3', slow: 'rgba(255,255,255,.8)', slowEdge: 'rgba(130,165,205,.7)', slowName: 'DEEP SNOW' },
  { name: 'Volcano', floor: '#5a3a36', grid: 'rgba(255,150,90,.16)', edge: '#ff6a3d', out: '#2e1b1a',
    patch: 'rgba(255,110,50,.13)', lane: 'rgba(255,200,150,.12)', tuft: '#8f5140', dots: ['#ffb347', '#ff6a3d', '#ffd95e'], rock: '#3a2624', slow: 'rgba(255,95,40,.42)', slowEdge: 'rgba(255,170,60,.7)', slowName: 'HOT ASH' },
  { name: 'Deep Space', floor: '#322758', grid: 'rgba(190,160,255,.16)', edge: '#8f6bff', out: '#171031',
    patch: 'rgba(150,110,255,.16)', lane: 'rgba(200,180,255,.12)', tuft: '#6a55c8', dots: ['#ffffff', '#ffe98a', '#b9a8ff'], rock: '#5b4b8f', slow: 'rgba(200,120,255,.4)', slowEdge: 'rgba(230,170,255,.7)', slowName: 'STAR GOO' }
];
var LVNAME = ['', 'Droplet', 'Gloop', 'Wobbler', 'Chonk', 'Mega Chonk', 'Titan', 'Planet Eater', 'Star Swallower', 'Galaxy Gut', 'Void Belly', 'Universe'];
function lvName(n) { return n <= 11 ? T(LVNAME[n]) : T('Universe +{0}', n - 11); }
// LVT[n] = mass needed to leave level n. Loot grows 1.5x per level, so every level stays a few minutes long.
var LVB = [0, 45, 170, 540, 1700, 4500, 8500, 13500, 19000];
var LVT = [0]; (function () { var s = 0; for (var n = 1; n <= 90; n++) { s += Math.round((n <= 8 ? LVB[n] : 19000 * Math.pow(n / 8, 2.2)) * Math.pow(1.5, n - 1)); LVT.push(s); } })();
var KIND = {
  apple: { mass: 2, coin: 1, slots: 1, r: 12 }, donut: { mass: 3, coin: 2, slots: 1, r: 13 }, pizza: { mass: 4, coin: 3, slots: 1, r: 13 }, fish: { mass: 3, coin: 2, slots: 1, r: 13 },
  can: { mass: 5, coin: 0, slots: 1, r: 11 }, boot: { mass: 9, coin: 0, slots: 2, r: 14 },
  gem: { mass: 1, coin: 8, slots: 1, r: 12 }, gold: { mass: 3, coin: 5, slots: 1, r: 12 }, star: { mass: 6, coin: 25, slots: 1, r: 15 },
  goo: { mass: 0, coin: 0, slots: 1, r: 12 }, heart: { mass: 0, coin: 0, slots: 0, r: 13 },
  cake: { mass: 12, coin: 40, slots: 1, r: 16 }      // golden cake: only from surprise moments, never from the normal loot table
};
var TABLE = [['apple', 30], ['donut', 20], ['pizza', 13], ['fish', 12], ['can', 10], ['boot', 8], ['gem', 5], ['star', 0.7], ['heart', 0.5]];
var UPG = {
  carry: { name: 'Backpack', base: 15, k: 1.55, max: 60, eff: function (n) { return 6 + n; } },
  speed: { name: 'Sneakers', base: 25, k: 1.75, max: 15, eff: function (n) { return 1 + 0.04 * n; } },
  magnet: { name: 'Magnet', base: 35, k: 1.7, max: 20, eff: function (n) { return 32 + 6 * n; } },
  stomach: { name: 'Coins', base: 60, k: 1.7, max: 999, eff: function (n) { return 1 + 0.25 * n; } },
  appetite: { name: 'Growth', base: 100, k: 1.75, max: 999, eff: function (n) { return 1 + 0.15 * n; } },
  energy: { name: 'Energy', base: 120, k: 1.9, max: 10, eff: function (n) { return 100 + 12 * n; } },
  spikes: { name: 'Spikes', base: 180, k: 2.0, max: 10, eff: function (n) { return Math.max(0.4, 1 - 0.06 * n); } },
  luck: { name: 'Luck', base: 90, k: 1.85, max: 20, eff: function (n) { return 1 + 0.25 * n; } }
};
var UKEYS = ['carry', 'speed', 'magnet', 'stomach', 'appetite', 'energy', 'spikes', 'luck'];
var SKINS = [
  { id: 'classic', name: 'Classic', price: 0, h: 128, s: 85, l: 60 },
  { id: 'gum', name: 'Bubblegum', price: 40, h: 328, s: 85, l: 66 },
  { id: 'sun', name: 'Sunny', price: 40, h: 48, s: 92, l: 60 },
  { id: 'electric', name: 'Electric', price: 60, h: 194, s: 90, l: 58, pat: 'bolt', pcol: '#fff36b' },
  { id: 'fire', name: 'Fireball', price: 80, h: 10, s: 88, l: 52, pat: 'flame', pcol: '#ffd23c' },
  { id: 'love', name: 'Lovebug', price: 100, h: 338, s: 88, l: 64, pat: 'hearts', pcol: '#fff' },
  { id: 'melon', name: 'Watermelon', price: 120, h: 118, s: 70, l: 52, pat: 'stripes', pcol: 'hsla(140,70%,20%,.5)' },
  { id: 'cow', name: 'Moo', price: 120, h: 40, s: 20, l: 90, pat: 'spots', pcol: 'rgba(59,42,32,.9)' },
  { id: 'bee', name: 'Buzz', price: 140, h: 46, s: 95, l: 56, pat: 'band', pcol: 'rgba(35,25,12,.92)' },
  { id: 'army', name: 'Commando', price: 150, h: 92, s: 32, l: 46, pat: 'camo', pcol: 'rgba(45,35,18,.55)' },
  { id: 'tiger', name: 'Tiger', price: 160, h: 30, s: 92, l: 58, pat: 'stripes', pcol: 'rgba(40,25,15,.8)' },
  { id: 'checker', name: 'Checkers', price: 180, h: 2, s: 80, l: 55, pat: 'checker', pcol: 'rgba(255,255,255,.92)' },
  { id: 'donut', name: 'Donut', price: 200, h: 34, s: 62, l: 66, pat: 'glaze', pcol: '#ff8fc7' },
  { id: 'zombie', name: 'Zombie', price: 200, h: 95, s: 32, l: 58, pat: 'stitch', pcol: 'rgba(59,42,32,.85)' },
  { id: 'soda', name: 'Fizz', price: 260, h: 205, s: 85, l: 56, pat: 'bubbles', pcol: 'rgba(255,255,255,.9)' },
  { id: 'lava', name: 'Lava', price: 320, h: 8, s: 78, l: 36, pat: 'cracks', pcol: '#ffb347' },
  { id: 'ice', name: 'Ice', price: 320, h: 190, s: 72, l: 80, pat: 'flakes', pcol: 'rgba(255,255,255,.95)' },
  { id: 'retro', name: '8-Bit', price: 420, h: 150, s: 70, l: 55, pat: 'pixel', pcol: 'rgba(30,20,15,.8)' },
  { id: 'hypno', name: 'Hypno', price: 500, h: 282, s: 70, l: 55, pat: 'swirl', pcol: '#fff' },
  { id: 'galaxy', name: 'Galaxy', price: 500, h: 265, s: 58, l: 32, pat: 'stars', pcol: '#fff' },
  { id: 'toxic', name: 'Toxic', price: 650, h: 88, s: 95, l: 52, pat: 'bubbles', pcol: 'rgba(210,255,80,.9)' },
  { id: 'gold', name: 'Solid Gold', price: 800, h: 46, s: 96, l: 56, pat: 'shine', pcol: 'rgba(255,255,255,.7)' },
  { id: 'phoenix', name: 'Phoenix', price: 1000, h: 32, s: 98, l: 56, pat: 'flame', pcol: '#fff' },
  { id: 'rainbow', name: 'Rainbow', price: 1200, h: -1, s: 90, l: 62 },
  { id: 'aurora', name: 'Aurora', price: 1600, h: -1, s: 72, l: 58, pat: 'swirl', pcol: 'rgba(255,255,255,.85)' },
  { id: 'diamond', name: 'Diamond', price: 2200, h: 186, s: 78, l: 78, pat: 'facet', pcol: 'rgba(255,255,255,.95)' }
];
var HATS = [
  { id: 'none', name: 'No hat', price: 0 }, { id: 'cap', name: 'Cap', price: 30 }, { id: 'tophat', name: 'Top Hat', price: 60 },
  { id: 'ears', name: 'Cat Ears', price: 90 }, { id: 'halo', name: 'Halo', price: 150 }, { id: 'crown', name: 'Crown', price: 300 }
];
var G = null, IN = { x: 0, y: 0, sprint: false, lunge: false };

function cost(key) { var u = UPG[key]; return Math.round(u.base * Math.pow(u.k, G.up[key])); }
function lootMul() { return Math.pow(1.5, G.blobs[0].level - 1); }
function starMul() { return 1 + 0.2 * G.stars; }
function feverMul() { return 1 + G.fever / 100; }
function coinMul() { return UPG.stomach.eff(G.up.stomach) * feverMul() * (G.leader === 0 ? 1.25 : 1) * starMul() * (G.boost.x2 > 0 ? 2 : 1) * (evOn('frenzy') ? 1.5 : 1); }
function massMul() { return UPG.appetite.eff(G.up.appetite) * starMul(); }
function cpsNow() { return 0.3 * lootMul() * Math.sqrt(G.blobs[0].level) * UPG.stomach.eff(G.up.stomach) * starMul() * (G.boost.x2 > 0 ? 2 : 1); }
function evOn(type) { return G.event && G.event.on && G.event.type === type; }
function rbLevel() { return 8 + G.rb; }
function stamMax(a) { return a.bot ? 100 : UPG.energy.eff(G.up.energy); }

function mkActor(id) {
  var h = HOMES[id];
  return { id: id, bot: id > 0, x: h.x + (id % 2 ? -130 : 130), y: h.y + (id < 2 ? -40 : 40), vx: 0, vy: 0, r: 17, carry: [], used: 0, ix: 0, iy: 0,
    stam: 100, stamCd: 0, tired: 0, stun: 0, immune: 0, inv: 0, sprint: false, wantSprint: false, wantLunge: false, lunge: 0, atk: 0, lungeCd: 0,
    fx: 1, fy: 0, boostT: 0, tp: 0, via: -1, slowed: false, feedT: 0, combo: 0, comboT: 0, gain: 0, step: 0, starT: 0, skill: 1, gainMul: 1, aggro: [0, 0.75, 0.3, 0.5][id],
    ai: { mode: 'seek', tgt: null, think: rnd(), victim: null, hunt: 0, huntCd: rand(8, 14), blob: null, raidT: 0, raidHits: 0, raidCd: rand(70, 110), defT: 0 } };
}
function mkBlob(id, mass, level) {
  var b = { id: id, x: HOMES[id].x, y: HOMES[id].y, mass: mass || 0, level: level || 1, r: 46, wob: 0, wobV: 0, mouth: 0, mouthT: 0, blink: rand(2, 5), flash: 0,
    hits: 0, hitT: 0, hitCd: 0, shield: 0, sad: 0, rage: 0 };
  while (b.mass >= LVT[b.level]) b.level++;
  b.r = blobR(b); return b;
}
// size follows the level plus the progress inside it, so a blob keeps growing visibly at any scale
function blobR(b) { var lo = LVT[b.level - 1], hi = LVT[b.level], f = clamp((b.mass - lo) / (hi - lo), 0, 1); return Math.min(190, 46 + 13 * (b.level - 1 + f)); }

function newGame(sv) {
  sv = sv || {};
  G = { t: 0, coins: sv.coins || 0, total: sv.total || 0, gems: sv.gems || 0, stars: sv.stars || 0, rb: sv.rb || 0,
    up: {}, stats: { fed: 0, crystals: 0, bonks: 0, bosses: 0, bought: 0, raids: 0, raided: 0, stolen: 0, jackpots: 0, defended: 0, kos: 0, revives: 0, ads: 0, rebirths: 0, time: 0, treasures: 0, events: 0, surprises: 0 },
    quest: sv.quest || 0, qbase: sv.qbase || null, skins: sv.skins || ['classic'], skin: sv.skin || 'classic', hats: sv.hats || ['none'], hat: sv.hat || 'none',
    cd: sv.cd || {}, daily: sv.daily || 0, streak: sv.streak || 0,
    album: { loot: (sv.album && sv.album.loot) || {}, ev: (sv.album && sv.album.ev) || {} }, albumDone: sv.albumDone || {}, ach: sv.ach || {}, pbest: sv.pbest || 0,
    pcombo: 0, pcomboT: -9, lucky: 0, surpriseT: 70, surpriseN: 0, treasure: null, feast: null, hp: 3, healT: 0, fever: 0, feverT: 0, boost: { x2: 0 }, leader: -1, leadT: 0, crownT: 0, alarm: 0, lastRaid: -99, raidGem: -999, hitStop: 0, rate: 0, rateAcc: 0, calm: 0,
    items: [], actors: [], blobs: [], map: null, clouds: [], crates: [], crateT: 8, tips: {}, parts: [], texts: [], meteors: [], boss: null, event: null, nextEvent: 45, evBag: [], evCount: 0,
    spawnAcc: 0, grav: 900, shake: 0, flash: 0, saveT: 0, banner: null, started: false, auto: false, modal: null, pend: [], koOffer: false, ground: 0 };
  var k, i; UKEYS.forEach(function (key) { G.up[key] = (sv.up && sv.up[key]) || 0; });
  for (k in G.stats) if (sv.stats && sv.stats[k]) G.stats[k] = sv.stats[k];
  var lg = LEAGUES[G.rb % LEAGUES.length]; NAMES = ['You', lg[0], lg[1], lg[2]];
  for (i = 0; i < 4; i++) { G.actors.push(mkActor(i)); G.blobs.push(mkBlob(i, sv.mass ? sv.mass[i] : 0, sv.lvl ? sv.lvl[i] : 1)); }
  G.map = genMap();
  for (i = 0; i < 2; i++) G.clouds.push({ x: rand(500, W - 500), y: rand(400, H - 400), tx: rand(400, W - 400), ty: rand(350, H - 350), r: 200, sp: rand(38, 54), ph: rnd() * TAU });
  for (i = 0; i < 2; i++) addCrate();
  for (i = 0; i < 190; i++) spawnItem(true);
}

/* ---------- the map: built fresh for every game and every rebirth ----------
   rocks      solid, walk around them                     bumpers   pink, fling you away
   slows      sticky ground, walking is slower            pads      a short speed burst
   portals    two linked pairs, step in to cross the map  crates    lunge twice, loot bursts out
   clouds     drift over the arena and rain extra loot    decor     plants and stones, looks only */
function segDist(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1); return hyp(px - ax - dx * t, py - ay - dy * t); }
function genMap() {
  var M = { rocks: [], pads: [], slows: [], portals: [], decor: [], patches: [] }, i, mx = W / 2, my = H / 2;
  function wob(n, a1, a2) { var p = [], f1 = rnd() * TAU, f2 = rnd() * TAU; for (var q = 0; q < n; q++) p.push(1 + a1 * Math.sin(q / n * TAU * 2 + f1) + a2 * Math.sin(q / n * TAU * 3 + f2)); return p; }
  function free(x, y, r, lane) {
    var q, f, L = [M.rocks, M.pads, M.slows, M.portals];
    for (q = 0; q < 4; q++) if (hyp(x - HOMES[q].x, y - HOMES[q].y) < 400 + r) return false;
    if (hyp(x - mx, y - my) < 250 + r) return false;
    if (lane) for (q = 0; q < 4; q++) if (segDist(x, y, HOMES[q].x, HOMES[q].y, mx, my) < r + 62) return false;   // the lanes from every home to the plaza stay open
    for (q = 0; q < 4; q++) for (f = 0; f < L[q].length; f++) if (hyp(x - L[q][f].x, y - L[q][f].y) < r + L[q][f].r + 70) return false;
    return true;
  }
  function scatter(count, rmin, rmax, lane, list, mk) {
    for (var c = 0, t = 0; c < count && t < count * 40; t++) {
      var rr = rand(rmin, rmax), px = rand(EDGE + rr + 40, W - EDGE - rr - 40), py = rand(EDGE + rr + 40, H - EDGE - rr - 40);
      if (free(px, py, rr, lane)) { list.push(mk(px, py, rr)); c++; }
    }
  }
  var jx = rand(-260, 260), jy = rand(-180, 180);
  M.portals.push({ x: mx + jx, y: 215, r: 34, to: 1, col: '#3fe0ff' }, { x: mx - jx, y: H - 215, r: 34, to: 0, col: '#3fe0ff' },
    { x: 225, y: my + jy, r: 34, to: 3, col: '#ff8fc7' }, { x: W - 225, y: my - jy, r: 34, to: 2, col: '#ff8fc7' });
  scatter(0, 110, 170, false, M.slows, function (x, y, r) { return { x: x, y: y, r: r, p: wob(44, 0.12, 0.08) }; });
  scatter(4, 46, 46, false, M.pads, function (x, y, r) { return { x: x, y: y, r: r, t: 0 }; });
  scatter(8, 40, 72, true, M.rocks, function (x, y, r) { var p = []; for (var q = 0; q < 10; q++) p.push(rand(0.84, 1.08)); return { x: x, y: y, r: r, b: 0, t: 0, p: p }; });
  scatter(0, 34, 34, true, M.rocks, function (x, y, r) { return { x: x, y: y, r: r, b: 1, t: 0 }; });
  for (i = 0; i < 10; i++) M.patches.push({ x: rand(300, W - 300), y: rand(260, H - 260), rx: rand(150, 330), ry: rand(110, 220), rot: rand(-0.6, 0.6) });
  for (i = 0; i < 220; i++) {
    var d = { x: rand(EDGE + 30, W - EDGE - 30), y: rand(EDGE + 30, H - EDGE - 30), k: Math.floor(rnd() * 3), s: rand(0.8, 1.5), c: Math.floor(rnd() * 3), rot: rnd() * TAU }, ok = true, q;
    for (q = 0; q < 4; q++) if (hyp(d.x - HOMES[q].x, d.y - HOMES[q].y) < 250) ok = false;
    for (q = 0; q < M.rocks.length; q++) if (hyp(d.x - M.rocks[q].x, d.y - M.rocks[q].y) < M.rocks[q].r + 16) ok = false;
    if (ok) M.decor.push(d);
  }
  return M;
}
function rockOut(o, pad) {       // pushes loot out of a rock
  var R = G.map.rocks;
  for (var i = 0; i < R.length; i++) {
    var k = R[i], lim = k.r + pad, dx = o.x - k.x, dy = o.y - k.y;
    if (dx > lim || dx < -lim || dy > lim || dy < -lim) continue;
    var d = hyp(dx, dy) + 0.01; if (d >= lim) continue;
    o.x = k.x + dx / d * lim; o.y = k.y + dy / d * lim;
    var vn = o.vx * dx / d + o.vy * dy / d; if (vn < 0) { o.vx -= 1.6 * vn * dx / d; o.vy -= 1.6 * vn * dy / d; }
  }
}
function addCrate() {
  for (var t = 0; t < 14; t++) {
    var x = rand(EDGE + 130, W - EDGE - 130), y = rand(EDGE + 130, H - EDGE - 130), ok = true, i, M = G.map;
    for (i = 0; i < 4; i++) if (hyp(x - HOMES[i].x, y - HOMES[i].y) < 460) ok = false;
    for (i = 0; i < M.rocks.length; i++) if (hyp(x - M.rocks[i].x, y - M.rocks[i].y) < M.rocks[i].r + 60) ok = false;
    for (i = 0; i < M.portals.length; i++) if (hyp(x - M.portals[i].x, y - M.portals[i].y) < 110) ok = false;
    for (i = 0; i < G.crates.length; i++) if (hyp(x - G.crates[i].x, y - G.crates[i].y) < 420) ok = false;
    if (ok) { G.crates.push({ x: x, y: y, hp: 2, wob: 0, age: 0 }); return; }
  }
}
function hitCrate(a, c, idx) {
  var vis = onScreen(c.x, c.y), i; c.hp--; c.wob = 1;
  if (vis) { Snd.smack(); for (i = 0; i < 7; i++) part(c.x, c.y - 10, rand(-220, 220), rand(-260, 20), rand(0.3, 0.6), pick(['#c98a5a', '#8b5a3c', '#f3d9a4']), rand(4, 8), 500); }
  if (c.hp > 0) { if (!a.bot) G.shake = Math.max(G.shake, 5); return; }
  G.crates.splice(idx, 1);
  burst(c.x, c.y, c.lucky ? 14 : 7, function () { var r = rnd(); return r < (c.lucky ? 0.45 : 0.15) ? 'gem' : r < 0.5 ? 'gold' : rollKind(); }, 300);
  if (c.lucky && !a.bot) { G.gems += 2; Snd.gem(); say(c.x, c.y - 80, 'LUCKY CRATE! +2 gems', '#fff36b', 26); }
  if (!a.bot) { var co = Math.round(5 * lootMul() * coinMul()); addCoins(co); G.shake = Math.max(G.shake, 9); say(c.x, c.y - 44, T('CRATE!  +{0}', fmt(co)), '#ffd23c', 24); }
}
function tip(key, a, str, col) { if (!G.tips[key] && G.started) { G.tips[key] = 1; say(a.x, a.y - 46, str, col, 22); } }
// everything on the map that a collector can touch
function mapTouch(a, dt, il) {
  var M = G.map, i, o, dx, dy, d, lim, nx, ny, P = !a.bot, vis = onScreen(a.x, a.y);
  if (a.boostT > 0) a.boostT -= dt; if (a.tp > 0) a.tp -= dt;
  for (i = 0; i < M.rocks.length; i++) {
    o = M.rocks[i]; lim = o.r + a.r; dx = a.x - o.x; dy = a.y - o.y;
    if (dx > lim || dx < -lim || dy > lim || dy < -lim) continue;
    d = hyp(dx, dy) + 0.01; if (d >= lim) continue;
    nx = dx / d; ny = dy / d; a.x = o.x + nx * lim; a.y = o.y + ny * lim;
    if (o.b) {      // bumper: flings the collector away at a slight angle
      var sd = nx * a.vy - ny * a.vx >= 0 ? 1 : -1, c = Math.cos(0.45 * sd), s = Math.sin(0.45 * sd);
      a.vx = (nx * c - ny * s) * 600; a.vy = (ny * c + nx * s) * 600; a.lunge = 0; a.stun = Math.max(a.stun, 0.16); o.t = 1;
      if (vis) { if (P) { Snd.boing(); G.shake = Math.max(G.shake, 4); } for (var q = 0; q < 5; q++) part(a.x, a.y, rand(-160, 160), rand(-200, 20), rand(0.25, 0.45), '#ff8fc7', rand(3, 6), 300); }
    } else {        // rock: slide along it; a head-on walker is nudged sideways so nobody gets stuck
      var vn = a.vx * nx + a.vy * ny; if (vn < 0) { a.vx -= vn * nx; a.vy -= vn * ny; }
      if (il > 0.15 && (a.ix * nx + a.iy * ny) / il < -0.8) { var td = nx * a.iy - ny * a.ix >= 0 ? 1 : -1, ts = speedOf(a) * dt * 0.75; a.x -= ny * td * ts; a.y += nx * td * ts; }
    }
  }
  for (i = G.crates.length - 1; i >= 0; i--) {
    o = G.crates[i]; lim = 26 + a.r; dx = a.x - o.x; dy = a.y - o.y; d = hyp(dx, dy) + 0.01; if (d >= lim) continue;
    nx = dx / d; ny = dy / d; a.x = o.x + nx * lim; a.y = o.y + ny * lim;
    if (a.atk > 0) { a.vx = nx * 380; a.vy = ny * 380; a.lunge = 0; a.atk = 0; hitCrate(a, o, i); }
    else if (P && G.started) tip('crate', a, 'LUNGE INTO THE CRATE!', '#ffd23c');
  }
  a.slowed = false;
  for (i = 0; i < M.slows.length; i++) { o = M.slows[i]; if (hyp(a.x - o.x, (a.y - o.y) / 0.9) < o.r * 0.94) { a.slowed = true; break; } }
  if (a.slowed && a.lunge <= 0) {
    if (P) tip('slow', a, T('{0}!  Lunge through it', T(THEMES[G.rb % THEMES.length].slowName)), '#ffffff');
    if (vis && il > 0.15 && rnd() < dt * 12) part(a.x + rand(-8, 8), a.y + 12, rand(-40, 40), rand(-90, -30), rand(0.3, 0.5), THEMES[G.rb % THEMES.length].slowEdge, rand(3, 6), 300);
  }
  for (i = 0; i < M.pads.length; i++) {
    o = M.pads[i]; if (hyp(a.x - o.x, a.y - o.y) >= o.r) continue;
    if (a.boostT <= 0) { o.t = 1; if (P) { Snd.zoom(); tip('pad', a, 'SPEED PAD!', '#ffe14d'); } }
    a.boostT = 1.8;
  }
  if (a.boostT > 0 && vis && il > 0.15 && rnd() < dt * 36) part(a.x - a.fx * 10 + rand(-6, 6), a.y + 8, -a.fx * rand(40, 120), -a.fy * rand(40, 120), rand(0.25, 0.45), '#ffe14d', rand(3, 6), 0);
  if (a.tp <= 0) for (i = 0; i < M.portals.length; i++) {
    o = M.portals[i]; if (hyp(a.x - o.x, a.y - o.y) >= 30 || (a.bot && a.via !== i)) continue;
    var e = M.portals[o.to], k;
    if (vis) for (k = 0; k < 12; k++) part(a.x, a.y, rand(-220, 220), rand(-220, 220), rand(0.3, 0.6), o.col, rand(4, 8), 0);
    a.x = clamp(e.x + a.fx * 48, EDGE + a.r, W - EDGE - a.r); a.y = clamp(e.y + a.fy * 48, EDGE + a.r, H - EDGE - a.r); a.tp = 2.4; a.via = -1;
    for (k = 0; k < a.carry.length; k++) { a.carry[k].x = a.x; a.carry[k].y = a.y; }
    if (P) { Snd.warp(); G.flash = Math.max(G.flash, 0.2); G.tips.portal = 1; cam.x = a.x; cam.y = a.y; }
    if (P || onScreen(a.x, a.y)) for (k = 0; k < 12; k++) part(a.x, a.y, rand(-220, 220), rand(-220, 220), rand(0.3, 0.6), o.col, rand(4, 8), 0);
    break;
  }
}
function updMap(dt) {
  var M = G.map, i, o;
  for (i = 0; i < M.rocks.length; i++) if (M.rocks[i].t > 0) M.rocks[i].t -= dt * 3;
  for (i = 0; i < M.pads.length; i++) if (M.pads[i].t > 0) M.pads[i].t -= dt * 2.5;
  for (i = 0; i < G.clouds.length; i++) {
    o = G.clouds[i]; var dx = o.tx - o.x, dy = o.ty - o.y, d = hyp(dx, dy);
    if (d < 24) { o.tx = rand(380, W - 380); o.ty = rand(330, H - 330); } else { o.x += dx / d * o.sp * dt; o.y += dy / d * o.sp * dt; }
  }
  for (i = 0; i < G.crates.length; i++) { o = G.crates[i]; o.age += dt; if (o.wob > 0) o.wob -= dt * 4; }
  G.crateT -= dt; if (G.crateT <= 0) { G.crateT = rand(14, 22); if (G.crates.length < 3) addCrate(); }
}

/* ---------- loot ---------- */
function rollKind() {
  if (evOn('gold') && rnd() < 0.55) return 'gold';
  if (evOn('rainbow') && rnd() < 0.6) { var rr = rnd(); return rr < 0.35 ? 'gem' : rr < 0.7 ? 'gold' : rr < 0.78 ? 'star' : 'donut'; }      // rainbow rain: rare loot
  var luck = UPG.luck.eff(G.up.luck), tot = 0, i, w;
  for (i = 0; i < TABLE.length; i++) { w = TABLE[i][1]; if (TABLE[i][0] === 'gem' || TABLE[i][0] === 'star') w *= luck; tot += w; }
  var r = rnd() * tot;
  for (i = 0; i < TABLE.length; i++) { w = TABLE[i][1]; if (TABLE[i][0] === 'gem' || TABLE[i][0] === 'star') w *= luck; r -= w; if (r <= 0) return TABLE[i][0] === 'heart' && G.hp >= 3 ? 'apple' : TABLE[i][0]; }
  return 'apple';
}
function mkItem(kind, x, y, z) {
  var k = KIND[kind], lm = lootMul();
  return { kind: kind, x: x, y: y, z: z, vx: 0, vy: 0, vz: 0, state: 0, life: 24, bounces: 0, noPick: 0, rot: rand(-0.5, 0.5), owner: null, sx: 0, sy: 0, ft: 0, fd: 0.25, pop: 0,
    m: k.mass * lm, c: k.coin * lm, src: 0 };
}
function spawnItem(onGround) {
  var x, y, tries = 0, ok, i, R = G.map.rocks, cl = !onGround && G.clouds.length && rnd() < 0.25 ? pick(G.clouds) : null;
  do {
    if (cl) { var ca = rnd() * TAU, cr = Math.sqrt(rnd()) * cl.r; x = clamp(cl.x + Math.cos(ca) * cr, EDGE + 20, W - EDGE - 20); y = clamp(cl.y + Math.sin(ca) * cr * 0.9, EDGE + 20, H - EDGE - 20); }
    else { x = rand(EDGE + 20, W - EDGE - 20); y = rand(EDGE + 20, H - EDGE - 20); }
    ok = true;
    for (i = 0; i < 4; i++) { var b = G.blobs[i]; if (hyp(x - b.x, y - b.y) < b.r + 30) ok = false; }
    for (i = 0; ok && i < R.length; i++) if (hyp(x - R[i].x, y - R[i].y) < R[i].r + 16) ok = false;
  } while (!ok && ++tries < 6);
  var kind = rollKind(); if (cl && kind !== 'heart' && kind !== 'star' && rnd() < 0.12) kind = 'gold';      // loot clouds rain a little richer
  var it = mkItem(kind, x, y, onGround ? 0 : rand(480, 720));
  if (onGround) { it.state = 1; it.life = rand(8, 24); rockOut(it, 14); }
  G.items.push(it); return it;
}
function burst(x, y, n, kinds, pow) {
  for (var i = 0; i < n; i++) {
    var it = mkItem(typeof kinds === 'string' ? kinds : kinds(), x, y, 8), a = rnd() * TAU, s = rand(0.3, 1) * pow;
    it.vx = Math.cos(a) * s; it.vy = Math.sin(a) * s; it.vz = rand(260, 480); it.noPick = 0.45; G.items.push(it);
  }
}
function spray(b, ang, n, kinds) {          // loot shoots out of a blob in one direction and lands outside its blast zone
  for (var i = 0; i < n; i++) {
    var it = mkItem(kinds(), b.x + Math.cos(ang) * b.r * 0.8, b.y + Math.sin(ang) * b.r * 0.8, 10), a = ang + rand(-0.9, 0.9), s = rand(280, 520);
    it.vx = Math.cos(a) * s; it.vy = Math.sin(a) * s; it.vz = rand(280, 440); it.noPick = 0.5; G.items.push(it);
  }
}
function gooBurst(b, loss, ax, ay) {     // a hit blob spits part of its mass as goo, away from its centre towards the attacker
  var n = 7, base = Math.atan2(ay - b.y, ax - b.x);
  for (var i = 0; i < n; i++) {
    var it = mkItem('goo', b.x + Math.cos(base) * b.r * 0.7, b.y + Math.sin(base) * b.r * 0.7, 14), a = base + rand(-1.1, 1.1), s = rand(160, 380);
    it.m = loss / n; it.c = loss / n * 0.4; it.raw = 1; it.src = b.id; it.vx = Math.cos(a) * s; it.vy = Math.sin(a) * s; it.vz = rand(240, 420); it.noPick = 0.5; it.life = 20; G.items.push(it);
  }
}
function gooFly(b, amount, n, ax, ay) {   // goo the player steals flies straight into the player's blob: nothing to carry, nothing to lose
  var home = G.blobs[0], base = Math.atan2(ay - b.y, ax - b.x), dist = hyp(home.x - b.x, home.y - b.y);
  for (var i = 0; i < n; i++) {
    var ang = base + rand(-0.6, 0.6), it = mkItem('goo', b.x + Math.cos(ang) * b.r * 0.6, b.y + Math.sin(ang) * b.r * 0.6, 0);
    it.m = amount / n; it.c = 0; it.raw = 1; it.fly = 1; it.src = b.id; it.state = 3; it.owner = home; it.sx = it.x; it.sy = it.y; it.ft = 0; it.fd = 0.35 + dist / 1500 + i * 0.05;
    G.items.push(it);
  }
}
function dropFrom(a, n) {
  for (var i = 0; i < n && a.carry.length; i++) {
    var it = a.carry.pop(), ang = rnd() * TAU, s = rand(130, 330);
    a.used -= KIND[it.kind].slots; it.state = 0; it.z = 12; it.vz = rand(240, 420); it.vx = Math.cos(ang) * s; it.vy = Math.sin(ang) * s;
    it.life = 24; it.bounces = 0; it.noPick = 0.6; it.owner = null;
  }
}
function updItems(dt) {
  var g = G.grav, lg = evOn('lowgrav'), tor = evOn('tornado') ? G.event.data : null, n = 0;
  for (var i = G.items.length - 1; i >= 0; i--) {
    var it = G.items[i];
    if (it.pop > 0) it.pop -= dt * 4;
    if (it.noPick > 0) it.noPick -= dt;
    if (it.pull > 0) it.pull -= dt;
    if (it.state === 0) {
      it.vz -= g * dt; it.z += it.vz * dt; it.x += it.vx * dt; it.y += it.vy * dt;
      if (it.z <= 0) {
        it.z = 0;
        if (Math.abs(it.vz) > 150 && it.bounces < (lg ? 3 : 1)) { it.vz = -it.vz * (lg ? 0.62 : 0.34); it.bounces++; }
        else { it.vz = 0; it.state = 1; rockOut(it, 14); if (onScreen(it.x, it.y)) dust(it.x, it.y, 3); }
      }
    } else if (it.state === 1) {
      n++;
      if (tor) { var dx = tor.x - it.x, dy = tor.y - it.y, d = hyp(dx, dy) + 1, f = clamp(900 / (d + 120), 0.4, 5); it.vx += (dx / d * 150 - dy / d * 260) * f * dt; it.vy += (dy / d * 150 + dx / d * 260) * f * dt; }
      if (it.vx || it.vy) { var fr = Math.exp(-(tor ? 1.6 : 3.2) * dt); it.vx *= fr; it.vy *= fr; it.x += it.vx * dt; it.y += it.vy * dt; rockOut(it, 14); if (Math.abs(it.vx) + Math.abs(it.vy) < 2) it.vx = it.vy = 0; }
      it.life -= dt; if (it.life <= 0) { G.items.splice(i, 1); continue; }
      if (it.kind !== 'goo' && it.kind !== 'heart') for (var q = it.pull > 0 ? 3 : 0; q < 4; q++) { var bb = G.blobs[it.pull > 0 ? 0 : q]; if (Math.abs(it.x - bb.x) < bb.r && hyp(it.x - bb.x, it.y - bb.y) < bb.r * 0.66) { it.state = 3; it.owner = bb; it.sx = it.x; it.sy = it.y; it.ft = 0; it.fd = 0.18; bb.mouthT = 0.3; break; } }
    } else if (it.state === 3) {
      it.ft += dt / it.fd; var b = it.owner, t = Math.min(1, it.ft);
      it.x = lerp(it.sx, b.x, t); it.y = lerp(it.sy, b.y - b.r * 0.1, t); it.z = Math.sin(t * Math.PI) * (it.fly ? 110 : 60);
      if (it.fly && rnd() < 0.5 && onScreen(it.x, it.y)) part(it.x, it.y - it.z, rand(-24, 24), rand(-24, 24), 0.4, COLORS[it.src], rand(4, 7), 0);
      if (it.ft >= 1) { eat(b, it); G.items.splice(i, 1); continue; }
    }
    if (it.state < 2) {
      if (it.x < EDGE) { it.x = EDGE; it.vx = Math.abs(it.vx); } else if (it.x > W - EDGE) { it.x = W - EDGE; it.vx = -Math.abs(it.vx); }
      if (it.y < EDGE) { it.y = EDGE; it.vy = Math.abs(it.vy); } else if (it.y > H - EDGE) { it.y = H - EDGE; it.vy = -Math.abs(it.vy); }
    }
  }
  G.ground = n;
  var rate = 14.5 * (1 + 0.05 * Math.min(G.blobs[0].level - 1, 12));      // scaled with the arena, so loot is as dense as before
  if (evOn('gold')) rate *= 2.1; else if (evOn('frenzy')) rate *= 2; else if (evOn('boss')) rate *= 1.3; else if (evOn('rainbow')) rate *= 1.8;
  if (n < 520) { G.spawnAcc += rate * dt; while (G.spawnAcc >= 1) { G.spawnAcc -= 1; spawnItem(false); } }
}

/* ---------- blobs ---------- */
function eat(b, it) {
  var a = G.actors[b.id];
  var gain = it.m * (it.raw ? 1 : b.id ? a.gainMul : massMul()); b.mass += gain; b.wobV += 2.4; b.mouthT = 0.35;
  if (b.id === 0 && !it.fly) G.rateAcc += gain;
  if (b.id === 0) {
    a.combo = a.comboT > 0 ? a.combo + 1 : 1; a.comboT = 0.5;
    G.fever = Math.min(100, G.fever + 0.8); G.feverT = 5;
    var c = it.c * coinMul();
    if (G.lucky > 0 && !it.fly && c > 0) { c *= 2; G.lucky--; say(b.x, b.y - b.r - 40, T('LUCKY x2!  {0} left', G.lucky), '#fff36b', 20); }      // lucky star: the next pickups pay double
    if (it.kind === 'cake') { say(b.x, b.y - b.r - 60, 'GOLDEN CAKE!', '#ffd23c', 28); Snd.fanfare(); }
    if (c > 0) { addCoins(c); a.gain += c; if (KIND[it.kind].coin >= 8) Snd.coin(); }
    if (!it.fly) G.stats.fed++; if (it.kind === 'gem') G.stats.crystals++;
    Snd.gulp(a.combo);
    if (it.kind === 'star') { a.starT = Math.max(a.starT, 10); say(a.x, a.y - 50, 'MEGA MAGNET!', '#fff36b', 22); }
  }
  splat(b.x + rand(-b.r, b.r) * 0.3, b.y - b.r * 0.2, COLORS[b.id], 3);
  while (b.mass >= LVT[b.level]) { b.level++; if (b.id === 0) levelUp(b); else b.flash = 1; }
}
function levelUp(b) {
  b.flash = 1; G.flash = 0.6; G.shake = 10; Snd.level();
  say(b.x, b.y - b.r - 40, T('LEVEL {0}!', b.level), '#ffffff', 34);
  say(b.x, b.y - b.r - 8, lvName(b.level), '#ffe98a', 24);
  for (var i = 0; i < 40; i++) part(b.x, b.y, rand(-320, 320), rand(-420, 80), rand(0.6, 1.3), pick(['#fff36b', '#ff8fc7', '#7ad7ff', '#8cf58a']), rand(4, 8), 500);
  burst(b.x, b.y - b.r, 8 + Math.min(b.level, 10), function () { return rnd() < 0.25 ? 'gem' : 'gold'; }, 380);
  var reward = Math.round(14 * lootMul() * b.level * UPG.stomach.eff(G.up.stomach) * starMul());
  if (b.level >= 3) { G.gems += 2; G.pend.push({ type: 'levelup', level: b.level, reward: reward }); }
  else addCoins(reward);
}
function addCoins(c) { G.coins += c; G.total += c; }
function updBlobs(dt) {
  var i, b;
  for (i = 0; i < 4; i++) {
    b = G.blobs[i]; b.r = lerp(b.r, blobR(b), 1 - Math.exp(-4 * dt));
    b.wobV += -b.wob * 90 * dt; b.wobV *= Math.exp(-6 * dt); b.wob += b.wobV * dt;
    b.mouthT -= dt; b.mouth = lerp(b.mouth, b.mouthT > 0 ? 1 : 0, 1 - Math.exp(-14 * dt));
    b.blink -= dt; if (b.blink < -0.12) b.blink = rand(2, 5);
    if (b.flash > 0) b.flash -= dt * 1.4;
    if (b.hitCd > 0) b.hitCd -= dt; if (b.shield > 0) b.shield -= dt; if (b.sad > 0) b.sad -= dt;
    if (b.hitT > 0) { b.hitT -= dt; if (b.hitT <= 0) b.hits = 0; }
    if (b.rage > 0) { b.rage -= dt; b.wobV += Math.sin(G.t * 40) * 90 * dt; if (b.rage <= 0) enrage(b); }
  }
  G.rate += (G.rateAcc / dt - G.rate) * (1 - Math.exp(-dt / 40)); G.rateAcc = 0;      // the player's own feeding rate, averaged over the last 40 seconds or so
  addCoins(cpsNow() * dt);
  if (G.feverT > 0) G.feverT -= dt; else if (G.fever > 0) G.fever = Math.max(0, G.fever - 1.6 * dt);
  if (G.boost.x2 > 0) G.boost.x2 -= dt;
  if (G.alarm > 0) G.alarm -= dt;
  G.leadT -= dt;
  if (G.leadT <= 0) {
    G.leadT = 0.5; var best = 0; for (i = 1; i < 4; i++) if (G.blobs[i].mass > G.blobs[best].mass) best = i;
    var nl = G.blobs[best].mass > 0 ? best : -1, P = G.actors[0];
    if (nl !== G.leader && G.leader >= 0 && G.t > 30 && G.t - G.crownT > 8 && (nl === 0 || G.leader === 0)) {
      G.crownT = G.t;
      if (nl === 0) { Snd.crown(); say(P.x, P.y - 70, 'YOU TOOK THE CROWN!  +25% coins', '#ffd23c', 24); }
      else say(P.x, P.y - 70, T('{0} took your crown!', NAMES[nl]), '#ff6b5b', 22);
    }
    G.leader = nl;
  }
  // rivals stay within reach of the player: the further behind, the more they get out of every bite
  var pm = G.blobs[0].mass + 40 * lootMul(), want = [0, 0.97, 0.7, 0.84];
  for (i = 1; i < 4; i++) { var r = (G.blobs[i].mass + 40 * lootMul()) / pm, a = G.actors[i]; a.skill = clamp(1 + 0.5 * (want[i] - r), 0.7, 1.15); a.gainMul = clamp(1 + 3 * (want[i] - r), 0.35, 3.5) * massMul() * (G.t < 45 ? 0.55 : 1); }
}

/* ---------- effects ---------- */
function part(x, y, vx, vy, life, col, size, grav) { if (G.parts.length < 400) G.parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, col: col, size: size, g: grav || 0 }); }
function dust(x, y, n) { for (var i = 0; i < n; i++) part(x, y, rand(-50, 50), rand(-40, 5), rand(0.25, 0.5), 'rgba(140,110,80,.5)', rand(3, 6), 0); }
function splat(x, y, col, n) { for (var i = 0; i < n; i++) part(x, y, rand(-120, 120), rand(-200, -40), rand(0.3, 0.6), col, rand(3, 6), 600); }
function say(x, y, str, col, size, align) { G.texts.push({ x: x, y: y, str: str, col: col || '#fff', size: size || 18, life: 1.1, max: 1.1, align: align }); if (G.texts.length > 40) G.texts.shift(); }
function updFx(dt) {
  var i, p;
  for (i = G.parts.length - 1; i >= 0; i--) { p = G.parts[i]; p.life -= dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  for (i = G.texts.length - 1; i >= 0; i--) { p = G.texts[i]; p.life -= dt; p.y -= 46 * dt; if (p.life <= 0) G.texts.splice(i, 1); }
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.flash > 0) G.flash -= dt;
}
function shock(x, y, rad, pow, skip) {
  var i, d, dx, dy, f;
  for (i = 0; i < G.actors.length; i++) { var a = G.actors[i]; if (a === skip) continue; dx = a.x - x; dy = a.y - y; d = hyp(dx, dy) + 0.01; if (d < rad) { f = (1 - d / rad) * pow; a.vx += dx / d * f; a.vy += dy / d * f; a.stun = Math.max(a.stun, 0.25); } }
  for (i = 0; i < G.items.length; i++) { var it = G.items[i]; if (it.state !== 1) continue; dx = it.x - x; dy = it.y - y; d = hyp(dx, dy) + 0.01; if (d < rad) { f = (1 - d / rad) * pow * 0.8; it.vx += dx / d * f; it.vy += dy / d * f; } }
}
var VIEW = { x: 0, y: 0, w: 900, h: 600 };
function onScreen(x, y) { return Math.abs(x - VIEW.x) < VIEW.w / 2 + 60 && Math.abs(y - VIEW.y) < VIEW.h / 2 + 60; }
