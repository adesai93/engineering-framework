# Playbook: Deploy a Service

1. Client context -> load clients/<name>/ overlay (tools, regions, gates).
2. Pre-flight: confirm IaC matches approved-tools; target region allowed.
3. Secrets: wired via Key Vault/identity per secrets-and-keyvault.md — never inline.
4. Pipeline: all base security gates active + any client-raised thresholds.
5. Deploy via client's pipeline tool (ADO/GitHub per overlay).
6. Observability: wire monitoring to client's tool; alerts on.
7. Verify: health check, smoke test, rollback path confirmed (actual checks).
8. GATE — document: auto-draft change-record (+ service-doc if new service).
9. Graduation check: reusable deploy pattern for this client? -> propose to overlay.

STOP-and-confirm: opening network paths, new secret exposure, weakening a gate.
