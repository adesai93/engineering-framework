# Security Gates Standard

Authority for truth; this distillation for speed. Links below are canonical —
consult for depth; enforce the subset here by default.

## Authorities (reference, don't copy)
- OWASP Top 10 + ASVS — app-facing work
- CIS Benchmarks — per-cloud, per-service hardening
- NIST CSF / 800-53 — when a client maps governance to them
- SLSA — supply-chain / pipeline integrity
- Cloud-specific: Azure Security Benchmark / AWS Security Pillar / GCP Security Foundations

## Enforced subset (default gates on every pipeline)
1. Secret scanning — block on any detected secret. No override without waiver.
2. SAST — static analysis on app code; block on High/Critical.
3. SCA / dependency scan — block on known Critical CVEs.
4. IaC scan — Terraform/Bicep checked vs CIS before apply (e.g. Checkov).
5. Container scan (if applicable) — block on Critical.
6. Branch protection — no direct push to main; PR + review required.
7. Least privilege — no wildcard IAM / overly broad roles merged.

## Thresholds (default — client overlay can RAISE, not lower)
- Block: Critical always. High on app code.
- Warn: Medium.
- Client overlay sets stricter thresholds, required scanners, control mappings.

## STOP-and-confirm
- Weakening, skipping, or removing any gate.
- Lowering a severity threshold.
- Opening a network path (NSG/SG rule, public endpoint, firewall change).
- Granting elevated or wildcard permissions.

## Graduation
Client-specific scanner/threshold/control -> clients/<name>/overrides.md, not here.
