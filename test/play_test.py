"""Öffnet das gebaute Spiel in Chrome, prüft auf Laufzeitfehler, klickt die Menüs durch, macht Bildschirmfotos
und misst mit einem Autopiloten, wie schnell ein Spieler vorankommt.
Aufruf: python3 test/play_test.py [shots|flows|pace|all]"""
import asyncio, json, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'

def watch(pg, errs, name):
    pg.on('console', lambda m: errs.append(name + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(name + ': ' + str(e)))

async def shots(br, errs):
    views = [('desktop', {'width': 1280, 'height': 720}, False), ('phone', {'width': 390, 'height': 844}, True), ('land', {'width': 844, 'height': 390}, True)]
    for name, vp, touch in views:
        ctx = await br.new_context(viewport=vp, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
        pg = await ctx.new_page(); watch(pg, errs, name)
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.evaluate('__fb.seed(7); __fb.fresh()')
        await pg.screenshot(path=f'shots/{name}-0-start.png')
        if touch: await pg.tap('#play')
        else: await pg.click('#play')
        await pg.evaluate('__fb.sim(20)'); await pg.wait_for_timeout(250)
        await pg.screenshot(path=f'shots/{name}-1-early.png')
        await pg.evaluate("__fb.sim(150); G.gems = 500; ACT.shop('skins')"); await pg.wait_for_timeout(250)
        await pg.screenshot(path=f'shots/{name}-2-shop.png')
        await pg.evaluate("ACT.close(); G.pend.push({type:'ko'}); nextModal()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'shots/{name}-3-ko.png')
        await pg.evaluate("ACT.respawn()")
        if name == 'desktop':
            await pg.evaluate("__fb.sim(60); var P = G.actors[0], b = G.blobs[1]; P.carry.length = 0; P.used = 0; P.x = b.x - b.r - 60; P.y = b.y; P.fx = 1; P.fy = 0; P.ix = 1; P.iy = 0; P.stam = 100; P.lungeCd = 0; P.wantLunge = true; G.modal = null; for (var i = 0; i < 20; i++) { IN.x = 1; IN.y = 0; step(1/60); }")
            await pg.wait_for_timeout(250); await pg.screenshot(path=f'shots/{name}-4-raid.png')
            await pg.evaluate("G.skin = 'galaxy'; G.hat = 'tophat'; __fb.sim(500, true, true)"); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'shots/{name}-5-late.png')
        await ctx.close()

async def flows(br, errs):
    pg = await (await br.new_context(viewport={'width': 1100, 'height': 700})).new_page(); watch(pg, errs, 'flows')
    await pg.goto(URL); await pg.wait_for_timeout(300)
    await pg.evaluate('localStorage.clear(); __fb.seed(3); __fb.fresh()'); await pg.click('#play')
    # Tastatur: laufen, Ausfallschritt, Ausdauer
    x0 = await pg.evaluate('G.actors[0].x')
    await pg.keyboard.down('KeyD'); await pg.wait_for_timeout(500); await pg.keyboard.press('Space'); await pg.wait_for_timeout(700); await pg.keyboard.up('KeyD')
    x1, st = await pg.evaluate('[G.actors[0].x, G.actors[0].stam]')
    print(f'Tastatur: x {x0:.0f} -> {x1:.0f}, Ausdauer {st:.0f}'); assert x1 > x0 + 180 and st < 100
    # Maus: gedrückt halten, Sammler läuft zum Zeiger
    y0 = await pg.evaluate('G.actors[0].y'); await pg.mouse.move(550, 150); await pg.mouse.down(); await pg.wait_for_timeout(700); await pg.mouse.up()
    y1 = await pg.evaluate('G.actors[0].y'); print(f'Maus: y {y0:.0f} -> {y1:.0f}'); assert y1 < y0 - 60
    # Laden: Skin kaufen und anlegen
    await pg.evaluate('G.gems = 200'); await pg.click('#shopbtn'); await pg.wait_for_timeout(150)
    await pg.click('[data-act="skin:gum"]'); skin, gems = await pg.evaluate('[G.skin, G.gems]'); print('Skin:', skin, 'Gems:', gems); assert skin == 'gum' and gems == 160
    await pg.click('[data-act="tab:hats"]'); await pg.click('[data-act="hat:cap"]'); assert await pg.evaluate('G.hat') == 'cap'
    # Belohnungsanzeige (Platzhalter): Gratis-Gems, danach Sperrzeit
    await pg.click('[data-act="tab:gems"]'); await pg.click('[data-act="gemAd"]'); await pg.wait_for_timeout(3600)
    gems2, cd, dis = await pg.evaluate("[G.gems, cdLeft('gems'), document.querySelector('[data-act=\"gemAd\"]').disabled]")
    print('Gratis-Gems nach Anzeige:', gems2, 'Sperrzeit:', cd, 'Knopf gesperrt:', dis); assert gems2 == 145 and cd > 170 and dis
    await pg.click('[data-act="daily"]'); assert await pg.evaluate('G.gems') == 165
    await pg.click('[data-act="tab:boosts"]'); await pg.click('[data-act="boostGem:x2"]'); assert await pg.evaluate('G.boost.x2') > 100
    await pg.click('[data-act="close"]'); assert await pg.evaluate('G.modal') is None
    # K.o.: Wiederbeleben per Anzeige, danach ist das Angebot gesperrt und es gibt nur noch Gems oder Heimkehr
    await pg.evaluate("G.hp = 1; G.actors[0].inv = 0; hurt(G.actors[0], 1, 0, 0)"); await pg.wait_for_timeout(300)
    assert await pg.evaluate('G.modal && G.modal.type') == 'ko'
    await pg.click('[data-act="reviveAd"]'); await pg.wait_for_timeout(3600)
    hp, modal = await pg.evaluate('[G.hp, G.modal]'); print('Nach Wiederbelebung: Herzen', hp); assert hp == 3 and modal is None
    await pg.evaluate("G.hp = 1; G.actors[0].inv = 0; hurt(G.actors[0], 1, 0, 0)"); await pg.wait_for_timeout(300)
    offer = await pg.evaluate("[G.modal.offer, !!document.querySelector('[data-act=\"reviveAd\"]')]"); print('Zweites K.o., Anzeige angeboten:', offer); assert offer == [False, False]
    await pg.click('[data-act="respawn"]'); await pg.wait_for_timeout(300)
    adov = await pg.evaluate("!document.getElementById('adov').classList.contains('gone')"); print('Pausenanzeige nach Heimkehr:', adov); assert adov
    await pg.wait_for_timeout(3600); assert await pg.evaluate("document.getElementById('adov').classList.contains('gone')")
    # Stufenaufstieg und Rebirth
    await pg.evaluate("G.pend.push({type:'levelup', level: 5, reward: 100}); nextModal()"); c0 = await pg.evaluate('G.coins'); await pg.click('[data-act="collect"]')
    assert abs(await pg.evaluate('G.coins') - c0 - 100) < 1
    await pg.evaluate("G.blobs[0].level = 8; G.blobs[0].mass = LVT[7] + 5; hud()"); await pg.click('#rebirthbtn', force=True); await pg.wait_for_timeout(150); await pg.click('[data-act="rebirth"]')
    s = await pg.evaluate('__fb.state()'); print('Nach Rebirth: Sterne', s['stars'], 'Rebirths', s['rb'], 'Level', s['level'], 'Gems', s['gems']); assert s['stars'] == 3 and s['rb'] == 1 and s['level'] == 1
    # Speichern und Laden
    await pg.evaluate('save()'); await pg.reload(); await pg.wait_for_timeout(300)
    s2 = await pg.evaluate('__fb.state()'); assert s2['stars'] == 3 and s2['gems'] == s['gems'] and await pg.evaluate('G.skin') == 'gum'; print('Speicherstand geladen: ok')
    # Fassung ohne Werbung: kein Anzeigenknopf darf sichtbar sein
    await pg.goto(URL.replace('dist/index.html', 'dist/portal-basic/index.html')); await pg.wait_for_timeout(300); await pg.evaluate('localStorage.clear(); newGame(null)'); await pg.click('#play')
    await pg.evaluate("G.pend.push({type:'ko'}); nextModal()"); n1 = await pg.evaluate("document.querySelectorAll('.adi').length")
    await pg.click('[data-act="respawn"]'); await pg.click('#shopbtn'); await pg.click('[data-act="tab:boosts"]'); n2 = await pg.evaluate("document.querySelectorAll('.adi').length")
    print('Fassung ohne Werbung, Anzeigenknöpfe:', n1 + n2); assert n1 + n2 == 0

async def pace(br, errs):
    pg = await (await br.new_context(viewport={'width': 900, 'height': 600})).new_page(); watch(pg, errs, 'pace')
    await pg.goto(URL); await pg.wait_for_timeout(300)
    for seed in (1, 2):
        await pg.evaluate(f'localStorage.clear(); __fb.seed({seed}); __fb.fresh()')
        key, rows = None, []
        for step in range(90):                       # 90 x 30 s = 45 Minuten Spielzeit, Rebirth sobald möglich
            s = await pg.evaluate('__fb.sim(30, true, true)')
            k = (s['rb'], s['level'])
            if k != key or step % 20 == 19:
                key = k; st = s['stats']
                rows.append(f"  {int(st['time']) // 60:2d}:{int(st['time']) % 60:02d}  RB {s['rb']} ★{s['stars']:2d}  Lv {s['level']:2d}  Münzen {s['coins']:11.0f}  Käufe {sum(s['up'].values()):3d}  Gems {s['gems']:4d}  Bonks {st['bonks']:3d}  Raids {st['raids']:3d}/{st['raided']:3d}  Bosse {st['bosses']:2d}  K.o. {st['kos']:2d}  Quest {s['quest']:2d}  Führt {s['leader']}  Rivalen/Spieler {[round(r / max(1, s['mass']), 2) for r in s['rivals']]}")
        print(f'Seed {seed}:'); print('\n'.join(rows)); print('  Upgrades:', json.dumps(s['up']))

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        if MODE in ('flows', 'all'): await flows(br, errs)
        if MODE in ('shots', 'all'): await shots(br, errs)
        if MODE in ('pace', 'all'): await pace(br, errs)
        await br.close()
    print('Laufzeitfehler:', len(errs)); [print('  ', e) for e in errs[:12]]
    sys.exit(1 if errs else 0)

asyncio.run(main())
