"""CrazyGames SDK test: opens dist/portal-full/index.html with the real SDK script blocked and a mock window.CrazyGames.SDK
that records every call together with the game state at that moment. Rules checked (docs.crazygames.com, 2026-11-15):
- gameplayStart when play starts or resumes, gameplayStop on every break (pop-ups, menus, KO)
- midgame (break) ads only at natural pauses; the SDK itself paces them to one per 3 minutes, so the game may ask more often
- rewarded ads only on a button press, never while the game screen is running; every rewarded offer has a gem alternative
- audio muted only once the ad really starts (adStarted), unmuted after adFinished/adError; the game is paused during an ad
Call: python3 test/sdk_test.py      (needs node build.mjs first)"""
import asyncio, sys
import os, sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from env import ROOT, DIST, launch_args
from playwright.async_api import async_playwright

URL = DIST + 'portal-full/index.html'
MOCK = """(function () {
  var L = window.__sdk = [];
  window.__adMode = 'ok';           // 'ok' | 'error'
  function st() { var g = window.G; return { modal: g && g.modal ? g.modal.type : null, started: !!(g && g.started), act: window.__act || null,
    master: window.Snd && Snd.master ? Snd.master.gain.value : null, gt: g ? +g.t.toFixed(3) : 0, busy: !!(window.Ads && Ads.busy) }; }
  function log(ev, extra) { var e = st(); e.ev = ev; e.ms = Math.round(performance.now()); for (var k in extra || {}) e[k] = extra[k]; L.push(e); }
  document.addEventListener('click', function (e) { var el = e.target.closest && e.target.closest('[data-act]'); window.__act = el ? el.dataset.act : 'click'; }, true);
  window.addEventListener('click', function () { setTimeout(function () { window.__act = null; }, 0); });
  window.CrazyGames = { SDK: {
    init: function () { log('init'); return Promise.resolve(); },
    game: { gameplayStart: function () { log('gameplayStart'); }, gameplayStop: function () { log('gameplayStop'); },
            loadingStart: function () { log('loadingStart'); }, loadingStop: function () { log('loadingStop'); }, happytime: function () {} },
    ad: { hasAdblock: function () { return Promise.resolve(false); },
      requestAd: function (type, cb) {
        log('request:' + type); var mode = window.__adMode;
        setTimeout(function () { log('beforeStart:' + type); }, 250);                // between request and start: must not be muted yet
        setTimeout(function () {
          if (mode === 'error') { log('adError:' + type); cb && cb.adError && cb.adError('unfilled'); log('afterError:' + type); return; }
          cb && cb.adStarted && cb.adStarted(); log('adStarted:' + type);
          setTimeout(function () { log('during:' + type); }, 300);
          setTimeout(function () { log('adFinished:' + type); cb && cb.adFinished && cb.adFinished(); log('afterFinish:' + type); }, 700);
        }, 400);
      } } } };
})();"""

fails = []
def check(ok, msg):
    print(('  ok   ' if ok else '  FAIL ') + msg)
    if not ok: fails.append(msg)

