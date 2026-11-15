"""Keep-playing pass (handover 007): checks every new event, the pickup combo, surprises, achievements, the album and
their saving; then simulates the first 15 minutes with the autopilot and prints the timeline of new things.
Call: python3 test/events_test.py [checks|timeline|all]      (needs node build.mjs first)"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'
fails = []
def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok: fails.append(msg)

# helpers inside the page: a calm world, steps without the autopilot, an event forced to start right away
HELP = """window.T_ = {
  calm: function () { G.modal = null; G.pend.length = 0; G.event = null; G.banner = null; G.boss = null; G.treasure = null; G.feast = null; G.lucky = 0; G.grav = 900; G.meteors = []; G.nextEvent = G.t + 999; G.surpriseT = 999; G.calm = 99; G.hp = 3; },
  steps: function (n) { for (var i = 0; i < n; i++) { G.calm = 99; G.hp = 3; step(1 / 60); } },
  force: function (ty) { this.calm(); G.evForce = ty; G.nextEvent = G.t; this.steps(1); G.event.pre = 0; this.steps(2); return G.event && G.event.on && G.event.type === ty; },
  lungeAt: function (x, y) { var P = G.actors[0], dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy) || 1; P.stam = 100; P.lungeCd = 0; P.stun = 0; P.tired = 0; IN.x = dx / d; IN.y = dy / d; IN.lunge = true; for (var k = 0; k < 14; k++) { IN.x = dx / d; IN.y = dy / d; G.calm = 99; step(1 / 60); } IN.x = IN.y = 0; }
};"""

async def checks(pg):
    await pg.evaluate("localStorage.clear(); __fb.seed(21); __fb.fresh(); G.started = true; __fb.sim(30, true, false); G.auto = false;" + HELP)

    print('Treasure blob')
    ok = await pg.evaluate("T_.force('treasure')"); tr = await pg.evaluate("!!G.treasure")
    check(ok and tr, 'starts and spawns a treasure blob')
    d0 = await pg.evaluate("var P = G.actors[0], t = G.treasure; P.x = t.x - 220; P.y = t.y; Math.hypot(t.x - P.x, t.y - P.y)")
    await pg.evaluate("T_.steps(30)"); d1 = await pg.evaluate("var P = G.actors[0], t = G.treasure; Math.hypot(t.x - P.x, t.y - P.y)")
    check(d1 > d0, f'runs away from the player ({d0:.0f} -> {d1:.0f} px)')
    g0 = await pg.evaluate("G.gems")
    for _ in range(3):
        await pg.evaluate("var P = G.actors[0], t = G.treasure; if (t) { P.x = t.x - t.r - 60; P.y = t.y; t.vx = t.vy = 0; T_.lungeAt(t.x, t.y); T_.steps(32); }")
    st = await pg.evaluate("[G.stats.treasures, G.treasure === null || !G.event, G.items.filter(function (i) { return i.kind === 'gem'; }).length]")
    check(st[0] == 1 and st[1], f'3 lunges catch it, the event ends (treasures {st[0]})')
    check(await pg.evaluate("G.gems") - g0 >= 3 and st[2] > 0, 'catching pays 3 gems and drops crystals')

    print('Rainbow rain')
    ok = await pg.evaluate("T_.force('rainbow')")
    share = await pg.evaluate("var n = 0; for (var i = 0; i < 600; i++) { var k = rollKind(); if (k === 'gem' || k === 'gold' || k === 'star') n++; } n / 600")
    T_off = await pg.evaluate("T_.calm(); var n = 0; for (var i = 0; i < 600; i++) { var k = rollKind(); if (k === 'gem' || k === 'gold' || k === 'star') n++; } n / 600")
    check(ok and share > T_off + 0.3, f'rare loot share {share:.2f} (normal {T_off:.2f})')

    print('Giant snack')
    ok = await pg.evaluate("T_.force('feast')"); f0 = await pg.evaluate("[G.feast.hp, G.items.length, Math.min.apply(null, [1, 2, 3].map(function (i) { var a = G.actors[i]; a.carry.length = 0; a.used = 0; a.ai.mode = 'seek'; if (i === 1) { a.x = G.feast.x + 600; a.y = G.feast.y; } return Math.hypot(a.x - G.feast.x, a.y - G.feast.y); }))]")
    await pg.evaluate("T_.steps(60 * 12)")
    f1 = await pg.evaluate("[G.feast ? G.feast.hp : 0, Math.min.apply(null, [1, 2, 3].map(function (i) { var a = G.actors[i]; return G.feast ? Math.hypot(a.x - G.feast.x, a.y - G.feast.y) : 0; }))]")
    check(ok and f1[0] < f0[0], f'rivals race to it and bite chunks off (hp {f0[0]} -> {f1[0]}, nearest rival {f0[2]:.0f} -> {f1[1]:.0f} px)')
    hp = await pg.evaluate("var f = G.feast; if (!f) 0; else { var P = G.actors[0]; P.x = f.x - f.r - 50; P.y = f.y; var h = f.hp; T_.lungeAt(f.x, f.y); h - (G.feast ? G.feast.hp : 0); }")
    check(hp >= 1, 'a player lunge bites a chunk off')

    print('Blob party')
    ok = await pg.evaluate("T_.force('party')")
    r = await pg.evaluate("var m0 = G.blobs[0].mass, c0 = G.coins, atk = 0, P = G.actors[0]; P.x = G.blobs[1].x; P.y = G.blobs[1].y + G.blobs[1].r + 60; P.carry.length = 0; for (var i = 0; i < 4; i++) { var a = G.actors[i]; } for (var k = 0; k < 60 * 6; k++) { G.calm = 99; G.hp = 3; step(1 / 60); for (var j = 1; j < 4; j++) if (G.actors[j].atk > 0) atk++; } [G.blobs[0].mass - m0, G.coins - c0, atk]")
    check(ok and r[0] > 0 and r[1] > 0, f'rival blobs send gifts (mass +{r[0]:.0f}, coins +{r[1]:.0f})')
    check(r[2] == 0, f'rivals never lunge during the party (lunge frames {r[2]})')

    print('Lucky star')
    ok = await pg.evaluate("T_.force('lucky')")
    l = await pg.evaluate("var b = G.blobs[0], base = mkItem('donut', b.x, b.y, 0), c0 = G.coins; eat(b, base); var got = G.coins - c0; G.lucky = 0; var c1 = G.coins; eat(b, mkItem('donut', b.x, b.y, 0)); [got / (G.coins - c1), G.lucky]")
    check(ok and abs(l[0] - 2) < 0.05, f'pickups pay double while lucky (ratio {l[0]:.2f})')
    await pg.evaluate("T_.force('lucky'); G.lucky = 1; eat(G.blobs[0], mkItem('apple', 0, 0, 0)); T_.steps(2)")
    check(await pg.evaluate("!G.event && G.lucky === 0"), 'the event ends when the 10 pickups are used')

    print('Pickup combo')
    await pg.evaluate("T_.calm(); G.pcombo = 0; G.pcomboT = -9; G.up.carry = 40")
    c = await pg.evaluate("var P = G.actors[0], c0 = G.coins; P.carry.length = 0; P.used = 0; for (var i = 0; i < 12; i++) { var it = mkItem('apple', P.x, P.y, 0); it.state = 1; G.items.push(it); T_.steps(3); } [G.pcombo, G.pbest, G.texts.some(function (t) { return t.str.indexOf('COMBO x10') === 0; })]")
    check(c[0] >= 10 and c[1] >= 10 and c[2], f'fast pickups chain up, x10 pays a bonus (combo {c[0]})')
    c2 = await pg.evaluate("var P = G.actors[0]; P.starT = 0; G.spawnAcc = -999; for (var k = 0; k < 90; k++) { G.items.length = 0; T_.steps(1); } G.items.length = 0; G.spawnAcc = 0; var it = mkItem('apple', P.x, P.y, 0); it.state = 1; G.items.push(it); T_.steps(3); G.pcombo")
    check(c2 == 1, 'a pause resets the combo')

    print('Surprises')
    s = await pg.evaluate("T_.calm(); G.surpriseT = 0; var n0 = G.stats.surprises, k0 = G.items.filter(function (i) { return i.kind === 'cake'; }).length; T_.steps(1); var a = [G.stats.surprises - n0, G.items.filter(function (i) { return i.kind === 'cake'; }).length - k0]; G.surpriseT = 0; T_.steps(1); a.push(G.crates.filter(function (c) { return c.lucky; }).length, G.surpriseT > 20); a")
    check(s[0] == 1 and s[1] == 1 and s[2] >= 1 and s[3], f'between events: a golden cake, then a lucky crate (cake {s[1]}, lucky crates {s[2]})')
    lc = await pg.evaluate("var c = G.crates.filter(function (c) { return c.lucky; })[0], P = G.actors[0], g0 = G.gems; for (var h = 0; h < 2; h++) { P.x = c.x - 90; P.y = c.y; T_.lungeAt(c.x, c.y); for (var k = 0; k < 40; k++) { for (var j = 1; j < G.actors.length; j++) if (Math.hypot(G.actors[j].x - c.x, G.actors[j].y - c.y) < 500) { G.actors[j].x = c.x + 900; G.actors[j].y = c.y; } T_.steps(1); } } [G.gems - g0, G.crates.indexOf(c) < 0]")
    check(lc[1] and lc[0] >= 2, f'a lucky crate pays 2 gems when smashed (+{lc[0]})')
    q = await pg.evaluate("T_.calm(); G.surpriseT = 5; G.evForce = 'gold'; G.nextEvent = G.t; T_.steps(1); var t0 = G.surpriseT; G.calm = 99; step(1); [t0, G.surpriseT]")
    check(q[0] == q[1], 'no surprise timer while an event runs')

    print('Achievements')
    a = await pg.evaluate("T_.calm(); G.ach = {}; var g0 = G.gems; G.stats.fed = Math.max(G.stats.fed, 100); metaT = 0; T_.steps(2); [!!G.ach.fed100, G.gems - g0, document.getElementById('ach').className]")
    check(a[0] and a[1] >= 5 and 'show' in a[2], f'feed 100 unlocks, pays gems, shows the banner (+{a[1]})')
    n = await pg.evaluate("ACH.length"); check(n >= 15, f'{n} achievements')

    print('Album')
    al = await pg.evaluate("T_.calm(); G.album.loot = {}; G.albumDone = {}; var before = albumReady(); ALBUM[0].list().forEach(function (k) { G.album.loot[k] = 1; }); var g0 = G.gems, ready = albumReady(); ACT.album('loot'); var g1 = G.gems; ACT.album('loot'); [before, ready, g1 - g0, G.gems - g1, !!G.albumDone.loot]")
    check(not al[0] and al[1] and al[2] == 15 and al[3] == 0 and al[4], f'a full page pays 15 gems once (ready {al[1]}, paid {al[2]}, twice {al[3]})')
    ev = await pg.evaluate("Object.keys(G.album.ev).length"); check(ev >= 5, f'events seen are recorded ({ev})')
    await pg.evaluate("G.modal = null; ACT.shop('album')"); ui = await pg.evaluate("[document.querySelectorAll('.apage').length, document.querySelectorAll('.st').length, document.querySelectorAll('.arow').length]")
    check(ui[0] == 5 and ui[1] > 50 and ui[2] == n, f'album tab shows 4 pages + achievements ({ui})'); await pg.evaluate("ACT.close()")

    print('Saving and rebirth')
    sv = await pg.evaluate("G.pbest = 33; save(); var s = JSON.parse(localStorage.getItem(SAVEKEY)); newGame(s); [!!G.album.loot.apple, !!G.albumDone.loot, !!G.ach.fed100, G.pbest]")
    check(sv == [True, True, True, 33], f'album, album rewards, achievements and best combo survive save/load {sv}')
    rb = await pg.evaluate("G.blobs[0].level = rbLevel(); G.auto = true; doRebirth(1); G.auto = false; [!!G.album.loot.apple, !!G.ach.fed100, G.pbest]")
    check(rb == [True, True, 33], f'...and a rebirth {rb}')

async def timeline(pg):
    print('First 15 minutes, autopilot, seed 5 (what is new and when)')
    rows = await pg.evaluate("""(function () {
      localStorage.clear(); __fb.seed(5); __fb.fresh(); G.started = true; G.auto = true;
      var out = [], last = { ev: null, sur: 0, lvl: 1, q: 0, ach: 0, tre: 0 }, i, s;
      for (s = 1; s <= 900; s++) {
        for (i = 0; i < 60; i++) step(1 / 60);
        var a = Object.keys(G.ach).length, e = G.event ? G.event.type : null;
        if (e && e !== last.ev) out.push([s, 'event', e]); last.ev = e;
        if (G.stats.surprises > last.sur) out.push([s, 'surprise', G.surpriseN % 2 ? 'golden cake' : 'lucky crate']); last.sur = G.stats.surprises;
        if (G.blobs[0].level > last.lvl) out.push([s, 'level', 'Lv ' + G.blobs[0].level]); last.lvl = G.blobs[0].level;
        if (G.quest > last.q) out.push([s, 'quest', 'quest ' + G.quest + ' done']); last.q = G.quest;
        if (a > last.ach) out.push([s, 'achievement', Object.keys(G.ach).slice(last.ach).join(', ')]); last.ach = a;
      }
      return out;
    })()""")
    prev = 0; gaps = []
    for s, kind, what in rows:
        print(f'  {s // 60:2d}:{s % 60:02d}  {kind:11s} {what}'); gaps.append(s - prev); prev = s
    early = [g for (s, _, _), g in zip(rows, gaps) if s <= 600]
    print(f'  longest gap without anything new in the first 10 min: {max(early)} s')
    check(max(early) <= 60, 'early game: something new at least every 60 s')
    check(len([r for r in rows if r[1] == 'event']) >= 12, 'at least 12 events in 15 minutes')

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        pg = await (await br.new_context(viewport={'width': 1100, 'height': 700}, locale='en-US')).new_page()
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(300)
        if MODE in ('checks', 'all'): await checks(pg)
        if MODE in ('timeline', 'all'): await timeline(pg)
        await br.close()
    check(not errs, f'runtime errors: {errs[:5]}')
    print('Result:', 'all green' if not fails else f'{len(fails)} failed')
    if fails: sys.exit(1)

asyncio.run(main())
