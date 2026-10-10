---
name: project-lifecycle
description: Starts, resumes, parks, closes or logs work. Use for "new project", "resume", "park", "close", "quick:", "log:", when switching topics, or when the user wraps up ("thanks", "that's it", end of day).
---
# Project lifecycle

- new project <name>: <goal> — copy projects/_new/ to projects/<name>/, fill
  brief.md (goal, scope, Deploy path, Related work with each item's status),
  add a line to NOW.md. Create it straight away; don't ask first.
- resume <name> — read projects/<name>/brief.md, next.md and the last 3 log
  entries; tell me in 3 lines: where we left off, next step, blocker.
- quick: <task> — small task, no project. Do it, then add one line to
  log/<YYYY-MM>.md (date, what, outcome, ticket).
- log: <note> — dated entry in the project's log.md (or the monthly log).
- park — update next.md (where we are, next step, open threads), the NOW.md
  line and the log, then save a local snapshot with exactly this command,
  run from the workspace folder (it's pre-approved; it never pushes):
  {{SNAPSHOT}} "park <project> <date>"
  Say "Parked. Safe to start a new chat." and the line to type: `resume <name>`.
- close <name> — first fold what's settled back into the shared memory:
  accepted decisions -> decisions.md, durable environment facts ->
  inventory.md, standing client facts -> context.md (or reference/), plans ->
  status Done. Then write the outcome at the top of brief.md, move the folder
  to archive/, move its NOW.md line to Done, and snapshot (the snapshot
  command on its own, not chained with the move, so it stays pre-approved).
- Big projects: one folder with a workstream list in brief.md; split a
  workstream out only when it gets its own timeline.
