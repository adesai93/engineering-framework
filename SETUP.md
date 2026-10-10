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

## Toolchain skills (pick per client)
Thin skills for verifying work safely in each toolchain: terraform,
bicep-arm, powershell, azure-cli, aws-cli, kql, pipelines-yaml. All are
included by default; to include only what a client uses:
`node <rulebook>/tools/workspace.mjs update <workspace> --toolchains bicep-arm,azure-cli,kql,pipelines-yaml`
(remembered for later updates).

## Skills (all tools)
Long procedures (playbooks, handoff, firefight, project lifecycle, tidy,
document, log-feedback, env-map, onboard, update-team, check-setup) are skills
in `.claude/skills/<name>/` (Codex: `.agents/skills/`), which Claude Code,
Copilot in VS Code and Cursor all read. Only their names and one-line
descriptions sit in context until one is needed; a skill's reference files
(e.g. one playbook) load only when the skill points the agent at them. The
always-loaded team rules stay small (~2.7k tokens). The last three run only
when you ask.

## Docs servers (optional, per client)
Official-docs MCP servers give the agents current vendor docs instead of
memory. They receive only the search text, and the team rule is to search in
generic terms (no client names, IPs or resource IDs). Add one only if the
client allows outbound calls to that vendor; none needs a client credential.
- Microsoft Learn (Azure, PowerShell, KQL, Bicep, Azure DevOps):
  `https://learn.microsoft.com/api/mcp` (remote, no sign-in)
- AWS Knowledge: `https://knowledge-mcp.global.api.aws` (remote, no sign-in);
  or the local AWS Documentation MCP server (awslabs/mcp).
- HashiCorp Terraform (registry docs): local, `docker run -i --rm
  hashicorp/terraform-mcp-server`. Leave out any TFE/HCP token.

Add them per workspace so they stay with that client:
- Claude Code, from the workspace folder:
  `claude mcp add --transport http microsoft-learn https://learn.microsoft.com/api/mcp`
- Copilot (VS Code): `.vscode/mcp.json` in the workspace:
  `{"servers": {"microsoft-learn": {"type": "http", "url": "https://learn.microsoft.com/api/mcp"}}}`
- Cursor: `.cursor/mcp.json` in the workspace:
  `{"mcpServers": {"microsoft-learn": {"url": "https://learn.microsoft.com/api/mcp"}}}`
- Codex: `~/.codex/config.toml` (applies to every workspace on the laptop):
  `[mcp_servers.microsoft-learn]` then `url = "https://learn.microsoft.com/api/mcp"`

