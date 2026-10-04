---
name: toolchain-azure-cli
description: Azure CLI (az) commands for inspecting and changing Azure - resources, networking, RBAC, Resource Graph. Use when running or giving az commands.
toolchain: azure-cli
---
# Toolchain: Azure CLI

First: `az account show -o table` (right tenant and subscription?). Switch
with `az account set -s <sub>` only when I name it.

Read-only by default:
- `show` / `list` verbs with `--query` (JMESPath) and `-o table` or `-o tsv`
  to keep output short; `az graph query -q "<KQL>"` (Resource Graph) for
  inventory across subscriptions.
- Network checks: `az network watcher test-connectivity`,
  `az network nic show-effective-route-table`,
  `az network nic list-effective-nsg`.
- Save durable results to inventory.md (names, IDs, CIDRs), never keys.

Changes (create, update, delete, role assignment create) go through the
client's IaC or change path; deletes and RBAC widening are STOP zones. Never
echo connection strings or the output of `az storage account keys list`.

Official sources: learn.microsoft.com/cli/azure (and `az <group> --help`).
