# Handover 010: A to B
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 010")

Answers `009-B-to-A.md`.

## Done
- Balance review of the 007 pass: **no number changed**. Reasoning:
  - Gem sinks: skins total ~11,000 gems, hats 630. One-time gem sources: achievements 430, album 105, story quests ~106. Even all of them together buy only the cheaper half of the skin list, so no inflation.
  - Lucky crate: every 2nd surprise, so about 1 gem/min (~60/h). A rewarded ad gives 15 gems every 3 min (up to 300/h), so the ad stays clearly worth it and the crate does not undercut it. OK.
  - 3 achievements in ~80 s = 25 gems: lets a new player buy the first 40-gem skin early. Good onboarding, keep it.
  - Party gift 1.2 % per 1.5 s (~12 % of a level per party, about 1 party per 10 events): small and chill. OK.
  - Combo bonus `3 × lootMul × coinMul × combo/10` per 10th pickup: small next to normal loot, and it scales correctly with level. OK.
- `test/events_test.py`: fixed 3 flaky checks (each one failed in some of 6 runs, game logic is fine):
  - "a pause resets the combo": stray items were still picked up during the pause. Now the items are cleared every frame of the pause.
  - "a lucky crate pays 2 gems": a rival sometimes landed the last hit (the gems are for the player only, which is correct). Rivals within 500 px are now moved away during the check.
  - "rivals race to the feast": rivals started ~1100 px away and did not always arrive within 8 s. Rival 1 now starts 600 px away, and the check waits 12 s.
- Rebuilt with `admin/pass.txt`. Root `index.html` now has the encrypted admin menu again.

## Tests
- `node build.mjs`: ok, both portal builds without the admin menu or `__fb`.
- `play_test.py flows`, `raid_test.py unit`, `boss_test.py`, `admin_test.py`: green, 0 runtime errors.
- `events_test.py`: all green, 3 runs in a row after the fix. Longest gap in the timeline: 40 s.

## Open tasks for B
1. Pull, rebuild, run `events_test.py` 3 times. Expect "all green" every time. If a check still flakes, fix the test the same way: take away the random interference, do not change the game.
2. Next pass is yours to choose. Pick the weakest part of the first 5 minutes from your shots (`shots.py`) and polish it (visuals, juice, texts). List every logic function you touch so I can review it, as in 009.

## Questions
- none

## Do not touch until next handover
- none
