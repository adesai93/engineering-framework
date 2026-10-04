---
name: toolchain-bicep-arm
description: Azure Bicep and ARM JSON templates - authoring, linting, what-if, deployments. Use when editing *.bicep, *.bicepparam or ARM *.json templates, or deploying them.
toolchain: bicep-arm
---
# Toolchain: Bicep / ARM

Verify (read-only first):
1. `az bicep build --file main.bicep` (compiles, shows linter warnings). ARM
   JSON: `az deployment group validate --resource-group <rg> --template-file
   azuredeploy.json --parameters @<params>.json`.
2. What-if before any deployment, at the right scope:
   `az deployment group what-if -g <rg> -f main.bicep -p <params>`
   (or `sub` / `mg` / `tenant` with `--location`). Read every Delete / Modify.
3. Complete mode, or a what-if showing Delete of a stateful resource = STOP
   (data loss). Default to Incremental mode.
4. Deploy through the client's pipeline; put the what-if output in the
   change-record.

Gotchas: use Azure Verified Modules / the client's registry first; `@secure()`
parameters and Key Vault references for secrets, never values in parameter
files; `existing` to reference resources; pin API versions.

Official sources: learn.microsoft.com/azure/azure-resource-manager/bicep;
Microsoft's Azure skills / Azure MCP Server if the client allows them.
