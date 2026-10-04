# Tool setup

How each supported tool loads the team, how to set it up on a client laptop,
how to check it works, and what usually goes wrong. Pick the tool the client
approves (context.md "AI tools approved here").

Common to every tool:
- Node 18+ and git on the laptop.
- One rulebook clone per laptop; one workspace per client, created with
  `node <rulebook>/tools/workspace.mjs new <client> <path> --tools <tool>`
  (add `--repos <folder>` if the client's repos are already cloned elsewhere;
  repeat it for several folders; never point it at a folder that also holds
  another client's code).
- Open the WORKSPACE (or its .code-workspace file), never a single repo or the
  rulebook on its own: that's how the agent finds the team and the memory.
- First chat: "onboard me". Updates: `git pull` in the rulebook (UPDATING.md).
- The rulebook clone on a client laptop is pull-only (UPDATING.md). Best:
  clone it with a read-only token, not your own GitHub login.

---

## Claude Code  (`--tools claude`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| CLAUDE.md -> AGENTS.md | team rules, loaded every chat |
| .claude/agents/*.md | architect, engineer, security (read-only tools), retro |
| .claude/settings.json | rulebook (+ repos) in additionalDirectories; deny Edit on the rulebook |

Set up:
1. Install Claude Code (https://code.claude.com/docs) and sign in.
2. `cd <workspace>` and run `claude`. Accept the folder-trust prompt: the
   additionalDirectories setting only applies after the folder is trusted.

Check it works:
- `/agents` lists architect, engineer, security, retro.
- `/memory` shows CLAUDE.md / AGENTS.md loaded.
- Say "status": it summarises NOW.md without asking where things are.

Gotchas:
- "Can't read <rulebook path>": the folder wasn't trusted, or the workspace was
  started from a different folder. Restart `claude` from the workspace root.
- Edits to the rulebook are blocked by design ("denied by your permission
  settings"). Rulebook changes go through the weekly retro.
- Organisation-managed settings can override project settings; if a deny or
  directory rule seems ignored, check with the client's admin.

---

## GitHub Copilot in VS Code  (`--tools copilot`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| .github/copilot-instructions.md | team rules, added to every chat request |
| .github/agents/*.agent.md | architect, engineer, security, retro, with handoff buttons |
| <client>.code-workspace | opens workspace + rulebook (read-only); turns on instruction files; turns off AGENTS.md (avoids loading the rules twice) |

Set up:
1. Recent VS Code with GitHub Copilot + Copilot Chat, signed in with the
   client's Copilot licence.
2. File > Open Workspace from File > `<client>.code-workspace`. Opening the
   folder instead loses the rulebook and the settings.
3. In the Chat view, use Agent mode (not Ask/Edit): only Agent mode can edit
   files and run commands.

Check it works:
- The Agent dropdown in the Chat view lists architect, engineer, security, retro.
- Say "status" with the default agent: it summarises NOW.md.
- In the explorer, rulebook files show a lock (read-only).

Gotchas:
- Agents missing from the dropdown: VS Code too old, or the client's Copilot
  policy disables custom agents / agent mode. Ask the client's GitHub admin.
- Instructions ignored: setting "Code Generation: Use Instruction Files"
  (github.copilot.chat.codeGeneration.useInstructionFiles) must be on; the
  workspace file sets it, but user or org settings can override.
- It "hangs": Copilot is waiting for you to click Continue / Allow on a
  command or file edit. Approve per command; avoid blanket auto-approve on
  client machines.
- Copilot doesn't call specialists for you: pick the agent from the
  dropdown, or use the handoff buttons at the end of a response.
- Pick a capable model in the model menu; small models skip the bookkeeping.

---

## Cursor  (`--tools cursor`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| AGENTS.md | team rules (Cursor reads it natively; shows as "AGENTS" under Rules) |
| .cursor/agents/*.md | architect, engineer, security (readonly), retro |
| .cursor/cli.json | denies writes to the rulebook (applies to the Cursor CLI) |
| <client>.code-workspace | opens workspace + rulebook (rulebook read-only) |

Set up:
1. Recent Cursor, signed in with the account the client approves.
2. File > Open Workspace from File > `<client>.code-workspace`.
3. Use Agent mode in the chat panel.

Check it works:
- Cursor Settings > Rules, Skills, Subagents: "AGENTS" under Rules; architect,
  engineer, retro, security under Subagents.
- Say "status": it summarises NOW.md.
- Rulebook files show a lock icon (read-only).

Gotchas:
- Specialists listed twice: the workspace also has .claude/agents (generated
  with --tools claude,cursor) and "Include third-party Plugins, Skills, and
  other configs" is on. Harmless (.cursor wins); use one tool per client or
  turn that toggle off.
- Check the model in the chat panel; the default may not be the one you want.
- .cursor/cli.json protects the rulebook for the Cursor CLI; in the editor
  the protection is the read-only folder plus the team rule, and `git pull`
  refuses if the rulebook was changed locally.

---

## Model choice and cost (all tools)
- Usage is billed per token at model rates. The most expensive models (e.g.
  Opus-class) use a plan's included usage several times faster than mid-tier
  ones (e.g. Sonnet-class).
- Daily driver: a mid-tier model. Switch to the top model for hard designs or
  stubborn debugging, then back.
- The biggest cost is a long chat: every message re-sends all of it. Park and
  start a new chat when the context meter passes ~50%.
- Specialist hand-offs are separate runs. The lead only delegates when a task
  needs it, and security reviews only risky changes, unless you say "review".
- Check your tool's usage dashboard by model to see where it went.

## Node or git won't start ("OpenSSL configuration error")
The machine has OPENSSL_CONF pointing at a missing or broken file (often set
by other software or IT). The pull hook and workspace.mjs already clear it for
their own runs. For commands you type:
- Git Bash: `env -u OPENSSL_CONF node ...`
- PowerShell: `$env:OPENSSL_CONF=$null; node ...` (this window only)
- Permanent: remove or correct OPENSSL_CONF in Windows "Edit environment
  variables for your account". If IT set it machine-wide, leave it and use
  the per-command form.

## Sign-ins: "Repository not found" / many browser logins
- "Repository not found" when pulling the rulebook = the wrong GitHub account
  is active (often the client work account). Switch accounts, or use the
  read-only token clone (UPDATING.md). It is not a network problem.
- Read-only discovery across many CLI profiles: ask the agent to plan the
  logins first (discover-a-client playbook step 2) so you approve them in one
  batch, and prefer one shared SSO session over a login per profile.

## For the agent ("check setup")
1. Run `node --version`. If it fails with an OpenSSL error, point me to "Node
   or git won't start" above and stop.
2. Run `node {{FRAMEWORK}}/tools/workspace.mjs doctor <this workspace>` and go
   through each FIX line with me. Identify the tool you're running in and
   read its section above.
3. Ask me to confirm the UI items for that tool (agent list, lock icon,
   Agent mode) in ONE message.
4. Report: OK / not OK per item, and the fix from "Gotchas" for each failure.
   Log anything that took more than one try in feedback.md.
