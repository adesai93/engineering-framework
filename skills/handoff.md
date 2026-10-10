---
name: handoff
description: Hand over commands, scripts, queries or GUI steps that the user runs somewhere other than this agent's shell (jump host, VDI, air-gapped machine, Azure portal, Cloud Shell, a query editor). Use whenever the reply contains anything for the user to paste or click.
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
   steps.
2. Complete content, every time: the whole script or query, never a local
   path, a "same as before", or a replacement tail. Remote machines can't see
   this workspace. Also save it to projects/<p>/scripts/<name> (overwrite;
   the log notes the version).
3. Scripts with `param()` (or several files): ONE block that writes the file,
   checks it, then runs it, so pasting can't run `param()` on its own:
   ```powershell
   # RUNS IN: <where> · <shell + version> · <read-only | changes X>
   $dir = Join-Path $env:TEMP 'handoff'; New-Item -ItemType Directory -Force $dir | Out-Null
   $ps1 = Join-Path $dir 'Get-Thing.ps1'; $out = Join-Path $dir 'thing.json'
   $src = @'
   param([Parameter(Mandatory)][string]$WorkspaceId, [string]$OutFile)
   ...
   '@
   [IO.File]::WriteAllText($ps1, (($src -split "`r?`n") -join "`r`n"), [Text.UTF8Encoding]::new($true))
   if ((Get-FileHash $ps1).Hash -ne '<sha256>') { throw 'Script altered in transfer: copy the block again' }
   Remove-Item $out -ErrorAction SilentlyContinue
   & $ps1 -WorkspaceId '<value>' -OutFile $out
   if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) { throw 'No output written' }
   ```
   `'@` stays at column 0. Write the file exactly this way (never
   Set-Content / Out-File): their encoding differs between PowerShell 5.1 and
   7, so the hash would too. The hash is the one you got by running this exact
   block yourself; if you couldn't run it, leave the hash line out and say so.
4. Plain text only: no Base64, compression or encoded payloads. A small fix
   to a long script = the full script again, or one exact block to find and
   replace, with the hash before and after.
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
