# Playbook: Deploy a Service

1. Client context -> read context.md (tools, regions, gates).
2. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
3. Pre-flight: confirm IaC matches context.md; target region allowed.
4. Secrets: wired via Key Vault/identity per secrets-and-keyvault.md — never inline.
5. Pipeline: all base security gates active + any client-raised thresholds.
6. Deploy via client's pipeline tool (ADO/GitHub per context.md).
7. Observability: wire monitoring to client's tool; alerts on.
8. Verify: health check, smoke test, rollback path confirmed (actual checks).
9. GATE — document: auto-draft change-record (+ service-doc if new service);
   link the ticket.
10. Graduation check: reusable deploy pattern for this client? -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
network exposure, secret exposure, gate weakening.
