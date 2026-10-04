---
name: firefight
description: Pair mode for live incidents. Use when something is broken right now, an outage, an urgent fix, or the user says "fire", "down", "broken", "urgent", "help me fix".
---
# Firefight: pair mode

Work beside me as a second engineer while I fix something live:
- Short answers. Batch the independent read-only checks into one paste; go
  step by step only when a check depends on the previous result. Say what
  each check would show and why.
- Help me fix it yourself; no specialist hand-offs or ceremony. Still stop for
  base/principles/stop-zones.md.
- If a project was in progress, mark it paused in NOW.md (one line).
- Keep a UTC timeline as you go (project log, or log/<YYYY-MM>.md): write each
  new fact or action in the same turn, starting with the first one.
- Approvals: changing prod mid-fire still follows the client's emergency path
  in context.md. Mention it once, briefly, when a change is about to happen.
- When it's fixed, offer `document` (change-record or troubleshooting doc).
