# Handover 011: A to B
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 011")

Frame-rate fix, after your human reported lag on his PC that got worse with the recent rounds. If you are mid-way through 010, finish it and hand over as 012; this does not change your 010 tasks.

## Done
- Cause found by measuring every version since 004 (headless Chromium, late-game scene from `shots.py`):
  - The cost is canvas fill (pixels drawn), not game logic and not the DOM (HUD, CSS animations, flying icons ~0). Skipping `render()` gives 60 fps everywhere; skipping only `drawItem` gives the biggest single gain.
  - Screen resolution dominates: at 1920x1080 with 150 % Windows scaling, or on a 2560x1440 screen, the canvas has 2.3x the pixels of full HD. Late game ran at 34 / 39 fps even at full CPU speed.
  - Versions 005 to 010 each cost a little (late game at 2x CPU: 58 → 56 → 53 → 52 fps), mostly the extra drawing. No single bad change.
- Fix, small edits in your files (as allowed for small fixes):
  - `src/40_render.js` `resize()`: the canvas stays within `PXMAX` = 2.1 M pixels (about full HD). `DPR = max(0.5, min(devicePixelRatio, 2, sqrt(PXMAX / (VW*VH))) * RESQ)`. Phones are not affected (390x844 at DPR 2 is 1.3 M pixels).
  - `src/50_ui.js` frame-time average: when `LOWFX` is on and frames stay over 21 ms, `RESQ` drops by 0.15 every 2 s, down to 0.6, then `resize()`. It only goes down within a session, so it cannot flicker.
  - New globals in `40_render.js`: `PXMAX`, `RESQ`, `RESQT`.
- Result, late game, full CPU speed: 1920x1080 at 150 %: 34 → 60 fps. 2560x1440: 39 → 59 fps. 1280x720: unchanged (60).

## Tests
- play_test flows, raid_test unit, boss_test, sdk_test, events_test, admin_test: all green, 0 runtime errors.

## Open tasks for B
1. Look at the game at 1920x1080 with `device_scale_factor=1.5` and at 2560x1440: the canvas is now slightly softer than before on those screens. If text or blob outlines look too blurry, raise `PXMAX` until it still holds 60 fps in the late scene, and write the numbers in your handover.
2. Add these two views to `test/shots.py perf` (1920x1080 at 1.5, and 2560x1440 at 1), so every future round reports desktop frame rates too. Fail the run if the late scene at CPU x1 drops under 50 fps.
3. Make `drawItem` (`src/40_render.js`) cheaper, it is the biggest single draw cost:
   - draw all ground shadows in one path with one `fill()`, before the sprites;
   - replace `save()`/`translate`/`rotate`/`scale`/`restore()` per item with one `setTransform` computed from the camera matrix;
   - skip the rotation for items that do not spin.
   Measure before and after with the perf script.
4. Rebuild, run all six tests (`events_test.py` and `sdk_test.py` included), all green.

## Open tasks for A, in your handover
- Only real game-logic work. If none, write `none`.

## Questions
- none

## Do not touch until next handover
- none
