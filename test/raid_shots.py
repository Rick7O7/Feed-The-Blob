"""Bildschirmfotos eines Überfalls: Treffer 1 bis 3, Warnzone, Stacheln mit Countdown. Aufruf: python3 test/raid_shots.py"""
import asyncio
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright
URL = DIST + 'index.html'
PREP = """(function () {
  __fb.seed(9); __fb.fresh(); G.started = true; __fb.sim(200, true, false); G.modal = null; G.pend.length = 0; G.event = null; G.banner = null; G.boss = null; G.nextEvent = G.t + 999; G.meteors = [];
  var P = G.actors[0], b = G.blobs[1]; P.carry.length = 0; P.used = 0; G.items = G.items.filter(function (it) { return it.state !== 2; }); G.hp = 3; b.shield = 0; b.hits = 0; b.rage = 0; G.raidGem = -999;
  for (var i = 1; i < 4; i++) { G.actors[i].stun = 99; G.actors[i].x = 300 + i * 40; G.actors[i].y = 300; }
  P.x = b.x - b.r - 150; P.y = b.y + 10; P.vx = P.vy = 0; hud();
})()"""
HIT = """(function () { var P = G.actors[0], b = G.blobs[1]; P.x = b.x - b.r * 0.72 - 60; P.y = b.y + 10; P.vx = P.vy = 0; P.fx = 1; P.fy = 0; P.stam = 100; P.lungeCd = 0; P.stun = 0; b.hitCd = 0; IN.lunge = true; for (var k = 0; k < 10; k++) { IN.x = 1; IN.y = 0; step(1 / 60); } hud(); })()"""
async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        for name, vp, touch in (('desktop', {'width': 1280, 'height': 720}, False), ('phone', {'width': 390, 'height': 844}, True)):
            ctx = await br.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            await pg.goto(URL); await pg.wait_for_timeout(300)
            if touch: await pg.tap('#play')
            else: await pg.click('#play')
            await pg.evaluate(PREP); await pg.wait_for_timeout(350); await pg.screenshot(path=f'shots/raid-{name}-0-hint.png')
            for n in (1, 2, 3):
                await pg.evaluate(HIT); await pg.wait_for_timeout(260); await pg.screenshot(path=f'shots/raid-{name}-{n}-hit.png')
            await pg.wait_for_timeout(380); await pg.screenshot(path=f'shots/raid-{name}-4-run.png')
            await pg.wait_for_timeout(900); await pg.screenshot(path=f'shots/raid-{name}-5-spikes.png')
            print(name, await pg.evaluate("[G.hp, G.blobs[1].shield.toFixed(1), G.stats.jackpots, G.stats.raids]"))
            await ctx.close()
        await br.close()
    print('Laufzeitfehler:', len(errs), errs[:5])
asyncio.run(main())
