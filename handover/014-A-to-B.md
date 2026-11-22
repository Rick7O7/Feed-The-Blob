# Handover 014: A to B
Date: 2026-11-22
Status: done
Commit: see `git log` (commit "handover 014")

**Do 013's tasks 1–8 first. They are all still open for you** (critter art, hatch moment, album sticker, raid-stakes UI, critter warning, HUD, translations, tests). This file adds the art/UI parts of 012 tasks 3 and 4 below them. With this, all of A's 012 tasks are done.

## Done
### 012 task 3: squishy physics (logic)
`src/20_actors.js`:
- `bonk()`, a lunge hitting a collector:
  - Sets `vic.tum` and `vic.tumT`: 0.55 s for a rival, 0.35 s for the player. `tum` counts down to 0.
  - Sets `vic.tumD` = +1 or -1, the spin direction.
  - Stun is unchanged (0.5 s), so control feels the same.
- Knockback for a rival victim went from 420 to 480. The player stays at 420.
- While `tum > 0`, a blob that hits the arena edge bounces back at half speed instead of stopping.

`src/10_world.js`:
- `dropFrom(a, n, kx, ky)`: loot knocked out by a bonk sprays towards the knock direction (±63°), flies higher and bounces twice.
  - These items have `it.bmax = 2`, with restitution 0.5 instead of 0.34.
  - Every other drop is unchanged.
  - Measured over 20 seeds, 6 apples each, after 4 s with the player standing still:
    - the bot gets back 32 apples with the forward spray, against 45 with the old random spray;
    - the player picks up 1–4 by magnet either way.
  - So more loot stays on the ground to chase.

### 012 task 4: rivals that feel like players (logic)
`src/10_world.js`:
- `LEAGUES` is gone. `RNAMES` holds 28 made-up handles: kid-safe, no real names, no brands, not translated.
- `rivalsNew(sv)` picks 3 different names, 3 different skins and 3 hats for rivals 1–3 and stores them in `G.rv = {n, s, h}`.
  - Skins exclude `classic`, the player's current skin, and own-hue skins (rainbow, aurora).
  - Hats never include `crown`, because the crown marks the leader.
  - `NAMES` is still filled, so every existing `say()` works.
  - Only one `rnd()` call (it seeds a local generator), so seeds drift little.
- Saved as `rv`. A reload keeps the same rivals, and a rebirth rolls new ones.
- `rivalLook(i)` returns `{skin, hat}`. For a rival, `skin` is a copy of the chosen skin with `h = BHUE[i]`: its pattern on the team colour, so the 4 blobs stay easy to tell apart. `i = 0` gives the player's own skin and hat.
- `ranking()` returns `[{id, name, level, mass, you}]`, best first, sorted by mass (same rule as the crown).

### Small edit in your file
- `src/50_ui.js` `save()`: added `rv: G.rv`. Without it, rivals would change on every reload.

### Tests
- New `test/rivals_test.py`, 19 checks: tumble times, spin, stun unchanged, spray direction, 2 bounces, edge bounce, names/skins/hats unique, save/reload, rebirth reroll, `rivalLook`, `ranking`, a 3-min smoke run.
- Two old checks were made seed-proof. The new `rnd()` call shifted what happens around them; the game logic is unchanged.
  - `raid_test.py` SETUP clears rival carries and any loot near / flying into rival 1 before the hits. Before, rival 1 ate loot during hit 1, so "rival loses" read -0.6 %. Now it is exactly 3.0 % (`RLOSS[0]`).
  - `events_test.py` pickup combo resets `P.stun`, `P.tum` and sets `P.immune` first. Before, a rival bonk just before the check stunned the player and broke the chain at 9.
- `CLAUDE.md`: added `rivals_test.py` to the test list.

## Tests
- `node build.mjs` ok
- play_test flows, raid_test unit, boss_test, critter_test, rivals_test, admin_test, events_test checks, sdk_test: all green, 0 runtime errors.
- `raid_test.py pace`, before → after (minutes):
  - rebirth 1 for collect-only seed 2: 12.1 → 13.4
  - raid-passing seed 1: 11.0 → 12.1
  - raid-passing seed 2: 10.9 → 10.9
  - always-raid: unchanged
  - Within seed noise, no balance change intended.
- `play_test.py pace` 45 min: level 8 and 120 buys, same as before. The bonk count went 34 → 16 (seed drift plus longer bot tumbles). Watch it, no action needed.
- `shots.py perf`: desktop and phone hold 60 fps at CPU x1, and 20 / 18 fps at CPU x4. Render code is untouched; this is the reference for your critter art.

## Open tasks for B
1. **013 tasks 1–8 first** (see `handover/013-A-to-B.md`).
2. **Tumble animation** (`src/40_render.js` `drawActor`): while `a.tum > 0`, let `k = 1 - a.tum / a.tumT`.
   - Rotate the collector by `a.tumD * k * 2π` (one roll).
   - Squash it: x up to 1.25, y down to 0.8, easing back to 1 by `k = 1`.
   - Hide the carried stack drawing during the roll if it looks odd.
3. **Jelly wobble on blobs:** `b.wobV` already gets +6 on raid hits. Add the same short squash-and-stretch to the collectors on a bonk (on `tum` start) and to the blob when its feeder arrives. Keep it subtle and cheap, with no new per-frame paths.
4. **Rival looks** (`40_render.js`):
   - `skinOf(i)` for `i > 0`: return `rivalLook(i).skin` instead of `{h: BHUE[i], s: 85, l: 60}`.
   - Draw `rivalLook(i).hat` on rival collectors and blobs too (the `drawHat` call is player-only now).
   - The minimap colours (`COLORS[i]`) stay.
5. **Live ranking** (`50_ui.js` HUD): a small list of the 4 from `ranking()`: place, name, level.
   - Highlight `you`, and show the crown on place 1.
   - Update it at most twice a second, not per frame.
   - On phones, collapse it to "#2 of 4".
6. Rebuild, run all tests including `rivals_test.py` and `critter_test.py`, and run `shots.py perf` before and after. Keep CPU x1 at 60 fps.

## Questions
- none for B.
- Paul's answer on the repo being public: leave it public. Do not ask again.
- Frost Fest (seasonal plan in 013): asked Paul in chat, answer in the next A handover.

## Do not touch until next handover
- none
