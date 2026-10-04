---
name: tidy
description: Compact the workspace memory files. Use when the user says "tidy", "clean up", or a file is over its limit (context.md ~120 lines, NOW.md ~100, rules.md ~80, a project log over ~300).
---
# Tidy

1. Snapshot first, from the workspace folder (pre-approved, local only):
   {{SNAPSHOT}} "before tidy <date>"
2. rules.md: merge rules that say the same thing; move superseded ones to
   history/rules.md.
3. NOW.md: finished items to Done; Done older than 30 days out (history/done.md).
4. context.md over its limit: keep what most tasks need (clouds, tools,
   governed solutions, scanners, change process, doc destination, key people).
   Move detail (per-environment specifics, full people list, long tool notes)
   to inventory.md or reference/<topic>.md and leave a one-line pointer, e.g.
   "Full people list: reference/people.md".
5. A project log.md over ~300 lines: move all but the latest 20 entries to
   log-<YYYY>.md in the same folder; next.md must still say where things stand.
6. decisions.md: current decisions only; superseded lines to
   history/decisions.md.
7. inventory.md: update in place; remove things that no longer exist.
8. Delete nothing. Snapshot again ({{SNAPSHOT}} "tidy <date>"), report what
   moved, and say: "undo tidy" = `git revert` that commit.
