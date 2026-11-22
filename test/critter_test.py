"""Critters (handover 013): hatch, income, steal on jackpot, rival steal rules, revenge, save, rebirth; then a
15-minute autopilot timeline with hatch times and the critter share of the income.
Call: python3 test/critter_test.py [checks|timeline|all]      (needs node build.mjs first)"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'
fails = []
def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok: fails.append(msg)

async def checks(pg):
    await pg.evaluate("localStorage.clear(); __fb.seed(5); __fb.fresh(); G.started = true; __fb.sim(10, true, false); G.auto = false")
    st = await pg.evaluate("[G.crit[0].length, G.crit[1].length, G.crit[2].length, G.crit[3].length]")
    check(st[0] == 0 and all(n >= 1 for n in st[1:]), f'new game: player has none, every rival has one ({st})')

    print('Hatch')
    c0 = await pg.evaluate("cpsNow()")
    r = await pg.evaluate("var n = eggNeed() / EGG_PTS.gem, k = 0; while (G.crit[0].length === 0 && k < 400) { critFeed({ kind: 'gem' }); k++; } [n, k, G.crit[0].length, G.stats.hatched, !!G.album.crit[G.crit[0][0]]]")
    check(abs(r[1] - r[0]) <= 1 and r[2] == 1 and r[3] == 1 and r[4], f'egg meter: {r[0]:.0f} gems hatch one critter, album sticker set ({r})')
    check(await pg.evaluate("critFeed({ kind: 'gem', fly: true }); critFeed({ kind: 'apple' }); G.egg") == 0, 'flying goo and normal loot do not fill the egg')
    c1 = await pg.evaluate("cpsNow()")
    check(c1 > c0, f'a critter raises passive income ({c0:.2f} -> {c1:.2f}/s)')
    r = await pg.evaluate("G.crit[0] = []; for (var i = 0; i < 9; i++) critGive('pip', '{0}'); var a = G.crit[0].length; critGive('jelly', '{0}'); [a, G.crit[0].length, G.crit[0].indexOf('jelly') >= 0]")
    check(r[0] == 8 and r[1] == 8 and r[2], f'cap 8, a better critter replaces the weakest ({r})')

    print('Steal')
    r = await pg.evaluate("G.crit[0] = ['pip']; G.crit[1] = ['bean', 'owl']; G.revenge = null; critJackpot(G.blobs[1]); [G.crit[0].join(), G.crit[1].join()]")
    check(r == ['pip,owl', 'bean'], f'jackpot takes the rival\'s best critter ({r})')
    r = await pg.evaluate("G.t = 400; G.critLoss = -999; G.crit[0] = ['pip']; var a = G.actors[2]; a.ai.mode = 'raid'; a.ai.blob = G.blobs[0]; critRaidStart(a); [!!G.critWarn]")
    check(r == [False], 'no warning and no steal while you own only one critter')
    r = await pg.evaluate("G.crit[0] = ['owl', 'pip', 'jelly']; G.crit[2] = []; critRaidStart(a); var w = !!G.critWarn; a.ai.raidMax = 2; a.ai.raidHits = 1; critRaidHit(a); var after1 = G.crit[0].length; a.ai.raidHits = 2; critRaidHit(a); [w, after1, G.crit[0].join(), G.crit[2].join(), G.revenge && G.revenge.c, G.lastRaider]")
    check(r[0] and r[1] == 3 and r[2] == 'owl,jelly' and r[3] == 'pip' and r[4] == 'pip' and r[5] == 2, f'warning first, steal only on the last hit, weakest one, revenge set ({r})')
    r = await pg.evaluate("G.crit[0] = ['owl', 'pip', 'jelly']; critRaidStart(a); [!!G.critWarn]")
    check(r == [False], 'at most one loss every 5 minutes')
    r = await pg.evaluate("G.critLoss = -999; G.crit[0] = ['owl', 'pip']; a.ai.mode = 'raid'; critRaidStart(a); a.ai.mode = 'seek'; critTick(0.01); [G.critWarn === null]")
    check(r == [True], 'chasing the raider off (raid ends) clears the warning')
    r = await pg.evaluate("G.crit[0] = ['owl']; G.crit[2] = ['pip', 'jelly']; G.revenge = { id: 2, c: 'pip' }; var g = G.gems; critJackpot(G.blobs[2]); [G.crit[0].join(), G.gems - g, G.revenge]")
    check(r[0] == 'owl,pip' and r[1] == 2 and r[2] is None, f'revenge jackpot returns your critter first, +2 gems ({r})')
    p = await pg.evaluate("raidPrize(2)")
    check(p['crit'] == 'jelly' and p['coins'] > 0 and p['revenge'], f'raidPrize for the rival label ({p})')
    check(await pg.evaluate("critPos(0).length") == 2, 'critPos lists every critter at the blob')

    print('Save and rebirth')
    r = await pg.evaluate("G.crit[0] = ['owl', 'comet']; G.egg = 7; save(); newGame(load()); [G.crit[0].join(), G.egg, G.crit[1].length > 0]")
    check(r == ['owl,comet', 7, True], f'critters and egg meter are saved ({r})')
    r = await pg.evaluate("G.started = true; G.auto = true; doRebirth(1); G.auto = false; [G.crit[0].join(), G.rb]")
    check(r[0] == 'owl,comet', f'rebirth keeps your critters ({r})')
    check(await pg.evaluate("ALBUM.some(function (p) { return p.id === 'crit'; })"), 'album has a critter page')

async def timeline(pg):
    print('15 minutes autopilot, raider on (3 seeds)')
    for seed in (1, 2, 3):
        await pg.evaluate(f"localStorage.clear(); __fb.seed({seed}); __fb.fresh(); G.raider = 700")
        out, base, tot = [], 0, 0
        for m in range(15):
            r = await pg.evaluate("var h0 = G.stats.hatched, t0 = G.total, b = 0, c = 0; G.started = true; G.auto = true; for (var i = 0; i < 3600; i++) { step(1/60); b += cpsBase() * (G.boost.x2 > 0 ? 2 : 1) / 60; c += cpsBase() * critIncome() * (G.boost.x2 > 0 ? 2 : 1) / 60; } G.auto = false; [G.stats.hatched - h0, G.total - t0, c, G.crit[0].map(function (k) { return critTier(k); }).join(''), G.blobs[0].level, G.stats.critStolen]")
            if r[0]: out.append(f'{m + 1}m:+{r[0]}')
            base += r[2]; tot += r[1]
        print(f'  seed {seed}: hatches {" ".join(out) or "none"}; owned tiers {r[3] or "-"}; level {r[4]}; stolen from rivals {r[5]}; critter income {100 * base / max(tot, 1):.1f}% of all coins')

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args()); pg = await br.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        if MODE in ('checks', 'all'): await checks(pg)
        if MODE in ('timeline', 'all'): await timeline(pg)
        await br.close()
    for e in errs: fails.append('page error: ' + e)
    print('FAILS:', len(fails)); [print('  ', f) for f in fails]
    sys.exit(1 if fails else 0)

asyncio.run(main())
