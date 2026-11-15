# Handover 006: A to B
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 006")

Great round in 005. Paul's answers: the name stays **Feed the Blob**, and yes to preview videos.

## Done
- Your 005 task for A: rebuilt with `admin/pass.txt`, root `index.html` has the encrypted admin menu again. Admin panel vs new HUD: no overlap (`#fbA` z-index 9997, `#fly` 35 with no pointer events, `#setpop` 6). The five-tap phone opening still works.
- `test/admin_test.py`: the "freeze rivals" check failed about 1 in 7 runs. Frozen rivals do not move by themselves, but blob separation and rock push-out (`src/20_actors.js:147`, `src/10_world.js:197`) shift them a few px when they overlap. The check now allows < 25 px in 0.7 s (measured: 0 px in 10/10 runs). 10/10 green.

## Tests
- On top of your 005: play_test flows, raid_test unit, boss_test green, 0 runtime errors. admin_test 10/10 green.

## Open tasks for B
1. Preview videos for CrazyGames. Check the current video rules in the CrazyGames developer docs (length, size, format, no text or logos, etc.). Write `store/make_videos.py` (Playwright video capture of the real game: start → collecting → raid with jackpot → an event → level-up; drive it through `window.__fb`/`G`). Produce every video CrazyGames asks for in `store/`. If a converter is needed (e.g. webm to mp4), use `ffmpeg` if installed and say so.
2. Name decided: update `store/description.md` to "Feed the Blob" as the final name (keep the backups listed as backups).
3. First-minute onboarding (conversion to gameplay and playtime are what the trial judges): in the first 60 s of a brand-new save, guide the player with in-world hints: move here, pick up loot, bring it home, lunge into a rival. One hint at a time, each disappears once done. No text walls, no modal. UI side is yours; read the state (`G.stats`, `G.started`, `G.tips`) and do not write game state. If you need a hook in my files, add a small one and list it.
4. Languages: texts are yours. Add a tiny `T(key)` text table with English (default), German, Spanish, Portuguese (BR) and French, picked from `navigator.language`, with a language switch in the sound/settings panel (saved). Move every player-visible string into it, including the ones in my files (quest texts in `src/35_meta.js`, event titles in `src/30_events.js`, banners): for this task you may edit strings in my files, but only strings. Check at 390x844 that German and French texts still fit (they are longer).
5. CrazyGames SDK test (ads layer is mine, I hand it to you for this one file): write `test/sdk_test.py` that opens `dist/portal-full/index.html` with the real SDK script blocked and a mock `window.CrazyGames.SDK` injected (record every call). Check: `gameplayStart`/`gameplayStop` around pop-ups, KO and rewarded ads; `midgame()` break ads at most once per 3 minutes and only at natural pauses; rewarded ads only on a button press, never on the running game screen; every rewarded offer has a gem alternative; sound muted during ads. If anything breaks a CrazyGames rule, do not fix it in `src/35_meta.js`: list it as a numbered task for A with the exact call sequence.
6. After every task: rebuild, run play, raid, boss and your new sdk test, all green. Before/after shots with `test/shots.py` where screens changed.

## Open tasks for A, in your handover
- Only real game-logic work (balance, mechanics, bugs in my files, SDK rule breaks from task 5). If none, write `none`.

## Questions
- none

## Do not touch until next handover
- none
