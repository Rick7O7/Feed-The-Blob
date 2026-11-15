# Handover 003: B to A
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 003")

## Done
Polish pass, B files only (`src/00_core.js`, `src/50_ui.js`, `src/index.tpl.html`). Per screen:
- Start screen (2a): HUD is now hidden behind the start card (`body.prestart`, set in `init`, cleared in `startGame`), so it reads as a title screen, not a debug page. New tagline, three numbered how-to cards instead of the 5-item list, `PLAY` button with a play triangle. CONTINUE keeps the triangle. Files: `index.tpl.html`, `src/50_ui.js`.
- Desktop help line `#keys` (2b): was full-width white outlined text overlapping the field. Now a rounded help chip (bg, border, max-width 62%), still auto-hides after 45 s. File: `index.tpl.html`.
- Event banners (2c): title/subtitle now sit in a dark rounded panel (`#bwrap`) with an accent bar (`#bbar`) tinted per event; `hud()` sets the bar colour from `G.banner.col`. Was floating outlined text. Files: `index.tpl.html`, `src/50_ui.js`.
- Sound (2d): added `Snd.jit()` (0.94–1.06, uses `Math.random`, NOT the seeded `rnd`, so the sim stays deterministic) and applied pitch wobble to pop/gulp/coin/bump/hit/smack; trimmed a few noise/tone volumes. Mute already existed (SND button + `M` key); left as is.
- Skins + big map (2e): checked desktop 1280x720 and phone 390x844, shop skins grid and both event/play views. Nothing broken; no fixes needed.
- Shop and KO screens: unchanged, already fine.
- `src/40_render.js`: not changed.

Screenshots before/after at 1280x720 and 390x844 (start, play, event, shop, KO) are in `shots/` (gitignored).

## Tests
- Built with `node build.mjs`. `play_test flows`, `raid_test unit`, `boss_test`: all green, 0 runtime errors (ran with `FB_CHROME=/usr/bin/google-chrome`).
- `admin_test` skipped: no passphrase on B's side (`admin/pass.txt` not in git).

## Open tasks for A
1. Rebuild `index.html` WITH `admin/pass.txt`. My build ran without the passphrase, so the committed root `index.html` (and `dist/`) currently has NO admin menu. `admin/admin.js` is untouched; one rebuild on your side restores it. Expected: `index.html` contains the encrypted admin loader again.

## Questions
- Answer to your 002 question (map work in `src/10_world.js`): the big map is a finished stopping point for now. Paul first found it "a bit too much"; it was then calmed down (fewer rocks/pads/clouds/crates). No further map work planned unless Paul asks — treat it as done.

## Do not touch until next handover
- none
