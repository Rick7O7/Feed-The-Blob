"""Squishy knockback (012 task 3) and rivals that feel like players (012 task 4): tumble timer and spin, edge bounce,
loot that sprays out and bounces twice, rival names/skins/hats (save, reload, rebirth), rivalLook, ranking.
Call: python3 test/rivals_test.py      (needs node build.mjs first)"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
fails = []
def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok: fails.append(msg)

SETUP = "localStorage.clear(); __fb.seed(7); __fb.fresh(); G.started = true; G.auto = false;"

async def checks(pg):
    print('Tumble')
    r = await pg.evaluate(SETUP + """var P = G.actors[0], B = G.actors[1]; B.x = 1800; B.y = 1200; B.immune = B.inv = 0; P.x = 1760; P.y = 1200; P.fx = 1; P.fy = 0;
      B.carry = []; B.used = 0; for (var i = 0; i < 6; i++) { var it = mkItem('apple', B.x, B.y, 0); it.state = 2; it.owner = B; B.carry.push(it); G.items.push(it); B.used++; }
      bonk(P, B, 1); var drop = G.items.filter(function (it) { return it.state === 0; });
      [B.tum, B.tumT, B.tumD, B.stun, drop.length, drop.every(function (it) { return it.bmax === 2 && it.vx > -100; }), Math.round(B.vx)]""")
    check(abs(r[0] - 0.55) < 1e-9 and r[1] == r[0] and r[2] in (1, -1) and r[3] == 0.5, f'bot hit by a lunge tumbles 0.55 s, spin set, stun unchanged 0.5 ({r[:4]})')
    check(r[4] == 6 and r[5], f'all its loot sprays out away from the attacker, 2 bounces each ({r[4]}, {r[5]})')
    check(r[6] >= 470, f'bot knockback 480 ({r[6]})')
    r = await pg.evaluate(SETUP + "var P = G.actors[0], B = G.actors[1]; P.inv = P.immune = 0; P.x = 1800; P.y = 1200; B.x = 1760; B.y = 1200; B.fx = 1; B.fy = 0; bonk(B, P, 1); [P.tum, P.stun]")
    check(abs(r[0] - 0.35) < 1e-9 and r[1] == 0.5, f'player tumbles only 0.35 s, stun unchanged ({r})')
    r = await pg.evaluate("for (var i = 0; i < 40; i++) step(1/60); [G.actors[0].tum <= 0, G.actors[0].stun <= 0]")
    check(r == [True, True], f'tumble and stun run out ({r})')
    r = await pg.evaluate(SETUP + "var B = G.actors[1]; B.x = EDGE + B.r + 2; B.y = 1200; B.vx = -500; B.vy = 0; B.tum = 0.5; B.stun = 0.5; B.ai.mode = 'seek'; step(1/60); [B.vx > 0, B.x >= EDGE + B.r]")
    check(r == [True, True], f'a tumbling blob bounces off the arena edge ({r})')
    r = await pg.evaluate(SETUP + "var B = G.actors[1]; B.x = EDGE + B.r + 2; B.y = 1200; B.vx = -500; B.vy = 0; B.tum = 0; B.stun = 0.5; step(1/60); [B.vx <= 0]")
    check(r == [True], f'without a tumble the edge does not bounce (old behaviour) ({r})')
    r = await pg.evaluate(SETUP + "var B = G.actors[1]; var it = mkItem('apple', 1500, 1000, 0); B.carry = [it]; B.used = 1; it.state = 2; G.items.push(it); dropFrom(B, 1); [it.bmax]")
    check(r == [1], f'normal drops (no knock) keep one bounce ({r})')
    r = await pg.evaluate(SETUP + """var it = mkItem('apple', 1500, 1000, 0); G.items.push(it); it.state = 0; it.z = 0.1; it.vz = -400; it.vx = it.vy = 0; it.bounces = 0; it.bmax = 2;
      var n = 0; for (var i = 0; i < 240 && it.state === 0; i++) { var b0 = it.bounces; step(1/60); } [it.bounces, it.state]""")
    check(r[0] == 2 and r[1] == 1, f'knocked loot bounces twice, then lands ({r})')

    print('Rivals')
    r = await pg.evaluate(SETUP + "[NAMES.slice(), G.rv.s.slice(), G.rv.h.slice()]")
    names, skins, hats = r
    pool = await pg.evaluate("RNAMES"); hatids = await pg.evaluate("HATS.map(function (h) { return h.id; })")
    check(names[0] == 'You' and len(set(names[1:])) == 3 and all(n in pool for n in names[1:]), f'3 different made-up handles ({names})')
    check(len(set(skins)) == 3 and 'classic' not in skins and await pg.evaluate("G.rv.s.every(function (id) { return findIn(SKINS, id).h >= 0 && id !== G.skin; })"), f'3 different skins, no classic, no own-hue skin, not the player\'s ({skins})')
    check(all(h in hatids and h != 'crown' for h in hats), f'hats from HATS, never the crown ({hats})')
    lk = await pg.evaluate("[rivalLook(1).skin.h === BHUE[1], rivalLook(1).skin.id === G.rv.s[0], rivalLook(1).hat === G.rv.h[0], rivalLook(0).skin.id === G.skin]")
    check(all(lk), f'rivalLook: pattern on team hue, own hat; player look = own skin ({lk})')
    check(await pg.evaluate("var h0 = findIn(SKINS, G.rv.s[0]).h; rivalLook(1); findIn(SKINS, G.rv.s[0]).h === h0"), 'SKINS entry not changed by rivalLook')
    r = await pg.evaluate("var a = NAMES.join(); save(); newGame(load()); [a === NAMES.join(), G.rv.s.join()]")
    check(r[0] and r[1] == ','.join(skins), f'reload keeps the same rivals ({r})')
    r = await pg.evaluate("__fb.seed(8); __fb.fresh(); NAMES.join()")
    check(r != ','.join(names), f'another seed gives other rivals ({r})')
    r = await pg.evaluate(SETUP + "var a = NAMES.join(); G.blobs[0].mass = 1e9; G.blobs[0].level = 20; G.auto = true; doRebirth(1); G.auto = false; [a, NAMES.join(), G.rb]")
    check(r[0] != r[1] and r[2] == 1, f'rebirth brings new rivals ({r})')

    print('Ranking')
    r = await pg.evaluate(SETUP + "G.blobs[0].mass = 50; G.blobs[1].mass = 900; G.blobs[2].mass = 10; G.blobs[3].mass = 300; ranking().map(function (x) { return [x.id, x.name, x.you]; })")
    check([x[0] for x in r] == [1, 3, 0, 2] and r[2][2] and r[0][1] == await pg.evaluate("NAMES[1]"), f'ranking sorted by mass, names, you flag ({r})')

    print('Smoke: 3 min autopilot with raider')
    r = await pg.evaluate(SETUP + "G.raider = 700; __fb.sim(180, true, false); [G.stats.bonks, G.actors.every(function (a) { return isFinite(a.x) && isFinite(a.y); })]")
    check(r[1], f'3 min play, positions finite, bonks {r[0]}')

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await checks(pg)
        await br.close()
    for e in errs: fails.append('page error: ' + e)
    print('FAILS:', len(fails)); [print('  ', f) for f in fails]
    sys.exit(1 if fails else 0)

asyncio.run(main())
