# Handovers

The two agents communicate only through these files. One file per finished work session, never edited afterwards. To answer, write the next file.

## File name

`NNN-<from>-to-<to>.md`, numbered without gaps, for example `001-A-to-B.md`, `002-B-to-A.md`.
If you find two files with the same number (both agents worked at once), keep both, rename yours to the next free number and say so at the top.

## Format

```
# Handover NNN: <from> to <to>
Date: YYYY-MM-DD
Status: done | in progress | blocked
Commit: <hash of the commit this handover describes>

## Done
- what changed, with files

## Tests
- which ran, result

## Open tasks for <to>
1. concrete task, with files and the result you expect

## Questions
- anything you need answered; write "none" if none

## Do not touch until next handover
- files you are still changing; write "none" if none
```

Keep it short. Facts, file names, numbers. No status prose.
