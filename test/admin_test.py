"""Prüft das Admin-Menü: gesperrt ohne Passphrase, falsche Passphrase, Entsperren, alle Grundfunktionen über Menü und
Befehlszeile, Merken auf dem Gerät, Sperren, Öffnen per Tippen und per #admin. Prüft außerdem, dass die Portal-Fassungen
nichts davon enthalten. Aufruf: python3 test/admin_test.py"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

BASE = DIST
PASS = open(ROOT / 'admin' / 'pass.txt').read().strip()

async def row(pg, cid, *vals):
    """füllt die Felder einer Menüzeile und klickt ihren Knopf"""
    els = await pg.query_selector_all(f'#fbA .fbA-row[data-id="{cid}"] [data-arg]')
    for el, v in zip(els, vals):
        if await el.evaluate('e => e.tagName') == 'SELECT': await el.select_option(str(v))
        else: await el.fill(str(v))
    await pg.click(f'#fbA .fbA-row[data-id="{cid}"] [data-go]')

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        ctx = await br.new_context(viewport={'width': 1280, 'height': 720})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(BASE + 'index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate('localStorage.clear(); __fb.seed(4); __fb.fresh()'); await pg.click('#play'); await pg.evaluate('__fb.sim(40)')

        # 1. gesperrt: kein Menü, keine Funktionen, kein Klartext
        html = open(ROOT / 'dist' / 'index.html', encoding='utf-8').read()
        st = await pg.evaluate("[typeof window.FBAdmin, !!document.getElementById('fbA'), window.isSecureContext, !!(window.crypto && crypto.subtle)]")
        print('Gesperrt: FBAdmin', st[0], '| Menü im Dokument:', st[1], '| sicherer Kontext:', st[2], '| WebCrypto:', st[3])
        assert st[0] == 'undefined' and not st[1]
        for word in ('Invulnerable', 'Freeze rivals', 'setLevel', 'FBADMIN-CANARY', PASS): assert word not in html, word
        # 2. F2 zeigt nur die Abfrage; falsche Passphrase bleibt draußen
        await pg.keyboard.press('F2'); await pg.wait_for_selector('input[type=password]')
        await pg.fill('input[type=password]', 'falsch-falsch-falsch'); await pg.keyboard.press('Enter'); await pg.wait_for_function("document.querySelector('[data-err]').textContent.length > 0", timeout=20000)
        msg = await pg.evaluate("document.querySelector('[data-err]').textContent"); st = await pg.evaluate("[typeof window.FBAdmin, !!document.getElementById('fbA'), localStorage.getItem('feedblob.admin')]")
        print('Falsche Passphrase:', msg, '| FBAdmin', st[0]); assert msg == 'Wrong passphrase.' and st == ['undefined', False, None]
        # 3. richtige Passphrase öffnet das Menü
        await pg.fill('input[type=password]', PASS); await pg.keyboard.press('Enter'); await pg.wait_for_selector('#fbA.on', timeout=20000)
        n = await pg.evaluate("document.querySelectorAll('#fbA .fbA-row').length"); print('Entsperrt: Menü offen,', n, 'Funktionen'); assert n >= 25
        # 4. Spielerwerte
        await row(pg, 'coins', 5000); await row(pg, 'gems', 77); await row(pg, 'hp', 2); await row(pg, 'level', 6); await row(pg, 'stars', 4); await row(pg, 'upg', 'speed', 9); await row(pg, 'allupg', 3)
        v = await pg.evaluate('[G.coins, G.gems, G.hp, G.blobs[0].level, G.stars, G.up.speed, G.up.carry, G.blobs.slice(1).map(function (b) { return b.level; })]')
        print('Spielerwerte [Münzen, Gems, Herzen, Stufe, Sterne, Sneakers, Rucksack, Stufen der Rivalen]:', v); assert 5000 <= v[0] < 5200 and v[1:7] == [77, 2, 6, 4, 3, 3] and min(v[7]) >= 4
        await pg.click('#fbA .fbA-row[data-id="unlock"] [data-go]'); assert await pg.evaluate('G.skins.length === SKINS.length && G.hats.length === HATS.length')
        # 5. Items spawnen, Ereignis starten
        # Spiel dafür anhalten: sonst sammelt oder verliert der Spieler Kristalle zwischen den Zählungen (Test war wackelig)
        await row(pg, 'speed', '0'); await pg.wait_for_timeout(100)
        g0 = await pg.evaluate("G.items.filter(function (i) { return i.kind === 'gem'; }).length"); await row(pg, 'spawn', 'gem', 30)
        g1 = await pg.evaluate("G.items.filter(function (i) { return i.kind === 'gem'; }).length"); print('Gespawnte Kristalle:', g1 - g0); assert g1 - g0 == 30
        await row(pg, 'speed', '1')
        await row(pg, 'event', 'boss'); await pg.wait_for_timeout(3200); boss = await pg.evaluate('!!G.boss'); print('Boss gestartet:', boss); assert boss
        await pg.click('#fbA .fbA-row[data-id="stopevent"] [data-go]'); assert await pg.evaluate('!G.boss && !G.event')
        # 6. Teleport
        await row(pg, 'tp', 'rival2'); d = await pg.evaluate('Math.hypot(G.actors[0].x - G.blobs[2].x, G.actors[0].y - G.blobs[2].y) - G.blobs[2].r'); print('Teleport zu Rivale 2, Abstand zum Blobrand:', round(d)); assert d < 130
        await pg.click('#fbA .fbA-row[data-id="clicktp"] [data-go]'); await pg.evaluate('G.actors[0].ix = 0'); await pg.wait_for_timeout(350)
        want = await pg.evaluate('(function () { var z = SC * (1 - 0.05 * ZB); return [cam.x + (300 - VW / 2) / z, cam.y + (400 - VH / 2) / z]; })()')
        await pg.mouse.click(300, 400); got = await pg.evaluate('[G.actors[0].x, G.actors[0].y, MOUSE.down]'); print('Klick-Teleport: Ziel', [round(x) for x in want], 'ist', [round(x) for x in got[:2]])
        assert abs(got[0] - want[0]) < 40 and abs(got[1] - want[1]) < 40 and not got[2]
        await pg.click('#fbA .fbA-row[data-id="clicktp"] [data-go]')
        # 7. Spielzustände
        await pg.click('#fbA .fbA-row[data-id="god"] [data-go]'); h = await pg.evaluate('G.hp = 3; G.actors[0].inv = 0; hurt(G.actors[0], 1, 0, 0); G.hp'); print('Unverwundbar an, Herzen nach Treffer:', h); assert h == 3
        m = await pg.evaluate('(function () { var b = G.blobs[0], m0 = b.mass; b.shield = 0; b.hitCd = 0; raidHit(G.actors[1], b); return b.mass === m0; })()'); assert m
        await pg.click('#fbA .fbA-row[data-id="god"] [data-go]'); h = await pg.evaluate('G.actors[0].inv = 0; hurt(G.actors[0], 1, 0, 0); G.hp'); print('Unverwundbar aus, Herzen nach Treffer:', h); assert h == 2
        async def rate():
            t0 = await pg.evaluate('G.t'); await pg.wait_for_timeout(1500); return (await pg.evaluate('G.t') - t0) / 1.5
        await pg.evaluate('G.modal = null; G.pend.length = 0; G.hp = 3'); r1 = await rate()
        await row(pg, 'speed', '4'); r4 = await rate(); await row(pg, 'speed', '0'); r0 = await rate(); await row(pg, 'speed', '0.5'); rh = await rate(); await row(pg, 'speed', '1')
        print(f'Spielgeschwindigkeit: x1 {r1:.2f}, x4 {r4:.2f}, x0 {r0:.2f}, x0.5 {rh:.2f} (Spielsekunden je Sekunde)'); assert 0.8 < r1 < 1.15 and 3.2 < r4 < 4.5 and r0 == 0 and 0.4 < rh < 0.6
        await pg.click('#fbA .fbA-row[data-id="freeze"] [data-go]'); await pg.wait_for_timeout(150); p0 = await pg.evaluate('G.actors.slice(1).map(function (a) { return [a.x, a.y]; })'); await pg.wait_for_timeout(700)
        p1 = await pg.evaluate('G.actors.slice(1).map(function (a) { return [a.x, a.y]; })'); mv = max(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 for (x0, y0), (x1, y1) in zip(p0, p1))
        # eingefrorene Rivalen laufen nicht, werden aber beim Überlappen auseinander- und aus Felsen herausgeschoben: ein paar Pixel sind erlaubt
        print('Rivalen eingefroren, größte Bewegung in 0,7 s:', round(mv)); assert mv < 25; await pg.click('#fbA .fbA-row[data-id="freeze"] [data-go]')
        await pg.click('#fbA .fbA-row[data-id="stam"] [data-go]'); await pg.evaluate('G.actors[0].stam = 3'); await pg.wait_for_timeout(200); assert await pg.evaluate('G.actors[0].stam >= 100'); await pg.click('#fbA .fbA-row[data-id="stam"] [data-go]')
        await pg.click('#fbA .fbA-row[data-id="noads"] [data-go]'); g0 = await pg.evaluate('G.gems'); await pg.evaluate("G.cd = {}; ACT.gemAd()"); g1 = await pg.evaluate('G.gems'); print('Anzeigen überspringen: Gems sofort +', g1 - g0); assert g1 - g0 == 15
        await pg.click('#fbA .fbA-row[data-id="noads"] [data-go]')
        # 8. Befehlszeile; Tippen im Menü darf das Spiel nicht steuern
        b0 = await pg.evaluate('[G.stats.bought, G.modal, G.actors[0].stam]'); cl = '#fbA .fbA-cl input'
        await pg.click(cl); await pg.keyboard.type('coins 12345'); await pg.keyboard.press('Enter'); await pg.keyboard.type('b 1 2 3 m'); await pg.keyboard.press('Space'); await pg.fill(cl, 'tp home'); await pg.keyboard.press('Enter')
        await pg.fill(cl, 'god on'); await pg.keyboard.press('Enter'); await pg.fill(cl, 'quatsch'); await pg.keyboard.press('Enter'); await pg.fill(cl, 'help'); await pg.keyboard.press('Enter')
        b1 = await pg.evaluate("[G.stats.bought, G.modal, G.coins, FBAdmin.state.god, document.querySelector('#fbA .fbA-log').textContent]")
        print('Befehlszeile: Münzen', b1[2], '| Unverwundbar', b1[3], '| Käufe durch Tippen:', b1[0] - b0[0], '| Pop-up durch Tippen:', b1[1])
        assert 12345 <= b1[2] < 12600 and b1[3] and b1[0] == b0[0] and b1[1] is None and 'Unknown command "quatsch"' in b1[4] and 'speed <0|0.25|0.5|1|2|4|8>' in b1[4]
        await pg.fill(cl, 'god off'); await pg.keyboard.press('Enter')
        # 9. Ablauf: Pop-up, K.o., Aufgabe, Rebirth mit Rückfrage
        q0 = await pg.evaluate('G.quest'); await pg.click('#fbA .fbA-row[data-id="quest"] [data-go]'); assert await pg.evaluate('G.quest') >= q0 + 1
        await pg.click('#fbA .fbA-row[data-id="ko"] [data-go]'); await pg.wait_for_timeout(300); assert await pg.evaluate("G.modal && G.modal.type") == 'ko'; await pg.evaluate('ACT.respawn()'); await pg.wait_for_timeout(100)
        await pg.evaluate("document.getElementById('adov').classList.add('gone'); Ads.busy = false; G.modal = null")
        rb = await pg.evaluate('G.rb'); await pg.click('#fbA .fbA-row[data-id="rebirth"] [data-go]'); assert await pg.evaluate('G.rb') == rb; await pg.click('#fbA .fbA-row[data-id="rebirth"] [data-go]'); assert await pg.evaluate('G.rb') == rb + 1
        print('Ablauf: Aufgabe erledigt, K.o.-Pop-up, Rebirth erst nach zweitem Klick: ok')
        # 10. Debug-Anzeige, F2 schließt und öffnet
        await pg.click('#fbA .fbA-row[data-id="info"] [data-go]'); await pg.wait_for_timeout(1300); info = await pg.evaluate("document.getElementById('fbA-info').textContent"); assert 'fps' in info and 'rivals' in info
        await pg.screenshot(path='shots/admin-desktop.png')
        await pg.evaluate('document.activeElement.blur()'); await pg.keyboard.press('F2'); assert not await pg.evaluate('FBAdmin.isOpen()'); await pg.keyboard.press('F2'); assert await pg.evaluate('FBAdmin.isOpen()')
        # 11. gemerkt: nach dem Neuladen öffnet F2 ohne Abfrage
        await pg.reload(); await pg.wait_for_timeout(300); assert await pg.evaluate('typeof window.FBAdmin') == 'undefined'
        await pg.click('#play'); await pg.keyboard.press('F2'); await pg.wait_for_selector('#fbA.on', timeout=20000); print('Gemerktes Gerät: F2 öffnet ohne Abfrage')
        # 12. sperren: Menü weg, Funktionen weg, Gerät vergessen
        await pg.click('#fbA .fbA-row[data-id="god"] [data-go]'); await pg.click('#fbA .fbA-row[data-id="lock"] [data-go]'); await pg.click('#fbA .fbA-row[data-id="lock"] [data-go]'); await pg.wait_for_timeout(200)
        st = await pg.evaluate("[window.FBAdmin, !!document.getElementById('fbA'), localStorage.getItem('feedblob.admin')]"); h = await pg.evaluate('G.hp = 3; G.actors[0].inv = 0; hurt(G.actors[0], 1, 0, 0); G.hp')
        print('Gesperrt: FBAdmin', st[0], '| Menü:', st[1], '| gemerkter Schlüssel:', st[2], '| Schaden wirkt wieder:', h == 2); assert st == [None, False, None] and h == 2
        await pg.keyboard.press('F2'); await pg.wait_for_selector('input[type=password]'); await pg.keyboard.press('Escape'); assert not await pg.query_selector('input[type=password]')
        # 13. Adresse mit #admin fragt beim Laden nach der Passphrase
        await pg.goto(BASE + 'index.html#admin'); await pg.wait_for_selector('input[type=password]', timeout=5000); print('#admin: Abfrage erscheint'); await ctx.close()

        # 14. Handy: fünfmal auf die Stufenanzeige tippen
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + 'index.html'); await pg.wait_for_timeout(300); await pg.evaluate('localStorage.clear(); __fb.fresh()'); await pg.tap('#play'); await pg.evaluate('__fb.sim(30)')
        box = await pg.evaluate("(function () { var r = document.getElementById('lvl').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
        for i in range(4): await pg.touchscreen.tap(box[0], box[1])
        assert not await pg.query_selector('input[type=password]')
        await pg.touchscreen.tap(box[0], box[1]); await pg.wait_for_selector('input[type=password]'); await pg.fill('input[type=password]', PASS); await pg.tap('button[type=submit]'); await pg.wait_for_selector('#fbA.on', timeout=30000)
        await pg.tap('#fbA .fbA-row[data-id="info"] [data-go]'); await pg.wait_for_timeout(500); await pg.screenshot(path='shots/admin-phone.png'); print('Handy: fünf Tipps öffnen die Abfrage, Menü offen'); await ctx.close()

        # 15. Portal-Fassungen: nichts davon vorhanden
        for name in ('portal-basic', 'portal-full'):
            src = open(ROOT / 'dist' / name / 'index.html', encoding='utf-8').read()
            for word in ('FBAdmin', 'feedblob.admin', 'Passphrase', '__fb', 'PBKDF2'): assert word not in src, (name, word)
            ctx = await br.new_context(viewport={'width': 1000, 'height': 650}); pg = await ctx.new_page()
            await pg.route('**/crazygames-sdk-v3.js', lambda r: r.abort())
            await pg.goto(BASE + name + '/index.html#admin'); await pg.wait_for_timeout(700); await pg.click('#play'); await pg.keyboard.press('F2'); await pg.wait_for_timeout(300)
            box = await pg.evaluate("(function () { var r = document.getElementById('lvl').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
            for i in range(6): await pg.mouse.click(box[0], box[1])
            st = await pg.evaluate("[typeof window.FBAdmin, typeof window.__fb, !!document.querySelector('input[type=password]'), !!document.getElementById('fbA')]")
            print(f'{name}: FBAdmin {st[0]}, Test-Schnittstelle {st[1]}, Abfrage {st[2]}, Menü {st[3]}'); assert st == ['undefined', 'undefined', False, False]; await ctx.close()
        await br.close()
    print('Laufzeitfehler:', len(errs)); [print('  ', e) for e in errs[:10]]
    sys.exit(1 if errs else 0)

asyncio.run(main())
