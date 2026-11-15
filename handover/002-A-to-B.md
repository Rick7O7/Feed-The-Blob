# Handover 002: A to B
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 002")

## Done
- Repo is now https://github.com/Rick7O7/Feed-The-Blob. The org repo Feed-The-Blob/Feed-The-Blob is unused for now (it holds v2.2).
- Split your v2.5 `index.html` back into sources using its `// ---- file ----` markers: `src/*.js`, `src/index.tpl.html`, `dev/harness.js`, `admin/loader.js`. Admin menu decrypted with the passphrase: `admin/admin.js` is unchanged from v2.2.
- `node build.mjs` now reproduces your v2.5 `index.html` byte for byte (only the admin ciphertext differs, because the IV is new per build).
- `build.mjs` also writes root `index.html` (copy of `dist/index.html`). From now on edit `src/` only, never `index.html`.
- Added the full setup: `CLAUDE.md`, `handover/`, `docs/`, `build.mjs`, `test/`, `admin/` (without pass.txt), `.gitignore`.

## Tests
- play_test flows, raid_test unit, boss_test, admin_test on v2.5: all green, 0 runtime errors.
- admin_test is flaky (fails ~1 in 3: gem count after "spawn 30 gems" comes out short because the game keeps running). Mine, I will fix it.

## Open tasks for B
1. Set up: clone the repo, then follow the setup in `CLAUDE.md` (Node, venv, Playwright). Run `node build.mjs` and the three tests that need no passphrase. Report results.
2. Polish pass (Paul: "mach besser"), your files only (`src/00_core.js`, `src/40_render.js`, `src/50_ui.js`, `src/index.tpl.html`):
   a. Start screen: make it look like a finished game, not a debug page.
   b. Hint text line above the upgrade bar overlaps the play field on desktop: fix.
   c. Event banners (boss, gold rush, frenzy, low gravity, tornado): replace the debug look with proper styled banners.
   d. Sound (`Snd` in `src/00_core.js`): balance the volumes, add variety (pitch variation for pickups/hits), add a mute toggle if none exists.
   e. Check the new v2.5 skins and the big map at both sizes below; fix anything that looks broken.
3. Screenshots before and after, desktop 1280x720 and phone 390x844 (start screen, play, shop, an event banner, KO screen). Save to `shots/` (gitignored) and list in your handover what changed per screen.
4. Run all tests again after your changes (`.venv/bin/python test/...`), all must be green.
5. If you change anything in my files (`src/10_world.js`, `src/20_actors.js`, `src/30_events.js`, `src/35_meta.js`), list file and reason.

## Questions
- v2.5 changed `src/10_world.js` (big map, crates, portals, loot clouds). Is that finished, or is more map work planned? If more is planned, list it as open tasks for A in your handover.

## Do not touch until next handover
- `test/admin_test.py` (I fix the flaky check)
