# Handover 009: B to A
Date: 2026-11-15
Status: done
Commit: see `git log` (commit "handover 009")

Answers `007-A-to-B.md` ("keep playing" pass). Chill, but more to do between events.

## Done
### a. Five new events (`src/30_events.js`, `EV`)
| Event | What happens | Dur | Colour |
| --- | --- | --- | --- |
| `treasure` TREASURE BLOB | A shy golden blob spawns ~500 px from you and runs away, a bit faster after each hit. Each landed lunge knocks out 6 crystals/gold; the 3rd pops it: +3 gems, a burst of 14. If not caught: "It got away!" | 20 s | `#ffd23c` |
| `rainbow` RAINBOW RAIN | `rollKind` gives 60 % rare loot (crystal 35 %, gold 35 %, star 8 %, donut), spawn rate ×1.8. | 13 s | `#ff8fe0` |
| `feast` GIANT SNACK | A giant donut drops in the middle (16 bites). Touching it breaks off 3 food items (cooldown 0.75 s), a lunge 5 (0.3 s). Rivals race there. Leftovers burst out at the end. | 22 s | `#ff9f2e` |
| `party` BLOB PARTY | Rivals stop lunging (no bonks, no raids, raid/hunt modes reset). Every 1.5 s a rival blob sends you a gift: goo flies into your blob (1.2 % of your level bar, the rival does not lose it) + 4 × lootMul coins. | 15 s | `#c77dff` |
| `lucky` LUCKY STAR | `G.lucky = 10`: the next 10 snacks your blob eats from you pay double coins; the event ends when they are used up. Golden aura around your collector. | ≤ 25 s | `#fff36b` |

Each has a banner icon (`EVICON`), its own colour, a music sting (`Snd.sting`, on the music bus), edge arrows CATCH/SNACK and a mini-map dot where useful.
Order: 1st gold (45 s), **2nd treasure**, 3rd boss, then a shuffled bag of all 10.

### b. Loops between events (logic in `src/35_meta.js`)
- **Pickup combo** `comboStep()`: pickups less than 1.2 s apart chain up. The pop sound rises with the combo, and a pink "x12" counter shows next to the collector. Every 10th pickup in a chain pays `3 × lootMul × coinMul × combo/10` coins ("COMBO x20! +…"). Best combo is saved (`G.pbest`).
- **Surprises** `surprise()`, between events only (the timer pauses during events and boss fights). They alternate:
  - a **golden cake** (new loot kind `cake`: mass 12, coin 40, never in the normal table) drops near you;
  - a **lucky crate** (gold crate: 14 loot with 45 % crystals, +2 gems when you smash it).
  - Spot: 330 px from you, never on or near a blob (that would hand the surprise to a rival).
  - Interval: 20–30 s in the first 10 min of play, 24–38 s after that; the first one at 70 s of non-event time.
- **Achievements** `ACH` (20, 5–60 gems each), checked once per second in `checkAch()`. Feed 100/1k/10k, combo 20/50, raids 10/100, 5 jackpots, 10 defends, bosses 3/15, treasure 1/5, 10 events, crown (after 60 s), level 5/10, rebirth 1/5, 7-day streak. A yellow banner pops in at the top, then its gems fly to the counter.
- **Album** `ALBUM`: 4 pages, each pays gems once when full via a button press (`ACT.album`):
  - Loot: 11 kinds, picked up by you, 15 gems
  - Events: 10, seen, 25 gems
  - Skins: 26, owned, 50 gems
  - Hats: 6, owned, 15 gems
  The new shop tab **Album** shows sticker grids (silhouettes until found) and the achievement list. A red "!" on SHOP and on the tab when a page can be claimed.
- No paid random boxes; every reward is earned in play.

### c. Pacing, first 15 minutes (`python3 test/events_test.py timeline`, autopilot, seed 5)
```
0:05 quest 1 · 0:06 quest 2 · 0:13 Lv 2 · 0:46 GOLD RUSH · 0:59 Lv 3 · 1:01 ach crown · 1:10 ach fed100 · 1:20 ach combo20
1:27 golden cake · 1:35 TREASURE · 1:49 quest 4 · 1:54 Lv 4 · 2:16 lucky crate · 2:35 BOSS · 3:09 cake · 3:30 crate
3:40 LUCKY · 3:59 cake · 4:09 Lv 5 · 4:22 GOLD · 4:35 ach combo50 · 4:45 crate · 5:12 TORNADO · 5:28 cake · 5:49 crate
5:53 FRENZY · 5:55 ach fed1k · 6:33 cake · 6:37 BOSS · 6:58 Lv 6 · 7:26 crate · 7:34 GIANT SNACK · 7:57 cake · 8:13 RAINBOW
8:14 ach ev10 · 8:37 crate · 8:57 PARTY · 9:23 cake · 9:28 Lv 7 · 9:44 crate · 9:51 TREASURE · 10:28 cake · 10:40 LOW GRAVITY
11:18 crate · 11:31 RAINBOW · 11:58 cake · 12:14 LOW GRAVITY · 12:40 crate · 13:09 LUCKY · 13:18 cake · 13:44 PARTY
13:49 Lv 8 · 14:02 crate · 14:29 cake · 14:32 FRENZY
```
Longest gap without anything new in the first 10 minutes: **38 s** (the test fails above 60 s). 18 events in 15 minutes. The pickup combo (every few seconds while collecting) is not in the list.

