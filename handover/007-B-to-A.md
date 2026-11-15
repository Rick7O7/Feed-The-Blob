# Handover 007: B to A
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 007")

All 6 tasks from 006 done.

## Done
1. **Preview videos** (`store/make_videos.py`, new). Rules from docs.crazygames.com (checked today): landscape 16:9 and portrait 2:3 at 1080p, both mandatory, 15–20 s, ≤ 50 MB, no sound, cover as the first frame. Not allowed: promo text, logos, black screens or bars, mouse cursor, fast-forward.
   - Output: `store/video-landscape-1920x1080.mp4` (19 s, 15 MB) and `store/video-portrait-1080x1620.mp4` (19 s, 16 MB). H.264, no audio, made with ffmpeg 9 + libx264 (installed here).
   - How it works: the page gets its own clock (`requestAnimationFrame`/`performance.now` replaced, CSS/WAAPI animations advanced by hand), so every frame is exactly 1/30 s of game time, smooth and the same on every run. A scripted controller replaces `readInput()`. Scenes: collecting → raid ending in a jackpot → Gold Rush → level-up. The cover fades into gameplay over 0.3 s. Admin and test harness are not involved; it uses `__fb` from the test build.
   - The portrait video uses the phone layout (360x540 css at 3x).
2. **Name**: `store/description.md` now names "Feed the Blob" as final; the backups stay listed. Video section added.
3. **Onboarding** (`50_ui.js` `OB`, `obStart`, `obUpdate`; `40_render.js` `bubble`, `drawOnboard`). Only for a brand-new save (`G.total === 0 && G.rb === 0 && G.stats.fed === 0` at PLAY). One speech bubble at a time in the world, each gone once done:
   - 0 "WASD OR ARROWS TO MOVE" / "DRAG TO MOVE", with arrows around the collector (done after 140 px moved)
   - 1 "GRAB LOOT!" over the nearest loot (done at 3 items carried)
   - 2 "BRING IT HOME!" over the home blob (over the collector if the blob is off screen), with a moving dashed path (done at the first delivery)
   - 3 "SPACE TO LUNGE!" / "TAP RUN TO LUNGE!", with an arrow over the nearest rival collector and the RUN button glowing (done at the first bonk or raid)
   - After 90 s of play the quests take over in any case. A short quest chime plays on each step. Bubbles stay inside the view. It reads `G` only, writes nothing, and needed no hook in your files. Shots: `shots/after006/*-onboard-*.png`.
4. **Languages**: new file `src/05_lang.js` (mine, texts): `TROWS` has one row per text (English key, DE, ES, PT-BR, FR); `T(text, a, b…)` fills `{0}`, `{1}`. A missing text falls back to English. The language comes from `navigator.language`, with a switch (EN DE ES PT FR) in the speaker/settings panel. **New save field `lang`**. Every player-visible string goes through it: HUD, pop-ups, shop, toasts, banners, events, quests, upgrades, skins, hats, level names, worlds, floating texts, arrows, test-ad screen. Static HTML uses `data-t`.
   - **String-only edits in your files** (as allowed): built texts wrapped in `T()`:
     - `10_world.js`: `lvName`, CRATE, slow-zone tip, `LEVEL n!`, took your crown
     - `20_actors.js`: DEFENDED, +goo, +coins, is furious, upgrade say
     - `30_events.js`: BOSS POPPED, popped the boss
     - `35_meta.js`: `T(ty[3])` in `curQuest`, rebirth banner title/sub, "is active" toasts, daily toast
   - Fixed English texts (BONK!, quest texts, event titles…) stay as they are in your files and are translated where they are shown. New texts: please keep them plain English; I add the row.
   - Checked at 390x844 in DE and FR: everything fits. Shortened: DE "Schuhe" (Sneakers), ES "Zapas", FR "Grandir" (Growth). A long SHOP label (FR "BOUTIQUE") gets a smaller font on phones.
5. **SDK test** `test/sdk_test.py` (new): opens `dist/portal-full/index.html`, blocks the real SDK script, injects a recording mock. 23 checks, all green:
   - gameplayStart/Stop around PLAY, shop, KO and revive, and they alternate.
   - Rewarded ads only from a button click on a pop-up (revive, boosts).
   - Every rewarded offer has a gem alternative (7 found).
   - Not muted while an ad is only requested, muted and game time frozen while it plays, sound back after.
   - adError gives no reward, does not mute and does not get stuck.
   - Midgame only right after Collect/Respawn, and none during 2.5 s of running play.
   - Portal build has no `__fb` and no admin.
   - **Result: no CrazyGames rule break in `35_meta.js`.**
   - The test found one bug, mine from 005: my music loop muted the master as soon as `Ads.busy` was set, which is at the request, while the rule says mute only at `adStarted`. Fixed in `00_core.js`: `Snd.setMute(true)` (your adStarted call) sets `Snd.adMute`, any other call lifts it once no ad is busy. Toggling sound during an ad keeps the ad mute. The test-ad placeholder mutes itself (`uiTestAd`).
6. Rebuilt; play, raid, boss and sdk tests all green; before/after shots `shots/before006` vs `shots/after006` (+ `shots/ob_de`, `shots/ob_fr`).

**Small fix in your file**: `test/raid_test.py` line 106 creates its context with `locale='en-US'`. The king test checks the English floating texts ("took your crown"). On a German system Chromium now starts in German and the game translates them, so the test failed without this. `sdk_test.py` pins `en-US` too. play/boss/admin do not read texts.

### Changes per screen
- First minute (new save): speech bubbles for move → grab → home → lunge, a dashed path home, the RUN button glowing at the lunge step.
- Settings panel: language row with 5 buttons. All screens follow the language.
- Everything else looks the same in English.

### Frame rate
- `shots.py perf` at 4x CPU, measured today while the machine was busy (Firefox and Discord using ~3 cores). 006 build: 13–16 fps. This build: 12–15 fps, same scene, alternating runs. No measurable difference.

## Tests
- `node build.mjs` (without `admin/pass.txt`), then `play_test.py flows`, `raid_test.py unit`, `boss_test.py`, `sdk_test.py`: all green, 0 runtime errors. `shots.py after006`: 75 shots, 0 errors.
- `admin_test.py` not run (no `admin/pass.txt` here). The root `index.html` is again without the admin menu.

## Open tasks for A
1. Rebuild with `admin/pass.txt` and run `admin_test.py` (expected green; the admin menu does not use `T()`).

## Info for A (no task)
- The midgame ad is requested right after `closeModal()` has sent `gameplayStart`, so the SDK sees "gameplay running" while the break ad plays. The docs do not require a `gameplayStop` around ads, and the game itself is paused (`Ads.busy`). If you want it extra clean: `gameplayStop` at adStarted and `gameplayStart` at the end of `midgame()`. Not a rule break.
- `store/` now holds ~31 MB of video in git. If that bothers anyone, we can drop the MP4s from git and keep only `make_videos.py`.

## Questions
- none

## Do not touch until next handover
- none
