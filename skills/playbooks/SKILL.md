---
name: playbooks
description: Step-by-step procedures for platform engineering tasks - deploy, provision, build a platform, prove a design, fix a service, troubleshoot connectivity, change IAM, decommission, discover a client, offboard a client. Use before any build, fix, deploy, provisioning, network or IAM change, and for "discover:" or an engagement ending.
---
# Playbooks

Pick the one file that matches the task, read it whole, and follow its steps.
None fits -> say so, use judgment, and note it in the log.

| Task | Read |
|---|---|
| Ship a service or app change through its pipeline | [deploy-a-service.md](deploy-a-service.md) |
| Create or change cloud resources with IaC | [provision-infra.md](provision-infra.md) |
| Stand up a landing zone / shared platform | [build-a-platform.md](build-a-platform.md) |
| Spike or proof of concept for a design | [prove-a-design.md](prove-a-design.md) |
| Something is degraded or failing (not a live fire: firefight skill) | [fix-a-service.md](fix-a-service.md) |
| Can't reach / DNS / routing / firewall / private endpoint | [troubleshoot-connectivity.md](troubleshoot-connectivity.md) |
| Grant, change or remove access (RBAC, IAM, PIM, groups) | [change-iam-access.md](change-iam-access.md) |
| Retire a service and its resources | [decommission-a-service.md](decommission-a-service.md) |
| "discover:" - map a client's estate | [discover-a-client.md](discover-a-client.md) |
| The engagement is ending | [offboard-a-client.md](offboard-a-client.md) |

Every playbook ends with the same gates: verify with real checks, draft the
doc (change-record unless the playbook says otherwise), and stop only for
base/principles/stop-zones.md.
