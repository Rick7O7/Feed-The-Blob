# Handover 013: A to B
Date: 2026-11-22
Status: done
Commit: see `git log` (commit "handover 013")

Answers 012 (R, research session). Done here: 012 task 1 (critters, logic), task 2 (raid stakes, logic only), task 5 (seasonal plan, no code). Tasks 3 (squishy physics) and 4 (rivals like players) are for the next A session.

## Done
- New file `src/36_critters.js` (A owns it, added to the ownership table in `CLAUDE.md`). Original critters, 10 species in 4 tiers:
  - Common: Puddle Pip `pip`, Bean Bug `bean`, Sproutling `sprout`
  - Rare: Fizzlet `fizz`, Moss Mole `mole`, Dewdrop `drop`
  - Epic: Glow Newt `newt`, Puff Owl `owl`
  - Legendary: Comet Kit `comet`, Star Jelly `jelly`
- State: `G.crit[i]` holds the critter ids at blob i (0 = player). `G.egg` is the egg meter. `G.revenge = {id, c}` and `G.lastRaider` are also set.
- Hooks:
  - `eat()` calls `critFeed`.
  - `cpsNow()` = `cpsBase() * (1 + critIncome())`, so offline income counts critters too.
  - `updBlobs` calls `critTick`.
  - Rival raid start → `critRaidStart`, rival hit on your blob → `critRaidHit`, your jackpot → `critJackpot`.
  - Save fields are `crit` and `egg`. On rebirth the player keeps their critters and the rivals reset.
  - New stats: `hatched`, `critStolen`.
- New album page `crit` (40 gems when full).
- Helpers for your UI: `raidPrize(i)` returns `{crit, tier, coins, revenge}` and `critPos(i)` returns `[{id, tier, x, y, hop}]`. `CTIER[t].col` holds the tier colours.
- Critters are not drawn yet. You only see them in say() texts and as name text on the album page.
- Edited B's file `src/50_ui.js`, both small:
  1. `save()` stores `crit` and `egg`.
  2. `albumHtml()` shows the critter name in the tier colour as a placeholder for page `crit`. Without it the page would try to draw a hat sticker.
- Tests:
  - New `test/critter_test.py` with 16 checks plus a 15-min pacing timeline.
  - `test/events_test.py`: the album page count now comes from `ALBUM.length`. The giant-snack player lunge re-forces the feast if the rivals already ate it (seed drift from the new `rnd()` calls).

### Balance
- **Egg points** per fed item (player only, not flying goo): gem 0.2, gold 0.12, star 2, cake 4. A hatch needs `30 + 25 × owned` points, max 200.
- **Tier weights:** common 64, rare 26, epic 8.5, legendary 1.5. Luck upgrade (eff `l`) multiplies rare by √l, epic by l^0.75 and legendary by l.
- **Income:** each critter adds a share of the base passive income: common +0.4, rare +1, epic +2.5, legendary +6 (× `cpsBase`).
- **Home cap** is 8. A better hatch replaces the weakest critter. A hatch that is not better pays 60 s of its own income in coins.
- **Rivals:** each starts with 1 critter (a 2nd one after a rebirth). Every 150–240 s one random rival hatches another, up to 5 each.
- **Your jackpot on a rival** takes its best critter. If that rival took one of yours, you get that one back first, plus 2 gems ("REVENGE!").
- **A rival takes one of yours** only if all of these hold:
  - you own at least 2;
  - the session is past 180 s;
  - it has been 5 min since your last loss;
  - the warning came at raid start ("X is after your critters! Bonk them!").
  - It happens on the raid's last hit and takes your weakest critter. Bonking the raider (existing DEFENDED path) cancels it.
- **Measured** with 15 min of autopilot, raider on, seeds 1–3:
  - hatches at about 3, 6, 9–11 and 12–14 min (4 hatches), plus 3–5 critters stolen from rivals;
  - critters make 1–4.5 % of all coins, so most of their value shows up in offline income.
- No egg or critter can be bought with gems. That is on purpose: gems also come from rewarded ads, and this keeps us clear of "paid random boxes".

### Seasonal plan (012 task 5, plan only, waiting for Paul)
- A data table `SEASONS = [{ id: 'winter26', from: '2026-12-01', to: '2027-01-06', name: 'Frost Fest', skins: [...2-3 skin defs...], critter: {...one limited critter...}, tint: {...floor/edge colours...} }]`, checked against `Date.now()` at start.
- While a season is active:
  - its skins appear in the shop with a "limited" tag, bought with gems as usual;
  - its critter can hatch at a small share of the epic weight;
  - the arena gets the tint.
- Owned items stay owned after the season ends.
- Swapping a season means editing the data table only. Sprites must be pattern/colour-based like the current skins, so no new drawing code is needed.
- Proposed first season: Frost Fest, with skins Snow Globe, Candy Cane and Northern Lights and the critter Snow Puff (epic).

## Tests
- `node build.mjs` ok
- `play_test.py flows`: green, 0 runtime errors
- `raid_test.py unit`: green
- `boss_test.py`: green
- `admin_test.py`: green
- `events_test.py checks`: all green
- `critter_test.py`: 0 fails

## Open tasks for B
1. **Critter art** (`src/40_render.js`): one small original sprite per species (10, ids above), about 22–28 px. Each tier gets its own look; use `CTIER[t].col` as a rim/glow colour, legendary with a soft sparkle. Draw them at every blob from `critPos(i)`, using `hop` (0..1) for a little bounce. Keep the cost low: pre-render sprites, max 8 + 3×5 critters on the map. Check with the perf scene from 011.
2. **Hatch moment:** when `G.stats.hatched` goes up, show a short egg crack and pop at the player blob. The say() texts already exist; replace or keep them.
3. **Album page `crit`** (`src/50_ui.js` `albumHtml`): replace my coloured-name placeholder with the sprite sticker (add a `crit:` type to the `canvas[data-st]` drawer), with the tier name under it.
4. **Raid stakes UI** (012 task 2): above each rival blob show `raidPrize(i)`: its best critter icon in tier colour if `crit`, otherwise the jackpot coins. Mark the rival with `revenge === true` with a small "REVENGE" tag. Keep it readable but small, on screen only.
5. **Critter warning:** while `G.critWarn` is set (`{id, t}`), show a clear HUD hint and an arrow to raider `G.actors[G.critWarn.id]`. It must stay chill, no alarm spam.
6. **HUD / shop info:** show the critter count `G.crit[0].length`/8 and the egg meter progress `G.egg / eggNeed()` somewhere calm, for example under the blob or in the shop.
7. **Translations** (`src/05_lang.js`) for the new strings:
   - say/toast texts: `'{0} hatched!'`, `'You stole {0}!'`, `'Home is full: +{0} coins'`, `'{0} is after your critters! Bonk them!'`, `'{0} took {1}! Raid them to get it back'`
   - labels: `'Critters'`, the tier names `Common`/`Rare`/`Epic`/`Legendary`, and the 10 species names
8. After 1–7: rebuild and run all tests incl. `critter_test.py`. Take before/after shots with `test/shots.py`.

## Questions
- For Paul: should the repo be made private? (Carried over from 012: the repo is public, `admin/admin.js` is clear text and `docs/BRIEF.md` holds personal details.)
- For Paul: should I build the seasonal plan above (Frost Fest from 2026-12-01)? Yes or no, and any skin wishes.

## Do not touch until next handover
- none
