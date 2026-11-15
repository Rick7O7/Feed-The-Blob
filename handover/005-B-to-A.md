# Handover 005: B to A
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 005")

All 8 tasks from 004 done in one session. No game-logic files touched (`10_world`, `20_actors`, `30_events`, `35_meta` unchanged).

## Done
1. **Screenshot script** `test/shots.py` (new, in your `test/` as agreed). `python3 test/shots.py <tag> [desktop,phone,land]` saves 21 shots per view to `shots/<tag>/`: start, early, level-up moment, sound settings, daily claim (mid-flight and done), shop ×4 tabs, 5 event banners, KO, level-up pop-up, rebirth pop-up, raid hit 1, raid jackpot, crowded late game. Views 1280x720, 390x844, 844x390. `python3 test/shots.py perf` measures the late scene at 1x and 4x CPU throttling (DevTools `Emulation.setCPUThrottlingRate`) while forcing effects. Fails with exit 1 on runtime errors.
2. **Polish round 2**
   a. Start screen (`50_ui.js` `drawHero`, `40_render.js`, template `#hero`): an animated blob above the title in the player's own skin and hat. It wobbles, blinks, looks around, catches a snack every 3.4 s (apple, donut, pizza, fish, gold, gem) with a gulp squash and sparkles. PLAY has a glow pulse and a nudging arrow. It is a box-shadow animation, not a scale, because Playwright waits for a stable element.
   b. Event banners: an SVG icon per event (gold, boss, frenzy, lowgrav, tornado; a star for rebirth), `EVICON` + `evKey()` in `50_ui.js`. Slide in from the left with overshoot and skew, hold, slide out right (4.2 s, same as `G.banner.t`). The icon pops in and wiggles.
3. **Daily streak UI** (`streakRow()`, `claimDaily()` in `50_ui.js`): 7-day row in the shop's Gems tab with gem amounts from `DAILY`, ✓ on done days, the next day pulsing, today's claim stamped, day 7 gold and wider. Claim button "Claim N ◆" (still `data-act="daily"`, calls your `ACT.daily`). On claim, gems fly from the day cell into the gem counter, which counts up after they land. Day 7 plays a fanfare. A red "!" badge sits on SHOP and on the Gems tab while `G.daily !== today()`. SHOP still opens Skins, because play_test clicks a skin right after SHOP.
4. **Juice** (render/UI only, Math.random only, `G` never written):
   - Coins and gems fly as DOM icons (`#fly` layer, above pop-ups) to their HUD counters. They start from the home blob when eating, from the collector otherwise, from the quest pill on a quest reward, and from the pressed button on Collect. The counter bumps and ticks when they land. `watchFx()` diffs `G.coins`/`G.gems` per frame. Nothing hooks into your code.
   - HUD coins and gems count up smoothly (`hudAnim`). Spending snaps down at once. `hud()` no longer writes `#coins`/`#gems`.
   - Level-up moment (`FX` type `lvl` in `40_render.js`): rotating rays, a ring from the home blob, "LEVEL N" plus the name popping in the middle. One at a time, and only on a +1 step, so admin/test jumps stay quiet. The level-up and rebirth pop-ups pop in with spinning rays.
   - Raid hits (`FX` type `hit`): star burst at the contact point and a shock ring. The jackpot (3rd hit) gets a bigger gold burst and a short gold screen flash. Detected from `b.hits` going up.
   - Frame rate (`shots.py perf`, headless Chromium, no GPU), late scene with forced effects every 0.3 s. 1x CPU: 60 fps on desktop and phone. 4x: 26 / 24 fps. The same scene on the 004 build without effects ran 28 / 27 fps at 4x, so the cost is about 2 to 3 fps under stress. A safety net: when the average frame goes over 25 ms, `LOWFX` turns on, which drops the rays and full-screen flashes, caps FX at 6 and flying icons at 8, and halves bursts.
5. **Sound** (`00_core.js`)
   a. New routing: master (silent during ads) ← sfx bus + music bus, with a compressor on the master. All volumes rebalanced: frequent sounds quieter, big moments louder. Pitch jitter ±8 % now also on coin, gem, steal, spike, boing, whoosh, heal and every noise burst. New sounds: `Snd.tick` (an icon lands), `Snd.fanfare` (day-7 claim).
   b. Music: `MUSIC` (5 entries, in `THEMES` order) + `Music` scheduler on the audio clock. Per world: tempo, scale, chords, lead sound, generated from a fixed seed, so each world always plays the same 4-bar loop with bass and a soft pad. It switches world at the loop start after a rebirth. It plays at 60 % on the start screen, 35 % under pop-ups, and is silent during ads and in a hidden tab (`ctx.suspend`). Separate toggles: the speaker button in the top bar opens a small panel with Music and Sounds switches. Keys: N music, M sounds.
   - **`Snd.setMute(x)` now ignores its argument**: it reads `Ads.busy` and `Snd.muted`. Your calls in `35_meta.js` (`setMute(true)` at ad start, `setMute(Snd.muted)` after) still do the right thing. No change needed.
   - **New save field**: `musicOff` (boolean) in `save()`. It is read in `init()` next to `mute`.
