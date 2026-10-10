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

Gotchas: `Set-StrictMode -Version Latest` and `$ErrorActionPreference =
'Stop'` in scripts; avoid `-Force` on removals (STOP: data loss); never put a
literal secret in `ConvertTo-SecureString -AsPlainText`; use managed identity
(`Connect-AzAccount -Identity`) in automation; Windows PowerShell 5.1 lacks
PowerShell 7 syntax such as `&&` and `?:`.

Official sources: learn.microsoft.com/powershell; learn.microsoft.com/powershell/azure.
Docs server if set up (SETUP.md): Microsoft Learn MCP. Search in generic
terms only: no client names, IPs or resource IDs.
