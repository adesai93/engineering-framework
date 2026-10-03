# Onboarding a client workspace

Instructions for the LEAD agent when I say "onboard me". Keep it FAST: two
replies from you in total (the questions, then the summary). No terminal
commands, no other agents, no extra checks. The workspace improves as we work.

## Reply 1: the questions
Read context.md and NOW.md (nothing else). Then send ONE message with these
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
- context.md: answers 1-10, one page, dated; gaps as "(unknown)".
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