async def main():
    errs = []
    async with async_playwright() as p:
        br = await p.chromium.launch(**launch_args())
        ctx = await br.new_context(viewport={'width': 1100, 'height': 700}, locale='en-US')
        await ctx.route('**/sdk.crazygames.com/**', lambda r: r.abort())
        await ctx.add_init_script(MOCK)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'sdk.crazygames.com' not in m.text and 'ERR_FAILED' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(300)
        log = lambda: pg.evaluate('__sdk')
        async def since(n): return (await log())[n:]
        def evs(l, name): return [e for e in l if e['ev'] == name]

        print('Setup')
        st = await pg.evaluate("[Ads.mode, !!Ads.sdk, typeof window.__fb, typeof window.FBAdmin]")
        check(st == ['crazygames', True, 'undefined', 'undefined'], f'portal-full uses the SDK, no test harness, no admin menu: {st}')
        await pg.evaluate('localStorage.clear(); newGame(null)')
        n = len(await log()); await pg.click('#play'); await pg.wait_for_timeout(200)
        check([e['ev'] for e in await since(n)] == ['gameplayStart'], 'PLAY sends gameplayStart once')

        print('Pop-ups and menus')
        n = len(await log()); await pg.click('#shopbtn'); await pg.wait_for_timeout(100)
        l = await since(n); check(evs(l, 'gameplayStop') and l[-1]['modal'] == 'shop', 'opening the shop sends gameplayStop')
        n = len(await log()); await pg.click('[data-act="close"]'); await pg.wait_for_timeout(100)
        l = await since(n); check([e['ev'] for e in l] == ['gameplayStart'] and l[0]['modal'] is None, 'closing the shop sends gameplayStart')
        n = len(await log()); await pg.evaluate("G.pend.push({type: 'ko'}); nextModal()"); await pg.wait_for_timeout(100)
        check([e['ev'] for e in await since(n)] == ['gameplayStop'], 'KO pop-up sends gameplayStop')

        print('Rewarded ad: revive from the KO pop-up')
        await pg.wait_for_timeout(300); n = len(await log()); await pg.click('[data-act="reviveAd"]'); await pg.wait_for_timeout(1500)
        l = await since(n); req = evs(l, 'request:rewarded')
        check(len(req) == 1 and req[0]['act'] == 'reviveAd' and req[0]['modal'] == 'ko', f'rewarded requested once, from the button, on a pop-up: {[(e["act"], e["modal"]) for e in req]}')
        bs, ds, af = evs(l, 'beforeStart:rewarded'), evs(l, 'during:rewarded'), evs(l, 'afterFinish:rewarded')
        check(bs and bs[0]['master'] == 1, f'not muted while the ad is only requested (master {bs[0]["master"] if bs else None})')
        check(ds and ds[0]['master'] == 0 and ds[0]['busy'], f'muted and paused while the ad plays (master {ds[0]["master"] if ds else None})')
        check(af and af[0]['master'] == 1 and not af[0]['busy'], f'sound back after the ad (master {af[0]["master"] if af else None})')
        gts = [e['gt'] for e in l if e['ev'] in ('adStarted:rewarded', 'during:rewarded', 'adFinished:rewarded')]
        check(len(set(gts)) == 1, f'game time frozen during the ad: {gts}')
        check(evs(l, 'gameplayStart') and await pg.evaluate('G.modal') is None and await pg.evaluate('G.hp') == 3, 'revive closes the pop-up, gameplayStart, full hearts')

        print('Rewarded ad that fails (unfilled)')
        await pg.evaluate("window.__adMode = 'error'; ACT.shop('boosts')"); await pg.wait_for_timeout(200)
        n = len(await log()); await pg.click('[data-act="boostAd:magnet"]'); await pg.wait_for_timeout(900)
        l = await since(n); ae = evs(l, 'afterError:rewarded')
        check(ae and ae[0]['master'] == 1 and not ae[0]['busy'] and not evs(l, 'adStarted:rewarded'), 'adError: never muted, game not stuck, no reward')
        check(await pg.evaluate("G.actors[0].starT") <= 0, 'adError gives no reward')
        await pg.evaluate("window.__adMode = 'ok'")

        print('Midgame (break) ads')
        await pg.click('[data-act="close"]'); await pg.wait_for_timeout(100)
        n = len(await log()); await pg.wait_for_timeout(2500)
        check(not [e for e in await since(n) if e['ev'].startswith('request')], 'no ad of any kind during 2.5 s of running gameplay')
        mids = []
        for i in range(3):
            await pg.evaluate("G.pend.push({type: 'levelup', level: 5, reward: 100}); nextModal()"); await pg.wait_for_timeout(150)
            n = len(await log()); await pg.click('[data-act="collect"]'); await pg.wait_for_timeout(1400)
            l = await since(n); mids += evs(l, 'request:midgame')
            ds = evs(l, 'during:midgame')
            if ds: check(ds[0]['master'] == 0 and ds[0]['busy'], f'midgame {i + 1}: muted and paused while it plays')
        check(all(e['act'] == 'collect' for e in mids), f'midgame only right after a natural pause (Collect after level-up): {[e["act"] for e in mids]}')
        print(f'  info midgame requests for 3 level-ups in ~5 s: {len(mids)}. The CrazyGames SDK paces midgame ads to one per 3 minutes itself (docs: "you do not need your own timer").')
        n = len(await log()); await pg.evaluate("G.pend.push({type: 'ko'}); nextModal()"); await pg.wait_for_timeout(150)
        offered = await pg.evaluate("G.modal.offer"); await pg.click('[data-act="respawn"]'); await pg.wait_for_timeout(1400)
        l = await since(n); m = evs(l, 'request:midgame')
        check((len(m) == 1 and m[0]['act'] == 'respawn') if not offered else not m, f'KO respawn: midgame only when no revive ad was offered (offered {offered}, requests {len(m)})')

        seq = [e['ev'] for e in await log() if e['ev'].startswith('gameplay')]      # before the next part, which sets G.modal by hand
        check(all(a != b for a, b in zip(seq, seq[1:])), f'gameplayStart/Stop alternate, never twice in a row: {" ".join(s[8:] for s in seq)}')

        print('Every rewarded offer has a gem alternative')
        GEMALT = """(function () { var out = [];
          document.querySelectorAll('#mcard button .adi').forEach(function (i) { var b = i.closest('button'), act = b.dataset.act; if (act === 'gemAd') return;
            var box = b.parentElement, alt = Array.prototype.some.call(box.querySelectorAll('button'), function (o) { return o !== b && !o.querySelector('.adi') && o.querySelector('.gemi'); });
            out.push([act, alt]); }); return out; })()"""
        found = []
        for setup in ["G.pend.push({type: 'levelup', level: 6, reward: 100}); nextModal()", "G.pend.push({type: 'ko'}); nextModal()",
                      "G.blobs[0].level = rbLevel(); ACT.rebirthOpen()", "ACT.shop('boosts')"]:
            await pg.evaluate("Ads.busy = false; G.modal = null; uiModal(); G.cd = {}; " + setup); await pg.wait_for_timeout(100)
            found += await pg.evaluate(GEMALT)
        await pg.evaluate("G.modal = null; uiModal()")
        check(len(found) >= 7 and all(a for _, a in found), f'gem alternative next to every rewarded button: {found}')

        print('Rewarded only on request')
        allreq = [e for e in await log() if e['ev'] == 'request:rewarded']
        check(all(e['act'] and e['modal'] for e in allreq), f'every rewarded request came from a click on a pop-up: {[(e["act"], e["modal"]) for e in allreq]}')
        await br.close()
    check(not errs, f'runtime errors: {errs[:5]}')
    print('Result:', 'all green' if not fails else f'{len(fails)} failed')
    if fails: sys.exit(1)

asyncio.run(main())