6. **Phone pass**
   - `viewport-fit=cover`, plus `env(safe-area-inset-*)` on `#top`, `#sub`, `#mid`, `#bottom`, `#setpop`, `#modal`, `#start`. The canvas parts (mini map, edge arrows) read the insets through a hidden `#safeprobe` in `resize()` (`SAFE`).
   - Touch targets ≥ 44 px: shop tabs and X, the sound button (44 wide on phones), Skin/Hat buttons on touch, row buttons in Boosts/Gems, "Start a new game" link, setting switches 46 px tall.
   - Phone shop header: gem count and X on line 1, the 4 tabs side by side on line 2 (before: they wrapped 3 + 1).
   - Landscape 844x390: the HOME arrow sat on top of the blob (bottom limit was 215 px from the bottom, set for portrait). Arrows now use their own limits in landscape, and the LOOT arrow no longer hides under the quest pill. The hero shrinks in landscape. Level-up text size is capped by height too.
   - Text: upgrade level label 10 → 11 px. Nothing smaller than 9 px (streak "Day n" on phones).
   - Joystick: unchanged (floating, wherever the thumb lands). It worked fine in both orientations.
7. **Store package** (`store/`)
   a. Covers from CrazyGames docs (checked today): landscape 1920x1080, portrait 800x1200, square 800x800. `store/make_covers.py` builds the world scene in Chromium, hides the HUD and draws the title layer with the game's own `drawBlobBody`, `crownAt`, `SPR`, `txt`. The only text is the title, with no border and no logos, as the rules ask. Needs `node build.mjs` first.
   b. `store/description.md`: short and long description, controls, tags, category.
   c. Name check in `store/description.md`: "Feed the Blob" is free on CrazyGames and Poki (their URLs return 404, while a known game returns 200) and in the app stores. On itch.io it is used by a few small jam games. Backups: **Blob Feast**, **Gobble Blob**.
   - Not made: preview videos (CrazyGames asks for them with the covers).
8. Small: `.gitignore` gets `__pycache__/`.

### Changes per screen (before → after: `shots/before` vs `shots/after`; `shots/` is not in git, run the script)
- Start: static card → animated hero blob, glowing PLAY.
- In game HUD: "SND" text → speaker icon with a Music/Sounds panel. Coins/gems fly in and count up. "!" on SHOP while the gift is ready.
- Level up: only floating world text → rays, ring and big centre title. The pop-up pops with spinning rays.
- Raids: shake only → star burst, ring, gold jackpot flash.
- Event banners: scale-in text box → icon, slide in/out.
- Shop Gems tab: one text row → 7-day streak row with claim animation. Phone header in 2 clean rows.
- Landscape: HOME/LOOT arrows no longer cover the blob or hide under the quest.

## Tests
- `node build.mjs` (without `admin/pass.txt`), then `play_test.py flows`, `raid_test.py unit`, `boss_test.py`: all green, 0 runtime errors.
- `test/shots.py after`: 63 shots, 0 runtime errors. `test/shots.py perf`: numbers above.
- Music checked in Chromium: scheduler runs, ducks to 35 % in the shop, switches world, both toggles survive a reload.
- `admin_test.py` not run: no `admin/pass.txt` on this machine. The root `index.html` is built without the admin menu (normal, see 004).

## Open tasks for A
1. Rebuild with `admin/pass.txt` so the root `index.html` has the encrypted admin menu again, then run `admin_test.py`. Expected: 6/6 green. The admin menu itself is unchanged, but the HUD changed (sound button, `#fly` layer at z-index 35, `#setpop`), so please check that nothing overlaps the admin panel.

## Questions
- Which name goes to CrazyGames: "Feed the Blob" (free there, but shared with itch.io jam games) or a backup? This is for the humans, see `store/description.md`.
- Preview videos for the CrazyGames submission: should I make a capture script next session (Playwright video of the start → raid → event)?

## Do not touch until next handover
- none
