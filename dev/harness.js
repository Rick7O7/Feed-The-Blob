/* ---------- only in the test build, never in a portal build ---------- */
// test harness: lets an automated run fast-forward the simulation and read the state
window.__fb = {
  state: function () { var b = G.blobs[0]; return { t: G.t, coins: G.coins, total: G.total, gems: G.gems, stars: G.stars, rb: G.rb, level: b.level, mass: b.mass, up: G.up, stats: G.stats, quest: G.quest, items: G.items.length, hp: G.hp, fever: G.fever, leader: G.leader, rivals: G.blobs.slice(1).map(function (x) { return Math.round(x.mass); }), carry: G.actors[0].used, event: G.event ? G.event.type : null, modal: G.modal ? G.modal.type : null }; },
  sim: function (sec, auto, rebirth) { G.started = true; G.auto = auto !== false; for (var i = 0, n = Math.round(sec * 60); i < n; i++) { step(1 / 60); if (rebirth && canRebirth()) { G.auto = false; doRebirth(1); G.auto = true; } } G.auto = false; return this.state(); },
  seed: function (s) { _seed = s >>> 0; }, fresh: function () { newGame(null); }, event: function (ty) { G.event = null; G.boss = null; G.grav = 900; G.nextEvent = G.t; G.evForce = ty; }
};
