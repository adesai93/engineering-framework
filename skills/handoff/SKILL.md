---
name: handoff
description: Hands over commands, scripts, queries or GUI steps that the user runs somewhere other than this agent's shell (jump host, VDI, air-gapped machine, Azure portal, Cloud Shell, a query editor). Use whenever the reply contains anything for the user to paste or click.
---
# Handoff (code and steps the user runs elsewhere)

Where things run is in context.md "Where commands run". Not there: ask once
and save it.

Before sending, the reply must pass all of these:
1. Every block starts with a label line naming where it goes and what it
   does, e.g. `# RUNS IN: jump host · Windows PowerShell 5.1 · read-only`, or
   "PASTE INTO: portal > Workbook > Advanced editor (JSON)". One destination
   per block. Never put GUI steps and shell commands in the same numbered
   list without labels, and never put a terminal command just before editor
   steps. A block that changes something also names its target in the label
   (`· TARGET: <subscription / account> (<env>)`) and selects it first
   (`Set-AzContext -Subscription …`, `az account set -s …`, `--profile …`), so it
   can't run against whatever happens to be active.
2. Complete content, every time: the whole script or query, never a local
   path, a "same as before", or a replacement tail. Remote machines can't see
   this workspace. Also save it to projects/<p>/scripts/<name>, or
   log/scripts/<name> with no project (overwrite; the log notes the version).
3. PowerShell scripts: never hand-write the paste block. Save the script
   (step 2), then print the block with this read-only packer and paste its
   output verbatim:
   `node {{FRAMEWORK}}/skills/handoff/pack.mjs projects/<p>/scripts/<name>.ps1 --where "<where> · <shell + version> · <read-only | changes X>" [--param Name=Value]... [--out <file>]`
   The block writes the file, checks its hash (same on PowerShell 5.1 and 7),
   runs it with the parameters, and checks the output file, so pasting can
   never run `param()` on its own.
4. Plain text only: no Base64, compression or encoded payloads. A small fix
   to a long script = save it, pack it again, send the new block.
5. Queries (KQL, SQL, Resource Graph): complete and standalone, with every
   `let` and the scope written in (which workspace or subscription), on every
   iteration.
6. Expected output goes after the block as plain text ("You should see:
   ..."), never inside a runnable block.
7. Output files: delete the old one first, then check the new one (exists,
   not empty, and the count, size or hash you expect), and fail with a clear
   message otherwise. Find input files by content or hash, not by assuming a
   name still holds the latest version.
8. Test before handing over: run the exact block here when the tools allow,
   including with empty, single and nested sample data (toolchain skill for
   the language). Say what you tested and what you couldn't.

If a handoff goes wrong because it went to the wrong place or was
misunderstood, don't send the same kind of step again: switch approach (e.g.
GUI-only: open the file, select all, copy) and say why.
