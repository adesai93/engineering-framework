# Playbook: Provision Infrastructure

1. Client context -> overlay (IaC tool, regions, tagging, gates).
2. IaC only — no click-ops. Terraform/Bicep per approved-tools.
3. Pre-apply: IaC security scan vs CIS (base gate); plan reviewed.
4. Tagging + naming per base + client overlay (mandated tags enforced).
5. State managed remotely + locked (per client backend).
6. Secrets/identity per secrets-and-keyvault.md; least-privilege roles.
7. Apply via pipeline, not local — gated, logged, reviewed.
8. Verify: resources match plan; no drift.
9. GATE — document: change-record + config-reference for notable config.
10. Graduation check: reusable module/pattern -> propose to overlay.

STOP-and-confirm: network exposure, IAM breadth, destroy/replace of stateful resources.
