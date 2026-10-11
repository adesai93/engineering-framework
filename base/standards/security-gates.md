# Security Gates Standard

Authority for truth; this distillation for speed. Links below are canonical —
consult for depth.

## Who blocks
Each client's own scanners and pipelines (code, IaC, container, secret,
dependency) do the blocking, at the thresholds that client set. They are
recorded in context.md. This team never blocks me: the security agent finds
and reports; I decide whether to fix now or proceed.

## When a security review is needed (canonical list)
The ONLY list of review triggers; other files point here. Review:
- a design;
- a change touching identity/IAM, network exposure, secrets, data deletion,
  or prod infrastructure / pipelines;
- anything when I say "review".
Skip it for notes, docs, read-only work and small non-prod fixes, and say
"no security review needed (why)".

## Authorities (reference, don't copy)
- OWASP Top 10 + ASVS — app-facing work
- CIS Benchmarks — per-cloud, per-service hardening
- NIST CSF / 800-53 — when a client maps governance to them
- SLSA — supply-chain / pipeline integrity
- Cloud-specific: Azure Security Benchmark / AWS Security Pillar / GCP Security Foundations

## What the security agent checks
1. Secrets — none in code, config, pipeline YAML or logs.
2. App code — SAST-class issues (injection, auth, crypto misuse).
3. Dependencies — known CVEs.
4. IaC — CIS-style misconfigurations (Checkov-class findings).
5. Containers (if applicable) — vulnerable base images, root, exposed ports.
6. Branch protection — no direct push to main; PR + review required.
7. Least privilege — no wildcard IAM / overly broad roles; elevated access
   time-bound (PIM/JIT or an enforced end date).

## How findings are reported (never blocking)
- Critical / High: flagged at the top, each with the fix, so I can't miss it.
- Medium: listed. Low: one summary line.
- Say which client scanner will catch it in the pipeline (context.md), if any.

## STOP-and-confirm
All zones in base/principles/stop-zones.md. Most relevant here: gate weakening
(disabling, bypassing or lowering a client's scanner or threshold), network
exposure, access breadth.

## Graduation
Client-specific scanner/threshold/control -> the client's context.md, not here.
