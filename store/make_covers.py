"""Renders the CrazyGames cover images from the game's own canvas art (no external assets).
Sizes from docs.crazygames.com/requirements/game-covers: landscape 1920x1080, portrait 800x1200, square 800x800.
Rules followed: no border, no text except the title, no icons or store logos.
Needs a build first: node build.mjs. Call: python3 store/make_covers.py"""
import asyncio, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'test')); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

SIZES = [('landscape', 1920, 1080), ('portrait', 800, 1200), ('square', 800, 800)]
# a lively world behind the title: grown player blob, rivals, lots of loot, Gold Rush running
SCENE = """(function () {
  localStorage.clear(); __fb.seed(5); __fb.fresh(); G.started = true; G.skin = 'classic'; __fb.sim(260, true, false);
  G.modal = null; G.pend.length = 0; G.banner = null; G.boss = null; G.alarm = 0;
  document.getElementById('start').classList.add('gone'); document.getElementById('hud').style.display = 'none';
  document.body.classList.remove('prestart');
  var b = G.blobs[0]; for (var i = 0; i < 220; i++) spawnItem(true);
  G.actors[0].x = W / 2 - 520; G.actors[0].y = H / 2 + 260; G.actors[0].vx = G.actors[0].vy = 0; cam.x = G.actors[0].x; cam.y = G.actors[0].y;
  G.texts.length = 0; G.started = false;        // render() keeps drawing the world, but no HUD arrows or mini map
})()"""
# the title layer, drawn with the game's own functions on a canvas over the world
TITLE = """(function (W, H) {
  var c = document.createElement('canvas'); c.width = W; c.height = H; c.style.cssText = 'position:fixed;left:0;top:0;z-index:99;width:' + W + 'px;height:' + H + 'px';
  document.body.appendChild(c); var old = cx; cx = c.getContext('2d'); cx.lineJoin = 'round'; cx.lineCap = 'round';
  var g = cx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(255,248,234,.0)'); g.addColorStop(1, 'rgba(59,42,32,.55)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  cx.save(); cx.translate(W / 2, H * 0.47); cx.globalAlpha = 0.35;
  for (var r = 0; r < 18; r++) { cx.beginPath(); cx.moveTo(0, 0); cx.arc(0, 0, Math.max(W, H), r * TAU / 18, r * TAU / 18 + TAU / 40); cx.closePath(); cx.fillStyle = '#fff36b'; cx.fill(); }
  cx.restore(); cx.globalAlpha = 1;
  var m = Math.min(W, H), land = W > H * 1.3, br = m * (land ? 0.25 : 0.27), bx = W / 2, by = land ? H * 0.57 : H * (W === H ? 0.5 : 0.48);
  var snacks = ['donut', 'apple', 'pizza', 'gold', 'gem', 'fish', 'star', 'donut', 'gold', 'apple'];
  for (var i = 0; i < snacks.length; i++) { var a = -Math.PI * 0.95 + i * Math.PI * 0.9 / (snacks.length - 1), d = br * (1.55 + (i % 2) * 0.25), s = br * (0.42 + (i % 3) * 0.08), sp = SPR[snacks[i]];
    cx.save(); cx.translate(bx + Math.cos(a) * d * (land ? 1.5 : 1), by + Math.sin(a) * d * 0.9); cx.rotate(i * 0.7 - 1); cx.drawImage(sp, -s / 2, -s / 2, s, s); cx.restore(); }
  G.t = 1.2; drawBlobBody(bx, by, br, findIn(SKINS, 'classic'), 1.2, 1.3, 0.75, 1, 0, -1, 4, 0);
  crownAt(bx, by - br * 0.86, br * 0.34);
  var ts = Math.min(W * (land ? 0.1 : 0.118), H * 0.13), ty = land ? H * 0.12 : by + br * 1.35;
  if (!land && W === H) ty = H * 0.12;
  txt('FEED THE BLOB', W / 2, ty, ts, '#59d16a');
  cx = old;
})"""

async def main():
    out = ROOT / 'store'
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        for name, w, h in SIZES:
            pg = await (await br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)).new_page()
            await pg.goto(DIST + 'index.html'); await pg.wait_for_timeout(300)
            await pg.evaluate(SCENE); await pg.wait_for_timeout(600); await pg.evaluate('G.texts.length = 0'); await pg.wait_for_timeout(50)
            await pg.evaluate(TITLE + f'({w}, {h})'); await pg.wait_for_timeout(100)
            await pg.screenshot(path=str(out / f'cover-{name}-{w}x{h}.png'))
            print('store/cover-%s-%dx%d.png' % (name, w, h))
        await br.close()
asyncio.run(main())
