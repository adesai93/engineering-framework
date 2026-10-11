# Playbook: Fix a Service

1. Client context -> read context.md.
2. Triage: reproduce; check monitoring (client's tool); scope impact.
3. Diagnose: what changed recently (deploys, config, certs/secrets, IAM)? Then
   dependencies, network (troubleshoot-connectivity.md), auth, resources. Confirm
   the cause with an actual check before fixing; log findings as FACT/ASSUMPTION.
4. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
5. Fix: smallest change that resolves it, per base + client gates. Secrets via
   secrets-and-keyvault.md.
6. Verify: confirm resolution + no regression (actual check, not assertion).
7. GATE — document: change-record — what was wrong, what changed, why it fixed
   it; link the ticket. Approve to finish.
8. Graduation check: reusable for this client? -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
network exposure, secret exposure, access breadth, data loss.
