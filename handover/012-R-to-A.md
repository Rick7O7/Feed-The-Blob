# Handover 012: R to A
Date: 2026-11-22
Status: done
Commit: see `git log` (commit "handover 012")

R = a research session Paul ran in claude.ai (not agent B). This is a one-off and does not change the A/B ownership in `CLAUDE.md`. If B hands over 010 as 012 too, B renames theirs to the next free number (rule in `handover/README.md`).

Paul asked for this: research the current Roblox trends (his game idea started on Roblox), compare Feed the Blob against them, and hand the improvements to you. No code changed.

## Done
### 1. Roblox trends, late November 2026 (rough assessment, no exact numbers)
Platform: Q3 2026 DAU 138 M, down 9 % YoY after an extreme 2025. Payers down 16 %, but spending per payer up 5 %. Share of 18+ players is growing. Hits come and go fast: on 2026-11-18, 30 of the top 99 games were less than 2 months old, but only 2 of the top 10 were less than 3 months old.

| Trend | Players | Visits | Income | Note |
| --- | --- | --- | --- | --- |
| Steal-and-earn sims (Steal an Egg, Steal a Brainrot) | very high, falling fast | very high | high | #1 format; Steal an Egg lost ~1/3 of its players in Oct |
| Social roleplay / life sim (Brookhaven, Adopt Me!) | high, stable | highest lifetime | medium–high | safest long-term |
| Competitive FPS (Rivals) | medium | medium | highest per player | cosmetics |
| Ragdoll / physics / sports | rising fast | rising | unproven | biggest group of new hits |
| Horror / survival | medium, event spikes | medium | event-driven | Halloween lifted survival in Oct |
| Anime RPG / battlegrounds | medium, comes back with updates | high lifetime | medium–high | |
| "+1" incremental, co-op party | low–medium, rising | rising | low | high like ratios |

Monetisation that works: cosmetics, egg/crate openings, timed boosts, inventory slots, ads (70 % of the top 100 earners run Sponsored Ads). Roblox discovery now favours retention over short-term revenue.
Estimate caveat: per-game revenue for autumn 2026 is not public. The income column is inferred from monetisation style and older rankings.

### 2. Feed the Blob vs. these trends
Already a good fit:
- The core loop (collect, carry home, raid rival blobs for a jackpot, angry blob defends) is close to steal-and-earn, the #1 format.
- 10 events + surprises, max 40 s without anything new: matches event-driven engagement.
- Upgrades, 11 evolutions, rebirth into 5 worlds, offline income, daily streak, quests, achievements, album: covers the simulator and incremental side.
- Cosmetics (26 skins, 6 hats) as the gem sink: matches where Roblox players spend.

Gaps:
1. Nothing to collect and keep. Steal games are built around creatures with rarity that sit visibly at your base, earn passively and can be stolen. Our loot is eaten and gone, and the blob is the only thing you own.
2. No physics fun. A lunge is a hit plus a loot burst; nobody tumbles or wobbles.
3. Raids have little visible stake. A jackpot is "goo": no target you want, no loss that hurts, no reason for revenge.
4. Rivals feel like anonymous bots, which weakens the io feel the store tags promise.
5. No limited-time seasons. The events repeat forever.

Do not copy the hype-and-crash pattern. CrazyGames judges retention, so new features should add depth, not replace it.

## Tests
- none run (no code change, research session without a build)

## Open tasks for A
Ordered by impact. Keep the rules in `CLAUDE.md`: chill, not hectic, earned rewards only, seeded `rnd`, new save fields in `save()` and `newGame()`, tests green.
1. **Critters at home (design + logic).** Rare loot sometimes hatches an original critter (common, rare, epic, legendary). It sits around your blob and earns coins per second, and it counts for offline income. A raid jackpot on a rival can steal one of its critters; a rival raid on you can take one of yours (never the last one, and only after a clear warning, so it stays chill). Eggs and critters are earned in play only: no buying random eggs with gems, because gems also come from rewarded ads and that gets close to "no paid random boxes". Original designs only, no brainrot memes or other IP. Add an album page for critters. Write the balance numbers (hatch chance, income per tier, steal rules) in your handover, and ask B for critter art and the base display.
2. **Visible raid stakes.** Show above each rival blob what a raid can win (its best critter or the jackpot size), and mark the rival that raided you last ("revenge"). Logic yours, UI to B.
3. **Squishy physics (logic part).** Knockback with a short tumble for collectors hit by a lunge, and loot that bounces out. Keep it short, so it does not make control feel bad. Ask B for jelly wobble on blobs and the tumble animation. Check the frame rate with the perf scene from 011.
4. **Rivals that feel like players.** Made-up player names (no real names), own skins and hats per rival, and a small live ranking of the 4 blobs. Ask B for the UI.
5. **Seasonal content plan.** Propose a limited winter event or world with 2–3 time-limited skins that can be swapped every few weeks without a code change (data table). Plan only in your handover, build after Paul says yes.
6. Do 1–4 in that order, one per session if needed, and hand B the art/UI parts in your handovers.

## Questions
- For Paul (not an agent task): the repo is **public**. `docs/START-agent-A.md` says the clear-text `admin/admin.js` is only acceptable in a private repo, and `docs/BRIEF.md` contains his region, his training company and his legal plans. Should the repo be made private?

## Do not touch until next handover
- none

## Sources (checked 2026-11-22)
- https://www.ggrecon.com/articles/roblox-top-games-didnt-exist-before-october/
- https://www.ggrecon.com/articles/fastest-growing-new-roblox-games-november-2026/
- https://bloxodes.com/stats/reports/roblox-october-2026
- https://www.gaming.net/nl/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion/
- https://www.mediapost.com/publications/article/419134/
- https://rowatcher.com/news/the-10-highest-earning-roblox-games-in-2026-and-what-they-mean-for-the-platform
- https://rowatcher.com/news/roblox-monetization-strategies-that-actually-work-in-2026
- https://www.statista.com/statistics/1220905/roblox-most-visited-games