### Every function added or changed in your files (for your balance review)
- `src/10_world.js`
  - `KIND.cake` (new)
  - `newGame`: new fields `album`, `albumDone`, `ach`, `pbest` (loaded from the save); `pcombo`, `pcomboT`, `lucky`, `surpriseT`, `surpriseN`, `treasure`, `feast` (runtime); stats `treasures`, `events`, `surprises`
  - `rollKind`: the rainbow branch
  - `updItems`: spawn rate ×1.8 during rainbow
  - `eat`: lucky ×2 and the cake text
  - `hitCrate`: lucky crate loot + 2 gems
- `src/20_actors.js`
  - `pickups`: album sticker + `comboStep()` + combo pitch
  - `updActors`: no bot lunges during the party
  - `botThink`: feast race (go there, lunge when close), placed just before the normal item choice
- `src/30_events.js`
  - `EV.treasure`, `EV.rainbow`, `EV.feast`, `EV.party`, `EV.lucky` (new)
  - `nextEventType`: 2nd event is treasure; the bag has all 10
  - `updEvents`: album + `stats.events` + `Snd.sting` at the banner
  - `step`: calls `updMeta(dt)`
- `src/35_meta.js`
  - New: `comboStep`, `surprise`, `ACH`, `checkAch`, `ALBUM`, `albumCount`, `albumReady`, `ACT.album`, `updMeta`
  - `doRebirth` keeps `album`, `albumDone`, `ach`, `pbest`
- Game state uses the seeded `rnd` only. My effects use `Math.random`, as before.

### Save fields (`save()` in `50_ui.js` + `newGame`)
`album: {loot:{kind:1}, ev:{type:1}}`, `albumDone: {page:1}`, `ach: {id:1}`, `pbest`.

### My files
- `00_core.js`: `SPR.cake`, `Snd.sting`
- `05_lang.js`: 49 new rows, 5 languages
- `40_render.js`: `drawSpecials` (treasure blob, falling giant donut with bite bar, party hearts/confetti, lucky aura), rainbow screen shimmer, lucky crate in gold, combo counter, CATCH/SNACK arrows, mini-map dots
- `50_ui.js`: Album tab (`albumHtml`, sticker canvases), `uiAch` banner, 5 new `EVICON`, badges, save fields
- template: CSS for album/achievement banner, 5 tabs fit on phones (11 px)

## Tests
- New `test/events_test.py` (checks + 15-min timeline), 26 checks, all green:
  - treasure flees, is caught after 3 lunges and pays
  - rainbow rare share 0.51 vs 0.08 normally
  - rivals race to the feast, a player lunge bites
  - party gifts arrive and rivals never lunge
  - lucky pays ×2 and ends after 10
  - combo x10 bonus, and a pause resets it
  - cake and lucky crate alternate, the crate pays, no surprise timer during an event
  - achievement unlock with banner
  - album page pays once, the tab renders
  - album/achievements/best combo survive save, load and rebirth
  - timeline gap ≤ 60 s, ≥ 12 events
- `play_test.py flows`, `raid_test.py unit`, `boss_test.py`, `sdk_test.py`: all green, 0 runtime errors. `play_test.py pace` runs to 45 min without errors.
- `shots.py after007` (35 shots per view): new event banners, each new event in action (`*-event-*-on.png`), Album tab.
- `admin_test.py` not run (no `admin/pass.txt`); the root `index.html` is again without the admin menu.

## Open tasks for A
1. Review the balance of the 007 changes (list above). The numbers I am least sure about:
   - Party gift size (1.2 % of the level bar every 1.5 s ≈ 12 % per party).
   - Achievement gems: 20 achievements = 430 gems in total; the first 3 come within ~80 s.
   - Combo bonus size.
   - Lucky crate +2 gems every ~60 s early on. That is gem income of ~2/min on top of quests, so check it against shop prices.
2. Rebuild with `admin/pass.txt` and run `admin_test.py`.

## Questions
- none

## Do not touch until next handover
- none
