# Playbook: Discover a Client (get the full picture)

1. Client context -> read context.md, decisions.md and inventory.md: what's
   already known; list the gaps per lens (base/lenses.md).
2. Plan the logins before touching anything: list every CLI, profile, tenant
   and tool the areas need; count the approvals I'll get ("~N sign-ins") and
   do them in one batch. Suggest one shared SSO session where the tools allow
   it (e.g. one AWS SSO session reused by all profiles; one az login per
   tenant; one gcloud login). Read-only access only.
3. Their docs first, per area: wikis, ADRs, roadmaps, runbooks, repo READMEs,
   open and recent tickets. Record what they say as "documented (source)".
4. Then verify live, read-only: compare live state with the documented one.
   A difference is a question, not a conclusion: check for a plan, ADR or
   in-flight migration that explains it before reporting it.
5. Change approval: none for read-only discovery. Anything that needs changing
   goes through the client's process (context.md) as its own task; link the
   ticket.
6. Per area record: documented · live · gap · confidence (FACT/ASSUMPTION).
7. Verify: every finding cites a doc and a live check, or is marked
   ASSUMPTION; nothing is reported as fact from live data alone when their
   docs weren't read.
8. Save: summary to context.md (within its ~120-line limit), resources to inventory.md, their
   accepted decisions to decisions.md, the full write-up to
   research/discovery-<date>.md.
9. GATE — document: architecture-doc ("as-is") from the write-up; link the
   ticket if there is one.
10. Graduation check: a discovery checklist that worked well for this client
    -> propose adding to context.md (or the rulebook via feedback.md).

Breadth first. Discovery is done when there's enough to start real work:
environment boundaries, main architecture, owners, delivery paths (how
changes ship) and a broad inventory. Don't chase full topology; learn the
detail during real tasks. An anomaly that doesn't block discovery gets
recorded (type, scope, evidence, unknowns, next diagnostic step) in NOW.md
Backlog and parked, unless I ask to fix it.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
access breadth, secret exposure.
