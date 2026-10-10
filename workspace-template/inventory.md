# Inventory

What we've learned about this client's environment, from command output,
env-map runs and chat. Not loaded every chat: agents search it. No secrets.
Update a line in place when something changes; remove what no longer exists.

One line per thing, always in this order (use "-" for unknown), so it can be
searched by environment, address, repo or owner:

`env · type · name · scope/ID · IP/CIDR/endpoint · owner · repo/IaC path · source · date`

<example>
- prd · vnet · vnet-spoke-orders-prd-eus2 · sub-prd-corp/rg-net-prd · 10.40.8.0/22 · network team · platform-iac/stacks/orders · az graph · 2026-10-10
- prd · private-endpoint · pe-sql-orders · sub-prd-corp/rg-orders-prd · 10.40.8.36 -> sql-orders-prd.database.windows.net · orders team · platform-iac/modules/sql · az graph · 2026-10-10
- all · repo · platform-iac · ADO platform · deploys network, monitoring, backup · platform team · - · README · 2026-10-10
</example>

Per-environment maps (network ranges, key endpoints, what runs there, linked
decisions) live in reference/env-<env>.md; the env-map skill builds them.

## Tenancy + subscriptions/accounts

## Network

## Compute + services

## Identity

## Logging + monitoring

## Repos + pipelines
