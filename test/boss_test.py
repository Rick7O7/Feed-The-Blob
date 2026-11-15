"""Misst, ob ein Spieler den Boss in der Ereigniszeit platzen lassen kann. Aufruf: python3 test/boss_test.py"""
import asyncio
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        pg = await br.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(DIST + 'index.html'); await pg.wait_for_timeout(300)
        for warm in (60, 300, 900):
            res = []
            for seed in (1, 2, 3, 4):
                await pg.evaluate(f'__fb.seed({seed}); __fb.fresh(); __fb.sim({warm})')
                s0 = await pg.evaluate("G.hunter = true; __fb.event('boss'); var b0 = G.stats.bosses, t0 = G.t, hp = 0; for (var i = 0; i < 40 * 60; i++) { G.auto = true; step(1/60); if (G.boss && !hp) hp = G.boss.max; if (G.stats.bosses > b0) break; } G.auto = false; G.hunter = false; [G.stats.bosses - b0, +(G.t - t0).toFixed(1), hp, G.blobs[0].level]")
                res.append(s0)
            print(f'nach {warm:4d} s Spielzeit: [geplatzt, Sekunden seit Ankündigung, Treffer nötig, Level] =', res)
        print('Laufzeitfehler:', errs)
        await br.close()
asyncio.run(main())
