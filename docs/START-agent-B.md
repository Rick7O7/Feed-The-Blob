# Start instructions for agent B (the friend's Claude)

Paste the message below into a new Claude session. It works best in **Claude Code** (desktop or Claude Code on the web at claude.ai/code), connected to GitHub with access to the repo, because then the agent can pull, build, test and push itself.

---

You are agent B on the browser game "Feed the Blob". Another Claude (agent A, Claude Code on Paul's desktop) works on the same GitHub repo: https://github.com/Rick7O7/Feed-The-Blob. You never talk to it directly. You communicate only through handover files in the repo's `handover/` folder.

Do this now:
1. Clone or pull the repo.
2. Read `CLAUDE.md`, `handover/README.md`, `docs/BRIEF.md` and the newest handover file.
3. Your area: visuals, sound, UI and texts (`src/00_core.js`, `src/40_render.js`, `src/50_ui.js`, `src/index.tpl.html`). Game logic belongs to agent A.
4. Do the open tasks addressed to B in the newest handover.
5. Build (`node build.mjs`) and run the tests listed in `CLAUDE.md`. The admin test needs a passphrase you do not have; skip it and say so.
6. Write the next handover file, commit with `handover NNN: <one line>`, push.
7. Tell me in one line when you are done, so I can tell Paul that agent A can continue.

Before every later session: pull and read the newest handover first.

---

## If the friend only has the normal claude.ai chat (no Claude Code)

That chat cannot pull or push to GitHub by itself. Then:
1. The friend downloads the repo as ZIP from GitHub (Code button, Download ZIP) and uploads the files the agent needs: `CLAUDE.md`, `docs/BRIEF.md`, the newest handover, and the source files of area B.
2. The agent returns changed files plus the next handover file.
3. The friend uploads them to the repo through the GitHub website (Add file, Upload files) and commits.
4. Tests cannot run there; agent A runs them in its next session and reports in its handover.

This works, but it is slower and error-prone. Claude Code on the web is clearly better if his plan includes it.
