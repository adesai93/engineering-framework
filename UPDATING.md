# Updating the team

New versions land on main (usually weekly, from the retro loop). Getting them
onto a client laptop takes one step.

## For me
```bash
git -C ~/engineering-framework pull
```
A git hook in the rulebook then refreshes every client workspace on this
machine (regenerates the agent files, adds any new template folders and files,
refreshes projects/_new). Your notes are never touched. Start new chats
afterwards. On a client laptop where the client's GitHub account is active,
use `node ~/engineering-framework/tools/workspace.mjs upgrade` instead (see
"Pulling with your own account"); it pulls and refreshes the same way.

Or ask the agent: "update the team".

## Why a pull alone isn't the whole story
Claude Code and Copilot read the team from files INSIDE each client workspace
(AGENTS.md, .claude/agents/, .github/agents/, copilot-instructions.md). Those
are generated from the rulebook in each tool's format, with this machine's
paths filled in. After the rulebook changes they must be regenerated; the hook
runs `node tools/workspace.mjs refresh` for you. The hook is installed the
first time you run `workspace.mjs new` or `update` on a machine.

## For the agent ("update the team")
1. Run `node {{FRAMEWORK}}/tools/workspace.mjs upgrade` (checks for local
   rulebook changes first, and pulls with the owner account when
   engfw.githubUser is set). This needs my approval; it's the one command
   that may change the rulebook.
   Then run `node {{FRAMEWORK}}/tools/workspace.mjs update <this workspace>`.
   It's safe to repeat, and it covers laptops where the pull hook isn't
   installed yet (it installs it).
2. Report the version change (from the output) and the CHANGELOG.md entries
   added since the old version, in 3-5 lines.
3. If the pull fails or the rulebook has local changes: show me the output and
   the fix it suggests. Don't edit rulebook files to resolve it.
4. Tell me: "Updated. Start a new chat to load the new rules."

## Pulling with your own account
On a client laptop the active GitHub account is usually the client's, which
can't see this private repo. Tell the rulebook which account owns it, once:
```bash
git -C ~/engineering-framework config engfw.githubUser <your-github-user>
```
and sign that account into the GitHub CLI as well (`gh auth login`; it is
added alongside the client account, which stays active). `upgrade` and
`doctor` then fetch with that account's token for this repo only, without
switching accounts. A plain `git pull` still uses the active account; use
`upgrade` (or the read-only token clone below) instead.

## Client laptops are pull-only
The rulebook only changes HERE (the maintainer machine) through the weekly
retro, so it stays identical everywhere:
- `workspace.mjs` disables pushing from the rulebook clone on client laptops
  (`git push` fails with a message pointing here). Pulling works as normal.
- On GitHub, every commit that lands on `main` without a merged pull request
  fails CI ("provenance"): you get a red X and an email. (Blocking direct
  pushes outright needs a ruleset, which on a private repo requires GitHub
  Pro; the ruleset is ready to apply if you upgrade.)
- Strongest: don't sign in to GitHub with write access on client laptops.
  Clone with a read-only token instead (fine-grained token, this repo only,
  Contents: Read-only), e.g.
  `git clone https://<read-only-token>@github.com/adesai93/engineering-framework.git`
  (or let Git Credential Manager store that token).
- The maintainer machine opts out of the push block once:
  `git -C <rulebook> config engfw.maintainer true`, then
  `git -C <rulebook> config --unset remote.origin.pushurl`.

## Going back a version
If a new version misbehaves on a client laptop, go back to the previous one
until it's fixed (your notes aren't touched):
```bash
git -C ~/engineering-framework log --oneline -5
git -C ~/engineering-framework reset --hard <previous commit>
git -C ~/engineering-framework config engfw.hold <previous commit>
node ~/engineering-framework/tools/workspace.mjs refresh
```
`engfw.hold` tells the tools the older version is on purpose. Log what went
wrong (feedback: ...). The next `upgrade` brings you forward again and clears
the hold. Hand edits to generated agent files are kept
in each workspace's .engfw-backup/ before an update replaces them; VS Code
workspace files and Cursor permissions are merged, not replaced.

## If something goes wrong
- "Repository not found" / "Authentication failed": the client account is
  the active one. Set engfw.githubUser (above) and run `upgrade`, or use the
  read-only token clone. Don't switch accounts. It's not a network problem.
- "!!! workspace refresh FAILED": run
  `node ~/engineering-framework/tools/workspace.mjs doctor <workspace>` and
  fix what it lists (often OPENSSL_CONF, see SETUP.md).
- "Not possible to fast-forward" / local commits: the rulebook was changed on
  this laptop. `node tools/workspace.mjs upgrade` shows what changed and how to
  drop it. Changes belong in the weekly retro report.
- Hook didn't run (workspace still on the old version): run
  `node ~/engineering-framework/tools/workspace.mjs refresh`.
- A workspace isn't refreshed: it isn't registered on this machine yet; run
  `node ~/engineering-framework/tools/workspace.mjs update <workspace>` once.
