"""Prüft die Überfälle: Beute je Treffer, Jackpot, Warnzeit vor der Druckwelle, Flucht, Verteidigung.
Misst danach, wie viel schneller ein Spieler vorankommt, der überfällt, gegenüber einem, der nur sammelt.
Aufruf: python3 test/raid_test.py [unit|pace|all]"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'index.html'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'

# stellt den Sammler links neben den Blob von Rivale 1 und lässt ihn n-mal hineinspringen
SETUP = """
(function (afterHits) {
  __fb.seed(5); __fb.fresh(); G.started = true; __fb.sim(240, true, false);
  var P = G.actors[0], b = G.blobs[1], me = G.blobs[0], out = { hits: [] };
  for (var i = 1; i < 4; i++) { G.actors[i].x = 1100; G.actors[i].y = 750; G.actors[i].stun = 99; }   // Rivalen aus dem Weg
  P.carry.length = 0; P.used = 0; G.hp = 3; P.inv = 0; b.shield = 0; b.hits = 0; b.rage = 0; G.event = null; G.boss = null; G.nextEvent = G.t + 999; G.meteors = [];
  G.items = G.items.filter(function (it) { return it.state !== 2; });
  G.raidGem = -999; out.rival0 = b.mass; out.me0 = me.mass; out.coins0 = G.coins; out.gems0 = G.gems; out.level = me.level; out.leader = G.leader; out.jack0 = G.stats.jackpots; out.stolen0 = G.stats.stolen; out.span = LVT[me.level] - LVT[me.level - 1]; out.rate = G.rate; var cheap = 1e99; UKEYS.forEach(function (k) { if (G.up[k] < UPG[k].max) cheap = Math.min(cheap, cost(k)); }); out.cheap = cheap;
  function settle(sec, ix) { for (var k = 0; k < sec * 60; k++) { IN.x = ix; IN.y = 0; IN.sprint = false; step(1 / 60); G.modal = null; G.pend.length = 0; } }
  for (var h = 0; h < 3; h++) {
    P.x = b.x - b.r * 0.72 - 70; P.y = b.y; P.vx = P.vy = 0; P.stam = 100; P.lungeCd = 0; P.stun = 0; b.hitCd = 0;
    var r0 = b.mass, c0 = G.coins, s0 = G.stats.stolen; IN.lunge = true; settle(0.35, 1);
    out.hits.push({ rivalLoss: r0 - b.mass, pct: (r0 - b.mass) / r0 * 100, coins: G.coins - c0, hits: b.hits, rage: b.rage, goo: G.stats.stolen - s0 }); 
  }
  out.rageAfter3 = b.rage; out.gems = G.raidGem > 0 ? 1 : 0; out.jackpots = G.stats.jackpots - out.jack0; out.meMid = me.mass; out.groundLoot = G.items.filter(function (it) { return it.state < 2 && (it.kind === 'gold' || it.kind === 'gem') && Math.abs(it.x - b.x) < 400 && Math.abs(it.y - b.y) < 400; }).length;
  if (afterHits === 'stay') settle(1.4, 0);                          // stehen bleiben
  else settle(1.4, -1);                                              // einfach weglaufen, ohne Sprint
  out.hp = G.hp; out.shield = b.shield; out.dist = Math.hypot(P.x - b.x, P.y - b.y) - b.r;
  settle(3, 0);                                                      // Schleim fliegt heim
  out.rivalLossTotal = out.rival0 - b.mass; out.stolen = G.stats.stolen - out.stolen0; out.arrived = me.mass - out.meMid; out.coinsTotal = G.coins - out.coins0;
  out.flying = G.items.filter(function (it) { return it.fly; }).length;
  out.barBefore = (out.me0 - LVT[out.level - 1]) / (LVT[out.level] - LVT[out.level - 1]) * 100;
  // vierter Sprung in die Stacheln
  P.x = b.x - b.r * 0.72 - 70; P.y = b.y; P.vx = P.vy = 0; P.stam = 100; P.lungeCd = 0; P.inv = 0; b.hitCd = 0; var hp0 = G.hp, m0 = b.mass; IN.lunge = true; settle(0.35, 1);
  out.spikeDamage = hp0 - G.hp; out.spikeSteal = m0 - b.mass;
  return out;
})
"""

async def unit(pg):
    for mode in ('flee', 'stay'):
        o = await pg.evaluate(SETUP + f"('{mode}')")
        print(f'--- drei Treffer, danach: {"weglaufen" if mode == "flee" else "stehen bleiben"} (Blob-Stufe {o["level"]}, Führender {o["leader"]})')
        for i, h in enumerate(o['hits']):
            print(f'  Treffer {i + 1}: Schleim +{h["goo"]:.0f} ({h["goo"] / o["span"] * 100:.1f} % des Stufenbalkens), Münzen +{h["coins"]:.0f}, Rivale verliert {h["pct"]:.1f} %, Trefferzähler {h["hits"]}, Warnzeit läuft {h["rage"]:.2f} s')
        print(f'  Jackpots {o["jackpots"]}, Gems +{o["gems"]}, Gold/Kristalle am Boden {o["groundLoot"]}, Warnzeit nach Treffer 3: {o["rageAfter3"]:.2f} s')
        print(f'  Herzen danach {o["hp"]}, Stacheln {o["shield"]:.1f} s, Abstand zum Blobrand {o["dist"]:.0f}')
        print(f'  Schleim gesamt {o["stolen"]:.0f} = {o["stolen"] / o["span"] * 100:.1f} % des Balkens = {o["stolen"] / max(1, o["rate"]):.0f} s Sammeln (eigene Rate {o["rate"]:.0f}/s); im Blob angekommen seit Treffer 3: {o["arrived"]:.0f}, noch im Flug {o["flying"]}')
        print(f'  Münzen gesamt +{o["coinsTotal"]:.0f}, günstigstes Upgrade kostet {o["cheap"]:.0f}')
        print(f'  Sprung in die Stacheln: Schaden {o["spikeDamage"]}, Beute {o["spikeSteal"]:.0f}')
        assert [h['hits'] for h in o['hits']] == [1, 2, 3], 'Trefferzähler'
        assert all(h['rivalLoss'] > 0 and h['coins'] > 0 and h['goo'] > 0 for h in o['hits'])
        assert o['hits'][2]['goo'] > 2 * o['hits'][0]['goo'], 'dritter Treffer muss deutlich mehr bringen'
        assert o['jackpots'] == 1 and o['gems'] == 1 and o['groundLoot'] >= 6
        assert o['flying'] == 0 and o['arrived'] > 0, 'gestohlener Schleim muss ankommen'
        assert o['shield'] > 0 and o['spikeDamage'] == 1 and o['spikeSteal'] == 0
        assert o['hp'] == (3 if mode == 'flee' else 2), 'Flucht ohne Sprint muss reichen, Stehenbleiben kostet ein Herz'
    # Verteidigung: Rivale überfällt den eigenen Blob, Spieler rempelt ihn an
    d = await pg.evaluate("""(function () {
      __fb.seed(6); __fb.fresh(); G.started = true; __fb.sim(120, true, false);
      var P = G.actors[0], R = G.actors[1], me = G.blobs[0]; R.ai.mode = 'raid'; R.ai.blob = me; R.ai.raidT = 10; R.ai.raidHits = 0; R.ai.raidMax = 2; R.immune = 0; R.stun = 0;
      R.x = me.x + me.r + 150; R.y = me.y; P.x = R.x + 60; P.y = R.y; P.vx = P.vy = 0; P.stam = 100; P.lungeCd = 0; P.fx = -1; P.fy = 0; var c0 = G.coins;
      IN.lunge = true; for (var k = 0; k < 20; k++) { IN.x = -1; IN.y = 0; step(1 / 60); }
      return { defended: G.stats.defended, coins: G.coins - c0, mode: R.ai.mode };
    })()""")
    print('--- Verteidigung:', d); assert d['defended'] == 1 and d['coins'] > 0 and d['mode'] != 'raid'
    # Königsbonus: derselbe Treffer bringt beim führenden Blob das 1,5-Fache; danach Kronenwechsel in beide Richtungen
    k = await pg.evaluate("""(function () {
      function one(lead) {
        __fb.seed(8); __fb.fresh(); G.started = true; __fb.sim(200, true, false);
        var P = G.actors[0], b = G.blobs[1]; for (var i = 1; i < 4; i++) { G.actors[i].x = 1100; G.actors[i].y = 750; G.actors[i].stun = 99; }
        b.shield = 0; b.hits = 0; b.rage = 0; G.event = null; G.boss = null; G.nextEvent = G.t + 999; G.meteors = []; G.modal = null; G.pend.length = 0;
        if (lead) { b.mass = G.blobs[0].mass * 1.2; G.leader = 1; G.leadT = 99; } else { G.leader = 0; G.leadT = 99; }
        P.x = b.x - b.r * 0.72 - 70; P.y = b.y; P.vx = P.vy = 0; P.stam = 100; P.lungeCd = 0; P.stun = 0; b.hitCd = 0; var s0 = G.stats.stolen, c0 = G.coins;
        IN.lunge = true; for (var q = 0; q < 12; q++) { IN.x = 1; IN.y = 0; step(1 / 60); }
        return { goo: G.stats.stolen - s0, txt: G.texts.map(function (t) { return t.str; }) };
      }
      var a = one(false), c = one(true), out = { plain: a.goo, king: c.goo, kingText: c.txt.indexOf('KINGSLAYER x1.5') >= 0 };
      G.texts.length = 0; G.leadT = 0; G.crownT = -99; G.blobs[1].mass = G.blobs[0].mass * 0.5; for (var q = 0; q < 40; q++) step(1 / 60);
      out.took = G.leader === 0 && G.texts.some(function (t) { return t.str.indexOf('YOU TOOK THE CROWN') === 0; });
      G.texts.length = 0; G.crownT = -99; G.blobs[1].mass = G.blobs[0].mass * 2; for (q = 0; q < 40; q++) step(1 / 60);
      out.lost = G.leader === 1 && G.texts.some(function (t) { return t.str.indexOf('took your crown') > 0; });
      return out;
    })()""")
    print('--- Königsbonus:', k); assert abs(k['king'] / k['plain'] - 1.5) < 0.02 and k['kingText'] and k['took'] and k['lost']

async def pace(pg):
    print('--- Tempo je Spielweise (Autopilot, Minuten bis Stufe; Rebirth sobald möglich, 20 Minuten Spielzeit)')
    for name, raider in (('nur sammeln', 0), ('überfällt im Vorbeigehen (bis 600 px)', 600), ('überfällt ständig', 9999)):
        for seed in (1, 2):
            await pg.evaluate(f'localStorage.clear(); __fb.seed({seed}); __fb.fresh(); G.raider = {raider}')
            t, key, s = {}, None, None
            for step in range(120):                # 120 x 10 s
                s = await pg.evaluate(f'G.raider = {raider}; __fb.sim(10, true, true)')
                if s['rb'] == 0 and s['level'] not in t: t[s['level']] = s['stats']['time'] / 60
                if s['rb'] >= 1 and 'rb' not in t: t['rb'] = s['stats']['time'] / 60
            st = s['stats']
            lv = '  '.join(f'L{k} {v:4.1f}' for k, v in t.items() if k != 'rb' and k >= 3)
            print(f'  {name:38s} Seed {seed}: {lv}  Rebirth 1 nach {t.get("rb", 0):4.1f}  | nach 20 min: RB {s["rb"]} ★{s["stars"]} Lv {s["level"]}, Treffer {st["raids"]}, Jackpots {st["jackpots"]}, K.o. {st["kos"]}, Gems {s["gems"]}, Käufe {sum(s["up"].values())}')

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        pg = await (await br.new_context(viewport={'width': 1000, 'height': 650}, locale='en-US')).new_page()
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        if MODE in ('unit', 'all'): await unit(pg)
        if MODE in ('pace', 'all'): await pace(pg)
        await br.close()
    print('Laufzeitfehler:', len(errs)); [print('  ', e) for e in errs[:10]]
    sys.exit(1 if errs else 0)

asyncio.run(main())
