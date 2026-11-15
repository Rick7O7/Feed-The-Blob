"""Records the CrazyGames preview videos from the real game (needs `node build.mjs` first, and ffmpeg with libx264).
Rules (docs.crazygames.com/requirements/game-covers, checked 2026-11-15): landscape 16:9 and portrait 2:3 at 1080p, both mandatory,
15 to 20 s (longer gets cut at 20 s), max 50 MB, no sound, no "Play now" or other promo text, no icons or logos, no black screens
or logo transitions, no black bars, no mouse cursor, no fast-forwarding, and the static cover as the opening frame.

How: the page gets its own clock. requestAnimationFrame and performance.now are replaced, and CSS/WAAPI animations are
advanced by hand, so every video frame is exactly 1/30 s of game time no matter how slow the screenshot is. The player
is driven by a small scripted controller that replaces readInput(): collect, raid a rival to a jackpot, Gold Rush, level up.
Output: store/video-landscape-1920x1080.mp4, store/video-portrait-1080x1620.mp4
Call: python3 store/make_videos.py"""
import asyncio, base64, pathlib, shutil, subprocess, sys, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'test')); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

FPS = 30
VIEWS = [  # name, css viewport, device scale, touch, output size, cover image
    ('landscape', (1280, 720), 1.5, False, (1920, 1080), 'cover-landscape-1920x1080.png'),
    ('portrait', (360, 540), 3, True, (1080, 1620), 'cover-portrait-800x1200.png'),
]
CLOCK = """(function () {
  var t = 0, q = [];
  window.requestAnimationFrame = function (cb) { q.push(cb); return q.length; };
  performance.now = function () { return t; };
  window.__vt = { tick: function (ms) {
    t += ms; var a = q; q = []; for (var i = 0; i < a.length; i++) a[i](t);
    document.getAnimations().forEach(function (an) {
      if (!an.__v) { an.__v = 1; an.pause(); an.currentTime = 0; }
      var end = an.effect ? an.effect.getComputedTiming().endTime : Infinity, nt = (an.currentTime || 0) + ms;
      if (end !== Infinity && nt >= end) an.finish(); else an.currentTime = nt;
    });
  } };
})();"""
# scripted player: walks to loot, carries it home, raids a rival with lunges, runs from the blast
CONTROL = """(function () {
  window.__demo = { mode: 'collect', fill: 5, rival: 1 };
  readInput = function () {
    var P = G.actors[0], d = __demo, tx = P.x, ty = P.y, sprint = false, i;
    if (d.mode === 'raid') {
      var b = G.blobs[d.rival], dist = hyp(P.x - b.x, P.y - b.y);
      if (b.rage > 0 || b.shield > 0) { tx = P.x * 2 - b.x; ty = P.y * 2 - b.y; sprint = true; }
      else { tx = b.x; ty = b.y; if (dist < b.r * 0.72 + 130 && P.stam >= 22) IN.lunge = true; }
    } else if (P.used >= Math.min(capOf(P), d.fill)) { var h = G.blobs[0]; tx = h.x; ty = h.y; }
    else { var best = null, bd = 1e9; for (i = 0; i < G.items.length; i++) { var it = G.items[i]; if (it.state !== 1 || it.kind === 'heart') continue; var dd = hyp(it.x - P.x, it.y - P.y); if (dd < bd) { bd = dd; best = it; } } if (best) { tx = best.x; ty = best.y; } }
    var dx = tx - P.x, dy = ty - P.y, l = hyp(dx, dy);
    if (l > 14) { IN.x = dx / l; IN.y = dy / l; } else IN.x = IN.y = 0;
    IN.sprint = sprint;
  };
})();"""
CALM = "G.modal = null; G.pend.length = 0; G.event = null; G.banner = null; G.boss = null; G.grav = 900; G.meteors = []; G.nextEvent = G.t + 999; G.alarm = 0; uiModal(); hud();"
def cam_on_player(): return " cam.x = G.actors[0].x; cam.y = G.actors[0].y + 40 / SC;"
SEGMENTS = [  # seconds, setup run before the first frame (a hard cut)
    (5.5, "localStorage.clear(); __fb.seed(3); __fb.fresh(); startGame(); __fb.sim(50, true, false); G.auto = false; " + CALM +
          " document.getElementById('keys').classList.add('gone'); OB.on = false; __demo.mode = 'collect'; __demo.fill = 5;" + cam_on_player()),
    (5.5, CALM + " var b = G.blobs[1], P = G.actors[0]; b.shield = 0; b.hits = 0; b.rage = 0; b.hitCd = 0; P.carry.length = 0; P.used = 0;"
          " P.x = b.x + 30; P.y = b.y - b.r - 230; P.vx = P.vy = 0; P.stam = stamMax(P); P.stun = 0;"
          " for (var i = 1; i < 4; i++) { var a = G.actors[i]; a.x = HOMES[i].x + (i === 1 ? 300 : 0); a.y = HOMES[i].y - 300; }"
          " __demo.mode = 'raid'; __demo.rival = 1;" + cam_on_player()),
    (4.0, CALM + " var P = G.actors[0]; P.x = W / 2 - 160; P.y = H / 2 + 120; P.vx = P.vy = 0; P.carry.length = 0; P.used = 0;"
          " for (var i = 0; i < 40; i++) spawnItem(true); __fb.event('gold'); step(1 / 60); G.event.pre = 0.8; hud(); __demo.mode = 'collect'; __demo.fill = 99;" + cam_on_player()),
    (3.5, CALM + " var h = G.blobs[0], P = G.actors[0]; P.carry.length = 0; P.used = 0; P.x = h.x + h.r + 230; P.y = h.y - 40; P.vx = P.vy = 0;"
          " for (var i = 0; i < 5; i++) { var it = mkItem(pick(['donut', 'pizza', 'gold', 'apple']), P.x + (i - 2) * 6, P.y + 4, 0); it.state = 1; G.items.push(it); }"
          " h.mass = LVT[h.level] - 0.5; __demo.mode = 'collect'; __demo.fill = 3;" + cam_on_player()),
]
# every frame: no pop-ups (level-up reward, KO) and full hearts, so nothing covers the action
TICK = "G.calm = 5; G.hp = 3; G.pend.length = 0; __vt.tick(" + str(1000 / FPS) + ");"

