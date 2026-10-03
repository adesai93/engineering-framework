# Updating the team

New versions land on main (usually weekly, from the retro loop). Getting them
onto a client laptop takes one step.

## For me
```bash
git -C ~/engineering-framework pull
```
That's it. A git hook in the rulebook then refreshes every client workspace
on this machine (regenerates the agent files, adds any new template files).
Your notes are never touched. Start new chats afterwards.

Or ask the agent: "update the team".

## Why a pull alone isn't the whole story
Claude Code and Copilot read the team from files INSIDE each client workspace
(AGENTS.md, .claude/agents/, .github/agents/, copilot-instructions.md). Those
are generated from the rulebook in each tool's format, with this machine's
paths filled in. After the rulebook changes they must be regenerated; the hook
runs `node tools/workspace.mjs refresh` for you. The hook is installed the
first time you run `workspace.mjs new` or `update` on a machine.

## For the agent ("update the team")
1. Run `git -C {{FRAMEWORK}} pull` (or `node {{FRAMEWORK}}/tools/workspace.mjs
   upgrade`, which checks for local rulebook changes first). This needs my
   approval; it's the one command that may change the rulebook.
2. Report the version change (from the output) and the CHANGELOG.md entries
   added since the old version, in 3-5 lines.
3. If the pull fails or the rulebook has local changes: show me the output and
   the fix it suggests. Don't edit rulebook files to resolve it.
4. Tell me: "Updated. Start a new chat to load the new rules."

## If something goes wrong
- "Not possible to fast-forward" / local commits: the rulebook was changed on
  this laptop. `node tools/workspace.mjs upgrade` shows what changed and how to
  drop it. Changes belong in the weekly retro report.
- Hook didn't run (workspace still on the old version): run
  `node ~/engineering-framework/tools/workspace.mjs refresh`.
- A workspace isn't refreshed: it isn't registered on this machine yet; run
  `node ~/engineering-framework/tools/workspace.mjs update <workspace>` once.
