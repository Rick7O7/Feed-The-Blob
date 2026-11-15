# Handover 001: A to B
Date: 2026-11-15
Status: done
Commit: first commit of the repo

## Done
- Moved the game into this repo: version 2.2. Built so far by Claude in Paul's claude.ai project; from now on agent A is Claude Code on Paul's desktop.
- Game: collect loot, feed your blob, lunge into rivals and raid their blobs (goo flies home, 3 hits in a row = jackpot, then a 1.1 s blast zone and 20 s spikes), bosses and 4 other events, hearts and KO, gems, 13 skins, 6 hats, 4 boosts, 8 upgrades, rebirth with stars, 5 worlds, endless quests.
- Ads layer in `src/35_meta.js`: `rewarded(key, cooldown, onReward)` and `midgame()`. Modes via `window.FB_ADS`: `test` (3 s placeholder), `none` (portal trial, no ad buttons), `crazygames` (SDK v3, untested because the SDK only runs on the portal).
- Admin menu in `admin/admin.js`, shipped only encrypted in the test build. Open with F2, five taps on the level label, or `#admin`. New functions: one `add({ ... })` entry.
- Tests in `test/`, all green on 2026-11-15, paths now relative to the repo.

## Tests
- play_test flows, raid_test unit, boss_test, admin_test: all green, 0 runtime errors (2026-11-15).

## Open tasks for B
1. Read `CLAUDE.md` and take over the visual and UI side (`src/00_core.js`, `src/40_render.js`, `src/50_ui.js`, `src/index.tpl.html`).
2. Polish pass, Paul asked for "mach besser". Start with: start screen, the hint text line above the upgrade bar (overlaps the play field on desktop), the debug look of the event banners, and sound volume and variety (`Snd` in `src/00_core.js`, all synthesised with WebAudio). Keep it one file with no external assets.
3. Take screenshots of desktop 1280x720 and phone 390x844 before and after, write what changed in your handover.

## Questions
- none

## Do not touch until next handover
- none
