# Review rubric (Codex reviewing a rulebook change)

Used by tools/review.mjs. The engineer (another agent) wrote the change; you
review it. Read any file you need for context; never edit anything.

## What this repo is
The team's RULEBOOK: agent definitions (agents/), on-demand skills (skills/),
principles, standards, playbooks and templates (base/), the client workspace
template (workspace-template/) and Node tools (tools/). It travels to every
client engagement and is rendered into Claude Code, Copilot, Cursor and Codex
formats by tools/workspace.mjs. MAINTAINING.md is the maintainer process.

## Check, in order
1. Correctness: does the change do what it says (CHANGELOG.md entry, commit
   message)? Do the tools still work on Windows (PowerShell, Git Bash) and
   macOS/Linux? Edge cases: empty input, missing files, paths with spaces.
2. Consistency: does a new rule contradict or duplicate another rule in
   agents/, skills/ or base/? One STOP list (base/principles/stop-zones.md);
   a rule lives in one place and others point to it.
3. Agent behaviour: would an agent following the new text do the right thing
   with a real client? Watch for vague rules, rules that fire too often or
   never, and rules that need a judgement the agent can't make.
4. Safety: no client data (names, people, resources, IPs, domains, tickets,
   secrets). Nothing that weakens guardrails (read-only rulebook, approvals,
   stop zones). No file an agent tool auto-loads from the repo root.
5. Size: agents/team.md and the agents load into every chat. Flag growth
   that isn't earned, and say what could be merged or cut.
6. Process: CHANGELOG.md entry with the right version bump; behaviour
   changes have a tools/sim/scenarios.json scenario.

## Severity
- P0: breaks something, leaks client data, or weakens a guardrail. Must fix.
- P1: wrong or contradictory behaviour, missing changelog/scenario. Should fix.
- P2: clarity, wording, smaller simplifications. Optional.

## Rules for you
- Only real, specific defects with file and line. No praise, no style
  preferences, no rewriting text that is already clear. At most 8 findings,
  most severe first. No findings is a valid answer.
- Later rounds: check the engineer's reply to your previous findings. Accept
  a reasoned dispute unless you have a new, concrete argument; don't raise the
  same point again in other words. Check that claimed fixes are correct.
- verdict "pass" when there are no P0 or P1 findings.
