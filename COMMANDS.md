# Commands

## Setup (terminal)
| Do | Command |
|---|---|
| Get the rulebook | `git clone https://github.com/adesai93/engineering-framework.git ~/engineering-framework` |
| New client workspace | `node tools/workspace.mjs new client-a ~/work/client-a --tools copilot` |
| Pick tools | `--tools claude`, `copilot`, `cursor`, `codex`, or a comma list (default `claude,copilot`) |
| Pick toolchain skills | `--toolchains terraform,bicep-arm,powershell,azure-cli,aws-cli,kql,pipelines-yaml` (default: all) |
| Get the latest rulebook (weekly) | `git -C ~/engineering-framework pull`, or tell the agent "update the team" (UPDATING.md) |
| Update one workspace | `node tools/workspace.mjs update ~/work/client-a` |
| Check the rulebook | `node tools/check.mjs` |
| Back up a workspace (client-approved folder) | `node tools/workspace.mjs backup ~/work/client-a --to <folder>` |
| Health check | `node tools/workspace.mjs doctor ~/work/client-a` |
| Clone a client code repo | `git clone <url> ~/work/client-a/repos/<name>` |
| Already have the clones elsewhere | add `--repos <folder>` to `new` or `update` |

Pick one tool per client where you can: VS Code also reads Claude-format
agents, so with both installed the specialists may show twice in Copilot.

## Open a workspace
- Claude Code: `cd ~/work/client-b` then `claude`
- VS Code + Copilot: open `~/work/client-a/client-a.code-workspace`
  (it includes the rulebook folder so Copilot can read it)
- Cursor: open the same `client-a.code-workspace` in Cursor (File > Open
  Workspace from File). Team rules come from AGENTS.md; specialists from
  .cursor/agents/.

Tool-specific setup, checks and fixes (Claude Code, Copilot, Cursor): SETUP.md.
Say "check setup" and the agent walks through it with you.

## First chat in a new workspace
Say **"onboard me"**. The lead asks one batch of questions, then writes
context.md, NOW.md and rules.md: two replies. Later, optionally: "verify
access" (seeds the inventory) and "test the team". See ONBOARDING.md.

If Copilot seems stuck, look for a Continue / Allow button in the chat: it
pauses for approval on commands and file edits.

## In chat: just talk
You don't need to memorize anything. Say what you're doing in plain words; the
lead does the bookkeeping and confirms in one line. Say "undo" to reverse it,
or "help" to see the shortcuts.

| You say something like | It does |
|---|---|
| "Where was I with the runners project?" | Resumes it: recap, next step, blocker |
| "New thing: build a VPN automation pipeline" | Creates a project (multi-session work) |
| "No, we always use PowerShell here" | Fixes it and saves a standing rule |
| "Let's go with option B" | Records the decision (and in decisions.md); marks what it replaces |
| "Switching to the syslog issue" | Saves where you were, then switches |
| "Syslog is down, help" | Pair mode: one step at a time, quiet timeline |
| "Fixed, thanks" | Offers to document; saves your place |
| "What is Virtual Network Manager?" | Just answers; writes nothing unless you say "save it" |
| "Update the DNS runbook from last month" | Finds it (even archived) and edits it in place |

### Shortcuts (optional)
`status` · `resume <project>` · `park` · `new project <name>: <goal>` ·
`quick: <task>` · `log: <note>` · `close <project>` · `remember: <fact>` ·
`correct: <wrong> -> <right>` · `decide: <decision>` · `document` ·
`research: <topic>` · `design: <problem>` · `build:` / `fix:` / `deploy:` ·
`review` · `feedback: <note>` · `retro` (weekly report) · `tidy` (compact
memory files) · `help`

Claude Code and Cursor: the lead calls the specialists itself. Copilot: pick
architect, engineer or security from the agent menu; handoff buttons pass
work along.

## First test (about 15 minutes)
1. Create a throwaway workspace: `node tools/workspace.mjs new sandbox ~/work/sandbox`
2. Fill a few lines of `context.md` (any real stack you know).
3. `status` -> expect an empty summary.
4. `new project test-dns: move internal DNS to a private resolver`
5. `log: three forwarders still point at the old DCs`, then `park`.
   Check `projects/test-dns/next.md` and `NOW.md`.
6. New chat: `resume test-dns` -> expect the recap without re-explaining.
7. `correct: <something it got wrong> -> <right>`. New chat; ask a question
   that hits the rule -> expect it to follow rules.md unprompted.
8. `design: <small problem>` -> options; then `review` -> findings by severity.
9. Delete the sandbox folder when done.

## Two habits
- One chat per project or problem. Start it by saying what you're working on.
  When the context meter passes ~50%, or the lead suggests it: "park", new
  chat, "resume <project>". Everything is in the files, so nothing is lost.
- When it gets something wrong, say so plainly. It saves the correction, so
  you only make it once.
