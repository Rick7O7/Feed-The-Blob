"""Fixed set of screenshots for before/after comparisons. Builds nothing: run `node build.mjs` first.
Opens dist/index.html and saves to shots/<tag>/<view>-<nn>-<name>.png
Views: desktop 1280x720, phone 390x844, land 844x390 (landscape phone).
Call: python3 test/shots.py [tag] [views] [lang]     tag defaults to 'now', views e.g. desktop,phone (default: all three), lang en|de|es|pt|fr
      python3 test/shots.py perf                 frame rate of the crowded late-game scene with 4x CPU throttling (Chrome DevTools)"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
TAG = sys.argv[1] if len(sys.argv) > 1 else 'now'
VIEWS = [('desktop', {'width': 1280, 'height': 720}, False), ('phone', {'width': 390, 'height': 844}, True), ('land', {'width': 844, 'height': 390}, True)]
if len(sys.argv) > 2 and sys.argv[2] != 'all': VIEWS = [v for v in VIEWS if v[0] in sys.argv[2].split(',')]
LANG = sys.argv[3] if len(sys.argv) > 3 else 'en'
OUT = ROOT / 'shots' / TAG
if TAG != 'perf': OUT.mkdir(parents=True, exist_ok=True)

# freezes the world in a calm state between shots: no modal, no event, no pending pop-ups
CALM = "G.modal = null; G.pend.length = 0; G.event = null; G.banner = null; G.boss = null; G.grav = 900; G.meteors = []; G.nextEvent = G.t + 999; uiModal(); hud();"
LATE = ("__fb.seed(11); __fb.fresh(); G.started = true; G.skin = 'galaxy'; G.hat = 'tophat'; __fb.sim(420, true, true); " + CALM +
        " G.coins = 4.2e7; G.gems = 340; G.fever = 80; G.feverT = 5; var P = G.actors[0]; P.x = G.blobs[0].x + 220; P.y = G.blobs[0].y - 60; "
        "for (var i = 0; i < 160; i++) spawnItem(true); G.evForce = 'gold'; G.nextEvent = G.t; for (var k = 0; k < 200; k++) step(1 / 60); hud();")

# one raid hit on rival 1, like test/raid_shots.py
RAID_PREP = CALM + """ var P = G.actors[0], b = G.blobs[1]; P.carry.length = 0; P.used = 0; G.hp = 3; b.shield = 0; b.hits = 0; b.rage = 0;
  for (var i = 1; i < 4; i++) { G.actors[i].stun = 99; G.actors[i].x = 300 + i * 40; G.actors[i].y = 300; }"""
HIT = """(function () { var P = G.actors[0], b = G.blobs[1]; P.x = b.x - b.r * 0.72 - 60; P.y = b.y + 10; P.vx = P.vy = 0; P.fx = 1; P.fy = 0; P.stam = 100; P.lungeCd = 0; P.stun = 0; b.hitCd = 0; IN.lunge = true; for (var k = 0; k < 10; k++) { IN.x = 1; IN.y = 0; step(1 / 60); } hud(); })()"""
FPS = """new Promise(function (ok) { var n = 0, t0 = performance.now(), worst = 0, last = t0; function f(t) { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 4000) requestAnimationFrame(f); else ok([Math.round(n / ((t - t0) / 1000)), Math.round(worst)]); } requestAnimationFrame(f); })"""

async def perf():
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        for name, vp, touch in VIEWS[:2]:
            ctx = await br.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
            pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(300)
            await pg.evaluate("localStorage.clear(); startGame(); " + LATE)
            cdp = await ctx.new_cdp_session(pg)
            for rate in (1, 4):
                await cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate}); await pg.wait_for_timeout(500)
                # keep the effects busy while measuring: coins and gems flying, raid impacts, a level-up moment
                await pg.evaluate("window._fxi = setInterval(function () { G.coins += cpsNow() * 40; G.gems += 2; fxAdd({ type: 'hit', dur: 0.7, x: G.blobs[0].x, y: G.blobs[0].y, r: 120, n: 3, hx: 0, hy: 0, hr: 38, rot: 0 }); }, 300); fxAdd({ type: 'lvl', dur: 1.9, level: 9, name: 'Galaxy Gut' });")
                fps, worst = await pg.evaluate(FPS)
                await pg.evaluate("clearInterval(window._fxi)")
                print(f'{name:8s} CPU x{rate}: {fps} fps, worst frame {worst} ms, particles {await pg.evaluate("G.parts.length")}, flying icons max {26}')
            await ctx.close()
        await br.close()

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        for name, vp, touch in VIEWS:
            ctx = await br.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e, n=name: errs.append(n + ': ' + str(e)))
            pg.on('console', lambda m, n=name: errs.append(n + ': ' + m.text) if m.type == 'error' else None)
            n = [0]
            async def shot(label, wait=250):
                await pg.wait_for_timeout(wait); n[0] += 1
                await pg.screenshot(path=str(OUT / f'{name}-{n[0]:02d}-{label}.png'))
            await pg.goto(URL); await pg.wait_for_timeout(300)
            await pg.evaluate(f"localStorage.clear(); __fb.seed(7); __fb.fresh(); setLang('{LANG}')")
            await shot('start', 900)
            if touch: await pg.tap('#play')
            else: await pg.click('#play')
            await shot('onboard-move', 400)
            await pg.evaluate("var P = G.actors[0]; P.x += 160; for (var k = 0; k < 6; k++) step(1 / 60);")
            await shot('onboard-grab', 300)
            await pg.evaluate("var P = G.actors[0]; for (var i = 0; i < 4; i++) { var it = mkItem('apple', P.x, P.y, 0); it.state = 1; G.items.push(it); } for (var k = 0; k < 6; k++) step(1 / 60);")
            await shot('onboard-home', 300)
            await pg.evaluate("var P = G.actors[0], h = G.blobs[0]; P.x = h.x + h.r + 20; P.y = h.y; for (var k = 0; k < 120; k++) step(1 / 60); var a = G.actors[1]; a.x = P.x + 200; a.y = P.y; a.stun = 9;")
            await shot('onboard-lunge', 400)
            await pg.evaluate('__fb.sim(25); ' + CALM)
            await shot('early', 400)
            await pg.evaluate("var b = G.blobs[0]; b.level++; levelUp(b); G.pend.length = 0; G.coins += 400;")
            await shot('levelup-moment', 380)
            await pg.evaluate("__fb.sim(120); " + CALM + " G.gems = 500;")
            await pg.click('#mute'); await shot('settings'); await pg.click('#mute')
            await pg.evaluate("G.modal = null; G.daily = 0; G.streak = 0; ACT.shop('gems')")
            await pg.click('[data-act=\"daily\"]'); await shot('daily-claim', 330); await pg.wait_for_timeout(900); await shot('daily-done', 50)
            for tab in ('skins', 'hats', 'boosts', 'gems'):
                await pg.evaluate(f"G.modal = null; ACT.shop('{tab}')")
                await shot('shop-' + tab)
            for ty in ('gold', 'boss', 'frenzy', 'lowgrav', 'tornado'):
                await pg.evaluate(CALM + f" __fb.event('{ty}'); step(1 / 60); hud();")
                await shot('event-' + ty, 650)
            await pg.evaluate(CALM + " G.pend.push({type: 'ko'}); nextModal();")
            await shot('ko')
            await pg.evaluate(CALM + " G.pend.push({type: 'levelup', level: 5, reward: 1234}); nextModal();")
            await shot('levelup')
            await pg.evaluate(CALM + " G.blobs[0].level = rbLevel(); hud(); ACT.rebirthOpen();")
            await shot('rebirth')
            await pg.evaluate(RAID_PREP); await pg.evaluate(HIT); await shot('raid-hit1', 120)
            await pg.evaluate(HIT); await pg.evaluate(HIT); await shot('raid-jackpot', 160)
            await pg.evaluate(LATE)
            await shot('late', 500)
            await ctx.close()
        await br.close()
    print('Saved to', OUT, '| runtime errors:', len(errs), errs[:5])
    if errs: sys.exit(1)

asyncio.run(perf() if TAG == 'perf' else main())
