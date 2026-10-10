---
name: toolchain-powershell
description: PowerShell and Azure PowerShell (Az modules) - scripts, automation, Windows admin. Use when writing or running *.ps1 / *.psm1 files, Az cmdlets, or Windows server commands.
toolchain: powershell
---
# Toolchain: PowerShell / Az PowerShell

Before anything: `Get-AzContext` (right tenant and subscription?) and
`$PSVersionTable.PSVersion`.

Verify:
1. `Invoke-ScriptAnalyzer -Path . -Recurse` (PSScriptAnalyzer) on scripts.
2. Run changing cmdlets with `-WhatIf` first where supported; read the output.
3. Read-only verbs (Get-, Test-, Resolve-) are fine to run where I allow;
   Set-, New-, Remove- follow the client's change path.
4. Before handing a script over, run it under `Set-StrictMode -Version
   Latest` with empty, single-item and nested sample data. Static checks
   don't catch the failures below.

StrictMode traps:
- Wrap anything that may return 0 or 1 items in `@(...)` before `.Count`,
  indexing or `.Property` enumeration over the collection.
- Boolean checks are explicit: `$null -ne (Get-Variable X -ErrorAction
  SilentlyContinue)`, never the object itself passed to a `[bool]` parameter.
- A `foreach (...) { }` statement can't be piped: assign it first
  (`$rows = foreach (...) { ... }`), then pipe `$rows`.
- Native command output is an array of lines: `$json = (& az ... ) -join
  "`n"` before `ConvertFrom-Json`.
- Optional properties: test `$obj.PSObject.Properties['name']` before reading
  them; only require the fields the API guarantees.
- Deltas (baseline vs candidate): key both sides by name in hashtables and
  handle added, removed and changed explicitly.
- Nested JSON documents (workbooks, ARM): walk the schema's real path (e.g.
  `item.content.items`), the same way the tool that owns the file does.
- Newlines: build them explicitly (`"`r`n"`, or `-split "`r?`n"` then
  `Set-Content`) when bytes or hashes matter; here-strings take the line
  endings of wherever they were pasted.

Gotchas: `Set-StrictMode -Version Latest` and `$ErrorActionPreference =
'Stop'` in scripts; avoid `-Force` on removals (STOP: data loss); never put a
literal secret in `ConvertTo-SecureString -AsPlainText`; use managed identity
(`Connect-AzAccount -Identity`) in automation; Windows PowerShell 5.1 lacks
PowerShell 7 syntax such as `&&` and `?:`. Log Analytics query cmdlets take
the workspace ID (a GUID, `customerId`), not the ARM resource ID.

Official sources: learn.microsoft.com/powershell; learn.microsoft.com/powershell/azure.
Docs server if set up (SETUP.md): Microsoft Learn MCP. Search in generic
terms only: no client names, IPs or resource IDs.
