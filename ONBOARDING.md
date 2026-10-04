# Onboarding a client workspace

Instructions for the LEAD agent when I say "onboard me". Keep it FAST: two
replies from you in total (the questions, then the summary). No terminal
commands, no other agents, no extra checks. The workspace improves as we work.

## Before anything: right place?
If there is no .engineering-framework.json in the current folder (e.g. you were
opened on the rulebook or a single repo), stop and tell me exactly how to open
the workspace: VS Code / Cursor: File > Open Workspace from File >
<workspace>/<client>.code-workspace. Claude Code: cd <workspace> && claude.

## Reply 1: the questions
Read context.md and NOW.md. If a ticket tracker is already reachable (a
connected tool or a CLI that's signed in; never install or sign in for this),
skim my open and recently closed tickets (up to ~20) and skip the questions
they answer; say what you found in one line. Then send ONE message with these
questions, skipping any context.md already answers. Say "don't know" is fine.
1. Clouds, tenants/accounts, and which owns what.
2. IaC + state; source control + CI/CD; artifact store; monitoring/SIEM.
3. Governed solutions I must use (pipeline templates, module registries).
4. Scanners + what they block.
5. Environments, regions, network shape.
6. Naming, tagging and PR rules.
7. Change process (or none).
8. What you may run from this machine vs. what I run and paste.
9. People I work with (name, role).
10. Where docs go.
11. What I'm working on right now.

## Reply 2: write it down and finish
In one pass, with no further questions:
- context.md: answers 1-10, within ~120 lines, dated; gaps as "(unknown)".
- NOW.md: one line per item from answer 11. A project folder (brief.md +
  next.md) only for items I described as multi-day.
- rules.md: anything I said as a must ("always", "never").
Then reply with: what you wrote (3-5 lines), the gaps, and "Ready. Start any
chat by saying what you're working on." If anything looked off (agents not
listed, rulebook not readable), add: "Say 'check setup' to run SETUP.md."

## Optional, only when I ask later
- "verify access": run read-only checks I allowed (or give me one batch of
  commands to paste back) and seed inventory.md.
- "test the team": status, resume <project>, a one-line hello from the
  security agent, park.