async def record(br, name, css, dpr, touch, size, cover, tmp):
    ctx = await br.new_context(viewport={'width': css[0], 'height': css[1]}, device_scale_factor=dpr, has_touch=touch, is_mobile=touch, locale='en-US')
    await ctx.add_init_script(CLOCK)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(DIST + 'index.html'); await pg.evaluate("__vt.tick(16)"); await pg.evaluate(CONTROL)
    cdp = await ctx.new_cdp_session(pg); n = 0; frames = tmp / name; frames.mkdir()
    for sec, setup in SEGMENTS:
        await pg.evaluate(setup)
        for _ in range(round(sec * FPS)):
            await pg.evaluate(TICK)
            shot = await cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 93})
            n += 1; (frames / f'{n:04d}.jpg').write_bytes(base64.b64decode(shot['data']))
        print(f'  {name}: segment done at frame {n}, level {await pg.evaluate("G.blobs[0].level")}, raid hits/jackpots {await pg.evaluate("[G.stats.raids, G.stats.jackpots]")}')
    await ctx.close()
    if errs: raise SystemExit(f'{name}: runtime errors {errs[:3]}')
    w, h = size; out = ROOT / 'store' / f'video-{name}-{w}x{h}.mp4'
    fc = (f"[0:v]scale={w}:{h}:flags=lanczos,setsar=1,fps={FPS},format=yuv420p[c];[1:v]scale={w}:{h}:flags=lanczos,setsar=1,format=yuv420p[g];"
          f"[c][g]xfade=transition=fade:duration=0.3:offset=0.5[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-framerate', str(FPS), '-t', '0.8', '-i', str(ROOT / 'store' / cover),
                    '-framerate', str(FPS), '-i', str(frames / '%04d.jpg'), '-filter_complex', fc, '-map', '[v]', '-an',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)], check=True)
    info = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=width,height,codec_type', '-of', 'compact', str(out)], capture_output=True, text=True).stdout.split()
    print(f'store/{out.name}: {" ".join(info)}')

async def main():
    if not shutil.which('ffmpeg'): raise SystemExit('ffmpeg is needed (with libx264)')
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='fbvid'))
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch(**launch_args())
            for v in VIEWS: await record(br, *v, tmp)
            await br.close()
    finally: shutil.rmtree(tmp, ignore_errors=True)
asyncio.run(main())
