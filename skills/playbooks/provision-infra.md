# Playbook: Provision Infrastructure

1. Client context -> context.md (IaC tool, regions, tagging, gates).
2. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
3. IaC only — no click-ops. Terraform/Bicep per context.md.
4. Pre-apply: IaC security scan vs CIS (base gate); plan reviewed.
5. Tagging + naming per base + context.md (mandated tags enforced).
6. State managed remotely + locked (per client backend).
7. Secrets/identity per secrets-and-keyvault.md; least-privilege roles.
8. Apply via pipeline, not local — gated, logged, reviewed.
9. Verify: resources match plan; no drift.
10. GATE — document: change-record + config-reference for notable config;
    link the ticket.
11. Graduation check: reusable module/pattern -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
network exposure, access breadth, data loss (destroy/replace of stateful
resources in the plan).
