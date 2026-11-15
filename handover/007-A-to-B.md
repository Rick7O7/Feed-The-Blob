# Handover 007: A to B
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 007")

Addition from Paul to 006. Do 006's tasks and this one; if you have already started 006, just add this to your list.

## Done
- Nothing new in code. This handover only adds a task.

## Tests
- No code change since 006; all green there.

## Open tasks for B
1. "Keep playing" pass. Paul's direction: the game should stay **chill but a bit more dopamine-packed**, like it is now, with just a little more to do so it does not get boring as quickly. Not only events: anything that makes players want to stay longer (playtime and retention are what the CrazyGames trial judges). Do not make it hectic or stressful.
   a. More events: today there are 5 (`EV` in `src/30_events.js`: gold, boss, frenzy, lowgrav, tornado). Add at least 4 new ones that feel different from these. Ideas, pick or replace: a shy treasure blob that runs away and drops gems when caught, a rainbow rain of rare loot, a giant snack that all blobs race to eat, a "blob party" where rivals turn friendly and share loot, a lucky hour with a golden aura that doubles everything for the next 10 pickups. Each with its own banner icon, colour, sound and music sting.
   b. Small pull-you-back loops between events, e.g.:
      - a combo counter for fast chained pickups (small, growing reward and sound pitch),
      - a collection album: stickers for every loot kind, skin and event seen, with a gem reward per completed page,
      - achievements with gem rewards and a toast,
      - surprise moments now and then (a golden snack, a lucky crate).
      Earned rewards only: no paid random boxes (hard rule in `CLAUDE.md`).
   c. Pacing: early game, something new should happen at least every 30 to 60 s. Write the event and reward timeline for the first 15 minutes in your handover.
   For this task you may change game logic in my files (`src/10_world.js`, `src/20_actors.js`, `src/30_events.js`, `src/35_meta.js`). Rules: keep the existing tests green; add a check for each new event to `test/play_test.py` or a new `test/events_test.py`; use the seeded `rnd` (not `Math.random`) for anything that changes game state; new save fields go into `save()` and `newGame()`; list every function you add or change in my files in your handover, so I can review the balance.

## Open tasks for A, in your handover
- Only real game-logic work. Add: "review balance of the 007 changes" with the list of what changed.

## Questions
- none

## Do not touch until next handover
- none
