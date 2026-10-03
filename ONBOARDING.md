# Onboarding a client workspace

Instructions for the LEAD agent, run once per client when I say "onboard me".
Goal: a workspace the team can work from on day one. Takes about 20 minutes.
This is the one time you ask me questions up front: batch them, don't drip.

## 1. Check the setup (no questions yet)
- You are in a client workspace: .engineering-framework.json, context.md,
  rules.md, NOW.md exist. If not, tell me to run
  `node <rulebook>/tools/workspace.mjs new <client> <path>` and stop.
- You can read the rulebook (base/principles/stop-zones.md). If not, the tool
  isn't set up: Claude Code needs the rulebook in .claude/settings.json
  additionalDirectories; VS Code must be opened via <client>.code-workspace.
- Tell me which agents you can see (architect, engineer, security, retro). In
  Copilot, ask me to confirm they appear in the agent menu.

## 2. Interview me (one message, numbered, skip what context.md already has)
1. Clouds, tenants/accounts, and which owns what.
2. IaC + state; source control + CI/CD; artifact store; monitoring/SIEM.
3. Governed solutions I must use (pipeline templates, module registries,
   golden paths).
4. Scanners + what they block (code, IaC, container, secret, dependency).
5. Environments + regions; network shape (hub-spoke, vWAN, on-prem links).
6. Naming + tagging rules; PR rules.
7. Change process (ticket system, approvals, windows, emergency path), or none.
8. What you may run from this machine (az / aws / gcloud / kubectl / gh
   logins; read-only or write) vs. what I run and paste.
9. People I work with (name, role, what for).
10. Where docs go.
11. What I'm working on right now (projects, open issues, things waiting).
"Don't know yet" is a fine answer: record it as a gap, don't block on it.

## 3. Write it down
- context.md: answers 1-10, one page, dated. Gaps listed as "(unknown)".
- NOW.md: one line per item from answer 11. Create projects/<name>/ for
  anything multi-session (brief.md + next.md from what I told you).
- rules.md: anything I said as a must ("always", "never").

## 4. Verify access and seed the inventory
- If I allowed it in answer 8, run read-only checks only (e.g. `az account
  list`, `az group list`, `kubectl config get-contexts`, `gh auth status`).
  Otherwise give me one batch of read-only commands to run and paste back.
- Save the durable facts to inventory.md (subscriptions, key resource groups,
  networks, workspaces, repos). No secrets.

## 5. Smoke test (show me each result in one line)
- `status` -> summarizes NOW.md.
- `resume <one project>` -> 3-line recap.
- Ask the security agent for a one-line hello (proves delegation works). In
  Copilot, ask me to switch to the security agent and back.
- `park` -> next.md and NOW.md updated.

## 6. Hand over
Finish with: what's set up, the gaps still "(unknown)" in context.md, and a
reminder of the two habits: start each chat by saying what I'm working on;
when you get something wrong, I say so and you save it. Log anything that was
awkward during onboarding in feedback.md.
