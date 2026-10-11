# Playbook: Build a Platform (greenfield, iterative)

1. Client context -> context.md (tenancy, clouds, IaC, CI/CD, constraints).
2. Requirements: who consumes it (teams, workloads, growth); non-functionals
   (security, resilience targets, scale, cost, compliance). Unknowns are
   listed as ASSUMPTION in brief.md, with the workstream list.
3. Architecture: architect drafts the architecture-doc + one ADR per key
   decision (landing zone model, topology, IaC module source, DNS, logging).
   I decide. Then security reviews the design before anything is built.
4. Plan increments: thin, deployable slices in dependency order (e.g. mgmt
   groups + policy -> hub network -> DNS/NTP -> logging -> first spoke), each
   with exit criteria. Record the plan in brief.md.
5. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
6. Build each increment per provision-infra.md: IaC module, pipeline, plan
   reviewed, apply via pipeline.
7. Verify: each increment against its exit criteria with real checks: plan /
   apply output, policy compliance, connectivity, failover where it applies.
8. Review each increment through every lens in base/lenses.md, plus a security
   review. I see the findings before the next increment and decide what to fix
   now; deferred findings become the next iteration's first tasks; log them.
9. Hardening round every 3-4 increments and before onboarding teams: re-review
   the whole platform against the architecture-doc (security, resilience,
   scale, cost, operations); update ADRs; fix before moving on.
10. GATE — document: keep the architecture-doc + ADRs current; change-record
    per increment; service-doc + KT for consuming teams; link the ticket.
11. Graduation check: reusable modules or patterns -> propose adding to
    context.md (or the rulebook, if not client-specific).

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
architecture design, network exposure, access breadth, gate weakening, data loss.