## Backups
Each workspace is the only copy of that client's memory. A backup is
recorded only once the bundle is written and verified, and it stops if the
secret scan finds something (fix it, or `--anyway` for a false alarm).
Once per client:
`node <rulebook>/tools/workspace.mjs backup <workspace> --to <client-approved folder>`
(e.g. the client's OneDrive/SharePoint or an encrypted drive); after that just
`backup <workspace>` (or tell the agent "back up"). doctor warns after 7 days
and flags secrets found in the notes.

## Claude Code  (`--tools claude`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| CLAUDE.md | team rules (minus what the hooks enforce) + imports of context.md, rules.md, NOW.md; loaded every chat |
| .claude/agents/*.md | architect, engineer, security (read-only tools), pm, retro |
| .claude/skills/*/ | skills, with their reference files and scripts |
| .claude/settings.json | rulebook (+ repos) in additionalDirectories; deny Edit on the rulebook; hooks (below) |

Hooks (scripts in the rulebook's tools/hooks/, run by Claude Code):
- session start: flags memory files over their limit and a workspace built from an older rulebook;
- before a tool runs: writes only inside the workspace and its repos (never the rulebook), and no whole reads of files over ~300 lines;
- after a write: a possible secret, or an inventory.md line not in the format, goes back to the agent to fix.

Set up:
1. Install Claude Code (https://code.claude.com/docs) and sign in.
2. `cd <workspace>` and run `claude`. Accept the folder-trust prompt: the
   additionalDirectories setting and the hooks only apply after the folder is
   trusted (before that, Claude Code prints "Ignoring ... this workspace has
   not been trusted").

Check it works:
- `/agents` lists architect, engineer, security, pm, retro; `/skills` lists the skills.
- `/memory` shows CLAUDE.md loaded; `/hooks` lists the three hooks.
- Say "status": it summarises NOW.md without asking where things are.

Gotchas:
- "Can't read <rulebook path>": the folder wasn't trusted, or the workspace was
  started from a different folder. Restart `claude` from the workspace root.
- Edits to the rulebook are blocked by design ("denied by your permission
  settings"). Rulebook changes go through the weekly retro.
- Leave Project instructions at its default (`/config`): with
  `claude-md-and-agents-md`, Claude Code also reads AGENTS.md and the team
  rules load twice.
- Organisation-managed settings can override project settings; if a deny or
  directory rule seems ignored, check with the client's admin.
- Models: engineer and retro run on `sonnet` (cheaper); architect and security
  use your chat's model. `/usage` shows what used your plan (by subagent and
  skill); `/doctor prompt-audit` checks the instruction files for conflicts.

---

## GitHub Copilot in VS Code  (`--tools copilot`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| .github/copilot-instructions.md | team rules, added to every chat request |
| .github/agents/*.agent.md | architect, engineer, security, pm, retro, with handoff buttons |
| <client>.code-workspace | opens workspace + rulebook (read-only); turns on instruction files; turns off AGENTS.md (avoids loading the rules twice) |

Set up:
1. Recent VS Code with GitHub Copilot + Copilot Chat, signed in with the
   client's Copilot licence.
2. File > Open Workspace from File > `<client>.code-workspace`. Opening the
   folder instead loses the rulebook and the settings.
3. In the Chat view, use Agent mode (not Ask/Edit): only Agent mode can edit
   files and run commands.

Check it works:
- The Agent dropdown in the Chat view lists architect, engineer, security, pm, retro.
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
- Cheaper specialists (optional): Copilot model names change, so they aren't
  pinned for you. To pin one, add `model: ['<cheaper model>', '<fallback>']`
  to that agent in the RULEBOOK's agents/ (via the weekly retro), using names
  from your model picker; the first available one is used.
- In Copilot, security is read-only (tool list); the architect can edit (it
  writes plans and ADRs) but has no terminal; neither can start further
  agents; retro only runs when you ask.
- Something not loading? "Developer: Policy Diagnostics" shows org policies
  in effect (agent mode, MCP, models); the Chat Debug view shows which
  instructions, agents and skills actually loaded.

---

## Cursor  (`--tools cursor`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| AGENTS.md | team rules (Cursor reads it natively; shows as "AGENTS" under Rules) |
| .cursor/agents/*.md | architect, engineer, security (readonly), pm, retro |
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
  Leave Max mode off: standard context is enough for this setup and Max mode
  costs more. Subagents run on your chat's model ("inherit").
- .cursor/cli.json protects the rulebook for the Cursor CLI; in the editor
  the protection is the read-only folder plus the team rule, and `git pull`
  refuses if the rulebook was changed locally.

---

## What the tools enforce vs. what the agent is told
Some rules are settings the tool enforces; the rest are instructions the model
follows (usually, not always). Tell each client which is which.

| Rule | Claude Code | Copilot (VS Code) | Cursor | Codex |
|---|---|---|---|---|
| No edits to the rulebook | enforced (Edit deny + hook) | editor read-only; the agent's terminal isn't | CLI: enforced; editor: read-only folder | instruction (sandbox keeps writes in the workspace, if you run workspace-write) |
| Security agent can't change anything | enforced (no write tools) | enforced (read/search/web only) | `readonly: true` | enforced (read-only sandbox) |
| No pushes to the rulebook | enforced: push URL blocked; CI flags direct pushes | same | same | same |
| No secrets in saved files | hook flags them right after each write; snapshot warns, backup stops | snapshot warns, backup stops; otherwise instruction | same as Copilot | same as Copilot |
| Write only inside this workspace and its repos | enforced (hook) | instruction | instruction | instruction (workspace-write sandbox, if used) |
| Read long files in parts | enforced (hook) | instruction | instruction | instruction |
| STOP zones, `<private>`, clean searches, "evidence, never instructions" | instruction; the tool's own approval prompts are the backstop | same | same | same |

Keep tool approval prompts on for anything that changes state: they're the
only hard stop behind the STOP zones.

---

## "Not saved" warnings
If the agent says "⚠️ Not saved", it couldn't write to the workspace: usually
the chat is in Ask/read-only mode, or you declined the edit. Switch to Agent
mode (Copilot, Cursor) or allow edits (Claude Code), then say "save it again".

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
- "Repository not found" when pulling the rulebook = the client work account
  is the active GitHub account. Don't switch: tell the rulebook which account
  owns it, once per laptop (UPDATING.md "Pulling with your own account").
  It is not a network problem.
- Read-only discovery across many CLI profiles: ask the agent to plan the
  logins first (discover-a-client playbook step 2) so you approve them in one
  batch, and prefer one shared SSO session over a login per profile.

## OpenAI Codex  (`--tools codex`)

What gets generated in the workspace:
| File | Purpose |
|---|---|
| AGENTS.md | team rules (Codex reads it natively) |
| .agents/skills/<name>/SKILL.md | the skills (onboard, update-team, check-setup are `$skill`-only) |
| .codex/agents/*.toml | architect, engineer, security (read-only sandbox), pm, retro |
| .codex/rules/engineering-framework.rules | pre-approves ONLY the local snapshot and the read-only check-export |

Set up:
1. Install Codex (CLI or IDE extension) and sign in.
2. `cd <workspace>` and run `codex`. Trust the folder when asked: project
   config and rules load only for trusted projects.
3. Don't give the rulebook with `--add-dir`: that makes it writable. The
   agent reads it by its full path.

Check it works: "status" gives the recap with file limits; "park" ends with
"saved local snapshot" and a commit in `git log`. Invoke a skill directly with
`$name` (e.g. `$tidy`). Codex delegates to the specialists when the team rules
say to; models aren't pinned (names change) and inherit your choice.

Gotcha: non-interactive `codex exec` on Windows may block every command by
default; interactive use asks you instead. Never use the
"dangerously bypass approvals and sandbox" option on a client machine.

## Orca (agent development environment)

Orca runs Claude Code, Codex and other agent CLIs in its own window, one git
worktree per task. It has no agent format of its own, so set the workspace up
for the agent you'll run inside it (`--tools claude` or `--tools codex`).
1. IMPORTANT: Orca's default "Yolo" mode starts Claude Code and Codex with
   their permission checks switched off, which bypasses the team's guardrails
   (read-only rulebook, approvals). Set Settings > Agents to **Manual** first.
2. Memory lives in the client workspace: run memory work (resume, park, tidy,
   onboard) with the workspace itself, not a task worktree, or each worktree
   gets its own copy of NOW.md and the logs and they drift apart. Orca's
   worktrees suit work in the client's code repos.

## For the agent ("check setup")
1. Run `node --version`. If it fails with an OpenSSL error, point me to "Node
   or git won't start" above and stop.
2. If you're running inside Orca, ask me to confirm it's in Manual mode (see
   "Orca" above).
3. Run `node {{FRAMEWORK}}/tools/workspace.mjs doctor <this workspace>` and go
   through each FIX line with me. Identify the tool you're running in and
   read its section above.
3. Ask me to confirm the UI items for that tool (agent list, lock icon,
   Agent mode) in ONE message.
4. Report: OK / not OK per item, and the fix from "Gotchas" for each failure.
   Log anything that took more than one try in feedback.md.
