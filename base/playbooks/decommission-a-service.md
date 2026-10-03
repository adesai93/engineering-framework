# Playbook: Decommission a Service

1. Client context -> context.md (IaC tool, any data retention rules, doc destination).
2. Inventory (read-only): IaC state + cloud inventory (Azure Resource Graph / AWS
   Resource Explorer / GCP Cloud Asset Inventory) + tags — incl. identities' grants
   on other scopes, DNS, certs, secrets, backups, non-IaC items.
3. Consumers (read-only): who still calls it — traffic/access logs over a full
   business cycle (incl. batch and month-end jobs). Live caller -> migrate or
   agree a cutoff with its owner first; record it.
4. Data obligations: retention, legal hold, export per context.md — before
   touching any data. Not in context.md -> confirm with the client (data loss).
5. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
6. Stop traffic, then disable (reversible): remove DNS/routes/LB rules/public
   endpoints; stop compute, schedules, jobs; mute alerts. Observation window
   (client's, else ASSUMPTION; > old DNS TTL); callers break -> restore, step 3.
7. Final backup/export where retention requires it, stored outside anything
   step 8 destroys; confirm it restores / is readable; record location +
   retention end.
8. Destroy via IaC/pipeline, not click-ops. Plan shows only step 2 items, none
   that step 4 retains. Stateful resources last, after step 7 is verified (data
   loss). Purge/force-delete of vaults/secrets = data loss; keys encrypting
   retained data stay until retention ends.
9. Revoke leftovers (identities, grants, secrets, certs, OIDC/deploy creds);
   rotate shared secrets per secrets-and-keyvault.md; remove its monitoring +
   pipeline.
10. Verify: re-run the step 2 inventory -> only retained data/backups remain,
    still readable; no DNS/CDN/gateway entry points at a released name
    (takeover); billing shows no charges for removed resources (recheck next cycle).
11. GATE — document: change-record (inventory, consumers, teardown, retention
    evidence); mark the service-doc retired and archive it per the client's doc
    destination; link the change ticket.
12. Graduation check: reusable decommission pattern or inventory query for this
    client? -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
data loss, irreversible.
