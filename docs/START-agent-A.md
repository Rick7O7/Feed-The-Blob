# Start instructions for agent A (Claude Code on Paul's desktop)

You take over Feed the Blob from the Claude that built it in Paul's claude.ai project. From now on you are agent A: game logic, balance, ads layer, admin menu, build, tests. Another Claude (agent B, Paul's friend, probably on the web) does visuals, sound and UI. You talk to it only through files in `handover/`.

## Step 1: set up the repo (once)

Paul has created a private GitHub repo and added his friend as collaborator. He gives you the repo URL.

1. Check the tools: `git --version`, `node --version` (18 or newer), `python3 --version` (3.10 or newer), `gh auth status` (GitHub CLI, if installed). Install what is missing with the system package manager after asking Paul. Explain every command to Paul before you run it, he wants that.
2. This folder is the unpacked handoff package. Make it the repo:
   ```
   git init -b main
   git remote add origin <repo URL from Paul>
   git add -A
   git status            # admin/pass.txt must NOT be listed; .gitignore excludes it
   git commit -m "handover 001: game version 2.2, rules and handover system"
   git push -u origin main
   ```
   If `admin/pass.txt` shows up in `git status`, stop and fix `.gitignore` first.
3. Test setup: `python3 -m venv .venv`, `source .venv/bin/activate`, `pip install -r requirements-test.txt`, `python3 -m playwright install chromium`.
4. Build and test, all must be green:
   ```
   node build.mjs
   python3 test/play_test.py flows
   python3 test/raid_test.py unit
   python3 test/boss_test.py
   python3 test/admin_test.py
   ```
5. Open `dist/index.html` in a browser for Paul and let him play a minute, to confirm the handoff worked.
6. Tell Paul: repo pushed, tests green, and the exact message he sends to his friend's agent (from `docs/START-agent-B.md`).

## Step 2: every work session after that

Follow `CLAUDE.md`: pull, read the newest handover, work, test, write the next handover, commit, push. Then tell Paul in one line that agent B can continue.

## Your first own tasks, while agent B does the polish pass
1. Prepare the CrazyGames submission package: check the name "Feed the Blob" for conflicts (web search, CrazyGames and Poki catalogues, app stores), draft the store description, list what cover images are needed in which sizes. Put it in `docs/submission.md`. Cover art itself is agent B's job; put that request in your handover.
2. Run `python3 test/play_test.py pace` and `python3 test/raid_test.py pace` and note the times in your handover, so balance changes later can be compared.
3. Do not register, pay or submit anything. Those are Paul's steps, and only after he says yes.

## How to work with Paul
- He decides only what needs a human; you decide the rest and deliver finished results, not instructions.
- At most 3 tasks for him per answer, each under 30 minutes.
- Check every number before showing it, mark estimates.
- Say early when something will not work.
- Short and direct. Explain every shell command you ask him to run or run for him.
- Background and rules: `docs/BRIEF.md`.

## Admin menu
- `admin/pass.txt` holds the passphrase and is in this package, but never goes into git. Agent B builds without it; that is fine, the build just skips the admin menu.
- The source `admin/admin.js` is in the repo in clear text. That is acceptable for a private repo. The built test page contains it only encrypted, portal builds not at all.
