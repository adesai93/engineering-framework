# Playbook: Fix a Service

1. Identify client -> load clients/<name>/ overlay.
2. Triage: reproduce; check monitoring (client's tool); scope impact.
3. Diagnose: follow decision tree; log findings.
4. Fix: apply per base + client gates. Secrets via secrets-and-keyvault.md.
5. Verify: confirm resolution + no regression (actual check, not assertion).
6. GATE — document: auto-draft a change-record (incl. root cause). Approve to finish.
7. Graduation check: reusable for this client? -> propose promoting to the overlay.

STOP-and-confirm: network paths, new secret exposure, weakening a gate.
